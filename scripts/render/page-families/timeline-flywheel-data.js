function flywheelItems(s = {}) {
  const raw = s.flywheel || s.loopItems || s.phases || s.cards || s.items || [];
  const nodes = (Array.isArray(raw) ? raw : []).slice(0,6).map(v => typeof v === 'string' ? { title:v } : v);
  return nodes.length ? nodes : [
    { title:'触达', body:'建立入口' },
    { title:'转化', body:'形成动作' },
    { title:'留存', body:'沉淀关系' },
    { title:'复盘', body:'驱动下一轮' }
  ];
}

function flywheelLayout(items = []) {
  const cx = 6.58;
  const cy = 3.94;
  const nodeW = items.length <= 4 ? 2.02 : 1.72;
  const nodeH = 0.84;
  return {
    cx,
    cy,
    nodeH,
    nodeW,
    radiusX:3.02,
    radiusY:1.66
  };
}

module.exports = {
  flywheelItems,
  flywheelLayout
};
