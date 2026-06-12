const {
  createDeckMetaPolicy
} = require('./deck-meta-policy');
const {
  coverStyleDecision
} = require('../../design/cover-style');

function createThemeMetaHelpers(deps = {}) {
  const fs = deps.fs || require('fs');
  const MEDIA_ASSETS = deps.MEDIA_ASSETS || {};
  const FONT_STACK = deps.FONT_STACK || {};
  const W = typeof deps.canvasWidth === 'function' ? deps.canvasWidth() : 13.333;
  const H = typeof deps.canvasHeight === 'function' ? deps.canvasHeight() : 7.5;
  const design = () => (typeof deps.design === 'function' ? deps.design() : (deps.design || {}));
  const profile = () => (typeof deps.profile === 'function' ? deps.profile() : (deps.profile || {}));
  const colors = () => (typeof deps.colors === 'function' ? deps.colors() : (deps.colors || {}));
  const renderState = () => (typeof deps.renderState === 'function' ? deps.renderState() : {});
  const textHelpers = () => (typeof deps.textHelpers === 'function' ? deps.textHelpers() : {});
  const addText = (...args) => {
    const helper = textHelpers().addText;
    if (typeof helper !== 'function') throw new Error('chrome helpers require textHelpers.addText before drawing text');
    return helper(...args);
  };
  const C = new Proxy({}, { get: (_target, prop) => colors()[prop] });
  const PROFILE = new Proxy({}, { get: (_target, prop) => profile()[prop] });
  const DESIGN = new Proxy({}, { get: (_target, prop) => design()[prop] });
  const zone = deps.zone || ((id, x, y, w, h, role = 'native') => ({ id, x, y, w, h, role }));
  const zoneBounds = deps.zoneBounds || (bbox => bbox || {});

  function activePlan(plan) {
    return plan || renderState().plan || {};
  }
  function activeSlide(s) {
    return s || renderState().slide || {};
  }
  function activeIndex(idx) {
    return idx || renderState().idx || 0;
  }
  function paletteSpec() {
    return (DESIGN.palettes && DESIGN.palettes[PROFILE.palette]) || {};
  }
  function presentationSpec() {
    const base = paletteSpec().presentation || {};
    const style = coverStyleDecision(activePlan(), activeSlide(), { visualSystem:DESIGN.visualSystem || {} });
    if (!style.preset) return base;
    return Object.assign({}, base, {
      coverTone: style.preset.coverTone || base.coverTone,
      coverMotif: style.preset.coverMotif || base.coverMotif,
      coverTitleBreak: style.preset.titleBreak || base.coverTitleBreak,
      backgroundPolicy: style.preset.backgroundPolicy || base.backgroundPolicy,
      contentDensity: style.preset.contentDensity || base.contentDensity,
      imageTreatment: style.preset.imageTreatment || base.imageTreatment
    });
  }
  function surfaceFill() {
    return presentationSpec().surfaceFill || C.paper;
  }
  function panelFill() {
    return presentationSpec().panelFill || C.white;
  }
  function typeToken(name, fallback = {}) {
    return Object.assign({}, fallback, deps.resolveTypeToken(activePlan(), name, { token:fallback }));
  }
  function typeSize(name, fallback) {
    return typeToken(name, { size:fallback }).size || fallback;
  }
  function profileFont(kind) {
    const fonts = DESIGN.typographyFonts || {};
    if (kind === 'latin') return PROFILE.latinFont || fonts.latin || FONT_STACK.latin || PROFILE.font;
    if (kind === 'number') return PROFILE.numberFont || fonts.number || FONT_STACK.number || PROFILE.font;
    if (kind === 'editorial') return fonts.editorial || fonts.cjk || PROFILE.font || FONT_STACK.zh;
    return PROFILE.font || fonts.cjk || FONT_STACK.zh;
  }
  function compactText(text = '') {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    return deps.stripEllipsisText(value);
  }
  function addLabel(slide, text, opts = {}) {
    const labelText = deps.localizeMicrocopy(activePlan(), text, opts);
    const localizedCjk = deps.containsCjk(labelText) && labelText !== text;
    const token = typeToken('kicker', { size:7.0, tracking:1.0 });
    const next = Object.assign({
      typeRole:'kicker',
      fontFace:localizedCjk ? profileFont('cjk') : profileFont('latin'),
      fontSize:token.size,
      color:C.muted,
      charSpace:token.tracking
    }, opts);
    if (localizedCjk && opts.preserveCharSpace !== true) {
      next.fontFace = profileFont('cjk');
      next.charSpace = 0;
    }
    if (!next.allowTiny) {
      next.fontSize = Math.max(Number(next.fontSize || token.size), 6.9);
      if (Number(next.h || 0) < 0.12) next.h = 0.12;
    }
    addText(slide, labelText, next);
  }
  function addNumber(slide, text, opts = {}) {
    const helper = textHelpers();
    const isFolio = helper.isPageFolioText && helper.isPageFolioText(text, opts);
    const next = isFolio && helper.normalizePageFolioTextOptions ? helper.normalizePageFolioTextOptions(opts) : opts;
    addText(slide, text, Object.assign({
      typeRole:'number',
      fontFace:profileFont('number'),
      fontSize:typeSize('number', 12),
      bold:true,
      color:C.accent
    }, next));
  }
  const {
    addDeckMeta,
    coverMetaText,
    footerText,
    isCompanyIntroPlan,
    metaDisabled
  } = createDeckMetaPolicy({ addText });
  function premiumTitle(title, opts = {}) {
    const t = String(title || '').trim();
    if (opts.mode === 'none') return t.replace(/\s*\n\s*/g, ' ');
    const threshold = opts.threshold || 20;
    if (t.length > threshold && !t.includes('\n')) {
      const cut = Math.min(Math.max(8, Math.round(t.length * 0.58)), t.length - 4);
      return `${t.slice(0, cut)}\n${t.slice(cut)}`;
    }
    return t;
  }
  function compositionFor(s) {
    const slide = activeSlide(s);
    return slide.compositionPlan || {};
  }
  function compositionHas(s, key) {
    const cp = compositionFor(s);
    return (Array.isArray(cp.microComponents) && cp.microComponents.includes(key)) ||
      (Array.isArray(cp.primaryColorUse) && cp.primaryColorUse.includes(key));
  }
  function darkSurfaceForTone(tone = '') {
    return /dark|stage/i.test(String(tone || ''));
  }
  function slideUsesDarkSurface(s = {}) {
    const type = String((s && s.type) || '');
    const variant = String((s && (s.layoutVariant || s.variant)) || '');
    return /dark/i.test(type) ||
      type === 'toc' ||
      type === 'toc-clean' ||
      (type === 'timeline' && variant === 'closed-loop') ||
      darkSurfaceForTone(compositionFor(s).backgroundTone);
  }
  function hexLuminance(hex = '') {
    const value = String(hex || '').replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return null;
    const [r, g, b] = [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function slideRenderedDark(slide, s = {}) {
    const bg = slide && slide.background && slide.background.color;
    const lum = hexLuminance(bg);
    if (lum != null) return lum < 0.30;
    return slideUsesDarkSurface(s);
  }
  function industryProfile(plan = {}) {
    const profiles = (DESIGN.visualSystem && DESIGN.visualSystem.industryProfiles) || {};
    const visualId = deps.visualIndustryId(plan.industry);
    const raw = profiles[plan.industry] || profiles[visualId] || profiles['general-operations'] || {};
    return Object.assign({
      label:'DIGITAL OPERATIONS',
      insight:deps.copyPolicyText(plan, 'industryInsight'),
      coreTitle:deps.copyPolicyText(plan, 'industryCoreTitle'),
      coreBody:deps.copyPolicyText(plan, 'industryCoreBody'),
      coverField:'generic'
    }, raw);
  }
  function isVisualIndustry(plan = {}, id = '') {
    return plan.industry === id || deps.visualIndustryId(plan.industry) === id;
  }
  function copyFallback(plan = {}, key = '', fallback = '') {
    return deps.copyPolicyText(plan, key, fallback);
  }
  return {
    C,
    DESIGN,
    FONT_STACK,
    H,
    MEDIA_ASSETS,
    PROFILE,
    W,
    activeIndex,
    activePlan,
    activeSlide,
    addDeckMeta,
    addLabel,
    addNumber,
    addText,
    colors,
    compactText,
    compositionFor,
    compositionHas,
    copyFallback,
    coverMetaText,
    deps,
    design,
    footerText,
    fs,
    industryProfile,
    isCompanyIntroPlan,
    isVisualIndustry,
    metaDisabled,
    panelFill,
    premiumTitle,
    presentationSpec,
    profile,
    profileFont,
    slideRenderedDark,
    slideUsesDarkSurface,
    surfaceFill,
    textHelpers,
    typeSize,
    typeToken,
    zone,
    zoneBounds
  };
}

module.exports = {
  createThemeMetaHelpers
};
