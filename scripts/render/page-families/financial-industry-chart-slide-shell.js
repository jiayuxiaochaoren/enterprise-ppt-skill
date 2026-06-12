function createFinancialIndustryChartSlideShell(ctx = {}, deps = {}) {
  const {
    drawBusinessLogicRow,
    drawChartBoardShell,
    drawFooter,
    drawLightPageHeader,
    drawProofObjectPanel,
    renderFinancialIndustryBoard,
    renderIndustryVariantBoard
  } = deps;

  function logicValuesFor(slide = {}) {
    const logic = slide.businessLogic || slide.business_logic || slide.diagnosticChain || slide.diagnostic_chain || {};
    if (Array.isArray(logic)) return [];
    return Object.values(logic).filter(Boolean);
  }

  function routeDrawsIndustryChart(slide = {}) {
    const type = String(slide.type || '').toLowerCase();
    if (type === 'industry-chart') return true;
    const variant = String(slide.variant || slide.layoutVariant || slide.proofObject || slide.proof_object || '').toLowerCase();
    return /monthly-pulse|channel-efficiency|waterfall|pareto|handoff|dispatch|funnel|matrix|trend/.test(variant);
  }

  function explicitBusinessLogicMode(s = {}) {
    const raw = s.businessLogicMode || s.business_logic_mode || s.logicRowMode || s.logic_row_mode || s.businessLogicDisplay || s.business_logic_display || '';
    const mode = String(raw || '').trim().toLowerCase();
    if (/^(show|always|visible|on|force)$/.test(mode)) return 'show';
    if (/^(hide|hidden|off|none|suppress)$/.test(mode)) return 'hide';
    return '';
  }

  function shouldDrawBusinessLogicRow(plan = {}, s = {}) {
    const mode = explicitBusinessLogicMode(s);
    if (mode === 'show') return true;
    if (mode === 'hide') return false;
    const slides = Array.isArray(plan.slides) ? plan.slides : [];
    const logicSlides = slides.filter(slide => logicValuesFor(slide).length >= 2 && routeDrawsIndustryChart(slide));
    if (logicSlides.length <= 2) return true;
    return false;
  }

  function titleMetrics(title = '') {
    const normalized = String(title || '').replace(/\s+/g, '').trim();
    const chars = normalized.length;
    const extraLong = chars > 30;
    const long = chars > 18;
    return {
      chars,
      long,
      extraLong,
      titleY: extraLong ? 1.02 : 1.06,
      titleW: long ? 10.12 : 5.9,
      titleH: extraLong ? 0.74 : (long ? 0.44 : 0.36),
      titleSize: extraLong ? 20.2 : (long ? 22.4 : 24),
      titleBreakLine: extraLong,
      subtitleY: extraLong ? 2.04 : (long ? 1.72 : 1.54),
      subtitleW: long ? 9.20 : 7.0,
      subtitleH: extraLong ? 0.24 : 0.20,
      subtitleBreakLine: extraLong,
      subtitleSize: extraLong ? 9.2 : 10.2,
      contentY: extraLong ? 2.42 : (long ? 2.24 : 2.10),
      contentH: extraLong ? 3.92 : (long ? 4.06 : 4.16)
    };
  }

  function fullBoardVariant(variant = '') {
    return new Set([
      'adoption-funnel',
      'member-cohort-ladder',
      'patient-bottleneck'
    ]).has(String(variant || ''));
  }

  function nativeVariantOwnsBoard(variant = '') {
    return new Set([
      'adoption-funnel',
      'dispatch-map',
      'downtime-pareto',
      'fact-metrics',
      'member-cohort-ladder',
      'patient-bottleneck',
      'quality-handoff',
      'valuation-sensitivity'
    ]).has(String(variant || ''));
  }

  return function renderIndustryChartSlideShell(slide, plan, s, idx, variant, variantLabel) {
    const title = s.title || '行业证据读数';
    const header = titleMetrics(title);
    const drawnHeader = drawLightPageHeader(slide, {
      kicker:variantLabel,
      title,
      titleY:header.titleY,
      titleW:header.titleW,
      titleH:header.titleH,
      titleSize:header.titleSize,
      titleBreakLine:header.titleBreakLine,
      subtitle:s.subtitle || s.claim,
      subtitleY:header.subtitleY,
      subtitleW:header.subtitleW,
      subtitleH:header.subtitleH,
      subtitleBreakLine:header.subtitleBreakLine,
      subtitleSize:header.subtitleSize,
      idx
    });

    const logicItems = logicValuesFor(s);
    const hasLogic = logicItems.length >= 2 && shouldDrawBusinessLogicRow(plan, s);
    const fullBoard = fullBoardVariant(variant);
    const contentY = Math.max(header.contentY, (drawnHeader && drawnHeader.contentTop) || header.contentY);
    const noLogicH = Math.max(3.36, (header.contentY + header.contentH) - contentY);
    const side = fullBoard
      ? null
      : { x:0.92, y:contentY, w:2.62, h:hasLogic ? 4.34 : noLogicH };
    const board = fullBoard
      ? { x:0.92, y:contentY, w:10.84, h:hasLogic ? 3.58 : noLogicH }
      : { x:3.92, y:contentY, w:7.76, h:hasLogic ? 3.44 : noLogicH };
    const logicZone = hasLogic
      ? {
        x:fullBoard ? 0.92 : 3.92,
        y:5.78,
        w:fullBoard ? 10.84 : 7.76,
        h:0.74
      }
      : null;
    if (side) drawProofObjectPanel(slide, s, side, variantLabel);
    drawChartBoardShell(slide, board);

    if (nativeVariantOwnsBoard(variant) && renderIndustryVariantBoard(slide, s, variant, board)) {
      // Variant-specific evidence boards own the content zone before generic chartSpec routing.
    } else if (renderFinancialIndustryBoard(slide, plan, s, idx, variant, board)) {
      // chartSpec/v1 or native chart renderer owns the board.
    } else {
      renderIndustryVariantBoard(slide, s, variant, board);
    }
    if (hasLogic) drawBusinessLogicRow(slide, s, logicZone);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFinancialIndustryChartSlideShell
};
