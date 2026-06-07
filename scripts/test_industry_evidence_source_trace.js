const assert = require('assert/strict');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');
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
  slideFromClaim
} = require('./material/claim-to-slide');

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
assert.deepEqual(nestedSnakeCaseTrace.sourceIds, ['src-proof-snake', 'src-slide-snake', 'src-chart-snake']);
assert.equal(sourceTraceObjectIsExplainable(nestedSnakeCaseTrace, { requireSourceId:true }), true);
assert.equal(nestedSnakeCaseTrace.sourceNote, 'Slide snake trace note');
assert.equal(nestedSnakeCaseTrace.imageProvenance[0].ref, 'slide-snake-image');
assert.equal(sourceTraceNoteText({ proof:{ source_note:'Proof snake source note' } }), 'Proof snake source note');
assert.equal(sourceTraceNoteText({ source_trace:{ source_note:'Trace snake note' } }), 'Trace snake note');
assert.equal(hasSourceTraceRefs({ sourceTrace:{ sourceNote:'Display source note only' } }), false);
assert.equal(hasStructuredSourceTraceSignal({ sourceTrace:{ sourceIds:['src-abc'] } }), true);
assert.equal(hasTextSourceTraceSignal({ sourceTrace:{ sourceIds:['src-abc'] } }), true);
assert.equal(hasTextSourceTraceSignal({ sourceTrace:{ imageProvenance:[{ id:'img-a' }], assetAuthorizationStatus:'blocked' } }), false);
assert.equal(hasAssetProvenanceSignal({ sourceTrace:{ imageProvenance:[{ id:'img-a' }] } }), true);
assert.equal(hasAssetProvenanceSignal({ sourceTrace:{ assetAuthorizationStatus:'unknown' } }), true);
assert.equal(hasAssetProvenanceSignal({ sourceTrace:{ assetAuthorizationStatus:'none' } }), false);
assert.equal(hasSourceTraceRefs({ sourceTrace:{ assetAuthorizationStatus:'none' } }), false);
assert.equal(hasVisibleSourceNote({ sourceNote:'Display source note only' }), true);
assert.deepEqual(sourceEntryIds({ ref:'doc-ref', file:'doc.pdf', assetId:'asset-a', asset_id:'asset-b' }), ['doc-ref', 'doc.pdf', 'asset-a', 'asset-b']);
assert.deepEqual(sourceEntryIds({ name:'human readable label' }), []);
assert.deepEqual(sourceIdentityValues({ sourceId:'src-id', ref:'doc-ref', file:'doc.pdf', asset_id:'asset-b', name:'ignored' }), ['src-id', 'doc-ref', 'doc.pdf', 'asset-b']);
assert.equal(sourceTraceObjectIsExplainable({
  sourceIds:['doc-ref'],
  sources:[{ ref:'doc-ref', page:3, excerpt:'Document excerpt.' }]
}, { requireSourceId:true }), true);
assert.equal(sourceTraceObjectIsExplainable({
  sourceIds:['src-a'],
  sources:[{ id:'src-a', sourcePage:'p5', excerpt:'Document excerpt.' }]
}, { requireSourceId:true }), true);

const visibleChartSourceWithoutSourceId = {
  sources:[{ ref:'chart-doc', page:7, excerpt:'Chart source excerpt.' }]
};
assert.ok(/^Source chart-doc/.test(sourceTraceNoteText({ sourceTrace:visibleChartSourceWithoutSourceId })));
assert.equal(sourceTraceObjectIsExplainable(visibleChartSourceWithoutSourceId, { requireSourceId:true }), false);
assert.ok(/^Source doc-ref/.test(sourceTraceNoteText({ sourceTrace:{ sources:[{ ref:'doc-ref', page:3, excerpt:'Document excerpt.' }] } })));
assert.ok(/^Source brief.pdf/.test(sourceTraceNoteText({ sourceTrace:{ sources:[{ file:'brief.pdf', page:4, excerpt:'File excerpt.' }] } })));
assert.ok(/^Source asset-a/.test(sourceTraceNoteText({ sourceTrace:{ sources:[{ assetId:'asset-a', page:5, excerpt:'Asset excerpt.' }] } })));
assert.equal(sourceTraceNoteText({
  sourceTrace:{ sourceIds:['src-a'], sources:[{ name:'src-a', page:3, excerpt:'Name-only source excerpt.' }] }
}), '');

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
assert.deepEqual(canonicalMergedTrace.sourceIds, ['src-proof-top', 'src-proof', 'src-slide', 'src-slide-top']);
assert.deepEqual(canonicalMergedTrace.sources.map(source => source.id), ['src-proof-top', 'src-proof', 'src-slide', 'src-slide-top']);
assert.deepEqual(canonicalMergedTrace.imageProvenance.map(item => item.ref), ['proof-top-image', 'proof-image', 'slide-image', 'slide-top-image']);
assert.equal(canonicalMergedTrace.assetAuthorizationStatus, 'needs-review');

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
assert.ok(auditIndustryEvidenceChain(badFinanceSourceNote).findings.some(finding => finding.type === 'sourceCoverageLow'));

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
const financeSourceTraceOnlyAudit = auditIndustryEvidenceChain({ industry:'finance-investment' }, financeSourceTraceOnly);
assert.ok(!financeSourceTraceOnly.slides[0].componentPlan.componentIds.includes('source-note'));
assert.ok(financeSourceTraceOnly.slides[0].componentPlan.industryEvidenceChain.hasSourceEvidence);
assert.equal(financeSourceTraceOnlyAudit.findings.some(finding => finding.type === 'sourceCoverageLow'), false);
assert.equal(financeSourceTraceOnlyAudit.findings.some(finding => finding.type === 'visibleSourceNoteMissing'), false);

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
const financeSourceTraceNoteOnlyAudit = auditIndustryEvidenceChain({ industry:'finance-investment' }, financeSourceTraceNoteOnly);
assert.equal(financeSourceTraceNoteOnly.slides[0].componentPlan.industryEvidenceChain.hasSourceEvidence, false);
assert.ok(financeSourceTraceNoteOnlyAudit.findings.some(finding => finding.type === 'sourceCoverageLow'));

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
assert.ok(financeVisibleSourceOptIn.slides[0].componentPlan.componentIds.includes('source-note'));

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
  assert.ok(!hiddenByPolicy.slides[0].componentPlan.componentIds.includes('source-note'));
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
  assert.ok(!ambiguousPolicy.slides[0].componentPlan.componentIds.includes('source-note'));
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
assert.ok(!explicitSourceTracePolicyOff.slides[0].componentPlan.componentIds.includes('source-note'));

console.log('industry evidence source trace ok');
