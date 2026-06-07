const {
  cleanPublicNote
} = require('./common');
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

function slideFromCompanyIntroClaim(claim = {}, extraction = {}, bundle = {}, industry = '') {
  const proof = String(claim.proof_object || '').toLowerCase();
  if (industry === 'manufacturing-operations' && proof.includes('report-board') && externalUseCaveatText(claimVisibleText(claim))) {
    return manufacturingServiceScopeSlideFromClaim(claim);
  }
  return slideFromClaim(claim, extraction, bundle);
}

function slideFromClaim(claim = {}, extraction = {}, bundle = {}) {
  const proof = String(claim.proof_object || '').toLowerCase();
  const title = claim.claim || claim.title || '核心判断';
  const subtitle = claim.support || claim.summary || '';
  const images = imagesForClaim(claim, extraction, bundle);
  const metrics = metricsFromClaim(claim);
  const sourceTrace = sourceTraceForClaim(claim, extraction, bundle);
  const slide = {
    type: 'content',
    title,
    subtitle,
    claim: subtitle,
    proofObject: claim.proof_object || claim.proofObject || '',
    proof: proofObjectForClaim(claim, extraction, bundle, { sourceTrace }),
    note: cleanPublicNote(claim.note || ''),
    sourceTrace
  };
  if (metrics.length) slide.metrics = metrics.map(metric => attachMetricSourceTrace(metric, sourceTrace));
  if (claim.theme_intent || claim.themeIntent) slide.themeIntent = claim.theme_intent || claim.themeIntent;
  if (claim.accent_role || claim.accentRole) slide.accentRole = claim.accent_role || claim.accentRole;
  if (claim.layout_energy || claim.layoutEnergy) slide.layoutEnergy = claim.layout_energy || claim.layoutEnergy;
  if (claim.visual_density || claim.visualDensity) slide.visualDensity = claim.visual_density || claim.visualDensity;
  if (claim.rhythm_transition || claim.rhythmTransition) slide.rhythmTransition = claim.rhythm_transition || claim.rhythmTransition;
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
    slide[chartField] = claim.data && Object.keys(claim.data).length ? claim.data : metrics.map(m => ({ title: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || 0, body: m.note || '', unit: /%|％/.test(String(m.value)) ? '%' : '' }));
    slide.coreTitle = title.length > 18 ? String(proof).replace(/-/g, ' ').toUpperCase() : title;
    slide.coreBody = subtitle || '把关键行业指标转化为可核验的判断依据。';
    return slide;
  }
  if (proof.includes('finance-bridge') || proof.includes('return-bridge')) {
    slide.bridge = Array.isArray(claim.bridge) ? claim.bridge : metrics.map((m, i) => ({ label: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || (i === 0 ? 10 : 3), note: m.note }));
    return slide;
  }
  if (proof === 'report-board' || proof.includes('report-board')) {
    slide.type = 'report-board';
    slide.label = claim.label || 'EVIDENCE BOARD';
    slide.coreTitle = claim.coreTitle || claim.core_title || '材料证据';
    slide.coreBody = claim.coreBody || claim.core_body || subtitle;
    slide.summary = claim.summary || subtitle;
    slide.decision = claim.decision || '';
    slide.note = cleanPublicNote(claim.note || '');
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
  if (proof.includes('risk') || proof.includes('governance') || proof.includes('responsibility') || claim.narrative_role === 'governance') {
    slide.headers = ['风险/责任项', '等级/角色', '应对动作'];
    slide.rows = tableRowsFromClaim(claim);
    if (proof.includes('matrix')) slide.matrix = claim.matrix || { x: '影响程度', y: '发生可能性' };
    if (proof.includes('responsibility')) {
      slide.variant = 'responsibility-loop';
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
