const fs = require('fs');
const path = require('path');
const {
  generatedAssetPrompt,
  makeDeckContext,
  mediaForRole,
  normalizeDeckPlan,
  resolveAssetPath,
  slideWantsImage,
  visualRole
} = require('../design-system');
const { MATRIX_VERSION, POLICY_VERSION, policyRowsForTypes } = require('../qa/quality-severity-policy');

const ASSET_POLICY_TYPES = [
  'skippedCriticalAsset',
  'weakImageAsset',
  'assetAuthorizationUnknown',
  'assetAuthorizationUnresolved',
  'assetAuthorizationBlocked',
  'generatedAssetCannotSatisfyFactualProof'
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), `${JSON.stringify(data, null, 2)}\n`);
}

function assetRoleNeedsImage(role = '') {
  const r = String(role || '').toLowerCase();
  if (!r || ['none', 'diagram', 'structure', 'comparison'].includes(r)) return false;
  if (r.includes('none-or') || r.includes('or-none')) return false;
  return true;
}

function hasBoundAsset(slide = {}, plan = {}, role = '') {
  const direct = (slide.visual && slide.visual.image) || slide.image || '';
  const gallery = [
    ...(Array.isArray(slide.images) ? slide.images : []),
    ...((slide.visual && Array.isArray(slide.visual.images)) ? slide.visual.images : [])
  ];
  const media = mediaForRole(plan, slide, role);
  return [direct, media, ...gallery].some(ref => {
    const resolved = resolveAssetPath(ref);
    return resolved && fs.existsSync(resolved);
  });
}

function promptForSlide(plan = {}, slide = {}) {
  return slide.generatedAssetPrompt || generatedAssetPrompt(plan, slide, slide.referenceRecipe || null);
}

function questionFor(plan = {}, slide = {}, idx = 0) {
  const role = visualRole(plan, slide);
  const generation = slide.assetGeneration || {};
  const refRole = slide.referenceRecipe && slide.referenceRecipe.assetRole;
  const prompt = promptForSlide(plan, slide);
  const required = generation.status === 'required' || generation.mustBind === true;
  const title = slide.title || slide.claim || `第 ${idx + 1} 页`;
  const isFactualBlocked = generation.status === 'blocked';
  const severityFindingType = isFactualBlocked || required ? 'skippedCriticalAsset' : 'weakImageAsset';
  const options = [
    {
      action: 'provide_assets',
      label: '用户提供素材',
      effect: '绑定真实产品图、场景图、截图或授权图片；可作为事实证据使用。'
    },
    !isFactualBlocked ? {
      action: 'auto_generate',
      label: '模型自动生成',
      effect: '生成通用/示意性高质量图片；只能承担氛围、类别或概念视觉，不能冒充真实品牌、客户、现场、证书或数据。'
    } : null,
    {
      action: 'skip_image',
      label: '跳过图片',
      effect: '改成结构图、指标页或文本证据页；不在可见页面放几何占位图。'
    }
  ].filter(Boolean);
  return {
    id: `slide_${idx + 1}_asset`,
    slide: idx + 1,
    title,
    type: slide.type || '',
    layoutVariant: slide.layoutVariant || slide.variant || '',
    role: role || refRole || 'showcase',
    priority: required || isFactualBlocked ? 'blocking' : 'recommended',
    status: 'unresolved',
    blocked: isFactualBlocked,
    question: isFactualBlocked
      ? `第 ${idx + 1} 页「${title}」需要事实视觉素材。请选择：提供可用图片，或跳过图片改结构页。`
      : `第 ${idx + 1} 页「${title}」需要视觉素材。请选择：提供可用图片、跳过图片改结构页，或自动生成示意图。`,
    options,
    allowedActions: options.map(option => option.action),
    recommendedAction: isFactualBlocked ? 'provide_assets' : 'auto_generate',
    generatedAssetPrompt: isFactualBlocked ? '' : prompt,
    severityFindingType,
    severityPolicy: policyRowsForTypes([severityFindingType])[0] || null,
    reason: generation.reason || 'image-led page family has no bound visual asset'
  };
}

function buildGate(planPath, answersPath = '') {
  const rawPlan = readJson(planPath);
  const normalized = normalizeDeckPlan(rawPlan);
  makeDeckContext(rawPlan);
  const questions = [];
  const resolvedSlides = (rawPlan.slides || []).map((slide, i) => {
    const normalizedSlide = normalized.slides[i] || slide;
    const role = visualRole(normalized, normalizedSlide);
    const wantsImage = slideWantsImage(normalized, normalizedSlide, normalizedSlide.type);
    const generation = normalizedSlide.assetGeneration || {};
    const refRole = normalizedSlide.referenceRecipe && normalizedSlide.referenceRecipe.assetRole;
    const needsImage = wantsImage || assetRoleNeedsImage(refRole) || ['required', 'optional', 'blocked'].includes(generation.status || '');
    if (needsImage && !hasBoundAsset(normalizedSlide, normalized, role)) {
      questions.push(questionFor(normalized, normalizedSlide, i));
    }
    return Object.assign({}, slide);
  });

  const answers = answersPath && fs.existsSync(path.resolve(answersPath)) ? readJson(answersPath) : null;
  const answerMap = (answers && (answers.decisions || answers.answers)) || {};
  const unresolved = [];
  if (answers) {
    questions.forEach(q => {
      const answer = answerMap[String(q.slide)] || answerMap[q.id] || {};
      const slide = resolvedSlides[q.slide - 1];
      if (!answer.action) {
        unresolved.push(q);
        return;
      }
      if (Array.isArray(q.allowedActions) && !q.allowedActions.includes(answer.action)) {
        unresolved.push(Object.assign({}, q, {
          status: 'error',
          reason: `action ${answer.action} is not allowed for this asset decision`
        }));
        return;
      }
      if (answer.action === 'provide_assets') {
        const assets = Array.isArray(answer.assets) ? answer.assets.filter(Boolean) : [answer.asset || answer.path].filter(Boolean);
        if (!assets.length) {
          unresolved.push(Object.assign({}, q, { reason: 'provide_assets selected but no asset path was supplied' }));
          return;
        }
        if (assets.length > 1 || q.role === 'gallery') {
          slide.images = assets;
          slide.visual = Object.assign({}, slide.visual || {}, { mode: 'photo', role: q.role === 'abstract' ? 'gallery' : q.role });
        } else {
          slide.visual = Object.assign({}, slide.visual || {}, { mode: 'photo', role: q.role, image: assets[0] });
        }
        slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, { status: 'bound', bound: true, boundCount: assets.length });
      } else if (answer.action === 'auto_generate') {
        slide.visual = Object.assign({}, slide.visual || {}, { mode: 'generated', role: q.role });
        slide.generatedAssetPrompt = answer.prompt || q.generatedAssetPrompt || promptForSlide(normalized, normalized.slides[q.slide - 1] || slide);
        slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, {
          status: 'required',
          role: q.role,
          mustBind: true,
          syntheticOnly: true,
          reason: 'user chose automatic synthetic asset generation'
        });
      } else if (answer.action === 'skip_image') {
        delete slide.image;
        delete slide.images;
        delete slide.generatedAssetPrompt;
        slide.visual = Object.assign({}, slide.visual || {}, { mode: 'solid', role: q.role });
        slide.visualMode = 'solid';
        slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, {
          status: 'none',
          role: q.role,
          mustBind: false,
          reason: 'user chose to skip visual asset and use native structure'
        });
      } else {
        unresolved.push(Object.assign({}, q, { reason: `unknown action: ${answer.action}` }));
      }
    });
  } else {
    unresolved.push(...questions);
  }

  return {
    version: 'deck-asset-decision-gate/v1',
    plan: path.relative(process.cwd(), path.resolve(planPath)),
    deckTitle: normalized.title || rawPlan.title || '',
    industry: normalized.industry || rawPlan.industry || '',
    status: unresolved.length ? 'needs_user_input' : 'ready',
    canContinueWithoutAnswers: !unresolved.some(q => q.priority === 'blocking'),
    questionCount: unresolved.length,
    questions: unresolved,
    resolvedCount: questions.length - unresolved.length,
    workflow: [
      'Ask the user each unresolved question.',
      'If user provides assets, bind them through scripts/bind_generated_assets.js or this gate with provide_assets.',
      'If user chooses auto_generate, run scripts/asset_prompt_planner.js, generate images with Codex imagegen, then bind outputs before PPTX rendering.',
      'If user chooses skip_image, render the page as native structure and keep missing proof out of visible slides.'
    ],
    severityPolicy: {
      version: POLICY_VERSION,
      matrixVersion: MATRIX_VERSION,
      relevantTypes: ASSET_POLICY_TYPES,
      matrix: policyRowsForTypes(ASSET_POLICY_TYPES)
    },
    resolvedPlan: answers ? Object.assign({}, rawPlan, { slides: resolvedSlides }) : undefined
  };
}

function buildGateFromFiles({ planPath, answersPath = '', outPath = '', outPlanPath = '' }) {
  const gate = buildGate(planPath, answersPath);
  if (outPath) writeJson(outPath, gate);
  if (outPlanPath && gate.resolvedPlan) writeJson(outPlanPath, gate.resolvedPlan);
  return gate;
}

module.exports = {
  ASSET_POLICY_TYPES,
  assetRoleNeedsImage,
  buildGate,
  buildGateFromFiles,
  hasBoundAsset,
  promptForSlide,
  questionFor,
  readJson,
  writeJson
};
