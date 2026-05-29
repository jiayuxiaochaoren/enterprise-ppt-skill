const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readPlan(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const existingBriefs = [
  {
    slug: 'financial-results-review',
    label: '金融 / 财报 / 投资者关系',
    industry: 'finance-investment',
    required: ['收入', '风险'],
    sourceFile: 'examples/acceptance-financial-results-brief.json',
    plan: readPlan('examples/acceptance-financial-results-brief.json')
  },
  {
    slug: 'industrial-company-intro',
    label: '制造 / 工业 / 能源',
    industry: 'manufacturing-operations',
    required: ['恒越', '输送'],
    sourceFile: 'examples/acceptance-company-intro-brief.json',
    plan: readPlan('examples/acceptance-company-intro-brief.json')
  },
  {
    slug: 'beauty-brand-report',
    label: '美妆 / 消费品牌 / 零售',
    industry: 'beauty-consumer',
    required: ['品牌', '会员'],
    sourceFile: 'examples/acceptance-beauty-brand-report-brief.json',
    plan: readPlan('examples/acceptance-beauty-brand-report-brief.json')
  }
];

const additionalBriefs = [
  {
    slug: 'saas-ai-platform-growth',
    label: 'SaaS / AI / 科技服务',
    industry: 'saas-technology',
    required: ['SaaS', '平台'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'saas-technology',
      documentType: 'product-platform',
      title: '企业 AI SaaS 平台增长方案',
      subtitle: '用平台能力、采用漏斗和收入扩展证明产品价值',
      organization: '曜能数智',
      audience: 'CEO / 产品负责人 / 销售负责人',
      footer: 'AI SaaS Platform Growth',
      visualIntent: 'image-rich',
      media: {
        cover: 'acceptance://saas-ai-platform-growth/cover.png',
        gallery: [
          'acceptance://saas-ai-platform-growth/prototype-1.png',
          'acceptance://saas-ai-platform-growth/prototype-2.png',
          'acceptance://saas-ai-platform-growth/prototype-3.png'
        ]
      },
      slides: [
        { type: 'auto', layoutVariant: 'airy-concept-opening', title: '企业 AI SaaS 平台增长方案', subtitle: '用平台能力、采用漏斗和收入扩展证明产品价值' },
        { type: 'toc-clean', title: '汇报路径', subtitle: '从工作流痛点、平台能力到采用和收入扩展', items: ['痛点与机会', '平台能力地图', '原型工作流', '采用漏斗', '收入扩展', '权限治理'] },
        {
          type: 'strategy-map',
          layoutVariant: 'single-object-concept-map',
          title: '围绕客户工作台组织自动化、治理和收入扩展',
          claim: 'SaaS 战略页必须有一个清晰核心对象，外围能力只解释它如何产生价值。',
          centerTitle: '客户工作台',
          drivers: ['任务入口', '数据事件', '权限边界'],
          actions: ['AI 摘要', '审批协同', '集成 API', '审计留痕'],
          outcomes: ['激活提升', '续约稳定', '扩展收入改善'],
          businessLogic: {
            currentState: '客户仍把任务、审批和复盘分散在多个工具中。',
            impact: '核心工作台越清晰，平台价值越容易被采购团队理解。',
            cause: '自动化、集成和治理都围绕同一个客户工作对象展开。',
            action: '把演示和试点都收束到客户工作台对象。',
            metric: '激活率、集成客户占比、NRR'
          }
        },
        {
          type: 'architecture',
          layoutVariant: 'platform-capability-map',
          title: '平台能力地图把工作流、自动化和治理放进同一系统',
          subtitle: 'SaaS 能力页必须解释用户动作、数据事件和企业治理之间的关系。',
          platformCapabilities: [
            { title: '协同工作台', body: '任务与审批' },
            { title: 'AI 自动化', body: '摘要与提醒' },
            { title: '集成 API', body: 'CRM / SSO' },
            { title: '审计治理', body: '权限与日志' }
          ],
          layers: [
            { title: '入口层', items: ['Web App', 'Admin Console', 'API'] },
            { title: '工作流层', items: ['任务空间', '自动摘要', '审批流'] },
            { title: '数据层', items: ['事件流', '权限模型', '审计日志'] },
            { title: '集成层', items: ['CRM', 'SSO', 'Data Warehouse'] }
          ],
          businessLogic: {
            currentState: '企业客户的协作、数据和审批分散在多个系统。',
            impact: '平台能力越能嵌入核心工作流，续约和扩展越稳定。',
            cause: '工作流、集成和审计治理共同决定平台嵌入度。',
            action: '优先把自动化能力放到高频审批和客户成功场景。',
            metric: '激活率、集成客户占比、审计覆盖率'
          }
        },
        {
          type: 'case-gallery',
          layoutVariant: 'prototype-flow',
          title: '原型证据板展示对象、动作和价值信号',
          subtitle: '界面截图承担产品证明作用，不伪造真实客户界面。',
          images: ['acceptance://saas-ai-platform-growth/prototype-1.png', 'acceptance://saas-ai-platform-growth/prototype-2.png', 'acceptance://saas-ai-platform-growth/prototype-3.png'],
          cards: [
            { title: '工作台对象', body: '看清用户进入平台后的核心对象。' },
            { title: '自动化路径', body: '解释 AI 如何进入工作流。' },
            { title: '价值读数', body: '把采用行为连回收入扩展。' }
          ],
          businessLogic: {
            currentState: '客户需要先看懂产品对象，才会相信采用路径。',
            impact: '清晰的原型证据降低采购和试点沟通成本。',
            cause: '界面状态把用户动作、自动化节点和价值读数连接起来。',
            action: '将原型演示固定为工作台、自动化、价值读数三段。',
            metric: '试点转化率、演示完成率、激活率'
          }
        },
        {
          type: 'industry-chart',
          layoutVariant: 'adoption-funnel',
          themeIntent: 'operating-path',
          accentRole: 'action',
          title: '采用漏斗把注册、激活、集成和扩展串成同一条链',
          subtitle: '采用率是产品价值进入商业增长的第一组证据。',
          adoptionFunnel: [
            { title: '注册团队', value: 100, unit: '%' },
            { title: '完成激活', value: 64, unit: '%' },
            { title: '完成集成', value: 46, unit: '%' },
            { title: '扩展席位', value: 28, unit: '%' }
          ],
          businessLogic: {
            currentState: '注册团队到扩展席位之间仍有明显漏斗损耗。',
            impact: '漏斗每推进一层，收入扩展确定性都会提高。',
            cause: '激活动作、系统集成和跨部门复制影响采用深度。',
            action: '把客户成功动作集中在激活和集成两个断点。',
            metric: '激活率、集成率、扩展席位率'
          }
        },
        {
          type: 'metric-comparison',
          layoutVariant: 'adoption-revenue-board',
          title: '收入扩展来自激活率、集成深度和席位增长',
          claim: '数据页要把客户采用深度和收入增长放在同一张经营板上。',
          metrics: [
            { label: 'NRR', value: '118%', note: '扩展收入改善' },
            { label: '激活率', value: '64%', note: '首个核心工作流完成' },
            { label: '集成客户', value: '72%', note: '平台嵌入度提升' }
          ],
          businessLogic: {
            currentState: '客户完成核心动作后留存更稳定。',
            impact: '采用深度带动席位扩展和 NRR 改善。',
            cause: '工作流、集成和治理能力共同提升嵌入度。',
            action: '优先推动集成客户完成第二条自动化工作流。',
            metric: 'NRR、激活率、集成客户占比'
          }
        },
        {
          type: 'risk-table',
          layoutVariant: 'permission-governance',
          title: '企业客户采购前必须看清权限、审计和数据边界',
          rows: [
            ['权限边界不清', '高', 'SSO、角色和数据范围同步定义'],
            ['集成失败影响采用', '中', '优先覆盖 CRM 与工单系统'],
            ['审计日志缺口', '中', '关键动作保留可追溯日志'],
            ['自动化误触发', '低', '高风险动作保留人工审批']
          ]
        },
        {
          type: 'timeline',
          layoutVariant: 'automation-workflow',
          title: '落地路径从一个核心工作流扩展到多部门平台化',
          phases: [
            { title: '首个团队', body: '跑通任务空间和自动摘要。' },
            { title: '系统集成', body: '连接 CRM、SSO 和数据仓库。' },
            { title: '扩展席位', body: '将模板复制到相邻部门。' },
            { title: '经营复盘', body: '用 NRR 和激活率更新路线图。' }
          ]
        },
        {
          type: 'closing',
          layoutVariant: 'premium-closing-anchor',
          title: '把产品采用转成收入增长',
          subtitle: '下一步围绕核心工作流、集成客户和 NRR 建立季度复盘。',
          actions: [
            { title: '采用', body: '锁定核心动作' },
            { title: '集成', body: '提升平台嵌入' },
            { title: '收入', body: '复盘 NRR 贡献' }
          ]
        }
      ]
    }
  },
  {
    slug: 'healthcare-service-quality',
    label: '医疗 / 护理 / 健康',
    industry: 'healthcare-operations',
    required: ['患者', '质控'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'healthcare-operations',
      documentType: 'service-quality-review',
      title: '门诊服务质量改善方案',
      subtitle: '把患者旅程、质量交接和责任闭环放进同一套运营复盘',
      organization: '曜能健康运营中心',
      audience: '医院管理层 / 运营管理部 / 质控办',
      footer: 'Healthcare Service Quality',
      visualIntent: 'case-led',
      media: {
        cover: 'acceptance://healthcare-service-quality/cover.png',
        gallery: [
          'acceptance://healthcare-service-quality/service-1.png',
          'acceptance://healthcare-service-quality/service-2.png',
          'acceptance://healthcare-service-quality/service-3.png'
        ]
      },
      slides: [
        { type: 'auto', title: '门诊服务质量改善方案', subtitle: '把患者旅程、质量交接和责任闭环放进同一套运营复盘' },
        { type: 'toc-clean', title: '汇报路径', subtitle: '从患者旅程到质量指标和责任闭环', items: ['患者旅程', '服务蓝图', '质量交接', '指标复盘', '责任与风险'] },
        {
          type: 'architecture',
          layoutVariant: 'service-blueprint',
          title: '服务蓝图把患者动作、前台服务和后台资源放在一起',
          subtitle: '医疗服务页要能解释触点、责任、证据和质量指标之间的关系。',
          businessLogic: {
            currentState: '患者在预约、到院、检查和反馈节点体验不稳定。',
            impact: '触点断点会放大等待、投诉和复诊流失。',
            cause: '前台服务和后台资源没有被同一张蓝图管理。',
            action: '先把四个关键触点纳入统一旅程复盘。',
            metric: '等待时长、反馈闭环率、满意度'
          },
          serviceBlueprint: [
            { title: '预约', patient: '线上预约', frontstage: '入口登记', backstage: '号源调度', evidence: '预约记录' },
            { title: '到院', patient: '签到导诊', frontstage: '导诊分流', backstage: '资源排班', evidence: '等待时长' },
            { title: '检查', patient: '完成检查', frontstage: '检查引导', backstage: '科室协同', evidence: '报告节点' },
            { title: '反馈', patient: '随访反馈', frontstage: '问题受理', backstage: '质控复盘', evidence: '整改闭环' }
          ]
        },
        {
          type: 'industry-chart',
          layoutVariant: 'quality-handoff',
          themeIntent: 'system-architecture',
          accentRole: 'evidence',
          title: '质量交接图把跨科室责任转成可检查节点',
          subtitle: '从导诊、检查、医生到随访，每次交接都要留下证据。',
          qualityHandoff: [
            { from: '导诊', to: '检查', title: '身份与项目确认', body: '避免重复问询' },
            { from: '检查', to: '医生', title: '报告节点同步', body: '异常优先提醒' },
            { from: '医生', to: '随访', title: '处置建议交接', body: '进入复盘机制' }
          ],
          businessLogic: {
            currentState: '跨科室交接容易出现信息遗漏和响应延迟。',
            impact: '交接质量直接影响患者等待和异常处理速度。',
            cause: '身份、报告和处置建议没有统一留痕。',
            action: '把每次交接改成有对象、有时限、有证据的节点。',
            metric: '交接准时率、异常报告响应时长'
          }
        },
        {
          type: 'metric-comparison',
          layoutVariant: 'patient-service-scorecard',
          title: '质量指标解释等待、满意度和闭环率的改善空间',
          claim: '医疗指标页必须能回到服务触点和责任动作。',
          metrics: [
            { label: '平均等待', value: '28min', note: '高峰时段仍需分流' },
            { label: '满意度', value: '91%', note: '导诊解释改善' },
            { label: '反馈闭环', value: '86%', note: '质控复盘更稳定' }
          ],
          businessLogic: {
            currentState: '等待和反馈处理是主要体验波动来源。',
            impact: '触点体验直接影响复诊和满意度。',
            cause: '高峰排班和跨科室交接仍有断点。',
            action: '建立导诊分流、报告同步和反馈闭环三类动作。',
            metric: '等待时长、满意度、闭环率'
          }
        },
        {
          type: 'case-gallery',
          layoutVariant: 'evidence-board',
          title: '服务触点图册说明每张图证明哪个体验节点',
          subtitle: '图片不做气氛图，只证明预约、检查和随访触点。',
          images: ['acceptance://healthcare-service-quality/service-1.png', 'acceptance://healthcare-service-quality/service-2.png', 'acceptance://healthcare-service-quality/service-3.png'],
          cards: [
            { title: '入口导诊', body: '证明首个触点和分流动作。' },
            { title: '检查协同', body: '证明跨科室交接节点。' },
            { title: '随访反馈', body: '证明闭环复盘动作。' }
          ],
          businessLogic: {
            currentState: '服务素材过去只用于展示场景，缺少证明角色。',
            impact: '缺少 caption 会让图片停留在装饰层。',
            cause: '每张图没有绑定旅程节点和质量动作。',
            action: '为导诊、检查、随访三类图片绑定证据说明。',
            metric: '触点覆盖数、问题闭环率'
          }
        },
        {
          type: 'risk-table',
          layoutVariant: 'responsibility-loop',
          title: '责任闭环先明确隐私、时限和复盘责任',
          rows: [
            ['患者隐私暴露', '高', '病例和图片先脱敏再外发'],
            ['报告交接延迟', '中', '异常报告进入优先提醒'],
            ['反馈处理超时', '中', '客服中心按 SLA 追踪'],
            ['质控复盘缺证据', '中', '问题、责任和整改记录同表管理']
          ]
        },
        {
          type: 'timeline',
          layoutVariant: 'closed-loop',
          title: '改善节奏从一个门诊旅程扩展到全院质量复盘',
          phases: [
            { title: '首批触点', body: '选取预约、导诊、检查和随访。' },
            { title: '责任定义', body: '明确科室和处理时限。' },
            { title: '指标复盘', body: '按周跟踪等待和闭环。' },
            { title: '全院推广', body: '复制到其他服务链路。' }
          ]
        },
        {
          type: 'closing',
          title: '让患者触点进入可复盘服务链',
          subtitle: '先跑通门诊旅程，再扩展到跨科室质量治理。',
          actions: [
            { title: '触点', body: '确认首批旅程节点' },
            { title: '责任', body: '定义 SLA 和复盘人' },
            { title: '指标', body: '建立周度质量看板' }
          ]
        }
      ]
    }
  },
  {
    slug: 'lifestyle-experience-growth',
    label: '食品 / 文旅 / 时尚',
    industry: 'lifestyle-food-tourism-fashion',
    required: ['体验', '客群'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'lifestyle-food-tourism-fashion',
      documentType: 'experience-growth-plan',
      title: '城市微度假体验增长方案',
      subtitle: '用真实场景、客群旅程和转化指标证明体验产品价值',
      organization: '溪岸文旅',
      audience: '文旅项目管理层 / 商业运营团队',
      footer: 'Lifestyle Experience Growth',
      visualIntent: 'image-rich',
      media: {
        cover: 'acceptance://lifestyle-experience-growth/cover.png',
        gallery: [
          'acceptance://lifestyle-experience-growth/place-1.png',
          'acceptance://lifestyle-experience-growth/place-2.png',
          'acceptance://lifestyle-experience-growth/place-3.png'
        ]
      },
      slides: [
        { type: 'auto', layoutVariant: 'airy-concept-opening', title: '城市微度假体验增长方案', subtitle: '用真实场景、客群旅程和转化指标证明体验产品价值' },
        { type: 'toc-clean', title: '体验增长路径', subtitle: '从空间证据、客群旅程到转化和运营', items: ['体验主张', '场景图册', '客群旅程', '转化指标', '运营保障'] },
        {
          type: 'case-gallery',
          layoutVariant: 'product-or-place-gallery',
          title: '空间图册必须证明产品、路线和停留理由',
          subtitle: '文旅和时尚页不能只做氛围图，要解释场景能卖什么。',
          images: ['acceptance://lifestyle-experience-growth/place-1.png', 'acceptance://lifestyle-experience-growth/place-2.png', 'acceptance://lifestyle-experience-growth/place-3.png'],
          cards: [
            { title: '河岸餐饮', body: '承接午后和夜间停留。' },
            { title: '市集动线', body: '串联零售、手作和演出。' },
            { title: '旅拍场景', body: '形成社交传播素材。' }
          ],
          businessLogic: {
            currentState: '体验场景已经具备视觉吸引力，但消费理由需要更清楚。',
            impact: '场景如果不能转化为停留和客单，就只是漂亮素材。',
            cause: '空间、路线和内容触点没有被串成消费路径。',
            action: '将河岸餐饮、市集动线和旅拍场景打包成路线产品。',
            metric: '停留时长、组合客单、内容转化'
          }
        },
        {
          type: 'timeline',
          layoutVariant: 'customer-journey-map',
          title: '客群旅程从种草、到访、消费到复游形成闭环',
          phases: [
            { title: '内容种草', body: '短视频和路线笔记触发兴趣。' },
            { title: '预约到访', body: '套餐和活动日历降低决策成本。' },
            { title: '现场消费', body: '餐饮、零售和演出形成组合客单。' },
            { title: '复游分享', body: '会员权益和主题活动推动再来。' }
          ],
          businessLogic: {
            currentState: '客群从种草到复游的路径还不够稳定。',
            impact: '旅程断点会降低预约转化和复游率。',
            cause: '内容、套餐、现场消费和会员权益未形成闭环。',
            action: '按四段旅程配置内容、活动和权益。',
            metric: '预约转化率、现场客单、复游率'
          }
        },
        {
          type: 'metric-comparison',
          layoutVariant: 'conversion-scorecard',
          title: '转化看板把客流、客单和复游放进同一口径',
          claim: '体验产品的数据页要解释消费转化，不只展示客流热闹。',
          metrics: [
            { label: '周末客流', value: '18k', note: '活动日贡献高峰' },
            { label: '组合客单', value: '¥168', note: '餐饮和零售连带' },
            { label: '复游率', value: '31%', note: '主题活动带动再访' }
          ],
          businessLogic: {
            currentState: '客流增长但工作日转化仍有波动。',
            impact: '复游和组合消费决定项目长期价值。',
            cause: '路线内容、现场动线和会员活动共同影响消费。',
            action: '优先优化周末活动和工作日套餐。',
            metric: '客流、客单、复游率'
          }
        },
        {
          type: 'strategy-map',
          layoutVariant: 'experience-proof-grid',
          title: '体验证据网把空间、活动、内容和供应链连起来',
          drivers: ['空间场景', '主题活动', '社交内容'],
          actions: ['路线设计', '商户联动', '会员权益'],
          outcomes: ['停留变长', '连带提升', '复游改善'],
          businessLogic: {
            currentState: '空间、活动和传播素材分散运营。',
            impact: '分散运营会削弱项目复利和品牌记忆。',
            cause: '场景、商户和内容没有统一成体验证据网。',
            action: '用路线设计和商户联动形成可复盘的体验产品。',
            metric: '停留时长、连带率、复游率'
          }
        },
        {
          type: 'report-board',
          title: '运营保障围绕商户、活动和客流安全展开',
          label: 'OPERATING MODEL',
          coreTitle: '体验产品要能稳定交付',
          coreBody: '活动排期、商户协同和现场安全共同决定体验口碑。',
          sections: [
            { title: '商户协同', body: '统一营业节奏和联名套餐。' },
            { title: '活动排期', body: '按周末、节假日和夜间场景设计主题。' },
            { title: '安全动线', body: '高峰客流和应急通道提前演练。' },
            { title: '内容复盘', body: '追踪传播素材和到访转化。' }
          ]
        },
        {
          type: 'risk-table',
          layoutVariant: 'guidance-and-risk-board',
          title: '体验增长不能牺牲安全、商户质量和品牌调性',
          rows: [
            ['高峰客流拥堵', '高', '活动前确认动线和应急预案'],
            ['商户服务不稳定', '中', '建立服务评分和退出机制'],
            ['内容调性失焦', '中', '统一视觉和传播主题'],
            ['天气影响客流', '中', '准备室内和夜间替代方案']
          ]
        },
        {
          type: 'closing',
          title: '把体验资产转成可复盘增长动作',
          subtitle: '下一步围绕场景图册、路线套餐和会员复游做季度复盘。',
          actions: [
            { title: '场景', body: '确认主推路线' },
            { title: '转化', body: '统一客单口径' },
            { title: '复游', body: '设计会员活动' }
          ]
        }
      ]
    }
  },
  {
    slug: 'government-park-governance',
    label: '政府 / 园区 / 国企汇报',
    industry: 'government-public-sector',
    required: ['园区', '治理'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'government-public-sector',
      documentType: 'park-governance-report',
      title: '产业园区治理与招商汇报',
      subtitle: '以政策任务、资源地图和保障机制支撑下一阶段招商行动',
      organization: '东湖产业园',
      audience: '园区管委会 / 国企平台公司',
      footer: 'Park Governance Report',
      visualMode: 'solid',
      slides: [
        { type: 'auto', title: '产业园区治理与招商汇报', subtitle: '以政策任务、资源地图和保障机制支撑下一阶段招商行动' },
        { type: 'toc-clean', title: '汇报路径', subtitle: '从政策背景、资源地图到治理机制和风险保障', items: ['政策任务', '资源现状', '治理模型', '项目地图', '成效指标', '风险保障'] },
        {
          type: 'report-board',
          layoutVariant: 'policy-context-board',
          title: '政策任务需要被翻译成园区可执行的三类动作',
          label: 'POLICY CONTEXT',
          coreTitle: '任务、资源和项目必须对齐',
          coreBody: '政策页要有来源、日期和任务边界，不能只写口号。',
          sections: [
            { title: '产业导向', body: '围绕先进制造、数字服务和绿色能源招商。' },
            { title: '空间承载', body: '梳理标准厂房、研发空间和配套服务。' },
            { title: '服务机制', body: '建立项目准入、落地和跟踪复盘。' },
            { title: '考核口径', body: '统一签约、开工、投产和税收指标。' }
          ],
          sourceNote: '政策口径：2026 年园区招商工作会材料'
        },
        {
          type: 'risk-table',
          layoutVariant: 'materiality-matrix-board',
          title: '园区治理议题需要同时评估政策影响和经营影响',
          claim: '重要议题矩阵用于区分招商、服务、空间和风险治理优先级。',
          rows: [
            ['重点产业招商', '高', '进入年度一号工程'],
            ['企业服务满意度', '中', '纳入季度走访复盘'],
            ['空间资源利用率', '中', '按楼宇和片区更新台账'],
            ['安全与合规保障', '高', '建立红线预警和整改闭环']
          ],
          sourceNote: '议题口径：园区年度治理复盘材料'
        },
        {
          type: 'strategy-map',
          layoutVariant: 'resource-map',
          title: '资源地图把空间、产业链和服务能力放进同一张图',
          drivers: ['标准厂房', '研发载体', '公共服务'],
          actions: ['项目匹配', '手续协同', '投产跟踪'],
          outcomes: ['落地效率提升', '企业满意度改善', '产业链集聚']
        },
        {
          type: 'strategy-map',
          layoutVariant: 'governance-operating-model',
          themeIntent: 'operating-path',
          accentRole: 'action',
          title: '治理模型明确管委会、平台公司和服务专班的责任',
          drivers: ['招商线索', '项目准入', '企业服务'],
          actions: ['联席评审', '专班推进', '月度复盘'],
          outcomes: ['责任清晰', '项目可追踪', '风险可预警']
        },
        {
          type: 'metric-comparison',
          layoutVariant: 'milestone-scorecard',
          title: '阶段成效用签约、开工和投产三个里程碑衡量',
          claim: '公共汇报的数据页必须能回到政策任务和项目进度。',
          metrics: [
            { label: '签约项目', value: '24个', note: '先进制造占比提升' },
            { label: '开工项目', value: '11个', note: '审批协同加速' },
            { label: '投产项目', value: '6个', note: '形成年度贡献' }
          ],
          businessLogic: {
            currentState: '招商线索增加，但项目落地节奏不均衡。',
            impact: '开工和投产决定政策任务兑现。',
            cause: '空间、手续和服务协同影响项目进度。',
            action: '对重点项目建立专班和月度清单。',
            metric: '签约项目、开工项目、投产项目'
          }
        },
        {
          type: 'risk-table',
          layoutVariant: 'risk-and-assurance-board',
          title: '风险保障页要同时覆盖政策来源、项目敏感和推进责任',
          rows: [
            ['政策口径引用不准', '高', '标注来源、日期和适用范围'],
            ['未公开项目外泄', '高', '项目名称脱敏并分级展示'],
            ['审批节点延迟', '中', '专班推进并记录责任人'],
            ['招商承诺过度', '中', '公开表述回到已确认资源']
          ]
        },
        {
          type: 'timeline',
          layoutVariant: 'closed-loop',
          themeIntent: 'operating-path',
          accentRole: 'action',
          title: '下一阶段以线索、准入、落地、投产四个节点复盘',
          phases: [
            { title: '线索储备', body: '统一项目来源和产业标签。' },
            { title: '准入评审', body: '明确空间、能耗和合规边界。' },
            { title: '落地服务', body: '专班跟踪手续和建设节点。' },
            { title: '投产复盘', body: '回看贡献指标和服务问题。' }
          ]
        },
        {
          type: 'closing',
          title: '确认项目清单和月度推进机制',
          subtitle: '以资源地图、治理模型和风险保障承接下一轮招商。',
          actions: [
            { title: '项目', body: '确认重点清单' },
            { title: '责任', body: '明确专班机制' },
            { title: '复盘', body: '建立月度进度会' }
          ]
        }
      ]
    }
  },
  {
    slug: 'people-culture-company',
    label: '招聘 / 文化 / 公司介绍',
    industry: 'people-culture-company',
    required: ['文化', '团队'],
    plan: {
      style: 'premium-commercial-keynote',
      industry: 'people-culture-company',
      documentType: 'company-culture-intro',
      title: '星火数科文化与组织介绍',
      subtitle: '用使命、团队证据和价值观行为说明公司为什么值得加入',
      organization: '星火数科',
      audience: '候选人 / 校招学生 / 合作伙伴',
      footer: 'Spark Culture Introduction',
      visualIntent: 'image-rich',
      media: {
        cover: 'acceptance://people-culture-company/cover.png',
        gallery: [
          'acceptance://people-culture-company/team-1.png',
          'acceptance://people-culture-company/team-2.png',
          'acceptance://people-culture-company/team-3.png'
        ]
      },
      slides: [
        { type: 'auto', layoutVariant: 'culture-cover-with-soft-geometry', title: '星火数科文化与组织介绍', subtitle: '用使命、团队证据和价值观行为说明公司为什么值得加入' },
        { type: 'toc-clean', title: '阅读路径', subtitle: '从组织身份、使命愿景到团队证据和成长机制', items: ['我们是谁', '使命愿景', '团队证据', '价值观行为', '成长机制', '加入方式'] },
        {
          type: 'manifesto',
          layoutVariant: 'mission-statement-stage',
          title: '使命不是口号，而是团队每天做出的产品选择',
          statement: '让复杂业务像清晰流程一样被理解、协同和改进。',
          businessLogic: {
            currentState: '候选人需要理解公司使命如何落到真实工作。',
            impact: '使命越能对应产品选择，文化可信度越高。',
            cause: '真实问题、证据判断和长期系统共同塑造团队行为。',
            action: '将使命拆成三个可观察的行为原则。',
            metric: '项目复盘质量、候选人接受率'
          },
          principles: [
            { title: '面向真实问题', body: '先理解业务现场，再讨论方案。' },
            { title: '用证据说话', body: '每个判断都有数据、访谈或案例支撑。' },
            { title: '长期主义', body: '用可维护系统承接短期增长。' }
          ]
        },
        {
          type: 'case-gallery',
          layoutVariant: 'people-proof-mosaic',
          title: '团队证据墙展示角色、场景和产出，而不是摆拍氛围',
          subtitle: '人物图册必须解释团队如何协作、交付和成长。',
          images: ['acceptance://people-culture-company/team-1.png', 'acceptance://people-culture-company/team-2.png', 'acceptance://people-culture-company/team-3.png'],
          cards: [
            { title: '产品小组', body: '围绕客户工作流定义版本。' },
            { title: '交付现场', body: '和客户共同验证业务效果。' },
            { title: '技术复盘', body: '将经验沉淀为平台能力。' }
          ],
          businessLogic: {
            currentState: '团队照片如果没有角色说明，会变成空泛氛围。',
            impact: '候选人需要看到协作方式和真实产出。',
            cause: '产品、交付和技术复盘共同构成团队证据。',
            action: '每张团队图绑定角色、场景和产出说明。',
            metric: '候选人转化、项目复盘覆盖率'
          }
        },
        {
          type: 'manifesto',
          layoutVariant: 'value-principle-cards',
          title: '价值观需要对应可观察的行为原则',
          principles: [
            { title: '清晰表达', body: '把复杂问题写成可执行任务。' },
            { title: '主动补位', body: '发现断点就先推进闭环。' },
            { title: '尊重专业', body: '让事实、用户和代码共同决定方案。' },
            { title: '复盘成长', body: '每个项目都留下可复用经验。' }
          ],
          businessLogic: {
            currentState: '价值观需要从抽象词变成可观察行为。',
            impact: '行为原则越具体，招聘和管理越容易对齐。',
            cause: '表达、补位、专业和复盘构成日常协作标准。',
            action: '将价值观写成面试和项目复盘都能检查的问题。',
            metric: '价值观面试一致性、项目复盘完成率'
          }
        },
        {
          type: 'metric-comparison',
          layoutVariant: 'company-profile-proof',
          title: '组织成长用项目经验、客户复购和人才培养共同证明',
          claim: '公司介绍页要把文化落到业务事实和团队成长上。',
          metrics: [
            { label: '核心项目', value: '42个', note: '覆盖制造、零售和政企场景' },
            { label: '客户复购', value: '68%', note: '长期服务关系稳定' },
            { label: '内部晋升', value: '31%', note: '导师和项目制培养' }
          ],
          businessLogic: {
            currentState: '团队在多行业项目中沉淀方法。',
            impact: '稳定复购和内部成长证明文化不是空话。',
            cause: '项目复盘、导师机制和平台工具共同支撑成长。',
            action: '把候选人培养路径写进岗位沟通。',
            metric: '核心项目、客户复购、内部晋升'
          }
        },
        {
          type: 'timeline',
          layoutVariant: 'closed-loop',
          title: '新人从入职、跟项目到独立负责有清晰成长路径',
          phases: [
            { title: '入职训练', body: '理解产品、客户和交付方法。' },
            { title: '项目跟进', body: '在导师陪伴下参与真实场景。' },
            { title: '独立负责', body: '承担模块、客户或内部工具。' },
            { title: '经验沉淀', body: '输出文档、模板和复盘材料。' }
          ]
        },
        {
          type: 'risk-table',
          layoutVariant: 'governance-table-editorial',
          title: '招聘沟通需要避免空泛口号和未经授权的人物素材',
          rows: [
            ['价值观口号空泛', '中', '每条价值观必须绑定行为证据'],
            ['人物照片授权不清', '高', '外发前确认肖像与渠道授权'],
            ['岗位承诺过度', '中', '薪酬、福利和成长路径按实际口径表达'],
            ['公司信息缺联系人', '低', '结束页保留官网、邮箱和下一步动作']
          ]
        },
        {
          type: 'closing',
          layoutVariant: 'premium-closing-anchor',
          title: '期待和真实问题同行的人加入',
          subtitle: '下一步可以了解岗位、项目和团队成长路径。',
          contacts: ['www.spark-example.cn', 'talent@spark-example.cn', '上海市徐汇区'],
          actions: [
            { title: '岗位', body: '查看开放职位' },
            { title: '项目', body: '了解真实场景' },
            { title: '团队', body: '预约交流' }
          ]
        }
      ]
    }
  }
];

function industryAcceptanceBriefs() {
  const withAcceptanceTrace = (brief) => {
    const plan = clone(brief.plan);
    plan.sourceTracePolicy = plan.sourceTracePolicy || {
      mode: 'plan-authored',
      sourceId: `acceptance-${brief.slug}`,
      label: `Acceptance brief: ${brief.label}`,
      authorizationStatus: 'cleared',
      sourceNote: 'Self-contained acceptance fixture; no external source material is attached.'
    };
    return plan;
  };
  return [...existingBriefs, ...additionalBriefs].map(brief => ({
    ...brief,
    plan: withAcceptanceTrace(brief)
  }));
}

module.exports = {
  ROOT,
  industryAcceptanceBriefs
};
