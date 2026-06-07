const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  inferIndustryEvidenceChain,
  normalizeDeckPlan,
  normalizeSlide
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');
const {
  INDUSTRY_EVIDENCE_CHAINS,
  canonicalIndustryEvidenceChainForSlide,
  chainsShareIdentity,
  coverageStatusForComponents,
  industryEvidenceChainShapeIssues,
  normalizeStageCoveragePolicy
} = require('./design/industry-evidence-chain');
const {
  COMPONENT_EVIDENCE_SIGNAL_RULES,
  componentHasEvidence
} = require('./design/component-evidence-contracts');
const {
  hasAssetProvenanceSignal,
  hasStructuredSourceTraceSignal,
  hasSourceTraceRefs,
  hasTextSourceTraceSignal,
  hasVisibleSourceNote,
  sourceEntryIds,
  sourceIdentityValues,
  sourceTraceForSlide,
  sourceTraceNoteText,
  sourceTraceObjectIsExplainable
} = require('./design/source-evidence');
const {
  applyQualitySeverityPolicy
} = require('./qa/quality-severity-policy');
const {
  slideFromClaim
} = require('./material/claim-to-slide');

const ROOT = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'industry-evidence-chain', 'regression.json'), 'utf8'));

const normalizedSamplePlan = normalizeDeckPlan(JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'sample-deck-plan.json'), 'utf8')));
normalizedSamplePlan.slides.forEach((slide, index) => {
  const planned = slide.componentPlan && slide.componentPlan.industryEvidenceChain;
  const canonical = canonicalIndustryEvidenceChainForSlide(normalizedSamplePlan, slide);
  assert.ok(
    chainsShareIdentity(planned, canonical),
    `slide ${index + 1} componentPlan chain should match canonical chain after narrative proofObject inference`
  );
});
const normalizedSampleChainAudit = auditIndustryEvidenceChain(normalizedSamplePlan);
assert.equal(
  normalizedSampleChainAudit.findings.some(finding => finding.type === 'industryEvidenceComponentPartial'),
  false,
  'legacy flat stage components should be interpreted as requiredAny/minHits coverage, not all-or-nothing partial failure'
);
const legacyCoveragePolicy = normalizeStageCoveragePolicy({ components:['equipment-nameplate', 'site-evidence-frame', 'kpi-strip'] });
assert.deepEqual(legacyCoveragePolicy.requiredAny, ['equipment-nameplate', 'site-evidence-frame', 'kpi-strip']);
assert.equal(legacyCoveragePolicy.minHits, 1);
assert.equal(coverageStatusForComponents(legacyCoveragePolicy, ['equipment-nameplate']).status, 'pass');
assert.equal(coverageStatusForComponents(legacyCoveragePolicy, []).status, 'fail');
assert.equal(COMPONENT_EVIDENCE_SIGNAL_RULES['source-note'].allowFieldEvidence, false);
assert.equal(componentHasEvidence('source-note', { sourceNote:'内部来源 A' }, { plan:{ visibleSourceNotes:false } }), false);
assert.equal(componentHasEvidence('source-note', { sourceNote:'内部来源 A' }, { plan:{ visibleSourceNotes:true } }), true);
assert.equal(componentHasEvidence('hero-image', { type:'cover' }), true);
assert.equal(componentHasEvidence('kpi-strip', { type:'metric-comparison' }), true);

{
  const malformedPolicyChain = {
    chainId:'energy-infrastructure',
    stageId:'safety-stability-claim',
    components:[],
    matchedFields:[],
    matchedProofObjects:[],
    coveragePolicy:{
      requiredAll:'equipment-nameplate',
      requiredAny:['kpi-strip', 12],
      optional:[{}],
      minHits:-1
    }
  };
  const issues = industryEvidenceChainShapeIssues(malformedPolicyChain);
  assert.ok(issues.some(issue => /coveragePolicy\.requiredAll/.test(issue)));
  assert.ok(issues.some(issue => /coveragePolicy\.requiredAny/.test(issue)));
  assert.ok(issues.some(issue => /coveragePolicy\.optional/.test(issue)));
  assert.ok(issues.some(issue => /coveragePolicy\.minHits/.test(issue)));
  const malformedPolicyAudit = auditIndustryEvidenceChain({
    industry:'energy-utility',
    slides:[{
      type:'case-gallery',
      title:'坏 coveragePolicy 不能被静默接受',
      proofObject:'site-evidence',
      siteEvidence:{ name:'A站' },
      componentPlan:{ industryEvidenceChain: malformedPolicyChain }
    }]
  });
  const invalidFinding = malformedPolicyAudit.findings.find(finding => finding.type === 'industryEvidenceChainInvalid');
  assert.ok(invalidFinding, 'malformed coveragePolicy should surface as invalid chain metadata');
  assert.match(invalidFinding.message, /coveragePolicy\.requiredAll/);
  assert.match(invalidFinding.message, /coveragePolicy\.minHits/);
}

{
  const energyStage = INDUSTRY_EVIDENCE_CHAINS['energy-infrastructure'].stages.find(stage => stage.id === 'safety-stability-claim');
  const originalCoveragePolicy = energyStage.coveragePolicy;
  try {
    energyStage.coveragePolicy = {
      requiredAll:['equipment-nameplate'],
      requiredAny:['site-evidence-frame', 'kpi-strip'],
      optional:['proof-gallery'],
      minHits:2
    };
    const coveragePlan = {
      industry:'energy-utility',
      slides:[{
        type:'case-gallery',
        title:'电站安全稳定证据',
        proofObject:'site-evidence',
        siteEvidence:{ name:'A站' },
        componentPlan:{ componentIds:['site-evidence-frame'], components:[{ id:'site-evidence-frame' }] }
      }]
    };
    const requiredAllAudit = auditIndustryEvidenceChain(coveragePlan, coveragePlan);
    assert.ok(
      requiredAllAudit.findings.some(finding => finding.type === 'industryEvidenceRequiredComponentMissing'),
      'coverage policy should fail when requiredAll components are missing'
    );
    assert.ok(
      requiredAllAudit.findings.some(finding => finding.type === 'industryEvidenceCoverageBelowMinimum'),
      'coverage policy should fail when minHits is not satisfied'
    );
    const requiredAnyPlan = JSON.parse(JSON.stringify(coveragePlan));
    requiredAnyPlan.slides[0].componentPlan = { componentIds:['equipment-nameplate'], components:[{ id:'equipment-nameplate' }] };
    const requiredAnyAudit = auditIndustryEvidenceChain(requiredAnyPlan, requiredAnyPlan);
    assert.ok(
      requiredAnyAudit.findings.some(finding => finding.type === 'industryEvidenceRequiredAnyMissing'),
      'coverage policy should fail when requiredAny has no hits'
    );
  } finally {
    energyStage.coveragePolicy = originalCoveragePolicy;
  }
}

const claimSlideWithModelPlan = slideFromClaim({
  claim:'模型给了旧组件计划',
  support:'组件计划应降级为 previous 审计字段。',
  proof_object:'metric-board',
  componentPlan:{
    components:[
      { id:'hero-image', required:true },
      { id:'kpi-strip', required:true }
    ]
  },
  metrics:[{ label:'OEE', value:'82%' }]
});
assert.equal(claimSlideWithModelPlan.componentPlan, undefined);
assert.ok(claimSlideWithModelPlan.previousComponentPlan);
assert.equal(claimSlideWithModelPlan.componentHints, undefined);
assert.deepEqual(
  sourceTraceForSlide({ sourceTrace:{ sourceIds:'src-abc' } }).sourceIds,
  ['src-abc'],
  'source evidence should preserve scalar sourceIds instead of splitting into characters'
);
const nestedSnakeCaseTrace = sourceTraceForSlide({
  source_trace:{
    source_ids:'src-slide-snake',
    sources:[{ id:'src-slide-snake', page:2, excerpt:'slide snake excerpt' }],
    source_note:'Slide snake trace note',
    image_provenance:[{ ref:'slide-snake-image', authorization_status:'cleared' }],
    asset_authorization_status:'cleared'
  },
  proof:{
    source_note:'Proof snake source note',
    source_trace:{
      source_ids:'src-proof-snake',
      sources:[{ id:'src-proof-snake', page:1, excerpt:'proof snake excerpt' }]
    }
  },
  chart_spec:{
    source_trace:{
      source_ids:'src-chart-snake',
      sources:[{ id:'src-chart-snake', page:3, excerpt:'chart snake excerpt' }]
    }
  }
});
assert.deepEqual(
  nestedSnakeCaseTrace.sourceIds,
  ['src-proof-snake', 'src-slide-snake', 'src-chart-snake'],
  'canonical source trace should merge nested source_trace containers'
);
assert.equal(
  sourceTraceObjectIsExplainable(nestedSnakeCaseTrace, { requireSourceId:true }),
  true,
  'nested source_trace containers should remain explainable when ids match page/excerpt sources'
);
assert.equal(nestedSnakeCaseTrace.sourceNote, 'Slide snake trace note');
assert.equal(nestedSnakeCaseTrace.imageProvenance[0].ref, 'slide-snake-image');
assert.equal(
  sourceTraceNoteText({ proof:{ source_note:'Proof snake source note' } }),
  'Proof snake source note',
  'proof.source_note should remain available for opt-in visible source notes'
);
assert.equal(
  sourceTraceNoteText({ source_trace:{ source_note:'Trace snake note' } }),
  'Trace snake note',
  'source_trace.source_note should remain available for opt-in visible source notes'
);
assert.equal(
  hasSourceTraceRefs({ sourceTrace:{ sourceNote:'Display source note only' } }),
  false,
  'source trace refs should represent structured trace, not visible source note text'
);
assert.equal(
  hasStructuredSourceTraceSignal({ sourceTrace:{ sourceIds:['src-abc'] } }),
  true,
  'structured source trace signal should remain available under the clearer helper name'
);
assert.equal(
  hasTextSourceTraceSignal({ sourceTrace:{ sourceIds:['src-abc'] } }),
  true,
  'text source trace signal should detect source ids'
);
assert.equal(
  hasTextSourceTraceSignal({ sourceTrace:{ imageProvenance:[{ id:'img-a' }], assetAuthorizationStatus:'blocked' } }),
  false,
  'text source trace signal should not be satisfied by image provenance or authorization metadata'
);
assert.equal(
  hasAssetProvenanceSignal({ sourceTrace:{ imageProvenance:[{ id:'img-a' }] } }),
  true,
  'asset provenance signal should detect image provenance'
);
assert.equal(
  hasAssetProvenanceSignal({ sourceTrace:{ assetAuthorizationStatus:'unknown' } }),
  true,
  'asset provenance signal should detect authorization status'
);
assert.equal(
  hasAssetProvenanceSignal({ sourceTrace:{ assetAuthorizationStatus:'none' } }),
  false,
  'asset provenance signal should not treat none as meaningful authorization provenance'
);
assert.equal(
  hasSourceTraceRefs({ sourceTrace:{ assetAuthorizationStatus:'none' } }),
  false,
  'legacy hasSourceTraceRefs alias should not treat none as structured source trace'
);
assert.equal(
  hasVisibleSourceNote({ sourceNote:'Display source note only' }),
  true,
  'visible source note compatibility should remain separate from structured source trace refs'
);
assert.deepEqual(
  sourceEntryIds({ ref:'doc-ref', file:'doc.pdf', assetId:'asset-a', asset_id:'asset-b' }),
  ['doc-ref', 'doc.pdf', 'asset-a', 'asset-b'],
  'source entry ids should include ref/file/assetId aliases'
);
assert.deepEqual(
  sourceEntryIds({ name:'human readable label' }),
  [],
  'source entry ids should not treat name as a stable identity'
);
assert.deepEqual(
  sourceIdentityValues({ sourceId:'src-id', ref:'doc-ref', file:'doc.pdf', asset_id:'asset-b', name:'ignored' }),
  ['src-id', 'doc-ref', 'doc.pdf', 'asset-b'],
  'canonical source identity values should use only stable identity aliases'
);
assert.equal(
  sourceTraceObjectIsExplainable({
    sourceIds:['doc-ref'],
    sources:[{ ref:'doc-ref', page:3, excerpt:'Document excerpt.' }]
  }, { requireSourceId:true }),
  true,
  'source trace explainability should match sourceIds to ref aliases with page/excerpt evidence'
);
assert.equal(
  sourceTraceObjectIsExplainable({
    sourceIds:['src-a'],
    sources:[{ id:'src-a', sourcePage:'p5', excerpt:'Document excerpt.' }]
  }, { requireSourceId:true }),
  true,
  'source trace explainability should accept sourcePage as structured page evidence'
);
const visibleChartSourceWithoutSourceId = {
  sources:[{ ref:'chart-doc', page:7, excerpt:'Chart source excerpt.' }]
};
assert.ok(
  /^Source chart-doc/.test(sourceTraceNoteText({ sourceTrace:visibleChartSourceWithoutSourceId })),
  'source trace note fallback can show opt-in chart source text from ref/page/excerpt'
);
assert.equal(
  sourceTraceObjectIsExplainable(visibleChartSourceWithoutSourceId, { requireSourceId:true }),
  false,
  'chart QA can remain stricter than visible source notes when sourceIds are absent'
);
assert.ok(
  /^Source doc-ref/.test(sourceTraceNoteText({
    sourceTrace:{ sources:[{ ref:'doc-ref', page:3, excerpt:'Document excerpt.' }] }
  })),
  'source trace note fallback should support ref aliases when visible notes are explicitly requested'
);
assert.ok(
  /^Source brief.pdf/.test(sourceTraceNoteText({
    sourceTrace:{ sources:[{ file:'brief.pdf', page:4, excerpt:'File excerpt.' }] }
  })),
  'source trace note fallback should support file aliases when visible notes are explicitly requested'
);
assert.ok(
  /^Source asset-a/.test(sourceTraceNoteText({
    sourceTrace:{ sources:[{ assetId:'asset-a', page:5, excerpt:'Asset excerpt.' }] }
  })),
  'source trace note fallback should support assetId aliases when visible notes are explicitly requested'
);
assert.equal(
  sourceTraceNoteText({
    sourceTrace:{ sourceIds:['src-a'], sources:[{ name:'src-a', page:3, excerpt:'Name-only source excerpt.' }] }
  }),
  '',
  'source trace note fallback should not imply sourceIds match name-only entries'
);
const canonicalMergedTrace = sourceTraceForSlide({
  source_ids:'src-slide-top',
  image_provenance:[{ ref:'slide-top-image', authorizationStatus:'licensed' }],
  asset_authorization_statuses:['needs-review'],
  sourceTrace:{
    source_ids:'src-slide',
    sources:[{ id:'src-slide', page:'2', excerpt:'slide excerpt' }],
    imageProvenance:[{ ref:'slide-image', authorizationStatus:'cleared' }],
    assetAuthorizationStatus:'cleared'
  },
  proof:{
    sourceIds:'src-proof-top',
    imageProvenance:[{ ref:'proof-top-image', authorizationStatus:'internal-only' }],
    assetAuthorizationStatuses:['internal-only'],
    sources:[{ id:'src-proof-top', page:'1', excerpt:'proof top excerpt' }],
    sourceTrace:{
      sourceIds:'src-proof',
      sources:[{ id:'src-proof', page:'1', excerpt:'proof excerpt' }],
      imageProvenance:[{ ref:'proof-image', authorizationStatus:'cleared' }],
      assetAuthorizationStatus:'cleared'
    }
  }
});
assert.deepEqual(
  canonicalMergedTrace.sourceIds,
  ['src-proof-top', 'src-proof', 'src-slide', 'src-slide-top'],
  'canonical source trace should merge scalar and alias source ids from proof and slide'
);
assert.deepEqual(
  canonicalMergedTrace.sources.map(source => source.id),
  ['src-proof-top', 'src-proof', 'src-slide', 'src-slide-top'],
  'canonical source trace should preserve top-level, proof, and slide source entries'
);
assert.deepEqual(
  canonicalMergedTrace.imageProvenance.map(item => item.ref),
  ['proof-top-image', 'proof-image', 'slide-image', 'slide-top-image'],
  'canonical source trace should merge top-level and sourceTrace image provenance from proof and slide'
);
assert.equal(canonicalMergedTrace.assetAuthorizationStatus, 'needs-review');

const claimSlideWithModelHints = slideFromClaim({
  claim:'模型给出组件建议',
  support:'模型 hints 只应进入 previous 审计字段。',
  proof_object:'metric-board',
  componentHints:['kpi-strip'],
  componentSuggestions:['caption-bar'],
  metrics:[{ label:'OEE', value:'82%' }]
});
assert.equal(claimSlideWithModelHints.componentHints, undefined);
assert.deepEqual(claimSlideWithModelHints.previousComponentHints, ['kpi-strip']);
assert.deepEqual(claimSlideWithModelHints.previousComponentSuggestions, ['caption-bar']);

const industrialClaimWithConsumerPlan = slideFromClaim({
  claim:'OEE 和质量得分证明现场效率改善',
  support:'设备效率改善来自现场质量动作。',
  proof_object:'oee-board',
  metrics:[{ label:'OEE', value:'82%' }],
  componentHints:['hero-image', 'caption-bar'],
  componentPlan:{
    version:'component-plan/v1',
    industryEvidenceChain:{ chainId:'consumer-beauty', stageId:'visual-claim', components:['hero-image', 'caption-bar'] },
    components:[{ id:'hero-image', required:true }, { id:'caption-bar', required:true }]
  }
});
assert.deepEqual(industrialClaimWithConsumerPlan.previousComponentHints, ['hero-image', 'caption-bar']);
industrialClaimWithConsumerPlan.type = 'metric-comparison';
industrialClaimWithConsumerPlan.layoutVariant = 'oee-board';
industrialClaimWithConsumerPlan.oee = { quality:'96%' };
const normalizedIndustrialClaim = normalizeSlide({ industry:'manufacturing-operations' }, industrialClaimWithConsumerPlan, 0, 1);
assert.equal(normalizedIndustrialClaim.componentPlan.componentIds.includes('hero-image'), false);
assert.equal(
  normalizedIndustrialClaim.componentPlan.components.some(component => component.id === 'caption-bar' && component.source === 'component-hint'),
  false
);
assert.ok(normalizedIndustrialClaim.previousComponentPlan);
assert.equal(normalizedIndustrialClaim.previousComponentHints.length, 2);

const userDeckHintStillExecutes = normalizeSlide({ industry:'manufacturing-operations' }, {
  type:'metric-comparison',
  layoutVariant:'oee-board',
  proofObject:'oee-board',
  title:'用户 deck plan 显式组件偏好',
  metrics:[{ label:'OEE', value:'82%' }],
  oee:{ quality:'96%' },
  componentHints:['kpi-strip']
}, 0, 1);
assert.ok(
  userDeckHintStillExecutes.componentPlan.components.some(component => component.id === 'kpi-strip' && component.source === 'component-hint'),
  'direct user deck componentHints should remain executable'
);

const industrialDeckWithUnsupportedHint = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[{
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'工业页带无证据 hero hint',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ quality:'96%' },
    componentHints:['hero-image']
  }]
});
const unsupportedHintAudit = auditIndustryEvidenceChain(industrialDeckWithUnsupportedHint);
assert.ok(
  unsupportedHintAudit.findings.some(finding => finding.type === 'componentHintEvidenceMissing' && finding.componentId === 'hero-image'),
  'QA should flag component-hint outside the canonical industry chain without evidence fields'
);

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
  assert.equal(report.metrics.recognizedSlides, 3);
  assert.ok(report.metrics.componentHits >= 3, `${sample.id} should hit evidence components`);
  assert.ok(report.metrics.consumedHits >= 3, `${sample.id} should consume evidence components`);
});

const sameSemanticIndustrial = normalizeSlide(
  { industry:'manufacturing-operations', title:'产品能力证据' },
  {
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'产品能力证据落在 OEE、质量和现场交付',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ availability:'90%' },
    cards:[{ title:'质量复盘', body:'停机和良率回到设备动作。' }],
    proof:{ explanation:'工业证据链不使用消费 SKU 矩阵。' }
  },
  1,
  3
);
assert.equal(sameSemanticIndustrial.componentPlan.componentIds.includes('quality-scorecard'), true);
assert.equal(sameSemanticIndustrial.componentPlan.componentIds.includes('product-matrix'), false);

const staleConsumerPlanOnIndustrial = normalizeSlide(
  { industry:'manufacturing-operations', title:'旧计划污染治理' },
  {
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'OEE 和质量得分证明现场效率改善',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ availability:'90%', quality:'96%' },
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        chainLabel:'消费/美妆',
        stageId:'visual-claim',
        stageLabel:'视觉主张',
        position:1,
        confidence:'high',
        components:['hero-image', 'caption-bar'],
        matchedFields:['images'],
        matchedProofObjects:['lookbook'],
        matchedKeywords:[]
      },
      componentIds:['hero-image', 'caption-bar'],
      components:[{ id:'hero-image', required:true }, { id:'caption-bar', required:true }]
    }
  },
  1,
  3
);
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.industryEvidenceChain.chainId, 'industrial-manufacturing');
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.industryEvidenceChain.stageId, 'operations-quality-evidence');
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.componentIds.includes('quality-scorecard'), true);
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.componentIds.includes('hero-image'), false);
assert.equal(staleConsumerPlanOnIndustrial.componentPlan.industryEvidenceChain.components.includes('caption-bar'), true);
assert.equal(staleConsumerPlanOnIndustrial.previousIndustryEvidenceChain.chainId, 'consumer-beauty');
assert.equal(staleConsumerPlanOnIndustrial.industryEvidenceChainConflict.currentChainId, 'industrial-manufacturing');
const staleConsumerAudit = auditIndustryEvidenceChain(
  { industry:'manufacturing-operations' },
  { industry:'manufacturing-operations', slides:[staleConsumerPlanOnIndustrial] }
);
assert.ok(
  staleConsumerAudit.findings.some(finding => finding.type === 'industryEvidenceChainStale'),
  'QA should expose suppressed stale chain on normalized slides'
);
assert.equal(staleConsumerAudit.industry_evidence_chain_summary.conflictSummary.suppressedComponentPlanSlides, 1);

const previousSameStageWrongComponents = normalizeSlide(
  { industry:'manufacturing-operations' },
  {
    type:'industry-chart',
    layoutVariant:'oee-board',
    proofObject:'downtime-pareto',
    title:'OEE 停机损失需要按设备和原因拆解',
    metrics:[{ label:'OEE', value:'64%' }],
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'industrial-manufacturing',
        stageId:'operations-quality-evidence',
        components:['hero-image', 'product-matrix'],
        matchedFields:[],
        matchedProofObjects:[],
        matchedKeywords:[],
        matchedRoutes:[],
        evidenceReasons:[]
      }
    }
  },
  1,
  3
);
const previousSameStageAudit = auditIndustryEvidenceChain(
  { industry:'manufacturing-operations' },
  { industry:'manufacturing-operations', slides:[previousSameStageWrongComponents] }
);
assert.ok(
  previousSameStageAudit.findings.some(finding => finding.type === 'previousIndustryEvidenceChainComponentMismatch'),
  'QA should flag same-stage previous chain component mismatches'
);
assert.equal(previousSameStageAudit.industry_evidence_chain_summary.conflictSummary.previousChainComponentMismatchSlides, 1);

const suppressedGeneratedPromptPlan = normalizeDeckPlan({
  industry:'manufacturing-operations',
  slides:[{
    type:'industry-chart',
    proofObject:'downtime-pareto',
    title:'OEE 停机损失',
    claim:'OEE 停机损失需要按设备和原因拆解。',
    metrics:[{ label:'OEE', value:'64%' }],
    assetGeneration:{ status:'required', decisionSource:'asset-generation-policy/v1', reason:'old prompt decision' },
    generatedAssetPrompt:'old consumer lookbook product hero image prompt'
  }]
});
assert.equal(suppressedGeneratedPromptPlan.slides[0].generatedAssetPrompt, undefined);
assert.equal(suppressedGeneratedPromptPlan.slides[0].previousGeneratedAssetPrompt, 'old consumer lookbook product hero image prompt');
assert.equal(
  auditIndustryEvidenceChain(suppressedGeneratedPromptPlan).industry_evidence_chain_summary.conflictSummary.suppressedGeneratedPromptSlides,
  1,
  'compact summary should expose suppressed generated prompt slides'
);

const rawAuditWithSuppressedInputChain = auditIndustryEvidenceChain({
  industry:'manufacturing-operations',
  slides:[{
    type:'content',
    title:'普通说明页',
    claim:'没有足够工业证据字段',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        stageId:'consumer-product-scene-proof',
        components:['product-matrix'],
        matchedFields:[],
        matchedProofObjects:[],
        matchedKeywords:[],
        matchedRoutes:[],
        evidenceReasons:[]
      },
      componentIds:['product-matrix'],
      components:[{ id:'product-matrix', source:'component-hint', required:true }]
    }
  }]
});
assert.notEqual(rawAuditWithSuppressedInputChain.slides[0].chainId, 'consumer-beauty');
assert.ok(
  rawAuditWithSuppressedInputChain.findings.some(finding => finding.type === 'industryEvidenceChainInputSuppressed'),
  'raw QA should suppress supplied chains instead of treating them as current chain'
);

const canonicalGrammarProbe = canonicalIndustryEvidenceChainForSlide(
  { industry:'manufacturing-operations' },
  {
    type:'industry-chart',
    proofObject:'downtime-pareto',
    title:'OEE 停机损失',
    metrics:[{ label:'OEE', value:'64%' }],
    componentPlan:{
      industryEvidenceChain:{
        chainId:'industrial-manufacturing',
        stageId:'operations-quality-evidence',
        components:['quality-scorecard'],
        matchedFields:['metrics'],
        matchedProofObjects:['downtime-pareto'],
        visualGrammar:{ source:'stale-consumer-grammar' }
      }
    }
  }
);
assert.equal(canonicalGrammarProbe.visualGrammar, null, 'canonical chain should not inherit supplied visualGrammar');

const sameSemanticConsumer = normalizeSlide(
  { industry:'beauty-consumer', title:'产品能力证据' },
  {
    type:'case-gallery',
    layoutVariant:'product-evidence-story',
    proofObject:'product-evidence-story',
    title:'产品能力证据落在 SKU、质地和体验承诺',
    images:['sku.png'],
    productStory:[{ product:'精华', scene:'修护', benefit:'质地证明', businessMeaning:'复购入口' }],
    proof:{ explanation:'消费证据链使用产品矩阵承接体验承诺。' }
  },
  1,
  3
);
assert.equal(sameSemanticConsumer.componentPlan.componentIds.includes('product-matrix'), true);
assert.equal(sameSemanticConsumer.componentPlan.componentIds.includes('equipment-nameplate'), false);

const keywordHeavyFinance = normalizeSlide(
  { industry:'finance-investment', title:'同词不同业' },
  {
    type:'portfolio-table',
    layoutVariant:'portfolio-action-table',
    proofObject:'portfolio-action-table',
    title:'风险 收益 风险 收益 风险 但结构字段是组合配置',
    portfolio:[{ name:'项目A', allocation:'20%' }],
    rows:[['项目A', '增持', '现金流修复']],
    sourceNote:'组合月报，2026-05。'
  },
  2,
  3
);
assert.equal(keywordHeavyFinance.componentPlan.industryEvidenceChain.stageId, 'asset-portfolio-logic');

const sameWords = '质量 效率 风险 产品 流程 证据';
const confusionMatrix = [
  {
    industry: 'manufacturing-operations',
    slide: {
      type:'metric-comparison',
      layoutVariant:'oee-board',
      proofObject:'oee-board',
      title:sameWords,
      metrics:[{ label:'OEE', value:'82%' }],
      oee:{ quality:'96%' }
    },
    stage: 'operations-quality-evidence',
    component: 'quality-scorecard'
  },
  {
    industry: 'beauty-consumer',
    slide: {
      type:'case-gallery',
      layoutVariant:'product-evidence-story',
      proofObject:'product-evidence-story',
      title:sameWords,
      images:['sku.png'],
      productStory:[{ product:'精华', benefit:'体验证明' }]
    },
    stage: 'product-experience-promise',
    component: 'product-matrix'
  },
  {
    industry: 'finance-investment',
    slide: {
      type:'risk-table',
      layoutVariant:'guidance-and-risk-board',
      proofObject:'guidance-and-risk-board',
      title:sameWords,
      metrics:[{ label:'IRR', value:'18%' }],
      risks:[{ title:'集中度', level:'高' }],
      rows:[['集中度', '高', '设置上限']],
      sourceNote:'风控台账，2026-05。'
    },
    stage: 'return-risk-evidence',
    component: 'risk-register'
  },
  {
    industry: 'healthcare-operations',
    slide: {
      type:'architecture',
      layoutVariant:'service-blueprint',
      proofObject:'service-blueprint',
      title:sameWords,
      serviceBlueprint:{ stages:['预约', '检查'], frontstage:['导诊'], backstage:['检验科'] },
      touchpoints:[{ title:'检查交接', owner:'影像科' }],
      handoffs:[{ title:'检查到随访', owner:'护士站' }]
    },
    stage: 'process-touchpoint',
    component: 'service-blueprint-lane'
  },
  {
    industry: 'saas-technology',
    slide: {
      type:'industry-chart',
      layoutVariant:'adoption-funnel',
      proofObject:'adoption-funnel',
      title:sameWords,
      adoptionFunnel:{ steps:[{ label:'注册', value:'100%' }, { label:'激活', value:'64%' }] },
      metrics:[{ label:'NRR', value:'118%' }]
    },
    stage: 'adoption-efficiency-evidence',
    component: 'adoption-funnel'
  }
];
confusionMatrix.forEach(testCase => {
  const normalized = normalizeSlide({ industry:testCase.industry }, testCase.slide, 1, 3);
  assert.equal(normalized.componentPlan.industryEvidenceChain.stageId, testCase.stage, `${testCase.industry} same-word stage`);
  assert.equal(normalized.componentPlan.componentIds.includes(testCase.component), true, `${testCase.industry} same-word component`);
});

const saasPrototypeWithoutScreens = normalizeSlide(
  { industry:'saas-technology' },
  {
    type:'case-gallery',
    layoutVariant:'prototype-flow',
    proofObject:'prototype-flow',
    title:'工作流原型缺少截图时不生成空壳 prototype-frame',
    workflow:[{ title:'审批', body:'状态回写。' }]
  },
  2,
  3
);
assert.equal(saasPrototypeWithoutScreens.componentPlan.componentIds.includes('workflow-rail'), true);
assert.equal(saasPrototypeWithoutScreens.componentPlan.componentIds.includes('prototype-frame'), false);

const neutral = inferIndustryEvidenceChain(
  { industry:'manufacturing-operations' },
  { type:'content', title:'普通管理叙述', cards:[{ title:'背景', body:'说明方向。' }] }
);
assert.equal(neutral.stageId, 'neutral-general');
assert.equal(neutral.confidence, 'neutral');

const badIndustrialBrandized = {
  industry:'manufacturing-operations',
  slides:[{
    type:'metric-comparison',
    title:'工业页被消费品牌化',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'industrial-manufacturing',
        chainLabel:'工业制造',
        stageId:'operations-quality-evidence',
        stageLabel:'运营/质量证据',
        position:3,
        confidence:'high',
        components:['quality-scorecard'],
        matchedFields:['metrics'],
        matchedProofObjects:['oee-board'],
        matchedKeywords:[]
      },
      componentIds:['product-matrix'],
      components:[{ id:'product-matrix', required:true }]
    },
    metrics:[{ label:'OEE', value:'82%' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badIndustrialBrandized).findings.some(finding => finding.type === 'crossIndustryComponentMismatch'),
  'QA should flag industrial page consumer-brandized as product-matrix'
);

const badConsumerIndustrialized = {
  industry:'beauty-consumer',
  slides:[{
    type:'case-gallery',
    title:'消费页被工业化',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        chainLabel:'消费/美妆',
        stageId:'product-experience-promise',
        stageLabel:'产品/体验承诺',
        position:2,
        confidence:'high',
        components:['product-matrix'],
        matchedFields:['productStory'],
        matchedProofObjects:['product-evidence-story'],
        matchedKeywords:[]
      },
      componentIds:['equipment-nameplate'],
      components:[{ id:'equipment-nameplate', required:true }]
    },
    productStory:[{ product:'精华' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badConsumerIndustrialized).findings.some(finding => finding.type === 'crossIndustryComponentMismatch'),
  'QA should flag consumer page industrialized as equipment-nameplate'
);

const malformedStaleChain = {
  industry:'manufacturing-operations',
  slides:[{
    type:'metric-comparison',
    layoutVariant:'oee-board',
    proofObject:'oee-board',
    title:'OEE 质量证据带着坏的旧 chain',
    metrics:[{ label:'OEE', value:'82%' }],
    oee:{ quality:'96%' },
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'consumer-beauty',
        stageId:'visual-claim'
      },
      componentIds:['quality-scorecard'],
      components:[{ id:'quality-scorecard', required:true }]
    }
  }]
};
const malformedReport = auditIndustryEvidenceChain(malformedStaleChain);
assert.ok(
  malformedReport.findings.some(finding => finding.type === 'industryEvidenceChainInvalid'),
  'QA should flag malformed input chain instead of throwing planUnreadable'
);
assert.ok(
  malformedReport.findings.some(finding => finding.type === 'industryEvidenceChainMismatch'),
  'QA should flag stale input chain identity mismatch'
);
assert.equal(
  malformedReport.findings.some(finding => finding.type === 'planUnreadable'),
  false,
  'malformed input chain should not be reported as planUnreadable'
);
assert.equal(
  malformedReport.industry_evidence_chain_summary.conflictSummary.chainMismatchSlides,
  1,
  'compact summary should count unique chain mismatch slides'
);
assert.equal(
  malformedReport.industry_evidence_chain_summary.conflictSummary.chainMismatchFindings,
  2,
  'compact summary should expose chain mismatch finding count separately'
);

const malformedPreviousNormalized = normalizeDeckPlan(malformedStaleChain);
const malformedPreviousReport = auditIndustryEvidenceChain(malformedStaleChain, malformedPreviousNormalized);
assert.ok(
  malformedPreviousReport.findings.some(finding => finding.type === 'previousIndustryEvidenceChainInvalid'),
  'normalized QA should preserve malformed previous chain diagnostics'
);
assert.equal(
  malformedPreviousReport.industry_evidence_chain_summary.conflictSummary.previousChainInvalidSlides,
  1,
  'compact summary should count malformed previous chain slides'
);

const missingSegment = normalizeDeckPlan({
  industry:'finance-investment',
  title:'缺段金融证据链',
  slides:[
    fixture.samples[2].plan.slides[0],
    fixture.samples[2].plan.slides[0],
    fixture.samples[2].plan.slides[2]
  ]
});
assert.ok(
  auditIndustryEvidenceChain(missingSegment).findings.some(finding => finding.type === 'chainSegmentMissing'),
  'QA should flag chain segment missing'
);

const consumer = normalizeDeckPlan(fixture.samples[1].plan);
const missingConsumptionMeta = renderMetaFor(consumer);
missingConsumptionMeta.slides[1].consumedComponents = missingConsumptionMeta.slides[1].consumedComponents.filter(component => component.id !== 'product-matrix');
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: missingConsumptionMeta }).findings.some(finding => finding.type === 'industryEvidenceComponentNotConsumed'),
  'QA should flag planned industry component not consumed by renderer'
);

const missingRenderMetaFields = renderMetaFor(consumer);
delete missingRenderMetaFields.slides[1].consumedComponents[0].chainStage;
missingRenderMetaFields.slides[1].consumedComponents[0].bbox = null;
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: missingRenderMetaFields }).findings.some(finding => finding.type === 'industryEvidenceRenderMetaFieldMissing'),
  'QA should flag missing industry render-meta chain fields'
);
assert.ok(
  auditIndustryEvidenceChain(fixture.samples[1].plan, consumer, { renderMeta: missingRenderMetaFields }).findings.some(finding => finding.type === 'industryEvidenceComponentBboxMissing'),
  'QA should flag missing industry component bbox'
);

const badFinanceSourceNote = {
  industry:'finance-investment',
  slides:[{
    type:'finance-bridge',
    title:'金融页缺 source 却声明 source-note',
    componentPlan:{
      version:'component-plan/v1',
      industryEvidenceChain:{
        chainId:'finance-investment',
        chainLabel:'金融投资',
        stageId:'judgment-framework',
        stageLabel:'判断框架',
        position:1,
        confidence:'high',
        components:['value-chain', 'source-note'],
        matchedFields:['investmentThesis'],
        matchedProofObjects:['return-bridge'],
        matchedKeywords:[]
      },
      componentIds:['source-note'],
      components:[{ id:'source-note', required:true }]
    },
    investmentThesis:'估值修复判断。'
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badFinanceSourceNote).findings.some(finding => finding.type === 'sourceCoverageLow'),
  'QA should flag finance source-note without source fields'
);

const financeSourceTraceOnly = normalizeDeckPlan({
  industry:'finance-investment',
  slides:[{
    type:'finance-bridge',
    proofObject:'return-bridge',
    title:'组合估值与退出假设',
    claim:'退出假设来自组合月报 sourceTrace。',
    investmentThesis:'估值修复判断。',
    bridge:[{ label:'基准估值', value:10 }, { label:'退出折价', value:-2 }],
    sourceTrace:{
      version:'source-trace/v2',
      sourceIds:['src-finance-1'],
      sources:[{ id:'src-finance-1', page:3, excerpt:'组合月报披露估值与退出假设。' }]
    }
  }]
});
const financeSourceTraceOnlyAudit = auditIndustryEvidenceChain(
  { industry:'finance-investment' },
  financeSourceTraceOnly
);
assert.ok(
  !financeSourceTraceOnly.slides[0].componentPlan.componentIds.includes('source-note'),
  'sourceTrace should remain internal and should not render source-note by default'
);
assert.ok(
  financeSourceTraceOnly.slides[0].componentPlan.industryEvidenceChain.hasSourceEvidence,
  'sourceTrace with page and excerpt should still satisfy internal source evidence'
);
assert.equal(
  financeSourceTraceOnlyAudit.findings.some(finding => finding.type === 'sourceCoverageLow'),
  false,
  'sourceTrace-only slides should not be reported as missing all source/provenance'
);
assert.equal(
  financeSourceTraceOnlyAudit.findings.some(finding => finding.type === 'visibleSourceNoteMissing'),
  false,
  'formal PPT QA should not require visible source-note text'
);

const financeSourceTraceNoteOnly = normalizeDeckPlan({
  industry:'finance-investment',
  slides:[{
    type:'finance-bridge',
    proofObject:'return-bridge',
    title:'组合估值与退出假设',
    investmentThesis:'估值修复判断。',
    sourceTrace:{
      version:'source-trace/v2',
      sourceNote:'组合月报，2026-05。'
    }
  }]
});
const financeSourceTraceNoteOnlyAudit = auditIndustryEvidenceChain(
  { industry:'finance-investment' },
  financeSourceTraceNoteOnly
);
assert.equal(
  financeSourceTraceNoteOnly.slides[0].componentPlan.industryEvidenceChain.hasSourceEvidence,
  false,
  'sourceTrace.sourceNote without page/excerpt should not satisfy internal source evidence'
);
assert.ok(
  financeSourceTraceNoteOnlyAudit.findings.some(finding => finding.type === 'sourceCoverageLow'),
  'sourceTrace.sourceNote without structured evidence should still be reviewed as low source coverage'
);

const financeVisibleSourceOptIn = normalizeDeckPlan({
  industry:'finance-investment',
  visibleSourceNotes:true,
  slides:[{
    type:'finance-bridge',
    proofObject:'return-bridge',
    title:'组合估值与退出假设',
    investmentThesis:'估值修复判断。',
    sourceTrace:{
      version:'source-trace/v2',
      sourceIds:['src-finance-1'],
      sources:[{ id:'src-finance-1', page:3, excerpt:'组合月报披露估值与退出假设。' }]
    }
  }]
});
assert.ok(
  financeVisibleSourceOptIn.slides[0].componentPlan.componentIds.includes('source-note'),
  'visible source-note remains available only when explicitly enabled'
);
['no visible source notes', 'do not render source notes'].forEach(policy => {
  const hiddenByPolicy = normalizeDeckPlan({
    industry:'finance-investment',
    sourceNotePolicy:policy,
    slides:[{
      type:'finance-bridge',
      proofObject:'return-bridge',
      title:'组合估值与退出假设',
      investmentThesis:'估值修复判断。',
      sourceTrace:{
        version:'source-trace/v2',
        sourceIds:['src-finance-1'],
        sources:[{ id:'src-finance-1', page:3, excerpt:'组合月报披露估值与退出假设。' }]
      }
    }]
  });
  assert.ok(
    !hiddenByPolicy.slides[0].componentPlan.componentIds.includes('source-note'),
    `${policy} should not opt into visible source-note`
  );
});
['yes', 'enabled'].forEach(policy => {
  const ambiguousPolicy = normalizeDeckPlan({
    industry:'finance-investment',
    sourceNotePolicy:policy,
    slides:[{
      type:'finance-bridge',
      proofObject:'return-bridge',
      title:'组合估值与退出假设',
      investmentThesis:'估值修复判断。',
      sourceTrace:{
        version:'source-trace/v2',
        sourceIds:['src-finance-1'],
        sources:[{ id:'src-finance-1', page:3, excerpt:'组合月报披露估值与退出假设。' }]
      }
    }]
  });
  assert.ok(
    !ambiguousPolicy.slides[0].componentPlan.componentIds.includes('source-note'),
    `${policy} should not be treated as a visible source-note opt-in`
  );
});
const explicitSourceTracePolicyOff = normalizeDeckPlan({
  industry:'finance-investment',
  visibleSourceNotes:true,
  sourceTracePolicy:{ visibleSourceNotes:false },
  slides:[{
    type:'finance-bridge',
    proofObject:'return-bridge',
    title:'组合估值与退出假设',
    investmentThesis:'估值修复判断。',
    sourceTrace:{
      version:'source-trace/v2',
      sourceIds:['src-finance-1'],
      sources:[{ id:'src-finance-1', page:3, excerpt:'组合月报披露估值与退出假设。' }]
    }
  }]
});
assert.ok(
  !explicitSourceTracePolicyOff.slides[0].componentPlan.componentIds.includes('source-note'),
  'sourceTracePolicy.visibleSourceNotes:false should explicitly disable visible source-note'
);

const badSaasPrototypeClaim = {
  industry:'saas-technology',
  slides:[{
    type:'case-gallery',
    title:'SaaS 声明 prototype 但没有截图',
    proofObject:'prototype-flow',
    prototype:{ state:'审批流原型' },
    workflow:[{ title:'审批', body:'状态回写' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badSaasPrototypeClaim, normalizeDeckPlan(badSaasPrototypeClaim)).findings.some(finding => finding.type === 'prototypeEvidenceMissing'),
  'QA should flag SaaS prototype-frame without screenshot/image evidence'
);

const badHealthcareHandoffClaim = {
  industry:'healthcare-operations',
  slides:[{
    type:'architecture',
    title:'医疗声明交接但缺少交接字段',
    proofObject:'service-blueprint',
    componentHints:['service-blueprint-lane'],
    claim:'交接流程已建立。'
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badHealthcareHandoffClaim, normalizeDeckPlan(badHealthcareHandoffClaim)).findings.some(finding => finding.type === 'healthcareHandoffEvidenceMissing'),
  'QA should flag healthcare service-blueprint-lane without handoff fields'
);

const formalSeverity = applyQualitySeverityPolicy([
  { level:'review', type:'chainSegmentMissing', message:'missing stage' },
  { level:'review', type:'crossIndustryComponentMismatch', message:'wrong component' },
  { level:'review', type:'prototypeEvidenceMissing', message:'missing prototype screenshot' },
  { level:'review', type:'healthcareHandoffEvidenceMissing', message:'missing handoff fields' },
  { level:'review', type:'sourceCoverageLow', message:'missing source' },
  { level:'review', type:'componentHintEvidenceMissing', message:'unsupported hint' },
  { level:'review', type:'industryEvidenceChainInputSuppressed', message:'input chain suppressed' },
  { level:'review', type:'previousIndustryEvidenceChainInvalid', message:'previous chain invalid' },
  { level:'review', type:'previousIndustryEvidenceChainComponentMismatch', message:'previous chain components mismatch' }
], 'formal');
assert.equal(formalSeverity.findings.every(finding => finding.level === 'fail'), true);

console.log('industry evidence chain ok');
