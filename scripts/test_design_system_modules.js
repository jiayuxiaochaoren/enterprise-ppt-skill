const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const designSystem = require('./design-system');
const {
  bindGeneratedAssets
} = require('./assets/binder');
const {
  copyPolicyList,
  copyPolicyText,
  industryBenchmarksFor,
  industryMatchIds,
  visualIndustryId
} = designSystem;
const {
  createIndustryRuntime
} = require('./design/industry-runtime');
const {
  createArtDirectionHelpers
} = require('./design/art-direction');
const {
  createAcceptanceAuditHelpers
} = require('./design/acceptance-audit');
const {
  createAssetGenerationHelpers
} = require('./design/asset-generation');
const {
  BASE_COLORS,
  createStyleProfileHelpers,
  paletteToColors
} = require('./design/style-profile');
const {
  createVisualMediaHelpers
} = require('./design/visual-media');
const {
  createAestheticModelHelpers
} = require('./design/aesthetic-model');
const {
  createDeckContextHelpers
} = require('./design/deck-context');
const {
  createDesignSystemAuditRuntime
} = require('./design/design-system-audit-runtime');
const {
  createDesignSystemCoreRuntime
} = require('./design/design-system-core-runtime');
const {
  createCorePlanningAssembly
} = require('./design/design-system-core-planning-assembly');
const {
  createCoreRuntimeAssembly
} = require('./design/design-system-core-runtime-assembly');
const {
  DESIGN_SYSTEM_EXPORT_NAMES,
  buildDesignSystemExports
} = require('./design/design-system-exports');
const {
  createDesignSystemFoundationRuntime
} = require('./design/design-system-foundation-runtime');
const {
  createFoundationHelperSet,
  createFoundationResourceSet,
  createFoundationRuntimeParts
} = require('./design/design-system-foundation-runtime-assembly');
const {
  createFoundationHelperSet: createFoundationHelperSetDirect
} = require('./design/design-system-foundation-helpers');
const {
  createDesignSystemPlanningRuntime
} = require('./design/design-system-planning-runtime');
const {
  createPlanningRuntimeAssembly
} = require('./design/design-system-planning-runtime-assembly');
const {
  createPlanningAssetGenerationRuntime,
  createPlanningSlideRoutingRuntime
} = require('./design/design-system-planning-runtime-parts');
const {
  createDeckPlanNormalizationHelpers
} = require('./design/deck-plan-normalization');
const {
  createIndustryKnowledgeAuditHelpers
} = require('./design/industry-knowledge-audit');
const {
  createIndustryPolicyHelpers,
  deepMerge
} = require('./design/design-system-policy');
const {
  createProofObjectHelpers
} = require('./design/proof-object');
const {
  addComponent,
  componentIdFromHint,
  createComponentPlanHelpers,
  hasContactBlockData,
  isSystemPlannedComponent,
  normalizeComponentEntry,
  normalizeComponentId
} = require('./design/component-planning');
const {
  createComponentPlanningInputHelpers
} = require('./design/component-planning-inputs');
const componentPlanningNormalization = require('./design/component-planning-normalization');
const {
  createComponentPlanAuditHelpers
} = require('./design/component-plan-audit');
const {
  createDeckStructureAuditHelpers
} = require('./design/deck-structure-audit');
const {
  createDeckPlanAuditHelpers
} = require('./design/deck-plan-audit');
const {
  createEvidenceAuditHelpers
} = require('./design/evidence-audit');
const {
  createIndustryFitAuditHelpers
} = require('./design/industry-fit-audit');
const {
  canonicalComponentId,
  componentCapabilityFor,
  effectiveComponentModesFor,
  componentManifestAudit
} = require('./render/component-capability-manifest');
const {
  CAPABILITY_ROWS,
  CHART_COMPONENT_ID_LIST,
  COMPONENT_ALIASES,
  COMPONENT_DATA_REQUIREMENTS
} = require('./render/component-capability-data');
const {
  CAPABILITY_ROWS: CAPABILITY_ROW_SHARD
} = require('./render/component-capability-rows');
const {
  CHART_COMPONENT_ID_LIST: CHART_COMPONENT_ID_LIST_SHARD,
  COMPONENT_ALIASES: COMPONENT_ALIAS_SHARD,
  COMPONENT_DATA_REQUIREMENTS: COMPONENT_DATA_REQUIREMENTS_SHARD
} = require('./render/component-capability-contracts');
const {
  createRenderMetaHelpers
} = require('./render/render-meta');
const {
  effectiveImageAuthorizationStatus,
  imageProvenanceCanSatisfyFactualProof,
  imageProvenanceClass
} = require('./design/source-evidence');
const {
  createCompositionPlanningHelpers
} = require('./design/composition-planning');
const {
  createCompositionAuditHelpers
} = require('./design/composition-audit');
const {
  createReferenceRecipeHelpers
} = require('./design/reference-recipes');
const {
  createReferenceRecipeScoringHelpers
} = require('./design/reference-recipe-scoring');
const {
  createNarrativeHelpers
} = require('./design/narrative');
const {
  createSourceTraceAuditHelpers
} = require('./design/source-trace-audit');
const {
  createSourceTraceAuditPrimitives
} = require('./design/source-trace-audit-primitives');
const {
  createSourceTraceCoreHelpers
} = require('./design/source-trace-core');
const {
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS
} = require('./design/industry-knowledge');

assert.equal(visualIndustryId('industrial-energy'), 'manufacturing-operations');
assert.ok(industryMatchIds('brand-retail').includes('beauty-consumer'));
assert.deepEqual(Object.keys(designSystem), DESIGN_SYSTEM_EXPORT_NAMES);
assert.equal(buildDesignSystemExports({ constants:{ ASSET_DIR:'asset-dir' }, core:{ visualRole:'role' } }).ASSET_DIR, 'asset-dir');
assert.equal(buildDesignSystemExports({ constants:{ ASSET_DIR:'asset-dir' }, core:{ visualRole:'role' } }).visualRole, 'role');
const foundationRuntime = createDesignSystemFoundationRuntime({ normalizeDeckPlan: plan => plan });
assert.equal(foundationRuntime.ASSET_DIR, designSystem.ASSET_DIR);
assert.equal(foundationRuntime.FONT_STACK.zh, designSystem.FONT_STACK.zh);
assert.equal(typeof foundationRuntime.contentSignals, 'function');
assert.equal(typeof foundationRuntime.normalizeTypographyOptions, 'function');
assert.equal(foundationRuntime.proofObjectIdForSlide({ proofObject:'proof-1' }), 'proof-1');
const foundationResources = createFoundationResourceSet();
assert.equal(foundationResources.MEDIA_ASSETS.energyStorageCover, foundationRuntime.MEDIA_ASSETS.energyStorageCover);
const foundationHelpers = createFoundationHelperSet({
  normalizeDeckPlan: plan => plan,
  resources: foundationResources
});
assert.equal(foundationHelpers.proofObjectIdForSlide({ proofObject:'proof-direct' }), 'proof-direct');
assert.equal(typeof foundationHelpers.contentSignals, 'function');
const directFoundationHelpers = createFoundationHelperSetDirect({
  normalizeDeckPlan: plan => plan,
  resources: foundationResources
});
assert.equal(directFoundationHelpers.proofObjectIdForSlide({ proofObject:'proof-direct' }), foundationHelpers.proofObjectIdForSlide({ proofObject:'proof-direct' }));
assert.equal(directFoundationHelpers.visualIndustryId('industrial-energy'), foundationHelpers.visualIndustryId('industrial-energy'));
const foundationParts = createFoundationRuntimeParts({ normalizeDeckPlan: plan => plan });
assert.equal(foundationParts.FONT_STACK.zh, foundationRuntime.FONT_STACK.zh);
assert.equal(typeof foundationParts.sourceTraceAudit, 'function');
const sourceTraceCore = createSourceTraceCoreHelpers({
  clampText: (text, max = 999) => String(text || '').slice(0, max),
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  flattenText: value => JSON.stringify(value),
  proofObjectIdForSlide: slide => slide.proofObject || 'proof'
});
const planAuthoredSlide = sourceTraceCore.applyPlanAuthoredSourceTrace(
  { title:'Fixture', sourceTracePolicy:{ mode:'plan-authored', authorizationStatus:'cleared' } },
  { type:'metric-comparison', title:'Revenue lift', proofObject:'metric-proof' },
  0
);
assert.equal(planAuthoredSlide.sourceTrace.version, 'source-trace/v2');
assert.equal(planAuthoredSlide.proof.provenance, 'plan-authored-brief');
assert.deepEqual(
  sourceTraceCore.sourceTraceForSlide({
    proof:{ sourceTrace:{ sourceIds:['src-a'], sources:[{ id:'src-a', page:'1' }] } },
    sourceTrace:{ sourceIds:['src-b'], sources:[{ id:'src-b', page:'2' }] }
  }).sourceIds,
  ['src-a', 'src-b']
);
assert.deepEqual(
  sourceTraceCore.sourceEntriesForSlide({
    proof:{ sourceIds:['src-a'] },
    sourceTrace:{ sourceIds:['src-a'], sources:[{ sourceId:'src-a', page:'1', excerpt:'source excerpt' }] }
  }),
  [{ sourceId:'src-a', page:'1', excerpt:'source excerpt' }],
  'sourceEntriesForSlide should not add placeholder entries when sourceId alias already has page/excerpt'
);
assert.deepEqual(
  sourceTraceCore.sourceEntriesForSlide({
    proof:{ sourceIds:'src-scalar' },
    sourceTrace:{ sources:[{ id:'src-scalar', page:'1', excerpt:'source excerpt' }] }
  }),
  [{ id:'src-scalar', page:'1', excerpt:'source excerpt' }],
  'sourceEntriesForSlide should treat scalar sourceIds as one id instead of character placeholders'
);
assert.deepEqual(
  sourceTraceCore.sourceEntriesForSlide({
    proof:{ sourceIds:['src-name'] },
    sourceTrace:{ sourceIds:['src-name'], sources:[{ name:'src-name', page:'1', excerpt:'source excerpt' }] }
  }),
  [{ name:'src-name', page:'1', excerpt:'source excerpt' }, { id:'src-name' }],
  'sourceEntriesForSlide should keep name-only entries anonymous and add a placeholder for unmatched sourceIds'
);
const imageOnlyBoundarySlide = {
  type:'content',
  title:'Customer screenshot',
  sourceTrace:{
    imageProvenance:[{
      id:'img-boundary',
      proofEligibility:'factual-proof',
      provenanceClass:'user-owned',
      authorizationStatus:'cleared'
    }]
  }
};
assert.equal(
  sourceTraceCore.slideHasSourceBoundary(imageOnlyBoundarySlide),
  true,
  'image provenance should count as a source boundary before applying plan-authored fallback trace'
);
assert.equal(
  sourceTraceCore.applyPlanAuthoredSourceTrace(
    { title:'Fixture', sourceTracePolicy:{ mode:'plan-authored', authorizationStatus:'cleared' } },
    imageOnlyBoundarySlide,
    0
  ),
  imageOnlyBoundarySlide,
  'plan-authored fallback should not overwrite image-only provenance'
);
const sourceTraceAuditHelpers = createSourceTraceAuditHelpers(Object.assign({
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  normalizeDeckPlan: plan => plan,
  slideProofObject: slide => slide.proof || { factual:false, sourceIds:[] }
}, sourceTraceCore));
assert.equal(sourceTraceAuditHelpers.normalizeAuthorizationStatus('not authorized'), 'blocked');
assert.equal(sourceTraceAuditHelpers.normalizeAuthorizationStatus('denied'), 'blocked');
assert.equal(sourceTraceAuditHelpers.normalizeAuthorizationStatus('unresolved'), 'unknown');
assert.equal(sourceTraceAuditHelpers.normalizeAuthorizationStatus('pending'), 'unknown');
assert.equal(sourceTraceAuditHelpers.normalizeAuthorizationStatus('needs-review'), 'unknown');
const renderMetaHelpers = createRenderMetaHelpers();
assert.equal(
  effectiveImageAuthorizationStatus({ authorizationStatus:'cleared' }, { assetAuthorizationStatus:'blocked' }),
  'blocked',
  'effective image authorization should let aggregate blocked override item-level cleared'
);
assert.equal(
  effectiveImageAuthorizationStatus({ authorizationStatus:'cleared' }, { assetAuthorizationStatuses:['unknown'] }),
  'unknown',
  'effective image authorization should keep unknown stricter than cleared'
);
assert.equal(
  effectiveImageAuthorizationStatus({ authorizationStatus:'cleared' }, {}),
  'cleared',
  'effective image authorization should preserve cleared when no stricter status exists'
);
const unauthorizedRenderDecision = renderMetaHelpers.assetDecisionForMeta({}, {
  type:'content',
  sourceTrace:{
    imageProvenance:[{
      id:'img-render-unauthorized',
      proofEligibility:'factual-proof',
      provenanceClass:'user-owned',
      authorizationStatus:'unauthorized'
    }]
  }
});
assert.equal(
  unauthorizedRenderDecision.riskLevel,
  'high',
  'render meta should reuse canonical authorization normalization for unauthorized assets'
);
assert.equal(
  unauthorizedRenderDecision.reviewRequired,
  true,
  'render meta should require review for unauthorized asset provenance'
);
assert.equal(
  unauthorizedRenderDecision.authorizationStatus,
  'unauthorized',
  'render meta should retain raw authorization status for traceability'
);
assert.equal(
  unauthorizedRenderDecision.authorizationStatusNormalized,
  'blocked',
  'render meta should expose canonical authorization status for QA and summaries'
);
const snakeCaseRenderDecision = renderMetaHelpers.assetDecisionForMeta({}, {
  type:'content',
  image:'assets/customer-screenshot.png',
  source_trace:{
    image_provenance:[{
      source_id:'img-render-snake',
      proof_eligibility:'factual-proof',
      provenance_class:'client-supplied',
      authorization_status:'licensed'
    }]
  }
});
assert.deepEqual(
  snakeCaseRenderDecision.proofEligibility,
  ['factual-proof'],
  'render meta should read snake_case proof eligibility from image provenance'
);
assert.equal(
  snakeCaseRenderDecision.proofUse,
  'factual-proof',
  'render meta proofUse should stay aligned with canonical snake_case image provenance'
);
assert.equal(
  snakeCaseRenderDecision.provenanceClass,
  'user-owned',
  'render meta should normalize snake_case client-supplied provenance class'
);
assert.equal(
  snakeCaseRenderDecision.authorizationStatusNormalized,
  'cleared',
  'render meta should normalize snake_case image authorization status'
);
assert.equal(
  sourceTraceAuditHelpers.sourceTraceAudit({}, {
    slides:[{
      type:'metric-comparison',
      proof:{ factual:true, sourceIds:['src-a'] },
      sourceTrace:{ sourceIds:['src-a'], sources:[{ id:'src-a' }] }
    }]
  }).status,
  'fail'
);
const aliasSourceEntryAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'metric-comparison',
    proof:{ factual:true, sourceIds:['src-ref'] },
    sourceTrace:{ sourceIds:['src-ref'], sources:[{ ref:'src-ref', page:'1', excerpt:'reference excerpt' }] }
  }]
});
assert.equal(
  aliasSourceEntryAudit.findings.some(finding => finding.type === 'sourceTraceNotExplainable'),
  false,
  'source trace audit should accept ref/sourceId aliases with page and excerpt'
);
const sourcePageAliasAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'metric-comparison',
    proof:{ factual:true, sourceIds:['src-page'] },
    sourceTrace:{ sourceIds:['src-page'], sources:[{ id:'src-page', sourcePage:'p5', excerpt:'source page excerpt' }] }
  }]
});
assert.equal(
  sourcePageAliasAudit.findings.some(finding => finding.type === 'sourceTraceNotExplainable'),
  false,
  'source trace audit should accept sourcePage as canonical page evidence'
);
const nameOnlySourceEntryAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'metric-comparison',
    proof:{ factual:true, sourceIds:['src-name'] },
    sourceTrace:{ sourceIds:['src-name'], sources:[{ name:'src-name', page:'1', excerpt:'named label excerpt' }] }
  }]
});
assert.ok(
  nameOnlySourceEntryAudit.findings.some(finding => finding.type === 'sourceTraceNotExplainable' && /src-name/.test(finding.message)),
  'source trace audit should not treat name as a stable source identity'
);
const metricAliasAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'metric-comparison',
    proof:{ factual:true, sourceIds:['src-metric'] },
    sourceTrace:{ sourceIds:['src-metric'], sources:[{ sourceId:'src-metric', page:'4', excerpt:'metric source excerpt' }] },
    metrics:[{ label:'ARR', value:'42%', sourceId:'src-metric' }]
  }]
});
assert.equal(
  metricAliasAudit.findings.some(finding => /^metricSourceTrace/.test(finding.type)),
  false,
  'metric source trace should inherit slide-level source entries by sourceId alias'
);
const blockedImageAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{
      sources:[{ id:'img-1', kind:'image', page:'1', excerpt:'screenshot evidence' }],
      imageProvenance:[{ sourceId:'img-1', authorizationStatus:'blocked' }]
    }
  }]
});
assert.equal(
  blockedImageAudit.findings.filter(finding => finding.type === 'assetAuthorizationBlocked' && /img-1/.test(finding.message)).length,
  1,
  'matched blocked image provenance should produce one blocked authorization finding'
);
assert.equal(
  blockedImageAudit.findings.some(finding => finding.type === 'assetAuthorizationUnknown' && /img-1/.test(finding.message)),
  false,
  'matched blocked image provenance should not also report unknown authorization'
);
const deniedImageAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{ imageProvenance:[{ id:'img-denied', authorizationStatus:'denied' }] }
  }]
});
assert.ok(
  deniedImageAudit.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-denied/.test(finding.message)),
  'denied image provenance should be normalized to blocked in source trace audit'
);
const pendingImageAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{ imageProvenance:[{ id:'img-pending', authorizationStatus:'pending' }] }
  }]
});
assert.ok(
  pendingImageAudit.findings.some(finding => finding.type === 'assetAuthorizationUnknown' && /img-pending/.test(finding.message)),
  'pending image provenance should be normalized to unknown in source trace audit'
);
const aggregateBlockedImageAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ version:'proof-object/v1', factual:true, sourceIds:[] },
    sourceTrace:{
      assetAuthorizationStatus:'blocked',
      imageProvenance:[{
        id:'img-aggregate-blocked',
        proofEligibility:'factual-proof',
        provenanceClass:'user-owned',
        authorizationStatus:'cleared'
      }]
    }
  }]
});
assert.equal(aggregateBlockedImageAudit.status, 'fail');
assert.ok(
  aggregateBlockedImageAudit.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-aggregate-blocked/.test(finding.message)),
  'source trace audit should fail when aggregate authorization is blocked even if image provenance is cleared'
);
const factualImageOnlyAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ version:'proof-object/v1', factual:true, sourceIds:[] },
    sourceTrace:{
      imageProvenance:[{
        id:'img-owned-proof',
        proofEligibility:'factual-proof',
        provenanceClass:'user-owned',
        authorizationStatus:'cleared'
      }]
    }
  }]
});
assert.equal(
  factualImageOnlyAudit.findings.some(finding => finding.type === 'sourceTraceMissing'),
  false,
  'factual image provenance should satisfy source-trace presence for image-only factual proof'
);
assert.equal(
  imageProvenanceCanSatisfyFactualProof({
    proofEligibility:'factual-proof',
    provenanceClass:'client-supplied'
  }),
  true,
  'client-supplied factual image provenance should use the canonical factual proof predicate'
);
assert.equal(
  imageProvenanceClass({ provenanceClass:'not-provided' }),
  'unknown',
  'not-provided image provenance should not be normalized to user-owned'
);
assert.equal(
  imageProvenanceCanSatisfyFactualProof({
    proofEligibility:'factual-proof',
    provenanceClass:'not-provided'
  }),
  false,
  'not-provided image provenance should not satisfy factual proof even with factual-proof eligibility'
);
const clientSuppliedFactualImageOnlyAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ version:'proof-object/v1', factual:true, sourceIds:[] },
    sourceTrace:{
      imageProvenance:[{
        id:'img-client-proof',
        proofEligibility:'factual-proof',
        provenanceClass:'client-supplied',
        authorizationStatus:'cleared'
      }]
    }
  }]
});
assert.equal(
  clientSuppliedFactualImageOnlyAudit.findings.some(finding => finding.type === 'sourceTraceMissing'),
  false,
  'client-supplied factual image provenance should satisfy image-only factual proof'
);
const typeAliasFactualImageOnlyAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ version:'proof-object/v1', factual:true, sourceIds:[] },
    sourceTrace:{
      imageProvenance:[{
        id:'img-type-proof',
        proofEligibility:'factual-proof',
        type:'user-owned',
        authorizationStatus:'cleared'
      }]
    }
  }]
});
assert.equal(
  typeAliasFactualImageOnlyAudit.findings.some(finding => finding.type === 'sourceTraceMissing'),
  false,
  'image provenance type aliases should satisfy image-only factual proof when proofEligibility is factual-proof'
);
const syntheticOnlyFactualProofAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ version:'proof-object/v1', factual:true, sourceIds:[] },
    sourceTrace:{
      imageProvenance:[{
        id:'img-synthetic-proof',
        proofEligibility:'synthetic-only',
        provenanceClass:'model-generated',
        authorizationStatus:'cleared'
      }]
    }
  }]
});
assert.ok(
  syntheticOnlyFactualProofAudit.findings.some(finding => finding.type === 'generatedAssetCannotSatisfyFactualProof'),
  'synthetic-only image provenance should not satisfy factual proof'
);
const snakeCaseSyntheticOnlyFactualProofAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ version:'proof-object/v1', factual:true, sourceIds:[] },
    source_trace:{
      image_provenance:[{
        source_id:'img-snake-synthetic-proof',
        proof_eligibility:'synthetic-only',
        provenance_class:'model-generated',
        authorization_status:'cleared'
      }]
    }
  }]
});
assert.ok(
  snakeCaseSyntheticOnlyFactualProofAudit.findings.some(finding => finding.type === 'generatedAssetCannotSatisfyFactualProof'),
  'snake_case synthetic-only image provenance should keep the explicit factual-proof failure finding'
);
const idMatchedImageAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{
      sources:[{ id:'img-id-only', kind:'image', page:'1', excerpt:'screenshot evidence' }],
      imageProvenance:[{ id:'img-id-only', authorizationStatus:'cleared' }]
    }
  }]
});
assert.equal(
  idMatchedImageAudit.findings.some(finding => finding.type === 'imageProvenanceMissing' && /img-id-only/.test(finding.message)),
  false,
  'image provenance id should match image source entry ids'
);
const aliasMatchedImageAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{
      sources:[{ id:'img-entry', kind:'image', page:'1', excerpt:'screenshot evidence' }],
      imageProvenance:[{ sourceId:'img-file', id:'img-entry', authorizationStatus:'blocked' }]
    }
  }]
});
assert.equal(
  aliasMatchedImageAudit.findings.filter(finding => finding.type === 'assetAuthorizationBlocked' && /img-entry/.test(finding.message)).length,
  1,
  'matched image provenance aliases should keep one blocked finding under the source entry id'
);
assert.equal(
  aliasMatchedImageAudit.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-file/.test(finding.message)),
  false,
  'matched image provenance aliases should not report a second blocked finding under the provenance sourceId'
);
assert.equal(
  aliasMatchedImageAudit.findings.some(finding => finding.type === 'imageProvenanceMissing' && /img-entry/.test(finding.message)),
  false,
  'matched image provenance aliases should not be treated as missing provenance'
);
const duplicateImageAuthorizationAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{
      sources:[{ id:'img-dup', kind:'image', page:'1', excerpt:'screenshot evidence' }],
      imageProvenance:[
        { id:'img-dup', authorizationStatus:'unknown' },
        { source_id:'img-dup', authorizationStatus:'blocked' }
      ]
    }
  }]
});
assert.equal(
  duplicateImageAuthorizationAudit.findings.filter(finding => finding.type === 'assetAuthorizationBlocked' && /img-dup/.test(finding.message)).length,
  1,
  'duplicate image provenance should keep the blocked finding for the image'
);
assert.equal(
  duplicateImageAuthorizationAudit.findings.some(finding => finding.type === 'assetAuthorizationUnknown' && /img-dup/.test(finding.message)),
  false,
  'duplicate image provenance should not keep unknown when the same image is blocked'
);
const missingImageProvenanceAudit = sourceTraceAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'content',
    proof:{ factual:true },
    sourceTrace:{
      sources:[{ id:'img-2', kind:'image', page:'1', excerpt:'screenshot evidence' }]
    }
  }]
});
assert.ok(
  missingImageProvenanceAudit.findings.some(finding => finding.type === 'imageProvenanceMissing' && /img-2/.test(finding.message)),
  'image source entries without matching image provenance should still be flagged'
);
const blockedAuthorizationGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/blocked.png',
    sourceTrace:{ imageProvenance:[{ id:'img-gate-blocked', authorizationStatus:'blocked' }] }
  }]
});
assert.equal(blockedAuthorizationGate.canRenderFormal, false);
assert.ok(
  blockedAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-gate-blocked/.test(finding.message)),
  'formal asset gate should fail blocked image provenance and keep the canonical image id'
);
const deniedAuthorizationGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/denied.png',
    sourceTrace:{ imageProvenance:[{ id:'img-gate-denied', authorizationStatus:'denied' }] }
  }]
});
assert.equal(deniedAuthorizationGate.canRenderFormal, false);
assert.ok(
  deniedAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-gate-denied/.test(finding.message)),
  'formal asset gate should normalize denied image provenance to blocked'
);
const unresolvedAuthorizationGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/unresolved.png',
    sourceTrace:{ imageProvenance:[{ source_id:'img-gate-unresolved', authorizationStatus:'unknown' }] }
  }]
});
assert.equal(unresolvedAuthorizationGate.canRenderFormal, false);
assert.ok(
  unresolvedAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationUnresolved' && /img-gate-unresolved/.test(finding.message)),
  'formal asset gate should fail unresolved image provenance and keep source_id as the image id'
);
const clearedStatusWithoutProvenanceGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/customer-screenshot.png',
    sourceTrace:{ assetAuthorizationStatus:'cleared' }
  }]
});
assert.equal(
  clearedStatusWithoutProvenanceGate.canRenderFormal,
  false,
  'formal asset gate should require per-image provenance when a slide binds an image'
);
assert.ok(
  clearedStatusWithoutProvenanceGate.findings.some(finding => finding.type === 'assetAuthorizationGateMissing'),
  'formal asset gate should report missing image provenance even if aggregate authorization is cleared'
);
const aggregateBlockedAuthorizationGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/aggregate-blocked.png',
    sourceTrace:{
      assetAuthorizationStatus:'blocked',
      imageProvenance:[{ id:'img-gate-aggregate-blocked', authorizationStatus:'cleared' }]
    }
  }]
});
assert.equal(
  aggregateBlockedAuthorizationGate.canRenderFormal,
  false,
  'formal asset gate should fail aggregate blocked authorization even if image provenance is cleared'
);
assert.ok(
  aggregateBlockedAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-gate-aggregate-blocked/.test(finding.message)),
  'formal asset gate should report aggregate blocked authorization under the image id'
);
const aggregateBlockedRenderDecision = renderMetaHelpers.assetDecisionForMeta({}, {
  type:'content',
  image:'assets/aggregate-blocked.png',
  sourceTrace:{
    assetAuthorizationStatus:'blocked',
    imageProvenance:[{
      id:'img-render-aggregate-blocked',
      proofEligibility:'factual-proof',
      provenanceClass:'user-owned',
      authorizationStatus:'cleared'
    }]
  }
});
assert.equal(
  aggregateBlockedRenderDecision.riskLevel,
  'high',
  'render meta should keep aggregate blocked authorization at high risk'
);
assert.equal(
  aggregateBlockedRenderDecision.reviewRequired,
  true,
  'render meta should still require review for aggregate blocked authorization'
);
const duplicateAuthorizationGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/duplicate.png',
    sourceTrace:{
      imageProvenance:[
        { sourceId:'img-gate-unknown', file:'same-image.png', authorizationStatus:'unknown' },
        { id:'img-gate-blocked', file:'same-image.png', authorizationStatus:'blocked' }
      ]
    }
  }]
});
assert.equal(
  duplicateAuthorizationGate.findings.filter(finding => finding.type === 'assetAuthorizationBlocked').length,
  1,
  'formal asset gate should keep only one blocked finding for the same image alias set'
);
assert.equal(
  duplicateAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationUnresolved'),
  false,
  'formal asset gate should drop unresolved when the same image alias set is blocked'
);
const distinctAuthorizationGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, {
  slides:[{
    type:'content',
    image:'assets/distinct.png',
    sourceTrace:{
      imageProvenance:[
        { sourceId:'img-gate-one', file:'one.png', authorizationStatus:'unknown' },
        { id:'img-gate-two', file:'two.png', authorizationStatus:'blocked' }
      ]
    }
  }]
});
assert.ok(
  distinctAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationUnresolved' && /img-gate-one/.test(finding.message)),
  'formal asset gate should keep unresolved findings for distinct images'
);
assert.ok(
  distinctAuthorizationGate.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /img-gate-two/.test(finding.message)),
  'formal asset gate should keep blocked findings for distinct images'
);
const assetBinderOutDir = path.join(__dirname, '..', 'outputs', 'test-asset-binder');
fs.mkdirSync(assetBinderOutDir, { recursive:true });
const assetBinderPng = path.join(assetBinderOutDir, 'tiny.png');
fs.writeFileSync(assetBinderPng, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'));
const blockedBinderPlan = {
  outputIntent:'formal',
  slides:[{
    type:'content',
    sourceTrace:{
      assetAuthorizationStatus:'blocked',
      assetAuthorizationStatuses:['blocked'],
      imageProvenance:[{ id:'existing-blocked-image', authorizationStatus:'blocked', proofEligibility:'factual-proof' }]
    }
  }]
};
const blockedBinderResult = bindGeneratedAssets(blockedBinderPlan, {
  1:{ path:assetBinderPng, type:'user-owned', provenanceClass:'user-owned', proofEligibility:'factual-proof', authorizationStatus:'cleared' }
});
assert.deepEqual(blockedBinderResult.errors, []);
assert.equal(blockedBinderResult.plan.slides[0].sourceTrace.assetAuthorizationStatus, 'blocked');
const blockedBinderGate = sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, blockedBinderResult.plan);
assert.equal(blockedBinderGate.canRenderFormal, false);
assert.ok(
  blockedBinderGate.findings.some(finding => finding.type === 'assetAuthorizationBlocked' && /existing-blocked-image/.test(finding.message)),
  'asset binder should not downgrade blocked provenance before formal asset gate'
);
const topLevelBlockedBinderResult = bindGeneratedAssets({
  outputIntent:'formal',
  slides:[{
    type:'content',
    assetAuthorizationStatus:'blocked'
  }]
}, {
  1:{ path:assetBinderPng, type:'user-owned', provenanceClass:'user-owned', proofEligibility:'factual-proof', authorizationStatus:'cleared' }
});
assert.deepEqual(topLevelBlockedBinderResult.errors, []);
assert.equal(
  topLevelBlockedBinderResult.plan.slides[0].sourceTrace.assetAuthorizationStatus,
  'blocked',
  'asset binder should absorb top-level blocked authorization into sourceTrace writeback'
);
const reviewBinderResult = bindGeneratedAssets({
  slides:[{
    type:'content',
    sourceTrace:{ assetAuthorizationStatuses:['needs-review'] }
  }]
}, {
  1:{ path:assetBinderPng, type:'generated-image', generated:true, authorizationStatus:'synthetic-only' }
});
assert.deepEqual(reviewBinderResult.errors, []);
assert.equal(reviewBinderResult.plan.slides[0].sourceTrace.assetAuthorizationStatus, 'needs-review');
const proofReviewBinderResult = bindGeneratedAssets({
  slides:[{
    type:'content',
    proof:{
      assetAuthorizationStatuses:['needs-review'],
      sourceTrace:{ assetAuthorizationStatus:'cleared' }
    }
  }]
}, {
  1:{ path:assetBinderPng, type:'generated-image', generated:true, authorizationStatus:'synthetic-only' }
});
assert.deepEqual(proofReviewBinderResult.errors, []);
assert.equal(
  proofReviewBinderResult.plan.slides[0].sourceTrace.assetAuthorizationStatus,
  'needs-review',
  'asset binder should absorb proof-level needs-review authorization into sourceTrace writeback'
);
const unknownBinderResult = bindGeneratedAssets({
  outputIntent:'formal',
  slides:[{
    type:'content',
    sourceTrace:{
      assetAuthorizationStatus:'unknown',
      imageProvenance:[{ id:'existing-unknown-image', authorizationStatus:'unknown' }]
    }
  }]
}, {
  1:{ path:assetBinderPng, type:'user-owned', provenanceClass:'user-owned', proofEligibility:'factual-proof', authorizationStatus:'cleared' }
});
assert.deepEqual(unknownBinderResult.errors, []);
assert.equal(unknownBinderResult.plan.slides[0].sourceTrace.assetAuthorizationStatus, 'unknown');
assert.equal(sourceTraceAuditHelpers.assetAuthorizationGate({ outputIntent:'formal' }, unknownBinderResult.plan).canRenderFormal, false);
const sourceTraceAuditPrimitives = createSourceTraceAuditPrimitives({
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  sourceTraceIsPlanAuthored: () => true
});
assert.equal(sourceTraceAuditPrimitives.sourceEntryHasPage({ pageRef:'deck-plan' }), true);
assert.equal(sourceTraceAuditPrimitives.sourceEntryHasPage({ sourcePage:'deck-plan' }), true);
assert.equal(sourceTraceAuditPrimitives.sourceEntryHasExcerpt({ source_excerpt:'claim text' }), true);
assert.equal(sourceTraceAuditPrimitives.normalizeAuthorizationStatus('未授权'), 'blocked');
assert.equal(sourceTraceAuditPrimitives.normalizeAuthorizationStatus('needs-review'), 'unknown');
assert.deepEqual(
  sourceTraceAuditPrimitives.metricTraceEntries({}, {
    sources:[{ id:'brief-slide', page:'deck-plan', excerpt:'Plan-authored claim' }]
  }),
  [{ id:'brief-slide', page:'deck-plan', excerpt:'Plan-authored claim' }]
);
assert.deepEqual(
  sourceTraceAuditPrimitives.metricTraceEntries({ sourceId:'metric-src' }, {
    sources:[{ sourceId:'metric-src', page:'6', excerpt:'Metric alias source excerpt.' }]
  }),
  [{ sourceId:'metric-src', page:'6', excerpt:'Metric alias source excerpt.' }],
  'metricTraceEntries should inherit slide source entries through sourceId aliases'
);
assert.equal(designSystem.INDUSTRY_KNOWLEDGE_BASE, INDUSTRY_KNOWLEDGE_BASE);
assert.ok(INDUSTRY_EXPRESSION_RULES['brand-retail'].requiredRoutes.includes('industry-chart:waterfall-bridge'));
assert.ok(INDUSTRY_KNOWLEDGE_BASE['saas-technology'].proofObjects.some(item => item.id === 'adoption-funnel'));
assert.ok(SEMANTIC_RELATION_PATTERNS.cause.test('因为响应慢导致流失'));
assert.ok(VISIBLE_PRODUCTION_COPY_BANS.some(pattern => pattern.test('材料显示增长来自渠道修复')));
assert.equal(designSystem.BASE_COLORS, BASE_COLORS);
const mergedPolicy = deepMerge({ a:{ x:1 }, list:['a'] }, { a:{ y:2 } });
assert.deepEqual(mergedPolicy, { a:{ x:1, y:2 }, list:['a'] });
mergedPolicy.list.push('mutated');
assert.deepEqual(deepMerge({ list:['a'] }).list, ['a']);
const proofHelpers = createProofObjectHelpers({
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  flattenText: value => JSON.stringify(value),
  highValuePageFamilies: new Set(['case-gallery']),
  layoutVariantCompatibleWithType: () => false
});
assert.equal(proofHelpers.proofObjectIdForSlide({ type:'cover', proofObject:'case-gallery', variant:'cover-safe' }), 'cover-safe');
assert.equal(proofHelpers.slideProofObject({ sourceIds:['S1'], generatedAssetPrompt:'real photo' }).provenance, 'source-derived-evidence');
const rawProofObject = proofHelpers.slideProofObject({
  proof:{
    id:'raw-proof',
    factual:true,
    generatedIllustration:false,
    sourceIds:[],
    provenance:'raw-proof-provenance',
    evidenceMode:'raw-proof-mode'
  }
});
assert.equal(rawProofObject.factual, true);
assert.equal(rawProofObject.generatedIllustration, false);
assert.equal(rawProofObject.provenance, 'raw-proof-provenance');
assert.equal(rawProofObject.evidenceMode, 'raw-proof-mode');
assert.equal(
  createProofObjectHelpers().proofObjectIdForSlide({ type:'content', proofObject:'case-gallery' }),
  'case-gallery',
  'proof helpers should be safe to construct without optional page-family dependencies'
);
const rawProofAuditHelpers = createSourceTraceAuditHelpers(Object.assign({
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  normalizeDeckPlan: plan => plan,
  slideProofObject: proofHelpers.slideProofObject
}, sourceTraceCore));
const rawProofAudit = rawProofAuditHelpers.sourceTraceAudit({}, {
  slides:[{
    type:'metric-comparison',
    proof:{ id:'raw-proof', factual:true }
  }]
});
assert.ok(
  rawProofAudit.findings.some(finding => finding.type === 'sourceTraceMissing'),
  'raw proof.factual should survive proof-object upgrade and fail when source trace is absent'
);
const policyHelpers = createIndustryPolicyHelpers({
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  flattenText: value => JSON.stringify(value),
  getSlideRole: () => 'content',
  industryDesignDialects: {
    demo: {
      defaultPalette:'demo',
      components:{ common:['page-number'], content:['caption-bar'] },
      colorCarriers:{ common:['accent-rail'] }
    }
  },
  visualIndustryId: value => value,
  visualRouter: { default:{ defaultImageRoles:{ cover:'hero' } }, industries:{ demo:{ visualMode:'solid', defaultImageRoles:{ proof:'evidence' } } } }
});
assert.equal(policyHelpers.industryVisualPolicy({ industry:'demo' }).defaultImageRoles.cover, 'hero');
assert.deepEqual(policyHelpers.dialectComponentsFor({ industry:'demo' }, { type:'metric-comparison' }), ['page-number', 'caption-bar']);
assert.deepEqual(policyHelpers.dialectColorCarriersFor({ industry:'demo' }, {}), ['accent-rail']);
const coreRuntimeDeps = {
  assetDir:'/tmp/assets',
  assetRoleNeedsImage: () => false,
  chartSpecToComponentId: () => '',
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  componentCapabilityFor: id => ({ id, supportedModes:['native'], ownershipPolicy:'native', dataRequirements:[] }),
  contentSignals: () => ({ imageCount:0, hasMetrics:false, isNumberHeavy:false }),
  flattenText: value => JSON.stringify(value),
  hasArrayField: () => false,
  hasExplicitChartSignal: () => false,
  hasValueField: () => false,
  highValuePageFamilies: new Set(['case-gallery']),
  industryDesignDialects: {
    demo: {
      defaultPalette:'demo',
      components:{ common:['page-number'], value:['caption-bar'] },
      colorCarriers:{ common:['accent-rail'] }
    }
  },
  industryKnowledgeBase: {
    demo: { label:'Demo', proofObjects:[], depthGates:{} }
  },
  industryPackFor: () => null,
  layoutVariantCompatibleWithType: () => true,
  matchKeywordList: () => [],
  mediaAssets:{},
  normalizeAssetRole: role => role || 'abstract',
  normalizeDeckPlan: plan => plan,
  normalizeIndustryId: value => value,
  palettes:{ demo:{ accent:'111111' } },
  proofObjectIdForSlide: slide => slide.proofObject || '',
  profileFromIndustryPack: () => null,
  routeChartSpec: () => null,
  semanticRelationPatterns:{},
  slideHasChartIntent: () => false,
  visualIndustryId: value => value,
  visualRouter:{ default:{}, industries:{ demo:{ visualMode:'solid' } } },
  visualSystem:{ semanticColorRoles:{ roles:{} } }
};
const coreRuntime = createDesignSystemCoreRuntime(coreRuntimeDeps);
assert.equal(coreRuntime.slideRole({ type:'cover' }), 'cover');
assert.equal(coreRuntime.selectPaletteName({ industry:'demo' }), 'demo');
assert.deepEqual(coreRuntime.dialectComponentsFor({ industry:'demo' }, { type:'metric-comparison' }), ['page-number', 'caption-bar']);
const coreAssembly = createCoreRuntimeAssembly(Object.assign({}, coreRuntimeDeps, {
  dialectColorCarriersFor: coreRuntime.dialectColorCarriersFor,
  dialectComponentsFor: coreRuntime.dialectComponentsFor,
  industryDesignDialect: coreRuntime.industryDesignDialect,
  industryVisualPolicy: coreRuntime.industryVisualPolicy,
  slideRole: coreRuntime.slideRole,
  visualMedia: coreRuntime
}));
assert.equal(coreAssembly.selectPaletteName({ industry:'demo' }), coreRuntime.selectPaletteName({ industry:'demo' }));
assert.equal(typeof coreAssembly.semantic.semanticFrame, 'function');
assert.equal(typeof coreAssembly.narrative.routeKey, 'function');
assert.deepEqual(coreAssembly.componentPlanFor({ industry:'demo' }, { type:'section' }).componentIds, ['page-number']);
const corePlanningAssembly = createCorePlanningAssembly(Object.assign({}, coreRuntimeDeps, {
  dialectColorCarriersFor: coreRuntime.dialectColorCarriersFor,
  dialectComponentsFor: coreRuntime.dialectComponentsFor,
  industryDesignDialect: coreRuntime.industryDesignDialect,
  industryVisualPolicy: coreRuntime.industryVisualPolicy,
  slideRole: coreRuntime.slideRole,
  visualMedia: coreRuntime
}));
assert.equal(corePlanningAssembly.selectPaletteName({ industry:'demo' }), coreAssembly.selectPaletteName({ industry:'demo' }));
assert.deepEqual(corePlanningAssembly.componentPlanFor({ industry:'demo' }, { type:'section' }).componentIds, ['page-number']);
const industryAuditHelpers = createIndustryKnowledgeAuditHelpers({
  contentSignals: () => ({}),
  industryKnowledgeBase: {
    demo: {
      label:'Demo',
      narrativeArchetype:'proof',
      proofObjects:[{ id:'proof-1', route:'case-gallery', depth:'system-map' }],
      depthGates:{ minProofObjects:1, requiredDomains:['system-map'] }
    }
  },
  industryPackFor: () => null,
  normalizeDeckPlan: plan => plan,
  normalizeIndustryId: value => value,
  profileFromIndustryPack: () => null,
  routeKey: slide => slide.type || '',
  routeMatches: (key, expected) => key === expected,
  semanticMeaning: () => ({ proofCandidates:[{ id:'proof-1', route:'case-gallery', depth:'system-map', score:4 }] }),
  visualIndustryId: value => value
});
assert.equal(industryAuditHelpers.industryKnowledgeProfile({ industry:'demo' }).label, 'Demo');
assert.equal(industryAuditHelpers.industryKnowledgeAudit({}, { industry:'demo', slides:[{ type:'case-gallery' }] }).findings.length, 0);
const normalizationHelpers = createDeckPlanNormalizationHelpers({
  applyDataComponentDiversity: (plan, slides) => slides.map(slide => Object.assign({ diversified:true }, slide)),
  applyDeckRhythm: (plan, slides) => slides.map(slide => Object.assign({ rhythmic:true }, slide)),
  applyNarrativeMetadata: (plan, slides) => slides.map(slide => Object.assign({ narrated:true }, slide)),
  claimSpineForSlides: () => [{ slide:1, claim:'Claim' }],
  deckNarrativeSummary: () => ({ roleCounts:{ body:1 } }),
  normalizeSlide: (plan, slide, index) => Object.assign({ normalized:index + 1 }, slide),
  sequenceSlidesByNarrative: (plan, slides) => slides.slice().reverse()
});
const normalizedDeck = normalizationHelpers.normalizeDeckPlan({ autoSequence:true, slides:[{ title:'A' }, { title:'B' }] });
assert.equal(normalizedDeck.slides[0].title, 'B');
assert.equal(normalizedDeck.slides[0].rhythmic, true);
assert.equal(normalizedDeck.claimSpine[0].claim, 'Claim');
const deckContextHelpers = createDeckContextHelpers({
  FONT_STACK:{ zh:'ZH' },
  PALETTES:{ demo:{ accent:'111111' } },
  VISUAL_ROUTER:{},
  VISUAL_SYSTEM:{},
  acceptanceAudit: () => 'acceptance',
  auditDeckPlan: () => 'deck-audit',
  compositionAudit: () => 'composition',
  contentOverlapAudit: () => 'overlap',
  contentSignals: () => ({ signal:true }),
  copyPolicyFor: () => ({ policy:true }),
  copyPolicyList: () => ['copy'],
  copyPolicyText: () => 'copy',
  generatedAssetPolicy: () => 'policy',
  generatedAssetPrompt: () => 'prompt',
  industryDesignDialect: () => ({ name:'dialect' }),
  industryKnowledgeAudit: () => 'industry',
  industryVisualPolicy: () => ({ visualMode:'hybrid' }),
  languagePolicyFor: () => ({ lang:'zh' }),
  localizeMicrocopy: text => text,
  normalizeDeckPlan: () => ({ slides:[] }),
  normalizeTypographyOptions: () => ({ fit:'shrink' }),
  paletteToColors: palette => Object.assign({ text:'000000' }, palette),
  recommendSlideType: () => 'metric-comparison',
  resolveStyleProfile: () => ({ C:{}, font:'ZH' }),
  resolveTypeToken: () => ({ fontSize:10 }),
  scoreImageAsset: () => ({ verdict:'accept' }),
  selectPaletteName: () => 'demo',
  selectReferenceRecipe: () => ({ id:'recipe' }),
  semanticFrame: () => ({ frame:true }),
  semanticMeaning: () => ({ meaning:true }),
  slideDesign: () => ({ wantsImage:true }),
  typographyAudit: () => 'typography',
  typographyFontSet: () => ({ zh:'ZH' }),
  typographyProfileFor: () => ({ body:10 }),
  visualAestheticModel: () => 'aesthetic'
});
const deckContext = deckContextHelpers.makeDeckContext({ style:'demo' });
assert.equal(deckContext.paletteName, 'demo');
assert.equal(deckContext.generatedAssetPrompt({}), 'prompt');
assert.deepEqual(deckContext.contentSignals({}, 0, 1), { signal:true });
const planningRuntime = createDesignSystemPlanningRuntime({
  FONT_STACK:{ zh:'ZH' },
  PALETTES:{ demo:{ accent:'111111' } },
  REFERENCE_LAYOUT_LIBRARY:{ recipes:[], generatedAssetPromptPatterns:{} },
  REFERENCE_RECIPE_LIBRARY:{ recipes:[] },
  VISUAL_ROUTER:{},
  VISUAL_SYSTEM:{},
  acceptanceAudit: () => ({ status:'pass' }),
  accentRoleFor: () => 'data',
  applyNarrativeMetadata: (plan, slides) => slides,
  applyPlanAuthoredSourceTrace: (plan, slide) => slide,
  auditDeckPlan: () => [],
  clampText: (text, max = 999) => String(text || '').slice(0, max),
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  componentPlanFor: () => ({ version:'component-plan/v1', components:[], componentIds:[], rulesApplied:[] }),
  compositionAudit: () => [],
  compositionPlan: () => ({
    version:'composition-plan/v1',
    themeIntent:'value-signal',
    accentRole:'data',
    layoutEnergy:'steady',
    visualDensity:'balanced',
    rhythmTransition:'build',
    microComponents:[]
  }),
  contentOverlapAudit: () => [],
  contentSignals: () => ({ imageCount:0 }),
  copyPolicyFor: () => ({}),
  copyPolicyList: () => [],
  copyPolicyText: () => '',
  dataGrammarVariant: () => '',
  deckNarrativeSummary: () => ({}),
  flattenText: value => JSON.stringify(value),
  generatedAssetPolicy: () => ({ status:'none', role:'abstract' }),
  generatedAssetPrompt: () => 'prompt',
  highValuePageFamilies: new Set(),
  imageRefsForSlide: () => [],
  industryChartVariant: () => '',
  industryDesignDialect: () => ({}),
  industryKnowledgeAudit: () => ({ findings:[] }),
  industryMatchIds: value => [value],
  industryVisualPolicy: () => ({ visualMode:'solid' }),
  languagePolicyFor: () => ({}),
  layoutEnergyFor: () => 'steady',
  layoutVariantCompatibleWithType: () => true,
  localizeMicrocopy: text => text,
  mediaForRole: () => '',
  normalizeTypographyOptions: () => ({}),
  paletteToColors: palette => Object.assign({ text:'000000' }, palette),
  pickLayoutVariant: () => 'fixture-variant',
  preferredProofObjectIdForTrace: () => '',
  priorityPageFamilyRecipes: [],
  proofObjectIdForSlide: () => '',
  recommendSlideType: () => ({ type:'metric-comparison', reason:'fixture route' }),
  resolveStyleProfile: () => ({ C:{}, font:'ZH' }),
  resolveTypeToken: () => ({ fontSize:10 }),
  resolveVisualMode: () => 'solid',
  rhythmTransitionFor: () => 'build',
  routeChartSpec: () => null,
  routeKey: slide => slide.type || '',
  scoreImageAsset: () => ({ verdict:'accept' }),
  selectPaletteName: () => 'demo',
  selectReferenceRecipe: () => null,
  semanticColorRolesFor: () => ({}),
  semanticFrame: () => ({ primaryIntent:'narrative' }),
  semanticMeaning: () => ({}),
  sequenceSlidesByNarrative: (plan, slides) => slides,
  slideDesign: () => ({ wantsImage:false }),
  slideHasChartIntent: () => false,
  slideRole: () => 'content',
  staleIndustryChartRouteShouldYieldToProcess: () => false,
  textKeywords: () => [],
  themeIntentFor: () => 'value-signal',
  typographyAudit: () => 'typography',
  typographyFontSet: () => ({ zh:'ZH' }),
  typographyProfileFor: () => ({ body:10 }),
  visualAestheticModel: () => ({ findings:[] }),
  visualDensityFor: () => 'balanced',
  visualIndustryId: value => value
});
const runtimeNormalizedDeck = planningRuntime.normalizeDeckPlan({ slides:[{ title:'Metric 42%' }] });
assert.equal(runtimeNormalizedDeck.slides[0].type, 'metric-comparison');
assert.equal(runtimeNormalizedDeck.slides[0].componentPlan.version, 'component-plan/v1');
assert.equal(planningRuntime.makeDeckContext({ style:'demo' }).paletteName, 'demo');
const planningAssemblyOverride = createPlanningRuntimeAssembly({
  generatedAssetPolicy: () => 'policy-assembly',
  generatedAssetPrompt: () => 'prompt-assembly',
  pickLayoutVariant: () => 'assembly-layout',
  recipeAutoRouteAllowed: () => true,
  recommendSlideType: () => ({ type:'assembly-route', reason:'override' })
});
assert.equal(planningAssemblyOverride.generatedAssetPrompt(), 'prompt-assembly');
assert.equal(planningAssemblyOverride.pickLayoutVariant(), 'assembly-layout');
assert.equal(planningAssemblyOverride.recommendSlideType().type, 'assembly-route');
assert.equal(
  createPlanningAssetGenerationRuntime({
    generatedAssetPolicy: () => 'policy-override',
    generatedAssetPrompt: () => 'prompt-override'
  }).generatedAssetPolicy(),
  'policy-override'
);
assert.equal(
  createPlanningSlideRoutingRuntime({
    recommendSlideType: () => ({ type:'fixture', reason:'override' }),
    pickLayoutVariant: () => 'fixture-layout',
    recipeAutoRouteAllowed: () => true
  }).pickLayoutVariant(),
  'fixture-layout'
);
const styleHelpers = createStyleProfileHelpers({ fontStack: { zh:'ZH', latin:'LATIN', number:'NUM' } });
assert.equal(styleHelpers.resolveStyleProfile('premium-commercial-keynote').font, 'ZH');
assert.equal(styleHelpers.resolveStyleProfile('premium-consulting-keynote').density, 'consulting');
assert.equal(paletteToColors({ accent:'123456', secondary:'ABCDEF' }).accent, '123456');
assert.equal(designSystem.paletteToColors({ accent:'123456', secondary:'ABCDEF' }).cyan, 'ABCDEF');
const artHelpers = createArtDirectionHelpers({
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  contentSignals: () => ({ hasMetrics:false, isNumberHeavy:false, imageCount:0 }),
  flattenText: value => JSON.stringify(value),
  industryDesignDialect: () => ({ defaultPalette:'dialect-palette' }),
  industryVisualPolicy: () => ({ defaultPalette:'policy-palette' }),
  slideRole: () => 'content',
  visualSystem: { semanticColorRoles: { roles: { evidence: { token:'success', carriers:['caption'] } } } }
});
assert.equal(artHelpers.selectPaletteName({}), 'dialect-palette');
assert.equal(artHelpers.themeIntentFor({}, { type:'metric-comparison' }, 1, 3), 'value-signal');
assert.equal(artHelpers.accentRoleFor({}, { type:'metric-comparison' }, 1, 3, 'value-signal'), 'data');
assert.deepEqual(artHelpers.semanticColorRolesFor({}, 'evidence').carrierGuidance, ['caption']);
assert.equal(normalizeComponentId('Hero KPI Strip'), 'hero-kpi-strip');
assert.equal(componentIdFromHint('metric_strip'), 'kpi-strip');
assert.equal(componentPlanningNormalization.normalizeComponentId, normalizeComponentId);
assert.equal(componentPlanningNormalization.addComponent, addComponent);
assert.equal(componentManifestAudit().status, 'pass');
assert.equal(canonicalComponentId('hero_kpis', { preferAlias:true }), 'kpi-strip');
assert.equal(componentCapabilityFor('gallery-grid').id, 'proof-gallery');
assert.deepEqual(effectiveComponentModesFor('source-note'), ['overlay']);
assert.deepEqual(componentCapabilityFor('metric-strip').dataRequirements, ['metrics']);
assert.equal(CAPABILITY_ROWS, CAPABILITY_ROW_SHARD);
assert.equal(COMPONENT_ALIASES, COMPONENT_ALIAS_SHARD);
assert.equal(COMPONENT_DATA_REQUIREMENTS, COMPONENT_DATA_REQUIREMENTS_SHARD);
assert.equal(CHART_COMPONENT_ID_LIST, CHART_COMPONENT_ID_LIST_SHARD);
assert.ok(CAPABILITY_ROWS.some(row => row[0] === 'proof-gallery' && row[1].includes('overlay')));
assert.deepEqual(COMPONENT_DATA_REQUIREMENTS['risk-register'], ['rows|risks|controls|riskRegister|riskMatrix|matrix']);
assert.equal(
  componentManifestAudit({ aliases:{ 'bad-alias':'missing-widget' } }).findings.some(f => f.type === 'componentAliasTargetMissing'),
  true
);
assert.equal(
  componentManifestAudit({
    aliases:{ 'alias-widget':'target-widget' },
    capabilities:{
      'alias-widget': {
        supportedModes:['native'],
        ownershipPolicy:'native-only',
        overlayPolicy:'blocked',
        repairPolicy:'no-unplanned-repair',
        dataRequirements:[]
      },
      'target-widget': {
        supportedModes:['native'],
        ownershipPolicy:'native-only',
        overlayPolicy:'blocked',
        repairPolicy:'no-unplanned-repair',
        dataRequirements:['metrics']
      }
    }
  }).findings.some(f => f.type === 'componentAliasCapabilityDataRequirementDrift'),
  true
);
assert.equal(
  componentManifestAudit({
    aliases:{ 'alias-widget':'target-widget' },
    capabilities:{
      'alias-widget': {
        supportedModes:['native'],
        ownershipPolicy:'native-only',
        overlayPolicy:'blocked',
        repairPolicy:'no-unplanned-repair',
        dataRequirements:['rows']
      },
      'target-widget': {
        supportedModes:['native'],
        ownershipPolicy:'native-only',
        overlayPolicy:'blocked',
        repairPolicy:'no-unplanned-repair',
        dataRequirements:['metrics']
      }
    }
  }).findings.some(f => f.type === 'componentAliasCapabilityDataRequirementDrift'),
  true
);
assert.equal(
  componentManifestAudit({
    aliases:{ 'alias-widget':'target-widget' },
    capabilities:{
      'alias-widget': {
        supportedModes:['native'],
        ownershipPolicy:'native-only',
        overlayPolicy:'blocked',
        repairPolicy:'no-unplanned-repair',
        dataRequirements:['rows'],
        dataRequirementsOverride:true
      },
      'target-widget': {
        supportedModes:['native'],
        ownershipPolicy:'native-only',
        overlayPolicy:'blocked',
        repairPolicy:'no-unplanned-repair',
        dataRequirements:['metrics']
      }
    }
  }).findings.some(f => f.type === 'componentAliasCapabilityDataRequirementDrift'),
  false
);
assert.deepEqual(
  normalizeComponentEntry({ name:'source-caption', required:false }, 'fixture'),
  { id:'caption-bar', role:'', required:false, source:'fixture', renderer:'auto', name:'source-caption' }
);
const plannedComponents = [];
addComponent(plannedComponents, 'metric-strip', 'rule');
addComponent(plannedComponents, 'hero-kpis', 'rule');
assert.deepEqual(plannedComponents.map(item => item.id), ['kpi-strip']);
assert.equal(isSystemPlannedComponent({ source:'metric-signal' }), true);
assert.equal(isSystemPlannedComponent({ source:'explicit-plan' }), false);
assert.equal(hasContactBlockData({ contact: { email:'hello@example.com' } }, {}), true);
const componentPlanningInputs = createComponentPlanningInputHelpers({
  compactUnique: values => Array.from(new Set((values || []).filter(Boolean))),
  contentSignals: () => ({ hasMetrics:true, hasArchitecture:false }),
  flattenText: value => JSON.stringify(value),
  proofObjectIdForSlide: s => s.proofObject || ''
});
assert.deepEqual(
  componentPlanningInputs.explicitComponentEntries({
    componentPlan:{ components:[{ name:'source-caption', required:false }] },
    componentHints:['hero-kpis', 'hero-kpis']
  }).map(component => [component.id, component.source, component.required]),
  [['kpi-strip', 'component-hint', true]]
);
assert.equal(
  componentPlanningInputs.nativeOnlyOptionalComponentAllowed({}, { type:'metric-comparison' }, { id:'kpi-primary-metric' }),
  true
);
assert.equal(
  componentPlanningInputs.nativeOnlyOptionalComponentAllowed({}, { type:'metric-comparison', proofObject:'photo-strip' }, { id:'asset-chip' }),
  false
);
const componentPlanHelpers = createComponentPlanHelpers({
  chartSpecToComponentId: spec => spec.kind === 'bar' ? 'bar-chart' : '',
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  componentCapabilityFor: id => ({ supportedModes:['native'], ownershipPolicy:'native', family:`fixture:${id}`, dataRequirements:[] }),
  contentSignals: () => ({ hasMetrics:true, metricCount:1, imageCount:0 }),
  dialectComponentsFor: () => ['metric-strip'],
  flattenText: value => JSON.stringify(value),
  hasExplicitChartSignal: () => true,
  industryDesignDialect: () => ({ avoidComponents:[] }),
  proofObjectIdForSlide: s => s.layoutVariant || '',
  routeChartSpec: () => ({ kind:'bar' }),
  slideHasChartIntent: () => true,
  themeIntentFor: () => 'value-signal'
});
const componentPlan = componentPlanHelpers.componentPlanFor({}, { type:'metric-comparison', layoutVariant:'growth-kpi', chartSpec:{ kind:'bar' } });
assert.equal(componentPlan.version, 'component-plan/v1');
assert.ok(componentPlan.componentIds.includes('kpi-strip'));
assert.ok(componentPlan.componentIds.includes('kpi-primary-metric'));
assert.ok(componentPlan.componentIds.includes('bar-chart'));
const rawPlanBypass = componentPlanHelpers.componentPlanFor({}, {
  type:'metric-comparison',
  layoutVariant:'growth-kpi',
  component_plan:{ components:[{ id:'hero-image', required:true }] },
  chartSpec:{ kind:'bar' }
});
assert.equal(rawPlanBypass.componentIds.includes('hero-image'), false);
const compositionHelpers = createCompositionPlanningHelpers({
  accentRoleFor: () => 'data',
  backgroundToneFor: () => 'light',
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  compositionNameFor: () => 'metric-comparison/value-signal',
  contentSignals: () => ({ isDenseText:false }),
  dialectComponentsFor: () => ['kpi-strip'],
  imageTreatmentFor: () => ({ mode:'fit' }),
  industryDesignDialect: () => ({ name:'test', motif:'rail', principle:'tight', primaryColorLogic:'accent' }),
  layoutEnergyFor: () => 'steady',
  microComponentsFor: () => ['kpi-strip'],
  primaryColorUseFor: () => 'accent',
  rhythmRoleFor: () => 'body',
  rhythmTransitionFor: () => 'build',
  semanticColorRolesFor: () => ({ token:'success' }),
  slideDesign: () => ({ wantsImage:true }),
  slideRole: () => 'content',
  themeCoverageFor: () => 'medium',
  themeIntentFor: () => 'value-signal',
  visualDensityFor: () => 'balanced'
});
assert.deepEqual(
  compositionHelpers.zonePlanFor({}, { type:'case-gallery', layoutVariant:'evidence-board' }, {}, {}),
  { primaryZone:'evidence-grid', secondaryZone:'caption-system', proofZone:'evidence-boundary' }
);
const fixtureComposition = compositionHelpers.compositionPlan({}, { type:'metric-comparison' }, 0, 1, { isDenseText:false }, { id:'recipe-1', componentHints:['caption-bar'] }, { wantsImage:true });
assert.equal(fixtureComposition.version, 'composition-plan/v1');
assert.equal(fixtureComposition.layoutPlan.primaryZone, 'metric-readout');
assert.deepEqual(fixtureComposition.microComponents, ['kpi-strip', 'caption-bar']);
assert.equal(fixtureComposition.referenceRecipeId, 'recipe-1');
const visualHelpers = createVisualMediaHelpers({
  assetDir: '/tmp/assets',
  assetRoleNeedsImage: role => /photo/.test(String(role || '')),
  industryVisualPolicy: () => ({ visualMode:'hybrid', defaultImageRoles: { situation:'evidence' }, photoRoles:['cover'] }),
  mediaAssets: { energyStorageCover:'/media/cover.jpg', energyStorageBand:'/media/band.jpg', energyStorageDetail:'/media/detail.jpg' },
  normalizeAssetRole: role => String(role || '').replace(/-photo$/, ''),
  visualRouter: { layoutFamilies: { cover: { showcase:'custom-cover' } } },
  visualSystem: { mediaDefaults: { demo: { cover:'assets/demo-cover.jpg' } } }
});
assert.equal(visualHelpers.slideRole({ type:'case-gallery' }), 'case-gallery');
assert.equal(visualHelpers.visualRole({ industry:'demo' }, { type:'company-profile-spread' }), 'evidence');
assert.equal(visualHelpers.slideWantsImage({ visualMode:'solid' }, { type:'cover' }, 'cover'), false);
assert.equal(visualHelpers.resolveAssetPath('assets/demo.png'), '/tmp/assets/demo.png');
assert.equal(visualHelpers.defaultIndustryMedia({ industry:'energy-utility' }, 'timeline'), '/media/band.jpg');
assert.equal(visualHelpers.pageFamily({}, { type:'cover', visualMode:'photo' }, 'cover'), 'custom-cover');
assert.equal(copyPolicyText('__missing__', '__missing_key__', 'fallback text'), 'fallback text');
assert.deepEqual(copyPolicyList('__missing__', '__missing_list__', ['a', 'b']), ['a', 'b']);
assert.deepEqual(industryBenchmarksFor('__missing__'), []);

const runtime = createIndustryRuntime({
  industryDesignDialects: { target: {} },
  visualRouter: { industries: { routed: {} } },
  industryPackLibrary: {
    packs: [
      { id:'target', aliases:['custom alias'] }
    ]
  },
  copyPolicy: {
    version:'copy-policy/test',
    global: {
      rendererFallbacks: { headline:'global headline' },
      tags: ['global']
    },
    industries: {
      target: {
        rendererFallbacks: { headline:'target headline' },
        tags: ['target']
      },
      aliasOnly: { aliasOf:'target' },
      'general-operations': {
        rendererFallbacks: { headline:'general headline' }
      }
    }
  },
  industryBenchmarks: {
    aliases: { aliasTarget:'target' },
    industries: {
      target: [{ label:'benchmark' }]
    }
  },
  aliases: {
    aliasTarget:'target'
  }
});

assert.equal(runtime.visualIndustryId('aliasTarget'), 'target');
assert.ok(runtime.industryMatchIds('target').includes('aliasTarget'));
assert.equal(runtime.industryPackFor('custom alias').id, 'target');
assert.equal(runtime.copyPolicyText('aliasOnly', 'headline'), 'target headline');
const tags = runtime.copyPolicyList('aliasOnly', 'tags');
tags.push('mutated');
assert.deepEqual(runtime.copyPolicyList('aliasOnly', 'tags'), ['target']);
assert.deepEqual(runtime.industryBenchmarksFor('aliasTarget'), [{ label:'benchmark' }]);

const narrativeHelpers = createNarrativeHelpers({
  contentSignals: () => ({}),
  semanticFrame: (plan, slide) => ({
    primaryIntent: slide.type === 'case-gallery' ? 'caseEvidence' : 'narrative',
    confidence: 0.7,
    proofObject: slide.type === 'case-gallery' ? 'evidence-gallery' : 'narrative-block',
    semanticMeaning: {
      materialPurpose: slide.type === 'case-gallery' ? 'evidence' : 'narrative',
      relations: { evidence: slide.type === 'case-gallery' },
      entities: ['asset'],
      scores: { industryFit: 0.8 },
      proofCandidates: [{ id:'gallery', route:'case-gallery', score:4 }]
    }
  }),
  semanticMeaning: () => ({
    materialPurpose: 'evidence',
    relations: { evidence:true },
    entities: ['asset'],
    scores: { industryFit:0.8 },
    proofCandidates: [{ id:'gallery', route:'case-gallery', score:4 }]
  }),
  highValuePageFamilies: new Set(['case-gallery']),
  layoutVariantCompatibleWithType: () => true
});
assert.equal(narrativeHelpers.routeKey({ type:'case-gallery', layoutVariant:'case-gallery' }), 'case-gallery:case-gallery');
assert.equal(narrativeHelpers.routeMatches('case-gallery:case-gallery', 'case-gallery'), true);
const annotatedNarrative = narrativeHelpers.applyNarrativeMetadata({}, [
  { type:'cover' },
  { type:'case-gallery', layoutVariant:'case-gallery' },
  { type:'closing' }
]);
assert.equal(annotatedNarrative[1].narrativeRole, 'evidence');
assert.equal(annotatedNarrative[1].proofObject, 'case-gallery');
assert.equal(narrativeHelpers.deckNarrativeSummary({}, annotatedNarrative).roleCounts.evidence, 1);

const aestheticHelpers = createAestheticModelHelpers({
  contentSignals: () => ({ isDenseText:true, cardCount:6, itemCount:0, imageCount:3 }),
  flattenText: value => JSON.stringify(value),
  normalizeDeckPlan: plan => plan,
  routeKey: slide => slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : slide.type,
  semanticMeaning: () => ({ materialPurpose:'evidence', scores:{ evidenceStrength:0.2, industryFit:0.1 } }),
  slideRole: slide => slide.narrativeRole || slide.type || 'content'
});
assert.equal(aestheticHelpers.hasCommercialLogicChain({
  businessLogic: { currentState:'slow response', action:'routing change' }
}), true);
const aestheticScore = aestheticHelpers.aestheticSlideScore({ industry:'demo' }, {
  type:'executive-blocks',
  layoutRationale:'default commercial split',
  images: ['1', '2', '3']
}, 0, 1);
assert.ok(aestheticScore.flags.includes('denseTextOnLooseLayout'));
assert.ok(aestheticScore.flags.includes('imageEvidenceWithoutLabels'));
const aestheticModel = aestheticHelpers.visualAestheticModel({
  slides: [
    { type:'cover' },
    { type:'executive-blocks', layoutRationale:'default commercial split', images:['1', '2', '3'] }
  ]
});
assert.equal(aestheticModel.routeCounts['executive-blocks'], 1);

const componentAuditHelpers = createComponentPlanAuditHelpers({
  flattenText: value => JSON.stringify(value),
  hasComponentCapability: id => id === 'risk-register',
  normalizeDeckPlan: plan => plan
});
const componentAudit = componentAuditHelpers.componentPlanAudit({}, {
  slides: [{
    type:'executive-blocks',
    componentPlan: {
      version:'component-plan/v1',
      components:[{ id:'risk-register', required:true }]
    }
  }]
});
assert.ok(componentAudit.findings.some(f => f.type === 'riskRegisterWithoutRows'));

const structureAuditHelpers = createDeckStructureAuditHelpers({
  hasCommercialLogicChain: slide => Boolean(slide.businessLogic),
  normalizeDeckPlan: plan => plan,
  proofObjectIdForSlide: slide => slide.proofObject || ''
});
const pageCountAudit = structureAuditHelpers.pageCountAudit(
  { targetSlides:{ requested:3 } },
  { targetSlides:{ requested:3 }, slides:[{ type:'cover' }, { type:'closing' }] }
);
assert.equal(pageCountAudit.status, 'fail');
const reportDepthAudit = structureAuditHelpers.reportDepthAudit({}, {
  slides: [
    { type:'cover' },
    { type:'executive-blocks', proofObject:'claim-1', componentPlan:{ version:'component-plan/v1' }, businessLogic:{ action:'fix' } },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'closing' }
  ]
});
assert.ok(reportDepthAudit.findings.some(f => f.type === 'reportProofDepthThin'));

const evidenceAuditHelpers = createEvidenceAuditHelpers({
  normalizeDeckPlan: plan => plan,
  slideProofObject: slide => slide.proof || { id:slide.proofObject || 'unknown', factual:false },
  sourceTraceAudit: () => ({ findings:[] }),
  sourceTraceForSlide: () => ({})
});
const evidenceAudit = evidenceAuditHelpers.evidenceAudit({}, {
  slides:[{ type:'cover' }, { type:'executive-blocks' }]
});
assert.ok(evidenceAudit.findings.some(f => f.type === 'proofObjectMissing'));

const industryFitHelpers = createIndustryFitAuditHelpers({
  flattenText: value => JSON.stringify(value),
  industryExpressionRules: { demo:{ proofObjects:['expected-proof'] } },
  industryPackFor: industry => industry === 'demo' ? { id:'demo', labelZh:'Demo', proofObjects:['base-proof'], forbiddenTemplates:['forbidden phrase'] } : null,
  normalizeDeckPlan: plan => plan,
  proofObjectIdForSlide: slide => slide.proofObject || '',
  visualIndustryId: value => value
});
const industryFitAudit = industryFitHelpers.industryFitAudit({}, {
  industry:'demo',
  slides:[
    { type:'cover' },
    { type:'executive-blocks', proofObject:'base-proof' },
    { type:'executive-blocks', title:'forbidden phrase' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'closing' }
  ]
});
assert.ok(industryFitAudit.findings.some(f => f.type === 'industryForbiddenPattern'));
assert.ok(industryFitAudit.findings.some(f => f.type === 'industryFitProofObjectsThin'));

const acceptanceHelpers = createAcceptanceAuditHelpers({
  assetAuthorizationGate: () => ({ status:'clear', findings:[] }),
  auditDeckPlan: () => [{ level:'review', type:'templateRhythm', message:'repeat' }],
  chartAcceptanceGate: () => ({ status:'pass' }),
  chartEvidenceQA: () => ({ findings:[] }),
  chartSemanticQA: () => ({ findings:[] }),
  chartVisualQA: () => ({ findings:[{ level:'review', type:'chartLabelReview' }] }),
  componentPlanAudit: () => ({ findings:[] }),
  compositionAudit: () => [],
  evidenceAudit: () => ({ findings:[] }),
  industryFitAudit: () => ({ findings:[] }),
  industryKnowledgeAudit: () => ({ findings:[] }),
  normalizeDeckPlan: plan => plan,
  pageCountAudit: () => ({ findings:[] }),
  pageLevelChartScores: () => [],
  reportDepthAudit: () => ({ findings:[] }),
  sourceTraceAudit: () => ({ status:'pass', findings:[] }),
  visualAestheticModel: () => ({ findings:[] })
});
const acceptanceAudit = acceptanceHelpers.acceptanceAudit({}, { slides:[{ type:'cover' }, { type:'closing' }] });
assert.equal(acceptanceAudit.status, 'review');
assert.ok(acceptanceAudit.checks.some(check => check.id === 'layout-repetition' && check.status === 'review'));
const commercialReady = acceptanceHelpers.commercialReadinessAudit({}, { slides:[] });
assert.equal(commercialReady.level, 'client-review');

const auditRuntime = createDesignSystemAuditRuntime({
  assetAuthorizationGate: () => ({ status:'clear', findings:[] }),
  chartAcceptanceGate: () => ({ status:'pass', findings:[] }),
  chartEvidenceQA: () => ({ findings:[] }),
  chartSemanticQA: () => ({ findings:[] }),
  chartVisualQA: () => ({ findings:[] }),
  contentOverlapAudit: () => [],
  contentSignals: () => ({ imageCount:0 }),
  flattenText: value => JSON.stringify(value),
  hasCommercialLogicChain: () => true,
  hasComponentCapability: () => true,
  industryExpressionRules: {},
  industryKnowledgeAudit: () => ({ findings:[] }),
  industryPackFor: () => null,
  normalizeDeckPlan: plan => plan,
  pageLevelChartScores: () => [],
  productionCopyBans: [/runtime leak/i],
  proofObjectIdForSlide: slide => slide.proofObject || '',
  routeKey: slide => slide.type || '',
  routeMatches: (key, expected) => key === expected,
  slideProofObject: slide => slide.proof || { id:slide.proofObject || 'unknown', factual:false },
  sourceTraceAudit: () => ({ status:'pass', findings:[] }),
  sourceTraceForSlide: () => ({}),
  visualAestheticModel: () => ({ findings:[] }),
  visualIndustryId: value => value
});
assert.equal(typeof auditRuntime.acceptanceAudit, 'function');
assert.deepEqual(auditRuntime.visibleProductionCopyIssues('Runtime leak in presenter note'), ['runtime leak']);
assert.equal(
  auditRuntime.pageCountAudit({ targetSlides:{ requested:2 }, slides:[{ type:'cover' }, { type:'closing' }] }).status,
  'pass'
);

const deckPlanAuditHelpers = createDeckPlanAuditHelpers({
  compositionAudit: () => [],
  contentOverlapAudit: () => [],
  contentSignals: () => ({ imageCount:0 }),
  flattenText: value => JSON.stringify(value),
  hasCommercialLogicChain: () => false,
  industryExpressionRules: { demo:{ requiredRoutes:['industry-chart'], proofObjects:['industry-chart'] } },
  industryKnowledgeAudit: () => ({ findings:[] }),
  normalizeDeckPlan: plan => plan,
  productionCopyBans: [/production note/i],
  routeKey: slide => slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : slide.type,
  routeMatches: (key, expected) => key === expected || key.startsWith(`${expected}:`),
  visualAestheticModel: () => ({ findings:[] }),
  visualIndustryId: value => value
});
assert.deepEqual(deckPlanAuditHelpers.visibleProductionCopyIssues('production note'), ['production note']);
const deckPlanFindings = deckPlanAuditHelpers.auditDeckPlan({}, {
  industry:'demo',
  slides:[
    { type:'cover' },
    { type:'executive-blocks', title:'production note' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'executive-blocks' },
    { type:'closing' }
  ]
});
assert.ok(deckPlanFindings.some(f => f.type === 'industryWeakExpression'));
assert.ok(deckPlanFindings.some(f => f.type === 'productionNoteLeak'));

const compositionAuditHelpersForModule = createCompositionAuditHelpers({
  contentSignals: () => ({ imageCount:1 }),
  normalizeDeckPlan: plan => plan
});
const compositionAuditFindings = compositionAuditHelpersForModule.compositionAudit({}, {
  slides:[
    {
      type:'cover',
      compositionPlan:{
        version:'composition-plan/v1',
        themeCoverage:'high',
        backgroundTone:'dark-stage',
        primaryColorUse:['dark-anchor'],
        microComponents:['rhythm-anchor']
      }
    },
    {
      type:'executive-blocks',
      compositionPlan:{
        version:'composition-plan/v1',
        composition:'executive-insight-board',
        backgroundTone:'paper',
        themeCoverage:'low',
        themeIntent:'value-signal',
        accentRole:'brand',
        primaryColorUse:['accent-rail'],
        microComponents:[]
      }
    },
    {
      type:'closing',
      compositionPlan:{
        version:'composition-plan/v1',
        themeCoverage:'low',
        backgroundTone:'paper',
        primaryColorUse:[],
        microComponents:[]
      }
    }
  ]
});
assert.ok(compositionAuditFindings.some(f => f.type === 'semanticColorMismatch'));
assert.ok(compositionAuditFindings.some(f => f.type === 'weakImageTreatment'));
assert.ok(compositionAuditFindings.some(f => f.type === 'closingLacksWeight'));

const referenceRecipeHelpers = createReferenceRecipeHelpers({
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  contentSignals: () => ({ hasMetrics:true, hasGallery:false, hasRisk:false, hasArchitecture:false, hasTimeline:false }),
  flattenText: value => JSON.stringify(value),
  highValuePageFamilies: new Set(['financial-kpi-snapshot']),
  industryMatchIds: value => [value],
  priorityPageFamilyRecipes: [],
  referenceLayoutLibrary: {
    recipes:[{
      id:'finance-kpi',
      layoutVariant:'financial-kpi-snapshot',
      proofObject:'financial-kpi-snapshot',
      renderType:'metric-comparison',
      slideType:'metric-comparison',
      industryFit:['finance-investment'],
      roles:['content'],
      signals:['financial-results'],
      scores:{ overall:90 }
    }]
  },
  referenceRecipeLibrary: { recipes:[] },
  slideRole: () => 'content',
  textKeywords: text => String(text).toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean),
  themeIntentFor: () => 'value-signal'
});
const referenceCandidates = referenceRecipeHelpers.referenceRecipeCandidates(
  { industry:'finance-investment', documentType:'financial-results' },
  { type:'metric-comparison', proofObject:'financial-kpi-snapshot', title:'Q1 financial KPI' },
  { limit:1 }
);
assert.equal(referenceCandidates[0].id, 'finance-kpi');
assert.equal(referenceRecipeHelpers.selectReferenceRecipe(
  { industry:'finance-investment', documentType:'financial-results' },
  { type:'metric-comparison', proofObject:'financial-kpi-snapshot', title:'Q1 financial KPI' }
).id, 'finance-kpi');
assert.equal(referenceRecipeHelpers.recipeCompatibleWithSlideType(referenceCandidates[0], 'metric-comparison'), true);
const directReferenceScoring = createReferenceRecipeScoringHelpers({
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  contentSignals: () => ({ hasMetrics:true }),
  flattenText: value => JSON.stringify(value),
  highValuePageFamilies: new Set(['financial-kpi-snapshot']),
  industryMatchIds: value => [value],
  referenceLayoutLibrary: {
    recipes:[{
      id:'finance-kpi',
      layoutVariant:'financial-kpi-snapshot',
      proofObject:'financial-kpi-snapshot',
      renderType:'metric-comparison',
      slideType:'metric-comparison',
      industryFit:['finance-investment'],
      roles:['content'],
      signals:['financial-results'],
      scores:{ overall:90 }
    }]
  },
  slideRole: () => 'content',
  textKeywords: text => String(text).toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean),
  themeIntentFor: () => 'value-signal'
});
const directReferenceCandidates = directReferenceScoring.referenceRecipeCandidates(
  { industry:'finance-investment', documentType:'financial-results' },
  { type:'metric-comparison', proofObject:'financial-kpi-snapshot', title:'Q1 financial KPI' },
  { limit:1 }
);
assert.equal(directReferenceCandidates[0].id, referenceCandidates[0].id);
assert.equal(directReferenceScoring.recipeCompatibleWithSlideType(directReferenceCandidates[0], 'metric-comparison'), true);

const assetGenerationHelpers = createAssetGenerationHelpers({
  factualGeneratedAssetRisk: /客户现场|真实客户/i,
  flattenText: value => JSON.stringify(value),
  industryVisualPolicy: () => ({ label:'Finance', visualMode:'case-gallery' }),
  mediaForRole: () => '',
  referenceLayoutLibrary: {
    generatedAssetPromptPatterns: {
      evidence:'{industryLabel} evidence: {visualBrief} in {paletteName}',
      abstract:'{industryLabel} abstract: {visualBrief} in {paletteName}'
    }
  },
  resolveVisualMode: () => 'hybrid',
  selectPaletteName: () => 'boardroom-ink',
  slideDesign: () => ({ imageRole:'evidence', wantsImage:true }),
  slideRole: () => 'content'
});
assert.equal(assetGenerationHelpers.normalizeAssetRole('product showcase'), 'showcase');
assert.equal(assetGenerationHelpers.assetRoleNeedsImage('diagram'), false);
assert.equal(assetGenerationHelpers.recipeGenerationRule({ generatedAsset:'optional generated asset' }), 'optional');
assert.equal(
  assetGenerationHelpers.generatedAssetPrompt({}, { title:'Risk dashboard', visual:{ role:'evidence' } }, null),
  'Finance evidence: Risk dashboard in boardroom-ink'
);
const requestedRiskPolicy = assetGenerationHelpers.generatedAssetPolicy(
  {},
  { title:'真实客户现场证据', visual:{ mode:'generated', role:'evidence' } },
  { assetRole:'evidence', generatedAsset:'optional generated asset' },
  { wantsImage:true }
);
assert.equal(requestedRiskPolicy.status, 'blocked');
assert.equal(requestedRiskPolicy.decisionSource, 'asset-generation-policy/v1');
const optionalPolicy = assetGenerationHelpers.generatedAssetPolicy(
  {},
  { title:'Conceptual workflow', visual:{ role:'showcase' } },
  { assetRole:'showcase', generatedAsset:'optional generated asset', mainVisualMethod:'showcase' },
  { wantsImage:true }
);
assert.equal(optionalPolicy.status, 'optional');
assert.equal(optionalPolicy.decisionSource, 'asset-generation-policy/v1');

console.log('design system modules ok');
