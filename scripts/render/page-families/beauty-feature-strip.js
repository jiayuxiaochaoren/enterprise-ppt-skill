const {
  productItems
} = require('./beauty-product-data');

function createFeatureStripRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    designForSlide,
    fileExists,
    genericShowcaseField,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function renderFeatureStrip(slide, plan, s, idx) {
    const items = productItems(s);
    const design = designForSlide(plan, s, 'product');
    drawLightPageHeader(slide, {
      kicker:'PRODUCT SYSTEM',
      title:s.title || '产品与能力展示',
      titleW:5.9,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.2,
      idx
    });
    const visualPanel = { x:0.92, y:2.08, w:5.38, h:3.40 };
    if (design.imagePath && fileExists(design.imagePath)) {
      addSmartPhotoPanel(slide, design.imagePath, visualPanel.x, visualPanel.y, visualPanel.w, visualPanel.h, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:22 });
      addRect(slide, visualPanel.x, visualPanel.y+visualPanel.h-0.56, visualPanel.w, 0.56, C.ink, C.ink, { fill:{color:C.ink, transparency:10}, line:{color:C.ink, transparency:100} });
      addLabel(slide, 'INSPECTABLE OBJECT', { x:visualPanel.x+0.28, y:visualPanel.y+visualPanel.h-0.34, w:1.42, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
      addText(slide, (s.visual && s.visual.caption) || '设备对象保持可检查比例，避免把现场图压成装饰横条。', { x:visualPanel.x+1.92, y:visualPanel.y+visualPanel.h-0.34, w:2.78, h:0.11, fontSize:6.4, color:'CBD5E1', fit:'shrink' });
    } else {
      genericShowcaseField(slide, visualPanel.x, visualPanel.y, visualPanel.w, visualPanel.h, 'INSPECTABLE OBJECT');
    }
    items.slice(0,4).forEach((it,i)=>{
      const x = 6.76 + (i%2)*2.48;
      const y = 2.12 + Math.floor(i/2)*1.62;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, y, 2.16, 1.16, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.48} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.26, w:0.34, h:0.12, fontSize:7.0, color:accent });
      addText(slide, itemTitle(it, `能力 ${i+1}`), { x:x+0.68, y:y+0.20, w:1.12, h:0.15, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.22, y:y+0.66, w:1.62, h:0.20, fontSize:7.2, color:C.body, fit:'shrink' });
    });
    addText(slide, s.note || '产品展示页优先让对象可被看清，再用少量卖点解释价值。', { x:0.94, y:6.42, w:8.0, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFeatureStripRenderer
};
