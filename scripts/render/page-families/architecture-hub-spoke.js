function createArchitectureHubSpokeRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;
  const {
    drawDarkPageHeader,
    drawFooter
  } = deps;

  return function architectureHubSpoke(slide, plan, s, idx) {
    drawDarkPageHeader(slide, {
      kicker:'CONNECTED ARCHITECTURE',
      title:s.title || '协同架构',
      titleY:1.08,
      titleW:5.9,
      subtitle:s.subtitle || s.claim,
      subtitleY:1.55,
      subtitleW:5.5,
      subtitleH:0.22,
      subtitleSize:10.6,
      idx
    });
    const nodes = s.nodes || s.hubs || (s.layers || []).map(l => ({ title:l.title, body:(l.items || []).slice(0,3).join(' / ') }));
    const cx = 6.68, cy = 3.78;
    addRect(slide, cx-1.04, cy-0.56, 2.08, 1.12, C.ink, C.accent, { fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:22, width:0.56} });
    addText(slide, s.centerTitle || '统一平台核心', { x:cx-0.70, y:cy-0.20, w:1.40, h:0.16, fontSize:10.4, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'DATA · PROCESS · GOVERNANCE', { x:cx-0.86, y:cy+0.14, w:1.72, h:0.09, fontSize:5.4, color:'64748B', align:'center', charSpace:0.55 });
    const pos = [
      [2.00,2.18], [5.02,2.06], [8.74,2.18],
      [9.10,4.98], [5.14,5.28], [1.92,4.98]
    ];
    nodes.slice(0,6).forEach((n, i) => {
      const [x, y] = pos[i];
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8'));
      slide.addShape('line', { x:cx, y:cy, w:x+0.88-cx, h:y+0.40-cy, line:{color:accent, transparency:62, width:0.34} });
      addRect(slide, x, y, 1.76, 0.80, C.ink2, '334155', { fill:{color:C.ink2, transparency:i === 0 ? 20 : 38}, line:{color:accent, transparency:i === 0 ? 24 : 58, width:0.42} });
      addNumber(slide, String(i+1).padStart(2, '0'), { x:x+0.18, y:y+0.22, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, itemTitle(n, `节点 ${i+1}`), { x:x+0.54, y:y+0.16, w:0.94, h:0.13, fontSize:8.5, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(n), { x:x+0.18, y:y+0.47, w:1.24, h:0.12, fontSize:6.6, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    addText(slide, s.note || '多角色、多系统、多区域之间的协同关系在同一网络中展开。', { x:0.90, y:6.42, w:7.60, h:0.16, fontSize:8.5, color:C.darkMuted || '94A3B8', fit:'shrink' });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createArchitectureHubSpokeRenderer
};
