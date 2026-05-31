function createEvidenceIndustryRenderers(ctx = {}) {
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    footerText,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker
  } = ctx;
  const C = ctx.colors();

  function energySiteEvidenceGallery(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'SITE EVIDENCE', 0.86, 0.72, false);
    addText(slide, s.title || '站端现场证据', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    const intro = s.subtitle || s.intro || s.claim || '把站端资产、设备状态和区域调度证据放在同一页，而不是只做图片拼贴。';
    addText(slide, intro, { x:0.86, y:1.52, w:6.6, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = { x:0.92, y:2.02, w:6.36, h:2.52 };
    if (images[0]) addPhotoPanel(slide, images[0], hero.x, hero.y, hero.w, hero.h, { tone:'light', transparency:84, stroke:C.line, strokeTransparency:20, fit:'cover' });
    else genericShowcaseField(slide, hero.x, hero.y, hero.w, hero.h, 'SITE EVIDENCE');
    addRect(slide, hero.x, hero.y+hero.h-0.72, hero.w, 0.72, C.ink, C.ink, { fill:{color:C.ink, transparency:14}, line:{color:C.ink, transparency:100} });
    const lead = items[0] || { title:'站端资产', body:'以现场图片确认资产对象和运行边界。' };
    addLabel(slide, 'PRIMARY SITE', { x:hero.x+0.28, y:hero.y+hero.h-0.48, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(lead, '站端资产'), { x:hero.x+1.56, y:hero.y+hero.h-0.54, w:1.74, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead), { x:hero.x+3.54, y:hero.y+hero.h-0.52, w:2.04, h:0.14, fontSize:7.0, color:'CBD5E1', fit:'shrink' });

    const readout = { x:7.70, y:2.02, w:3.80, h:2.52 };
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'ASSET READOUT', { x:readout.x+0.26, y:readout.y+0.28, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    [
      ['01', '站端资产', '可见边界'],
      ['02', '设备状态', '可查对象'],
      ['03', '区域调度', '可复盘动作']
    ].forEach((row,i)=>{
      const y = readout.y + 0.78 + i*0.48;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, row[0], { x:readout.x+0.28, y:y+0.02, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:accent });
      addText(slide, row[1], { x:readout.x+0.78, y:y, w:0.88, h:0.13, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, row[2], { x:readout.x+2.20, y:y, w:0.90, h:0.12, fontSize:7.4, color:'A8B3C3', fit:'shrink', align:'right' });
      addHairline(slide, readout.x+0.28, y+0.28, 3.02, '334155', 44, 0.30);
    });

    const detailSlots = [
      { x:0.92, y:4.86, w:5.18, h:1.10, image:images[1], item:items[1], color:C.cyan, fallback:'设备细节' },
      { x:6.34, y:4.86, w:5.16, h:1.10, image:images[2], item:items[2], color:C.violet, fallback:'区域视角' }
    ];
    detailSlots.forEach((slot,i)=>{
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.42} });
      if (slot.image) addPhotoPanel(slide, slot.image, slot.x+0.14, slot.y+0.14, 1.54, slot.h-0.28, { tone:'light', transparency:82, stroke:C.line, strokeTransparency:28, fit:'cover' });
      else genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, 1.54, slot.h-0.28, slot.fallback);
      const item = slot.item || { title:slot.fallback, body:i===0 ? '检查设备状态对象。' : '进入区域化复盘。' };
      addNumber(slide, String(i+2).padStart(2,'0'), { x:slot.x+1.96, y:slot.y+0.30, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:slot.color });
      addText(slide, itemTitle(item, slot.fallback), { x:slot.x+2.36, y:slot.y+0.26, w:1.18, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item), { x:slot.x+3.70, y:slot.y+0.25, w:0.94, h:0.20, fontSize:7.4, color:C.body, fit:'shrink', breakLine:true });
    });
    addText(slide, s.note || '站端照片、设备细节和调度信息共同构成能源现场证据。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  function financePortfolioEvidenceGallery(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PORTFOLIO EVIDENCE', 0.86, 0.72, false);
    addText(slide, s.title || '组合项目证据图册', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    const intro = s.subtitle || s.intro || s.claim || '把项目材料、经营快照和投后动作放入投委会可判断的证据语法。';
    addText(slide, intro, { x:0.86, y:1.52, w:6.8, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = { x:0.92, y:2.02, w:4.96, h:3.86 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.56, { tone:'light', transparency:100, stroke:'334155', strokeTransparency:44, fit:'cover' });
    else genericShowcaseField(slide, hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.56, 'DEAL EVIDENCE');
    const lead = items[0] || { title:'经营快照示意', body:'用项目材料说明执行质量、风险信号和下一步配置动作。' };
    addLabel(slide, 'PRIMARY DEAL MATERIAL', { x:hero.x+0.30, y:hero.y+3.06, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, itemTitle(lead, '经营快照示意'), { x:hero.x+0.30, y:hero.y+3.36, w:1.60, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead), { x:hero.x+2.22, y:hero.y+3.32, w:2.16, h:0.18, fontSize:8.8, color:'CBD5E1', fit:'shrink' });

    const smallSlots = [
      { x:6.28, y:2.02, image:images[1], item:items[1], label:'COMMERCIAL PROOF', fallback:'产品材料示意', color:C.cyan },
      { x:9.00, y:2.02, image:images[2], item:items[2], label:'GOVERNANCE PROOF', fallback:'治理材料示意', color:C.violet }
    ];
    smallSlots.forEach((slot,i)=>{
      addRect(slide, slot.x, slot.y, 2.42, 1.74, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.38} });
      if (slot.image) addPhotoPanel(slide, slot.image, slot.x+0.12, slot.y+0.12, 2.18, 1.08, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:30, fit:'cover' });
      else genericShowcaseField(slide, slot.x+0.12, slot.y+0.12, 2.18, 1.08, slot.fallback);
      const item = slot.item || { title:slot.fallback, body:i===0 ? '判断商业化进展。' : '沉淀投后动作。' };
      addLabel(slide, slot.label, { x:slot.x+0.18, y:slot.y+1.38, w:1.16, h:0.08, fontSize:5.4, color:slot.color, charSpace:0.5 });
      addText(slide, itemTitle(item, slot.fallback), { x:slot.x+1.28, y:slot.y+1.32, w:0.86, h:0.13, fontSize:8.8, bold:true, color:C.text, fit:'shrink', align:'right' });
    });

    const readout = { x:6.28, y:4.26, w:5.14, h:1.62 };
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'IC READOUT', { x:readout.x+0.28, y:readout.y+0.30, w:0.94, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    [
      ['01', '项目质量', '能否继续配置资源'],
      ['02', '风险信号', '是否需要处置节奏'],
      ['03', '资本动作', '加仓、维持或退出']
    ].forEach((row,i)=>{
      const y = readout.y + 0.72 + i*0.34;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, row[0], { x:readout.x+0.30, y:y+0.02, w:0.28, h:0.09, fontSize:6.4, color:accent });
      addText(slide, row[1], { x:readout.x+0.74, y:y, w:0.86, h:0.12, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, row[2], { x:readout.x+2.16, y:y, w:2.10, h:0.12, fontSize:8.8, color:'CBD5E1', fit:'shrink', align:'right' });
    });
    addText(slide, s.note || '图片材料转化为投委会判断对象，不停留在普通图册。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  function healthcareTouchpointEvidenceGallery(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'SERVICE TOUCHPOINTS', 0.86, 0.72, false);
    addText(slide, s.title || '服务触点证据图册', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    const intro = s.subtitle || s.intro || s.claim || '把患者旅程、前台动作、后台资源和质量证据放到同一条服务链。';
    addText(slide, intro, { x:0.86, y:1.52, w:6.8, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

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
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  function saasPrototypeFlowGallery(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PRODUCT WORKFLOW', 0.86, 0.72, false);
    addText(slide, s.title || '产品原型工作流', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    const intro = s.subtitle || s.intro || s.claim || 'SaaS 原型页要先说明用户工作流，再展示界面状态和采用信号。';
    addText(slide, intro, { x:0.86, y:1.52, w:6.7, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = { x:0.92, y:2.00, w:5.52, h:3.72 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.70, { tone:'light', transparency:100, stroke:'334155', strokeTransparency:44, fit:'cover' });
    else genericShowcaseField(slide, hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.70, 'PRIMARY SCREEN');
    const lead = items[0] || { title:'核心工作台', body:'让核心对象、入口和下一步动作在同一屏成立。' };
    addLabel(slide, 'PRIMARY SCREEN', { x:hero.x+0.30, y:hero.y+3.18, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(lead, '核心工作台'), { x:hero.x+1.78, y:hero.y+3.12, w:1.56, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead), { x:hero.x+3.50, y:hero.y+3.10, w:1.52, h:0.16, fontSize:7.0, color:'CBD5E1', fit:'shrink' });

    const flow = { x:6.86, y:2.00, w:4.72, h:2.14 };
    addLabel(slide, 'WORKFLOW PATH', { x:flow.x, y:flow.y+0.02, w:1.22, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    const steps = [
      items[0] || { title:'工作台', body:'进入团队空间。' },
      items[1] || { title:'自动化', body:'触发流程动作。' },
      items[2] || { title:'分析视图', body:'看见价值信号。' }
    ];
    steps.forEach((it,i)=>{
      const y = flow.y + 0.42 + i*0.54;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, flow.x, y, flow.w, 0.40, panelFill(), C.line, { fill:{color:panelFill(), transparency:i===0?0:4}, line:{color:i===0?accent:C.line, transparency:i===0?18:18, width:0.38} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:flow.x+0.18, y:y+0.13, w:0.28, h:0.09, fontSize:6.2, color:accent });
      addText(slide, itemTitle(it, `步骤 ${i+1}`), { x:flow.x+0.64, y:y+0.10, w:1.08, h:0.12, fontSize:8.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:flow.x+2.14, y:y+0.09, w:1.70, h:0.13, fontSize:7.2, color:C.body, fit:'shrink' });
    });

    const screenSlots = [
      { x:6.86, y:4.54, w:2.16, h:1.18, image:images[1], title:'STATE 02', color:C.cyan },
      { x:9.42, y:4.54, w:2.16, h:1.18, image:images[2], title:'STATE 03', color:C.violet }
    ];
    screenSlots.forEach((slot,i)=>{
      if (slot.image) addPhotoPanel(slide, slot.image, slot.x, slot.y, slot.w, slot.h, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:24, fit:'cover' });
      else genericShowcaseField(slide, slot.x, slot.y, slot.w, slot.h, slot.title);
      addLabel(slide, slot.title, { x:slot.x, y:slot.y+slot.h+0.18, w:0.82, h:0.09, fontSize:5.4, color:slot.color, charSpace:0.7 });
      addText(slide, itemTitle(steps[i+1], i===0 ? '自动化状态' : '分析状态'), { x:slot.x+0.92, y:slot.y+slot.h+0.14, w:0.98, h:0.12, fontSize:7.8, bold:true, color:C.text, fit:'shrink' });
    });
    addRect(slide, 0.92, 6.18, 10.66, 0.34, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addText(slide, s.note || '界面、核心动作、自动化路径和采用信号放在同一条工作流里。', { x:1.14, y:6.25, w:9.78, h:0.12, fontSize:8.2, color:C.body, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    energySiteEvidenceGallery,
    financePortfolioEvidenceGallery,
    healthcareTouchpointEvidenceGallery,
    saasPrototypeFlowGallery
  };
}

module.exports = {
  createEvidenceIndustryRenderers
};
