const MATRIX_VERSION = 'quality-severity-matrix/v1';
const {
  COMMERCIAL_READINESS_SEVERITY_MATRIX
} = require('./quality-severity-commercial');

function entry(category, levels, reason, source = 'visual_qa/render_meta') {
  return { category, levels, reason, source };
}

const FAIL_ALL = { draft:'fail', formal:'fail', delivery:'fail' };
const FORMAL_FAIL = { draft:'review', formal:'fail', delivery:'fail' };
const DELIVERY_FAIL = { draft:'review', formal:'review', delivery:'fail' };

const QUALITY_SEVERITY_MATRIX = {
  renderMetaMissing: entry(
    'contract',
    { draft:'review', formal:'fail', delivery:'fail' },
    'formal review requires render-meta so contract QA cannot be skipped'
  ),
  renderMetaUnreadable: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta exists but cannot be parsed'),
  renderMetaVersionInvalid: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta version must match the v1 contract'),
  renderMetaSlidesMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta slides[] is required for auditability'),
  renderMetaSlideCountMismatch: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta slide count must match the PPTX'),
  renderMetaDeclaredSlideCountMismatch: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta declared slide count must be internally consistent'),
  renderMetaSlideNumberInvalid: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta slide records must identify a valid positive slide number'),
  renderMetaSlideTypeMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta slide records must identify the rendered slide type'),
  renderMetaRendererFieldMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'rendererMatch fields are part of the render-meta contract'),
  renderMetaRenderRouteMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'renderRoute v1 is required as the single route contract'),
  renderMetaRenderRouteFieldMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'renderRoute must expose renderer, component, asset, and route policy fields'),
  renderMetaComponentArrayMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'component evidence arrays are required for renderer QA'),
  renderMetaAssetDecisionMissing: entry('contract', { draft:'fail', formal:'fail', delivery:'fail' }, 'assetDecision v1 is required on every slide'),
  renderMetaAssetDecisionFieldMissing: entry('asset_provenance', { draft:'fail', formal:'fail', delivery:'fail' }, 'assetDecision provenance fields are required for delivery audit'),
  renderMetaAssetDecisionMixedDetailMissing: entry('asset_provenance', { draft:'fail', formal:'fail', delivery:'fail' }, 'mixed asset provenance must expose concrete detail classes'),
  renderMetaBoundAssetMissing: entry('asset_provenance', { draft:'fail', formal:'fail', delivery:'fail' }, 'bound asset decisions must record at least one bound asset'),
  renderMetaBlockedAssetModeInvalid: entry('asset_provenance', { draft:'fail', formal:'fail', delivery:'fail' }, 'blocked asset decisions must use the blocked asset mode'),

  fallbackRendererUsed: entry(
    'fallback',
    { draft:'review', formal:'fail', delivery:'fail' },
    'formal and delivery modes cannot rely on fallback slide renderers'
  ),
  renderMetaRendererMatchKindInvalid: entry('fallback', { draft:'fail', formal:'fail', delivery:'fail' }, 'unknown renderer match kinds break route audit semantics'),

  skippedCriticalAsset: entry(
    'skipped_critical_asset',
    { draft:'review', formal:'fail', delivery:'fail' },
    'critical visual proof cannot be silently skipped in formal or delivery review'
  ),
  weakImageAsset: entry(
    'skipped_critical_asset',
    { draft:'review', formal:'fail', delivery:'fail' },
    'formal review requires weak image assets to be reviewed before delivery review'
  ),
  assetAuthorizationUnknown: entry('skipped_critical_asset', { draft:'review', formal:'fail', delivery:'fail' }, 'formal review requires image authorization to be resolved'),
  assetAuthorizationUnresolved: entry('skipped_critical_asset', { draft:'fail', formal:'fail', delivery:'fail' }, 'formal rendering cannot proceed with unresolved image authorization'),
  assetAuthorizationBlocked: entry('skipped_critical_asset', { draft:'fail', formal:'fail', delivery:'fail' }, 'blocked image assets cannot be used for delivery'),
  generatedAssetCannotSatisfyFactualProof: entry('skipped_critical_asset', { draft:'fail', formal:'fail', delivery:'fail' }, 'generated imagery cannot satisfy factual proof requirements'),
  renderMetaGeneratedPromptModeInvalid: entry('asset_provenance', { draft:'fail', formal:'fail', delivery:'fail' }, 'unbound generated prompts must remain auditable'),
  assetAuthorizationGateMissing: entry('asset_provenance', FAIL_ALL, 'formal material generation requires image provenance and authorization'),
  crossIndustryAsset: entry('asset_provenance', FAIL_ALL, 'asset references must match the deck industry context'),
  customerCaseAuthorization: entry('asset_provenance', FORMAL_FAIL, 'customer or sensitive case evidence needs public-use authorization'),
  evidenceProvenanceWeak: entry('asset_provenance', FORMAL_FAIL, 'proof objects need source ids or explicit generated-illustration boundaries'),
  generatedEvidenceMisclassified: entry('asset_provenance', FAIL_ALL, 'generated illustrations cannot be classified as factual evidence'),
  generatedTargetMissing: entry('asset_provenance', FORMAL_FAIL, 'required generated imagery must carry an auditable target slot/aspect contract'),
  generatedPromptAspectConflict: entry('asset_provenance', FAIL_ALL, 'image generation prompts cannot contain aspect instructions that conflict with the target contract'),
  assetAspectMismatch: entry('asset_provenance', FAIL_ALL, 'bound generated assets must match the target slot aspect ratio unless explicitly allowed for review'),
  imageProvenanceMissing: entry('asset_provenance', FAIL_ALL, 'image evidence must include screenshot or image provenance'),
  unboundGeneratedAsset: entry('asset_provenance', FAIL_ALL, 'generated prompts must be bound to real or generated assets before delivery'),
  unsafeGeneratedAssetRequest: entry('asset_provenance', FAIL_ALL, 'blocked factual proof objects cannot request generated imagery'),

  unknownComponentId: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'unknown component ids cannot be consumed or audited safely'),
  componentAliasNotCanonical: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'component aliases must be normalized before QA'),
  renderMetaComponentAliasNotCanonical: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta must record canonical component ids'),
  componentPlanMissing: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'slides need executable component plans for renderer QA'),
  componentNotConsumed: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'required components must have consumption evidence'),
  componentModeMismatch: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'component render mode must match capability policy'),
  renderMetaComponentContractFieldMissing: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'render-meta planned components must include capability contract fields'),
  renderMetaConsumedComponentEvidenceMissing: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'native consumed components must carry drawn evidence fields'),
  renderMetaDrawnComponentFieldMissing: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'drawnComponents evidence must include count, slot, bbox, and renderer method'),
  nativeComponentEvidenceMissing: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'native component consumption requires drawn evidence'),
  nativeComponentDrawnEvidenceMissing: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'native drawnComponents evidence is required'),
  nativeComponentClaimedButUndrawn: entry('unknown_component', { draft:'review', formal:'fail', delivery:'fail' }, 'formal review blocks native ownership without drawn evidence'),
  renderedCountMismatch: entry('unknown_component', { draft:'fail', formal:'fail', delivery:'fail' }, 'drawn item counts must match the planned component contract'),
  acceptanceComponentNotConsumed: entry('unknown_component', FAIL_ALL, 'acceptance gate requires planned components to be consumed'),
  componentRequiredMissing: entry('unknown_component', FORMAL_FAIL, 'component plans need required components for meaningful renderer QA'),
  loadCurveWithoutSemantics: entry('unknown_component', FAIL_ALL, 'load-curve components require explicit curve, trend, or load semantics'),
  processRailWithoutStructure: entry('unknown_component', FAIL_ALL, 'process-rail components require process structure'),
  riskMatrixDefaulted: entry('unknown_component', FAIL_ALL, 'risk-matrix components must be explicitly triggered'),
  riskRegisterWithoutRows: entry('unknown_component', FAIL_ALL, 'risk-register components require risk or control rows'),
  systemRailWithoutArchitecture: entry('unknown_component', FAIL_ALL, 'system-rail components require architecture or strategy structure'),

  chainSegmentMissing: entry('industry_evidence_chain', FORMAL_FAIL, 'industry evidence chains must cover the required claim, promise, and evidence stages'),
  chainStageNeutral: entry('industry_evidence_chain', FORMAL_FAIL, 'known industry slides cannot fall back to neutral/general in formal review'),
  captionCoverageLow: entry('industry_evidence_chain', { draft:'review', formal:'review', delivery:'review' }, 'caption-led evidence stages should expose caption or proof explanation fields'),
  componentHintEvidenceMissing: entry('industry_evidence_chain', FORMAL_FAIL, 'component hints outside the canonical industry chain require matching image, source, or structured evidence fields'),
  crossIndustryComponentMismatch: entry('industry_evidence_chain', FORMAL_FAIL, 'industry-specific pages cannot consume components from another industry grammar'),
  evidenceFieldInsufficient: entry('industry_evidence_chain', { draft:'review', formal:'review', delivery:'fail' }, 'industry stage inference needs structured proof fields before delivery'),
  healthcareHandoffEvidenceMissing: entry('industry_evidence_chain', FORMAL_FAIL, 'healthcare service-blueprint components require handoff, touchpoint, or journey evidence'),
  industryEvidenceComponentBboxMissing: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence components need a visible render-meta bbox'),
  industryEvidenceComponentDrawCountMissing: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence components need drawnCount or itemCount evidence'),
  industryEvidenceComponentNotConsumed: entry('industry_evidence_chain', FAIL_ALL, 'planned industry evidence components must be consumed by the renderer'),
  // Legacy compatibility for pre-coveragePolicy reports; current audits emit requiredAll/requiredAny/minHits findings instead.
  industryEvidenceComponentPartial: entry('industry_evidence_chain', { draft:'review', formal:'review', delivery:'fail' }, 'partial industry component coverage needs delivery review'),
  industryEvidenceCoverageBelowMinimum: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence coverage must satisfy the stage minimum hit count'),
  industryEvidenceComponentsMissing: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence stages need at least one mapped evidence component'),
  industryEvidenceChainComponentMismatch: entry('industry_evidence_chain', FORMAL_FAIL, 'input industry chain component lists must match the canonical chain before formal review'),
  industryEvidenceChainInputSuppressed: entry('industry_evidence_chain', FORMAL_FAIL, 'input industry chain metadata cannot supply current chain authority'),
  industryEvidenceChainInvalid: entry('industry_evidence_chain', FAIL_ALL, 'malformed input industry chain metadata cannot be trusted'),
  industryEvidenceChainMismatch: entry('industry_evidence_chain', FAIL_ALL, 'input industry chain identity must match the canonical chain'),
  industryEvidenceChainStale: entry('industry_evidence_chain', FORMAL_FAIL, 'stale input industry chain metadata must remain suppressed and reviewed'),
  industryEvidenceRenderMetaFieldMissing: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence render-meta must carry chainStage, label, reason, and chain ids'),
  industryNativeDrawnEvidenceMissing: entry('industry_evidence_chain', FAIL_ALL, 'native-owned industry components need drawnComponents evidence from nativeDrawnEvidenceFor'),
  industryEvidenceRequiredAnyMissing: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence stages must satisfy at least one required-any component'),
  industryEvidenceRequiredComponentMissing: entry('industry_evidence_chain', FAIL_ALL, 'industry evidence stages must satisfy required-all components'),
  previousIndustryEvidenceChainComponentMismatch: entry('industry_evidence_chain', FORMAL_FAIL, 'suppressed previous chain component lists must be audited against canonical components'),
  previousIndustryEvidenceChainInvalid: entry('industry_evidence_chain', FORMAL_FAIL, 'suppressed previous chain metadata still needs a valid auditable shape'),
  prototypeEvidenceMissing: entry('industry_evidence_chain', FORMAL_FAIL, 'SaaS prototype components require screenshot, image, or prototype screen evidence'),
  renderMetaReadError: entry('industry_evidence_chain', FORMAL_FAIL, 'industry evidence render-meta must be readable for formal review'),
  renderMetaSlideMissing: entry('industry_evidence_chain', FORMAL_FAIL, 'industry evidence render-meta must include the audited slide'),
  sourceCoverageLow: entry('industry_evidence_chain', FORMAL_FAIL, 'source-led industry evidence stages require source or provenance coverage'),
  visibleSourceNoteMissing: entry('industry_evidence_chain', { draft:'review', formal:'review', delivery:'review' }, 'legacy/explicit visible source-note modes may review missing display text; formal decks keep source evidence internal by default'),

  routeMetadataAuditFieldMissing: entry('stale_metadata', { draft:'fail', formal:'fail', delivery:'fail' }, 'route normalization audit fields must be complete'),
  staleRouteMetadataEntryInvalid: entry('stale_metadata', { draft:'fail', formal:'fail', delivery:'fail' }, 'stale route metadata entries must identify a field'),
  staleRouteMetadataResolutionMissing: entry('stale_metadata', { draft:'fail', formal:'fail', delivery:'fail' }, 'stale route metadata must record its resolution'),
  staleRouteMetadataStillActive: entry('stale_metadata', { draft:'fail', formal:'fail', delivery:'fail' }, 'stale route metadata cannot remain active after normalization'),
  staleAssetDecisionForRoute: entry('stale_metadata', { draft:'fail', formal:'fail', delivery:'fail' }, 'asset decisions stale for the active route cannot pass QA'),
  staleComponentConsumptionForRoute: entry('stale_metadata', { draft:'fail', formal:'fail', delivery:'fail' }, 'components cannot be consumed from stale route metadata'),

  smallChineseText: entry(
    'shrink_risk',
    { draft:'review', formal:'fail', delivery:'fail' },
    'formal review treats dense small Chinese text as a readability defect'
  ),
  textShrinkRisk: entry('shrink_risk', { draft:'review', formal:'fail', delivery:'fail' }, 'formal review blocks shrink-to-fit text that risks unreadable CJK output'),
  textLineCollision: entry(
    'shrink_risk',
    { draft:'review', formal:'fail', delivery:'fail' },
    'formal review treats visible text/rule collisions as blocking layout defects'
  ),
  tinyText: entry('shrink_risk', { draft:'fail', formal:'fail', delivery:'fail' }, 'tiny text is below the visual QA floor'),
  renderedTinyChineseText: entry('shrink_risk', { draft:'fail', formal:'fail', delivery:'fail' }, 'rendered Chinese text below the floor is unreadable'),
  unreadableNarrowText: entry('shrink_risk', { draft:'fail', formal:'fail', delivery:'fail' }, 'narrow CJK text boxes are unreadable'),
  typographyBodyTooSmall: entry('shrink_risk', FORMAL_FAIL, 'body typography tokens are below the readable floor for this industry'),
  typographyFontPolicyMissing: entry('shrink_risk', FAIL_ALL, 'typography policy must define CJK, Latin, and number fonts'),
  typographyScaleTooFlat: entry('shrink_risk', FORMAL_FAIL, 'typography scale must create visible hierarchy'),
  typographyTokenMissing: entry('shrink_risk', FAIL_ALL, 'required typography tokens must be present'),

  mainBodyMissingContent: entry('blank_page', { draft:'fail', formal:'fail', delivery:'fail' }, 'content pages must have visible main-body coverage'),
  rightEvidenceRegionMissing: entry('blank_page', { draft:'fail', formal:'fail', delivery:'fail' }, 'evidence pages must populate their evidence region'),
  previewMissing: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation requires preview evidence for screenshot-level review'),
  previewCount: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation requires preview count to match slide count'),
  previewUnreadable: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation cannot use unreadable preview images'),
  possiblyBlankPreview: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation blocks possibly blank preview images'),
  lowVisualVariance: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation blocks previews that appear blank or overly plain'),

  baselineManifestMissing: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline manifests must be present when requested'),
  baselineManifestUnreadable: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline manifests must be readable'),
  baselinePreviewMissing: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline QA requires current preview PNGs'),
  baselinePreviewUnreadable: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline and current preview PNGs must be readable'),
  baselineHashDistance: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline hash drift exceeded the manifest threshold'),
  baselineLumaDistance: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline luminance drift exceeded the manifest threshold'),
  baselineContentBBoxShift: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'baseline content bbox drift exceeded the manifest threshold'),
  baselineRegionMissing: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'region-level baseline coverage is below threshold'),
  baselineRegionHashDistance: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'region-level baseline hash drift exceeded the manifest threshold'),
  baselineRegionBBoxShift: entry('baseline_drift', { draft:'fail', formal:'fail', delivery:'fail' }, 'region-level baseline content bbox drift exceeded the manifest threshold'),

  emptyPlan: entry('plan_contract', FAIL_ALL, 'deck plans must contain slides'),
  planMissing: entry('plan_contract', FAIL_ALL, 'visual QA cannot audit a missing deck plan'),
  planUnreadable: entry('plan_contract', FAIL_ALL, 'visual QA cannot audit an unreadable deck plan'),
  pageCountMismatch: entry('plan_contract', FAIL_ALL, 'generated slide count must match the requested page count'),
  pageCountResolvedMismatch: entry('plan_contract', FORMAL_FAIL, 'generated slide count must match the resolved target contract'),
  pageCountMaterialShortage: entry('plan_contract', FORMAL_FAIL, 'material shortage must be explicitly resolved before formal delivery'),
  acceptancePageCountMismatch: entry('plan_contract', FAIL_ALL, 'acceptance gate requires page count to match the target'),
  acceptanceClaimMissing: entry('plan_contract', FORMAL_FAIL, 'body pages need claim spine text'),
  acceptanceClaimSpineMissing: entry('plan_contract', FORMAL_FAIL, 'claim spine must cover body pages'),
  acceptanceProofObjectMissing: entry('plan_contract', FORMAL_FAIL, 'body pages need proof objects'),
  acceptanceRenderMetaMissing: entry('plan_contract', FORMAL_FAIL, 'acceptance gate requires render-meta for component consumption'),

  sourceTraceMissing: entry('source_trace', FAIL_ALL, 'factual proof objects require source trace'),
  sourceTraceNotExplainable: entry('source_trace', FAIL_ALL, 'source trace entries need page and excerpt evidence'),
  metricSourceTraceMissing: entry('source_trace', FAIL_ALL, 'metrics need source id, page, and excerpt trace'),
  metricSourceTraceNotExplainable: entry('source_trace', FAIL_ALL, 'metric source trace needs page and excerpt evidence'),

  chartSpecUnknownKind: entry('data_contract_gap', FAIL_ALL, 'chart specs must use known kinds or explicit information gaps'),
  chartInformationGap: entry('data_contract_gap', FAIL_ALL, 'insufficient chart data must remain an explicit information gap'),
  fakeTrendLine: entry('data_contract_gap', FAIL_ALL, 'trend charts require enough real series data'),
  chartUnitMissing: entry('data_contract_gap', FORMAL_FAIL, 'formal charts require visible units'),
  chartSourceMissing: entry('data_contract_gap', FORMAL_FAIL, 'formal charts require source trace'),
  chartProofObjectMissing: entry('data_contract_gap', FORMAL_FAIL, 'charts need proof object traceability'),
  chartEvidenceUntraced: entry('data_contract_gap', FORMAL_FAIL, 'chart evidence mode cannot remain untraced for formal delivery'),
  acceptanceChartSpecContractError: entry('data_contract_gap', FAIL_ALL, 'strict acceptance requires chartSpec/v1 contract compliance'),
  acceptanceChartSpecRepairInStrictMode: entry('data_contract_gap', FAIL_ALL, 'strict acceptance cannot rely on repaired chart specs'),
  acceptanceChartUnitMissing: entry('data_contract_gap', FORMAL_FAIL, 'acceptance gate requires chart units'),
  acceptanceChartSourceMissing: entry('data_contract_gap', FORMAL_FAIL, 'acceptance gate requires chart sources'),

  monthlySeriesNotLine: entry('routing_error', FAIL_ALL, 'monthly sequence data must route to a line chart'),
  funnelNotFunnel: entry('routing_error', FAIL_ALL, 'funnel stage data must route to a funnel chart'),
  waterfallNotWaterfall: entry('routing_error', FAIL_ALL, 'bridge data must route to a waterfall chart'),

  chartAxisLabelsMissing: entry('renderer_layout_bug', FAIL_ALL, 'axis-based charts require category or axis labels'),
  chartLabelOverlap: entry('renderer_layout_bug', FORMAL_FAIL, 'formal chart labels cannot overlap'),
  chartValueOverflow: entry('renderer_layout_bug', FORMAL_FAIL, 'formal chart values cannot overflow their layout'),
  chartNotRendered: entry('renderer_layout_bug', FAIL_ALL, 'planned chart components must render'),
  equalLengthFunnel: entry('renderer_layout_bug', FORMAL_FAIL, 'equal funnel bars need review as possible fake data'),
  arrowCoveredByRectangle: entry('renderer_layout_bug', FAIL_ALL, 'arrow connectors cannot be covered by later shapes'),
  bottomFlowFooterCollision: entry('renderer_layout_bug', FAIL_ALL, 'bottom flow rules cannot collide with footer or caption text'),
  placeholderText: entry('renderer_layout_bug', FAIL_ALL, 'visible placeholder text cannot ship'),
  textCoveredByShape: entry('renderer_layout_bug', FAIL_ALL, 'visible text cannot be covered by later filled shapes'),

  unsafeOverlayBlocked: entry('overlay_contract', FORMAL_FAIL, 'blocked overlay components cannot be consumed'),
  overlayWithoutDeclaredSlot: entry('overlay_contract', FAIL_ALL, 'overlay components require declared safe slots'),
  overlaySlotMismatch: entry('overlay_contract', FAIL_ALL, 'overlay bboxes must stay inside their declared safe slots'),
  overlayNativeZoneConflict: entry('overlay_contract', FAIL_ALL, 'overlays cannot intersect native occupied zones outside safe slots'),
  duplicateLoadCurveBand: entry('overlay_contract', FAIL_ALL, 'slides can contain at most one load-curve-band decoration'),
  duplicateBreathingCircle: entry('overlay_contract', FORMAL_FAIL, 'background circle decorations cannot become repeated visual noise'),
  breathingCircleTextZoneConflict: entry('overlay_contract', FAIL_ALL, 'background circles must stay out of text and card zones'),

  duplicateOverlayComponent: entry(
    'fallback',
    { draft:'review', formal:'fail', delivery:'fail' },
    'formal review blocks duplicate overlays that may indicate stale fallback rendering'
  ),
  acceptanceContactSheetMissing: entry('blank_page', DELIVERY_FAIL, 'delivery validation requires contact sheet evidence'),
  acceptanceContactSheetUnreadable: entry('blank_page', DELIVERY_FAIL, 'delivery validation blocks unreadable contact sheet evidence'),
  contactSheetRhythmRepeat: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation blocks repeated contact-sheet rhythm'),
  slideSimilarity: entry('blank_page', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation blocks likely duplicated adjacent slides'),
  textDensity: entry('shrink_risk', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation treats excessive text density as blocking'),
  typographyScaleTooFragmented: entry('shrink_risk', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation treats fragmented type scale as blocking'),
  typographyFontFamilyDrift: entry('shrink_risk', { draft:'review', formal:'review', delivery:'fail' }, 'delivery validation treats font-family drift as blocking'),

  ...COMMERCIAL_READINESS_SEVERITY_MATRIX
};

module.exports = {
  MATRIX_VERSION,
  QUALITY_SEVERITY_MATRIX
};
