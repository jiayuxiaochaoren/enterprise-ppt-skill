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
const os = require('os');
const cp = require('child_process');

const CACHE_DIR = path.join(process.env.HERMES_HOME || path.join(os.homedir(), '.hermes'), 'cache', 'premium-commercial-ppt-node');

function requirePptxGen() {
  try { return require('pptxgenjs'); } catch (_) {
    try { return require(path.join(CACHE_DIR, 'node_modules', 'pptxgenjs')); } catch (__) {
      console.error('[premium-commercial-ppt] pptxgenjs not found; installing into Hermes cache...');
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      if (!fs.existsSync(path.join(CACHE_DIR, 'package.json'))) {
        cp.execFileSync('npm', ['init', '-y'], { cwd: CACHE_DIR, stdio: 'ignore' });
      }
      cp.execFileSync('npm', ['install', 'pptxgenjs', '--silent'], { cwd: CACHE_DIR, stdio: 'inherit' });
      return require(path.join(CACHE_DIR, 'node_modules', 'pptxgenjs'));
    }
  }
}
const pptxgen = requirePptxGen();

const {
  FONT_STACK,
  MEDIA_ASSETS,
  chooseEvidenceImageLayout,
  chooseFourImageLayout,
  galleryImages,
  imageDimensions,
  makeDeckContext,
  mediaForRole,
  normalizeDeckPlan,
  resolveAssetPath,
  slideWantsImage,
  visualRole
} = require('./design-system');

let DESIGN = makeDeckContext({});
let PROFILE = DESIGN.profile;
let C = DESIGN.colors;
const W = (DESIGN.visualSystem.layout && DESIGN.visualSystem.layout.canvas && DESIGN.visualSystem.layout.canvas.w) || 13.333;
const H = (DESIGN.visualSystem.layout && DESIGN.visualSystem.layout.canvas && DESIGN.visualSystem.layout.canvas.h) || 7.5;

function industryProfile(plan={}) {
  const profiles = (DESIGN.visualSystem && DESIGN.visualSystem.industryProfiles) || {};
  const raw = profiles[plan.industry] || profiles['general-operations'] || {};
  const coverFields = {
    generic: drawGenericCoverField,
    manufacturing: drawManufacturingCoverField,
    park: drawParkCoverField,
    energy: drawEnergyCoverField
  };
  return Object.assign({
    label: 'DIGITAL OPERATIONS',
    insight: '让业务闭环建立在统一数据之上',
    coreTitle: '运营能力地图',
    coreBody: '围绕业务闭环形成能力场。',
    coverField: drawGenericCoverField
  }, raw, {
    coverField: coverFields[raw.coverField] || drawGenericCoverField
  });
}
function industryRendererFor(plan={}, s={}) {
  const role = designForSlide(plan, s).role;
  const rendererName = ((industryProfile(plan).layoutOverrides || {})[role]);
  const renderers = {
    energyToc,
    energySituationEditorial,
    energyProblemSplit,
    energyCapabilityLoop,
    energyArchitecture,
    energyDeploymentRadius,
    energyValueSignal
  };
  return rendererName ? renderers[rendererName] : null;
}

function samplePlan() {
  return {
    style: 'premium-commercial-keynote',
    title: '企业运营数字化方案示例',
    subtitle: '以统一数据底座，支撑运营闭环升级',
    slides: [
      { type: 'cover-dark', title: '企业运营数字化方案示例', subtitle: '以统一数据底座，支撑运营闭环升级', bullets: ['统一数据底座', '运营闭环升级', '管理驾驶舱'] },
      { type: 'toc-clean', title: '目录', items: ['业务背景与升级目标', '从分散管理到统一运营', '平台架构与核心能力', '分阶段落地路径', '业务价值与落地保障'] },
      { type: 'two-column-clean', title: '业务背景与升级目标', leftTitle: '建设背景', left: ['园区企业数量持续增加，管理对象从“场地管理”向“运营服务”延伸。', '招商、物业、安防、能耗、企业服务等业务分散在不同系统或线下表格中。', '管理层需要及时掌握园区运行态势，为资源配置和服务优化提供依据。'], rightTitle: '核心诉求', cards: [{title:'运营管理诉求', body:'统一事项、空间、企业、人员和设备信息，形成可查询、可追踪、可分析的管理底座。'}, {title:'服务提升诉求', body:'围绕企业入驻、政策申报、维修工单、活动通知等场景，提升响应效率。'}, {title:'决策支撑诉求', body:'通过数据看板呈现招商进度、空间利用、能耗趋势、服务工单等重点指标。'}] },
      { type: 'executive-blocks', title: '从分散管理到统一运营', intro: '以统一数据底座，支撑园区运营闭环升级', cards: [{title:'信息分散', body:'企业、房源、合同、设备等信息分散，查询依赖人工汇总。'}, {title:'流程割裂', body:'跨部门事项缺少统一流转机制，处理过程难追踪。'}, {title:'响应滞后', body:'企业服务与物业工单反馈链路长，过程透明度不足。'}, {title:'数据不足', body:'管理层缺少统一运营视图，难以持续跟踪改善效果。'}] },
      { type: 'architecture-dark', title: '方案总体架构', subtitle: '以运营数据底座支撑多场景协同', layers: [{title:'用户入口层', items:['管理驾驶舱','企业服务门户','移动端工单','招商管理入口']}, {title:'业务应用层', items:['招商与合同','空间与资产','物业与工单','能耗与设备','政策与活动']}, {title:'数据支撑层', items:['企业库','空间库','合同库','设备库','工单库','能耗数据','运营指标库']}] },
      { type: 'module-matrix', title: '核心模块设计', intro: '围绕运营、服务、决策三类能力展开', cards: [{title:'园区运营管理', body:'企业档案、空间资产、合同台账、招商线索，集中维护基础运营信息。'}, {title:'企业服务协同', body:'政策申报、活动通知、诉求受理、工单流转，提升服务响应效率。'}, {title:'设备与能耗管理', body:'对接设备台账、巡检记录和能耗数据，支持异常预警与趋势分析。'}, {title:'管理驾驶舱', body:'汇总招商、入驻、工单、能耗、收入运营关键指标，形成管理层视图。'}, {title:'权限与流程配置', body:'按管理层、部门、运营人员、企业用户等角色设置访问与审批权限。'}, {title:'数据接口与扩展', body:'预留与现有物业、财务、门禁、OA 等系统的数据对接能力。'}] },
      { type: 'timeline-dark', title: '先建立最小闭环，再扩展集成边界', phases: [{title:'第一阶段', body:'现状调研与蓝图设计，梳理业务流程、数据口径、系统边界。'}, {title:'第二阶段', body:'基础平台与核心模块上线，先形成可运行的最小闭环。'}, {title:'第三阶段', body:'场景深化与数据联通，推动能耗、设备、门禁、财务或 OA 按需对接。'}, {title:'第四阶段', body:'运营优化与持续迭代，结合运行数据优化流程、权限、指标和服务机制。'}], note:'建议节奏：先建立可运行的最小闭环，再逐步扩展集成范围。' },
      { type: 'value-tiles', title: '预期价值', intro: '从管理效率、服务质量和决策能力三个方面体现成效', cards: [{title:'管理效率提升', body:'减少重复登记与人工汇总，推动重点事项线上留痕、可追踪、可复盘。'}, {title:'服务质量提升', body:'企业诉求、物业维修、政策通知等服务事项形成统一受理和反馈机制。'}, {title:'资源配置优化', body:'基于空间利用、企业结构、能耗趋势等数据，为资源投入提供参考。'}, {title:'风险管控加强', body:'合同到期、设备异常、工单超期等风险可配置预警与责任跟踪。'}], note:'价值测算可在系统上线后基于运营数据持续校准，形成月度复盘机制。' },
      { type: 'risk-table', title: '风险与保障', subtitle: '围绕数据、协同、实施和运维建立闭环机制', headers: ['风险项','等级','应对措施'], rows: [['数据口径不统一','中','建立字段字典和数据责任人机制，先确认核心指标。'], ['部门协同不到位','中','明确流程节点、处理时限和跨部门协调机制。'], ['系统集成复杂度高','高','分批对接，优先接入高价值、低风险系统。'], ['上线后使用不足','中','同步开展培训、试运行和问题反馈闭环。']] },
      { type: 'closing-dark', title: '让运营从经验驱动走向数据驱动', subtitle: '期待共建高效、可持续的运营体系', note: '建议以核心运营闭环先行上线，再围绕数据接入、服务场景和管理指标持续迭代。' }
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

function containsCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}
function textOptionWithReadabilityFloor(text, opts={}) {
  const next = Object.assign({}, opts);
  if (next.allowTiny || typeof next.fontSize !== 'number' || !containsCjk(text)) return next;
  const isFooter = Number(next.y || 0) >= 6.62;
  const isMicroSlot = Number(next.w || 0) < 0.72 || Number(next.h || 0) < 0.11;
  if (isMicroSlot) return next;
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
function addText(slide, t, opts) {
  slide.addText(t || '', Object.assign(
    { fontFace: PROFILE.font, color: C.body, margin: 0, breakLine: false, fit: 'shrink' },
    textOptionWithReadabilityFloor(t, opts)
  ));
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
  const tokens = (DESIGN.visualSystem && DESIGN.visualSystem.typography) || {};
  return Object.assign({}, fallback, tokens[name] || {});
}
function typeSize(name, fallback) {
  return typeToken(name, { size:fallback }).size || fallback;
}
function profileFont(kind) {
  if (kind === 'latin') return PROFILE.latinFont || FONT_STACK.latin || PROFILE.font;
  if (kind === 'number') return PROFILE.numberFont || FONT_STACK.number || PROFILE.font;
  return PROFILE.font || FONT_STACK.zh;
}
function addLabel(slide, text, opts={}) {
  const token = typeToken('kicker', { size:7.0, tracking:1.0 });
  addText(slide, text, Object.assign({ fontFace:profileFont('latin'), fontSize:token.size, color:C.muted, charSpace:token.tracking }, opts));
}
function addNumber(slide, text, opts={}) {
  addText(slide, text, Object.assign({ fontFace:profileFont('number'), fontSize:typeSize('number', 12), bold:true, color:C.accent }, opts));
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
function deckMetaFields(plan={}) {
  if (metaDisabled(plan)) return [];
  if (plan.metaText) return [String(plan.metaText)];
  const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
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
  if (typeof plan.footerText === 'string') return plan.footerText;
  if (typeof plan.footer === 'string') return plan.footer;
  if (plan.footerPolicy === 'title' || plan.useTitleAsFooter === true) return plan.title || '';
  return '';
}
function coverKickerText(plan={}, industry={}) {
  if (plan.coverKicker === false || plan.kicker === false) return '';
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
  slide.addShape('ellipse', { x, y, w:outer, h:outer, fill:{color:accent, transparency:98}, line:{color:accent, transparency:88, width:0.45} });
  const inset = (outer - inner) / 2;
  slide.addShape('ellipse', { x:x+inset, y:y+inset, w:inner, h:inner, fill:{color:C.ink, transparency:100}, line:{color:C.cyan, transparency:92, width:0.35} });
}
function addLightBreathingCircle(slide, x=9.58, y=0.42, size=3.45, color=C.softBlue, transparency=50) {
  slide.addShape('ellipse', { x, y, w:size, h:size, fill:{color, transparency}, line:{color, transparency:100} });
}
function addPulseCurve(slide, x, y, w, h, accent=C.accent, dark=true, opts={}) {
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
}
function addEnergyLens(slide, x=7.90, y=0.72, size=4.56, accent=C.accent) {
  slide.addShape('ellipse', { x, y, w:size, h:size, fill:{color:accent, transparency:98}, line:{color:accent, transparency:86, width:0.42} });
  slide.addShape('ellipse', { x:x+size*0.20, y:y+size*0.20, w:size*0.60, h:size*0.60, fill:{color:C.ink, transparency:100}, line:{color:C.cyan, transparency:91, width:0.34} });
  slide.addShape('ellipse', { x:x+size*0.37, y:y+size*0.37, w:size*0.26, h:size*0.26, fill:{color:C.ink2, transparency:42}, line:{color:'334155', transparency:72, width:0.32} });
  addPulseCurve(slide, x+size*0.18, y+size*0.57, size*0.62, size*0.18, accent, true, { transparency:42, width:0.54, nodes:false });
  addLabel(slide, 'LOAD', { x:x+size*0.16, y:y+size*0.78, w:0.52, h:0.10, fontSize:5.7, color:'64748B', charSpace:0.8 });
  addLabel(slide, 'SOC', { x:x+size*0.74, y:y+size*0.30, w:0.42, h:0.10, fontSize:5.7, color:'64748B', charSpace:0.8, align:'right' });
  addLabel(slide, 'DISPATCH', { x:x+size*0.43, y:y+size*0.47, w:0.78, h:0.10, fontSize:5.8, color:'7C8BA3', charSpace:0.7, align:'center' });
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
function stageCanvas(slide, opts={}) {
  slide.background = { color:C.ink };
  addRect(slide, 0, 0, W, H, C.ink, C.ink);
  if (opts.field !== false) {
    addDarkBreathingCircle(slide);
  }
}
function lightCanvas(slide) {
  const bg = surfaceFill();
  const head = panelFill();
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);
  addRect(slide, 0, 0, W, 0.92, head, head, { fill:{color:head, transparency:0}, line:{color:head, transparency:100} });
  addLightBreathingCircle(slide);
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
  addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.64, w:0.72, h:0.22, fontSize:typeSize('number', 13.0), bold:true, color:C.accent, align:'right' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:typeSize('caption', 7.8), color:C.muted });
}

function drawGenericCoverField(slide) {
  drawCoverBreathingCircle(slide);
}
function drawManufacturingCoverField(slide) {
  addDarkBreathingCircle(slide, 8.42, 0.78, 4.12, 2.30, C.accent);
  const panel = { x:7.34, y:1.32, w:4.82, h:4.70 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:34},
    line:{color:'334155', transparency:68, width:0.38}
  });
  addLabel(slide, 'OEE CONTROL FIELD', { x:panel.x+0.34, y:panel.y+0.34, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, '78%', { x:panel.x+0.32, y:panel.y+0.84, w:1.20, h:0.38, fontSize:28, bold:true, color:C.white, fit:'shrink' });
  addText(slide, 'OEE', { x:panel.x+1.62, y:panel.y+1.02, w:0.60, h:0.12, fontSize:7.2, color:'94A3B8', fontFace:profileFont('latin'), fit:'shrink' });
  addPulseCurve(slide, panel.x+2.42, panel.y+0.92, 1.92, 0.42, C.cyan, true, { transparency:34, width:0.42, nodes:false });
  addHairline(slide, panel.x+0.34, panel.y+1.64, panel.w-0.68, '334155', 44, 0.34);

  const stations = [
    { label:'PLC', x:panel.x+0.48, y:panel.y+2.08, color:C.accent },
    { label:'ALM', x:panel.x+1.62, y:panel.y+2.08, color:C.cyan },
    { label:'WO', x:panel.x+2.76, y:panel.y+2.08, color:C.violet },
    { label:'OEE', x:panel.x+3.90, y:panel.y+2.08, color:'94A3B8' }
  ];
  stations.forEach((st,i)=>{
    addRect(slide, st.x, st.y, 0.64, 0.40, C.ink, st.color, {
      fill:{color:C.ink, transparency:i===0?6:22},
      line:{color:st.color, transparency:i===0?18:48, width:0.38}
    });
    addText(slide, st.label, { x:st.x+0.08, y:st.y+0.14, w:0.48, h:0.08, fontSize:5.8, bold:true, color:i===0?C.white:'A8B3C3', align:'center', fit:'shrink' });
    if (i < stations.length - 1) addArrowLine(slide, st.x+0.72, st.y+0.20, 0.32, 0, st.color, { transparency:44, width:0.34 });
  });

  const rows = [
    ['MTTR', '18min', C.cyan],
    ['重复故障', '12%', C.violet],
    ['备件周转', '9天', '94A3B8']
  ];
  rows.forEach((r,i)=>{
    const y = panel.y + 3.10 + i*0.42;
    slide.addShape('ellipse', { x:panel.x+0.42, y:y+0.04, w:0.08, h:0.08, fill:{color:r[2]}, line:{color:r[2], transparency:100} });
    addText(slide, r[0], { x:panel.x+0.64, y:y, w:1.08, h:0.12, fontSize:7.2, color:'A8B3C3', fit:'shrink' });
    addText(slide, r[1], { x:panel.x+3.46, y:y-0.02, w:0.66, h:0.12, fontSize:8.4, bold:true, color:C.white, align:'right', fit:'shrink' });
    addHairline(slide, panel.x+1.78, y+0.08, 1.46, '334155', 56, 0.30);
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
  addLabel(slide, 'VISUAL EVIDENCE', { x:6.66, y:5.82, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  const fallbackCaption = plan.industry === 'finance-investment'
    ? '项目材料作为投资判断证据，指标和风险口径仍保持可编辑。'
    : (plan.industry === 'healthcare-operations'
      ? '服务触点图仅作为情境证据，责任和质量口径保持可编辑。'
      : '现代产线现场图仅作为展示证据，不承载大段文字。');
  addText(slide, (s.visual && s.visual.caption) || fallbackCaption, { x:8.02, y:5.81, w:3.24, h:0.12, fontSize:6.8, color:'CBD5E1', fit:'shrink' });

  addDeckMeta(slide, plan, { x:0.86, y:6.34, w:5.50, h:0.16, fontSize:7.3, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.5, color:C.muted });
  return true;
}
function coverLightEditorial(slide, plan, s, industry, title) {
  const bg = surfaceFill();
  const panel = panelFill();
  const motif = presentationSpec().coverMotif || 'editorial-rule';
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
      addLabel(slide, 'VISUAL PROOF', { x:9.24, y:4.58, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
      addText(slide, (s.visual && s.visual.caption) || '产品与空间作为增长议题的视觉证据。', { x:9.24, y:4.82, w:1.88, h:0.15, fontSize:7.4, color:C.body, fit:'shrink' });
    } else {
      addText(slide, '01', { x:9.28, y:1.64, w:0.44, h:0.18, fontSize:10, bold:true, color:C.accent });
      addText(slide, s.coverProofTitle || plan.coverProofTitle || '核心议题', { x:9.28, y:2.20, w:1.78, h:0.18, fontSize:11.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, s.coverProof || plan.coverProof || insight || '把战略判断收束为可执行、可复盘的业务动作。', { x:9.28, y:2.80, w:1.74, h:0.52, fontSize:7.6, color:C.body, breakLine:true, fit:'shrink' });
    }
  }

  addDeckMeta(slide, plan, { x:x0+0.02, y:6.38, w:5.70, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:typeSize('caption', 7.4), color:C.muted });
}
function coverDark(slide, plan, s) {
  masterDark(slide, plan, '', null, '', { field:false });
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
function closingDark(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  if (plan.industry === 'energy-utility') {
    if (!plan.motionBackdrop || !addEnergyMotionBackdrop(slide)) {
      addEnergyPhotoBackdrop(slide);
    }
    addEnergyLens(slide, 7.90, 0.72, 4.42, C.accent);
  } else if (addVisualPhotoBackdrop(slide, plan, s, 'closing', { transparency:72 })) {
    addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
  } else {
    addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
  }
  addLabel(slide, 'FINAL ALIGNMENT', { x:0.92, y:1.26, w:1.70, h:0.14, fontSize:7.2, color:C.cyan, charSpace:1.1 });
  addNumber(slide, String(idx || 10).padStart(2,'0'), { x:11.58, y:0.82, w:0.56, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  addText(slide, s.title || '让运营从经验驱动走向数据驱动', { x:0.90, y:2.12, w:7.36, h:0.72, fontSize:32.5, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.subtitle || '期待共建高效、可持续的运营体系', { x:0.92, y:3.02, w:5.90, h:0.22, fontSize:12.2, color:'CBD5E1', fit:'shrink' });
  addRect(slide, 0.94, 3.52, 0.96, 0.05, C.accent, C.accent);
  addRect(slide, 2.02, 3.52, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });
  const note = s.note || '建议以核心运营闭环先行上线，再围绕数据接入、服务场景和管理指标持续迭代。';
  addRect(slide, 0.92, 5.46, 8.95, 0.76, C.ink2, '334155', { fill:{color:C.ink2, transparency:22}, line:{color:'334155', transparency:54, width:0.36} });
  addLabel(slide, 'NEXT DECISION', { x:1.18, y:5.74, w:1.22, h:0.11, fontSize:6.6, bold:true, color:C.accent, charSpace:0.8 });
  addText(slide, note, { x:2.58, y:5.71, w:6.58, h:0.18, fontSize:9.2, color:'CBD5E1', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function closingMeta(plan) {
  return coverMetaText(plan) || footerText(plan);
}
function closingActions(s) {
  if (Array.isArray(s.actions)) return s.actions.slice(0, 3).map(v => typeof v === 'string' ? { title:v, body:'' } : v);
  if (Array.isArray(s.items)) return s.items.slice(0, 3).map(v => typeof v === 'string' ? { title:v, body:'' } : v);
  const note = s.note || s.nextStep || '明确试点范围、首批数据接入和上线节奏。';
  return [
    { title:'范围', body:'确认首批场景和业务边界' },
    { title:'数据', body:'锁定关键系统与口径责任人' },
    { title:'节奏', body:note }
  ];
}
function closingThankYou(slide, plan, s, idx) {
  const bg = surfaceFill();
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);
  addLightBreathingCircle(slide, 8.20, 0.38, 4.28, C.softBlue, 36);
  addRect(slide, 8.72, 0.86, 2.86, 5.44, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addText(slide, 'THANK', { x:9.04, y:1.26, w:1.86, h:0.38, fontFace:profileFont('latin'), fontSize:22.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
  addText(slide, 'YOU', { x:9.72, y:1.72, w:1.18, h:0.38, fontFace:profileFont('latin'), fontSize:22.0, bold:true, color:C.cyan, align:'right', fit:'shrink' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.82, y:2.34, w:0.36, h:0.12, fontSize:7.6, color:C.darkMuted || 'A8B3C3', align:'right' });
  addHairline(slide, 9.26, 3.20, 1.16, C.accent, 0, 0.58);
  const explicitContacts = s.contacts || s.contact;
  const contacts = explicitContacts || (metaDisabled(plan) ? [] : [
    plan.organization,
    plan.audience,
    plan.date
  ].filter(Boolean));
  const contactList = Array.isArray(contacts) ? contacts : String(contacts || '').split(/[｜|/]/).map(v => v.trim()).filter(Boolean);
  contactList.slice(0,3).forEach((v,i)=>{
    const y = 3.76 + i*0.46;
    addLabel(slide, ['ORG', 'AUD', 'DATE'][i] || `INFO ${i+1}`, { x:9.26, y, w:0.56, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0.6 });
    addText(slide, String(v), { x:10.00, y:y-0.02, w:0.82, h:0.12, fontSize:7.2, color:C.captionOnImage, fit:'shrink', align:'right' });
  });

  addLabel(slide, s.label || 'CLOSING', { x:0.86, y:1.02, w:1.20, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.0 });
  addText(slide, s.title || '谢谢观看', {
    x:0.84, y:2.16, w:5.86, h:0.78,
    fontSize:typeSize('coverTitle', 34.0), bold:true, color:C.text, fit:'shrink'
  });
  addText(slide, s.subtitle || s.claim || '期待继续交流。', {
    x:0.88, y:3.24, w:5.52, h:0.24,
    fontSize:11.4, color:C.body, fit:'shrink'
  });
  addRect(slide, 0.88, 3.86, 0.96, 0.045, C.accent, C.accent);
  if (s.note) {
    addText(slide, s.note, { x:0.88, y:4.42, w:5.80, h:0.22, fontSize:9.0, color:C.muted, fit:'shrink' });
  }
  addHairline(slide, 0.86, 6.40, 7.32, C.line, 16, 0.55);
  addText(slide, closingMeta(plan), { x:0.86, y:6.70, w:7.40, h:0.16, fontSize:7.6, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}
function closingSimpleEnd(slide, plan, s, idx) {
  const bg = surfaceFill();
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);
  addLightBreathingCircle(slide, 8.24, 0.36, 4.36, C.softBlue, 38);
  addRect(slide, 0.88, 0.84, 0.045, 5.72, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
  addLabel(slide, s.label || 'END', { x:1.22, y:1.02, w:1.12, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
  addText(slide, s.title || '谢谢观看', {
    x:1.18, y:2.02, w:5.90, h:0.82,
    fontSize:typeSize('coverTitle', 34.0), bold:true, color:C.text, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || s.claim || '期待继续交流。', {
    x:1.22, y:3.18, w:5.28, h:0.24,
    fontSize:11.4, color:C.body, fit:'shrink'
  });
  addRect(slide, 1.22, 3.78, 0.96, 0.045, C.accent, C.accent);
  addRect(slide, 2.32, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });
  if (s.note) addText(slide, s.note, { x:1.22, y:4.42, w:5.70, h:0.22, fontSize:9.0, color:C.muted, fit:'shrink' });

  addRect(slide, 8.70, 0.94, 2.66, 5.34, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addText(slide, 'END', { x:9.12, y:1.30, w:1.54, h:0.46, fontFace:profileFont('latin'), fontSize:27.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.54, y:1.94, w:0.42, h:0.16, fontSize:9.2, color:C.darkMuted || 'A8B3C3', align:'right' });
  addHairline(slide, 9.20, 3.02, 1.04, C.accent, 0, 0.56);
  addText(slide, closingMeta(plan), { x:9.20, y:3.48, w:1.62, h:0.34, fontSize:7.6, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
  addText(slide, metaDisabled(plan) ? '' : (plan.date || ''), { x:9.20, y:5.26, w:1.34, h:0.12, fontSize:7.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addHairline(slide, 1.18, 6.42, 6.82, C.line, 16, 0.55);
  addText(slide, footerText(plan), { x:1.18, y:6.72, w:7.0, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
}
function closingEditorialLight(slide, plan, s, idx) {
  const bg = surfaceFill();
  const panel = panelFill();
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);
  addRect(slide, 0, 0, W, 0.10, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
  addLightBreathingCircle(slide, 8.30, 0.34, 4.38, C.softBlue, 38);
  addRect(slide, 8.92, 1.10, 2.60, 4.70, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addText(slide, 'END', { x:9.20, y:1.42, w:1.92, h:0.48, fontFace:profileFont('latin'), fontSize:26, bold:true, color:C.accent, fit:'shrink', align:'right' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.72, y:1.42, w:0.42, h:0.16, fontSize:9.6, color:C.darkMuted || 'A8B3C3', align:'right' });
  addLabel(slide, s.label || 'FINAL DECISION', { x:0.86, y:1.02, w:1.54, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
  addText(slide, s.title || plan.closingTitle || '把下一步决策落在同一张事实地图上', {
    x:0.84, y:1.96, w:6.92, h:0.92,
    fontSize:typeSize('coverTitle', 31.5), bold:true, color:C.text, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || plan.closingSubtitle || '从共识、试点到复盘，把方案推进成可衡量的经营动作。', {
    x:0.88, y:3.12, w:5.92, h:0.22,
    fontSize:11.4, color:C.body, fit:'shrink'
  });
  addRect(slide, 0.88, 3.68, 0.96, 0.045, C.accent, C.accent);
  addRect(slide, 1.98, 3.68, 0.36, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

  const actions = closingActions(s);
  const startX = 0.86;
  const y = 4.72;
  const cardW = 2.52;
  actions.forEach((a, i) => {
    const x = startX + i * (cardW + 0.20);
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
    addRect(slide, x, y, cardW, 0.98, panel, C.line, { fill:{color:panel, transparency:i === 2 ? 10 : 0}, line:{color:C.line, transparency:12, width:0.45} });
    addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.30, w:0.32, h:0.12, fontSize:7.2, color:accent });
    addText(slide, a.title || '', { x:x+0.66, y:y+0.25, w:0.92, h:0.18, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, a.body || '', { x:x+0.66, y:y+0.56, w:1.48, h:0.20, fontSize:7.3, color:C.body, fit:'shrink', breakLine:true });
  });
  addLabel(slide, 'NEXT DECISION', { x:9.28, y:3.12, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.note || '确认首批增长场景、关键数据口径和复盘节奏。', {
    x:9.28, y:3.48, w:1.76, h:0.42,
    fontSize:8.0, color:C.captionOnImage || 'CBD5E1', fit:'shrink', breakLine:true
  });
  addHairline(slide, 9.28, 4.38, 1.18, C.accent, 0, 0.58);
  addText(slide, '从单点增长动作进入长期经营机制。', {
    x:9.28, y:4.78, w:1.68, h:0.30,
    fontSize:8.4, bold:true, color:C.white, fit:'shrink', breakLine:true
  });
  addHairline(slide, 0.86, 6.42, 7.60, C.line, 16, 0.55);
  addText(slide, closingMeta(plan), { x:0.86, y:6.70, w:7.60, h:0.16, fontSize:7.6, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}
function closingImageStatement(slide, plan, s, idx) {
  const design = designForSlide(plan, s, 'closing');
  const imagePath = design.imagePath;
  const bg = surfaceFill();
  slide.background = { color:bg };
  addRect(slide, 0, 0, W, H, bg, bg);
  addRect(slide, 0.72, 0.66, 5.42, 6.00, C.ink, C.ink);
  addPhotoPanel(slide, imagePath, 0.92, 0.90, 5.02, 5.42, { transparency:100, stroke:C.line, strokeTransparency:70, tone:'dark' });
  addRect(slide, 0.92, 5.72, 5.02, 0.60, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
  addLabel(slide, s.imageLabel || 'CLOSING VISUAL', { x:1.18, y:5.94, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, (s.visual && s.visual.caption) || '视觉仅作为收束气氛或主题证据，正文保持在可编辑文字层。', {
    x:2.62, y:5.93, w:2.72, h:0.12, fontSize:6.6, color:C.captionOnImage, fit:'shrink'
  });

  addLabel(slide, s.label || 'FINAL POSITION', { x:6.72, y:1.02, w:1.80, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
  addText(slide, String(idx || '').padStart(2,'0'), { x:11.62, y:1.00, w:0.58, h:0.16, fontSize:9.8, bold:true, color:C.muted, align:'right' });
  addText(slide, s.title || plan.closingTitle || '把项目推进到可验证、可复盘、可扩展', {
    x:6.68, y:2.06, w:4.88, h:0.98,
    fontSize:typeSize('coverTitle', 29.0), bold:true, color:C.text, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || plan.closingSubtitle || '下一步不只是启动系统，而是启动一套新的运营节奏。', {
    x:6.72, y:3.28, w:4.24, h:0.24,
    fontSize:10.8, color:C.body, fit:'shrink'
  });
  addRect(slide, 6.72, 3.86, 0.92, 0.045, C.accent, C.accent);
  const actions = closingActions(s).slice(0, 2);
  actions.forEach((a, i) => {
    const y = 4.70 + i * 0.62;
    addText(slide, String(i+1).padStart(2,'0'), { x:6.72, y, w:0.28, h:0.10, fontSize:6.2, bold:true, color:i === 0 ? C.accent : C.cyan });
    addText(slide, a.title || '', { x:7.20, y:y-0.01, w:1.08, h:0.13, fontSize:8.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, a.body || '', { x:8.52, y:y-0.01, w:2.42, h:0.16, fontSize:7.2, color:C.body, fit:'shrink' });
  });
  addText(slide, closingMeta(plan), { x:6.72, y:6.76, w:4.74, h:0.14, fontSize:7.0, color:C.muted, fit:'shrink' });
}
function closingDecisionBoard(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  addDarkBreathingCircle(slide, 8.16, 0.72, 4.18, 2.44, C.accent);
  addLabel(slide, s.label || 'FINAL POSITION', { x:0.92, y:0.98, w:1.70, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.05 });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.58, y:0.92, w:0.56, h:0.18, fontSize:10.8, color:C.accent, align:'right' });
  addText(slide, s.title || plan.closingTitle || '让复杂运营进入同一套决策节奏', {
    x:0.90, y:1.94, w:6.66, h:0.86,
    fontSize:31.0, bold:true, color:C.darkText || C.white, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || plan.closingSubtitle || '把共识写进流程，把变化沉淀为可追踪的数据。', {
    x:0.92, y:3.14, w:5.50, h:0.22,
    fontSize:11.4, color:C.darkMuted || 'CBD5E1', fit:'shrink'
  });
  addRect(slide, 0.94, 3.68, 0.96, 0.05, C.accent, C.accent);
  const actions = closingActions(s);
  actions.forEach((a, i) => {
    const y = 4.88 + i * 0.48;
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
    addHairline(slide, 0.94, y-0.12, 6.20, C.darkLine || '334155', 42, 0.45);
    addText(slide, String(i+1).padStart(2,'0'), { x:0.94, y, w:0.32, h:0.10, fontSize:6.2, bold:true, color:accent });
    addText(slide, a.title || '', { x:1.48, y:y-0.02, w:1.20, h:0.13, fontSize:8.5, bold:true, color:C.darkText || C.white, fit:'shrink' });
    addText(slide, a.body || '', { x:3.00, y:y-0.02, w:3.78, h:0.14, fontSize:7.2, color:C.darkMuted || 'CBD5E1', fit:'shrink' });
  });
  addText(slide, closingMeta(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.4, color:C.muted, fit:'shrink' });
}
function closingDecisionSummary(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, s.label || 'FINAL DECISION', 0.86, 0.72, false);
  addText(slide, s.title || plan.closingTitle || '把下一步决策收束到三件事', {
    x:0.84, y:1.18, w:6.72, h:0.72,
    fontSize:typeSize('coverTitle', 30.0), bold:true, color:C.text, fit:'shrink', breakLine:true
  });
  addText(slide, s.subtitle || plan.closingSubtitle || '用共识、资源和节奏，把方案推进成可验证的经营动作。', {
    x:0.86, y:2.20, w:5.88, h:0.22, fontSize:11.0, color:C.body, fit:'shrink'
  });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  addRect(slide, 8.60, 0.96, 2.92, 5.58, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addText(slide, 'DECISION', { x:9.00, y:1.32, w:1.88, h:0.36, fontFace:profileFont('latin'), fontSize:23.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
  addLabel(slide, 'BOARD READY', { x:9.58, y:1.86, w:1.14, h:0.10, fontSize:5.8, color:C.darkMuted || '94A3B8', align:'right', charSpace:0.8 });
  addHairline(slide, 9.02, 2.54, 1.28, C.accent, 0, 0.58);
  addText(slide, s.decision || s.note || '确认首批场景、关键指标和推进节奏。', {
    x:9.02, y:3.02, w:1.88, h:0.56, fontSize:9.0, bold:true, color:C.white, breakLine:true, fit:'shrink'
  });
  addText(slide, '以可验证结果进入下一轮复盘。', { x:9.02, y:4.72, w:1.72, h:0.22, fontSize:7.4, color:C.captionOnImage, fit:'shrink' });
  const actions = closingActions(s);
  actions.forEach((a,i)=>{
    const x = 0.92 + i*2.50;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, x, 4.02, 2.10, 1.30, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46} });
    addRect(slide, x, 4.02, 2.10, 0.04, accent, accent, { line:{color:accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:4.36, w:0.34, h:0.12, fontSize:7.0, color:accent });
    addText(slide, a.title || '', { x:x+0.68, y:4.30, w:0.98, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
    addText(slide, a.body || '', { x:x+0.22, y:4.78, w:1.56, h:0.18, fontSize:7.1, color:C.body, fit:'shrink' });
  });
  addHairline(slide, 0.92, 6.18, 6.80, C.line, 14, 0.45);
  addText(slide, closingMeta(plan), { x:0.92, y:6.46, w:6.40, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}

function closingManufacturingPilotRollout(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, s.label || 'PILOT ROLLOUT', 0.86, 0.72, false);
  addText(slide, s.title || '先把关键产线跑成可复盘闭环', { x:0.84, y:1.08, w:6.90, h:0.66, fontSize:29.0, bold:true, color:C.text, fit:'shrink', breakLine:true });
  addText(slide, s.subtitle || '用一条产线验证对象、数据、工单和 OEE 复盘，再扩展到多车间。', { x:0.86, y:2.06, w:6.40, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const core = { x:8.36, y:0.88, w:2.98, h:5.68 };
  addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'LINE 01', { x:core.x+0.32, y:1.28, w:0.86, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, 'PILOT', { x:core.x+0.32, y:1.72, w:1.78, h:0.36, fontFace:profileFont('latin'), fontSize:23.5, bold:true, color:C.white, fit:'shrink' });
  addHairline(slide, core.x+0.34, 2.66, 1.16, C.accent, 0, 0.58);
  addText(slide, s.decision || s.note || '确认首条试点产线、设备清单、数据口径和 8 周复盘节奏。', {
    x:core.x+0.34, y:3.10, w:1.94, h:0.58, fontSize:8.6, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true
  });
  ['设备对象', '工单闭环', 'OEE复盘'].forEach((label,i)=>{
    const y = 4.42 + i*0.42;
    addNumber(slide, String(i+1).padStart(2,'0'), { x:core.x+0.34, y, w:0.28, h:0.09, fontSize:5.8, color:i===0?C.accent:(i===1?C.cyan:C.violet) });
    addText(slide, label, { x:core.x+0.76, y:y-0.02, w:0.92, h:0.11, fontSize:7.2, color:'CBD5E1', fit:'shrink' });
  });

  const actions = closingActions(s);
  const y = 4.30;
  actions.forEach((a,i)=>{
    const x = 0.92 + i*2.34;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, x, y, 2.06, 1.20, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:14, width:0.44} });
    addRect(slide, x, y, 2.06, 0.04, accent, accent, { line:{color:accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.36, w:0.32, h:0.10, fontSize:6.8, color:accent });
    addText(slide, a.title || '', { x:x+0.66, y:y+0.30, w:0.90, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
    addText(slide, a.body || '', { x:x+0.22, y:y+0.72, w:1.46, h:0.16, fontSize:7.2, color:C.body, fit:'shrink' });
    if (i < actions.length - 1) addArrowLine(slide, x+2.18, y+0.60, 0.28, 0, accent, { transparency:32, width:0.38 });
  });
  addRect(slide, 0.92, 3.24, 6.94, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
  addText(slide, '试点不是“先上线一套系统”，而是先跑通一条可验证的产线经营闭环。', { x:1.14, y:3.31, w:6.46, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
  addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.50, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}

function closingFinanceInvestmentDecision(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, s.label || 'INVESTMENT DECISION', 0.86, 0.72, false);
  addText(slide, s.title || '把资本配置回到同一套决策口径', { x:0.84, y:1.08, w:6.80, h:0.66, fontSize:28.0, bold:true, color:C.text, fit:'shrink', breakLine:true });
  addText(slide, s.subtitle || '用组合分层、风险约束和退出节奏支撑下一轮投委会判断。', { x:0.86, y:2.04, w:6.40, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const memo = { x:8.20, y:0.92, w:3.20, h:5.64 };
  addRect(slide, memo.x, memo.y, memo.w, memo.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'IC MEMO', { x:memo.x+0.30, y:1.26, w:0.92, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, 'DECISION', { x:memo.x+0.30, y:1.70, w:1.78, h:0.34, fontFace:profileFont('latin'), fontSize:21.5, bold:true, color:C.white, fit:'shrink' });
  addHairline(slide, memo.x+0.30, 2.54, 1.10, C.accent, 0, 0.56);
  addText(slide, s.decision || s.note || '确认加仓、维持、退出和风险处置清单。', { x:memo.x+0.30, y:2.94, w:2.08, h:0.56, fontSize:8.8, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
  [
    ['CAPITAL', '配置动作'],
    ['RISK', '风险约束'],
    ['EXIT', '退出节奏']
  ].forEach((row,i)=>{
    const y = 4.34 + i*0.42;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addLabel(slide, row[0], { x:memo.x+0.32, y, w:0.72, h:0.08, fontSize:5.0, color:accent, charSpace:0.5 });
    addText(slide, row[1], { x:memo.x+1.28, y:y-0.02, w:0.88, h:0.11, fontSize:7.2, color:'CBD5E1', fit:'shrink' });
  });

  const actions = closingActions(s);
  addRect(slide, 0.92, 3.28, 6.72, 2.26, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
  addLabel(slide, 'NEXT CAPITAL ACTIONS', { x:1.18, y:3.58, w:1.62, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  actions.forEach((a,i)=>{
    const y = 4.04 + i*0.44;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:1.20, y, w:0.28, h:0.09, fontSize:6.0, color:accent });
    addText(slide, a.title || '', { x:1.76, y:y-0.03, w:1.16, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
    addText(slide, a.body || '', { x:3.36, y:y-0.03, w:3.10, h:0.13, fontSize:7.6, color:C.body, fit:'shrink' });
    addHairline(slide, 1.18, y+0.25, 5.88, C.line, 22, 0.28);
  });
  addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.20, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}

function closingHealthcareQualityHandoff(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, s.label || 'QUALITY HANDOFF', 0.86, 0.72, false);
  addText(slide, s.title || '先让患者旅程进入可追踪闭环', { x:0.84, y:1.08, w:6.70, h:0.66, fontSize:28.0, bold:true, color:C.text, fit:'shrink', breakLine:true });
  addText(slide, s.subtitle || '把触点、责任、质量证据和复盘节奏交接到同一套服务治理机制。', { x:0.86, y:2.04, w:6.55, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const handoff = { x:0.92, y:3.02, w:10.54, h:2.36 };
  addRect(slide, handoff.x, handoff.y, handoff.w, handoff.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
  const actions = closingActions(s);
  const points = actions.length ? actions : [{title:'旅程'}, {title:'质量'}, {title:'治理'}];
  const railX = handoff.x + 0.72;
  const railY = handoff.y + 1.04;
  const step = 8.88 / Math.max(1, points.length - 1);
  addHairline(slide, railX, railY, step*(points.length-1), C.line, 8, 0.62);
  points.slice(0,3).forEach((a,i)=>{
    const x = railX + i*step;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    slide.addShape('ellipse', { x:x-0.13, y:railY-0.13, w:0.26, h:0.26, fill:{color:accent}, line:{color:accent, transparency:100} });
    addText(slide, a.title || '', { x:x-0.62, y:railY+0.42, w:1.24, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink', align:'center' });
    addText(slide, a.body || '', { x:x-0.76, y:railY+0.78, w:1.52, h:0.16, fontSize:7.2, color:C.body, fit:'shrink', align:'center' });
    if (i < points.length-1) addArrowLine(slide, x+0.34, railY, step-0.68, 0, accent, { transparency:42, width:0.34 });
  });
  addRect(slide, 8.44, 0.96, 2.92, 1.62, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'QUALITY LOOP', { x:8.76, y:1.32, w:1.20, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
  addText(slide, s.decision || s.note || '以月度质量复盘承接患者触点改善。', { x:8.76, y:1.72, w:1.78, h:0.32, fontSize:8.2, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
  addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.40, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}

function closingSaasAdoptionClose(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, s.label || 'ADOPTION TO REVENUE', 0.86, 0.72, false);
  addText(slide, s.title || '把产品采用转成收入增长', { x:0.84, y:1.08, w:6.90, h:0.66, fontSize:28.5, bold:true, color:C.text, fit:'shrink', breakLine:true });
  addText(slide, s.subtitle || '先统一客户健康口径，再推动激活、集成和扩展收入复盘。', { x:0.86, y:2.04, w:6.60, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
  addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const actions = closingActions(s);
  const board = { x:0.92, y:3.04, w:7.02, h:2.34 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
  addLabel(slide, 'CUSTOMER HEALTH PATH', { x:board.x+0.28, y:board.y+0.28, w:1.64, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  actions.forEach((a,i)=>{
    const x = board.x + 0.42 + i*2.08;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, x, board.y+0.82, 1.56, 0.78, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
      fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1?0:8},
      line:{color:i===1?accent:C.line, transparency:i===1?22:16, width:0.38}
    });
    addText(slide, a.title || '', { x:x+0.18, y:board.y+1.10, w:1.16, h:0.12, fontSize:8.4, bold:true, color:i===1?C.white:C.text, align:'center', fit:'shrink' });
    addText(slide, a.body || '', { x:x+0.12, y:board.y+1.76, w:1.28, h:0.14, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
    if (i < actions.length-1) addArrowLine(slide, x+1.70, board.y+1.20, 0.32, 0, accent, { transparency:34, width:0.36 });
  });
  const metric = { x:8.56, y:1.04, w:2.70, h:4.72 };
  addRect(slide, metric.x, metric.y, metric.w, metric.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'REVENUE SIGNAL', { x:metric.x+0.28, y:1.38, w:1.22, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
  addText(slide, 'NRR', { x:metric.x+0.28, y:1.88, w:1.20, h:0.36, fontFace:profileFont('latin'), fontSize:24.0, bold:true, color:C.accent, fit:'shrink' });
  addText(slide, 'ADOPTION DEPTH', { x:metric.x+0.30, y:2.46, w:1.32, h:0.09, fontSize:5.2, color:'64748B', charSpace:0.65 });
  addHairline(slide, metric.x+0.30, 3.02, 1.10, C.accent, 0, 0.56);
  addText(slide, s.decision || s.note || '用激活率、集成深度和扩展收入解释增长质量。', { x:metric.x+0.30, y:3.44, w:1.76, h:0.44, fontSize:8.0, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
  addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.50, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
}

function closingAdaptive(slide, plan, s, idx) {
  if (plan.industry === 'energy-utility' || s.closingVariant === 'energy-stage') {
    return closingDark(slide, plan, s, idx);
  }
  const design = designForSlide(plan, s, 'closing');
  const closingVariant = variantOf(s) || s.closingVariant || '';
  const closingText = [s.title, s.subtitle, s.label, s.note].filter(Boolean).join(' ');
  if (['simple-end', 'end'].includes(closingVariant)) {
    return closingSimpleEnd(slide, plan, s, idx);
  }
  if (['thank-you', 'thanks'].includes(closingVariant) || /谢谢|感谢|thank|thanks|观看|答疑|Q&A/i.test(closingText)) {
    return closingThankYou(slide, plan, s, idx);
  }
  if (closingVariant === 'pilot-rollout') return closingManufacturingPilotRollout(slide, plan, s, idx);
  if (closingVariant === 'investment-decision') return closingFinanceInvestmentDecision(slide, plan, s, idx);
  if (closingVariant === 'quality-handoff') return closingHealthcareQualityHandoff(slide, plan, s, idx);
  if (closingVariant === 'adoption-close') return closingSaasAdoptionClose(slide, plan, s, idx);
  if (closingVariant === 'decision-summary' || s.closingVariant === 'decision-summary') {
    return closingDecisionSummary(slide, plan, s, idx);
  }
  if ((s.closingVariant === 'image' || design.wantsImage) && design.imagePath && fs.existsSync(design.imagePath)) {
    return closingImageStatement(slide, plan, s, idx);
  }
  const tone = presentationSpec().coverTone || 'dark';
  if (s.closingVariant === 'editorial-light' || tone === 'light' || tone === 'split') {
    return closingEditorialLight(slide, plan, s, idx);
  }
  return closingDecisionBoard(slide, plan, s, idx);
}


function energyToc(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  const useImage = slideWantsImage(plan, s, 'navigation');
  if (useImage) {
    addVisualPhotoPanel(slide, plan, s, 'navigation', 0, 5.58, W, 1.28, { transparency:44 });
  } else {
    addRect(slide, 0, 5.58, W, 1.28, C.ink2, C.ink2, { fill:{color:C.ink2, transparency:28}, line:{color:C.ink2, transparency:100} });
    addPulseCurve(slide, 1.02, 5.90, 5.36, 0.36, C.cyan, true, { transparency:66, width:0.36, nodes:false });
  }
  addDarkBreathingCircle(slide, 8.92, 0.34, 4.08, 2.18, C.accent);
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
    addNumber(slide, st[0], { x:x+0.42, y:y+0.17, w:0.36, h:0.10, fontSize:6.6, color:accent });
    addText(slide, st[1], { x:x+0.22, y:y+0.54, w:0.86, h:0.18, fontSize:11.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, st[2], { x:x+0.22, y:y+0.86, w:1.20, h:0.12, fontSize:7.1, color:'7C8BA3', fit:'shrink' });
    addText(slide, chapterLabels[i] || items[i] || '', { x:x+0.22, y:y+1.08, w:1.58, h:0.16, fontSize:8.2, bold:active, color:active?C.white:'CBD5E1', fit:'shrink' });
    if (i < stages.length - 1) {
      slide.addShape('line', { x:x+cardW+0.03, y:y+0.72, w:gap+0.10, h:0, line:{color:'334155', transparency:30, width:0.40, endArrowType:'triangle'} });
    }
  });
  addLabel(slide, 'SITE · DATA · ALARM · DISPATCH · VALUE', { x:7.94, y:6.18, w:3.28, h:0.12, fontSize:6.4, color:'94A3B8', charSpace:0.8, align:'right' });
  addEnergyFooter(slide, plan, true);
}
function tocClean(slide, plan, s, idx) {
  // Premium navigation: very clear chapter stack with subtle spatial backdrop.
  slide.background = { color:C.ink };
  addRect(slide, 0, 0, W, H, C.ink, C.ink);
  slide.addShape('ellipse', { x:8.70, y:-0.74, w:4.90, h:4.90, fill:{color:C.accent, transparency:97}, line:{color:C.accent, transparency:90, width:0.45} });
  slide.addShape('ellipse', { x:9.96, y:0.52, w:2.58, h:2.58, fill:{color:C.ink, transparency:100}, line:{color:C.cyan, transparency:92, width:0.4} });
  slide.addShape('ellipse', { x:-1.45, y:5.22, w:3.10, h:3.10, fill:{color:C.cyan, transparency:94}, line:{color:C.cyan, transparency:100} });
  addText(slide, 'CONTENTS', { x:0.78, y:0.96, w:1.65, h:0.16, fontSize:8.0, color:'64748B', charSpace:1.5 });
  addText(slide, '02', { x:0.70, y:1.42, w:2.25, h:0.82, fontSize:57, bold:true, color:'17233A' });
  addText(slide, s.title || '目录', { x:0.78, y:2.08, w:2.6, h:0.48, fontSize:28, bold:true, color:C.white });
  addHairline(slide, 0.82, 2.86, 0.86, C.accent, 0, 0.75);
  addText(slide, '从业务背景、运营模型到平台架构、落地路径与保障机制', { x:0.80, y:3.42, w:3.05, h:0.38, fontSize:10.2, color:'94A3B8', breakLine:true });
  addText(slide, footerText(plan), { x:0.80, y:6.82, w:2.75, h:0.14, fontSize:7.5, color:'64748B' });

  const items = s.items || [];
  glassPanel(slide, 4.82, 1.44, 6.18, 4.72, true);
  addText(slide, 'NAVIGATION SEQUENCE', { x:5.20, y:1.78, w:2.15, h:0.13, fontSize:7.0, color:'64748B', charSpace:1.1 });
  slide.addShape('line', { x:5.32, y:2.28, w:0, h:3.00, line:{color:'334155', transparency:46, width:0.45} });
  items.slice(0,5).forEach((it,i)=>{
    const y = 2.24 + i*0.60;
    const active = i===0;
    const accent = active ? C.accent : (i===2 ? C.cyan : (i===4 ? C.violet : '94A3B8'));
    slide.addShape('ellipse', { x:5.27, y:y+0.05, w:0.10, h:0.10, fill:{color:accent}, line:{color:accent, transparency:100} });
    addText(slide, String(i+1).padStart(2,'0'), { x:5.70, y:y-0.01, w:0.35, h:0.12, fontSize:7.2, bold:true, color:accent });
    addText(slide, it, { x:6.30, y:y-0.04, w:3.40, h:0.16, fontSize:11.6, bold:true, color:active?C.white:'CBD5E1', fit:'shrink' });
    if (i<4) addHairline(slide, 6.30, y+0.34, 3.88, '334155', 72, 0.32);
  });
  addText(slide, '01—05', { x:9.82, y:5.36, w:0.58, h:0.14, fontSize:7.6, color:'64748B', align:'right' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.78, y:0.70, w:0.58, h:0.18, fontSize:11.5, bold:true, color:'64748B', align:'right' });
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
function reportBoardItems(s) {
  const raw = s.sections || s.cards || s.items || s.rows || [];
  return (Array.isArray(raw) ? raw : []).map(v => {
    if (Array.isArray(v)) return { title:v[0], body:v[2] || v[1] || '' };
    if (typeof v === 'string') return { title:v, body:'' };
    return v || {};
  }).filter(Boolean);
}
function reportBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, s.label || 'REPORT BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '信息板', { x:0.84, y:1.04, w:6.2, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || s.intro || '文案较多时优先压缩装饰，并用分栏、编号和层级让信息可扫读。', {
    x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink'
  });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const items = reportBoardItems(s).slice(0,9);
  const summary = s.summary || s.coreBody || s.note || '报告型页面不追求装饰变化，重点是让读者能在一屏内读出判断、证据和下一步。';
  addRect(slide, 0.92, 2.08, 2.78, 4.16, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'EXECUTIVE READ', { x:1.22, y:2.44, w:1.28, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '先读结论，再看证据', { x:1.22, y:2.92, w:1.82, h:0.32, fontSize:14.6, bold:true, color:C.white, fit:'shrink' });
  addText(slide, summary, { x:1.22, y:3.62, w:1.86, h:0.78, fontSize:8.4, color:C.captionOnImage, fit:'shrink', breakLine:true });
  addHairline(slide, 1.22, 4.84, 0.82, C.accent, 0, 0.62);
  addText(slide, s.decision || '建议把长文案拆成结论、证据、动作三层。', { x:1.22, y:5.20, w:1.82, h:0.28, fontSize:7.6, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });

  const board = { x:4.12, y:2.08, w:7.46, h:4.16 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'EVIDENCE STACK', { x:board.x+0.28, y:board.y+0.28, w:1.28, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
  const cols = 3;
  const colW = 2.18;
  items.forEach((it,i)=>{
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = board.x + 0.28 + col * 2.34;
    const y = board.y + 0.76 + row * 1.02;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addHairline(slide, x, y+0.86, colW, C.line, 18, 0.30);
    addNumber(slide, String(i+1).padStart(2,'0'), { x, y:y+0.02, w:0.28, h:0.10, fontSize:6.6, color:accent });
    addText(slide, itemTitle(it, `要点 ${i+1}`), { x:x+0.40, y:y-0.02, w:1.28, h:0.15, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+0.40, y:y+0.30, w:1.52, h:0.28, fontSize:7.4, color:C.body, fit:'shrink', breakLine:true });
  });
  if (!items.length) {
    addText(slide, '暂无结构化条目', { x:board.x+0.28, y:board.y+1.08, w:2.2, h:0.16, fontSize:10.0, color:C.muted });
  }
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}
function itemTitle(v, fallback='') {
  if (typeof v === 'string') return v;
  return (v && (v.title || v.label || v.name || v.value)) || fallback;
}
function itemBody(v, fallback='') {
  if (typeof v === 'string') return '';
  return (v && (v.body || v.note || v.text || v.description)) || fallback;
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
	        addText(slide, s.note || '产品矩阵页适合 SKU、方案包、功能模块或服务产品较多的材料。', { x:0.92, y:6.42, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
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
	      addText(slide, s.note || '产品矩阵页适合 SKU、方案包、功能模块或服务产品较多的材料。', { x:0.92, y:6.42, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
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
    addText(slide, s.note || '产品矩阵页适合 SKU、方案包、功能模块或服务产品较多的材料。', { x:0.92, y:6.62, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
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
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

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
  addDarkBreathingCircle(slide, 2.05, 4.70, 2.72, 1.46, C.cyan);
  addLabel(slide, 'SITE READOUT', { x:0.78, y:0.76, w:1.36, h:0.12, fontSize:6.8, color:'94A3B8', charSpace:1.1 });
  addText(slide, s.title || '多站点能源资产运营背景', { x:0.76, y:1.18, w:3.18, h:0.62, fontSize:22.5, bold:true, color:C.white, fit:'shrink', breakLine:true });
  addText(slide, s.leftTitle || '管理现状', { x:0.82, y:2.28, w:1.36, h:0.18, fontSize:10.6, bold:true, color:'CBD5E1' });
  (s.left || []).slice(0,3).forEach((it,i)=>{
    const y = 2.78 + i*0.78;
    const accent = i===1 ? C.cyan : C.accent;
    slide.addShape('ellipse', { x:0.86, y:y+0.07, w:0.07, h:0.07, fill:{color:accent}, line:{color:accent, transparency:100} });
    addText(slide, it, { x:1.08, y:y, w:2.80, h:0.32, fontSize:8.0, color:'CBD5E1', fit:'shrink', breakLine:true, valign:'mid' });
  });
  addHairline(slide, 0.82, 5.62, 1.06, C.accent, 0, 0.65);
  addLabel(slide, 'BESS · PV · MICROGRID', { x:0.82, y:5.92, w:2.18, h:0.10, fontSize:6.0, color:'7C8BA3', charSpace:0.7 });

  addLabel(slide, 'UPGRADE DEMANDS', { x:5.62, y:0.72, w:1.48, h:0.12, fontSize:6.8, color:C.muted, charSpace:1.0 });
  addText(slide, s.rightTitle || '升级诉求', { x:5.58, y:1.10, w:3.0, h:0.30, fontSize:22.0, bold:true, color:C.text });
  addText(slide, '把设备数据、运行状态和策略复盘收束成同一套管理视图。', { x:5.60, y:1.56, w:4.80, h:0.17, fontSize:8.8, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.68, w:0.72, h:0.20, fontSize:12.6, color:C.accent, align:'right' });

  (s.cards || []).slice(0,3).forEach((c,i)=>{
    const y = 2.20 + i*1.22;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, 5.58, y, 5.86, 0.94, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.54} });
    addRect(slide, 5.58, y, 0.05, 0.94, accent, accent, { line:{color:accent, transparency:100} });
    addText(slide, String(i+1).padStart(2,'0'), { x:5.90, y:y+0.35, w:0.34, h:0.12, fontSize:7.0, bold:true, color:accent, valign:'mid' });
    addText(slide, c.title, { x:6.46, y:y+0.22, w:1.72, h:0.17, fontSize:12.0, bold:true, color:C.text, fit:'shrink', valign:'mid' });
    addText(slide, c.body, { x:8.24, y:y+0.18, w:2.70, h:0.34, fontSize:8.2, color:C.body, fit:'shrink', valign:'mid' });
  });

  addRect(slide, 5.58, 6.03, 5.86, 0.42, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'DESIGN PRINCIPLE', { x:5.88, y:6.18, w:1.20, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
  addText(slide, '先统一运行事实，再设计调度闭环。', { x:7.22, y:6.16, w:2.72, h:0.12, fontSize:8.1, bold:true, color:'CBD5E1', fit:'shrink' });
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
    addEnergyLens(slide, 8.94, 1.26, 2.94, C.cyan);
  }
  addLabel(slide, 'OPERATING BREAKPOINTS', { x:0.84, y:0.72, w:1.90, h:0.12, fontSize:6.8, color:'64748B', charSpace:1.05 });
  addText(slide, s.title || '从分散巡检到集中运维', { x:0.82, y:1.08, w:5.55, h:0.36, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.intro) addText(slide, s.intro, { x:0.84, y:1.56, w:5.72, h:0.20, fontSize:9.0, color:'94A3B8', fit:'shrink' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

  addRect(slide, 0.90, 2.20, 7.24, 0.52, C.ink2, '334155', { fill:{color:C.ink2, transparency:54}, line:{color:'334155', transparency:64, width:0.36} });
  addLabel(slide, 'FROM', { x:1.18, y:2.39, w:0.44, h:0.09, fontSize:5.4, bold:true, color:'64748B', charSpace:0.7 });
  addText(slide, '分散巡检', { x:1.72, y:2.34, w:1.16, h:0.12, fontSize:8.4, bold:true, color:'CBD5E1' });
  addHairline(slide, 3.06, 2.46, 1.66, C.accent, 42, 0.38);
  addLabel(slide, 'TO', { x:5.04, y:2.39, w:0.26, h:0.09, fontSize:5.4, bold:true, color:C.cyan, charSpace:0.7 });
  addText(slide, '集中运维闭环', { x:5.44, y:2.34, w:1.62, h:0.12, fontSize:8.4, bold:true, color:C.white });

  const cards = s.cards || [];
  const pos = [[0.92,3.16],[4.18,3.16],[0.92,4.60],[4.18,4.60]];
  cards.slice(0,4).forEach((c,i)=>{
    const [x,y] = pos[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, 2.90, 1.00, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?18:36}, line:{color:accent, transparency:i===0?24:58, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:y+0.22, w:0.32, h:0.10, fontSize:6.7, color:accent });
    addText(slide, c.title, { x:x+0.70, y:y+0.17, w:1.62, h:0.16, fontSize:11.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, c.body, { x:x+0.24, y:y+0.52, w:2.34, h:0.28, fontSize:7.8, color:'A8B3C3', fit:'shrink' });
  });
  addLabel(slide, 'FIELD SIGNAL', { x:9.12, y:5.16, w:1.02, h:0.10, fontSize:5.8, color:'7C8BA3', charSpace:0.8 });
  addText(slide, '设备状态进入同一张运行图', { x:9.12, y:5.50, w:1.98, h:0.18, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
  addPulseCurve(slide, 9.12, 5.82, 2.10, 0.28, C.cyan, true, { transparency:46, width:0.36, nodes:false });
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

function financeMetricDashboard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PORTFOLIO DASHBOARD', 0.86, 0.72, false);
  addText(slide, s.title || '组合表现复盘', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把回报、现金回收和风险暴露放在同一张投委会复盘页。';
  addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const metrics = (s.metrics || []).slice(0,4);
  const primary = metrics[0] || { label:'组合 IRR', value:'—', note:'需要结合估值、现金回收和退出窗口一起判断。' };
  const panel = { x:0.92, y:2.08, w:3.10, h:3.94 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PRIMARY RETURN', { x:panel.x+0.30, y:panel.y+0.34, w:1.42, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addText(slide, primary.label || '核心指标', { x:panel.x+0.30, y:panel.y+0.78, w:1.56, h:0.15, fontSize:9.0, bold:true, color:'CBD5E1', fit:'shrink' });
  addNumber(slide, primary.value || '—', { x:panel.x+0.28, y:panel.y+1.12, w:2.18, h:0.58, fontSize:38, color:C.white, fit:'shrink' });
  const delta = formatMetricDelta(primary.delta || primary.unit);
  if (delta) {
    addRect(slide, panel.x+0.34, panel.y+1.96, 1.62, 0.26, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addText(slide, delta, { x:panel.x+0.46, y:panel.y+2.00, w:1.36, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
  }
  addText(slide, primary.note || '核心回报指标需要和现金回收、退出窗口、后续融资共同复盘。', { x:panel.x+0.32, y:panel.y+2.58, w:2.30, h:0.46, fontSize:7.2, color:'A8B3C3', breakLine:true, fit:'shrink' });
  addHairline(slide, panel.x+0.32, panel.y+3.38, 0.82, C.accent, 0, 0.58);
  addLabel(slide, 'IC VIEW', { x:panel.x+0.32, y:panel.y+3.62, w:0.82, h:0.12, fontSize:6.8, color:'64748B', charSpace:0.7 });

  const chart = { x:4.46, y:2.10, w:3.16, h:3.86 };
  addRect(slide, chart.x, chart.y, chart.w, chart.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
  addLabel(slide, 'RETURN / CASH / RISK', { x:chart.x+0.26, y:chart.y+0.32, w:1.96, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  const bars = metrics.slice(0,3);
  bars.forEach((m,i)=>{
    const y = chart.y + 0.86 + i*0.82;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.risk);
    addText(slide, m.label || `指标 ${i+1}`, { x:chart.x+0.28, y:y-0.02, w:1.10, h:0.12, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, m.value || '—', { x:chart.x+2.04, y:y-0.06, w:0.74, h:0.16, fontSize:11.6, color:accent, align:'right', fit:'shrink' });
    addRect(slide, chart.x+0.28, y+0.28, 2.34, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
    addRect(slide, chart.x+0.28, y+0.28, [1.82,1.20,0.82][i] || 1.0, 0.055, accent, accent, { line:{color:accent, transparency:100} });
    if (m.delta) addText(slide, formatMetricDelta(m.delta), { x:chart.x+0.28, y:y+0.46, w:1.56, h:0.12, fontSize:6.8, color:C.muted, fit:'shrink' });
  });
  addRect(slide, chart.x+0.28, chart.y+3.34, 2.40, 0.28, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
  addText(slide, '现金回收、估值修复、风险项目必须同步看。', { x:chart.x+0.40, y:chart.y+3.40, w:2.12, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });

  const table = { x:8.08, y:2.10, w:3.64, h:3.86 };
  addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
  addLabel(slide, 'MANAGEMENT READOUT', { x:table.x+0.26, y:table.y+0.32, w:1.88, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  metrics.slice(0,3).forEach((m,i)=>{
    const y = table.y + 0.86 + i*0.82;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.risk);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:table.x+0.28, y:y, w:0.28, h:0.12, fontSize:6.8, color:accent });
    addText(slide, m.label || `指标 ${i+1}`, { x:table.x+0.72, y:y-0.02, w:0.86, h:0.12, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
    addText(slide, m.note || '纳入季度复盘。', { x:table.x+1.72, y:y-0.02, w:1.38, h:0.18, fontSize:6.8, color:C.body, fit:'shrink' });
    addHairline(slide, table.x+0.28, y+0.48, 2.84, C.line, 20, 0.34);
  });
  addText(slide, s.note || 'DPI 与估值修复是当前最重要的复盘信号。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.2, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function financeBridgeSlide(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'RETURN BRIDGE', 0.86, 0.72, false);
  addText(slide, s.title || '组合回报归因桥', { x:0.84, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.54, w:6.9, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const bridge = (s.bridge || []).slice(0,6);
  const chart = { x:0.92, y:2.08, w:7.28, h:4.00 };
  addRect(slide, chart.x, chart.y, chart.w, chart.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'IRR CONTRIBUTION', { x:chart.x+0.30, y:chart.y+0.32, w:1.52, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addHairline(slide, chart.x+0.44, chart.y+3.22, chart.w-0.88, C.line, 10, 0.48);
  const barW = 0.62;
  const gap = bridge.length > 1 ? (chart.w - 1.24 - bridge.length*barW) / (bridge.length - 1) : 0.80;
  bridge.forEach((b,i)=>{
    const kind = b.kind || b.type || (i===0?'start':(i===bridge.length-1?'end':'up'));
    const h = Math.max(0.30, Math.min(2.20, Number(b.height) || (kind === 'down' ? 0.76 : (kind === 'end' ? 1.68 : 0.92))));
    const x = chart.x + 0.62 + i*(barW+gap);
    const y = chart.y + 3.22 - h;
    const color = kind === 'down' ? C.risk : (kind === 'end' || kind === 'start' ? C.accent : C.cyan);
    addRect(slide, x, y, barW, h, color, color, { fill:{color, transparency:kind === 'down' ? 12 : 0}, line:{color, transparency:100} });
    addText(slide, b.value || '', { x:x-0.22, y:y-0.26, w:1.06, h:0.12, fontSize:7.0, bold:true, color:kind === 'down' ? C.risk : C.text, align:'center', fit:'shrink' });
    addText(slide, b.label || `项目 ${i+1}`, { x:x-0.36, y:chart.y+3.46, w:1.32, h:0.24, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
    if (i < bridge.length - 1) addHairline(slide, x+barW, y, gap*0.72, C.line, 34, 0.30);
  });

  const actions = s.actions || s.items || [];
  const side = { x:8.66, y:2.08, w:3.06, h:4.00 };
  addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'CAPITAL ACTIONS', { x:side.x+0.28, y:side.y+0.34, w:1.44, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.decision || '把归因结果转化为加仓、维持、退出和风险隔离动作。', { x:side.x+0.28, y:side.y+0.80, w:2.14, h:0.40, fontSize:8.2, color:'CBD5E1', breakLine:true, fit:'shrink' });
  actions.slice(0,4).forEach((a,i)=>{
    const y = side.y + 1.70 + i*0.52;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.risk : '94A3B8'));
    addNumber(slide, String(i+1).padStart(2,'0'), { x:side.x+0.30, y:y+0.06, w:0.28, h:0.12, fontSize:6.8, color:accent });
    addText(slide, itemTitle(a, `动作 ${i+1}`), { x:side.x+0.70, y:y+0.03, w:1.22, h:0.12, fontSize:7.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(a), { x:side.x+1.82, y:y+0.01, w:0.74, h:0.14, fontSize:6.8, color:'A8B3C3', fit:'shrink' });
  });
  addText(slide, s.note || '桥图用于解释变化来源，避免投委会只看到结果数字。', { x:0.94, y:6.42, w:8.6, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function portfolioTableSlide(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PORTFOLIO ACTION TABLE', 0.86, 0.72, false);
  addText(slide, s.title || '组合分层与行动清单', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const rows = (s.portfolio || s.allocations || s.rows || []).slice(0,5);
  const summary = { x:0.92, y:2.10, w:2.72, h:3.94 };
  addRect(slide, summary.x, summary.y, summary.w, summary.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'ALLOCATION VIEW', { x:summary.x+0.28, y:summary.y+0.34, w:1.46, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  const total = rows.reduce((sum,r)=>sum+(Number(r.weight) || 0), 0) || 100;
  rows.slice(0,4).forEach((r,i)=>{
    const y = summary.y + 1.06 + i*0.58;
    const share = Math.max(0.18, Math.min(0.96, (Number(r.weight) || (25 - i*3)) / total * 2.4));
    const color = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    slide.addShape('ellipse', { x:summary.x+0.34, y:y+0.05, w:0.10, h:0.10, fill:{color}, line:{color, transparency:100} });
    addText(slide, r.theme || r.name || `组合 ${i+1}`, { x:summary.x+0.58, y:y, w:1.10, h:0.12, fontSize:6.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, `${r.weight || ''}%`, { x:summary.x+2.00, y:y, w:0.40, h:0.12, fontSize:6.8, color:'A8B3C3', align:'right', fit:'shrink' });
    addRect(slide, summary.x+0.58, y+0.28, 1.58, 0.035, '334155', '334155', { line:{color:'334155', transparency:100} });
    addRect(slide, summary.x+0.58, y+0.28, share, 0.035, color, color, { line:{color, transparency:100} });
  });
  addHairline(slide, summary.x+0.32, summary.y+3.42, 0.82, C.accent, 0, 0.56);
  addText(slide, s.summary || '按主题、风险和现金回收能力决定下一阶段配置动作。', { x:summary.x+0.32, y:summary.y+3.58, w:1.94, h:0.22, fontSize:6.8, color:'A8B3C3', fit:'shrink' });

  const table = { x:4.08, y:2.10, w:7.64, h:3.94 };
  addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  const headers = ['主题', '权重', 'IRR', 'DPI', '风险', '动作'];
  const col = [0, 1.52, 2.48, 3.36, 4.18, 5.18];
  const colW = [1.34, 0.70, 0.62, 0.62, 0.74, 1.42];
  headers.forEach((h,i)=>addText(slide, h, { x:table.x+0.26+col[i], y:table.y+0.32, w:colW[i], h:0.12, fontSize:6.8, bold:true, color:i===0?C.accent:C.muted, fit:'shrink' }));
  addHairline(slide, table.x+0.24, table.y+0.66, table.w-0.48, C.line, 12, 0.45);
  rows.forEach((r,i)=>{
    const y = table.y + 0.96 + i*0.54;
    const riskColor = r.risk === '高' ? C.risk : (r.risk === '低' ? C.cyan : C.accent);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:table.x+0.26, y:y, w:0.28, h:0.12, fontSize:6.8, color:i===0?C.accent:C.muted });
    addText(slide, r.theme || r.name || `主题 ${i+1}`, { x:table.x+0.64, y:y, w:1.06, h:0.12, fontSize:7.2, bold:true, color:C.text, fit:'shrink' });
    addText(slide, `${r.weight || '—'}%`, { x:table.x+1.78, y:y, w:0.52, h:0.12, fontSize:7.0, color:C.body, align:'right', fit:'shrink' });
    addText(slide, r.irr || '—', { x:table.x+2.72, y:y, w:0.48, h:0.12, fontSize:7.0, color:C.body, align:'right', fit:'shrink' });
    addText(slide, r.dpi || '—', { x:table.x+3.58, y:y, w:0.48, h:0.12, fontSize:7.0, color:C.body, align:'right', fit:'shrink' });
    addRect(slide, table.x+4.44, y-0.01, 0.50, 0.22, riskColor, riskColor, { fill:{color:riskColor, transparency:10}, line:{color:riskColor, transparency:100} });
    addText(slide, r.risk || '中', { x:table.x+4.44, y:y+0.055, w:0.50, h:0.08, fontSize:6.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink' });
    addText(slide, r.action || '维持观察', { x:table.x+5.40, y:y, w:1.16, h:0.12, fontSize:7.0, bold:true, color:C.text, fit:'shrink' });
    addHairline(slide, table.x+0.24, y+0.34, table.w-0.48, C.line, 20, 0.30);
  });
  addText(slide, s.note || '组合表用于把配置比例、回收质量、风险等级和下一步动作放在同一坐标。', { x:0.94, y:6.42, w:8.6, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function coerceChartItems(value, fallback = []) {
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.items)) return value.items.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.rows)) return value.rows.map(v => Array.isArray(v) ? { title:v[0], value:v[1], body:v[2] } : v);
  return fallback;
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
  addText(slide, s.note || '该页用于压测行业专用图表，而不是普通卡片。', { x:side.x+0.28, y:side.y+2.92, w:1.76, h:0.42, fontSize:8.8, color:'A8B3C3', fit:'shrink', breakLine:true });
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

  if (variant === 'downtime-pareto') {
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
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function manufacturingOeeBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'OEE / LINE READOUT', 0.86, 0.72, false);
  addText(slide, s.title || 'OEE 与产线效率复盘', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把稼动、节拍、良率、停机和维修动作放到同一张产线复盘页。';
  addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const metrics = (s.metrics || []).slice(0,4);
  const findMetric = (re, fallbackIndex) => metrics.find(m => re.test(`${m.label || ''} ${m.title || ''}`)) || metrics[fallbackIndex] || {};
  const primary = findMetric(/OEE|设备效率|產線|产线/i, 0);
  const maintenance = findMetric(/响应|維修|维修|MTTR|停机|停線|重复/i, 1);
  const quality = findMetric(/良率|质量|品質|重复|返工/i, 2);
  const pctWidth = (value, max=2.30) => {
    const num = Number(String(value || '').replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(num)) return max * 0.56;
    return Math.max(0.28, Math.min(max, max * Math.min(100, Math.abs(num)) / 100));
  };
  const components = (s.oee || s.oeeComponents || [
    { label:'稼动率', value:'92%', body:'停机窗口和换线等待进入复盘。' },
    { label:'性能率', value:'84%', body:'节拍波动和瓶颈工位可被识别。' },
    { label:'良率', value:'97%', body:'返工、报废和质量异常绑定工单。' }
  ]).slice(0,3);

  const hero = { x:0.92, y:2.10, w:2.88, h:3.92 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:28, width:0.56} });
  addRect(slide, hero.x+0.30, hero.y+0.68, hero.w-0.60, 0.06, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
  addRect(slide, hero.x+0.30, hero.y+3.18, hero.w-0.60, 0.34, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PRIMARY OEE', { x:hero.x+0.30, y:hero.y+0.34, w:1.20, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  addText(slide, primary.label || 'OEE', { x:hero.x+0.30, y:hero.y+0.86, w:1.42, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
  addNumber(slide, primary.value || '78%', { x:hero.x+0.28, y:hero.y+1.20, w:2.12, h:0.62, fontSize:40, color:C.text, fit:'shrink' });
  if (primary.delta) {
    addRect(slide, hero.x+0.34, hero.y+2.02, 1.82, 0.30, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addText(slide, formatMetricDelta(primary.delta), { x:hero.x+0.46, y:hero.y+2.08, w:1.54, h:0.15, fontSize:8.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
  }
  addText(slide, primary.note || 'OEE 不是孤立指标，需要拆到稼动、节拍和良率，再回到维修动作。', { x:hero.x+0.32, y:hero.y+2.62, w:2.10, h:0.36, fontSize:7.2, color:C.body, breakLine:true, fit:'shrink' });
  addLabel(slide, 'LINE 01 · LIVE READOUT', { x:hero.x+0.44, y:hero.y+3.30, w:1.56, h:0.12, fontSize:6.4, color:'CBD5E1', charSpace:0.7 });

  const board = { x:4.28, y:2.10, w:4.24, h:3.92 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'OEE DECOMPOSITION', { x:board.x+0.28, y:board.y+0.32, w:1.70, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  components.forEach((m,i)=>{
    const y = board.y + 0.88 + i*0.86;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.30, y:y+0.02, w:0.30, h:0.12, fontSize:6.8, color:accent });
    addText(slide, m.label || `构成 ${i+1}`, { x:board.x+0.72, y:y-0.04, w:0.98, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, m.value || '—', { x:board.x+3.06, y:y-0.06, w:0.68, h:0.16, fontSize:11.2, color:accent, align:'right', fit:'shrink' });
    addRect(slide, board.x+0.72, y+0.30, 2.36, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
    addRect(slide, board.x+0.72, y+0.30, pctWidth(m.value, 2.36), 0.055, accent, accent, { line:{color:accent, transparency:100} });
    addText(slide, m.body || m.note || '', { x:board.x+0.72, y:y+0.48, w:2.88, h:0.17, fontSize:8.8, color:C.body, fit:'shrink' });
  });
  addRect(slide, board.x+0.28, board.y+3.32, 3.52, 0.30, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
  addText(slide, '产线证据要能回到停机原因、维修工单和策略更新。', { x:board.x+0.42, y:board.y+3.38, w:3.10, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });

  const ops = { x:8.92, y:2.10, w:2.86, h:3.92 };
  addRect(slide, ops.x, ops.y, ops.w, ops.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'MAINTENANCE SIGNALS', { x:ops.x+0.26, y:ops.y+0.32, w:1.78, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
  [maintenance, quality].forEach((m,i)=>{
    const y = ops.y + 0.92 + i*1.05;
    const accent = i===0 ? C.cyan : C.risk;
    addText(slide, m.label || (i===0 ? '平均响应' : '重复故障'), { x:ops.x+0.28, y:y-0.02, w:1.18, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, m.value || (i===0 ? '18min' : '12%'), { x:ops.x+1.70, y:y-0.05, w:0.78, h:0.18, fontSize:13.5, color:accent, align:'right', fit:'shrink' });
    addText(slide, m.note || '纳入班组复盘。', { x:ops.x+0.28, y:y+0.36, w:1.96, h:0.28, fontSize:8.8, color:C.body, fit:'shrink' });
    addHairline(slide, ops.x+0.28, y+0.78, 2.18, C.line, 20, 0.34);
  });
  const rail = ['STATE', 'STOP', 'WO', 'OEE'];
  rail.forEach((label,i)=>{
    const y = ops.y + 3.12;
    const x = ops.x + 0.26 + i*0.58;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    slide.addShape('ellipse', { x, y, w:0.12, h:0.12, fill:{color:accent}, line:{color:accent, transparency:100} });
    if (i<rail.length-1) addHairline(slide, x+0.12, y+0.06, 0.42, C.line, 18, 0.34);
    addText(slide, label, { x:x-0.14, y:y+0.28, w:0.48, h:0.18, fontSize:5.8, color:C.muted, align:'center', fit:'shrink' });
  });
  addText(slide, s.note || '建议把 OEE 拆解和维修闭环放在同一页，避免只展示孤立 KPI。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function metricPctWidth(value, max = 1.8, fallback = 0.56) {
  const num = Number(String(value || '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(num)) return max * fallback;
  return Math.max(0.22, Math.min(max, max * Math.min(100, Math.abs(num)) / 100));
}

function findMetric(metrics, re, fallbackIndex = 0) {
  return metrics.find(m => re.test(`${m.label || ''} ${m.title || ''} ${m.note || ''}`)) || metrics[fallbackIndex] || {};
}

function healthcareServiceScorecard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PATIENT SERVICE SCORECARD', 0.86, 0.72, false);
  addText(slide, s.title || '患者体验与响应效率', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把满意度、等待时长和反馈闭环放回患者旅程，而不是孤立展示 KPI。';
  addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const metrics = (s.metrics || []).slice(0,4);
  const satisfaction = findMetric(metrics, /满意|NPS|experience|satisfaction/i, 0);
  const wait = findMetric(metrics, /等待|wait|响应|response/i, 1);
  const closure = findMetric(metrics, /闭环|投诉|反馈|closure|case/i, 2);
  const stage = { x:0.92, y:2.10, w:10.90, h:3.92 };
  addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

  const hero = { x:1.22, y:2.44, w:2.28, h:2.98 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PRIMARY EXPERIENCE', { x:hero.x+0.28, y:hero.y+0.30, w:1.40, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
  addText(slide, satisfaction.label || '满意度', { x:hero.x+0.28, y:hero.y+0.78, w:1.10, h:0.15, fontSize:8.6, bold:true, color:'CBD5E1', fit:'shrink' });
  addNumber(slide, satisfaction.value || '—', { x:hero.x+0.26, y:hero.y+1.12, w:1.74, h:0.54, fontSize:35, color:C.white, fit:'shrink' });
  addHairline(slide, hero.x+0.28, hero.y+2.08, 0.88, C.accent, 0, 0.55);
  addText(slide, satisfaction.note || '把体验结果回看至预约、到院、检查和随访触点。', { x:hero.x+0.28, y:hero.y+2.36, w:1.58, h:0.30, fontSize:6.8, color:C.captionOnImage, fit:'shrink', breakLine:true });

  const flowX = 4.06;
  const flowY = 2.60;
  addLabel(slide, 'JOURNEY READOUT', { x:flowX, y:flowY-0.02, w:1.22, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  const journey = [
    { title:'预约', metric:wait, color:C.accent },
    { title:'到院', metric:satisfaction, color:C.cyan },
    { title:'反馈', metric:closure, color:C.violet }
  ];
  journey.forEach((j,i)=>{
    const x = flowX + i*2.12;
    slide.addShape('ellipse', { x:x, y:flowY+0.70, w:0.18, h:0.18, fill:{color:j.color}, line:{color:j.color, transparency:100} });
    if (i < journey.length - 1) addArrowLine(slide, x+0.30, flowY+0.79, 1.54, 0, j.color, { transparency:44, width:0.34 });
    addText(slide, j.title, { x:x-0.24, y:flowY+1.12, w:0.72, h:0.14, fontSize:8.6, bold:true, color:C.text, align:'center', fit:'shrink' });
    addText(slide, j.metric.value || '—', { x:x-0.34, y:flowY+1.52, w:0.92, h:0.16, fontSize:11.0, bold:true, color:j.color, align:'center', fit:'shrink' });
  });

  const queue = { x:4.02, y:4.64, w:6.70, h:0.62 };
  addRect(slide, queue.x, queue.y, queue.w, queue.h, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
  [
    ['WAIT', wait],
    ['SATISFACTION', satisfaction],
    ['CLOSURE', closure]
  ].forEach((row,i)=>{
    const x = queue.x + 0.28 + i*2.04;
    const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addLabel(slide, row[0], { x, y:queue.y+0.16, w:0.90, h:0.08, fontSize:4.8, color, charSpace:0.4 });
    addRect(slide, x, queue.y+0.40, 1.36, 0.045, C.line, C.line, { line:{color:C.line, transparency:100} });
    addRect(slide, x, queue.y+0.40, metricPctWidth(row[1].value, 1.36, i===0?0.42:0.76), 0.045, color, color, { line:{color, transparency:100} });
  });
  addText(slide, s.note || '患者指标页要能回到服务触点、责任动作和质量复盘。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function retailMemberGrowthBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'MEMBER GROWTH BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '会员增长指标', { x:0.84, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把复购、客单和门店转化放进会员经营节奏，而不是只展示数字。';
  addText(slide, claim, { x:0.86, y:1.54, w:6.8, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const metrics = (s.metrics || []).slice(0,4);
  const repurchase = findMetric(metrics, /复购|repeat|retention/i, 0);
  const basket = findMetric(metrics, /客单|AOV|basket|order/i, 1);
  const conversion = findMetric(metrics, /转化|conversion|门店/i, 2);
  const band = { x:0.92, y:2.16, w:10.42, h:3.62 };
  addRect(slide, band.x, band.y, band.w, band.h, C.paper || 'FFF7F0', C.line, {
    fill:{color:C.paper || 'FFF7F0', transparency:6},
    line:{color:C.line, transparency:100}
  });
  addRect(slide, band.x, band.y, 10.42, 0.12, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });

  const hero = { x:1.18, y:2.50, w:2.42, h:2.94 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'LOYALTY SIGNAL', { x:hero.x+0.28, y:hero.y+0.30, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, repurchase.label || '复购率', { x:hero.x+0.28, y:hero.y+0.78, w:1.20, h:0.15, fontSize:8.6, bold:true, color:'CBD5E1', fit:'shrink' });
  addNumber(slide, repurchase.value || '—', { x:hero.x+0.26, y:hero.y+1.12, w:1.90, h:0.54, fontSize:36, color:C.white, fit:'shrink' });
  addText(slide, formatMetricDelta(repurchase.delta || repurchase.unit), { x:hero.x+0.30, y:hero.y+1.88, w:1.36, h:0.12, fontSize:6.8, bold:true, color:C.accent, fit:'shrink' });
  addHairline(slide, hero.x+0.28, hero.y+2.24, 0.86, C.accent, 0, 0.54);
  addText(slide, repurchase.note || '用会员触达、商品组合和门店体验解释复购变化。', { x:hero.x+0.28, y:hero.y+2.52, w:1.72, h:0.28, fontSize:6.8, color:C.captionOnImage, fit:'shrink', breakLine:true });

  const cohort = { x:4.08, y:2.48, w:3.34, h:2.76 };
  addLabel(slide, 'COHORT / PRODUCT STORY', { x:cohort.x, y:cohort.y, w:1.68, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
  [
    ['NEW', '新客入会', C.accent],
    ['ACTIVE', '活跃会员', C.cyan],
    ['VIP', '高价值会员', C.violet]
  ].forEach((row,i)=>{
    const y = cohort.y + 0.52 + i*0.70;
    addRect(slide, cohort.x, y-0.05, 2.88, 0.42, i===1 ? C.ink : 'FFFFFF', C.line, {
      fill:{color:i===1 ? C.ink : 'FFFFFF', transparency:i===1 ? 0 : 0},
      line:{color:i===1 ? C.ink : C.line, transparency:i===1 ? 100 : 18, width:0.34}
    });
    addLabel(slide, row[0], { x:cohort.x+0.18, y:y+0.08, w:0.60, h:0.08, fontSize:6.8, color:row[2], charSpace:0.2 });
    addText(slide, row[1], { x:cohort.x+0.94, y:y+0.06, w:1.04, h:0.13, fontSize:8.9, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
    addRect(slide, cohort.x+2.10, y+0.10, 0.58, 0.045, C.line, C.line, { line:{color:C.line, transparency:100} });
    addRect(slide, cohort.x+2.10, y+0.10, [0.34,0.48,0.54][i], 0.045, row[2], row[2], { line:{color:row[2], transparency:100} });
  });

  const right = { x:7.72, y:2.50, w:3.08, h:2.94 };
  [basket, conversion].forEach((m,i)=>{
    const y = right.y + i*1.18;
    const color = i===0 ? C.cyan : C.violet;
    addRect(slide, right.x, y-0.02, 2.62, 0.84, 'FFFFFF', C.line, { fill:{color:'FFFFFF', transparency:0}, line:{color:C.line, transparency:18, width:0.34} });
    addLabel(slide, i===0 ? 'BASKET' : 'STORE CONVERSION', { x:right.x+0.18, y:y+0.18, w:1.34, h:0.09, fontSize:6.8, color, charSpace:0.4 });
    addText(slide, m.label || (i===0 ? '客单价' : '门店转化'), { x:right.x+0.18, y:y+0.44, w:1.12, h:0.13, fontSize:8.9, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, m.value || '—', { x:right.x+1.60, y:y+0.34, w:0.76, h:0.18, fontSize:13.6, color, align:'right', fit:'shrink' });
  });
  addText(slide, s.note || '零售指标页应把数字解释为会员分层、商品组合和门店动作的结果。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function saasAdoptionRevenueBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'ADOPTION / REVENUE BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '增长指标进入复盘区间', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把 NRR、激活率和集成深度放在同一条产品采用链路上。';
  addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const metrics = (s.metrics || []).slice(0,4);
  const nrr = findMetric(metrics, /NRR|净收入|收入|revenue/i, 0);
  const activation = findMetric(metrics, /激活|activate|activation/i, 1);
  const integration = findMetric(metrics, /集成|integration|嵌入/i, 2);
  const board = { x:0.92, y:2.08, w:10.86, h:3.94 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

  const path = { x:1.24, y:2.62, w:9.72, h:1.62 };
  addLabel(slide, 'CUSTOMER ADOPTION PATH', { x:path.x, y:path.y-0.20, w:1.70, h:0.10, fontSize:6.4, color:C.accent, charSpace:0.6 });
  [
    { title:'激活', metric:activation, color:C.accent },
    { title:'集成', metric:integration, color:C.cyan },
    { title:'扩展', metric:nrr, color:C.violet }
  ].forEach((step,i)=>{
    const x = path.x + i*3.24;
    addRect(slide, x, path.y+0.18, 2.38, 0.92, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
      fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1?0:8},
      line:{color:i===1?step.color:C.line, transparency:i===1?20:16, width:0.38}
    });
    addText(slide, step.title, { x:x+0.28, y:path.y+0.46, w:0.78, h:0.13, fontSize:9.4, bold:true, color:i===1?C.white:C.text, align:'center', fit:'shrink' });
    addText(slide, step.metric.value || '—', { x:x+1.38, y:path.y+0.42, w:0.68, h:0.16, fontSize:10.2, bold:true, color:step.color, align:'right', fit:'shrink' });
    if (i < 2) addArrowLine(slide, x+2.52, path.y+0.64, 0.46, 0, step.color, { transparency:34, width:0.34 });
  });
  const revenue = { x:1.24, y:4.62, w:9.72, h:0.86 };
  addRect(slide, revenue.x, revenue.y, revenue.w, revenue.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'REVENUE QUALITY', { x:revenue.x+0.28, y:revenue.y+0.18, w:1.18, h:0.09, fontSize:6.2, color:C.accent, charSpace:0.5 });
  addText(slide, nrr.label || 'NRR', { x:revenue.x+1.82, y:revenue.y+0.18, w:0.74, h:0.13, fontSize:8.9, bold:true, color:'CBD5E1', fit:'shrink' });
  addNumber(slide, nrr.value || '—', { x:revenue.x+2.70, y:revenue.y+0.10, w:1.08, h:0.28, fontSize:18.8, color:C.accent, fit:'shrink' });
  addText(slide, nrr.note || '扩展收入和留存改善共同解释增长质量。', { x:revenue.x+4.40, y:revenue.y+0.26, w:3.66, h:0.14, fontSize:8.9, color:C.white, fit:'shrink' });
  addHairline(slide, revenue.x+8.42, revenue.y+0.42, 0.70, C.accent, 0, 0.52);
  addText(slide, s.note || 'SaaS 指标页要把产品采用、企业集成和扩展收入连起来看。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function metricComparison(slide, plan, s, idx) {
  const variant = variantOf(s, '');
  if (variant === 'oee-board' || (plan.industry === 'manufacturing-operations' && /OEE|产线|產線|稼动|停机|MTTR|维修效率/i.test(`${s.title || ''} ${s.claim || ''} ${s.note || ''}`))) {
    return manufacturingOeeBoard(slide, plan, s, idx);
  }
  if (variant === 'patient-service-scorecard' || plan.industry === 'healthcare-operations') return healthcareServiceScorecard(slide, plan, s, idx);
  if (variant === 'member-growth-board' || plan.industry === 'brand-retail') return retailMemberGrowthBoard(slide, plan, s, idx);
  if (variant === 'adoption-revenue-board' || plan.industry === 'saas-technology') return saasAdoptionRevenueBoard(slide, plan, s, idx);
  if (plan.industry === 'finance-investment') return financeMetricDashboard(slide, plan, s, idx);
  lightCanvas(slide);
  sectionKicker(slide, 'PERFORMANCE SIGNAL', 0.86, 0.72, false);
  addText(slide, s.title || '关键指标变化', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || s.intro || '以少量核心指标判断增长质量，并把变化原因收束到下一步经营动作。';
  addText(slide, claim, { x:0.86, y:1.54, w:6.8, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const metrics = (s.metrics || []).slice(0,4);
  const big = metrics[0] || {};
  const side = metrics.slice(1,3);
  const panel = { x:0.92, y:2.12, w:11.28, h:3.72 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, panelFill(), C.line, {
    fill:{color:panelFill(), transparency:0},
    line:{color:C.line, transparency:14, width:0.55}
  });
  addRect(slide, panel.x, panel.y, 0.06, panel.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });

  addLabel(slide, 'PRIMARY KPI', { x:1.34, y:2.50, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.9 });
  addText(slide, big.label || '核心指标', { x:1.34, y:2.82, w:2.20, h:0.20, fontSize:11.2, bold:true, color:C.text, fit:'shrink' });
  addNumber(slide, big.value || '—', { x:1.30, y:3.18, w:2.72, h:0.86, fontSize:50, color:C.accent, fit:'shrink' });
  const bigDelta = formatMetricDelta(big.delta || big.unit);
  if (bigDelta) {
    addRect(slide, 1.36, 4.18, 1.70, 0.28, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addText(slide, bigDelta, { x:1.50, y:4.25, w:1.42, h:0.11, fontSize:7.0, bold:true, color:C.onAccent || C.white, fit:'shrink' });
  }
  addText(slide, big.note || '核心增长信号已经形成，需要继续验证触达、组合与成交之间的贡献关系。', {
    x:1.36, y:4.74, w:3.00, h:0.42, fontSize:8.8, color:C.body, breakLine:true, fit:'shrink'
  });

  slide.addShape('line', { x:4.78, y:2.54, w:0, h:2.70, line:{color:C.line, transparency:10, width:0.55} });
  side.forEach((m,i)=>{
    const x = 5.28 + i*3.10;
    const accent = i === 0 ? C.cyan : C.tertiary || C.violet;
    addLabel(slide, `SUPPORT 0${i+1}`, { x, y:2.54, w:1.10, h:0.10, fontSize:5.8, color:accent, charSpace:0.9 });
    addText(slide, m.label || `指标 ${i+2}`, { x, y:2.86, w:1.72, h:0.17, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, m.value || '—', { x, y:3.22, w:1.74, h:0.42, fontSize:28, color:accent, fit:'shrink' });
    const delta = formatMetricDelta(m.delta || m.unit);
    if (delta) addText(slide, delta, { x, y:3.92, w:1.58, h:0.13, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
    addText(slide, m.note || '', { x, y:4.36, w:2.04, h:0.30, fontSize:7.8, color:C.body, breakLine:true, fit:'shrink' });
    addRect(slide, x, 5.18, 1.84, 0.04, C.line, C.line, { line:{color:C.line, transparency:100} });
    addRect(slide, x, 5.18, i === 0 ? 0.94 : 1.20, 0.04, accent, accent, { line:{color:accent, transparency:100} });
  });

  const foot = s.note || '复购率是当前最明确的增长信号，建议优先追踪会员触达、商品组合与门店转化之间的联动贡献。';
  addHairline(slide, 0.94, 6.28, 10.90, C.line, 12, 0.55);
  addLabel(slide, 'MANAGEMENT SIGNAL', { x:0.96, y:6.54, w:1.52, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, foot, { x:2.52, y:6.50, w:7.75, h:0.15, fontSize:8.4, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function strategyMap(slide, plan, s, idx) {
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
  addText(slide, s.note || '战略地图页用于说明价值如何流动，并把投入、动作与结果放在同一套经营链路中。', { x:0.96, y:6.54, w:8.90, h:0.13, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function manifestoSlide(slide, plan, s, idx) {
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

function chapterItems(s) {
  const raw = s.items || s.agenda || s.sections || [];
  return (Array.isArray(raw) ? raw : []).map(v => typeof v === 'string' ? { title:v } : v).filter(Boolean);
}

function chapterHeroDivider(slide, plan, s, idx) {
  stageCanvas(slide, { field:true });
  const chapter = s.chapter || String(idx).padStart(2, '0');
  addLabel(slide, 'CHAPTER', { x:0.86, y:0.94, w:1.38, h:0.14, fontSize:8.2, color:C.darkMuted, charSpace:0.8 });
  addText(slide, chapter, { x:0.82, y:1.54, w:2.10, h:0.70, fontSize:50, bold:true, color:C.accent, fit:'shrink' });
  addText(slide, s.title || '章节标题', { x:3.22, y:1.76, w:6.90, h:0.55, fontSize:29.5, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:3.26, y:2.62, w:5.90, h:0.25, fontSize:11.2, color:C.captionOnImage, fit:'shrink' });
  addHairline(slide, 3.26, 3.18, 0.92, C.accent, 0, 0.72);
  const items = chapterItems(s).slice(0,3);
  items.forEach((it,i)=>{
    const y = 4.22 + i*0.64;
    addNumber(slide, String(i+1).padStart(2,'0'), { x:3.30, y:y-0.01, w:0.48, h:0.18, fontSize:11.8, color:i===0?C.accent:C.cyan });
    addText(slide, itemTitle(it), { x:3.96, y:y-0.05, w:4.70, h:0.22, fontSize:15.0, bold:true, color:C.white, fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function chapterManufacturingLineAgenda(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  const chapter = s.chapter || String(idx).padStart(2, '0');
  addDarkBreathingCircle(slide, 8.40, 0.70, 4.10, 2.24, C.accent);
  addLabel(slide, s.label || 'LINE OPERATING PATH', { x:0.84, y:0.82, w:1.84, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.05 });
  addText(slide, s.title || '从关键产线开始建立闭环', { x:0.82, y:1.24, w:5.90, h:0.46, fontSize:25.0, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.subtitle || s.claim || '先用一条产线跑通对象、工单、指标和复盘，再扩展到多车间协同。', { x:0.84, y:1.82, w:6.10, h:0.20, fontSize:9.8, color:C.captionOnImage, fit:'shrink' });
  addNumber(slide, chapter, { x:10.82, y:0.92, w:0.72, h:0.28, fontSize:19.0, color:C.accent, align:'right', fit:'shrink' });

  const items = chapterItems(s);
  const list = (items.length ? items : [
    { title:'现场状态', body:'设备、报警和点检先进入事实表。' },
    { title:'维修闭环', body:'报修、派工、处置和验收可追踪。' },
    { title:'OEE 复盘', body:'把停机影响回写到策略更新。' }
  ]).slice(0, 4);
  const cardW = 2.16;
  const cardMargin = 0.86;
  const rail = { x:cardMargin + cardW/2, y:3.36, w:W - (cardMargin + cardW/2) * 2 };
  addHairline(slide, rail.x, rail.y, rail.w, '334155', 20, 0.54);
  list.forEach((it,i)=>{
    const step = list.length > 1 ? rail.w / (list.length - 1) : 0;
    const x = rail.x + i * step;
    const cardX = Math.min(Math.max(x - cardW/2, cardMargin), W - cardMargin - cardW);
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    slide.addShape('ellipse', { x:x-0.12, y:rail.y-0.12, w:0.24, h:0.24, fill:{color:accent}, line:{color:accent, transparency:100} });
    if (i < list.length - 1) addArrowLine(slide, x+0.30, rail.y, Math.max(0.1, step-0.60), 0, accent, { transparency:36, width:0.36 });
    addRect(slide, cardX, 4.18, cardW, 1.02, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?20:42}, line:{color:i===0?accent:'334155', transparency:i===0?22:58, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:cardX+0.24, y:4.48, w:0.30, h:0.10, fontSize:6.4, color:accent });
    addText(slide, itemTitle(it, `节点 ${i+1}`), { x:cardX+0.62, y:4.42, w:0.96, h:0.14, fontSize:9.0, bold:true, color:C.white, fit:'shrink', align:'center' });
    addText(slide, itemBody(it), { x:cardX+0.32, y:4.78, w:1.52, h:0.16, fontSize:6.6, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'center' });
  });
  addRect(slide, 0.92, 5.88, 9.92, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:26}, line:{color:'334155', transparency:64, width:0.32} });
  addLabel(slide, 'OPERATING LOOP', { x:1.14, y:5.99, w:1.06, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.72 });
  addText(slide, s.note || '第二页先交代产线运营路径，后续页面再展开产品包、拓扑、闭环和证据。', { x:2.46, y:5.98, w:7.24, h:0.11, fontSize:7.4, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function chapterSaasAdoptionAgenda(slide, plan, s, idx) {
  lightCanvas(slide);
  const chapter = s.chapter || String(idx).padStart(2, '0');
  sectionKicker(slide, s.label || 'ADOPTION PATH', 0.86, 0.72, false);
  addText(slide, s.title || '平台增长与客户采用', { x:0.84, y:1.06, w:5.80, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.subtitle || s.claim || '把产品能力、客户采用和商业结果放在同一条采用路径上。', { x:0.86, y:1.52, w:6.30, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  addText(slide, chapter, { x:9.92, y:0.92, w:1.32, h:0.46, fontSize:32, bold:true, color:C.softBlue || 'E9F2FA', align:'right', fit:'shrink' });

  const items = chapterItems(s);
  const list = (items.length ? items : [
    { title:'平台能力', body:'模块、集成、数据。' },
    { title:'客户采用', body:'激活、留存、扩展。' },
    { title:'商业结果', body:'ARR、NRR、毛利。' }
  ]).slice(0, 4);
  const stage = { x:0.92, y:2.18, w:10.64, h:3.64 };
  addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
  const x0 = stage.x + 0.58;
  const gap = (stage.w - 1.16) / Math.max(1, list.length);
  list.forEach((it,i)=>{
    const x = x0 + i*gap;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, stage.y+0.86, Math.min(2.20, gap-0.22), 1.36, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
      fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1 ? 0 : 10},
      line:{color:i===1 ? accent : C.line, transparency:i===1 ? 22 : 16, width:0.42}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:stage.y+1.18, w:0.30, h:0.10, fontSize:6.6, color:accent });
    addText(slide, itemTitle(it, `路径 ${i+1}`), { x:x+0.62, y:stage.y+1.10, w:1.02, h:0.15, fontSize:9.2, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+0.24, y:stage.y+1.58, w:1.50, h:0.18, fontSize:7.2, color:i===1 ? 'CBD5E1' : C.body, fit:'shrink', breakLine:true });
    if (i < list.length - 1) addArrowLine(slide, x + Math.min(2.20, gap-0.22) + 0.12, stage.y+1.54, Math.max(0.18, gap - Math.min(2.20, gap-0.22) - 0.46), 0, accent, { transparency:38, width:0.36 });
  });
  addRect(slide, stage.x+0.44, stage.y+2.76, stage.w-0.88, 0.36, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
  addText(slide, s.note || '第二页先建立采用路径，后续再展开信息板、能力地图、增长指标和 closing。', { x:stage.x+0.66, y:stage.y+2.84, w:stage.w-1.32, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function chapterBoardBriefing(slide, plan, s, idx) {
  lightCanvas(slide);
  const chapter = s.chapter || String(idx).padStart(2, '0');
  sectionKicker(slide, s.label || 'BOARD BRIEFING', 0.86, 0.72, false);
  addText(slide, s.title || '董事会汇报重点', { x:0.84, y:1.06, w:6.20, h:0.40, fontSize:24.2, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.subtitle || s.claim || '先明确审议事项、判断依据和下一步投入边界。', { x:0.86, y:1.56, w:6.70, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const items = chapterItems(s);
  const list = (items.length ? items : [
    { title:'关键判断', body:'本轮需要形成的管理层共识。' },
    { title:'风险约束', body:'需要被董事会看见的边界条件。' },
    { title:'资源投入', body:'下一阶段投入、节奏和责任。' }
  ]).slice(0, 4);
  const memo = { x:0.92, y:2.14, w:10.64, h:1.28 };
  addRect(slide, memo.x, memo.y, memo.w, memo.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'MEETING MEMO', { x:memo.x+0.30, y:memo.y+0.30, w:1.14, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
  addText(slide, chapter, { x:memo.x+1.72, y:memo.y+0.30, w:0.60, h:0.24, fontSize:16, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreTitle || '审议路径', { x:memo.x+2.76, y:memo.y+0.28, w:1.34, h:0.16, fontSize:10.6, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || s.note || '第二页用于建立董事会阅读顺序，先判断，再看证据，最后落到资源和责任。', {
    x:memo.x+4.56, y:memo.y+0.28, w:4.88, h:0.18, fontSize:8.8, color:C.captionOnImage, fit:'shrink'
  });
  addHairline(slide, memo.x+9.74, memo.y+0.62, 0.58, C.accent, 0, 0.54);

  const board = { x:0.92, y:4.02, w:10.64, h:1.84 };
  addLabel(slide, 'DECISION SEQUENCE', { x:board.x, y:3.62, w:1.48, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
  list.forEach((it,i)=>{
    const x = board.x + i*2.72;
    const w = i === 3 ? 2.18 : 2.36;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addRect(slide, x, board.y, w, board.h, i===0 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
      fill:{color:i===0 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:i===0?8:0},
      line:{color:i===0?accent:C.line, transparency:i===0?22:18, width:0.38}
    });
    addRect(slide, x, board.y, w, 0.04, accent, accent, { line:{color:accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:board.y+0.34, w:0.32, h:0.10, fontSize:6.8, color:accent });
    addText(slide, itemTitle(it, `议题 ${i+1}`), { x:x+0.22, y:board.y+0.72, w:1.34, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+0.22, y:board.y+1.16, w:1.66, h:0.20, fontSize:8.2, color:C.body, fit:'shrink', breakLine:true });
    if (i < list.length - 1) addArrowLine(slide, x+w+0.10, board.y+0.92, 0.22, 0, accent, { transparency:34, width:0.32 });
  });
  addText(slide, s.note || '适合董事会、管理层审议和决策型材料，第二页先给出阅读顺序和决策口径。', { x:0.94, y:6.34, w:8.90, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function chapterAgendaBoard(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  const chapter = s.chapter || String(idx).padStart(2, '0');
  addDarkBreathingCircle(slide, 8.52, 0.28, 4.38, 2.42, C.accent);
  addLabel(slide, s.label || 'MEETING AGENDA', { x:0.86, y:0.90, w:1.64, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.0 });
  addText(slide, s.title || '议题与判断框架', { x:0.84, y:1.52, w:6.10, h:0.52, fontSize:28.0, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.subtitle || s.claim || '先明确本章讨论顺序，再进入证据与决策。', { x:0.86, y:2.36, w:5.70, h:0.22, fontSize:10.2, color:C.captionOnImage, fit:'shrink' });
  addHairline(slide, 0.88, 2.94, 0.92, C.accent, 0, 0.72);
  addText(slide, chapter, { x:10.42, y:1.06, w:1.10, h:0.50, fontSize:36, bold:true, color:C.accent, align:'right', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  const items = chapterItems(s).slice(0,4);
  const list = (items.length ? items : [{title:'背景判断'}, {title:'证据复盘'}, {title:'配置选择'}]).slice(0,3);
  addLabel(slide, 'DISCUSSION SEQUENCE', { x:0.92, y:3.78, w:1.64, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
  list.forEach((it,i)=>{
    const x = 0.92 + i*3.48;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addRect(slide, x, 4.24, 2.92, 1.24, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?22:42}, line:{color:i===0?accent:'334155', transparency:i===0?24:62, width:0.44} });
    addRect(slide, x, 4.24, 2.92, 0.04, accent, accent, { line:{color:accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.58, w:0.34, h:0.12, fontSize:7.0, color:accent });
    addText(slide, itemTitle(it, `议题 ${i+1}`), { x:x+0.72, y:4.52, w:1.42, h:0.16, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+0.24, y:4.96, w:2.20, h:0.20, fontSize:8.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addText(slide, s.note || '议题板用于金融、投委会和决策类材料，先组织讨论顺序，再进入证明对象。', { x:0.94, y:6.18, w:7.40, h:0.14, fontSize:8.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function chapterPathwayMap(slide, plan, s, idx) {
  lightCanvas(slide);
  const chapter = s.chapter || String(idx).padStart(2, '0');
  sectionKicker(slide, s.label || 'SERVICE PATH', 0.86, 0.72, false);
  addText(slide, s.title || '路径与关键议题', { x:0.84, y:1.06, w:5.80, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.subtitle || s.claim || '把本章内容组织成可跟随的路径，而不是普通目录。', { x:0.86, y:1.52, w:6.20, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addText(slide, chapter, { x:10.10, y:0.98, w:1.28, h:0.48, fontSize:36, bold:true, color:C.softBlue || 'E9F2FA', align:'right', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const items = chapterItems(s).slice(0,5);
  const list = items.length ? items : [{title:'触点'}, {title:'资源'}, {title:'质量'}];
  addRect(slide, 0.92, 2.20, 10.84, 3.70, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  const startX = 1.42;
  const y = 3.72;
  const step = list.length > 1 ? 9.10 / (list.length - 1) : 0;
  addHairline(slide, startX, y, Math.max(0.1, step*(list.length-1)), C.line, 8, 0.70);
  list.forEach((it,i)=>{
    const x = startX + i*step;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    slide.addShape('ellipse', { x:x-0.12, y:y-0.12, w:0.24, h:0.24, fill:{color:accent}, line:{color:accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x-0.24, y:y-0.58, w:0.48, h:0.12, fontSize:7.0, color:accent, align:'center' });
    addText(slide, itemTitle(it, `阶段 ${i+1}`), { x:x-0.66, y:y+0.42, w:1.32, h:0.16, fontSize:10.2, bold:true, color:C.text, fit:'shrink', align:'center' });
    if (itemBody(it)) addText(slide, itemBody(it), { x:x-0.80, y:y+0.78, w:1.60, h:0.20, fontSize:7.6, color:C.body, fit:'shrink', align:'center' });
    if (i < list.length - 1) slide.addShape('line', { x:x+0.34, y, w:step-0.68, h:0, line:{color:accent, transparency:34, width:0.36, endArrowType:'triangle'} });
  });
  addText(slide, s.note || '路径型第二页适合医疗、服务运营和强流程材料，用来建立读者跟随顺序。', { x:0.94, y:6.38, w:8.80, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function chapterEditorialAgenda(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  const chapter = s.chapter || String(idx).padStart(2, '0');
  const images = galleryImages(plan, s);
  if (images[0]) addPhotoPanel(slide, images[0], 7.34, 0.82, 4.56, 5.60, { tone:'dark', transparency:40, stroke:'334155', strokeTransparency:72, fit:'cover' });
  else addDarkBreathingCircle(slide, 8.34, 0.78, 4.16, 2.36, C.accent);
  addLabel(slide, s.label || 'EDITORIAL AGENDA', { x:0.86, y:0.94, w:1.64, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.0 });
  addText(slide, chapter, { x:0.82, y:1.42, w:1.56, h:0.56, fontSize:40, bold:true, color:C.accent, fit:'shrink' });
  addText(slide, s.title || '章节标题', { x:0.86, y:2.18, w:5.60, h:0.70, fontSize:29.0, bold:true, color:C.white, fit:'shrink', breakLine:true });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.90, y:3.20, w:4.80, h:0.22, fontSize:10.6, color:C.captionOnImage, fit:'shrink' });
  addHairline(slide, 0.90, 3.78, 0.82, C.accent, 0, 0.72);
  chapterItems(s).slice(0,3).forEach((it,i)=>{
    const y = 4.68 + i*0.46;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:0.92, y, w:0.30, h:0.10, fontSize:6.8, color:accent });
    addText(slide, itemTitle(it), { x:1.42, y:y-0.04, w:2.42, h:0.16, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    if (itemBody(it)) addText(slide, itemBody(it), { x:4.10, y:y-0.04, w:1.66, h:0.14, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function chapterDivider(slide, plan, s, idx) {
  const variant = variantOf(s, 'chapter-hero');
  if (variant === 'agenda-board') return chapterAgendaBoard(slide, plan, s, idx);
  if (variant === 'board-briefing') return chapterBoardBriefing(slide, plan, s, idx);
  if (variant === 'pathway-map' || variant === 'service-path') return chapterPathwayMap(slide, plan, s, idx);
  if (variant === 'editorial-agenda' || variant === 'image-agenda') return chapterEditorialAgenda(slide, plan, s, idx);
  if (variant === 'line-agenda' || variant === 'manufacturing-line') return chapterManufacturingLineAgenda(slide, plan, s, idx);
  if (variant === 'adoption-agenda' || variant === 'saas-adoption') return chapterSaasAdoptionAgenda(slide, plan, s, idx);
  return chapterHeroDivider(slide, plan, s, idx);
}

function comparisonSlide(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'COMPARISON', 0.86, 0.72, false);
  addText(slide, s.title || '对比分析', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.4, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const columns = (s.columns || [
    { title:s.leftTitle || '当前状态', body:(s.left || []).join(' / ') },
    { title:s.rightTitle || '升级后', body:(s.right || []).join(' / ') }
  ]).slice(0,2);
  const left = columns[0] || {};
  const right = columns[1] || {};
  const leftItems = Array.isArray(left.items) ? left.items : String(left.body || '').split(/[、/；;。]/).filter(Boolean).slice(0,3);
  const rightItems = Array.isArray(right.items) ? right.items : String(right.body || '').split(/[、/；;。]/).filter(Boolean).slice(0,3);
  const rows = Math.max(leftItems.length, rightItems.length, 3);
  const panel = { x:0.92, y:2.08, w:10.82, h:3.88 };
  addRect(slide, panel.x, panel.y, panel.w, panel.h, panelFill(), C.line, {
    fill:{color:panelFill(), transparency:0},
    line:{color:C.line, transparency:14, width:0.55}
  });
  addRect(slide, 7.66, panel.y, 0.06, panel.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
  addLabel(slide, 'CURRENT EXPERIENCE', { x:1.26, y:2.42, w:1.75, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
  addLabel(slide, 'TARGET EXPERIENCE', { x:8.08, y:2.42, w:1.70, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, left.title || '升级前', { x:1.26, y:2.76, w:2.20, h:0.22, fontSize:15.0, bold:true, color:C.text, fit:'shrink' });
  addText(slide, right.title || '升级后', { x:8.08, y:2.76, w:2.20, h:0.22, fontSize:15.0, bold:true, color:C.text, fit:'shrink' });
  addText(slide, 'FROM', { x:4.54, y:2.74, w:0.48, h:0.10, fontSize:5.6, color:C.muted, charSpace:0.8, fontFace:profileFont('latin') });
  slide.addShape('line', { x:5.10, y:2.80, w:1.58, h:0, line:{color:C.accent, transparency:8, width:0.62, endArrowType:'triangle'} });
  addText(slide, 'TO', { x:6.84, y:2.74, w:0.28, h:0.10, fontSize:5.6, color:C.accent, charSpace:0.8, fontFace:profileFont('latin') });

  for (let i=0; i<rows; i++) {
    const y = 3.36 + i*0.62;
    const l = typeof leftItems[i] === 'string' ? leftItems[i] : ((leftItems[i] || {}).title || '');
    const r = typeof rightItems[i] === 'string' ? rightItems[i] : ((rightItems[i] || {}).title || '');
    addHairline(slide, 1.26, y-0.17, 9.70, C.line, 16, 0.45);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:1.26, y:y-0.04, w:0.34, h:0.12, fontSize:7.2, color:i===0?C.accent:C.muted });
    addText(slide, l, { x:1.82, y:y-0.07, w:2.62, h:0.17, fontSize:9.4, color:C.body, fit:'shrink' });
    slide.addShape('line', { x:4.82, y:y+0.02, w:1.62, h:0, line:{color:C.line, transparency:2, width:0.48, endArrowType:'triangle'} });
    slide.addShape('ellipse', { x:6.72, y:y-0.035, w:0.10, h:0.10, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
    addText(slide, r, { x:8.08, y:y-0.07, w:2.62, h:0.17, fontSize:9.6, bold:i===0, color:C.text, fit:'shrink' });
  }
  addText(slide, s.note || '对比页优先表达“经营方式如何改变”，让升级前后的动作、体验和复盘口径保持同构。', { x:0.96, y:6.44, w:8.8, h:0.14, fontSize:8.2, color:C.muted, fit:'shrink' });
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
  addText(slide, s.tagline || '证明页用于建立投委会信任，而不是普通公司简介。', {
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
  addText(slide, s.note || '证明页优先呈现时间、规模、项目数量、退出和复盘机制。', {
    x:grid.x+0.24, y:6.44, w:4.46, h:0.10, fontSize:6.8, color:C.darkMuted || '94A3B8', fit:'shrink'
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function profileProof(slide, plan, s, idx) {
  if (plan.industry === 'finance-investment') return financeProfileProof(slide, plan, s, idx);
  lightCanvas(slide);
  sectionKicker(slide, 'PROFILE PROOF', 0.86, 0.72, false);
  addText(slide, s.title || '公司与能力证明', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const metrics = (s.metrics || []).slice(0,4);
  addRect(slide, 0.92, 2.10, 3.18, 3.72, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'IDENTITY', { x:1.20, y:2.44, w:1.0, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.company || plan.organization || '组织名称', { x:1.20, y:2.90, w:2.12, h:0.36, fontSize:18.8, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.description || s.body || '用可验证的业务事实建立可信度，而不是堆满公司介绍文字。', { x:1.20, y:3.58, w:2.30, h:0.70, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  addHairline(slide, 1.20, 4.72, 0.86, C.accent, 0, 0.72);
  addText(slide, s.tagline || '以可验证经验建立决策信任', { x:1.20, y:5.05, w:2.12, h:0.14, fontSize:7.4, color:C.darkMuted, fit:'shrink' });
  const proofDesign = designForSlide(plan, s, 'situation');
  const hasProofImage = proofDesign.imagePath && fs.existsSync(proofDesign.imagePath);
  const proofIsPortrait = hasProofImage && imageAspect(proofDesign.imagePath) < 0.9;
  if (hasProofImage) {
    if (proofIsPortrait) {
      addPhotoPanel(slide, proofDesign.imagePath, 9.10, 2.08, 2.36, 3.74, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
      addRect(slide, 9.10, 5.18, 2.36, 0.64, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
      addLabel(slide, 'BRAND PROOF', { x:9.34, y:5.40, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:0.8 });
    } else {
      addPhotoPanel(slide, proofDesign.imagePath, 4.64, 1.98, 6.40, 1.44, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
      addRect(slide, 4.64, 3.06, 6.40, 0.36, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
      addLabel(slide, 'BRAND PROOF', { x:4.92, y:3.18, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:0.8 });
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
    addLabel(slide, `PROOF 0${i+1}`, { x:x+0.22, y:y+0.28, w:0.92, h:0.09, fontSize:5.4, color:accent, charSpace:0.75 });
    addNumber(slide, value, { x:x+0.22, y:y+0.48, w:cardW-0.42, h:0.28, fontSize:hasProofImage ? 21.5 : 24, color:accent, fit:'shrink' });
    addText(slide, label, { x:x+0.24, y:y+0.86, w:cardW-0.46, h:0.16, fontSize:8.2, color:C.body, fit:'shrink' });
  });
  addText(slide, s.note || '证明页优先呈现时间、规模、客户/案例数量、资质或关键能力，而不是普通简介。', { x:4.68, y:6.28, w:6.10, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
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
  addLabel(slide, 'ENERGY OPERATING LOOP', { x:4.72, y:2.28, w:1.86, h:0.10, fontSize:6.0, color:'64748B', charSpace:1.0 });
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
    addText(slide, c.body, { x:n.x+0.56, y:n.y+0.43, w:1.66, h:0.25, fontSize:7.2, color:'A8B3C3', fit:'shrink' });
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
  const axis = [
    [cx, cy-1.18], [cx+1.02, cy-0.59], [cx+1.02, cy+0.59],
    [cx, cy+1.18], [cx-1.02, cy+0.59], [cx-1.02, cy-0.59]
  ];
  [0.42,0.76,1.10].forEach((r,i)=>slide.addShape('ellipse', { x:cx-r, y:cy-r, w:r*2, h:r*2, fill:{color:C.softBlue, transparency:100}, line:{color:'D8E2EF', transparency:28+i*10, width:0.36} }));
  axis.forEach(([x,y])=>slide.addShape('line', { x:cx, y:cy, w:x-cx, h:y-cy, line:{color:'D8E2EF', transparency:70, width:0.26} }));
  const poly = [[cx,cy-0.84],[cx+0.74,cy-0.39],[cx+0.68,cy+0.48],[cx,cy+0.92],[cx-0.80,cy+0.46],[cx-0.76,cy-0.42]];
  poly.forEach(([x,y],i)=>{ const [nx,ny]=poly[(i+1)%poly.length]; slide.addShape('line', { x, y, w:nx-x, h:ny-y, line:{color:C.accent, transparency:20, width:0.62} }); });
  slide.addShape('ellipse', { x:cx-0.07, y:cy-0.07, w:0.14, h:0.14, fill:{color:'F7FAFD', transparency:0}, line:{color:C.accent, transparency:0, width:0.38} });

  const labels = [
    { x:stage.x+0.42, y:stage.y+0.58, w:2.20, h:0.62, anchor:axis[0] },
    { x:stage.x+5.18, y:stage.y+0.60, w:2.20, h:0.62, anchor:axis[1] },
    { x:stage.x+5.44, y:stage.y+2.00, w:2.12, h:0.62, anchor:axis[2] },
    { x:stage.x+4.92, y:stage.y+3.50, w:2.36, h:0.62, anchor:axis[3] },
    { x:stage.x+1.86, y:stage.y+3.52, w:2.34, h:0.62, anchor:axis[4] },
    { x:stage.x+0.40, y:stage.y+2.08, w:2.12, h:0.62, anchor:axis[5] }
  ];
  cards.slice(0,6).forEach((c,i)=>{
    const {x,y,w,h,anchor} = labels[i];
    const accent = i===0?C.accent:(i===1?C.cyan:(i===3?C.violet:C.muted));
    slide.addShape('ellipse', { x:anchor[0]-0.045, y:anchor[1]-0.045, w:0.09, h:0.09, fill:{color:accent}, line:{color:accent, transparency:100} });
    addRect(slide, x, y, w, h, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:8}, line:{color:'FFFFFF', transparency:100} });
    addText(slide, String(i+1).padStart(2,'0'), { x:x+0.02, y:y+0.02, w:0.30, h:0.10, fontSize:6.8, bold:true, color:accent });
    addText(slide, c.title, { x:x+0.38, y:y, w:w-0.42, h:0.15, fontSize:9.9, bold:true, color:C.text, fit:'shrink' });
    addText(slide, c.body, { x:x+0.38, y:y+0.27, w:w-0.42, h:0.24, fontSize:6.5, color:C.body, fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}
function energyValueSignal(slide, plan, s, idx) {
  slide.background = { color:'F7FAFD' };
  addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
  addRect(slide, 0, 0, W, 0.92, C.white, C.white, { line:{color:C.white, transparency:100} });
  addLightBreathingCircle(slide, 9.80, 0.42, 3.32, C.softCyan, 46);
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
    addPulseCurve(slide, 1.28, 3.78, 2.92, 0.42, C.cyan, true, { transparency:46, width:0.38, nodes:false });
  }
  addLabel(slide, 'PRIMARY OUTCOME', { x:1.22, y:4.70, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, lead.title, { x:1.22, y:5.02, w:2.80, h:0.22, fontSize:14.8, bold:true, color:C.white, fit:'shrink' });
  addText(slide, lead.body, { x:1.22, y:5.32, w:3.70, h:0.22, fontSize:7.9, color:'CBD5E1', fit:'shrink' });

  const signals = cards.slice(1,4);
  signals.forEach((c,i)=>{
    const y = 2.16 + i*1.12;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, 6.36, y, 5.26, 0.88, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.52} });
    addText(slide, String(i+2).padStart(2,'0'), { x:6.68, y:y+0.28, w:0.36, h:0.12, fontSize:7.2, bold:true, color:accent });
    addText(slide, c.title, { x:7.24, y:y+0.17, w:1.62, h:0.16, fontSize:12.1, bold:true, color:C.text, fit:'shrink' });
    addText(slide, c.body, { x:8.94, y:y+0.14, w:2.18, h:0.30, fontSize:8.1, color:C.body, fit:'shrink', valign:'mid' });
  });
  addRect(slide, 6.36, 5.72, 5.26, 0.52, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addPulseCurve(slide, 6.68, 5.86, 2.24, 0.20, C.cyan, true, { transparency:24, width:0.34, nodes:false });
  addText(slide, s.note || '收益测算需结合站点发电量、电价规则、历史告警和运行数据进一步校准。', { x:9.22, y:5.88, w:1.84, h:0.12, fontSize:6.4, color:'CBD5E1', fit:'shrink' });
  addEnergyFooter(slide, plan, false);
}
function valueTiles(slide, plan, s, idx) {
  // Value Signal family: one dominant value statement with a designed evidence field.
  slide.background = { color:C.paper };
  addRect(slide, 0, 0, W, H, C.paper, C.paper);
  addRect(slide, 0, 0, W, 0.92, C.white, C.white, { line:{color:C.white, transparency:100} });
  slide.addShape('ellipse', { x:9.58, y:0.42, w:3.45, h:3.45, fill:{color:C.softBlue, transparency:50}, line:{color:C.softBlue, transparency:100} });
  sectionKicker(slide, 'VALUE SIGNAL', 0.86, 0.72, false);
  addText(slide, s.title, { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text });
  if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.7, h:0.22, fontSize:10.8, color:C.muted });
  addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });
  const cards = s.cards || [];
  const lead = cards[0] || { title:'业务价值', body:'' };
  if (!addVisualPhotoPanel(slide, plan, s, 'value', 0.88, 2.16, 5.06, 3.58, { transparency:56, stroke:C.ink, strokeTransparency:100 })) {
    addRect(slide, 0.88, 2.16, 5.06, 3.58, C.ink, C.ink, { line:{color:C.ink, transparency:100} });
  }
  addText(slide, '01', { x:1.20, y:2.55, w:0.38, h:0.16, fontSize:9, bold:true, color:C.accent });
  addText(slide, lead.title, { x:1.18, y:3.04, w:3.65, h:0.38, fontSize:22.5, bold:true, color:C.white, fit:'shrink' });
  addText(slide, lead.body, { x:1.18, y:3.86, w:3.70, h:0.66, fontSize:10.8, color:'CBD5E1', valign:'top', fit:'shrink' });
  addHairline(slide, 1.18, 4.98, 0.90, C.accent, 0, 0.75);
  addText(slide, 'MANAGEMENT OUTCOME', { x:1.18, y:5.24, w:1.62, h:0.10, fontSize:6.4, color:'64748B', charSpace:1.0 });
  cards.slice(1,4).forEach((c,i)=>{
    const y = 2.22 + i*1.18;
    const accent = i===1 ? C.cyan : C.accent;
    addText(slide, String(i+2).padStart(2,'0'), { x:6.74, y:y+0.08, w:0.36, h:0.14, fontSize:8.2, bold:true, color:accent });
    addText(slide, c.title, { x:7.30, y:y, w:3.2, h:0.22, fontSize:14.4, bold:true, color:C.text });
    addText(slide, c.body, { x:7.30, y:y+0.42, w:4.18, h:0.30, fontSize:9.2, color:C.body, fit:'shrink' });
    addHairline(slide, 7.30, y+0.95, 4.0, 'D8E2EF', 12, 0.55);
  });
  if (s.note) addText(slide, s.note, { x:0.90, y:6.52, w:9.6, h:0.18, fontSize:8.6, color:'738297' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

function caseEvidenceHero(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'CASE PROOF', 0.86, 0.72, false);
  addText(slide, s.title || '案例证据', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.intro) addText(slide, s.subtitle || s.intro, { x:0.86, y:1.52, w:6.0, h:0.20, fontSize:9.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const images = galleryImages(plan, s);
  const items = s.items || s.cards || [];
  const hero = images[0];
  if (hero) addPhotoPanel(slide, hero, 0.92, 2.02, 6.38, 3.98, { tone:'dark', transparency:100, stroke:C.line, strokeTransparency:20 });
  else genericShowcaseField(slide, 0.92, 2.02, 6.38, 3.98, 'CASE EVIDENCE');
  addRect(slide, 0.92, 5.06, 6.38, 0.94, C.ink, C.ink, { fill:{color:C.ink, transparency:10}, line:{color:C.ink, transparency:100} });
  const lead = items[0] || { title:s.case || '核心案例', body:s.claim || '以真实项目、现场或客户材料作为证据。' };
  addLabel(slide, 'PRIMARY CASE', { x:1.24, y:5.34, w:1.18, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, itemTitle(lead, '核心案例'), { x:2.70, y:5.30, w:2.00, h:0.14, fontSize:9.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, itemBody(lead), { x:4.82, y:5.30, w:1.70, h:0.13, fontSize:6.6, color:'CBD5E1', fit:'shrink' });
  const facts = (s.facts || items.slice(1)).slice(0,4);
  facts.forEach((f,i)=>{
    const y = 2.14 + i*0.90;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addRect(slide, 7.86, y, 3.54, 0.62, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:8.12, y:y+0.22, w:0.32, h:0.10, fontSize:6.6, color:accent });
    addText(slide, itemTitle(f, `证据 ${i+1}`), { x:8.60, y:y+0.14, w:1.22, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(f), { x:9.98, y:y+0.14, w:1.04, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
  });
  addText(slide, s.note || '单案例页强调一个主证据和少量可验证事实，适合客户、项目、产品落地页。', { x:7.88, y:5.88, w:3.30, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function caseEvidenceBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'EVIDENCE BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '案例证据板', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.intro) addText(slide, s.subtitle || s.intro, { x:0.86, y:1.52, w:6.0, h:0.20, fontSize:9.2, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const images = galleryImages(plan, s);
  const items = s.items || s.cards || [];
	  if (images.length === 4 && items.length <= 4) {
	    const layout = chooseEvidenceImageLayout(images, {
	      role:'evidence',
	      layout:s.galleryLayout || s.imageLayout,
	      featured: !!s.heroImage
	    });
	    if (layout === 'vertical-strip' || layout === 'screenshot-board') {
	      const photoW = layout === 'vertical-strip' ? 1.38 : 2.14;
	      const slots = [
	        { x:0.92, y:2.04, w:2.42, h:3.94 },
	        { x:3.64, y:2.04, w:2.42, h:3.94 },
	        { x:6.36, y:2.04, w:2.42, h:3.94 },
	        { x:9.08, y:2.04, w:2.42, h:3.94 }
	      ];
	      slots.forEach((slot,i)=>{
	        const item = items[i] || {};
	        const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
	        addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.44} });
	        const px = slot.x + (slot.w - photoW) / 2;
	        addSmartPhotoPanel(slide, images[i], px, slot.y+0.18, photoW, 2.34, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
	        addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.24, y:slot.y+2.82, w:0.30, h:0.10, fontSize:6.6, color:accent });
	        addText(slide, itemTitle(item, `证据 ${i+1}`), { x:slot.x+0.62, y:slot.y+2.76, w:1.14, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
	        addText(slide, itemBody(item), { x:slot.x+0.62, y:slot.y+3.20, w:1.24, h:0.20, fontSize:6.8, color:C.body, fit:'shrink', breakLine:true });
	      });
	      addText(slide, s.note || '脏素材证据页会识别竖图、截图和混合画幅，并改用稳定的证据列。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
	      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
	      return;
	    }
	    if (layout === 'mosaic-1-3') {
      const hero = { x:0.92, y:2.04, w:5.18, h:3.94 };
      const lead = items[0] || {};
      addRect(slide, hero.x, hero.y, hero.w, hero.h, panelFill(), C.accent, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:18, width:0.52} });
      addSmartPhotoPanel(slide, images[0], hero.x+0.16, hero.y+0.16, hero.w-0.32, 2.68, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
      addLabel(slide, 'PRIMARY EVIDENCE', { x:hero.x+0.28, y:hero.y+3.08, w:1.30, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
      addText(slide, itemTitle(lead, '核心证据'), { x:hero.x+0.28, y:hero.y+3.38, w:1.70, h:0.15, fontSize:10.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(lead), { x:hero.x+2.26, y:hero.y+3.34, w:2.34, h:0.18, fontSize:8.0, color:C.body, fit:'shrink' });

      images.slice(1,4).forEach((img,i)=>{
        const y = 2.04 + i*1.34;
        const item = items[i+1] || {};
        const accent = i===0 ? C.cyan : (i===1 ? C.violet : C.muted);
        addRect(slide, 6.42, y, 5.16, 1.08, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.42} });
        addSmartPhotoPanel(slide, img, 6.58, y+0.14, 1.46, 0.80, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
        addNumber(slide, String(i+2).padStart(2,'0'), { x:8.34, y:y+0.30, w:0.30, h:0.10, fontSize:6.6, color:accent });
        addText(slide, itemTitle(item, `证据 ${i+2}`), { x:8.78, y:y+0.24, w:1.22, h:0.14, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemBody(item), { x:10.16, y:y+0.24, w:0.92, h:0.18, fontSize:7.0, color:C.body, fit:'shrink', breakLine:true });
      });
      addText(slide, s.note || '四图证据页会根据素材画幅自动选择主证据 + 辅助证据，避免平均卡片化。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
      return;
    }
    const gridSlots = [
      { x:0.92, y:2.04, w:5.08, h:1.78 },
      { x:6.36, y:2.04, w:5.08, h:1.78 },
      { x:0.92, y:4.14, w:5.08, h:1.78 },
      { x:6.36, y:4.14, w:5.08, h:1.78 }
    ];
    gridSlots.forEach((slot,i)=>{
      const item = items[i] || {};
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.44} });
      addSmartPhotoPanel(slide, images[i], slot.x+0.14, slot.y+0.14, 2.06, slot.h-0.28, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+2.50, y:slot.y+0.34, w:0.30, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(item, `证据 ${i+1}`), { x:slot.x+2.90, y:slot.y+0.28, w:1.36, h:0.14, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item), { x:slot.x+2.90, y:slot.y+0.76, w:1.48, h:0.22, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true });
    });
    addText(slide, s.note || '四图证据页会根据素材画幅自动选择 2x2 或主证据 + 辅助证据。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
    return;
  }
  const slots = [
    { x:0.92, y:2.06, w:3.36, h:1.58 },
    { x:4.62, y:2.06, w:3.36, h:1.58 },
    { x:8.32, y:2.06, w:3.36, h:1.58 },
    { x:0.92, y:4.42, w:3.36, h:1.58 },
    { x:4.62, y:4.42, w:3.36, h:1.58 },
    { x:8.32, y:4.42, w:3.36, h:1.58 }
  ];
  slots.slice(0, Math.min(6, Math.max(images.length, items.length))).forEach((slot,i)=>{
    const item = items[i] || {};
    const img = images[i];
    if (img) addSmartPhotoPanel(slide, img, slot.x, slot.y, slot.w, 1.04, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
    else addRect(slide, slot.x, slot.y, slot.w, 1.04, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:6}, line:{color:C.line, transparency:100} });
    addRect(slide, slot.x, slot.y+1.04, slot.w, 0.54, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.36} });
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.22, y:slot.y+1.22, w:0.28, h:0.10, fontSize:6.4, color:accent });
    addText(slide, itemTitle(item, `证据 ${i+1}`), { x:slot.x+0.62, y:slot.y+1.16, w:1.42, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(item), { x:slot.x+2.10, y:slot.y+1.16, w:0.84, h:0.12, fontSize:6.3, color:C.body, fit:'shrink' });
  });
  addText(slide, s.note || '证据板适合图片或案例较多的材料，重点是统一裁切比例和简短 caption。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function caseComparisonSlide(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'CASE COMPARISON', 0.86, 0.72, false);
  addText(slide, s.title || '案例前后对比', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const before = typeof s.before === 'string' ? { title:'Before', image:s.before } : (s.before || {});
  const after = typeof s.after === 'string' ? { title:'After', image:s.after } : (s.after || {});
  const beforeImg = resolveAssetPath(before.image || before.img || images[0] || '');
  const afterImg = resolveAssetPath(after.image || after.img || images[1] || '');
  const panels = [
    { label: before.label || 'BEFORE', title: before.title || '改造前', body: before.body || before.note || '问题、断点或改造前状态。', image:beforeImg, x:0.92, color:C.muted },
    { label: after.label || 'AFTER', title: after.title || '改造后', body: after.body || after.note || '动作、结果或改造后状态。', image:afterImg, x:7.02, color:C.accent }
  ];
  panels.forEach((p,i)=>{
    addRect(slide, p.x, 2.02, 4.82, 3.92, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===1?p.color:C.line, transparency:i===1?18:14, width:0.50} });
    if (p.image && fs.existsSync(p.image)) addPhotoPanel(slide, p.image, p.x+0.18, 2.20, 4.46, 2.48, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:24, fit:'cover' });
    else genericShowcaseField(slide, p.x+0.18, 2.20, 4.46, 2.48, p.label);
    addLabel(slide, p.label, { x:p.x+0.28, y:4.94, w:0.90, h:0.10, fontSize:6.8, color:p.color, charSpace:0.8 });
    addText(slide, p.title, { x:p.x+0.28, y:5.22, w:1.68, h:0.15, fontSize:10.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, p.body, { x:p.x+2.18, y:5.19, w:1.94, h:0.18, fontSize:7.0, color:C.body, fit:'shrink' });
  });
  const beforePanel = { x:panels[0].x, y:2.02, w:4.82, h:3.92 };
  const afterPanel = { x:panels[1].x, y:2.02, w:4.82, h:3.92 };
  const transitionY = 3.44;
  addArrowBetweenRects(slide, beforePanel, afterPanel, 'right', C.accent, {
    gap:0.30,
    y:transitionY,
    endY:transitionY,
    transparency:8,
    width:0.50
  });
  const midX = (beforePanel.x + beforePanel.w + afterPanel.x) / 2;
  slide.addShape('ellipse', { x:midX - 0.06, y:transitionY - 0.06, w:0.12, h:0.12, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
  addLabel(slide, 'CHANGE', { x:midX - 0.44, y:transitionY+0.52, w:0.88, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8, align:'center' });

  const metrics = (s.metrics || s.facts || []).slice(0,3);
  metrics.forEach((m,i)=>{
    const x = 3.10 + i*2.04;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, x, 6.18, 1.66, 0.46, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.34} });
    addNumber(slide, m.value || m.title || String(i+1), { x:x+0.14, y:6.31, w:0.62, h:0.12, fontSize:9.0, color:accent, fit:'shrink' });
    addText(slide, m.label || m.body || '', { x:x+0.86, y:6.29, w:0.60, h:0.12, fontSize:8.8, color:C.body, fit:'shrink' });
  });
  addText(slide, s.note || '案例对比页适合改造前后、上线前后、体验升级前后，不把对比压成普通双栏。', { x:0.94, y:6.72, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function energySiteComparisonSlide(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  addDarkBreathingCircle(slide, 8.28, 0.64, 4.14, 2.28, C.violet);
  sectionKicker(slide, 'SITE BEFORE / AFTER', 0.84, 0.72, true);
  addText(slide, s.title || '站端接入前后对比', { x:0.82, y:1.06, w:6.1, h:0.36, fontSize:23.5, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.50, w:6.3, h:0.20, fontSize:9.8, color:'94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.66, y:0.72, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const before = typeof s.before === 'string' ? { title:'接入前', image:s.before } : (s.before || {});
  const after = typeof s.after === 'string' ? { title:'接入后', image:s.after } : (s.after || {});
  const panels = [
    { label:before.label || 'BEFORE', title:before.title || '接入前', body:before.body || before.note || '状态、告警和收益复盘分散。', image:resolveAssetPath(before.image || before.img || images[0] || ''), x:0.92, accent:'94A3B8' },
    { label:after.label || 'AFTER', title:after.title || '接入后', body:after.body || after.note || '站端状态、工单和收益口径统一。', image:resolveAssetPath(after.image || after.img || images[1] || ''), x:7.10, accent:C.accent }
  ];
  panels.forEach((p,i)=>{
    addRect(slide, p.x, 2.02, 4.50, 3.56, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?12:4}, line:{color:i===1?C.accent:'334155', transparency:i===1?18:44, width:0.46} });
    if (p.image && fs.existsSync(p.image)) addPhotoPanel(slide, p.image, p.x+0.18, 2.22, 4.14, 2.14, { tone:'light', transparency:88, stroke:'334155', strokeTransparency:36, fit:'cover' });
    else genericShowcaseField(slide, p.x+0.18, 2.22, 4.14, 2.14, p.label);
    addLabel(slide, p.label, { x:p.x+0.26, y:4.66, w:0.84, h:0.10, fontSize:6.0, color:p.accent, charSpace:0.85 });
    addText(slide, p.title, { x:p.x+0.26, y:4.94, w:1.22, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, p.body, { x:p.x+1.72, y:4.92, w:2.02, h:0.18, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
  });
  const midX = 6.22;
  addRect(slide, midX-0.36, 3.08, 0.72, 0.72, C.ink, C.accent, { fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:26, width:0.42} });
  addArrowLine(slide, midX-0.18, 3.44, 0.36, 0, C.accent, { transparency:8, width:0.46 });
  addLabel(slide, 'DISPATCH', { x:midX-0.44, y:4.04, w:0.88, h:0.09, fontSize:5.6, color:C.cyan, charSpace:0.65, align:'center' });

  const metrics = (s.metrics || s.facts || []).slice(0,3);
  const metricStart = 2.38;
  metrics.forEach((m,i)=>{
    const x = metricStart + i*2.18;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addText(slide, m.value || m.title || String(i+1), { x, y:6.10, w:0.76, h:0.16, fontSize:12.4, bold:true, color:accent, fit:'shrink' });
    addText(slide, m.label || m.body || '', { x:x+0.96, y:6.12, w:0.88, h:0.12, fontSize:7.8, color:'CBD5E1', fit:'shrink' });
  });
  addText(slide, s.note || '前后对比用于说明站端接入如何把告警、巡检和收益复盘接入同一套调度证据。', { x:0.94, y:6.62, w:8.9, h:0.13, fontSize:7.6, color:'94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function retailLookbookStory(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'LOOKBOOK STORY', 0.86, 0.72, false);
  addText(slide, s.title || '产品故事与门店场景', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  const intro = s.subtitle || s.intro || s.claim || '把产品、空间、搭配和会员触达组织成一组可阅读的品牌故事。';
  addText(slide, intro, { x:0.86, y:1.52, w:6.4, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const storyItems = (s.lookbook || s.productStory || s.cards || s.items || []).slice(0,3).map(v => typeof v === 'string' ? { title:v } : v);
  const hero = { x:0.92, y:2.04, w:5.38, h:4.10 };
  if (images[0]) {
    addPhotoPanel(slide, images[0], hero.x, hero.y, hero.w, hero.h, { tone:'dark', transparency:100, stroke:'E8DED8', strokeTransparency:12, fit:'cover' });
  } else {
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLightBreathingCircle(slide, hero.x+3.20, hero.y+0.40, 1.92, C.softBlue, 36);
  }
  addRect(slide, hero.x, hero.y+hero.h-1.02, hero.w, 1.02, C.ink, C.ink, { fill:{color:C.ink, transparency:10}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PRIMARY SCENE', { x:hero.x+0.30, y:hero.y+hero.h-0.70, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  const lead = storyItems[0] || { title:'核心产品故事', body:'用主图建立品牌语境，再用细节图和文案解释购买理由。' };
  addText(slide, itemTitle(lead, '核心产品故事'), { x:hero.x+0.30, y:hero.y+hero.h-0.40, w:1.92, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
  addText(slide, itemBody(lead), { x:hero.x+2.56, y:hero.y+hero.h-0.42, w:2.12, h:0.13, fontSize:6.8, color:'CBD5E1', fit:'shrink' });

  const small = [
    { x:6.70, y:2.04, w:2.12, h:1.66 },
    { x:9.24, y:2.04, w:2.12, h:1.66 }
  ];
  small.forEach((slot,i)=>{
    if (images[i+1]) addPhotoPanel(slide, images[i+1], slot.x, slot.y, slot.w, slot.h, { tone:'light', transparency:100, stroke:'E4ECF5', strokeTransparency:14, fit:'cover' });
    else addRect(slide, slot.x, slot.y, slot.w, slot.h, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:18, width:0.40} });
    const item = storyItems[i+1] || {};
    addText(slide, String(i+2).padStart(2,'0'), { x:slot.x, y:slot.y+slot.h+0.18, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.cyan:C.violet });
    addText(slide, itemTitle(item, i===0 ? '搭配细节' : '空间触点'), { x:slot.x+0.44, y:slot.y+slot.h+0.12, w:1.24, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
    if (itemBody(item)) addText(slide, itemBody(item), { x:slot.x+0.44, y:slot.y+slot.h+0.38, w:1.42, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
  });

  const narrative = { x:6.70, y:4.36, w:4.66, h:1.78 };
  addRect(slide, narrative.x, narrative.y, narrative.w, narrative.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'MERCHANDISING LOGIC', { x:narrative.x+0.30, y:narrative.y+0.34, w:1.68, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.storyTitle || '从视觉偏好到复购理由', { x:narrative.x+0.30, y:narrative.y+0.72, w:1.96, h:0.18, fontSize:12.6, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.storyBody || s.note || 'lookbook 页不是随机拼图，它要让顾客看到产品、搭配、空间和会员触达之间的关系。', { x:narrative.x+2.46, y:narrative.y+0.66, w:1.76, h:0.58, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  ['COLOR', 'TEXTURE', 'SCENE'].forEach((label,i)=>{
    const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, narrative.x+0.30+i*0.70, narrative.y+1.34, 0.38, 0.10, color, color, { line:{color, transparency:100} });
    addText(slide, label, { x:narrative.x+0.30+i*0.70, y:narrative.y+1.52, w:0.46, h:0.10, fontSize:5.6, color:'94A3B8', align:'center', fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

function energySiteEvidenceGallery(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'SITE EVIDENCE', 0.86, 0.72, false);
  addText(slide, s.title || '站端现场证据', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  const intro = s.subtitle || s.intro || s.claim || '把站端资产、设备状态和区域调度证据放在同一页，而不是只做图片拼贴。';
  addText(slide, intro, { x:0.86, y:1.52, w:6.6, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
  const hero = { x:0.92, y:2.02, w:6.36, h:2.52 };
  if (images[0]) addPhotoPanel(slide, images[0], hero.x, hero.y, hero.w, hero.h, { tone:'light', transparency:84, stroke:C.line, strokeTransparency:20, fit:'cover' });
  else genericShowcaseField(slide, hero.x, hero.y, hero.w, hero.h, 'SITE EVIDENCE');
  addRect(slide, hero.x, hero.y+hero.h-0.72, hero.w, 0.72, C.ink, C.ink, { fill:{color:C.ink, transparency:14}, line:{color:C.ink, transparency:100} });
  const lead = items[0] || { title:'站端资产', body:'以现场图片确认资产对象和运行边界。' };
  addLabel(slide, 'PRIMARY SITE', { x:hero.x+0.28, y:hero.y+hero.h-0.48, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, itemTitle(lead, '站端资产'), { x:hero.x+1.56, y:hero.y+hero.h-0.54, w:1.74, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, itemBody(lead), { x:hero.x+3.54, y:hero.y+hero.h-0.52, w:2.04, h:0.14, fontSize:7.0, color:'CBD5E1', fit:'shrink' });

  const readout = { x:7.70, y:2.02, w:3.80, h:2.52 };
  addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'ASSET READOUT', { x:readout.x+0.26, y:readout.y+0.28, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  [
    ['01', '站端资产', '可见边界'],
    ['02', '设备状态', '可查对象'],
    ['03', '区域调度', '可复盘动作']
  ].forEach((row,i)=>{
    const y = readout.y + 0.78 + i*0.48;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addNumber(slide, row[0], { x:readout.x+0.28, y:y+0.02, w:0.28, h:0.10, fontSize:6.4, color:accent });
    addText(slide, row[1], { x:readout.x+0.78, y:y, w:0.88, h:0.13, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, row[2], { x:readout.x+2.20, y:y, w:0.90, h:0.12, fontSize:7.4, color:'A8B3C3', fit:'shrink', align:'right' });
    addHairline(slide, readout.x+0.28, y+0.28, 3.02, '334155', 44, 0.30);
  });

  const detailSlots = [
    { x:0.92, y:4.86, w:5.18, h:1.10, image:images[1], item:items[1], color:C.cyan, fallback:'设备细节' },
    { x:6.34, y:4.86, w:5.16, h:1.10, image:images[2], item:items[2], color:C.violet, fallback:'区域视角' }
  ];
  detailSlots.forEach((slot,i)=>{
    addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.42} });
    if (slot.image) addPhotoPanel(slide, slot.image, slot.x+0.14, slot.y+0.14, 1.54, slot.h-0.28, { tone:'light', transparency:82, stroke:C.line, strokeTransparency:28, fit:'cover' });
    else genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, 1.54, slot.h-0.28, slot.fallback);
    const item = slot.item || { title:slot.fallback, body:i===0 ? '检查设备状态对象。' : '进入区域化复盘。' };
    addNumber(slide, String(i+2).padStart(2,'0'), { x:slot.x+1.96, y:slot.y+0.30, w:0.28, h:0.10, fontSize:6.4, color:slot.color });
    addText(slide, itemTitle(item, slot.fallback), { x:slot.x+2.36, y:slot.y+0.26, w:1.18, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(item), { x:slot.x+3.70, y:slot.y+0.25, w:0.94, h:0.20, fontSize:7.4, color:C.body, fit:'shrink', breakLine:true });
  });
  addText(slide, s.note || '能源现场证据页适合站端照片、设备细节和区域调度材料，重点是把图片转成可决策对象。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

function financePortfolioEvidenceGallery(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PORTFOLIO EVIDENCE', 0.86, 0.72, false);
  addText(slide, s.title || '组合项目证据图册', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  const intro = s.subtitle || s.intro || s.claim || '把项目材料、经营快照和投后动作放入投委会可判断的证据语法。';
  addText(slide, intro, { x:0.86, y:1.52, w:6.8, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
  const hero = { x:0.92, y:2.02, w:4.96, h:3.86 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.56, { tone:'light', transparency:100, stroke:'334155', strokeTransparency:44, fit:'cover' });
  else genericShowcaseField(slide, hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.56, 'DEAL EVIDENCE');
  const lead = items[0] || { title:'经营快照示意', body:'用项目材料说明执行质量、风险信号和下一步配置动作。' };
  addLabel(slide, 'PRIMARY DEAL MATERIAL', { x:hero.x+0.30, y:hero.y+3.06, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
  addText(slide, itemTitle(lead, '经营快照示意'), { x:hero.x+0.30, y:hero.y+3.36, w:1.60, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
  addText(slide, itemBody(lead), { x:hero.x+2.22, y:hero.y+3.32, w:2.16, h:0.18, fontSize:8.8, color:'CBD5E1', fit:'shrink' });

  const smallSlots = [
    { x:6.28, y:2.02, image:images[1], item:items[1], label:'COMMERCIAL PROOF', fallback:'产品材料示意', color:C.cyan },
    { x:9.00, y:2.02, image:images[2], item:items[2], label:'GOVERNANCE PROOF', fallback:'治理材料示意', color:C.violet }
  ];
  smallSlots.forEach((slot,i)=>{
    addRect(slide, slot.x, slot.y, 2.42, 1.74, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.38} });
    if (slot.image) addPhotoPanel(slide, slot.image, slot.x+0.12, slot.y+0.12, 2.18, 1.08, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:30, fit:'cover' });
    else genericShowcaseField(slide, slot.x+0.12, slot.y+0.12, 2.18, 1.08, slot.fallback);
    const item = slot.item || { title:slot.fallback, body:i===0 ? '判断商业化进展。' : '沉淀投后动作。' };
    addLabel(slide, slot.label, { x:slot.x+0.18, y:slot.y+1.38, w:1.16, h:0.08, fontSize:5.4, color:slot.color, charSpace:0.5 });
    addText(slide, itemTitle(item, slot.fallback), { x:slot.x+1.28, y:slot.y+1.32, w:0.86, h:0.13, fontSize:8.8, bold:true, color:C.text, fit:'shrink', align:'right' });
  });

  const readout = { x:6.28, y:4.26, w:5.14, h:1.62 };
  addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'IC READOUT', { x:readout.x+0.28, y:readout.y+0.30, w:0.94, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  [
    ['01', '项目质量', '能否继续配置资源'],
    ['02', '风险信号', '是否需要处置节奏'],
    ['03', '资本动作', '加仓、维持或退出']
  ].forEach((row,i)=>{
    const y = readout.y + 0.72 + i*0.34;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addNumber(slide, row[0], { x:readout.x+0.30, y:y+0.02, w:0.28, h:0.09, fontSize:6.4, color:accent });
    addText(slide, row[1], { x:readout.x+0.74, y:y, w:0.86, h:0.12, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, row[2], { x:readout.x+2.16, y:y, w:2.10, h:0.12, fontSize:8.8, color:'CBD5E1', fit:'shrink', align:'right' });
  });
  addText(slide, s.note || '金融案例图册要把图片材料转成投委会判断对象，而不是普通图册。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

function healthcareTouchpointEvidenceGallery(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'SERVICE TOUCHPOINTS', 0.86, 0.72, false);
  addText(slide, s.title || '服务触点证据图册', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  const intro = s.subtitle || s.intro || s.claim || '把患者旅程、前台动作、后台资源和质量证据放到同一条服务链。';
  addText(slide, intro, { x:0.86, y:1.52, w:6.8, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
  const band = { x:0.92, y:2.04, w:10.72, h:3.96 };
  addRect(slide, band.x, band.y, band.w, band.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.44} });
  addLabel(slide, 'PATIENT JOURNEY READOUT', { x:band.x+0.30, y:band.y+0.28, w:1.74, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });

  const slots = [
    { x:1.22, title:'预约导诊', fallback:'入口体验', color:C.accent },
    { x:4.54, title:'检查协同', fallback:'资源等待', color:C.cyan },
    { x:7.86, title:'反馈处置', fallback:'问题闭环', color:C.violet }
  ];
  slots.forEach((slot,i)=>{
    const item = items[i] || { title:slot.title, body:i===0 ? '入口体验可视化。' : (i===1 ? '资源等待可追踪。' : '问题进入闭环。') };
    const y = 2.68;
    addRect(slide, slot.x, y, 2.68, 2.72, 'FFFFFF', C.line, { fill:{color:'FFFFFF', transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.38} });
    if (images[i]) addPhotoPanel(slide, images[i], slot.x+0.14, y+0.14, 2.40, 1.30, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:28, fit:'cover' });
    else genericShowcaseField(slide, slot.x+0.14, y+0.14, 2.40, 1.30, slot.fallback);
    addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.22, y:y+1.76, w:0.28, h:0.10, fontSize:6.4, color:slot.color });
    addText(slide, itemTitle(item, slot.title), { x:slot.x+0.66, y:y+1.70, w:1.08, h:0.14, fontSize:8.9, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(item), { x:slot.x+0.66, y:y+2.12, w:1.58, h:0.18, fontSize:8.8, color:C.body, fit:'shrink' });
    if (i < slots.length - 1) addArrowLine(slide, slot.x+2.78, y+1.36, 0.34, 0, slot.color, { transparency:22, width:0.34 });
  });

  const serviceLine = { x:1.22, y:5.58, w:9.32, h:0.26 };
  addRect(slide, serviceLine.x, serviceLine.y, serviceLine.w, serviceLine.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addText(slide, '预约 · 到院 · 检查 · 随访 · 反馈', { x:serviceLine.x+0.28, y:serviceLine.y+0.07, w:3.40, h:0.09, fontSize:8.8, color:C.white, fit:'shrink' });
  addText(slide, '前台体验、后台排程和质量证据需要同屏复盘。', { x:serviceLine.x+5.16, y:serviceLine.y+0.07, w:3.38, h:0.09, fontSize:8.8, color:'CBD5E1', fit:'shrink', align:'right' });
  addText(slide, s.note || '医疗触点图册适合用图片承载服务情境，再用蓝图语言解释责任和证据。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

function saasPrototypeFlowGallery(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PRODUCT WORKFLOW', 0.86, 0.72, false);
  addText(slide, s.title || '产品原型工作流', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  const intro = s.subtitle || s.intro || s.claim || 'SaaS 原型页要先说明用户工作流，再展示界面状态和采用信号。';
  addText(slide, intro, { x:0.86, y:1.52, w:6.7, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
  const hero = { x:0.92, y:2.00, w:5.52, h:3.72 };
  addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.70, { tone:'light', transparency:100, stroke:'334155', strokeTransparency:44, fit:'cover' });
  else genericShowcaseField(slide, hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.70, 'PRIMARY SCREEN');
  const lead = items[0] || { title:'核心工作台', body:'让核心对象、入口和下一步动作在同一屏成立。' };
  addLabel(slide, 'PRIMARY SCREEN', { x:hero.x+0.30, y:hero.y+3.18, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, itemTitle(lead, '核心工作台'), { x:hero.x+1.78, y:hero.y+3.12, w:1.56, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, itemBody(lead), { x:hero.x+3.50, y:hero.y+3.10, w:1.52, h:0.16, fontSize:7.0, color:'CBD5E1', fit:'shrink' });

  const flow = { x:6.86, y:2.00, w:4.72, h:2.14 };
  addLabel(slide, 'WORKFLOW PATH', { x:flow.x, y:flow.y+0.02, w:1.22, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  const steps = [
    items[0] || { title:'工作台', body:'进入团队空间。' },
    items[1] || { title:'自动化', body:'触发流程动作。' },
    items[2] || { title:'分析视图', body:'看见价值信号。' }
  ];
  steps.forEach((it,i)=>{
    const y = flow.y + 0.42 + i*0.54;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addRect(slide, flow.x, y, flow.w, 0.40, panelFill(), C.line, { fill:{color:panelFill(), transparency:i===0?0:4}, line:{color:i===0?accent:C.line, transparency:i===0?18:18, width:0.38} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:flow.x+0.18, y:y+0.13, w:0.28, h:0.09, fontSize:6.2, color:accent });
    addText(slide, itemTitle(it, `步骤 ${i+1}`), { x:flow.x+0.64, y:y+0.10, w:1.08, h:0.12, fontSize:8.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(it), { x:flow.x+2.14, y:y+0.09, w:1.70, h:0.13, fontSize:7.2, color:C.body, fit:'shrink' });
  });

  const screenSlots = [
    { x:6.86, y:4.54, w:2.16, h:1.18, image:images[1], title:'STATE 02', color:C.cyan },
    { x:9.42, y:4.54, w:2.16, h:1.18, image:images[2], title:'STATE 03', color:C.violet }
  ];
  screenSlots.forEach((slot,i)=>{
    if (slot.image) addPhotoPanel(slide, slot.image, slot.x, slot.y, slot.w, slot.h, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:24, fit:'cover' });
    else genericShowcaseField(slide, slot.x, slot.y, slot.w, slot.h, slot.title);
    addLabel(slide, slot.title, { x:slot.x, y:slot.y+slot.h+0.18, w:0.82, h:0.09, fontSize:5.4, color:slot.color, charSpace:0.7 });
    addText(slide, itemTitle(steps[i+1], i===0 ? '自动化状态' : '分析状态'), { x:slot.x+0.92, y:slot.y+slot.h+0.14, w:0.98, h:0.12, fontSize:7.8, bold:true, color:C.text, fit:'shrink' });
  });
  addRect(slide, 0.92, 6.18, 10.66, 0.34, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
  addText(slide, s.note || '产品原型页适合把界面、核心动作、自动化路径和采用信号放在同一条工作流里。', { x:1.14, y:6.25, w:9.78, h:0.12, fontSize:8.2, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function caseGallery(slide, plan, s, idx) {
  const variant = variantOf(s, 'triptych-gallery');
  if (variant === 'case-hero') return caseEvidenceHero(slide, plan, s, idx);
  if (variant === 'case-comparison') return plan.industry === 'energy-utility'
    ? energySiteComparisonSlide(slide, plan, s, idx)
    : caseComparisonSlide(slide, plan, s, idx);
  if (variant === 'evidence-board') return caseEvidenceBoard(slide, plan, s, idx);
  if (variant === 'lookbook-story') return retailLookbookStory(slide, plan, s, idx);
  if (variant === 'portfolio-evidence') return financePortfolioEvidenceGallery(slide, plan, s, idx);
  if (variant === 'service-touchpoint') return healthcareTouchpointEvidenceGallery(slide, plan, s, idx);
  if (variant === 'site-evidence') return energySiteEvidenceGallery(slide, plan, s, idx);
  if (variant === 'prototype-flow') return saasPrototypeFlowGallery(slide, plan, s, idx);
  lightCanvas(slide);
  sectionKicker(slide, 'CASE EVIDENCE', 0.86, 0.72, false);
  addText(slide, s.title || '案例与素材证据', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.intro) addText(slide, s.subtitle || s.intro, { x:0.86, y:1.52, w:5.9, h:0.20, fontSize:9.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const images = galleryImages(plan, s);
  const items = s.items || s.cards || [];
  if (images.length >= 3 && items.length <= 4) {
    const slots = [
      { x:0.92, y:2.05, w:3.34, h:3.82 },
      { x:4.52, y:2.05, w:3.34, h:3.82 },
      { x:8.12, y:2.05, w:3.34, h:3.82 }
    ];
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      addPhotoPanel(slide, images[i], slot.x, slot.y, slot.w, slot.h, { tone:'dark', transparency:100, stroke:'E8DED8', strokeTransparency:10, fit:'cover' });
      addRect(slide, slot.x, slot.y + slot.h - 0.88, slot.w, 0.88, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.28, y:slot.y+slot.h-0.58, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.accent:C.cyan });
      addText(slide, item.title || `证据 ${i+1}`, { x:slot.x+0.74, y:slot.y+slot.h-0.62, w:1.56, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
      if (item.body) addText(slide, item.body, { x:slot.x+0.74, y:slot.y+slot.h-0.32, w:2.04, h:0.13, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
    });
    addText(slide, s.note || '图册页优先展示同一行业、同一叙事链路的素材，不混用旧行业素材。', { x:0.94, y:6.38, w:8.40, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
    return;
  }
  const hero = images[0];
  if (hero) {
    addPhotoPanel(slide, hero, 0.92, 2.08, 5.30, 3.78, { tone:'dark', transparency:100, stroke:'D8E2EF', strokeTransparency:28 });
    addRect(slide, 0.92, 4.88, 5.30, 0.98, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
  } else {
    addRect(slide, 0.92, 2.08, 5.30, 3.78, C.ink, C.ink, { line:{color:C.ink, transparency:100} });
    addDarkBreathingCircle(slide, 2.42, 2.76, 2.74, 1.48, C.accent);
    addPulseCurve(slide, 1.34, 4.42, 3.20, 0.42, C.cyan, true, { transparency:48, width:0.38, nodes:false });
  }
  const lead = items[0] || { title:'核心案例', body:'以真实图片、现场截图、产品图或客户材料作为证据，不使用无关装饰图。' };
  addLabel(slide, 'PRIMARY CASE', { x:1.22, y:5.14, w:1.20, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, lead.title || String(lead), { x:1.22, y:5.42, w:2.72, h:0.16, fontSize:11.6, bold:true, color:C.white, fit:'shrink' });
  if (lead.body) addText(slide, lead.body, { x:4.02, y:5.42, w:1.62, h:0.14, fontSize:6.7, color:'CBD5E1', fit:'shrink' });

  const slots = [
    { x:6.72, y:2.08, w:2.18, h:1.34 },
    { x:9.24, y:2.08, w:2.18, h:1.34 },
    { x:6.72, y:4.08, w:2.18, h:1.34 },
    { x:9.24, y:4.08, w:2.18, h:1.34 }
  ];
  const slotCount = Math.min(slots.length, Math.max(images.length - 1, items.length - 1, 0));
  slots.slice(0, slotCount).forEach((slot,i)=>{
    const img = images[i+1];
    if (img) {
      addPhotoPanel(slide, img, slot.x, slot.y, slot.w, slot.h, { tone:'dark', transparency:100, stroke:'E4ECF5', strokeTransparency:12 });
    } else {
      addRect(slide, slot.x, slot.y, slot.w, slot.h, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.52} });
    }
    const item = items[i+1] || {};
    addText(slide, String(i+2).padStart(2,'0'), { x:slot.x, y:slot.y+slot.h+0.18, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.accent:C.muted });
    addText(slide, item.title || `证据 ${i+2}`, { x:slot.x+0.46, y:slot.y+slot.h+0.14, w:1.48, h:0.13, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
    if (item.body) addText(slide, item.body, { x:slot.x+0.46, y:slot.y+slot.h+0.40, w:1.54, h:0.12, fontSize:6.3, color:C.body, fit:'shrink' });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}



function energyArchitecture(slide, plan, s, idx) {
  stageCanvas(slide, { field:false });
  addDarkBreathingCircle(slide, 8.62, 0.74, 4.05, 2.22, C.violet);
  sectionKicker(slide, 'ENERGY TOPOLOGY', 0.84, 0.72, true);
  addText(slide, s.title, { x:0.82, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:C.white });
  if (s.subtitle) addText(slide, s.subtitle, { x:0.84, y:1.52, w:6.2, h:0.22, fontSize:10.8, color:'94A3B8' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:'64748B', align:'right' });

  const layerItems = Array.isArray(s.layers) ? s.layers.slice(0,4) : [];
  const fallback = [
    { label:'设备侧', title:'设备采集', items:['逆变器','PCS','BMS','电表'], body:'逆变器 / PCS / BMS / 电表', chips:['发电','储能','负荷'], accent:C.accent },
    { label:'数据侧', title:'统一数据底座', items:['协议适配','指标口径','历史曲线'], body:'协议适配、指标口径、历史曲线', chips:['接入','清洗','归集'], accent:C.cyan },
    { label:'调度侧', title:'告警工单与策略复盘', items:['告警分级','工单处置','SOC 策略'], body:'告警分级、派工处置、SOC 策略', chips:['告警','工单','策略'], accent:C.violet },
    { label:'管理侧', title:'区域运维驾驶舱', items:['多站点态势','收益波动','区域协同'], body:'多站点态势、收益波动、资源协同', chips:['态势','收益','协同'], accent:'94A3B8' }
  ];
  const xs = [1.08, 3.82, 6.58, 9.42];
  const ws = [2.22, 2.28, 2.38, 2.08];
  const columns = fallback.map((base,i)=>{
    const raw = layerItems[i] || {};
    const items = raw.items || base.items;
    return Object.assign({}, base, {
      label: raw.name || raw.title || base.label,
      body: items.join(' / '),
      chips: items.slice(0,3),
      x: xs[i],
      w: ws[i]
    });
  });

  addRect(slide, 0.78, 2.04, 11.48, 4.26, C.ink2, '334155', { fill:{color:C.ink2, transparency:68}, line:{color:'334155', transparency:74, width:0.36} });
  addLabel(slide, 'REAL-TIME DATA FLOW', { x:1.08, y:2.32, w:1.70, h:0.10, fontSize:6.3, color:'64748B', charSpace:1.0 });
  addLabel(slide, 'EDGE  →  DATA  →  DISPATCH  →  MANAGEMENT', { x:7.56, y:2.32, w:3.70, h:0.10, fontSize:6.2, color:'64748B', charSpace:0.85, align:'right' });

  const y=2.92, h=1.66;
  columns.forEach((c,i)=>{
    addText(slide, c.label, { x:c.x, y:y-0.29, w:1.06, h:0.16, fontSize:10.2, bold:true, color:'7C8BA3', charSpace:0.18, fit:'shrink' });
    addRect(slide, c.x, y, c.w, h, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:18}, line:{color:c.accent, transparency:i===0?20:50, width:0.48} });
    slide.addShape('ellipse', { x:c.x+0.22, y:y+0.25, w:0.11, h:0.11, fill:{color:c.accent}, line:{color:c.accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:c.x+0.40, y:y+0.22, w:0.28, h:0.11, fontSize:6.6, color:c.accent });
    addText(slide, c.title, { x:c.x+0.74, y:y+0.17, w:c.w-0.92, h:0.18, fontSize:12.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, c.body, { x:c.x+0.22, y:y+0.64, w:c.w-0.44, h:0.22, fontSize:8.9, color:'A8B3C3', fit:'shrink' });
    c.chips.forEach((chip,j)=>{
      const chipW = (c.w-0.58) / 3;
      addRect(slide, c.x+0.22+j*(chipW+0.05), y+1.10, chipW, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:58, width:0.24} });
      addText(slide, chip, { x:c.x+0.22+j*(chipW+0.05), y:y+1.19, w:chipW, h:0.14, fontSize:8.8, color:'CBD5E1', align:'center', fit:'shrink', valign:'mid' });
    });
    slide.addShape('line', { x:c.x+c.w/2, y:y+h, w:0, h:0.50, line:{color:c.accent, transparency:52, width:0.32} });
    if(i<columns.length-1) slide.addShape('line', { x:c.x+c.w+0.14, y:y+0.80, w:0.36, h:0, line:{color:c.accent, transparency:46, width:0.42, endArrowType:'triangle'} });
  });
  addRect(slide, 1.08, 5.34, 10.42, 0.56, C.ink, '334155', { fill:{color:C.ink, transparency:10}, line:{color:'334155', transparency:58, width:0.30} });
  addText(slide, '运行曲线 · 告警事件 · 工单处置 · 策略复盘', { x:1.34, y:5.54, w:4.20, h:0.14, fontSize:9.0, bold:true, color:'CBD5E1', fit:'shrink' });
  addPulseCurve(slide, 6.72, 5.40, 3.72, 0.36, C.cyan, true, { transparency:54, width:0.42, nodes:false });
  addLabel(slide, 'OPERATING DATA BUS', { x:10.24, y:5.55, w:0.92, h:0.10, fontSize:5.6, color:'64748B', charSpace:0.7, align:'right' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function architectureBlueprint(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'SOLUTION BLUEPRINT', 0.86, 0.72, false);
  addText(slide, s.title || '方案架构蓝图', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.1, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const layers = (s.layers || []).slice(0,5);
  addRect(slide, 0.92, 2.10, 2.76, 3.92, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'ARCHITECTURE LOGIC', { x:1.20, y:2.42, w:1.34, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '从业务入口到数据底座', { x:1.20, y:2.86, w:1.96, h:0.30, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || '适合文案较多、需要讲清系统边界和分层关系的行业方案。', { x:1.20, y:3.48, w:1.94, h:0.58, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  addHairline(slide, 1.20, 4.48, 0.78, C.accent, 0, 0.68);
  addText(slide, s.note || '架构页应避免功能堆叠，优先表达“对象、动作、数据、治理”的关系。', { x:1.20, y:4.86, w:1.94, h:0.38, fontSize:7.1, color:C.darkMuted, breakLine:true, fit:'shrink' });

  const board = { x:4.18, y:2.04, w:7.32, h:4.10 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'LAYERED OPERATING SYSTEM', { x:board.x+0.34, y:board.y+0.26, w:1.82, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
  const rowH = 0.58;
  layers.forEach((layer,i)=>{
    const y = board.y + 0.72 + i*0.66;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addRect(slide, board.x+0.34, y, board.w-0.68, rowH, i===1 ? C.panelAlt : panelFill(), C.line, {
      fill:{color:i===1 ? C.panelAlt : panelFill(), transparency:i===1?8:0},
      line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.42}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.60, y:y+0.21, w:0.30, h:0.10, fontSize:6.8, color:accent });
    addText(slide, layer.title || layer.name || `层级 ${i+1}`, { x:board.x+1.04, y:y+0.15, w:1.28, h:0.15, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
    const items = (layer.items || []).slice(0,5);
    addText(slide, items.join('   /   '), { x:board.x+2.70, y:y+0.16, w:4.02, h:0.13, fontSize:8.4, color:C.body, fit:'shrink' });
  });
  addHairline(slide, board.x+0.34, 6.42, board.w-0.68, C.line, 16, 0.45);
  addText(slide, s.footerNote || '蓝图型架构适合医疗、金融、政企等信息密度更高的材料。', { x:board.x+0.34, y:6.60, w:5.8, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function architectureServiceBlueprint(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'SERVICE BLUEPRINT', 0.86, 0.72, false);
  addText(slide, s.title || '医疗服务蓝图', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把患者触点、前台服务、后台协同和质量证据放在同一张服务蓝图里。';
  addText(slide, claim, { x:0.86, y:1.52, w:7.1, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const raw = s.serviceBlueprint || s.touchpoints || s.journeyMap || s.phases || [];
  const steps = (Array.isArray(raw) ? raw : []).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
  const fallback = [
    { title:'预约', patient:'线上预约/资料确认', frontstage:'客服确认需求', backstage:'排班与号源协调', evidence:'等待时长' },
    { title:'到院', patient:'导诊/签到', frontstage:'导诊台分流', backstage:'诊室与检查资源联动', evidence:'排队状态' },
    { title:'检查', patient:'完成检查项目', frontstage:'医护解释流程', backstage:'检查排程与结果同步', evidence:'异常反馈' },
    { title:'随访', patient:'接收结果和建议', frontstage:'客服回访', backstage:'质控复盘和整改', evidence:'满意度' }
  ];
  const cols = (steps.length ? steps : fallback).slice(0,4).map((step,i)=>Object.assign({}, fallback[i] || {}, step));
  const lanes = [
    { label:'患者动作', key:'patient', color:C.accent },
    { label:'前台服务', key:'frontstage', color:C.cyan },
    { label:'后台协同', key:'backstage', color:C.violet },
    { label:'质量证据', key:'evidence', color:'94A3B8' }
  ];

  const ribbon = { x:0.92, y:2.04, w:10.84, h:0.60 };
  addRect(slide, ribbon.x, ribbon.y, ribbon.w, ribbon.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'CARE JOURNEY', { x:ribbon.x+0.28, y:ribbon.y+0.20, w:1.18, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '从触点到责任', { x:ribbon.x+1.72, y:ribbon.y+0.16, w:1.62, h:0.17, fontSize:10.4, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || '服务蓝图不只画流程，而是把患者体验、医护协同和质量复盘绑定起来。', {
    x:ribbon.x+3.74, y:ribbon.y+0.18, w:3.38, h:0.14, fontSize:6.8, color:C.captionOnImage, fit:'shrink'
  });
  addText(slide, s.note || '适合医疗、政务、服务运营等多角色触点材料。', {
    x:ribbon.x+7.78, y:ribbon.y+0.18, w:2.58, h:0.14, fontSize:6.8, color:C.darkMuted || 'A8B3C3', fit:'shrink'
  });

  const board = { x:0.92, y:2.86, w:10.84, h:3.36 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'TOUCHPOINTS · FRONTSTAGE · BACKSTAGE · QUALITY', { x:board.x+0.30, y:board.y+0.28, w:3.30, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
  const colW = (board.w - 1.48) / cols.length;
  cols.forEach((step,i)=>{
    const x = board.x + 1.06 + i*colW;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addNumber(slide, String(i+1).padStart(2,'0'), { x, y:board.y+0.64, w:0.28, h:0.10, fontSize:6.4, color:accent });
    addText(slide, step.title || `触点 ${i+1}`, { x:x+0.36, y:board.y+0.58, w:colW-0.54, h:0.14, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
    if (i<cols.length-1) addHairline(slide, x+colW-0.08, board.y+0.70, 0.28, accent, 38, 0.34);
  });
  lanes.forEach((lane,row)=>{
    const y = board.y + 1.08 + row*0.56;
    addText(slide, lane.label, { x:board.x+0.30, y:y+0.15, w:0.72, h:0.12, fontSize:6.8, bold:true, color:lane.color, fit:'shrink' });
    cols.forEach((step,i)=>{
      const x = board.x + 1.42 + i*colW;
      const text = step[lane.key] || step[lane.key === 'evidence' ? 'metric' : 'body'] || fallback[i][lane.key];
      addRect(slide, x, y, colW-0.20, 0.42, row===1 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
        fill:{color:row===1 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:row===1?8:0},
        line:{color:row===0 && i===0 ? lane.color : C.line, transparency:row===0 && i===0 ? 24 : 18, width:0.32}
      });
      addText(slide, text, { x:x+0.12, y:y+0.13, w:colW-0.44, h:0.12, fontSize:6.6, color:row===0 ? C.text : C.body, fit:'shrink' });
    });
  });
  addHairline(slide, board.x+0.30, 5.78, board.w-0.60, C.line, 16, 0.45);
  addText(slide, s.footerNote || '服务蓝图页强调触点之间的责任和证据，不把患者旅程压成单条时间线。', { x:board.x+0.30, y:5.96, w:6.3, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function architectureSaasCapabilityMap(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PLATFORM CAPABILITY MAP', 0.86, 0.72, false);
  addText(slide, s.title || '平台能力地图', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把产品入口、核心工作流、数据事件、集成和治理放进同一张平台能力地图。';
  addText(slide, claim, { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const layers = Array.isArray(s.layers) ? s.layers : [];
  const explicit = s.platformCapabilities || s.capabilityMap || s.capabilities;
  const sourceCaps = Array.isArray(explicit) ? explicit : [];
  const businessLayer = layers.find(l => /业务|工作流|应用|workflow|application/i.test(l.title || l.name || '')) || layers[1] || {};
  const dataLayer = layers.find(l => /数据|事件|审计|data|event|audit/i.test(l.title || l.name || '')) || layers[2] || {};
  const integrationLayer = layers.find(l => /集成|入口|API|SSO|CRM|工单|integration|access/i.test(l.title || l.name || '')) || layers[3] || layers[0] || {};
  const fallbackCaps = (businessLayer.items || ['工作流', '自动化', '协同空间', '模板库']).slice(0,4).map(title => ({ title, body:'进入核心使用路径。' }));
  const caps = (sourceCaps.length ? sourceCaps : fallbackCaps).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
  const metrics = (s.metrics || []).slice(0,3);

  const left = { x:0.92, y:2.08, w:2.54, h:4.10 };
  addRect(slide, left.x, left.y, left.w, left.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'PRODUCT CORE', { x:left.x+0.28, y:left.y+0.34, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '核心工作流成立，平台才有复利', { x:left.x+0.28, y:left.y+0.78, w:1.68, h:0.42, fontSize:14.0, bold:true, color:C.white, fit:'shrink', breakLine:true });
  addText(slide, s.coreBody || 'SaaS 能力页应把模块放回用户动作、数据事件和企业治理，不只是功能列表。', { x:left.x+0.28, y:left.y+1.64, w:1.72, h:0.70, fontSize:7.4, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  addHairline(slide, left.x+0.28, left.y+2.72, 0.78, C.accent, 0, 0.60);
  metrics.slice(0,2).forEach((m,i)=>{
    const y = left.y + 3.02 + i*0.44;
    addNumber(slide, m.value || '—', { x:left.x+0.28, y, w:0.70, h:0.14, fontSize:12.2, color:i===0?C.accent:C.cyan, fit:'shrink' });
    addText(slide, m.label || '', { x:left.x+1.08, y:y+0.02, w:0.82, h:0.12, fontSize:8.8, color:'A8B3C3', fit:'shrink' });
  });

  const stage = { x:3.86, y:2.06, w:4.66, h:4.12 };
  addRect(slide, stage.x, stage.y, stage.w, stage.h, C.ink, '334155', { fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:34, width:0.42} });
  addLabel(slide, 'WORKFLOW FIELD', { x:stage.x+0.28, y:stage.y+0.28, w:1.18, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
  const cx = stage.x + stage.w * 0.50;
  const cy = stage.y + 2.08;
  slide.addShape('ellipse', { x:cx-1.12, y:cy-1.12, w:2.24, h:2.24, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:56, width:0.38} });
  slide.addShape('ellipse', { x:cx-0.66, y:cy-0.66, w:1.32, h:1.32, fill:{color:C.ink2, transparency:10}, line:{color:C.accent, transparency:24, width:0.50} });
  addText(slide, s.centerTitle || '核心工作流', { x:cx-0.46, y:cy-0.16, w:0.92, h:0.14, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, 'EVENTS · DATA · RIGHTS', { x:cx-0.70, y:cy+0.12, w:1.40, h:0.08, fontSize:5.0, color:'64748B', align:'center', charSpace:0.5 });
  const capSlots = [
    { x:stage.x+0.34, y:stage.y+0.88, anchor:[cx-0.72, cy-0.54], color:C.accent },
    { x:stage.x+2.76, y:stage.y+0.88, anchor:[cx+0.72, cy-0.54], color:C.cyan },
    { x:stage.x+2.76, y:stage.y+2.78, anchor:[cx+0.72, cy+0.54], color:C.violet },
    { x:stage.x+0.34, y:stage.y+2.78, anchor:[cx-0.72, cy+0.54], color:'94A3B8' }
  ];
  caps.forEach((cap,i)=>{
    const slot = capSlots[i];
    slide.addShape('line', { x:slot.anchor[0], y:slot.anchor[1], w:slot.x+0.80-slot.anchor[0], h:slot.y+0.26-slot.anchor[1], line:{color:slot.color, transparency:62, width:0.28} });
    addRect(slide, slot.x, slot.y, 1.54, 0.72, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:i===0?6:20},
      line:{color:i===0 ? slot.color : '334155', transparency:i===0?24:52, width:0.34}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.14, y:slot.y+0.20, w:0.24, h:0.10, fontSize:6.4, color:slot.color });
    addText(slide, itemTitle(cap, `能力 ${i+1}`), { x:slot.x+0.48, y:slot.y+0.12, w:0.82, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(cap), { x:slot.x+0.48, y:slot.y+0.42, w:0.82, h:0.12, fontSize:8.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });

  const right = { x:8.92, y:2.08, w:2.82, h:4.10 };
  addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'ENTERPRISE FIT', { x:right.x+0.26, y:right.y+0.32, w:1.30, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  const proofRows = [
    { title:'入口', body:(integrationLayer.items || ['Web App', 'Admin Console', 'API']).slice(0,3).join(' / ') },
    { title:'数据', body:(dataLayer.items || ['客户数据', '事件流', '审计日志']).slice(0,3).join(' / ') },
    { title:'治理', body:(s.governance || ['SSO', '权限模型', '审计']).slice(0,3).join(' / ') }
  ];
  proofRows.forEach((row,i)=>{
    const y = right.y + 0.88 + i*0.86;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    addText(slide, row.title, { x:right.x+0.28, y:y, w:0.42, h:0.14, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
    addText(slide, row.body, { x:right.x+0.86, y:y-0.02, w:1.34, h:0.16, fontSize:8.8, color:C.text, fit:'shrink' });
    addHairline(slide, right.x+0.28, y+0.42, 2.14, C.line, 20, 0.34);
  });
  addRect(slide, right.x+0.28, right.y+3.42, 2.10, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
  addText(slide, s.footerNote || '能力地图必须能解释采用深度和扩展收入。', { x:right.x+0.40, y:right.y+3.48, w:1.82, h:0.14, fontSize:8.8, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function architectureHubSpoke(slide, plan, s, idx) {
  stageCanvas(slide);
  sectionKicker(slide, 'CONNECTED ARCHITECTURE', 0.84, 0.72, true);
  addText(slide, s.title || '协同架构', { x:0.82, y:1.08, w:5.9, h:0.36, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.55, w:5.5, h:0.22, fontSize:10.6, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  const nodes = s.nodes || s.hubs || (s.layers || []).map(l => ({ title:l.title, body:(l.items || []).slice(0,3).join(' / ') }));
  const cx = 6.68, cy = 3.78;
  addRect(slide, cx-1.04, cy-0.56, 2.08, 1.12, C.ink, C.accent, { fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:22, width:0.56} });
  addText(slide, s.centerTitle || '统一平台核心', { x:cx-0.70, y:cy-0.20, w:1.40, h:0.16, fontSize:10.4, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, 'DATA · PROCESS · GOVERNANCE', { x:cx-0.86, y:cy+0.14, w:1.72, h:0.09, fontSize:5.4, color:'64748B', align:'center', charSpace:0.55 });
  const pos = [
    [2.00,2.18], [5.02,2.06], [8.74,2.18],
    [9.10,4.98], [5.14,5.28], [1.92,4.98]
  ];
  nodes.slice(0,6).forEach((n,i)=>{
    const [x,y] = pos[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    slide.addShape('line', { x:cx, y:cy, w:x+0.88-cx, h:y+0.40-cy, line:{color:accent, transparency:62, width:0.34} });
    addRect(slide, x, y, 1.76, 0.80, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?20:38}, line:{color:accent, transparency:i===0?24:58, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:y+0.22, w:0.28, h:0.10, fontSize:6.4, color:accent });
    addText(slide, itemTitle(n, `节点 ${i+1}`), { x:x+0.54, y:y+0.16, w:0.94, h:0.13, fontSize:8.5, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(n), { x:x+0.18, y:y+0.47, w:1.24, h:0.12, fontSize:6.6, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addText(slide, s.note || '网络型架构适合表达多角色、多系统、多区域之间的协同关系。', { x:0.90, y:6.42, w:7.60, h:0.16, fontSize:8.5, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function architectureManufacturingTopology(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'LINE SYSTEM TOPOLOGY', 0.86, 0.72, false);
  addText(slide, s.title || '设备运维能力架构', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  const claim = s.claim || s.subtitle || '把设备接入、工单处置和指标复盘放进同一条产线证据链。';
  addText(slide, claim, { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const layers = Array.isArray(s.layers) ? s.layers : [];
  const access = layers[0] || { title:'设备与现场层', items:['PLC','传感器','点检终端','备件台账'] };
  const apps = layers[1] || { title:'业务应用层', items:['设备健康','统一运营核心','维修工单','备件协同'] };
  const data = layers[2] || { title:'数据支撑层', items:['设备库','故障库','工单库','备件库','OEE 指标'] };

  const line = { x:0.92, y:2.10, w:10.84, h:1.38 };
  addRect(slide, line.x, line.y, line.w, line.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'FIELD DEVICES', { x:line.x+0.30, y:line.y+0.28, w:1.20, h:0.10, fontSize:5.8, color:C.darkMuted || '94A3B8', charSpace:0.78 });
  const devices = (access.items || []).slice(0,5);
  devices.forEach((name,i)=>{
    const x = line.x + 1.28 + i*1.74;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    slide.addShape('ellipse', { x, y:line.y+0.52, w:0.22, h:0.22, fill:{color:accent}, line:{color:accent, transparency:100} });
    if (i < devices.length-1) addHairline(slide, x+0.24, line.y+0.63, 1.30, '334155', 34, 0.42);
    addText(slide, name, { x:x-0.46, y:line.y+0.90, w:1.16, h:0.14, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  });

  const ops = { x:0.92, y:4.02, w:5.24, h:1.78 };
  addRect(slide, ops.x, ops.y, ops.w, ops.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'OPERATIONS LAYER', { x:ops.x+0.28, y:ops.y+0.30, w:1.42, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  (apps.items || []).slice(0,4).forEach((name,i)=>{
    const x = ops.x + 0.24 + i*1.24;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    const shortName = name === '统一运营核心' ? '运营核心' : name;
    addRect(slide, x, ops.y+0.78, 1.08, 0.48, i===1 ? C.ink : (C.panelAlt || C.softBlue), accent, {
      fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1 ? 0 : 8},
      line:{color:accent, transparency:i===1 ? 24 : 56, width:0.38}
    });
    addText(slide, shortName, { x:x+0.10, y:ops.y+0.92, w:0.88, h:0.12, fontSize:8.8, bold:true, color:i===1 ? C.white : C.text, align:'center', fit:'shrink' });
  });
  addText(slide, apps.title || '业务应用层', { x:ops.x+0.30, y:ops.y+1.44, w:2.7, h:0.13, fontSize:8.8, color:C.muted, fit:'shrink' });

  const ledger = { x:6.54, y:4.02, w:5.22, h:1.78 };
  addRect(slide, ledger.x, ledger.y, ledger.w, ledger.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addLabel(slide, 'DATA LEDGER', { x:ledger.x+0.28, y:ledger.y+0.30, w:1.18, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  (data.items || []).slice(0,5).forEach((name,i)=>{
    const y = ledger.y + 0.72 + i*0.22;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addNumber(slide, String(i+1).padStart(2,'0'), { x:ledger.x+0.30, y, w:0.26, h:0.09, fontSize:5.8, color:accent });
    addText(slide, name, { x:ledger.x+0.72, y:y-0.03, w:1.24, h:0.12, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
    addHairline(slide, ledger.x+2.14, y+0.05, 2.42, C.line, 24, 0.26);
  });

  const deviceCenters = devices.map((_,i)=>line.x + 1.28 + i*1.74 + 0.11);
  const sourceX = deviceCenters.length
    ? deviceCenters.reduce((sum,x)=>sum+x, 0) / deviceCenters.length
    : line.x + line.w * 0.50;
  const opsCenterX = ops.x + ops.w * 0.50;
  const ledgerCenterX = ledger.x + ledger.w * 0.50;
  const busY = ops.y - 0.30;
  const busStart = Math.min(opsCenterX, sourceX, ledgerCenterX);
  const busW = Math.max(opsCenterX, sourceX, ledgerCenterX) - busStart;
  addArrowLine(slide, sourceX, line.y + line.h + 0.02, 0, busY - line.y - line.h - 0.05, C.accent, { transparency:24, width:0.42 });
  addHairline(slide, busStart, busY, busW, '94A3B8', 46, 0.34);
  [sourceX, opsCenterX, ledgerCenterX].forEach((x,i)=>{
    const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
    slide.addShape('ellipse', { x:x-0.025, y:busY-0.025, w:0.05, h:0.05, fill:{color}, line:{color, transparency:100} });
  });
  addArrowLine(slide, opsCenterX, busY + 0.03, 0, ops.y - busY - 0.08, C.cyan, { transparency:26, width:0.42 });
  addArrowLine(slide, ledgerCenterX, busY + 0.03, 0, ledger.y - busY - 0.08, C.violet, { transparency:32, width:0.42 });
  addArrowBetweenRects(slide, ops, ledger, 'right', C.accent, {
    gap:0.24,
    y:ops.y + ops.h / 2,
    endY:ledger.y + ledger.h / 2,
    transparency:34,
    width:0.36
  });
  addRect(slide, 0.92, 6.24, 9.82, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
  addText(slide, s.note || '统一数据底座 · 统一服务入口 · 统一运营看板 · 统一闭环机制', {
    x:1.12, y:6.31, w:9.24, h:0.12, fontSize:8.8, color:C.body, fit:'shrink'
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function architectureAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'layer-stack');
  if (variant === 'service-blueprint') return architectureServiceBlueprint(slide, plan, s, idx);
  if (variant === 'platform-capability-map') return architectureSaasCapabilityMap(slide, plan, s, idx);
  if (variant === 'production-topology') return architectureManufacturingTopology(slide, plan, s, idx);
  if (variant === 'blueprint-stack') return architectureBlueprint(slide, plan, s, idx);
  if (variant === 'hub-spoke') return architectureHubSpoke(slide, plan, s, idx);
  return architectureDark(slide, plan, s, idx);
}

function architectureDark(slide, plan, s, idx) {
  // Platform section architecture v10: no overlaid vertical core card; core is a foreground capsule inside the application stratum.
  stageCanvas(slide);
  sectionKicker(slide, 'SYSTEM ARCHITECTURE', 0.84, 0.72, true);
  addText(slide, s.title, { x:0.82, y:1.08, w:5.8, h:0.36, fontSize:24, bold:true, color:C.white });
  if (s.subtitle) addText(slide, s.subtitle, { x:0.84, y:1.55, w:5.4, h:0.22, fontSize:10.8, color:'94A3B8' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, bold:true, color:'64748B', align:'right' });

  const layers = s.layers || [];
  const entrance = layers[0] || {title:'用户入口层', items:[]};
  const apps = layers[1] || {title:'业务应用层', items:[]};
  const data = layers[2] || {title:'数据支撑层', items:[]};
  const panelX = 2.45, panelW = 8.70;
  const layerDefs = [
    { layer: entrance, y:2.10, h:0.58, accent:C.accent, label:'ACCESS' },
    { layer: apps, y:3.18, h:1.18, accent:C.cyan, label:'APPLICATIONS' },
    { layer: data, y:5.02, h:0.64, accent:C.violet, label:'DATA FOUNDATION' }
  ];

  layerDefs.forEach((def, li)=>{
    const {layer,y,h,accent,label} = def;
    addText(slide, layer.title, { x:0.92, y:y+0.16, w:1.18, h:0.16, fontSize:9.6, bold:true, color:'CBD5E1' });
    addText(slide, label, { x:2.45, y:y-0.22, w:1.45, h:0.10, fontSize:6.5, color:'64748B', charSpace:0.8 });
    addRect(slide, panelX, y, panelW, h, C.ink2, '334155', { fill:{color:C.ink2, transparency:li===1?22:34}, line:{color:accent, transparency:li===1?44:68, width:0.48} });
    addHairline(slide, 2.10, y+h/2, 0.22, accent, 8, 0.65);
  });

  (entrance.items || []).slice(0,4).forEach((it,i)=>{
    const x = 2.76 + i*1.86;
    addText(slide, it, { x, y:2.29, w:1.24, h:0.13, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  });

  // Business zones are derived from the current plan's application items; never hardcode an industry.
  const appItems = apps.items || [];
  const appGroups = [
    { title: appItems[0] || '核心应用', items: appItems.slice(1,2).join(' · '), x:2.86, w:2.20, accent:C.cyan },
    { title: appItems[2] || appItems[1] || '协同处置', items: appItems.slice(3,4).join(' · '), x:7.58, w:2.20, accent:C.accent },
    { title: appItems[4] || '策略复盘', items: appItems.slice(5,6).join(' · '), x:9.98, w:0.92, accent:C.violet }
  ];
  appGroups.forEach((g,i)=>{
    addRect(slide, g.x, 3.48, g.w, 0.48, C.ink2, '334155', { fill:{color:C.ink2, transparency:18}, line:{color:g.accent, transparency:i===0?30:62, width:0.4} });
    addText(slide, g.title, { x:g.x+0.12, y:3.59, w:g.w-0.24, h:0.12, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    if (g.items) addText(slide, g.items, { x:g.x+0.10, y:3.80, w:g.w-0.20, h:0.11, fontSize:8.8, color:'94A3B8', align:'center', fit:'shrink' });
  });
  // Foreground core capsule, intentionally on top and bounded inside the application stratum.
  addRect(slide, 5.66, 3.33, 1.22, 0.78, C.ink, C.accent, { fill:{color:C.ink, transparency:6}, line:{color:C.accent, transparency:22, width:0.55} });
  addText(slide, '统一运营核心', { x:5.78, y:3.54, w:0.98, h:0.14, fontSize:9.2, bold:true, color:C.white, align:'center', fit:'shrink' });
  addText(slide, '认证 · 流程 · 指标', { x:5.76, y:3.80, w:1.02, h:0.12, fontSize:8.8, color:'94A3B8', align:'center', fit:'shrink' });
  addHairline(slide, 5.08, 3.72, 0.58, '334155', 48, 0.38);
  addHairline(slide, 6.88, 3.72, 0.70, '334155', 48, 0.38);
  slide.addShape('line', { x:6.27, y:4.11, w:0, h:0.91, line:{color:C.violet, transparency:28, width:0.45} });

  (data.items || []).slice(0,7).forEach((it,i)=>{
    const x = 2.72 + i*1.12;
    addText(slide, it, { x, y:5.25, w:0.78, h:0.13, fontSize:8.8, color:'CBD5E1', bold:true, align:'center', fit:'shrink' });
    if (i>0) slide.addShape('line', { x:x-0.17, y:5.13, w:0, h:0.40, line:{color:'334155', transparency:56, width:0.3} });
  });
  addText(slide, '统一数据底座 · 统一服务入口 · 统一运营看板 · 统一闭环机制', { x:0.90, y:6.25, w:8.2, h:0.20, fontSize:12.2, bold:true, color:'CBD5E1' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
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
    addNumber(slide, String(i+1).padStart(2,'0'), { x:1.18, y:y+0.20, w:0.28, h:0.09, fontSize:6.3, color:accent });
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

function timelineClosedLoop(slide, plan, s, idx) {
  stageCanvas(slide);
  sectionKicker(slide, 'OPERATING LOOP', 0.84, 0.72, true);
  addText(slide, s.title || '流程闭环', { x:0.82, y:1.06, w:6.2, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.54, w:5.9, h:0.20, fontSize:10.4, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  const phases = (s.phases || []).slice(0,4);
  const board = { x:0.92, y:2.04, w:10.84, h:4.18 };
  addRect(slide, board.x, board.y, board.w, board.h, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:58},
    line:{color:'334155', transparency:74, width:0.36}
  });
  addLabel(slide, plan.industry === 'manufacturing-operations' ? 'FAULT · WORKORDER · SPARE PART · OEE' : 'ACTION · DATA · REVIEW', {
    x:board.x+0.30, y:board.y+0.28, w:2.92, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.75
  });

  const cx = 6.34, cy = 4.05;
  slide.addShape('ellipse', { x:cx-1.34, y:cy-0.70, w:2.68, h:1.40, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:46, width:0.46} });
  slide.addShape('ellipse', { x:cx-0.92, y:cy-0.42, w:1.84, h:0.84, fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:62, width:0.28} });
  addText(slide, s.centerTitle || (plan.industry === 'manufacturing-operations' ? 'OEE复盘' : '闭环复盘'), { x:cx-0.74, y:cy-0.14, w:1.48, h:0.18, fontSize:12.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, 'DATA BACK TO ACTION', { x:cx-0.86, y:cy+0.20, w:1.72, h:0.09, fontSize:5.2, color:'64748B', align:'center', charSpace:0.62 });
  const pos = [
    { x:1.22, y:2.74 }, { x:8.46, y:2.74 },
    { x:8.46, y:4.78 }, { x:1.22, y:4.78 }
  ];
  phases.forEach((p,i)=>{
    const {x,y} = pos[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, 2.42, 0.82, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:20}, line:{color:accent, transparency:i===0?18:54, width:0.44} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.21, w:0.32, h:0.11, fontSize:6.8, color:accent });
    addText(slide, p.title, { x:x+0.66, y:y+0.16, w:1.24, h:0.14, fontSize:9.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, p.body, { x:x+0.66, y:y+0.45, w:1.44, h:0.14, fontSize:6.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  addClockwiseLoopConnectors(slide, pos.map(p => ({ x:p.x, y:p.y, w:2.42, h:0.82 })), [C.accent, C.cyan, C.violet, C.accent], {
    gap:0.24,
    transparency:30,
    width:0.54
  });
  addLabel(slide, 'SEQUENCE 01 → 02 → 03 → 04 → 01', { x:board.x+0.30, y:board.y+0.48, w:2.92, h:0.09, fontSize:5.3, color:C.darkMuted || '64748B', charSpace:0.62 });
  addText(slide, '复盘回流', { x:1.18, y:4.06, w:0.70, h:0.10, fontSize:5.8, color:C.accent, fit:'shrink' });
  if (s.note) addText(slide, s.note, { x:0.92, y:6.36, w:7.8, h:0.18, fontSize:9.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function timelineFlywheel(slide, plan, s, idx) {
  stageCanvas(slide);
  sectionKicker(slide, 'OPERATING FLYWHEEL', 0.84, 0.72, true);
  addText(slide, s.title || '运营飞轮', { x:0.82, y:1.06, w:6.9, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.54, w:6.2, h:0.20, fontSize:10.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });

  const raw = s.flywheel || s.loopItems || s.phases || s.cards || s.items || [];
  const nodes = (Array.isArray(raw) ? raw : []).slice(0,6).map(v => typeof v === 'string' ? { title:v } : v);
  const items = nodes.length ? nodes : [
    { title:'触达', body:'建立入口' },
    { title:'转化', body:'形成动作' },
    { title:'留存', body:'沉淀关系' },
    { title:'复盘', body:'驱动下一轮' }
  ];
  const cx = 6.58;
  const cy = 3.94;
  const radiusX = 3.02;
  const radiusY = 1.66;
  const nodeW = items.length <= 4 ? 2.02 : 1.72;
  const nodeH = 0.84;
  addRect(slide, 0.92, 2.02, 10.92, 4.26, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:60},
    line:{color:'334155', transparency:76, width:0.36}
  });
  addLabel(slide, s.flywheelLabel || 'INPUT · ACTION · SIGNAL · REVIEW', { x:1.20, y:2.32, w:2.58, h:0.10, fontSize:6.0, color:'64748B', charSpace:0.8 });
  slide.addShape('ellipse', { x:cx-2.20, y:cy-1.24, w:4.40, h:2.48, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:48, width:0.50} });
  slide.addShape('ellipse', { x:cx-1.38, y:cy-0.76, w:2.76, h:1.52, fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:62, width:0.30} });
  addText(slide, s.centerTitle || '飞轮复利', { x:cx-0.78, y:cy-0.16, w:1.56, h:0.20, fontSize:13.2, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, s.centerLabel || 'COMPOUNDING LOOP', { x:cx-0.88, y:cy+0.20, w:1.76, h:0.09, fontSize:5.4, color:'64748B', align:'center', charSpace:0.60 });

  let slots;
  if (items.length <= 4) {
    slots = [
      { x:cx-nodeW/2, y:2.42 },
      { x:8.64, y:3.40 },
      { x:cx-nodeW/2, y:4.76 },
      { x:2.62, y:3.40 }
    ].slice(0, items.length);
    addArrowLine(slide, cx+1.18, cy-1.12, 1.30, 0, C.accent, { transparency:34, width:0.40 });
    addArrowLine(slide, 9.62, cy-0.06, 0, 0.72, C.cyan, { transparency:36, width:0.40 });
    addArrowLine(slide, cx-2.48, cy+1.12, 1.30, 0, C.violet, { beginArrowType:'triangle', endArrowType:null, transparency:38, width:0.40 });
    addArrowLine(slide, 3.62, cy-0.06, 0, 0.72, '94A3B8', { beginArrowType:'triangle', endArrowType:null, transparency:42, width:0.40 });
  } else {
    const points = items.map((_, i) => {
      const angle = -Math.PI / 2 + i * (Math.PI * 2 / items.length);
      return {
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY,
        angle
      };
    });
    points.forEach((p,i)=>{
      const next = points[(i+1) % points.length];
      const sx = p.x + Math.cos(p.angle) * 0.56;
      const sy = p.y + Math.sin(p.angle) * 0.28;
      const ex = next.x - Math.cos(next.angle) * 0.56;
      const ey = next.y - Math.sin(next.angle) * 0.28;
      addArrowLine(slide, sx, sy, ex-sx, ey-sy, i===0?C.accent:(i===1?C.cyan:(i===2?C.violet:'94A3B8')), { transparency:46, width:0.36 });
    });
    slots = points.map(p => ({
      x: Math.max(1.18, Math.min(10.44, p.x - nodeW / 2)),
      y: Math.max(2.62, Math.min(5.32, p.y - nodeH / 2))
    }));
  }
  items.forEach((it,i)=>{
    const p = slots[i];
    const x = p.x;
    const y = p.y;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, nodeW, nodeH, C.ink, '334155', {
      fill:{color:C.ink, transparency:i===0?4:22},
      line:{color:accent, transparency:i===0?18:56, width:0.42}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.16, y:y+0.18, w:0.28, h:0.10, fontSize:6.6, color:accent });
    addText(slide, itemTitle(it, `动作 ${i+1}`), { x:x+0.54, y:y+0.14, w:nodeW-0.74, h:0.13, fontSize:8.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+0.54, y:y+0.44, w:nodeW-0.74, h:0.18, fontSize:8.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  if (s.note) addText(slide, s.note, { x:0.94, y:6.46, w:8.40, h:0.14, fontSize:8.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function timelineProcessBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PROCESS BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '实施路径', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.1, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const phases = (s.phases || []).slice(0,6);
  addRect(slide, 0.92, 2.02, 10.92, 4.16, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  phases.forEach((p,i)=>{
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 1.22 + col*3.36;
    const y = 2.42 + row*1.72;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addRect(slide, x, y, 2.82, 1.18, i===0 ? C.panelAlt : panelFill(), C.line, { fill:{color:i===0 ? C.panelAlt : panelFill(), transparency:i===0?4:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:18, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.22, w:0.32, h:0.11, fontSize:6.8, color:accent });
    addText(slide, p.title, { x:x+0.70, y:y+0.16, w:1.46, h:0.15, fontSize:10.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, p.body, { x:x+0.22, y:y+0.54, w:2.22, h:0.32, fontSize:7.6, color:C.body, fit:'shrink', breakLine:true });
    if (i < phases.length - 1 && col < 2) slide.addShape('line', { x:x+2.90, y:y+0.58, w:0.26, h:0, line:{color:accent, transparency:34, width:0.42, endArrowType:'triangle'} });
  });
  addText(slide, s.note || '流程板适合步骤较多、每一步都需要说明动作与产出的材料。', { x:0.96, y:6.46, w:8.40, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function timelineAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'pathway-rail');
  if (variant === 'flywheel' || variant === 'operating-loop') return timelineFlywheel(slide, plan, s, idx);
  if (variant === 'closed-loop') return timelineClosedLoop(slide, plan, s, idx);
  if (variant === 'process-board') return timelineProcessBoard(slide, plan, s, idx);
  return timelineDark(slide, plan, s, idx);
}

function timelineDark(slide, plan, s, idx) {
  // Pathway Timeline v12: Keynote-style rail with unified milestone cards.
  // Number, title and body are one compact group; no alternating scattered labels.
  stageCanvas(slide);
  sectionKicker(slide, 'PATHWAY', 0.84, 0.72, true);
  addText(slide, s.title, { x:0.82, y:1.04, w:7.55, h:0.40, fontSize:23.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, bold:true, color:'64748B', align:'right' });

  const phases = (s.phases || []).slice(0,4);
  const axisY = 4.62;
  const cardXs = [0.98, 3.78, 6.58, 9.38];
  const cardW = 2.36;
  const nodeXs = cardXs.map(x => x + 0.38);
  addHairline(slide, nodeXs[0], axisY, nodeXs[nodeXs.length-1]-nodeXs[0], '334155', 22, 0.72);

  phases.forEach((p,i)=>{
    const nodeX = nodeXs[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===3 ? '94A3B8' : 'A8B3C3'));
    const cardX = cardXs[i];
    const cardY = 2.42;

    // One grouped milestone: num + title on the same baseline, body below.
    addRect(slide, cardX-0.18, cardY-0.10, cardW+0.36, 1.18, C.ink2, '334155', { fill:{color:C.ink2, transparency:72}, line:{color:'334155', transparency:86, width:0.35} });
    addText(slide, String(i+1).padStart(2,'0'), { x:cardX, y:cardY, w:0.34, h:0.14, fontSize:8.0, bold:true, color:accent });
    addText(slide, p.title, { x:cardX+0.48, y:cardY-0.04, w:cardW-0.48, h:0.20, fontSize:12.3, bold:true, color:C.white, fit:'shrink' });
    addText(slide, p.body, { x:cardX+0.48, y:cardY+0.48, w:cardW-0.48, h:0.42, fontSize:8.2, color:'94A3B8', breakLine:true, valign:'top', fit:'shrink' });

    // Connector is a short local cue from the grouped card to the rail.
    const tickTop = cardY + 1.08;
    slide.addShape('line', { x:nodeX, y:tickTop, w:0, h:axisY-tickTop-0.14, line:{color:'334155', transparency:36, width:0.48} });
    slide.addShape('ellipse', { x:nodeX-0.08, y:axisY-0.08, w:0.20, h:0.20, fill:{color:accent}, line:{color:accent, transparency:100} });
  });

  if (s.note) {
    addHairline(slide, 0.86, 6.10, 8.20, '334155', 42, 0.45);
    addText(slide, s.note, { x:0.86, y:6.30, w:8.6, h:0.22, fontSize:12.2, bold:true, color:'CBD5E1' });
  }
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function riskMatrixSlide(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'RISK MATRIX', 0.86, 0.72, false);
  addText(slide, s.title || '风险矩阵', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.3, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const rows = (s.rows || []).slice(0,6);
  const box = { x:0.94, y:2.14, w:5.42, h:3.74 };
  addRect(slide, box.x, box.y, box.w, box.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  addText(slide, '发生概率', { x:box.x+0.12, y:box.y+0.10, w:0.70, h:0.12, fontSize:7.0, color:C.muted, fit:'shrink' });
  addText(slide, '业务影响', { x:box.x+box.w-0.82, y:box.y+box.h+0.10, w:0.74, h:0.12, fontSize:7.0, color:C.muted, fit:'shrink', align:'right' });
  addHairline(slide, box.x+0.52, box.y+box.h-0.42, box.w-0.88, C.line, 4, 0.5);
  slide.addShape('line', { x:box.x+0.52, y:box.y+box.h-0.42, w:0, h:-box.h+0.76, line:{color:C.line, transparency:4, width:0.5} });
  const cells = [
    [box.x+0.76, box.y+2.34, 1.80, 0.88, C.cyan, '低影响 / 可监控'],
    [box.x+2.72, box.y+2.34, 1.80, 0.88, C.accent, '中影响 / 需响应'],
    [box.x+0.76, box.y+1.22, 1.80, 0.88, C.accent, '高概率 / 需治理'],
    [box.x+2.72, box.y+1.22, 1.80, 0.88, C.risk, '高风险 / 优先处置']
  ];
  cells.forEach(([x,y,w,h,color,label],i)=>{
    addRect(slide, x, y, w, h, color, color, { fill:{color, transparency:i===3?82:90}, line:{color, transparency:i===3?42:70, width:0.42} });
    addText(slide, label, { x:x+0.16, y:y+h-0.24, w:w-0.28, h:0.12, fontSize:6.8, color:i===3?C.risk:C.body, align:'left', fit:'shrink' });
  });
  const matrixPins = [
    { x:box.x+1.22, y:box.y+1.40 },
    { x:box.x+4.04, y:box.y+1.38 },
    { x:box.x+3.86, y:box.y+2.46 },
    { x:box.x+1.20, y:box.y+2.52 },
    { x:box.x+2.18, y:box.y+1.42 },
    { x:box.x+4.06, y:box.y+1.74 }
  ];
  rows.forEach((r,i)=>{
    const level = r[1] || '中';
    const color = level === '高' ? C.risk : (level === '低' ? C.cyan : C.accent);
    const fallback = matrixPins[i] || matrixPins[matrixPins.length - 1];
    const pin = level === '高'
      ? { x:box.x+4.02-(i%2)*0.22, y:box.y+1.34+(i%2)*0.18 }
      : (level === '低'
        ? { x:box.x+1.22+(i%2)*0.22, y:box.y+2.50-(i%2)*0.12 }
        : fallback);
    slide.addShape('ellipse', { x:pin.x, y:pin.y, w:0.24, h:0.24, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.55} });
    addText(slide, String(i+1), { x:pin.x+0.02, y:pin.y+0.075, w:0.20, h:0.07, fontSize:5.4, bold:true, color:C.onAccent || 'FFFFFF', align:'center', fit:'shrink' });
  });
  addLabel(slide, 'MITIGATION QUEUE', { x:7.12, y:2.18, w:1.36, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  rows.slice(0,4).forEach((r,i)=>{
    const y = 2.58 + i*0.70;
    const color = r[1] === '高' ? C.risk : (r[1] === '低' ? C.cyan : C.accent);
    addText(slide, String(i+1).padStart(2,'0'), { x:7.12, y:y+0.05, w:0.30, h:0.10, fontSize:6.4, bold:true, color });
    addText(slide, r[0], { x:7.60, y:y, w:1.54, h:0.14, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
    addText(slide, r[2] || '明确责任人与处置节奏。', { x:9.36, y:y, w:1.84, h:0.13, fontSize:7.2, color:C.body, fit:'shrink' });
    addHairline(slide, 7.12, y+0.44, 4.12, C.line, 16, 0.38);
  });
  addText(slide, s.note || '矩阵型风险页适合先判断优先级，再展开重点处置动作。', { x:0.96, y:6.42, w:8.6, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function riskControlStack(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'CONTROL SYSTEM', 0.86, 0.72, false);
  addText(slide, s.title || '治理与保障体系', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.3, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const rows = (s.rows || []).slice(0,6);
  addRect(slide, 0.92, 2.04, 3.00, 4.10, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'GOVERNANCE PRINCIPLE', { x:1.22, y:2.42, w:1.46, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '把风险写进日常机制', { x:1.22, y:2.90, w:1.86, h:0.28, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || '以责任、时限、证据和复盘构成治理闭环。', { x:1.22, y:3.54, w:1.82, h:0.48, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  addHairline(slide, 1.22, 4.52, 0.78, C.accent, 0, 0.68);
  addText(slide, s.note || '适合合规、医疗、金融、政企项目中治理要求较多的页面。', { x:1.22, y:4.92, w:1.86, h:0.38, fontSize:7.0, color:C.darkMuted, breakLine:true, fit:'shrink' });
  const groups = [
    { label:'责任机制', color:C.accent, rows:rows.filter((_,i)=>i%3===0) },
    { label:'过程控制', color:C.cyan, rows:rows.filter((_,i)=>i%3===1) },
    { label:'复盘保障', color:C.violet, rows:rows.filter((_,i)=>i%3===2) }
  ];
  groups.forEach((g,i)=>{
    const x = 4.42 + i*2.46;
    addRect(slide, x, 2.20, 2.08, 3.72, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?g.color:C.line, transparency:i===0?20:16, width:0.46} });
    addRect(slide, x, 2.20, 2.08, 0.04, g.color, g.color, { line:{color:g.color, transparency:100} });
    addLabel(slide, `CONTROL 0${i+1}`, { x:x+0.22, y:2.54, w:0.94, h:0.09, fontSize:5.4, color:g.color, charSpace:0.75 });
    addText(slide, g.label, { x:x+0.22, y:2.86, w:1.20, h:0.16, fontSize:10.8, bold:true, color:C.text, fit:'shrink' });
    (g.rows.length ? g.rows : [{0:g.label, 2:'明确责任人与执行节奏。'}]).slice(0,2).forEach((r,j)=>{
      const y = 3.46 + j*0.86;
      addText(slide, itemTitle({title:r[0]}, `机制 ${j+1}`), { x:x+0.22, y:y, w:1.28, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, r[2] || '明确责任人与执行节奏。', { x:x+0.22, y:y+0.30, w:1.48, h:0.18, fontSize:6.8, color:C.body, fit:'shrink' });
    });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function riskResponsibilityItems(s) {
  const raw = s.responsibilities || s.owners || s.raci || s.accountabilities || s.actions || s.rows || [];
  const list = (Array.isArray(raw) ? raw : []).map((v, i) => {
    if (Array.isArray(v)) {
      return {
        title: v[0],
        level: v[1],
        body: v[2],
        owner: v[3] || ['责任人', '审批人', '执行人', '复盘人'][i % 4],
        cadence: v[4] || ''
      };
    }
    if (typeof v === 'string') return { title:v };
    return v || {};
  }).filter(Boolean);
  return list.length ? list : [
    { title:'定责', owner:'Owner', body:'明确唯一责任人与协作边界。', cadence:'启动即确认' },
    { title:'处置', owner:'Action', body:'按等级和时限推进控制动作。', cadence:'过程跟踪' },
    { title:'留痕', owner:'Evidence', body:'沉淀过程证据和审批记录。', cadence:'节点留存' },
    { title:'复盘', owner:'Review', body:'回看风险变化并更新机制。', cadence:'周期复盘' }
  ];
}

function riskResponsibilityLoop(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'RESPONSIBILITY LOOP', 0.86, 0.72, false);
  addText(slide, s.title || '责任闭环与治理机制', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.3, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const items = riskResponsibilityItems(s);
  const core = { x:0.92, y:2.04, w:2.86, h:4.16 };
  addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'GOVERNANCE CORE', { x:core.x+0.30, y:core.y+0.38, w:1.36, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '责任不落空', { x:core.x+0.30, y:core.y+0.86, w:1.72, h:0.28, fontSize:15.4, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || '把风险、动作、责任人、证据和复盘节奏绑定在同一条治理链上。', {
    x:core.x+0.30, y:core.y+1.44, w:1.92, h:0.62, fontSize:8.8, color:C.captionOnImage, fit:'shrink', breakLine:true
  });
  addHairline(slide, core.x+0.30, core.y+2.36, 0.82, C.accent, 0, 0.62);
  [
    ['OWNER', s.ownerLabel || '唯一责任人'],
    ['SLA', s.slaLabel || '处置时限'],
    ['EVIDENCE', s.evidenceLabel || '过程留痕']
  ].forEach((row,i)=>{
    const y = core.y + 2.72 + i*0.52;
    addLabel(slide, row[0], { x:core.x+0.32, y, w:0.84, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0.42 });
    addText(slide, row[1], { x:core.x+1.18, y:y-0.015, w:1.22, h:0.12, fontSize:7.6, color:'CBD5E1', fit:'shrink' });
  });

  const board = { x:4.24, y:2.04, w:7.28, h:4.16 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
    fill:{color:panelFill(), transparency:0},
    line:{color:C.line, transparency:14, width:0.50}
  });
  addLabel(slide, s.loopLabel || 'RISK · OWNER · ACTION · EVIDENCE · REVIEW', { x:board.x+0.28, y:board.y+0.28, w:2.92, h:0.10, fontSize:6.0, color:C.muted, charSpace:0.72 });

  const cx = board.x + board.w/2;
  const cy = board.y + board.h/2 + 0.10;
  slide.addShape('ellipse', { x:cx-0.68, y:cy-0.34, w:1.36, h:0.68, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:54, width:0.42} });
  addText(slide, s.centerTitle || '责任闭环', { x:cx-0.46, y:cy-0.11, w:0.92, h:0.13, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, s.centerLabel || 'NO ORPHAN RISK', { x:cx-0.56, y:cy+0.10, w:1.12, h:0.08, fontSize:4.7, color:'64748B', align:'center', charSpace:0.42 });

  const slots = [
    { x:board.x+0.48, y:board.y+0.86, color:C.accent, defaultTitle:'定责' },
    { x:board.x+4.28, y:board.y+0.86, color:C.cyan, defaultTitle:'处置' },
    { x:board.x+4.28, y:board.y+2.92, color:C.violet, defaultTitle:'留痕' },
    { x:board.x+0.48, y:board.y+2.92, color:'94A3B8', defaultTitle:'复盘' }
  ];
  const cardW = 2.52;
  const cardH = 1.02;
  slots.forEach((slot,i)=>{
    const it = items[i] || {};
    addRect(slide, slot.x, slot.y, cardW, cardH, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:i===0?0:4},
      line:{color:i===0?slot.color:C.line, transparency:i===0?16:18, width:0.44}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.20, y:slot.y+0.24, w:0.30, h:0.10, fontSize:6.8, color:slot.color });
    addText(slide, itemTitle(it, slot.defaultTitle), { x:slot.x+0.64, y:slot.y+0.18, w:1.02, h:0.15, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, it.owner || it.role || it.accountable || ['责任人', '处置人', '证据人', '复盘人'][i], {
      x:slot.x+1.58, y:slot.y+0.19, w:0.72, h:0.14, fontSize:8.8, color:slot.color, align:'right', fit:'shrink'
    });
    addText(slide, itemBody(it, ['明确责任与边界。', '推进处置动作。', '沉淀过程证据。', '更新治理机制。'][i]), {
      x:slot.x+0.20, y:slot.y+0.56, w:2.02, h:0.20, fontSize:8.8, color:C.body, fit:'shrink'
    });
  });
  addClockwiseLoopConnectors(slide, slots.map(slot => ({ x:slot.x, y:slot.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, '94A3B8'], {
    gap:0.18,
    transparency:30,
    width:0.42
  });

  const note = s.note || '责任闭环页适合 RACI、合规、医疗质量、投后风险和项目治理材料，重点是让每个风险都有责任、证据和复盘节奏。';
  addText(slide, note, { x:0.94, y:6.52, w:9.2, h:0.14, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function riskAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'governance-board');
  if (variant === 'risk-matrix') return riskMatrixSlide(slide, plan, s, idx);
  if (variant === 'control-stack') return riskControlStack(slide, plan, s, idx);
  if (variant === 'responsibility-loop') return riskResponsibilityLoop(slide, plan, s, idx);
  return riskTable(slide, plan, s, idx);
}

function riskTable(slide, plan, s, idx) {
  // Governance board family: readable risks, severity, and concrete response actions.
  lightCanvas(slide);
  sectionKicker(slide, 'GOVERNANCE BOARD', 0.86, 0.72, false);
  addText(slide, s.title, { x:0.84, y:1.05, w:5.2, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const rows = (s.rows || []).slice(0,4);
  const levels = {
    '高': { color:C.risk || 'EF4444', label:'HIGH', zh:'高' },
    '中': { color:C.accent, label:'MEDIUM', zh:'中' },
    '低': { color:C.cyan, label:'LOW', zh:'低' }
  };
  const highCount = rows.filter(r=>r[1]==='高').length;
  const medCount = rows.filter(r=>r[1]==='中').length;
  addRect(slide, 0.92, 2.06, 3.18, 3.96, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'RISK READINESS', { x:1.22, y:2.42, w:1.38, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, '治理优先级', { x:1.22, y:2.78, w:1.42, h:0.18, fontSize:13.2, bold:true, color:C.white, fit:'shrink' });
  addNumber(slide, String(highCount), { x:1.20, y:3.38, w:0.74, h:0.48, fontSize:34, color:C.risk || C.accent, fit:'shrink' });
  addText(slide, '高优先级风险', { x:2.10, y:3.58, w:1.12, h:0.14, fontSize:8.0, color:C.captionOnImage, fit:'shrink' });
  addNumber(slide, String(medCount), { x:1.22, y:4.25, w:0.62, h:0.34, fontSize:23, color:C.accent, fit:'shrink' });
  addText(slide, '需要持续跟踪', { x:2.10, y:4.38, w:1.20, h:0.14, fontSize:8.0, color:C.captionOnImage, fit:'shrink' });
  addHairline(slide, 1.22, 5.08, 0.82, C.accent, 0, 0.62);
  addText(slide, '风险页优先呈现责任、处置和节奏，不把风险压成难读矩阵。', { x:1.22, y:5.38, w:2.10, h:0.28, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });

  addLabel(slide, 'CONTROL ACTIONS', { x:4.58, y:2.12, w:1.36, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addHairline(slide, 4.58, 2.42, 6.64, C.line, 14, 0.55);
  rows.forEach((r,i)=>{
    const [risk, level, response] = r;
    const meta = levels[level] || levels['中'];
    const y = 2.68 + i*0.78;
    addRect(slide, 4.58, y, 6.82, 0.58, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:i===1?0:8},
      line:{color:i===1?meta.color:C.line, transparency:i===1?24:14, width:i===1?0.55:0.42}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:4.86, y:y+0.20, w:0.32, h:0.10, fontSize:6.8, color:meta.color });
    addText(slide, risk, { x:5.36, y:y+0.14, w:1.80, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
    addRect(slide, 7.46, y+0.18, 0.76, 0.20, meta.color, meta.color, { fill:{color:meta.color, transparency:8}, line:{color:meta.color, transparency:100} });
    addText(slide, meta.zh, { x:7.46, y:y+0.235, w:0.76, h:0.08, fontSize:5.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink' });
    addText(slide, response || '明确责任人与处置节奏。', { x:8.56, y:y+0.14, w:2.34, h:0.15, fontSize:8.2, color:C.body, fit:'shrink' });
  });
  addRect(slide, 4.58, 5.92, 6.82, 0.46, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.42} });
  addText(slide, '保障机制', { x:4.86, y:6.08, w:0.86, h:0.12, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.note || '以数据责任、跨部门协同、分批集成和上线培训构成风险闭环。', { x:5.96, y:6.06, w:4.72, h:0.14, fontSize:7.8, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}
function renderSlide(pptx, plan, s, idx) {
  const slide = pptx.addSlide();
  const type = s.type || 'executive-blocks';
  const industryRenderer = industryRendererFor(plan, s);
  if (industryRenderer) return industryRenderer(slide, plan, s, idx);
  if (type === 'cover' || type === 'cover-dark') return coverDark(slide, plan, s);
  if (type === 'closing' || type === 'closing-dark') return closingAdaptive(slide, plan, s, idx);
  if (type === 'chapter-divider') return chapterDivider(slide, plan, s, idx);
  if (type === 'toc' || type === 'toc-clean') return tocClean(slide, plan, s, idx);
  if (type === 'comparison') return comparisonSlide(slide, plan, s, idx);
  if (type === 'profile-proof') return profileProof(slide, plan, s, idx);
  if (type === 'quote-proof') return quoteProof(slide, plan, s, idx);
  if (type === 'two-column' || type === 'two-column-clean') return twoColumnClean(slide, plan, s, idx);
  if (type === 'report-board') return reportBoard(slide, plan, s, idx);
  if (type === 'cards' || type === 'executive-blocks') return executiveBlocks(slide, plan, s, idx);
  if (type === 'product-showcase') return productShowcase(slide, plan, s, idx);
  if (type === 'metric-comparison') return metricComparison(slide, plan, s, idx);
  if (type === 'industry-chart') return industryChartSlide(slide, plan, s, idx);
  if (type === 'finance-bridge') return financeBridgeSlide(slide, plan, s, idx);
  if (type === 'portfolio-table') return portfolioTableSlide(slide, plan, s, idx);
  if (type === 'strategy-map') return strategyMap(slide, plan, s, idx);
  if (type === 'manifesto') return manifestoSlide(slide, plan, s, idx);
  if (type === 'module-matrix') return moduleMatrix(slide, plan, s, idx);
  if (type === 'architecture' || type === 'architecture-dark') return architectureAdaptive(slide, plan, s, idx);
  if (type === 'timeline' || type === 'timeline-dark') return timelineAdaptive(slide, plan, s, idx);
  if (type === 'value-tiles') return valueTiles(slide, plan, s, idx);
  if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') return caseGallery(slide, plan, s, idx);
  if (type === 'table' || type === 'risk-table') return riskAdaptive(slide, plan, s, idx);
  masterLight(slide, plan, s.title || '未命名页面', idx);
  const runs = (s.bullets || s.items || []).map(v => ({ text:String(v), options:{ bullet:{type:'bullet'}, breakLine:true } }));
  slide.addText(runs, { x:1.0, y:1.8, w:10.8, h:4.2, fontFace:PROFILE.font, fontSize:14, color:C.body, fit:'shrink', valign:'top', paraSpaceAfterPt:8, margin:0.02 });
}
async function main() {
  const { plan, out } = argParse();
  const workingPlan = normalizeDeckPlan(plan);
  DESIGN = makeDeckContext(workingPlan);
  PROFILE = DESIGN.profile;
  C = DESIGN.colors;
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
  console.log(JSON.stringify({
    success:true,
    output:out,
    slides:(workingPlan.slides || []).length,
    style: workingPlan.style || PROFILE.name,
    palette: PROFILE.palette
  }, null, 2));
}
main().catch(err => { console.error(err.stack || String(err)); process.exit(1); });
