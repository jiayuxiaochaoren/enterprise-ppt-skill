const RENDERER_CONTEXT_CONTRACT = {
  colors: ['colors', 'presentationSpec', 'panelFill', 'surfaceFill'],
  text: ['addText', 'addLabel', 'addNumber', 'sectionKicker', 'footerText', 'publicSlideNote', 'copyFallback', 'copyPolicyList', 'typeSize', 'profileFont', 'itemTitle', 'itemBody'],
  shapes: ['addRect', 'addHairline', 'addArrowLine', 'PageNumber', 'lightCanvas', 'stageCanvas', 'addPhotoPanel', 'addDarkBreathingCircle', 'addLightBreathingCircle', 'addPulseCurve'],
  components: ['componentRendererContext', 'renderChartSpec', 'recordChartConsumption'],
  assets: ['fileExists', 'designForSlide', 'galleryImages', 'mediaForRole', 'resolveAssetPath', 'smartPhotoFit'],
  variants: ['variantOf'],
  financial: [
    'chartSpecToComponentId',
    'compactEvidenceCaption',
    'formatMetricDelta',
    'publicSlideNote',
    'recordChartConsumption',
    'renderChartSpec',
    'routeChartSpec'
  ],
  closing: [
    'ContactBlock',
    'activePlan',
    'addEnergyLens',
    'addEnergyMotionBackdrop',
    'addEnergyPhotoBackdrop',
    'addVisualPhotoBackdrop',
    'canvasHeight',
    'canvasWidth',
    'coverMetaText',
    'isCompanyIntroPlan',
    'metaDisabled'
  ],
  evidenceGallery: [
    'brandWorldBusinessProof',
    'caseComparisonSlide',
    'caseEvidenceBoard',
    'caseEvidenceHero',
    'consumerProofPhotoGrid',
    'energySiteComparisonSlide',
    'energySiteEvidenceGallery',
    'executiveProofBoard',
    'financePortfolioEvidenceGallery',
    'healthcareTouchpointEvidenceGallery',
    'peopleProofMosaic',
    'productEvidenceStory',
    'retailLookbookStory',
    'saasPrototypeFlowGallery',
    'sustainabilityProofSpread'
  ]
};

function createRendererContext(api = {}) {
  return Object.freeze(Object.assign({}, api, {
    colors() {
      return typeof api.colors === 'function' ? api.colors() : (api.colors || {});
    }
  }));
}

function missingRendererContextKeys(ctx = {}, groups = Object.keys(RENDERER_CONTEXT_CONTRACT)) {
  return groups.flatMap(group => (RENDERER_CONTEXT_CONTRACT[group] || []).filter(key => ctx[key] == null));
}

module.exports = {
  RENDERER_CONTEXT_CONTRACT,
  createRendererContext,
  missingRendererContextKeys
};
