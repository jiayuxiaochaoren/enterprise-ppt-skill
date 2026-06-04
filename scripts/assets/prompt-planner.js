const fs = require('fs');
const path = require('path');
const {
  generatedAssetPrompt,
  makeDeckContext,
  mediaForRole,
  scoreImageAsset
} = require('../design-system');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(path.resolve(file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function assetRoleNeedsImage(role = '') {
  const r = String(role || '').toLowerCase();
  if (!r || ['none', 'diagram', 'structure', 'comparison'].includes(r)) return false;
  if (r.includes('none-or') || r.includes('or-none')) return false;
  return true;
}

function planAssetPrompts(plan = {}, opts = {}) {
  const ctx = makeDeckContext(plan);
  const normalized = ctx.normalizeDeckPlan();
  const prompts = [];
  const blocked = [];

  (normalized.slides || []).forEach((slide, i) => {
    const design = ctx.slideDesign(slide);
    const generation = slide.assetGeneration || {};
    if (generation.status === 'blocked') {
      blocked.push({
        slide: i + 1,
        title: slide.title || '',
        type: slide.type || '',
        referenceRecipe: slide.referenceRecipe ? slide.referenceRecipe.id : '',
        role: generation.role || design.imageRole || '',
        reason: generation.reason || 'generated asset is blocked for this slide'
      });
      return;
    }
    if (generation.status && !['required', 'optional'].includes(generation.status)) return;
    const existing = design.wantsImage ? (design.imagePath || mediaForRole(normalized, slide, design.role)) : '';
    const assetQuality = existing ? scoreImageAsset(existing, design.imageRole) : null;
    const slideHasImages = (Array.isArray(slide.images) && slide.images.length > 0) ||
      (slide.visual && Array.isArray(slide.visual.images) && slide.visual.images.length > 0);
    const needsGenerated = slide.visual && slide.visual.mode === 'generated';
    const recipeAllowsGenerated = slide.referenceRecipe && /optional|allowed|Create/i.test(String(slide.referenceRecipe.generatedAsset || ''));
    const recipeAssetRole = slide.referenceRecipe ? String(slide.referenceRecipe.assetRole || '') : '';
    const recipeImageRelevant = assetRoleNeedsImage(recipeAssetRole);
    const missingUsefulAsset = recipeImageRelevant && !slideHasImages && design.wantsImage && (!existing || (assetQuality && assetQuality.verdict === 'reject'));
    const recipeNeedsAsset = recipeAllowsGenerated && recipeImageRelevant && !slideHasImages && !existing;
    const architectureRequestsAsset = ['required', 'optional'].includes(generation.status || '');
    if (!architectureRequestsAsset && !needsGenerated && !recipeNeedsAsset && !missingUsefulAsset) return;
    const role = generation.role || (slide.visual && slide.visual.role) || design.imageRole || (slide.referenceRecipe && slide.referenceRecipe.assetRole) || 'abstract';
    const prompt = slide.generatedAssetPrompt || generatedAssetPrompt(normalized, slide);
    if (!prompt) return;
    prompts.push({
      slide: i + 1,
      title: slide.title || '',
      type: slide.type || '',
      referenceRecipe: slide.referenceRecipe ? slide.referenceRecipe.id : '',
      role,
      status: generation.status || (needsGenerated ? 'required' : 'optional'),
      syntheticOnly: generation.syntheticOnly !== false,
      mustBind: generation.mustBind === true || needsGenerated,
      reason: generation.reason || '',
      recommendedFilename: `generated-slide-${String(i + 1).padStart(2, '0')}-${role}.png`,
      prompt,
      usage: role === 'background'
        ? 'Use only if the generated image has a clean text-safe zone; otherwise place it as a framed evidence/showcase panel.'
        : 'Place as a framed panel or gallery image; keep slide text outside the bitmap.',
      avoid: ['text inside image', 'logos', 'fake charts', 'fake UI labels', 'named customer evidence', 'busy background behind paragraphs']
    });
  });

  return {
    plan: opts.planLabel || '',
    deckTitle: normalized.title || '',
    status: blocked.length ? 'blocked' : (prompts.length ? 'ready' : 'empty'),
    promptCount: prompts.length,
    prompts,
    blockedCount: blocked.length,
    blocked
  };
}

function planAssetPromptsFromFile({ planPath, outPath = '' }) {
  const absolutePlan = path.resolve(planPath);
  const result = planAssetPrompts(readJson(absolutePlan), {
    planLabel: path.relative(process.cwd(), absolutePlan)
  });
  if (outPath) writeJson(outPath, result);
  return result;
}

module.exports = {
  assetRoleNeedsImage,
  planAssetPrompts,
  planAssetPromptsFromFile,
  readJson,
  writeJson
};
