const {
  COMMON_CAPTION_FIELDS,
  COMMON_SOURCE_FIELDS,
  INDUSTRY_EVIDENCE_CHAINS,
  canonicalIndustryEvidenceChainForSlide,
  inferIndustryEvidenceChain,
  normalizeIndustryEvidenceChainShape
} = require('../design/industry-evidence-chain');
const { industryRenderMetaFindingsForComponent } = require('./industry-evidence-render-meta');
const { componentEvidenceFieldFindings } = require('./industry-evidence-chain-field-gaps');
const { buildIndustryEvidenceChainSummary, statusForFindings } = require('./industry-evidence-chain-summary');
const {
  consumedComponentForSlide,
  consumedIdsForSlide,
  crossIndustryFindings,
  hasFieldPath,
  inputChainFindings,
  knownIndustry,
  plannedComponentsForSlide,
  plannedIdsForSlide,
  renderedSlideFor
} = require('./industry-evidence-chain-audit-helpers');

function componentHintHasEvidence(id = '', slide = {}) {
  const any = fields => fields.some(field => hasFieldPath(slide, field));
  const imageFields = ['image', 'images', 'visual.image', 'visual.images'];
  const sourceFields = ['sourceNote', 'source_note', 'proof.sourceNote', 'proof.source', 'sourceTrace.sourceIds', 'sourceTrace.metricSources'];
  const commonEvidenceFields = [...imageFields, ...sourceFields];
  if (['hero-image', 'proof-gallery'].includes(id)) return any(commonEvidenceFields);
  if (id === 'caption-bar') return any([...commonEvidenceFields, 'caption', 'visual.caption', 'proof.explanation']);
  if (id === 'product-matrix') return any(['product', 'products', 'productStory', ...commonEvidenceFields]);
  if (id === 'prototype-frame') return any([
    ...imageFields,
    'prototypeFlow.screenshot',
    'prototypeFlow.screen',
    'prototypeFlow.image',
    'prototypeFlow.images',
    'prototype.screenshot',
    'prototype.screen',
    'prototype.image',
    'prototype.images'
  ]);
  if (id === 'workflow-rail') return any(['workflow', 'prototypeFlow', 'steps', 'phases']);
  if (['risk-register', 'risk-matrix'].includes(id)) return any(['rows', 'risks', 'controls', 'riskRegister', 'riskMatrix', 'matrix']);
  if (id === 'governance-table') return any(['rows', 'controls', 'governance', 'responsibilityLoop']);
  if (id === 'source-note') return any(sourceFields);
  if (id === 'service-blueprint-lane') return any(['serviceBlueprint', 'touchpoints', 'handoffs', 'qualityHandoff', 'journeyMap']);
  if (id === 'patient-journey-band') return any(['journeyMap', 'patientJourney', 'touchpoints', 'handoffs']);
  if (['equipment-nameplate', 'inspection-matrix', 'quality-scorecard'].includes(id)) return any(['equipment', 'equipmentNameplate', 'inspectionMatrix', 'oee', 'metrics', ...sourceFields]);
  if (id === 'adoption-funnel') return any(['adoptionFunnel', 'funnel', 'metrics']);
  return any(commonEvidenceFields);
}

function componentHintFindings(slideNo, chain = {}, slide = {}) {
  const expected = new Set(Array.isArray(chain.components) ? chain.components : []);
  return plannedComponentsForSlide(slide)
    .filter(component => component && component.source === 'component-hint')
    .filter(component => !expected.has(component.id))
    .filter(component => !componentHintHasEvidence(component.id, slide))
    .map(component => ({
      slide: slideNo,
      level: 'review',
      type: 'componentHintEvidenceMissing',
      componentId: component.id,
      message: `component-hint ${component.id} is not part of canonical industry chain ${chain.chainId || 'unknown'} / ${chain.stageId || 'unknown'} and lacks matching evidence fields`
    }));
}

function auditSlide(plan = {}, slide = {}, index = 0, renderMeta = null) {
  const slideNo = index + 1;
  const suppliedRaw = slide.componentPlan && slide.componentPlan.industryEvidenceChain;
  const supplied = normalizeIndustryEvidenceChainShape(suppliedRaw);
  const canonical = canonicalIndustryEvidenceChainForSlide(plan, slide);
  const chain = canonical && canonical.stageId !== 'neutral-general'
    ? canonical
    : (supplied || inferIndustryEvidenceChain(plan, slide));
  const planned = plannedIdsForSlide(slide);
  const expected = Array.isArray(chain.components) ? chain.components : [];
  const plannedExpected = expected.filter(id => planned.includes(id));
  const findings = [];
  const rendered = renderedSlideFor(renderMeta, slideNo);
  const consumed = consumedIdsForSlide(rendered);

  findings.push(...inputChainFindings({ canonical, slide, slideNo, suppliedRaw, supplied }));

  if (chain.stageId === 'neutral-general') {
    if (knownIndustry(plan, slide)) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'chainStageNeutral',
        message: 'known industry slide fell back to neutral/general because route, proofObject, fields, or keywords were insufficient'
      });
    }
  } else {
    if (expected.length && !plannedExpected.length) {
      findings.push({
        slide: slideNo,
        level: 'fail',
        type: 'industryEvidenceComponentsMissing',
        message: `${chain.stageLabel} did not hit any expected evidence-chain components`
      });
    } else {
      const missing = expected.filter(id => !planned.includes(id));
      if (missing.length) {
        findings.push({
          slide: slideNo,
          level: 'review',
          type: 'industryEvidenceComponentPartial',
          message: `${chain.stageLabel} missing expected component(s): ${missing.join(', ')}`
        });
      }
    }
    if (!chain.matchedFields.length && !chain.matchedProofObjects.length) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'evidenceFieldInsufficient',
        message: `${chain.stageLabel} was inferred from route/keywords but has no structured proof field binding`
      });
    }
    if ((expected.includes('caption-bar') || expected.includes('proof-gallery')) && !COMMON_CAPTION_FIELDS.some(field => hasFieldPath(slide, field))) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'captionCoverageLow',
        message: `${chain.stageLabel} expects captioned evidence but no caption/proof explanation field was found`
      });
    }
    if (expected.includes('source-note') && !COMMON_SOURCE_FIELDS.some(field => hasFieldPath(slide, field))) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'sourceCoverageLow',
        message: `${chain.stageLabel} expects source/provenance coverage but no source note field was found`
      });
    }
    if (renderMeta && renderMeta.__readError) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'renderMetaReadError',
        message: renderMeta.__readError
      });
    } else if (renderMeta && !rendered) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'renderMetaSlideMissing',
        message: 'render-meta was provided but this slide was not found'
      });
    } else if (rendered) {
      plannedExpected.forEach(id => {
        if (!consumed.includes(id)) {
          findings.push({
            slide: slideNo,
            level: 'fail',
            type: 'industryEvidenceComponentNotConsumed',
            message: `industry evidence-chain component was planned but not consumed by renderer: ${id}`
          });
          return;
        }
        findings.push(...industryRenderMetaFindingsForComponent(slideNo, chain, id, rendered, consumedComponentForSlide(rendered, id)));
      });
    } else if (plannedExpected.length) {
      findings.push({
        slide: slideNo,
        level: 'review',
        type: 'renderMetaMissing',
        message: 'render-meta was not provided; industry evidence-chain component consumption cannot be verified'
      });
    }
  }

  findings.push(...crossIndustryFindings(slideNo, chain, planned));
  findings.push(...componentHintFindings(slideNo, chain, slide));
  findings.push(...componentEvidenceFieldFindings({ hasFieldPath, slideNo, chain, slide, planned }));

  return {
    slide: slideNo,
    type: slide.type || '',
    layoutVariant: slide.layoutVariant || slide.variant || '',
    proofObject: (slide.proof && slide.proof.id) || slide.proofObject || slide.proof_object || '',
    chainId: chain.chainId,
    chainLabel: chain.chainLabel,
    stageId: chain.stageId,
    stageLabel: chain.stageLabel,
    position: chain.position,
    confidence: chain.confidence,
    expectedComponents: expected,
    plannedComponents: planned,
    consumedComponents: consumed,
    matchedFields: chain.matchedFields || [],
    matchedProofObjects: chain.matchedProofObjects || [],
    matchedKeywords: chain.matchedKeywords || [],
    inputMetadata: {
      previousComponentPlan: Boolean(slide.previousComponentPlan),
      previousComponentHints: Boolean(slide.previousComponentHints),
      previousComponentSuggestions: Boolean(slide.previousComponentSuggestions),
      previousCompositionPlan: Boolean(slide.previousCompositionPlan),
      previousAssetGeneration: Boolean(slide.previousAssetGeneration),
      previousIndustryEvidenceChain: Boolean(slide.previousIndustryEvidenceChain),
      industryEvidenceChainConflict: slide.industryEvidenceChainConflict || null
    },
    findings
  };
}

function stageCoverageFindings(slideAudits = []) {
  const findings = [];
  const byChain = new Map();
  slideAudits.forEach(slide => {
    if (!slide.chainId || slide.chainId === 'neutral-general') return;
    if (!byChain.has(slide.chainId)) byChain.set(slide.chainId, []);
    byChain.get(slide.chainId).push(slide);
  });
  byChain.forEach((slides, chainId) => {
    if (slides.length < 3) return;
    const positions = new Set(slides.map(slide => slide.position).filter(Boolean));
    [1, 2, 3].forEach(position => {
      if (positions.has(position)) return;
      const chain = INDUSTRY_EVIDENCE_CHAINS[chainId] || {};
      const stage = (chain.stages || []).find(item => item.position === position) || {};
      findings.push({
        level: 'review',
        type: 'chainSegmentMissing',
        chainId,
        message: `${chain.label || chainId} chain is missing stage ${position}${stage.label ? ` (${stage.label})` : ''}`
      });
    });
  });
  return findings;
}

function auditIndustryEvidenceChain(plan = {}, normalizedPlan = null, opts = {}) {
  if (normalizedPlan && !Array.isArray(normalizedPlan.slides) && typeof normalizedPlan === 'object' && !opts.renderMeta) {
    opts = normalizedPlan;
    normalizedPlan = null;
  }
  const effective = normalizedPlan && Array.isArray(normalizedPlan.slides) ? normalizedPlan : plan;
  const renderMeta = opts.renderMeta || null;
  const slides = Array.isArray(effective.slides) ? effective.slides : [];
  const slideAudits = slides.map((slide, index) => auditSlide(effective, slide, index, renderMeta));
  const findings = [
    ...slideAudits.flatMap(slide => slide.findings),
    ...stageCoverageFindings(slideAudits)
  ];
  const recognizedSlides = slideAudits.filter(slide => slide.chainId && slide.chainId !== 'neutral-general');
  const metrics = {
    recognizedSlides: recognizedSlides.length,
    neutralFallbackSlides: slideAudits.length - recognizedSlides.length,
    stageCoverage: recognizedSlides.reduce((out, slide) => {
      out[slide.chainId] = out[slide.chainId] || [];
      if (!out[slide.chainId].includes(slide.stageId)) out[slide.chainId].push(slide.stageId);
      return out;
    }, {}),
    componentHits: slideAudits.reduce((sum, slide) => sum + slide.expectedComponents.filter(id => slide.plannedComponents.includes(id)).length, 0),
    consumedHits: slideAudits.reduce((sum, slide) => sum + slide.expectedComponents.filter(id => slide.consumedComponents.includes(id)).length, 0)
  };
  const sampleId = opts.sampleId || effective.id || effective.title || '';
  const summary = buildIndustryEvidenceChainSummary({
    effective,
    findings,
    metrics,
    sampleId,
    slideAudits
  });
  return {
    version: 'industry-evidence-chain-audit/v1',
    sampleId,
    status: statusForFindings(findings),
    slideCount: slides.length,
    metrics,
    industry_evidence_chain_summary: summary,
    slides: slideAudits,
    findings,
    gapReasons: findings.map(finding => finding.message || finding.type)
  };
}

module.exports = { auditIndustryEvidenceChain, buildIndustryEvidenceChainSummary, auditSlide, statusForFindings };
