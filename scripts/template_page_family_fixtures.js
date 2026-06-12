const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSET_ROOT = path.join(ROOT, 'outputs', '019e583b-b589-7043-8c51-700ce5757a00', 'presentations', 'template-page-family-fixtures', 'assets');

function asset(id, name) {
  return path.join(ASSET_ROOT, id, `${name}.png`);
}

function gallery(id) {
  return [asset(id, 'proof-1'), asset(id, 'proof-2'), asset(id, 'proof-3'), asset(id, 'proof-4')];
}

function basePlan(id, industry, documentType, slide, extra = {}) {
  return Object.assign({
    style: 'premium-commercial-keynote',
    industry,
    documentType,
    title: slide.title,
    subtitle: slide.claim || slide.subtitle || '页面族垂直切片验收',
    organization: extra.organization || 'ClawLabs Template Lab',
    footer: `${id} fixture`,
    visualIntent: extra.visualIntent || 'proof-led',
    contacts: [
      { label: 'Owner', value: 'Template System' },
      { label: 'Review', value: 'Design QA' }
    ],
    media: {
      cover: asset(id, 'proof-1'),
      gallery: gallery(id)
    },
    slides: [slide]
  }, extra.plan || {});
}

const commonMetrics = [
  { label: '收入', value: '+12.4%', note: '核心业务恢复' },
  { label: '经营现金流', value: '+18.0%', note: '回款节奏改善' },
  { label: '毛利率', value: '36.8%', note: '组合质量提升' },
  { label: '费用率', value: '-2.1pt', note: '投入边界更清晰' }
];

const commonRows = [
  ['需求恢复低于预期', '中', '按周更新订单与复购数据'],
  ['回款节奏波动', '高', '重点客户建立现金流预警'],
  ['毛利率承压', '中', '审查低毛利订单和费用投入'],
  ['渠道投放效率下降', '低', '保留高转化渠道预算']
];

const peopleCards = [
  { title: '项目负责人', body: '对客户场景、交付节奏和复盘产出负责。' },
  { title: '产品运营', body: '把用户反馈转成可执行的产品动作。' },
  { title: '客户成功', body: '沉淀客户场景与可复用案例材料。' },
  { title: '数据分析', body: '用指标证明行为变化和经营结果。' }
];

const proofCards = [
  { title: '主证据', body: '素材必须说明对象、场景和结论。' },
  { title: '辅助证据', body: '补充过程、动作或用户反馈。' },
  { title: '指标证据', body: '用数字说明变化方向和强度。' },
  { title: '决策证据', body: '把结论连接到下一步动作。' }
];

const fixtures = [
  basePlan('financial-kpi-snapshot', 'finance-investment', 'financial-results', {
    type: 'metric-comparison',
    layoutVariant: 'financial-kpi-snapshot',
    title: '经营质量由收入、现金流和毛利共同确认',
    claim: '主指标占据第一视觉层级，辅助指标只服务于同一个经营判断。',
    period: '2026 Q1',
    source: '管理层经营复盘口径',
    metrics: commonMetrics,
    businessLogic: {
      currentState: '收入和现金流同步改善。',
      cause: '核心客户复购和费用纪律共同驱动。',
      action: '继续压实回款和费用边界。',
      metric: '收入增速、经营现金流、毛利率'
    },
    note: '数据页必须保留期间、口径和来源，避免成为孤立数字卡片。'
  }),
  basePlan('chart-grid-with-commentary', 'finance-investment', 'financial-results', {
    type: 'metric-comparison',
    layoutVariant: 'chart-grid-with-commentary',
    title: '三个经营读数解释下一季度投入节奏',
    claim: '图表评论区把趋势转成行动，而不是停留在数字展示。',
    metrics: [
      { label: '核心客户复购', value: '64%', note: '稳定贡献收入' },
      { label: '新签回款周期', value: '42天', note: '较预算缩短' },
      { label: '重点项目毛利', value: '39%', note: '高于组合均值' }
    ],
    businessLogic: {
      currentState: '复购和回款指标改善。',
      impact: '现金流韧性增强。',
      cause: '客户结构和订单筛选更清晰。',
      action: '优先投入高复购客户群。',
      metric: '复购率、回款天数、重点项目毛利'
    }
  }),
  basePlan('quarterly-results-summary', 'finance-investment', 'financial-results', {
    type: 'metric-comparison',
    layoutVariant: 'quarterly-results-summary',
    title: '2026 Q1 结果好于预算基线，但下季度仍需锁定现金边界',
    claim: '季度结果摘要必须同时呈现结果、差异解释和管理动作。',
    period: '2026 Q1',
    guidance: 'Q2 保持核心业务投入，费用率不突破预算上限。',
    metrics: commonMetrics,
    businessLogic: {
      currentState: '收入和经营现金流均高于预算。',
      impact: '经营质量较上季度改善。',
      cause: '高复购客户贡献更稳定。',
      action: '围绕回款和毛利继续做月度复盘。',
      metric: '收入、毛利率、经营现金流、费用率'
    }
  }),
  basePlan('guidance-and-risk-board', 'finance-investment', 'financial-results', {
    type: 'risk-table',
    layoutVariant: 'guidance-and-risk-board',
    title: '下季度指引需要同时锁定增长假设和风险边界',
    claim: '风险页以假设、触发条件、责任和行动承接经营结果。',
    rows: commonRows,
    assumptions: ['核心客户复购维持稳定', '新签项目回款周期不超过45天', '渠道费用率不突破预算上限'],
    note: '每项风险必须有触发条件和处置动作。'
  }),
  basePlan('value-creation-process-map', 'general-operations', 'integrated-report', {
    type: 'strategy-map',
    layoutVariant: 'value-creation-process-map',
    title: '价值创造链路从资源投入延伸到可验证经营结果',
    claim: '综合报告页要把投入、活动、产出和结果放在一条可读流向上。',
    drivers: ['客户需求', '数据资产', '组织能力'],
    actions: ['产品化沉淀', '流程协同', '复盘机制', '治理闭环'],
    outcomes: ['客户价值提升', '运营效率改善', '长期信任增强'],
    note: '流程箭头必须能说明价值如何流动，而不是抽象装饰。'
  }),
  basePlan('materiality-matrix-board', 'general-operations', 'integrated-report', {
    type: 'risk-table',
    layoutVariant: 'materiality-matrix-board',
    title: '重要议题矩阵区分利益相关方影响和业务影响',
    claim: '矩阵页要有双轴、优先区和可定位议题。',
    rows: [
      ['数据安全与隐私', '高', '纳入最高优先级治理议题'],
      ['供应链韧性', '中', '建立季度风险复盘'],
      ['员工发展', '中', '绑定人才梯队指标'],
      ['包装减量', '低', '进入年度改善项目']
    ],
    axes: { x: '业务影响', y: '利益相关方影响' },
    note: '议题坐标需要服务于优先级判断。'
  }),
  basePlan('sustainability-proof-spread', 'general-operations', 'integrated-report', {
    type: 'case-gallery',
    layoutVariant: 'sustainability-proof-spread',
    title: '可持续行动必须用现场图、指标和来源共同证明',
    subtitle: '证据图像、影响指标和项目说明必须成对出现。',
    images: gallery('sustainability-proof-spread'),
    cards: [
      { title: '包装减量', body: '关键物料减重 18%，来源为供应链月报。' },
      { title: '能源优化', body: '单件能耗下降 12%，绑定产线计量表。' },
      { title: '回收机制', body: '门店回收覆盖 64%，进入会员触达。' },
      { title: '供应商审核', body: '重点供应商完成年度责任审核。' }
    ],
    note: '每张图片都必须回答它证明什么。'
  }),
  basePlan('governance-table-editorial', 'government-public-sector', 'integrated-report', {
    type: 'risk-table',
    layoutVariant: 'governance-table-editorial',
    title: '治理表格把责任、节奏、证据和决策放到同一行',
    claim: '治理页不是风险清单，而是可追踪的管理机制。',
    rows: [
      ['董事会审议', '高', '季度审议重大投入和风险阈值'],
      ['专项委员会', '中', '月度复盘指标和整改证据'],
      ['业务负责人', '中', '按周更新行动闭环'],
      ['外部合规', '低', '保留来源、授权和审计记录']
    ],
    note: '责任、节奏、证据和决策必须同时出现。'
  }),
  basePlan('culture-cover-with-soft-geometry', 'people-culture', 'company-introduction', {
    type: 'manifesto',
    layoutVariant: 'culture-cover-with-soft-geometry',
    title: '让组织共识变成每天可观察的行动',
    statement: '文化不是口号，而是团队交付方式',
    claim: '封面需要有人和组织的真实信号，同时保持克制的软几何舞台。',
    values: peopleCards,
    visual: { image: asset('culture-cover-with-soft-geometry', 'proof-1'), caption: '团队协作场景作为文化证据。' }
  }),
  basePlan('mission-statement-stage', 'people-culture', 'company-introduction', {
    type: 'manifesto',
    layoutVariant: 'mission-statement-stage',
    title: '使命必须被行为证明，而不是只写成一句口号',
    statement: '把复杂工作变成可被团队持续执行的系统',
    claim: '使命页必须用行为原则和证据支撑。',
    values: [
      { title: '对客户具体', body: '每个方案都回到客户真实场景。' },
      { title: '对事实诚实', body: '先拿证据，再做判断。' },
      { title: '对交付负责', body: '每个承诺都有负责人和时间点。' },
      { title: '对复盘开放', body: '把结果转回方法和系统。' }
    ]
  }),
  basePlan('people-proof-mosaic', 'people-culture', 'company-introduction', {
    type: 'case-gallery',
    layoutVariant: 'people-proof-mosaic',
    title: '团队证据墙把角色、场景和产出放在同一画面',
    subtitle: '每个成员场景都需要角色和产出 caption。',
    images: gallery('people-proof-mosaic'),
    cards: peopleCards,
    note: '人物图像承担证明协作方式的作用。'
  }),
  basePlan('value-principle-cards', 'people-culture', 'company-introduction', {
    type: 'manifesto',
    layoutVariant: 'value-principle-cards',
    title: '价值观卡片必须写出可观察行为',
    statement: '四条原则连接行为、证据和复盘',
    claim: '价值观页不能只有标题，必须说明行为和证明材料。',
    values: [
      { title: '客户现场', body: '每周沉淀一条现场事实。' },
      { title: '证据优先', body: '关键判断先列来源和口径。' },
      { title: '清晰负责', body: '行动项必须有负责人和截止点。' },
      { title: '持续复盘', body: '把交付结果写回方法库。' }
    ]
  }),
  basePlan('beauty-brand-editorial-cover', 'beauty-consumer', 'brand-report', {
    type: 'cover',
    layoutVariant: 'beauty-brand-editorial-cover',
    title: '肌研之光品牌经营报告',
    subtitle: '以产品质感、场景记忆和会员复购解释品牌增长',
    coverInsight: '产品、质地与消费者场景共同构成品牌经营证据。',
    visual: { image: asset('beauty-brand-editorial-cover', 'proof-1'), caption: '产品质感与包装作为品牌证据。' }
  }, { organization: '肌研之光' }),
  basePlan('brand-world-and-business-proof', 'beauty-consumer', 'brand-report', {
    type: 'strategy-map',
    layoutVariant: 'brand-world-and-business-proof',
    title: '品牌世界观从护肤仪式感延伸到经营指标',
    claim: '品牌页要把视觉主张、产品承诺和业务证据放在同一个系统里。',
    drivers: ['温和修护主张', '高频使用场景', '会员复购行为'],
    actions: ['系列化表达', '柜台体验统一', '内容种草闭环'],
    outcomes: ['品牌记忆增强', '产品连带提升', '复购质量改善'],
    note: '品牌证据和经营证据必须在同一页相互解释。'
  }, { organization: '肌研之光' }),
  basePlan('consumer-proof-photo-grid', 'beauty-consumer', 'brand-report', {
    type: 'case-gallery',
    layoutVariant: 'consumer-proof-photo-grid',
    title: '消费者场景把柜台体验、内容触点和复购理由连起来',
    subtitle: '每个场景都需要一句 caption 说明它证明什么。',
    images: gallery('consumer-proof-photo-grid'),
    cards: [
      { title: '柜台咨询', body: '解释肤质问题与产品匹配。' },
      { title: '居家护理', body: '强化日常使用频次。' },
      { title: '内容种草', body: '把成分故事转为购买理由。' },
      { title: '会员复购', body: '让体验反馈回到经营指标。' }
    ]
  }, { organization: '肌研之光' }),
  basePlan('product-evidence-story', 'beauty-consumer', 'brand-report', {
    type: 'case-gallery',
    layoutVariant: 'product-evidence-story',
    title: '明星单品需要同时证明质地、功效和使用场景',
    subtitle: '产品证据页不只展示好看图片，而是解释购买理由。',
    images: gallery('product-evidence-story'),
    cards: [
      { title: '修护精华', body: '承担高频复购入口。' },
      { title: '面霜系列', body: '承接换季与屏障修护。' },
      { title: '套装组合', body: '提升连带购买和客单。' }
    ]
  }, { organization: '肌研之光' }),
  basePlan('airy-concept-opening', 'saas-technology', 'strategy-brief', {
    type: 'cover',
    layoutVariant: 'airy-concept-opening',
    title: '从单点工具走向可复盘的增长系统',
    subtitle: '用一个核心概念打开接续证据链',
    coverInsight: '开场只保留一个概念对象和一个证明方向。',
    visual: { image: asset('airy-concept-opening', 'proof-1'), caption: '概念对象作为叙事锚点。' }
  }),
  basePlan('single-object-concept-map', 'saas-technology', 'strategy-brief', {
    type: 'strategy-map',
    layoutVariant: 'single-object-concept-map',
    title: '围绕一个核心对象组织能力、约束和结果',
    claim: '单对象概念图必须有一个清晰视觉中心。',
    centerTitle: '客户工作台',
    drivers: ['数据入口', '流程动作', '权限边界'],
    actions: ['自动化编排', '团队协同', '质量复盘', '治理留痕'],
    outcomes: ['采用率提升', '交付效率改善', '风险可控']
  }),
  basePlan('executive-proof-board', 'general-operations', 'board-report', {
    type: 'case-gallery',
    layoutVariant: 'executive-proof-board',
    title: '管理层判断需要把证据集合连接到决策含义',
    subtitle: '证据板同时包含指标、案例、风险和下一步建议。',
    images: gallery('executive-proof-board'),
    cards: [
      { title: '指标证据', body: '核心收入和现金指标持续改善。' },
      { title: '案例证据', body: '关键客户完成新流程验证。' },
      { title: '风险证据', body: '高风险项已有责任人与触发条件。' },
      { title: '决策含义', body: '建议扩大试点并锁定预算边界。' }
    ],
    note: '证据必须连接到管理层要做的决定。'
  }),
  basePlan('premium-closing-anchor', 'general-operations', 'board-report', {
    type: 'closing',
    layoutVariant: 'premium-closing-anchor',
    title: '确认下一阶段投入边界和复盘节奏',
    subtitle: '结束页必须交代决策、行动和负责人。',
    decision: '建议进入四周试点，并以数据口径确认扩大范围。',
    actions: [
      { title: '范围', body: '确认首批业务场景。' },
      { title: '责任', body: '确定负责人和复盘节奏。' },
      { title: '口径', body: '锁定数据来源和判断阈值。' }
    ],
    contacts: [
      { label: 'Owner', value: 'Template System' },
      { label: 'Next', value: '四周试点复盘' }
    ],
    note: '以决策、行动和责任人完成收束。'
  })
];

function fixturePlans() {
  return fixtures.map(plan => JSON.parse(JSON.stringify(plan)));
}

module.exports = {
  ROOT,
  ASSET_ROOT,
  fixturePlans,
  pageFamilyIds: fixtures.map(plan => plan.slides[0].layoutVariant)
};
