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

  function financeBoundaryLabel(item = '', index = 0) {
    const text = String(item || '');
    if (/回款|现金|账期|应收/i.test(text)) return '现金边界';
    if (/毛利|利润|成本|费用/i.test(text)) return '毛利边界';
    if (/需求|订单|收入|销量|签约/i.test(text)) return '预算边界';
    return ['预算边界', '现金边界', '毛利边界'][index] || `边界 ${index + 1}`;
  }

  function lifestyleBoundaryLabel(item = '', index = 0) {
    const text = String(item || '');
    if (/客流|拥堵|排队|高峰/i.test(text)) return '容量边界';
    if (/商户|服务|质量/i.test(text)) return '商户边界';
    if (/内容|调性|品牌|传播/i.test(text)) return '品牌边界';
    if (/天气|降雨|高温|台风/i.test(text)) return '天气边界';
    return ['容量边界', '商户边界', '品牌边界'][index] || `边界 ${index + 1}`;
  }

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
      addLabel(slide, financeBoundaryLabel(item, i), {
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

  function drawLifestyleGuidanceBoundaryBand(slide, s, rows, assumptions, band) {
    addRect(slide, band.x, band.y, band.w, band.h, panelFill(), C.line, {
      fill:{ color:panelFill(), transparency:0 },
      line:{ color:C.line, transparency:14, width:0.46 }
    });
    addRect(slide, band.x, band.y, 3.02, band.h, C.ink, C.ink, {
      fill:{ color:C.ink, transparency:0 },
      line:{ color:C.ink, transparency:100 }
    });
    addLabel(slide, '场景边界', {
      x:band.x+0.28, y:band.y+0.20, w:0.90, h:0.10,
      fontSize:8.8, color:C.accent, charSpace:0
    });
    addText(slide, s.guidance || s.coreTitle || '体验增长边界', {
      x:band.x+0.28, y:band.y+0.44, w:2.12, h:0.18,
      fontSize:13.2, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.note || '高峰容量、商户质量和品牌调性必须一起守住。', {
      x:band.x+0.28, y:band.y+0.68, w:2.34, h:0.16,
      fontSize:8.0, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    const assumptionList = (assumptions.length ? assumptions : rows.slice(0, 3).map(r => `${r[0]} 不越过场景阈值`)).slice(0, 3);
    assumptionList.forEach((item, i) => {
      const x = band.x + 3.26 + i * 2.34;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, band.y+0.12, 2.12, 0.80, i === 0 ? 'FFFFFF' : panelFill(), accent, {
        fill:{ color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0 },
        line:{ color:accent, transparency:34, width:0.32 }
      });
      addLabel(slide, lifestyleBoundaryLabel(item, i), {
        x:x+0.14, y:band.y+0.24, w:0.74, h:0.10,
        fontSize:8.0, color:accent, charSpace:0
      });
      addText(slide, item, {
        x:x+0.14, y:band.y+0.44, w:1.84, h:0.18,
        fontSize:8.2, color:C.body, fit:'shrink', breakLine:true
      });
    });
  }

  return function guidanceAndRiskBoard(slide, plan, s, idx) {
    const isFinance = plan && plan.industry === 'finance-investment';
    const isLifestyle = plan && plan.industry === 'lifestyle-food-tourism-fashion';
    const header = drawRiskLightHeader(slide, s, idx, {
      kicker:isFinance ? '经营边界看板' : (isLifestyle ? '场景风险与动作' : 'GUIDANCE AND RISK BOARD'),
      fallbackTitle:'指引与风险边界',
      titleW:(isFinance || isLifestyle) ? 6.7 : 6.0,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || (isFinance
        ? '把预算、现金和毛利边界放进同一张经营管理板。'
        : (isLifestyle
          ? '把体验边界、现场触发点和补救动作放进同一张运营保障板。'
          : '把增长假设、触发条件、责任和动作放在同一张管理板上。')),
      subtitleW:7.0,
      chrome:true
    });
    const rows = (s.rows || []).slice(0, 4);
    const assumptions = Array.isArray(s.assumptions) ? s.assumptions : [];
    const contentY = Math.max(2.04, Number(header && header.contentTop) || 2.04);
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
    if (isLifestyle) {
      const overflow = rows.slice(3, 4)[0];
      const overflowRisk = overflow ? (Array.isArray(overflow) ? overflow[0] : overflow.title || overflow.label || '') : '';
      const lifestyleSide = overflowRisk
        ? Object.assign({}, s, {
          note: `${s.note || '高峰容量、商户质量和品牌调性必须一起守住。'} 另需预留 ${overflowRisk} 的替代方案。`
        })
        : s;
      const band = { x:0.92, y:contentY, w:10.64, h:1.04 };
      drawLifestyleGuidanceBoundaryBand(slide, lifestyleSide, rows, assumptions, band);
      const board = { x:0.92, y:contentY + 1.22, w:10.64, h:Math.max(2.50, 6.04 - (contentY + 1.22)) };
      drawGuidanceRiskActionBoard(slide, plan, rows, board);
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
