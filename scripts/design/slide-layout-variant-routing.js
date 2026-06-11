function createLayoutVariantPicker(deps = {}) {
  const {
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryChartVariant,
    layoutVariantCompatibleWithType,
    visualIndustryId
  } = deps;

  function hasExplicitRiskMatrixData(s = {}) {
    if (s.riskMatrix || s.risk_matrix || s.controlsMatrix || s.controls_matrix) return true;
    const matrix = s.matrix;
    if (!matrix) return false;
    if (matrix === true) return true;
    if (Array.isArray(matrix)) return matrix.length > 0;
    if (typeof matrix !== 'object') return Boolean(matrix);
    return ['items', 'points', 'cells', 'quadrants', 'rows', 'data', 'risks']
      .some(field => Array.isArray(matrix[field]) && matrix[field].length);
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
      const riskVariantText = `${s.layoutVariant || ''} ${s.variant || ''} ${s.proofObject || s.proof_object || ''}`;
      const explicitRiskMatrix = /(^|[\s:_-])risk-matrix($|[\s:_-])|materiality-matrix/i.test(riskVariantText);
      const riskRegisterIntent = /(^|[\s:_-])risk-register($|[\s:_-])/i.test(riskVariantText);
      if (hasExplicitRiskMatrixData(s) || explicitRiskMatrix || (!riskRegisterIntent && /风险矩阵|概率|可能性|影响等级|影响程度|impact|likelihood/i.test(text))) return 'risk-matrix';
      if (/governance|治理|董事会|委员会|合规/i.test(text)) return 'governance-table-editorial';
      if (signals.hasResponsibilityLoop && !hasExplicitRiskMatrixData(s)) return 'responsibility-loop';
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
    pickLayoutVariant
  };
}

module.exports = {
  createLayoutVariantPicker
};
