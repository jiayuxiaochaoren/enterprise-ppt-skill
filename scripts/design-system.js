const fs = require('fs');
const path = require('path');

const ASSET_DIR = path.resolve(__dirname, '..', 'assets');

const BASE_COLORS = {
  ink: '0B1020',
  ink2: '111827',
  slate: '1E293B',
  paper: 'F8FAFC',
  white: 'FFFFFF',
  text: '111827',
  body: '475569',
  muted: '64748B',
  line: 'E2E8F0',
  darkText: 'F8FAFC',
  darkMuted: 'A8B3C3',
  darkLine: '334155',
  panelAlt: 'F1F5F9',
  photoOverlay: '0B1020',
  captionOnImage: 'CBD5E1',
  onAccent: 'FFFFFF',
  success: '16A34A',
  warning: 'F59E0B',
  accent: '3B82F6',
  cyan: '22D3EE',
  violet: '8B5CF6',
  risk: 'EF4444',
  softBlue: 'EFF6FF',
  softCyan: 'ECFEFF'
};

function loadVisualSystem() {
  const p = path.join(ASSET_DIR, 'visual-system.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {
    return {
      fonts: { zh: 'PingFang SC', latin: 'Avenir Next', number: 'DIN Alternate' },
      palettes: {},
      visualRouter: {},
      mediaDefaults: {},
      motifs: {}
    };
  }
}

function loadReferenceLibrary() {
  const p = path.join(ASSET_DIR, 'reference-layout-library.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {
    return { recipes: [], generatedAssetPromptPatterns: {} };
  }
}

const VISUAL_SYSTEM = loadVisualSystem();
const REFERENCE_LAYOUT_LIBRARY = loadReferenceLibrary();
const FONT_STACK = Object.assign(
  { zh: 'PingFang SC', latin: 'Avenir Next', number: 'DIN Alternate' },
  VISUAL_SYSTEM.fonts || {}
);
const PALETTES = VISUAL_SYSTEM.palettes || {};
const VISUAL_ROUTER = VISUAL_SYSTEM.visualRouter || {};

const MEDIA_ASSETS = {
  energyStorageCover: path.join(ASSET_DIR, 'media', 'energy-storage-cover.jpg'),
  energyStorageDetail: path.join(ASSET_DIR, 'media', 'energy-storage-detail.jpg'),
  energyStorageBand: path.join(ASSET_DIR, 'media', 'energy-storage-band.jpg'),
  energyStorageLoop: path.join(ASSET_DIR, 'media', 'energy-storage-cover-loop.mp4')
};

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
    requiredRoutes: ['case-gallery:lookbook-story', 'metric-comparison:member-growth-board', 'timeline:flywheel', 'industry-chart:member-cohort-ladder'],
    proofObjects: ['lookbook', 'member-growth-board', 'growth-flywheel', 'member-cohort-ladder']
  },
  'energy-utility': {
    requiredRoutes: ['case-gallery:site-evidence', 'toc-clean:energy-sequence', 'closing:energy-stage', 'industry-chart:dispatch-map'],
    proofObjects: ['site-evidence', 'dispatch-map', 'asset-readout', 'energy-stage']
  },
  'saas-technology': {
    requiredRoutes: ['architecture:platform-capability-map', 'metric-comparison:adoption-revenue-board', 'case-gallery:prototype-flow', 'industry-chart:adoption-funnel'],
    proofObjects: ['platform-capability-map', 'adoption-funnel', 'prototype-flow', 'revenue-board']
  }
};

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

const STYLE_PROFILES = {
  'premium-commercial-keynote': {
    name: 'premium-commercial-keynote',
    font: FONT_STACK.zh,
    latinFont: FONT_STACK.latin,
    numberFont: FONT_STACK.number,
    density: 'commercial',
    pageFamilies: ['stage-cover', 'spatial-navigation', 'light-narrative', 'split-insight', 'system-architecture', 'capability-map', 'pathway-timeline', 'value-signal', 'risk-matrix'],
    C: BASE_COLORS
  },
  'modern-business-keynote': {
    extends: 'premium-commercial-keynote',
    name: 'modern-business-keynote'
  },
  'executive-consulting': {
    extends: 'premium-commercial-keynote',
    name: 'executive-consulting',
    density: 'consulting',
    C: { accent: '2563EB', cyan: '06B6D4', violet: '7C3AED', paper: 'F9FAFB' }
  },
  'premium-consulting-keynote': {
    extends: 'executive-consulting',
    name: 'premium-consulting-keynote'
  },
  'enterprise-tech-stage': {
    extends: 'premium-commercial-keynote',
    name: 'enterprise-tech-stage',
    density: 'stage',
    C: { ink: '070C18', ink2: '0E1726', accent: '38BDF8', cyan: '2DD4BF', violet: 'A78BFA', paper: 'F8FAFC' }
  },
  'minimal-executive-white': {
    extends: 'premium-commercial-keynote',
    name: 'minimal-executive-white',
    density: 'minimal',
    C: { ink: '111827', ink2: '1F2937', accent: '2563EB', cyan: '0891B2', violet: '6D28D9', paper: 'FBFCFE' }
  },
  'conservative-enterprise': {
    extends: 'premium-commercial-keynote',
    name: 'conservative-enterprise',
    density: 'conservative',
    C: { ink: '10233F', ink2: '163455', accent: '2F65B0', cyan: '3BA7C9', violet: '64748B', paper: 'F6F8FB' }
  }
};

function resolveStyleProfile(name = 'premium-commercial-keynote') {
  const selected = STYLE_PROFILES[name] || STYLE_PROFILES['premium-commercial-keynote'];
  if (!selected.extends) return Object.assign({}, selected, { C: Object.assign({}, selected.C) });
  const base = resolveStyleProfile(selected.extends);
  return Object.assign({}, base, selected, {
    name: selected.name || name,
    C: Object.assign({}, base.C, selected.C || {})
  });
}

function industryVisualPolicy(plan = {}) {
  const industries = VISUAL_ROUTER.industries || {};
  const base = VISUAL_ROUTER.default || {};
  const industry = industries[plan.industry] || {};
  return Object.assign({}, base, industry, {
    defaultImageRoles: Object.assign({}, base.defaultImageRoles || {}, industry.defaultImageRoles || {})
  });
}

function paletteToColors(palette = {}, base = BASE_COLORS) {
  return Object.assign({}, base, {
    ink: palette.dark || base.ink,
    ink2: palette.darkPanel || base.ink2,
    slate: palette.darkPanel || base.slate,
    paper: palette.background || base.paper,
    white: palette.panel || base.white,
    text: palette.text || base.text,
    body: palette.body || base.body,
    muted: palette.muted || base.muted,
    line: palette.line || base.line,
    darkText: palette.darkText || base.darkText,
    darkMuted: palette.darkMuted || base.darkMuted,
    darkLine: palette.darkLine || palette.darkPanel || base.darkLine,
    panelAlt: palette.panelAlt || palette.soft || base.panelAlt,
    photoOverlay: palette.photoOverlay || palette.dark || base.photoOverlay,
    captionOnImage: palette.captionOnImage || palette.darkText || base.captionOnImage,
    onAccent: palette.onAccent || base.onAccent,
    success: palette.success || base.success,
    warning: palette.warning || palette.dataHighlight || base.warning,
    accent: palette.accent || base.accent,
    cyan: palette.secondary || base.cyan,
    violet: palette.tertiary || base.violet,
    softBlue: palette.soft || base.softBlue,
    softCyan: palette.soft || base.softCyan,
    risk: palette.risk || base.risk
  });
}

function selectPaletteName(plan = {}) {
  const policy = industryVisualPolicy(plan);
  return plan.palette || policy.defaultPalette || 'boardroom-ink';
}

function slideRole(s = {}) {
  const type = s.type || 'content';
  if (type === 'cover' || type === 'cover-dark') return 'cover';
  if (type === 'closing' || type === 'closing-dark') return 'closing';
  if (type === 'chapter-divider') return 'navigation';
  if (type === 'profile-proof') return 'situation';
  if (type === 'comparison') return 'value';
  if (type === 'quote-proof') return 'split';
  if (type === 'toc' || type === 'toc-clean') return 'navigation';
  if (type === 'two-column' || type === 'two-column-clean') return 'situation';
  if (type === 'cards' || type === 'executive-blocks') return 'split';
  if (type === 'metric-comparison') return 'value';
  if (type === 'finance-bridge' || type === 'portfolio-table') return 'value';
  if (type === 'manifesto') return 'split';
  if (type === 'product-showcase') return 'product';
  if (type === 'strategy-map') return 'architecture';
  if (type === 'module-matrix') return 'capability';
  if (type === 'architecture' || type === 'architecture-dark') return 'architecture';
  if (type === 'timeline' || type === 'timeline-dark') return 'timeline';
  if (type === 'value-tiles') return 'value';
  if (type === 'table' || type === 'risk-table') return 'risk';
  if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') return 'case-gallery';
  return 'content';
}

function resolveVisualMode(plan = {}, s = {}, role = slideRole(s)) {
  const explicit = s.visual && s.visual.mode ? s.visual.mode : s.visualMode;
  if (explicit) return explicit;
  if (plan.visualMode && plan.visualMode !== 'auto') return plan.visualMode;
  const policy = industryVisualPolicy(plan);
  if ((policy.caseRoles || []).includes(role) || role === 'case-gallery') return 'case-gallery';
  return policy.visualMode || 'solid';
}

function visualRole(plan = {}, s = {}, role = slideRole(s)) {
  const visual = s.visual || {};
  if (visual.role) return visual.role;
  const policy = industryVisualPolicy(plan);
  const roles = Object.assign({}, policy.defaultImageRoles || {});
  if (roles[role]) return roles[role];
  if (role === 'case-gallery') return 'gallery';
  if (role === 'product') return 'showcase';
  if (role === 'situation') return 'evidence';
  if (role === 'cover') return 'showcase';
  return 'structure';
}

function slideWantsImage(plan = {}, s = {}, role = slideRole(s)) {
  const explicitMode = s.visual && s.visual.mode ? s.visual.mode : s.visualMode;
  if (explicitMode === 'solid') return false;
  if (explicitMode && explicitMode !== 'solid') return true;
  if ((s.visual && s.visual.image) || s.image || (Array.isArray(s.images) && s.images.length)) return true;
  if (role === 'case-gallery' && plan.media && plan.media.gallery) return true;
  if (plan.visualMode === 'solid') return false;
  if (plan.visualMode === 'photo' || plan.visualMode === 'case-gallery') return true;
  const policy = industryVisualPolicy(plan);
  if ((policy.photoRoles || []).includes(role)) return true;
  const rich = ['image-rich', 'case-led', 'asset-led', 'portfolio'].includes(plan.visualIntent || plan.assetMode || '');
  return rich && (policy.optionalPhotoRoles || []).includes(role);
}

function resolveAssetPath(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return '';
  if (path.isAbsolute(assetPath)) return assetPath;
  const cwdPath = path.resolve(process.cwd(), assetPath);
  if (fs.existsSync(cwdPath)) return cwdPath;
  return path.resolve(ASSET_DIR, assetPath.replace(/^assets\//, ''));
}

function mediaKeyForRole(role) {
  if (role === 'cover' || role === 'closing') return 'cover';
  if (role === 'navigation' || role === 'timeline') return 'band';
  if (role === 'case-gallery') return 'gallery';
  return 'detail';
}

function configuredIndustryMedia(plan = {}, role = 'cover') {
  const defaults = VISUAL_SYSTEM.mediaDefaults || {};
  const industryDefaults = defaults[plan.industry] || {};
  const value = industryDefaults[mediaKeyForRole(role)] || industryDefaults[role];
  if (Array.isArray(value)) return resolveAssetPath(value[0]);
  return value ? resolveAssetPath(value) : '';
}

function defaultIndustryMedia(plan = {}, role = 'cover') {
  const configured = configuredIndustryMedia(plan, role);
  if (configured) return configured;
  if (plan.industry !== 'energy-utility') return '';
  if (role === 'cover' || role === 'closing') return MEDIA_ASSETS.energyStorageCover;
  if (role === 'navigation' || role === 'timeline') return MEDIA_ASSETS.energyStorageBand;
  if (role === 'situation' || role === 'split' || role === 'value' || role === 'case-gallery') return MEDIA_ASSETS.energyStorageDetail;
  return '';
}

function mediaForRole(plan = {}, s = {}, role = slideRole(s)) {
  const visual = s.visual || {};
  const direct = visual.image || s.image;
  if (direct) return resolveAssetPath(direct);
  const media = plan.media || {};
  const key = mediaKeyForRole(role);
  const val = media[key];
  if (Array.isArray(val)) return resolveAssetPath(val[0]);
  if (val) return resolveAssetPath(val);
  return defaultIndustryMedia(plan, role);
}

function galleryImages(plan = {}, s = {}) {
  const raw = s.images || (s.visual && s.visual.images) || (plan.media && plan.media.gallery) || [];
  return (Array.isArray(raw) ? raw : [raw]).map(resolveAssetPath).filter(p => p && fs.existsSync(p));
}

function pageFamily(plan = {}, s = {}, roleOverride) {
  const role = roleOverride || slideRole(s);
  const mode = resolveVisualMode(plan, s, role);
  const imageRole = visualRole(plan, s, role);
  const wantsImage = slideWantsImage(plan, s, role);
  const familyKey = wantsImage ? imageRole : mode;
  const families = (((VISUAL_ROUTER.layoutFamilies || {})[role] || {})[familyKey]) ||
    (((VISUAL_ROUTER.layoutFamilies || {})[role] || {})[mode]);
  if (families) return families;
  return {
    cover: 'stage-cover',
    closing: 'stage-closing',
    navigation: 'spatial-navigation',
    situation: imageRole === 'evidence' ? 'evidence-split' : 'light-narrative',
    split: 'split-insight',
    architecture: 'system-architecture',
    capability: 'capability-map',
    product: 'product-showcase',
    timeline: 'pathway-timeline',
    value: 'value-signal',
    risk: 'risk-matrix',
    'case-gallery': 'case-gallery'
  }[role] || 'light-narrative';
}

function slideDesign(plan = {}, s = {}, roleOverride) {
  const role = roleOverride || slideRole(s);
  const mode = resolveVisualMode(plan, s, role);
  const imageRole = visualRole(plan, s, role);
  const wantsImage = slideWantsImage(plan, s, role);
  const imagePath = wantsImage ? mediaForRole(plan, s, role) : '';
  return {
    role,
    mode,
    imageRole,
    wantsImage,
    imagePath,
    mediaKey: mediaKeyForRole(role),
    pageFamily: pageFamily(plan, s, role)
  };
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.keys(value)
      .filter(k => ![
        'image',
        'images',
        'visual',
        'media',
        'referenceRecipe',
        'generatedAssetPrompt',
        'semanticIntent',
        'semanticConfidence',
        'semanticPurpose',
        'semanticRelations',
        'semanticScores',
        'industryEntities',
        'candidateProofObjects',
        'narrativeRole',
        'proofObject'
      ].includes(k))
      .map(k => flattenText(value[k]))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function keywordHit(text, names = []) {
  const lower = String(text || '').toLowerCase();
  return names.some(k => lower.includes(String(k).toLowerCase()));
}

function matchKeywordList(text, names = []) {
  const lower = String(text || '').toLowerCase();
  return names
    .filter(k => lower.includes(String(k).toLowerCase()))
    .map(String);
}

function industryKnowledgeProfile(plan = {}) {
  return INDUSTRY_KNOWLEDGE_BASE[plan.industry] || null;
}

function fieldHitScore(s = {}, fields = []) {
  return fields.reduce((score, field) => {
    const value = s[field];
    if (Array.isArray(value)) return score + (value.length ? 4 : 0);
    return score + (value != null && value !== false && value !== '' ? 4 : 0);
  }, 0);
}

function industryProofCandidates(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const profile = industryKnowledgeProfile(plan);
  if (!profile || !Array.isArray(profile.proofObjects)) return [];
  const text = flattenText(s);
  return profile.proofObjects
    .map(proof => {
      const fieldScore = fieldHitScore(s, proof.fields || []);
      const keywordHits = matchKeywordList(text, proof.keywords || []);
      let score = fieldScore + keywordHits.length * 1.8;
      if (signals.hasMetrics && /metric|scorecard|bridge|analysis|model/i.test(proof.depth || '')) score += 1.2;
      if (signals.hasGallery && /proof|evidence|editorial|product/i.test(proof.depth || '')) score += 1.2;
      if (signals.hasLoop && /loop|control|governance/i.test(proof.depth || '')) score += 1.2;
      if (signals.hasArchitecture && /map|architecture|system/i.test(proof.depth || '')) score += 1.2;
      return Object.assign({}, proof, {
        score: Number(score.toFixed(2)),
        fieldScore,
        keywordHits
      });
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);
}

function semanticRelationProfile(text = '') {
  return Object.entries(SEMANTIC_RELATION_PATTERNS).reduce((acc, [name, pattern]) => {
    acc[name] = pattern.test(text);
    return acc;
  }, {});
}

function semanticMeaning(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const profile = industryKnowledgeProfile(plan);
  const text = flattenText(s);
  const entityMatches = {};
  if (profile && profile.entities) {
    Object.entries(profile.entities).forEach(([type, keywords]) => {
      const hits = matchKeywordList(text, keywords).slice(0, 8);
      if (hits.length) entityMatches[type] = hits;
    });
  }
  const relations = semanticRelationProfile(text);
  const proofCandidates = industryProofCandidates(plan, s, signals);
  const bestProof = proofCandidates[0] || null;
  const entityCount = Object.values(entityMatches).reduce((sum, hits) => sum + hits.length, 0);
  const relationCount = Object.values(relations).filter(Boolean).length;
  const claimText = String(s.claim || s.subtitle || s.title || '').trim();
  const evidenceSignals = [
    signals.hasMetrics,
    signals.hasGallery || signals.hasCaseComparison,
    signals.hasRisk || signals.hasResponsibilityLoop,
    Boolean(bestProof && bestProof.score >= 3),
    relations.evidence
  ].filter(Boolean).length;
  const actionSignals = [
    Boolean(s.decision || s.summary),
    Array.isArray(s.actions) && s.actions.length > 0,
    relations.decision,
    relations.ownership
  ].filter(Boolean).length;
  const claimStrength = Math.min(1, (claimText.length >= 10 ? 0.35 : 0) + (claimText.length >= 22 ? 0.2 : 0) + Math.min(0.45, evidenceSignals * 0.15));
  const evidenceStrength = Math.min(1, evidenceSignals * 0.2 + Math.min(0.3, (bestProof ? bestProof.score : 0) / 18));
  const actionability = Math.min(1, actionSignals * 0.25 + (entityMatches.actor ? 0.2 : 0));
  const semanticDensity = Math.min(1, (entityCount * 0.05) + (relationCount * 0.12) + (signals.numbers * 0.025) + (signals.imageCount * 0.04));
  const industryFit = Math.min(1, (entityCount * 0.07) + (bestProof ? Math.min(0.45, bestProof.score / 18) : 0) + (profile ? 0.08 : 0));
  const materialPurpose = bestProof ? 'industry-proof' :
    (relations.decision ? 'decision' :
      (relations.cause || relations.dependency ? 'logic' :
        (relations.evidence || signals.hasGallery ? 'evidence' :
          (signals.hasMetrics ? 'metric' : 'narrative'))));
  return {
    industry: plan.industry || '',
    profileLabel: profile ? profile.label : '',
    narrativeArchetype: profile ? profile.narrativeArchetype : '',
    entities: entityMatches,
    relations,
    proofCandidates,
    bestProofObject: bestProof ? bestProof.id : '',
    bestProofRoute: bestProof ? bestProof.route : '',
    materialPurpose,
    scores: {
      claimStrength: Number(claimStrength.toFixed(2)),
      evidenceStrength: Number(evidenceStrength.toFixed(2)),
      actionability: Number(actionability.toFixed(2)),
      semanticDensity: Number(semanticDensity.toFixed(2)),
      industryFit: Number(industryFit.toFixed(2))
    }
  };
}

function contentSignals(plan = {}, s = {}, index = 0, total = 1) {
  const signalTokens = (VISUAL_SYSTEM.contentIntelligence && VISUAL_SYSTEM.contentIntelligence.signals) || {};
  const text = flattenText(s);
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
    beforeAfterImageCount;
  const cardCount = Array.isArray(s.cards) ? s.cards.length : 0;
  const itemCount = Array.isArray(s.items) ? s.items.length : 0;
  const phaseCount = Array.isArray(s.phases) ? s.phases.length : 0;
  const flywheelCount = Array.isArray(s.flywheel) ? s.flywheel.length : 0;
  const layerCount = Array.isArray(s.layers) ? s.layers.length : 0;
  const rowCount = Array.isArray(s.rows) ? s.rows.length : 0;
  const metricCount = Array.isArray(s.metrics) ? s.metrics.length : 0;
  const productCount = Array.isArray(s.products) ? s.products.length : 0;
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
  const hasCaseComparison = !!s.before || !!s.after || !!s.beforeAfter || (!!s.case && /对比|before|after|升级前|升级后/i.test(text)) || (imageCount >= 2 && /对比|before|after|升级前|升级后|改造前|改造后/i.test(text));
  const densityMode = String(s.density || s.contentDensity || plan.contentDensity || plan.densityProfile || '').toLowerCase();
  const logicChainMatches = text.match(/因果|逻辑链|链路|输入|输出|产出|结果|驱动|依赖|转化|路径|从[^。；;,.，]+到|input|output|outcome|driver|causal|chain/gi) || [];
  const hasNamedLogicChain = /因果|逻辑链|链路|价值路径|价值创造|value creation|causal chain/i.test(text);
  const hasLogicChainWord = logicChainMatches.length >= 2 ||
    /因果|逻辑链|链路|从[^。；;,.，]+到|input|output|outcome|driver|causal|chain/i.test(text);
  const hasStructuredLogic = !!s.valueChain || !!s.capitals ||
    ((s.drivers || s.inputs) && (s.outcomes || s.outputs)) ||
    ((Array.isArray(s.left) && s.left.length) && (Array.isArray(s.right) && s.right.length) && (cardCount || itemCount));
  const isTextHeavy = densityMode.includes('text') || densityMode.includes('report') || text.length > 520 || avgBlockLength > 86 || rowCount >= 6 || cardCount >= 7 || itemCount >= 9;
  const isImageHeavy = densityMode.includes('image') || densityMode.includes('gallery') || plan.visualIntent === 'image-rich' || plan.visualIntent === 'case-led' || imageCount >= 3;
  const isNumberHeavy = densityMode.includes('number') || densityMode.includes('metric') || metricCount >= 3 || metricNumbers.length >= 3 || (numbers.length >= 3 && (hasStrongMetricWord || (hasMetricWord && metricNumbers.length >= 1)));
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
    flywheelCount,
    layerCount,
    rowCount,
    metricCount,
    productCount,
    responsibilityCount,
    avgBlockLength,
    first: index === 0,
    last: index === total - 1,
    isDenseText: text.length > 380 || avgBlockLength > 72 || rowCount >= 5 || cardCount >= 6 || itemCount >= 8,
    hasMetrics: metricCount > 0 || numbers.length >= 2 || (numbers.length >= 1 && hasMetricWord),
    hasTimeline: phaseCount > 0 || keywordHit(text, signalTokens.process),
    hasLoop: hasLoopWord,
    hasFlywheel: flywheelCount > 0 || Array.isArray(s.loopItems) || hasFlywheelWord,
    hasStrategyMap: !!s.valueChain || !!s.capitals || !!s.drivers || !!s.actions || !!s.outcomes || keywordHit(text, signalTokens.strategy),
    hasArchitecture: layerCount > 0 || /架构|系统|平台|数据流|模块|能力层|application|architecture/i.test(text),
    hasProductShowcase: hasExplicitShowcase || (hasProductWord && imageCount <= 1 && !/图册|案例集|gallery|portfolio/i.test(text)),
    hasCaseSignal: keywordHit(text, signalTokens.case),
    hasGallery: imageCount >= 2 || (s.visual && s.visual.role === 'gallery'),
    hasManifesto: !!s.statement || !!s.values || keywordHit(text, signalTokens.culture),
    hasRisk: rowCount > 0 || keywordHit(text, signalTokens.risk),
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

function industryChartVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const industry = plan.industry || '';
  const text = flattenText(s);
  const chartProof = industryProofCandidates(plan, s, signals)
    .find(p => String(p.route || '').startsWith('industry-chart:') && p.score >= 3);
  if (chartProof) return String(chartProof.route).split(':')[1] || chartProof.id;
  if (hasValueField(s, ['downtimePareto', 'pareto', 'lossPareto', 'oeeLosses']) || /停机.*(Pareto|帕累托|TOP|排行)|故障.*(Pareto|帕累托)|节拍损失|OEE.*损失/i.test(text)) return 'downtime-pareto';
  if (hasValueField(s, ['valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity']) || /敏感性|估值矩阵|退出情景|IRR.*DPI|valuation sensitivity|scenario/i.test(text)) return 'valuation-sensitivity';
  if (hasValueField(s, ['qualityHandoff', 'handoffs', 'handoffMap']) || /交接|handoff|护理交接|科室交接|质量交接/i.test(text)) return 'quality-handoff';
  if (hasValueField(s, ['patientBottlenecks', 'waitBottlenecks']) || /等待瓶颈|排队瓶颈|患者等待|候诊|bottleneck/i.test(text)) return 'patient-bottleneck';
  if (hasValueField(s, ['memberCohorts', 'cohorts', 'rfmLadder']) || /会员分层|RFM| cohort|复购阶梯|客群阶梯/i.test(text)) return 'member-cohort-ladder';
  if (hasValueField(s, ['dispatchMap', 'siteDispatch', 'loadStorageDispatch']) || /调度地图|站点调度|负荷.*储能|SOC|dispatch/i.test(text)) return 'dispatch-map';
  if (hasValueField(s, ['adoptionFunnel', 'activationFunnel', 'cohortFunnel']) || /采用漏斗|激活漏斗|扩展漏斗|activation funnel|adoption funnel/i.test(text)) return 'adoption-funnel';
  if (industry === 'manufacturing-operations' && signals.hasOeeBoard) return 'downtime-pareto';
  if (industry === 'finance-investment' && signals.isNumberHeavy) return 'valuation-sensitivity';
  if (industry === 'healthcare-operations' && signals.hasServiceBlueprint) return 'quality-handoff';
  if (industry === 'brand-retail' && /会员|复购|RFM|cohort/i.test(text)) return 'member-cohort-ladder';
  if (industry === 'energy-utility' && /站点|电站|储能|告警/i.test(text)) return 'dispatch-map';
  if (industry === 'saas-technology' && /采用|激活|留存|NRR|ARR/i.test(text)) return 'adoption-funnel';
  return 'evidence-readout';
}

function semanticFrame(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const text = flattenText(s);
  const lower = text.toLowerCase();
  const meaning = semanticMeaning(plan, s, signals);
  const scores = {
    product: 0,
    caseEvidence: 0,
    governance: 0,
    process: 0,
    architecture: 0,
    decision: 0,
    metric: 0,
    logicChain: 0,
    industryChart: 0
  };
  if (s.product || hasArrayField(s, ['products'])) scores.product += 5;
  if (signals.hasProductShowcase) scores.product += 3;
  if (signals.hasGallery || signals.hasCaseSignal || signals.hasCaseComparison) scores.caseEvidence += 4;
  if (signals.imageCount >= 3) scores.caseEvidence += 2;
  if (signals.hasGovernance || signals.hasRisk || signals.hasResponsibilityLoop) scores.governance += 4;
  if (signals.hasTimeline || signals.hasLoop || signals.hasFlywheel) scores.process += 4;
  if (signals.hasArchitecture || signals.layerCount >= 3) scores.architecture += 4;
  if (signals.last || s.decision || s.summary || hasArrayField(s, ['actions'])) scores.decision += 3;
  if (signals.hasMetrics || signals.isNumberHeavy) scores.metric += 4;
  if (signals.hasLogicChain || signals.hasStructuredLogic || signals.hasNamedLogicChain) scores.logicChain += 4;
  if (hasValueField(s, [
    'downtimePareto',
    'pareto',
    'lossPareto',
    'oeeLosses',
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
    'dispatchMap',
    'siteDispatch',
    'loadStorageDispatch',
    'adoptionFunnel',
    'activationFunnel',
    'cohortFunnel'
  ])) scores.industryChart += 8;
  if (/pareto|帕累托|敏感性|交接|瓶颈|调度|漏斗|cohort|funnel|dispatch|sensitivity|handoff/i.test(lower)) scores.industryChart += 3;
  if (meaning.relations.evidence) scores.caseEvidence += 1.5;
  if (meaning.relations.cause || meaning.relations.dependency) scores.logicChain += 1.5;
  if (meaning.relations.ownership) scores.governance += 1.5;
  if (meaning.relations.decision) scores.decision += 1.5;
  if (meaning.scores.evidenceStrength >= 0.45) scores.metric += 0.8;
  if (meaning.bestProofRoute && String(meaning.bestProofRoute).startsWith('industry-chart:')) scores.industryChart += Math.min(6, Math.max(2, (meaning.proofCandidates[0] || {}).score || 0));
  else if (meaning.bestProofObject) {
    const route = String(meaning.bestProofRoute || '');
    if (route.startsWith('architecture:')) scores.architecture += 2;
    if (route.startsWith('timeline:')) scores.process += 2;
    if (route.startsWith('risk-table:')) scores.governance += 2;
    if (route.startsWith('case-gallery:')) scores.caseEvidence += 2;
    if (route.startsWith('metric-comparison:') || route === 'finance-bridge' || route === 'portfolio-table') scores.metric += 2;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryIntent, topScore] = ranked[0] || ['unknown', 0];
  const variant = industryChartVariant(plan, s, signals);
  const proofObject = (() => {
    if (primaryIntent === 'industryChart') return variant;
    if (meaning.bestProofObject && ((meaning.proofCandidates[0] || {}).score >= 3)) return meaning.bestProofObject;
    if (signals.hasOeeBoard) return 'OEE';
    if (signals.hasServiceBlueprint) return 'service-blueprint';
    if (signals.hasSaasCapability) return 'platform-capability-map';
    if (signals.hasLookbook) return 'lookbook';
    if (signals.hasCaseComparison) return 'before-after-evidence';
    if (signals.hasGallery) return 'evidence-gallery';
    if (signals.hasMetrics) return 'metric-board';
    if (signals.hasResponsibilityLoop) return 'responsibility-loop';
    if (signals.hasLogicChain) return 'logic-chain';
    return primaryIntent === 'unknown' ? 'narrative-block' : primaryIntent;
  })();
  return {
    primaryIntent: topScore > 0 ? primaryIntent : 'narrative',
    secondaryIntents: ranked.filter(([, score]) => score > 0).slice(1, 4).map(([name]) => name),
    confidence: Math.min(1, Number((topScore / 8).toFixed(2))),
    proofObject,
    industryChartVariant: variant,
    semanticMeaning: meaning,
    scores
  };
}

function inferNarrativeRole(plan = {}, s = {}, index = 0, total = 1, semantic = semanticFrame(plan, s, contentSignals(plan, s, index, total))) {
  const type = s.type || '';
  const variant = s.layoutVariant || '';
  if (index === 0 || type === 'cover') return 'setup';
  if (index === total - 1 || type === 'closing') return 'decision';
  if (type === 'chapter-divider' || type === 'toc' || type === 'toc-clean') return 'orientation';
  if (['profile-proof', 'report-board', 'comparison'].includes(type)) return 'diagnosis';
  if (semantic.primaryIntent === 'caseEvidence' || type === 'case-gallery' || type === 'quote-proof') return 'evidence';
  if (semantic.primaryIntent === 'product' || type === 'product-showcase' || type === 'architecture') return 'solution';
  if (type === 'timeline' || variant.includes('loop')) return 'operating-model';
  if (type === 'risk-table') return 'governance';
  if (type === 'metric-comparison' || type === 'finance-bridge' || type === 'portfolio-table' || type === 'industry-chart') return 'proof';
  return semantic.primaryIntent || 'narrative';
}

const NARRATIVE_ORDER = {
  setup: 0,
  orientation: 1,
  diagnosis: 2,
  evidence: 3,
  proof: 4,
  solution: 5,
  'operating-model': 6,
  governance: 7,
  decision: 8
};

function routeKey(s = {}) {
  return s.layoutVariant ? `${s.type}:${s.layoutVariant}` : String(s.type || '');
}

function applyNarrativeMetadata(plan = {}, slides = []) {
  return slides.map((slide, i) => {
    const signals = contentSignals(plan, slide, i, slides.length);
    const semantic = semanticFrame(plan, slide, signals);
    const meaning = semantic.semanticMeaning || semanticMeaning(plan, slide, signals);
    return Object.assign({}, slide, {
      semanticIntent: slide.semanticIntent || semantic.primaryIntent,
      semanticConfidence: slide.semanticConfidence || semantic.confidence,
      proofObject: slide.proofObject || semantic.proofObject,
      narrativeRole: slide.narrativeRole || inferNarrativeRole(plan, slide, i, slides.length, semantic),
      semanticPurpose: slide.semanticPurpose || meaning.materialPurpose,
      semanticRelations: slide.semanticRelations || Object.entries(meaning.relations || {}).filter(([, v]) => v).map(([k]) => k),
      industryEntities: slide.industryEntities || meaning.entities,
      semanticScores: slide.semanticScores || meaning.scores,
      candidateProofObjects: slide.candidateProofObjects || (meaning.proofCandidates || []).slice(0, 3).map(p => ({
        id: p.id,
        route: p.route,
        score: p.score
      }))
    });
  });
}

function sequenceSlidesByNarrative(plan = {}, slides = []) {
  if (slides.length <= 3) return slides;
  const first = slides[0];
  const last = slides[slides.length - 1];
  const middle = slides.slice(1, -1).map((slide, index) => ({ slide, index }));
  middle.sort((a, b) => {
    const ao = NARRATIVE_ORDER[a.slide.narrativeRole] ?? 4;
    const bo = NARRATIVE_ORDER[b.slide.narrativeRole] ?? 4;
    return ao === bo ? a.index - b.index : ao - bo;
  });
  return [first, ...middle.map(x => x.slide), last];
}

function deckNarrativeSummary(plan = {}, slides = []) {
  const roleCounts = slides.reduce((acc, slide) => {
    const role = slide.narrativeRole || 'narrative';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const routeCounts = slides.reduce((acc, slide) => {
    const key = routeKey(slide);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return {
    industry: plan.industry || '',
    documentType: plan.documentType || '',
    roleCounts,
    routeCounts,
    proofObjects: slides.map(s => s.proofObject).filter(Boolean)
  };
}

function slideCaptionCount(slide = {}) {
  return (Array.isArray(slide.cards) ? slide.cards.length : 0) +
    (Array.isArray(slide.items) ? slide.items.length : 0) +
    (Array.isArray(slide.lookbook) ? slide.lookbook.length : 0) +
    (Array.isArray(slide.productStory) ? slide.productStory.length : 0) +
    ((slide.visual && slide.visual.caption) ? 1 : 0) +
    (slide.caption ? 1 : 0);
}

function aestheticSlideScore(plan = {}, slide = {}, index = 0, total = 1) {
  const signals = contentSignals(plan, slide, index, total);
  const route = routeKey(slide);
  const meaning = semanticMeaning(plan, slide, signals);
  const flags = [];
  const dimensions = {
    hierarchy: 100,
    rhythm: 100,
    densityControl: 100,
    evidenceRelationship: 100,
    industryFit: 100
  };
  if (signals.isDenseText && !['report-board', 'strategy-map', 'risk-table', 'portfolio-table'].includes(slide.type)) {
    dimensions.densityControl -= 24;
    flags.push('denseTextOnLooseLayout');
  }
  if ((signals.cardCount >= 6 || signals.itemCount >= 8) && !['report-board', 'module-matrix', 'risk-table'].includes(slide.type)) {
    dimensions.densityControl -= 16;
    flags.push('cardOverload');
  }
  if (signals.imageCount >= 3 && slideCaptionCount(slide) < Math.min(3, signals.imageCount)) {
    dimensions.evidenceRelationship -= 30;
    flags.push('imageEvidenceWithoutLabels');
  }
  if (signals.imageCount >= 2 && !/case-gallery|product-showcase|portfolio/.test(slide.type || '')) {
    dimensions.evidenceRelationship -= 14;
    flags.push('imageMaterialOnNonEvidenceRoute');
  }
  if (slide.layoutRationale === 'default commercial split') {
    dimensions.rhythm -= 18;
    flags.push('defaultSplitFallback');
  }
  if (/executive-blocks|module-matrix/.test(route) && signals.cardCount >= 5 && meaning.scores.evidenceStrength < 0.35) {
    dimensions.hierarchy -= 18;
    dimensions.industryFit -= 16;
    flags.push('genericCardGrid');
  }
  if (meaning.scores.industryFit < 0.2 && plan.industry && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type)) {
    dimensions.industryFit -= 14;
    flags.push('weakIndustrySignal');
  }
  if ((String(slide.title || '').length > 28 || String(slide.claim || '').length > 92) && !signals.isDenseText) {
    dimensions.hierarchy -= 10;
    flags.push('longHeadline');
  }
  const score = Math.max(0, Math.round(Object.values(dimensions).reduce((a, v) => a + Math.max(0, v), 0) / Object.keys(dimensions).length));
  return {
    slide: index + 1,
    route,
    score,
    dimensions,
    flags,
    semanticPurpose: meaning.materialPurpose,
    industryFit: meaning.scores.industryFit
  };
}

function visualAestheticModel(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const slideScores = slides.map((slide, i) => aestheticSlideScore(normalized, slide, i, slides.length));
  const routeCounts = slideScores.reduce((acc, s) => {
    acc[s.route] = (acc[s.route] || 0) + 1;
    return acc;
  }, {});
  const roleCounts = slides.reduce((acc, slide) => {
    const role = slide.narrativeRole || slideRole(slide);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const findings = [];
  slideScores.forEach(s => {
    if (s.score < 62) {
      findings.push({
        slide: s.slide,
        level: 'review',
        type: 'aestheticScore',
        message: `visual aesthetic score ${s.score}; flags: ${s.flags.join(', ') || 'low composition score'}`
      });
    }
  });
  const genericRoutes = ['executive-blocks', 'module-matrix', 'two-column', 'toc-clean'];
  const genericCount = Object.entries(routeCounts)
    .filter(([route]) => genericRoutes.some(g => route === g || route.startsWith(`${g}:`)))
    .reduce((sum, [, count]) => sum + count, 0);
  if (slides.length >= 8 && genericCount / slides.length > 0.42) {
    findings.push({
      level: 'review',
      type: 'visualTemplateFatigue',
      message: `${genericCount}/${slides.length} slides use generic information-board routes; deck needs stronger proof-object rhythm`
    });
  }
  const evidenceWeak = slideScores.filter(s => s.flags.includes('imageEvidenceWithoutLabels')).length;
  if (evidenceWeak >= 2) {
    findings.push({
      level: 'review',
      type: 'evidenceRelationshipWeak',
      message: `${evidenceWeak} image-heavy slides lack evidence labels or captions`
    });
  }
  const deckScore = slideScores.length
    ? Math.round(slideScores.reduce((sum, s) => sum + s.score, 0) / slideScores.length)
    : 0;
  return {
    deckScore,
    slides: slideScores,
    routeCounts,
    roleCounts,
    findings
  };
}

function industryKnowledgeAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const profile = industryKnowledgeProfile(normalized);
  const slides = normalized.slides || [];
  if (!profile || !slides.length) return { industry: normalized.industry || '', covered: [], missingDomains: [], findings: [] };
  const covered = new Map();
  slides.forEach((slide, i) => {
    const signals = contentSignals(normalized, slide, i, slides.length);
    const meaning = semanticMeaning(normalized, slide, signals);
    const route = routeKey(slide);
    (meaning.proofCandidates || []).forEach(candidate => {
      if (candidate.score >= 3 || route === candidate.route || slide.proofObject === candidate.id) {
        const prev = covered.get(candidate.id);
        if (!prev || prev.score < candidate.score) {
          covered.set(candidate.id, {
            id: candidate.id,
            route: candidate.route,
            depth: candidate.depth,
            slide: i + 1,
            score: candidate.score
          });
        }
      }
    });
    if (slide.proofObject) {
      const proof = (profile.proofObjects || []).find(p => p.id === slide.proofObject || String(p.route || '').endsWith(`:${slide.proofObject}`));
      if (proof && !covered.has(proof.id)) {
        covered.set(proof.id, { id: proof.id, route: proof.route, depth: proof.depth, slide: i + 1, score: 3 });
      }
    }
  });
  const coveredList = [...covered.values()];
  const domains = new Set(coveredList.map(p => p.depth).filter(Boolean));
  const gate = profile.depthGates || { minProofObjects: 2, requiredDomains: [] };
  const minProofObjects = slides.length >= 10 ? Math.max(gate.minProofObjects || 2, 3) : (gate.minProofObjects || 2);
  const missingDomains = (gate.requiredDomains || []).filter(d => !domains.has(d));
  const findings = [];
  if (slides.length >= 7 && coveredList.length < minProofObjects) {
    findings.push({
      level: 'review',
      type: 'industryKnowledgeCoverage',
      message: `${profile.label} deck covers ${coveredList.length}/${minProofObjects} expected industry proof objects`
    });
  }
  if (slides.length >= 8 && missingDomains.length >= 1) {
    findings.push({
      level: 'review',
      type: 'industryDepthMissing',
      message: `${profile.label} deck misses depth domains: ${missingDomains.join(', ')}`
    });
  }
  return {
    industry: normalized.industry || '',
    label: profile.label,
    narrativeArchetype: profile.narrativeArchetype,
    covered: coveredList,
    missingDomains,
    minProofObjects,
    findings
  };
}

function auditDeckPlan(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  const industry = normalized.industry || plan.industry || '';
  if (!slides.length) {
    findings.push({ level: 'fail', type: 'emptyPlan', message: 'deck plan has no slides' });
    return findings;
  }
  const keys = slides.map(routeKey);
  const rules = INDUSTRY_EXPRESSION_RULES[industry];
  if (rules && slides.length >= 5 && !rules.requiredRoutes.some(route => keys.includes(route))) {
    findings.push({
      level: 'review',
      type: 'industryWeakExpression',
      message: `${industry} deck lacks a dedicated proof object route (${rules.proofObjects.join(', ')})`
    });
  }
  let streak = 1;
  for (let i = 1; i < keys.length; i++) {
    streak = keys[i] === keys[i - 1] ? streak + 1 : 1;
    if (streak >= 3 && !['case-gallery:evidence-board', 'metric-comparison'].includes(keys[i])) {
      findings.push({ slide: i + 1, level: 'review', type: 'templateRhythm', message: `three consecutive slides use ${keys[i]}` });
      break;
    }
  }
  const genericDefaults = slides.filter(s => s.layoutRationale === 'default commercial split');
  if (slides.length >= 6 && genericDefaults.length >= 2) {
    findings.push({ level: 'review', type: 'genericRoute', message: `${genericDefaults.length} slides fell back to the default commercial split` });
  }
  slides.forEach((slide, i) => {
    const signals = contentSignals(normalized, slide, i, slides.length);
    const captions = (Array.isArray(slide.cards) ? slide.cards.length : 0) +
      (Array.isArray(slide.items) ? slide.items.length : 0) +
      (Array.isArray(slide.lookbook) ? slide.lookbook.length : 0) +
      (Array.isArray(slide.productStory) ? slide.productStory.length : 0);
    if (signals.imageCount >= 3 && captions < Math.min(3, signals.imageCount)) {
      findings.push({ slide: i + 1, level: 'review', type: 'captionCoverage', message: 'image-heavy slide lacks enough captions or evidence labels' });
    }
    const loopText = [slide.title, slide.centerTitle, slide.loopTitle].filter(Boolean).join(' ');
    const closedLoopOk = slide.type === 'timeline' || slide.layoutVariant === 'responsibility-loop' || slide.layoutVariant === 'flywheel' || slide.layoutVariant === 'closed-loop';
    const energyLoopOk = plan.industry === 'energy-utility' && ['module-matrix', 'metric-comparison'].includes(slide.type);
    if (/闭环|循环|能力环|loop|cycle/i.test(loopText) && !closedLoopOk && !energyLoopOk && !slide.centerTitle && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type)) {
      findings.push({ slide: i + 1, level: 'review', type: 'loopSemantics', message: 'loop language is present but the slide is not routed to a loop or responsibility grammar' });
    }
    if (slide.layoutVariant === 'risk-matrix' && !slide.matrix && (!Array.isArray(slide.rows) || slide.rows.length < 3)) {
      findings.push({ slide: i + 1, level: 'review', type: 'matrixCoordinates', message: 'risk matrix route needs matrix data or at least three positioned risks' });
    }
  });
  visualAestheticModel(plan, normalized).findings.forEach(f => findings.push(f));
  industryKnowledgeAudit(plan, normalized).findings.forEach(f => findings.push(f));
  return findings;
}

function recommendSlideType(plan = {}, s = {}, index = 0, total = 1) {
  if (s.type && s.type !== 'auto' && s.type !== 'content') {
    return { type: s.type, locked: true, reason: 'explicit type' };
  }
  const signals = contentSignals(plan, s, index, total);
  const semantic = semanticFrame(plan, s, signals);
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
  if (s.oee || s.oeeComponents || s.productionLine) return { type: 'metric-comparison', reason: 'explicit OEE/production metrics fields' };
  if (s.lookbook || s.productStory) return { type: 'case-gallery', reason: 'explicit lookbook/product story fields' };
  if (s.platformCapabilities || s.capabilityMap) return { type: 'architecture', reason: 'explicit platform capability fields' };
  if (s.product || (Array.isArray(s.products) && s.products.length)) return { type: 'product-showcase', reason: 'explicit product/showcase fields' };
  if (s.before || s.after || s.beforeAfter) return { type: 'case-gallery', reason: 'explicit before/after case comparison fields' };
  if ((Array.isArray(s.flywheel) && s.flywheel.length) || (Array.isArray(s.loopItems) && s.loopItems.length)) return { type: 'timeline', reason: 'explicit flywheel/loop fields' };
  if ((Array.isArray(s.responsibilities) && s.responsibilities.length) ||
      (Array.isArray(s.owners) && s.owners.length) ||
      (Array.isArray(s.raci) && s.raci.length) ||
      (Array.isArray(s.accountabilities) && s.accountabilities.length)) {
    return { type: 'risk-table', reason: 'explicit responsibility governance fields' };
  }
  if (Array.isArray(s.bridge) && s.bridge.length) return { type: 'finance-bridge', reason: 'explicit finance bridge field' };
  if (Array.isArray(s.portfolio) && s.portfolio.length) return { type: 'portfolio-table', reason: 'explicit portfolio table field' };
  if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
  if (Array.isArray(s.metrics) && s.metrics.length) return { type: 'metric-comparison', reason: 'explicit metrics field' };
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
  if (recipe && recipe.score >= 8 && recipe.renderType) {
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
  if (signals.hasRisk) return { type: 'risk-table', reason: 'risk/governance signals' };
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
  if (recipe && recipe.score >= 6 && recipe.renderType) {
    return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
  }
  return { type: 'executive-blocks', reason: 'default commercial split' };
}

function pickLayoutVariant(plan = {}, s = {}, type = s.type, signals = contentSignals(plan, s)) {
  if (s.layoutVariant || s.variant) return s.layoutVariant || s.variant;
  const industry = plan.industry || '';
  const text = flattenText(s);
  const imageCount = signals.imageCount;
  const cardCount = signals.cardCount;
  const rowCount = signals.rowCount;
  const phaseCount = signals.phaseCount;
  const layerCount = signals.layerCount;
  const productCount = signals.productCount;
  if (type === 'industry-chart') {
    return industryChartVariant(plan, s, signals);
  }
  if (type === 'chapter-divider' || type === 'toc' || type === 'toc-clean') {
    if (industry === 'energy-utility') return 'energy-sequence';
    if (/董事会|管理层|高管|决策摘要|汇报重点|审议|board|briefing|executive/i.test(text) && industry !== 'finance-investment') return 'board-briefing';
    if (industry === 'brand-retail' || signals.hasGallery || /画册|品牌|门店|产品故事|lookbook|editorial/i.test(text)) return 'editorial-agenda';
    if (industry === 'finance-investment' || /投委会|议题|决策|配置|agenda|committee/i.test(text)) return 'agenda-board';
    if (industry === 'healthcare-operations' || /患者|就诊|护理|服务蓝图|旅程地图|journey|service blueprint/i.test(text) || (industry !== 'manufacturing-operations' && /客户旅程|用户旅程|服务路径|服务流程/i.test(text))) return 'pathway-map';
    if (industry === 'manufacturing-operations') return 'line-agenda';
    if (industry === 'saas-technology') return 'adoption-agenda';
    return 'chapter-hero';
  }
  if (type === 'metric-comparison') {
    if (industry === 'manufacturing-operations' && (s.oee || s.oeeComponents || signals.hasOeeBoard)) return 'oee-board';
    if (industry === 'healthcare-operations') return 'patient-service-scorecard';
    if (industry === 'brand-retail') return 'member-growth-board';
    if (industry === 'saas-technology') return 'adoption-revenue-board';
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
  if (type === 'timeline' || type === 'timeline-dark') {
    if (s.flywheel || s.loopItems || signals.hasFlywheel) return 'flywheel';
    if (s.loop || signals.hasLoop) return 'closed-loop';
    if (signals.isDenseText || phaseCount >= 5) return 'process-board';
    return 'pathway-rail';
  }
  if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') {
    if (industry === 'brand-retail' && (s.lookbook || s.productStory || signals.hasLookbook) && imageCount >= 2) return 'lookbook-story';
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
    if (s.matrix || /矩阵|matrix|概率|可能性|影响等级|影响程度|impact|likelihood/i.test(flattenText(s))) return 'risk-matrix';
    if (signals.hasResponsibilityLoop && !s.matrix) return 'responsibility-loop';
    if (rowCount >= 5 || signals.hasGovernance) return 'control-stack';
    return 'governance-board';
  }
  if (type === 'closing' || type === 'closing-dark') {
    const text = flattenText(s);
    if (s.closingVariant) return s.closingVariant;
    if (s.contact || s.contacts || /谢谢|感谢|观看|thank|thanks|答疑|Q&A/i.test(text)) return 'thank-you';
    if (industry === 'energy-utility') return 'energy-stage';
    if (industry === 'finance-investment') return 'investment-decision';
    if (industry === 'manufacturing-operations') return 'pilot-rollout';
    if (industry === 'healthcare-operations') return 'quality-handoff';
    if (industry === 'saas-technology') return 'adoption-close';
    if (s.decision || s.summary || signals.isDenseText) return 'decision-summary';
    if (s.image || (s.visual && s.visual.image)) return 'image-statement';
    if (!s.actions && !s.decision && !s.summary && /结束|收尾|closing|end/i.test(text)) return 'simple-end';
    return s.closingVariant || 'auto';
  }
  return s.layoutVariant;
}

function textKeywords(text) {
  return String(text || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean);
}

function selectReferenceRecipe(plan = {}, s = {}, signals = contentSignals(plan, s)) {
  const recipes = REFERENCE_LAYOUT_LIBRARY.recipes || [];
  if (!recipes.length) return null;
  const text = flattenText(s);
  const words = new Set(textKeywords(text));
  const industry = plan.industry || 'general-operations';
  const role = slideRole(s);
  const scores = recipes.map(recipe => {
    let score = 0;
    if ((recipe.roles || []).includes(role)) score += 3;
    if ((recipe.industryFit || []).includes(industry)) score += 2;
    if (plan.documentType && (recipe.signals || []).includes(plan.documentType)) score += 4;
    if (plan.pagePurpose && (recipe.signals || []).includes(plan.pagePurpose)) score += 3;
    if (plan.visualIntent && (recipe.signals || []).includes(plan.visualIntent)) score += 2;
    (recipe.signals || []).forEach(sig => {
      const normalized = String(sig).toLowerCase();
      if (words.has(normalized) || String(text).toLowerCase().includes(normalized)) score += 2;
    });
    if (recipe.id.includes('kpi') && signals.hasMetrics) score += 5;
    if (recipe.id.includes('value-creation') && signals.hasStrategyMap) score += 5;
    if (recipe.id.includes('gallery') && signals.hasGallery) score += 5;
    if (recipe.id.includes('manifesto') && signals.hasManifesto) score += 5;
    if (recipe.id.includes('risk') && signals.hasRisk) score += 5;
    if (recipe.id.includes('architecture') && signals.hasArchitecture) score += 4;
    if (recipe.id.includes('before-after') && signals.hasComparison) score += 4;
    if (recipe.id.includes('flow') && signals.hasTimeline) score += 4;
    if (recipe.slideType === s.type) score += 4;
    return Object.assign({ score }, recipe);
  }).sort((a,b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.score <= 0) return null;
  return best;
}

function generatedAssetPrompt(plan = {}, s = {}, recipe = null) {
  const design = slideDesign(plan, s);
  const role = (s.visual && s.visual.role) || design.imageRole || (recipe && recipe.assetRole) || 'abstract';
  const normalizedRole = ['background', 'showcase', 'evidence', 'gallery'].includes(role) ? role : 'abstract';
  const patterns = REFERENCE_LAYOUT_LIBRARY.generatedAssetPromptPatterns || {};
  const pattern = patterns[normalizedRole] || patterns.abstract;
  if (!pattern) return '';
  const profile = industryVisualPolicy(plan);
  const industryLabel = profile.label || plan.industry || 'business';
  const visualBrief = (s.visual && s.visual.prompt) || s.assetBrief || s.coverInsight || s.claim || s.subtitle || s.title || plan.title || 'premium commercial visual';
  const paletteName = selectPaletteName(plan);
  return pattern
    .replace(/\{industryLabel\}/g, industryLabel)
    .replace(/\{visualBrief\}/g, String(visualBrief).replace(/\s+/g, ' ').trim())
    .replace(/\{paletteName\}/g, paletteName);
}

function assetRoleNeedsImage(role = '') {
  const r = String(role || '').toLowerCase();
  if (!r || ['none', 'diagram', 'structure', 'comparison'].includes(r)) return false;
  if (r.includes('none-or') || r.includes('or-none')) return false;
  return true;
}

function clampText(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!maxChars || s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}

function normalizeSlide(plan = {}, s = {}, index = 0, total = 1) {
  const typePick = recommendSlideType(plan, s, index, total);
  const signals = contentSignals(plan, s, index, total);
  const recipe = selectReferenceRecipe(plan, Object.assign({}, s, { type:typePick.type }), signals);
  const out = Object.assign({}, s, {
    type: typePick.type,
    layoutRationale: s.layoutRationale || typePick.reason,
    referenceRecipe: s.referenceRecipe || (recipe ? {
      id: recipe.id,
      score: recipe.score,
      layout: recipe.layout,
      proofObject: recipe.proofObject,
      assetRole: recipe.assetRole,
      generatedAsset: recipe.generatedAsset
    } : undefined)
  });
  if (!out.layoutVariant) {
    out.layoutVariant = pickLayoutVariant(plan, s, out.type, signals);
  }
  const claimRules = (VISUAL_SYSTEM.contentIntelligence && VISUAL_SYSTEM.contentIntelligence.claimSpine) || {};
  if (!out.claim) out.claim = clampText(out.coverInsight || out.subtitle || out.intro || '', claimRules.introMaxChars || 68);
  if (Array.isArray(out.cards)) {
    out.cards = out.cards.map(card => Object.assign({}, card, {
      body: clampText(card.body || card.text || '', claimRules.cardBodyMaxChars || 54)
    }));
  }
  if (out.type === 'metric-comparison' && !Array.isArray(out.metrics)) {
    out.metrics = deriveMetricsFromSlide(out).slice(0, 4);
  }
  if (out.type === 'manifesto' && !Array.isArray(out.values) && Array.isArray(out.items)) {
    out.values = out.items.slice(0, 4).map(v => ({ title: String(v), body: '' }));
  }
  if (out.type === 'closing' && out.referenceRecipe && out.referenceRecipe.id === 'closing-editorial-statement' && !out.closingVariant) {
    const tone = (((PALETTES[selectPaletteName(plan)] || {}).presentation || {}).coverTone) || '';
    out.closingVariant = (tone === 'light' || tone === 'split') ? 'editorial-light' : 'decision-board';
  }
  const existingAsset = mediaForRole(plan, out, slideRole(out));
  const recipeAssetRole = out.referenceRecipe && String(out.referenceRecipe.assetRole || '');
  const slideHasImages = (Array.isArray(out.images) && out.images.length > 0) ||
    (out.visual && Array.isArray(out.visual.images) && out.visual.images.length > 0);
  const routeVisualMode = resolveVisualMode(plan, out, slideRole(out));
  const recipeCouldUseGenerated = out.referenceRecipe && /optional|allowed|Create/i.test(String(out.referenceRecipe.generatedAsset || '')) &&
    !existingAsset && !slideHasImages && assetRoleNeedsImage(recipeAssetRole);
  const wantsGenerated = (out.visual && out.visual.mode === 'generated') || out.assetMode === 'generated' ||
    (routeVisualMode !== 'solid' && recipeCouldUseGenerated);
  if (wantsGenerated && !(out.image || (out.visual && out.visual.image))) {
    out.generatedAssetPrompt = out.generatedAssetPrompt || generatedAssetPrompt(plan, out, recipe);
  }
  return out;
}

function deriveMetricsFromSlide(s = {}) {
  if (Array.isArray(s.metrics)) return s.metrics;
  const cards = Array.isArray(s.cards) ? s.cards : [];
  const fromCards = cards.map(c => {
    const text = `${c.title || ''} ${c.body || ''}`;
    const num = (text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|倍|亿元|万元|件|台)?/) || [''])[0];
    return num ? { label: c.title || '核心指标', value: num, note: c.body || '' } : null;
  }).filter(Boolean);
  if (fromCards.length) return fromCards;
  const text = flattenText(s);
  const nums = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|倍|亿元|万元|件|台)?/g) || [];
  return nums.slice(0, 3).map((value, i) => ({ label: ['核心指标', '变化幅度', '目标进度'][i] || '指标', value, note: s.claim || s.subtitle || '' }));
}

function normalizeDeckPlan(plan = {}) {
  const slides = Array.isArray(plan.slides) ? plan.slides : [];
  const routed = slides.map((s, i) => normalizeSlide(plan, s, i, slides.length));
  const narrated = applyNarrativeMetadata(plan, routed);
  const sequenced = (plan.autoSequence === true || plan.narrativeMode === 'auto-sequence')
    ? sequenceSlidesByNarrative(plan, narrated)
    : narrated;
  return Object.assign({}, plan, {
    deckNarrative: deckNarrativeSummary(plan, sequenced),
    slides: sequenced
  });
}

function imageDimensions(assetPath) {
  try {
    if (!assetPath || !fs.existsSync(assetPath)) return null;
    const b = fs.readFileSync(assetPath);
    if (b.length >= 24 && b.toString('ascii', 1, 4) === 'PNG') {
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), type: 'png' };
    }
    if (b.length >= 10 && b[0] === 0xff && b[1] === 0xd8) {
      let o = 2;
      while (o < b.length) {
        if (b[o] !== 0xff) break;
        const marker = b[o + 1];
        const len = b.readUInt16BE(o + 2);
        if (marker >= 0xc0 && marker <= 0xc3) {
          return { w: b.readUInt16BE(o + 7), h: b.readUInt16BE(o + 5), type: 'jpg' };
        }
        o += 2 + len;
      }
    }
  } catch (_) {}
  return null;
}

function scoreImageAsset(assetPath, role = 'evidence') {
  const dims = imageDimensions(assetPath);
  const minimums = (VISUAL_SYSTEM.assetIntelligence && VISUAL_SYSTEM.assetIntelligence.minDimensions) || {};
  const min = minimums[role] || minimums.evidence || { w: 900, h: 600 };
  const issues = [];
  let score = 100;
  if (!assetPath || !fs.existsSync(assetPath)) {
    return { exists: false, role, score: 0, verdict: 'missing', issues: ['asset not found'] };
  }
  if (!dims) {
    return { exists: true, role, score: 58, verdict: 'unknown', issues: ['dimensions unavailable'] };
  }
  const aspect = dims.w / Math.max(1, dims.h);
  if (dims.w < min.w || dims.h < min.h) {
    issues.push(`below ${role} minimum ${min.w}x${min.h}`);
    score -= 28;
  }
  if (role === 'background' && aspect < 1.35) {
    issues.push('background image is not wide enough');
    score -= 20;
  }
  if (role === 'showcase' && (aspect > 2.4 || aspect < 0.55)) {
    issues.push('showcase aspect ratio may crop subject');
    score -= 12;
  }
  if (role === 'gallery' && dims.w < 800) {
    issues.push('gallery image may look soft');
    score -= 12;
  }
  return {
    exists: true,
    role,
    dimensions: dims,
    aspectRatio: Number(aspect.toFixed(3)),
    score: Math.max(0, score),
    verdict: score >= 78 ? 'pass' : (score >= 58 ? 'review' : 'reject'),
    issues
  };
}

function imageAspectRatio(assetPath, fallback = 1.5) {
  const dims = imageDimensions(assetPath);
  return dims ? dims.w / Math.max(1, dims.h) : fallback;
}

function chooseFourImageLayout(imagePaths = [], opts = {}) {
  const explicit = opts.layout || opts.imageLayout || opts.catalogLayout;
  if (explicit === 'grid-2x2' || explicit === 'mosaic-1-3') return explicit;
  const existing = imagePaths.filter(p => p && fs.existsSync(p));
  if (!existing.length) return opts.role === 'product' ? 'mosaic-1-3' : 'grid-2x2';
  const aspects = existing.map(p => imageAspectRatio(p)).filter(Number.isFinite);
  const first = aspects[0] || 1.5;
  const spread = aspects.length ? Math.max(...aspects) - Math.min(...aspects) : 0;
  if (opts.featured || opts.preferHero || first >= 1.85 || spread >= 0.55) return 'mosaic-1-3';
  return 'grid-2x2';
}

function imageQualityProfile(assetPath) {
  const dims = imageDimensions(assetPath);
  if (!dims) return { exists: Boolean(assetPath && fs.existsSync(assetPath)), category: 'unknown', score: 50 };
  const aspect = dims.w / Math.max(1, dims.h);
  const pixels = dims.w * dims.h;
  const flags = [];
  if (aspect >= 2.2) flags.push('panoramic');
  if (aspect <= 0.72) flags.push('vertical');
  if (pixels < 500000) flags.push('low-res');
  if (dims.type === 'png' && aspect >= 1.15 && aspect <= 1.9) flags.push('screenshot-like');
  const category = flags.includes('vertical') ? 'vertical' :
    (flags.includes('panoramic') ? 'panoramic' :
      (flags.includes('screenshot-like') ? 'screenshot' : 'photo'));
  let score = 100;
  if (flags.includes('low-res')) score -= 28;
  if (aspect > 3.2 || aspect < 0.42) score -= 14;
  return {
    exists: true,
    dimensions: dims,
    aspectRatio: Number(aspect.toFixed(3)),
    pixels,
    category,
    flags,
    score: Math.max(0, score)
  };
}

function chooseEvidenceImageLayout(imagePaths = [], opts = {}) {
  const explicit = opts.layout || opts.imageLayout || opts.galleryLayout;
  const allowed = ['grid-2x2', 'mosaic-1-3', 'vertical-strip', 'screenshot-board', 'evidence-contact-sheet'];
  if (allowed.includes(explicit)) return explicit;
  const existing = imagePaths.filter(p => p && fs.existsSync(p));
  const profiles = existing.map(imageQualityProfile);
  if (existing.length >= 5) return 'evidence-contact-sheet';
  if (existing.length === 4) {
    const verticals = profiles.filter(p => p.category === 'vertical').length;
    const screenshots = profiles.filter(p => p.category === 'screenshot').length;
    const panoramas = profiles.filter(p => p.category === 'panoramic').length;
    const aspects = profiles.map(p => p.aspectRatio).filter(Number.isFinite);
    const spread = aspects.length ? Math.max(...aspects) - Math.min(...aspects) : 0;
    if (verticals >= 2) return 'vertical-strip';
    if (screenshots >= 3) return 'screenshot-board';
    if (panoramas >= 1 || spread >= 0.75 || opts.featured || opts.preferHero) return 'mosaic-1-3';
    return chooseFourImageLayout(existing, opts);
  }
  if (existing.length === 3 && profiles.some(p => p.category === 'panoramic' || p.category === 'vertical')) return 'mosaic-1-3';
  return chooseFourImageLayout(existing, opts);
}

function makeDeckContext(plan = {}) {
  const profileBase = resolveStyleProfile(plan.style || 'premium-commercial-keynote');
  const paletteName = selectPaletteName(plan);
  const colors = paletteToColors(PALETTES[paletteName], profileBase.C);
  const profile = Object.assign({}, profileBase, { palette: paletteName, C: colors });
  return {
    visualSystem: VISUAL_SYSTEM,
    fontStack: FONT_STACK,
    palettes: PALETTES,
    visualRouter: VISUAL_ROUTER,
    profile,
    colors,
    paletteName,
    policy: industryVisualPolicy(plan),
    slideDesign: (s, roleOverride) => slideDesign(plan, s, roleOverride),
    contentSignals: (s, index, total) => contentSignals(plan, s, index, total),
    recommendSlideType: (s, index, total) => recommendSlideType(plan, s, index, total),
    selectReferenceRecipe: (s, index, total) => selectReferenceRecipe(plan, s, contentSignals(plan, s, index, total)),
    generatedAssetPrompt: (s) => generatedAssetPrompt(plan, s),
    normalizeDeckPlan: () => normalizeDeckPlan(plan),
    scoreImageAsset,
    auditDeckPlan: (normalizedPlan) => auditDeckPlan(plan, normalizedPlan),
    semanticFrame: (s, index, total) => semanticFrame(plan, s, contentSignals(plan, s, index, total)),
    semanticMeaning: (s, index, total) => semanticMeaning(plan, s, contentSignals(plan, s, index, total)),
    visualAestheticModel: (normalizedPlan) => visualAestheticModel(plan, normalizedPlan),
    industryKnowledgeAudit: (normalizedPlan) => industryKnowledgeAudit(plan, normalizedPlan)
  };
}

module.exports = {
  ASSET_DIR,
  BASE_COLORS,
  FONT_STACK,
  MEDIA_ASSETS,
  INDUSTRY_KNOWLEDGE_BASE,
  PALETTES,
  REFERENCE_LAYOUT_LIBRARY,
  STYLE_PROFILES,
  VISUAL_ROUTER,
  VISUAL_SYSTEM,
  defaultIndustryMedia,
  auditDeckPlan,
  applyNarrativeMetadata,
  deckNarrativeSummary,
  contentSignals,
  deriveMetricsFromSlide,
  galleryImages,
  generatedAssetPrompt,
  chooseFourImageLayout,
  chooseEvidenceImageLayout,
  aestheticSlideScore,
  industryKnowledgeAudit,
  industryKnowledgeProfile,
  industryProofCandidates,
  imageDimensions,
  imageAspectRatio,
  imageQualityProfile,
  industryChartVariant,
  industryVisualPolicy,
  makeDeckContext,
  mediaForRole,
  normalizeDeckPlan,
  normalizeSlide,
  pageFamily,
  paletteToColors,
  pickLayoutVariant,
  recommendSlideType,
  selectReferenceRecipe,
  resolveAssetPath,
  resolveStyleProfile,
  resolveVisualMode,
  scoreImageAsset,
  selectPaletteName,
  semanticFrame,
  semanticMeaning,
  sequenceSlidesByNarrative,
  slideDesign,
  slideRole,
  slideWantsImage,
  visualAestheticModel,
  visualRole
};
