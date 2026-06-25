const { createPageFamilyPrimitives } = require('./primitives');
const {
  reportBoardItems
} = require('./business-report-board-data');
const {
  createReportBoardPanels
} = require('./business-report-board-panels');

function createReportBoardRenderer(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    copyFallback,
    reportBoardNeedsRightOverlayRail
  } = ctx;
  const {
    drawEvidenceStack,
    drawExecutiveReadPanel
  } = createReportBoardPanels(ctx);

  function policyContextVariant(s = {}) {
    return /policy-context-board/i.test(String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || ''));
  }

  function lifestyleOperationsBoard(plan = {}, s = {}) {
    return plan.industry === 'lifestyle-food-tourism-fashion'
      && /operating model|report board/i.test(String(s.label || ''));
  }

  function generalOperationsBoard(plan = {}, s = {}) {
    return plan.industry === 'general-operations'
      && /operating model|report board/i.test(String(s.label || ''));
  }

  function reportBoardKicker(plan = {}, s = {}) {
    if (plan.industry === 'government-public-sector' && policyContextVariant(s)) return '政策任务拆解';
    if (lifestyleOperationsBoard(plan, s)) return '运营保障面';
    if (generalOperationsBoard(plan, s)) return '经营复盘面';
    return s.label || 'REPORT BOARD';
  }

  function reportBoardSubtitle(plan = {}, s = {}) {
    if (s.claim || s.subtitle || s.intro) return s.claim || s.subtitle || s.intro;
    if (plan.industry === 'government-public-sector' && policyContextVariant(s)) {
      return '政策任务页要把任务边界、空间资源、服务机制和考核口径落成可执行动作。';
    }
    if (lifestyleOperationsBoard(plan, s)) {
      return '商户协同、活动排期、客流安全和内容复盘要放进同一张体验保障板。';
    }
    if (generalOperationsBoard(plan, s)) {
      return '经营页要把关键判断、证据拆解和后续动作放在同一条复盘链路中。';
    }
    return copyFallback(plan, 'reportBoardClaim');
  }

  return function reportBoard(slide, plan, s, idx) {
    const header = drawLightPageHeader(slide, {
      kicker:reportBoardKicker(plan, s),
      title:s.title || copyFallback(plan, 'industryCoreTitle'),
      titleY:1.04,
      titleW:6.2,
      titleH:0.36,
      titleSubtitleGap:0.16,
      headerContentGap:0.30,
      subtitle:reportBoardSubtitle(plan, s),
      subtitleW:7.0,
      idx,
      pageNumber:'chrome'
    });
    const items = reportBoardItems(s).slice(0,9);
    const summary = s.summary || s.coreBody || s.note || copyFallback(plan, 'reportBoardCoreBody');
    const panelY = Math.max(2.08, Number(header && header.contentTop) || 2.08);
    const panelH = Math.max(3.46, 6.24 - panelY);
    drawExecutiveReadPanel(slide, plan, s, summary, { y:panelY, h:panelH });

    const compactRightRail = reportBoardNeedsRightOverlayRail(s);
    const board = { x:4.12, y:panelY, w:compactRightRail ? 3.54 : 7.46, h:panelH };
    drawEvidenceStack(slide, plan, s, board, items, compactRightRail);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createReportBoardRenderer,
  reportBoardItems
};
