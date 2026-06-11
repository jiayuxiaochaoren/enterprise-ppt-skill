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
const { createChromeHelpers } = require('./render/chrome-helpers');
const { createRendererApi } = require('./render/renderer-api');
const { createRenderRuntime } = require('./render/render-runtime');
const {
  compactRenderMatch,
  isStrictRenderMode,
  normalizationModeFor,
  qualityModeForPlan,
  routeSensitiveDiffs,
  shortHash
} = require('./render/route-metadata');
const {
  attachRenderRoute,
  renderRouteForSlide
} = require('./render/render-route');
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
const {
  industryVisualGrammarDecisionFor
} = require('./render/industry-visual-grammar');
const {
  canonicalIndustryEvidenceChainForSlide,
  coverageStatusForComponents
} = require('./design/industry-evidence-chain');

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
  effectiveComponentModesFor,
  renderKpiStrip,
  renderChartSpec,
  renderProductMatrix,
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
let textRenderHelpers = null;
const chromeHelpers = createChromeHelpers({
  fs,
  FONT_STACK,
  MEDIA_ASSETS,
  canvasHeight: () => H,
  canvasWidth: () => W,
  colors: () => C,
  compactEvidenceCaption,
  containsCjk,
  copyPolicyText,
  design: () => DESIGN,
  imageDimensions,
  itemBody,
  itemTitle,
  localizeMicrocopy,
  mediaForRole,
  normalizeTypographyOptions,
  profile: () => PROFILE,
  renderKpiStrip,
  renderState: () => CURRENT_RENDER,
  resolveAssetPath,
  resolveTypeToken,
  slideSemanticText,
  slideWantsImage,
  stripEllipsisText,
  textHelpers: () => textRenderHelpers,
  visualIndustryId,
  visualRole,
  zone,
  zoneBounds
});
const {
  addText,
  activePlan,
  addCaptionBar,
  addLabel,
  addRect,
  addSmartPhotoPanel,
  compactText,
  componentRendererContext,
  finalizeSlideChrome,
  MetricStrip,
  panelFill,
  ProcessRail,
  slideRenderedDark,
  SourceNote,
  typeSize,
} = chromeHelpers;
textRenderHelpers = createTextRenderHelpers({
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
  renderProductMatrix,
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
const baseRendererApi = createRendererApi({
  fs,
  chromeHelpers,
  colors: () => C,
  canvasWidth: () => W,
  canvasHeight: () => H,
  copyPolicyList,
  compactEvidenceCaption,
  chooseEvidenceImageLayout,
  chooseFourImageLayout,
  formatMetricDelta,
  itemBody,
  itemBodyNoEllipsis,
  itemTitle,
  publicSlideNote,
  recordChartConsumption,
  reportBoardNeedsRightOverlayRail,
  routeChartSpec,
  renderChartSpec,
  chartSpecToComponentId,
  variantOf,
  galleryImages,
  mediaForRole,
  resolveAssetPath,
  slideWantsImage
});
let RENDER_RUNTIME = null;
function renderRuntime() {
  if (!RENDER_RUNTIME) RENDER_RUNTIME = createRenderRuntime(baseRendererApi);
  return RENDER_RUNTIME;
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
  const canonicalIndustryEvidenceChain = canonicalIndustryEvidenceChainForSlide(plan, s);
  const industryEvidenceChain = canonicalIndustryEvidenceChain && canonicalIndustryEvidenceChain.stageId !== 'neutral-general'
    ? canonicalIndustryEvidenceChain
    : null;
  const industryEvidenceComponents = new Set((industryEvidenceChain && industryEvidenceChain.components) || []);
  const industryEvidenceForComponent = (id, result = {}) => {
    if (!industryEvidenceChain || !industryEvidenceComponents.has(id)) return {};
    const rendered = result && result.rendered;
    const countFallback = rendered && result.drawnCount == null && result.itemCount == null ? 1 : null;
    const meta = {
      chainStage: industryEvidenceChain.stageId || '',
      chainStageLabel: industryEvidenceChain.stageLabel || '',
      evidenceReason: (industryEvidenceChain.evidenceReasons || []).join('; '),
      industryEvidenceChain: {
        chainId: industryEvidenceChain.chainId || '',
        stageId: industryEvidenceChain.stageId || '',
        stageLabel: industryEvidenceChain.stageLabel || ''
      }
    };
    if (countFallback != null) {
      meta.drawnCount = countFallback;
      meta.itemCount = countFallback;
    }
    return meta;
  };
  const consumed = planned.map(component => {
    let result = renderOverlayComponent(slide, plan, s, idx, component.id, nativeIds, contract, renderedOverlays);
    if (component.required === false && result && (
      /^blocked-/.test(String(result.mode || '')) ||
      result.mode === 'native-claimed-undrawn'
    )) {
      result = {
        id: component.id,
        mode: 'optional-not-rendered',
        rendered: false,
        reason: result.reason || 'optional component dropped because no safe renderer evidence was available'
      };
    }
    if (result && result.rendered && result.mode === 'overlay') {
      renderedOverlays.push(Object.assign({ id:component.id }, result.bbox || overlaySlotForComponent(contract, component.id) || {}));
    }
    return Object.assign({
      id: component.id,
      required: component.required !== false,
      role: component.role || '',
      coverageRole: component.coverageRole || component.coverage_role || '',
      coveragePolicy: component.coveragePolicy || component.coverage_policy || null
    }, result, industryEvidenceForComponent(component.id, result));
  });
  const industryEvidenceCoverage = industryEvidenceChain ? {
    version: 'industry-evidence-coverage/v1',
    coveragePolicy: industryEvidenceChain.coveragePolicy || null,
    plannedStatus: coverageStatusForComponents(industryEvidenceChain.coveragePolicy || {}, planned.map(component => component.id)),
    consumedStatus: coverageStatusForComponents(
      industryEvidenceChain.coveragePolicy || {},
      consumed.filter(component => component.rendered).map(component => component.id)
    )
  } : null;
  const plannedChartSpec = !nativeVariantSuppressesChartMeta(s) && slideHasChartSpecIntent(s)
    ? (s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length }) || null)
    : null;
  RENDER_META.slides.push({
    slide: idx,
    type: s.type || '',
    layoutVariant: s.layoutVariant || s.variant || '',
    proofObject: s.proofObject || s.proof_object || (s.proof && s.proof.id) || '',
    sourceTrace: s.sourceTrace || null,
    proof: s.proof || null,
    industryEvidenceChain,
    industryEvidenceCoverage,
    industryVisualGrammar: industryVisualGrammarDecisionFor(plan, s),
    renderRoute: slide.__codexRenderRoute || s.renderRoute || null,
    assetDecision: assetDecisionForMeta(plan, s, slide),
    rendererMatch: slide.__codexRendererMatch || null,
    routeSanitization: s.routeSanitization || s.normalizationAudit || null,
    textBoxes: slide.__codexTextBoxes || [],
    chartSpec: compactChartSpecForMeta(plannedChartSpec),
    chartConsumption: slide.__codexChartConsumption || null,
    nativeRendererContract: contract,
    decorations: slide.__codexDecorations || [],
    plannedComponents: planned.map(c => {
      const capability = componentCapabilityFor(c.id) || {};
      const effectiveModes = effectiveComponentModesFor(c.id);
      const supportedModes = effectiveModes.length ? effectiveModes : (c.supportedModes || capability.supportedModes || []);
      const requestedAllowedModes = c.allowedModes || c.allowed_modes || c.supportedModes;
      const allowedModes = Array.isArray(requestedAllowedModes) && requestedAllowedModes.length
        ? requestedAllowedModes.filter(mode => supportedModes.includes(mode))
        : supportedModes;
      return {
        id:c.id,
        required:c.required !== false,
        role:c.role || '',
        source:c.source || '',
        supportedModes,
        allowedModes: allowedModes.length ? allowedModes : supportedModes,
        ownershipPolicy:c.ownershipPolicy || capability.ownershipPolicy || '',
        dataRequirements:c.dataRequirements || [],
        slotPolicy:c.slotPolicy || c.slot_policy || '',
        repairPolicy:c.repairPolicy || c.repair_policy || '',
        priority:c.priority || (c.required === false ? 'optional' : 'required'),
        coverageRole:c.coverageRole || c.coverage_role || '',
        coveragePolicy:c.coveragePolicy || c.coverage_policy || null
      };
    }),
    unknownComponents: (s.componentPlan && Array.isArray(s.componentPlan.unknownComponents)) ? s.componentPlan.unknownComponents : [],
    drawnComponents: consumed
      .filter(c => c.rendered && c.mode === 'native-renderer')
      .map(c => ({
        id:c.id,
        nativeSlot:c.nativeSlot || '',
        drawnCount:c.drawnCount || 0,
        itemCount:c.itemCount || c.drawnCount || 0,
        bbox:c.bbox || null,
        rendererModule:c.rendererModule || '',
        rendererMethod:c.rendererMethod || '',
        evidence:c.evidence || '',
        chainStage:c.chainStage || '',
        chainStageLabel:c.chainStageLabel || '',
        evidenceReason:c.evidenceReason || '',
        industryEvidenceChain:c.industryEvidenceChain || null
      })),
    consumedComponents: consumed,
    missingRequiredComponents: consumed.filter(c => c.required && !c.rendered).map(c => c.id)
  });
}
function renderSlide(pptx, plan, s, idx) {
  const slide = pptx.addSlide();
  CURRENT_RENDER = { plan, slide:s, idx };
  const type = s.type || 'executive-blocks';
  const runtime = renderRuntime();
  const renderMatch = runtime.industryRendererMatchFor(plan, s, type) || runtime.slideRenderRegistry().matchFor(type);
  if (!renderMatch || !renderMatch.render) {
    throw new Error(`No renderer registered for slide type: ${type}`);
  }
  if (isStrictRenderMode(plan) && renderMatch.matchKind === 'fallback') {
    throw new Error(`Strict render mode disallows fallback renderer for slide type: ${type}`);
  }
  const renderer = renderMatch.render;
  slide.__codexRendererMatch = compactRenderMatch(renderMatch);
  const renderRoute = renderRouteForSlide(plan, s, idx, { renderMatch: slide.__codexRendererMatch });
  slide.__codexRenderRoute = renderRoute;
  attachRenderRoute(s, renderRoute);
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
  RENDER_RUNTIME = null;
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
