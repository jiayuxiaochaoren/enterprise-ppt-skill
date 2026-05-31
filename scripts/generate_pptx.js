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
  compactEvidenceCaption,
  formatMetricDelta,
  itemBody,
  itemBodyNoEllipsis,
  itemTitle,
  publicSlideNote,
  slideSemanticText,
  stripEllipsisText,
  variantOf
} = require('./render/content-helpers');
const {
  zone,
  zoneBounds,
  zonesIntersect
} = require('./render/geometry');
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
const { createOverlayRenderer } = require('./render/overlay-renderer');
const { createArchitectureRenderers } = require('./render/page-families/architecture');
const { createBeautyRenderers } = require('./render/page-families/beauty');
const { createBusinessRenderers } = require('./render/page-families/business');
const { createChapterRenderers } = require('./render/page-families/chapter');
const { createClosingRenderers } = require('./render/page-families/closing');
const { createCoverRenderers } = require('./render/page-families/cover');
const { createEvidenceGalleryRenderers } = require('./render/page-families/evidence-gallery');
const { createFinancialRenderers } = require('./render/page-families/financial');
const { createGeneralRenderers } = require('./render/page-families/general');
const { createManifestoRenderers } = require('./render/page-families/manifesto');
const { createProfileRenderers } = require('./render/page-families/profile');
const { createRiskRenderers } = require('./render/page-families/risk');
const { createStrategyRenderers } = require('./render/page-families/strategy');
const { createTimelineRenderers } = require('./render/page-families/timeline');
const { createTocRenderers } = require('./render/page-families/toc');
const { createEnergyIndustryRenderers } = require('./render/industry/energy');

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
const {
  renderOverlayComponent
} = createOverlayRenderer({
  chartComponentIds: CHART_COMPONENT_IDS,
  addCaptionBar,
  addLabel,
  addRect,
  addSmartPhotoPanel,
  addText,
  colors: () => C,
  compactText,
  componentBlockedByContract,
  componentRendererContext,
  componentSlotConflicts,
  fs,
  itemBody,
  itemTitle,
  mediaForRole,
  metricStrip: MetricStrip,
  nativeDrawnEvidenceRendererModule: 'generate_pptx/native-page-renderer',
  overlaySlotConflicts,
  overlaySlotForComponent,
  panelFill,
  processRail: ProcessRail,
  recordChartConsumption,
  renderChartSpec,
  renderProofGallery,
  renderRiskRegister,
  renderValueChain,
  routeChartSpec,
  slideHasChartSpecIntent,
  slideRenderedDark,
  slideRole,
  sourceNote: SourceNote,
  zone,
  canvasWidth: () => W,
  canvasHeight: () => H
});

function hasEnergyCurveSemantics(s = {}) {
  if (s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse) return true;
  return /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(slideSemanticText(s));
}

function industryProfile(plan={}) {
  const profiles = (DESIGN.visualSystem && DESIGN.visualSystem.industryProfiles) || {};
  const visualId = visualIndustryId(plan.industry);
  const raw = profiles[plan.industry] || profiles[visualId] || profiles['general-operations'] || {};
  return Object.assign({
    label: 'DIGITAL OPERATIONS',
    insight: copyPolicyText(plan, 'industryInsight'),
    coreTitle: copyPolicyText(plan, 'industryCoreTitle'),
    coreBody: copyPolicyText(plan, 'industryCoreBody'),
    coverField: 'generic'
  }, raw);
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
  if (!rendererName) return null;
  if (!INDUSTRY_RENDERERS) slideRenderRegistry();
  return (INDUSTRY_RENDERERS && INDUSTRY_RENDERERS[rendererName]) || null;
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

function compactText(text = '', maxChars = 32) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return stripEllipsisText(value);
}

function slideHasChartSpecIntent(s = {}) {
  const type = String(s.type || '');
  if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) return false;
  if (s.chartSpec || s.chartKind || s.chart_kind || s.dataComponent || s.data_component) return true;
  const variant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '');
  return ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type) ||
    /chart|metric|kpi|scorecard|matrix|funnel|waterfall|pareto/i.test(variant);
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
function addEnergyMotionBackdrop(slide) {
  if (!fs.existsSync(MEDIA_ASSETS.energyStorageLoop) || !fs.existsSync(MEDIA_ASSETS.energyStorageCover)) {
    return false;
  }
  const cover = `data:image/jpeg;base64,${fs.readFileSync(MEDIA_ASSETS.energyStorageCover).toString('base64')}`;
  slide.addMedia({ type:'video', path:MEDIA_ASSETS.energyStorageLoop, cover, x:0, y:0, w:W, h:H, objectName:'Energy storage motion backdrop' });
  addRect(slide, 0, 0, W, H, C.ink, C.ink, { fill:{color:C.ink, transparency:72}, line:{color:C.ink, transparency:100} });
  return true;
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
function genericShowcaseField(slide, x, y, w, h, label='PRODUCT SYSTEM') {
  addRect(slide, x, y, w, h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addDarkBreathingCircle(slide, x+w*0.44, y+h*0.12, Math.min(w, h)*0.86, Math.min(w, h)*0.48, C.accent);
  addPulseCurve(slide, x+w*0.16, y+h*0.62, w*0.58, h*0.14, C.cyan, true, { transparency:50, width:0.38, nodes:false });
  addLabel(slide, label, { x:x+0.32, y:y+h-0.46, w:w-0.64, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
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
    addDeckMeta,
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
    masterDark,
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
    hasEnergyCurveSemantics,
    typeToken,
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
    profile: () => PROFILE,
    resolveAssetPath,
    smartPhotoFit,
    slideWantsImage,
    surfaceFill,
    brandWorldBusinessProof,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide
  };
  const baseRendererContext = createRendererContext(baseRendererApi);
  const evidenceGalleryRenderers = createEvidenceGalleryRenderers(baseRendererContext);
  const rendererContext = createRendererContext(Object.assign({}, baseRendererApi, evidenceGalleryRenderers));
  const energyIndustryRenderers = createEnergyIndustryRenderers(rendererContext);
  const familyRenderers = Object.assign({},
    createBusinessRenderers(rendererContext),
    createBeautyRenderers(rendererContext),
    createChapterRenderers(rendererContext),
    createFinancialRenderers(rendererContext),
    createGeneralRenderers(rendererContext),
    createClosingRenderers(rendererContext),
    createCoverRenderers(rendererContext),
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
    energyArchitecture: familyRenderers.energyArchitecture,
    ...energyIndustryRenderers
  };
  SLIDE_RENDER_REGISTRY = createSlideRenderRegistry({
    architectureAdaptive: familyRenderers.architectureAdaptive,
    caseGallery: familyRenderers.caseGallery,
    chapterDivider: familyRenderers.chapterDivider,
    closingAdaptive: familyRenderers.closingAdaptive,
    comparisonSlide: familyRenderers.comparisonSlide,
    companyProfileSpread: familyRenderers.companyProfileSpread,
    coverDark: familyRenderers.coverDark,
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
