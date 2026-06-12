const {
  industryBusinessLogicItems
} = require('./financial-industry-chart-slide-data');
const {
  centeredStackY
} = require('../layout/card-layout');

function visibleCoreTitle(value, fallback = '行业读数') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  const generatedEnglish = /^[A-Z0-9\s/·&().+-]+$/.test(text) &&
    /TREND|MATRIX|SCORECARD|READOUT|BRIDGE|FUNNEL|PULSE|EFFICIENCY|PROOF|OBJECT|LADDER|COHORT|CHANNEL|METRIC|FACT|ADOPTION|DISPATCH/.test(text);
  return generatedEnglish ? fallback : text;
}

function createFinancialIndustryChartSlidePanels(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;

  function drawProofObjectPanel(slide, s, side, variantLabel) {
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '证据对象', { x:side.x+0.28, y:side.y+0.34, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0 });
    addText(slide, visibleCoreTitle(s.coreTitle, variantLabel || '行业读数'), { x:side.x+0.28, y:side.y+0.86, w:1.72, h:0.32, fontSize:14.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || s.decision || s.claim || s.subtitle || '把关键经营指标放回判断场景。', { x:side.x+0.28, y:side.y+1.56, w:1.86, h:0.66, fontSize:8.8, color:'CBD5E1', fit:'shrink', breakLine:true });
    addHairline(slide, side.x+0.28, side.y+2.62, 0.78, C.accent, 0, 0.55);
    if (s.note) {
      addText(slide, s.note, { x:side.x+0.28, y:side.y+2.92, w:1.76, h:0.42, fontSize:8.8, color:'A8B3C3', fit:'shrink', breakLine:true });
    }
  }

  function drawChartBoardShell(slide, board) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  }

  function drawBusinessLogicRow(slide, s, zone = null) {
    const logicItems = industryBusinessLogicItems(s);
    if (logicItems.length < 2) return;
    if (!zone) {
      addHairline(slide, 0.94, 6.32, 10.70, C.line, 12, 0.55);
    }
    if (zone) {
      const gap = 0.12;
      const cardW = (zone.w - gap * 3) / 4;
      const cardH = zone.h;
      logicItems.slice(0, 4).forEach((item, i) => {
        const x = zone.x + i * (cardW + gap);
        const y = zone.y;
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
        const labelH = 0.12;
        const bodyH = 0.30;
        const [labelY, bodyY] = centeredStackY(y, cardH, [labelH, bodyH], 0.08);
        addRect(slide, x, y, cardW, cardH, i === 0 ? C.ink : 'FFFFFF', accent, {
          fill:{ color:i === 0 ? C.ink : 'FFFFFF', transparency:i === 0 ? 0 : 0 },
          line:{ color:accent, transparency:i === 0 ? 18 : 40, width:0.34 }
        });
        addRect(slide, x, y, cardW, 0.035, accent, accent, {
          fill:{ color:accent, transparency:i === 0 ? 0 : 16 },
          line:{ color:accent, transparency:100 }
        });
        addLabel(slide, item.label, {
          x:x + 0.12, y:labelY, w:0.84, h:labelH,
          fontSize:5.8, color:i === 0 ? C.accent : accent, charSpace:0
        });
        addText(slide, compactEvidenceCaption(item.text, 24), {
          x:x + 0.12, y:bodyY, w:cardW - 0.24, h:bodyH,
          fontSize:6.8, bold:i === 0, color:i === 0 ? C.white : C.body, fit:'shrink', breakLine:true, valign:'mid'
        });
      });
      return;
    }
    const cols = logicItems.length;
    const originX = 1.00;
    const originY = 6.50;
    const slotW = 10.44 / cols;
    logicItems.forEach((item, i) => {
      const col = i;
      const row = 0;
      const x = originX + col * slotW;
      const y = originY + row * 0.26;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      addLabel(slide, item.label, { x, y:y + 0.04, w:0.46, h:0.10, fontSize:5.8, color:accent, charSpace:0 });
      addText(slide, compactEvidenceCaption(item.text, 20), { x:x+0.54, y, w:slotW-0.66, h:0.14, fontSize:7.6, color:C.body, fit:'shrink' });
    });
  }

  return {
    drawBusinessLogicRow,
    drawChartBoardShell,
    drawProofObjectPanel
  };
}

module.exports = {
  createFinancialIndustryChartSlidePanels
};
