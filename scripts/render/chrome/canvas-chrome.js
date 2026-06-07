const {
  createCanvasMotifHelpers
} = require('./canvas-motifs');

function createCanvasChromeHelpers(core = {}, helpers = {}) {
  const { C, H, W, activeIndex, activePlan, activeSlide, compositionFor, compositionHas, deps } = core;
  const h = helpers;

  function PageNumber(slide, idx, opts = {}) {
    const helper = core.textHelpers();
    if (helper.pageFolioRendered && helper.pageFolioRendered(slide) && opts.force !== true) return false;
    const dark = opts.dark == null ? h.slideUsesDarkSurface(activeSlide()) : Boolean(opts.dark);
    const textOpts = Object.assign({}, opts);
    delete textOpts.mask;
    delete textOpts.dark;
    delete textOpts.force;
    const base = Object.assign({
      x:11.74, y:0.74, w:0.52, h:0.22, fontSize:h.typeSize('number', 11.8), color:C.accent, align:'right'
    }, textOpts);
    if (opts.mask) {
      const fill = dark ? C.ink : h.panelFill();
      h.addRect(slide, base.x - 0.08, base.y - 0.035, 0.78, 0.28, fill, fill, {
        fill:{ color:fill, transparency:0 },
        line:{ color:fill, transparency:100 }
      });
    }
    h.addText(slide, String(idx || activeIndex() || '').padStart(2, '0'), Object.assign({}, base, {
      fontFace:h.profileFont('number'),
      bold:true,
      _folioInternal:true,
      marker:opts.marker,
      markerColor:opts.markerColor
    }));
    return true;
  }
  const {
    TintedBackground,
    addCanvasMotif
  } = createCanvasMotifHelpers(core, h);
  function MetricStrip(slide, metrics = [], x = 0.86, y = 5.90, w = 10.60, opts = {}) {
    return deps.renderKpiStrip(componentRendererContext(slide), metrics, Object.assign({}, opts, { x, y, w }));
  }
  function ProcessRail(slide, points = [], x = 0.92, y = 3.0, w = 10.2, opts = {}) {
    const list = (points || []).slice(0, opts.max || 5);
    const step = w / Math.max(1, list.length - 1);
    h.addHairline(slide, x, y, step * Math.max(0, list.length - 1), opts.line || C.line, opts.lineTransparency || 18, opts.width || 0.56);
    list.forEach((point, i) => {
      const cx = x + i * step;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.muted);
      slide.addShape('ellipse', { x:cx - 0.06, y:y - 0.06, w:0.12, h:0.12, fill:{ color:accent }, line:{ color:accent, transparency:100 } });
      h.addText(slide, deps.itemTitle(point, `步骤 ${i + 1}`), { x:cx - 0.52, y:y + 0.30, w:1.04, h:0.13, fontSize:7.5, bold:true, color:opts.dark ? (C.captionOnImage || 'CBD5E1') : C.text, fit:'shrink', align:'center' });
    });
  }
  function IndustryTag(slide, text, x = 0.86, y = 0.72, opts = {}) {
    h.addLabel(slide, text || h.industryProfile(activePlan()).label || 'INDUSTRY', {
      x, y, w:opts.w || 2.4, h:0.15, fontSize:opts.fontSize || 7.1,
      color:opts.dark ? C.cyan : C.accent,
      charSpace:opts.charSpace == null ? 1.0 : opts.charSpace
    });
  }
  function FooterNote(slide, text, x = 0.82, y = 7.05, opts = {}) {
    h.addText(slide, text || h.footerText(activePlan()), {
      x, y, w:opts.w || 7.8, h:opts.h || 0.18,
      fontSize:opts.fontSize || 8.8,
      lockFontSize:true,
      color:opts.color || (opts.dark ? (C.darkMuted || '94A3B8') : C.muted),
      fit:'shrink'
    });
  }
  function DeckFooter(slide, text, x = 0.82, y = 7.05, opts = {}) {
    return FooterNote(slide, text, x, y, opts);
  }
  function SourceNote(slide, text, x = 0.82, y = 7.05, opts = {}) {
    if (!text) return false;
    h.addText(slide, text, {
      x, y, w:opts.w || 7.8, h:opts.h || 0.18,
      fontSize:opts.fontSize || 8.8,
      lockFontSize:true,
      color:opts.color || (opts.dark ? (C.darkMuted || '94A3B8') : C.muted),
      fit:'shrink'
    });
    return true;
  }
  function componentRendererContext(slide) {
    return {
      slide,
      colors: core.colors(),
      addRect:h.addRect,
      addText:h.addText,
      addLabel:h.addLabel,
      addNumber:h.addNumber,
      addArrowLine:h.addArrowLine,
      addHairline:h.addHairline,
      addSmartPhotoPanel:h.addSmartPhotoPanel,
      panelFill:h.panelFill,
      compactText:h.compactText
    };
  }
  function ContactBlock(slide, contacts = [], x = 0.90, y = 4.46, opts = {}) {
    const list = (Array.isArray(contacts) ? contacts : String(contacts || '').split(/[｜|/]/)).filter(Boolean).slice(0, opts.max || 4);
    if (!list.length) return false;
    IndustryTag(slide, opts.label || '联系方式', x, y, { dark:opts.dark, charSpace:0, fontSize:6.4, w:1.10 });
    list.forEach((v, i) => {
      const cy = y + 0.42 + i * 0.36;
      slide.addShape('ellipse', { x, y:cy + 0.04, w:0.075, h:0.075, fill:{ color:i === 0 ? C.accent : C.cyan }, line:{ color:i === 0 ? C.accent : C.cyan, transparency:100 } });
      h.addText(slide, String(v), { x:x + 0.24, y:cy, w:opts.w || 4.92, h:0.13, fontSize:8.5, color:opts.dark ? (C.captionOnImage || 'CBD5E1') : C.body, fit:'shrink' });
    });
    return true;
  }
  function addEvidenceCaptionStack(slide, item, fallbackTitle, box, opts = {}) {
    const accent = opts.accent || C.accent;
    const hasNumber = opts.number != null && opts.number !== false;
    const numberW = hasNumber ? 0.34 : 0;
    const gap = hasNumber ? 0.14 : 0;
    if (hasNumber) {
      h.addNumber(slide, String(opts.number).padStart(2, '0'), {
        x:box.x,
        y:box.y + (opts.numberY || 0.08),
        w:0.30,
        h:0.10,
        fontSize:opts.numberSize || 6.6,
        color:accent
      });
    }
    const textX = box.x + numberW + gap;
    const textW = Math.max(1.15, box.w - numberW - gap);
    h.addText(slide, deps.itemTitle(item, fallbackTitle), {
      x:textX,
      y:box.y + (opts.titleY || 0.02),
      w:textW,
      h:opts.titleH || 0.15,
      fontSize:opts.titleSize || 9.2,
      bold:true,
      color:opts.titleColor || C.text,
      fit:'shrink'
    });
    const rawBody = String(deps.itemBody(item) || '').replace(/\s+/g, ' ').trim();
    const body = opts.dropLongBody && rawBody.length > (opts.maxBodyChars || 30)
      ? ''
      : deps.compactEvidenceCaption(rawBody, opts.maxBodyChars || 30);
    if (body) {
      h.addText(slide, body, {
        x:textX,
        y:box.y + (opts.bodyY || 0.36),
        w:textW,
        h:opts.bodyH || 0.22,
        fontSize:opts.bodySize || 8.0,
        color:opts.bodyColor || C.body,
        fit:'shrink',
        breakLine:true
      });
    }
  }
  function addEnergyLens(slide, x = 7.90, y = 0.72, size = 4.56, accent = C.accent, opts = {}) {
    slide.addShape('ellipse', { x, y, w:size, h:size, fill:{ color:accent, transparency:98 }, line:{ color:accent, transparency:86, width:0.42 } });
    slide.addShape('ellipse', { x:x + size * 0.20, y:y + size * 0.20, w:size * 0.60, h:size * 0.60, fill:{ color:C.ink, transparency:100 }, line:{ color:C.cyan, transparency:91, width:0.34 } });
    slide.addShape('ellipse', { x:x + size * 0.37, y:y + size * 0.37, w:size * 0.26, h:size * 0.26, fill:{ color:C.ink2, transparency:42 }, line:{ color:'334155', transparency:72, width:0.32 } });
    if (opts.showCurve) h.addPulseCurve(slide, x + size * 0.18, y + size * 0.57, size * 0.62, size * 0.18, accent, true, { transparency:42, width:0.54, nodes:false });
    h.addLabel(slide, 'LOAD', { x:x + size * 0.16, y:y + size * 0.78, w:0.62, h:0.11, fontSize:6.8, color:'64748B', charSpace:0.45 });
    h.addLabel(slide, 'SOC', { x:x + size * 0.72, y:y + size * 0.30, w:0.52, h:0.11, fontSize:6.8, color:'64748B', charSpace:0.45, align:'right' });
    h.addLabel(slide, 'DISPATCH', { x:x + size * 0.41, y:y + size * 0.47, w:0.96, h:0.11, fontSize:6.8, color:'7C8BA3', charSpace:0.4, align:'center' });
  }
  function finalizeSlideChrome(slide, plan, s, idx) {
    PageNumber(slide, idx, { mask:false, dark:h.slideRenderedDark(slide, s) });
  }
  function addBrandFolio(slide, plan, s, idx, dark = false) {
    const cp = compositionFor(s);
    const color = dark ? (C.darkMuted || '94A3B8') : C.muted;
    if (cp.rhythmRole && !['opener', 'closer'].includes(cp.rhythmRole)) {
      const label = String(cp.rhythmRole).replace(/-/g, ' ').toUpperCase();
      if (/^(PROOF|EVIDENCE)$/.test(label)) return;
      h.addLabel(slide, label, { x:0.82, y:0.42, w:1.82, h:0.10, fontSize:5.2, color, charSpace:0.72 });
    }
  }
  function addLightThemeMotifs(slide, plan, s, idx) {
    if (compositionHas(s, 'accent-rail')) {
      h.addRect(slide, 0.82, 6.76, 2.36, 0.035, C.accent, C.accent, { line:{ color:C.accent, transparency:100 } });
      h.addRect(slide, 3.34, 6.76, 0.54, 0.035, C.cyan, C.cyan, { fill:{ color:C.cyan, transparency:32 }, line:{ color:C.cyan, transparency:100 } });
    }
    addBrandFolio(slide, plan, s, idx, false);
  }
  function addDarkThemeMotifs(slide, plan, s, idx) {
    addBrandFolio(slide, plan, s, idx, true);
  }
  function stageCanvas(slide, opts = {}) {
    TintedBackground(slide, { tone:'dark' });
    addCanvasMotif(slide, activePlan(), activeSlide(), 'dark', opts);
    addDarkThemeMotifs(slide, activePlan(), activeSlide(), activeIndex());
  }
  function lightCanvas(slide, opts = {}) {
    TintedBackground(slide, { header:true });
    addCanvasMotif(slide, activePlan(), activeSlide(), 'light', opts);
    addLightThemeMotifs(slide, activePlan(), activeSlide(), activeIndex());
  }
  function glassPanel(slide, x, y, w, hgt, dark = true) {
    const fill = dark ? C.ink2 : h.panelFill();
    const line = dark ? '334155' : C.line;
    h.addRect(slide, x, y, w, hgt, fill, line, { fill:{ color:fill, transparency:dark ? 24 : 0 }, line:{ color:line, transparency:dark ? 58 : 8, width:0.55 } });
  }
  function sectionKicker(slide, text, x, y, dark = true) {
    h.addLabel(slide, text, { x, y, w:2.4, h:0.15, fontSize:7.3, color:dark ? C.cyan : C.accent, charSpace:1.1 });
  }
  function masterDark(slide, plan, title, idx, subtitle = '', opts = {}) {
    stageCanvas(slide, opts);
    if (title) h.addText(slide, title, { x:0.78, y:0.74, w:8.8, h:0.42, fontSize:h.typeSize('pageTitle', 23), bold:true, color:C.white });
    if (subtitle) h.addText(slide, subtitle, { x:0.80, y:1.22, w:8.8, h:0.28, fontSize:13.5, color:'CBD5E1' });
    if (idx) h.addText(slide, String(idx).padStart(2, '0'), { x:11.75, y:0.76, w:0.7, h:0.24, fontSize:13, bold:true, color:'CBD5E1', align:'right' });
    FooterNote(slide, h.footerText(plan), 0.78, 7.05, { w:7.5, h:0.16, fontSize:h.typeSize('caption', 8.5), color:'94A3B8' });
  }
  function masterLight(slide, plan, title, idx, subtitle = '') {
    lightCanvas(slide);
    h.addHairline(slide, 0.82, 1.42, 10.95, C.line, 20, 0.55);
    h.addText(slide, title || '', { x:0.82, y:0.66, w:8.95, h:0.38, fontSize:h.typeSize('pageTitle', 22.5), bold:true, color:C.text });
    if (subtitle) h.addText(slide, subtitle, { x:0.84, y:1.08, w:8.8, h:0.22, fontSize:10.8, color:C.muted });
    PageNumber(slide, idx);
    FooterNote(slide, h.footerText(plan));
  }

  return {
    ContactBlock,
    DeckFooter,
    FooterNote,
    MetricStrip,
    PageNumber,
    ProcessRail,
    SourceNote,
    addCanvasMotif,
    addEnergyLens,
    addEvidenceCaptionStack,
    componentRendererContext,
    finalizeSlideChrome,
    glassPanel,
    lightCanvas,
    masterDark,
    masterLight,
    sectionKicker,
    stageCanvas
  };
}

module.exports = {
  createCanvasChromeHelpers
};
