const family = 'manifesto';

const types = ['manifesto'];

const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createCultureCoverSoftGeometry
} = require('./manifesto-culture-cover');
const {
  createCultureManifestoDefault
} = require('./manifesto-culture-default');
const {
  createValuePrincipleCards
} = require('./manifesto-value-principles');
const {
  createMissionStatementStage
} = require('./manifesto-mission-stage');

function createManifestoRenderers(ctx = {}) {
  const { variantOf } = ctx;
  const {
    drawDarkStageShell,
    drawFooter,
    drawLightPageHeader
  } = createPageFamilyPrimitives(ctx);
  const valuePrincipleCards = createValuePrincipleCards(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const missionStatementStage = createMissionStatementStage(ctx);
  const cultureManifestoDefault = createCultureManifestoDefault(ctx, {
    drawDarkStageShell,
    drawFooter
  });
  const cultureCoverSoftGeometry = createCultureCoverSoftGeometry(ctx, {
    drawDarkStageShell,
    drawFooter
  });

  function manifestoSlide(slide, plan, s, idx) {
    const manifestoVariant = variantOf(s, '');
    if (manifestoVariant === 'culture-cover-with-soft-geometry') return cultureCoverSoftGeometry(slide, plan, s, idx);
    if (manifestoVariant === 'mission-statement-stage') return missionStatementStage(slide, plan, s, idx);
    if (manifestoVariant === 'value-principle-cards') return valuePrincipleCards(slide, plan, s, idx);
    return cultureManifestoDefault(slide, plan, s, idx);
  }

  return {
    manifestoSlide
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.manifestoSlide, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createManifestoRenderers,
  entries
};
