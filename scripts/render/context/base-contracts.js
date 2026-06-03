const BASE_RENDERER_CONTEXT_CONTRACT = {
  colors: ['colors', 'presentationSpec', 'panelFill', 'surfaceFill'],
  text: ['addText', 'addLabel', 'addNumber', 'sectionKicker', 'footerText', 'publicSlideNote', 'copyFallback', 'copyPolicyList', 'typeSize', 'profileFont', 'itemTitle', 'itemBody', 'itemBodyNoEllipsis'],
  shapes: ['addRect', 'addHairline', 'addArrowLine', 'addArrowBetweenRects', 'addClockwiseLoopConnectors', 'PageNumber', 'lightCanvas', 'stageCanvas', 'addPhotoPanel', 'addSmartPhotoPanel', 'addDarkBreathingCircle', 'addLightBreathingCircle', 'addPulseCurve'],
  components: ['componentRendererContext', 'renderChartSpec', 'recordChartConsumption'],
  assets: ['fileExists', 'designForSlide', 'galleryImages', 'mediaForRole', 'resolveAssetPath', 'smartPhotoFit'],
  variants: ['variantOf']
};

module.exports = {
  BASE_RENDERER_CONTEXT_CONTRACT
};
