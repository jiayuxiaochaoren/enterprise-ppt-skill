function containsCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}

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

  function textOptionWithReadabilityFloor(text, opts = {}) {
    const next = typeof normalizeTypographyOptions === 'function'
      ? normalizeTypographyOptions(currentPlan(), text, opts)
      : Object.assign({}, opts);
    if (isPageFolioText(text, next)) return normalizePageFolioTextOptions(next);
    if (next.allowTiny || typeof next.fontSize !== 'number' || !containsCjk(text)) return next;
    const isFooter = Number(next.y || 0) >= 6.62;
    const isMicroSlot = Number(next.w || 0) < 0.72 || Number(next.h || 0) < 0.11;
    if (isMicroSlot && !containsCjk(text)) return next;
    const cjkChars = (String(text || '').match(/[\u3400-\u9fff]/g) || []).length;
    if (!next.allowNarrowCjk && cjkChars >= 12 && Number(next.w || 0) > 0 && Number(next.w || 0) < 1.42) {
      const maxWidth = Math.max(Number(next.w || 0), currentCanvasWidth() - Number(next.x || 0) - 0.36);
      next.w = Math.min(maxWidth, Math.max(1.56, Math.min(2.56, cjkChars * 0.12)));
      if (Number(next.h || 0) > 0 && Number(next.h || 0) < 0.22) next.h = 0.22;
      next.breakLine = true;
    }
    const qa = (currentVisualSystem().visualQA || {});
    const bodyFloor = Number(qa.preferredBodyMin || 8.8);
    const captionFloor = Number(qa.preferredCaptionMin || 7.2);
    const titleFloor = next.bold ? 9.6 : bodyFloor;
    const floor = isFooter ? captionFloor : Math.max(bodyFloor, titleFloor);
    if (next.fontSize < floor) {
      next.fontSize = floor;
      if (!isFooter && Number(next.h || 0) > 0 && Number(next.h || 0) < 0.18) next.h = 0.18;
    }
    return next;
  }

  function isPageFolioText(text, opts = {}) {
    const value = String(text || '').trim();
    const fontSize = Number(opts.fontSize || safeTypeSize('number', 12.0));
    return /^[0-9]{1,2}$/.test(value) &&
      Number(opts.x || 0) >= 11.45 &&
      Number(opts.y || 0) <= 1.18 &&
      fontSize <= 14.2 &&
      (opts.align === 'right' || opts.align == null);
  }

  function normalizePageFolioTextOptions(opts = {}) {
    const next = Object.assign({}, opts);
    next.x = 11.74;
    next.y = 0.74;
    next.w = 0.52;
    next.h = 0.22;
    next.fontSize = Math.min(Number(next.fontSize || safeTypeSize('number', 12.0)), 11.8);
    next.align = 'right';
    return next;
  }

  function pageFolioRendered(slide) {
    return Boolean(slide && slide.__codexPageFolioRendered);
  }

  function markPageFolioRendered(slide) {
    if (slide) slide.__codexPageFolioRendered = true;
  }

  function addPageFolioMarker(slide, opts = {}) {
    if (opts.marker !== true) return;
    const C = currentColors();
    const markerColor = opts.markerColor || C.cyan;
    addRect(slide, opts.x - 0.18, opts.y + 0.02, 0.026, 0.13, markerColor, markerColor, {
      fill: { color: markerColor, transparency: 0 },
      line: { color: markerColor, transparency: 100 }
    });
  }

  function recordTextBoxMeta(slide, rawText, displayText, inputOpts = {}, textOpts = {}, role = '') {
    if (!slide || !String(displayText || rawText || '').trim()) return;
    const text = String(displayText || rawText || '');
    const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const w = Number(textOpts.w || inputOpts.w || 0);
    const h = Number(textOpts.h || inputOpts.h || 0);
    const fontSize = Number(textOpts.fontSize || inputOpts.fontSize || 0);
    const fitStrategy = textOpts.__finalFitStrategy || (textOpts.fit === false || textOpts.noFit === true
      ? 'none'
      : (textOpts.fit || inputOpts.fit || ''));
    slide.__codexTextBoxes = slide.__codexTextBoxes || [];
    slide.__codexTextBoxes.push({
      role: role || textOpts.__typeRole || inputOpts.typeRole || inputOpts.textRole || '',
      originalFontSize: Number(inputOpts.fontSize || fontSize || 0),
      fontSize,
      fitStrategy: fitStrategy ? String(fitStrategy) : '',
      textLength: text.length,
      cjkChars,
      box: {
        x: Number(textOpts.x || inputOpts.x || 0),
        y: Number(textOpts.y || inputOpts.y || 0),
        w,
        h
      },
      charsPerInch: w > 0 ? Number((cjkChars / w).toFixed(2)) : 0,
      areaDensity: w > 0 && h > 0 ? Number((text.length / (w * h)).toFixed(2)) : 0,
      sample: typeof compactText === 'function' ? compactText(text, 64) : text.slice(0, 64)
    });
  }

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
