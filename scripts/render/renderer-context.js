const RENDERER_CONTEXT_CONTRACT = {
  colors: ['colors', 'presentationSpec', 'panelFill'],
  text: ['addText', 'addLabel', 'addNumber', 'sectionKicker', 'footerText', 'publicSlideNote', 'copyFallback', 'typeSize', 'profileFont'],
  shapes: ['addRect', 'addHairline', 'PageNumber', 'lightCanvas', 'stageCanvas'],
  components: ['componentRendererContext', 'renderChartSpec', 'recordChartConsumption'],
  assets: ['fileExists', 'designForSlide'],
  variants: ['variantOf'],
  closing: ['closingActions', 'closingMeta']
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
