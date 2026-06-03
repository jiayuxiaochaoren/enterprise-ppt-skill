const {
  energyTopologyColumns
} = require('./architecture-energy-data');
const {
  createEnergyTopologyBusRenderer
} = require('./architecture-energy-topology-bus');
const {
  createEnergyTopologyColumnRenderer
} = require('./architecture-energy-topology-column');

function createEnergyTopologyDrawer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;
  const { drawOperatingDataBus } = createEnergyTopologyBusRenderer(ctx);
  const { drawConnectors, drawTopologyColumn } = createEnergyTopologyColumnRenderer(ctx);

  function drawEnergyTopology(slide, s) {
    const columns = energyTopologyColumns(s, C);
    addRect(slide, 0.78, 2.04, 11.48, 4.26, C.ink2, '334155', { fill:{color:C.ink2, transparency:68}, line:{color:'334155', transparency:74, width:0.36} });
    addLabel(slide, 'REAL-TIME DATA FLOW', { x:1.08, y:2.32, w:1.70, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:1.0 });
    addLabel(slide, 'EDGE  →  DATA  →  DISPATCH  →  MANAGEMENT', { x:7.56, y:2.32, w:3.70, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:0.85, align:'right' });

    const y = 2.92;
    const h = 1.66;
    const connectorLayer = [];
    columns.forEach((column, i) => drawTopologyColumn(slide, column, i, y, h, connectorLayer));
    drawConnectors(slide, connectorLayer);
    drawOperatingDataBus(slide, columns);
  }

  return {
    drawEnergyTopology
  };
}

module.exports = {
  createEnergyTopologyDrawer
};
