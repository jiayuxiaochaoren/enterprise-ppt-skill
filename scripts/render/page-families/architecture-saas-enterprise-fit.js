function createSaasEnterpriseFitPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawEnterpriseFit(slide, s, dataLayer, integrationLayer) {
    const right = { x:8.92, y:2.08, w:2.82, h:4.10 };
    addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'ENTERPRISE FIT', { x:right.x+0.26, y:right.y+0.32, w:1.30, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    const proofRows = [
      { title:'入口', body:(integrationLayer.items || ['Web App', 'Admin Console', 'API']).slice(0,3).join(' / ') },
      { title:'数据', body:(dataLayer.items || ['客户数据', '事件流', '审计日志']).slice(0,3).join(' / ') },
      { title:'治理', body:(s.governance || ['SSO', '权限模型', '审计']).slice(0,3).join(' / ') }
    ];
    proofRows.forEach((row, i) => {
      const y = right.y + 0.88 + i*0.86;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addText(slide, row.title, { x:right.x+0.28, y:y, w:0.42, h:0.14, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, row.body, { x:right.x+0.78, y:y-0.02, w:1.68, h:0.18, fontSize:8.8, color:C.text, fit:'shrink' });
      addHairline(slide, right.x+0.28, y+0.42, 2.14, C.line, 20, 0.34);
    });
    addRect(slide, right.x+0.28, right.y+3.42, 2.10, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    addText(slide, s.footerNote || '解释采用与扩展收入。', { x:right.x+0.40, y:right.y+3.48, w:1.92, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
  }

  return {
    drawEnterpriseFit
  };
}

module.exports = {
  createSaasEnterpriseFitPanel
};
