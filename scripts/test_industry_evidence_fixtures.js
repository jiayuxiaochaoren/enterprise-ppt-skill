const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  canonicalIndustryEvidenceChainForSlide,
  chainsShareIdentity
} = require('./design/industry-evidence-chain');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');
const {
  industryVisualGrammarDecisionFor
} = require('./render/industry-visual-grammar');

const ROOT = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'industry-evidence-chain', 'regression.json'), 'utf8'));

function renderMetaFor(plan = {}) {
  return {
    version: 'render-meta/v1',
    slideCount: (plan.slides || []).length,
    slides: (plan.slides || []).map((slide, index) => {
      const chain = slide.componentPlan && slide.componentPlan.industryEvidenceChain;
      const planned = new Set((slide.componentPlan && slide.componentPlan.componentIds) || []);
      const consumed = ((chain && chain.components) || [])
        .filter(id => planned.has(id))
        .map(id => ({
          id,
          rendered: true,
          mode: 'native-renderer',
          nativeSlot: `${id}-fixture-slot`,
          drawnCount: 1,
          itemCount: 1,
          bbox: { id:`${id}-fixture-slot`, x:0.8, y:1.0, w:2.0, h:0.5, role:'native' },
          rendererModule: 'test/industry-evidence-chain',
          rendererMethod: 'nativeDrawnEvidenceFor',
          evidence: `fixture consumed ${id}`,
          chainStage: chain.stageId,
          chainStageLabel: chain.stageLabel,
          evidenceReason: (chain.evidenceReasons || []).join('; '),
          industryEvidenceChain: {
            chainId: chain.chainId,
            stageId: chain.stageId,
            stageLabel: chain.stageLabel
          }
        }));
      return {
        slide: index + 1,
        type: slide.type,
        layoutVariant: slide.layoutVariant || '',
        plannedComponents: Array.from(planned).map(id => ({ id, required:true })),
        drawnComponents: consumed,
        consumedComponents: consumed,
        missingRequiredComponents: []
      };
    })
  };
}

const normalizedSamplePlan = normalizeDeckPlan(JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'sample-deck-plan.json'), 'utf8')));
normalizedSamplePlan.slides.forEach((slide, index) => {
  const planned = slide.componentPlan && slide.componentPlan.industryEvidenceChain;
  const canonical = canonicalIndustryEvidenceChainForSlide(normalizedSamplePlan, slide);
  assert.ok(
    chainsShareIdentity(planned, canonical),
    `slide ${index + 1} componentPlan chain should match canonical chain after narrative proofObject inference`
  );
});

const expectedStagesBySample = {
  'manufacturing-oee-evidence-chain': ['capability-claim', 'process-delivery-promise', 'operations-quality-evidence'],
  'beauty-brand-product-user-evidence-chain': ['visual-claim', 'product-experience-promise', 'user-business-evidence'],
  'finance-thesis-portfolio-risk-evidence-chain': ['judgment-framework', 'asset-portfolio-logic', 'return-risk-evidence'],
  'healthcare-service-handoff-quality-evidence-chain': ['service-commitment', 'process-touchpoint', 'quality-efficiency-evidence'],
  'saas-platform-workflow-adoption-evidence-chain': ['platform-capability', 'workflow-implementation', 'adoption-efficiency-evidence'],
  'lifestyle-experience-journey-retention-evidence-chain': ['experience-claim', 'journey-promise', 'conversion-retention-evidence'],
  'public-governance-resource-risk-evidence-chain': ['governance-claim', 'resource-accountability-system', 'public-result-risk-evidence'],
  'people-culture-behavior-growth-evidence-chain': ['mission-culture-claim', 'behavior-team-evidence', 'organization-growth-evidence']
};

const expectedComponentsBySample = {
  'manufacturing-oee-evidence-chain': ['equipment-nameplate', 'inspection-matrix', 'quality-scorecard', 'kpi-strip', 'value-chain'],
  'beauty-brand-product-user-evidence-chain': ['hero-image', 'product-matrix', 'proof-gallery', 'caption-bar', 'kpi-strip'],
  'finance-thesis-portfolio-risk-evidence-chain': ['value-chain', 'governance-table', 'risk-register', 'disclosure-footnote', 'kpi-strip'],
  'healthcare-service-handoff-quality-evidence-chain': ['patient-journey-band', 'service-blueprint-lane', 'quality-scorecard', 'risk-register'],
  'saas-platform-workflow-adoption-evidence-chain': ['workflow-rail', 'prototype-frame', 'adoption-funnel', 'permission-audit-tag', 'kpi-strip'],
  'lifestyle-experience-journey-retention-evidence-chain': ['hero-image', 'value-chain', 'proof-gallery', 'caption-bar', 'kpi-strip'],
  'public-governance-resource-risk-evidence-chain': ['commentary-panel', 'value-chain', 'governance-table', 'kpi-strip', 'risk-register'],
  'people-culture-behavior-growth-evidence-chain': ['value-chain', 'caption-bar', 'proof-gallery', 'kpi-strip']
};

assert.equal(fixture.version, 'industry-evidence-chain-fixtures/v1');
assert.equal(fixture.samples.length, 8);

fixture.samples.forEach(sample => {
  const normalized = normalizeDeckPlan(sample.plan);
  const stages = normalized.slides.map(slide => slide.componentPlan.industryEvidenceChain.stageId);
  assert.deepEqual(stages, expectedStagesBySample[sample.id], `${sample.id} chain stages`);
  const planned = new Set(normalized.slides.flatMap(slide => slide.componentPlan.componentIds));
  expectedComponentsBySample[sample.id].forEach(id => {
    assert.equal(planned.has(id), true, `${sample.id} should plan ${id}`);
  });
  assert.equal(
    normalized.slides.some(slide => slide.componentPlan.componentIds.includes('product-matrix')),
    sample.plan.industry === 'beauty-consumer',
    `${sample.id} should only use product-matrix for consumer product evidence`
  );
  assert.ok(
    normalized.slides.some(slide => slide.compositionPlan && slide.compositionPlan.industryExpression && slide.compositionPlan.industryExpression.visualGrammar),
    `${sample.id} should carry industry visualGrammar into composition decisions`
  );
  const report = auditIndustryEvidenceChain(sample.plan, normalized, {
    sampleId: sample.id,
    renderMeta: renderMetaFor(normalized)
  });
  assert.equal(report.version, 'industry-evidence-chain-audit/v1');
  assert.equal(report.status, 'pass', `${sample.id} audit status: ${report.gapReasons.join('; ')}`);
  assert.ok(report.industry_evidence_chain_summary, `${sample.id} should expose compact chain summary`);
  assert.equal(report.industry_evidence_chain_summary.status, 'pass', `${sample.id} compact summary status`);
  assert.equal(report.industry_evidence_chain_summary.blockingGap, null, `${sample.id} compact summary should not carry a blocking gap`);
  assert.equal(report.industry_evidence_chain_summary.coverage.averageScore, 1, `${sample.id} compact summary should score complete consumed coverage`);
  assert.equal(report.metrics.recognizedSlides, 3);
  assert.ok(report.metrics.componentHits >= 3, `${sample.id} should hit evidence components`);
  assert.ok(report.metrics.consumedHits >= 3, `${sample.id} should consume evidence components`);
});

const publicGrammarPlan = { industry:'government-public-sector' };
const publicStageGrammar = [
  {
    type:'report-board',
    proofObject:'policy-context-board',
    policy:'公开政策文件说明治理模型。'
  },
  {
    type:'strategy-map',
    layoutVariant:'resource',
    proofObject:'resource-map',
    resources:[{ label:'资金' }],
    responsibilities:[{ label:'主管单位' }]
  },
  {
    type:'risk-table',
    proofObject:'risk-and-assurance-board',
    metrics:[{ label:'覆盖率', value:'92%' }],
    risks:[{ label:'交付风险' }]
  }
].map(slide => industryVisualGrammarDecisionFor(publicGrammarPlan, slide));
assert.deepEqual(publicStageGrammar.map(item => item.stageId), [
  'governance-claim',
  'resource-accountability-system',
  'public-result-risk-evidence'
]);
assert.equal(new Set(publicStageGrammar.map(item => item.evidenceRegion)).size, 3);
assert.equal(new Set(publicStageGrammar.map(item => item.compositionBias)).size, 3);
assert.equal(publicStageGrammar.every(item => item.productMatrixLabel === ''), true);

console.log('industry evidence fixtures ok');
