const {
  createArchitectureManufacturingReadout
} = require('./architecture-manufacturing-readout');
const {
  resolveManufacturingTopologyLayers
} = require('./architecture-manufacturing-topology-data');

function createArchitectureManufacturingTopology(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;
  const drawManufacturingReadout = createArchitectureManufacturingReadout(ctx, C);

  return function architectureManufacturingTopology(slide, plan, s, idx) {
    const claim = s.claim || s.subtitle || '把设备接入、工单处置和指标复盘放进同一条产线证据链。';
    const header = drawLightPageHeader(slide, {
      kicker:'产线系统拓扑',
      title:s.title || '设备运维能力架构',
      titleW:5.9,
      titleSize:24,
      subtitle:claim,
      subtitleW:7.0,
      subtitleSize:10.0,
      idx
    });

    const topology = resolveManufacturingTopologyLayers(s);
    const contentY = Math.max(2.10, (Number(header && header.contentTop) || 2.08) + 0.08);
    const contentBottom = 6.12;
    const contentH = Math.max(3.42, Math.min(3.92, contentBottom - contentY));
    const side = { x:0.92, y:contentY, w:2.58, h:contentH };
    const board = { x:3.82, y:contentY, w:7.78, h:contentH };
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '产品谱系', { x:side.x+0.30, y:side.y+0.34, w:0.92, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    addText(slide, topology.access.title || '产品与工艺对象', { x:side.x+0.30, y:side.y+0.86, w:1.80, h:0.28, fontSize:14.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, '把产品、制造动作和交付资料放进同一张可读结构图，避免只画空框。', {
      x:side.x+0.30, y:side.y+1.52, w:1.82, h:0.62, fontSize:8.0, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, side.x+0.30, side.y+2.60, 0.82, C.accent, 0, 0.62);
    addText(slide, s.note || '统一产品口径 · 统一制造动作 · 统一交付证据', {
      x:side.x+0.30, y:side.y+2.92, w:1.82, h:0.34, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true
    });

    drawManufacturingReadout(slide, board, topology);

    const bottomBandY = Math.max(6.32, Math.min(6.48, contentY + contentH + 0.18));
    addRect(slide, 0.92, bottomBandY, 9.82, 0.28, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:0}, line:{color:C.line, transparency:100} });
    addText(slide, s.bottomLine || '产品对象、制造动作与交付资料保持一一对应，方便客户快速判断适配范围。', {
      x:1.12, y:bottomBandY+0.07, w:9.24, h:0.11, fontSize:7.2, color:C.body, fit:'shrink'
    });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createArchitectureManufacturingTopology
};
