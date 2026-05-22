#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { makeDeckContext, mediaForRole, scoreImageAsset } = require('./design-system');

function usage() {
  console.error('Usage: node scripts/inspect_design.js <deck-plan.json>');
  process.exit(2);
}

const planPath = process.argv[2];
if (!planPath) usage();

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const ctx = makeDeckContext(plan);
const normalized = ctx.normalizeDeckPlan();
const slides = (normalized.slides || []).map((slide, i) => {
  const design = ctx.slideDesign(slide);
  const signals = ctx.contentSignals(slide, i, (normalized.slides || []).length);
  const recommendation = ctx.recommendSlideType(slide, i, (normalized.slides || []).length);
  const recipe = ctx.selectReferenceRecipe(slide, i, (normalized.slides || []).length);
  const assetPath = design.wantsImage ? (design.imagePath || mediaForRole(normalized, slide, design.role)) : '';
  return {
    index: i + 1,
    type: slide.type || 'content',
    recommendedType: recommendation.type,
    layoutRationale: slide.layoutRationale || recommendation.reason,
    title: slide.title || '',
    role: design.role,
    mode: design.mode,
    imageRole: design.imageRole,
    pageFamily: design.pageFamily,
    wantsImage: design.wantsImage,
    mediaKey: design.mediaKey,
    imagePath: design.imagePath ? path.relative(process.cwd(), design.imagePath) : '',
    contentSignals: signals,
    referenceRecipe: recipe ? { id:recipe.id, score:recipe.score, slideType:recipe.slideType, renderType:recipe.renderType, layout:recipe.layout, proofObject:recipe.proofObject, assetRole:recipe.assetRole } : null,
    generatedAssetPrompt: slide.generatedAssetPrompt || '',
    assetQuality: assetPath ? scoreImageAsset(assetPath, design.imageRole) : null
  };
});

console.log(JSON.stringify({
  title: normalized.title || '',
  industry: normalized.industry || 'general-operations',
  style: normalized.style || ctx.profile.name,
  palette: ctx.paletteName,
  policy: ctx.policy,
  slides
}, null, 2));
