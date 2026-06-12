function layerTitle(layer) {
  return String((layer && (layer.title || layer.name || layer.label)) || '').trim();
}

function layerItems(layer) {
  return Array.isArray(layer && layer.items)
    ? layer.items.map(v => typeof v === 'string' ? v : (v.title || v.name || v.label || '')).filter(Boolean)
    : [];
}

function resolveManufacturingTopologyLayers(s = {}) {
  const layers = Array.isArray(s.layers) ? s.layers : [];
  const hasLayerItems = layers.some(layer => layerItems(layer).length);
  const bulletTitles = layers.map(layerTitle).filter(Boolean);
  const access = hasLayerItems
    ? (layers[0] || { title:'设备与现场层', items:['PLC','传感器','点检终端','备件台账'] })
    : { title:'产品与工艺对象', items:(bulletTitles.length ? bulletTitles : ['非标输送设备','涂装设备','控制系统','现场安装调试']).slice(0, 5) };
  const apps = hasLayerItems
    ? (layers[1] || { title:'业务应用层', items:['设备健康','统一运营核心','维修工单','备件协同'] })
    : { title:'制造交付动作', items:['需求确认','加工制造','控制联调','现场安装'] };
  const data = hasLayerItems
    ? (layers[2] || { title:'数据支撑层', items:['设备库','故障库','工单库','备件库','OEE 指标'] })
    : { title:'证据与交付资料', items:['图纸参数','设备铭牌','调试记录','项目验收','服务反馈'] };

  return {
    access,
    apps,
    appItems:(layerItems(apps).length ? layerItems(apps) : ['需求确认','加工制造','控制联调','现场安装']).slice(0, 4),
    data,
    dataItems:(layerItems(data).length ? layerItems(data) : ['图纸参数','设备铭牌','调试记录','项目验收','服务反馈']).slice(0, 5),
    devices:(layerItems(access).length ? layerItems(access) : ['非标输送设备','涂装设备','控制系统','现场安装调试']).slice(0, 5)
  };
}

module.exports = {
  layerItems,
  layerTitle,
  resolveManufacturingTopologyLayers
};
