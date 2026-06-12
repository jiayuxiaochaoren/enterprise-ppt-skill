const fs = require('fs');
const path = require('path');
const {
  BRAND_VISUAL_COMPONENTS,
  captionRefs,
  consumedComponent,
  consumedIdsForSlide,
  directImageRefs,
  expectedComponentsForSlide,
  hasProductMatrixData,
  meaningfulDrawnCount,
  plannedIdsForSlide,
  renderedSlideFor
} = require('./brand-visual-richness-primitives');

function readJsonIfExists(file) {
  if (!file) return null;
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return { __readError: err.message || String(err), __file: file };
  }
}

function slideSignature(slide = {}) {
  const ids = plannedIdsForSlide(slide)
    .filter(id => BRAND_VISUAL_COMPONENTS.includes(id))
    .sort();
  return `${slide.type || ''}:${slide.layoutVariant || slide.variant || ''}:${ids.join(',')}`;
}

function repetitionFindings(slides = []) {
  const findings = [];
  let previous = '';
  let runStart = 0;
  let runLength = 0;
  slides.forEach((slide, index) => {
    const signature = slideSignature(slide);
    if (signature && signature === previous) {
      runLength += 1;
    } else {
      if (runLength >= 3) {
        findings.push({
          type: 'consecutivePageRepetition',
          level: 'review',
          slides: [runStart + 1, index],
          message: `same brand visual component signature repeats for ${runLength} consecutive slides`
        });
      }
      previous = signature;
      runStart = index;
      runLength = 1;
    }
  });
  if (runLength >= 3) {
    findings.push({
      type: 'consecutivePageRepetition',
      level: 'review',
      slides: [runStart + 1, slides.length],
      message: `same brand visual component signature repeats for ${runLength} consecutive slides`
    });
  }
  return findings;
}

function visualQaFindings(visualQa = null) {
  if (!visualQa) return [{
    type: 'visualQaMissing',
    level: 'review',
    message: 'visual QA result was not provided'
  }];
  if (visualQa.__readError) return [{
    type: 'visualQaReadError',
    level: 'review',
    message: visualQa.__readError
  }];
  const findings = Array.isArray(visualQa.findings) ? visualQa.findings : [];
  return findings
    .filter(finding => {
      const text = `${finding.type || ''} ${finding.message || ''}`;
      return finding.level === 'fail' && /blank|overlap|shrink|unreadable|out.of.bounds|overflow/i.test(text);
    })
    .map(finding => ({
      type: 'visualQaCriticalFinding',
      level: 'fail',
      message: finding.message || finding.type || 'visual QA critical finding'
    }));
}

function auditSlide(plan = {}, slide = {}, index = 0, renderMeta = null) {
  const findings = [];
  const slideNo = index + 1;
  const expected = expectedComponentsForSlide(plan, slide);
  const planned = plannedIdsForSlide(slide);
  const rendered = renderedSlideFor(renderMeta, slideNo);
  const consumed = consumedIdsForSlide(rendered);
  const imageRefs = directImageRefs(plan, slide);
  const captions = captionRefs(slide);

  expected.forEach(id => {
    if (!planned.includes(id)) {
      findings.push({
        type: 'expectedComponentMissing',
        level: 'fail',
        slide: slideNo,
        componentId: id,
        message: `expected brand visual component is missing from componentPlan: ${id}`
      });
    }
  });

  if (planned.includes('product-matrix') && !hasProductMatrixData(slide)) {
    findings.push({
      type: 'productMatrixWithoutProductData',
      level: 'fail',
      slide: slideNo,
      message: 'product-matrix planned without products, productStory, or product-showcase/product-evidence route'
    });
  }

  if (imageRefs.length && !planned.includes('proof-gallery') && !planned.includes('hero-image')) {
    findings.push({
      type: 'imageEvidenceNotBoundToComponent',
      level: 'fail',
      slide: slideNo,
      message: 'slide has image evidence but no proof-gallery or hero-image component plan'
    });
  }

  if (imageRefs.length && captions.length < Math.min(imageRefs.length, 2)) {
    findings.push({
      type: 'captionCoverageLow',
      level: 'review',
      slide: slideNo,
      message: `image evidence has ${imageRefs.length} image(s) but only ${captions.length} caption/proof text item(s)`
    });
  }

  if (renderMeta && renderMeta.__readError) {
    findings.push({
      type: 'renderMetaReadError',
      level: 'review',
      slide: slideNo,
      message: renderMeta.__readError
    });
  } else if (renderMeta && !rendered) {
    findings.push({
      type: 'renderMetaSlideMissing',
      level: 'review',
      slide: slideNo,
      message: 'render-meta was provided but this slide was not found'
    });
  } else if (rendered) {
    expected.filter(id => planned.includes(id)).forEach(id => {
      if (!consumed.includes(id)) {
        findings.push({
          type: 'componentNotConsumed',
          level: 'fail',
          slide: slideNo,
          componentId: id,
          message: `planned brand visual component was not consumed by renderer: ${id}`
        });
      }
    });
    if (imageRefs.length) {
      const hero = consumedComponent(rendered, 'hero-image');
      const gallery = consumedComponent(rendered, 'proof-gallery');
      const imageEvidenceCount = meaningfulDrawnCount(hero) + meaningfulDrawnCount(gallery);
      if (imageEvidenceCount <= 0) {
        findings.push({
          type: 'imageEvidenceRenderMetaMissing',
          level: 'review',
          slide: slideNo,
          message: 'render-meta does not expose drawn image/gallery evidence for image-backed slide'
        });
      }
    }
  } else {
    findings.push({
      type: 'renderMetaMissing',
      level: 'review',
      slide: slideNo,
      message: 'render-meta was not provided; component consumption cannot be verified'
    });
  }

  return {
    slide: slideNo,
    type: slide.type || '',
    layoutVariant: slide.layoutVariant || slide.variant || '',
    expectedComponents: expected,
    plannedComponents: planned,
    consumedComponents: consumed,
    imageEvidenceCount: imageRefs.length,
    captionEvidenceCount: captions.length,
    brandVisualCoverage: planned.filter(id => BRAND_VISUAL_COMPONENTS.includes(id)),
    findings
  };
}

function statusForFindings(findings = []) {
  if (findings.some(finding => finding.level === 'fail')) return 'fail';
  if (findings.some(finding => finding.level === 'review')) return 'review';
  return 'pass';
}

function auditBrandVisualRichness(plan = {}, opts = {}) {
  const renderMeta = opts.renderMeta || null;
  const visualQa = opts.visualQa || null;
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  const slideAudits = slides.map((slide, index) => auditSlide(plan, slide, index, renderMeta));
  const findings = [
    ...slideAudits.flatMap(slide => slide.findings),
    ...repetitionFindings(slides),
    ...visualQaFindings(visualQa)
  ];
  return {
    version: 'brand-visual-richness-audit/v1',
    sampleId: opts.sampleId || plan.id || plan.title || '',
    status: statusForFindings(findings),
    slideCount: slides.length,
    metrics: {
      plannedBrandVisualComponentHits: slideAudits.reduce((sum, slide) => sum + slide.brandVisualCoverage.length, 0),
      imageEvidenceBindings: slideAudits.reduce((sum, slide) => sum + slide.imageEvidenceCount, 0),
      captionEvidenceBindings: slideAudits.reduce((sum, slide) => sum + slide.captionEvidenceCount, 0),
      repeatedPageRuns: findings.filter(finding => finding.type === 'consecutivePageRepetition').length,
      brandVisualComponentCoverage: [...new Set(slideAudits.flatMap(slide => slide.brandVisualCoverage))].sort()
    },
    slides: slideAudits,
    findings,
    gapReasons: findings.map(finding => finding.message || finding.type)
  };
}

function auditBrandVisualRichnessFromFiles(opts = {}) {
  const planPath = opts.planPath || opts.plan;
  const rawPlan = readJsonIfExists(planPath);
  if (!rawPlan || rawPlan.__readError) {
    return {
      version: 'brand-visual-richness-audit/v1',
      sampleId: opts.sampleId || (planPath ? path.basename(planPath, '.json') : ''),
      status: 'fail',
      slideCount: 0,
      metrics: {},
      slides: [],
      findings: [{
        type: 'deckPlanReadError',
        level: 'fail',
        message: rawPlan ? rawPlan.__readError : 'deck plan was not provided'
      }],
      gapReasons: [rawPlan ? rawPlan.__readError : 'deck plan was not provided']
    };
  }
  const plan = typeof opts.normalizeDeckPlan === 'function' ? opts.normalizeDeckPlan(rawPlan) : rawPlan;
  return auditBrandVisualRichness(plan, {
    sampleId: opts.sampleId || path.basename(planPath, '.json'),
    renderMeta: readJsonIfExists(opts.renderMetaPath || opts.renderMeta),
    visualQa: readJsonIfExists(opts.visualQaPath || opts.visualQa)
  });
}

module.exports = {
  BRAND_VISUAL_COMPONENTS,
  auditBrandVisualRichness,
  auditBrandVisualRichnessFromFiles,
  captionRefs,
  directImageRefs,
  expectedComponentsForSlide
};
