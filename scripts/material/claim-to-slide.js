const {
  cleanPublicNote
} = require('./common');
const {
  chartCoreTitleForProof,
  displayCopyFromClaim,
  isActionLoopProof,
  normalizeProofObject,
  normalizeVisibleCopyText,
  renderFamilyForProof
} = require('../design/proof-taxonomy');
const {
  attachMetricSourceTrace,
  businessLogicFromClaim,
  chartFieldForProof,
  claimVisibleText,
  dataComponentForClaim,
  externalUseCaveatText,
  imagesForClaim,
  metricsFromClaim,
  tableRowsFromClaim,
  textItems
} = require('./claim-slide-fields');
const {
  proofObjectForClaim,
  sourceTraceForClaim
} = require('./source-trace');

function normalizeParetoVisibleCopy(text = '', proof = '') {
  return normalizeVisibleCopyText(text, { proof });
}

function compactChartCoreTitle(title = '', proof = '') {
  const raw = normalizeParetoVisibleCopy(title, proof);
  const fallback = chartCoreTitleForProof(proof);
  if (!raw) return fallback;
  if (raw.length <= 18) return raw;
  const clauses = raw
    .replace(/[：:]/g, '：')
    .split(/[：，。,；;|｜]/)
    .map(part => String(part || '').trim())
    .filter(Boolean);
  const compact = clauses.find(part => part.length >= 4 && part.length <= 12);
  return compact || fallback;
}

function manufacturingServiceScopeSlideFromClaim(claim = {}) {
  const bullets = textItems(claim.bullets, ['非标输送设备', '涂装设备', '控制系统', '现场安装调试']).map(item => item.title).filter(Boolean);
  const bodyByTitle = {
    '非标输送设备': '围绕生产线转运、节拍衔接和现场布置进行定制化设计与制造。',
    '涂装设备': '承接涂装工艺相关设备配置、制造装配与现场配合。',
    '控制系统': '配合输送和涂装设备完成控制系统集成、联调与运行交付。',
    '现场安装调试': '围绕安装、调试、验收配合与后续服务形成交付闭环。',
    '现场安调服务': '围绕安装、调试、验收配合与后续服务形成交付闭环。',
    '输送系统': '围绕生产线转运、节拍衔接和现场布置进行定制化设计与制造。'
  };
  return {
    type: 'report-board',
    title: '服务范围覆盖输送、涂装、控制与现场安调',
    subtitle: '按产品对象和交付动作组织能力，便于客户判断适配场景。',
    claim: '按产品对象和交付动作组织能力，便于客户判断适配场景。',
    label: 'SERVICE SCOPE',
    coreTitle: '从产品到现场交付',
    coreBody: '围绕产品对象、控制集成与现场服务形成可交付能力。',
    summary: '产品类型、控制集成和现场服务共同构成项目交付范围。',
    sections: bullets.slice(0, 4).map(title => ({
      title,
      body: bodyByTitle[title] || '围绕该能力项形成设计、制造、安装或调试服务。'
    }))
  };
}

function isCompanyProfileMetricClaim(claim = {}) {
  if (!Array.isArray(claim.metrics) || !claim.metrics.length) return false;
  const text = claimVisibleText(claim);
  const profileSignal = /公司|企业|成立|始建|厂区|厂房|车间|加工中心|面积|员工|团队|产能|资质|专利|认证|规模|制造基础|长期制造|company profile|foundation|facility|workshop|capacity/i.test(text);
  const operatingProblemSignal = /OEE|MTTR|MTBF|停机|停線|故障|等待备件|换型|维修|告警|缺陷|downtime|maintenance|fault|incident|root cause/i.test(text);
  return profileSignal && !operatingProblemSignal && !externalUseCaveatText(text);
}

function metricClaimText(claim = {}, metrics = []) {
  return [
    claimVisibleText(claim),
    ...metrics.map(metric => `${metric.label || ''} ${metric.value || ''} ${metric.note || ''}`)
  ].filter(Boolean).join(' ');
}

function isOperatingFoundationMetricClaim(claim = {}, metrics = []) {
  if (!metrics.length) return false;
  const text = metricClaimText(claim, metrics);
  const foundationMetricCount = metrics.filter(metric => /经营底座|基础|规模|成立|员工|团队|SKU|产品宽度|平台|渠道数|门店|站点|覆盖|产能|工厂|厂区|profile|foundation|capacity|scale/i.test(`${metric.label || ''} ${metric.note || ''}`)).length;
  const financeMetricCount = metrics.filter(metric => /利润|费用|回款|现金|毛利|亏损|ROAS|ROI|退款|复购|漏斗|转化|NPS|OEE|MTTR|风险|问题|原因|根因/i.test(`${metric.label || ''} ${metric.note || ''}`)).length;
  const foundationSignal = foundationMetricCount >= 2 || /经营底座|基础规模|规模基础|company profile|foundation/i.test(text);
  return foundationSignal && financeMetricCount < 2 && !externalUseCaveatText(text);
}

function isFinancialQualityMetricClaim(claim = {}, metrics = []) {
  if (metrics.length < 2) return false;
  const text = metricClaimText(claim, metrics);
  const financeSignal = /利润|毛利|费用|现金|回款|亏损|收入增长|营收增长|EBIT|margin|profit|cash|expense/i.test(text);
  const bridgeSignal = /绑定|修复|承压|回收|周期|质量|变化|波动|前后|Q[1-4]|季度|quarter/i.test(text);
  return financeSignal && bridgeSignal && !externalUseCaveatText(text);
}

function foundationReportBoardFromClaim(slide = {}, claim = {}, metrics = []) {
  return Object.assign(slide, {
    type: 'report-board',
    label: claim.label || '经营底座',
    layoutVariant: slide.layoutVariant === 'fact-metrics' ? undefined : slide.layoutVariant,
    variant: slide.variant === 'fact-metrics' ? undefined : slide.variant,
    proofObject: 'report-board',
    referenceRecipe: undefined,
    referenceRecipeId: undefined,
    referenceRecipeIds: undefined,
    assetRequirements: [],
    coreTitle: claim.coreTitle || claim.core_title || '经营底座',
    coreBody: claim.coreBody || claim.core_body || slide.subtitle || '把规模、团队、产品和目标拆成经营判断的输入。',
    summary: claim.summary || slide.subtitle || slide.claim || '',
    sections: metrics.slice(0, 4).map(metric => ({
      title: metric.label || '核心指标',
      body: [metric.value, metric.note].filter(Boolean).join(' · ')
    }))
  });
}

function financialSnapshotFromClaim(slide = {}, claim = {}, metrics = []) {
  return Object.assign(slide, {
    type: 'metric-comparison',
    layoutVariant: claim.layoutVariant || claim.variant || 'financial-kpi-snapshot',
    variant: claim.layoutVariant || claim.variant || 'financial-kpi-snapshot',
    proofObject: 'financial-kpi-snapshot',
    dataComponent: 'comparison',
    referenceRecipe: undefined,
    referenceRecipeId: undefined,
    referenceRecipeIds: undefined,
    metrics: metrics.slice(0, 4)
  });
}

function claimValue(claim = {}, snake = '', camel = '') {
  const camelKey = camel || snake.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
  return claim[snake] !== undefined ? claim[snake] : claim[camelKey];
}

function isEditorialProofClaim(claim = {}) {
  const text = [
    claimValue(claim, 'business_domain'),
    claimValue(claim, 'chain_stage'),
    claimValue(claim, 'depth_domain'),
    claimValue(claim, 'proof_intent'),
    claim.proof_object,
    claim.proofObject,
    claim.claim,
    claim.support
  ].filter(Boolean).join(' ');
  return /editorial-proof|visual-claim|视觉主张|品牌视觉|品牌证据|product-role-board|editorial-proof-board/i.test(text);
}

function pushSection(out = [], title = '', body = '') {
  const cleanTitle = String(title || '').trim();
  const cleanBody = String(body || '').trim();
  if (!cleanTitle && !cleanBody) return;
  out.push({
    title: cleanTitle || '证据项',
    body: cleanBody || cleanTitle
  });
}

function sectionsFromIndustryObjects(industryObjects = {}) {
  const sections = [];
  [
    ['产品/SKU', industryObjects.product_skus || industryObjects.productSkus],
    ['平台/渠道', industryObjects.platforms_channels || industryObjects.platformsChannels],
    ['消费者反馈', industryObjects.customer_or_user_signals || industryObjects.customerOrUserSignals],
    ['经营链路', industryObjects.operations_or_process || industryObjects.operationsOrProcess],
    ['指标对象', industryObjects.financial_or_metric_objects || industryObjects.financialOrMetricObjects],
    ['视觉/素材对象', industryObjects.visual_or_asset_objects || industryObjects.visualOrAssetObjects]
  ].forEach(([title, value]) => {
    const list = Array.isArray(value) ? value.filter(Boolean).slice(0, 4) : [value].filter(Boolean);
    if (list.length) pushSection(sections, title, list.join('、'));
  });
  return sections;
}

function editorialProofBoardFromClaim(slide = {}, claim = {}, images = []) {
  const industryObjects = claim.industry_objects || claim.industryObjects || {};
  const explicitSections = Array.isArray(claim.sections) && claim.sections.length ? claim.sections : [];
  const structuredSections = [
    ...sectionsFromIndustryObjects(industryObjects),
    ...textItems(claim.editorialProof || claim.editorial_proof || [], []),
    ...textItems(claim.productItems || claim.product_items || claim.skuMatrix || claim.sku_matrix || [], []),
    ...textItems(claim.consumerQuotes || claim.consumer_quotes || claim.reviews || [], [])
  ].slice(0, 6);
  const fallbackSections = textItems(claim.cards || claim.bullets, [slide.subtitle || slide.title]).slice(0, 4);
  const assetRequirements = Array.isArray(claim.asset_requirements || claim.assetRequirements)
    ? (claim.asset_requirements || claim.assetRequirements)
    : [];
  const missingInfo = claim.missing_info || claim.missingInfo || claim.informationGap || claim.information_gap;
  const needsFactualAsset = assetRequirements.some(item =>
    item && item.required !== false && /product|site|screenshot|certificate|store|scene|evidence|background/i.test(String(item.role || ''))
  );
  const informationGap = !images.length && (needsFactualAsset || missingInfo)
    ? {
        title: '素材待确认',
        body: Array.isArray(missingInfo) ? missingInfo.join('；') : (missingInfo || '缺少可外发展示的真实产品、平台截图或场景素材，需进入资产决策。')
      }
    : undefined;
  const proof = String(claim.proof_object || claim.proofObject || '').toLowerCase();
  const proofObject = /product-role-board/.test(proof) ? 'product-role-board' : 'editorial-proof-board';
  return Object.assign(slide, {
    type: 'report-board',
    layoutVariant: claim.layoutVariant || claim.variant || 'editorial-proof-board',
    variant: claim.layoutVariant || claim.variant || 'editorial-proof-board',
    proofObject,
    label: claim.label || '视觉证据',
    coreTitle: claim.coreTitle || claim.core_title || '品牌与产品证据',
    coreBody: claim.coreBody || claim.core_body || slide.subtitle || '用产品/SKU、渠道场景、消费者反馈或素材缺口承接视觉主张。',
    summary: claim.summary || slide.subtitle || '',
    sections: explicitSections.length ? explicitSections : (structuredSections.length ? structuredSections : fallbackSections),
    editorialProof: structuredSections,
    informationGap,
    assetRequirements,
    assetGeneration: needsFactualAsset
      ? Object.assign({}, slide.assetGeneration || {}, {
          status: 'blocked',
          role: 'product',
          originalRole: 'product',
          resolvedRole: 'factual-product-or-platform-evidence',
          mustBind: true,
          reason: 'editorial proof requires user-provided factual product, platform screenshot, or scene asset'
        })
      : slide.assetGeneration
  });
}

function slideFromCompanyIntroClaim(claim = {}, extraction = {}, bundle = {}, industry = '') {
  const proof = String(claim.proof_object || '').toLowerCase();
  if (industry === 'manufacturing-operations' && proof.includes('report-board') && externalUseCaveatText(claimVisibleText(claim))) {
    return manufacturingServiceScopeSlideFromClaim(claim);
  }
  return slideFromClaim(claim, extraction, bundle);
}

function slideFromClaim(claim = {}, extraction = {}, bundle = {}) {
  const displayCopy = displayCopyFromClaim(claim);
  const rawProof = claim.proof_object || claim.proofObject || claim.layoutVariant || claim.variant || '';
  const proof = normalizeProofObject(rawProof, {
    text: claimVisibleText(claim),
    proofIntent: claim.proof_intent || claim.proofIntent,
    displayCopy,
    slide: claim
  });
  const title = normalizeVisibleCopyText(displayCopy.title || claim.claim || claim.title || '核心判断', { proof });
  const subtitle = normalizeVisibleCopyText(displayCopy.subtitle || claim.support || claim.summary || '', { proof });
  const images = imagesForClaim(claim, extraction, bundle);
  const metrics = metricsFromClaim(claim);
  const sourceTrace = sourceTraceForClaim(claim, extraction, bundle);
  const slide = {
    type: 'content',
    title,
    subtitle,
    claim: subtitle,
    proofObject: proof || rawProof || '',
    proofObjectNormalized: proof || '',
    proof_object_normalized: proof || '',
    originalProofObject: proof && rawProof && proof !== String(rawProof).toLowerCase() ? rawProof : undefined,
    renderFamilySelected: renderFamilyForProof(proof),
    render_family_selected: renderFamilyForProof(proof),
    displayCopy,
    proof: proofObjectForClaim(claim, extraction, bundle, { sourceTrace }),
    note: cleanPublicNote(normalizeVisibleCopyText(displayCopy.note || claim.note || '', { proof })),
    sourceTrace
  };
  if (metrics.length) slide.metrics = metrics.map(metric => attachMetricSourceTrace(metric, sourceTrace));
  if (claim.theme_intent || claim.themeIntent) slide.themeIntent = claim.theme_intent || claim.themeIntent;
  if (claim.accent_role || claim.accentRole) slide.accentRole = claim.accent_role || claim.accentRole;
  if (claim.layout_energy || claim.layoutEnergy) slide.layoutEnergy = claim.layout_energy || claim.layoutEnergy;
  if (claim.visual_density || claim.visualDensity) slide.visualDensity = claim.visual_density || claim.visualDensity;
  if (claim.rhythm_transition || claim.rhythmTransition) slide.rhythmTransition = claim.rhythm_transition || claim.rhythmTransition;
  if (claim.business_domain || claim.businessDomain) slide.businessDomain = claim.business_domain || claim.businessDomain;
  if (claim.chain_stage || claim.chainStage) slide.chainStage = claim.chain_stage || claim.chainStage;
  if (claim.depth_domain || claim.depthDomain) slide.depthDomain = claim.depth_domain || claim.depthDomain;
  if (claim.proof_intent || claim.proofIntent) slide.proofIntent = claim.proof_intent || claim.proofIntent;
  if (claim.industry_objects || claim.industryObjects) slide.industryObjects = claim.industry_objects || claim.industryObjects;
  if (claim.reference_recipe_id || claim.referenceRecipeId) slide.referenceRecipeId = claim.reference_recipe_id || claim.referenceRecipeId;
  if (Array.isArray(claim.reference_recipe_ids || claim.referenceRecipeIds)) {
    slide.referenceRecipeIds = claim.reference_recipe_ids || claim.referenceRecipeIds;
    slide.referenceRecipeId = slide.referenceRecipeId || slide.referenceRecipeIds[0];
  }
  if (claim.reference_category_id || claim.referenceCategoryId) slide.referenceCategoryId = claim.reference_category_id || claim.referenceCategoryId;
  if (Array.isArray(claim.component_hints || claim.componentHints)) {
    slide.previousComponentHints = claim.component_hints || claim.componentHints;
  }
  if (Array.isArray(claim.component_suggestions || claim.componentSuggestions)) {
    slide.previousComponentSuggestions = claim.component_suggestions || claim.componentSuggestions;
  }
  if (claim.componentPlan || claim.component_plan) {
    const inputComponentPlan = claim.componentPlan || claim.component_plan;
    slide.previousComponentPlan = inputComponentPlan;
  }
  [
    ['industryEvidenceChainMode', 'industry_evidence_chain_mode'],
    ['disableIndustryEvidenceChain', 'disable_industry_evidence_chain']
  ].forEach(([camel, snake]) => {
    if (claim[camel] !== undefined || claim[snake] !== undefined) {
      slide[camel] = claim[camel] !== undefined ? claim[camel] : claim[snake];
    }
  });
  [
    'product',
    'products',
    'productStory',
    'productItems',
    'skuMatrix',
    'skus',
    'editorialProof',
    'consumerQuotes',
    'reviews',
    'informationGap',
    'missingInfo',
    'lookbook',
    'proofItems',
    'evidenceItems',
    'galleryItems'
  ].forEach(field => {
    if (claim[field] !== undefined) slide[field] = claim[field];
  });
  if (Array.isArray(claim.asset_requirements || claim.assetRequirements)) slide.assetRequirements = claim.asset_requirements || claim.assetRequirements;
  if (claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote) {
    slide.sourceNote = claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote;
  }
  const businessLogic = businessLogicFromClaim(claim);
  if (businessLogic) slide.businessLogic = businessLogic;
  const dataComponent = dataComponentForClaim(claim);
  if (dataComponent) slide.dataComponent = dataComponent;
  if (claim.layoutVariant || claim.variant) {
    slide.layoutVariant = claim.layoutVariant || claim.variant;
    slide.variant = claim.layoutVariant || claim.variant;
  } else if (/financial-kpi-snapshot|chart-grid-with-commentary|quarterly-results-summary|guidance-and-risk-board|value-creation-process-map|materiality-matrix-board|sustainability-proof-spread|governance-table-editorial|culture-cover-with-soft-geometry|mission-statement-stage|people-proof-mosaic|value-principle-cards|beauty-brand-editorial-cover|brand-world-and-business-proof|consumer-proof-photo-grid|product-evidence-story|airy-concept-opening|single-object-concept-map|executive-proof-board|premium-closing-anchor/.test(proof)) {
    slide.variant = proof;
  }

  const chartField = chartFieldForProof(proof);
  if (chartField) {
    const visibleTitle = normalizeParetoVisibleCopy(title, proof);
    slide[chartField] = claim.data && Object.keys(claim.data).length ? claim.data : metrics.map(m => ({ title: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || 0, body: m.note || '', unit: /%|％/.test(String(m.value)) ? '%' : '' }));
    slide.title = visibleTitle;
    slide.coreTitle = normalizeParetoVisibleCopy(
      displayCopy.core_title || claim.coreTitle || claim.core_title || compactChartCoreTitle(visibleTitle, proof),
      proof
    );
    slide.coreBody = normalizeVisibleCopyText(displayCopy.core_body || claim.coreBody || claim.core_body || subtitle || '把关键行业指标转化为可核验的判断依据。', { proof });
    return slide;
  }
  if (proof.includes('finance-bridge') || proof.includes('return-bridge')) {
    slide.bridge = Array.isArray(claim.bridge) ? claim.bridge : metrics.map((m, i) => ({ label: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || (i === 0 ? 10 : 3), note: m.note }));
    return slide;
  }
  if (isEditorialProofClaim(claim)) {
    return editorialProofBoardFromClaim(slide, claim, images);
  }
  if (proof === 'report-board' || proof.includes('report-board')) {
    slide.type = 'report-board';
    slide.label = normalizeVisibleCopyText(displayCopy.kicker || claim.label || '证据看板', { proof });
    slide.coreTitle = normalizeVisibleCopyText(displayCopy.core_title || claim.coreTitle || claim.core_title || '材料证据', { proof });
    slide.coreBody = normalizeVisibleCopyText(displayCopy.core_body || claim.coreBody || claim.core_body || subtitle, { proof });
    slide.summary = claim.summary || subtitle;
    slide.decision = claim.decision || '';
    slide.note = cleanPublicNote(normalizeVisibleCopyText(displayCopy.note || claim.note || '', { proof }));
    slide.sections = Array.isArray(claim.sections) && claim.sections.length
      ? claim.sections
      : textItems(claim.cards || claim.bullets, [subtitle || title]).map((it, i) => Object.assign({}, it, {
        body: it.body || claim.support || subtitle || ['适配场景', '制造证据', '交付边界', '外发口径'][i] || '证据说明'
      }));
    return slide;
  }
  if (proof.includes('portfolio')) {
    slide.portfolio = Array.isArray(claim.portfolio) ? claim.portfolio : textItems(claim.bullets, ['重点项目', '观察项目', '退出项目']).map((it, i) => ({ name: it.title, theme: it.body || '投后动作', weight: i === 0 ? 35 : 20, irr: metrics[i] ? metrics[i].value : '—', dpi: '—', risk: i === 0 ? '低' : '中', action: it.body || '维持观察' }));
    return slide;
  }
  if (proof.includes('architecture') || proof.includes('blueprint') || proof.includes('capability-map') || proof.includes('topology') || proof.includes('service-blueprint')) {
    if (proof.includes('service-blueprint')) {
      slide.serviceBlueprint = claim.data || {};
      slide.variant = 'service-blueprint';
    }
    if (proof.includes('platform')) {
      slide.platformCapabilities = textItems(claim.bullets);
      slide.variant = 'platform-capability-map';
    }
    if (proof.includes('production')) {
      slide.productionLine = claim.data || {};
      slide.variant = 'production-topology';
    }
    if (proof.includes('production') && !Array.isArray(claim.layers)) {
      const products = textItems(claim.bullets, ['非标输送设备', '涂装设备', '控制系统', '现场安装调试']).map(it => it.title).filter(Boolean);
      slide.layers = [
        { name:'产品与工艺对象', title:'产品与工艺对象', items:products.slice(0, 5) },
        { name:'制造交付动作', title:'制造交付动作', items:['需求确认', '加工制造', '控制联调', '现场安装'] },
        { name:'证据与交付资料', title:'证据与交付资料', items:['图纸参数', '设备铭牌', '调试记录', '项目验收', '服务反馈'] }
      ];
    } else {
      slide.layers = Array.isArray(claim.layers) ? claim.layers : textItems(claim.bullets, ['数据层', '业务层', '管理层']).map(it => ({ name: it.title, title: it.title, items: it.body ? [it.body] : [it.title].filter(Boolean) }));
    }
    return slide;
  }
  if (proof.includes('risk') || proof.includes('governance') || isActionLoopProof(proof) || claim.narrative_role === 'governance') {
    slide.headers = ['风险/责任项', '等级/角色', '应对动作'];
    slide.rows = tableRowsFromClaim(claim);
    if (proof.includes('matrix')) slide.matrix = claim.matrix || { x: '影响程度', y: '发生可能性' };
    if (isActionLoopProof(proof)) {
      slide.variant = proof;
      slide.layoutVariant = proof;
      slide.renderFamilySelected = renderFamilyForProof(proof);
      slide.responsibilities = Array.isArray(claim.responsibilities) && claim.responsibilities.length
        ? claim.responsibilities
        : textItems(claim.bullets).map((it, i) => ({ title: it.title, owner: ['业务', '技术', '管理层'][i] || '负责人', body: it.body }));
    }
    return slide;
  }
  if (proof.includes('loop') || proof.includes('timeline') || proof.includes('process') || claim.narrative_role === 'operating-model') {
    slide.phases = Array.isArray(claim.phases) ? claim.phases : textItems(claim.bullets, ['发现问题', '处置动作', '复盘优化']).map(it => ({ title: it.title, body: it.body || subtitle }));
    if (proof.includes('flywheel') || proof.includes('闭环')) slide.loop = true;
    return slide;
  }
  if (images.length >= 2 || /case|lookbook|evidence|proof|gallery|photo|mosaic|product.*story|brand-world/.test(proof)) {
    slide.images = images.map(x => x.path);
    const fallbackCards = textItems(claim.bullets, [subtitle || title]);
    slide.cards = images.length
      ? images.map((x, i) => ({ title: x.caption || `证据 ${i + 1}`, body: (claim.bullets || [subtitle])[i] || subtitle || '材料证据' }))
      : fallbackCards;
    return slide;
  }
  if (metrics.length >= 2 || proof.includes('metric') || claim.narrative_role === 'proof') {
    slide.metrics = metrics;
    if (isOperatingFoundationMetricClaim(claim, metrics)) {
      return foundationReportBoardFromClaim(slide, claim, metrics);
    }
    if (isFinancialQualityMetricClaim(claim, metrics)) {
      return financialSnapshotFromClaim(slide, claim, metrics);
    }
    const metricText = metrics.map(m => `${m.label || ''} ${m.value || ''} ${m.note || ''}`).join(' ');
    if (proof.includes('metric-board') && !/OEE|MTTR|MTBF|停机|稼动/i.test(metricText)) {
      slide.variant = 'fact-metrics';
    }
    return slide;
  }
  slide.cards = textItems(claim.bullets, [subtitle || title]);
  return slide;
}

module.exports = {
  isCompanyProfileMetricClaim,
  manufacturingServiceScopeSlideFromClaim,
  slideFromClaim,
  slideFromCompanyIntroClaim
};
