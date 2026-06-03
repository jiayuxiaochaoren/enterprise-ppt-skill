function timelineClosedLoopPhases(s = {}) {
  const phases = (s.phases || []).slice(0,4).map(p => typeof p === 'string' ? { title:p } : (p || {}));
  if (phases.length === 3) {
    phases.push({
      title: s.returnTitle || '复盘回流',
      body: (s.businessLogic && (s.businessLogic.action || s.businessLogic.metric)) || s.note || '复盘数据回到下一轮动作。'
    });
  }
  return phases;
}

module.exports = {
  timelineClosedLoopPhases
};
