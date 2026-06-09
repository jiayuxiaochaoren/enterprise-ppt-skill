const ASSET_GENERATION_DECISION_SOURCE = 'asset-generation-policy/v1';
const ASSET_TARGET_CONTRACT_VERSION = 'asset-target-contract/v1';
const {
  imageSlotTargetForSlide
} = require('../render/image-slot-registry');

const ROLE_FALLBACK_TARGETS = Object.freeze({
  background: { slot:{ w:13.333, h:7.5 }, fitPolicy:'cover' },
  showcase: { slot:{ w:5.38, h:3.4 }, fitPolicy:'cover' },
  evidence: { slot:{ w:4.7, h:3.1 }, fitPolicy:'cover' },
  gallery: { slot:{ w:4.34, h:2.68 }, fitPolicy:'cover' },
  split: { slot:{ w:4.25, h:7.5 }, fitPolicy:'cover' },
  portrait: { slot:{ w:4.25, h:7.5 }, fitPolicy:'cover' },
  abstract: { slot:{ w:5.38, h:3.4 }, fitPolicy:'cover' }
});

function withDecisionSource(policy = {}) {
  return Object.assign({
    decisionSource: ASSET_GENERATION_DECISION_SOURCE
  }, policy || {});
}

function normalizeAssetRole(role = '') {
  const r = String(role || '').toLowerCase();
  if (r.includes('background')) return 'background';
  if (r.includes('split')) return 'showcase';
  if (r.includes('showcase') || r.includes('product')) return 'showcase';
  if (r.includes('gallery')) return 'gallery';
  if (r.includes('evidence') || r.includes('screenshot') || r.includes('map') || r.includes('portrait')) return 'evidence';
  return ['background', 'showcase', 'evidence', 'gallery'].includes(r) ? r : 'abstract';
}

function aspectRatioFrom(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'string') {
    const pair = value.match(/^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/);
    if (pair) return Number(pair[1]) / Math.max(0.01, Number(pair[2]));
  }
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function roundNumber(value, places = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = 10 ** places;
  return Math.round(n * factor) / factor;
}

function cleanSlot(slot = {}) {
  const w = Number(slot && slot.w);
  const h = Number(slot && slot.h);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w:roundNumber(w), h:roundNumber(h) };
}

function orientationForAspect(ratio) {
  if (!ratio) return 'flexible';
  if (ratio < 0.85) return 'vertical';
  if (ratio > 1.35) return 'wide';
  return 'balanced';
}

function minPixelsFor(role = '', orientation = 'flexible') {
  const r = String(role || '').toLowerCase();
  if (orientation === 'vertical') return { w:480, h:900 };
  if (r.includes('background')) return { w:1280, h:720 };
  if (r.includes('gallery')) return { w:800, h:600 };
  return { w:900, h:600 };
}

function targetInstructionFor(contract = {}) {
  const ratio = Number(contract.aspectRatio || 0);
  if (!ratio) return '';
  const rounded = roundNumber(ratio);
  if (contract.orientation === 'vertical') {
    return `Target composition: tall vertical image for a full-height split panel, aspect ratio about ${rounded}:1; keep the subject readable in a narrow crop, no text.`;
  }
  if (contract.orientation === 'wide') {
    return `Target composition: wide landscape image, aspect ratio about ${rounded}:1; keep a clean text-safe zone, no text.`;
  }
  return `Target composition: balanced presentation panel, aspect ratio about ${rounded}:1; keep the subject centered and clear, no text.`;
}

function targetPixelSizeFor(contract = {}) {
  const ratio = Number(contract.aspectRatio || 0);
  if (!ratio) return null;
  const orientation = contract.orientation || orientationForAspect(ratio);
  const min = contract.minPixels || minPixelsFor(contract.resolvedRole || contract.role || '', orientation);
  let w;
  let h;
  if (orientation === 'vertical') {
    h = Math.max(1024, Number(min.h || 0));
    w = Math.round(h * ratio);
    if (w < Number(min.w || 0)) {
      w = Number(min.w || 0);
      h = Math.round(w / ratio);
    }
  } else {
    w = Math.max(1600, Number(min.w || 0));
    h = Math.round(w / ratio);
    if (h < Number(min.h || 0)) {
      h = Number(min.h || 0);
      w = Math.round(h * ratio);
    }
  }
  return { w, h, label:`${w}x${h}` };
}

function imagegenSizeHintFor(contract = {}) {
  if (!contract || !contract.targetPixelSize) return null;
  return {
    orientation: contract.orientation || orientationForAspect(contract.aspectRatio),
    aspectRatio: contract.aspectRatio || null,
    pixelSize: contract.targetPixelSize,
    label: contract.targetPixelSize.label
  };
}

function slotTargetForSlide(s = {}, roleText = '') {
  const rendererTarget = imageSlotTargetForSlide(s);
  if (rendererTarget) return rendererTarget;
  const currentRouteText = [
    s.type,
    s.layoutVariant,
    s.variant,
    s.proofObject,
    s.proof_object,
    s.imageSlotKind,
    s.imageSlot,
    s.rendererImageSlot,
    s.visual && (s.visual.slotKind || s.visual.rendererSlot)
  ].filter(Boolean).join(' ').toLowerCase();
  if (/full-height|side-panel/.test(currentRouteText)) {
    return { role:'split', slot:{ w:4.25, h:7.5 }, fitPolicy:'cover', targetSource:'renderer-slot:split-full-height' };
  }
  if (/split|vertical|portrait|side-panel|full-height/.test(roleText)) {
    return { role:'split', slot:{ w:4.25, h:7.5 }, fitPolicy:'cover', targetSource:'role-fallback:split' };
  }
  return null;
}

function roleFallbackTarget(roleText = '', normalizedRole = '') {
  if (/split|vertical|portrait|side-panel|full-height/.test(roleText)) {
    return Object.assign({ role:'split', targetSource:'role-fallback:split' }, ROLE_FALLBACK_TARGETS.split);
  }
  const role = normalizedRole || normalizeAssetRole(roleText);
  const fallback = ROLE_FALLBACK_TARGETS[role] || ROLE_FALLBACK_TARGETS.abstract;
  return Object.assign({ role, targetSource:`role-fallback:${role || 'abstract'}` }, fallback);
}

function assetTargetContract(plan = {}, s = {}, role = '', opts = {}) {
  const visual = s.visual || {};
  const originalRole = String(opts.originalRole || role || visual.role || (s.assetGeneration && s.assetGeneration.originalRole) || '').trim();
  const normalizedRole = String(opts.resolvedRole || opts.normalizedRole || normalizeAssetRole(originalRole || visual.role || role || '')).trim();
  const roleText = [
    originalRole,
    normalizedRole,
    visual.role || '',
    visual.targetUse || '',
    s.type || '',
    s.layoutVariant || '',
    s.variant || '',
    s.proof && s.proof.id
  ].filter(Boolean).join(' ').toLowerCase();
  const generationTarget = s.assetGeneration && s.assetGeneration.target ? s.assetGeneration.target : {};
  const visualSlot = visual.targetSlot || visual.slot;
  const explicitSlot = cleanSlot(visualSlot || generationTarget.slot);
  const explicitRatio = aspectRatioFrom(
    visual.targetAspectRatio || visual.aspectRatio || visual.aspect ||
    generationTarget.aspectRatio
  );
  let slot = explicitSlot;
  let targetSource = slot ? (visualSlot ? 'visual.targetSlot' : (generationTarget.targetSource || 'assetGeneration.target')) : '';
  let fitPolicy = visual.fitPolicy || generationTarget.fitPolicy || '';
  if (!slot && explicitRatio) targetSource = (visual.targetAspectRatio || visual.aspectRatio || visual.aspect) ? 'visual.targetAspectRatio' : (generationTarget.targetSource || 'assetGeneration.target');
  if (!slot && !explicitRatio) {
    const target = slotTargetForSlide(s, roleText) || roleFallbackTarget(roleText, normalizedRole);
    slot = cleanSlot(target.slot);
    targetSource = target.targetSource;
    fitPolicy = fitPolicy || target.fitPolicy;
    if ((!originalRole || ['structure', 'abstract'].includes(originalRole)) && target.role) {
      opts.originalRole = target.role;
    }
  }
  let ratio = explicitRatio || (slot ? slot.w / Math.max(0.01, slot.h) : 0);
  if (!ratio && /split|vertical|portrait|side-panel|full-height/.test(roleText)) {
    ratio = 0.567;
    targetSource = targetSource || 'role-fallback:split';
  }
  const aspectRatio = ratio ? roundNumber(ratio) : null;
  const orientation = orientationForAspect(aspectRatio);
  const effectiveOriginalRole = opts.originalRole || originalRole;
  const resolvedRole = normalizedRole || normalizeAssetRole(effectiveOriginalRole);
  const contract = {
    version: ASSET_TARGET_CONTRACT_VERSION,
    role: effectiveOriginalRole || resolvedRole || 'abstract',
    originalRole: effectiveOriginalRole || resolvedRole || 'abstract',
    resolvedRole: resolvedRole || 'abstract',
    slot,
    aspectRatio,
    orientation,
    fitPolicy: fitPolicy || (orientation === 'vertical' ? 'cover' : 'cover'),
    minPixels: minPixelsFor(resolvedRole || originalRole, orientation),
    targetSource: targetSource || 'none',
    reviewRequired: /^role-fallback:/.test(targetSource || '')
  };
  contract.instruction = targetInstructionFor(contract);
  contract.targetPixelSize = targetPixelSizeFor(contract);
  if (contract.targetPixelSize) contract.sizeHint = contract.targetPixelSize.label;
  contract.imagegenSizeHint = imagegenSizeHintFor(contract);
  return contract;
}

function generatedAssetTargetSpec(s = {}, role = '') {
  return assetTargetContract({}, s, role);
}

function stripPromptAspectConflicts(prompt = '', contract = {}) {
  let out = String(prompt || '');
  if (contract.orientation === 'vertical') {
    out = out
      .replace(/\bWide\s*16\s*:\s*9,?\s*/gi, '')
      .replace(/,?\s*16\s*:\s*9\s*or\s*4\s*:\s*3\s*crop\b/gi, '')
      .replace(/\bwide landscape image,?\s*/gi, '')
      .replace(/\blandscape crop,?\s*/gi, '')
      .replace(/(?:^|[\s,，;；、。])(?:\d+\s*[:：]\s*\d+\s*)?(?:横图|横版|宽屏|宽幅|横向构图|横向|方图|正方形)(?=$|[\s,，;；、。])/g, ' ')
      .replace(/(?:^|[\s,，;；、。])(?:16\s*[:：]\s*9|4\s*[:：]\s*3|1\s*[:：]\s*1)(?=$|[\s,，;；、。])/g, ' ');
  } else if (contract.orientation === 'wide') {
    out = out
      .replace(/\btall vertical image[^.]*\.\s*/gi, '')
      .replace(/\bportrait crop,?\s*/gi, '')
      .replace(/(?:^|[\s,，;；、。])(?:\d+\s*[:：]\s*\d+\s*)?(?:竖图|竖版|纵向|竖向构图|竖向|海报图|方图|正方形)(?=$|[\s,，;；、。])/g, ' ')
      .replace(/(?:^|[\s,，;；、。])(?:9\s*[:：]\s*16|3\s*[:：]\s*4|1\s*[:：]\s*1)(?=$|[\s,，;；、。])/g, ' ');
  }
  return out.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim();
}

function generatedPromptAspectConflict(prompt = '', contract = {}) {
  const text = String(prompt || '').toLowerCase();
  if (!text || !contract || !contract.orientation || contract.orientation === 'flexible') return false;
  const hasWide = /(?:wide\s+landscape|wide\s*16\s*[:：]\s*9|\b16\s*[:：]\s*9\b|\b4\s*[:：]\s*3\b|\b4\s*[:：]\s*3\s*crop\b|landscape\s+crop|横图|横版|宽屏|宽幅|横向构图|横向)/i.test(text);
  const hasVertical = /(?:tall\s+vertical|portrait\s+crop|full-height\s+split|narrow\s+crop|竖图|竖版|纵向|竖向构图|竖向|海报图)/i.test(text);
  const hasSquare = /(?:\b1\s*[:：]\s*1\b|方图|正方形|square\s+(?:image|crop|format))/i.test(text);
  if (contract.orientation === 'vertical') return hasWide || hasSquare;
  if (contract.orientation === 'wide') return hasVertical || hasSquare;
  return (hasWide && hasVertical) || hasSquare;
}

function assetRoleNeedsImage(role = '') {
  const r = String(role || '').toLowerCase();
  if (!r || ['none', 'diagram', 'structure', 'comparison'].includes(r)) return false;
  if (r.includes('none-or') || r.includes('or-none')) return false;
  return true;
}

function recipeGenerationRule(recipe = {}) {
  const text = String(recipe.generatedAsset || '').toLowerCase();
  if (!text || text === 'none' || text.includes('none;')) return 'none';
  if (text.includes('not allowed') || text.includes('disallow') || text.includes('blocked')) return 'blocked';
  if (text.includes('optional')) return 'optional';
  if (text.includes('allowed') || text.includes('create')) return 'allowed';
  return 'none';
}

function createAssetGenerationHelpers({
  factualGeneratedAssetRisk = /$a/,
  flattenText = value => String(value || ''),
  industryVisualPolicy = () => ({}),
  mediaForRole = () => '',
  referenceLayoutLibrary = {},
  resolveVisualMode = () => '',
  selectPaletteName = () => '',
  slideDesign = () => ({}),
  slideRole = () => ''
} = {}) {
  function generatedAssetPrompt(plan = {}, s = {}, recipe = null) {
    const design = slideDesign(plan, s);
    const role = (s.visual && s.visual.role) || design.imageRole || (recipe && recipe.assetRole) || 'abstract';
    const normalizedRole = normalizeAssetRole(role);
    const patterns = referenceLayoutLibrary.generatedAssetPromptPatterns || {};
    const pattern = patterns[normalizedRole] || patterns.abstract;
    if (!pattern) return '';
    const profile = industryVisualPolicy(plan);
    const industryLabel = profile.label || plan.industry || 'business';
    const visualBrief = (s.visual && s.visual.prompt) || s.assetBrief || s.coverInsight || s.claim || s.subtitle || s.title || plan.title || 'premium commercial visual';
    const paletteName = selectPaletteName(plan);
    const target = assetTargetContract(plan, s, role);
    const base = pattern
      .replace(/\{industryLabel\}/g, industryLabel)
      .replace(/\{visualBrief\}/g, String(visualBrief).replace(/\s+/g, ' ').trim())
      .replace(/\{paletteName\}/g, paletteName);
    const cleanBase = stripPromptAspectConflicts(base, target);
    return target.instruction ? `${cleanBase} ${target.instruction}` : cleanBase;
  }

  function generatedAssetPolicy(plan = {}, s = {}, recipe = null, design = null) {
    const originalRole = (s.visual && s.visual.role) || (design && design.imageRole) || (recipe && recipe.assetRole) || 'abstract';
    const role = normalizeAssetRole(originalRole);
    const target = assetTargetContract(plan, s, originalRole, { normalizedRole: role });
    const rule = recipeGenerationRule(recipe || {});
    const text = flattenText(s);
    const slideHasImages = (Array.isArray(s.images) && s.images.length > 0) ||
      (s.visual && Array.isArray(s.visual.images) && s.visual.images.length > 0) ||
      Boolean(s.image || (s.visual && s.visual.image));
    const existingAsset = mediaForRole(plan, s, slideRole(s), { includeDefault:false });
    const requested = (s.visual && s.visual.mode === 'generated') || s.assetMode === 'generated';
    const hasBoundAsset = slideHasImages || (Boolean(existingAsset) && !requested);
    const recipeNeedsImage = recipe && assetRoleNeedsImage(recipe.assetRole || role);
    const routeMode = resolveVisualMode(plan, s, slideRole(s));
    const referenceText = String(
      (recipe && [
        recipe.generatedAsset,
        recipe.layoutVariant,
        recipe.proofObject,
        recipe.assetRole,
        recipe.mainVisualMethod,
        recipe.themeIntent,
        recipe.renderType
      ].filter(Boolean).join(' ')) || ''
    );
    const imageLedReference = recipeNeedsImage &&
      /captioned-real-asset|showcase|gallery|proof|cover|product|beauty|people|lookbook/i.test(referenceText);
    const policy = industryVisualPolicy(plan);
    const recipeCanGenerate = ['optional', 'allowed'].includes(rule) || (rule === 'none' && imageLedReference);
    const autoGenerateMissing = ['auto-generate-missing', 'generate-missing', 'luxury', 'image-rich'].includes(String(plan.assetMode || plan.visualIntent || ''));
    const syntheticOnly = /synthetic|abstract|generic|placeholder|mood|atmospheric|concept|mock/i.test(String(recipe && recipe.generatedAsset || '')) ||
      ['background', 'showcase', 'gallery', 'abstract'].includes(role);
    const factualRisk = factualGeneratedAssetRisk.test(text) && ['evidence', 'gallery', 'showcase'].includes(role);
    const shouldGenerate = !hasBoundAsset && (
      requested ||
      (autoGenerateMissing && (recipeNeedsImage || (design && design.wantsImage))) ||
      (recipeNeedsImage && recipeCanGenerate && routeMode !== 'solid') ||
      (recipeNeedsImage && recipeCanGenerate && ['case-gallery', 'hybrid'].includes(policy.visualMode || ''))
    );
    if (!shouldGenerate) {
      return withDecisionSource({
        status: hasBoundAsset ? 'bound' : 'none',
        role,
        originalRole: target.originalRole || originalRole,
        resolvedRole: target.resolvedRole || role,
        target,
        mustBind: false,
        syntheticOnly,
        reason: hasBoundAsset ? 'real or generated asset already bound' : 'layout can render natively without generated image'
      });
    }
    if (rule === 'blocked' || (factualRisk && (requested || recipeCanGenerate))) {
      return withDecisionSource({
        status: 'blocked',
        role,
        originalRole: target.originalRole || originalRole,
        resolvedRole: target.resolvedRole || role,
        target,
        mustBind: false,
        syntheticOnly: true,
        reason: rule === 'blocked'
          ? 'reference recipe disallows generated assets for this proof object'
          : 'visible content implies factual/customer/site evidence; generated assets cannot substitute for proof'
      });
    }
    return withDecisionSource({
      status: requested || autoGenerateMissing ? 'required' : 'optional',
      role,
      originalRole: target.originalRole || originalRole,
      resolvedRole: target.resolvedRole || role,
      target,
      mustBind: requested || autoGenerateMissing,
      syntheticOnly,
      reason: requested || autoGenerateMissing
        ? 'slide explicitly requests generated visual asset'
        : 'reference layout can use a generated bitmap when no source image is available'
    });
  }

  return {
    assetTargetContract,
    assetRoleNeedsImage,
    generatedAssetPolicy,
    generatedAssetPrompt,
    generatedPromptAspectConflict,
    normalizeAssetRole,
    recipeGenerationRule
  };
}

module.exports = {
  ASSET_GENERATION_DECISION_SOURCE,
  ASSET_TARGET_CONTRACT_VERSION,
  assetTargetContract,
  assetRoleNeedsImage,
  generatedPromptAspectConflict,
  generatedAssetTargetSpec,
  createAssetGenerationHelpers,
  normalizeAssetRole,
  recipeGenerationRule
};
