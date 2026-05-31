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
const crypto = require('crypto');
const { requirePptxGen } = require('./render/pptx-runtime');
const { createRendererContext } = require('./render/renderer-context');
const { createSlideRenderRegistry } = require('./render/page-family-registry');
const { createArchitectureRenderers } = require('./render/page-families/architecture');
const { createBusinessRenderers } = require('./render/page-families/business');
const { createChapterRenderers } = require('./render/page-families/chapter');
const { createClosingRenderers } = require('./render/page-families/closing');
const { createEvidenceGalleryRenderers } = require('./render/page-families/evidence-gallery');
const { createFinancialRenderers } = require('./render/page-families/financial');
const { createRiskRenderers } = require('./render/page-families/risk');
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

function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function shortHash(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16);
}

const ROUTE_SENSITIVE_RENDER_FIELDS = [
  'type',
  'layoutVariant',
  'variant',
  'proofObject',
  'proof_object',
  'chartSpec',
  'dataComponent',
  'data_component',
  'componentPlan',
  'assetGeneration',
  'generatedAssetPrompt'
];

function compactDiffValue(value) {
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  const text = stableStringify(value);
  return text.length > 240 ? `${text.slice(0, 237)}...` : text;
}

function normalizationModeFor(plan = {}) {
  return plan.normalizationMode || plan.normalization_mode ||
    (plan.finalized || plan.plannerFinalized ? 'finalized' : 'compat');
}

function routeSensitiveDiffs(inputPlan = {}, normalizedPlan = {}) {
  const inputSlides = Array.isArray(inputPlan.slides) ? inputPlan.slides : [];
  const normalizedSlides = Array.isArray(normalizedPlan.slides) ? normalizedPlan.slides : [];
  return normalizedSlides.map((slide, i) => {
    const input = inputSlides[i] || {};
    const changes = [];
    ROUTE_SENSITIVE_RENDER_FIELDS.forEach(field => {
      const before = input[field];
      const after = slide[field];
      if (stableStringify(before) !== stableStringify(after)) {
        changes.push({
          field,
          before: compactDiffValue(before),
          after: compactDiffValue(after)
        });
      }
    });
    return {
      slide: i + 1,
      changed: changes.length > 0,
      changes
    };
  }).filter(item => item.changed);
}

function isStrictRenderMode(plan = {}) {
  const mode = String(plan.qualityMode || plan.quality_mode || plan.normalizationMode || plan.normalization_mode || '').toLowerCase();
  return plan.strictRendering === true || ['formal', 'delivery', 'strict', 'finalized'].includes(mode);
}
function qualityModeForPlan(plan = {}) {
  const mode = String(plan.qualityMode || plan.quality_mode || plan.outputIntent || '').trim().toLowerCase().replace(/_/g, '-');
  if (mode === 'formal-review') return 'formal';
  if (['draft', 'formal', 'delivery'].includes(mode)) return mode;
  if (plan.formalMaterialGeneration === true || plan.strictRendering === true) return 'formal';
  return 'draft';
}

function compactRenderMatch(match = {}) {
  return {
    requestedType: match.requestedType || '',
    matchedType: match.matchedType || '',
    matchKind: match.matchKind || '',
    rendererId: match.rendererId || '',
    rendererName: match.rendererName || '',
    source: match.source || '',
    alias: match.alias || undefined
  };
}

function containsCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}
function textOptionWithReadabilityFloor(text, opts={}) {
  const next = normalizeTypographyOptions(activePlan(), text, opts);
  if (isPageFolioText(text, next)) return normalizePageFolioTextOptions(next);
  if (next.allowTiny || typeof next.fontSize !== 'number' || !containsCjk(text)) return next;
  const isFooter = Number(next.y || 0) >= 6.62;
  const isMicroSlot = Number(next.w || 0) < 0.72 || Number(next.h || 0) < 0.11;
  if (isMicroSlot && !containsCjk(text)) return next;
  const cjkChars = (String(text || '').match(/[\u3400-\u9fff]/g) || []).length;
  if (!next.allowNarrowCjk && cjkChars >= 12 && Number(next.w || 0) > 0 && Number(next.w || 0) < 1.42) {
    const maxWidth = Math.max(Number(next.w || 0), W - Number(next.x || 0) - 0.36);
    next.w = Math.min(maxWidth, Math.max(1.56, Math.min(2.56, cjkChars * 0.12)));
    if (Number(next.h || 0) > 0 && Number(next.h || 0) < 0.22) next.h = 0.22;
    next.breakLine = true;
  }
  const bodyFloor = Number((((DESIGN.visualSystem || {}).visualQA || {}).preferredBodyMin) || 8.8);
  const captionFloor = Number((((DESIGN.visualSystem || {}).visualQA || {}).preferredCaptionMin) || 7.2);
  const titleFloor = next.bold ? 9.6 : bodyFloor;
  const floor = isFooter ? captionFloor : Math.max(bodyFloor, titleFloor);
  if (next.fontSize < floor) {
    next.fontSize = floor;
    if (!isFooter && Number(next.h || 0) > 0 && Number(next.h || 0) < 0.18) next.h = 0.18;
  }
  return next;
}
function isPageFolioText(text, opts={}) {
  const value = String(text || '').trim();
  const fontSize = Number(opts.fontSize || typeSize('number', 12.0));
  return /^[0-9]{1,2}$/.test(value) &&
    Number(opts.x || 0) >= 11.45 &&
    Number(opts.y || 0) <= 1.18 &&
    fontSize <= 14.2 &&
    (opts.align === 'right' || opts.align == null);
}
function normalizePageFolioTextOptions(opts={}) {
  const next = Object.assign({}, opts);
  next.x = 11.74;
  next.y = 0.74;
  next.w = 0.52;
  next.h = 0.22;
  next.fontSize = Math.min(Number(next.fontSize || typeSize('number', 12.0)), 11.8);
  next.align = 'right';
  return next;
}
function pageFolioRendered(slide) {
  return Boolean(slide && slide.__codexPageFolioRendered);
}
function markPageFolioRendered(slide) {
  if (slide) slide.__codexPageFolioRendered = true;
}
function addPageFolioMarker(slide, opts={}) {
  if (opts.marker !== true) return;
  const markerColor = opts.markerColor || C.cyan;
  addRect(slide, opts.x - 0.18, opts.y + 0.02, 0.026, 0.13, markerColor, markerColor, {
    fill:{color:markerColor, transparency:0},
    line:{color:markerColor, transparency:100}
  });
}
function recordTextBoxMeta(slide, rawText, displayText, inputOpts = {}, textOpts = {}, role = '') {
  if (!slide || !String(displayText || rawText || '').trim()) return;
  const text = String(displayText || rawText || '');
  const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const w = Number(textOpts.w || inputOpts.w || 0);
  const h = Number(textOpts.h || inputOpts.h || 0);
  const fontSize = Number(textOpts.fontSize || inputOpts.fontSize || 0);
  const fitStrategy = textOpts.__finalFitStrategy || (textOpts.fit === false || textOpts.noFit === true
    ? 'none'
    : (textOpts.fit || inputOpts.fit || ''));
  slide.__codexTextBoxes = slide.__codexTextBoxes || [];
  slide.__codexTextBoxes.push({
    role: role || textOpts.__typeRole || inputOpts.typeRole || inputOpts.textRole || '',
    originalFontSize: Number(inputOpts.fontSize || fontSize || 0),
    fontSize,
    fitStrategy: fitStrategy ? String(fitStrategy) : '',
    textLength: text.length,
    cjkChars,
    box: {
      x:Number(textOpts.x || inputOpts.x || 0),
      y:Number(textOpts.y || inputOpts.y || 0),
      w,
      h
    },
    charsPerInch: w > 0 ? Number((cjkChars / w).toFixed(2)) : 0,
    areaDensity: w > 0 && h > 0 ? Number((text.length / (w * h)).toFixed(2)) : 0,
    sample: compactText(text, 64)
  });
}
function addText(slide, t, opts={}) {
  const rawText = String(t == null ? '' : t);
  const microcopyLike = !containsCjk(rawText) && (
    opts.typeRole === 'kicker' ||
    opts.textRole === 'kicker' ||
    opts.__typeRole === 'kicker' ||
    opts.typeRole === 'microLabel' ||
    opts.textRole === 'microLabel' ||
    Number(opts.charSpace || 0) >= 0.55 ||
    /^[A-Z0-9\s./:%+&·→-]+$/.test(rawText.trim())
  );
  const displayText = microcopyLike
    ? localizeMicrocopy(activePlan(), rawText, opts)
    : t;
  let textOpts = Object.assign(
    { fontFace: PROFILE.font, color: C.body, margin: 0, breakLine: false, fit: 'shrink' },
    textOptionWithReadabilityFloor(displayText, opts)
  );
  const resolvedTypeRole = textOpts.__typeRole || textOpts.typeRole || textOpts.textRole || '';
  if (
    activePlan().industry === 'energy-utility' &&
    containsCjk(displayText) &&
    textOpts.fit === 'shrink' &&
    !textOpts.allowTiny &&
    !['microLabel', 'pageFolio', 'sourceNote'].includes(resolvedTypeRole)
  ) {
    textOpts.fit = false;
  }
  const folio = isPageFolioText(displayText, textOpts);
  const internalFolio = textOpts._folioInternal === true;
  if (folio) {
    if (pageFolioRendered(slide) && !internalFolio) return false;
    textOpts = normalizePageFolioTextOptions(textOpts);
    if (!pageFolioRendered(slide)) addPageFolioMarker(slide, textOpts);
    markPageFolioRendered(slide);
  }
  textOpts.__finalFitStrategy = textOpts.fit === false || textOpts.noFit === true
    ? 'none'
    : (textOpts.fit || '');
  if (textOpts.fit === false || textOpts.noFit === true) {
    delete textOpts.fit;
  }
  recordTextBoxMeta(slide, rawText, displayText, opts, textOpts, resolvedTypeRole);
  delete textOpts.noFit;
  delete textOpts.__finalFitStrategy;
  delete textOpts._folioInternal;
  delete textOpts.marker;
  delete textOpts.markerColor;
  delete textOpts.__typeRole;
  delete textOpts.allowTiny;
  delete textOpts.allowNarrowCjk;
  slide.addText(displayText || '', textOpts);
  return true;
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

function plannedComponentsForSlide(s = {}) {
  const components = s.componentPlan && Array.isArray(s.componentPlan.components) ? s.componentPlan.components : [];
  return components.map(component => typeof component === 'string' ? { id: component, required:true } : component)
    .filter(component => component && component.id);
}

const OVERLAY_PRONE_COMPONENT_IDS = [
  'caption-bar',
  'chart-commentary-panel',
  'commentary-panel',
  'governance-table',
  'hero-image',
  'information-gap',
  'kpi-primary-metric',
  'kpi-strip',
  'metric-strip',
  'process-rail',
  'product-matrix',
  'proof-gallery',
  'proof-gallery-grid',
  'risk-matrix',
  'risk-register',
  'scorecard',
  'source-note',
  'system-rail',
  'table-with-commentary',
  'value-chain',
  'value-chain-connector'
];

const CHART_COMPONENT_IDS = new Set([
  'bar-chart',
  'beauty-channel-structure',
  'beauty-efficacy-table',
  'beauty-member-repurchase',
  'beauty-price-band-matrix',
  'beauty-proof-gallery',
  'beauty-review-sentiment',
  'beauty-sku-matrix',
  'beauty-social-funnel',
  'beauty-sustainability-matrix',
  'funnel-chart',
  'heatmap-chart',
  'information-gap',
  'line-chart',
  'matrix-chart',
  'pareto-chart',
  'scorecard',
  'table-with-commentary',
  'waterfall-chart'
]);

const NATIVE_VARIANT_COMPONENTS = {
  'airy-concept-opening': ['hero-image', 'caption-bar'],
  'beauty-brand-editorial-cover': ['hero-image', 'caption-bar'],
  'brand-world-and-business-proof': ['value-chain', 'system-rail', 'commentary-panel', 'hero-image', 'caption-bar'],
  'chart-grid-with-commentary': ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'scorecard'],
  'consumer-proof-photo-grid': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'control-stack': ['risk-register', 'governance-table', 'process-rail'],
  'executive-proof-board': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'source-note'],
  'financial-kpi-snapshot': ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'chart-commentary-panel'],
  'governance-table-editorial': ['risk-register', 'governance-table'],
  'guidance-and-risk-board': ['risk-register', 'governance-table', 'kpi-strip'],
  'lookbook-story': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'materiality-matrix-board': ['risk-register', 'risk-matrix', 'governance-table'],
  'member-growth-board': ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'scorecard'],
  'mission-statement-stage': ['content-card-grid', 'commentary-panel'],
  'people-proof-mosaic': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'premium-closing-anchor': ['decision-panel', 'contact-block', 'editorial-end-card'],
  'process-board': ['process-rail', 'value-chain'],
  'product-evidence-story': ['proof-gallery', 'caption-bar', 'hero-image', 'product-matrix'],
  'quarterly-results-summary': ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'scorecard'],
  'single-object-concept-map': ['hero-image', 'value-chain', 'commentary-panel'],
  'sustainability-proof-spread': ['proof-gallery', 'caption-bar', 'source-note'],
  'value-creation-process-map': ['value-chain', 'value-chain-connector', 'system-rail', 'commentary-panel'],
  'value-principle-cards': ['content-card-grid', 'commentary-panel']
};

const CHART_META_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);

function nativeOwnedComponentIdsFor(type = '', variant = '') {
  const ids = new Set();
  (NATIVE_VARIANT_COMPONENTS[variant] || []).forEach(id => ids.add(id));
  if (type === 'cover' || type === 'cover-dark') ['caption-bar', 'proof-gallery', 'product-matrix', 'source-note', 'value-chain'].forEach(id => ids.add(id));
  if (type === 'chapter-divider') ['process-rail', 'value-chain', 'system-rail', 'caption-bar', 'source-note'].forEach(id => ids.add(id));
  if (type === 'timeline' || type === 'timeline-dark') ['value-chain', 'system-rail', 'product-matrix', 'proof-gallery', 'caption-bar', 'source-note'].forEach(id => ids.add(id));
  if (type === 'closing' || type === 'closing-dark') ['value-chain', 'system-rail', 'process-rail', 'product-matrix', 'proof-gallery', 'caption-bar', 'source-note'].forEach(id => ids.add(id));
  return ids;
}

function isEnergyNativeRenderer(plan = {}, rendererName = '') {
  return plan.industry === 'energy-utility' && /^energy/.test(String(rendererName || ''));
}

function energyNativeOwnedComponentIds() {
  return new Set([
    'commentary-panel',
    'load-curve-band',
    'process-rail',
    'risk-register',
    'system-rail',
    'value-chain',
    'value-chain-connector'
  ]);
}

function reportBoardNeedsRightOverlayRail(s = {}) {
  if (String(s.type || '') !== 'report-board') return false;
  const rightRailComponents = new Set([
    'proof-gallery',
    'proof-gallery-grid',
    'risk-register',
    'risk-matrix',
    'governance-table',
    'product-matrix'
  ]);
  return plannedComponentsForSlide(s).some(component =>
    component &&
    component.required !== false &&
    rightRailComponents.has(component.id)
  );
}

function defaultSafeOverlayZonesFor(s = {}) {
  const type = String(s.type || '');
  if (['cover', 'cover-dark'].includes(type)) {
    return {
      'source-note': zone('source-note-footer', 0.82, 7.02, 7.80, 0.22, 'safe-overlay')
    };
  }
  if (['closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type)) return {};
  if (type === 'report-board') {
    const rightRail = reportBoardNeedsRightOverlayRail(s);
    const zones = {
      'caption-bar': zone('caption-bar-lower-left', 0.86, 6.44, 4.80, 0.36, 'safe-overlay'),
      'hero-image': zone('hero-image-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
      'kpi-strip': zone('kpi-strip-bottom-band', 0.86, 6.34, 10.30, 0.58, 'safe-overlay'),
      'metric-strip': zone('kpi-strip-bottom-band', 0.86, 6.34, 10.30, 0.58, 'safe-overlay'),
      'process-rail': zone('process-rail-bottom-left', 0.94, 6.36, 4.48, 0.50, 'safe-overlay'),
      'source-note': zone('source-note-footer-right', 8.10, 7.02, 4.20, 0.22, 'safe-overlay'),
      'system-rail': zone('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay'),
      'value-chain': zone('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay'),
      'value-chain-connector': zone('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay')
    };
    if (rightRail) {
      Object.assign(zones, {
        'chart-commentary-panel': zone('commentary-right-rail', 8.04, 5.96, 3.72, 0.48, 'safe-overlay'),
        'commentary-panel': zone('commentary-right-rail', 8.04, 5.92, 3.72, 0.52, 'safe-overlay'),
        'product-matrix': zone('product-matrix-right-rail', 8.04, 4.90, 3.58, 0.64, 'safe-overlay'),
        'proof-gallery': zone('proof-gallery-right-rail', 8.04, 5.46, 3.72, 0.80, 'safe-overlay'),
        'risk-register': zone('risk-register-right-rail', 8.04, 4.68, 3.72, 1.70, 'safe-overlay')
      });
    }
    return zones;
  }
  return {
    'caption-bar': zone('caption-bar-lower-left', 0.86, 6.44, 4.80, 0.36, 'safe-overlay'),
    'chart-commentary-panel': zone('commentary-lower-right', 8.22, 5.96, 3.42, 0.50, 'safe-overlay'),
    'commentary-panel': zone('commentary-side-pocket', 9.10, 5.70, 2.44, 0.58, 'safe-overlay'),
    'hero-image': zone('hero-image-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
    'kpi-strip': zone('kpi-strip-bottom-band', 0.86, 6.06, 10.30, 0.66, 'safe-overlay'),
    'metric-strip': zone('kpi-strip-bottom-band', 0.86, 6.06, 10.30, 0.66, 'safe-overlay'),
    'process-rail': zone('process-rail-bottom-left', 0.94, 6.12, 4.48, 0.54, 'safe-overlay'),
    'product-matrix': zone('product-matrix-lower-right', 8.04, 4.90, 3.58, 0.64, 'safe-overlay'),
    'proof-gallery': zone('proof-gallery-lower-right', 8.02, 5.50, 3.72, 0.82, 'safe-overlay'),
    'risk-register': zone('risk-register-lower-right', 8.04, 4.82, 3.72, 1.68, 'safe-overlay'),
    'source-note': zone('source-note-footer-right', 8.10, 7.02, 4.20, 0.22, 'safe-overlay'),
    'system-rail': zone('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay'),
    'value-chain': zone('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay'),
    'value-chain-connector': zone('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay')
  };
}

function energyOccupiedZonesForRenderer(rendererName = '') {
  const base = [zone('footer-strip', 0.72, 6.88, 11.10, 0.36, 'native-footer')];
  const map = {
    energyToc: [
      zone('title-block', 0.72, 0.66, 5.30, 1.35, 'native-title'),
      zone('navigation-path', 0.96, 2.88, 10.34, 1.72, 'native-path'),
      zone('media-band', 0, 5.58, W, 1.28, 'native-visual'),
      zone('main-visual-ring', 10.26, 0.28, 2.72, 2.64, 'native-visual')
    ],
    energySituationEditorial: [
      zone('left-state-column', 0, 0, 4.82, H, 'native-text'),
      zone('right-demand-column', 5.42, 0.96, 6.18, 5.62, 'native-cards')
    ],
    energyProblemSplit: [
      zone('title-block', 0.76, 0.68, 6.18, 1.20, 'native-title'),
      zone('transition-band', 0.90, 2.16, 7.24, 0.62, 'native-flow'),
      zone('breakpoint-cards', 0.88, 3.10, 7.34, 2.58, 'native-cards'),
      zone('right-visual-panel', 8.62, 0.66, 3.62, 5.72, 'native-visual')
    ],
    energyCapabilityLoop: [
      zone('title-block', 0.78, 0.70, 6.15, 1.18, 'native-title'),
      zone('left-summary-panel', 0.92, 2.12, 3.18, 3.60, 'native-text'),
      zone('closed-loop-board', 4.42, 1.98, 7.66, 4.42, 'native-loop')
    ],
    energyArchitecture: [
      zone('title-block', 0.78, 0.70, 6.50, 1.18, 'native-title'),
      zone('topology-board', 0.78, 2.04, 11.48, 4.26, 'native-architecture'),
      zone('data-bus', 1.02, 5.30, 10.56, 0.72, 'native-data-bus')
    ],
    energyDeploymentRadius: [
      zone('title-block', 0.78, 0.70, 7.45, 1.18, 'native-title'),
      zone('phase-list', 0.88, 2.04, 5.84, 3.52, 'native-process'),
      zone('radius-panel', 7.05, 1.78, 4.72, 3.70, 'native-visual'),
      zone('media-band', 0, 5.72, W, 1.00, 'native-visual')
    ],
    energyValueSignal: [
      zone('title-block', 0.78, 0.70, 6.45, 1.14, 'native-title'),
      zone('primary-outcome-panel', 0.92, 2.08, 4.76, 3.70, 'native-visual'),
      zone('value-signal-cards', 6.30, 2.10, 5.38, 3.22, 'native-cards'),
      zone('caption-strip', 6.30, 5.68, 5.38, 0.68, 'native-caption')
    ]
  };
  return [...(map[rendererName] || []), ...base];
}

function genericOccupiedZonesForSlide(s = {}) {
  const type = String(s.type || '');
  if (['cover', 'cover-dark'].includes(type)) return [zone('cover-stage', 0, 0, W, H, 'native')];
  if (['toc', 'toc-clean'].includes(type)) return [zone('navigation-stage', 0.70, 0.60, 10.50, 6.34, 'native')];
  if (['closing', 'closing-dark'].includes(type)) return [zone('closing-stage', 0.70, 0.60, 10.90, 6.34, 'native')];
  if (type === 'timeline' || type === 'timeline-dark') return [zone('timeline-main-stage', 0.80, 1.90, 11.20, 4.70, 'native')];
  if (type === 'architecture' || type === 'architecture-dark') return [zone('architecture-main-stage', 0.80, 1.92, 11.20, 4.70, 'native')];
  if (type === 'risk-table' || type === 'table') return [zone('risk-table-main-stage', 0.82, 1.90, 10.95, 4.78, 'native')];
  if (type === 'portfolio-table') return [
    zone('portfolio-summary-panel', 0.92, 2.10, 2.72, 3.94, 'native-summary'),
    zone('portfolio-action-table', 4.08, 2.10, 7.64, 3.94, 'native-table'),
    zone('portfolio-footer-note', 0.94, 6.34, 8.60, 0.34, 'native-footer-note')
  ];
  if (type === 'report-board') {
    const compactBoard = reportBoardNeedsRightOverlayRail(s);
    return [
      zone('report-board-executive-read', 0.92, 2.08, 2.78, 4.16, 'native'),
      zone('report-board-evidence-stack', 4.12, 2.08, compactBoard ? 3.54 : 7.46, 4.16, 'native')
    ];
  }
  return [zone('primary-content-stage', 0.82, 1.00, 6.95, 4.92, 'native')];
}

function nativeRendererContractFor(plan = {}, s = {}, rendererName = '') {
  const type = String(s.type || '');
  const variant = String(s.layoutVariant || s.variant || '');
  const owned = nativeComponentIdsFor(s);
  if (isEnergyNativeRenderer(plan, rendererName)) {
    energyNativeOwnedComponentIds().forEach(id => owned.add(id));
  }
  const safeOverlayZones = isEnergyNativeRenderer(plan, rendererName)
    ? { 'source-note': zone('source-note-footer', 8.10, 7.02, 4.20, 0.22, 'safe-overlay') }
    : defaultSafeOverlayZonesFor(s);
  return {
    version: 'native-renderer-contract/v1',
    rendererName: rendererName || 'unknown-renderer',
    slideType: type,
    layoutVariant: variant,
    ownedComponents: [...owned].sort(),
    occupiedZones: isEnergyNativeRenderer(plan, rendererName)
      ? energyOccupiedZonesForRenderer(rendererName)
      : genericOccupiedZonesForSlide(s),
    safeOverlayZones
  };
}

function declareNativeRendererContract(slide, contract = {}) {
  slide.__codexNativeRenderContract = contract;
  slide.__codexDecorations = [];
}

function overlaySlotForComponent(contract = {}, componentId = '') {
  const zones = contract.safeOverlayZones || {};
  return zones[componentId] ||
    (componentId === 'metric-strip' ? zones['kpi-strip'] : null) ||
    (componentId === 'value-chain-connector' ? zones['value-chain'] : null);
}

function componentBlockedByContract(contract = {}, componentId = '') {
  const owned = new Set(contract.ownedComponents || []);
  if (owned.has(componentId)) return false;
  return !overlaySlotForComponent(contract, componentId);
}

function componentSlotConflicts(contract = {}, slot = null) {
  if (!slot) return false;
  return (contract.occupiedZones || [])
    .filter(z => z.role !== 'native-footer')
    .some(z => zonesIntersect(z, slot, 0.02));
}

function overlaySlotConflicts(existingOverlays = [], slot = null) {
  if (!slot) return null;
  return existingOverlays.find(existing => zonesIntersect(existing, slot, 0.02)) || null;
}

function nativeComponentIdsFor(s = {}) {
  const type = String(s.type || '');
  const variant = String(s.layoutVariant || s.variant || '');
  const ids = new Set(['page-number']);
  if (!['cover', 'closing'].includes(type)) ids.add('section-kicker');
  if (/cover/.test(type) || variant.includes('cover')) {
    ['hero-image', 'brand-world-hero', 'large-product-frame', 'meta-folio', 'editorial-index'].forEach(id => ids.add(id));
  }
  if (type === 'chapter-divider' && /hero/.test(variant)) ids.add('hero-image');
  if (type === 'chapter-divider' && (
    /editorial-agenda|image-agenda|hero/i.test(variant) ||
    (Array.isArray(s.images) && s.images.length) ||
    (s.visual && Array.isArray(s.visual.images) && s.visual.images.length)
  )) {
    ['hero-image', 'proof-gallery', 'caption-bar'].forEach(id => ids.add(id));
  }
  if (type === 'metric-comparison' || type === 'industry-chart' || type === 'finance-bridge') {
    ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'chart-commentary-panel', 'member-ladder', 'basket-metric-strip'].forEach(id => ids.add(id));
    CHART_COMPONENT_IDS.forEach(id => ids.add(id));
  }
  if (type === 'toc' || type === 'toc-clean') ids.add('navigation-sequence');
  if (['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type)) ids.add('content-card-grid');
  if (type === 'portfolio-table') {
    ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'product-matrix', 'table-with-commentary', 'scorecard'].forEach(id => ids.add(id));
  }
  if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio' || type === 'product-showcase') {
    ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'luxury-caption-bar', 'brand-proof-caption', 'product-story-caption', 'evidence-frame', 'source-caption', 'hero-image', 'product-matrix'].forEach(id => ids.add(id));
  }
  if (type === 'strategy-map') {
    ['value-chain', 'value-chain-connector', 'business-proof-rail', 'commentary-panel', 'system-rail', 'brand-world-hero'].forEach(id => ids.add(id));
  }
  if (type === 'architecture' || type === 'architecture-dark') {
    ['system-rail', 'capability-layer-stack', 'commentary-panel'].forEach(id => ids.add(id));
  }
  if (type === 'timeline' || type === 'timeline-dark') {
    ['process-rail', 'campaign-to-member-rail', 'launch-rhythm-strip'].forEach(id => ids.add(id));
  }
  if (type === 'risk-table' || type === 'table') {
    ['risk-register', 'governance-table', 'control-tag'].forEach(id => ids.add(id));
    if (/risk-matrix|materiality-matrix/.test(variant) || s.matrix) ids.add('risk-matrix');
  }
  if (type === 'report-board') {
    ['proof-board', 'commentary-panel', 'source-note'].forEach(id => ids.add(id));
  }
  if (type === 'closing') {
    ['decision-panel', 'contact-block', 'editorial-end-card'].forEach(id => ids.add(id));
  }
  nativeOwnedComponentIdsFor(type, variant).forEach(id => ids.add(id));
  return ids;
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

function compactChartSpecForMeta(spec = {}) {
  if (!spec) return null;
  return {
    version: spec.version,
    id: spec.id || '',
    kind: spec.kind || '',
    requestedKind: spec.requestedKind || '',
    source: spec.source || '',
    routeSource: spec.routeSource || '',
    componentId: chartSpecToComponentId(spec),
    industryTemplate: spec.industryTemplate || '',
    title: spec.title || '',
    insight: spec.insight || '',
    categories: spec.categories || [],
    unit: spec.unit || '',
    period: spec.period || '',
    baseline: spec.baseline || '',
    proofObject: spec.proofObject || '',
    sourceTrace: spec.sourceTrace || null,
    dataQuality: spec.dataQuality || null,
    informationGap: spec.informationGap || null,
    chartContractError: spec.chartContractError || null
  };
}

function recordChartConsumption(slide, spec = {}, result = {}, opts = {}) {
  if (!slide || !spec) return;
  slide.__codexChartConsumption = {
    plannedKind: spec.requestedKind || spec.kind || '',
    actualKind: spec.kind || '',
    plannedComponentId: opts.plannedComponentId || chartSpecToComponentId(spec),
    actualComponentId: result.componentId || chartSpecToComponentId(spec),
    rendererModule: result.rendererModule || '',
    mode: opts.mode || 'native',
    rendered: Boolean(result.rendered),
    degraded: Boolean(spec.requestedKind && spec.requestedKind !== spec.kind) || spec.kind === 'informationGap',
    consumedFields: chartConsumedFields(spec),
    visualChecks: result.visualChecks || {},
    spec: compactChartSpecForMeta(spec)
  };
}

function slideHasChartSpecIntent(s = {}) {
  const type = String(s.type || '');
  if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) return false;
  if (s.chartSpec || s.chartKind || s.chart_kind || s.dataComponent || s.data_component) return true;
  const variant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '');
  return ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type) ||
    /chart|metric|kpi|scorecard|matrix|funnel|waterfall|pareto/i.test(variant);
}

function nativeVariantSuppressesChartMeta(s = {}) {
  const variant = String(s.layoutVariant || s.variant || '');
  return CHART_META_SUPPRESSED_NATIVE_VARIANTS.has(variant) && !(s.chartSpec && s.chartSpec.version === 'chartSpec/v1');
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

function assetRefsForSlide(plan = {}, s = {}) {
  const refs = [];
  const push = value => {
    if (Array.isArray(value)) value.forEach(push);
    else if (value) refs.push(String(value));
  };
  push(s.image);
  push(s.images);
  if (s.visual) {
    push(s.visual.image);
    push(s.visual.images);
  }
  push(mediaForRole(plan, s, slideRole(s)));
  const unique = new Map();
  refs.forEach(ref => {
    const key = /^https?:\/\//i.test(ref) ? ref : path.resolve(process.cwd(), ref);
    if (!unique.has(key)) unique.set(key, ref);
  });
  return [...unique.values()];
}

function sourceTraceForMeta(s = {}) {
  return (s.proof && s.proof.sourceTrace) || s.sourceTrace || {};
}

function assetDecisionForMeta(plan = {}, s = {}) {
  const generation = s.assetGeneration || {};
  const refs = assetRefsForSlide(plan, s);
  const trace = sourceTraceForMeta(s);
  const provenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
  const status = generation.status || (refs.length ? 'bound' : (s.generatedAssetPrompt ? 'required' : 'none'));
  const role = generation.role || (s.visual && s.visual.role) || visualRole(plan, s) || '';
  let mode = 'none';
  if (status === 'blocked') mode = 'blocked';
  else if (refs.length) mode = 'bound';
  else if (s.generatedAssetPrompt) mode = 'pending-generation';
  else if (status === 'required' || generation.mustBind) mode = 'needs-generation';
  else if (status === 'optional') mode = 'optional-generation';
  else if (status === 'none') mode = 'structure-only';
  const proofEligibility = [...new Set(provenance.map(item => item.proofEligibility || '').filter(Boolean))];
  const provenanceClasses = [...new Set(provenance.map(item => item.provenanceClass || item.provenance || '').filter(Boolean))];
  const authorizationStatuses = [...new Set([
    trace.assetAuthorizationStatus,
    ...provenance.map(item => item.authorizationStatus)
  ].filter(Boolean))];
  return {
    version:'asset-decision/v1',
    status,
    mode,
    role,
    visualMode:(s.visual && s.visual.mode) || s.visualMode || '',
    mustBind:generation.mustBind === true,
    syntheticOnly:generation.syntheticOnly === true,
    staleForRoute:generation.staleForRoute === true,
    reason:generation.reason || '',
    generatedAssetPrompt:Boolean(s.generatedAssetPrompt),
    generatedAssetPromptHash:s.generatedAssetPrompt ? shortHash(String(s.generatedAssetPrompt)) : '',
    boundAssetCount:refs.length,
    boundAssetRefs:refs,
    hasBoundAsset:refs.length > 0,
    authorizationStatus:authorizationStatuses[0] || '',
    provenanceClasses,
    proofEligibility,
    imageProvenanceCount:provenance.length,
    proofUse:proofEligibility.includes('factual-proof')
      ? 'factual-proof'
      : (proofEligibility.includes('synthetic-only') || generation.syntheticOnly ? 'synthetic-only' : '')
  };
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
function productItems(s) {
  if (Array.isArray(s.products)) return s.products;
  if (Array.isArray(s.cards)) return s.cards;
  if (Array.isArray(s.items)) return s.items.map(v => typeof v === 'string' ? { title:v } : v);
  return [];
}
function productBreakdownItems(s, items=[]) {
  const raw = s.features || s.sellingPoints || s.breakdown || s.proofPoints || items;
  return (Array.isArray(raw) ? raw : []).map(v => typeof v === 'string' ? { title:v } : v).filter(Boolean);
}
function productShowcase(slide, plan, s, idx) {
  const variant = variantOf(s, 'hero-object');
  const items = productItems(s);
  const product = s.product || items[0] || {};
  const design = designForSlide(plan, s, 'product');

  if (variant === 'catalog-grid') {
    lightCanvas(slide);
    sectionKicker(slide, 'PRODUCT LINEUP', 0.86, 0.72, false);
	    addText(slide, s.title || '产品组合展示', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
	    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.4, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
	    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
	    const productList = items.slice(0,8);
	    if (productList.length === 4) {
	      const imagePaths = productList.map(it => imagePathFromItem(it)).filter(p => p && fs.existsSync(p));
	      const catalogLayout = chooseFourImageLayout(imagePaths, {
	        role:'product',
	        layout:s.catalogLayout || s.imageLayout,
	        featured: !!(productList[0] && (productList[0].featured || productList[0].hero))
	      });
	      if (imagePaths.length >= 3 && catalogLayout === 'grid-2x2') {
	        const slots = [
	          { x:0.92, y:2.02, w:5.08, h:1.86 },
	          { x:6.36, y:2.02, w:5.08, h:1.86 },
	          { x:0.92, y:4.18, w:5.08, h:1.86 },
	          { x:6.36, y:4.18, w:5.08, h:1.86 }
	        ];
	        productList.forEach((it,i)=>{
	          const slot = slots[i];
	          const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
	          const img = imagePathFromItem(it);
	          addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, {
	            fill:{color:panelFill(), transparency:0},
	            line:{color:i===0 ? accent : C.line, transparency:i===0 ? 18 : 16, width:0.46}
	          });
	          if (img && fs.existsSync(img)) {
	            addSmartPhotoPanel(slide, img, slot.x+0.14, slot.y+0.14, 2.18, slot.h-0.28, {
	              role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26
	            });
	          } else {
	            genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, 2.18, slot.h-0.28, `PRODUCT ${i+1}`);
	          }
	          addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+2.58, y:slot.y+0.36, w:0.30, h:0.10, fontSize:6.8, color:accent });
	          addText(slide, itemTitle(it, `产品 ${i+1}`), { x:slot.x+3.00, y:slot.y+0.30, w:1.44, h:0.16, fontSize:10.8, bold:true, color:C.text, fit:'shrink' });
	          addText(slide, itemBody(it), { x:slot.x+3.00, y:slot.y+0.78, w:1.52, h:0.28, fontSize:8.2, color:C.body, fit:'shrink', breakLine:true });
	        });
	        addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.42, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
	        addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
	        return;
	      }
	      const lead = productList[0];
	      const leadImg = imagePathFromItem(lead, design.imagePath || '');
	      const leadBox = { x:0.92, y:2.04, w:4.70, h:3.96 };
	      addRect(slide, leadBox.x, leadBox.y, leadBox.w, leadBox.h, panelFill(), C.line, {
	        fill:{color:panelFill(), transparency:0},
	        line:{color:C.accent, transparency:22, width:0.52}
	      });
	      if (leadImg && fs.existsSync(leadImg)) {
	        addSmartPhotoPanel(slide, leadImg, leadBox.x+0.18, leadBox.y+0.18, leadBox.w-0.36, 2.34, {
	          role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24
	        });
	      } else {
	        genericShowcaseField(slide, leadBox.x+0.18, leadBox.y+0.18, leadBox.w-0.36, 2.34, 'PRIMARY PRODUCT');
	      }
	      addLabel(slide, 'PRIMARY PRODUCT', { x:leadBox.x+0.28, y:leadBox.y+2.78, w:1.42, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
	      addText(slide, itemTitle(lead, '核心产品'), { x:leadBox.x+0.28, y:leadBox.y+3.08, w:1.82, h:0.18, fontSize:12.4, bold:true, color:C.text, fit:'shrink' });
	      addText(slide, itemBody(lead), { x:leadBox.x+2.24, y:leadBox.y+3.06, w:1.86, h:0.22, fontSize:8.8, color:C.body, fit:'shrink' });

	      productList.slice(1).forEach((it,i)=>{
	        const x = 6.14;
	        const y = 2.04 + i*1.28;
	        const accent = i===0 ? C.cyan : (i===1 ? C.violet : '94A3B8');
	        const img = imagePathFromItem(it);
	        addRect(slide, x, y, 5.42, 1.02, panelFill(), C.line, {
	          fill:{color:panelFill(), transparency:0},
	          line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46}
	        });
	        if (img && fs.existsSync(img)) {
	          addSmartPhotoPanel(slide, img, x+0.16, y+0.16, 1.26, 0.70, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
	        } else {
	          addNumber(slide, String(i+2).padStart(2,'0'), { x:x+0.28, y:y+0.38, w:0.34, h:0.12, fontSize:7.2, color:accent });
	          addHairline(slide, x+0.82, y+0.52, 0.52, accent, 20, 0.45);
	        }
	        addText(slide, itemTitle(it, `产品 ${i+2}`), { x:x+1.62, y:y+0.26, w:1.42, h:0.16, fontSize:10.4, bold:true, color:C.text, fit:'shrink' });
	        addText(slide, itemBody(it), { x:x+3.20, y:y+0.23, w:1.62, h:0.22, fontSize:8.8, color:C.body, fit:'shrink' });
	      });
	      addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.42, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
	      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
	      return;
	    }
	    const compact = productList.length <= 6;
    const cardW = compact ? 3.02 : 2.42;
    const cardH = compact ? 1.70 : 1.68;
    const slots = compact
      ? productList.map((_, i) => {
        const row = Math.floor(i / 3);
        const inRow = row === 0 ? Math.min(3, productList.length) : productList.length - 3;
        const rowStart = inRow === 1 ? 5.12 : (inRow === 2 ? 3.42 : 1.72);
        return [rowStart + (i % 3) * 3.48, 2.16 + row * 2.16];
      })
      : [
        [0.92,2.16], [3.74,2.16], [6.56,2.16], [9.38,2.16],
        [0.92,4.48], [3.74,4.48], [6.56,4.48], [9.38,4.48]
      ];
    productList.forEach((it,i)=>{
      const [x,y] = slots[i];
      const img = imagePathFromItem(it);
      addRect(slide, x, y, cardW, cardH, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.45} });
      if (img && fs.existsSync(img)) addSmartPhotoPanel(slide, img, x+0.12, y+0.12, cardW-0.24, 0.82, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:30 });
      else addRect(slide, x+0.12, y+0.12, cardW-0.24, 0.82, C.panelAlt || C.softBlue, C.panelAlt || C.softBlue, { fill:{color:C.panelAlt || C.softBlue, transparency:4}, line:{color:C.line, transparency:100} });
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:y+1.12, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, itemTitle(it, `产品 ${i+1}`), { x:x+0.58, y:y+1.07, w:cardW-1.02, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.58, y:y+1.36, w:cardW-1.00, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
    });
    addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.62, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
    return;
  }

  if (variant === 'feature-strip') {
    lightCanvas(slide);
    sectionKicker(slide, 'PRODUCT SYSTEM', 0.86, 0.72, false);
    addText(slide, s.title || '产品与能力展示', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const visualPanel = { x:0.92, y:2.08, w:5.38, h:3.40 };
    if (design.imagePath && fs.existsSync(design.imagePath)) {
      addSmartPhotoPanel(slide, design.imagePath, visualPanel.x, visualPanel.y, visualPanel.w, visualPanel.h, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:22 });
      addRect(slide, visualPanel.x, visualPanel.y+visualPanel.h-0.56, visualPanel.w, 0.56, C.ink, C.ink, { fill:{color:C.ink, transparency:10}, line:{color:C.ink, transparency:100} });
      addLabel(slide, 'INSPECTABLE OBJECT', { x:visualPanel.x+0.28, y:visualPanel.y+visualPanel.h-0.34, w:1.42, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
      addText(slide, (s.visual && s.visual.caption) || '设备对象保持可检查比例，避免把现场图压成装饰横条。', { x:visualPanel.x+1.92, y:visualPanel.y+visualPanel.h-0.34, w:2.78, h:0.11, fontSize:6.4, color:'CBD5E1', fit:'shrink' });
    } else {
      genericShowcaseField(slide, visualPanel.x, visualPanel.y, visualPanel.w, visualPanel.h, 'INSPECTABLE OBJECT');
    }
    items.slice(0,4).forEach((it,i)=>{
      const x = 6.76 + (i%2)*2.48;
      const y = 2.12 + Math.floor(i/2)*1.62;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, y, 2.16, 1.16, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.48} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.26, w:0.34, h:0.12, fontSize:7.0, color:accent });
      addText(slide, itemTitle(it, `能力 ${i+1}`), { x:x+0.68, y:y+0.20, w:1.12, h:0.15, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.22, y:y+0.66, w:1.62, h:0.20, fontSize:7.2, color:C.body, fit:'shrink' });
    });
    addText(slide, s.note || '产品展示页优先让对象可被看清，再用少量卖点解释价值。', { x:0.94, y:6.42, w:8.0, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
    return;
  }

  lightCanvas(slide);
  sectionKicker(slide, 'PRODUCT HERO', 0.86, 0.72, false);
  addText(slide, s.title || itemTitle(product, '核心产品展示'), { x:0.84, y:1.05, w:5.6, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.subtitle || s.claim || itemBody(product), { x:0.86, y:1.52, w:6.2, h:0.22, fontSize:10.0, color:C.muted, fit:'shrink' });
  PageNumber(slide, idx);

  const hero = { x:0.92, y:2.00, w:6.18, h:3.78 };
  if (design.imagePath && fs.existsSync(design.imagePath)) {
    addSmartPhotoPanel(slide, design.imagePath, hero.x, hero.y, hero.w, hero.h, { role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:20 });
  } else {
    genericShowcaseField(slide, hero.x, hero.y, hero.w, hero.h, 'INSPECTABLE OBJECT');
  }
  addRect(slide, hero.x, hero.y+hero.h-0.72, hero.w, 0.72, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
  addLabel(slide, (s.visual && s.visual.captionLabel) || 'VISUAL PROOF', { x:hero.x+0.28, y:hero.y+hero.h-0.42, w:1.10, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addText(slide, (s.visual && s.visual.caption) || '产品对象保持可检查比例，图片不承载正文。', { x:hero.x+1.66, y:hero.y+hero.h-0.43, w:3.42, h:0.12, fontSize:7.0, color:'CBD5E1', fit:'shrink' });

  const side = { x:7.62, y:2.00, w:3.78, h:3.78 };
  addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'POSITIONING', { x:side.x+0.32, y:side.y+0.36, w:1.12, h:0.11, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addText(slide, itemTitle(product, s.productName || '核心产品'), { x:side.x+0.32, y:side.y+0.84, w:2.58, h:0.26, fontSize:17.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, itemBody(product, s.productBody || '把产品对象、关键卖点和适用场景分层呈现。'), { x:side.x+0.32, y:side.y+1.34, w:2.70, h:0.52, fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true });

  const metrics = (s.metrics || product.metrics || []).slice(0,2);
  metrics.forEach((m,i)=>{
    const x = side.x + 0.32 + i*1.48;
    addNumber(slide, m.value || m.title || '—', { x, y:side.y+2.26, w:1.12, h:0.28, fontSize:22, color:i===0?C.accent:C.cyan, fit:'shrink' });
    addText(slide, m.label || m.body || '', { x, y:side.y+2.78, w:1.18, h:0.12, fontSize:7.0, color:'A8B3C3', fit:'shrink' });
  });
  addHairline(slide, side.x+0.32, side.y+3.24, 0.82, C.accent, 0, 0.62);
  addText(slide, s.tagline || product.tagline || '单品页先让对象成立，再解释为什么值得买/用/接入。', { x:side.x+0.32, y:side.y+3.48, w:2.62, h:0.14, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });

  const breakdown = productBreakdownItems(s, items);
  (breakdown.length ? breakdown : [{ title:'卖点', body:'客户能直接理解。' }, { title:'场景', body:'对应明确使用对象。' }, { title:'证据', body:'配合数据或案例证明。' }]).slice(0,3).forEach((it,i)=>{
    const x = 0.92 + i*3.48;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, x, 6.02, 3.04, 0.58, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?20:16, width:0.40} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.20, y:6.22, w:0.30, h:0.10, fontSize:6.8, color:accent });
    addText(slide, itemTitle(it, `卖点 ${i+1}`), { x:x+0.64, y:6.15, w:0.86, h:0.13, fontSize:8.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+1.62, y:6.15, w:1.00, h:0.13, fontSize:6.8, color:C.body, fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
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
function twoColumnClean(slide, plan, s, idx) {
  masterLight(slide, plan, s.title, idx);
  addText(slide, 'SITUATION READOUT', { x:0.94, y:1.76, w:1.82, h:0.12, fontSize:7.2, color:C.muted, charSpace:1.0 });
  const hasEvidenceImage = addVisualPhotoPanel(slide, plan, s, 'situation', 0.92, 2.08, 4.36, 2.40, { transparency:100, stroke:'E8EEF6', strokeTransparency:18 });
  if (hasEvidenceImage) {
    addRect(slide, 0.92, 4.68, 4.36, 1.24, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'FIELD EVIDENCE', { x:1.20, y:4.96, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, s.leftTitle || '现场证据', { x:1.20, y:5.24, w:1.38, h:0.14, fontSize:9.8, bold:true, color:C.white, fit:'shrink' });
    const evidenceText = (s.visual && s.visual.caption) || (s.left || []).slice(0,1).join(' ');
    addText(slide, evidenceText || '图片用于说明现场对象与业务语境，不承载长段正文。', { x:2.72, y:5.18, w:2.18, h:0.22, fontSize:6.8, color:'CBD5E1', fit:'shrink' });
  } else {
    addRect(slide, 0.92, 2.08, 4.36, 3.86, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, s.leftTitle || '管理现状', { x:1.20, y:2.44, w:2.56, h:0.22, fontSize:14.8, bold:true, color:C.white });
    const runs = (s.left || []).slice(0,4).map(v => ({ text:String(v), options:{ bullet:{type:'bullet'}, breakLine:true } }));
    slide.addText(runs, { x:1.20, y:3.02, w:3.44, h:1.76, fontFace:PROFILE.font, fontSize:10.8, color:'CBD5E1', fit:'shrink', valign:'top', paraSpaceAfterPt:7, margin:0.02 });
    addHairline(slide, 1.20, 5.30, 0.82, C.accent, 0, 0.72);
    addText(slide, '从业务事实出发，先识别运营断点，再进入方案设计。', { x:1.20, y:5.50, w:3.12, h:0.18, fontSize:8.2, color:'94A3B8', fit:'shrink' });
  }

  addText(slide, s.rightTitle || '升级诉求', { x:6.05, y:1.76, w:3.5, h:0.25, fontSize:15.5, bold:true, color:C.text });
  addText(slide, '将材料里的问题转成可验证、可落地的决策议题。', { x:6.05, y:2.12, w:4.6, h:0.16, fontSize:8.7, color:C.muted });
  (s.cards || []).slice(0,3).forEach((c,i)=>{
    const y = 2.62 + i*1.16;
    const accent = i===1 ? C.cyan : C.accent;
    addRect(slide, 6.05, y, 5.18, 0.92, C.white, 'E8EEF6', { line:{color:'E8EEF6', transparency:4, width:0.55} });
    addText(slide, String(i+1).padStart(2,'0'), { x:6.30, y:y+0.18, w:0.34, h:0.11, fontSize:7.2, bold:true, color:accent });
    addText(slide, c.title, { x:6.78, y:y+0.13, w:2.75, h:0.15, fontSize:11.8, bold:true, color:C.text, fit:'shrink' });
    addText(slide, c.body, { x:6.78, y:y+0.48, w:3.92, h:0.20, fontSize:7.6, color:C.body, fit:'shrink' });
  });
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

function coerceChartItems(value, fallback = []) {
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.items)) return value.items.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.rows)) return value.rows.map(v => Array.isArray(v) ? { title:v[0], value:v[1], body:v[2] } : v);
  return fallback;
}

function chartNumber(value, fallback = 0) {
  const n = Number(String(value == null ? '' : value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function chartClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function chartBoxesOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad &&
    a.x + a.w + pad > b.x &&
    a.y < b.y + b.h + pad &&
    a.y + a.h + pad > b.y;
}

function firstChartItems(s, keys = [], fallback = []) {
  for (const key of keys) {
    const value = s[key];
    if (Array.isArray(value) || (value && (Array.isArray(value.items) || Array.isArray(value.rows)))) {
      const items = coerceChartItems(value, []);
      if (items.length) return items;
    }
  }
  return coerceChartItems(null, fallback);
}

function drawIndustryWaterfall(slide, board, s) {
  const items = firstChartItems(s, ['waterfallBridge', 'targetBridge', 'bridge'], [
    { label:'Q1净销', value:'1482w', kind:'start' },
    { label:'P04防晒', value:'+252w', kind:'up' },
    { label:'私域', value:'+39w', kind:'up' },
    { label:'渠道修复', value:'+22w', kind:'up' },
    { label:'其他修复', value:'+55w', kind:'up' },
    { label:'Q2目标', value:'1850w', kind:'end' }
  ]).slice(0, 6);
  const values = items.map((it, i) => chartNumber(it.value, i === 0 ? 100 : 18));
  const start = Math.abs(values[0]) || 100;
  const baseY = board.y + 3.18;
  const topY = board.y + 0.76;
  const maxH = baseY - topY;
  const barW = 0.54;
  const gap = (board.w - 1.22 - items.length * barW) / Math.max(1, items.length - 1);
  addLabel(slide, 'CONTRIBUTION BRIDGE', { x:board.x+0.30, y:board.y+0.30, w:1.62, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
  addHairline(slide, board.x+0.42, baseY, board.w-0.84, C.line, 10, 0.48);
  let cursor = start;
  const bars = items.map((it, i) => {
    const kind = it.kind || it.type || (i === 0 ? 'start' : (i === items.length - 1 ? 'end' : (values[i] < 0 ? 'down' : 'up')));
    const raw = values[i];
    if (kind === 'start') return { it, i, kind, raw, from:0, to:start };
    if (kind === 'end') return { it, i, kind, raw, from:0, to:Math.abs(raw || cursor) };
    const from = cursor;
    const to = cursor + raw;
    cursor = to;
    return { it, i, kind, raw, from, to };
  });
  const minVal = Math.min(0, ...bars.map(bar => Math.min(bar.from, bar.to)));
  const maxVal = Math.max(1, ...bars.map(bar => Math.max(bar.from, bar.to)));
  const span = Math.max(1, maxVal - minVal);
  const yFor = (value) => baseY - ((value - minVal) / span) * maxH;
  bars.forEach((bar) => {
    const { it, i, kind, raw, from, to } = bar;
    const x = board.x + 0.62 + i * (barW + gap);
    const y = Math.min(yFor(from), yFor(to));
    const h = Math.max(0.06, Math.abs(yFor(from) - yFor(to)));
    const color = kind === 'down' ? C.risk : (kind === 'end' ? C.ink : (kind === 'start' ? C.accent : C.cyan));
    addRect(slide, x, y, barW, h, color, color, { fill:{color, transparency:kind === 'down' ? 12 : 0}, line:{color, transparency:100} });
    addText(slide, it.value || '', { x:x-0.24, y:y-0.24, w:1.02, h:0.12, fontSize:7.3, bold:true, color, align:'center', fit:'shrink' });
    addText(slide, it.label || it.title || `项目 ${i+1}`, { x:x-0.40, y:baseY+0.24, w:1.34, h:0.20, fontSize:6.9, bold:i===0 || i===items.length-1, color:C.text, align:'center', fit:'shrink' });
    if (i < items.length - 1) {
      addHairline(slide, x+barW, yFor(to), Math.max(0.10, gap * 0.74), C.line, 24, 0.30);
    }
  });
  addLabel(slide, 'START', { x:board.x+0.40, y:baseY+0.72, w:0.44, h:0.08, fontSize:5.2, color:C.muted, charSpace:0 });
  addLabel(slide, 'TARGET', { x:board.x+board.w-1.02, y:baseY+0.72, w:0.56, h:0.08, fontSize:5.2, color:C.muted, charSpace:0 });
}

function drawMonthlyPulseTrend(slide, board, s) {
  const items = firstChartItems(s, ['monthlyPulse', 'monthlyTrend', 'trend'], (s.metrics || [
    { label:'1月', value:'456.2w', note:'春节前礼盒与精华稳定' },
    { label:'2月', value:'402.2w', note:'节后流量低谷' },
    { label:'3月', value:'618.4w', note:'女神节+防晒预热' }
  ])).slice(0, 5);
  const values = items.map((it, i) => chartNumber(it.value, [456.2, 402.2, 618.4, 520, 560][i] || 100));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const chart = { x:board.x+0.56, y:board.y+0.70, w:board.w-1.06, h:2.60 };
  addLabel(slide, 'MONTHLY NET SALES TREND', { x:board.x+0.30, y:board.y+0.30, w:1.90, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
  addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 10, 0.50);
  slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:24, width:0.34} });
  const plotX = chart.x + 0.42;
  const plotW = chart.w - 0.84;
  const step = items.length > 1 ? plotW / (items.length - 1) : 0;
  const points = items.map((it, i) => {
    const x = items.length > 1 ? plotX + i * step : chart.x + chart.w / 2;
    const y = chart.y + chart.h - ((values[i] - min) / span) * (chart.h - 0.38) - 0.18;
    return { x, y, item:it, value:values[i] };
  });
  const baselineY = chart.y + chart.h;
  points.forEach((p, i) => {
    const color = i === values.indexOf(max) ? C.accent : (i === values.indexOf(min) ? C.cyan : C.violet);
    slide.addShape('line', { x:p.x, y:p.y, w:0, h:Math.max(0.04, baselineY - p.y), line:{color, transparency:18, width:0.44} });
    addHairline(slide, p.x - 0.16, baselineY, 0.32, color, 18, 0.34);
    slide.addShape('ellipse', { x:p.x-0.13, y:p.y-0.13, w:0.26, h:0.26, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.40} });
    addText(slide, p.item.value || String(p.value), { x:p.x-0.48, y:p.y-0.42, w:0.96, h:0.14, fontSize:8.2, bold:true, color, align:'center', fit:'shrink' });
    addText(slide, p.item.label || p.item.title || `${i+1}月`, { x:p.x-0.42, y:chart.y+chart.h+0.26, w:0.84, h:0.14, fontSize:8.4, bold:true, color:C.text, align:'center', fit:'shrink' });
    addText(slide, compactEvidenceCaption(p.item.note || p.item.body || '', 18), { x:p.x-0.78, y:chart.y+chart.h+0.58, w:1.56, h:0.18, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
  });
}

function drawChannelEfficiencyMatrix(slide, board, s) {
  const items = firstChartItems(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'], s.items || s.cards || [
    { label:'私域CRM', title:'私域CRM', value:'8x', x:22, y:82, size:64, body:'ROAS高、花费低' },
    { label:'天猫搜索', title:'天猫搜索', value:'4.1x', x:56, y:44, size:48, body:'承接品牌词' },
    { label:'抖音', title:'抖音', value:'4.1x', x:84, y:44, size:46, body:'脚本收口' },
    { label:'小红书KOL', title:'小红书KOL', value:'3.3x', x:66, y:34, size:42, body:'种草承接' },
    { label:'京东广告', title:'京东广告', value:'3.2x', x:30, y:33, size:40, body:'资源位' }
  ]).slice(0, 6);
  const chart = { x:board.x+0.54, y:board.y+0.62, w:board.w-1.06, h:2.84 };
  addLabel(slide, 'ROAS × SPEND MATRIX', { x:board.x+0.30, y:board.y+0.30, w:1.58, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
  addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 8, 0.52);
  slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:8, width:0.52} });
  slide.addShape('line', { x:chart.x + chart.w * 0.50, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:58, width:0.28} });
  addText(slide, 'ROAS', { x:chart.x-0.06, y:chart.y-0.28, w:0.56, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink' });
  addText(slide, '花费', { x:chart.x+chart.w-0.40, y:chart.y+chart.h+0.16, w:0.40, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink', align:'right' });
  addText(slide, '高效触点', { x:chart.x+0.18, y:chart.y+0.12, w:0.78, h:0.11, fontSize:6.4, color:C.accent, fit:'shrink' });
  addText(slide, '规模触点', { x:chart.x+chart.w-0.88, y:chart.y+0.12, w:0.76, h:0.11, fontSize:6.4, color:C.muted, fit:'shrink', align:'right' });
  const bubbles = items.map((it, i) => {
    const xVal = chartNumber(it.x || it.spend || it.cost || it.share, 18 + i * 14);
    const yVal = chartNumber(it.y || it.roas || it.efficiency || it.score || it.value, 72 - i * 8);
    const sizeVal = chartNumber(it.size || it.budget || it.weight, 42 - i * 3);
    const r = Math.max(0.18, Math.min(0.42, sizeVal / 160));
    const x = chart.x + chartClamp(xVal / 100, 0.06, 0.96) * chart.w;
    const y = chart.y + chart.h - chartClamp(yVal / 100, 0.06, 0.96) * chart.h;
    const color = [C.accent, C.cyan, C.violet, C.risk, '94A3B8', C.muted][i] || C.accent;
    return {
      item: it,
      i,
      x,
      y,
      r,
      color,
      bubbleBox: { x:x-r, y:y-r, w:r*2, h:r*2 }
    };
  });
  bubbles.forEach(p => {
    slide.addShape('ellipse', { x:p.x-p.r, y:p.y-p.r, w:p.r*2, h:p.r*2, fill:{color:p.color, transparency:8}, line:{color:p.color, transparency:100} });
    addText(slide, p.item.value || p.item.roas || '', { x:p.x-p.r, y:p.y-0.06, w:p.r*2, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink', allowTiny:true });
  });
  const occupiedLabels = [];
  const chooseLabelBox = (p) => {
    const label = p.item.label || p.item.title || p.item.name || `渠道 ${p.i+1}`;
    const w = chartClamp(0.78 + String(label).length * 0.045, 0.90, 1.22);
    const h = 0.20;
    const pad = 0.08;
    const raw = [
      { x:p.x+p.r+0.12, y:p.y-h/2, side:'right', rank:0 },
      { x:p.x-p.r-w-0.12, y:p.y-h/2, side:'left', rank:1 },
      { x:p.x-w/2, y:p.y-p.r-h-0.10, side:'above', rank:2 },
      { x:p.x-w/2, y:p.y+p.r+0.10, side:'below', rank:3 },
      { x:p.x+p.r+0.12, y:p.y-p.r-h-0.04, side:'upperRight', rank:4 },
      { x:p.x+p.r+0.12, y:p.y+p.r+0.04, side:'lowerRight', rank:5 },
      { x:p.x-p.r-w-0.12, y:p.y-p.r-h-0.04, side:'upperLeft', rank:6 },
      { x:p.x-p.r-w-0.12, y:p.y+p.r+0.04, side:'lowerLeft', rank:7 }
    ];
    const candidates = raw.map(candidate => {
      const box = {
        x: chartClamp(candidate.x, chart.x + pad, chart.x + chart.w - w - pad),
        y: chartClamp(candidate.y, chart.y + pad, chart.y + chart.h - h - pad),
        w,
        h,
        side: candidate.side
      };
      const labelHits = occupiedLabels.filter(other => chartBoxesOverlap(box, other, 0.05)).length;
      const bubbleHits = bubbles.filter(other => chartBoxesOverlap(box, other.bubbleBox, other === p ? 0.09 : 0.05)).length;
      const shift = Math.abs(box.x - candidate.x) + Math.abs(box.y - candidate.y);
      const sidePreference = (p.x > chart.x + chart.w * 0.74 && /right/i.test(candidate.side)) ? 1.6 : 0;
      return { box, score:candidate.rank + sidePreference + shift * 7 + labelHits * 70 + bubbleHits * 48 };
    }).sort((a, b) => a.score - b.score);
    return Object.assign({ label }, candidates[0].box);
  };
  bubbles.forEach(p => {
    const labelBox = chooseLabelBox(p);
    occupiedLabels.push(labelBox);
    const labelMidY = labelBox.y + labelBox.h / 2;
    if (labelBox.x > p.x + p.r && Math.abs(labelMidY - p.y) < 0.18) {
      const w = labelBox.x - (p.x + p.r + 0.05);
      if (w > 0.08) addHairline(slide, p.x+p.r+0.03, p.y, w, C.line, 44, 0.22);
    } else if (labelBox.x + labelBox.w < p.x - p.r && Math.abs(labelMidY - p.y) < 0.18) {
      const w = p.x - p.r - (labelBox.x + labelBox.w + 0.05);
      if (w > 0.08) addHairline(slide, labelBox.x+labelBox.w+0.03, p.y, w, C.line, 44, 0.22);
    }
    addText(slide, labelBox.label, { x:labelBox.x, y:labelBox.y+0.02, w:labelBox.w, h:labelBox.h, fontSize:7.0, bold:true, color:C.text, fit:'shrink' });
  });
  const legendY = board.y + 3.56;
  ['低花费/高效率', '高花费/高效率', '需优化'].forEach((label, i) => {
    const color = [C.accent, C.cyan, C.risk][i];
    slide.addShape('ellipse', { x:board.x+0.56+i*1.70, y:legendY+0.03, w:0.09, h:0.09, fill:{color}, line:{color, transparency:100} });
    addText(slide, label, { x:board.x+0.72+i*1.70, y:legendY, w:1.10, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
  });
}

function industryChartSlide(slide, plan, s, idx) {
  const variant = variantOf(s, 'evidence-readout');
  lightCanvas(slide);
  const labels = {
    'downtime-pareto': 'DOWNTIME PARETO',
    'valuation-sensitivity': 'VALUATION SENSITIVITY',
    'quality-handoff': 'QUALITY HANDOFF',
    'patient-bottleneck': 'PATIENT BOTTLENECK',
    'member-cohort-ladder': 'MEMBER COHORTS',
    'channel-efficiency-matrix': 'CHANNEL EFFICIENCY',
    'monthly-pulse-trend': 'MONTHLY PULSE',
    'waterfall-bridge': 'TARGET BRIDGE',
    'dispatch-map': 'DISPATCH MAP',
    'adoption-funnel': 'ADOPTION FUNNEL',
    'evidence-readout': 'INDUSTRY READOUT'
  };
  sectionKicker(slide, labels[variant] || labels['evidence-readout'], 0.86, 0.72, false);
  addText(slide, s.title || '行业证据读数', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const side = { x:0.92, y:2.10, w:2.62, h:3.96 };
  const board = { x:3.92, y:2.10, w:7.76, h:3.96 };
  addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PROOF OBJECT', { x:side.x+0.28, y:side.y+0.34, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || labels[variant] || '行业读数', { x:side.x+0.28, y:side.y+0.86, w:1.72, h:0.32, fontSize:14.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || s.decision || '把行业材料转成可判断、可追责、可行动的证据对象。', { x:side.x+0.28, y:side.y+1.56, w:1.86, h:0.66, fontSize:8.8, color:'CBD5E1', fit:'shrink', breakLine:true });
  addHairline(slide, side.x+0.28, side.y+2.62, 0.78, C.accent, 0, 0.55);
  addText(slide, s.note || '关键指标与行业对象放在同一张判断图中。', { x:side.x+0.28, y:side.y+2.92, w:1.76, h:0.42, fontSize:8.8, color:'A8B3C3', fit:'shrink', breakLine:true });
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

  const chartSpec = s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length });
  let chartSpecRendered = false;
  if (chartSpec) {
    const result = renderChartSpec(componentRendererContext(slide), chartSpec, {
      x:board.x,
      y:board.y,
      w:board.w,
      h:board.h,
      noFrame:true,
      showTitle:false,
      compactHeader:true
    });
    if (result.rendered) {
      chartSpecRendered = true;
      recordChartConsumption(slide, chartSpec, result, { plannedComponentId:chartSpecToComponentId(chartSpec), mode:'native-chart-spec' });
    }
  }

  if (chartSpecRendered) {
    // chartSpec/v1 renderer owns the board.
  } else if (variant === 'waterfall-bridge') {
    drawIndustryWaterfall(slide, board, s);
  } else if (variant === 'monthly-pulse-trend') {
    drawMonthlyPulseTrend(slide, board, s);
  } else if (variant === 'channel-efficiency-matrix') {
    drawChannelEfficiencyMatrix(slide, board, s);
  } else if (variant === 'downtime-pareto') {
    const items = coerceChartItems(s.downtimePareto || s.pareto || s.lossPareto || s.oeeLosses, [
      { title:'等待备件', value:36, body:'停机分钟' },
      { title:'传感器误报', value:28, body:'停机分钟' },
      { title:'换型调试', value:22, body:'停机分钟' },
      { title:'巡检遗漏', value:14, body:'停机分钟' }
    ]).slice(0,5);
    const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
    addLabel(slide, 'LOSS SOURCES', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    items.forEach((it,i)=>{
      const y = board.y + 0.86 + i*0.56;
      const val = Number(it.value) || (max - i*5);
      const w = Math.max(0.44, (board.w - 2.78) * val / max);
      const color = i===0 ? C.risk : (i===1 ? C.accent : C.cyan);
      addText(slide, itemTitle(it, `损失 ${i+1}`), { x:board.x+0.34, y:y-0.02, w:1.28, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addRect(slide, board.x+1.86, y+0.02, board.w-2.60, 0.16, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
      addRect(slide, board.x+1.86, y+0.02, w, 0.16, color, color, { fill:{color, transparency:i===0?0:10}, line:{color, transparency:100} });
      addText(slide, `${val}${it.unit || '%'}`, { x:board.x+board.w-0.78, y:y-0.01, w:0.46, h:0.12, fontSize:7.2, bold:true, color:color, align:'right', fit:'shrink' });
    });
  } else if (variant === 'valuation-sensitivity') {
    const rows = (s.valuationSensitivity && s.valuationSensitivity.rows) || s.rows || ['低增长','基准','高增长'];
    const cols = (s.valuationSensitivity && s.valuationSensitivity.cols) || ['低退出倍数','基准','高退出倍数'];
    const values = (s.valuationSensitivity && s.valuationSensitivity.values) || [[12,16,19],[15,20,24],[18,23,29]];
    addLabel(slide, 'IRR / EXIT SCENARIO', { x:board.x+0.30, y:board.y+0.32, w:1.72, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    rows.slice(0,3).forEach((r,ri)=>{
      addText(slide, String(r), { x:board.x+0.34, y:board.y+1.00+ri*0.78, w:1.06, h:0.16, fontSize:8.8, bold:true, color:C.body, fit:'shrink' });
      cols.slice(0,3).forEach((c,ci)=>{
        if (ri===0) addText(slide, String(c), { x:board.x+1.70+ci*1.52, y:board.y+0.64, w:1.02, h:0.16, fontSize:8.8, color:C.muted, align:'center', fit:'shrink' });
        const v = (values[ri] && values[ri][ci]) || 0;
        const color = v >= 23 ? C.cyan : (v <= 14 ? C.risk : C.accent);
        addRect(slide, board.x+1.62+ci*1.52, board.y+0.92+ri*0.78, 1.18, 0.46, color, color, { fill:{color, transparency:v>=23?8:18}, line:{color, transparency:100} });
        addText(slide, `${v}%`, { x:board.x+1.62+ci*1.52, y:board.y+1.06+ri*0.78, w:1.18, h:0.12, fontSize:9.0, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink' });
      });
    });
  } else if (variant === 'quality-handoff') {
    const items = coerceChartItems(s.qualityHandoff || s.handoffs || s.handoffMap, [
      { from:'导诊', to:'检查', title:'身份与检查项目', body:'避免重复问询' },
      { from:'检查', to:'医生', title:'报告节点', body:'异常优先提醒' },
      { from:'医生', to:'随访', title:'处置建议', body:'进入质控复盘' }
    ]).slice(0,4);
    addLabel(slide, 'ROLE HANDOFFS', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    items.forEach((it,i)=>{
      const x = board.x + 0.34 + i*1.78;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+0.92, 1.34, 1.62, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.42} });
      addText(slide, it.from || `角色 ${i+1}`, { x:x+0.16, y:board.y+1.08, w:0.82, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, it.to || '下一角色', { x:x+0.16, y:board.y+1.40, w:0.82, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemTitle(it, '交接材料'), { x:x+0.16, y:board.y+1.86, w:0.96, h:0.16, fontSize:8.8, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.16, y:board.y+2.18, w:0.92, h:0.18, fontSize:8.8, color:C.body, fit:'shrink' });
      if (i < items.length - 1) addArrowLine(slide, x+1.42, board.y+1.72, 0.28, 0, accent, { transparency:20, width:0.34 });
    });
  } else if (variant === 'member-cohort-ladder') {
    const items = coerceChartItems(s.memberCohorts || s.cohorts || s.rfmLadder, [
      { title:'新客', value:'31%', body:'首购转化' },
      { title:'活跃会员', value:'42%', body:'复购贡献' },
      { title:'高价值会员', value:'18%', body:'客单提升' },
      { title:'沉睡会员', value:'9%', body:'召回动作' }
    ]).slice(0,4);
    items.forEach((it,i)=>{
      const y = board.y + 3.10 - i*0.62;
      const w = 1.24 + i*0.70;
      const x = board.x + 0.72 + i*0.38;
      const accent = i===0 ? C.muted : (i===1 ? C.accent : (i===2 ? C.cyan : C.violet));
      addRect(slide, x, y, w, 0.38, accent, accent, { fill:{color:accent, transparency:i===0?22:8}, line:{color:accent, transparency:100} });
      addText(slide, itemTitle(it, `客群 ${i+1}`), { x:x+0.14, y:y+0.08, w:0.82, h:0.16, fontSize:8.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
      addText(slide, it.value || '', { x:x+w+0.28, y:y+0.08, w:0.54, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+w+0.92, y:y+0.08, w:1.44, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
    });
  } else if (variant === 'dispatch-map') {
    const items = coerceChartItems(s.dispatchMap || s.siteDispatch || s.loadStorageDispatch, [
      { title:'A 站', value:'SOC 63%', body:'告警优先' },
      { title:'B 站', value:'负荷高峰', body:'调度放电' },
      { title:'C 站', value:'限电风险', body:'策略复盘' },
      { title:'区域中心', value:'36min', body:'平均处置' }
    ]).slice(0,4);
    addText(slide, s.centerTitle || '区域调度', { x:board.x+3.12, y:board.y+1.76, w:1.06, h:0.16, fontSize:11.4, bold:true, color:C.text, align:'center', fit:'shrink' });
    slide.addShape('ellipse', { x:board.x+3.12, y:board.y+1.22, w:1.06, h:1.06, fill:{color:C.panelAlt || C.softBlue, transparency:5}, line:{color:C.accent, transparency:28, width:0.42} });
    const pos = [[0.42,0.76],[5.54,0.76],[0.42,2.72],[5.54,2.72]];
    items.forEach((it,i)=>{
      const [px,py]=pos[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.risk));
      addRect(slide, board.x+px, board.y+py, 1.64, 0.72, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.38} });
      addText(slide, itemTitle(it, `站点 ${i+1}`), { x:board.x+px+0.16, y:board.y+py+0.10, w:0.72, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, it.value || '', { x:board.x+px+0.94, y:board.y+py+0.10, w:0.52, h:0.16, fontSize:8.8, color:accent, align:'right', fit:'shrink' });
      addText(slide, itemBody(it), { x:board.x+px+0.16, y:board.y+py+0.44, w:1.16, h:0.14, fontSize:8.8, color:C.muted, fit:'shrink' });
    });
  } else if (variant === 'adoption-funnel' || variant === 'patient-bottleneck') {
    const source = variant === 'adoption-funnel'
      ? (s.adoptionFunnel || s.activationFunnel || s.cohortFunnel)
      : (s.patientBottlenecks || s.waitBottlenecks);
    const fallback = variant === 'adoption-funnel'
      ? [{title:'注册',value:100},{title:'激活',value:64},{title:'集成',value:46},{title:'扩展',value:28}]
      : [{title:'预约',value:100,body:'入口等待'},{title:'到院',value:72,body:'签到等待'},{title:'检查',value:48,body:'资源瓶颈'},{title:'反馈',value:34,body:'处置瓶颈'}];
    const items = coerceChartItems(source, fallback).slice(0,5);
    const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
    items.forEach((it,i)=>{
      const y = board.y + 0.76 + i*0.56;
      const val = Number(it.value) || (max - i*12);
      const w = Math.max(0.70, 4.80 * val / max);
      const x = board.x + 0.72 + (4.80 - w)/2;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, y, w, 0.32, accent, accent, { fill:{color:accent, transparency:i===0?2:12}, line:{color:accent, transparency:100} });
      addText(slide, itemTitle(it, `阶段 ${i+1}`), { x:board.x+5.96, y:y+0.05, w:0.88, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, `${val}${it.unit || '%'}`, { x:board.x+6.88, y:y+0.05, w:0.44, h:0.16, fontSize:8.8, color:accent, align:'right', fit:'shrink' });
    });
  } else {
    const items = coerceChartItems(s.items || s.cards, [
      { title:'对象', body:'行业材料对象' },
      { title:'证据', body:'可检查事实' },
      { title:'动作', body:'下一步行动' }
    ]).slice(0,4);
    items.forEach((it,i)=>{
      const y = board.y + 0.82 + i*0.68;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.34, y:y+0.08, w:0.30, h:0.11, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `证据 ${i+1}`), { x:board.x+0.82, y:y, w:1.30, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:board.x+2.42, y:y, w:3.72, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
      addHairline(slide, board.x+0.82, y+0.36, board.w-1.52, C.line, 18, 0.30);
    });
  }
  const logic = s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain;
  if (logic && typeof logic === 'object') {
    const logicItems = [
      { label:'现状', text:logic.currentState || logic.current_state || logic.problem || '' },
      { label:'原因', text:logic.cause || logic.root_cause || logic.driver || '' },
      { label:'动作', text:logic.action || logic.operating_action || logic.response || '' },
      { label:'衡量', text:logic.metric || logic.measure || logic.kpi || logic.expected_result || '' }
    ].filter(item => item.text);
    if (logicItems.length >= 2) {
      addHairline(slide, 0.94, 6.32, 10.70, C.line, 12, 0.55);
      const slotW = 10.44 / logicItems.length;
      logicItems.forEach((item, i) => {
        const x = 1.00 + i * slotW;
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
        addLabel(slide, item.label, { x, y:6.54, w:0.46, h:0.10, fontSize:5.8, color:accent, charSpace:0 });
        addText(slide, compactEvidenceCaption(item.text, 20), { x:x+0.54, y:6.50, w:slotW-0.66, h:0.14, fontSize:7.6, color:C.body, fit:'shrink' });
      });
    }
  }
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function strategyMap(slide, plan, s, idx) {
  const strategyVariant = variantOf(s, '');
  if (strategyVariant === 'value-creation-process-map') return valueCreationProcessMapSlide(slide, plan, s, idx);
  if (strategyVariant === 'single-object-concept-map') return singleObjectConceptMapSlide(slide, plan, s, idx);
  if (strategyVariant === 'brand-world-and-business-proof') return brandWorldBusinessProof(slide, plan, s, idx);
  lightCanvas(slide);
  sectionKicker(slide, 'VALUE CREATION MAP', 0.86, 0.72, false);
  addText(slide, s.title || '价值创造路径', { x:0.84, y:1.05, w:5.7, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.claim || s.subtitle) addText(slide, s.claim || s.subtitle, { x:0.86, y:1.52, w:6.6, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const drivers = s.drivers || s.inputs || (s.left || []).slice(0,3);
  const actions = s.actions || s.capabilities || (s.cards || []).slice(0,4).map(c=>c.title);
  const outcomes = s.outcomes || s.outputs || (s.right || []).slice(0,3);

  const left = { x:0.92, y:2.10, w:2.50, h:3.86 };
  const center = { x:4.16, y:1.96, w:4.02, h:4.14 };
  const right = { x:8.72, y:2.10, w:2.92, h:3.86 };
  addRect(slide, left.x, left.y, left.w, left.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addRect(slide, center.x, center.y, center.w, center.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'INPUT', { x:left.x+0.28, y:left.y+0.34, w:0.80, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.leftTitle || '关键输入', { x:left.x+0.28, y:left.y+0.70, w:1.60, h:0.18, fontSize:12.6, bold:true, color:C.text, fit:'shrink' });
  (drivers || []).slice(0,3).forEach((it,i)=>{
    const y = left.y + 1.28 + i*0.66;
    addNumber(slide, String(i+1).padStart(2,'0'), { x:left.x+0.28, y:y-0.03, w:0.34, h:0.12, fontSize:7.2, color:i===0?C.accent:C.muted });
    addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:left.x+0.74, y:y-0.05, w:1.36, h:0.16, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
    addHairline(slide, left.x+0.28, y+0.28, 1.74, C.line, 16, 0.38);
  });

  addLabel(slide, 'OPERATING MODEL', { x:center.x+0.34, y:center.y+0.34, w:1.55, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.9 });
  addText(slide, s.centerTitle || '运营动作', { x:center.x+0.34, y:center.y+0.78, w:1.70, h:0.20, fontSize:13.4, bold:true, color:C.white, fit:'shrink' });
  addText(slide, '把输入转译为可运营、可复盘、可放大的增长动作。', { x:center.x+0.34, y:center.y+1.12, w:3.10, h:0.14, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  (actions || []).slice(0,4).forEach((it,i)=>{
    const y = center.y + 1.62 + i*0.52;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.tertiary || C.violet : C.darkMuted || 'A8B3C3'));
    addRect(slide, center.x+0.34, y, 3.36, 0.34, C.ink2, C.darkLine || '334155', {
      fill:{color:C.ink2, transparency:26},
      line:{color:i===0?C.accent:(C.darkLine || '334155'), transparency:i===0?24:58, width:0.35}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:center.x+0.54, y:y+0.11, w:0.30, h:0.09, fontSize:6.4, color:accent });
    addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:center.x+1.00, y:y+0.08, w:1.78, h:0.12, fontSize:8.7, bold:true, color:C.white, fit:'shrink' });
  });

  addLabel(slide, 'OUTCOME', { x:right.x+0.28, y:right.y+0.34, w:0.88, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.rightTitle || '结果信号', { x:right.x+0.28, y:right.y+0.70, w:1.64, h:0.18, fontSize:12.6, bold:true, color:C.text, fit:'shrink' });
  (outcomes || []).slice(0,3).forEach((it,i)=>{
    const y = right.y + 1.22 + i*0.74;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
    addRect(slide, right.x+0.28, y, 2.20, 0.46, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:i===0?C.accent:C.line, transparency:i===0?20:18, width:0.42}
    });
    slide.addShape('ellipse', { x:right.x+0.50, y:y+0.18, w:0.08, h:0.08, fill:{color:accent}, line:{color:accent, transparency:100} });
    addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:right.x+0.72, y:y+0.13, w:1.50, h:0.13, fontSize:8.5, bold:true, color:C.text, fit:'shrink' });
  });
  addArrowLine(slide, left.x+left.w+0.24, 4.02, center.x-left.x-left.w-0.42, 0, C.accent, { transparency:14, width:0.72 });
  addArrowLine(slide, center.x+center.w+0.20, 4.02, right.x-center.x-center.w-0.28, 0, C.accent, { transparency:14, width:0.72 });
  addHairline(slide, 0.92, 6.34, 10.64, C.line, 14, 0.55);
  addText(slide, s.note || '价值流动、投入动作与经营结果保持在同一套链路中。', { x:0.96, y:6.54, w:8.90, h:0.13, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
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

function manifestoSlide(slide, plan, s, idx) {
  const manifestoVariant = variantOf(s, '');
  if (manifestoVariant === 'culture-cover-with-soft-geometry') return cultureCoverSoftGeometry(slide, plan, s, idx);
  if (manifestoVariant === 'mission-statement-stage') return missionStatementStage(slide, plan, s, idx);
  if (manifestoVariant === 'value-principle-cards') return valuePrincipleCards(slide, plan, s, idx);
  stageCanvas(slide, { field:true });
  addLabel(slide, 'CULTURE MANIFESTO', { x:0.84, y:0.92, w:1.80, h:0.13, fontSize:6.8, color:C.cyan, charSpace:1.1 });
  addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.76, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });
  const statement = s.statement || s.title || '共识不是口号，而是持续行动的方式';
  addText(slide, statement, { x:0.82, y:1.72, w:6.88, h:0.92, fontSize:30, bold:true, color:C.white, fit:'shrink', breakLine:true });
  addText(slide, s.claim || s.subtitle || s.intro || '', { x:0.86, y:3.02, w:5.80, h:0.25, fontSize:11.0, color:'CBD5E1', fit:'shrink' });
  addHairline(slide, 0.88, 3.54, 0.86, C.accent, 0, 0.75);
  const values = (s.values || s.items || []).slice(0,4);
  values.forEach((v,i)=>{
    const x = 0.92 + i*2.78;
    const title = typeof v === 'string' ? v : (v.title || v.label || '');
    const body = typeof v === 'string' ? '' : (v.body || v.note || '');
    addRect(slide, x, 4.66, 2.30, 1.10, C.ink2, '334155', { fill:{color:C.ink2, transparency:34}, line:{color:i===0?C.accent:'334155', transparency:i===0?24:58, width:0.45} });
    addText(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.92, w:0.32, h:0.12, fontSize:7.0, bold:true, color:i===0?C.accent:C.cyan });
    addText(slide, title, { x:x+0.24, y:5.20, w:1.48, h:0.16, fontSize:10.8, bold:true, color:C.white, fit:'shrink' });
    if (body) addText(slide, body, { x:x+0.24, y:5.52, w:1.68, h:0.14, fontSize:6.7, color:'A8B3C3', fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function cultureCoverSoftGeometry(slide, plan, s, idx) {
  stageCanvas(slide, { field:true });
  addDarkBreathingCircle(slide, 8.66, 0.34, 4.12, 2.34, C.accent);
  addLabel(slide, 'CULTURE COVER', { x:0.86, y:0.88, w:1.42, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  addText(slide, s.statement || s.title || '文化不是口号，而是团队交付方式', {
    x:0.84, y:1.56, w:6.48, h:0.96, fontSize:31.0, bold:true, color:C.white, fit:'shrink', breakLine:true
  });
  addText(slide, s.claim || s.subtitle || '用组织场景、行为原则和产出证据说明文化如何发生。', {
    x:0.88, y:2.88, w:5.70, h:0.22, fontSize:10.4, color:C.captionOnImage, fit:'shrink'
  });
  addHairline(slide, 0.90, 3.42, 0.90, C.accent, 0, 0.72);
  const soft = [
    { x:7.72, y:2.00, w:2.62, h:1.18, color:C.accent, title:'行为', body:'能被观察' },
    { x:8.94, y:3.42, w:2.40, h:1.08, color:C.cyan, title:'场景', body:'能被复盘' },
    { x:6.82, y:4.44, w:2.36, h:1.04, color:C.violet, title:'产出', body:'能被证明' }
  ];
  soft.forEach((box, i) => {
    addRect(slide, box.x, box.y, box.w, box.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:24 + i * 8},
      line:{color:box.color, transparency:38, width:0.42}
    });
    addText(slide, box.title, { x:box.x+0.28, y:box.y+0.34, w:0.72, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, box.body, { x:box.x+1.32, y:box.y+0.36, w:0.76, h:0.12, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'right' });
  });
  const values = (s.values || s.items || []).slice(0, 3);
  values.forEach((v, i) => {
    const y = 4.52 + i * 0.46;
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
    addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.92, y:y+0.02, w:0.30, h:0.09, fontSize:6.2, color:accent });
    addText(slide, itemTitle(v, `原则 ${i + 1}`), { x:1.36, y:y, w:1.24, h:0.13, fontSize:8.7, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(v), { x:2.98, y:y, w:3.00, h:0.12, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function missionStatementStage(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  addLabel(slide, 'MISSION STAGE', { x:0.86, y:0.90, w:1.50, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  addText(slide, s.statement || s.title || '使命必须被行为证明', {
    x:0.82, y:1.42, w:7.10, h:1.10, fontSize:34.0, bold:true, color:C.white, fit:'shrink', breakLine:true
  });
  addText(slide, s.claim || s.subtitle || '使命页必须用行为原则和证据支撑。', { x:0.86, y:2.82, w:5.60, h:0.20, fontSize:10.0, color:C.captionOnImage, fit:'shrink' });
  addRect(slide, 0.88, 3.30, 0.94, 0.05, C.accent, C.accent);
  addRect(slide, 1.96, 3.30, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

  const values = (s.values || s.items || []).slice(0, 4);
  const board = { x:0.92, y:4.24, w:10.54, h:1.42 };
  values.forEach((v, i) => {
    const x = board.x + i * 2.58;
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8'));
    addRect(slide, x, board.y, 2.18, board.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:i === 0 ? 18 : 38},
      line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 22 : 58, width:0.42}
    });
    addNumber(slide, String(i + 1).padStart(2, '0'), { x:x+0.22, y:board.y+0.32, w:0.28, h:0.09, fontSize:6.2, color:accent });
    addText(slide, itemTitle(v, `行为 ${i + 1}`), { x:x+0.60, y:board.y+0.25, w:1.08, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(v), { x:x+0.24, y:board.y+0.78, w:1.56, h:0.18, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addRect(slide, 0.92, 6.18, 8.72, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:28}, line:{color:'334155', transparency:68, width:0.30} });
  addLabel(slide, 'PROOF REQUIRED', { x:1.14, y:6.28, w:1.22, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
  addText(slide, s.note || '使命必须落到行为、角色和产出证据。', { x:2.62, y:6.26, w:6.34, h:0.11, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function valuePrincipleCards(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'VALUE PRINCIPLE CARDS', 0.86, 0.72, false);
  addText(slide, s.title || '价值观卡片必须写出可观察行为', { x:0.84, y:1.05, w:6.20, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '每张卡片都包含原则、行为和证明材料。', { x:0.86, y:1.52, w:6.70, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const values = (s.values || s.items || []).slice(0, 4);
  const slots = [
    { x:0.92, y:2.18, color:C.accent },
    { x:6.24, y:2.18, color:C.cyan },
    { x:0.92, y:4.32, color:C.violet },
    { x:6.24, y:4.32, color:C.muted }
  ];
  slots.forEach((slot, i) => {
    const v = values[i] || {};
    addRect(slide, slot.x, slot.y, 4.86, 1.62, panelFill(), i === 0 ? slot.color : C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:i === 0 ? slot.color : C.line, transparency:i === 0 ? 18 : 16, width:0.44}
    });
    addRect(slide, slot.x, slot.y, 0.08, 1.62, slot.color, slot.color, { line:{color:slot.color, transparency:100} });
    addLabel(slide, `PRINCIPLE ${String(i + 1).padStart(2, '0')}`, { x:slot.x+0.28, y:slot.y+0.28, w:1.16, h:0.09, fontSize:5.6, color:slot.color, charSpace:0.7 });
    addText(slide, itemTitle(v, `原则 ${i + 1}`), { x:slot.x+0.28, y:slot.y+0.66, w:1.48, h:0.15, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(v), { x:slot.x+2.20, y:slot.y+0.48, w:2.08, h:0.26, fontSize:8.0, color:C.body, fit:'shrink', breakLine:true });
    addLabel(slide, 'OBSERVABLE BEHAVIOR', { x:slot.x+0.28, y:slot.y+1.20, w:1.44, h:0.09, fontSize:5.3, color:C.muted, charSpace:0.55 });
  });
  addText(slide, s.note || '价值观卡片没有行为证据时不能通过。', { x:0.94, y:6.48, w:7.40, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function financeProfileProof(slide, plan, s, idx) {
  stageCanvas(slide);
  sectionKicker(slide, 'INVESTMENT PLATFORM PROOF', 0.84, 0.72, true);
  addText(slide, s.title || '管理团队与投后能力证明', { x:0.82, y:1.06, w:6.3, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.54, w:6.4, h:0.20, fontSize:10.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });

  const left = { x:0.92, y:2.08, w:4.18, h:4.00 };
  addRect(slide, left.x, left.y, left.w, left.h, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:22},
    line:{color:'334155', transparency:54, width:0.52}
  });
  addLabel(slide, 'MANAGER CREDENTIALS', { x:left.x+0.34, y:left.y+0.38, w:1.86, h:0.11, fontSize:6.2, color:C.accent, charSpace:0.85 });
  addText(slide, s.company || plan.organization || '产业投资与投后管理团队', { x:left.x+0.34, y:left.y+0.88, w:2.74, h:0.42, fontSize:20, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.description || s.body || '以投资纪律、产业研究、投后经营和退出管理支撑组合决策。', {
    x:left.x+0.34, y:left.y+1.70, w:2.86, h:0.78, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink'
  });
  addHairline(slide, left.x+0.34, left.y+2.92, 0.86, C.accent, 0, 0.68);
  addText(slide, s.tagline || '以历史业绩、项目经验和复盘机制建立长期信任。', {
    x:left.x+0.34, y:left.y+3.26, w:2.74, h:0.18, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink'
  });

  const metrics = (s.metrics || s.cards || []).slice(0,4);
  const cards = metrics.length ? metrics : [
    { value:'6', label:'覆盖赛道' },
    { value:'42', label:'在管项目' },
    { value:'18轮', label:'投后复盘' },
    { value:'9', label:'退出案例' }
  ];
  const grid = { x:5.62, y:2.08, w:5.88, h:4.00 };
  addLabel(slide, 'TRACK RECORD SIGNALS', { x:grid.x, y:grid.y+0.10, w:1.86, h:0.11, fontSize:6.2, color:'64748B', charSpace:0.85 });
  cards.forEach((m,i)=>{
    const x = grid.x + (i%2)*3.02;
    const y = grid.y + 0.48 + Math.floor(i/2)*1.62;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, 2.62, 1.20, C.ink, '334155', {
      fill:{color:C.ink, transparency:i===0?0:18},
      line:{color:accent, transparency:i===0?24:62, width:0.46}
    });
    addLabel(slide, `PROOF 0${i+1}`, { x:x+0.24, y:y+0.22, w:0.86, h:0.09, fontSize:5.4, color:accent, charSpace:0.75 });
    addNumber(slide, m.value || m.title || String(i+1).padStart(2,'0'), { x:x+0.24, y:y+0.48, w:1.26, h:0.30, fontSize:22, color:accent, fit:'shrink' });
    addText(slide, m.label || m.body || m.note || '', { x:x+1.36, y:y+0.56, w:0.86, h:0.16, fontSize:8.0, bold:true, color:C.white, fit:'shrink' });
  });
  addRect(slide, grid.x, 6.34, 4.98, 0.34, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:36},
    line:{color:'334155', transparency:70, width:0.34}
  });
  const note = publicSlideNote(s.note);
  if (note) addText(slide, note, {
    x:grid.x+0.24, y:6.44, w:4.46, h:0.10, fontSize:6.8, color:C.darkMuted || '94A3B8', fit:'shrink'
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function manufacturingCompanyProfileSpread(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, '公司概况', 0.86, 0.72, false);
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const company = s.company || plan.organization || plan.title || '公司名称';
  addText(slide, s.title || company, { x:0.84, y:1.04, w:5.40, h:0.36, fontSize:24.0, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.subtitle || '以制造基础、产品谱系和现场交付经验建立合作信任。', {
    x:0.86, y:1.52, w:6.20, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink'
  });

  const dark = { x:0.92, y:2.10, w:3.06, h:3.72 };
  addRect(slide, dark.x, dark.y, dark.w, dark.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, '制造基础', { x:dark.x+0.30, y:dark.y+0.34, w:1.02, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
  addText(slide, company, { x:dark.x+0.30, y:dark.y+0.82, w:2.16, h:0.38, fontSize:17.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.description || s.body || '围绕装备制造、输送系统和现场交付形成综合服务能力。', {
    x:dark.x+0.30, y:dark.y+1.56, w:2.22, h:0.68, fontSize:8.4, color:C.captionOnImage, breakLine:true, fit:'shrink'
  });
  addHairline(slide, dark.x+0.30, dark.y+2.72, 0.82, C.accent, 0, 0.62);
  addText(slide, s.tagline || '以可核验制造事实建立合作信任', {
    x:dark.x+0.30, y:dark.y+3.02, w:2.14, h:0.13, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink'
  });

  const metrics = (s.metrics || []).slice(0, 4);
  const profileCards = (s.cards || s.items || []).map(v => typeof v === 'string' ? { title:v } : v).slice(0, 4);
  const proofCards = metrics.length ? metrics : profileCards;
  proofCards.slice(0,4).forEach((m, i) => {
    const x = 4.34 + (i % 2) * 1.94;
    const y = 2.18 + Math.floor(i / 2) * 1.34;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    const value = m.value || m.title || String(i + 1).padStart(2,'0');
    const label = m.label || m.body || m.note || '';
    addRect(slide, x, y, 1.58, 1.08, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:16, width:0.42}
    });
    addRect(slide, x, y, 1.58, 0.035, accent, accent, { line:{color:accent, transparency:100} });
    addLabel(slide, `事实 ${String(i+1).padStart(2,'0')}`, { x:x+0.20, y:y+0.24, w:0.66, h:0.09, fontSize:5.2, color:accent, charSpace:0 });
    addNumber(slide, value, { x:x+0.20, y:y+0.48, w:1.10, h:0.24, fontSize:20.5, color:accent, fit:'shrink' });
    addText(slide, label, { x:x+0.22, y:y+0.84, w:1.10, h:0.12, fontSize:7.0, color:C.body, fit:'shrink' });
  });

  const images = galleryImages(plan, s);
  const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
  if (hero && fs.existsSync(hero)) {
    EvidenceImageFrame(slide, hero, 8.42, 2.10, 2.94, 3.72, {
      dark:false,
      role:'evidence',
      inset:0.12,
      captionH:0.48,
      label:'现场图片',
      labelWidth:0.72,
      caption:(s.visual && s.visual.caption) || '图片仅作为制造证据入口，事实以材料可核验内容为准。',
      fontSize:6.0
    });
  } else {
    addEquipmentNameplate(slide, 8.42, 2.34, 2.94, {
      label:'制造证据',
      text:'补充厂区、车间、设备或项目图片后，可形成更完整的企业画册式证据页。'
    });
  }

  addText(slide, s.note || '公司基础页先建立可信身份，再用少量事实和一张证据图承接能力证明。', {
    x:0.96, y:6.36, w:7.70, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink'
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function companyProfileSpread(slide, plan, s, idx) {
  if (plan.industry === 'manufacturing-operations') return manufacturingCompanyProfileSpread(slide, plan, s, idx);
  lightCanvas(slide);
  sectionKicker(slide, '公司概况', 0.86, 0.72, false);
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const company = s.company || plan.organization || plan.title || '公司名称';
  addText(slide, company, { x:0.84, y:1.14, w:4.62, h:0.72, fontSize:24.5, bold:true, color:C.text, fit:'shrink', breakLine:true });
  addText(slide, s.subtitle || '以制造基础、产品谱系和现场交付经验建立合作信任。', {
    x:0.86, y:2.06, w:4.60, h:0.22, fontSize:10.6, color:C.body, fit:'shrink'
  });
  addRect(slide, 0.86, 2.54, 0.92, 0.045, C.accent, C.accent);
  addRect(slide, 1.94, 2.54, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:34}, line:{color:C.cyan, transparency:100} });
  addText(slide, s.description || s.body || '围绕装备制造、输送系统和现场交付形成综合服务能力。', {
    x:0.86, y:3.04, w:4.68, h:0.74, fontSize:9.2, color:C.body, breakLine:true, fit:'shrink', valign:'mid'
  });
  if (plan.industry === 'manufacturing-operations') {
    addEquipmentNameplate(slide, 0.86, 4.08, 4.48, {
      label:'制造证据',
      text:'厂区、车间、设备与项目图像统一作为外发证据，而非装饰背景。'
    });
  }

  const images = galleryImages(plan, s);
  const profileCards = (s.cards || s.items || []).map(v => typeof v === 'string' ? { title:v } : v);
  const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
  EvidenceImageFrame(slide, hero, 6.10, 0.98, 5.62, 3.24, {
    dark:true,
    role:'showcase',
    label:'现场 / 产品图像',
    labelWidth:1.30,
    caption:(s.visual && s.visual.caption) || itemTitle(profileCards[0], '以真实图片承接企业基础与制造能力证明。'),
    fallbackLabel:company
  });

  const secondary = images.filter(p => p !== hero).slice(0, 2);
  secondary.forEach((img, i) => {
    const x = 6.10 + i * 2.86;
    EvidenceImageFrame(slide, img, x, 4.54, 2.60, 1.12, {
      dark:false,
      role:'evidence',
      inset:0.10,
      captionH:0.28,
      label:`图像 ${i + 2}`,
      labelWidth:0.68,
      caption:itemTitle(profileCards[i + 1], `现场图片 ${i + 2}`),
      fontSize:6.0
    });
  });

  const metrics = (s.metrics || []).slice(0, 4);
  MetricStrip(slide, metrics, 0.86, 5.90, 10.84, { h:0.74 });
  if (!metrics.length) {
    addRect(slide, 0.86, 5.88, 4.84, 0.42, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.38} });
    addText(slide, '补充始建年份、厂区规模、车间面积、核心设备等可核验事实后，可形成更完整的外发公司页。', {
      x:1.08, y:6.02, w:4.20, h:0.10, fontSize:6.8, color:C.muted, fit:'shrink'
    });
  }
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function profileProof(slide, plan, s, idx) {
  if (plan.industry === 'finance-investment') return financeProfileProof(slide, plan, s, idx);
  const companyIntro = isCompanyIntroPlan(plan);
  lightCanvas(slide);
  sectionKicker(slide, companyIntro ? '公司概况' : 'PROFILE PROOF', 0.86, 0.72, false);
  addText(slide, s.title || '公司与能力证明', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const metrics = (s.metrics || []).slice(0,4);
  addRect(slide, 0.92, 2.10, 3.18, 3.72, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, companyIntro ? '企业信息' : 'IDENTITY', { x:1.20, y:2.44, w:1.0, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
  addText(slide, s.company || plan.organization || '组织名称', { x:1.20, y:2.90, w:2.12, h:0.36, fontSize:18.8, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.description || s.body || '围绕企业基础、产品能力、制造交付和长期服务建立合作信任。', { x:1.20, y:3.58, w:2.30, h:0.70, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  addHairline(slide, 1.20, 4.72, 0.86, C.accent, 0, 0.72);
  addText(slide, s.tagline || (companyIntro ? '以制造基础和项目经验建立合作信任' : '以可验证经验建立决策信任'), { x:1.20, y:5.05, w:2.12, h:0.14, fontSize:7.4, color:C.darkMuted, fit:'shrink' });
  const proofDesign = designForSlide(plan, s, 'situation');
  const hasProofImage = proofDesign.imagePath && fs.existsSync(proofDesign.imagePath);
  const proofIsPortrait = hasProofImage && imageAspect(proofDesign.imagePath) < 0.9;
  if (hasProofImage) {
    if (proofIsPortrait) {
      addPhotoPanel(slide, proofDesign.imagePath, 9.10, 2.08, 2.36, 3.74, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
      addRect(slide, 9.10, 5.18, 2.36, 0.64, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
      addLabel(slide, companyIntro ? '现场图片' : 'BRAND PROOF', { x:9.34, y:5.40, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
    } else {
      addPhotoPanel(slide, proofDesign.imagePath, 4.64, 1.98, 6.40, 1.44, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
      addRect(slide, 4.64, 3.06, 6.40, 0.36, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
      addLabel(slide, companyIntro ? '现场图片' : 'BRAND PROOF', { x:4.92, y:3.18, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
    }
  }
  const cards = metrics.length ? metrics : (s.cards || []).slice(0,4);
  cards.forEach((m,i)=>{
    const cardW = proofIsPortrait ? 1.86 : 2.70;
    const x = proofIsPortrait ? (4.48 + (i%2)*2.18) : (4.64 + (i%2)*3.04);
    const y = proofIsPortrait ? (2.26 + Math.floor(i/2)*1.54) : ((hasProofImage ? 3.72 : 2.18) + Math.floor(i/2)*1.24);
    const cardH = proofIsPortrait ? 1.18 : (hasProofImage ? 1.00 : 1.16);
    const value = m.value || m.title || String(i+1).padStart(2,'0');
    const label = m.label || m.body || m.note || '';
    const accent = i===0?C.accent:(i===1?C.cyan:(i===2?C.tertiary || C.violet:C.muted));
    addRect(slide, x, y, cardW, cardH, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.5} });
    addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
    addLabel(slide, companyIntro ? `事实 ${String(i+1).padStart(2,'0')}` : `PROOF 0${i+1}`, { x:x+0.22, y:y+0.28, w:0.92, h:0.09, fontSize:5.4, color:accent, charSpace:companyIntro ? 0 : 0.75 });
    addNumber(slide, value, { x:x+0.22, y:y+0.48, w:cardW-0.42, h:0.28, fontSize:hasProofImage ? 21.5 : 24, color:accent, fit:'shrink' });
    addText(slide, label, { x:x+0.24, y:y+0.86, w:cardW-0.46, h:0.16, fontSize:8.2, color:C.body, fit:'shrink' });
  });
  const note = publicSlideNote(s.note);
  if (note) addText(slide, note, { x:4.68, y:6.28, w:6.10, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function quoteProof(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  addDarkBreathingCircle(slide, 8.72, 0.70, 3.88, 2.10, C.accent);
  addLabel(slide, 'CUSTOMER VOICE', { x:0.86, y:0.94, w:1.92, h:0.14, fontSize:8.2, color:C.darkMuted, charSpace:0.8 });
  addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.76, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });
  const quote = s.quote || s.statement || s.title || '一句来自用户、客户或团队的关键声音。';
  addText(slide, `“${quote}”`, { x:0.82, y:1.72, w:6.90, h:1.05, fontSize:27, bold:true, color:C.white, fit:'shrink', breakLine:true });
  addText(slide, s.attribution || s.subtitle || '', { x:0.88, y:3.12, w:4.20, h:0.16, fontSize:9.2, color:C.captionOnImage, fit:'shrink' });
  addHairline(slide, 0.88, 3.54, 0.86, C.accent, 0, 0.75);
  const proofs = (s.items || s.cards || []).slice(0,3);
  proofs.forEach((p,i)=>{
    const x = 0.92 + i*3.18;
    addRect(slide, x, 4.70, 2.62, 0.90, C.ink2, C.darkLine, { fill:{color:C.ink2, transparency:32}, line:{color:C.darkLine, transparency:56, width:0.45} });
    addText(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.98, w:0.32, h:0.12, fontSize:7.0, bold:true, color:i===0?C.accent:C.cyan });
    addText(slide, typeof p === 'string' ? p : (p.title || ''), { x:x+0.62, y:4.94, w:1.58, h:0.15, fontSize:9.2, bold:true, color:C.white, fit:'shrink' });
    const body = typeof p === 'string' ? '' : (p.body || p.note || '');
    if (body) addText(slide, body, { x:x+0.62, y:5.24, w:1.68, h:0.12, fontSize:6.5, color:C.darkMuted, fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
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

function moduleMatrix(slide, plan, s, idx) {
  // Capability Map v11: bounded right-side capability field. The radar is centered in its own stage,
  // not the slide; labels live in fixed safe zones with white backing so rings never run under copy.
  slide.background = { color:'F7FAFD' };
  addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
  addRect(slide, 0, 0, W, 0.92, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:0}, line:{color:'FFFFFF', transparency:100} });
  sectionKicker(slide, 'CAPABILITY MAP', 0.86, 0.72, false);
  addText(slide, s.title, { x:0.84, y:1.05, w:4.8, h:0.35, fontSize:24, bold:true, color:C.text });
  if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.2, h:0.22, fontSize:10.8, color:C.muted });
  addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });

  const cards = s.cards || [];
  const leftPanel = { x:0.92, y:2.20, w:2.92, h:3.42 };
  glassPanel(slide, leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h, false);
  addText(slide, 'CORE', { x:leftPanel.x+0.28, y:leftPanel.y+0.34, w:0.7, h:0.14, fontSize:8.0, color:C.muted, charSpace:1.1 });
  const industry = industryProfile(plan);
  addText(slide, s.coreTitle || industry.coreTitle || '运营能力地图', { x:leftPanel.x+0.28, y:leftPanel.y+0.86, w:2.12, h:0.28, fontSize:16.8, bold:true, color:C.text });
  addText(slide, s.coreBody || industry.coreBody || '以中心能力雷达串联关键模块，表达平台不是功能堆叠，而是围绕业务闭环形成能力场。', { x:leftPanel.x+0.28, y:leftPanel.y+1.54, w:2.06, h:0.78, fontSize:9.4, color:C.body, breakLine:true });
  addHairline(slide, leftPanel.x+0.28, leftPanel.y+2.70, 0.72, C.accent, 0, 0.75);

  const stage = { x:4.20, y:2.06, w:7.88, h:4.46 };
  addRect(slide, stage.x, stage.y, stage.w, stage.h, 'FFFFFF', 'E8EEF6', { fill:{color:'FFFFFF', transparency:18}, line:{color:'E8EEF6', transparency:18, width:0.55} });
  addText(slide, 'CAPABILITY FIELD', { x:stage.x+0.24, y:stage.y+0.20, w:1.55, h:0.12, fontSize:6.6, color:C.muted, charSpace:1.0 });

  const cx = stage.x + stage.w * 0.52;
  const cy = stage.y + stage.h * 0.54;
  const radarCards = cards.slice(0, Math.min(6, Math.max(4, cards.length || 4)));
  const radarCount = radarCards.length || 4;
  const radarRadius = 1.10;
  const radarPoint = (radius, i, count = radarCount) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  };
  const axis = Array.from({ length:radarCount }, (_, i) => radarPoint(radarRadius, i));
  [0.42,0.76,radarRadius].forEach((r,i)=>slide.addShape('ellipse', { x:cx-r, y:cy-r, w:r*2, h:r*2, fill:{color:C.softBlue, transparency:100}, line:{color:'D8E2EF', transparency:28+i*10, width:0.36} }));
  axis.forEach(([x,y])=>slide.addShape('line', { x:cx, y:cy, w:x-cx, h:y-cy, line:{color:'D8E2EF', transparency:70, width:0.26} }));
  const strengths = [0.78, 0.82, 0.70, 0.86, 0.66, 0.74];
  const poly = Array.from({ length:radarCount }, (_, i) => radarPoint(radarRadius * strengths[i % strengths.length], i));
  poly.forEach(([x,y],i)=>{ const [nx,ny]=poly[(i+1)%poly.length]; slide.addShape('line', { x, y, w:nx-x, h:ny-y, line:{color:C.accent, transparency:20, width:0.62} }); });
  slide.addShape('ellipse', { x:cx-0.07, y:cy-0.07, w:0.14, h:0.14, fill:{color:'F7FAFD', transparency:0}, line:{color:C.accent, transparency:0, width:0.38} });

  const labels = radarCount === 4
    ? [
        { x:stage.x+0.52, y:stage.y+0.58, w:2.36, h:0.64, anchor:axis[0] },
        { x:stage.x+5.28, y:stage.y+1.54, w:2.18, h:0.64, anchor:axis[1] },
        { x:stage.x+4.84, y:stage.y+3.46, w:2.42, h:0.64, anchor:axis[2] },
        { x:stage.x+0.54, y:stage.y+2.90, w:2.32, h:0.64, anchor:axis[3] }
      ]
    : axis.map((anchor, i) => {
        const right = anchor[0] > cx + 0.10;
        const left = anchor[0] < cx - 0.10;
        const x = right ? stage.x + 5.28 : (left ? stage.x + 0.50 : stage.x + 2.76);
        const y = Math.max(stage.y + 0.58, Math.min(stage.y + 3.50, anchor[1] - 0.28));
        return { x, y, w:2.24, h:0.64, anchor };
      });
  radarCards.forEach((c,i)=>{
    const {x,y,w,h,anchor} = labels[i];
    const accent = i===0?C.accent:(i===1?C.cyan:(i===3?C.violet:C.muted));
    slide.addShape('ellipse', { x:anchor[0]-0.045, y:anchor[1]-0.045, w:0.09, h:0.09, fill:{color:accent}, line:{color:accent, transparency:100} });
    addRect(slide, x, y, w, h, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:8}, line:{color:'FFFFFF', transparency:100} });
    addText(slide, String(i+1).padStart(2,'0'), { x:x+0.02, y:y+0.02, w:0.30, h:0.11, typeRole:'caption', fontSize:7.5, bold:true, color:accent });
    addText(slide, c.title, { x:x+0.38, y:y, w:w-0.42, h:0.16, typeRole:'cardTitle', fontSize:10.5, bold:true, color:C.text, fit:'shrink' });
    addText(slide, c.body, { x:x+0.38, y:y+0.28, w:w-0.42, h:0.25, typeRole:'bodySmall', fontSize:8.25, color:C.body, fit:'shrink', breakLine:true });
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
    addArrowBetweenRects,
    addArrowLine,
    addClockwiseLoopConnectors,
    addEvidenceCaptionStack,
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
    sectionKicker,
    copyFallback,
    copyPolicyList,
    compactEvidenceCaption,
    componentRendererContext,
    designForSlide,
    chooseEvidenceImageLayout,
    ContactBlock,
    footerText,
    glassPanel,
    coverMetaText,
    typeSize,
    profileFont,
    genericShowcaseField,
    formatMetricDelta,
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
    industryChartSlideBase: industryChartSlide
  };
  const baseRendererContext = createRendererContext(baseRendererApi);
  const evidenceGalleryRenderers = createEvidenceGalleryRenderers(baseRendererContext);
  const rendererContext = createRendererContext(Object.assign({}, baseRendererApi, evidenceGalleryRenderers));
  const familyRenderers = Object.assign({},
    createBusinessRenderers(rendererContext),
    createChapterRenderers(rendererContext),
    createFinancialRenderers(rendererContext),
    createClosingRenderers(rendererContext),
    createArchitectureRenderers(rendererContext),
    evidenceGalleryRenderers,
    createRiskRenderers(rendererContext),
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
    companyProfileSpread,
    coverDark,
    executiveBlocks,
    fallbackBulletsSlide,
    financeBridgeSlide: familyRenderers.financeBridgeSlide,
    industryChartSlide: familyRenderers.industryChartSlide,
    manifestoSlide,
    metricComparison: familyRenderers.metricComparison,
    moduleMatrix,
    portfolioTableSlide: familyRenderers.portfolioTableSlide,
    productShowcase,
    profileProof,
    quoteProof,
    reportBoard: familyRenderers.reportBoard,
    riskAdaptive: familyRenderers.riskAdaptive,
    strategyMap,
    timelineAdaptive: familyRenderers.timelineAdaptive,
    tocClean: familyRenderers.tocClean,
    twoColumnClean,
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
