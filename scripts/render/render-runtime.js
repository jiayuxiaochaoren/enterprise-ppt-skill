const { createRendererContext } = require('./renderer-context');
const { createSlideRenderRegistry } = require('./page-family-registry');
const { createArchitectureRenderers } = require('./page-families/architecture');
const { createBeautyRenderers } = require('./page-families/beauty');
const { createBusinessRenderers } = require('./page-families/business');
const { createChapterRenderers } = require('./page-families/chapter');
const { createClosingRenderers } = require('./page-families/closing');
const { createCoverRenderers } = require('./page-families/cover');
const { createEvidenceGalleryRenderers } = require('./page-families/evidence-gallery');
const { createFinancialRenderers } = require('./page-families/financial');
const { createGeneralRenderers } = require('./page-families/general');
const { createManifestoRenderers } = require('./page-families/manifesto');
const { createProfileRenderers } = require('./page-families/profile');
const { createRiskRenderers } = require('./page-families/risk');
const { createStrategyRenderers, createStrategyEvidenceRenderers } = require('./page-families/strategy');
const { createTimelineRenderers } = require('./page-families/timeline');
const { createTocRenderers } = require('./page-families/toc');
const { createEnergyIndustryRenderers } = require('./industry/energy');
const { createFallbackRenderers } = require('./fallback-renderer');

function createRenderRuntime(baseRendererApi = {}) {
  let runtime = null;

  function build() {
    if (runtime) return runtime;
    const strategyEvidenceRenderers = createStrategyEvidenceRenderers(createRendererContext(baseRendererApi));
    const baseRendererContext = createRendererContext(Object.assign({}, baseRendererApi, strategyEvidenceRenderers));
    const evidenceGalleryRenderers = createEvidenceGalleryRenderers(baseRendererContext);
    const rendererContext = createRendererContext(Object.assign({},
      baseRendererApi,
      strategyEvidenceRenderers,
      evidenceGalleryRenderers
    ));
    const energyIndustryRenderers = createEnergyIndustryRenderers(rendererContext);
    const fallbackRenderers = createFallbackRenderers(rendererContext);
    const familyRenderers = Object.assign({},
      createBusinessRenderers(rendererContext),
      createBeautyRenderers(rendererContext),
      createChapterRenderers(rendererContext),
      createFinancialRenderers(rendererContext),
      createGeneralRenderers(rendererContext),
      createClosingRenderers(rendererContext),
      createCoverRenderers(rendererContext),
      createArchitectureRenderers(rendererContext),
      createManifestoRenderers(rendererContext),
      createProfileRenderers(rendererContext),
      strategyEvidenceRenderers,
      evidenceGalleryRenderers,
      createRiskRenderers(rendererContext),
      createStrategyRenderers(rendererContext),
      createTimelineRenderers(rendererContext),
      createTocRenderers(rendererContext),
      fallbackRenderers
    );
    const industryRenderers = {
      energyArchitecture: familyRenderers.energyArchitecture,
      ...energyIndustryRenderers
    };
    runtime = {
      evidenceGalleryRenderers,
      familyRenderers,
      industryRenderers,
      rendererContext,
      registry:createSlideRenderRegistry(familyRenderers)
    };
    return runtime;
  }

  function industryRendererFor(plan = {}, s = {}) {
    const role = baseRendererApi.designForSlide(plan, s).role;
    const rendererName = ((baseRendererApi.industryProfile(plan).layoutOverrides || {})[role]);
    if (!rendererName) return null;
    return build().industryRenderers[rendererName] || null;
  }

  function industryRendererMatchFor(plan = {}, s = {}, requestedType = '') {
    const render = industryRendererFor(plan, s);
    if (!render) return null;
    return {
      requestedType,
      matchedType: requestedType,
      matchKind:'industry-override',
      rendererId:`industry:${render.name || requestedType || 'renderer'}`,
      rendererName:render.name || 'anonymousIndustryRenderer',
      source:'industry-layout-override',
      render
    };
  }

  return {
    getFamilyRenderers: () => build().familyRenderers,
    getIndustryRenderers: () => build().industryRenderers,
    getRendererContext: () => build().rendererContext,
    industryRendererFor,
    industryRendererMatchFor,
    slideRenderRegistry: () => build().registry
  };
}

module.exports = {
  createRenderRuntime
};
