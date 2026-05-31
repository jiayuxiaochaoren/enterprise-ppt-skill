const family = 'chapter';

const types = ['chapter-divider'];

function createChapterRenderers(ctx = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const {
    PageNumber,
    addArrowLine,
    addDarkBreathingCircle,
    addHairline,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    footerText,
    galleryImages,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    profileFont,
    publicSlideNote,
    sectionKicker,
    stageCanvas,
    variantOf
  } = ctx;

  function chapterItems(s) {
    const raw = s.items || s.agenda || s.sections || [];
    return (Array.isArray(raw) ? raw : []).map(v => typeof v === 'string' ? { title:v } : v).filter(Boolean);
  }

  function chapterHeroDivider(slide, plan, s, idx) {
    stageCanvas(slide, { field:true });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    addLabel(slide, 'CHAPTER', { x:0.86, y:0.94, w:1.38, h:0.14, fontSize:8.2, color:C.darkMuted, charSpace:0.8 });
    addText(slide, chapter, { x:0.82, y:1.54, w:2.10, h:0.70, fontSize:50, bold:true, color:C.accent, fit:'shrink' });
    addText(slide, s.title || '章节标题', { x:3.22, y:1.76, w:6.90, h:0.55, fontSize:29.5, bold:true, color:C.white, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:3.26, y:2.62, w:5.90, h:0.25, fontSize:11.2, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 3.26, 3.18, 0.92, C.accent, 0, 0.72);
    const items = chapterItems(s).slice(0,3);
    items.forEach((it,i)=>{
      const y = 4.22 + i*0.64;
      addNumber(slide, String(i+1).padStart(2,'0'), { x:3.30, y:y-0.01, w:0.48, h:0.18, fontSize:11.8, color:i===0?C.accent:C.cyan });
      addText(slide, itemTitle(it), { x:3.96, y:y-0.05, w:4.70, h:0.22, fontSize:15.0, bold:true, color:C.white, fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.darkMuted || 'D8CDD0' });
  }

  function chapterManufacturingLineAgenda(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    addDarkBreathingCircle(slide, 8.40, 0.70, 4.10, 2.24, C.accent);
    addLabel(slide, s.label || 'LINE OPERATING PATH', { x:0.84, y:0.82, w:1.84, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.05 });
    addText(slide, s.title || '从关键产线开始建立闭环', { x:0.82, y:1.24, w:5.90, h:0.46, fontSize:25.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '先用一条产线跑通对象、工单、指标和复盘，再扩展到多车间协同。', { x:0.84, y:1.82, w:6.10, h:0.20, fontSize:9.8, color:C.captionOnImage, fit:'shrink' });
    addNumber(slide, chapter, { x:10.82, y:0.92, w:0.72, h:0.28, fontSize:19.0, color:C.accent, align:'right', fit:'shrink' });

    const items = chapterItems(s);
    const list = (items.length ? items : [
      { title:'现场状态', body:'设备、报警和点检先进入事实表。' },
      { title:'维修闭环', body:'报修、派工、处置和验收可追踪。' },
      { title:'OEE 复盘', body:'把停机影响回写到策略更新。' }
    ]).slice(0, 4);
    const cardW = 2.16;
    const cardMargin = 0.86;
    const cardY = 4.08;
    const rail = { x:cardMargin + cardW/2, y:3.42, w:W - (cardMargin + cardW/2) * 2 };
    addHairline(slide, rail.x, rail.y, rail.w, '334155', 12, 0.92);
    list.forEach((it,i)=>{
      const step = list.length > 1 ? rail.w / (list.length - 1) : 0;
      const x = rail.x + i * step;
      const cardX = Math.min(Math.max(x - cardW/2, cardMargin), W - cardMargin - cardW);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', { x:x-0.14, y:rail.y-0.14, w:0.28, h:0.28, fill:{color:accent}, line:{color:accent, transparency:100} });
      addHairline(slide, x, rail.y+0.20, 0, accent, 18, 0.80);
      slide.addShape('line', { x, y:rail.y+0.22, w:0, h:cardY-rail.y-0.22, line:{color:accent, transparency:30, width:0.62} });
      if (i < list.length - 1) addArrowLine(slide, x+0.32, rail.y, Math.max(0.1, step-0.64), 0, accent, { transparency:16, width:1.06 });
      addRect(slide, cardX, cardY, cardW, 1.02, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?18:40}, line:{color:i===0?accent:'334155', transparency:i===0?18:52, width:i===0?0.72:0.52} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:cardX+0.24, y:cardY+0.30, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `节点 ${i+1}`), { x:cardX+0.58, y:cardY+0.22, w:cardW-0.80, h:0.16, fontSize:9.8, bold:true, color:C.white, fit:'shrink', align:'center' });
      addText(slide, itemBody(it), { x:cardX+0.28, y:cardY+0.58, w:cardW-0.56, h:0.18, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'center' });
    });
    const note = publicSlideNote(s.note);
    if (note) {
      addRect(slide, 0.92, 5.88, 9.92, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:26}, line:{color:'334155', transparency:64, width:0.32} });
      addLabel(slide, s.bottomLabel || '能力路径', { x:1.14, y:5.99, w:1.06, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.72 });
      addText(slide, note, { x:2.46, y:5.98, w:7.24, h:0.11, fontSize:7.4, color:C.darkMuted || '94A3B8', fit:'shrink' });
    }
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function chapterSaasAdoptionAgenda(slide, plan, s, idx) {
    lightCanvas(slide);
    const chapter = s.chapter || String(idx).padStart(2, '0');
    sectionKicker(slide, s.label || 'ADOPTION PATH', 0.86, 0.72, false);
    addText(slide, s.title || '平台增长与客户采用', { x:0.84, y:1.06, w:5.80, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '把产品能力、客户采用和商业结果放在同一条采用路径上。', { x:0.86, y:1.52, w:6.30, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    addText(slide, chapter, { x:9.92, y:0.92, w:1.32, h:0.46, fontSize:32, bold:true, color:C.softBlue || 'E9F2FA', align:'right', fit:'shrink' });

    const items = chapterItems(s);
    const list = (items.length ? items : [
      { title:'平台能力', body:'模块、集成、数据。' },
      { title:'客户采用', body:'激活、留存、扩展。' },
      { title:'商业结果', body:'ARR、NRR、毛利。' }
    ]).slice(0, 4);
    const stage = { x:0.92, y:2.18, w:10.64, h:3.64 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    const x0 = stage.x + 0.58;
    const gap = (stage.w - 1.16) / Math.max(1, list.length);
    list.forEach((it,i)=>{
      const x = x0 + i*gap;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, stage.y+0.86, Math.min(2.20, gap-0.22), 1.36, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1 ? 0 : 10},
        line:{color:i===1 ? accent : C.line, transparency:i===1 ? 22 : 16, width:0.42}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:stage.y+1.18, w:0.30, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(it, `路径 ${i+1}`), { x:x+0.62, y:stage.y+1.10, w:1.02, h:0.15, fontSize:9.2, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.24, y:stage.y+1.58, w:1.50, h:0.18, fontSize:7.2, color:i===1 ? 'CBD5E1' : C.body, fit:'shrink', breakLine:true });
      if (i < list.length - 1) addArrowLine(slide, x + Math.min(2.20, gap-0.22) + 0.12, stage.y+1.54, Math.max(0.18, gap - Math.min(2.20, gap-0.22) - 0.46), 0, accent, { transparency:38, width:0.36 });
    });
    addRect(slide, stage.x+0.44, stage.y+2.76, stage.w-0.88, 0.36, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:stage.x+0.66, y:stage.y+2.84, w:stage.w-1.32, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function chapterBoardBriefing(slide, plan, s, idx) {
    lightCanvas(slide);
    const chapter = s.chapter || String(idx).padStart(2, '0');
    sectionKicker(slide, s.label || 'BOARD BRIEFING', 0.86, 0.72, false);
    addText(slide, s.title || '董事会汇报重点', { x:0.84, y:1.06, w:6.20, h:0.40, fontSize:24.2, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '先明确审议事项、判断依据和下一步投入边界。', { x:0.86, y:1.56, w:6.70, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const items = chapterItems(s);
    const list = (items.length ? items : [
      { title:'关键判断', body:'本轮需要形成的管理层共识。' },
      { title:'风险约束', body:'需要被董事会看见的边界条件。' },
      { title:'资源投入', body:'下一阶段投入、节奏和责任。' }
    ]).slice(0, 4);
    const memo = { x:0.92, y:2.14, w:10.64, h:1.28 };
    addRect(slide, memo.x, memo.y, memo.w, memo.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'MEETING MEMO', { x:memo.x+0.30, y:memo.y+0.30, w:1.14, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
    addText(slide, chapter, { x:memo.x+1.72, y:memo.y+0.30, w:0.60, h:0.24, fontSize:16, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreTitle || '审议路径', { x:memo.x+2.76, y:memo.y+0.28, w:1.34, h:0.16, fontSize:10.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || publicSlideNote(s.note) || '围绕关键判断、约束条件和资源投入组织审议顺序。', {
      x:memo.x+4.56, y:memo.y+0.28, w:4.88, h:0.18, fontSize:8.8, color:C.captionOnImage, fit:'shrink'
    });
    addHairline(slide, memo.x+9.74, memo.y+0.62, 0.58, C.accent, 0, 0.54);

    const board = { x:0.92, y:4.02, w:10.64, h:1.84 };
    addLabel(slide, 'DECISION SEQUENCE', { x:board.x, y:3.62, w:1.48, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
    list.forEach((it,i)=>{
      const x = board.x + i*2.72;
      const w = i === 3 ? 2.18 : 2.36;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, board.y, w, board.h, i===0 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
        fill:{color:i===0 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:i===0?8:0},
        line:{color:i===0?accent:C.line, transparency:i===0?22:18, width:0.38}
      });
      addRect(slide, x, board.y, w, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:board.y+0.34, w:0.32, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `议题 ${i+1}`), { x:x+0.22, y:board.y+0.72, w:1.34, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.22, y:board.y+1.16, w:1.66, h:0.20, fontSize:8.2, color:C.body, fit:'shrink', breakLine:true });
      if (i < list.length - 1) addArrowLine(slide, x+w+0.10, board.y+0.92, 0.22, 0, accent, { transparency:34, width:0.32 });
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.94, y:6.34, w:8.90, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function chapterAgendaBoard(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    addDarkBreathingCircle(slide, 8.52, 0.28, 4.38, 2.42, C.accent);
    addLabel(slide, s.label || 'MEETING AGENDA', { x:0.86, y:0.90, w:1.64, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.0 });
    addText(slide, s.title || '议题与判断框架', { x:0.84, y:1.52, w:6.10, h:0.52, fontSize:28.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '先明确本章讨论顺序，再进入证据与决策。', { x:0.86, y:2.36, w:5.70, h:0.22, fontSize:10.2, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 0.88, 2.94, 0.92, C.accent, 0, 0.72);
    addText(slide, chapter, { x:10.42, y:1.06, w:1.10, h:0.50, fontSize:36, bold:true, color:C.accent, align:'right', fit:'shrink' });
    PageNumber(slide, idx, { fontSize:11.5 });
    const items = chapterItems(s).slice(0,4);
    const list = (items.length ? items : [{title:'背景判断'}, {title:'证据复盘'}, {title:'配置选择'}]).slice(0,3);
    addLabel(slide, 'DISCUSSION SEQUENCE', { x:0.92, y:3.78, w:1.64, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
    list.forEach((it,i)=>{
      const x = 0.92 + i*3.48;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, 4.24, 2.92, 1.24, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?22:42}, line:{color:i===0?accent:'334155', transparency:i===0?24:62, width:0.44} });
      addRect(slide, x, 4.24, 2.92, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.58, w:0.34, h:0.12, fontSize:7.0, color:accent });
      addText(slide, itemTitle(it, `议题 ${i+1}`), { x:x+0.72, y:4.52, w:1.42, h:0.16, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.24, y:4.96, w:2.20, h:0.20, fontSize:8.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.94, y:6.18, w:7.40, h:0.14, fontSize:8.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
  }

  function chapterPathwayMap(slide, plan, s, idx) {
    lightCanvas(slide);
    const chapter = s.chapter || String(idx).padStart(2, '0');
    sectionKicker(slide, s.label || 'SERVICE PATH', 0.86, 0.72, false);
    addText(slide, s.title || '路径与关键议题', { x:0.84, y:1.06, w:5.80, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '把本章内容组织成可跟随的路径，而不是普通目录。', { x:0.86, y:1.52, w:6.20, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addText(slide, chapter, { x:10.10, y:0.98, w:1.28, h:0.48, fontSize:36, bold:true, color:C.softBlue || 'E9F2FA', align:'right', fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const items = chapterItems(s).slice(0,5);
    const list = items.length ? items : [{title:'触点'}, {title:'资源'}, {title:'质量'}];
    addRect(slide, 0.92, 2.20, 10.84, 3.70, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    const startX = 1.42;
    const y = 3.72;
    const step = list.length > 1 ? 9.10 / (list.length - 1) : 0;
    addHairline(slide, startX, y, Math.max(0.1, step*(list.length-1)), C.line, 8, 0.70);
    list.forEach((it,i)=>{
      const x = startX + i*step;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      slide.addShape('ellipse', { x:x-0.12, y:y-0.12, w:0.24, h:0.24, fill:{color:accent}, line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x-0.24, y:y-0.58, w:0.48, h:0.12, fontSize:7.0, color:accent, align:'center' });
      addText(slide, itemTitle(it, `阶段 ${i+1}`), { x:x-0.66, y:y+0.42, w:1.32, h:0.16, fontSize:10.2, bold:true, color:C.text, fit:'shrink', align:'center' });
      if (itemBody(it)) addText(slide, itemBody(it), { x:x-0.80, y:y+0.78, w:1.60, h:0.20, fontSize:7.6, color:C.body, fit:'shrink', align:'center' });
      if (i < list.length - 1) slide.addShape('line', { x:x+0.34, y, w:step-0.68, h:0, line:{color:accent, transparency:34, width:0.36, endArrowType:'triangle'} });
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.94, y:6.38, w:8.80, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function chapterEditorialAgenda(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    const images = galleryImages(plan, s);
    const visual = { x:6.36, y:1.02, w:5.72, h:4.98 };
    addRect(slide, visual.x, visual.y, visual.w, visual.h, C.ink2 || C.ink, '45222A', {
      fill:{ color:C.ink2 || C.ink, transparency:20 },
      line:{ color:'45222A', transparency:42, width:0.42 }
    });
    if (images[0]) {
      addPhotoPanel(slide, images[0], visual.x+0.18, visual.y+0.18, visual.w-0.36, 3.18, {
        tone:'dark', transparency:30, stroke:'45222A', strokeTransparency:46, fit:'cover'
      });
    } else {
      addDarkBreathingCircle(slide, 8.34, 0.78, 4.16, 2.36, C.accent);
    }
    addRect(slide, visual.x, visual.y+3.66, visual.w, 1.32, C.ink, C.ink, {
      fill:{ color:C.ink, transparency:10 },
      line:{ color:C.ink, transparency:100 }
    });
    addLabel(slide, 'PATHWAY MAP', {
      x:visual.x+0.34, y:visual.y+3.96, w:1.18, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:0.8
    });
    chapterItems(s).slice(0,3).forEach((it,i)=>{
      const x = visual.x + 0.34 + i * 1.58;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x, y:visual.y+4.44, w:0.28, h:0.10,
        fontSize:6.4, color:accent
      });
      addText(slide, itemTitle(it), {
        x:x+0.40, y:visual.y+4.39, w:0.82, h:0.14,
        fontSize:8.2, bold:true, color:C.white, fit:'shrink'
      });
    });
    addLabel(slide, s.label || 'EDITORIAL AGENDA', { x:0.86, y:0.94, w:1.64, h:0.13, typeRole:'kicker', fontSize:7.1, color:C.cyan, charSpace:0.9 });
    addText(slide, chapter, { x:0.82, y:1.45, w:0.92, h:0.34, typeRole:'metricMedium', fontSize:22.5, bold:true, color:C.accent, fit:'shrink', fontFace:profileFont('number') });
    addText(slide, s.title || '章节标题', { x:0.86, y:2.10, w:4.85, h:0.45, typeRole:'pageTitle', fontSize:22.5, bold:true, color:C.white, fit:'shrink', breakLine:true, fontFace:profileFont() });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.90, y:3.02, w:5.30, h:0.22, typeRole:'subtitle', fontSize:10.5, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 0.90, 3.56, 0.82, C.accent, 0, 0.72);
    chapterItems(s).slice(0,3).forEach((it,i)=>{
      const y = 4.10 + i*0.78;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:0.92, y:y+0.03, w:0.30, h:0.12, typeRole:'caption', fontSize:7.5, color:accent });
      addText(slide, itemTitle(it), { x:1.42, y, w:2.45, h:0.17, typeRole:'cardTitle', fontSize:11.25, bold:true, color:C.white, fit:'shrink' });
      if (itemBody(it)) addText(slide, itemBody(it), { x:1.42, y:y+0.27, w:4.92, h:0.34, typeRole:'body', fontSize:9.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function chapterDivider(slide, plan, s, idx) {
    const variant = variantOf(s, 'chapter-hero');
    if (variant === 'agenda-board') return chapterAgendaBoard(slide, plan, s, idx);
    if (variant === 'board-briefing') return chapterBoardBriefing(slide, plan, s, idx);
    if (variant === 'pathway-map' || variant === 'service-path') return chapterPathwayMap(slide, plan, s, idx);
    if (variant === 'editorial-agenda' || variant === 'image-agenda') return chapterEditorialAgenda(slide, plan, s, idx);
    if (variant === 'line-agenda' || variant === 'manufacturing-line') return chapterManufacturingLineAgenda(slide, plan, s, idx);
    if (variant === 'adoption-agenda' || variant === 'saas-adoption') return chapterSaasAdoptionAgenda(slide, plan, s, idx);
    return chapterHeroDivider(slide, plan, s, idx);
  }

  return {
    chapterDivider
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.chapterDivider, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createChapterRenderers,
  entries
};
