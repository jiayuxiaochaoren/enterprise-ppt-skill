#!/usr/bin/env node
/*
Generate editable premium commercial PPTX files.
Default visual profile: executive-keynote — Keynote-like elegance fused with
traditional enterprise reporting. The style layer is intentionally isolated so
future profiles can be added without hardcoding one visual language.

Usage:
  node scripts/generate_pptx.js <deck-plan.json> <output.pptx>
  node scripts/generate_pptx.js --sample <output.pptx>
*/
const fs = require('fs');
const path = require('path');
const { requirePptxGen } = require('./render/pptx-runtime');
const { createRendererContext } = require('./render/renderer-context');
const { createSlideRenderRegistry } = require('./render/page-family-registry');
const {
  compactRenderMatch,
  isStrictRenderMode,
  normalizationModeFor,
  qualityModeForPlan,
  routeSensitiveDiffs,
  shortHash
} = require('./render/route-metadata');
const {
  containsCjk,
  createTextRenderHelpers
} = require('./render/text-meta');
const {
  CHART_COMPONENT_IDS,
  createOverlayContractHelpers,
  nativeVariantSuppressesChartMeta,
  plannedComponentsForSlide,
  reportBoardNeedsRightOverlayRail
} = require('./render/overlay-contract');
const {
  createRenderMetaHelpers
} = require('./render/render-meta');
const { createArchitectureRenderers } = require('./render/page-families/architecture');
const { createBeautyRenderers } = require('./render/page-families/beauty');
const { createBusinessRenderers } = require('./render/page-families/business');
const { createChapterRenderers } = require('./render/page-families/chapter');
const { createClosingRenderers } = require('./render/page-families/closing');
const { createEvidenceGalleryRenderers } = require('./render/page-families/evidence-gallery');
const { createFinancialRenderers } = require('./render/page-families/financial');
const { createGeneralRenderers } = require('./render/page-families/general');
const { createManifestoRenderers } = require('./render/page-families/manifesto');
const { createProfileRenderers } = require('./render/page-families/profile');
const { createRiskRenderers } = require('./render/page-families/risk');
const { createStrategyRenderers } = require('./render/page-families/strategy');
const { createTimelineRenderers } = require('./render/page-families/timeline');
const { createTocRenderers } = require('./render/page-families/toc');

const pptxgen = requirePptxGen();

const {
  FONT_STACK,
  MEDIA_ASSETS,
  assetAuthorizationGate,
  chooseEvidenceImageLayout,
  chooseFourImageLayout,
  copyPolicyList,
  copyPolicyText,
  galleryImages,
  imageDimensions,
  languagePolicyFor,
  localizeMicrocopy,
  makeDeckContext,
  mediaForRole,
  normalizeTypographyOptions,
  normalizeDeckPlan,
  resolveTypeToken,
  resolveAssetPath,
  slideRole,
  slideWantsImage,
  visualIndustryId,
  visualRole
} = require('./design-system');
const {
  componentCapabilityFor,
  renderKpiStrip,
  renderChartSpec,
  renderProofGallery,
  renderRiskRegister,
  renderValueChain
} = require('./components');
const {
  chartConsumedFields,
  chartSpecToComponentId,
  routeChartSpec
} = require('./chart-spec');

let DESIGN = makeDeckContext({});
let PROFILE = DESIGN.profile;
let C = DESIGN.colors;
const W = (DESIGN.visualSystem.layout && DESIGN.visualSystem.layout.canvas && DESIGN.visualSystem.layout.canvas.w) || 13.333;
const H = (DESIGN.visualSystem.layout && DESIGN.visualSystem.layout.canvas && DESIGN.visualSystem.layout.canvas.h) || 7.5;
let CURRENT_RENDER = { plan:null, slide:null, idx:null };
let RENDER_META = { version:'render-meta/v1', slides:[] };
const {
  componentBlockedByContract,
  componentSlotConflicts,
  declareNativeRendererContract,
  nativeRendererContractFor,
  overlaySlotConflicts,
  overlaySlotForComponent
} = createOverlayContractHelpers({
  canvasHeight: () => H,
  canvasWidth: () => W,
  zone,
  zonesIntersect
});
const {
  assetDecisionForMeta,
  compactChartSpecForMeta,
  recordChartConsumption
} = createRenderMetaHelpers({
  chartConsumedFields,
  chartSpecToComponentId,
  mediaForRole,
  shortHash,
  slideRole,
  visualRole
});
const {
  addText,
  isPageFolioText,
  normalizePageFolioTextOptions,
  pageFolioRendered
} = createTextRenderHelpers({
  activePlan,
  addRect,
  canvasWidth: () => W,
  colors: () => C,
  compactText,
  localizeMicrocopy,
  normalizeTypographyOptions,
  profile: () => PROFILE,
  typeSize,
  visualSystem: () => DESIGN.visualSystem || {}
});

function zone(id, x, y, w, h, role = 'native') {
  return { id, x:Number(x), y:Number(y), w:Number(w), h:Number(h), role };
}
function zoneBounds(z = {}) {
  return {
    x:Number(z.x || 0),
    y:Number(z.y || 0),
    w:Number(z.w || 0),
    h:Number(z.h || 0)
  };
}
function zonesIntersect(a = {}, b = {}, pad = 0.015) {
  const ra = zoneBounds(a);
  const rb = zoneBounds(b);
  return Math.max(ra.x, rb.x) < Math.min(ra.x + ra.w, rb.x + rb.w) - pad &&
    Math.max(ra.y, rb.y) < Math.min(ra.y + ra.h, rb.y + rb.h) - pad;
}
function slideSemanticText(s = {}) {
  const chunks = [
    s.title,
    s.subtitle,
    s.claim,
    s.intro,
    s.note,
    s.footerNote,
    ...(Array.isArray(s.cards) ? s.cards.map(c => `${c.title || ''} ${c.body || c.note || ''}`) : []),
    ...(Array.isArray(s.items) ? s.items.map(v => typeof v === 'string' ? v : `${v.title || v.label || ''} ${v.body || v.note || ''}`) : []),
    ...(Array.isArray(s.phases) ? s.phases.map(v => typeof v === 'string' ? v : `${v.title || ''} ${v.body || v.note || ''}`) : [])
  ];
  return chunks.filter(Boolean).join(' ');
}
function hasEnergyCurveSemantics(s = {}) {
  if (s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse) return true;
  return /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(slideSemanticText(s));
}

function industryProfile(plan={}) {
  const profiles = (DESIGN.visualSystem && DESIGN.visualSystem.industryProfiles) || {};
  const visualId = visualIndustryId(plan.industry);
  const raw = profiles[plan.industry] || profiles[visualId] || profiles['general-operations'] || {};
  const coverFields = {
    generic: drawGenericCoverField,
    manufacturing: drawManufacturingCoverField,
    park: drawParkCoverField,
    energy: drawEnergyCoverField
  };
  return Object.assign({
    label: 'DIGITAL OPERATIONS',
    insight: copyPolicyText(plan, 'industryInsight'),
    coreTitle: copyPolicyText(plan, 'industryCoreTitle'),
    coreBody: copyPolicyText(plan, 'industryCoreBody'),
    coverField: drawGenericCoverField
  }, raw, {
    coverField: coverFields[raw.coverField] || drawGenericCoverField
  });
}
function isVisualIndustry(plan = {}, id = '') {
  return plan.industry === id || visualIndustryId(plan.industry) === id;
}
function copyFallback(plan = {}, key = '', fallback = '') {
  return copyPolicyText(plan, key, fallback);
}
function industryRendererFor(plan={}, s={}) {
  const role = designForSlide(plan, s).role;
  const rendererName = ((industryProfile(plan).layoutOverrides || {})[role]);
  if (rendererName === 'energyArchitecture') {
    if (!INDUSTRY_RENDERERS) slideRenderRegistry();
    return (INDUSTRY_RENDERERS && INDUSTRY_RENDERERS.energyArchitecture) || null;
  }
  const renderers = {
    energyToc,
    energySituationEditorial,
    energyProblemSplit,
    energyCapabilityLoop,
    energyDeploymentRadius,
    energyValueSignal
  };
  return rendererName ? renderers[rendererName] : null;
}

function industryRendererMatchFor(plan = {}, s = {}, requestedType = '') {
  const render = industryRendererFor(plan, s);
  if (!render) return null;
  return {
    requestedType,
    matchedType: requestedType,
    matchKind: 'industry-override',
    rendererId: `industry:${render.name || requestedType || 'renderer'}`,
    rendererName: render.name || 'anonymousIndustryRenderer',
    source: 'industry-layout-override',
    render
  };
}

function samplePlan() {
  return {
    style: 'premium-commercial-keynote',
    title: '企业运营数字化方案',
    subtitle: '以统一数据底座，支撑运营闭环升级',
    slides: [
      { type: 'cover-dark', title: '企业运营数字化方案', subtitle: '以统一数据底座，支撑运营闭环升级', bullets: ['统一数据底座', '运营闭环升级', '管理驾驶舱'] },
      { type: 'toc-clean', title: '目录', items: ['业务背景与升级目标', '从分散管理到统一运营', '平台架构与核心能力', '分阶段落地路径', '业务价值与落地保障'] },
      { type: 'two-column-clean', title: '业务背景与升级目标', leftTitle: '建设背景', left: ['园区企业数量持续增加，管理对象从“场地管理”向“运营服务”延伸。', '招商、物业、安防、能耗、企业服务等业务分散在不同系统或线下表格中。', '管理层需要及时掌握园区运行态势，为资源配置和服务优化提供依据。'], rightTitle: '核心诉求', cards: [{title:'运营管理诉求', body:'统一事项、空间、企业、人员和设备信息，形成可查询、可追踪、可分析的管理底座。'}, {title:'服务提升诉求', body:'围绕企业入驻、政策申报、维修工单、活动通知等场景，提升响应效率。'}, {title:'决策支撑诉求', body:'通过数据看板呈现招商进度、空间利用、能耗趋势、服务工单等重点指标。'}] },
      { type: 'executive-blocks', title: '从分散管理到统一运营', intro: '以统一数据底座，支撑园区运营闭环升级', cards: [{title:'信息分散', body:'企业、房源、合同、设备等信息分散，查询依赖人工汇总。'}, {title:'流程割裂', body:'跨部门事项缺少统一流转机制，处理过程难追踪。'}, {title:'响应滞后', body:'企业服务与物业工单反馈链路长，过程透明度不足。'}, {title:'数据不足', body:'管理层缺少统一运营视图，难以持续跟踪改善效果。'}] },
      { type: 'architecture-dark', title: '方案总体架构', subtitle: '以运营数据底座支撑多场景协同', layers: [{title:'用户入口层', items:['管理驾驶舱','企业服务门户','移动端工单','招商管理入口']}, {title:'业务应用层', items:['招商与合同','空间与资产','物业与工单','能耗与设备','政策与活动']}, {title:'数据支撑层', items:['企业库','空间库','合同库','设备库','工单库','能耗数据','运营指标库']}] },
      { type: 'module-matrix', title: '核心模块设计', intro: '围绕运营、服务、决策三类能力展开', cards: [{title:'园区运营管理', body:'企业档案、空间资产、合同台账、招商线索，集中维护基础运营信息。'}, {title:'企业服务协同', body:'政策申报、活动通知、诉求受理、工单流转，提升服务响应效率。'}, {title:'设备与能耗管理', body:'对接设备台账、巡检记录和能耗数据，支持异常预警与趋势分析。'}, {title:'管理驾驶舱', body:'汇总招商、入驻、工单、能耗、收入运营关键指标，形成管理层视图。'}, {title:'权限与流程配置', body:'按管理层、部门、运营人员、企业用户等角色设置访问与审批权限。'}, {title:'数据接口与扩展', body:'预留与现有物业、财务、门禁、OA 等系统的数据对接能力。'}] },
      { type: 'timeline-dark', title: '先建立最小闭环，再扩展集成边界', phases: [{title:'第一阶段', body:'现状调研与蓝图设计，梳理业务流程、数据口径、系统边界。'}, {title:'第二阶段', body:'基础平台与核心模块上线，先形成可运行的最小闭环。'}, {title:'第三阶段', body:'场景深化与数据联通，推动能耗、设备、门禁、财务或 OA 按需对接。'}, {title:'第四阶段', body:'运营优化与持续迭代，结合运行数据优化流程、权限、指标和服务机制。'}], note:'以核心运营闭环先行上线，再逐步扩展集成范围。' },
      { type: 'value-tiles', title: '预期价值', intro: '从管理效率、服务质量和决策能力三个方面体现成效', cards: [{title:'管理效率提升', body:'减少重复登记与人工汇总，推动重点事项线上留痕、可追踪、可复盘。'}, {title:'服务质量提升', body:'企业诉求、物业维修、政策通知等服务事项形成统一受理和反馈机制。'}, {title:'资源配置优化', body:'基于空间利用、企业结构、能耗趋势等数据，为资源投入提供参考。'}, {title:'风险管控加强', body:'合同到期、设备异常、工单超期等风险可配置预警与责任跟踪。'}], note:'价值测算可在系统上线后基于运营数据持续校准，形成月度复盘机制。' },
      { type: 'risk-table', title: '风险与保障', subtitle: '围绕数据、协同、实施和运维建立闭环机制', headers: ['风险项','等级','应对措施'], rows: [['数据口径不统一','中','建立字段字典和数据责任人机制，先确认核心指标。'], ['部门协同不到位','中','明确流程节点、处理时限和跨部门协调机制。'], ['系统集成复杂度高','高','分批对接，优先接入高价值、低风险系统。'], ['上线后使用不足','中','同步开展培训、试运行和问题反馈闭环。']] },
      { type: 'closing-dark', title: '让运营从经验驱动走向数据驱动', subtitle: '期待共建高效、可持续的运营体系', note: '以核心运营闭环先行上线，再围绕数据接入、服务场景和管理指标持续迭代。' }
    ]
  };
}

function argParse() {
  const args = process.argv.slice(2);
  if (args[0] === '--sample') return { plan: samplePlan(), out: args[1] || path.resolve(process.cwd(), 'premium-commercial-ppt-sample.pptx') };
  if (args.length < 2) {
    console.error('Usage: node scripts/generate_pptx.js <deck-plan.json> <output.pptx>\n       node scripts/generate_pptx.js --sample <output.pptx>');
    process.exit(2);
  }
  return { plan: JSON.parse(fs.readFileSync(args[0], 'utf8')), out: path.resolve(args[1]) };
}

function paletteSpec() {
  return (DESIGN.palettes && DESIGN.palettes[PROFILE.palette]) || {};
}
function presentationSpec() {
  return paletteSpec().presentation || {};
}
function surfaceFill() {
  return presentationSpec().surfaceFill || C.paper;
}
function panelFill() {
  return presentationSpec().panelFill || C.white;
}
function typeToken(name, fallback={}) {
  return Object.assign({}, fallback, resolveTypeToken(activePlan(), name, { token:fallback }));
}
function typeSize(name, fallback) {
  return typeToken(name, { size:fallback }).size || fallback;
}
function profileFont(kind) {
  const fonts = DESIGN.typographyFonts || {};
  if (kind === 'latin') return PROFILE.latinFont || fonts.latin || FONT_STACK.latin || PROFILE.font;
  if (kind === 'number') return PROFILE.numberFont || fonts.number || FONT_STACK.number || PROFILE.font;
  if (kind === 'editorial') return fonts.editorial || fonts.cjk || PROFILE.font || FONT_STACK.zh;
  return PROFILE.font || fonts.cjk || FONT_STACK.zh;
}
function addLabel(slide, text, opts={}) {
  const labelText = localizeMicrocopy(activePlan(), text, opts);
  const localizedCjk = containsCjk(labelText) && labelText !== text;
  const token = typeToken('kicker', { size:7.0, tracking:1.0 });
  const next = Object.assign({ typeRole:'kicker', fontFace:localizedCjk ? profileFont('cjk') : profileFont('latin'), fontSize:token.size, color:C.muted, charSpace:token.tracking }, opts);
  if (localizedCjk && opts.preserveCharSpace !== true) {
    next.fontFace = profileFont('cjk');
    next.charSpace = 0;
  }
  if (!next.allowTiny) {
    next.fontSize = Math.max(Number(next.fontSize || token.size), 6.9);
    if (Number(next.h || 0) < 0.12) next.h = 0.12;
  }
  addText(slide, labelText, next);
}
function addNumber(slide, text, opts={}) {
  const next = isPageFolioText(text, opts) ? normalizePageFolioTextOptions(opts) : opts;
  addText(slide, text, Object.assign({ typeRole:'number', fontFace:profileFont('number'), fontSize:typeSize('number', 12), bold:true, color:C.accent }, next));
}
function metaDisabled(plan={}) {
  return plan.showMeta === false || plan.meta === false || plan.metaPolicy === 'none';
}
function metaValue(plan={}, keyOrValue='') {
  if (keyOrValue == null || keyOrValue === false) return '';
  if (typeof keyOrValue !== 'string') return String(keyOrValue);
  const key = keyOrValue.trim();
  if (!key) return '';
  const source = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
  if (Object.prototype.hasOwnProperty.call(plan, key) || Object.prototype.hasOwnProperty.call(source, key)) {
    return String(source[key] || plan[key] || '');
  }
  return key;
}
function planPptType(plan={}) {
  return String((plan.materialIntelligence && plan.materialIntelligence.pptType) || plan.ppt_type || plan.pptType || '');
}
function isCompanyIntroPlan(plan={}) {
  const text = [
    planPptType(plan),
    plan.title,
    plan.subtitle,
    plan.deckType
  ].filter(Boolean).join(' ');
  return /company-intro|公司介绍|企业介绍|企业简介|能力介绍|宣传册/i.test(text);
}
function publicSlideNote(note='') {
  const text = String(note || '').trim();
  if (!text) return '';
  if (/(第[一二三四五六七八九十0-9]+页|后续页面|后续再|该页|本页仅|用于测试|测试\s*closing|示例|占位|材料显示|企业\s*PDF|模型抽取|用户材料自动整理|proof object|页面族|优先呈现|优先表达|阅读顺序|普通目录|普通简介|closing)/i.test(text)) {
    return '';
  }
  return text;
}
function deckMetaFields(plan={}) {
  if (metaDisabled(plan)) return [];
  if (plan.metaText) return [String(plan.metaText)];
  const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
  if (isCompanyIntroPlan(plan) && !Array.isArray(plan.metaFields)) {
    const org = metadata.organization || plan.organization || '';
    return plan.showMeta === true && org ? [String(org)] : [];
  }
  const raw = Array.isArray(plan.metaFields)
    ? plan.metaFields
    : [metadata.organization || plan.organization, metadata.audience || plan.audience, metadata.date || plan.date];
  return raw.map(v => metaValue(plan, v)).filter(Boolean);
}
function coverMetaText(plan) {
  return deckMetaFields(plan).join('  /  ');
}
function addDeckMeta(slide, plan, opts={}) {
  const text = coverMetaText(plan);
  if (!text) return false;
  addText(slide, text, opts);
  return true;
}
function footerText(plan={}) {
  if (plan.showFooter === false || plan.footer === false || plan.footerPolicy === 'none') return '';
  const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
  const org = metadata.organization || plan.organization || '';
  if (isCompanyIntroPlan(plan)) {
    if (typeof plan.footerText === 'string') return plan.footerText.replace(/(能力介绍|公司介绍|企业介绍|宣传册)$/g, '').trim() || plan.footerText;
    if (typeof plan.footer === 'string') {
      if (org && (plan.footer.includes(org) || /能力介绍|公司介绍|企业介绍|宣传册/i.test(plan.footer))) return String(org);
      return plan.footer;
    }
    if (org) return String(org);
  }
  if (typeof plan.footerText === 'string') return plan.footerText;
  if (typeof plan.footer === 'string') return plan.footer;
  if (plan.footerPolicy === 'title' || plan.useTitleAsFooter === true) return plan.title || '';
  return '';
}
function coverKickerText(plan={}, industry={}) {
  if (plan.coverKicker === false || plan.kicker === false) return '';
  if (isCompanyIntroPlan(plan) && plan.coverKicker == null && plan.kicker == null) return '';
  const label = typeof plan.coverKicker === 'string' ? plan.coverKicker
    : (typeof plan.kicker === 'string' ? plan.kicker : (industry.label || 'DIGITAL OPERATIONS'));
  if (!label) return '';
  const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
  const date = metaDisabled(plan) ? '' : (metadata.date || plan.date || '');
  const year = date ? String(date).slice(0, 4) : '';
  if (year && plan.showYear !== false) return `${label}  /  ${year}`;
  return label;
}
function addCoverKicker(slide, plan, industry, opts={}) {
  const text = coverKickerText(plan, industry);
  if (!text) return false;
  addLabel(slide, text, opts);
  return true;
}
function addRect(slide, x, y, w, h, color, lineColor=color, extra={}) {
  slide.addShape('rect', Object.assign({ x, y, w, h, fill:{color}, line:{color:lineColor} }, extra));
}
function addImageIfExists(slide, imagePath, opts) {
  if (imagePath && fs.existsSync(imagePath)) {
    slide.addImage(Object.assign({ path:imagePath }, opts));
    return true;
  }
  return false;
}
function addPhotoPanel(slide, imagePath, x, y, w, h, opts={}) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    addRect(slide, x, y, w, h, opts.fallback || C.ink, opts.fallback || C.ink);
    return false;
  }
  const fit = opts.fit || 'cover';
  slide.addImage({ path:imagePath, x, y, w, h, sizing:{ type:fit, w, h } });
  const overlay = opts.overlay || (opts.tone === 'light' ? 'FFFFFF' : C.ink);
  addRect(slide, x, y, w, h, overlay, overlay, {
    fill:{ color:overlay, transparency:opts.transparency ?? (opts.tone === 'light' ? 42 : 48) },
    line:{ color:overlay, transparency:100 }
  });
  if (opts.stroke) {
    addRect(slide, x, y, w, h, overlay, opts.stroke, {
      fill:{ color:overlay, transparency:100 },
      line:{ color:opts.stroke, transparency:opts.strokeTransparency ?? 55, width:opts.strokeWidth || 0.4 }
    });
  }
  return true;
}
function imageAspect(imagePath) {
  const dims = imageDimensions(imagePath);
  return dims ? dims.w / Math.max(1, dims.h) : 1.5;
}
function imagePathFromItem(item={}, fallback='') {
  if (typeof item === 'string') return resolveAssetPath(item);
  return resolveAssetPath(item.image || item.img || item.photo || item.src || fallback || '');
}
function smartPhotoFit(imagePath, slot={}, role='evidence') {
  if (!imagePath || !fs.existsSync(imagePath)) return 'cover';
  const slotAspect = slot.w && slot.h ? slot.w / Math.max(0.01, slot.h) : 1.5;
  const aspect = imageAspect(imagePath);
  if (role === 'showcase' && (aspect > slotAspect * 1.45 || aspect < slotAspect * 0.68)) return 'contain';
  if (role === 'evidence' && (aspect > slotAspect * 2.10 || aspect < slotAspect * 0.45)) return 'contain';
  return 'cover';
}
function addSmartPhotoPanel(slide, imagePath, x, y, w, h, opts={}) {
  const role = opts.role || 'evidence';
  const fit = opts.fit || smartPhotoFit(imagePath, { w, h }, role);
  return addPhotoPanel(slide, imagePath, x, y, w, h, Object.assign({}, opts, { fit }));
}
function addCaptionBar(slide, x, y, w, h, opts={}) {
  const dark = opts.dark !== false;
  const fill = opts.fill || (dark ? C.ink : panelFill());
  const labelColor = opts.labelColor || C.accent;
  addRect(slide, x, y, w, h, fill, fill, {
    fill:{color:fill, transparency:opts.transparency ?? (dark ? 6 : 0)},
    line:{color:fill, transparency:100}
  });
	  if (opts.label) {
	    addLabel(slide, opts.label, {
	      x:x+0.22, y:y+0.14, w:opts.labelWidth || 1.20, h:0.12,
	      fontSize:opts.labelSize || 6.8,
	      color:labelColor,
	      charSpace:opts.charSpace ?? 0.4
	    });
	  }
  if (opts.caption) {
    const labelW = opts.label ? (opts.labelWidth || 1.20) + 0.34 : 0.22;
	    addText(slide, opts.caption, {
	      x:x+labelW, y:y+0.14, w:Math.max(0.6, w-labelW-0.28), h:0.11,
	      fontSize:opts.fontSize || 6.8,
	      color:opts.color || (dark ? (C.captionOnImage || 'CBD5E1') : C.body),
	      fit:'shrink'
	    });
  }
}
function addEvidenceImageFrame(slide, imagePath, x, y, w, h, opts={}) {
  const frameFill = opts.frameFill || (opts.dark ? C.ink : panelFill());
  const frameLine = opts.frameLine || (opts.dark ? (C.darkLine || '334155') : C.line);
  addRect(slide, x, y, w, h, frameFill, frameLine, {
    fill:{color:frameFill, transparency:opts.frameTransparency ?? (opts.dark ? 0 : 0)},
    line:{color:frameLine, transparency:opts.lineTransparency ?? 20, width:opts.lineWidth || 0.44}
  });
  const inset = opts.inset ?? 0.12;
  const captionH = opts.caption || opts.label ? (opts.captionH || 0.42) : 0;
  const photoH = Math.max(0.2, h - inset * 2 - captionH);
  if (imagePath && fs.existsSync(imagePath)) {
    addSmartPhotoPanel(slide, imagePath, x+inset, y+inset, w-inset*2, photoH, {
      role:opts.role || 'evidence',
      tone:opts.dark ? 'dark' : 'light',
      transparency:opts.photoTransparency ?? 100,
      stroke:opts.photoStroke || frameLine,
      strokeTransparency:opts.photoStrokeTransparency ?? 32,
      fit:opts.fit
    });
  } else {
    genericShowcaseField(slide, x+inset, y+inset, w-inset*2, photoH, opts.fallbackLabel || 'VISUAL PROOF');
  }
  if (captionH) {
    addCaptionBar(slide, x+inset, y+h-inset-captionH, w-inset*2, captionH, {
      dark:opts.dark !== false,
      label:opts.label || 'EVIDENCE',
      caption:opts.caption || '',
      labelWidth:opts.labelWidth,
      transparency:opts.captionTransparency
    });
  }
}
function addEquipmentNameplate(slide, x, y, w, opts={}) {
  const fill = opts.dark ? C.ink : (C.panelAlt || C.softBlue);
  const line = opts.color || C.accent;
  addRect(slide, x, y, w, 0.34, fill, line, {
    fill:{color:fill, transparency:opts.dark ? 8 : 6},
    line:{color:line, transparency:20, width:0.38}
  });
  addLabel(slide, opts.label || 'EQUIPMENT PROOF', { x:x+0.16, y:y+0.10, w:1.18, h:0.12, fontSize:6.8, color:line, charSpace:0.55 });
  addText(slide, opts.text || '', { x:x+1.50, y:y+0.10, w:Math.max(0.6, w-1.72), h:0.10, fontSize:7.0, color:opts.dark ? (C.captionOnImage || 'CBD5E1') : C.body, fit:'shrink' });
}
function TopRule(slide, opts={}) {
  const color = opts.color || C.accent;
  addRect(slide, opts.x || 0, opts.y || 0, opts.w || W, opts.h || 0.055, color, color, {
    fill:{color, transparency:opts.transparency || 0},
    line:{color, transparency:100}
  });
}
function PageNumber(slide, idx, opts={}) {
  if (pageFolioRendered(slide) && opts.force !== true) return false;
  const dark = opts.dark == null ? slideUsesDarkSurface(activeSlide()) : Boolean(opts.dark);
  const textOpts = Object.assign({}, opts);
  delete textOpts.mask;
  delete textOpts.dark;
  delete textOpts.force;
  const base = Object.assign({
    x:11.74, y:0.74, w:0.52, h:0.22, fontSize:typeSize('number', 11.8), color:C.accent, align:'right'
  }, textOpts);
  if (opts.mask) {
    const fill = dark ? C.ink : panelFill();
    addRect(slide, base.x - 0.08, base.y - 0.035, 0.78, 0.28, fill, fill, {
      fill:{color:fill, transparency:0},
      line:{color:fill, transparency:100}
    });
  }
  addText(slide, String(idx || activeIndex() || '').padStart(2, '0'), Object.assign({}, base, {
    fontFace:profileFont('number'),
    bold:true,
    _folioInternal:true,
    marker:opts.marker,
    markerColor:opts.markerColor
  }));
  return true;
}
function TintedBackground(slide, opts={}) {
  const dark = opts.tone === 'dark' || opts.dark;
  const bg = opts.color || (dark ? C.ink : surfaceFill());
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);
  if (!dark && opts.header !== false) {
    const head = opts.headerColor || panelFill();
    addRect(slide, 0, 0, W, 0.92, head, head, { fill:{color:head, transparency:0}, line:{color:head, transparency:100} });
  }
}
function WatermarkCircle(slide, tone='light', opts={}) {
  if (tone === 'dark') return addDarkBreathingCircle(slide, opts.x, opts.y, opts.outer, opts.inner, opts.accent || C.accent);
  return addLightBreathingCircle(slide, opts.x, opts.y, opts.size, opts.color || C.softBlue, opts.transparency);
}
function canvasMotifKind(plan={}, s={}, tone='light', opts={}) {
  if (opts.motif === 'none' || opts.field === false) return 'none';
  if (opts.motif) return opts.motif;
  const cp = compositionFor(s);
  if (cp.backgroundMotif) return cp.backgroundMotif;
  if (plan.industry === 'beauty-consumer') return tone === 'dark' ? 'beauty-dark-veil' : 'beauty-editorial-veil';
  return tone === 'dark' ? 'breathing-circle-dark' : 'breathing-circle-light';
}
function addBeautyEditorialVeil(slide, tone='light') {
  if (tone === 'dark') {
    addRect(slide, 10.86, 1.12, 0.024, 4.92, C.accent, C.accent, {
      fill:{color:C.accent, transparency:92},
      line:{color:C.accent, transparency:100}
    });
    addHairline(slide, 8.36, 1.30, 2.82, C.accent, 95, 0.30);
    addHairline(slide, 8.36, 5.78, 2.16, C.cyan, 96, 0.28);
    return;
  }
  addRect(slide, 10.98, 1.16, 0.026, 4.86, C.softBlue || 'FFF1F2', C.softBlue || 'FFF1F2', {
    fill:{color:C.softBlue || 'FFF1F2', transparency:70},
    line:{color:C.softBlue || 'FFF1F2', transparency:100}
  });
  addHairline(slide, 8.92, 1.34, 2.02, C.accent, 90, 0.34);
  addHairline(slide, 8.92, 5.72, 1.86, C.cyan, 92, 0.32);
}
function addCanvasMotif(slide, plan, s, tone='light', opts={}) {
  const motif = canvasMotifKind(plan, s, tone, opts);
  if (motif === 'none') return;
  if (motif === 'beauty-editorial-veil') return addBeautyEditorialVeil(slide, 'light');
  if (motif === 'beauty-dark-veil') return addBeautyEditorialVeil(slide, 'dark');
  if (tone === 'dark') return WatermarkCircle(slide, 'dark', opts);
  return WatermarkCircle(slide, 'light', Object.assign({ y:1.22, size:3.16, transparency:56 }, opts));
}
function EvidenceImageFrame(slide, imagePath, x, y, w, h, opts={}) {
  return addEvidenceImageFrame(slide, imagePath, x, y, w, h, opts);
}
function CaptionBar(slide, x, y, w, h, opts={}) {
  return addCaptionBar(slide, x, y, w, h, opts);
}
function MetricStrip(slide, metrics=[], x=0.86, y=5.90, w=10.60, opts={}) {
  return renderKpiStrip(componentRendererContext(slide), metrics, Object.assign({}, opts, { x, y, w }));
}
function DarkSidebar(slide, x, y, w, h, opts={}) {
  const color = opts.color || C.ink;
  addRect(slide, x, y, w, h, color, opts.line || color, {
    fill:{color, transparency:opts.transparency || 0},
    line:{color:opts.line || color, transparency:100}
  });
}
function ProcessRail(slide, points=[], x=0.92, y=3.0, w=10.2, opts={}) {
  const list = (points || []).slice(0, opts.max || 5);
  const step = w / Math.max(1, list.length - 1);
  addHairline(slide, x, y, step * Math.max(0, list.length - 1), opts.line || C.line, opts.lineTransparency || 18, opts.width || 0.56);
  list.forEach((point, i) => {
    const cx = x + i * step;
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.muted);
    slide.addShape('ellipse', { x:cx-0.06, y:y-0.06, w:0.12, h:0.12, fill:{color:accent}, line:{color:accent, transparency:100} });
    addText(slide, itemTitle(point, `步骤 ${i + 1}`), { x:cx-0.52, y:y+0.30, w:1.04, h:0.13, fontSize:7.5, bold:true, color:opts.dark ? (C.captionOnImage || 'CBD5E1') : C.text, fit:'shrink', align:'center' });
  });
}
function IndustryTag(slide, text, x=0.86, y=0.72, opts={}) {
  addLabel(slide, text || industryProfile(activePlan()).label || 'INDUSTRY', {
    x, y, w:opts.w || 2.4, h:0.15, fontSize:opts.fontSize || 7.1, color:opts.dark ? C.cyan : C.accent, charSpace:opts.charSpace == null ? 1.0 : opts.charSpace
  });
}
function SourceNote(slide, text, x=0.82, y=7.05, opts={}) {
  addText(slide, text || footerText(activePlan()), {
    x, y, w:opts.w || 7.8, h:opts.h || 0.16, fontSize:opts.fontSize || typeSize('caption', 7.8), color:opts.dark ? (C.darkMuted || '94A3B8') : C.muted, fit:'shrink'
  });
}
function componentRendererContext(slide) {
  return {
    slide,
    colors: C,
    addRect,
    addText,
    addLabel,
    addNumber,
    addArrowLine,
    addHairline,
    panelFill,
    compactText
  };
}
function ContactBlock(slide, contacts=[], x=0.90, y=4.46, opts={}) {
  const list = (Array.isArray(contacts) ? contacts : String(contacts || '').split(/[｜|/]/)).filter(Boolean).slice(0, opts.max || 4);
  if (!list.length) return false;
  IndustryTag(slide, opts.label || '联系方式', x, y, { dark:opts.dark, charSpace:0, fontSize:6.4, w:1.10 });
  list.forEach((v, i) => {
    const cy = y + 0.42 + i * 0.36;
    slide.addShape('ellipse', { x, y:cy+0.04, w:0.075, h:0.075, fill:{color:i===0?C.accent:C.cyan}, line:{color:i===0?C.accent:C.cyan, transparency:100} });
    addText(slide, String(v), { x:x+0.24, y:cy, w:opts.w || 4.92, h:0.13, fontSize:8.5, color:opts.dark ? (C.captionOnImage || 'CBD5E1') : C.body, fit:'shrink' });
  });
  return true;
}

function componentSourceNoteText(plan = {}, s = {}) {
  const proof = s.proof || {};
  return s.sourceNote || s.source_note || proof.sourceNote || '';
}

function compactText(text = '', maxChars = 32) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return stripEllipsisText(value);
}

function overlayMetricsForSlide(plan = {}, s = {}) {
  const normalize = m => typeof m === 'string'
    ? { label:'Metric', value:m, note:'' }
    : { label:m.label || m.title || 'Metric', value:m.value || m.amount || m.delta || '', note:m.note || m.body || m.unit || '' };
  if (Array.isArray(s.metrics) && s.metrics.length) return s.metrics.map(normalize).filter(m => m.value || m.note).slice(0, 4);
  if (['cover', 'cover-dark'].includes(s.type || '') && Array.isArray(plan.coverMetrics) && plan.coverMetrics.length) {
    return plan.coverMetrics.map(normalize).filter(m => m.value || m.note).slice(0, 4);
  }
  const textItems = [
    s.title,
    s.subtitle,
    s.claim,
    s.note,
    ...(Array.isArray(s.cards) ? s.cards.map(c => `${c.title || ''} ${c.body || c.text || ''}`) : []),
    ...(Array.isArray(s.items) ? s.items.map(v => `${itemTitle(v)} ${itemBody(v)}`) : [])
  ].filter(Boolean);
  const found = [];
  textItems.forEach((text, i) => {
    const matches = String(text).match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|JPY|¥|B|bn|m|年|yrs?|countries|awards)?/gi) || [];
    matches.forEach(match => {
      const value = match.replace(/\s+/g, '');
      if (!value || /^\d{4}$/.test(value) || found.some(m => m.value === value)) return;
      found.push({
        label: i === 0 ? 'Claim signal' : compactText(String(text).replace(match, ''), 18),
        value,
        note: compactText(String(text), 24)
      });
    });
  });
  return found.slice(0, 4);
}

function overlayPointsForSlide(s = {}) {
  const fields = [s.phases, s.items, s.actions, s.sections, s.cards].find(v => Array.isArray(v) && v.length);
  if (fields) return fields.slice(0, 5);
  const proof = s.proof || {};
  return [s.title, s.claim || s.subtitle, proof.explanation || s.note].filter(Boolean).slice(0, 3).map(text => ({ title:text }));
}

function overlayProofItemsForSlide(plan = {}, s = {}) {
  if (Array.isArray(s.cards) && s.cards.length) return s.cards.slice(0, 4);
  if (Array.isArray(s.items) && s.items.length) return s.items.slice(0, 4);
  const metrics = overlayMetricsForSlide(plan, s);
  if (metrics.length) return metrics.map(m => ({ title:`${m.label}: ${m.value}`, body:m.note }));
  if (Array.isArray(s.rows) && s.rows.length) return s.rows.slice(0, 4).map(row => Array.isArray(row) ? { title:row[0], body:row.slice(1).join(' · ') } : row);
  const proof = s.proof || {};
  return [proof.explanation || s.claim || s.subtitle].filter(Boolean).map(text => ({ title:'Proof', body:text }));
}

function drawOverlayValueChain(slide, points = [], opts = {}) {
  const result = renderValueChain(componentRendererContext(slide), points, opts);
  return result.rendered ? result : false;
}

function drawOverlayProofGallery(slide, items = [], opts = {}) {
  const result = renderProofGallery(componentRendererContext(slide), items, opts);
  return result.rendered ? result : false;
}

function slideHasChartSpecIntent(s = {}) {
  const type = String(s.type || '');
  if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) return false;
  if (s.chartSpec || s.chartKind || s.chart_kind || s.dataComponent || s.data_component) return true;
  const variant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '');
  return ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type) ||
    /chart|metric|kpi|scorecard|matrix|funnel|waterfall|pareto/i.test(variant);
}

function evidenceZone(contract = {}, patterns = []) {
  const zones = [
    ...Object.values(contract.safeOverlayZones || {}),
    ...(contract.occupiedZones || [])
  ];
  return zones.find(z => patterns.some(pattern => pattern.test(`${z.id || ''} ${z.role || ''}`))) ||
    (contract.occupiedZones || [])[0] ||
    zone('native-slide-stage', 0, 0, W, H, 'native');
}

function nativeDrawnEvidenceFor(plan = {}, s = {}, componentId = '', contract = {}, slide = null) {
  const type = String(s.type || '');
  const variant = String(s.layoutVariant || s.variant || '');
  const proofObject = String((s.proof && s.proof.id) || s.proofObject || s.proof_object || '');
  const hasImages = Boolean((Array.isArray(s.images) && s.images.length) ||
    (s.visual && Array.isArray(s.visual.images) && s.visual.images.length) ||
    (s.visual && s.visual.image) ||
    s.image ||
    mediaForRole(plan, s, slideRole(s)));
  const hasMetrics = Array.isArray(s.metrics) && s.metrics.length;
  const hasRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
  const hasFlow = Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.items);
  const hasArchitecture = Array.isArray(s.layers) || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals;
  const chartRendered = slideHasChartSpecIntent(s) || (contract && /metric|chart|finance/.test(type));
  const evidence = (patterns, drawnCount = 1, reason = '') => {
    const bbox = evidenceZone(contract, patterns);
    return {
      id: componentId,
      mode: 'native-renderer',
      rendered: true,
      rendererModule: 'generate_pptx/native-page-renderer',
      nativeSlot: bbox.id || '',
      drawnCount,
      bbox,
      evidence: reason || 'native renderer owns a visible page-family slot'
    };
  };
  if (componentId === 'page-number') return evidence([/footer|folio|stage|native/i], 1, 'final slide chrome writes page number');
  if (componentId === 'section-kicker' && !['cover', 'cover-dark', 'closing', 'closing-dark'].includes(type)) return evidence([/title|stage|native/i], 1, 'native title block writes section kicker');
  if (componentId === 'navigation-sequence' && ['toc', 'toc-clean'].includes(type)) return evidence([/navigation|path|stage|native/i], Math.max(1, (s.items || s.sections || []).length || 1), 'native TOC renderer draws navigation sequence');
  if (componentId === 'content-card-grid' && ['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type)) return evidence([/cards|content|stage|visual|text|native/i], Math.max(1, (s.cards || s.items || s.modules || s.values || []).length || 1), 'native page family draws the main content/card grid');
  if (componentId === 'hero-image' && (['cover', 'cover-dark', 'case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(type) || hasImages || /hero|cover|brand|product|image/i.test(`${variant} ${proofObject}`))) return evidence([/visual|image|cover|stage|photo/i], hasImages ? 1 : 0.5, 'native renderer draws or reserves primary visual stage');
  if (['kpi-strip', 'metric-strip', 'kpi-primary-metric'].includes(componentId) && (hasMetrics || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type))) return evidence([/metric|content|stage|board|native/i], hasMetrics ? Math.max(1, s.metrics.length) : 1, 'native metric renderer draws metric readout');
  if (componentId === 'chart-commentary-panel' && ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) return evidence([/commentary|content|stage|board|native/i], 1, 'native chart renderer draws commentary/readout panel');
  if (CHART_COMPONENT_IDS.has(componentId) && chartRendered) {
    const chartItemCount = componentId === 'scorecard' && hasMetrics ? Math.max(1, s.metrics.length) : 1;
    return evidence([/chart|content|stage|board|native/i], chartItemCount, 'native chartSpec renderer owns chart board');
  }
  if (['proof-gallery', 'proof-gallery-grid', 'caption-bar'].includes(componentId) && (['case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(type) || hasImages || /gallery|proof|lookbook|mosaic|product/i.test(`${variant} ${proofObject}`))) return evidence([/visual|caption|gallery|stage|content|native/i], Math.max(1, (s.images || []).length || (s.cards || []).length || 1), 'native evidence renderer draws gallery/caption system');
  if (componentId === 'product-matrix' && (type === 'product-showcase' || Array.isArray(s.products) || /product|sku|texture|efficacy/i.test(`${variant} ${proofObject} ${s.title || ''}`))) return evidence([/product|visual|content|stage|native/i], Math.max(1, (s.products || []).length || 1), 'native renderer draws product proof/matrix');
  if (['value-chain', 'value-chain-connector', 'system-rail'].includes(componentId) && (['strategy-map', 'architecture', 'architecture-dark'].includes(type) || hasArchitecture || /value|system|brand-world/i.test(`${variant} ${proofObject}`))) return evidence([/architecture|topology|flow|stage|content|native/i], 1, 'native system renderer draws flow/architecture rail');
  if (componentId === 'commentary-panel' && (['strategy-map', 'architecture', 'architecture-dark', 'module-matrix', 'value-tiles', 'report-board'].includes(type) || s.businessLogic || s.claim)) return evidence([/commentary|summary|caption|text|content|stage|native/i], 1, 'native renderer draws a commentary or management-judgment panel');
  if (componentId === 'process-rail' && (['timeline', 'timeline-dark'].includes(type) || hasFlow || /process|loop|timeline|flywheel/i.test(`${variant} ${proofObject}`))) return evidence([/process|timeline|loop|stage|content|native/i], Math.max(1, (s.phases || s.actions || s.steps || []).length || 1), 'native timeline renderer draws process rail');
  if (['risk-register', 'risk-matrix', 'governance-table'].includes(componentId) && (['risk-table', 'table'].includes(type) || hasRows || /risk|governance|materiality|control/i.test(`${variant} ${proofObject}`))) return evidence([/risk|table|governance|content|stage|native/i], Math.max(1, (s.rows || s.risks || s.controls || []).length || 1), 'native governance renderer draws risk/table structure');
  if (['decision-panel', 'contact-block', 'editorial-end-card'].includes(componentId) && ['closing', 'closing-dark'].includes(type)) return evidence([/closing|stage|native/i], 1, 'native closing renderer draws decision/contact block');
  if (componentId === 'load-curve-band' && slide && (slide.__codexDecorations || []).some(d => d.type === 'load-curve-band')) return evidence([/load-curve|visual|stage|native/i], 1, 'native renderer drew a load-curve-band decoration');
  if (componentId === 'source-note' && (s.sourceNote || s.source_note || (s.proof && s.proof.sourceNote))) return evidence([/source|footer|stage|native/i], 1, 'native renderer draws visible source note');
  return null;
}

function renderOverlayComponent(slide, plan, s, idx, componentId, nativeIds, contract = {}, existingOverlays = []) {
  const dark = slideRenderedDark(slide, s);
  const slot = overlaySlotForComponent(contract, componentId);
  if (componentBlockedByContract(contract, componentId)) {
    return { id:componentId, mode:'blocked-unsafe-overlay', rendered:false, reason:'no safe overlay zone declared by native renderer contract' };
  }
  if (!nativeIds.has(componentId) && componentSlotConflicts(contract, slot)) {
    return { id:componentId, mode:'blocked-native-zone-conflict', rendered:false, bbox:slot, reason:'safe overlay zone conflicts with native occupied zone' };
  }
  const overlayConflict = !nativeIds.has(componentId) ? overlaySlotConflicts(existingOverlays, slot) : null;
  if (overlayConflict) {
    return {
      id:componentId,
      mode:'blocked-overlay-zone-conflict',
      rendered:false,
      bbox:slot,
      reason:`safe overlay zone conflicts with already rendered component ${overlayConflict.id || overlayConflict.componentId || 'overlay'}`
    };
  }
  if (componentId === 'hero-image' && !nativeIds.has(componentId)) {
    const image = mediaForRole(plan, s, slideRole(s));
    if (image && fs.existsSync(image)) {
      const z = slot || { x:8.18, y:1.08, w:3.20, h:2.48 };
      addSmartPhotoPanel(slide, image, z.x, z.y, z.w, z.h, { role:'evidence', tone:dark ? 'dark' : 'light', fit:'cover' });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z };
    }
  }
  if ((componentId === 'kpi-strip' || componentId === 'metric-strip') && !nativeIds.has(componentId)) {
    const metrics = overlayMetricsForSlide(plan, s);
    if (metrics.length) {
      const z = slot || { x:0.86, y:['cover', 'cover-dark'].includes(s.type || '') ? 5.90 : 6.12, w:10.30, h:0.58 };
      const component = MetricStrip(slide, metrics, z.x, z.y, z.w, { h:z.h || 0.58, max:4, transparency:dark ? 18 : 0 });
      return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
  }
  if (componentId === 'chart-commentary-panel' && !nativeIds.has(componentId)) {
    const text = (s.businessLogic && (s.businessLogic.action || s.businessLogic.metric)) ||
      (s.proof && s.proof.explanation) ||
      s.claim || s.subtitle || s.note || '';
    if (text) {
      const z = slot || { x:8.22, y:6.00, w:3.42, h:0.42 };
      addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
        fill:{color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0},
        line:{color:dark ? C.darkLine : C.line, transparency:dark ? 52 : 14, width:0.38}
      });
      addLabel(slide, 'READOUT', { x:z.x+0.20, y:z.y+0.15, w:0.72, h:0.08, fontSize:4.8, color:dark ? C.cyan : C.accent, charSpace:0.45 });
      addText(slide, compactText(text, 70), { x:z.x+0.98, y:z.y+0.12, w:Math.max(1.0, z.w-1.20), h:0.12, fontSize:6.8, color:dark ? C.captionOnImage : C.body, fit:'shrink' });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z };
    }
  }
  if ((componentId === 'value-chain' || componentId === 'system-rail') && !nativeIds.has(componentId)) {
    const points = overlayPointsForSlide(s);
    const z = slot || {};
    const component = drawOverlayValueChain(slide, points, Object.assign({ dark }, z));
    if (component) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
  }
  if (componentId === 'process-rail' && !nativeIds.has(componentId)) {
    const points = overlayPointsForSlide(s);
    if (points.length >= 2) {
      const z = slot || { x:0.94, y:6.18, w:4.48, h:0.54 };
      ProcessRail(slide, points, z.x, z.y + 0.06, z.w, { max:5, dark, line:dark ? C.darkLine : C.line, lineTransparency:dark ? 44 : 18 });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z, itemCount:points.slice(0, 5).length };
    }
  }
  if (componentId === 'proof-gallery' && !nativeIds.has(componentId)) {
    const items = overlayProofItemsForSlide(plan, s);
    const z = slot || {};
    const component = drawOverlayProofGallery(slide, items, Object.assign({ dark }, z));
    if (component) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
  }
  if (componentId === 'risk-register' && !nativeIds.has(componentId)) {
    const rows = Array.isArray(s.rows) && s.rows.length ? s.rows : overlayProofItemsForSlide(plan, s);
    const z = slot || {};
    const component = renderRiskRegister(componentRendererContext(slide), rows, Object.assign({ dark }, z));
    if (component.rendered) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
  }
  if (componentId === 'product-matrix' && !nativeIds.has(componentId)) {
    const items = overlayProofItemsForSlide(plan, s).slice(0, 3);
    if (items.length) {
      const z = slot || { x:8.04, y:4.92, w:3.58, h:0.58 };
      const x = z.x;
      const y = z.y;
      addRect(slide, x, y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
        fill:{color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0},
        line:{color:dark ? C.darkLine : C.line, transparency:dark ? 48 : 14, width:0.38}
      });
      addLabel(slide, 'SKU / PROOF MATRIX', { x:x+0.18, y:y+0.15, w:1.22, h:0.08, fontSize:4.7, color:dark ? C.cyan : C.accent, charSpace:0.35 });
      addText(slide, items.map(item => compactText(itemTitle(item, 'Proof'), 16)).join('  /  '), {
        x:x+1.48, y:y+0.14, w:Math.max(1.0, z.w-1.70), h:0.12, fontSize:6.8, color:dark ? C.captionOnImage : C.body, fit:'shrink'
      });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z };
    }
  }
  if (componentId === 'source-note' && !nativeIds.has(componentId)) {
    const text = componentSourceNoteText(plan, s);
    if (text) {
      const z = slot || { x:8.10, y:7.05, w:4.20, h:0.16 };
      SourceNote(slide, text, z.x, z.y, { w:z.w, h:z.h, fontSize:6.9, dark });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z };
    }
  }
  if (componentId === 'caption-bar' && !nativeIds.has(componentId)) {
    const caption = (s.proof && s.proof.explanation) || s.caption || s.subtitle || '';
    if (caption) {
      const z = slot || { x:0.86, y:6.50, w:4.80, h:0.28 };
      addCaptionBar(slide, z.x, z.y, z.w, z.h, {
        label:'PROOF',
        caption,
        dark,
        transparency:dark ? 28 : 0
      });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z };
    }
  }
  if (componentId === 'commentary-panel' && !nativeIds.has(componentId)) {
    const logic = s.businessLogic || {};
    const text = logic.action || logic.metric || s.decision || s.note || '';
    if (text) {
      const z = slot || { x:9.10, y:5.72, w:2.44, h:0.52 };
      addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
        fill:{color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0},
        line:{color:dark ? C.darkLine : C.line, transparency:dark ? 52 : 12, width:0.42}
      });
      addLabel(slide, 'COMMENTARY', { x:z.x+0.20, y:z.y+0.16, w:1.20, h:0.09, fontSize:5.2, color:dark ? C.cyan : C.accent, charSpace:0.6 });
      addText(slide, text, { x:z.x+1.08, y:z.y+0.14, w:Math.max(0.92, z.w-1.30), h:0.12, fontSize:6.9, color:dark ? C.captionOnImage : C.body, fit:'shrink' });
      return { id:componentId, mode:'overlay', rendered:true, bbox:z };
    }
  }
  if (CHART_COMPONENT_IDS.has(componentId) && !nativeIds.has(componentId)) {
    const spec = s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length });
    if (spec) {
      const component = renderChartSpec(componentRendererContext(slide), spec, { x:4.06, y:2.16, w:7.44, h:3.76 });
      if (component.rendered) {
        recordChartConsumption(slide, spec, component, { plannedComponentId:componentId, mode:'overlay' });
        return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
      }
    }
  }
  if (nativeIds.has(componentId)) {
    const nativeEvidence = nativeDrawnEvidenceFor(plan, s, componentId, contract, slide);
    return nativeEvidence || {
      id:componentId,
      mode:'native-claimed-undrawn',
      rendered:false,
      rendererModule:'generate_pptx/native-page-renderer',
      reason:'native renderer declared ownership but did not provide drawn component evidence'
    };
  }
  return { id:componentId, mode:'not-rendered', rendered:false };
}

function consumeComponentPlan(slide, plan, s, idx) {
  const planned = plannedComponentsForSlide(s);
  const contract = slide.__codexNativeRenderContract || nativeRendererContractFor(plan, s, 'unknown-renderer');
  const nativeIds = new Set(contract.ownedComponents || []);
  const renderedOverlays = [];
  const consumed = planned.map(component => {
    const result = renderOverlayComponent(slide, plan, s, idx, component.id, nativeIds, contract, renderedOverlays);
    if (result && result.rendered && result.mode === 'overlay') {
      renderedOverlays.push(Object.assign({ id:component.id }, result.bbox || overlaySlotForComponent(contract, component.id) || {}));
    }
    return Object.assign({
      id: component.id,
      required: component.required !== false,
      role: component.role || ''
    }, result);
  });
  const plannedChartSpec = !nativeVariantSuppressesChartMeta(s) && slideHasChartSpecIntent(s)
    ? (s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length }) || null)
    : null;
  RENDER_META.slides.push({
    slide: idx,
    type: s.type || '',
    layoutVariant: s.layoutVariant || s.variant || '',
    proofObject: (s.proof && s.proof.id) || s.proofObject || '',
    sourceTrace: s.sourceTrace || null,
    proof: s.proof || null,
    assetDecision: assetDecisionForMeta(plan, s),
    rendererMatch: slide.__codexRendererMatch || null,
    routeSanitization: s.routeSanitization || s.normalizationAudit || null,
    textBoxes: slide.__codexTextBoxes || [],
    chartSpec: compactChartSpecForMeta(plannedChartSpec),
    chartConsumption: slide.__codexChartConsumption || null,
    nativeRendererContract: contract,
    decorations: slide.__codexDecorations || [],
    plannedComponents: planned.map(c => ({
      id:c.id,
      required:c.required !== false,
      role:c.role || '',
      source:c.source || '',
      supportedModes:c.supportedModes || ((componentCapabilityFor(c.id) || {}).supportedModes) || [],
      allowedModes:c.allowedModes || c.allowed_modes || c.supportedModes || ((componentCapabilityFor(c.id) || {}).supportedModes) || [],
      ownershipPolicy:c.ownershipPolicy || ((componentCapabilityFor(c.id) || {}).ownershipPolicy) || '',
      dataRequirements:c.dataRequirements || [],
      slotPolicy:c.slotPolicy || c.slot_policy || '',
      repairPolicy:c.repairPolicy || c.repair_policy || '',
      priority:c.priority || (c.required === false ? 'optional' : 'required')
    })),
    unknownComponents: (s.componentPlan && Array.isArray(s.componentPlan.unknownComponents)) ? s.componentPlan.unknownComponents : [],
    drawnComponents: consumed
      .filter(c => c.rendered && c.mode === 'native-renderer')
      .map(c => ({
        id:c.id,
        nativeSlot:c.nativeSlot || '',
        drawnCount:c.drawnCount || 0,
        bbox:c.bbox || null,
        rendererModule:c.rendererModule || '',
        evidence:c.evidence || ''
      })),
    consumedComponents: consumed,
    missingRequiredComponents: consumed.filter(c => c.required && !c.rendered).map(c => c.id)
  });
}
function CertificateWall(slide, certificates=[], x=0.92, y=2.0, w=10.6, h=3.4, opts={}) {
  const list = (certificates || []).slice(0, opts.max || 6).map(v => typeof v === 'string' ? { title:v } : v);
  const cols = 3;
  const gap = 0.18;
  const cellW = (w - gap * (cols - 1)) / cols;
  const cellH = (h - gap) / 2;
  list.forEach((cert, i) => {
    const cx = x + (i % cols) * (cellW + gap);
    const cy = y + Math.floor(i / cols) * (cellH + gap);
    addRect(slide, cx, cy, cellW, cellH, opts.fill || panelFill(), C.line, { fill:{color:opts.fill || panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.42} });
    addLabel(slide, cert.id || cert.code || `CERT ${String(i + 1).padStart(2, '0')}`, { x:cx+0.18, y:cy+0.16, w:0.80, h:0.08, fontSize:5.1, color:C.accent, charSpace:0.4 });
    addText(slide, cert.title || cert.name || '', { x:cx+0.18, y:cy+0.46, w:cellW-0.36, h:0.18, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
    if (cert.validUntil || cert.year) addText(slide, cert.validUntil || cert.year, { x:cx+0.18, y:cy+cellH-0.30, w:cellW-0.36, h:0.10, fontSize:6.2, color:C.muted, fit:'shrink' });
  });
}
function EquipmentNameplate(slide, x, y, w, opts={}) {
  return addEquipmentNameplate(slide, x, y, w, opts);
}
function designForSlide(plan, s, role) {
  if (DESIGN && typeof DESIGN.slideDesign === 'function') return DESIGN.slideDesign(s, role);
  return {
    wantsImage: slideWantsImage(plan, s, role),
    imagePath: mediaForRole(plan, s, role),
    imageRole: visualRole(plan, s, role)
  };
}
function addVisualPhotoPanel(slide, plan, s, role, x, y, w, h, opts={}) {
  const design = designForSlide(plan, s, role);
  if (!design.wantsImage) return false;
  return addPhotoPanel(slide, design.imagePath, x, y, w, h, opts);
}
function addVisualPhotoBackdrop(slide, plan, s, role='cover', opts={}) {
  const design = designForSlide(plan, s, role);
  if (!design.wantsImage) return false;
  return addPhotoPanel(slide, design.imagePath, 0, 0, W, H, Object.assign({ transparency:68 }, opts));
}
function addLine(slide, x, y, w, color=C.line, width=1) {
  slide.addShape('line', { x, y, w, h:0, line:{color, width} });
}
function addHairline(slide, x, y, w, color=C.line, transparency=45, width=0.55) {
  slide.addShape('line', { x, y, w, h:0, line:{color, transparency, width} });
}
function addArrowLine(slide, x, y, w, h, color=C.accent, opts={}) {
  const line = {
    color,
    transparency:opts.transparency ?? 28,
    width:opts.width || 0.56
  };
  if (opts.beginArrowType) line.beginArrowType = opts.beginArrowType;
  if (opts.endArrowType !== null) line.endArrowType = opts.endArrowType || 'triangle';
  slide.addShape('line', {
    x, y, w, h,
    line
  });
}
function rectCenter(rect) {
  return { x:rect.x + rect.w / 2, y:rect.y + rect.h / 2 };
}
function addArrowBetweenRects(slide, from, to, direction='right', color=C.accent, opts={}) {
  const gap = opts.gap ?? 0.16;
  const base = Object.assign({ transparency:30, width:0.42 }, opts);
  if (direction === 'right') {
    const x = from.x + from.w + gap;
    const y = opts.y ?? (from.y + from.h / 2);
    const endX = to.x - gap;
    return addArrowLine(slide, x, y, Math.max(0.08, endX - x), (opts.endY ?? (to.y + to.h / 2)) - y, color, base);
  }
  if (direction === 'down') {
    const x = opts.x ?? (from.x + from.w / 2);
    const y = from.y + from.h + gap;
    const endY = to.y - gap;
    return addArrowLine(slide, x, y, (opts.endX ?? (to.x + to.w / 2)) - x, Math.max(0.08, endY - y), color, base);
  }
  if (direction === 'left') {
    const x = to.x + to.w + gap;
    const y = opts.y ?? (from.y + from.h / 2);
    const endX = from.x - gap;
    return addArrowLine(slide, x, y, Math.max(0.08, endX - x), (opts.endY ?? (to.y + to.h / 2)) - y, color, Object.assign({}, base, { beginArrowType:'triangle', endArrowType:null }));
  }
  if (direction === 'up') {
    const x = opts.x ?? (from.x + from.w / 2);
    const y = to.y + to.h + gap;
    const endY = from.y - gap;
    return addArrowLine(slide, x, y, (opts.endX ?? (to.x + to.w / 2)) - x, Math.max(0.08, endY - y), color, Object.assign({}, base, { beginArrowType:'triangle', endArrowType:null }));
  }
  return addArrowLine(slide, from.x, from.y, to.x - from.x, to.y - from.y, color, base);
}
function addClockwiseLoopConnectors(slide, slots, colors=[], opts={}) {
  if (slots.length < 4) return;
  addArrowBetweenRects(slide, slots[0], slots[1], 'right', colors[0] || C.accent, opts);
  addArrowBetweenRects(slide, slots[1], slots[2], 'down', colors[1] || C.cyan, opts);
  addArrowBetweenRects(slide, slots[2], slots[3], 'left', colors[2] || C.violet, opts);
  addArrowBetweenRects(slide, slots[3], slots[0], 'up', colors[3] || '94A3B8', opts);
}
function addDarkBreathingCircle(slide, x=8.20, y=0.78, outer=4.42, inner=2.50, accent=C.accent) {
  markDecoration(slide, 'breathing-circle', zone('breathing-circle', x, y, outer, outer, 'decoration'));
  slide.addShape('ellipse', { x, y, w:outer, h:outer, fill:{color:accent, transparency:98}, line:{color:accent, transparency:88, width:0.45} });
  const inset = (outer - inner) / 2;
  slide.addShape('ellipse', { x:x+inset, y:y+inset, w:inner, h:inner, fill:{color:C.ink, transparency:100}, line:{color:C.cyan, transparency:92, width:0.35} });
}
function addLightBreathingCircle(slide, x=9.58, y=0.42, size=3.45, color=C.softBlue, transparency=50) {
  markDecoration(slide, 'breathing-circle', zone('breathing-circle', x, y, size, size, 'decoration'));
  slide.addShape('ellipse', { x, y, w:size, h:size, fill:{color, transparency}, line:{color, transparency:100} });
}
function markDecoration(slide, type, bbox = {}) {
  if (!slide) return false;
  slide.__codexDecorations = slide.__codexDecorations || [];
  const entry = Object.assign({ type }, zoneBounds(bbox));
  slide.__codexDecorations.push(entry);
  return true;
}
function addPulseCurve(slide, x, y, w, h, accent=C.accent, dark=true, opts={}) {
  const isEnergy = activePlan().industry === 'energy-utility';
  if (isEnergy && slide.__codexEnergyLoadCurveRendered && opts.allowMultiple !== true) return false;
  if (isEnergy) slide.__codexEnergyLoadCurveRendered = true;
  markDecoration(slide, opts.decorType || 'load-curve-band', zone(opts.decorType || 'load-curve-band', x, y, w, h, 'decoration'));
  const pts = opts.points || [[0.00,0.66],[0.16,0.64],[0.30,0.49],[0.43,0.55],[0.56,0.32],[0.70,0.38],[0.84,0.22],[1.00,0.29]];
  const lineColor = opts.color || accent;
  const trans = opts.transparency ?? (dark ? 36 : 8);
  for (let i=0; i<pts.length-1; i++) {
    const [px,py] = pts[i];
    const [nx,ny] = pts[i+1];
    const sx = x+px*w;
    const sy = y+py*h;
    const mx = x+nx*w;
    const my = y+ny*h;
    slide.addShape('line', {
      x:sx, y:sy, w:mx-sx, h:0,
      line:{color:lineColor, transparency:trans, width:opts.width || 0.62}
    });
    slide.addShape('line', {
      x:mx, y:sy, w:0, h:my-sy,
      line:{color:lineColor, transparency:trans, width:opts.width || 0.62}
    });
  }
  if (opts.nodes !== false) {
    [pts[2], pts[5], pts[7]].forEach((p,i)=>{
      slide.addShape('ellipse', {
        x:x+p[0]*w-0.035, y:y+p[1]*h-0.035, w:0.07, h:0.07,
        fill:{color:i===1 ? C.cyan : lineColor, transparency:dark?10:0},
        line:{color:i===1 ? C.cyan : lineColor, transparency:100}
      });
    });
  }
  return true;
}
function addEnergyLens(slide, x=7.90, y=0.72, size=4.56, accent=C.accent, opts={}) {
  slide.addShape('ellipse', { x, y, w:size, h:size, fill:{color:accent, transparency:98}, line:{color:accent, transparency:86, width:0.42} });
  slide.addShape('ellipse', { x:x+size*0.20, y:y+size*0.20, w:size*0.60, h:size*0.60, fill:{color:C.ink, transparency:100}, line:{color:C.cyan, transparency:91, width:0.34} });
  slide.addShape('ellipse', { x:x+size*0.37, y:y+size*0.37, w:size*0.26, h:size*0.26, fill:{color:C.ink2, transparency:42}, line:{color:'334155', transparency:72, width:0.32} });
  if (opts.showCurve) addPulseCurve(slide, x+size*0.18, y+size*0.57, size*0.62, size*0.18, accent, true, { transparency:42, width:0.54, nodes:false });
  addLabel(slide, 'LOAD', { x:x+size*0.16, y:y+size*0.78, w:0.62, h:0.11, fontSize:6.8, color:'64748B', charSpace:0.45 });
  addLabel(slide, 'SOC', { x:x+size*0.72, y:y+size*0.30, w:0.52, h:0.11, fontSize:6.8, color:'64748B', charSpace:0.45, align:'right' });
  addLabel(slide, 'DISPATCH', { x:x+size*0.41, y:y+size*0.47, w:0.96, h:0.11, fontSize:6.8, color:'7C8BA3', charSpace:0.4, align:'center' });
}
function addEnergyPhotoBackdrop(slide) {
  if (!addImageIfExists(slide, MEDIA_ASSETS.energyStorageCover, { x:0, y:0, w:W, h:H })) {
    return false;
  }
  addRect(slide, 0, 0, W, H, C.ink, C.ink, { fill:{color:C.ink, transparency:72}, line:{color:C.ink, transparency:100} });
  return true;
}
function addEnergyPhotoPanel(slide, x, y, w, h, variant='detail', opts={}) {
  const asset = variant === 'band' ? MEDIA_ASSETS.energyStorageBand : MEDIA_ASSETS.energyStorageDetail;
  if (!addImageIfExists(slide, asset, { x, y, w, h })) {
    addRect(slide, x, y, w, h, opts.fallback || C.ink, opts.fallback || C.ink);
  }
  const tone = opts.tone || 'dark';
  const overlay = tone === 'light' ? 'FFFFFF' : C.ink;
  addRect(slide, x, y, w, h, overlay, overlay, {
    fill:{ color:overlay, transparency:opts.transparency ?? (tone === 'light' ? 36 : 42) },
    line:{ color:opts.line || (tone === 'light' ? 'FFFFFF' : C.ink), transparency:opts.lineTransparency ?? 100, width:opts.lineWidth || 0.3 }
  });
  if (opts.stroke) {
    addRect(slide, x, y, w, h, overlay, opts.stroke, {
      fill:{ color:overlay, transparency:100 },
      line:{ color:opts.stroke, transparency:opts.strokeTransparency ?? 55, width:opts.strokeWidth || 0.4 }
    });
  }
  return true;
}
function addEnergyFooter(slide, plan, dark=true) {
  addText(slide, footerText(plan), {
    x:0.82, y:7.05, w:7.8, h:0.16,
    fontSize:7.8,
    color:dark ? '64748B' : '738297'
  });
}
function addEnergyMotionBackdrop(slide) {
  if (!fs.existsSync(MEDIA_ASSETS.energyStorageLoop) || !fs.existsSync(MEDIA_ASSETS.energyStorageCover)) {
    return false;
  }
  const cover = `data:image/jpeg;base64,${fs.readFileSync(MEDIA_ASSETS.energyStorageCover).toString('base64')}`;
  slide.addMedia({ type:'video', path:MEDIA_ASSETS.energyStorageLoop, cover, x:0, y:0, w:W, h:H, objectName:'Energy storage motion backdrop' });
  addRect(slide, 0, 0, W, H, C.ink, C.ink, { fill:{color:C.ink, transparency:72}, line:{color:C.ink, transparency:100} });
  return true;
}
function splitEnergyTitle(title) {
  const t = String(title || '').replace(/\n/g, '').trim();
  const idx = t.indexOf('智能');
  if (idx > 3 && t.length <= 18) return [t.slice(0, idx), t.slice(idx)];
  return [t, ''];
}
function premiumTitle(title, opts={}) {
  const t = String(title || '').trim();
  if (opts.mode === 'none') return t.replace(/\s*\n\s*/g, ' ');
  const threshold = opts.threshold || 20;
  if (t.length > threshold && !t.includes('\n')) {
    const cut = Math.min(Math.max(8, Math.round(t.length * 0.58)), t.length - 4);
    return `${t.slice(0, cut)}\n${t.slice(cut)}`;
  }
  return t;
}
function coverTitleText(title) {
  const spec = presentationSpec();
  const token = typeToken('coverTitle', { breakAt:22 });
  const mode = spec.coverTitleBreak === 'none' ? 'none' : 'auto';
  return premiumTitle(title, { mode, threshold: spec.coverTitleBreakAt || token.breakAt || 22 });
}

// Architecture-level design primitives. Layouts should compose these helpers instead of patching per-slide shapes.
function activePlan(plan) {
  return plan || CURRENT_RENDER.plan || {};
}
function activeSlide(s) {
  return s || CURRENT_RENDER.slide || {};
}
function activeIndex(idx) {
  return idx || CURRENT_RENDER.idx || 0;
}
function compositionFor(s) {
  const slide = activeSlide(s);
  return slide.compositionPlan || {};
}
function compositionHas(s, key) {
  const cp = compositionFor(s);
  return (Array.isArray(cp.microComponents) && cp.microComponents.includes(key)) ||
    (Array.isArray(cp.primaryColorUse) && cp.primaryColorUse.includes(key));
}
function themeCoverageRank(value) {
  return { low:0, medium:1, high:2 }[String(value || 'medium')] ?? 1;
}
function themeCoverageAtLeast(s, level='medium') {
  return themeCoverageRank(compositionFor(s).themeCoverage) >= themeCoverageRank(level);
}
function darkSurfaceForTone(tone='') {
  return /dark|stage/i.test(String(tone || ''));
}
function slideUsesDarkSurface(s={}) {
  const type = String((s && s.type) || '');
  const variant = String((s && (s.layoutVariant || s.variant)) || '');
  return /dark/i.test(type) ||
    type === 'toc' ||
    type === 'toc-clean' ||
    (type === 'timeline' && variant === 'closed-loop') ||
    darkSurfaceForTone(compositionFor(s).backgroundTone);
}
function hexLuminance(hex='') {
  const value = String(hex || '').replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function slideRenderedDark(slide, s={}) {
  const bg = slide && slide.background && slide.background.color;
  const lum = hexLuminance(bg);
  if (lum != null) return lum < 0.30;
  return slideUsesDarkSurface(s);
}
function finalizeSlideChrome(slide, plan, s, idx) {
  PageNumber(slide, idx, { mask:false, dark:slideRenderedDark(slide, s) });
}
function addBrandFolio(slide, plan, s, idx, dark=false) {
  const cp = compositionFor(s);
  const color = dark ? (C.darkMuted || '94A3B8') : C.muted;
  if (cp.rhythmRole && !['opener', 'closer'].includes(cp.rhythmRole)) {
    const label = String(cp.rhythmRole).replace(/-/g, ' ').toUpperCase();
    if (/^(PROOF|EVIDENCE)$/.test(label)) return;
    addLabel(slide, label, {
      x:0.82, y:0.42, w:1.82, h:0.10, fontSize:5.2, color, charSpace:0.72
    });
  }
}
function addLightThemeMotifs(slide, plan, s, idx) {
  const cp = compositionFor(s);
  if (compositionHas(s, 'accent-rail')) {
    addRect(slide, 0.82, 6.76, 2.36, 0.035, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
    addRect(slide, 3.34, 6.76, 0.54, 0.035, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:32}, line:{color:C.cyan, transparency:100} });
  }
  addBrandFolio(slide, plan, s, idx, false);
}
function addDarkThemeMotifs(slide, plan, s, idx) {
  addBrandFolio(slide, plan, s, idx, true);
}
function stageCanvas(slide, opts={}) {
  TintedBackground(slide, { tone:'dark' });
  addCanvasMotif(slide, activePlan(), activeSlide(), 'dark', opts);
  addDarkThemeMotifs(slide, activePlan(), activeSlide(), activeIndex());
}
function lightCanvas(slide, opts={}) {
  TintedBackground(slide, { header:true });
  addCanvasMotif(slide, activePlan(), activeSlide(), 'light', opts);
  addLightThemeMotifs(slide, activePlan(), activeSlide(), activeIndex());
}
function glassPanel(slide, x, y, w, h, dark=true) {
  const fill = dark ? C.ink2 : panelFill();
  const line = dark ? '334155' : C.line;
  addRect(slide, x, y, w, h, fill, line, { fill:{color:fill, transparency:dark?24:0}, line:{color:line, transparency:dark?58:8, width:0.55} });
}
function sectionKicker(slide, text, x, y, dark=true) {
  addLabel(slide, text, { x, y, w:2.4, h:0.15, fontSize:7.3, color:dark ? C.cyan : C.accent, charSpace:1.1 });
}
function drawSubtleGeometry(slide, dark=true) {
  // Intentionally empty by default. Premium minimal decks should earn every line.
}
function masterDark(slide, plan, title, idx, subtitle='', opts={}) {
  stageCanvas(slide, opts);
  if (title) addText(slide, title, { x:0.78, y:0.74, w:8.8, h:0.42, fontSize:typeSize('pageTitle', 23), bold:true, color:C.white });
  if (subtitle) addText(slide, subtitle, { x:0.80, y:1.22, w:8.8, h:0.28, fontSize:13.5, color:'CBD5E1' });
  if (idx) addText(slide, String(idx).padStart(2,'0'), { x:11.75, y:0.76, w:0.7, h:0.24, fontSize:13, bold:true, color:'CBD5E1', align:'right' });
  addText(slide, footerText(plan), { x:0.78, y:7.05, w:7.5, h:0.16, fontSize:typeSize('caption', 8.5), color:'94A3B8' });
}
function masterLight(slide, plan, title, idx, subtitle='') {
  lightCanvas(slide);
  addHairline(slide, 0.82, 1.42, 10.95, C.line, 20, 0.55);
  addText(slide, title || '', { x:0.82, y:0.66, w:8.95, h:0.38, fontSize:typeSize('pageTitle', 22.5), bold:true, color:C.text });
  if (subtitle) addText(slide, subtitle, { x:0.84, y:1.08, w:8.8, h:0.22, fontSize:10.8, color:C.muted });
  PageNumber(slide, idx);
  SourceNote(slide, footerText(plan));
}

function drawGenericCoverField(slide) {
  drawCoverBreathingCircle(slide);
}
function drawManufacturingCoverField(slide, plan = {}) {
  const coverMetrics = Array.isArray(plan.coverMetrics) ? plan.coverMetrics.filter(Boolean) : [];
  const primary = coverMetrics[0] || { label:'制造基础', value:'—', note:'以材料事实为准' };
  const tags = Array.isArray(plan.coverTags) && plan.coverTags.length ? plan.coverTags : ['设计', '制造', '安调', '复盘'];
  const proofRows = (coverMetrics.length ? coverMetrics.slice(1, 4) : [
    { label:'产品谱系', value:'多类型', note:'' },
    { label:'控制集成', value:'PLC', note:'' },
    { label:'交付闭环', value:'现场', note:'' }
  ]);
  addDarkBreathingCircle(slide, 8.42, 0.78, 4.12, 2.30, C.accent);
  const panel = { x:7.34, y:1.32, w:4.82, h:4.70 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:34},
    line:{color:'334155', transparency:68, width:0.38}
  });
  addLabel(slide, 'MANUFACTURING PROOF', { x:panel.x+0.34, y:panel.y+0.34, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, primary.value || '—', { x:panel.x+0.32, y:panel.y+0.84, w:1.20, h:0.38, fontSize:28, bold:true, color:C.white, fit:'shrink' });
  addText(slide, primary.label || '核心事实', { x:panel.x+1.62, y:panel.y+1.02, w:1.06, h:0.12, fontSize:7.2, color:'94A3B8', fontFace:profileFont('latin'), fit:'shrink' });
  addPulseCurve(slide, panel.x+2.42, panel.y+0.92, 1.92, 0.42, C.cyan, true, { transparency:34, width:0.42, nodes:false });
  addHairline(slide, panel.x+0.34, panel.y+1.64, panel.w-0.68, '334155', 44, 0.34);

  const stations = tags.slice(0, 4).map((label, i) => ({
    label,
    x: panel.x + 0.48 + i * 1.14,
    y: panel.y + 2.08,
    color: [C.accent, C.cyan, C.violet, '94A3B8'][i] || C.accent
  }));
  stations.forEach((st,i)=>{
    addRect(slide, st.x, st.y, 0.64, 0.40, C.ink, st.color, {
      fill:{color:C.ink, transparency:i===0?6:22},
      line:{color:st.color, transparency:i===0?18:48, width:0.38}
    });
    addText(slide, st.label, { x:st.x+0.08, y:st.y+0.14, w:0.48, h:0.08, fontSize:5.8, bold:true, color:i===0?C.white:'A8B3C3', align:'center', fit:'shrink' });
    if (i < stations.length - 1) addArrowLine(slide, st.x+0.72, st.y+0.20, 0.32, 0, st.color, { transparency:44, width:0.34 });
  });

  proofRows.slice(0, 3).forEach((r,i)=>{
    const y = panel.y + 3.10 + i*0.42;
    const dot = [C.cyan, C.violet, '94A3B8'][i] || C.cyan;
    slide.addShape('ellipse', { x:panel.x+0.42, y:y+0.04, w:0.08, h:0.08, fill:{color:dot}, line:{color:dot, transparency:100} });
    addText(slide, r.label || r.title || `事实 ${i + 1}`, { x:panel.x+0.64, y:y, w:1.26, h:0.12, fontSize:7.2, color:'A8B3C3', fit:'shrink' });
    addText(slide, r.value || '—', { x:panel.x+3.10, y:y-0.02, w:1.02, h:0.12, fontSize:8.4, bold:true, color:C.white, align:'right', fit:'shrink' });
    addHairline(slide, panel.x+2.02, y+0.19, 1.16, '334155', 56, 0.30);
  });
}
function drawParkCoverField(slide) {
  drawCoverBreathingCircle(slide);
}
function drawEnergyCoverField(slide, plan={}) {
  if (!plan.motionBackdrop || !addEnergyMotionBackdrop(slide)) {
    addEnergyPhotoBackdrop(slide);
  }
  addEnergyLens(slide, 7.78, 0.70, 4.50, C.accent);
}
function drawCoverBreathingCircle(slide) {
  addDarkBreathingCircle(slide, 8.30, 0.84, 4.38, 2.54);
}
function coverShowcase(slide, plan, s, industry, title) {
  const design = designForSlide(plan, s, 'cover');
  const companyIntro = isCompanyIntroPlan(plan);
  if (!design.wantsImage) return false;
  const imagePath = design.imagePath;
  if (!imagePath || !fs.existsSync(imagePath)) return false;
  stageCanvas(slide, { field:false });
  addDarkBreathingCircle(slide, 8.72, 0.62, 3.72, 2.04, C.accent);
  addCoverKicker(slide, plan, industry, { x:0.84, y:0.96, w:3.80, h:0.14, fontSize:7.0, color:C.cyan, charSpace:1.1 });
  addText(slide, title, { x:0.82, y:1.76, w:4.82, h:1.08, fontSize:typeSize('coverTitle', 29.0), bold:true, color:C.white, breakLine:true, fit:'shrink' });
  const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
  addText(slide, insight, { x:0.86, y:3.28, w:4.24, h:0.26, fontSize:10.7, color:'CBD5E1', fit:'shrink' });
  addRect(slide, 0.86, 3.78, 0.82, 0.045, C.accent, C.accent);
  addRect(slide, 1.82, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });

  addRect(slide, 6.16, 0.74, 6.22, 5.42, C.ink2, '334155', { fill:{color:C.ink2, transparency:12}, line:{color:'334155', transparency:62, width:0.45} });
  addPhotoPanel(slide, imagePath, 6.36, 0.96, 5.82, 4.64, { transparency:100, stroke:'334155', strokeTransparency:56 });
  addRect(slide, 6.36, 5.60, 5.82, 0.56, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, companyIntro ? '现场图像' : 'VISUAL EVIDENCE', { x:6.66, y:5.82, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
  const fallbackCaption = copyFallback(plan, 'fallbackCaption', companyIntro ? '产品与现场能力展示' : '');
  addText(slide, (s.visual && s.visual.caption) || fallbackCaption, { x:8.02, y:5.81, w:3.24, h:0.12, fontSize:6.8, color:'CBD5E1', fit:'shrink' });

  addDeckMeta(slide, plan, { x:0.86, y:6.34, w:5.50, h:0.16, fontSize:7.3, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.5, color:C.muted });
  return true;
}
function coverLightEditorial(slide, plan, s, industry, title) {
  const bg = surfaceFill();
  const panel = panelFill();
  const motif = presentationSpec().coverMotif || 'editorial-rule';
  const companyIntro = isCompanyIntroPlan(plan);
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);

  if (motif === 'ivory-editorial') {
    addRect(slide, 0, 0, 3.68, H, C.ink, C.ink);
    addRect(slide, 3.68, 0, 0.035, H, C.accent, C.accent, { fill:{color:C.accent, transparency:12}, line:{color:C.accent, transparency:100} });
    addLabel(slide, 'SOLID PALETTE', { x:0.78, y:0.92, w:1.68, h:0.12, fontSize:6.8, color:'A8B3C3', charSpace:1.0 });
    addText(slide, PROFILE.palette || '', { x:0.78, y:6.58, w:1.92, h:0.12, fontSize:6.8, color:'A8B3C3', fit:'shrink' });
  } else {
    addRect(slide, 0.82, 0.76, 2.42, 0.035, C.accent, C.accent);
    if (motif === 'redline-editorial') {
      addRect(slide, 0, 0, W, 0.10, C.accent, C.accent);
      addRect(slide, 8.52, 0, 0.10, H, C.accent, C.accent, { fill:{color:C.accent, transparency:16}, line:{color:C.accent, transparency:100} });
    } else if (motif === 'calm-field') {
      addLightBreathingCircle(slide, 8.92, 0.62, 3.76, C.softBlue, 34);
    } else {
      addLightBreathingCircle(slide, 8.92, 0.62, 3.76, C.softBlue, 44);
    }
  }

  const x0 = motif === 'ivory-editorial' ? 4.72 : 0.84;
  const metaColor = motif === 'ivory-editorial' ? C.muted : C.muted;
  addCoverKicker(slide, plan, industry, { x:x0, y:1.02, w:3.80, h:0.14, fontSize:7.1, color:metaColor, charSpace:1.1 });
  addText(slide, title, { x:x0, y:1.92, w:5.92, h:1.02, fontSize:typeSize('coverTitle', 31.0), bold:true, color:C.text, breakLine:true, fit:'shrink' });
  const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
  addText(slide, insight, { x:x0+0.02, y:3.34, w:5.55, h:0.20, fontSize:10.8, color:C.body, fit:'shrink' });
  addRect(slide, x0+0.02, 3.82, 0.88, 0.045, C.accent, C.accent);
  addRect(slide, x0+1.02, 3.82, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

  if (motif !== 'ivory-editorial') {
    addRect(slide, 8.98, 1.28, 2.74, 3.96, panel, C.line, { fill:{color:panel, transparency:18}, line:{color:C.line, transparency:16, width:0.45} });
    const design = designForSlide(plan, s, 'cover');
    const hasPanelImage = design.imagePath && fs.existsSync(design.imagePath);
    if (hasPanelImage) {
      addPhotoPanel(slide, design.imagePath, 8.98, 1.28, 2.74, 3.96, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:24 });
      addRect(slide, 8.98, 4.24, 2.74, 1.00, panel, panel, { fill:{color:panel, transparency:10}, line:{color:panel, transparency:100} });
      addLabel(slide, companyIntro ? '现场图像' : 'VISUAL PROOF', { x:9.24, y:4.58, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
      const imageCaption = copyFallback(plan, 'fallbackCaption');
      addText(slide, (s.visual && s.visual.caption) || imageCaption, { x:9.24, y:4.82, w:1.88, h:0.15, fontSize:7.4, color:C.body, fit:'shrink' });
    } else {
      addText(slide, '01', { x:9.28, y:1.64, w:0.44, h:0.18, fontSize:10, bold:true, color:C.accent });
      addText(slide, s.coverProofTitle || plan.coverProofTitle || copyFallback(plan, 'coverProofTitle'), { x:9.28, y:2.20, w:1.78, h:0.18, fontSize:11.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, s.coverProof || plan.coverProof || insight || copyFallback(plan, 'coverProof'), { x:9.28, y:2.80, w:1.74, h:0.52, fontSize:7.6, color:C.body, breakLine:true, fit:'shrink' });
    }
  }

  addDeckMeta(slide, plan, { x:x0+0.02, y:6.38, w:5.70, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:typeSize('caption', 7.4), color:C.muted });
}
function coverDark(slide, plan, s) {
  masterDark(slide, plan, '', null, '', { field:false });
  const coverVariant = variantOf(s, '');
  if (coverVariant === 'beauty-brand-editorial-cover') return beautyBrandEditorialCover(slide, plan, s);
  if (coverVariant === 'airy-concept-opening') return airyConceptOpening(slide, plan, s);
  const industry = industryProfile(plan);
  const rawTitle = String(s.title || plan.title || '');
  const title = plan.industry === 'energy-utility' ? rawTitle.replace(/\n/g, '') : coverTitleText(rawTitle);
  const coverDesign = designForSlide(plan, s, 'cover');
  const coverTone = presentationSpec().coverTone || 'dark';
  const hasCoverImage = coverDesign.imagePath && fs.existsSync(coverDesign.imagePath);
  if (plan.industry === 'finance-investment' && plan.visualIntent === 'case-led' && hasCoverImage) {
    if (coverShowcase(slide, plan, s, industry, title)) return;
  }
  if (plan.industry !== 'energy-utility' && (coverTone === 'light' || coverTone === 'split')) {
    return coverLightEditorial(slide, plan, s, industry, title);
  }
  if (plan.industry !== 'energy-utility' && coverDesign.imageRole !== 'background' && coverShowcase(slide, plan, s, industry, title)) {
    return;
  }
  const genericPhotoCover = plan.industry !== 'energy-utility' && addVisualPhotoBackdrop(slide, plan, s, 'cover', { transparency:70 });
  if (!genericPhotoCover) {
    industry.coverField(slide, plan);
  } else {
    addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
  }

  if (plan.industry === 'energy-utility') {
    const [primaryTitle, secondaryTitle] = splitEnergyTitle(title);
    addCoverKicker(slide, plan, industry, { x:0.86, y:1.10, w:3.8, h:0.16, fontSize:7.6, color:C.cyan, charSpace:1.15 });
    if (secondaryTitle) {
      addText(slide, primaryTitle, { x:0.84, y:2.02, w:5.15, h:0.58, fontSize:typeSize('coverHeroTitle', 41.0), bold:true, color:C.white, fit:'shrink', breakLine:false });
      addText(slide, secondaryTitle, { x:0.88, y:2.78, w:5.80, h:0.42, fontSize:24.5, bold:true, color:C.white, fit:'shrink', breakLine:false });
    } else {
      addText(slide, title, { x:0.84, y:2.30, w:7.25, h:0.62, fontSize:typeSize('coverTitle', 33.0), bold:true, color:C.white, fit:'shrink', breakLine:false });
    }
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    addText(slide, insight, { x:0.88, y:3.48, w:5.85, h:0.22, fontSize:11.2, color:'CBD5E1', fit:'shrink' });
    addRect(slide, 0.88, 3.92, 0.82, 0.035, C.accent, C.accent);
    addRect(slide, 1.82, 3.92, 0.34, 0.035, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });
    addDeckMeta(slide, plan, { x:0.88, y:6.24, w:7.3, h:0.16, fontSize:7.8, color:'CBD5E1', fit:'shrink' });
    return;
  }

  addCoverKicker(slide, plan, industry, { x:0.92, y:1.18, w:3.8, h:0.16, fontSize:8.6, color:C.cyan, charSpace:1.1 });
  addText(slide, title, { x:0.88, y:2.05, w:6.55, h:1.08, fontSize:typeSize('coverTitle', 31.0), bold:true, color:C.white, breakLine:true, fit:'shrink' });
  const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
  addText(slide, insight, { x:0.92, y:3.36, w:5.7, h:0.20, fontSize:11.5, color:'CBD5E1', fit:'shrink' });
  addHairline(slide, 0.92, 3.78, 0.82, C.accent, 0, 0.65);
  addHairline(slide, 1.86, 3.78, 0.34, C.cyan, 38, 0.50);
  addDeckMeta(slide, plan, { x:0.92, y:6.30, w:7.1, h:0.16, fontSize:8.2, color:'CBD5E1' });
}

function beautyBrandEditorialCover(slide, plan, s) {
  lightCanvas(slide);
  addLabel(slide, 'BEAUTY BRAND WORLD', { x:0.86, y:0.48, w:2.00, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
  addText(slide, s.title || plan.title || copyFallback(plan, 'coverTitle'), {
    x:0.84, y:1.54, w:5.40, h:0.84, fontSize:typeSize('coverTitle', 30.0), bold:true, color:C.text, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || s.coverInsight || plan.subtitle || copyFallback(plan, 'industryInsight'), {
    x:0.86, y:2.70, w:4.62, h:0.30, fontSize:11.0, color:C.body, fit:'shrink'
  });
  addRect(slide, 0.88, 3.28, 0.86, 0.05, C.accent, C.accent);
  addRect(slide, 1.88, 3.28, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

  const imagePath = designForSlide(plan, s, 'cover').imagePath;
  const hero = { x:6.46, y:1.16, w:4.92, h:3.86 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  if (imagePath && fs.existsSync(imagePath)) {
    addPhotoPanel(slide, imagePath, hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.56, { tone:'light', transparency:88, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
  } else {
    genericShowcaseField(slide, hero.x+0.22, hero.y+0.24, hero.w-0.44, 2.50, 'PRODUCT TEXTURE');
  }
  addRect(slide, hero.x, hero.y+hero.h-0.98, hero.w, 0.98, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PRODUCT · TEXTURE · PROOF', { x:hero.x+0.30, y:hero.y+hero.h-0.64, w:1.72, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
  addText(slide, (s.visual && s.visual.caption) || copyFallback(plan, 'fallbackCaption'), {
    x:hero.x+0.30, y:hero.y+hero.h-0.36, w:3.50, h:0.14, fontSize:7.5, color:'CBD5E1', fit:'shrink'
  });

  const proof = Array.isArray(s.coverIndex) ? s.coverIndex : (Array.isArray(plan.coverIndex) ? plan.coverIndex : []);
  proof.slice(0, 3).forEach((row, i) => {
    const item = Array.isArray(row) ? row : [itemTitle(row), itemBody(row)];
    const y = 4.22 + i * 0.54;
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
    addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.92, y:y+0.04, w:0.30, h:0.10, fontSize:6.5, color:accent });
    addText(slide, item[0], { x:1.38, y, w:0.98, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
    addText(slide, item[1], { x:2.76, y, w:2.56, h:0.14, fontSize:7.5, color:C.body, fit:'shrink' });
  });
  addDeckMeta(slide, plan, { x:0.88, y:6.36, w:5.50, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.6, color:C.muted });
}

function airyConceptOpening(slide, plan, s) {
  lightCanvas(slide);
  const imagePath = designForSlide(plan, s, 'cover').imagePath;
  addLabel(slide, 'CONCEPT OPENING', { x:0.88, y:0.92, w:1.62, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
  addText(slide, s.title || plan.title || copyFallback(plan, 'coverTitle'), {
    x:0.86, y:1.70, w:6.52, h:0.86, fontSize:typeSize('coverTitle', 31.0), bold:true, color:C.text, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || s.coverInsight || plan.subtitle || copyFallback(plan, 'industryInsight'), {
    x:0.90, y:2.86, w:4.88, h:0.22, fontSize:11.0, color:C.body, fit:'shrink'
  });
  addRect(slide, 0.92, 3.44, 0.92, 0.04, C.accent, C.accent);
  addRect(slide, 2.00, 3.44, 0.32, 0.04, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });

  const object = { x:7.70, y:1.28, w:2.78, h:2.78 };
  slide.addShape('ellipse', { x:object.x-0.54, y:object.y-0.54, w:object.w+1.08, h:object.h+1.08, fill:{color:C.softBlue || 'EFF6FF', transparency:34}, line:{color:C.softBlue || 'EFF6FF', transparency:100} });
  addRect(slide, object.x, object.y, object.w, object.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.44} });
  if (imagePath && fs.existsSync(imagePath)) {
    addPhotoPanel(slide, imagePath, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:28, fit:'cover' });
  } else {
    genericShowcaseField(slide, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, 'CORE OBJECT');
  }
  addLabel(slide, 'ONE OBJECT', { x:7.82, y:4.52, w:0.98, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.8 });
  addText(slide, (s.visual && s.visual.caption) || copyFallback(plan, 'fallbackCaption'), { x:8.98, y:4.48, w:1.86, h:0.12, fontSize:7.4, color:C.body, fit:'shrink' });

  const proof = s.coverProof || s.note || copyFallback(plan, 'coverProof');
  addRect(slide, 0.92, 5.46, 7.20, 0.48, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
  addLabel(slide, 'PROOF DIRECTION', { x:1.16, y:5.63, w:1.30, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.7 });
  addText(slide, proof, { x:2.82, y:5.60, w:4.64, h:0.12, fontSize:7.8, color:C.body, fit:'shrink' });
  addDeckMeta(slide, plan, { x:0.90, y:6.42, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.6, color:C.muted });
}
function energyToc(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  const useImage = slideWantsImage(plan, s, 'navigation');
  if (useImage) {
    addVisualPhotoPanel(slide, plan, s, 'navigation', 0, 5.58, W, 1.28, { transparency:44 });
  } else {
    addRect(slide, 0, 5.58, W, 1.28, C.ink2, C.ink2, { fill:{color:C.ink2, transparency:28}, line:{color:C.ink2, transparency:100} });
    if (hasEnergyCurveSemantics(s)) addPulseCurve(slide, 1.02, 5.90, 5.36, 0.36, C.cyan, true, { transparency:66, width:0.36, nodes:false });
  }
  addDarkBreathingCircle(slide, 10.36, 0.36, 2.48, 1.22, C.accent);
  addLabel(slide, 'OPERATING SEQUENCE', { x:0.84, y:0.72, w:1.72, h:0.14, fontSize:7.0, color:'64748B', charSpace:1.15 });
  addText(slide, s.title || '电站运行路径', { x:0.82, y:1.14, w:3.35, h:0.36, fontSize:24, bold:true, color:C.white });
  addText(slide, '不是目录清单，而是一条从站点接入到区域复盘的运营路径。', { x:0.84, y:1.68, w:4.92, h:0.18, fontSize:9.0, color:'94A3B8', fit:'shrink' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

  addText(slide, '02', { x:0.72, y:2.12, w:1.52, h:0.58, fontSize:42, bold:true, color:'13213A', fit:'shrink' });
  const items = (s.items || []).slice(0,5);
  const chapterLabels = ['多站资产背景', '集中运维升级', '架构与数据流转', '试点区域推广', '价值与保障'];
  const stages = [
    ['01', '接入', '资产与设备'],
    ['02', '监测', '运行与告警'],
    ['03', '闭环', '工单与策略'],
    ['04', '推广', '区域化运维'],
    ['05', '复盘', '价值与保障']
  ];
  const startX = 1.02;
  const y = 3.03;
  const gap = 0.17;
  const cardW = 2.16;
  addHairline(slide, startX+0.18, y+1.08, 9.90, '334155', 34, 0.58);
  stages.forEach((st,i)=>{
    const x = startX + i*(cardW+gap);
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    const active = i === 0;
    addRect(slide, x, y, cardW, 1.44, active ? C.ink : C.ink2, active ? C.accent : '334155', {
      fill:{ color:active ? C.ink : C.ink2, transparency:active ? 4 : 36 },
      line:{ color:active ? C.accent : '334155', transparency:active ? 24 : 62, width:0.44 }
    });
    slide.addShape('ellipse', { x:x+0.22, y:y+0.22, w:0.10, h:0.10, fill:{color:accent}, line:{color:accent, transparency:100} });
    addNumber(slide, st[0], { x:x+0.42, y:y+0.17, w:0.36, h:0.10, typeRole:'number', fontSize:7.0, color:accent });
    addText(slide, st[1], { x:x+0.22, y:y+0.54, w:0.86, h:0.18, typeRole:'cardTitle', fontSize:11.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, st[2], { x:x+0.22, y:y+0.86, w:1.20, h:0.13, typeRole:'caption', fontSize:7.8, color:'7C8BA3', fit:'shrink' });
    addText(slide, chapterLabels[i] || items[i] || '', { x:x+0.22, y:y+1.08, w:1.58, h:0.16, typeRole:'bodySmall', fontSize:8.8, bold:active, color:active?C.white:'CBD5E1', fit:'shrink' });
    if (i < stages.length - 1) {
      slide.addShape('line', { x:x+cardW+0.03, y:y+0.72, w:gap+0.10, h:0, line:{color:'334155', transparency:30, width:0.40, endArrowType:'triangle'} });
    }
  });
  addLabel(slide, 'SITE · DATA · ALARM · DISPATCH · VALUE', { x:7.94, y:6.18, w:3.28, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'94A3B8', charSpace:0.8, align:'right' });
  addEnergyFooter(slide, plan, true);
}
function executiveBlock(slide, title, body, x, y, w, h, accent=C.accent) {
  // Premium business object: almost-flat surface, very light border, micro token only.
  addRect(slide, x, y, w, h, C.white, 'E8EEF6', { line:{color:'E8EEF6', transparency:8, width:0.65} });
  slide.addShape('ellipse', { x:x+0.24, y:y+0.24, w:0.075, h:0.075, fill:{color:accent, transparency:8}, line:{color:accent, transparency:100} });
  addText(slide, title, { x:x+0.44, y:y+0.17, w:w-0.64, h:0.22, fontSize:13.4, bold:true, color:C.text });
  addText(slide, body, { x:x+0.24, y:y+0.66, w:w-0.48, h:h-0.82, fontSize:10.8, color:C.body, valign:'top', breakLine:false });
}
function keyTile(slide, title, body, x, y, w, h, num, accent=C.ink) {
  addRect(slide, x, y, w, h, 'F7F9FC', 'E1E8F0');
  addText(slide, num ? String(num).padStart(2,'0') : '', { x:x+0.24, y:y+0.22, w:0.52, h:0.22, fontSize:12, bold:true, color:accent });
  addText(slide, title, { x:x+0.24, y:y+0.72, w:w-0.48, h:0.28, fontSize:17.5, bold:true, color:C.ink });
  addText(slide, body, { x:x+0.24, y:y+1.22, w:w-0.48, h:h-1.38, fontSize:11.8, color:C.body, valign:'top' });
}
function itemTitle(v, fallback='') {
  if (typeof v === 'string') return v;
  return (v && (v.title || v.label || v.name || v.value)) || fallback;
}
function itemBody(v, fallback='') {
  if (typeof v === 'string') return '';
  return (v && (v.body || v.note || v.text || v.description)) || fallback;
}
function hasEllipsisText(text='') {
  return /(?:\.{3,}|…)/.test(String(text || ''));
}
function stripEllipsisText(text='') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*(?:\.{3,}|…)\s*$/g, '')
    .trim();
}
function itemBodyNoEllipsis(v, fallback='') {
  const raw = itemBody(v, '');
  if (!raw || hasEllipsisText(raw)) return fallback;
  return raw;
}
function compactEvidenceCaption(text='', maxChars=30) {
  return stripEllipsisText(text);
}
function addEvidenceCaptionStack(slide, item, fallbackTitle, box, opts={}) {
  const accent = opts.accent || C.accent;
  const hasNumber = opts.number != null && opts.number !== false;
  const numberW = hasNumber ? 0.34 : 0;
  const gap = hasNumber ? 0.14 : 0;
  if (hasNumber) {
    addNumber(slide, String(opts.number).padStart(2, '0'), {
      x:box.x,
      y:box.y + (opts.numberY || 0.08),
      w:0.30,
      h:0.10,
      fontSize:opts.numberSize || 6.6,
      color:accent
    });
  }
  const textX = box.x + numberW + gap;
  const textW = Math.max(1.15, box.w - numberW - gap);
  addText(slide, itemTitle(item, fallbackTitle), {
    x:textX,
    y:box.y + (opts.titleY || 0.02),
    w:textW,
    h:opts.titleH || 0.15,
    fontSize:opts.titleSize || 9.2,
    bold:true,
    color:opts.titleColor || C.text,
    fit:'shrink'
  });
  const rawBody = String(itemBody(item) || '').replace(/\s+/g, ' ').trim();
  const body = opts.dropLongBody && rawBody.length > (opts.maxBodyChars || 30)
    ? ''
    : compactEvidenceCaption(rawBody, opts.maxBodyChars || 30);
  if (body) {
    addText(slide, body, {
      x:textX,
      y:box.y + (opts.bodyY || 0.36),
      w:textW,
      h:opts.bodyH || 0.22,
      fontSize:opts.bodySize || 8.0,
      color:opts.bodyColor || C.body,
      fit:'shrink',
      breakLine:true
    });
  }
}
function variantOf(s, fallback='') {
  return s.layoutVariant || s.variant || fallback;
}
function genericShowcaseField(slide, x, y, w, h, label='PRODUCT SYSTEM') {
  addRect(slide, x, y, w, h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addDarkBreathingCircle(slide, x+w*0.44, y+h*0.12, Math.min(w, h)*0.86, Math.min(w, h)*0.48, C.accent);
  addPulseCurve(slide, x+w*0.16, y+h*0.62, w*0.58, h*0.14, C.cyan, true, { transparency:50, width:0.38, nodes:false });
  addLabel(slide, label, { x:x+0.32, y:y+h-0.46, w:w-0.64, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
}
function energySituationEditorial(slide, plan, s, idx) {
  slide.background = { color:'F7FAFD' };
  addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
  const useImage = slideWantsImage(plan, s, 'situation');
  if (useImage) {
    addVisualPhotoPanel(slide, plan, s, 'situation', 0, 0, 4.82, H, { transparency:36, stroke:'334155', strokeTransparency:78 });
  }
  addRect(slide, 0, 0, 4.82, H, C.ink, C.ink, { fill:{color:C.ink, transparency:18}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'SITE READOUT', { x:0.78, y:0.76, w:1.36, h:0.12, fontSize:6.8, color:'94A3B8', charSpace:1.1 });
  addText(slide, s.title || '多站点能源资产运营背景', { x:0.76, y:1.18, w:3.18, h:0.62, typeRole:'pageTitle', fontSize:22.5, bold:true, color:C.white, fit:'shrink', breakLine:true });
  addText(slide, s.leftTitle || '管理现状', { x:0.82, y:2.28, w:1.36, h:0.18, fontSize:10.6, bold:true, color:'CBD5E1' });
  (s.left || []).slice(0,3).forEach((it,i)=>{
    const y = 2.78 + i*0.78;
    const accent = i===1 ? C.cyan : C.accent;
    slide.addShape('ellipse', { x:0.86, y:y+0.07, w:0.07, h:0.07, fill:{color:accent}, line:{color:accent, transparency:100} });
    addText(slide, it, { x:1.08, y:y, w:2.80, h:0.34, typeRole:'bodySmall', fontSize:8.8, color:'CBD5E1', fit:'shrink', breakLine:true, valign:'mid' });
  });
  addHairline(slide, 0.82, 5.62, 1.06, C.accent, 0, 0.65);
  addLabel(slide, 'BESS · PV · MICROGRID', { x:0.82, y:5.92, w:2.18, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'7C8BA3', charSpace:0.7 });

  addLabel(slide, 'UPGRADE DEMANDS', { x:5.62, y:0.72, w:1.48, h:0.12, typeRole:'kicker', fontSize:6.8, color:C.muted, charSpace:1.0 });
  addText(slide, s.rightTitle || '升级诉求', { x:5.58, y:1.10, w:3.0, h:0.30, fontSize:22.0, bold:true, color:C.text });
  addText(slide, '把设备数据、运行状态和策略复盘收束成同一套管理视图。', { x:5.60, y:1.56, w:4.80, h:0.18, typeRole:'bodySmall', fontSize:8.8, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.68, w:0.72, h:0.20, fontSize:12.6, color:C.accent, align:'right' });

  (s.cards || []).slice(0,3).forEach((c,i)=>{
    const y = 2.20 + i*1.22;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, 5.58, y, 5.86, 0.94, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.54} });
    addRect(slide, 5.58, y, 0.05, 0.94, accent, accent, { line:{color:accent, transparency:100} });
    addText(slide, String(i+1).padStart(2,'0'), { x:5.90, y:y+0.35, w:0.34, h:0.12, typeRole:'number', fontSize:7.0, bold:true, color:accent, valign:'mid' });
    addText(slide, c.title, { x:6.46, y:y+0.22, w:1.72, h:0.17, typeRole:'cardTitle', fontSize:12.0, bold:true, color:C.text, fit:'shrink', valign:'mid' });
    addText(slide, c.body, { x:8.24, y:y+0.18, w:2.70, h:0.36, typeRole:'bodySmall', fontSize:8.8, color:C.body, fit:'shrink', valign:'mid' });
  });

  addRect(slide, 5.58, 6.03, 5.86, 0.42, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'DESIGN PRINCIPLE', { x:5.88, y:6.16, w:1.20, h:0.12, typeRole:'microLabel', fontSize:6.8, color:C.accent, charSpace:0.7 });
  addText(slide, '先统一运行事实，再设计调度闭环。', { x:7.22, y:6.12, w:2.72, h:0.16, typeRole:'caption', fontSize:8.4, bold:true, color:'CBD5E1', fit:'shrink' });
  addEnergyFooter(slide, plan, false);
}
function energyProblemSplit(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  addDarkBreathingCircle(slide, 8.62, 0.66, 3.94, 2.10, C.violet);
  const useImage = slideWantsImage(plan, s, 'split');
  if (useImage) {
    addVisualPhotoPanel(slide, plan, s, 'split', 8.80, 0.98, 3.34, 5.24, { transparency:46, stroke:'334155', strokeTransparency:62 });
    addRect(slide, 8.80, 4.84, 3.34, 1.38, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
  } else {
    addRect(slide, 8.80, 0.98, 3.34, 5.24, C.ink2, '334155', { fill:{color:C.ink2, transparency:46}, line:{color:'334155', transparency:68, width:0.36} });
    addEnergyLens(slide, 8.94, 1.26, 2.94, C.cyan, { showCurve:hasEnergyCurveSemantics(s) });
  }
  addLabel(slide, 'OPERATING BREAKPOINTS', { x:0.84, y:0.72, w:1.90, h:0.12, typeRole:'kicker', fontSize:6.8, color:'64748B', charSpace:1.05 });
  addText(slide, s.title || '从分散巡检到集中运维', { x:0.82, y:1.08, w:5.55, h:0.36, typeRole:'pageTitle', fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.intro) addText(slide, s.intro, { x:0.84, y:1.56, w:5.72, h:0.20, typeRole:'bodySmall', fontSize:9.0, color:'94A3B8', fit:'shrink' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

  addRect(slide, 0.90, 2.20, 7.24, 0.52, C.ink2, '334155', { fill:{color:C.ink2, transparency:54}, line:{color:'334155', transparency:64, width:0.36} });
  addLabel(slide, 'FROM', { x:1.18, y:2.39, w:0.56, h:0.11, fontSize:6.8, bold:true, color:'64748B', charSpace:0.45 });
  addText(slide, '分散巡检', { x:1.72, y:2.34, w:1.16, h:0.12, fontSize:8.4, bold:true, color:'CBD5E1' });
  addHairline(slide, 3.06, 2.46, 1.66, C.accent, 42, 0.38);
  addLabel(slide, 'TO', { x:5.04, y:2.39, w:0.32, h:0.11, fontSize:6.8, bold:true, color:C.cyan, charSpace:0.45 });
  addText(slide, '集中运维闭环', { x:5.44, y:2.34, w:1.62, h:0.12, fontSize:8.4, bold:true, color:C.white });

  const cards = s.cards || [];
  const pos = [[0.92,3.16],[4.18,3.16],[0.92,4.60],[4.18,4.60]];
  cards.slice(0,4).forEach((c,i)=>{
    const [x,y] = pos[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, 2.90, 1.00, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?18:36}, line:{color:accent, transparency:i===0?24:58, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:y+0.22, w:0.32, h:0.10, fontSize:6.8, color:accent });
    addText(slide, c.title, { x:x+0.70, y:y+0.17, w:1.62, h:0.16, fontSize:11.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, c.body, { x:x+0.24, y:y+0.52, w:2.34, h:0.30, typeRole:'bodySmall', fontSize:8.8, color:'A8B3C3', fit:'shrink' });
  });
  addLabel(slide, 'FIELD SIGNAL', { x:9.12, y:5.16, w:1.18, h:0.11, fontSize:6.8, color:'7C8BA3', charSpace:0.45 });
  addText(slide, '设备状态进入同一张运行图', { x:9.12, y:5.50, w:1.98, h:0.18, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
  if (hasEnergyCurveSemantics(s)) addPulseCurve(slide, 9.12, 5.82, 2.10, 0.28, C.cyan, true, { transparency:46, width:0.36, nodes:false });
  addEnergyFooter(slide, plan, true);
}
function executiveBlocks(slide, plan, s, idx) {
  // Premium content page: real stage composition, not plain gray background + four web cards.
  slide.background = { color:C.paper };
  addRect(slide, 0, 0, W, H, C.paper, C.paper);
  slide.addShape('ellipse', { x:9.58, y:0.42, w:3.45, h:3.45, fill:{color:C.softBlue, transparency:50}, line:{color:C.softBlue, transparency:100} });
  if (!addVisualPhotoPanel(slide, plan, s, 'split', 0, 0, 4.25, H, { transparency:66 })) {
    addRect(slide, 0, 0, 4.25, H, C.ink, C.ink);
  }
  addText(slide, `0${idx || ''}`, { x:0.62, y:0.62, w:0.48, h:0.18, fontSize:9, color:C.accent, charSpace:1.1 });
  addText(slide, 'OPERATING MODEL', { x:0.62, y:1.08, w:2.1, h:0.15, fontSize:7.8, color:C.cyan, charSpace:1.0 });
  addText(slide, premiumTitle(s.title || ''), { x:0.60, y:1.58, w:3.05, h:0.92, fontSize:23.5, bold:true, color:C.white, breakLine:true, fit:'shrink' });
  addHairline(slide, 0.62, 2.85, 0.72, C.accent, 0, 0.75);
  if (s.intro) addText(slide, s.intro, { x:0.62, y:3.28, w:2.95, h:0.55, fontSize:10.8, color:'CBD5E1', breakLine:true, valign:'top' });
  addText(slide, footerText(plan), { x:0.62, y:6.86, w:2.6, h:0.14, fontSize:7.5, color:C.muted });

  addText(slide, '关键问题拆解', { x:4.92, y:0.76, w:2.8, h:0.25, fontSize:15.5, bold:true, color:C.text });
  addText(slide, '围绕运营底座、流程协同、服务响应和数据洞察形成升级重点。', { x:4.94, y:1.15, w:5.7, h:0.18, fontSize:9.2, color:C.muted });
  addHairline(slide, 4.94, 1.55, 7.55, C.line, 12, 0.6);

  const cards = s.cards || [];
  const x0 = 4.90, y0 = 2.02, w = 3.62, h = 1.72;
  cards.slice(0,4).forEach((c,i)=>{
    const x = x0 + (i%2)*4.10;
    const y = y0 + Math.floor(i/2)*2.00;
    addRect(slide, x, y, w, h, C.white, 'E8EEF6', { line:{color:'E8EEF6', transparency:6, width:0.65} });
    addText(slide, String(i+1).padStart(2,'0'), { x:x+0.28, y:y+0.25, w:0.42, h:0.16, fontSize:8.8, bold:true, color:i===0?C.accent:C.muted });
    addText(slide, c.title, { x:x+0.28, y:y+0.62, w:w-0.56, h:0.24, fontSize:15.0, bold:true, color:C.text });
    addText(slide, c.body, { x:x+0.28, y:y+1.06, w:w-0.56, h:0.40, fontSize:9.8, color:C.body, valign:'top' });
    if (i===0) addHairline(slide, x+0.28, y+1.48, 0.72, C.accent, 0, 0.75);
  });
}

function formatMetricDelta(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  return text
    .replace(/^\+(\d+(?:\.\d+)?)\s*pt$/i, '提升 $1 个百分点')
    .replace(/^\+(\d+(?:\.\d+)?)\s*pts$/i, '提升 $1 个百分点')
    .replace(/^\+(\d+(?:\.\d+)?)%$/i, '提升 $1%');
}

function brandWorldBusinessProof(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'BRAND WORLD / BUSINESS PROOF', 0.86, 0.72, false);
  addText(slide, s.title || '品牌世界观与经营证据', { x:0.84, y:1.05, w:6.2, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '品牌主张、产品承诺和业务证据必须在同一页相互解释。', { x:0.86, y:1.52, w:7.1, h:0.20, fontSize:9.6, color:C.muted, fit:'shrink' });
  PageNumber(slide, idx);
  const images = galleryImages(plan, s);
  const logic = s.businessLogic || {};
  const metrics = (s.metrics || []).slice(0, 3);
  const cards = (s.cards || s.items || []).slice(0, 3);
  const drivers = (s.drivers && s.drivers.length ? s.drivers : [
    { title: metrics[0] ? `${metrics[0].value} ${metrics[0].label || ''}`.trim() : 'Global footprint' },
    { title: 'Global prestige footprint' },
    { title: 'Hero franchise memory' }
  ]).slice(0, 3);
  const actions = (s.actions && s.actions.length ? s.actions : [
    { title: 'Use ULTIMUNE as spine' },
    { title: 'Connect SKU proof' },
    { title: 'Source-bound story' }
  ]).slice(0, 3);
  const outcomes = (s.outcomes && s.outcomes.length ? s.outcomes : [
    { title: 'Operating priority' },
    { title: 'Measurement system' },
    { title: 'Regional growth review' }
  ]).slice(0, 3);
  const hero = { x:0.92, y:2.04, w:4.72, h:4.02 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.70, { tone:'light', transparency:92, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
  else genericShowcaseField(slide, hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.70, 'BRAND WORLD');
  addLabel(slide, 'BRAND WORLD', { x:hero.x+0.30, y:hero.y+3.16, w:1.16, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
  addText(slide, s.brandPromise || itemTitle(drivers[0], '产品承诺'), { x:hero.x+0.30, y:hero.y+3.46, w:1.70, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.note || '视觉主张必须能连接到会员、渠道或连带购买。', {
    x:hero.x+2.34, y:hero.y+3.36, w:1.86, h:0.30,
    fontSize:8.0, color:C.captionOnImage, breakLine:true, fit:false
  });

  const board = { x:6.18, y:2.04, w:5.26, h:4.02 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
  [
    { label:'BRAND SIGNAL', items:drivers, color:C.accent, fallback:'品牌主张' },
    { label:'OPERATING ACTION', items:actions, color:C.cyan, fallback:'经营动作' },
    { label:'BUSINESS PROOF', items:outcomes, color:C.violet, fallback:'业务结果' }
  ].forEach((group, i) => {
    const y = board.y + 0.42 + i * 1.08;
    addLabel(slide, group.label, { x:board.x+0.28, y, w:1.52, h:0.10, fontSize:6.8, color:group.color, charSpace:0.65 });
    group.items.slice(0, 3).forEach((item, j) => {
      const x = board.x + 0.30 + j * 1.52;
      addRect(slide, x, y+0.34, 1.14, 0.42, j===0 ? C.ink : 'FFFFFF', C.line, { fill:{color:j===0?C.ink:'FFFFFF', transparency:j===0?0:0}, line:{color:j===0?group.color:C.line, transparency:j===0?22:18, width:0.30} });
      addText(slide, itemTitle(item, `${group.fallback}${j+1}`), {
        x:x+0.08, y:y+0.42, w:0.98, h:0.22,
        fontSize:7.2, bold:j===0, color:j===0?C.white:C.text, fit:false, align:'center', valign:'mid', breakLine:true
      });
    });
  });
  addRect(slide, 0.92, 6.28, 8.76, 0.34, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:12}, line:{color:C.line, transparency:100} });
  addLabel(slide, 'PROOF LINK', { x:1.16, y:6.39, w:0.94, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
  addText(slide, '品牌世界观必须解释产品承诺如何转成渠道、会员和复购证据。', { x:2.32, y:6.37, w:6.64, h:0.11, fontSize:7.4, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function valueCreationProcessMapSlide(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'VALUE CREATION PROCESS', 0.86, 0.72, false);
  addText(slide, s.title || '价值创造链路', { x:0.84, y:1.05, w:6.0, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '把投入、活动、产出和结果放在一条可验证流向上。', { x:0.86, y:1.52, w:6.8, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const lanes = [
    { label:'INPUT', title:s.leftTitle || '关键投入', items:s.drivers || s.inputs || [], color:C.accent },
    { label:'ACTIVITY', title:s.centerTitle || '经营动作', items:s.actions || s.capabilities || [], color:C.cyan },
    { label:'OUTPUT', title:s.outputTitle || '直接产出', items:s.outputs || s.outputItems || (s.actions || []).slice(0, 3), color:C.violet },
    { label:'OUTCOME', title:s.rightTitle || '长期结果', items:s.outcomes || s.results || [], color:C.muted }
  ];
  const board = { x:0.92, y:2.12, w:10.64, h:3.82 };
  const laneW = 2.30;
  const connectors = [];
  lanes.forEach((lane, i) => {
    const x = board.x + i * 2.72;
    addRect(slide, x, board.y, laneW, board.h, i === 1 ? C.ink : panelFill(), i === 1 ? C.ink : C.line, {
      fill:{color:i === 1 ? C.ink : panelFill(), transparency:i === 1 ? 0 : 0},
      line:{color:i === 1 ? C.ink : C.line, transparency:i === 1 ? 100 : 14, width:0.46}
    });
    addRect(slide, x, board.y, laneW, 0.06, lane.color, lane.color, { line:{color:lane.color, transparency:100} });
    addLabel(slide, lane.label, { x:x+0.22, y:board.y+0.30, w:1.04, h:0.10, fontSize:6.8, color:lane.color, charSpace:0.7 });
    addText(slide, lane.title, { x:x+0.22, y:board.y+0.70, w:1.34, h:0.16, fontSize:10.2, bold:true, color:i === 1 ? C.white : C.text, fit:'shrink' });
    (lane.items || []).slice(0, 3).forEach((it, j) => {
      const y = board.y + 1.28 + j * 0.58;
      addNumber(slide, String(j + 1).padStart(2, '0'), { x:x+0.22, y:y+0.02, w:0.30, h:0.09, fontSize:6.8, color:lane.color });
      addText(slide, itemTitle(it, `要素 ${j + 1}`), { x:x+0.62, y:y, w:1.14, h:0.12, fontSize:8.0, bold:true, color:i === 1 ? C.white : C.text, fit:'shrink' });
      const body = itemBody(it);
      if (body) addText(slide, body, { x:x+0.62, y:y+0.24, w:1.22, h:0.12, fontSize:6.8, color:i === 1 ? 'CBD5E1' : C.body, fit:'shrink' });
    });
    if (i < lanes.length - 1) connectors.push({ x:x + laneW + 0.08, y:board.y+1.94, color:lane.color });
  });
  connectors.forEach(conn => addArrowLine(slide, conn.x, conn.y, 0.24, 0, conn.color, { transparency:20, width:0.46 }));
  addRect(slide, 0.92, 6.26, 9.26, 0.36, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:12}, line:{color:C.line, transparency:100} });
  addLabel(slide, 'PROOF NOTE', { x:1.16, y:6.38, w:1.02, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
  addText(slide, s.note || '价值流向必须能说明投入如何变成经营结果。', { x:2.38, y:6.36, w:7.06, h:0.11, fontSize:7.6, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function singleObjectConceptMapSlide(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  sectionKicker(slide, 'SINGLE OBJECT MAP', 0.84, 0.72, true);
  addText(slide, s.title || '单对象概念图', { x:0.82, y:1.06, w:5.90, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '围绕一个核心对象组织能力、约束和结果。', { x:0.84, y:1.54, w:5.70, h:0.20, fontSize:9.8, color:C.captionOnImage, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  const center = { x:5.14, y:2.54, w:2.34, h:1.32 };
  addDarkBreathingCircle(slide, 4.46, 1.90, 3.70, 2.20, C.accent);
  addRect(slide, center.x, center.y, center.w, center.h, C.ink, C.accent, { fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:18, width:0.62} });
  addLabel(slide, 'CORE OBJECT', { x:center.x+0.48, y:center.y+0.30, w:1.10, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.8, align:'center' });
  addText(slide, s.centerTitle || '核心对象', { x:center.x+0.34, y:center.y+0.64, w:1.66, h:0.18, fontSize:11.6, bold:true, color:C.white, align:'center', fit:'shrink' });
  const nodes = [
    ...(s.drivers || []).slice(0, 3).map(v => ({ title:itemTitle(v), body:itemBody(v), role:'force' })),
    ...(s.actions || s.capabilities || []).slice(0, 2).map(v => ({ title:itemTitle(v), body:itemBody(v), role:'action' })),
    ...(s.outcomes || []).slice(0, 1).map(v => ({ title:itemTitle(v), body:itemBody(v), role:'outcome' }))
  ].slice(0, 6);
  const positions = [
    { x:1.08, y:2.18, color:C.accent },
    { x:2.96, y:4.88, color:C.cyan },
    { x:7.88, y:1.92, color:C.violet },
    { x:9.42, y:4.54, color:C.accent },
    { x:5.02, y:5.30, color:C.cyan },
    { x:1.32, y:4.02, color:'94A3B8' }
  ];
  nodes.forEach((node, i) => {
    const pos = positions[i];
    slide.addShape('line', { x:center.x+center.w/2, y:center.y+center.h/2, w:pos.x+0.86-(center.x+center.w/2), h:pos.y+0.38-(center.y+center.h/2), line:{color:pos.color, transparency:62, width:0.34} });
    addRect(slide, pos.x, pos.y, 1.72, 0.76, C.ink2, '334155', { fill:{color:C.ink2, transparency:i === 0 ? 16 : 36}, line:{color:pos.color, transparency:i === 0 ? 22 : 58, width:0.42} });
    addNumber(slide, String(i + 1).padStart(2, '0'), { x:pos.x+0.18, y:pos.y+0.22, w:0.28, h:0.09, fontSize:6.2, color:pos.color });
    addText(slide, node.title || `节点 ${i + 1}`, { x:pos.x+0.52, y:pos.y+0.16, w:0.94, h:0.12, fontSize:8.2, bold:true, color:C.white, fit:'shrink' });
    if (node.body) addText(slide, node.body, { x:pos.x+0.18, y:pos.y+0.46, w:1.20, h:0.11, fontSize:6.5, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addText(slide, s.note || '单对象图必须保持一个视觉中心，外围节点只解释力量、动作和结果。', { x:0.90, y:6.42, w:8.20, h:0.14, fontSize:8.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}



function energyCapabilityLoop(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'ENERGY LOOP', 0.86, 0.72, false);
  addText(slide, s.title, { x:0.84, y:1.05, w:5.0, h:0.35, fontSize:24, bold:true, color:C.text });
  if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.9, h:0.22, fontSize:10.8, color:C.muted });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const cards = s.cards || [];
  const left = { x:0.92, y:2.12, w:3.18, h:3.60 };
  glassPanel(slide, left.x, left.y, left.w, left.h, false);
  addLabel(slide, 'OPERATING LOOP', { x:left.x+0.28, y:left.y+0.34, w:1.25, h:0.12, fontSize:6.8, color:C.muted, charSpace:0.8 });
  addText(slide, '负荷-储能-告警闭环', { x:left.x+0.28, y:left.y+0.90, w:2.24, h:0.28, fontSize:15.8, bold:true, color:C.text });
  addText(slide, '从运行曲线发现偏差，以告警工单驱动处置，再回到策略复盘与调度优化。', { x:left.x+0.28, y:left.y+1.54, w:2.20, h:0.72, fontSize:9.2, color:C.body, breakLine:true });
  addHairline(slide, left.x+0.28, left.y+2.78, 0.72, C.accent, 0, 0.75);

  const panel = { x:4.42, y:1.98, w:7.66, h:4.42 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink, 'D8E2EF', { fill:{color:C.ink, transparency:0}, line:{color:'D8E2EF', transparency:82, width:0.36} });
  addLabel(slide, 'ENERGY OPERATING LOOP', { x:4.72, y:2.28, w:1.86, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:1.0 });
  const loop = [
    { key:'负荷曲线', fallback:cards[0], x:4.86, y:2.62, accent:C.accent },
    { key:'储能策略', fallback:cards[3], x:8.94, y:2.62, accent:C.violet },
    { key:'告警事件', fallback:cards[1], x:8.94, y:4.70, accent:C.cyan },
    { key:'工单闭环', fallback:cards[2], x:4.86, y:4.70, accent:'94A3B8' }
  ];
  const loopOval = { x:5.58, y:2.74, w:4.96, h:2.88 };
  slide.addShape('ellipse', { x:loopOval.x, y:loopOval.y, w:loopOval.w, h:loopOval.h, fill:{color:C.ink, transparency:100}, line:{color:'7FA5D8', transparency:58, width:0.48} });
  slide.addShape('ellipse', { x:loopOval.x+0.72, y:loopOval.y+0.44, w:loopOval.w-1.44, h:loopOval.h-0.88, fill:{color:C.ink, transparency:100}, line:{color:'334155', transparency:58, width:0.28} });
  addText(slide, '闭环', { x:7.46, y:3.74, w:1.14, h:0.28, fontSize:20.5, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, 'MONITOR · ALARM · WORKORDER · DISPATCH', { x:6.72, y:4.22, w:2.60, h:0.10, fontSize:5.7, color:'64748B', charSpace:0.7, align:'center' });
  addPulseCurve(slide, 6.58, 4.56, 2.86, 0.46, C.cyan, true, { transparency:60, width:0.38, nodes:false });
  [
    [loopOval.x+loopOval.w*0.50, loopOval.y+0.04, C.accent],
    [loopOval.x+loopOval.w-0.04, loopOval.y+loopOval.h*0.50, C.violet],
    [loopOval.x+loopOval.w*0.50, loopOval.y+loopOval.h-0.04, C.cyan],
    [loopOval.x+0.04, loopOval.y+loopOval.h*0.50, '94A3B8']
  ].forEach(([x,y,color])=>slide.addShape('ellipse', { x:x-0.045, y:y-0.045, w:0.09, h:0.09, fill:{color}, line:{color, transparency:100} }));
  loop.forEach((n,i)=>{
    const c = n.fallback || { title:n.key, body:'' };
    addRect(slide, n.x, n.y, 2.46, 0.92, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?4:18}, line:{color:n.accent, transparency:i===0?22:54, width:0.45} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:n.x+0.20, y:n.y+0.18, w:0.30, h:0.10, fontSize:6.8, color:n.accent });
    addText(slide, c.title, { x:n.x+0.56, y:n.y+0.13, w:1.56, h:0.14, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, c.body, { x:n.x+0.56, y:n.y+0.43, w:1.66, h:0.26, typeRole:'bodySmall', fontSize:8.8, color:'A8B3C3', fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

function energyValueSignal(slide, plan, s, idx) {
  slide.background = { color:'F7FAFD' };
  addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
  addRect(slide, 0, 0, W, 0.92, C.white, C.white, { line:{color:C.white, transparency:100} });
  addLabel(slide, 'VALUE SIGNAL', { x:0.86, y:0.72, w:1.34, h:0.12, fontSize:6.8, color:C.muted, charSpace:1.0 });
  addText(slide, s.title || '预期价值', { x:0.84, y:1.06, w:3.30, h:0.34, fontSize:24, bold:true, color:C.text });
  if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.80, h:0.18, fontSize:9.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const cards = s.cards || [];
  const lead = cards[0] || { title:'运行态势可视', body:'' };
  const useImage = slideWantsImage(plan, s, 'value');
  if (useImage) {
    addVisualPhotoPanel(slide, plan, s, 'value', 0.92, 2.08, 4.76, 3.70, { transparency:42, stroke:'D8E2EF', strokeTransparency:32 });
    addRect(slide, 0.92, 4.38, 4.76, 1.40, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
  } else {
    addRect(slide, 0.92, 2.08, 4.76, 3.70, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addDarkBreathingCircle(slide, 2.62, 2.58, 2.18, 1.18, C.cyan);
    if (hasEnergyCurveSemantics(s)) addPulseCurve(slide, 1.28, 3.78, 2.92, 0.42, C.cyan, true, { transparency:46, width:0.38, nodes:false });
  }
  addLabel(slide, 'PRIMARY OUTCOME', { x:1.22, y:4.70, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, lead.title, { x:1.22, y:5.02, w:2.80, h:0.22, fontSize:14.8, bold:true, color:C.white, fit:'shrink' });
  addText(slide, lead.body, { x:1.22, y:5.32, w:3.70, h:0.24, typeRole:'bodySmall', fontSize:8.8, color:'CBD5E1', fit:'shrink' });

  const signals = cards.slice(1,4);
  signals.forEach((c,i)=>{
    const y = 2.16 + i*1.12;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, 6.36, y, 5.26, 0.88, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.52} });
    addText(slide, String(i+2).padStart(2,'0'), { x:6.68, y:y+0.28, w:0.36, h:0.12, typeRole:'number', fontSize:7.0, bold:true, color:accent });
    addText(slide, c.title, { x:7.24, y:y+0.17, w:1.62, h:0.16, fontSize:12.1, bold:true, color:C.text, fit:'shrink' });
    addText(slide, c.body, { x:8.94, y:y+0.14, w:2.18, h:0.32, typeRole:'bodySmall', fontSize:8.8, color:C.body, fit:'shrink', valign:'mid' });
  });
  addRect(slide, 6.36, 5.72, 5.26, 0.62, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'VALUE CAPTION', { x:6.68, y:5.92, w:1.18, h:0.12, typeRole:'microLabel', fontSize:6.8, color:C.accent, charSpace:0.65 });
  addText(slide, s.note || '收益测算需结合站点发电量、电价规则、历史告警和运行数据进一步校准。', {
    x:8.02,
    y:5.88,
    w:3.18,
    h:0.20,
    typeRole:'caption',
    fontSize:8.4,
    color:'CBD5E1',
    fit:'shrink',
    breakLine:true
  });
  addEnergyFooter(slide, plan, false);
}
function energyDeploymentRadius(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  const useImage = slideWantsImage(plan, s, 'timeline');
  if (useImage) {
    addVisualPhotoPanel(slide, plan, s, 'timeline', 0, 5.72, W, 1.00, { transparency:52 });
  } else {
    addRect(slide, 0, 5.72, W, 1.00, C.ink2, C.ink2, { fill:{color:C.ink2, transparency:36}, line:{color:C.ink2, transparency:100} });
  }
  addDarkBreathingCircle(slide, 8.42, 0.72, 4.08, 2.22, C.accent);
  addLabel(slide, 'DEPLOYMENT RADIUS', { x:0.84, y:0.72, w:1.62, h:0.12, fontSize:6.8, color:'64748B', charSpace:1.05 });
  addText(slide, s.title || '先选重点站点试点，再扩展区域集中运维', { x:0.82, y:1.08, w:7.20, h:0.36, fontSize:22.8, bold:true, color:C.white, fit:'shrink' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

  const phases = (s.phases || []).slice(0,4);
  const y0 = 2.10;
  phases.forEach((p,i)=>{
    const y = y0 + i*0.76;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, 0.92, y, 5.38, 0.56, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?18:44}, line:{color:accent, transparency:i===0?30:70, width:0.38} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:1.18, y:y+0.20, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:accent });
    addText(slide, p.title, { x:1.66, y:y+0.13, w:1.12, h:0.12, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, p.body, { x:2.92, y:y+0.09, w:2.72, h:0.24, fontSize:8.8, color:'A8B3C3', fit:'shrink', valign:'mid' });
  });

  const panel = { x:7.05, y:1.78, w:4.72, h:3.70 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink2, '334155', { fill:{color:C.ink2, transparency:70}, line:{color:'334155', transparency:74, width:0.36} });
  addLabel(slide, 'PILOT TO REGION', { x:panel.x+0.34, y:panel.y+0.32, w:1.28, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
  const cx = panel.x + 2.42;
  const cy = panel.y + 2.08;
  [0.62,1.18,1.76].forEach((r,i)=>{
    slide.addShape('ellipse', { x:cx-r, y:cy-r, w:r*2, h:r*2, fill:{color:C.ink, transparency:100}, line:{color:i===0?C.accent:(i===1?C.cyan:'334155'), transparency:i===0?34:62, width:i===0?0.62:0.40} });
  });
  slide.addShape('ellipse', { x:cx-0.10, y:cy-0.10, w:0.20, h:0.20, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
  [
    [cx-1.18, cy-0.42, C.cyan, '重点站点'],
    [cx+1.32, cy-0.18, C.violet, '储能场景'],
    [cx+0.58, cy+1.16, '94A3B8', '区域中心']
  ].forEach(([x,y,color,label])=>{
    slide.addShape('ellipse', { x:x-0.055, y:y-0.055, w:0.11, h:0.11, fill:{color}, line:{color, transparency:100} });
    addText(slide, label, { x:x+0.16, y:y-0.08, w:0.82, h:0.13, fontSize:8.8, color:'A8B3C3', fit:'shrink' });
  });
  addText(slide, '3-5', { x:cx-0.38, y:cy-0.38, w:0.74, h:0.30, fontSize:20.0, bold:true, color:C.white, align:'center' });
  addLabel(slide, 'PILOT SITES', { x:cx-0.46, y:cy+0.10, w:0.90, h:0.10, fontSize:5.6, color:'64748B', charSpace:0.7, align:'center' });

  if (s.note) {
    addText(slide, s.note, { x:0.92, y:5.20, w:5.70, h:0.18, fontSize:8.8, bold:true, color:'CBD5E1', fit:'shrink' });
  }
  addLabel(slide, 'START SMALL · PROVE LOOP · SCALE REGIONALLY', { x:7.56, y:6.18, w:3.52, h:0.10, fontSize:5.8, color:'94A3B8', charSpace:0.7, align:'right' });
  addEnergyFooter(slide, plan, true);
}

function fallbackBulletsSlide(slide, plan, s, idx) {
  masterLight(slide, plan, s.title || '未命名页面', idx);
  const runs = (s.bullets || s.items || []).map(v => ({ text:String(v), options:{ bullet:{type:'bullet'}, breakLine:true } }));
  slide.addText(runs, { x:1.0, y:1.8, w:10.8, h:4.2, fontFace:PROFILE.font, fontSize:14, color:C.body, fit:'shrink', valign:'top', paraSpaceAfterPt:8, margin:0.02 });
}

let SLIDE_RENDER_REGISTRY = null;
let INDUSTRY_RENDERERS = null;
function slideRenderRegistry() {
  if (SLIDE_RENDER_REGISTRY) return SLIDE_RENDER_REGISTRY;
  const baseRendererApi = {
    colors: () => C,
    canvasWidth: () => W,
    canvasHeight: () => H,
    fileExists: file => fs.existsSync(file),
    EvidenceImageFrame,
    MetricStrip,
    addArrowBetweenRects,
    addArrowLine,
    addClockwiseLoopConnectors,
    addEvidenceCaptionStack,
    addEquipmentNameplate,
    addHairline,
    addLabel,
    addNumber,
    addLightBreathingCircle,
    addDarkBreathingCircle,
    addEnergyLens,
    addEnergyMotionBackdrop,
    addEnergyPhotoBackdrop,
    addPhotoPanel,
    addPulseCurve,
    addRect,
    addSmartPhotoPanel,
    addText,
    addVisualPhotoBackdrop,
    addVisualPhotoPanel,
    PageNumber,
    panelFill,
    stageCanvas,
    lightCanvas,
    masterLight,
    sectionKicker,
    copyFallback,
    copyPolicyList,
    compactEvidenceCaption,
    componentRendererContext,
    designForSlide,
    chooseEvidenceImageLayout,
    chooseFourImageLayout,
    ContactBlock,
    footerText,
    glassPanel,
    coverMetaText,
    typeSize,
    profileFont,
    genericShowcaseField,
    formatMetricDelta,
    imageAspect,
    imagePathFromItem,
    industryProfile,
    isCompanyIntroPlan,
    isVisualIndustry,
    itemBody,
    itemBodyNoEllipsis,
    itemTitle,
    presentationSpec,
    publicSlideNote,
    recordChartConsumption,
    reportBoardNeedsRightOverlayRail,
    routeChartSpec,
    renderChartSpec,
    chartSpecToComponentId,
    variantOf,
    galleryImages,
    activePlan,
    mediaForRole,
    metaDisabled,
    resolveAssetPath,
    smartPhotoFit,
    surfaceFill,
    brandWorldBusinessProof,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide
  };
  const baseRendererContext = createRendererContext(baseRendererApi);
  const evidenceGalleryRenderers = createEvidenceGalleryRenderers(baseRendererContext);
  const rendererContext = createRendererContext(Object.assign({}, baseRendererApi, evidenceGalleryRenderers));
  const familyRenderers = Object.assign({},
    createBusinessRenderers(rendererContext),
    createBeautyRenderers(rendererContext),
    createChapterRenderers(rendererContext),
    createFinancialRenderers(rendererContext),
    createGeneralRenderers(rendererContext),
    createClosingRenderers(rendererContext),
    createArchitectureRenderers(rendererContext),
    createManifestoRenderers(rendererContext),
    createProfileRenderers(rendererContext),
    evidenceGalleryRenderers,
    createRiskRenderers(rendererContext),
    createStrategyRenderers(rendererContext),
    createTimelineRenderers(rendererContext),
    createTocRenderers(rendererContext)
  );
  INDUSTRY_RENDERERS = {
    energyArchitecture: familyRenderers.energyArchitecture
  };
  SLIDE_RENDER_REGISTRY = createSlideRenderRegistry({
    architectureAdaptive: familyRenderers.architectureAdaptive,
    caseGallery: familyRenderers.caseGallery,
    chapterDivider: familyRenderers.chapterDivider,
    closingAdaptive: familyRenderers.closingAdaptive,
    comparisonSlide: familyRenderers.comparisonSlide,
    companyProfileSpread: familyRenderers.companyProfileSpread,
    coverDark,
    executiveBlocks,
    fallbackBulletsSlide,
    financeBridgeSlide: familyRenderers.financeBridgeSlide,
    industryChartSlide: familyRenderers.industryChartSlide,
    manifestoSlide: familyRenderers.manifestoSlide,
    metricComparison: familyRenderers.metricComparison,
    moduleMatrix: familyRenderers.moduleMatrix,
    portfolioTableSlide: familyRenderers.portfolioTableSlide,
    productShowcase: familyRenderers.productShowcase,
    profileProof: familyRenderers.profileProof,
    quoteProof: familyRenderers.quoteProof,
    reportBoard: familyRenderers.reportBoard,
    riskAdaptive: familyRenderers.riskAdaptive,
    strategyMap: familyRenderers.strategyMap,
    timelineAdaptive: familyRenderers.timelineAdaptive,
    tocClean: familyRenderers.tocClean,
    twoColumnClean: familyRenderers.twoColumnClean,
    valueTiles: familyRenderers.valueTiles
  });
  return SLIDE_RENDER_REGISTRY;
}

function renderSlide(pptx, plan, s, idx) {
  const slide = pptx.addSlide();
  CURRENT_RENDER = { plan, slide:s, idx };
  const type = s.type || 'executive-blocks';
  const renderMatch = industryRendererMatchFor(plan, s, type) || slideRenderRegistry().matchFor(type);
  if (!renderMatch || !renderMatch.render) {
    throw new Error(`No renderer registered for slide type: ${type}`);
  }
  if (isStrictRenderMode(plan) && renderMatch.matchKind === 'fallback') {
    throw new Error(`Strict render mode disallows fallback renderer for slide type: ${type}`);
  }
  const renderer = renderMatch.render;
  slide.__codexRendererMatch = compactRenderMatch(renderMatch);
  declareNativeRendererContract(slide, nativeRendererContractFor(plan, s, renderMatch.rendererName || renderMatch.rendererId || renderer.name || type));
  renderer(slide, plan, s, idx);
  consumeComponentPlan(slide, plan, s, idx);
  finalizeSlideChrome(slide, plan, s, idx);
}
async function main() {
  const { plan, out } = argParse();
  const workingPlan = normalizeDeckPlan(plan);
  const normalizationMode = normalizationModeFor(plan);
  const normalizationDiffs = routeSensitiveDiffs(plan, workingPlan);
  if (normalizationMode === 'finalized' && normalizationDiffs.length) {
    console.error(JSON.stringify({
      success:false,
      error:'planner_output_mutated_during_render',
      message:'Finalized planner output changed during renderer normalization.',
      normalization: {
        version:'render-normalization/v1',
        mode:normalizationMode,
        inputPlanHash:shortHash(plan),
        normalizedPlanHash:shortHash(workingPlan),
        routeSensitiveDiffs:normalizationDiffs
      }
    }, null, 2));
    process.exit(1);
  }
  const authorizationGate = assetAuthorizationGate(workingPlan, workingPlan);
  const allowDraftRender = workingPlan.allowDraftRender === true || process.env.PREMIUM_PPT_ALLOW_DRAFT_RENDER === '1';
  if (authorizationGate.required && !authorizationGate.canRenderFormal && !allowDraftRender) {
    console.error(JSON.stringify({
      success:false,
      error:'asset_authorization_gate_required',
      message:'Formal material generation requires asset provenance and authorization before PPTX rendering.',
      assetAuthorizationGate: authorizationGate
    }, null, 2));
    process.exit(1);
  }
  RENDER_META = {
    version:'render-meta/v1',
    output:out,
    title:workingPlan.title || '',
    slideCount:(workingPlan.slides || []).length,
    qualityMode: qualityModeForPlan(workingPlan),
    normalization: {
      version:'render-normalization/v1',
      mode:normalizationMode,
      inputPlanHash:shortHash(plan),
      normalizedPlanHash:shortHash(workingPlan),
      routeSensitiveDiffs:normalizationDiffs
    },
    assetAuthorizationGate: authorizationGate,
    generatedAt:new Date().toISOString(),
    slides:[]
  };
  DESIGN = makeDeckContext(workingPlan);
  PROFILE = DESIGN.profile;
  C = DESIGN.colors;
  RENDER_META.typography = {
    version:'typography-render-meta/v1',
    profile:DESIGN.typographyProfile || null,
    fonts:DESIGN.typographyFonts || null
  };
  RENDER_META.visibleLanguagePolicy = languagePolicyFor(workingPlan);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Hermes Agent premium-commercial-ppt skill';
  pptx.subject = 'Premium commercial business presentation';
  pptx.title = workingPlan.title || '高端商用演示文稿';
  pptx.company = workingPlan.organization || '';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace:PROFILE.font, bodyFontFace:PROFILE.font, lang:'zh-CN' };
  (workingPlan.slides || []).forEach((s, i) => renderSlide(pptx, workingPlan, s, i+1));
  await pptx.writeFile({ fileName: out });
  fs.writeFileSync(`${out}.render-meta.json`, `${JSON.stringify(RENDER_META, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    success:true,
    output:out,
    renderMeta:`${out}.render-meta.json`,
    slides:(workingPlan.slides || []).length,
    style: workingPlan.style || PROFILE.name,
    palette: PROFILE.palette
  }, null, 2));
}
main().catch(err => { console.error(err.stack || String(err)); process.exit(1); });
