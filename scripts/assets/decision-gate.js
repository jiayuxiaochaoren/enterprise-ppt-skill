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
const {
  assetTargetContract
} = require('../design/asset-generation');
const {
  assetDecisionStateFor
} = require('../design/asset-decision-state');
const {
  bindGeneratedAssets
} = require('./binder');
const { MATRIX_VERSION, POLICY_VERSION, policyRowsForTypes } = require('../qa/quality-severity-policy');

const ASSET_POLICY_TYPES = [
  'skippedCriticalAsset',
  'weakImageAsset',
  'assetAuthorizationUnknown',
  'assetAuthorizationUnresolved',
  'assetAuthorizationBlocked',
  'generatedAssetCannotSatisfyFactualProof'
];
const ASSET_DECISION_GATE_SOURCE = 'asset-decision-gate/v1';

function providedAssetsForAnswer(answer = {}) {
  const assets = Array.isArray(answer.assets)
    ? answer.assets.filter(Boolean)
    : [answer.asset || answer.path].filter(Boolean);
  return assets;
}

function decorateProvidedAsset(item, question = {}, answer = {}) {
  const spec = typeof item === 'string' ? { path: item } : Object.assign({}, item || {});
  return Object.assign({
    type: answer.type || 'user-owned',
    source: answer.source || 'user-provided asset via asset decision gate',
    role: question.role,
    target: question.assetTarget,
    allowAspectMismatch: answer.allowAspectMismatch === true || spec.allowAspectMismatch === true || undefined
  }, spec);
}

function bindingSpecForAnswer(question = {}, answer = {}) {
  const assets = providedAssetsForAnswer(answer);
  if (!assets.length) return null;
  const common = {
    type: answer.type || 'user-owned',
    source: answer.source || 'user-provided asset via asset decision gate',
    role: question.role,
    target: question.assetTarget,
    targetAspectRatio: question.assetTarget && question.assetTarget.aspectRatio,
    targetSlot: question.assetTarget && question.assetTarget.slot,
    allowAspectMismatch: answer.allowAspectMismatch === true || undefined
  };
  if (assets.length > 1 || question.role === 'gallery') {
    return Object.assign({}, common, {
      mode: 'photo',
      images: assets.map(item => decorateProvidedAsset(item, question, answer))
    });
  }
  return Object.assign({}, common, decorateProvidedAsset(assets[0], question, answer));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), text, 'utf8');
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

function assetDecisionForGeneration(generation = {}) {
  if (generation && generation.assetDecisionState && generation.assetDecisionState.version) {
    return generation.assetDecisionState;
  }
  return assetDecisionStateFor({
    status: generation.status,
    blocked: generation.status === 'blocked',
    mustBind: generation.mustBind === true,
    factual: generation.factualRequired === true || generation.factualRisk === true,
    structureOnly: generation.structureOnly === true,
    target: generation.target,
    reason: generation.reason
  });
}

function questionFor(plan = {}, slide = {}, idx = 0) {
  const role = visualRole(plan, slide);
  const generation = slide.assetGeneration || {};
  const decisionState = assetDecisionForGeneration(generation);
  const refRole = slide.referenceRecipe && slide.referenceRecipe.assetRole;
  const prompt = promptForSlide(plan, slide);
  const target = generation.target || assetTargetContract(plan, slide, generation.originalRole || role || refRole || 'showcase', {
    resolvedRole: generation.resolvedRole || generation.role || role
  });
  const effectiveRole = role === 'structure' && target.originalRole ? target.originalRole : (role || refRole || 'showcase');
  const required = decisionState.blocking || generation.status === 'required' || generation.mustBind === true;
  const title = slide.title || slide.claim || `第 ${idx + 1} 页`;
  const isFactualBlocked = decisionState.factual || generation.status === 'blocked';
  const severityFindingType = isFactualBlocked || required ? 'skippedCriticalAsset' : 'weakImageAsset';
  const optionLabels = {
    provide_assets: {
      label: '用户提供素材',
      effect: '绑定真实产品图、场景图、截图或授权图片；可作为事实证据使用。'
    },
    auto_generate: {
      label: '模型自动生成',
      effect: '生成通用/示意性高质量图片；只能承担氛围、类别或概念视觉，不能冒充真实品牌、客户、现场、证书或数据。'
    },
    skip_image: {
      label: '跳过图片',
      effect: '改成结构图、指标页或文本证据页；不在可见页面放几何占位图。'
    }
  };
  const options = (decisionState.allowedActions || []).map(action => Object.assign({ action }, optionLabels[action])).filter(option => option.label);
  return {
    id: `slide_${idx + 1}_asset`,
    slide: idx + 1,
    title,
    type: slide.type || '',
    layoutVariant: slide.layoutVariant || slide.variant || '',
    role: effectiveRole,
    originalRole: target.originalRole || generation.originalRole || effectiveRole,
    resolvedRole: target.resolvedRole || generation.resolvedRole || generation.role || role || refRole || 'showcase',
    assetTarget: target,
    priority: required || isFactualBlocked ? 'blocking' : 'recommended',
    status: 'unresolved',
    blocked: decisionState.status === 'blocked',
    factual: isFactualBlocked,
    assetDecisionState: decisionState,
    question: !decisionState.canAutoGenerate
      ? `第 ${idx + 1} 页「${title}」需要事实视觉素材。请选择：提供可用图片，或跳过图片改结构页。`
      : `第 ${idx + 1} 页「${title}」需要视觉素材。请选择：提供可用图片、跳过图片改结构页，或自动生成示意图。`,
    options,
    allowedActions: options.map(option => option.action),
    recommendedAction: decisionState.recommendedAction || (isFactualBlocked ? 'provide_assets' : 'auto_generate'),
    generatedAssetPrompt: decisionState.canAutoGenerate ? prompt : '',
    severityFindingType,
    severityPolicy: policyRowsForTypes([severityFindingType])[0] || null,
    reason: generation.reason || 'image-led page family has no bound visual asset'
  };
}

function buildGate(planPath, answersPath = '', opts = {}) {
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
    const decisionState = assetDecisionForGeneration(generation);
    const generationResolvedRole = String(generation.resolvedRole || generation.role || '').toLowerCase();
    const generationStructureOnly = decisionState.status === 'structure-only' || (generation.status === 'none' &&
      generation.mustBind !== true &&
      ['abstract', 'none', 'structure', 'diagram'].includes(generationResolvedRole));
    const needsImage = decisionState.needsUserDecision ||
      (!generation.assetDecisionState && !generationStructureOnly && (wantsImage || assetRoleNeedsImage(refRole)));
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
        const bindSpec = bindingSpecForAnswer(q, answer);
        if (!bindSpec) {
          unresolved.push(Object.assign({}, q, { reason: 'provide_assets selected but no asset path was supplied' }));
          return;
        }
        const bindResult = bindGeneratedAssets(Object.assign({}, rawPlan, { slides: resolvedSlides }), {
          [String(q.slide)]: bindSpec
        }, {
          cwd: opts.cwd || process.cwd()
        });
        if (bindResult.errors && bindResult.errors.length) {
          unresolved.push(Object.assign({}, q, {
            status: 'error',
            reason: 'provide_assets failed asset binding validation',
            errors: bindResult.errors
          }));
          return;
        }
        slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, {
          gateDecisionSource: ASSET_DECISION_GATE_SOURCE
        });
      } else if (answer.action === 'auto_generate') {
        slide.visual = Object.assign({}, slide.visual || {}, { mode: 'generated', role: q.role });
        slide.generatedAssetPrompt = answer.prompt || q.generatedAssetPrompt || promptForSlide(normalized, normalized.slides[q.slide - 1] || slide);
        slide.assetGeneration = Object.assign({}, slide.assetGeneration || {}, {
          decisionSource: ASSET_DECISION_GATE_SOURCE,
          status: 'required',
          assetDecisionState: assetDecisionStateFor({ status:'required', mustBind:true, target:q.assetTarget, reason:'user chose automatic synthetic asset generation' }),
          role: q.role,
          originalRole: q.originalRole || q.role,
          resolvedRole: q.resolvedRole || q.role,
          target: q.assetTarget,
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
          decisionSource: ASSET_DECISION_GATE_SOURCE,
          status: 'none',
          assetDecisionState: assetDecisionStateFor({ status:'structure-only', structureOnly:true, target:q.assetTarget, reason:'user chose to skip visual asset and use native structure' }),
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

function assetDecisionMarkdown(gate = {}) {
  const questions = Array.isArray(gate.questions) ? gate.questions : [];
  const lines = [
    `# 资产决策清单`,
    '',
    `- Deck: ${gate.deckTitle || '未命名'}`,
    `- Industry: ${gate.industry || 'unknown'}`,
    `- Status: ${gate.status || 'unknown'}`,
    `- Questions: ${questions.length}`,
    '',
    '## 决策项',
    ''
  ];
  if (!questions.length) {
    lines.push('当前没有未解决的视觉素材决策。');
  } else {
    lines.push('| Slide | Priority | Title | Role | Factual | Allowed actions | Recommended | Reason |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    questions.forEach(q => {
      lines.push([
        q.slide,
        q.priority || '',
        String(q.title || '').replace(/\|/g, '/'),
        q.role || '',
        q.factual || q.blocked ? 'yes' : 'no',
        (q.allowedActions || []).join(', '),
        q.recommendedAction || '',
        String(q.reason || '').replace(/\|/g, '/')
      ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
    });
    lines.push('');
    lines.push('## 操作说明');
    lines.push('');
    lines.push('- `provide_assets`: 绑定用户提供的真实产品图、截图、现场图或授权图片。');
    lines.push('- `auto_generate`: 只用于非事实的示意/氛围/类别视觉；事实素材决策项不会提供这个选项。');
    lines.push('- `skip_image`: 改用结构页或文本/指标证据，不在页面放几何占位图。');
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildGateFromFiles({ planPath, answersPath = '', outPath = '', outPlanPath = '', summaryPath = '', cwd = process.cwd() }) {
  const gate = buildGate(planPath, answersPath, { cwd });
  if (outPath) writeJson(outPath, gate);
  if (outPlanPath && gate.resolvedPlan) writeJson(outPlanPath, gate.resolvedPlan);
  if (summaryPath) writeText(summaryPath, assetDecisionMarkdown(gate));
  return gate;
}

module.exports = {
  ASSET_DECISION_GATE_SOURCE,
  ASSET_POLICY_TYPES,
  assetRoleNeedsImage,
  assetDecisionMarkdown,
  buildGate,
  buildGateFromFiles,
  hasBoundAsset,
  promptForSlide,
  questionFor,
  readJson,
  writeJson,
  writeText
};
