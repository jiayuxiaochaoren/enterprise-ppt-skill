function riskResponsibilityItems(s = {}) {
  const raw = s.responsibilities || s.owners || s.raci || s.accountabilities || s.actions || s.rows || [];
  const list = (Array.isArray(raw) ? raw : []).map((v, i) => {
    if (Array.isArray(v)) {
      return {
        title: v[0],
        level: v[1],
        body: v[2],
        owner: v[3] || ['责任人', '审批人', '执行人', '复盘人'][i % 4],
        cadence: v[4] || ''
      };
    }
    if (typeof v === 'string') return { title:v };
    return v || {};
  }).filter(Boolean);
  return list.length ? list : [
    { title:'定责', owner:'责任人', body:'明确唯一责任人与协作边界。', cadence:'启动即确认' },
    { title:'处置', owner:'执行人', body:'按等级和时限推进控制动作。', cadence:'过程跟踪' },
    { title:'留痕', owner:'记录人', body:'沉淀过程记录和审批记录。', cadence:'节点留存' },
    { title:'复盘', owner:'Review', body:'回看风险变化并更新机制。', cadence:'周期复盘' }
  ];
}

module.exports = {
  riskResponsibilityItems
};
