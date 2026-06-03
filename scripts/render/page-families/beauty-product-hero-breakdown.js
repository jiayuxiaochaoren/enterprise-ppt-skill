const {
  productBreakdownItems
} = require('./beauty-product-data');

function createBeautyProductHeroBreakdown(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawProductHeroBreakdown(slide, s, items) {
    const breakdown = productBreakdownItems(s, items);
    (breakdown.length ? breakdown : [{ title:'卖点', body:'客户能直接理解。' }, { title:'场景', body:'对应明确使用对象。' }, { title:'证据', body:'配合数据或案例证明。' }]).slice(0,3).forEach((it,i)=>{
      const x = 0.92 + i*3.48;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, 6.02, 3.04, 0.58, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?20:16, width:0.40} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.20, y:6.22, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `卖点 ${i+1}`), { x:x+0.64, y:6.15, w:0.86, h:0.13, fontSize:8.0, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+1.62, y:6.15, w:1.00, h:0.13, fontSize:6.8, color:C.body, fit:'shrink' });
    });
  }

  return {
    drawProductHeroBreakdown
  };
}

module.exports = {
  createBeautyProductHeroBreakdown
};
