const assert = require('assert/strict');

const {
  compileDeckPlan,
  extractionSchema,
  referenceContextForPrompt
} = require('./material_pipeline');
const { industryAcceptanceBriefs } = require('./industry_acceptance_matrix');
const {
  extractionPrompt,
  orchestrationOverview,
  stagePrompt,
  storyArchitecturePrompt
} = require('./material/orchestration-prompts');

const schema = extractionSchema();
const claimSchema = schema.claim_spine[0];
assert.ok(Object.prototype.hasOwnProperty.call(schema.document, 'language'), 'extraction schema should include document.language');
assert.ok(Object.prototype.hasOwnProperty.call(schema, 'visible_language_policy'), 'extraction schema should include visible language policy');
[
  'proof_object',
  'layoutVariant',
  'componentSuggestions',
  'referenceRecipeIds',
  'asset_requirements',
  'source_note',
  'source_pages',
  'source_excerpts',
  'theme_intent',
  'accent_role'
].forEach(field => assert.ok(Object.prototype.hasOwnProperty.call(claimSchema, field), `extraction schema should include ${field}`));

for (const brief of industryAcceptanceBriefs()) {
  const context = referenceContextForPrompt({
    version: 'material-bundle/v1',
    sourceCount: 0,
    textSummary: { industryCandidates: [{ industry: brief.industry }] },
    sources: []
  });
  assert.ok(context.industryPack, `${brief.industry} should retrieve an industry pack`);
  assert.ok(context.recommendedReferenceRecipes.length > 0, `${brief.industry} should retrieve reference recipes`);
  assert.ok(context.industryPack.pageFamilies && context.industryPack.pageFamilies.length, `${brief.industry} should expose page families`);
  assert.ok(context.industryPack.clarificationQuestions && context.industryPack.clarificationQuestions.length, `${brief.industry} should expose missing-info questions`);
}

const promptBundle = {
  version: 'material-bundle/v1',
  sourceCount: 0,
  textSummary: { industryCandidates: [{ industry: 'finance-investment', score: 0.9 }] },
  sources: [],
  images: []
};
const promptText = extractionPrompt(promptBundle);
[
  'themeIntent',
  'proof_object',
  'layoutVariant',
  'componentSuggestions',
  'referenceRecipeIds',
  'asset_requirements',
  'source_pages/source_excerpts',
  'source_note/provenance_note',
  'clarification_candidates',
  'visible_language_policy',
  'localize_non_essential_microcopy'
].forEach(term => assert.ok(promptText.includes(term), `orchestration prompt should require ${term}`));
assert.equal(stagePrompt('extraction', promptBundle), promptText, 'stagePrompt should route extraction through the shared prompt builder');
assert.ok(storyArchitecturePrompt(promptBundle).includes('deck_art_direction'), 'story prompt should require art direction');
const overview = orchestrationOverview('out/model-orchestration');
assert.ok(overview.includes('resolve_visual_assets'), 'overview should route missing visuals through the asset resolution bridge');
assert.ok(/asset decision gate|asset decision/i.test(overview), 'overview should retain the asset decision gate concept');
assert.ok(overview.includes('imagegen'), 'overview should mention imagegen capability before renderer fallback');

const bundle = {
  version: 'material-bundle/v1',
  sourceCount: 1,
  sources: [
    {
      id: 'src-001',
      kind: 'text',
      name: 'brief.md',
      relativePath: 'brief.md',
      candidateFacts: ['Q1 revenue grew 12.4%'],
      numbers: ['12.4%'],
      chunks: ['Q1 revenue grew 12.4% and cash conversion improved.']
    }
  ],
  textSummary: {
    industryCandidates: [{ industry: 'finance-investment', score: 0.9 }],
    titleCandidates: ['Q1 Results Review']
  },
  images: []
};
const extraction = {
  version: 'material-extraction/v1',
  document: {
    title: 'Q1 Results Review',
    subtitle: 'Board-ready operating results',
    ppt_type: 'review',
    industry: 'finance-investment',
    language: 'zh-CN',
    organization: 'Example Capital',
    audience: 'Board',
    decision_goal: 'Confirm next-quarter capital allocation'
  },
  facts: [{ id: 'fact-001', text: 'Q1 revenue grew 12.4%', source_ids: ['src-001'], confidence: 0.9 }],
  evidence: [{ id: 'ev-001', type: 'metric', title: 'Revenue growth', summary: 'Q1 growth signal', source_ids: ['src-001'] }],
  claim_spine: [
    {
      id: 'claim-001',
      narrative_role: 'proof',
      claim: 'Q1 results are above the operating baseline',
      support: 'Revenue growth and cash conversion improved together.',
      proof_object: 'financial-kpi-snapshot',
      evidence_ids: ['ev-001'],
      source_ids: ['src-001'],
      business_logic: {
        current_state: 'Results are above baseline.',
        impact: 'Capital allocation can stay focused.',
        cause: 'Core customers and cash discipline improved.',
        action: 'Keep monthly cash conversion review.',
        metric: 'Revenue growth and cash conversion'
      },
      metrics: [{ label: 'Revenue', value: '+12.4%', note: 'Q1 management reporting' }],
      theme_intent: 'value-signal',
      accent_role: 'data',
      layoutVariant: 'financial-kpi-snapshot',
      componentSuggestions: ['metric strip', 'source note'],
      componentHints: ['hero KPI'],
      referenceRecipeIds: ['financial-kpi-snapshot'],
      asset_requirements: [{ role: 'source-table', required: true, provenance: 'src-001' }],
      source_note: 'Source: Q1 management reporting',
      confidence: 0.9
    },
    {
      id: 'claim-002',
      narrative_role: 'decision',
      claim: 'Next quarter should keep cash conversion as the review boundary',
      support: 'The action is tied to monthly operating review.',
      proof_object: 'premium-closing-anchor',
      evidence_ids: ['ev-001'],
      source_ids: ['src-001'],
      theme_intent: 'closing-anchor',
      accent_role: 'action',
      layoutVariant: 'premium-closing-anchor',
      componentSuggestions: ['final decision', 'next actions'],
      referenceRecipeIds: ['premium-closing-anchor'],
      asset_requirements: [{ role: 'owner-contact', required: false, provenance: 'user-confirmed or omitted' }],
      source_note: 'Source: board discussion draft',
      confidence: 0.8
    }
  ],
  missing_info: [],
  commercial_risks: []
};

const plan = compileDeckPlan(extraction, bundle);
assert.equal(plan.language, 'zh-CN');
assert.equal(plan.visibleLanguagePolicy.localizeNonEssentialMicrocopy, true);
assert.ok(!JSON.stringify(plan.slides).includes('This report follows'), 'Chinese compiled plans should not inject English agenda copy');
const kpiSlide = plan.slides.find(slide => slide.layoutVariant === 'financial-kpi-snapshot');
assert.ok(kpiSlide, 'compiled deck should preserve layoutVariant');
assert.equal(kpiSlide.proofObject, 'financial-kpi-snapshot');
assert.equal(kpiSlide.themeIntent, 'value-signal');
assert.equal(kpiSlide.componentHints, undefined);
assert.deepEqual(kpiSlide.previousComponentHints, ['hero KPI']);
assert.deepEqual(kpiSlide.previousComponentSuggestions, ['metric strip', 'source note']);
assert.deepEqual(kpiSlide.referenceRecipeIds, ['financial-kpi-snapshot']);
assert.equal(kpiSlide.referenceRecipeId, 'financial-kpi-snapshot');
assert.deepEqual(kpiSlide.assetRequirements, [{ role: 'source-table', required: true, provenance: 'src-001' }]);
assert.equal(kpiSlide.sourceNote, 'Source: Q1 management reporting');

console.log('orchestration contract ok');
