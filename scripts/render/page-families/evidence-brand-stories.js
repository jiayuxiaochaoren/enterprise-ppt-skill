function createEvidenceBrandStoryRenderers(ctx = {}) {
  const {
    PageNumber,
    addHairline,
    addLabel,
    addLightBreathingCircle,
    addNumber,
    addPhotoPanel,
    addRect,
    addSmartPhotoPanel,
    addText,
    compactEvidenceCaption,
    footerText,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker,
    variantOf
  } = ctx;
  const C = ctx.colors();

  function retailLookbookStory(slide, plan, s, idx) {
    lightCanvas(slide);
    const variant = variantOf(s, 'lookbook-story');
    if (variant === 'consumer-proof-photo-grid') {
      sectionKicker(slide, 'CONSUMER PROOF GRID', 0.86, 0.72, false);
      addText(slide, s.title || '消费者场景证据', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
      const intro = s.subtitle || s.intro || s.claim || '把柜台、内容触点和会员反馈放进同一组证据栅格。';
      addText(slide, intro, { x:0.86, y:1.52, w:6.6, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
      addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

      const images = galleryImages(plan, s);
      const items = (s.lookbook || s.productStory || s.cards || s.items || []).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
      const insight = { x:0.92, y:2.06, w:3.20, h:3.86 };
      addRect(slide, insight.x, insight.y, insight.w, insight.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
      addLabel(slide, 'SHOPPER SIGNAL', { x:insight.x+0.30, y:insight.y+0.34, w:1.34, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
      addText(slide, s.storyTitle || '场景推动复购', { x:insight.x+0.30, y:insight.y+0.84, w:1.78, h:0.28, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
      addText(slide, s.storyBody || s.note || '消费者证据页要让图像承担证明作用：触点、理由、动作和复购信号彼此对应。', {
        x:insight.x+0.30, y:insight.y+1.54, w:2.14, h:0.74, fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true
      });
      addHairline(slide, insight.x+0.30, insight.y+2.72, 0.86, C.accent, 0, 0.62);
      ['SCENE', 'REASON', 'REPEAT'].forEach((label,i)=>{
        const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
        addRect(slide, insight.x+0.30+i*0.70, insight.y+3.16, 0.38, 0.10, color, color, { line:{color, transparency:100} });
        addText(slide, label, { x:insight.x+0.30+i*0.70, y:insight.y+3.34, w:0.48, h:0.10, fontSize:6.8, color:'94A3B8', align:'center', fit:'shrink' });
      });

      const slots = [
        { x:4.58, y:2.06, w:2.08, h:3.86, color:C.accent, label:'触点' },
        { x:6.96, y:2.06, w:2.08, h:3.86, color:C.cyan, label:'理由' },
        { x:9.34, y:2.06, w:2.08, h:3.86, color:C.violet, label:'复购' }
      ];
      slots.forEach((slot,i)=>{
        const item = items[i] || {};
        addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? slot.color : C.line, {
          fill:{color:panelFill(), transparency:0},
          line:{color:i===0 ? slot.color : C.line, transparency:i===0 ? 18 : 16, width:0.44}
        });
        if (images[i]) addSmartPhotoPanel(slide, images[i], slot.x+0.14, slot.y+0.14, slot.w-0.28, 1.92, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
        else genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, slot.w-0.28, 1.92, slot.label);
        addLabel(slide, slot.label, { x:slot.x+0.22, y:slot.y+2.34, w:0.54, h:0.09, fontSize:6.8, color:slot.color, charSpace:0 });
        addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+1.42, y:slot.y+2.28, w:0.30, h:0.10, fontSize:6.8, color:slot.color, align:'right' });
        addText(slide, itemTitle(item, `消费者证据 ${i+1}`), { x:slot.x+0.22, y:slot.y+2.70, w:1.36, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
        addText(slide, compactEvidenceCaption(itemBody(item), 24), { x:slot.x+0.22, y:slot.y+3.12, w:1.44, h:0.24, fontSize:7.3, color:C.body, fit:'shrink', breakLine:true });
      });
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
      return;
    }
    sectionKicker(slide, 'LOOKBOOK STORY', 0.86, 0.72, false);
    addText(slide, s.title || '产品故事与门店场景', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    const intro = s.subtitle || s.intro || s.claim || '把产品、空间、搭配和会员触达组织成一组可阅读的品牌故事。';
    addText(slide, intro, { x:0.86, y:1.52, w:6.4, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const images = galleryImages(plan, s);
    const storyItems = (s.lookbook || s.productStory || s.cards || s.items || []).slice(0,3).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = { x:0.92, y:2.04, w:5.38, h:4.10 };
    if (images[0]) {
      addPhotoPanel(slide, images[0], hero.x, hero.y, hero.w, hero.h, { tone:'dark', transparency:100, stroke:'E8DED8', strokeTransparency:12, fit:'cover' });
    } else {
      addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
      addLightBreathingCircle(slide, hero.x+3.20, hero.y+0.40, 1.92, C.softBlue, 36);
    }
    addRect(slide, hero.x, hero.y+hero.h-1.02, hero.w, 1.02, C.ink, C.ink, { fill:{color:C.ink, transparency:10}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY SCENE', { x:hero.x+0.30, y:hero.y+hero.h-0.70, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    const lead = storyItems[0] || { title:'核心产品故事', body:'用主图建立品牌语境，再用细节图和文案解释购买理由。' };
    addText(slide, itemTitle(lead, '核心产品故事'), { x:hero.x+0.30, y:hero.y+hero.h-0.40, w:1.92, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead), { x:hero.x+2.56, y:hero.y+hero.h-0.42, w:2.12, h:0.13, fontSize:6.8, color:'CBD5E1', fit:'shrink' });

    const small = [
      { x:6.70, y:2.04, w:2.12, h:1.66 },
      { x:9.24, y:2.04, w:2.12, h:1.66 }
    ];
    small.forEach((slot,i)=>{
      const item = storyItems[i+1] || {};
      if (images[i+1]) addPhotoPanel(slide, images[i+1], slot.x, slot.y, slot.w, slot.h, { tone:'light', transparency:100, stroke:'E4ECF5', strokeTransparency:14, fit:'cover' });
      else {
        addRect(slide, slot.x, slot.y, slot.w, slot.h, C.panelAlt || C.softBlue, C.line, {
          fill:{color:C.panelAlt || C.softBlue, transparency:10},
          line:{color:C.line, transparency:18, width:0.40}
        });
        addNumber(slide, String(i+2).padStart(2,'0'), {
          x:slot.x+0.22, y:slot.y+0.34, w:0.30, h:0.10,
          fontSize:6.6, color:i===0?C.cyan:C.violet
        });
        addHairline(slide, slot.x+0.22, slot.y+0.76, slot.w-0.44, i===0?C.cyan:C.violet, 28, 0.34);
        addText(slide, compactEvidenceCaption(itemTitle(item, i===0 ? '低压验证' : '退出条件'), 16), {
          x:slot.x+0.22, y:slot.y+0.98, w:slot.w-0.44, h:0.18,
          fontSize:7.4, bold:true, color:C.text, fit:'shrink', align:'center'
        });
        addText(slide, compactEvidenceCaption(itemBody(item), 22), {
          x:slot.x+0.22, y:slot.y+1.24, w:slot.w-0.44, h:0.22,
          fontSize:6.6, color:C.body, fit:'shrink', align:'center', breakLine:true
        });
      }
      addText(slide, String(i+2).padStart(2,'0'), { x:slot.x, y:slot.y+slot.h+0.18, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.cyan:C.violet });
      addText(slide, itemTitle(item, i===0 ? '搭配细节' : '空间触点'), { x:slot.x+0.44, y:slot.y+slot.h+0.12, w:1.24, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      if (itemBody(item)) addText(slide, itemBody(item), { x:slot.x+0.44, y:slot.y+slot.h+0.38, w:1.42, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
    });

    const narrative = { x:6.70, y:4.36, w:4.66, h:1.78 };
    addRect(slide, narrative.x, narrative.y, narrative.w, narrative.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'MERCHANDISING LOGIC', { x:narrative.x+0.30, y:narrative.y+0.34, w:1.68, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.storyTitle || '从视觉偏好到复购理由', { x:narrative.x+0.30, y:narrative.y+0.72, w:1.96, h:0.18, fontSize:12.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.storyBody || s.note || 'lookbook 页不是随机拼图，它要让顾客看到产品、搭配、空间和会员触达之间的关系。', { x:narrative.x+2.46, y:narrative.y+0.66, w:1.76, h:0.58, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    ['COLOR', 'TEXTURE', 'SCENE'].forEach((label,i)=>{
      const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, narrative.x+0.30+i*0.70, narrative.y+1.34, 0.38, 0.10, color, color, { line:{color, transparency:100} });
      addText(slide, label, { x:narrative.x+0.30+i*0.70, y:narrative.y+1.52, w:0.46, h:0.10, fontSize:5.6, color:'94A3B8', align:'center', fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  function peopleProofMosaic(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PEOPLE PROOF MOSAIC', 0.86, 0.72, false);
    addText(slide, s.title || '团队证据墙', { x:0.84, y:1.05, w:6.0, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '每个成员场景都需要角色、场景和产出 caption。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:9.6, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || []).slice(0, 4);
    const hero = { x:0.92, y:2.04, w:4.86, h:3.92 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (images[0]) addSmartPhotoPanel(slide, images[0], hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.62, { role:'evidence', tone:'light', transparency:100, stroke:'334155', strokeTransparency:44 });
    else genericShowcaseField(slide, hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.62, 'PEOPLE SCENE');
    const lead = items[0] || { title:'团队角色', body:'用场景图证明协作方式和产出。' };
    addLabel(slide, 'ROLE / SCENE / OUTPUT', { x:hero.x+0.30, y:hero.y+3.06, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, itemTitle(lead, '团队角色'), { x:hero.x+0.30, y:hero.y+3.36, w:1.42, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead, '证明协作方式和产出。'), { x:hero.x+2.08, y:hero.y+3.32, w:2.16, h:0.16, fontSize:7.0, color:C.captionOnImage, fit:'shrink' });

    const slots = [
      { x:6.24, y:2.04, w:2.36, h:1.72, color:C.cyan },
      { x:9.04, y:2.04, w:2.36, h:1.72, color:C.violet },
      { x:6.24, y:4.24, w:5.16, h:1.72, color:C.accent }
    ];
    slots.forEach((slot, i) => {
      const item = items[i + 1] || {};
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.38} });
      const imgW = i === 2 ? 1.72 : slot.w - 0.28;
      if (images[i + 1]) addSmartPhotoPanel(slide, images[i + 1], slot.x+0.14, slot.y+0.14, imgW, 0.96, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
      else genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, imgW, 0.96, 'TEAM PROOF');
      const textX = i === 2 ? slot.x + 2.12 : slot.x + 0.20;
      const textY = i === 2 ? slot.y + 0.28 : slot.y + 1.24;
      addNumber(slide, String(i + 2).padStart(2, '0'), { x:textX, y:textY+0.02, w:0.28, h:0.09, fontSize:6.0, color:slot.color });
      addText(slide, itemTitle(item, `团队证据 ${i+2}`), { x:textX+0.40, y:textY, w:i===2?1.18:1.24, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:'shrink' });
      if (i === 2) addText(slide, compactEvidenceCaption(itemBody(item), 22), { x:textX+1.76, y:textY, w:1.00, h:0.12, fontSize:6.6, color:C.body, fit:'shrink' });
      else addText(slide, compactEvidenceCaption(itemBody(item), 22), { x:slot.x+0.20, y:slot.y+1.48, w:1.64, h:0.10, fontSize:6.3, color:C.body, fit:'shrink' });
    });
    addText(slide, s.note || '人物图片必须证明角色、协作场景和产出，不做单纯氛围拼贴。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function sustainabilityProofSpread(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'SUSTAINABILITY PROOF SPREAD', 0.86, 0.72, false);
    addText(slide, s.title || '可持续证据展开页', { x:0.84, y:1.05, w:6.1, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '证据图像、影响指标、项目说明和来源必须成对出现。', { x:0.86, y:1.52, w:7.2, h:0.20, fontSize:9.6, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
    const metrics = (s.metrics || []).slice(0, 3);
    if (metrics.length >= 2) {
      const logic = s.businessLogic || {};
      const board = { x:0.92, y:2.08, w:10.72, h:3.78 };
      addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:C.line, transparency:14, width:0.48}
      });
      addRect(slide, board.x, board.y, 0.07, board.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
      const gap = 0.18;
      const cardW = (board.w - 0.74 - gap * 2) / 3;
      metrics.forEach((m, i) => {
        const x = board.x + 0.38 + i * (cardW + gap);
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
        addRect(slide, x, board.y+0.48, cardW, 2.72, i === 0 ? C.ink : C.panelAlt || C.softBlue, i === 0 ? accent : C.line, {
          fill:{color:i === 0 ? C.ink : (C.panelAlt || C.softBlue), transparency:i === 0 ? 0 : 10},
          line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 22 : 100, width:0.42}
        });
        addLabel(slide, i === 0 ? 'PRIMARY KPI' : `SUPPORT 0${i}`, {
          x:x+0.22, y:board.y+0.78, w:1.12, h:0.10, fontSize:5.8, color:accent, charSpace:0.8
        });
        addText(slide, m.label || `指标 ${i + 1}`, {
          x:x+0.22, y:board.y+1.14, w:cardW-0.44, h:0.16, fontSize:9.4, bold:true, color:i === 0 ? C.white : C.text, fit:'shrink'
        });
        addNumber(slide, m.value || '—', {
          x:x+0.20, y:board.y+1.62, w:cardW-0.40, h:0.54, fontSize:i === 0 ? 38 : 30, color:accent, fit:'shrink'
        });
        addText(slide, m.note || '', {
          x:x+0.24, y:board.y+2.58, w:cardW-0.50, h:0.16, fontSize:8.0, color:i === 0 ? C.captionOnImage : C.body, fit:'shrink'
        });
      });
      const readout = [
        ['现状', logic.currentState || 'Product sustainability claims need concrete evidence.'],
        ['原因', logic.cause || 'Refill and container specifications are attached to the ULTIMUNE lineup.'],
        ['动作', logic.action || 'Keep sustainability proof inside the product evidence system.']
      ];
      addHairline(slide, 0.94, 6.08, 10.84, C.line, 14, 0.44);
      readout.forEach((row, i) => {
        const x = 1.00 + i * 3.38;
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
        addText(slide, row[0], { x, y:6.24, w:0.64, h:0.15, fontSize:8.8, bold:true, color:accent, fit:false });
        addText(slide, row[1], {
          x:x+0.74, y:6.22, w:2.36, h:0.36,
          fontSize:7.6, color:C.body, fit:false, breakLine:true, valign:'top'
        });
      });
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
      return;
    }
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || []).slice(0, 4);
    const panels = [
      { x:0.92, y:2.04, w:5.18, h:3.88, color:C.accent },
      { x:6.42, y:2.04, w:5.18, h:3.88, color:C.cyan }
    ];
    panels.forEach((panel, i) => {
      const item = items[i] || {};
      addRect(slide, panel.x, panel.y, panel.w, panel.h, panelFill(), i===0 ? panel.color : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?panel.color:C.line, transparency:i===0?20:16, width:0.46} });
      if (images[i]) addSmartPhotoPanel(slide, images[i], panel.x+0.18, panel.y+0.18, panel.w-0.36, 2.18, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
      else genericShowcaseField(slide, panel.x+0.18, panel.y+0.18, panel.w-0.36, 2.18, 'IMPACT EVIDENCE');
      addLabel(slide, i === 0 ? 'INITIATIVE / METRIC' : 'SOURCE / IMPACT', { x:panel.x+0.28, y:panel.y+2.62, w:1.38, h:0.09, fontSize:5.8, color:panel.color, charSpace:0.65 });
      addText(slide, itemTitle(item, i===0 ? '行动证明' : '影响证明'), { x:panel.x+0.28, y:panel.y+2.92, w:1.42, h:0.14, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item, '把图片、指标和来源绑定到同一项可持续行动。'), { x:panel.x+2.08, y:panel.y+2.86, w:2.42, h:0.22, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true });
    });
    items.slice(2, 4).forEach((item, i) => {
      const x = 1.16 + i * 5.50;
      const accent = i === 0 ? C.violet : C.accent;
      addRect(slide, x, 6.16, 4.76, 0.44, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:12}, line:{color:C.line, transparency:100} });
      addNumber(slide, String(i + 3).padStart(2, '0'), { x:x+0.20, y:6.30, w:0.28, h:0.09, fontSize:6.0, color:accent });
      addText(slide, itemTitle(item, `补充证据 ${i+3}`), { x:x+0.62, y:6.27, w:1.28, h:0.11, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, compactEvidenceCaption(itemBody(item), 34), { x:x+2.10, y:6.27, w:1.92, h:0.11, fontSize:6.6, color:C.body, fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    peopleProofMosaic,
    retailLookbookStory,
    sustainabilityProofSpread
  };
}

module.exports = {
  createEvidenceBrandStoryRenderers
};
