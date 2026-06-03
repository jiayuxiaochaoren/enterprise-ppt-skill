function saasCapabilityData(s = {}) {
  const layers = Array.isArray(s.layers) ? s.layers : [];
  const explicit = s.platformCapabilities || s.capabilityMap || s.capabilities;
  const sourceCaps = Array.isArray(explicit) ? explicit : [];
  const businessLayer = layers.find(l => /业务|工作流|应用|workflow|application/i.test(l.title || l.name || '')) || layers[1] || {};
  const dataLayer = layers.find(l => /数据|事件|审计|data|event|audit/i.test(l.title || l.name || '')) || layers[2] || {};
  const integrationLayer = layers.find(l => /集成|入口|API|SSO|CRM|工单|integration|access/i.test(l.title || l.name || '')) || layers[3] || layers[0] || {};
  const fallbackCaps = (businessLayer.items || ['工作流', '自动化', '协同空间', '模板库'])
    .slice(0, 4)
    .map(title => ({ title, body:'进入核心使用路径。' }));
  const caps = (sourceCaps.length ? sourceCaps : fallbackCaps)
    .slice(0, 4)
    .map(v => typeof v === 'string' ? { title:v } : v);

  return {
    caps,
    dataLayer,
    integrationLayer,
    metrics: (s.metrics || []).slice(0, 3)
  };
}

module.exports = {
  saasCapabilityData
};
