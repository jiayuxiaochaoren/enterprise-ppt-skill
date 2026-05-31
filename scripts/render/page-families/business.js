const family = 'business';

const types = [
  'comparison',
  'report-board',
  'value-tiles'
];

function reportBoardItems(s) {
  const raw = s.sections || s.cards || s.items || s.rows || [];
  const defaultBody = s.itemBody || s.bodyHint || s.claim || s.subtitle || s.summary || '';
  return (Array.isArray(raw) ? raw : []).map(v => {
    if (Array.isArray(v)) return { title:v[0], body:v[2] || v[1] || '' };
    if (typeof v === 'string') return { title:v, body:defaultBody };
    const item = v || {};
    return Object.assign({}, item, { body:item.body || item.summary || item.note || defaultBody });
  }).filter(Boolean);
}

function createBusinessRenderers(ctx = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const H = ctx.canvasHeight();
  const {
    PageNumber,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    addVisualPhotoPanel,
    copyFallback,
    footerText,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    profileFont,
    publicSlideNote,
    reportBoardNeedsRightOverlayRail,
    sectionKicker
  } = ctx;

  function reportBoard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, s.label || 'REPORT BOARD', 0.86, 0.72, false);
    addText(slide, s.title || copyFallback(plan, 'industryCoreTitle'), { x:0.84, y:1.04, w:6.2, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.claim || s.subtitle || s.intro || copyFallback(plan, 'reportBoardClaim'), {
      x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink'
    });
    PageNumber(slide, idx);
    const items = reportBoardItems(s).slice(0,9);
    const summary = s.summary || s.coreBody || s.note || copyFallback(plan, 'reportBoardCoreBody');
    addRect(slide, 0.92, 2.08, 2.78, 4.16, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'EXECUTIVE READ', { x:1.22, y:2.44, w:1.28, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || copyFallback(plan, 'reportBoardCoreTitle'), { x:1.22, y:2.92, w:1.82, h:0.32, fontSize:14.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, summary, { x:1.22, y:3.62, w:1.86, h:0.78, fontSize:8.4, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addHairline(slide, 1.22, 4.84, 0.82, C.accent, 0, 0.62);
    addText(slide, s.decision || copyFallback(plan, 'reportBoardDecision'), { x:1.22, y:5.20, w:1.82, h:0.28, fontSize:7.6, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });

    const compactRightRail = reportBoardNeedsRightOverlayRail(s);
    const board = { x:4.12, y:2.08, w:compactRightRail ? 3.54 : 7.46, h:4.16 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'EVIDENCE STACK', { x:board.x+0.28, y:board.y+0.28, w:1.28, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
    if (items.length > 0 && items.length <= 3) {
      items.forEach((it, i) => {
        const y = board.y + 0.78 + i * 1.04;
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
        addRect(slide, board.x + 0.30, y, board.w - 0.60, 0.78, i === 0 ? C.panelAlt : panelFill(), i === 0 ? accent : C.line, {
          fill:{ color:i === 0 ? C.panelAlt : panelFill(), transparency:i === 0 ? 10 : 0 },
          line:{ color:i === 0 ? accent : C.line, transparency:i === 0 ? 18 : 16, width:0.38 }
        });
        addNumber(slide, String(i + 1).padStart(2, '0'), { x:board.x+0.58, y:y+0.24, w:0.30, h:0.10, fontSize:6.8, color:accent });
        addText(slide, itemTitle(it, `证据 ${i + 1}`), {
          x:board.x+1.04, y:y+0.18, w:compactRightRail ? Math.max(1.0, board.w - 1.42) : 1.54, h:0.15,
          fontSize:9.4, bold:true, color:C.text, fit:'shrink'
        });
        addText(slide, itemBody(it), {
          x:compactRightRail ? board.x+1.04 : board.x+2.82,
          y:compactRightRail ? y+0.44 : y+0.16,
          w:compactRightRail ? Math.max(1.0, board.w - 1.42) : 3.92,
          h:compactRightRail ? 0.18 : 0.28,
          fontSize:compactRightRail ? 7.0 : 8.2,
          color:C.body,
          fit:'shrink',
          breakLine:true
        });
      });
      addHairline(slide, board.x+0.32, board.y+3.86, board.w-0.64, C.line, 18, 0.30);
      addText(slide, s.evidenceNote || s.note || '先把证据边界讲清楚，再进入品牌选择判断。', {
        x:board.x+0.34, y:board.y+3.96, w:compactRightRail ? Math.max(1.0, board.w - 0.68) : 5.86, h:0.12,
        fontSize:compactRightRail ? 6.8 : 7.4, color:C.muted, fit:'shrink'
      });
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
      return;
    }
    const cols = compactRightRail ? 1 : 3;
    const colW = compactRightRail ? Math.max(1.80, board.w - 0.68) : 2.18;
    items.forEach((it,i)=>{
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = board.x + 0.28 + col * (compactRightRail ? 0 : 2.34);
      const y = board.y + 0.76 + row * 1.02;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addHairline(slide, x, y+0.86, colW, C.line, 18, 0.30);
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:y+0.02, w:0.28, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(it, `要点 ${i+1}`), { x:x+0.40, y:y-0.02, w:compactRightRail ? Math.max(1.20, colW - 0.46) : 1.28, h:0.15, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.40, y:y+0.30, w:compactRightRail ? Math.max(1.20, colW - 0.46) : 1.52, h:0.28, fontSize:compactRightRail ? 6.9 : 7.4, color:C.body, fit:'shrink', breakLine:true });
    });
    if (!items.length) {
      addText(slide, '暂无结构化条目', { x:board.x+0.28, y:board.y+1.08, w:2.2, h:0.16, fontSize:10.0, color:C.muted });
    }
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function comparisonSlide(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'COMPARISON', 0.86, 0.72, false);
    addText(slide, s.title || '对比分析', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.4, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const columns = (s.columns || [
      { title:s.leftTitle || '当前状态', body:(s.left || []).join(' / ') },
      { title:s.rightTitle || '升级后', body:(s.right || []).join(' / ') }
    ]).slice(0,2);
    const left = columns[0] || {};
    const right = columns[1] || {};
    const leftItems = Array.isArray(left.items) ? left.items : String(left.body || '').split(/[、/；;。]/).filter(Boolean).slice(0,3);
    const rightItems = Array.isArray(right.items) ? right.items : String(right.body || '').split(/[、/；;。]/).filter(Boolean).slice(0,3);
    const rows = Math.max(leftItems.length, rightItems.length, 3);
    const panel = { x:0.92, y:2.08, w:10.82, h:3.88 };
    addRect(slide, panel.x, panel.y, panel.w, panel.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.55}
    });
    addRect(slide, 7.66, panel.y, 0.06, panel.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
    addLabel(slide, 'CURRENT EXPERIENCE', { x:1.26, y:2.42, w:1.75, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
    addLabel(slide, 'TARGET EXPERIENCE', { x:8.08, y:2.42, w:1.70, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, left.title || '升级前', { x:1.26, y:2.76, w:2.20, h:0.22, fontSize:15.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, right.title || '升级后', { x:8.08, y:2.76, w:2.20, h:0.22, fontSize:15.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, 'FROM', { x:4.54, y:2.74, w:0.48, h:0.10, fontSize:5.6, color:C.muted, charSpace:0.8, fontFace:profileFont('latin') });
    slide.addShape('line', { x:5.10, y:2.80, w:1.58, h:0, line:{color:C.accent, transparency:8, width:0.62, endArrowType:'triangle'} });
    addText(slide, 'TO', { x:6.84, y:2.74, w:0.28, h:0.10, fontSize:5.6, color:C.accent, charSpace:0.8, fontFace:profileFont('latin') });

    for (let i=0; i<rows; i++) {
      const y = 3.36 + i*0.62;
      const l = typeof leftItems[i] === 'string' ? leftItems[i] : ((leftItems[i] || {}).title || '');
      const r = typeof rightItems[i] === 'string' ? rightItems[i] : ((rightItems[i] || {}).title || '');
      addHairline(slide, 1.26, y-0.17, 9.70, C.line, 16, 0.45);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:1.26, y:y-0.04, w:0.34, h:0.12, fontSize:7.2, color:i===0?C.accent:C.muted });
      addText(slide, l, { x:1.82, y:y-0.07, w:2.62, h:0.17, fontSize:9.4, color:C.body, fit:'shrink' });
      slide.addShape('line', { x:4.82, y:y+0.02, w:1.62, h:0, line:{color:C.line, transparency:2, width:0.48, endArrowType:'triangle'} });
      slide.addShape('ellipse', { x:6.72, y:y-0.035, w:0.10, h:0.10, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
      addText(slide, r, { x:8.08, y:y-0.07, w:2.62, h:0.17, fontSize:9.6, bold:i===0, color:C.text, fit:'shrink' });
    }
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.96, y:6.44, w:8.8, h:0.14, fontSize:8.2, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function valueTiles(slide, plan, s, idx) {
    slide.background = { color:C.paper };
    addRect(slide, 0, 0, W, H, C.paper, C.paper);
    addRect(slide, 0, 0, W, 0.92, C.white, C.white, { line:{color:C.white, transparency:100} });
    slide.addShape('ellipse', { x:9.58, y:0.42, w:3.45, h:3.45, fill:{color:C.softBlue, transparency:50}, line:{color:C.softBlue, transparency:100} });
    sectionKicker(slide, 'VALUE SIGNAL', 0.86, 0.72, false);
    addText(slide, s.title, { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text });
    if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.7, h:0.22, fontSize:10.8, color:C.muted });
    addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });
    const cards = s.cards || [];
    const lead = cards[0] || { title:'业务价值', body:'' };
    if (!addVisualPhotoPanel(slide, plan, s, 'value', 0.88, 2.16, 5.06, 3.58, { transparency:56, stroke:C.ink, strokeTransparency:100 })) {
      addRect(slide, 0.88, 2.16, 5.06, 3.58, C.ink, C.ink, { line:{color:C.ink, transparency:100} });
    }
    addText(slide, '01', { x:1.20, y:2.55, w:0.38, h:0.16, fontSize:9, bold:true, color:C.accent });
    addText(slide, lead.title, { x:1.18, y:3.04, w:3.65, h:0.38, fontSize:22.5, bold:true, color:C.white, fit:'shrink' });
    addText(slide, lead.body, { x:1.18, y:3.86, w:3.70, h:0.66, fontSize:10.8, color:'CBD5E1', valign:'top', fit:'shrink' });
    addHairline(slide, 1.18, 4.98, 0.90, C.accent, 0, 0.75);
    addText(slide, 'MANAGEMENT OUTCOME', { x:1.18, y:5.24, w:1.62, h:0.10, fontSize:6.4, color:'64748B', charSpace:1.0 });
    cards.slice(1,4).forEach((c,i)=>{
      const y = 2.22 + i*1.18;
      const accent = i===1 ? C.cyan : C.accent;
      addText(slide, String(i+2).padStart(2,'0'), { x:6.74, y:y+0.08, w:0.36, h:0.14, fontSize:8.2, bold:true, color:accent });
      addText(slide, c.title, { x:7.30, y:y, w:3.2, h:0.22, fontSize:14.4, bold:true, color:C.text });
      addText(slide, c.body, { x:7.30, y:y+0.42, w:4.18, h:0.30, fontSize:9.2, color:C.body, fit:'shrink' });
      addHairline(slide, 7.30, y+0.95, 4.0, 'D8E2EF', 12, 0.55);
    });
    if (s.note) addText(slide, s.note, { x:0.90, y:6.52, w:9.6, h:0.18, fontSize:8.6, color:'738297' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  return {
    comparisonSlide,
    reportBoard,
    valueTiles
  };
}

function entries(renderers = {}) {
  return [
    { types:['comparison'], render:renderers.comparisonSlide, source:`page-family:${family}` },
    { types:['report-board'], render:renderers.reportBoard, source:`page-family:${family}` },
    { types:['value-tiles'], render:renderers.valueTiles, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createBusinessRenderers,
  entries,
  reportBoardItems
};
