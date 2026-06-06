const {
  findMetric
} = require('./financial-scorecard-primitives');
const {
  createManufacturingMaintenanceSignals
} = require('./financial-scorecard-manufacturing-signals');
const {
  createManufacturingOeeDecomposition
} = require('./financial-scorecard-manufacturing-decomposition');
const {
  createManufacturingPrimaryOee
} = require('./financial-scorecard-manufacturing-primary');

function createManufacturingOeeBoard(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addText,
  } = ctx;
  const {
    drawFooter,
    drawScorecardHeader
  } = deps;
  const { renderMaintenanceSignals } = createManufacturingMaintenanceSignals(ctx);
  const { renderOeeDecomposition } = createManufacturingOeeDecomposition(ctx);
  const { renderPrimaryOee } = createManufacturingPrimaryOee(ctx);

  return function manufacturingOeeBoard(slide, plan, s, idx) {
    drawScorecardHeader(slide, s, idx, {
      kicker:'OEE / LINE READOUT',
      title:'OEE 与产线效率复盘',
      titleW:5.9,
      subtitle:'把稼动、节拍、良率、停机和维修动作放到同一张产线复盘页。',
      subtitleW:7.0,
      subtitleSize:10.2
    });

    const metrics = (s.metrics || []).slice(0,4);
    const primary = findMetric(metrics, /OEE|设备效率|產線|产线/i, 0);
    const maintenance = findMetric(metrics, /响应|維修|维修|MTTR|停机|停線|重复/i, 1);
    const quality = findMetric(metrics, /良率|质量|品質|重复|返工/i, 2);
    const rawComponents = s.oeeComponents || s.oee || [
      { label:'稼动率', value:'92%', body:'停机窗口和换线等待进入复盘。' },
      { label:'性能率', value:'84%', body:'节拍波动和瓶颈工位可被识别。' },
      { label:'良率', value:'97%', body:'返工、报废和质量异常绑定工单。' }
    ];
    const components = (Array.isArray(rawComponents) ? rawComponents : Object.entries(rawComponents).map(([label, value]) => ({
      label,
      value
    }))).slice(0,3);

    renderPrimaryOee(slide, primary);
    renderOeeDecomposition(slide, components);
    renderMaintenanceSignals(slide, maintenance, quality);
    addText(slide, s.note || 'OEE 拆解和维修闭环同屏呈现，形成从损失到动作的证据链。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createManufacturingOeeBoard
};
