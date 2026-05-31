const {
  hamming
} = require('./png-analysis');

function rectsIntersect(a = {}, b = {}, pad = 0.015) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(v => v == null)) return false;
  return Math.max(a.x, b.x) < Math.min(a.x + a.w, b.x + b.w) - pad &&
    Math.max(a.y, b.y) < Math.min(a.y + a.h, b.y + b.h) - pad;
}

function rectInside(a = {}, b = {}, pad = 0.035) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(v => v == null)) return false;
  return a.x >= b.x - pad &&
    a.y >= b.y - pad &&
    a.x + a.w <= b.x + b.w + pad &&
    a.y + a.h <= b.y + b.h + pad;
}

function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.filter(v => v != null && String(v).trim()).forEach(value => {
    const key = String(value).trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  });
  return out;
}

function arrayLength(slide = {}, keys = []) {
  return Math.max(0, ...keys.map(key => Array.isArray(slide[key]) ? slide[key].length : 0));
}

function imageCountForSlide(slide = {}) {
  return arrayLength(slide, ['images']) +
    (slide.visual && Array.isArray(slide.visual.images) ? slide.visual.images.length : 0) +
    (slide.image || (slide.visual && slide.visual.image) ? 1 : 0);
}

function expectedRenderedCountsForSlide(slide = {}) {
  const counts = {};
  const plannedIds = new Set(((slide.componentPlan && slide.componentPlan.componentIds) || [])
    .concat(((slide.componentPlan && slide.componentPlan.components) || []).map(component => component.id))
    .filter(Boolean));
  const set = (ids, value) => {
    const count = Number(value || 0);
    if (!count) return;
    ids.forEach(id => {
      if (plannedIds.has(id)) counts[id] = Math.max(counts[id] || 0, count);
    });
  };
  set(['navigation-sequence'], arrayLength(slide, ['items', 'sections']));
  set(['content-card-grid'], arrayLength(slide, ['cards', 'items', 'modules', 'values', 'sections']));
  set(['process-rail'], arrayLength(slide, ['phases', 'actions', 'steps', 'timeline', 'milestones']));
  const rowCount = arrayLength(slide, ['rows', 'risks', 'controls']);
  set(['risk-register', 'governance-table', 'table-with-commentary'], rowCount);
  const metricCount = arrayLength(slide, ['metrics']);
  set(['kpi-strip', 'metric-strip', 'scorecard'], Math.min(metricCount, 4));
  set(['kpi-primary-metric'], metricCount ? 1 : 0);
  const galleryCount = Math.max(imageCountForSlide(slide), arrayLength(slide, ['cards', 'items']));
  set(['proof-gallery', 'proof-gallery-grid'], galleryCount);
  set(['hero-image'], imageCountForSlide(slide) ? 1 : 0);
  set(['product-matrix'], arrayLength(slide, ['products', 'productStory']));
  set(['load-curve-band'], plannedIds.has('load-curve-band') ? 1 : 0);
  return counts;
}

function componentConsumptionAuditFromRender(normalized = {}, renderMetaResult = {}) {
  const slides = normalized.slides || [];
  const findings = [];
  const renderMeta = renderMetaResult.meta;
  const plannedRequired = slides.flatMap((slide, i) => {
    const components = slide.componentPlan && Array.isArray(slide.componentPlan.components) ? slide.componentPlan.components : [];
    return components
      .filter(component => component.required !== false)
      .map(component => ({ slide:i + 1, id:component.id }));
  });
  if (!renderMeta) {
    if (plannedRequired.length) {
      findings.push({
        level:'fail',
        type:'renderMetaMissing',
        message: renderMetaResult.error || 'render metadata sidecar is missing; component consumption cannot be verified'
      });
    }
    return {
      version:'component-consumption-audit/v1',
      status: findings.length ? 'fail' : 'pass',
      renderMeta: renderMetaResult.file || '',
      checkedComponents: plannedRequired.length,
      findings
    };
  }
  const renderedBySlide = new Map((renderMeta.slides || []).map(slide => [Number(slide.slide), slide]));
  const expectedCountsBySlide = new Map(slides.map((slide, i) => [i + 1, expectedRenderedCountsForSlide(slide)]));
  plannedRequired.forEach(component => {
    const rendered = renderedBySlide.get(component.slide);
    const consumed = rendered && Array.isArray(rendered.consumedComponents)
      ? rendered.consumedComponents.find(item => item.id === component.id && item.rendered)
      : null;
    if (!consumed) {
      findings.push({
        slide: component.slide,
        level:'fail',
        type:'componentNotConsumed',
        message:`planned required component was not consumed by renderer: ${component.id}`
      });
    }
  });
  (renderMeta.slides || []).forEach(slide => {
    const expectedCounts = expectedCountsBySlide.get(Number(slide.slide)) || {};
    const plannedById = new Map((slide.plannedComponents || []).map(component => [component.id, component]));
    Object.entries(expectedCounts).forEach(([id, expected]) => {
      if (!expected) return;
      const consumed = (slide.consumedComponents || []).find(component => component.id === id && component.rendered);
      const drawn = (slide.drawnComponents || []).find(component => component.id === id);
      const actual = Number(
        (consumed && consumed.drawnCount != null ? consumed.drawnCount : null) ??
        (consumed && consumed.itemCount != null ? consumed.itemCount : null) ??
        (drawn && drawn.drawnCount != null ? drawn.drawnCount : null) ??
        (drawn && drawn.itemCount != null ? drawn.itemCount : null) ??
        (consumed && consumed.rendered && expected <= 1 ? 1 : 0)
      );
      if (actual < expected) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'renderedCountMismatch',
          message:`component ${id} rendered ${actual}/${expected} expected items`
        });
      }
    });
    (slide.unknownComponents || []).forEach(component => {
      findings.push({
        slide: slide.slide,
        level:'fail',
        type:'unknownComponentId',
        message:`renderer received unknown component id: ${component.id}`
      });
    });
    (slide.consumedComponents || []).forEach(component => {
      const planned = plannedById.get(component.id) || {};
      const allowedModes = planned.allowedModes || planned.supportedModes || [];
      const actualMode = component.mode === 'native-renderer'
        ? 'native'
        : (component.mode === 'overlay' ? 'overlay' : '');
      if (component.rendered && actualMode && Array.isArray(allowedModes) && allowedModes.length && !allowedModes.includes(actualMode)) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'componentModeMismatch',
          message:`component ${component.id} rendered as ${actualMode}, but allowed modes are ${allowedModes.join(',')}`
        });
      }
      if (component.mode === 'native-renderer' && component.rendered) {
        const hasEvidence = component.nativeSlot && component.bbox && Number(component.drawnCount || 0) > 0;
        if (!hasEvidence) {
          findings.push({
            slide: slide.slide,
            level:'fail',
            type:'nativeComponentEvidenceMissing',
            message:`native component ${component.id} was marked rendered without drawnCount/nativeSlot/bbox evidence`
          });
        }
      }
      if (component.mode === 'native-claimed-undrawn') {
        findings.push({
          slide: slide.slide,
          level: component.required === false ? 'review' : 'fail',
          type:'nativeComponentClaimedButUndrawn',
          message:`native component ${component.id} was declared owned but no drawn evidence was recorded`
        });
      }
    });
    (slide.missingRequiredComponents || []).forEach(id => {
      if (!findings.some(f => f.slide === slide.slide && f.message.includes(id))) {
        findings.push({
          slide: slide.slide,
          level:'fail',
          type:'componentNotConsumed',
          message:`renderer reported missing required component: ${id}`
        });
      }
    });
  });
  return {
    version:'component-consumption-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    checkedComponents: plannedRequired.length,
    findings
  };
}

function renderMetaSchemaAuditFromRender(renderMetaResult = {}, expectedSlideCount = 0) {
  const findings = [];
  const renderMeta = renderMetaResult.meta;
  if (!renderMeta) {
    findings.push({
      level: renderMetaResult.file ? 'fail' : 'review',
      type: renderMetaResult.file ? 'renderMetaUnreadable' : 'renderMetaMissing',
      message: renderMetaResult.error || 'render metadata sidecar is missing'
    });
    return {
      version:'render-meta-schema-audit/v1',
      schema:'render-meta/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : 'review',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  if (renderMeta.version !== 'render-meta/v1') {
    findings.push({ level:'fail', type:'renderMetaVersionInvalid', message:'render meta version must be render-meta/v1' });
  }
  if (!Array.isArray(renderMeta.slides)) {
    findings.push({ level:'fail', type:'renderMetaSlidesMissing', message:'render meta must contain slides[]' });
  } else {
    if (expectedSlideCount && renderMeta.slides.length !== expectedSlideCount) {
      findings.push({ level:'fail', type:'renderMetaSlideCountMismatch', message:`render meta has ${renderMeta.slides.length} slide records for ${expectedSlideCount} PPT slides` });
    }
    if (Number.isFinite(Number(renderMeta.slideCount)) && Number(renderMeta.slideCount) !== renderMeta.slides.length) {
      findings.push({ level:'fail', type:'renderMetaDeclaredSlideCountMismatch', message:'render meta slideCount does not match slides[] length' });
    }
    const allowedMatchKinds = new Set(['exact', 'alias', 'fallback', 'industry-override']);
    renderMeta.slides.forEach((slide, i) => {
      const slideNo = Number(slide.slide || i + 1);
      if (!Number.isFinite(slideNo) || slideNo < 1) {
        findings.push({ slide:i + 1, level:'fail', type:'renderMetaSlideNumberInvalid', message:'slide record must include a positive slide number' });
      }
      if (!slide.type) {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaSlideTypeMissing', message:'slide record must include type' });
      }
      const renderer = slide.rendererMatch || {};
      ['requestedType', 'matchedType', 'matchKind', 'rendererId', 'rendererName', 'source'].forEach(field => {
        if (!renderer[field]) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaRendererFieldMissing', message:`rendererMatch.${field} is required` });
        }
      });
      if (renderer.matchKind && !allowedMatchKinds.has(renderer.matchKind)) {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaRendererMatchKindInvalid', message:`unsupported renderer match kind: ${renderer.matchKind}` });
      }
      ['plannedComponents', 'unknownComponents', 'drawnComponents', 'consumedComponents', 'missingRequiredComponents', 'textBoxes'].forEach(field => {
        if (!Array.isArray(slide[field])) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentArrayMissing', message:`${field} must be an array` });
        }
      });
      (slide.plannedComponents || []).forEach(component => {
        ['id', 'allowedModes', 'slotPolicy', 'repairPolicy', 'priority'].forEach(field => {
          if (component[field] == null || (Array.isArray(component[field]) && !component[field].length)) {
            findings.push({ slide:slideNo, level:'fail', type:'renderMetaComponentContractFieldMissing', message:`plannedComponents.${component.id || 'unknown'}.${field} is required` });
          }
        });
      });
      const asset = slide.assetDecision || {};
      if (asset.version !== 'asset-decision/v1') {
        findings.push({ slide:slideNo, level:'fail', type:'renderMetaAssetDecisionMissing', message:'assetDecision v1 is required on every slide' });
      } else {
        ['status', 'mode'].forEach(field => {
          if (!asset[field]) {
            findings.push({ slide:slideNo, level:'fail', type:'renderMetaAssetDecisionFieldMissing', message:`assetDecision.${field} is required` });
          }
        });
        if (asset.status === 'bound' && Number(asset.boundAssetCount || 0) < 1) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaBoundAssetMissing', message:'assetDecision.status is bound but no bound asset refs are recorded' });
        }
        if (asset.status === 'blocked' && asset.mode !== 'blocked') {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaBlockedAssetModeInvalid', message:'blocked asset decisions must use mode=blocked' });
        }
        if (asset.generatedAssetPrompt && Number(asset.boundAssetCount || 0) < 1 && !['pending-generation', 'needs-generation'].includes(asset.mode)) {
          findings.push({ slide:slideNo, level:'fail', type:'renderMetaGeneratedPromptModeInvalid', message:'unbound generated prompts must remain auditable as pending generation' });
        }
      }
    });
  }
  return {
    version:'render-meta-schema-audit/v1',
    schema:'render-meta/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

function contentCoverageAuditFromRender(renderMetaResult = {}, slideReports = []) {
  const renderMeta = renderMetaResult.meta;
  const findings = [];
  if (!renderMeta || !Array.isArray(renderMeta.slides)) {
    return {
      version:'content-coverage-audit/v1',
      status:'pass',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  const exemptTypes = new Set(['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'section-divider', 'divider', 'agenda']);
  const bySlide = new Map(slideReports.map(report => [Number(report.slide), report]));
  renderMeta.slides.forEach(meta => {
    const slideNo = Number(meta.slide || 0);
    const report = bySlide.get(slideNo) || {};
    const type = String(meta.type || '');
    if (exemptTypes.has(type)) return;
    const mainCoverage = Number(report.mainBodyCoverage || 0);
    const mainChars = Number(report.mainBodyCharCount || 0);
    const mainElements = Number(report.mainBodyElements || 0);
    if (mainCoverage < 0.015 && mainChars < 35 && mainElements < 3) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'mainBodyMissingContent',
        message:`content slide has title/footer but weak main body coverage (${mainCoverage}) and ${mainChars} body chars`
      });
    }
    const requiredComponents = (meta.plannedComponents || []).filter(component => component.required !== false);
    const asset = meta.assetDecision || {};
    const expectsRightEvidence =
      ['case-gallery', 'portfolio', 'product-showcase', 'gallery'].includes(type) ||
      requiredComponents.some(component => /hero-image|proof-gallery|product-matrix|evidence|gallery|caption-bar/i.test(component.id || '')) ||
      (asset.hasBoundAsset && /evidence|gallery|showcase|product/i.test(asset.role || ''));
    if (expectsRightEvidence && Number(report.rightEvidenceCoverage || 0) < 0.018 && Number(report.images || 0) === 0) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'rightEvidenceRegionMissing',
        message:`slide expects evidence/visual content but right-side region coverage is ${report.rightEvidenceCoverage || 0}`
      });
    }
  });
  return {
    version:'content-coverage-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

function overlayContractAuditFromRender(renderMetaResult = {}) {
  const renderMeta = renderMetaResult.meta;
  const findings = [];
  if (!renderMeta) {
    return {
      version:'overlay-contract-audit/v1',
      status:'pass',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  (renderMeta.slides || []).forEach(slide => {
    const slideNo = Number(slide.slide || 0);
    const contract = slide.nativeRendererContract || {};
    const occupied = Array.isArray(contract.occupiedZones) ? contract.occupiedZones : [];
    const safeZones = Object.values(contract.safeOverlayZones || {});
    const consumed = Array.isArray(slide.consumedComponents) ? slide.consumedComponents : [];
    const slotForComponent = (id = '') => {
      const zones = contract.safeOverlayZones || {};
      return zones[id] ||
        (id === 'metric-strip' ? zones['kpi-strip'] : null) ||
        (id === 'value-chain-connector' ? zones['value-chain'] : null) ||
        null;
    };
    consumed.forEach(component => {
      if (/^blocked-/.test(component.mode || '')) {
        const required = component.required !== false;
        findings.push({
          slide: slideNo,
          level: required ? 'fail' : 'review',
          type:'unsafeOverlayBlocked',
          message:`component ${component.id} was blocked by native renderer contract (${component.mode})`
        });
      }
      if (component.mode !== 'overlay' || !component.bbox) return;
      const declaredSlot = slotForComponent(component.id);
      if (!declaredSlot) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'overlayWithoutDeclaredSlot',
          message:`overlay ${component.id} rendered without a component-specific safe slot`
        });
        return;
      }
      if (!rectInside(component.bbox, declaredSlot)) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'overlaySlotMismatch',
          message:`overlay ${component.id} bbox is outside its declared safe slot`
        });
      }
      const overlapsNative = occupied
        .filter(zone => zone.role !== 'native-footer')
        .some(zone => rectsIntersect(component.bbox, zone));
      const insideSafe = safeZones.some(zone => rectsIntersect(component.bbox, zone, -0.01));
      if (overlapsNative && !insideSafe) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'overlayNativeZoneConflict',
          message:`overlay ${component.id} intersects native occupied zone outside a declared safe slot`
        });
      }
    });
    const overlayIds = consumed.filter(c => c.mode === 'overlay' && c.rendered).map(c => c.id);
    const duplicateOverlayIds = compactUnique(overlayIds.filter((id, i) => overlayIds.indexOf(id) !== i));
    duplicateOverlayIds.forEach(id => findings.push({
      slide: slideNo,
      level:'review',
      type:'duplicateOverlayComponent',
      message:`overlay component rendered more than once: ${id}`
    }));
    const decorations = Array.isArray(slide.decorations) ? slide.decorations : [];
    const loadCurves = decorations.filter(d => d.type === 'load-curve-band');
    if (loadCurves.length > 1) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'duplicateLoadCurveBand',
        message:`${loadCurves.length} load-curve-band decorations on one slide; expected at most one`
      });
    }
    const rings = decorations.filter(d => d.type === 'breathing-circle');
    if (rings.length > 1) {
      findings.push({
        slide: slideNo,
        level:'review',
        type:'duplicateBreathingCircle',
        message:`${rings.length} background circle decorations on one slide`
      });
    }
    const textOrCardZones = occupied.filter(zone => /text|card|caption|path/i.test(zone.role || ''));
    rings.forEach(ring => {
      const collision = textOrCardZones.find(zone => rectsIntersect(ring, zone, 0.04));
      if (collision) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'breathingCircleTextZoneConflict',
          message:`background circle enters ${collision.id}; rings must stay in the main visual area`
        });
      }
    });
  });
  return {
    version:'overlay-contract-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

function findingsFromPreviewSimilarity(previews = []) {
  const out = [];
  for (let i = 1; i < previews.length; i++) {
    const prev = previews[i - 1].info;
    const cur = previews[i].info;
    const dist = prev && cur ? hamming(prev.hash, cur.hash) : null;
    if (dist != null && dist <= 6) {
      out.push({ slide:i + 1, level:'review', type:'contactSheetRhythmRepeat', message:`adjacent previews ${i} and ${i + 1} are visually too similar (${dist}/64)` });
    }
  }
  return out;
}

function secondaryVisualReview(normalized = {}, aesthetic = null, previews = []) {
  const slides = normalized.slides || [];
  const findings = [];
  const routeCounts = {};
  const densityCounts = {};
  slides.forEach(slide => {
    const route = slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : (slide.type || 'unknown');
    routeCounts[route] = (routeCounts[route] || 0) + 1;
    const density = slide.visualDensity || (slide.compositionPlan && (slide.compositionPlan.visualDensity || slide.compositionPlan.density)) || 'unset';
    densityCounts[density] = (densityCounts[density] || 0) + 1;
  });
  const repeatedRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  if (slides.length >= 6 && repeatedRoute[1] / slides.length > 0.45) {
    findings.push({
      level: 'review',
      type: 'repeatedComposition',
      message: `${repeatedRoute[1]}/${slides.length} slides use ${repeatedRoute[0]}`
    });
  }
  const slideScores = aesthetic && Array.isArray(aesthetic.slides) ? aesthetic.slides : [];
  const lowRhythm = slideScores.filter(s => (s.dimensions || {}).rhythm < 82).length;
  const lowBrand = slideScores.filter(s => (s.dimensions || {}).industryFit < 82).length;
  const lowDensity = slideScores.filter(s => (s.dimensions || {}).densityControl < 82).length;
  const lowEvidenceRelation = slideScores.filter(s => (s.dimensions || {}).evidenceRelationship < 82).length;
  if (lowRhythm >= 2) findings.push({ level:'review', type:'pageRhythmWeak', message:`${lowRhythm} slides need stronger page rhythm` });
  if (lowBrand >= 2) findings.push({ level:'review', type:'brandAdaptationWeak', message:`${lowBrand} slides have weak industry/brand fit` });
  if (lowDensity >= 2) findings.push({ level:'review', type:'densityControlWeak', message:`${lowDensity} slides need density tuning` });
  if (lowEvidenceRelation >= 2) findings.push({ level:'review', type:'imageTextRelationshipWeak', message:`${lowEvidenceRelation} slides need clearer image-text evidence relationship` });
  const similarPreviewFindings = findingsFromPreviewSimilarity(previews);
  similarPreviewFindings.forEach(f => findings.push(f));
  return {
    version: 'secondary-visual-review/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    dimensions: {
      pageRhythm: lowRhythm ? 'review' : 'pass',
      repeatedComposition: repeatedRoute[1] > 1 ? 'checked' : 'pass',
      brandAdaptation: lowBrand ? 'review' : 'pass',
      density: lowDensity ? 'review' : 'pass',
      imageTextRelationship: lowEvidenceRelation ? 'review' : 'pass'
    },
    routeCounts,
    densityCounts,
    findings
  };
}

module.exports = {
  componentConsumptionAuditFromRender,
  contentCoverageAuditFromRender,
  expectedRenderedCountsForSlide,
  findingsFromPreviewSimilarity,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
  secondaryVisualReview
};
