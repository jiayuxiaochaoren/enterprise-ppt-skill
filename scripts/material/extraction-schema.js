const {
  REFERENCE_RECIPE_LIBRARY,
  industryBenchmarksFor,
  industryMatchIds,
  industryPackFor
} = require('../design-system');
const { INDUSTRY_ID_OPTIONS } = require('./common');

function extractionSchema() {
  const industryOptions = INDUSTRY_ID_OPTIONS.join(' | ');
  return {
    version: 'material-extraction/v1',
    document: {
      title: 'deck title from materials',
      subtitle: 'one-sentence value proposition',
      ppt_type: 'solution | report | company-intro | investor | training | review',
      industry: industryOptions,
      language: 'target visible language, e.g. zh-CN for Chinese decks',
      organization: 'only if explicit in materials',
      audience: 'target audience',
      date: 'only if explicit in materials',
      requested_slide_count: 'optional user requested page count, e.g. 8 | 12 | 20',
      contacts: ['contact person, phone, email, website, address, or QR code only if explicit in materials'],
      decision_goal: 'what the deck should help decide'
    },
    visible_language_policy: {
      language: 'zh-CN',
      localize_non_essential_microcopy: true,
      preserve_terms: ['brand names, product names, URLs, emails, stock tickers, standard acronyms such as API/OEE/IRR/SKU']
    },
    clarifications: [
      { id: 'contact_block', choice: 'provide | omit | conservative', value: 'user supplied fact or chosen fallback', effect: 'how this answer changes deck planning' }
    ],
    facts: [
      { id: 'fact-001', text: 'verifiable fact from source', source_ids: ['src-001'], source_pages: { 'src-001': 12 }, source_excerpts: { 'src-001': 'short original excerpt' }, confidence: 0.9 }
    ],
    evidence: [
      { id: 'ev-001', type: 'metric | image | screenshot | quote | table | case | risk | process | sku | texture | efficacy | channel | member | repurchase | social | packaging | review', title: 'evidence label', summary: 'what it proves', source_ids: ['src-001'], page: 12, excerpt: 'short original excerpt', asset_source_id: 'src-002', provenance: 'real-source-evidence | model-generated-illustration | user-supplied | public-source', authorization_status: 'cleared | internal-only | needs authorization | unknown | blocked' }
    ],
    deck_art_direction: {
      tone: 'premium-industrial-editorial | executive-boardroom | calm-clinical | capital-governance | product-platform',
      palette: 'recommended palette id, e.g. factory-steel-amber',
      semantic_color_roles: {
        brand: 'brand or industry identity color role',
        evidence: 'proof, caption, source, image evidence role',
        risk: 'problem, constraint, compliance role',
        action: 'next-step, path, decision role',
        data: 'metric, chart, value signal role',
        neutral: 'background, text, rule role'
      },
      layout_diversity_rules: ['avoid repeating the same card/grid composition across adjacent body slides'],
      rhythm_map: [
        {
          slideId: 'claim-001',
          themeIntent: 'industry-opening | navigation-map | diagnosis | risk-warning | case-evidence | system-architecture | value-signal | operating-path | company-proof | closing-anchor',
          accentRole: 'brand | evidence | risk | action | data | neutral',
          backgroundTone: 'dark-stage | tinted-paper | accent-wash',
          layoutEnergy: 'hero | calm | structured | high-contrast | editorial-dense',
          visualDensity: 'balanced | dense | metric-led | image-led',
          rhythmTransition: 'start | continue | turning-point | proof-anchor | structure-shift | return-to-anchor'
        }
      ]
    },
    claim_spine: [
      {
        id: 'claim-001',
        narrative_role: 'setup | diagnosis | evidence | proof | solution | operating-model | governance | decision',
        claim: 'slide-title-grade assertion',
        support: 'short supporting sentence',
        business_domain: 'industry-specific domain, e.g. editorial-proof | channel-efficiency | cohort-system | business-metric | growth-loop | operations-quality | finance-quality',
        chain_stage: 'industry evidence chain stage, e.g. visual-claim | product-experience-promise | user-business-evidence | operating-loop | risk-governance',
        depth_domain: 'required industry depth domain this claim covers',
        industry_objects: {
          product_skus: ['products, SKU groups, categories, product roles, or price bands explicitly present in material'],
          platforms_channels: ['platforms, channels, stores, site groups, customer touchpoints'],
          customer_or_user_signals: ['consumer feedback, member cohorts, users, patients, operators, customer segments'],
          operations_or_process: ['workflow, phases, fulfillment, service, manufacturing, site operations, governance steps'],
          financial_or_metric_objects: ['business metric names, cost, cash, revenue, margin, ROI/ROAS, NRR, OEE, quality indicators'],
          visual_or_asset_objects: ['product image, screenshot, site photo, certificate, chart screenshot, scene proof, or declared information gap']
        },
        proof_intent: 'what this page proves: visual claim | product role | channel efficiency | cohort behavior | activity funnel | financial quality | action loop | risk control | information gap',
        proof_object: 'downtime-pareto | valuation-sensitivity | quality-handoff | member-cohort-ladder | channel-efficiency-matrix | monthly-pulse-trend | waterfall-bridge | dispatch-map | adoption-funnel | service-blueprint | platform-capability-map | production-topology | finance-bridge | portfolio-table | risk-matrix | responsibility-loop | lookbook | case-comparison | metric-board | report-board',
        evidence_ids: ['ev-001'],
        source_ids: ['src-001'],
        source_pages: { 'src-001': 12 },
        source_excerpts: { 'src-001': 'short original text excerpt supporting this claim' },
        business_logic: {
          current_state: 'what is happening now',
          impact: 'business/customer/operating consequence',
          cause: 'why it happens or what drives it',
          action: 'what will be changed or executed',
          metric: 'how success will be measured'
        },
        data_component: 'comparison | funnel | root-cause-matrix | journey-breakpoint | before-after | heatmap | milestone | scorecard | scatter-bubble | trend-line | waterfall-bridge | progress-tracker',
        layoutVariant: 'recommended page-family variant from reference_recipe_plan',
        componentSuggestions: ['optional non-executable component suggestions backed by material evidence; do not output executable componentPlan'],
        referenceRecipeIds: ['reference recipe ids used for this page'],
        asset_requirements: [
          { role: 'evidence | product | site | screenshot | background', required: true, provenance: 'source id or user-supplied asset needed' }
        ],
        source_note: 'optional visible source/provenance note only when explicitly requested; do not use as a substitute for source_pages/source_excerpts',
        theme_intent: 'page-level theme intent from deck_art_direction.rhythm_map',
        accent_role: 'semantic accent role for the page',
        layout_energy: 'hero | calm | structured | high-contrast | editorial-dense',
        visual_density: 'balanced | dense | metric-led | image-led',
        rhythm_transition: 'continue | turning-point | proof-anchor | structure-shift',
        bullets: ['short point'],
        metrics: [{ label: 'metric name', value: '64%', note: 'source context' }],
        visuals: [{ source_id: 'src-002', role: 'evidence', caption: 'why this image matters', provenance: 'screenshot/image provenance', authorization_status: 'cleared | internal-only | needs authorization | unknown | blocked' }],
        data: {},
        confidence: 0.85
      }
    ],
    asset_rights: 'user-owned | public with attribution | needs authorization | unknown',
    commercial_risks: ['customer-name authorization, military/project desensitization, certificate validity, image source, font/license risk'],
    missing_info: ['facts that should be requested from user, not invented']
  };
}

function bundleForPrompt(bundle = {}) {
  return {
    version: bundle.version,
    sourceCount: bundle.sourceCount,
    textSummary: bundle.textSummary,
    sources: (bundle.sources || []).map(src => {
      if (src.kind === 'image') {
        return {
          id: src.id,
          kind: src.kind,
          name: src.name,
          relativePath: src.relativePath,
          suggestedRole: src.suggestedRole,
          dimensions: src.dimensions,
          qualityProfile: src.qualityProfile
        };
      }
      return {
        id: src.id,
        kind: src.kind,
        name: src.name,
        relativePath: src.relativePath,
        extractionMethod: src.extractionMethod,
        materialHygiene: src.materialHygiene,
        candidateFacts: src.candidateFacts,
        numbers: src.numbers,
        chunks: (src.chunks || []).slice(0, 10)
      };
    })
  };
}

function referenceContextForPrompt(bundle = {}, options = {}) {
  const industry = options.industry ||
    (options.storyPlan && options.storyPlan.industry) ||
    ((bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0] || {}).industry) ||
    'general-operations';
  const ids = new Set(industryMatchIds(industry));
  const pack = industryPackFor(industry);
  const benchmarks = industryBenchmarksFor(industry).slice(0, 5);
  const recipes = (REFERENCE_RECIPE_LIBRARY.recipes || [])
    .filter(recipe => (recipe.industryFit || []).some(id => ids.has(id)))
    .sort((a, b) => ((b.scores && b.scores.overall) || 0) - ((a.scores && a.scores.overall) || 0))
    .slice(0, Number(options.limit || 12))
    .map(recipe => ({
      id: recipe.id,
      sourceKind: recipe.source && recipe.source.kind,
      materialType: recipe.designSyntax && recipe.designSyntax.materialType,
      pageRole: recipe.designSyntax && recipe.designSyntax.pageRole,
      renderType: recipe.renderType,
      layoutVariant: recipe.layoutVariant,
      themeIntent: recipe.themeIntent,
      proofObject: recipe.proofObject,
      mainVisualMethod: recipe.designSyntax && recipe.designSyntax.mainVisualMethod,
      informationDensity: recipe.designSyntax && recipe.designSyntax.informationDensity,
      componentSuggestions: (recipe.componentHints || []).slice(0, 8),
      forbiddenPoints: recipe.designSyntax && recipe.designSyntax.forbiddenPoints,
      score: recipe.scores && recipe.scores.overall
    }));
  return {
    version: 'reference-context/v1',
    industry,
    matchIndustryIds: [...ids],
    industryPack: pack ? {
      id: pack.id,
      labelZh: pack.labelZh,
      recommendedOutline: pack.recommendedOutline,
      proofObjects: pack.proofObjects,
      proofObjectCatalog: pack.proofObjectCatalog,
      reportStructures: pack.reportStructures,
      componentRules: pack.componentRules,
      visualGrammar: pack.visualGrammar,
      visualTone: pack.visualTone,
      paletteIntent: pack.paletteIntent,
      pageFamilies: pack.pageFamilies,
      forbiddenTemplates: pack.forbiddenTemplates,
      clarificationQuestions: pack.clarificationQuestions
    } : null,
    benchmarkMaterials: benchmarks,
    recipeLibraryCoverage: REFERENCE_RECIPE_LIBRARY.coverage || {},
    recommendedReferenceRecipes: recipes
  };
}

function buildModelPrompt(bundle = {}) {
  const payload = bundleForPrompt(bundle);
  const referenceContext = referenceContextForPrompt(bundle);
  return [
    '# Material To Deck Plan Extraction',
    '',
    '你是高端商用 PPT 的材料理解器。请只基于材料提取事实、证据、论点链、行业语义和图片用途，输出 JSON，不要写解释。',
    '',
    '硬规则：',
    '- 不编造材料中没有的客户、收入、指标、案例、日期或授权信息。',
    '- 每个 fact/evidence/claim/metric 都要带 source_ids，并必须写 source_pages/source_excerpts；QA 会检查页码和原文摘录，不接受只有 source id。',
    '- 图片 evidence 用 asset_source_id 指向图片 source，并写 provenance 与 authorization_status；授权不明不能作为正式外发证据。',
    '- 如果用户或材料指定页数，写入 document.requested_slide_count；材料少时不要硬凑，缺少证据就写 missing_info。',
    '- claim 必须是可直接作为 PPT 页标题的判断句，不是主题词。',
    '- proof_object 应优先选择行业专用对象；不确定时用 report-board 或 metric-board。',
    '- 每页必须有一个 proof_object；只有材料证据或用户偏好明确支持时才写 componentSuggestions，且它只是非执行建议。不要输出 componentHints 或可执行 componentPlan；若误输出会被 suppressed/audited，不会直接进入组件计划。',
    '- 每个 claim 必须输出 business_domain、chain_stage、depth_domain、industry_objects、proof_intent；这些字段驱动行业 depth preflight 和 route selection，不能只靠关键词。',
    '- 不能只抽指标页。每个行业 deck 要覆盖行业对象、经营链路、证明对象和行动闭环；材料不足时写 missing_info 或 asset_requirements，不要静默丢掉行业深度域。',
    '- 消费零售/跨境电商至少识别：产品/SKU、平台/渠道、消费者反馈、活动漏斗、履约物流、利润现金、行动闭环、品牌/视觉证据；缺真实图片时写信息缺口或素材需求，不要伪造事实图片。',
    '- 区分真实证据和模型生成示意图：真实数据/截图/图片写 source_ids 和 provenance；生成图只能标为 model-generated-illustration，不能冒充真实 proof。',
    '- 每个诊断、数据、方案、价值页都要尽量填写 business_logic：现状/影响/原因/动作/指标；没有材料依据的字段留空，不要编造。',
    '- 数据页不能只摆漂亮数字，必须说明数字对应的业务判断；优先选择 comparison、funnel、root-cause-matrix、journey-breakpoint、before-after、heatmap、milestone、scorecard、scatter-bubble、trend-line、waterfall-bridge、progress-tracker 等 data_component。',
    '- 必须输出 deck_art_direction：整套 deck 的 tone、palette、semantic_color_roles、layout_diversity_rules 和 rhythm_map。',
    '- 每个 claim 尽量写 theme_intent、accent_role、layout_energy、visual_density、rhythm_transition；这些字段只表达设计意图，不写坐标。',
    '- missing_info 只写交付说明需要用户补充的事实，不要放进可见 PPT。',
    '- 忽略 materialHygiene.removedSample 中的内容；它们是上一版生成稿/制作备注/QA 备注污染，不是企业事实。',
    '- claim/support/bullets/note 必须是客户可见的正式文案，不要写“材料显示、材料中、原材料、企业 PDF、PDF 简介口径、该页用于、正式交付前建议、图册页优先、适合某类材料、模型抽取”等制作备注。',
    '- 如果目标是中文 PPT，document.language 必须写 zh-CN，visible_language_policy.localize_non_essential_microcopy 必须为 true；除品牌名、产品名、URL、邮箱、股票代码和 API/OEE/IRR/SKU 等标准缩写外，所有可见标题、标签、caption、目录、结尾和组件微文案都使用中文。',
    '- 客户名称、logo、军工项目、现场照片、证书、专利数量和敏感参数如果材料没有明确公开/授权信息，写入 commercial_risks 或 missing_info，不要包装成已确认事实。',
    '- 如果材料里有电话、邮箱、官网、地址、二维码说明，放入 document.contacts；没有就留空，不要编造。',
    '',
    '请严格返回符合以下 schema 的 JSON：',
    '',
    '```json',
    JSON.stringify(extractionSchema(), null, 2),
    '```',
    '',
    '材料包：',
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
    '行业包与 reference recipe 检索上下文：',
    '',
    '```json',
    JSON.stringify(referenceContext, null, 2),
    '```'
  ].join('\n');
}

module.exports = {
  buildModelPrompt,
  bundleForPrompt,
  extractionSchema,
  referenceContextForPrompt
};
