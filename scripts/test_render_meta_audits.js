const assert = require('assert/strict');

const {
  componentConsumptionAuditFromRender,
  contentCoverageAuditFromRender,
  expectedRenderedCountsForSlide,
  overlayContractAuditFromRender,
  renderMetaSchemaAuditFromRender,
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
      assetDecision: {
        version: 'asset-decision/v1',
        status: 'none',
        mode: 'structure-only'
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
      drawnComponents: [{ id:'content-card-grid', drawnCount:3, nativeSlot:'cards', bbox:{ x:0.7, y:1.2, w:4, h:3 } }],
      consumedComponents: [{ id:'content-card-grid', required:true, mode:'native-renderer', rendered:true, drawnCount:3, nativeSlot:'cards', bbox:{ x:0.7, y:1.2, w:4, h:3 } }],
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
