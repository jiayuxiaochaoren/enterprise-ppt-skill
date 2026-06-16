const {
  createGuidanceAssumptionCore
} = require('./risk-board-guidance-core');
const {
  createGuidanceRiskActionBoard
} = require('./risk-board-guidance-action-board');

function createGuidanceAndRiskBoardRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    panelFill
  } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const { drawGuidanceAssumptionCore } = createGuidanceAssumptionCore(ctx);
  const { drawGuidanceRiskActionBoard } = createGuidanceRiskActionBoard(ctx);

  function drawFinanceGuidanceBoundaryBand(slide, s, rows, assumptions, band) {
    addRect(slide, band.x, band.y, band.w, band.h, panelFill(), C.line, {
      fill:{ color:panelFill(), transparency:0 },
      line:{ color:C.line, transparency:14, width:0.46 }
    });
    addRect(slide, band.x, band.y, 3.12, band.h, C.ink, C.ink, {
      fill:{ color:C.ink, transparency:0 },
      line:{ color:C.ink, transparency:100 }
    });
    addLabel(slide, '预算边界', {
      x:band.x+0.28, y:band.y+0.24, w:1.08, h:0.10,
      fontSize:8.8, color:C.accent, charSpace:0
    });
    addText(slide, s.guidance || s.coreTitle || '下季度边界', {
      x:band.x+0.28, y:band.y+0.54, w:2.20, h:0.20,
      fontSize:13.4, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.note || '预算、现金和毛利三条边界要一起锁定，不能只看增长目标。', {
      x:band.x+0.28, y:band.y+0.84, w:2.36, h:0.18,
      fontSize:8.8, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    const assumptionList = (assumptions.length ? assumptions : rows.slice(0, 3).map(r => `${r[0]} 不越过预警阈值`)).slice(0, 3);
    assumptionList.forEach((item, i) => {
      const x = band.x + 3.34 + i * 2.40;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, band.y+0.14, 2.20, 0.90, i === 0 ? 'FFFFFF' : panelFill(), accent, {
        fill:{ color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0 },
        line:{ color:accent, transparency:34, width:0.32 }
      });
      addLabel(slide, `边界 0${i+1}`, {
        x:x+0.14, y:band.y+0.28, w:0.78, h:0.10,
        fontSize:8.8, color:accent, charSpace:0
      });
      addText(slide, item, {
        x:x+0.14, y:band.y+0.50, w:1.92, h:0.24,
        fontSize:9.2, color:C.body, fit:'shrink', breakLine:true
      });
      addRect(slide, x+1.56, band.y+0.80, 0.28, 0.03, accent, accent, {
        fill:{ color:accent, transparency:14 },
        line:{ color:accent, transparency:100 }
      });
      addRect(slide, x+1.70, band.y+0.90, 0.42, 0.03, accent, accent, {
        fill:{ color:accent, transparency:0 },
        line:{ color:accent, transparency:100 }
      });
    });
  }

  return function guidanceAndRiskBoard(slide, plan, s, idx) {
    const header = drawRiskLightHeader(slide, s, idx, {
      kicker:'GUIDANCE AND RISK BOARD',
      fallbackTitle:'指引与风险边界',
      titleW:6.0,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || '把增长假设、触发条件、责任和动作放在同一张管理板上。',
      subtitleW:7.0,
      chrome:true
    });
    const rows = (s.rows || []).slice(0, 4);
    const assumptions = Array.isArray(s.assumptions) ? s.assumptions : [];
    const contentY = Math.max(2.04, Number(header && header.contentTop) || 2.04);
    const isFinance = plan && plan.industry === 'finance-investment';
    if (isFinance) {
      const overflow = rows.slice(3, 4)[0];
      const overflowRisk = overflow ? (Array.isArray(overflow) ? overflow[0] : overflow.title || overflow.label || '') : '';
      const financeSide = overflowRisk
        ? Object.assign({}, s, {
          note: `${s.note || '预算、现金和毛利三条边界要一起锁定，不能只看增长目标。'} 补充风险跟踪 ${overflowRisk}。`
        })
        : s;
      const band = { x:0.92, y:contentY, w:10.64, h:1.18 };
      drawFinanceGuidanceBoundaryBand(slide, financeSide, rows, assumptions, band);
      const board = { x:0.92, y:contentY + 1.44, w:10.64, h:Math.max(2.16, 6.04 - (contentY + 1.44)) };
      const boardRows = rows.slice(0, 3);
      drawGuidanceRiskActionBoard(slide, plan, boardRows, board);
      drawRiskBoardFooter(slide, plan);
      return;
    }
    const contentH = Math.max(3.48, 6.04 - contentY);
    const core = { x:0.92, y:contentY, w:2.82, h:contentH };
    drawGuidanceAssumptionCore(slide, plan, s, rows, assumptions, core);
    const board = { x:4.02, y:contentY, w:7.54, h:contentH };
    drawGuidanceRiskActionBoard(slide, plan, rows, board);
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createGuidanceAndRiskBoardRenderer
};
