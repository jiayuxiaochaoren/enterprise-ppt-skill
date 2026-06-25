const {
  assertRendererContext
} = require('../renderer-context');
const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createRiskBoardGovernanceLayoutRenderers
} = require('./risk-board-governance-layouts');
const {
  createRiskBoardMatrixRenderer
} = require('./risk-board-matrix-layout');
const {
  createRiskBoardActionLayoutRenderers
} = require('./risk-board-action-layouts');
const {
  createRiskBoardTableRenderer
} = require('./risk-board-table-layout');

function createRiskBoardLayoutRenderers(ctx = {}) {
  assertRendererContext(ctx, ['risk'], { label:'risk renderer context' });
  const {
    variantOf
  } = ctx;
  const {
    drawLightPageHeader,
    drawRiskBoardFooter
  } = createPageFamilyPrimitives(ctx);

function drawRiskLightHeader(slide, s, idx, opts = {}) {
  const { fallbackTitle, chrome, ...header } = opts;
  const subtitle = Object.prototype.hasOwnProperty.call(opts, 'subtitle') ? opts.subtitle : (s.subtitle || s.claim);
  return drawLightPageHeader(slide, Object.assign(header, { title:s.title || fallbackTitle || '', subtitle, idx, pageNumber:chrome ? 'chrome' : header.pageNumber }));
}

const governanceRenderers = createRiskBoardGovernanceLayoutRenderers(ctx, {
  drawRiskBoardFooter,
  drawRiskLightHeader
});
const riskMatrixSlide = createRiskBoardMatrixRenderer(ctx, {
  drawRiskBoardFooter,
  drawRiskLightHeader
});
const {
  riskControlStack,
  riskActionLoop
} = createRiskBoardActionLayoutRenderers(ctx, {
  drawRiskBoardFooter,
  drawRiskLightHeader
});
const riskTable = createRiskBoardTableRenderer(ctx, {
  drawRiskBoardFooter,
  drawRiskLightHeader
});

function riskAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'governance-board');
  if (variant === 'materiality-matrix-board') return governanceRenderers.materialityMatrixBoard(slide, plan, s, idx);
  if (variant === 'guidance-and-risk-board') return governanceRenderers.guidanceAndRiskBoard(slide, plan, s, idx);
  if (variant === 'governance-table-editorial') return governanceRenderers.governanceTableEditorial(slide, plan, s, idx);
  if (variant === 'risk-matrix') return riskMatrixSlide(slide, plan, s, idx);
  if (variant === 'control-stack') return riskControlStack(slide, plan, s, idx);
  if (['manufacturing-action-loop', 'healthcare-quality-loop', 'saas-governance-loop', 'generic-action-loop'].includes(variant)) {
    return riskActionLoop(slide, plan, s, idx);
  }
  return riskTable(slide, plan, s, idx);
}

  return Object.assign({
    riskAdaptive,
    riskControlStack,
    riskMatrixSlide,
    riskActionLoop,
    riskTable
  }, governanceRenderers);
}

module.exports = {
  createRiskBoardLayoutRenderers
};
