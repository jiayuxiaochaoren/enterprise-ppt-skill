const INDUSTRY_EXPRESSION_RULES = {
  'manufacturing-operations': {
    requiredRoutes: ['metric-comparison:oee-board', 'architecture:production-topology', 'timeline:closed-loop', 'industry-chart:downtime-pareto'],
    proofObjects: ['OEE', 'production-topology', 'maintenance-loop', 'downtime-pareto']
  },
  'finance-investment': {
    requiredRoutes: ['finance-bridge', 'portfolio-table', 'risk-table:risk-matrix', 'industry-chart:valuation-sensitivity'],
    proofObjects: ['return-bridge', 'portfolio-action-table', 'risk-matrix', 'valuation-sensitivity']
  },
  'healthcare-operations': {
    requiredRoutes: ['architecture:service-blueprint', 'metric-comparison:patient-service-scorecard', 'risk-table:responsibility-loop', 'industry-chart:quality-handoff'],
    proofObjects: ['service-blueprint', 'patient-scorecard', 'quality-handoff', 'responsibility-loop']
  },
  'brand-retail': {
    requiredRoutes: ['case-gallery:lookbook-story', 'metric-comparison:member-growth-board', 'timeline:flywheel', 'industry-chart:member-cohort-ladder', 'industry-chart:channel-efficiency-matrix', 'industry-chart:monthly-pulse-trend', 'industry-chart:waterfall-bridge'],
    proofObjects: ['lookbook', 'member-growth-board', 'growth-flywheel', 'member-cohort-ladder', 'channel-efficiency-matrix', 'monthly-pulse-trend', 'waterfall-bridge']
  },
  'energy-utility': {
    requiredRoutes: ['case-gallery:site-evidence', 'toc-clean:energy-sequence', 'closing:energy-stage', 'industry-chart:dispatch-map'],
    proofObjects: ['site-evidence', 'dispatch-map', 'asset-readout', 'energy-stage']
  },
  'saas-technology': {
    requiredRoutes: ['architecture:platform-capability-map', 'metric-comparison:adoption-revenue-board', 'case-gallery:prototype-flow', 'industry-chart:adoption-funnel'],
    proofObjects: ['platform-capability-map', 'adoption-funnel', 'prototype-flow', 'revenue-board']
  },
  'beauty-consumer': {
    requiredRoutes: ['case-gallery:lookbook-story', 'case-gallery:consumer-proof-photo-grid', 'metric-comparison:member-growth-board', 'strategy-map:brand-world-and-business-proof', 'industry-chart:channel-efficiency-matrix', 'industry-chart:monthly-pulse-trend', 'industry-chart:waterfall-bridge'],
    proofObjects: ['beauty-brand-editorial-cover', 'brand-world-and-business-proof', 'consumer-proof-photo-grid', 'product-evidence-story', 'channel-efficiency-matrix', 'monthly-pulse-trend', 'waterfall-bridge']
  },
  'people-culture': {
    requiredRoutes: ['manifesto:mission-statement-stage', 'case-gallery:people-proof-mosaic', 'manifesto:value-principle-cards'],
    proofObjects: ['culture-cover-with-soft-geometry', 'mission-statement-stage', 'people-proof-mosaic', 'value-principle-cards']
  },
  'government-public-sector': {
    requiredRoutes: ['report-board', 'strategy-map:governance-operating-model', 'risk-table:guidance-and-risk-board'],
    proofObjects: ['policy-context-board', 'resource-map', 'governance-operating-model', 'risk-and-assurance-board']
  },
  'lifestyle-food-tourism-fashion': {
    requiredRoutes: ['case-gallery:product-or-place-gallery', 'timeline:customer-journey-map', 'metric-comparison:conversion-scorecard'],
    proofObjects: ['lifestyle-editorial-cover', 'product-or-place-gallery', 'customer-journey-map', 'experience-proof-grid']
  }
};

const VISIBLE_PRODUCTION_COPY_BANS = [
  /材料显示/,
  /材料中(?:明确)?(?:提到|写到|列出|包含|展示|指出|说明)/,
  /原材料(?:未|没|没有|中)/,
  /企业\s*PDF/i,
  /PDF\s*简介口径/i,
  /正式交付前/,
  /图册页优先/,
  /该页用于/,
  /该页只展示/,
  /模型抽取/,
  /用户材料自动整理/
];

const FACTUAL_GENERATED_ASSET_RISK = /真实|实名|客户|案例|现场|站点|门店|店铺|货架|陈列|柜台|产品实拍|包装|包材|SKU|sku|单品|条码|瓶身|盒装|证书|资质|专利|软著|军工|涉密|特斯拉|中航|中车|中船|中船重工|logo|LOGO|截图|报表|台账|项目名称|验收|授权|公开展示|real\s+(customer|site|store|product|sku|package|screenshot|certificate)|customer\s+(case|logo|screenshot)|product\s+(photo|pack|package|sku)/i;

const INDUSTRY_KNOWLEDGE_BASE = {
  'manufacturing-operations': {
    label: '制造运维',
    narrativeArchetype: '故障发现 -> 派工处置 -> 产线恢复 -> OEE复盘',
    entities: {
      asset: ['设备', '产线', 'PLC', '传感器', '点检终端', '备件', '工位', '班组', 'OEE', 'MTTR', 'MTBF'],
      actor: ['厂长', '设备部', '维修班组', '生产部', '工艺', '质量', '供应商'],
      risk: ['停机', '故障', '节拍损失', '良率', '缺件', '返工', '安全'],
      metric: ['OEE', '稼动率', '停机时长', 'MTTR', 'MTBF', '良率', '一次通过率']
    },
    proofObjects: [
      { id: 'downtime-pareto', route: 'industry-chart:downtime-pareto', fields: ['downtimePareto', 'pareto', 'lossPareto', 'oeeLosses'], keywords: ['停机', '帕累托', 'Pareto', '故障排行', '节拍损失', 'TOP损失'], depth: 'metric-root-cause' },
      { id: 'production-topology', route: 'architecture:production-topology', fields: ['productionLine', 'nodes', 'layers'], keywords: ['产线拓扑', 'PLC', '传感器', '点检终端', '备件台账'], depth: 'system-map' },
      { id: 'maintenance-loop', route: 'timeline:closed-loop', fields: ['phases', 'loopItems', 'flywheel'], keywords: ['发现', '派工', '处置', '复盘', '维修闭环', '工单闭环'], depth: 'operating-loop' },
      { id: 'oee-board', route: 'metric-comparison:oee-board', fields: ['oee', 'oeeComponents', 'metrics'], keywords: ['OEE', '稼动', '性能', '良率', 'MTTR', 'MTBF'], depth: 'metric-board' }
    ],
    depthGates: { minProofObjects: 2, requiredDomains: ['metric-root-cause', 'operating-loop'] }
  },
  'finance-investment': {
    label: '产业基金/投资',
    narrativeArchetype: '投资假设 -> 价值桥 -> 组合暴露 -> 风险约束 -> 投委会行动',
    entities: {
      asset: ['基金', '项目', '标的', '组合', 'LP', 'GP', '退出', '估值', 'DPI', 'MOIC', 'IRR'],
      actor: ['投委会', '管理人', '投资经理', '风控', '财务顾问', '被投企业'],
      risk: ['估值', '流动性', '退出', '集中度', '政策', '汇率', '减值'],
      metric: ['IRR', 'DPI', 'TVPI', 'MOIC', '回收倍数', '退出倍数', 'NAV', 'EBITDA']
    },
    proofObjects: [
      { id: 'return-bridge', route: 'finance-bridge', fields: ['bridge'], keywords: ['价值桥', '收益桥', 'IRR桥', '归因', '贡献拆解'], depth: 'capital-bridge' },
      { id: 'valuation-sensitivity', route: 'industry-chart:valuation-sensitivity', fields: ['valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity'], keywords: ['敏感性', '估值矩阵', '退出情景', 'IRR', 'DPI', 'MOIC'], depth: 'scenario-analysis' },
      { id: 'portfolio-action-table', route: 'portfolio-table', fields: ['portfolio'], keywords: ['组合', '项目池', '投后动作', '配置', '减持', '跟投'], depth: 'portfolio-control' },
      { id: 'risk-matrix', route: 'risk-table:risk-matrix', fields: ['matrix', 'rows'], keywords: ['风险矩阵', '集中度', '退出风险', '流动性', '风控'], depth: 'risk-governance' }
    ],
    depthGates: { minProofObjects: 3, requiredDomains: ['capital-bridge', 'scenario-analysis', 'portfolio-control'] }
  },
  'healthcare-operations': {
    label: '医疗运营',
    narrativeArchetype: '患者路径 -> 服务触点 -> 质量交接 -> 风险责任 -> 改善复盘',
    entities: {
      asset: ['患者', '门诊', '病区', '检查', '护理', '医嘱', '随访', '质控', '病历'],
      actor: ['医生', '护士', '导诊', '检验科', '影像科', '质控办', '信息科'],
      risk: ['等待', '漏接', '交接', '不良事件', '感染', '隐私', '合规'],
      metric: ['等待时长', '满意度', '周转率', '不良事件', '漏接率', '复诊率']
    },
    proofObjects: [
      { id: 'service-blueprint', route: 'architecture:service-blueprint', fields: ['serviceBlueprint', 'touchpoints', 'journeyMap'], keywords: ['服务蓝图', '患者旅程', '触点', 'frontstage', 'backstage'], depth: 'journey-system' },
      { id: 'quality-handoff', route: 'industry-chart:quality-handoff', fields: ['qualityHandoff', 'handoffs', 'handoffMap'], keywords: ['质量交接', '护理交接', '科室交接', 'handoff', '质控'], depth: 'handoff-control' },
      { id: 'patient-scorecard', route: 'metric-comparison:patient-service-scorecard', fields: ['metrics'], keywords: ['等待时长', '满意度', '不良事件', '周转率', '服务评分'], depth: 'quality-scorecard' },
      { id: 'responsibility-loop', route: 'risk-table:responsibility-loop', fields: ['responsibilities', 'owners', 'raci'], keywords: ['责任闭环', '定责', '留痕', 'SLA', 'RACI'], depth: 'clinical-governance' }
    ],
    depthGates: { minProofObjects: 2, requiredDomains: ['journey-system', 'handoff-control'] }
  },
  'brand-retail': {
    label: '消费零售',
    narrativeArchetype: '产品故事 -> 空间体验 -> 会员分层 -> 复购飞轮 -> 内容转化',
    entities: {
      asset: ['单品', 'SKU', '系列', '门店', '陈列', 'lookbook', '会员', '客群', '私域'],
      actor: ['店长', '导购', '会员运营', '内容团队', '品牌经理', '买手'],
      risk: ['库存', '折扣', '复购', '转化', '客单', '动销', '渠道割裂'],
      metric: ['复购率', '客单价', '连带率', '会员贡献', '转化率', '动销率']
    },
    proofObjects: [
      { id: 'lookbook', route: 'case-gallery:lookbook-story', fields: ['lookbook', 'productStory', 'images'], keywords: ['lookbook', '产品故事', '搭配', '陈列', '门店场景'], depth: 'editorial-proof' },
      { id: 'channel-efficiency-matrix', route: 'industry-chart:channel-efficiency-matrix', fields: ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'], keywords: ['投放', '花费', 'ROAS', 'ROI', '渠道', '搜索', '广告', '抖音', '小红书', 'KOC', 'KOL', 'media efficiency'], depth: 'channel-efficiency' },
      { id: 'monthly-pulse-trend', route: 'industry-chart:monthly-pulse-trend', fields: ['monthlyPulse', 'monthlyTrend', 'trend'], keywords: ['月度', '1月', '2月', '3月', '低谷', '环比', '趋势', 'monthly', 'pulse'], depth: 'business-metric' },
      { id: 'waterfall-bridge', route: 'industry-chart:waterfall-bridge', fields: ['waterfallBridge', 'targetBridge', 'bridge'], keywords: ['目标差额', '目标桥', '缺口', '净销', 'GMV', '退款', '实收', 'Q2目标', 'bridge', 'waterfall'], depth: 'business-metric' },
      { id: 'member-cohort-ladder', route: 'industry-chart:member-cohort-ladder', fields: ['memberCohorts', 'cohorts', 'rfmLadder'], keywords: ['会员分层', 'RFM', '复购阶梯', '客群阶梯', 'cohort'], depth: 'cohort-system' },
      { id: 'member-growth-board', route: 'metric-comparison:member-growth-board', fields: ['metrics'], keywords: ['复购率', '客单价', '会员贡献', '连带率'], depth: 'growth-scorecard' },
      { id: 'growth-flywheel', route: 'timeline:flywheel', fields: ['flywheel', 'loopItems'], keywords: ['增长飞轮', '运营闭环', '内容转化', '复购'], depth: 'growth-loop' }
    ],
    depthGates: { minProofObjects: 2, requiredDomains: ['editorial-proof', 'cohort-system'] }
  },
  'energy-utility': {
    label: '能源/站点运营',
    narrativeArchetype: '站点接入 -> 运行监测 -> 告警处置 -> 调度策略 -> 收益复盘',
    entities: {
      asset: ['电站', '储能', 'PCS', 'BMS', '逆变器', '站点', '负荷', 'SOC', '告警'],
      actor: ['调度员', '运维班组', '站长', '资产方', '交易员', '安全负责人'],
      risk: ['告警', '过载', '温控', 'SOC不足', '弃光', '收益波动', '安全'],
      metric: ['SOC', '充放电效率', '可用率', '告警时长', '收益', '负荷峰谷']
    },
    proofObjects: [
      { id: 'dispatch-map', route: 'industry-chart:dispatch-map', fields: ['dispatchMap', 'siteDispatch', 'loadStorageDispatch'], keywords: ['调度地图', '站点调度', 'SOC', '负荷', '储能策略'], depth: 'dispatch-control' },
      { id: 'site-evidence', route: 'case-gallery:site-evidence', fields: ['images', 'visual'], keywords: ['站端', '现场', '电站', '储能', '资产证据'], depth: 'site-proof' },
      { id: 'asset-readout', route: 'metric-comparison', fields: ['metrics'], keywords: ['可用率', '告警', '充放电', '收益', '负荷曲线'], depth: 'asset-scorecard' },
      { id: 'hub-spoke', route: 'architecture:hub-spoke', fields: ['nodes', 'hubs', 'layers'], keywords: ['区域集控', '站点网络', 'hub', 'spoke', '多站'], depth: 'network-architecture' }
    ],
    depthGates: { minProofObjects: 2, requiredDomains: ['dispatch-control', 'site-proof'] }
  },
  'saas-technology': {
    label: 'SaaS/科技',
    narrativeArchetype: '工作流痛点 -> 平台能力 -> 采用漏斗 -> 收入扩展 -> 治理审计',
    entities: {
      asset: ['平台', '工作流', '自动化', 'API', '集成', 'SSO', '审计日志', '控制台', '原型'],
      actor: ['管理员', '业务团队', '客户成功', '开发者', '安全负责人', '审批人'],
      risk: ['采用率', '留存', '权限', '集成失败', '数据孤岛', '安全合规'],
      metric: ['激活率', '留存率', 'NRR', 'ARR', '转化率', '席位扩展', '采用率']
    },
    proofObjects: [
      { id: 'platform-capability-map', route: 'architecture:platform-capability-map', fields: ['platformCapabilities', 'capabilityMap', 'layers'], keywords: ['平台能力', '能力地图', '工作流', '自动化', 'API', 'SSO'], depth: 'platform-map' },
      { id: 'adoption-funnel', route: 'industry-chart:adoption-funnel', fields: ['adoptionFunnel', 'activationFunnel', 'cohortFunnel'], keywords: ['采用漏斗', '激活漏斗', 'activation', 'adoption', '留存'], depth: 'adoption-model' },
      { id: 'prototype-flow', route: 'case-gallery:prototype-flow', fields: ['images', 'visual'], keywords: ['原型', '界面', '工作流', 'screen', 'prototype'], depth: 'product-proof' },
      { id: 'revenue-board', route: 'metric-comparison:adoption-revenue-board', fields: ['metrics'], keywords: ['ARR', 'NRR', '席位扩展', '收入扩展', '转化率'], depth: 'business-metric' }
    ],
    depthGates: { minProofObjects: 2, requiredDomains: ['platform-map', 'adoption-model'] }
  }
};

const SEMANTIC_RELATION_PATTERNS = {
  cause: /因为|由于|导致|带来|造成|驱动|拉动|影响|瓶颈|根因|root cause|because|due to|drives?/i,
  contrast: /从[^。；;,.，]+到|对比|before|after|改造前|改造后|升级前|升级后|提升|下降|改善/i,
  dependency: /依赖|前置|输入|输出|接口|集成|链路|联动|打通|同步|upstream|downstream|dependency/i,
  ownership: /责任|责任人|owner|SLA|RACI|审批|定责|移交|handoff|accountable/i,
  decision: /建议|决策|批准|审议|下一步|行动|投委会|董事会|board|approve|decision|next step/i,
  evidence: /数据显示|证据|案例|样本|试点|截图|照片|实测|复盘|留痕|访谈|证明|proof|evidence|pilot/i
};

module.exports = {
  FACTUAL_GENERATED_ASSET_RISK,
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS
};
