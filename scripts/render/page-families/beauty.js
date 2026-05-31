const family = 'beauty';

const types = [
  'product-showcase'
];

function productItems(s = {}) {
  if (Array.isArray(s.products)) return s.products;
  if (Array.isArray(s.cards)) return s.cards;
  if (Array.isArray(s.items)) return s.items.map(v => typeof v === 'string' ? { title:v } : v);
  return [];
}

function productBreakdownItems(s = {}, items = []) {
  const raw = s.features || s.sellingPoints || s.breakdown || s.proofPoints || items;
  return (Array.isArray(raw) ? raw : []).map(v => typeof v === 'string' ? { title:v } : v).filter(Boolean);
}

function createBeautyRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    PageNumber,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    chooseFourImageLayout,
    designForSlide,
    fileExists,
    footerText,
    genericShowcaseField,
    imagePathFromItem,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker,
    variantOf
  } = ctx;

  function productShowcase(slide, plan, s, idx) {
    const variant = variantOf(s, 'hero-object');
    const items = productItems(s);
    const product = s.product || items[0] || {};
    const design = designForSlide(plan, s, 'product');

    if (variant === 'catalog-grid') {
      lightCanvas(slide);
      sectionKicker(slide, 'PRODUCT LINEUP', 0.86, 0.72, false);
      addText(slide, s.title || '产品组合展示', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
      if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.4, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
      addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
      const productList = items.slice(0,8);
      if (productList.length === 4) {
        const imagePaths = productList.map(it => imagePathFromItem(it)).filter(p => p && fileExists(p));
        const catalogLayout = chooseFourImageLayout(imagePaths, {
          role:'product',
          layout:s.catalogLayout || s.imageLayout,
          featured: !!(productList[0] && (productList[0].featured || productList[0].hero))
        });
        if (imagePaths.length >= 3 && catalogLayout === 'grid-2x2') {
          const slots = [
            { x:0.92, y:2.02, w:5.08, h:1.86 },
            { x:6.36, y:2.02, w:5.08, h:1.86 },
            { x:0.92, y:4.18, w:5.08, h:1.86 },
            { x:6.36, y:4.18, w:5.08, h:1.86 }
          ];
          productList.forEach((it,i)=>{
            const slot = slots[i];
            const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
            const img = imagePathFromItem(it);
            addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, {
              fill:{color:panelFill(), transparency:0},
              line:{color:i===0 ? accent : C.line, transparency:i===0 ? 18 : 16, width:0.46}
            });
            if (img && fileExists(img)) {
              addSmartPhotoPanel(slide, img, slot.x+0.14, slot.y+0.14, 2.18, slot.h-0.28, {
                role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26
              });
            } else {
              genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, 2.18, slot.h-0.28, `PRODUCT ${i+1}`);
            }
            addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+2.58, y:slot.y+0.36, w:0.30, h:0.10, fontSize:6.8, color:accent });
            addText(slide, itemTitle(it, `产品 ${i+1}`), { x:slot.x+3.00, y:slot.y+0.30, w:1.44, h:0.16, fontSize:10.8, bold:true, color:C.text, fit:'shrink' });
            addText(slide, itemBody(it), { x:slot.x+3.00, y:slot.y+0.78, w:1.52, h:0.28, fontSize:8.2, color:C.body, fit:'shrink', breakLine:true });
          });
          addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.42, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
          addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
          return;
        }
        const lead = productList[0];
        const leadImg = imagePathFromItem(lead, design.imagePath || '');
        const leadBox = { x:0.92, y:2.04, w:4.70, h:3.96 };
        addRect(slide, leadBox.x, leadBox.y, leadBox.w, leadBox.h, panelFill(), C.line, {
          fill:{color:panelFill(), transparency:0},
          line:{color:C.accent, transparency:22, width:0.52}
        });
        if (leadImg && fileExists(leadImg)) {
          addSmartPhotoPanel(slide, leadImg, leadBox.x+0.18, leadBox.y+0.18, leadBox.w-0.36, 2.34, {
            role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24
          });
        } else {
          genericShowcaseField(slide, leadBox.x+0.18, leadBox.y+0.18, leadBox.w-0.36, 2.34, 'PRIMARY PRODUCT');
        }
        addLabel(slide, 'PRIMARY PRODUCT', { x:leadBox.x+0.28, y:leadBox.y+2.78, w:1.42, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
        addText(slide, itemTitle(lead, '核心产品'), { x:leadBox.x+0.28, y:leadBox.y+3.08, w:1.82, h:0.18, fontSize:12.4, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemBody(lead), { x:leadBox.x+2.24, y:leadBox.y+3.06, w:1.86, h:0.22, fontSize:8.8, color:C.body, fit:'shrink' });

        productList.slice(1).forEach((it,i)=>{
          const x = 6.14;
          const y = 2.04 + i*1.28;
          const accent = i===0 ? C.cyan : (i===1 ? C.violet : '94A3B8');
          const img = imagePathFromItem(it);
          addRect(slide, x, y, 5.42, 1.02, panelFill(), C.line, {
            fill:{color:panelFill(), transparency:0},
            line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46}
          });
          if (img && fileExists(img)) {
            addSmartPhotoPanel(slide, img, x+0.16, y+0.16, 1.26, 0.70, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
          } else {
            addNumber(slide, String(i+2).padStart(2,'0'), { x:x+0.28, y:y+0.38, w:0.34, h:0.12, fontSize:7.2, color:accent });
            addHairline(slide, x+0.82, y+0.52, 0.52, accent, 20, 0.45);
          }
          addText(slide, itemTitle(it, `产品 ${i+2}`), { x:x+1.62, y:y+0.26, w:1.42, h:0.16, fontSize:10.4, bold:true, color:C.text, fit:'shrink' });
          addText(slide, itemBody(it), { x:x+3.20, y:y+0.23, w:1.62, h:0.22, fontSize:8.8, color:C.body, fit:'shrink' });
        });
        addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.42, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
        addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
        return;
      }
      const compact = productList.length <= 6;
      const cardW = compact ? 3.02 : 2.42;
      const cardH = compact ? 1.70 : 1.68;
      const slots = compact
        ? productList.map((_, i) => {
          const row = Math.floor(i / 3);
          const inRow = row === 0 ? Math.min(3, productList.length) : productList.length - 3;
          const rowStart = inRow === 1 ? 5.12 : (inRow === 2 ? 3.42 : 1.72);
          return [rowStart + (i % 3) * 3.48, 2.16 + row * 2.16];
        })
        : [
          [0.92,2.16], [3.74,2.16], [6.56,2.16], [9.38,2.16],
          [0.92,4.48], [3.74,4.48], [6.56,4.48], [9.38,4.48]
        ];
      productList.forEach((it,i)=>{
        const [x,y] = slots[i];
        const img = imagePathFromItem(it);
        addRect(slide, x, y, cardW, cardH, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.45} });
        if (img && fileExists(img)) addSmartPhotoPanel(slide, img, x+0.12, y+0.12, cardW-0.24, 0.82, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:30 });
        else addRect(slide, x+0.12, y+0.12, cardW-0.24, 0.82, C.panelAlt || C.softBlue, C.panelAlt || C.softBlue, { fill:{color:C.panelAlt || C.softBlue, transparency:4}, line:{color:C.line, transparency:100} });
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
        addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:y+1.12, w:0.28, h:0.10, fontSize:6.4, color:accent });
        addText(slide, itemTitle(it, `产品 ${i+1}`), { x:x+0.58, y:y+1.07, w:cardW-1.02, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemBody(it), { x:x+0.58, y:y+1.36, w:cardW-1.00, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
      });
      addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.62, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
      return;
    }

    if (variant === 'feature-strip') {
      lightCanvas(slide);
      sectionKicker(slide, 'PRODUCT SYSTEM', 0.86, 0.72, false);
      addText(slide, s.title || '产品与能力展示', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
      if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
      addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
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
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
      return;
    }

    lightCanvas(slide);
    sectionKicker(slide, 'PRODUCT HERO', 0.86, 0.72, false);
    addText(slide, s.title || itemTitle(product, '核心产品展示'), { x:0.84, y:1.05, w:5.6, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || itemBody(product), { x:0.86, y:1.52, w:6.2, h:0.22, fontSize:10.0, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);

    const hero = { x:0.92, y:2.00, w:6.18, h:3.78 };
    if (design.imagePath && fileExists(design.imagePath)) {
      addSmartPhotoPanel(slide, design.imagePath, hero.x, hero.y, hero.w, hero.h, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:20 });
    } else {
      genericShowcaseField(slide, hero.x, hero.y, hero.w, hero.h, 'INSPECTABLE OBJECT');
    }
    addRect(slide, hero.x, hero.y+hero.h-0.72, hero.w, 0.72, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
    addLabel(slide, (s.visual && s.visual.captionLabel) || 'VISUAL PROOF', { x:hero.x+0.28, y:hero.y+hero.h-0.42, w:1.10, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, (s.visual && s.visual.caption) || '产品对象保持可检查比例，图片不承载正文。', { x:hero.x+1.66, y:hero.y+hero.h-0.43, w:3.42, h:0.12, fontSize:7.0, color:'CBD5E1', fit:'shrink' });

    const side = { x:7.62, y:2.00, w:3.78, h:3.78 };
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'POSITIONING', { x:side.x+0.32, y:side.y+0.36, w:1.12, h:0.11, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(product, s.productName || '核心产品'), { x:side.x+0.32, y:side.y+0.84, w:2.58, h:0.26, fontSize:17.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(product, s.productBody || '把产品对象、关键卖点和适用场景分层呈现。'), { x:side.x+0.32, y:side.y+1.34, w:2.70, h:0.52, fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true });

    const metrics = (s.metrics || product.metrics || []).slice(0,2);
    metrics.forEach((m,i)=>{
      const x = side.x + 0.32 + i*1.48;
      addNumber(slide, m.value || m.title || '-', { x, y:side.y+2.26, w:1.12, h:0.28, fontSize:22, color:i===0?C.accent:C.cyan, fit:'shrink' });
      addText(slide, m.label || m.body || '', { x, y:side.y+2.78, w:1.18, h:0.12, fontSize:7.0, color:'A8B3C3', fit:'shrink' });
    });
    addHairline(slide, side.x+0.32, side.y+3.24, 0.82, C.accent, 0, 0.62);
    addText(slide, s.tagline || product.tagline || '单品页先让对象成立，再解释为什么值得买/用/接入。', { x:side.x+0.32, y:side.y+3.48, w:2.62, h:0.14, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });

    const breakdown = productBreakdownItems(s, items);
    (breakdown.length ? breakdown : [{ title:'卖点', body:'客户能直接理解。' }, { title:'场景', body:'对应明确使用对象。' }, { title:'证据', body:'配合数据或案例证明。' }]).slice(0,3).forEach((it,i)=>{
      const x = 0.92 + i*3.48;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, 6.02, 3.04, 0.58, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?20:16, width:0.40} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.20, y:6.22, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `卖点 ${i+1}`), { x:x+0.64, y:6.15, w:0.86, h:0.13, fontSize:8.0, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+1.62, y:6.15, w:1.00, h:0.13, fontSize:6.8, color:C.body, fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    productShowcase
  };
}

function entries(renderers = {}) {
  return [
    { types:['product-showcase'], render:renderers.productShowcase, source:`page-family:${family}` }
  ];
}

module.exports = {
  createBeautyRenderers,
  family,
  types,
  entries
};
