const ENERGY_TOPOLOGY_XS = [1.08, 3.82, 6.58, 9.42];
const ENERGY_TOPOLOGY_WIDTHS = [2.22, 2.28, 2.38, 2.08];

function energyTopologyDefaults(C = {}) {
  return [
    { label:'设备侧', title:'设备采集', items:['逆变器','PCS','BMS','电表'], body:'逆变器 / PCS / BMS / 电表', chips:['发电','储能','负荷'], accent:C.accent },
    { label:'数据侧', title:'统一数据底座', items:['协议适配','指标口径','历史曲线'], body:'协议适配、指标口径、历史曲线', chips:['接入','清洗','归集'], accent:C.cyan },
    { label:'调度侧', title:'告警工单与策略复盘', items:['告警分级','工单处置','SOC 策略'], body:'告警分级、派工处置、SOC 策略', chips:['告警','工单','策略'], accent:C.violet },
    { label:'管理侧', title:'区域运维驾驶舱', items:['多站点态势','收益波动','区域协同'], body:'多站点态势、收益波动、资源协同', chips:['态势','收益','协同'], accent:'94A3B8' }
  ];
}

function energyTopologyColumns(s = {}, C = {}) {
  const layerItems = Array.isArray(s.layers) ? s.layers.slice(0,4) : [];
  return energyTopologyDefaults(C).map((base, i) => {
    const raw = layerItems[i] || {};
    const items = raw.items || base.items;
    return Object.assign({}, base, {
      label: raw.name || raw.title || base.label,
      body: items.join(' / '),
      chips: items.slice(0,3),
      x: ENERGY_TOPOLOGY_XS[i],
      w: ENERGY_TOPOLOGY_WIDTHS[i]
    });
  });
}

module.exports = {
  energyTopologyColumns,
  energyTopologyDefaults
};
