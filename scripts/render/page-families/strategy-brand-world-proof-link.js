function createBrandWorldProofLinkRenderer(ctx = {}) {
  const C = ctx.colors();

  function metricLabel(metric = {}) {
    if (typeof metric === 'string') return metric;
    return [metric.value, metric.label || metric.title].filter(Boolean).join(' ');
  }

  function drawBrandWorldProofLink(slide, s = {}, metrics = []) {
    const proof = s.proof || {};
    const caption = proof.explanation || s.proofLink || s.note || '品牌世界观必须解释产品承诺如何转成渠道、会员和复购证据。';
    const list = (metrics || []).slice(0, 3);
    ctx.addRect(slide, 0.92, 6.28, 10.86, 0.42, C.panelAlt || C.softBlue, C.line, { fill:{ color:C.panelAlt || C.softBlue, transparency:12 }, line:{ color:C.line, transparency:100 } });
    ctx.addLabel(slide, 'PROOF LINK', { x:1.16, y:6.42, w:0.94, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, caption, { x:2.32, y:6.40, w:list.length ? 4.48 : 8.60, h:0.11, fontSize:7.4, color:C.body, fit:'shrink' });
    list.forEach((metric, i) => {
      const x = 6.96 + i * 1.08;
      ctx.addRect(slide, x, 6.38, 0.88, 0.20, i === 0 ? C.ink : 'FFFFFF', i === 0 ? C.accent : C.line, {
        fill:{ color:i === 0 ? C.ink : 'FFFFFF', transparency:0 },
        line:{ color:i === 0 ? C.accent : C.line, transparency:i === 0 ? 18 : 20, width:0.30 }
      });
      ctx.addText(slide, metricLabel(metric), {
        x:x + 0.06, y:6.43, w:0.76, h:0.08,
        fontSize:5.5, bold:i === 0, color:i === 0 ? C.white : C.body, fit:'shrink', align:'center'
      });
    });
  }

  return {
    drawBrandWorldProofLink
  };
}

module.exports = {
  createBrandWorldProofLinkRenderer
};
