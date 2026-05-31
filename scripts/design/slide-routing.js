function createSlideRoutingHelpers(deps = {}) {
  const {
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryChartVariant,
    layoutVariantCompatibleWithType,
    selectReferenceRecipe,
    semanticFrame,
    staleIndustryChartRouteShouldYieldToProcess,
    themeIntentFor,
    visualIndustryId
  } = deps;

  function recipeAutoRouteAllowed(recipe = null, s = {}, signals = contentSignals({}, s)) {
    const renderType = String((recipe && (recipe.renderType || recipe.slideType)) || '');
    const hasProcessStructure = Array.isArray(s.phases) ||
      Array.isArray(s.actions) ||
      Array.isArray(s.steps) ||
      Array.isArray(s.timeline) ||
      Array.isArray(s.milestones) ||
      signals.hasTimeline;
    const hasRiskStructure = Array.isArray(s.rows) ||
      Array.isArray(s.risks) ||
      Array.isArray(s.controls) ||
      Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix) ||
      signals.hasRisk ||
      signals.hasResponsibilityLoop;
    const hasArchitectureStructure = Array.isArray(s.layers) ||
      Boolean(s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities) ||
      signals.hasArchitecture;
    const hasValueStructure = Boolean(s.valueChain || s.capitals || s.drivers || s.outcomes || s.inputs || s.outputs) ||
      signals.hasStructuredLogic ||
      signals.hasNamedLogicChain ||
      signals.hasStrategyMap;
    if (['timeline', 'timeline-dark'].includes(renderType)) return hasProcessStructure;
    if (renderType === 'risk-table') return hasRiskStructure;
    if (['architecture', 'architecture-dark'].includes(renderType)) return hasArchitectureStructure;
    if (renderType === 'strategy-map') return hasValueStructure;
    return true;
  }

  function recommendSlideType(plan = {}, s = {}, index = 0, total = 1) {
    const signals = contentSignals(plan, s, index, total);
    if (s.type && s.type !== 'auto' && s.type !== 'content') {
      if (staleIndustryChartRouteShouldYieldToProcess(s, signals)) {
        return { type: 'timeline', reason: 'process fields override stale industry-chart route' };
      }
      return { type: s.type, locked: true, reason: 'explicit type' };
    }
    const semantic = semanticFrame(plan, s, signals);
    const themeIntent = themeIntentFor(plan, s, index, total, signals);
    if (signals.first) return { type: 'cover', reason: 'first slide' };
    if (signals.last && /结束|收束|下一步|closing|thank|thanks|谢谢|感谢|观看|答疑|Q&A|alignment/i.test(flattenText(s))) {
      return { type: 'closing', reason: 'closing signal' };
    }
    if (signals.last && (s.decision || s.summary || (Array.isArray(s.actions) && s.actions.length))) {
      return { type: 'closing', reason: 'last slide decision/action fields' };
    }
    if (s.company || s.description) return { type: 'profile-proof', reason: 'explicit profile proof fields' };
    if (s.quote || s.statement) return { type: 'quote-proof', reason: 'explicit quote/statement field' };
    if (s.serviceBlueprint || s.touchpoints || s.journeyMap) return { type: 'architecture', reason: 'explicit service blueprint fields' };
    if (s.productionLine) return { type: 'architecture', reason: 'explicit production topology field' };
    if (s.downtimePareto || s.valuationSensitivity || s.qualityHandoff || s.memberCohorts || s.channelEfficiency || s.mediaEfficiency || s.monthlyPulse || s.monthlyTrend || s.waterfallBridge || s.targetBridge || s.dispatchMap || s.adoptionFunnel) {
      return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject || 'explicit-chart'}` };
    }
    if (s.oee || s.oeeComponents) return { type: 'metric-comparison', reason: 'explicit OEE metrics fields' };
    if (s.lookbook || s.productStory) return { type: 'case-gallery', reason: 'explicit lookbook/product story fields' };
    if (s.platformCapabilities || s.capabilityMap) return { type: 'architecture', reason: 'explicit platform capability fields' };
    if (s.product || (Array.isArray(s.products) && s.products.length)) return { type: 'product-showcase', reason: 'explicit product/showcase fields' };
    if (s.before || s.after || s.beforeAfter) return { type: 'case-gallery', reason: 'explicit before/after case comparison fields' };
    if ((Array.isArray(s.flywheel) && s.flywheel.length) || (Array.isArray(s.loopItems) && s.loopItems.length)) return { type: 'timeline', reason: 'explicit flywheel/loop fields' };
    if (Array.isArray(s.bridge) && s.bridge.length) {
      return plan.industry === 'finance-investment'
        ? { type: 'finance-bridge', reason: 'explicit finance bridge field' }
        : { type: 'industry-chart', reason: 'explicit business bridge field' };
    }
    if (Array.isArray(s.portfolio) && s.portfolio.length) return { type: 'portfolio-table', reason: 'explicit portfolio table field' };
    if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
    if (Array.isArray(s.metrics) && s.metrics.length) return { type: 'metric-comparison', reason: 'explicit metrics field' };
    const hasExplicitGovernanceTable = Array.isArray(s.rows) ||
      (Array.isArray(s.responsibilities) && s.responsibilities.length) ||
      (Array.isArray(s.owners) && s.owners.length) ||
      (Array.isArray(s.raci) && s.raci.length) ||
      (Array.isArray(s.accountabilities) && s.accountabilities.length);
    if (signals.isNumberHeavy && !hasExplicitGovernanceTable && !signals.hasGovernance && !signals.hasResponsibilityLoop && !signals.isTextHeavy && !signals.isDenseText) {
      return { type: 'metric-comparison', reason: 'number-heavy material signals' };
    }
    if (/risk-warning/i.test(themeIntent) && (Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls) || signals.hasRisk || signals.hasRiskLanguage)) return { type: 'risk-table', reason: 'theme intent: risk warning' };
    if (/case-evidence/i.test(themeIntent) && ((Array.isArray(s.images) && s.images.length) || signals.hasCaseSignal || signals.hasGallery)) return { type: 'case-gallery', reason: 'theme intent: case evidence' };
    if (/system-architecture/i.test(themeIntent) && (Array.isArray(s.layers) || signals.hasArchitecture)) return { type: 'architecture', reason: 'theme intent: system architecture' };
    if (/operating-path/i.test(themeIntent) && (Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.timeline) || Array.isArray(s.milestones) || signals.hasTimeline) && !signals.hasSplitProblem && signals.cardCount < 5) return { type: 'timeline', reason: 'theme intent: operating path' };
    if (/value-signal/i.test(themeIntent) && (Array.isArray(s.metrics) || signals.hasMetrics || signals.isNumberHeavy) && !signals.isTextHeavy && !signals.isDenseText) return { type: 'metric-comparison', reason: 'theme intent: value signal' };
    if ((Array.isArray(s.responsibilities) && s.responsibilities.length) ||
        (Array.isArray(s.owners) && s.owners.length) ||
        (Array.isArray(s.raci) && s.raci.length) ||
        (Array.isArray(s.accountabilities) && s.accountabilities.length)) {
      return { type: 'risk-table', reason: 'explicit responsibility governance fields' };
    }
    if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
    if (Array.isArray(s.rows) && s.rows.length) return { type: 'risk-table', reason: 'explicit risk/governance rows' };
    if (s.drivers || s.actions || s.outcomes || s.valueChain || s.capitals) return { type: 'strategy-map', reason: 'explicit value-chain fields' };
    if (Array.isArray(s.layers) && s.layers.length) return { type: 'architecture', reason: 'explicit architecture layers' };
    if (Array.isArray(s.phases) && s.phases.length) return { type: 'timeline', reason: 'explicit process phases' };
    if ((Array.isArray(s.images) && s.images.length) || (s.visual && Array.isArray(s.visual.images) && s.visual.images.length)) {
      return { type: 'case-gallery', reason: 'explicit gallery images' };
    }
    if (Array.isArray(s.columns) && s.columns.length >= 2) return { type: 'comparison', reason: 'explicit comparison columns' };
    if (signals.isNumberHeavy) return { type: 'metric-comparison', reason: 'number-heavy material signals' };
    if (signals.hasStructuredLogic || signals.hasNamedLogicChain) return { type: signals.phaseCount > 0 ? 'timeline' : 'strategy-map', reason: 'logic-chain material signals' };
    if (signals.isDenseText && signals.hasSplitProblem && !signals.phaseCount && !signals.flywheelCount) {
      return { type: 'report-board', reason: 'dense diagnostic/problem material signals' };
    }
    if (signals.isTextHeavy) return { type: 'report-board', reason: 'text-heavy report material signals' };
    if (Array.isArray(s.cards) && s.cards.length >= 3) {
      return { type: s.cards.length >= 5 ? 'module-matrix' : 'executive-blocks', reason: 'explicit card group' };
    }
    const recipe = selectReferenceRecipe(plan, s, signals);
    if (recipe && recipe.score >= 8 && recipe.renderType && recipeAutoRouteAllowed(recipe, s, signals)) {
      return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
    }
    if (signals.hasProfile) return { type: 'profile-proof', reason: 'company/profile proof signals' };
    if (signals.hasQuote) return { type: 'quote-proof', reason: 'quote/voice proof signals' };
    if (signals.hasCaseComparison) return { type: 'case-gallery', reason: 'before/after case comparison signals' };
    if (signals.hasComparison) return { type: 'comparison', reason: 'before/after comparison signals' };
    if (signals.hasChapter) return { type: 'chapter-divider', reason: 'chapter divider signals' };
    if (signals.hasProductShowcase) return { type: 'product-showcase', reason: 'product/showcase signals' };
    if (signals.hasFlywheel) return { type: 'timeline', reason: 'flywheel/operating loop signals' };
    if (signals.hasResponsibilityLoop) return { type: 'risk-table', reason: 'responsibility governance signals' };
    if (signals.hasRisk || signals.hasRiskLanguage) return { type: 'risk-table', reason: 'risk/governance signals' };
    if (signals.isImageHeavy && signals.hasCaseSignal) return { type: 'case-gallery', reason: 'image-heavy case/evidence signals' };
    if (signals.isNumberHeavy) return { type: 'metric-comparison', reason: 'number-heavy material signals' };
    if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
    if (signals.hasMetrics) return { type: 'metric-comparison', reason: 'metric/KPI signals' };
    if (signals.isTextHeavy) return { type: 'report-board', reason: 'text-heavy report material signals' };
    if (signals.hasLogicChain) return { type: signals.phaseCount > 0 ? 'timeline' : 'strategy-map', reason: 'logic-chain material signals' };
    if (signals.hasStrategyMap) return { type: 'strategy-map', reason: 'value-chain/strategy signals' };
    if (signals.hasManifesto) return { type: 'manifesto', reason: 'culture/values signal' };
    if (signals.hasGallery) return { type: 'case-gallery', reason: 'multiple visual/case signals' };
    if (signals.hasArchitecture) return { type: 'architecture', reason: 'architecture/module signals' };
    if (signals.hasTimeline) return { type: 'timeline', reason: 'process/timeline signals' };
    if (signals.hasDenseCards) return { type: 'module-matrix', reason: 'dense card set' };
    if (signals.hasSplitProblem) return { type: 'executive-blocks', reason: 'problem split card set' };
    if (s.left || s.right || s.leftTitle || s.rightTitle) return { type: 'two-column', reason: 'two-sided narrative' };
    if (recipe && recipe.score >= 6 && recipe.renderType && recipeAutoRouteAllowed(recipe, s, signals)) {
      return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
    }
    return { type: 'executive-blocks', reason: 'default commercial split' };
  }

  function pickLayoutVariant(plan = {}, s = {}, type = s.type, signals = contentSignals(plan, s)) {
    if (s.layoutVariant || s.variant) return s.layoutVariant || s.variant;
    const industry = plan.industry || '';
    const visualIndustry = visualIndustryId(industry);
    const text = flattenText(s);
    const proofVariant = String(s.proofObject || s.proof_object || '').trim();
    if (proofVariant && highValuePageFamilies.has(proofVariant) && layoutVariantCompatibleWithType(type, proofVariant)) return proofVariant;
    const imageCount = signals.imageCount;
    const cardCount = signals.cardCount;
    const rowCount = signals.rowCount;
    const phaseCount = signals.phaseCount;
    const layerCount = signals.layerCount;
    const productCount = signals.productCount;
    if (type === 'cover' || type === 'cover-dark') {
      if (industry === 'beauty-consumer' || /美妆|美容|护肤|彩妆|香氛|beauty|cosmetic/i.test(text)) return 'beauty-brand-editorial-cover';
      if (industry === 'people-culture' || /文化|使命|招聘|团队|culture|hiring/i.test(text)) return 'culture-cover-with-soft-geometry';
      if (/概念|opening|开场|愿景|minimal|airy/i.test(text)) return 'airy-concept-opening';
      return s.layoutVariant;
    }
    if (type === 'industry-chart') {
      return industryChartVariant(plan, s, signals);
    }
    if (type === 'chapter-divider' || type === 'toc' || type === 'toc-clean') {
      if (industry === 'energy-utility') return 'energy-sequence';
      if (/董事会|管理层|高管|决策摘要|汇报重点|审议|board|briefing|executive/i.test(text) && industry !== 'finance-investment') return 'board-briefing';
      if (visualIndustry === 'brand-retail' || signals.hasGallery || /画册|品牌|门店|产品故事|lookbook|editorial|美妆|美容|消费/i.test(text)) return 'editorial-agenda';
      if (industry === 'finance-investment' || /投委会|议题|决策|配置|agenda|committee/i.test(text)) return 'agenda-board';
      if (industry === 'healthcare-operations' || /患者|就诊|护理|服务蓝图|旅程地图|journey|service blueprint/i.test(text) || (industry !== 'manufacturing-operations' && /客户旅程|用户旅程|服务路径|服务流程/i.test(text))) return 'pathway-map';
      if (industry === 'manufacturing-operations') return 'line-agenda';
      if (industry === 'saas-technology') return 'adoption-agenda';
      return 'chapter-hero';
    }
    if (type === 'metric-comparison') {
      if (industry === 'manufacturing-operations' && (s.oee || s.oeeComponents || signals.hasOeeBoard)) return 'oee-board';
      if (industry === 'healthcare-operations') return 'patient-service-scorecard';
      if (visualIndustry === 'brand-retail') return 'member-growth-board';
      if (industry === 'saas-technology') return 'adoption-revenue-board';
      if (/quarter|季度|Q[1-4]|业绩|results/i.test(text)) return 'quarterly-results-summary';
      if (/KPI|关键指标|主指标|highlight|numerical/i.test(text)) return 'financial-kpi-snapshot';
      if (/chart|图表|评论|commentary|趋势|同比|环比/i.test(text)) return 'chart-grid-with-commentary';
      return s.layoutVariant;
    }
    if (type === 'product-showcase') {
      if (productCount >= 4 || cardCount >= 4) return 'catalog-grid';
      if (productCount >= 2 || cardCount >= 3) return 'feature-strip';
      return 'hero-object';
    }
    if (type === 'architecture' || type === 'architecture-dark') {
      if (industry === 'saas-technology' && (s.platformCapabilities || s.capabilityMap || signals.hasSaasCapability)) return 'platform-capability-map';
      if (s.serviceBlueprint || s.touchpoints || s.journeyMap || (industry === 'healthcare-operations' && signals.hasServiceBlueprint)) return 'service-blueprint';
      if (s.nodes || s.hubs || /生态|网络|节点|拓扑|hub|spoke/i.test(text)) return 'hub-spoke';
      if (industry === 'manufacturing-operations' && (/产线|產線|设备|設備|PLC|传感器|点检|备件|OEE|line|equipment/i.test(text) || signals.hasOeeBoard)) return 'production-topology';
      if (signals.isDenseText || layerCount >= 4 || ['finance-investment', 'healthcare-operations'].includes(industry)) return 'blueprint-stack';
      return 'layer-stack';
    }
    if (type === 'strategy-map') {
      if (/价值创造|value creation|capital|资本|投入|产出/i.test(text)) return 'value-creation-process-map';
      if (industry === 'beauty-consumer' && /品牌世界|brand world|业务证明|经营证明/i.test(text)) return 'brand-world-and-business-proof';
      if (/单一概念|single object|concept map|核心对象|主对象/i.test(text)) return 'single-object-concept-map';
      return s.layoutVariant;
    }
    if (type === 'manifesto') {
      if (/使命|愿景|mission|vision|statement/i.test(text)) return 'mission-statement-stage';
      if (/价值观|原则|principle|values?/i.test(text)) return 'value-principle-cards';
      if (/文化|招聘|团队|culture|hiring/i.test(text)) return 'culture-cover-with-soft-geometry';
      return s.layoutVariant;
    }
    if (type === 'timeline' || type === 'timeline-dark') {
      if (s.flywheel || s.loopItems || signals.hasFlywheel) return 'flywheel';
      if (s.loop || signals.hasLoop) return 'closed-loop';
      if (signals.isDenseText || phaseCount >= 5) return 'process-board';
      return 'pathway-rail';
    }
    if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') {
      if (visualIndustry === 'brand-retail' && (s.lookbook || s.productStory || signals.hasLookbook) && imageCount >= 2) return 'lookbook-story';
      if (industry === 'beauty-consumer' && /品牌世界|brand world|世界观|业务证明|经营证明/i.test(text)) return 'brand-world-and-business-proof';
      if (industry === 'beauty-consumer' && /产品证据|product evidence|产品故事|系列|单品/i.test(text)) return 'product-evidence-story';
      if (industry === 'beauty-consumer' && (imageCount >= 2 || /消费者|用户|门店|场景|photo grid/i.test(text))) return 'consumer-proof-photo-grid';
      if ((industry === 'people-culture' || industry === 'people-culture-company') && /团队|员工|人物|people|member|mosaic/i.test(text)) return 'people-proof-mosaic';
      if (signals.hasCaseComparison) return 'case-comparison';
      if (industry === 'finance-investment' && imageCount >= 2 && /组合|项目|投委会|投资|案例|证据|portfolio|investment|deal|case/i.test(text)) return 'portfolio-evidence';
      if (industry === 'healthcare-operations' && imageCount >= 2 && /患者|服务|触点|导诊|检查|随访|体验|service|patient|journey|touchpoint/i.test(text)) return 'service-touchpoint';
      if (industry === 'energy-utility' && imageCount >= 2 && /站端|现场|电站|储能|资产|告警|证据|site|asset|evidence/i.test(text)) return 'site-evidence';
      if (industry === 'saas-technology' && imageCount >= 2 && /原型|界面|工作流|产品图册|产品体验|prototype|workflow|screen|interface/i.test(text)) return 'prototype-flow';
      if (imageCount >= 4 || cardCount >= 5) return 'evidence-board';
      if (imageCount === 1 || s.case || s.client || signals.isDenseText) return 'case-hero';
      return 'triptych-gallery';
    }
    if (type === 'risk-table' || type === 'table') {
      if (s.responsibilities || s.owners || s.raci || s.accountabilities || (/责任闭环|责任矩阵|RACI/i.test(flattenText(s)))) return 'responsibility-loop';
      if (/materiality|重要性|双重重要性|议题矩阵/i.test(text)) return 'materiality-matrix-board';
      if (/guidance|指引|业绩指引|风险看板|risk board/i.test(text)) return 'guidance-and-risk-board';
      if (s.matrix || /矩阵|matrix|概率|可能性|影响等级|影响程度|impact|likelihood/i.test(flattenText(s))) return 'risk-matrix';
      if (/governance|治理|董事会|委员会|合规/i.test(text)) return 'governance-table-editorial';
      if (signals.hasResponsibilityLoop && !s.matrix) return 'responsibility-loop';
      if (rowCount >= 5 || signals.hasGovernance) return 'control-stack';
      return 'governance-board';
    }
    if (type === 'closing' || type === 'closing-dark') {
      const text = flattenText(s);
      const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(String((plan.materialIntelligence && plan.materialIntelligence.pptType) || plan.ppt_type || plan.pptType || plan.title || ''));
      if (s.closingVariant) return s.closingVariant;
      if (isCompanyIntro && /谢谢|感谢|观看|联系|交流|答疑|Q&A/i.test(text)) return 'company-thanks';
      if (s.contact || s.contacts || /谢谢|感谢|观看|thank|thanks|答疑|Q&A/i.test(text)) return 'thank-you';
      if (industry === 'energy-utility') return 'energy-stage';
      if (industry === 'finance-investment') return 'investment-decision';
      if (industry === 'manufacturing-operations') return 'pilot-rollout';
      if (industry === 'healthcare-operations') return 'quality-handoff';
      if (industry === 'saas-technology') return 'adoption-close';
      if (visualIndustry === 'brand-retail') return 'premium-closing-anchor';
      if (s.decision || s.summary || signals.isDenseText) return 'decision-summary';
      if (s.image || (s.visual && s.visual.image)) return 'image-statement';
      if (!s.actions && !s.decision && !s.summary && /结束|收尾|closing|end/i.test(text)) return 'simple-end';
      return s.closingVariant || 'auto';
    }
    return s.layoutVariant;
  }

  return {
    pickLayoutVariant,
    recipeAutoRouteAllowed,
    recommendSlideType
  };
}

module.exports = {
  createSlideRoutingHelpers
};
