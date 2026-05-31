function createAestheticModelHelpers({
  contentSignals = () => ({}),
  flattenText = value => String(value || ''),
  normalizeDeckPlan = plan => plan,
  routeKey = () => '',
  semanticMeaning = () => ({ scores: {} }),
  slideRole = slide => slide.type || 'content'
} = {}) {
  function slideCaptionCount(slide = {}) {
    return (Array.isArray(slide.cards) ? slide.cards.length : 0) +
      (Array.isArray(slide.items) ? slide.items.length : 0) +
      (Array.isArray(slide.lookbook) ? slide.lookbook.length : 0) +
      (Array.isArray(slide.productStory) ? slide.productStory.length : 0) +
      ((slide.visual && slide.visual.caption) ? 1 : 0) +
      (slide.caption ? 1 : 0);
  }

  function hasCommercialLogicChain(slide = {}) {
    const logic = slide.businessLogic || slide.business_logic || slide.diagnosticChain || slide.diagnostic_chain || {};
    const logicHits = ['currentState', 'current_state', 'impact', 'cause', 'root_cause', 'action', 'metric', 'measure', 'kpi']
      .filter(key => logic && logic[key]);
    if (logicHits.length >= 2) return true;
    if ((slide.drivers || slide.inputs) && (slide.actions || slide.outcomes || slide.outputs)) return true;
    if (slide.before && slide.after) return true;
    const text = flattenText(slide);
    const signals = [
      /现状|当前|baseline|current/i,
      /影响|损失|差距|gap|impact/i,
      /原因|根因|驱动|cause|driver/i,
      /动作|措施|方案|action|response/i,
      /指标|衡量|结果|KPI|metric|result/i
    ].filter(re => re.test(text)).length;
    return signals >= 3;
  }

  function aestheticSlideScore(plan = {}, slide = {}, index = 0, total = 1) {
    const signals = contentSignals(plan, slide, index, total);
    const route = routeKey(slide);
    const meaning = semanticMeaning(plan, slide, signals);
    const flags = [];
    const dimensions = {
      hierarchy: 100,
      rhythm: 100,
      densityControl: 100,
      evidenceRelationship: 100,
      industryFit: 100
    };
    if (signals.isDenseText && !['report-board', 'strategy-map', 'risk-table', 'portfolio-table'].includes(slide.type)) {
      dimensions.densityControl -= 24;
      flags.push('denseTextOnLooseLayout');
    }
    if ((signals.cardCount >= 6 || signals.itemCount >= 8) && !['report-board', 'module-matrix', 'risk-table'].includes(slide.type)) {
      dimensions.densityControl -= 16;
      flags.push('cardOverload');
    }
    if (signals.imageCount >= 3 && slideCaptionCount(slide) < Math.min(3, signals.imageCount)) {
      dimensions.evidenceRelationship -= 30;
      flags.push('imageEvidenceWithoutLabels');
    }
    if (signals.imageCount >= 2 && !/case-gallery|product-showcase|portfolio/.test(slide.type || '')) {
      dimensions.evidenceRelationship -= 14;
      flags.push('imageMaterialOnNonEvidenceRoute');
    }
    if (slide.layoutRationale === 'default commercial split') {
      dimensions.rhythm -= 18;
      flags.push('defaultSplitFallback');
    }
    if (/executive-blocks|module-matrix/.test(route) && signals.cardCount >= 5 && meaning.scores.evidenceStrength < 0.35) {
      dimensions.hierarchy -= 18;
      dimensions.industryFit -= 16;
      flags.push('genericCardGrid');
    }
    if (meaning.scores.industryFit < 0.2 && plan.industry && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type)) {
      dimensions.industryFit -= 14;
      flags.push('weakIndustrySignal');
    }
    if ((String(slide.title || '').length > 28 || String(slide.claim || '').length > 92) && !signals.isDenseText) {
      dimensions.hierarchy -= 10;
      flags.push('longHeadline');
    }
    if ((slide.type === 'metric-comparison' || slide.type === 'industry-chart') && !hasCommercialLogicChain(slide)) {
      dimensions.evidenceRelationship -= 14;
      dimensions.industryFit -= 10;
      flags.push('metricWithoutBusinessLogic');
    }
    const score = Math.max(0, Math.round(Object.values(dimensions).reduce((a, v) => a + Math.max(0, v), 0) / Object.keys(dimensions).length));
    return {
      slide: index + 1,
      route,
      score,
      dimensions,
      flags,
      semanticPurpose: meaning.materialPurpose,
      industryFit: meaning.scores.industryFit
    };
  }

  function visualAestheticModel(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const slideScores = slides.map((slide, i) => aestheticSlideScore(normalized, slide, i, slides.length));
    const routeCounts = slideScores.reduce((acc, s) => {
      acc[s.route] = (acc[s.route] || 0) + 1;
      return acc;
    }, {});
    const roleCounts = slides.reduce((acc, slide) => {
      const role = slide.narrativeRole || slideRole(slide);
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    const themeIntentCounts = slides.reduce((acc, slide) => {
      const intent = slide.themeIntent || (slide.compositionPlan && slide.compositionPlan.themeIntent) || 'unset';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {});
    const findings = [];
    slideScores.forEach(s => {
      if (s.score < 62) {
        findings.push({
          slide: s.slide,
          level: 'review',
          type: 'aestheticScore',
          message: `visual aesthetic score ${s.score}; flags: ${s.flags.join(', ') || 'low composition score'}`
        });
      }
    });
    const genericRoutes = ['executive-blocks', 'module-matrix', 'two-column', 'toc-clean'];
    const genericCount = Object.entries(routeCounts)
      .filter(([route]) => genericRoutes.some(g => route === g || route.startsWith(`${g}:`)))
      .reduce((sum, [, count]) => sum + count, 0);
    if (slides.length >= 8 && genericCount / slides.length > 0.42) {
      findings.push({
        level: 'review',
        type: 'visualTemplateFatigue',
        message: `${genericCount}/${slides.length} slides use generic information-board routes; deck needs stronger proof-object rhythm`
      });
    }
    const bodyRouteCounts = slideScores
      .filter(s => !/^cover|^closing|^toc|^chapter-divider/.test(s.route))
      .reduce((acc, s) => {
        acc[s.route] = (acc[s.route] || 0) + 1;
        return acc;
      }, {});
    const maxRepeatedRoute = Math.max(0, ...Object.values(bodyRouteCounts));
    const bodyRouteTotal = Object.values(bodyRouteCounts).reduce((sum, n) => sum + n, 0);
    if (bodyRouteTotal >= 6 && maxRepeatedRoute / bodyRouteTotal > 0.55) {
      const route = Object.entries(bodyRouteCounts).sort((a, b) => b[1] - a[1])[0][0];
      findings.push({
        level: 'review',
        type: 'visualTemplateFatigue',
        message: `${maxRepeatedRoute}/${bodyRouteTotal} body slides repeat ${route}; deck needs more varied page-family rhythm`
      });
    }
    Object.entries(bodyRouteCounts)
      .filter(([route, count]) => count >= 2 && /^industry-chart:/.test(route))
      .forEach(([route, count]) => {
        findings.push({
          level: 'review',
          type: 'repeatedDataComponent',
          message: `${count} body slides reuse ${route}; choose a different chart grammar unless the data structure is truly the same`
        });
      });
    if (slides.length >= 8 && Object.keys(themeIntentCounts).filter(k => k !== 'unset').length < 4) {
      findings.push({
        level: 'review',
        type: 'themeIntentVarietyLow',
        message: `deck only exposes ${Object.keys(themeIntentCounts).filter(k => k !== 'unset').length} theme intents; add clearer opening, diagnosis, proof, system, value, risk, and closing roles`
      });
    }
    const evidenceWeak = slideScores.filter(s => s.flags.includes('imageEvidenceWithoutLabels')).length;
    if (evidenceWeak >= 2) {
      findings.push({
        level: 'review',
        type: 'evidenceRelationshipWeak',
        message: `${evidenceWeak} image-heavy slides lack evidence labels or captions`
      });
    }
    const businessSlides = slides.filter(slide => !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type || ''));
    const logicCount = businessSlides.filter(hasCommercialLogicChain).length;
    const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(String(
      (normalized.materialIntelligence && normalized.materialIntelligence.pptType) ||
      normalized.ppt_type ||
      normalized.pptType ||
      normalized.title ||
      ''
    ));
    if (!isCompanyIntro && businessSlides.length >= 6 && logicCount < Math.min(3, Math.ceil(businessSlides.length * 0.35))) {
      findings.push({
        level: 'review',
        type: 'commercialLogicThin',
        message: `${logicCount}/${businessSlides.length} body slides expose a diagnosis-action-metric chain; deck may feel like a polished template instead of a custom commercial solution`
      });
    }
    const deckScore = slideScores.length
      ? Math.round(slideScores.reduce((sum, s) => sum + s.score, 0) / slideScores.length)
      : 0;
    return {
      deckScore,
      slides: slideScores,
      routeCounts,
      roleCounts,
      themeIntentCounts,
      findings
    };
  }

  return {
    slideCaptionCount,
    hasCommercialLogicChain,
    aestheticSlideScore,
    visualAestheticModel
  };
}

module.exports = {
  createAestheticModelHelpers
};
