const assert = require('assert/strict');
const {
  acceptanceAudit,
  assetAuthorizationGate,
  commercialReadinessAudit,
  evidenceAudit,
  normalizeDeckPlan,
  sourceTraceAudit
} = require('./design-system');

const basePlan = {
  style: 'premium-commercial-keynote',
  industry: 'finance-investment',
  title: 'Q1 Results Review',
  slides: [
    { type: 'cover', title: 'Q1 Results Review', subtitle: 'Board-ready results' },
    {
      type: 'metric-comparison',
      layoutVariant: 'financial-kpi-snapshot',
      title: 'Revenue growth is above the operating baseline',
      claim: 'Revenue growth and cash conversion improved together.',
      metrics: [{
        label: 'Revenue',
        value: '+12.4%',
        note: 'Q1 management reporting',
        sourceId: 'src-001',
        sourceTrace: {
          version: 'metric-source-trace/v1',
          sourceIds: ['src-001'],
          sources: [{ id: 'src-001', page: 12, excerpt: 'Revenue grew 12.4% and cash conversion improved.' }]
        }
      }],
      proof: {
        version: 'proof-object/v1',
        id: 'financial-kpi-snapshot',
        factual: true,
        sourceIds: ['src-001'],
        sourceTrace: {
          version: 'source-trace/v2',
          claimId: 'claim-001',
          evidenceIds: ['ev-001'],
          sourceIds: ['src-001'],
          sources: [
            {
              id: 'src-001',
              kind: 'pdf',
              name: 'Q1 board pack.pdf',
              page: 12,
              excerpt: 'Revenue grew 12.4% and cash conversion improved.',
              provenance: 'text-source-excerpt',
              authorizationStatus: 'cleared'
            }
          ],
          imageProvenance: [],
          assetAuthorizationStatus: 'cleared'
        }
      },
      sourceTrace: {
        version: 'source-trace/v2',
        claimId: 'claim-001',
        evidenceIds: ['ev-001'],
        sourceIds: ['src-001'],
        sources: [
          {
            id: 'src-001',
            kind: 'pdf',
            name: 'Q1 board pack.pdf',
            page: 12,
            excerpt: 'Revenue grew 12.4% and cash conversion improved.',
            provenance: 'text-source-excerpt',
            authorizationStatus: 'cleared'
          }
        ],
        imageProvenance: [],
        assetAuthorizationStatus: 'cleared'
      },
      businessLogic: {
        currentState: 'Results are above baseline.',
        impact: 'Capital allocation can stay focused.',
        cause: 'Core customers and cash discipline improved.',
        action: 'Keep monthly cash conversion review.',
        metric: 'Revenue growth and cash conversion'
      }
    },
    { type: 'closing', title: 'Confirm next-quarter review boundary', actions: [{ title: 'Review', body: 'Keep cash conversion review.' }] }
  ]
};

const ready = normalizeDeckPlan(basePlan);
assert.equal(sourceTraceAudit(basePlan, ready).status, 'pass');
assert.equal(commercialReadinessAudit(basePlan, ready).level, 'client-review');
const readyRenderMeta = { slides: ready.slides.map((_, i) => ({ slide: i + 1, missingRequiredComponents: [] })) };
const acceptanceWithRenderMeta = acceptanceAudit(basePlan, ready, { renderMeta: readyRenderMeta });
assert.equal(
  acceptanceWithRenderMeta.chartGate.findings.some(f => f.type === 'acceptanceRenderMetaMissing'),
  false
);
assert.equal(
  commercialReadinessAudit(basePlan, ready, [], { renderMeta: readyRenderMeta }).findings.some(f => f.type === 'acceptanceRenderMetaMissing'),
  false
);

const planAuthoredBrief = {
  style: 'premium-commercial-keynote',
  industry: 'energy-utility',
  title: 'Plan Authored Energy Brief',
  sourceTracePolicy: {
    mode: 'plan-authored',
    sourceId: 'energy-brief',
    label: 'Energy plan brief',
    sourceNote: 'Plan-authored content boundary; no external source material was supplied.'
  },
  slides: [
    { type: 'cover', title: 'Plan Authored Energy Brief', subtitle: 'Operating narrative' },
    { type: 'toc', title: 'Path', items: ['Background', 'Actions'] },
    {
      type: 'two-column',
      title: 'Multi-site operations need a shared dispatch view',
      left: ['Telemetry is fragmented.'],
      cards: [{ title: 'Dispatch', body: 'Unify monitoring and work orders.' }]
    },
    {
      type: 'timeline',
      title: 'Pilot first, then scale regionally',
      phases: [{ title: 'Pilot', body: 'Connect priority sites.' }, { title: 'Scale', body: 'Roll out operating cadence.' }]
    },
    { type: 'closing', title: 'Confirm pilot boundary' }
  ]
};
const planAuthoredReady = normalizeDeckPlan(planAuthoredBrief);
assert.equal(planAuthoredReady.claimSpine.length, 2);
assert.ok(planAuthoredReady.slides[2].claim, 'normalization should derive a body-page claim');
assert.equal(sourceTraceAudit(planAuthoredBrief, planAuthoredReady).status, 'pass');
assert.equal(evidenceAudit(planAuthoredBrief, planAuthoredReady).status, 'pass');
assert.equal(
  acceptanceAudit(planAuthoredBrief, planAuthoredReady, { renderMeta: { slides: planAuthoredReady.slides.map((_, i) => ({ slide: i + 1, missingRequiredComponents: [] })) } }).chartGate.conditions.everyPageHasClaimSpine,
  true
);

const missingTrace = JSON.parse(JSON.stringify(basePlan));
delete missingTrace.slides[1].sourceTrace.sources[0].page;
delete missingTrace.slides[1].sourceTrace.sources[0].excerpt;
delete missingTrace.slides[1].proof.sourceTrace.sources[0].page;
delete missingTrace.slides[1].proof.sourceTrace.sources[0].excerpt;
const missingTracePlan = normalizeDeckPlan(missingTrace);
assert.equal(sourceTraceAudit(missingTrace, missingTracePlan).status, 'fail');
assert.equal(commercialReadinessAudit(missingTrace, missingTracePlan).level, 'client-final-blocked');

const missingMetricExcerpt = JSON.parse(JSON.stringify(basePlan));
delete missingMetricExcerpt.slides[1].metrics[0].sourceTrace.sources[0].excerpt;
const missingMetricExcerptPlan = normalizeDeckPlan(missingMetricExcerpt);
assert.equal(sourceTraceAudit(missingMetricExcerpt, missingMetricExcerptPlan).status, 'fail');
assert.equal(
  sourceTraceAudit(missingMetricExcerpt, missingMetricExcerptPlan).findings.some(f => f.type === 'metricSourceTraceNotExplainable'),
  true
);

const unknownAsset = JSON.parse(JSON.stringify(basePlan));
unknownAsset.materialIntelligence = { bundleVersion: 'material-bundle/v1' };
unknownAsset.slides[1].visual = { mode: 'photo', role: 'evidence', image: 'assets/media/manufacturing-cover.jpg' };
unknownAsset.slides[1].sourceTrace.imageProvenance = [{ sourceId: 'src-img', file: 'assets/media/manufacturing-cover.jpg', authorizationStatus: 'unknown' }];
unknownAsset.slides[1].sourceTrace.assetAuthorizationStatus = 'unknown';
unknownAsset.slides[1].proof.sourceTrace.imageProvenance = unknownAsset.slides[1].sourceTrace.imageProvenance;
unknownAsset.slides[1].proof.sourceTrace.assetAuthorizationStatus = 'unknown';
const unknownPlan = normalizeDeckPlan(unknownAsset);
assert.equal(assetAuthorizationGate(unknownAsset, unknownPlan).status, 'needs_authorization');
assert.equal(commercialReadinessAudit(unknownAsset, unknownPlan).level, 'client-final-blocked');

const generatedOnlyProof = JSON.parse(JSON.stringify(basePlan));
generatedOnlyProof.slides[1].sourceTrace.imageProvenance = [{
  sourceId: 'gen-img',
  file: 'assets/generated/fake-proof.png',
  provenanceClass: 'model-generated-preview',
  proofEligibility: 'synthetic-only',
  authorizationStatus: 'synthetic-only'
}];
generatedOnlyProof.slides[1].proof.sourceTrace.imageProvenance = generatedOnlyProof.slides[1].sourceTrace.imageProvenance;
const generatedOnlyPlan = normalizeDeckPlan(generatedOnlyProof);
assert.equal(sourceTraceAudit(generatedOnlyProof, generatedOnlyPlan).status, 'fail');
assert.equal(
  sourceTraceAudit(generatedOnlyProof, generatedOnlyPlan).findings.some(f => f.type === 'generatedAssetCannotSatisfyFactualProof'),
  true
);

const explicitReadyCannotBypass = JSON.parse(JSON.stringify(unknownAsset));
explicitReadyCannotBypass.assetAuthorizationGate = { status: 'ready' };
const explicitReadyPlan = normalizeDeckPlan(explicitReadyCannotBypass);
assert.equal(assetAuthorizationGate(explicitReadyCannotBypass, explicitReadyPlan).status, 'needs_authorization');

const internalRisk = JSON.parse(JSON.stringify(basePlan));
internalRisk.commercialReview = { openRisks: ['客户案例授权待确认'] };
const internalPlan = normalizeDeckPlan(internalRisk);
assert.equal(commercialReadinessAudit(internalRisk, internalPlan).level, 'internal-ready');

console.log('commercial readiness QA ok');
