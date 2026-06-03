const {
  createPageFamilyPrimitives
} = require('./primitives');

function createHealthcareTouchpointEvidenceGalleryRenderer(ctx = {}, deps = {}) {
  const { drawEvidenceHeader } = deps;
  const C = ctx.colors();
  const {
    addArrowLine,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const {
    drawFooter
  } = createPageFamilyPrimitives(ctx);

  return function healthcareTouchpointEvidenceGallery(slide, plan, s, idx) {
    drawEvidenceHeader(slide, s, idx, {
      kicker:'SERVICE TOUCHPOINTS',
      title:'服务触点证据图册',
      subtitle:'把患者旅程、前台动作、后台资源和质量证据放到同一条服务链。',
      subtitleW:6.8
    });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const band = { x:0.92, y:2.04, w:10.72, h:3.96 };
    addRect(slide, band.x, band.y, band.w, band.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.44} });
    addLabel(slide, 'PATIENT JOURNEY READOUT', { x:band.x+0.30, y:band.y+0.28, w:1.74, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });

    const slots = [
      { x:1.22, title:'预约导诊', fallback:'入口体验', color:C.accent },
      { x:4.54, title:'检查协同', fallback:'资源等待', color:C.cyan },
      { x:7.86, title:'反馈处置', fallback:'问题闭环', color:C.violet }
    ];
    slots.forEach((slot,i)=>{
      const item = items[i] || { title:slot.title, body:i===0 ? '入口体验可视化。' : (i===1 ? '资源等待可追踪。' : '问题进入闭环。') };
      const y = 2.68;
      addRect(slide, slot.x, y, 2.68, 2.72, 'FFFFFF', C.line, { fill:{color:'FFFFFF', transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.38} });
      if (images[i]) addPhotoPanel(slide, images[i], slot.x+0.14, y+0.14, 2.40, 1.30, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:28, fit:'cover' });
      else genericShowcaseField(slide, slot.x+0.14, y+0.14, 2.40, 1.30, slot.fallback);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.22, y:y+1.76, w:0.28, h:0.10, fontSize:6.4, color:slot.color });
      addText(slide, itemTitle(item, slot.title), { x:slot.x+0.66, y:y+1.70, w:1.08, h:0.14, fontSize:8.9, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item), { x:slot.x+0.66, y:y+2.12, w:1.58, h:0.18, fontSize:8.8, color:C.body, fit:'shrink' });
      if (i < slots.length - 1) addArrowLine(slide, slot.x+2.78, y+1.36, 0.34, 0, slot.color, { transparency:22, width:0.34 });
    });

    const serviceLine = { x:1.22, y:5.58, w:9.32, h:0.26 };
    addRect(slide, serviceLine.x, serviceLine.y, serviceLine.w, serviceLine.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, '预约 · 到院 · 检查 · 随访 · 反馈', { x:serviceLine.x+0.28, y:serviceLine.y+0.07, w:3.40, h:0.09, fontSize:8.8, color:C.white, fit:'shrink' });
    addText(slide, '前台体验、后台排程和质量证据需要同屏复盘。', { x:serviceLine.x+5.16, y:serviceLine.y+0.07, w:3.38, h:0.09, fontSize:8.8, color:'CBD5E1', fit:'shrink', align:'right' });
    addText(slide, s.note || '图片承载服务情境，蓝图语言解释责任、触点和证据链。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createHealthcareTouchpointEvidenceGalleryRenderer
};
