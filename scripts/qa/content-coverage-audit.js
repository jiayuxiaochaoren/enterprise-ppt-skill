const MAIN_BODY_REGION = { x:0.70, y:1.28, w:11.88, h:5.38 };
const CONTENT_COVERAGE_FINDING_TYPES = Object.freeze([
  'mainBodyMissingContent',
  'rightEvidenceRegionMissing'
]);

function intersectionArea(a = {}, b = {}) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(value => value == null)) return 0;
  const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return w * h;
}

function hasMainBodyComponentEvidence(meta = {}) {
  const components = [
    ...((Array.isArray(meta.drawnComponents) ? meta.drawnComponents : []).map(component => Object.assign({ rendered:true }, component))),
    ...(Array.isArray(meta.consumedComponents) ? meta.consumedComponents : [])
  ];
  return components.some(component => {
    const rendered = component.rendered !== false;
    const drawn = Number(component.drawnCount || 0) > 0 || Number(component.renderedCount || 0) > 0;
    const bbox = component.bbox || {};
    return rendered && drawn && intersectionArea(bbox, MAIN_BODY_REGION) > 0.01;
  });
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
    const hasImages = Number(report.images || 0) > 0;
    const hasSemanticComponent = hasMainBodyComponentEvidence(meta);
    if (mainCoverage < 0.015 && mainChars < 35 && mainElements < 3) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'mainBodyMissingContent',
        regionName:'mainBody',
        reason:'main_body_empty',
        mainBodyCoverage: mainCoverage,
        mainBodyCharCount: mainChars,
        mainBodyElements: mainElements,
        minMainBodyCoverage: 0.015,
        minMainBodyChars: 35,
        minMainBodyElements: 3,
        hasImages,
        hasSemanticComponent,
        message:`content slide has title/footer but weak main body coverage (${mainCoverage}) and ${mainChars} body chars`
      });
    }
    if (
      mainCoverage >= 0.015 &&
      mainChars < 16 &&
      mainElements >= 3 &&
      !hasImages &&
      !hasSemanticComponent
    ) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'mainBodyMissingContent',
        regionName:'mainBody',
        reason:'main_body_decorative_only',
        mainBodyCoverage: mainCoverage,
        mainBodyCharCount: mainChars,
        mainBodyElements: mainElements,
        minMainBodyChars: 16,
        hasImages,
        hasSemanticComponent,
        message:`main body coverage (${mainCoverage}) appears to come from non-text shapes; ${mainChars} body chars and no rendered component/image evidence`
      });
    }
    const requiredComponents = (meta.plannedComponents || []).filter(component => component.required !== false);
    const asset = meta.assetDecision || {};
    const expectsRightEvidence =
      ['case-gallery', 'portfolio', 'product-showcase', 'gallery'].includes(type) ||
      requiredComponents.some(component => /hero-image|proof-gallery|product-matrix|evidence|gallery|caption-bar/i.test(component.id || '')) ||
      (asset.hasBoundAsset && /evidence|gallery|showcase|product/i.test(asset.role || ''));
    if (expectsRightEvidence && Number(report.rightEvidenceCoverage || 0) < 0.018 && Number(report.images || 0) === 0) {
      const expectedComponentIds = requiredComponents
        .map(component => component.id)
        .filter(Boolean);
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'rightEvidenceRegionMissing',
        regionName:'rightEvidence',
        reason:'expected_evidence_region_empty',
        rightEvidenceCoverage: Number(report.rightEvidenceCoverage || 0),
        minRightEvidenceCoverage: 0.018,
        imageCount: Number(report.images || 0),
        expectedComponentIds,
        assetDecisionStatus: asset.status || '',
        assetDecisionMode: asset.mode || '',
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

module.exports = {
  CONTENT_COVERAGE_FINDING_TYPES,
  contentCoverageAuditFromRender
};
