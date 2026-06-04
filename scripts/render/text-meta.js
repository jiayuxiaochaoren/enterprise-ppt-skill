const {
  createPageFolioPolicy
} = require('./page-folio-policy');
const {
  createTextBoxMetaRecorder
} = require('./text-box-meta');
const {
  containsCjk,
  createTextReadabilityPolicy
} = require('./text-readability-policy');

function createTextRenderHelpers(deps = {}) {
  const {
    activePlan,
    addRect,
    canvasWidth,
    colors,
    compactText,
    localizeMicrocopy,
    normalizeTypographyOptions,
    profile,
    typeSize,
    visualSystem
  } = deps;

  const currentPlan = () => (typeof activePlan === 'function' ? activePlan() : {});
  const currentColors = () => (typeof colors === 'function' ? colors() : (colors || {}));
  const currentProfile = () => (typeof profile === 'function' ? profile() : (profile || {}));
  const currentVisualSystem = () => (typeof visualSystem === 'function' ? visualSystem() : (visualSystem || {}));
  const currentCanvasWidth = () => Number(typeof canvasWidth === 'function' ? canvasWidth() : canvasWidth) || 13.333;
  const safeTypeSize = (name, fallback) => typeof typeSize === 'function' ? typeSize(name, fallback) : fallback;
  const folioPolicy = createPageFolioPolicy({ addRect, currentColors, safeTypeSize });
  const {
    addPageFolioMarker,
    isPageFolioText,
    markPageFolioRendered,
    normalizePageFolioTextOptions,
    pageFolioRendered
  } = folioPolicy;
  const {
    textOptionWithReadabilityFloor
  } = createTextReadabilityPolicy({
    currentCanvasWidth,
    currentPlan,
    currentVisualSystem,
    folioPolicy,
    normalizeTypographyOptions
  });
  const {
    recordTextBoxMeta
  } = createTextBoxMetaRecorder({ compactText, currentVisualSystem });

  function addText(slide, t, opts = {}) {
    const rawText = String(t == null ? '' : t);
    const microcopyLike = !containsCjk(rawText) && (
      opts.typeRole === 'kicker' ||
      opts.textRole === 'kicker' ||
      opts.__typeRole === 'kicker' ||
      opts.typeRole === 'microLabel' ||
      opts.textRole === 'microLabel' ||
      Number(opts.charSpace || 0) >= 0.55 ||
      /^[A-Z0-9\s./:%+&·→-]+$/.test(rawText.trim())
    );
    const displayText = microcopyLike && typeof localizeMicrocopy === 'function'
      ? localizeMicrocopy(currentPlan(), rawText, opts)
      : t;
    const PROFILE = currentProfile();
    const C = currentColors();
    let textOpts = Object.assign(
      { fontFace: PROFILE.font, color: C.body, margin: 0, breakLine: false, fit: 'shrink' },
      textOptionWithReadabilityFloor(displayText, opts)
    );
    const resolvedTypeRole = textOpts.__typeRole || textOpts.typeRole || textOpts.textRole || '';
    if (
      currentPlan().industry === 'energy-utility' &&
      containsCjk(displayText) &&
      textOpts.fit === 'shrink' &&
      !textOpts.allowTiny &&
      !['microLabel', 'pageFolio', 'sourceNote'].includes(resolvedTypeRole)
    ) {
      textOpts.fit = false;
    }
    const folio = isPageFolioText(displayText, textOpts);
    const internalFolio = textOpts._folioInternal === true;
    if (folio) {
      if (pageFolioRendered(slide) && !internalFolio) return false;
      textOpts = normalizePageFolioTextOptions(textOpts);
      if (!pageFolioRendered(slide)) addPageFolioMarker(slide, textOpts);
      markPageFolioRendered(slide);
    }
    textOpts.__finalFitStrategy = textOpts.fit === false || textOpts.noFit === true
      ? 'none'
      : (textOpts.fit || '');
    if (textOpts.fit === false || textOpts.noFit === true) {
      delete textOpts.fit;
    }
    recordTextBoxMeta(slide, rawText, displayText, opts, textOpts, resolvedTypeRole);
    delete textOpts.noFit;
    delete textOpts.__finalFitStrategy;
    delete textOpts._folioInternal;
    delete textOpts.marker;
    delete textOpts.markerColor;
    delete textOpts.__typeRole;
    delete textOpts.allowTiny;
    delete textOpts.allowNarrowCjk;
    slide.addText(displayText || '', textOpts);
    return true;
  }

  return {
    addPageFolioMarker,
    addText,
    isPageFolioText,
    markPageFolioRendered,
    normalizePageFolioTextOptions,
    pageFolioRendered,
    recordTextBoxMeta,
    textOptionWithReadabilityFloor
  };
}

module.exports = {
  containsCjk,
  createTextRenderHelpers
};
