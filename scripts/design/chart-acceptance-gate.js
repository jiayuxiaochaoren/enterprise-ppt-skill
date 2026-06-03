const {
  BODY_EXEMPT_TYPES
} = require('./chart-spec-constants');
const {
  proofObjectId
} = require('./chart-data-utils');
const {
  routeChartSpec
} = require('./chart-spec-routing');
const {
  slideHasChartIntent
} = require('./chart-intent');

function issueCategoryForFinding(finding = {}) {
  if (finding.issueCategory) return finding.issueCategory;
  if (/component|rendered|consumed/i.test(finding.type || '')) return 'component_gap';
  if (/contract|source|unit|sufficien|information|evidence|fake/i.test(finding.type || '')) return 'data_contract_gap';
  if (/route|notline|notfunnel|notwaterfall/i.test(finding.type || '')) return 'routing_error';
  return 'renderer_layout_bug';
}

function createChartAcceptanceGate(deps = {}) {
  const {
    chartSemanticQA = () => ({ findings: [] })
  } = deps;

  function chartAcceptanceGate(plan = {}, normalizedPlan = null, renderMeta = null, options = {}) {
    const normalized = normalizedPlan || plan;
    const slides = normalized.slides || [];
    const findings = [];
    const strict = options.strict === true || plan.formalMaterialGeneration === true || plan.outputIntent === 'formal';
    const blockingLevel = strict ? 'fail' : 'review';
    const target = Number((normalized.targetSlides && (normalized.targetSlides.resolved || normalized.targetSlides.targetSlides || normalized.targetSlides.requested)) || normalized.requestedSlideCount || plan.requestedSlideCount || 0);
    if (target && slides.length !== target) {
      findings.push({ level: 'fail', type: 'acceptancePageCountMismatch', issueCategory: 'data_contract_gap', message: `page count ${slides.length} does not match target ${target}` });
    }
    const claimSpine = normalized.claimSpine || plan.claimSpine || [];
    const bodySlides = slides
      .map((slide, index) => ({ slide, index }))
      .filter(entry => !BODY_EXEMPT_TYPES.has(entry.slide.type || ''));
    if (slides.length >= 8 && claimSpine.length < bodySlides.length) {
      findings.push({ level: blockingLevel, type: 'acceptanceClaimSpineMissing', issueCategory: 'data_contract_gap', message: 'claim spine does not cover body pages' });
    }
    const claimSpineClaimFor = (slide = {}, index = 0) => {
      const bySlide = claimSpine.find(entry => Number(entry.slide || entry.slideNumber || entry.slide_number || 0) === index + 1);
      if (bySlide && bySlide.claim) return bySlide.claim;
      const byId = claimSpine.find(entry => entry && (entry.slideId || entry.slide_id || entry.id || entry.title) &&
        [slide.id, slide.slideId, slide.slide_id, slide.title].filter(Boolean).includes(entry.slideId || entry.slide_id || entry.id || entry.title));
      if (byId && byId.claim) return byId.claim;
      return '';
    };
    slides.forEach((slide, i) => {
      if (BODY_EXEMPT_TYPES.has(slide.type || '')) return;
      if (!slide.claim && !claimSpineClaimFor(slide, i) && !slide.title) {
        findings.push({ slide: i + 1, level: blockingLevel, type: 'acceptanceClaimMissing', issueCategory: 'data_contract_gap', message: 'body page lacks claim spine text' });
      }
      if (!proofObjectId(slide)) {
        findings.push({ slide: i + 1, level: blockingLevel, type: 'acceptanceProofObjectMissing', issueCategory: 'data_contract_gap', message: 'body page lacks proof object' });
      }
      if (strict && slideHasChartIntent(slide)) {
        const spec = routeChartSpec(normalized, slide, { index: i + 1, total: slides.length });
        if (spec && spec.chartContractError) {
          findings.push({ slide: i + 1, level: 'fail', type: 'acceptanceChartSpecContractError', issueCategory: 'data_contract_gap', message: spec.chartContractError.type || 'chartSpec contract error' });
        } else if (spec && (spec.source === 'repair' || slide.chartSpecInferred === true)) {
          findings.push({ slide: i + 1, level: 'fail', type: 'acceptanceChartSpecRepairInStrictMode', issueCategory: 'data_contract_gap', message: 'strict mode requires planner-provided chartSpec/v1, not renderer/planner repair inference' });
        }
      }
    });
    if (renderMeta && Array.isArray(renderMeta.slides)) {
      renderMeta.slides.forEach(slide => {
        (slide.missingRequiredComponents || []).forEach(id => {
          findings.push({ slide: slide.slide, level: 'fail', type: 'acceptanceComponentNotConsumed', issueCategory: 'component_gap', message: `required component not consumed: ${id}` });
        });
        const chart = slide.chartConsumption;
        if (chart && chart.spec && chart.spec.kind !== 'informationGap') {
          if (!chart.spec.unit && ['bar', 'line', 'waterfall', 'funnel', 'pareto', 'kpi', 'scorecard'].includes(chart.spec.kind)) {
            findings.push({ slide: slide.slide, level: 'review', type: 'acceptanceChartUnitMissing', issueCategory: 'data_contract_gap', message: 'chart lacks unit' });
          }
          const trace = chart.spec.sourceTrace || {};
          if (!((trace.sourceIds || []).length || trace.sourceNote)) {
            findings.push({ slide: slide.slide, level: 'review', type: 'acceptanceChartSourceMissing', issueCategory: 'data_contract_gap', message: 'chart lacks source' });
          }
        }
      });
    } else {
      findings.push({ level: blockingLevel, type: 'acceptanceRenderMetaMissing', issueCategory: 'component_gap', message: 'render meta is required for component consumption gate' });
    }
    const semantic = chartSemanticQA(plan, normalized);
    semantic.findings.filter(f => f.type === 'fakeTrendLine').forEach(f => findings.push(Object.assign({}, f, { level: 'fail' })));
    const previews = options.previewReports || [];
    if (options.requireContactSheet && !previews.length) {
      findings.push({ level: 'review', type: 'acceptanceContactSheetMissing', issueCategory: 'renderer_layout_bug', message: 'contact sheet / preview evidence is missing' });
    }
    const blank = previews.filter(p => p.info && p.info.bytes < 12000).length;
    if (blank) findings.push({ level: 'review', type: 'acceptanceContactSheetUnreadable', issueCategory: 'renderer_layout_bug', message: `${blank} preview thumbnails may be unreadable` });
    const annotated = findings.map(f => Object.assign({}, f, { issueCategory: issueCategoryForFinding(f) }));
    return {
      version: 'chart-acceptance-gate/v1',
      status: annotated.some(f => f.level === 'fail') ? 'fail' : (annotated.length ? 'review' : 'pass'),
      findings: annotated,
      conditions: {
        pageCountMatchesTarget: !annotated.some(f => f.type === 'acceptancePageCountMismatch'),
        everyPageHasClaimSpine: !annotated.some(f => /Claim/.test(f.type || '')),
        everyBodyPageHasProofObject: !annotated.some(f => f.type === 'acceptanceProofObjectMissing'),
        componentsConsumed: !annotated.some(f => f.type === 'acceptanceComponentNotConsumed'),
        chartsHaveUnitsAndSources: !annotated.some(f => /Chart(Unit|Source)Missing/.test(f.type || '')),
        noFakeTrends: !annotated.some(f => f.type === 'fakeTrendLine'),
        contactSheetReadable: !annotated.some(f => /ContactSheet/.test(f.type || '') && f.level === 'fail')
      }
    };
  }

  return {
    chartAcceptanceGate
  };
}

module.exports = {
  createChartAcceptanceGate,
  issueCategoryForFinding
};
