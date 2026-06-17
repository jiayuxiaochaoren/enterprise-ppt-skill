#!/usr/bin/env node
const assert = require('assert/strict');
const { createChromeHelpers } = require('./render/chrome-helpers');

function buildFixture(plan, slideState) {
  const shapes = [];
  const texts = [];
  const slide = {
    addShape(type, opts) {
      shapes.push({ type, opts });
    },
    addImage() {}
  };
  let textHelpers;
  const helpers = createChromeHelpers({
    FONT_STACK: { zh:'Fixture CJK', latin:'Fixture Latin', number:'Fixture Number' },
    MEDIA_ASSETS: {},
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent:'0066FF',
      body:'222222',
      captionOnImage:'FFFFFF',
      cyan:'00FFFF',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'EFF6FF',
      paper:'F8FAFC',
      softBlue:'EFF6FF',
      text:'111111',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    compactEvidenceCaption: text => text,
    containsCjk: text => /[\u4e00-\u9fff]/.test(text),
    copyPolicyText: (_deckPlan, key, fallback = '') => fallback || key,
    design: () => ({ palettes:{ fixture:{ presentation:{ panelFill:'FFFFFF', surfaceFill:'F8FAFC' } } }, slideDesign: () => ({ wantsImage:false }) }),
    imageDimensions: () => ({ w:1200, h:800 }),
    itemBody: item => (item && item.body) || '',
    itemTitle: (item, fallback = '') => (item && item.title) || fallback,
    localizeMicrocopy: (_deckPlan, text) => text,
    mediaForRole: () => '',
    normalizeTypographyOptions: (_deckPlan, _text, opts) => opts,
    profile: () => ({ font:'Fixture CJK', palette:'fixture' }),
    renderKpiStrip: () => ({ rendered:true }),
    renderState: () => ({ plan, slide:slideState, idx:2 }),
    resolveAssetPath: value => value,
    resolveTypeToken: (_deckPlan, _name, opts) => opts.token || {},
    slideSemanticText: currentSlide => currentSlide.title || '',
    slideWantsImage: () => false,
    stripEllipsisText: text => text,
    textHelpers: () => textHelpers,
    visualIndustryId: id => id,
    visualRole: () => 'proof',
    zone: (id, x, y, w, h, role) => ({ id, x, y, w, h, role }),
    zoneBounds: bbox => bbox
  });
  textHelpers = {
    addText(target, text, opts) {
      texts.push({ target, text, opts });
      target.__codexTextBoxes = target.__codexTextBoxes || [];
      target.__codexTextBoxes.push({ text:String(text), x:opts.x, y:opts.y });
      return true;
    },
    isPageFolioText: text => /^\d+$/.test(String(text)),
    normalizePageFolioTextOptions: opts => Object.assign({ normalized:true }, opts),
    pageFolioRendered: () => false
  };
  return { helpers, slide, shapes, texts };
}

const manufacturing = buildFixture(
  { industry:'manufacturing-operations', textureBackgroundPolicy:'industrial-structure-light' },
  { title:'制造业正文页', compositionPlan:{ primaryColorUse:['accent-rail'] } }
);
manufacturing.helpers.lightCanvas(manufacturing.slide);

assert.equal(
  manufacturing.shapes.filter(shape => shape.type === 'ellipse').length,
  0,
  'industrial light texture should avoid decorative circles'
);
assert.equal(
  manufacturing.shapes.filter(shape => shape.type === 'rect' && shape.opts.y === 6.76 && shape.opts.h === 0.035).length,
  0,
  'industrial light texture should not render footer accent rails'
);
assert.ok(
  manufacturing.shapes.some(shape => shape.type === 'rect'
    && shape.opts.x === 8.56
    && shape.opts.y === 0.52
    && shape.opts.w === 3.92
    && shape.opts.h === 2.92),
  'industrial light texture should render a structural blueprint frame'
);
assert.equal(
  manufacturing.shapes.filter(shape => shape.type === 'rect'
    && shape.opts.h <= 0.03
    && shape.opts.w >= 1.0).length,
  0,
  'industrial light texture should avoid long guide-line rectangles that read as crosshair rules'
);

const generic = buildFixture(
  { industry:'general-operations' },
  { title:'普通正文页', compositionPlan:{ microComponents:['accent-rail'] } }
);
generic.helpers.lightCanvas(generic.slide);

assert.equal(
  generic.shapes.filter(shape => shape.type === 'rect' && shape.opts.y === 6.76 && shape.opts.h === 0.035).length,
  0,
  'generic light chrome should not render footer accent rails even when accent-rail is requested'
);

console.log('light chrome texture ok');
