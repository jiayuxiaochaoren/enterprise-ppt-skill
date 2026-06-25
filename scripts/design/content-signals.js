function createContentSignalHelpers(deps = {}) {
  const {
    flattenText,
    keywordHit,
    overlapText,
    visualSystem = {}
  } = deps;

  function contentSignals(plan = {}, s = {}, index = 0, total = 1) {
    const signalTokens = (visualSystem.contentIntelligence && visualSystem.contentIntelligence.signals) || {};
    const text = (overlapText && overlapText(s)) || flattenText(s);
    const numbers = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|億円|百万円|万元|亿元|人|件|台|MW|MWh)?/g) || [];
    const metricNumbers = numbers.filter(n => /%|％|pt|bps|倍|億円|百万円|万元|亿元|人|件|台|MW|MWh/i.test(n));
    const strongMetricWords = ['%', '％', 'KPI', 'YoY', 'revenue', 'profit', '收入', '利润', '同比', '环比', '売上', '営業利益'];
    const weakMetricWords = ['达成', '目标'];
    const hasStrongMetricWord = keywordHit(text, strongMetricWords);
    const hasMetricWord = hasStrongMetricWord || keywordHit(text, weakMetricWords);
    const beforeAfterImageCount = (s.before && (typeof s.before === 'string' || s.before.image || s.before.img) ? 1 : 0) +
      (s.after && (typeof s.after === 'string' || s.after.image || s.after.img) ? 1 : 0);
    const imageCount = (Array.isArray(s.images) ? s.images.length : 0) +
      ((s.visual && Array.isArray(s.visual.images)) ? s.visual.images.length : 0) +
      (s.image || (s.visual && s.visual.image) ? 1 : 0) +
      beforeAfterImageCount;
    const cardCount = Array.isArray(s.cards) ? s.cards.length : 0;
    const itemCount = Array.isArray(s.items) ? s.items.length : 0;
    const phaseCount = Array.isArray(s.phases) ? s.phases.length : 0;
    const actionCount = Array.isArray(s.actions) ? s.actions.length : 0;
    const stepCount = Array.isArray(s.steps) ? s.steps.length : 0;
    const flywheelCount = Array.isArray(s.flywheel) ? s.flywheel.length : 0;
    const layerCount = Array.isArray(s.layers) ? s.layers.length : 0;
    const rowCount = Array.isArray(s.rows) ? s.rows.length : 0;
    const riskCount = Array.isArray(s.risks) ? s.risks.length : 0;
    const controlCount = Array.isArray(s.controls) ? s.controls.length : 0;
    const metricCount = Array.isArray(s.metrics) ? s.metrics.length : 0;
    const productCount = Array.isArray(s.products) ? s.products.length : 0;
    const productStoryCount = Array.isArray(s.productStory) ? s.productStory.length : 0;
    const responsibilityCount = (Array.isArray(s.responsibilities) ? s.responsibilities.length : 0) +
      (Array.isArray(s.owners) ? s.owners.length : 0) +
      (Array.isArray(s.raci) ? s.raci.length : 0) +
      (Array.isArray(s.accountabilities) ? s.accountabilities.length : 0);
    const textBlocks = [
      s.title,
      s.subtitle,
      s.claim,
      s.intro,
      s.note,
      ...(Array.isArray(s.cards) ? s.cards.map(c => `${c.title || ''} ${c.body || c.text || ''}`) : []),
      ...(Array.isArray(s.items) ? s.items.map(flattenText) : []),
      ...(Array.isArray(s.rows) ? s.rows.map(flattenText) : [])
    ].filter(Boolean);
    const avgBlockLength = textBlocks.length ? textBlocks.join('').length / textBlocks.length : text.length;
    const hasExplicitShowcase = (s.visual && s.visual.role === 'showcase') || !!s.product || productCount > 0;
    const hasProductWord = /产品|商品|SKU|系列|套件|设备产品|设备接入包|器械|药品|资产包|方案包|界面|屏幕|模块|lineup|catalog|product|showcase|interface/i.test(text);
    const hasOeeWord = /OEE|稼动|稼動|停机|停線|停线|产线|產線|产能|良率|MTTR|MTBF|设备效率|設備效率|维修效率|維修效率|line efficiency/i.test(text);
    const hasServiceBlueprintWord = /服务蓝图|服務藍圖|服务触点|服務觸點|患者旅程|旅程地图|journey map|service blueprint|frontstage|backstage|到院|导诊|導診|护理交接|檢查協同|检查协同/i.test(text) || /service-blueprint/i.test(String(plan.documentType || ''));
    const hasLookbookWord = /lookbook|产品故事|產品故事|商品故事|品牌故事|门店场景|門店場景|陈列|陳列|搭配|穿搭|视觉图册|視覺圖冊|空间体验|空間體驗/i.test(text);
    const hasSaasCapabilityWord = /平台能力|能力地图|能力架构|产品平台|工作流|自动化|自動化|集成|审计日志|審計日誌|SSO|API|web app|admin console|workflow|automation|integration|audit|platform capability/i.test(text);
    const hasLoopWord = /闭环|循环|飞轮|复盘|反馈|loop|cycle|flywheel|feedback/i.test(text);
    const hasFlywheelWord = /飞轮|增长闭环|运营闭环|复利|growth loop|flywheel|compounding/i.test(text);
    const hasGovernanceWord = /治理|责任|审批|权限|风控|内控|合规|审计|控制|control|governance|compliance|audit/i.test(text);
    const hasResponsibilityWord = /责任闭环|责任人|责任矩阵|定责|协同责任|留痕|RACI|owner|accountable|SLA/i.test(text);
    const hasNegatedRiskLanguage = /不是[^。；,，]*风险|非风险|无风险结构|not\s+(?:a\s+)?risk/i.test(text);
    const hasRiskLanguage = !hasNegatedRiskLanguage && (
      keywordHit(text, signalTokens.risk) ||
      /风险|授权|合规|隐私|安全|故障|停机|告警|risk|warning|hazard|exposure/i.test(text)
    );
    const hasCaseComparison = !!s.before || !!s.after || !!s.beforeAfter || (!!s.case && /对比|before|after|升级前|升级后/i.test(text)) || (imageCount >= 2 && /对比|before|after|升级前|升级后|改造前|改造后/i.test(text));
    const densityMode = String(s.density || s.contentDensity || plan.contentDensity || plan.densityProfile || '').toLowerCase();
    const logicChainMatches = text.match(/因果|逻辑链|链路|输入|输出|产出|结果|驱动|依赖|转化|路径|input|output|outcome|driver|causal|chain/gi) || [];
    const hasNamedLogicChain = /因果|逻辑链|链路|价值路径|价值创造|value creation|causal chain/i.test(text);
    const hasLogicChainWord = hasNamedLogicChain || logicChainMatches.length >= 2 ||
      /input|output|outcome|driver|causal|chain/i.test(text);
    const hasStructuredLogic = !!s.valueChain || !!s.capitals ||
      ((s.drivers || s.inputs) && (s.outcomes || s.outputs)) ||
      ((Array.isArray(s.left) && s.left.length) && (Array.isArray(s.right) && s.right.length) && (cardCount || itemCount));
    const isTextHeavy = densityMode.includes('text') || densityMode.includes('report') || text.length > 520 || avgBlockLength > 86 || rowCount >= 6 || cardCount >= 7 || itemCount >= 9;
    const isImageHeavy = densityMode.includes('image') || densityMode.includes('gallery') || plan.visualIntent === 'image-rich' || plan.visualIntent === 'case-led' || imageCount >= 3;
    const isNumberHeavy = densityMode.includes('number') || densityMode.includes('metric') || metricCount >= 3 || metricNumbers.length >= 3 || (numbers.length >= 3 && (hasStrongMetricWord || (hasMetricWord && metricNumbers.length >= 1)));
    const hasExplicitProcessStructure = phaseCount > 0 || actionCount > 0 || stepCount > 0 ||
      Array.isArray(s.timeline) || Array.isArray(s.milestones);
    const hasStructuredLoop = flywheelCount > 0 || Array.isArray(s.loopItems) || (hasLoopWord && hasExplicitProcessStructure);
    const hasExplicitRiskStructure = rowCount > 0 || riskCount > 0 || controlCount > 0 || Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix);
    const hasExplicitArchitectureStructure = layerCount > 0 || Boolean(s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities);
    const explicitTimelineType = ['timeline', 'timeline-dark'].includes(String(s.type || '')) || /timeline|process|pathway/i.test(String(s.layoutVariant || s.variant || ''));
    const explicitRiskType = ['risk-table'].includes(String(s.type || '')) || /risk|materiality/i.test(String(s.layoutVariant || s.variant || s.proofObject || ''));
    const explicitArchitectureType = ['architecture', 'architecture-dark'].includes(String(s.type || '')) || /architecture|topology|blueprint|capability-map|service-blueprint/i.test(String(s.layoutVariant || s.variant || s.proofObject || ''));
    const hasLogicChain = hasLogicChainWord || hasStructuredLogic || ((s.drivers || s.actions || s.outcomes) && (cardCount || itemCount || phaseCount));
    return {
      index,
      total,
      textLength: text.length,
      numbers: numbers.length,
      imageCount,
      cardCount,
      itemCount,
      phaseCount,
      actionCount,
      stepCount,
      flywheelCount,
      layerCount,
      rowCount,
      riskCount,
      controlCount,
      metricCount,
      productCount,
      productStoryCount,
      responsibilityCount,
      avgBlockLength,
      first: index === 0,
      last: index === total - 1,
      isDenseText: text.length > 380 || avgBlockLength > 72 || rowCount >= 5 || cardCount >= 6 || itemCount >= 8,
      hasMetrics: metricCount > 0 || metricNumbers.length >= 1 || (numbers.length >= 2 && hasStrongMetricWord),
      hasTimeline: explicitTimelineType || hasExplicitProcessStructure,
      hasLoop: hasStructuredLoop,
      hasFlywheel: flywheelCount > 0 || Array.isArray(s.loopItems) || hasFlywheelWord,
      hasStrategyMap: !!s.valueChain || !!s.capitals || !!s.drivers || !!s.actions || !!s.outcomes || keywordHit(text, signalTokens.strategy),
      hasArchitecture: explicitArchitectureType || hasExplicitArchitectureStructure,
      hasProductShowcase: hasExplicitShowcase || (hasProductWord && imageCount <= 1 && !/图册|案例集|gallery|portfolio/i.test(text)),
      hasCaseSignal: keywordHit(text, signalTokens.case),
      hasGallery: imageCount >= 2 || (s.visual && s.visual.role === 'gallery'),
      hasManifesto: !!s.statement || !!s.values || keywordHit(text, signalTokens.culture),
      hasRisk: explicitRiskType || hasExplicitRiskStructure,
      hasRiskLanguage,
      hasGovernance: hasGovernanceWord,
      hasResponsibilityLoop: responsibilityCount > 0 || (hasResponsibilityWord && (rowCount > 0 || hasGovernanceWord)),
      hasComparison: /对比|before|after|升级前|升级后|调整前|调整后|from\s+.+\s+to/i.test(text),
      hasCaseComparison,
      densityMode,
      isTextHeavy,
      isImageHeavy,
      isNumberHeavy,
      hasLogicChain,
      hasNamedLogicChain,
      hasStructuredLogic,
      hasOeeBoard: hasOeeWord,
      hasServiceBlueprint: hasServiceBlueprintWord,
      hasLookbook: hasLookbookWord,
      hasSaasCapability: hasSaasCapabilityWord,
      hasProfile: !!s.company || !!s.description || /公司简介|企业简介|能力证明|company profile|about us|会社概要|成立|资质|客户数量|团队规模|团队能力/i.test(text),
      hasQuote: /引用|客户声音|员工声音|testimonial|quote|interview|message|voice/i.test(text),
      hasChapter: /章节|chapter|section|part\s*\d|agenda/i.test(text),
      hasDenseCards: cardCount >= 5 || itemCount >= 6,
      hasSplitProblem: cardCount >= 3 && /问题|痛点|诉求|挑战|断点|breakpoint/i.test(text)
    };
  }

  function hasArrayField(s = {}, fields = []) {
    return fields.some(k => Array.isArray(s[k]) && s[k].length);
  }

  function hasValueField(s = {}, fields = []) {
    return fields.some(k => s[k] != null && s[k] !== false && s[k] !== '');
  }

  function hasExplicitIndustryChartData(s = {}) {
    const dataComponent = String(s.dataComponent || s.data_component || '').toLowerCase();
    const chartDataComponent = /chart|matrix|scatter|bubble|efficiency|channel|media|roas|roi|monthly|trend|pulse|line|waterfall|bridge|pareto|sensitivity|handoff|funnel|scorecard|table|bar|kpi/.test(dataComponent) &&
      !/milestone|timeline|process|gallery|proof|portfolio|case|product/.test(dataComponent);
    const chartSpecLooksProcessDerived = s.chartSpec && /timeline|process|milestone/.test(`${s.chartSpec.id || ''} ${dataComponent}`);
    return Boolean((s.chartSpec && !chartSpecLooksProcessDerived) || s.chartKind || s.chart_kind || chartDataComponent) ||
      hasValueField(s, [
        'downtimePareto',
        'pareto',
        'lossPareto',
        'oeeLosses',
        'reviewSentiment',
        'valuationSensitivity',
        'sensitivity',
        'exitScenarios',
        'irrSensitivity',
        'qualityHandoff',
        'handoffs',
        'handoffMap',
        'patientBottlenecks',
        'waitBottlenecks',
        'memberCohorts',
        'cohorts',
        'rfmLadder',
        'channelEfficiency',
        'mediaEfficiency',
        'scatter',
        'channels',
        'monthlyPulse',
        'monthlyTrend',
        'trend',
        'waterfallBridge',
        'targetBridge',
        'dispatchMap',
        'siteDispatch',
        'loadStorageDispatch',
        'adoptionFunnel',
        'activationFunnel',
        'cohortFunnel'
      ]);
  }

  function staleIndustryChartRouteShouldYieldToProcess(s = {}, signals = contentSignals({}, s)) {
    if (String(s.type || '') !== 'industry-chart' || !signals.hasTimeline) return false;
    if (hasExplicitIndustryChartData(s)) return false;
    const routeText = `${s.layoutVariant || ''} ${s.variant || ''} ${s.proofObject || s.proof_object || ''} ${s.themeIntent || ''}`;
    return /timeline|process|pathway|operating-path|process-board|阶段|路径|落地|推进/i.test(routeText) ||
      (Array.isArray(s.phases) && s.phases.length >= 2);
  }

  return {
    contentSignals,
    hasArrayField,
    hasExplicitIndustryChartData,
    hasValueField,
    staleIndustryChartRouteShouldYieldToProcess
  };
}

module.exports = {
  createContentSignalHelpers
};
