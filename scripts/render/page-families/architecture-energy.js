const { createPageFamilyPrimitives } = require('./primitives');
const {
  createEnergyTopologyDrawer
} = require('./architecture-energy-topology');

function createArchitectureEnergyRenderers(ctx = {}) {
  const C = ctx.colors();
  const { drawDarkPageHeader, drawFooter } = createPageFamilyPrimitives(ctx);
  const {
    addDarkBreathingCircle
  } = ctx;
  const {
    drawEnergyTopology
  } = createEnergyTopologyDrawer(ctx);

  function energyArchitecture(slide, plan, s, idx) {
    drawDarkPageHeader(slide, {
      kicker:'ENERGY TOPOLOGY',
      title:s.title,
      titleFit:false,
      subtitle:s.subtitle,
      subtitleY:1.52,
      subtitleW:6.2,
      subtitleH:0.22,
      subtitleSize:10.8,
      subtitleFit:false,
      idx,
      stageOpts:{ field:false },
      pageNumberOpts:{ color:'64748B' }
    });
    addDarkBreathingCircle(slide, 8.62, 0.74, 4.05, 2.22, C.violet);
    drawEnergyTopology(slide, s);
    drawFooter(slide, plan, { color:'64748B' });
  }

  return {
    energyArchitecture
  };
}

module.exports = {
  createArchitectureEnergyRenderers
};
