const RENDERER_CONTEXT_CONTRACT = {
  colors: ['colors', 'presentationSpec', 'panelFill', 'surfaceFill'],
  text: ['addText', 'addLabel', 'addNumber', 'sectionKicker', 'footerText', 'publicSlideNote', 'copyFallback', 'copyPolicyList', 'typeSize', 'profileFont', 'itemTitle', 'itemBody', 'itemBodyNoEllipsis'],
  shapes: ['addRect', 'addHairline', 'addArrowLine', 'addArrowBetweenRects', 'addClockwiseLoopConnectors', 'PageNumber', 'lightCanvas', 'stageCanvas', 'addPhotoPanel', 'addSmartPhotoPanel', 'addDarkBreathingCircle', 'addLightBreathingCircle', 'addPulseCurve'],
  components: ['componentRendererContext', 'renderChartSpec', 'recordChartConsumption'],
  assets: ['fileExists', 'designForSlide', 'galleryImages', 'mediaForRole', 'resolveAssetPath', 'smartPhotoFit'],
  variants: ['variantOf'],
  business: [
    'PageNumber',
    'addVisualPhotoPanel',
    'canvasHeight',
    'canvasWidth',
    'copyFallback',
    'footerText',
    'itemBody',
    'itemTitle',
    'panelFill',
    'profileFont',
    'publicSlideNote',
    'reportBoardNeedsRightOverlayRail',
    'sectionKicker'
  ],
  chapter: [
    'PageNumber',
    'addArrowLine',
    'addDarkBreathingCircle',
    'addHairline',
    'addLabel',
    'addNumber',
    'addPhotoPanel',
    'addRect',
    'addText',
    'canvasWidth',
    'footerText',
    'galleryImages',
    'itemBody',
    'itemTitle',
    'lightCanvas',
    'panelFill',
    'profileFont',
    'publicSlideNote',
    'sectionKicker',
    'stageCanvas',
    'variantOf'
  ],
  financial: [
    'brandWorldBusinessProof',
    'chartSpecToComponentId',
    'compactEvidenceCaption',
    'consumerProofPhotoGrid',
    'formatMetricDelta',
    'productEvidenceStory',
    'publicSlideNote',
    'recordChartConsumption',
    'renderChartSpec',
    'routeChartSpec',
    'sustainabilityProofSpread'
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
  timeline: [
    'addClockwiseLoopConnectors',
    'compactEvidenceCaption'
  ],
  risk: [
    'addClockwiseLoopConnectors',
    'compactEvidenceCaption'
  ],
  evidenceGallery: [
    'addEvidenceCaptionStack',
    'chooseEvidenceImageLayout',
    'brandWorldBusinessProof',
    'compactEvidenceCaption',
    'fileExists',
    'galleryImages',
    'genericShowcaseField',
    'resolveAssetPath'
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
