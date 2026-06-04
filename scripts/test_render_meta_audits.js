const assert = require('assert/strict');

const {
  componentConsumptionAuditFromRender,
  contentCoverageAuditFromRender,
  expectedRenderedCountsForSlide,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
  routeMetadataAuditFromRender,
  secondaryVisualReview
} = require('./qa/render-meta-audits');

function plannedComponent(overrides = {}) {
  return {
    id: 'content-card-grid',
    required: true,
    allowedModes: ['native'],
    slotPolicy: 'native-evidence-required',
    repairPolicy: 'no-unplanned-repair',
    priority: 'required',
    ...overrides
  };
}

function renderMeta(overrides = {}) {
  return {
    version: 'render-meta/v1',
    slideCount: 1,
    slides: [{
      slide: 1,
      type: 'cards',
      rendererMatch: {
        requestedType: 'cards',
        matchedType: 'cards',
        matchKind: 'exact',
        rendererId: 'cards',
        rendererName: 'testCards',
        source: 'test'
      },
      renderRoute: {
        version: 'render-route/v1',
        family: 'business',
        requestedType: 'cards',
        renderer: { id: 'cards', name: 'testCards', matchKind: 'exact', source: 'test' },
        layoutVariant: '',
        componentPlan: { version:'component-plan/v1', componentIds:['content-card-grid'], unknownComponents:[], rulesApplied:[] },
        assetPolicy: { status:'none', role:'none', mustBind:false, syntheticOnly:false, staleForRoute:false, hasPrompt:false, hasBoundAsset:false }
      },
      assetDecision: {
        version: 'asset-decision/v1',
        status: 'none',
        mode: 'structure-only',
        action: 'structure_only',
        reason: 'no image required for resolved slide route',
        riskLevel: 'low',
        originalRole: 'none',
        resolvedRole: 'none',
        provenanceClass: 'none',
        proofEligibility: ['none'],
        boundAssetCount: 0
      },
      nativeRendererContract: {
        version: 'native-renderer-contract/v1',
        occupiedZones: [{ id:'native-body', role:'text-card', x:0.7, y:1.2, w:4, h:3 }],
        safeOverlayZones: {
          'content-card-grid': { x:0.7, y:1.2, w:4, h:3 }
        }
      },
      plannedComponents: [plannedComponent()],
      unknownComponents: [],
      drawnComponents: [{ id:'content-card-grid', drawnCount:3, nativeSlot:'cards', bbox:{ x:0.7, y:1.2, w:4, h:3 }, rendererMethod:'testCards' }],
      consumedComponents: [{ id:'content-card-grid', required:true, mode:'native-renderer', rendered:true, drawnCount:3, nativeSlot:'cards', bbox:{ x:0.7, y:1.2, w:4, h:3 }, rendererMethod:'testCards' }],
      missingRequiredComponents: [],
      textBoxes: [],
      ...overrides
    }]
  };
}

const plannedCounts = expectedRenderedCountsForSlide({
  componentPlan: { componentIds:['content-card-grid', 'hero-image'] },
  cards: [{}, {}, {}, {}],
  image: 'hero.png'
});
assert.equal(plannedCounts['content-card-grid'], 4);
assert.equal(plannedCounts['hero-image'], 1);

const invalidSchema = renderMeta({
  rendererMatch: {
    requestedType: 'cards',
    matchedType: 'cards',
    matchKind: 'exact',
    rendererId: 'cards',
    source: 'test'
  }
});
const schemaAudit = renderMetaSchemaAuditFromRender({ file:'fixture.render-meta.json', meta:invalidSchema }, 1);
assert.equal(schemaAudit.status, 'fail');
assert.ok(schemaAudit.findings.some(f => f.type === 'renderMetaRendererFieldMissing' && /rendererName/.test(f.message)));

const fallbackRendererAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    rendererMatch: {
      requestedType: 'unknown-slide',
      matchedType: 'fallback',
      matchKind: 'fallback',
      rendererId: 'fallbackBulletsSlide',
      rendererName: 'fallbackBulletsSlide',
      source: 'fallback'
    },
    renderRoute: {
      version: 'render-route/v1',
      family: 'business',
      requestedType: 'unknown-slide',
      renderer: { id:'fallbackBulletsSlide', name:'fallbackBulletsSlide', matchKind:'fallback', source:'fallback' },
      layoutVariant: '',
      componentPlan: { version:'component-plan/v1', componentIds:['content-card-grid'], unknownComponents:[], rulesApplied:[] },
      assetPolicy: { status:'none', role:'none', mustBind:false, syntheticOnly:false, staleForRoute:false, hasPrompt:false, hasBoundAsset:false }
    }
  })
}, 1);
assert.equal(fallbackRendererAudit.status, 'review');
assert.ok(fallbackRendererAudit.findings.some(f => f.type === 'fallbackRendererUsed'));

const assetSchemaAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    assetDecision: {
      version:'asset-decision/v1',
      status:'none',
      mode:'structure-only'
    }
  })
}, 1);
assert.equal(assetSchemaAudit.status, 'fail');
assert.ok(assetSchemaAudit.findings.some(f => f.type === 'renderMetaAssetDecisionFieldMissing' && /riskLevel/.test(f.message)));

const mixedAssetDetailAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    assetDecision: {
      version:'asset-decision/v1',
      status:'bound',
      mode:'bound',
      action:'bound_asset',
      reason:'mixed provenance detail omitted',
      riskLevel:'medium',
      originalRole:'evidence',
      resolvedRole:'image',
      provenanceClass:'mixed',
      proofEligibility:['mixed'],
      proofEligibilitySummary:'mixed',
      boundAssetCount:1
    }
  })
}, 1);
assert.equal(mixedAssetDetailAudit.status, 'fail');
assert.ok(mixedAssetDetailAudit.findings.some(f => f.type === 'renderMetaAssetDecisionMixedDetailMissing' && /provenanceClass=mixed/.test(f.message)));
assert.ok(mixedAssetDetailAudit.findings.some(f => f.type === 'renderMetaAssetDecisionMixedDetailMissing' && /mixed proof/.test(f.message)));

const validMixedAssetAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    assetDecision: {
      version:'asset-decision/v1',
      status:'bound',
      mode:'bound',
      action:'bound_asset',
      reason:'mixed provenance detail present',
      riskLevel:'medium',
      originalRole:'evidence',
      resolvedRole:'image',
      provenanceClass:'mixed',
      provenanceClasses:['user-owned', 'public-licensed'],
      proofEligibility:['factual-proof', 'generic-category'],
      proofEligibilitySummary:'mixed',
      boundAssetCount:2
    }
  })
}, 1);
assert.equal(validMixedAssetAudit.status, 'pass');

const skippedCriticalAssetAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    assetDecision: {
      version:'asset-decision/v1',
      status:'none',
      mode:'structure-only',
      action:'skip_image',
      reason:'user skipped factual evidence image',
      riskLevel:'high',
      originalRole:'evidence',
      resolvedRole:'solid',
      provenanceClass:'none',
      proofEligibility:['none'],
      boundAssetCount:0,
      skippedCriticalVisual:true
    }
  })
}, 1);
assert.equal(skippedCriticalAssetAudit.status, 'review');
assert.ok(skippedCriticalAssetAudit.findings.some(f => f.type === 'skippedCriticalAsset'));

const drawnSchemaAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    drawnComponents: [{ id:'content-card-grid', drawnCount:1, nativeSlot:'cards', bbox:{ x:0.7, y:1.2, w:4, h:3 } }]
  })
}, 1);
assert.equal(drawnSchemaAudit.status, 'fail');
assert.ok(drawnSchemaAudit.findings.some(f => f.type === 'renderMetaDrawnComponentFieldMissing' && /rendererMethod/.test(f.message)));

const aliasSchemaAudit = renderMetaSchemaAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    plannedComponents: [plannedComponent({ id:'gallery-grid', allowedModes:['native'] })]
  })
}, 1);
assert.equal(aliasSchemaAudit.status, 'fail');
assert.ok(aliasSchemaAudit.findings.some(f => f.type === 'renderMetaComponentAliasNotCanonical'));

const routeAudit = routeMetadataAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    routeSanitization: {
      version:'route-sanitization/v1',
      removed: [{ field:'layoutVariant', reason:'incompatible route' }],
      suppressed: [],
      recomputed: [],
      staleForRoute: [{ field:'assetGeneration', reason:'old visual role', resolution:'kept' }],
      active: ['type', 'assetGeneration', 'componentPlan']
    },
    assetDecision: Object.assign({}, renderMeta().slides[0].assetDecision, { staleForRoute:true })
  })
});
assert.equal(routeAudit.status, 'fail');
assert.ok(routeAudit.findings.some(f => f.type === 'staleRouteMetadataResolutionMissing'));
assert.ok(routeAudit.findings.some(f => f.type === 'staleRouteMetadataStillActive'));
assert.ok(routeAudit.findings.some(f => f.type === 'staleAssetDecisionForRoute'));

const normalized = {
  slides:[{
    type:'cards',
    componentPlan: { components:[plannedComponent()] },
    cards: [{}, {}, {}, {}]
  }]
};
const consumptionAudit = componentConsumptionAuditFromRender(normalized, { file:'fixture.render-meta.json', meta:renderMeta() });
assert.equal(consumptionAudit.status, 'fail');
assert.ok(consumptionAudit.findings.some(f => f.type === 'renderedCountMismatch'));

const missingDrawnEvidenceAudit = componentConsumptionAuditFromRender(
  {
    slides:[{
      type:'cards',
      componentPlan: { components:[plannedComponent()] },
      cards: [{}]
    }]
  },
  {
    file:'fixture.render-meta.json',
    meta: renderMeta({
      drawnComponents: [],
      consumedComponents: [{
        id:'content-card-grid',
        required:true,
        mode:'native-renderer',
        rendered:true,
        drawnCount:1,
        nativeSlot:'cards',
        bbox:{ x:0.7, y:1.2, w:4, h:3 },
        rendererMethod:'testCards'
      }]
    })
  }
);
assert.equal(missingDrawnEvidenceAudit.status, 'fail');
assert.ok(missingDrawnEvidenceAudit.findings.some(f => f.type === 'nativeComponentDrawnEvidenceMissing'));

const nativeOnlyOverlayAudit = componentConsumptionAuditFromRender(
  {
    slides:[{
      type:'cards',
      componentPlan: { components:[plannedComponent()] },
      cards: [{}]
    }]
  },
  {
    file:'fixture.render-meta.json',
    meta: renderMeta({
      drawnComponents: [],
      plannedComponents: [plannedComponent({ allowedModes:['overlay'] })],
      consumedComponents: [{
        id:'content-card-grid',
        required:true,
        mode:'overlay',
        rendered:true,
        bbox:{ x:0.7, y:1.2, w:4, h:3 }
      }]
    })
  }
);
assert.equal(nativeOnlyOverlayAudit.status, 'fail');
assert.ok(nativeOnlyOverlayAudit.findings.some(f => f.type === 'componentModeMismatch' && /capability manifest/.test(f.message)));

const overlayAudit = overlayContractAuditFromRender({
  file:'fixture.render-meta.json',
  meta: renderMeta({
    consumedComponents: [
      { id:'content-card-grid', required:true, mode:'overlay', rendered:true, bbox:{ x:5.2, y:1.4, w:1, h:1 } },
      { id:'content-card-grid', required:true, mode:'overlay', rendered:true, bbox:{ x:5.4, y:1.6, w:1, h:1 } }
    ]
  })
});
assert.equal(overlayAudit.status, 'fail');
assert.ok(overlayAudit.findings.some(f => f.type === 'overlaySlotMismatch'));
assert.ok(overlayAudit.findings.some(f => f.type === 'duplicateOverlayComponent'));

const coverageAudit = contentCoverageAuditFromRender(
  {
    file:'fixture.render-meta.json',
    meta: renderMeta({
      type:'case-gallery',
      plannedComponents:[plannedComponent({ id:'proof-gallery', allowedModes:['native'] })]
    })
  },
  [{ slide:1, mainBodyCoverage:0, mainBodyCharCount:0, mainBodyElements:0, rightEvidenceCoverage:0, images:0 }]
);
assert.equal(coverageAudit.status, 'fail');
assert.ok(coverageAudit.findings.some(f => f.type === 'mainBodyMissingContent'));
assert.ok(coverageAudit.findings.some(f => f.type === 'rightEvidenceRegionMissing'));
const coverageMainFinding = coverageAudit.findings.find(f => f.type === 'mainBodyMissingContent');
assert.equal(coverageMainFinding.regionName, 'mainBody');
assert.equal(coverageMainFinding.reason, 'main_body_empty');
assert.equal(coverageMainFinding.mainBodyCoverage, 0);
const coverageRightFinding = coverageAudit.findings.find(f => f.type === 'rightEvidenceRegionMissing');
assert.equal(coverageRightFinding.regionName, 'rightEvidence');
assert.equal(coverageRightFinding.reason, 'expected_evidence_region_empty');
assert.equal(coverageRightFinding.rightEvidenceCoverage, 0);
assert.deepEqual(coverageRightFinding.expectedComponentIds, ['proof-gallery']);

const decorativeOnlyCoverageAudit = contentCoverageAuditFromRender(
  {
    file:'fixture.render-meta.json',
    meta: renderMeta({
      type:'content',
      plannedComponents:[],
      drawnComponents:[],
      consumedComponents:[]
    })
  },
  [{ slide:1, mainBodyCoverage:0.12, mainBodyCharCount:0, mainBodyElements:5, rightEvidenceCoverage:0, images:0 }]
);
assert.equal(decorativeOnlyCoverageAudit.status, 'fail');
const decorativeOnlyFinding = decorativeOnlyCoverageAudit.findings.find(f =>
  f.type === 'mainBodyMissingContent' && /non-text shapes/.test(f.message)
);
assert.equal(decorativeOnlyFinding.reason, 'main_body_decorative_only');
assert.equal(decorativeOnlyFinding.mainBodyCoverage, 0.12);
assert.equal(decorativeOnlyFinding.hasSemanticComponent, false);

const nativeComponentCoverageAudit = contentCoverageAuditFromRender(
  {
    file:'fixture.render-meta.json',
    meta: renderMeta({
      type:'content',
      plannedComponents:[plannedComponent()],
      drawnComponents:[{ id:'content-card-grid', drawnCount:3, nativeSlot:'cards', bbox:{ x:0.7, y:1.3, w:4, h:3 }, rendererMethod:'testCards' }],
      consumedComponents:[{ id:'content-card-grid', required:true, mode:'native-renderer', rendered:true, drawnCount:3, nativeSlot:'cards', bbox:{ x:0.7, y:1.3, w:4, h:3 }, rendererMethod:'testCards' }]
    })
  },
  [{ slide:1, mainBodyCoverage:0.12, mainBodyCharCount:0, mainBodyElements:5, rightEvidenceCoverage:0, images:0 }]
);
assert.equal(nativeComponentCoverageAudit.status, 'pass');

const secondary = secondaryVisualReview(
  { slides:Array.from({ length:6 }, () => ({ type:'cards', layoutVariant:'grid', visualDensity:'dense' })) },
  { slides:[
    { dimensions:{ rhythm:70, industryFit:70, densityControl:70, evidenceRelationship:70 } },
    { dimensions:{ rhythm:71, industryFit:71, densityControl:71, evidenceRelationship:71 } }
  ] },
  [
    { slide:1, info:{ hash:'0'.repeat(64) } },
    { slide:2, info:{ hash:'0'.repeat(64) } }
  ]
);
assert.equal(secondary.status, 'review');
assert.ok(secondary.findings.some(f => f.type === 'repeatedComposition'));
assert.ok(secondary.findings.some(f => f.type === 'contactSheetRhythmRepeat'));

console.log('render meta audits ok');
