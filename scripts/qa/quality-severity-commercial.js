function entry(category, levels, reason, source = 'visual_qa/render_meta') {
  return { category, levels, reason, source };
}

const FAIL_ALL = { draft:'fail', formal:'fail', delivery:'fail' };
const FORMAL_FAIL = { draft:'review', formal:'fail', delivery:'fail' };

const COMMERCIAL_READINESS_SEVERITY_MATRIX = {
  accentOnlyAsThinLine: entry('commercial_readiness', FORMAL_FAIL, 'primary color must carry meaningful commercial hierarchy'),
  adjacentLayoutSimilarity: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need visible layout rhythm between adjacent pages'),
  aestheticScore: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need sufficient aesthetic model scores'),
  brandAdaptationWeak: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need industry and brand fit'),
  captionCoverage: entry('commercial_readiness', FORMAL_FAIL, 'image-heavy slides need captions or evidence labels'),
  closingContactMissing: entry('commercial_readiness', FORMAL_FAIL, 'company-introduction closing pages need contact or next-step details'),
  closingLacksWeight: entry('commercial_readiness', FORMAL_FAIL, 'closing slides need strong visual and brand weight'),
  commercialLogicThin: entry('commercial_readiness', FORMAL_FAIL, 'commercial decks need visible business logic chains'),
  compositionPlanMissing: entry('commercial_readiness', FAIL_ALL, 'body slides require executable composition plans'),
  compositionTooGeneric: entry('commercial_readiness', FORMAL_FAIL, 'formal decks cannot rely on generic proof-object grammar'),
  contentOverlap: entry('commercial_readiness', FAIL_ALL, 'adjacent slides cannot reuse too many proof facts'),
  deckFactReuse: entry('commercial_readiness', FORMAL_FAIL, 'non-adjacent slides should not repeat the same proof facts'),
  densityControlWeak: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need density control'),
  evidenceCaptionBudget: entry('commercial_readiness', FORMAL_FAIL, 'evidence-board captions must stay within readability budget'),
  evidenceRelationshipWeak: entry('commercial_readiness', FORMAL_FAIL, 'image-text evidence relationships must be clear'),
  externalMetaLeak: entry('commercial_readiness', FORMAL_FAIL, 'external decks cannot expose internal audience or review metadata'),
  flatPageRhythm: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need enough dark or accent rhythm anchors'),
  genericRoute: entry('commercial_readiness', FORMAL_FAIL, 'formal decks cannot overuse generic commercial split routes'),
  imageTextRelationshipWeak: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need clear image-text evidence relationships'),
  industryDepthMissing: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need industry-specific depth signals'),
  industryFitProofObjectsThin: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need industry-fit proof objects'),
  industryForbiddenPattern: entry('commercial_readiness', FORMAL_FAIL, 'formal decks cannot use patterns forbidden by the industry pack'),
  industryKnowledgeCoverage: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need enough industry knowledge coverage'),
  industryPackMissing: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need a known industry pack or explicit review'),
  industryWeakExpression: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need dedicated industry proof-object routes'),
  loopSemantics: entry('commercial_readiness', FORMAL_FAIL, 'loop language must route to loop or responsibility grammar'),
  matrixCoordinates: entry('commercial_readiness', FORMAL_FAIL, 'risk matrix routes need matrix data or positioned risks'),
  metricBusinessLogic: entry('commercial_readiness', FORMAL_FAIL, 'metric slides need visible business logic chains'),
  missingBrandMotif: entry('commercial_readiness', FORMAL_FAIL, 'formal slides need reusable brand motifs'),
  pageRhythmWeak: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need stronger page rhythm'),
  productionNoteLeak: entry('commercial_readiness', FAIL_ALL, 'visible slide copy cannot contain production-note wording'),
  proofObjectMissing: entry('commercial_readiness', FORMAL_FAIL, 'body slides need concrete proof objects'),
  repeatedComposition: entry('commercial_readiness', FORMAL_FAIL, 'formal decks cannot over-repeat one composition route'),
  repeatedDataComponent: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need varied data component usage'),
  reportLogicThin: entry('commercial_readiness', FORMAL_FAIL, 'formal reports need enough business logic pages'),
  reportProofDepthThin: entry('commercial_readiness', FORMAL_FAIL, 'formal reports need enough proof-object coverage'),
  reportRhythmTooFlat: entry('commercial_readiness', FORMAL_FAIL, 'formal reports need varied route rhythm'),
  semanticColorMismatch: entry('commercial_readiness', FORMAL_FAIL, 'semantic accent roles must match slide intent'),
  templateRhythm: entry('commercial_readiness', FORMAL_FAIL, 'formal decks cannot repeat the same template route three times in a row'),
  themeCoverageLow: entry('commercial_readiness', FORMAL_FAIL, 'formal slides need sufficient primary color budget'),
  themeIntentVarietyLow: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need varied theme intent'),
  tooManyWhitePages: entry('commercial_readiness', FORMAL_FAIL, 'formal decks need rhythm anchors across long pale runs'),
  visibleProductionNote: entry('commercial_readiness', FAIL_ALL, 'visible slide copy cannot contain production or test wording'),
  visualTemplateFatigue: entry('commercial_readiness', FORMAL_FAIL, 'formal decks cannot show excessive visual template fatigue'),
  weakImageTreatment: entry('commercial_readiness', FORMAL_FAIL, 'image material must become proof or showcase treatment')
};

module.exports = {
  COMMERCIAL_READINESS_SEVERITY_MATRIX
};
