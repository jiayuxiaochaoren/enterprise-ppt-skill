const MICROCOPY_TRANSLATIONS_ZH = new Map(Object.entries({
  'DIGITAL OPERATIONS': '数字化运营',
  'MANUFACTURING OPERATIONS': '制造运营',
  'INDUSTRIAL PARK OPERATIONS': '园区运营',
  'HEALTHCARE OPERATIONS': '医疗运营',
  'FINANCE / INVESTMENT': '金融投资',
  'BRAND RETAIL': '品牌零售',
  'BEAUTY BRAND WORLD': '美妆品牌世界',
  'ENERGY OPERATIONS': '能源运营',
  'ORIENTATION': '导览',
  'NARRATIVE': '叙事',
  'SYSTEM': '系统',
  'GOVERNANCE': '治理',
  'OPERATING RHYTHM': '运营节奏',
  'SOLUTION BLUEPRINT': '方案蓝图',
  'SERVICE BLUEPRINT': '服务蓝图',
  'SYSTEM ARCHITECTURE': '系统架构',
  'CONNECTED ARCHITECTURE': '连接架构',
  'LINE SYSTEM TOPOLOGY': '产线系统拓扑',
  'ENERGY TOPOLOGY': '能源拓扑',
  'ARCHITECTURE LOGIC': '架构逻辑',
  'LAYERED OPERATING SYSTEM': '分层运营系统',
  'REAL-TIME DATA FLOW': '实时数据流',
  'EDGE → DATA → DISPATCH → MANAGEMENT': '边缘 → 数据 → 调度 → 管理',
  'OPERATING DATA BUS': '运营数据总线',
  'CARE JOURNEY': '服务旅程',
  'TOUCHPOINTS · FRONTSTAGE · BACKSTAGE · QUALITY': '触点 · 前台 · 后台 · 质量',
  'PRODUCT CORE': '产品核心',
  'WORKFLOW FIELD': '工作流场域',
  'EVENTS · DATA · RIGHTS': '事件 · 数据 · 权限',
  'ENTERPRISE FIT': '企业适配',
  'DATA · PROCESS · GOVERNANCE': '数据 · 流程 · 治理',
  'SYSTEM READOUT': '系统读数',
  'EVIDENCE': '证据',
  'EVIDENCE BOARD': '证据看板',
  'EVIDENCE STACK': '证据栈',
  'EQUIPMENT PROOF': '设备证据',
  'MANUFACTURING PROOF': '制造证据',
  'VISUAL EVIDENCE': '视觉证据',
  'VISUAL PROOF': '视觉证据',
  'FIELD EVIDENCE': '现场证据',
  'PRIMARY EVIDENCE': '核心证据',
  'PROOF REQUIRED': '需要证据',
  'PROOF DIRECTION': '证据方向',
  'PRODUCT · TEXTURE · PROOF': '产品 · 质地 · 证据',
  'PRIMARY PRODUCT': '主产品',
  'HERO PRODUCT PROOF': '主产品证据',
  'INSPECTABLE OBJECT': '可检查对象',
  'CORE OBJECT': '核心对象',
  'ONE OBJECT': '核心对象',
  'CONCEPT OPENING': '概念开场',
  'POSITIONING': '定位',
  'IDENTITY': '身份信息',
  'READOUT': '读数',
  'SITE READOUT': '站点读数',
  'ASSET READOUT': '资产读数',
  'MANAGEMENT READOUT': '管理读数',
  'IC READOUT': '投委读数',
  'PATIENT JOURNEY READOUT': '患者旅程读数',
  'TOPIC READOUT': '议题读数',
  'SHOPPER SIGNAL': '消费者信号',
  'FIELD SIGNAL': '现场信号',
  'REVENUE SIGNAL': '收入信号',
  'VALUE SIGNAL': '价值信号',
  'PRIMARY RETURN': '核心回报',
  'PRIMARY OUTCOME': '核心结果',
  'PRIMARY CASE': '核心案例',
  'PRIMARY SITE': '核心站点',
  'PRIMARY SCENE': '核心场景',
  'PRIMARY SCREEN': '核心界面',
  'PRIMARY DEAL MATERIAL': '核心交易材料',
  'PRIMARY KPI': '核心 KPI',
  'SUPPORTING METRIC STRIP': '支撑指标带',
  'REPORTED METRICS': '报告指标',
  'METRIC · CASE · RISK': '指标 · 案例 · 风险',
  'REPORTING PERIOD': '报告期间',
  'PERIOD': '期间',
  'SOURCE': '来源',
  'VARIANCE / ACTION': '偏差 / 行动',
  'RETURN / CASH / RISK': '回报 / 现金 / 风险',
  'IRR CONTRIBUTION': 'IRR 贡献',
  'CONTRIBUTION BRIDGE': '贡献桥',
  'CAPITAL ACTIONS': '资本动作',
  'NEXT CAPITAL ACTIONS': '下一步资本动作',
  'ALLOCATION VIEW': '配置视图',
  'INVESTMENT DECISION': '投资决策',
  'IC MEMO': '投委会备忘',
  'IC VIEW': '投委视角',
  'BOARD READY': '审议就绪',
  'BOARD BRIEFING': '董事会简报',
  'MEETING MEMO': '会议备忘',
  'MEETING AGENDA': '会议议程',
  'DISCUSSION SEQUENCE': '讨论顺序',
  'DECISION SEQUENCE': '决策顺序',
  'DECISION MATERIALS': '决策材料',
  'DECISION IMPLICATION': '决策含义',
  'FINAL ALIGNMENT': '最终对齐',
  'FINAL DECISION': '最终决策',
  'FINAL POSITION': '最终立场',
  'NEXT DECISION': '下一步决策',
  'CLOSING': '收束',
  'CLOSING ANCHOR': '收束锚点',
  'END': '结束',
  'OWNER / CONTACT': '负责人 / 联系方式',
  'OWNER / ACTION': '责任 / 行动',
  'ORG': '组织',
  'AUD': '受众',
  'DATE': '日期',
  'CONTENTS': '目录',
  'CHAPTER': '章节',
  'REPORT BOARD': '报告看板',
  'EXECUTIVE READ': '高管读数',
  'COMMENTARY': '解读',
  'COMMENTARY RAIL': '解读栏',
  'OPERATING SEQUENCE': '运营序列',
  'OPERATING BREAKPOINTS': '运营断点',
  'OPERATING LOOP': '运营闭环',
  'ENERGY OPERATING LOOP': '能源运营闭环',
  'ENERGY LOOP': '能源闭环',
  'OPERATING FLYWHEEL': '运营飞轮',
  'PROCESS BOARD': '流程看板',
  'MONITOR · ALARM · WORKORDER · DISPATCH': '监测 · 告警 · 工单 · 调度',
  'SITE · DATA · ALARM · DISPATCH · VALUE': '站点 · 数据 · 告警 · 调度 · 价值',
  'DEPLOYMENT RADIUS': '部署半径',
  'PILOT TO REGION': '试点到区域',
  'PILOT SITES': '试点站点',
  'PILOT ROLLOUT': '试点推广',
  'LINE OPERATING PATH': '产线运营路径',
  'START SMALL · PROVE LOOP · SCALE REGIONALLY': '小范围启动 · 验证闭环 · 区域推广',
  'FAULT · WORKORDER · SPARE PART · OEE': '故障 · 工单 · 备件 · OEE',
  'ACTION · DATA · REVIEW': '行动 · 数据 · 复盘',
  'DATA BACK TO ACTION': '数据回到行动',
  'INPUT · ACTION · SIGNAL · REVIEW': '输入 · 行动 · 信号 · 复盘',
  'COMPOUNDING LOOP': '复利闭环',
  'ADOPTION PATH': '采用路径',
  'ADOPTION TO REVENUE': '采用到收入',
  'ADOPTION / REVENUE BOARD': '采用 / 收入看板',
  'CUSTOMER HEALTH PATH': '客户健康路径',
  'QUALITY HANDOFF': '质量交接',
  'QUALITY LOOP': '质量闭环',
  'CONTROL GATE': '管控闸门',
  'CONTROL SYSTEM': '控制系统',
  'MITIGATION QUEUE': '缓解队列',
  'GOVERNANCE BOARD': '治理看板',
  'GOVERNANCE CORE': '治理核心',
  'GOVERNANCE PRINCIPLE': '治理原则',
  'GOVERNANCE TABLE EDITORIAL': '治理机制表',
  'GUIDANCE AND RISK BOARD': '指引与风险看板',
  'GUIDANCE ASSUMPTIONS': '指引假设',
  'MATERIALITY MATRIX': '重要议题矩阵',
  'RISK MATRIX': '风险矩阵',
  'RESPONSIBILITY LOOP': '责任闭环',
  'RISK READINESS': '风险准备度',
  'RISK REGISTER': '风险台账',
  'CONTROL ACTIONS': '控制动作',
  'RISK · OWNER · ACTION · EVIDENCE · REVIEW': '风险 · 责任 · 行动 · 证据 · 复盘',
  'NO ORPHAN RISK': '风险不悬空',
  'RISK': '风险',
  'TRIGGER': '触发条件',
  'GUIDANCE': '指引',
  'OWNER · CADENCE · EVIDENCE · DECISION': '责任 · 节奏 · 证据 · 决策',
  'EDITORIAL CORE': '核心机制',
  'EDITORIAL AGENDA': '编辑型议程',
  'PRODUCT LINEUP': '产品阵列',
  'PRODUCT SYSTEM': '产品系统',
  'PRODUCT HERO': '产品主视觉',
  'PORTFOLIO DASHBOARD': '组合仪表盘',
  'FINANCIAL KPI SNAPSHOT': '财务 KPI 快照',
  'CHART GRID WITH COMMENTARY': '图表解读网格',
  'QUARTERLY RESULTS SUMMARY': '季度结果摘要',
  'RETURN BRIDGE': '回报桥',
  'PORTFOLIO ACTION TABLE': '组合行动表',
  'OEE / LINE READOUT': 'OEE / 产线读数',
  'PATIENT SERVICE SCORECARD': '患者服务记分卡',
  'MEMBER GROWTH BOARD': '会员增长看板',
  'PERFORMANCE SIGNAL': '表现信号',
  'VALUE CREATION MAP': '价值创造地图',
  'BRAND WORLD / BUSINESS PROOF': '品牌世界 / 业务证据',
  'BRAND WORLD': '品牌世界',
  'INDUSTRY READOUT': '行业读数',
  'PROOF OBJECT': '证据对象',
  'PROOF NOTE': '证据备注',
  'CHANNEL EFFICIENCY': '渠道效率',
  'CHANNEL EFFICIENCY MATRIX': '渠道效率矩阵',
  'NAVIGATION SEQUENCE': '汇报路径',
  'PRODUCT TEXTURE': '产品质地',
  'TEXTURE': '质地',
  'COLOR': '色彩',
  'CLAIM': '主张',
  'SCENE': '场景',
  'REASON': '理由',
  'REPEAT': '复购',
  'INITIATIVE / METRIC': '举措 / 指标',
  'SOURCE / IMPACT': '来源 / 影响',
  'COMMERCIAL PROOF': '商业证据',
  'GOVERNANCE PROOF': '治理证据',
  'VALUE CREATION PROCESS': '价值创造流程',
  'ACTIVITY': '经营动作',
  'OUTPUT': '直接产出',
  'OUTCOME': '长期结果',
  'SINGLE OBJECT MAP': '单对象地图',
  'VALUE PRINCIPLE CARDS': '价值原则卡',
  'COMPARISON': '对比',
  'INVESTMENT PLATFORM PROOF': '投资平台证据',
  'PROFILE PROOF': '简介证据',
  'CAPABILITY MAP': '能力地图',
  'CASE PROOF': '案例证据',
  'CASE COMPARISON': '案例对比',
  'SITE BEFORE / AFTER': '站点前后对比',
  'CONSUMER PROOF GRID': '消费者证据网格',
  'LOOKBOOK STORY': '图册故事',
  'PEOPLE PROOF MOSAIC': '人物证据拼贴',
  'SUSTAINABILITY PROOF SPREAD': '可持续证据展开页',
  'CONSUMER PROOF PHOTO GRID': '消费者证据照片网格',
  'PRODUCT EVIDENCE STORY': '产品证据故事',
  'EXECUTIVE PROOF BOARD': '高管证据看板',
  'SITE EVIDENCE': '现场证据',
  'PORTFOLIO EVIDENCE': '组合证据',
  'SERVICE TOUCHPOINTS': '服务触点',
  'PRODUCT WORKFLOW': '产品工作流',
  'CASE EVIDENCE': '案例证据',
  'PLATFORM CAPABILITY MAP': '平台能力地图',
  'MERCHANDISING LOGIC': '商品经营逻辑',
  'ROLE / SCENE / OUTPUT': '角色 / 场景 / 产出',
  'CUSTOMER VOICE': '客户声音',
  'CURRENT EXPERIENCE': '当前体验',
  'TARGET EXPERIENCE': '目标体验',
  'MANAGER CREDENTIALS': '管理团队资质',
  'TRACK RECORD SIGNALS': '过往业绩信号',
  'WORKFLOW PATH': '工作流路径',
  'PATHWAY MAP': '路径图',
  'PATHWAY': '路径',
  'CHANNEL': '渠道',
  'BOUNDARY': '边界',
  'SKU / PROOF MATRIX': 'SKU / 证据矩阵',
  'ROAS × SPEND MATRIX': 'ROAS × 花费矩阵',
  'SCORECARD': '记分卡',
  'MATRIX': '矩阵',
  'MONTHLY PULSE': '月度脉冲',
  'INFORMATION GAP': '信息缺口',
  'INFORMATIONGAP': '信息缺口',
  'SERVICE PATH': '服务路径',
  'LOAD': '负荷',
  'DISPATCH': '调度',
  'FROM': '现状',
  'TO': '目标',
  'CHANGE': '变化',
  'BEFORE': '改造前',
  'AFTER': '改造后',
  'SOLID PALETTE': '稳定配色',
  'DESIGN PRINCIPLE': '设计原则',
  'UPGRADE DEMANDS': '升级诉求',
  'BESS · PV · MICROGRID': 'BESS · 光伏 · 微电网',
  'INPUT': '输入',
  'ACTION': '行动',
  'OUTCOME': '结果',
  'HIGH': '高',
  'MEDIUM': '中',
  'LOW': '低',
  'CHART': '图表'
}));

const MICROCOPY_TOKEN_TRANSLATIONS_ZH = {
  ACTION: '行动',
  ADOPTION: '采用',
  ALARM: '告警',
  ARCHITECTURE: '架构',
  BACKSTAGE: '后台',
  BOARD: '看板',
  BRAND: '品牌',
  CADENCE: '节奏',
  CAPITAL: '资本',
  CASE: '案例',
  CASH: '现金',
  CHART: '图表',
  CONTACT: '联系方式',
  CONTROL: '控制',
  CORE: '核心',
  CUSTOMER: '客户',
  DATA: '数据',
  DECISION: '决策',
  DISPATCH: '调度',
  EDGE: '边缘',
  EDITORIAL: '编辑型',
  ENTERPRISE: '企业',
  EVIDENCE: '证据',
  FIELD: '现场',
  FINAL: '最终',
  FRONTSTAGE: '前台',
  GOVERNANCE: '治理',
  GUIDANCE: '指引',
  INPUT: '输入',
  LOAD: '负荷',
  MANAGEMENT: '管理',
  METRIC: '指标',
  MONITOR: '监测',
  NEXT: '下一步',
  OPERATING: '运营',
  OPERATIONS: '运营',
  OUTCOME: '结果',
  OWNER: '责任',
  PERIOD: '期间',
  PROCESS: '流程',
  PRODUCT: '产品',
  PROOF: '证据',
  QUALITY: '质量',
  READOUT: '读数',
  RETURN: '回报',
  REVIEW: '复盘',
  RIGHTS: '权限',
  RISK: '风险',
  SCENE: '场景',
  SIGNAL: '信号',
  SITE: '站点',
  SOURCE: '来源',
  TRIGGER: '触发条件',
  VALUE: '价值',
  VISUAL: '视觉',
  WORKFLOW: '工作流',
  WORKORDER: '工单'
};

const MICROCOPY_ACRONYMS = new Set(['API', 'ARR', 'BESS', 'CRM', 'DPI', 'ESG', 'GMV', 'IC', 'IRR', 'KPI', 'MOIC', 'MTBF', 'MTTR', 'NRR', 'OA', 'OEE', 'PCS', 'PLC', 'PV', 'Q1', 'Q2', 'Q3', 'Q4', 'ROI', 'ROAS', 'SLA', 'SOC', 'SKU', 'SSO', 'TVPI']);

function containsCjkText(value = '') {
  return /[\u3400-\u9fff]/.test(String(value || ''));
}

function explicitLanguageFrom(value = {}) {
  const policy = value.visibleLanguagePolicy || value.visible_language_policy || value.languagePolicy || value.language_policy || {};
  const raw = value.language || value.lang || value.locale || value.outputLanguage || value.output_language ||
    value.targetLanguage || value.target_language || policy.language || policy.targetLanguage || policy.target_language || '';
  const lang = String(raw || '').trim().toLowerCase();
  if (!lang) return '';
  if (/^(zh|cn|chinese|中文|汉语|简体中文|zh-cn|zh_hans)/i.test(lang)) return 'zh-CN';
  if (/^(en|english|英文|英语|en-us|en-gb)/i.test(lang)) return 'en';
  return raw;
}

function inferDeckLanguage(plan = {}) {
  const explicit = explicitLanguageFrom(plan);
  if (explicit) return explicit;
  const text = flattenLanguageText({
    title: plan.title,
    subtitle: plan.subtitle,
    organization: plan.organization,
    audience: plan.audience,
    slides: plan.slides,
    document: plan.document,
    claimSpine: plan.claimSpine || plan.claim_spine
  });
  const cjkCount = (String(text).match(/[\u3400-\u9fff]/g) || []).length;
  const latinWords = (String(text).match(/[A-Za-z]{3,}/g) || []).length;
  if (cjkCount >= 8 && cjkCount >= latinWords * 1.2) return 'zh-CN';
  if (cjkCount >= 18) return 'zh-CN';
  return 'en';
}

function languagePolicyFor(plan = {}) {
  const source = plan.visibleLanguagePolicy || plan.visible_language_policy || plan.languagePolicy || plan.language_policy || {};
  const language = explicitLanguageFrom(plan) || inferDeckLanguage(plan);
  const localize = /^zh/i.test(String(language || '')) &&
    source.localizeNonEssentialMicrocopy !== false &&
    source.localize_non_essential_microcopy !== false &&
    source.visibleMicrocopy !== 'preserve-english-labels' &&
    source.visible_microcopy !== 'preserve-english-labels' &&
    plan.preserveEnglishLabels !== true &&
    plan.allowEnglishLabels !== true;
  return Object.assign({
    version: 'visible-language-policy/v1',
    language,
    localizeNonEssentialMicrocopy: localize,
    preserveAcronyms: true,
    exceptions: ['brand names', 'product names', 'stock tickers', 'URLs', 'emails', 'standard acronyms', 'source titles']
  }, source, {
    language,
    localizeNonEssentialMicrocopy: localize
  });
}

function normalizeMicrocopyKey(value = '') {
  return String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function translateMicrocopySequence(key = '') {
  const parts = String(key || '').split(/(\s+(?:→|\/|·|\+|&)\s+|\s*-\s*)/).filter(part => part !== '');
  if (parts.length < 3) return '';
  let translatedAny = false;
  const out = parts.map(part => {
    if (/^\s*(?:→|\/|·|\+|&|-)\s*$/.test(part)) return part.replace(/\s+/g, ' ');
    const token = part.trim();
    if (!token) return part;
    if (MICROCOPY_ACRONYMS.has(token)) return token;
    const zh = MICROCOPY_TOKEN_TRANSLATIONS_ZH[token];
    if (!zh) return null;
    translatedAny = true;
    return zh;
  });
  if (!translatedAny || out.some(part => part == null)) return '';
  return out.join('').replace(/\s*\/\s*/g, ' / ').replace(/\s*·\s*/g, ' · ').replace(/\s*→\s*/g, ' → ').trim();
}

function localizeMicrocopy(plan = {}, text = '', opts = {}) {
  const raw = String(text == null ? '' : text).trim();
  if (!raw || opts.preserveLanguage || opts.preserveMicrocopy || opts.noLocalize) return text;
  const policy = languagePolicyFor(plan);
  if (!policy.localizeNonEssentialMicrocopy) return text;
  if (containsCjkText(raw)) return text;
  if (/^[\d\s./:%+-]+$/.test(raw)) return text;
  const upper = normalizeMicrocopyKey(raw);
  if (MICROCOPY_ACRONYMS.has(upper)) return text;
  const withYear = upper.match(/^(.+?)\s+\/\s+(\d{4})$/);
  if (withYear) {
    const translated = MICROCOPY_TRANSLATIONS_ZH.get(withYear[1]) || translateMicrocopySequence(withYear[1]);
    if (translated) return `${translated} / ${withYear[2]}`;
  }
  if (MICROCOPY_TRANSLATIONS_ZH.has(upper)) return MICROCOPY_TRANSLATIONS_ZH.get(upper);
  const numbered = upper.match(/^(PROOF|CHART|CERT|CONTROL|PRINCIPLE|LINE|STEP|SUPPORT|INFO)\s*0?(\d+)$/);
  if (numbered) {
    const labels = {
      PROOF: '证据',
      CHART: '图表',
      CERT: '证书',
      CONTROL: '控制',
      PRINCIPLE: '原则',
      LINE: '产线',
      STEP: '步骤',
      SUPPORT: '支撑',
      INFO: '信息'
    };
    return `${labels[numbered[1]] || numbered[1]} ${String(numbered[2]).padStart(2, '0')}`;
  }
  const sequence = translateMicrocopySequence(upper);
  if (sequence) return sequence;
  const metric = upper.match(/^METRIC\s+(\d+)$/);
  if (metric) return `指标 ${metric[1]}`;
  const risk = upper.match(/^RISK\s+(\d+)$/);
  if (risk) return `风险 ${risk[1]}`;
  return text;
}


function flattenLanguageText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenLanguageText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenLanguageText).join(' ');
  return '';
}

module.exports = {
  containsCjkText,
  inferDeckLanguage,
  languagePolicyFor,
  localizeMicrocopy
};
