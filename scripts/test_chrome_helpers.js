const assert = require('assert/strict');
const { createChromeHelpers } = require('./render/chrome-helpers');
const { createCanvasMotifHelpers } = require('./render/chrome/canvas-motifs');
const { createDeckMetaPolicy } = require('./render/chrome/deck-meta-policy');

const shapes = [];
const texts = [];
const slide = {
  images:[],
  addShape(type, opts) {
    shapes.push({ type, opts });
  },
  addImage(opts) {
    this.images.push(opts);
  }
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
    paper:'F8FAFC',
    softBlue:'EFF6FF',
    text:'111111',
    violet:'7C3AED',
    white:'FFFFFF'
  }),
  compactEvidenceCaption: text => text,
  containsCjk: text => /[\u4e00-\u9fff]/.test(text),
  copyPolicyText: (_plan, key, fallback = '') => fallback || key,
  design: () => ({ palettes:{ fixture:{ presentation:{ panelFill:'FFFFFF', surfaceFill:'F8FAFC' } } }, slideDesign: () => ({ wantsImage:false }) }),
  imageDimensions: () => ({ w:1200, h:800 }),
  itemBody: item => (item && item.body) || '',
  itemTitle: (item, fallback = '') => (item && item.title) || fallback,
  localizeMicrocopy: (_plan, text) => text,
  mediaForRole: () => '',
  normalizeTypographyOptions: (_plan, _text, opts) => opts,
  profile: () => ({ font:'Fixture CJK', palette:'fixture' }),
  renderKpiStrip: () => ({ rendered:true }),
  renderState: () => ({ plan:{ industry:'general-operations' }, slide:{ title:'Fixture' }, idx:3 }),
  resolveAssetPath: value => value,
  resolveTypeToken: (_plan, _name, opts) => opts.token || {},
  slideSemanticText: slideLike => slideLike.title || '',
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

helpers.addRect(slide, 1, 2, 3, 4, 'FFFFFF', '000000');
helpers.addLabel(slide, 'LABEL', { x:0.5, y:0.5, w:1, h:0.12 });
helpers.lightCanvas(slide);
helpers.PageNumber(slide, 3);
helpers.addArrowLine(slide, 1, 1, 2, 0, '0066FF');
helpers.addPhotoPanel(slide, '/missing-fixture-image.png', 2, 2, 1, 1, { fallback:'ABCDEF' });
helpers.addDeckMeta(slide, { metadata:{ organization:'Acme' }, showMeta:true }, { x:0, y:0, w:2, h:0.2 });
const beforeEmptySourceNote = texts.length;
assert.equal(helpers.SourceNote(slide, ''), false, 'SourceNote should not fall back to the deck footer when no visible source note is provided');
assert.equal(texts.length, beforeEmptySourceNote);
helpers.FooterNote(slide, 'Deck footer');
helpers.SourceNote(slide, 'Visible source note');

const directMetaWrites = [];
const deckMetaPolicy = createDeckMetaPolicy({
  addText: (target, text, opts) => {
    directMetaWrites.push({ target, text, opts });
    return true;
  }
});
const metaPlan = { metaFields:['organization', 'audience'], organization:'Acme', audience:'Board' };
const motifOps = [];
const canvasMotifs = createCanvasMotifHelpers({
  C: {
    accent:'0066FF',
    cyan:'00FFFF',
    ink:'0F172A',
    softBlue:'EFF6FF'
  },
  H: 7.5,
  W: 13.333,
  compositionFor: s => s.compositionPlan || {}
}, {
  addDarkBreathingCircle: (...args) => motifOps.push(['darkCircle', args]),
  addHairline: (...args) => motifOps.push(['hairline', args]),
  addLightBreathingCircle: (...args) => motifOps.push(['lightCircle', args]),
  addRect: (...args) => motifOps.push(['rect', args]),
  panelFill: () => 'FFFFFF',
  surfaceFill: () => 'F8FAFC'
});
const motifSlide = {};

assert.ok(shapes.some(op => op.type === 'rect' && op.opts.x === 1 && op.opts.fill.color === 'FFFFFF'), 'addRect should record a rect draw call');
assert.ok(texts.some(op => op.text === 'LABEL'), 'addLabel should delegate text rendering');
assert.ok(texts.some(op => op.text === '03' && op.opts._folioInternal), 'PageNumber should render a normalized folio');
assert.ok(!shapes.some(op => op.type === 'ellipse'), 'lightCanvas should not add a default decorative motif');
assert.ok(shapes.some(op => op.type === 'line' && op.opts.line.endArrowType === 'triangle'), 'addArrowLine should record arrow styling');
assert.ok(shapes.some(op => op.type === 'rect' && op.opts.fill.color === 'ABCDEF'), 'missing photo should draw fallback panel');
assert.ok(texts.some(op => op.text === 'Acme'), 'deck meta should render organization metadata');
assert.ok(texts.some(op => op.text === 'Deck footer'), 'FooterNote should render ordinary deck footer text');
assert.ok(texts.some(op => op.text === 'Visible source note'), 'SourceNote should render explicit visible source notes');
assert.equal(deckMetaPolicy.metaDisabled({ showMeta:false }), true);
assert.equal(deckMetaPolicy.coverMetaText(metaPlan), 'Acme  /  Board');
assert.equal(helpers.coverMetaText(metaPlan), deckMetaPolicy.coverMetaText(metaPlan));
assert.equal(deckMetaPolicy.addDeckMeta({}, { metaText:'One-off meta' }, { x:1 }), true);
assert.equal(directMetaWrites[0].text, 'One-off meta');
assert.equal(deckMetaPolicy.footerText({
  pptType:'company-intro',
  organization:'Acme',
  footer:'Acme 公司介绍'
}), 'Acme');
assert.equal(deckMetaPolicy.footerText({
  footer:'栀颜集经营复盘｜脱敏模拟数据'
}), '栀颜集经营复盘');
assert.equal(deckMetaPolicy.footerText({
  footer:'星驿充电 | 新能源汽车充电服务经营复盘 | 来源：用户提供的行业基础数据包'
}), '星驿充电｜新能源汽车充电服务经营复盘');
assert.equal(deckMetaPolicy.footerText({
  footer:'脱敏模拟数据，仅用于 PPT 生成测试，不代表真实公司，外发前需替换为真实授权数据'
}), '');
assert.deepEqual(deckMetaPolicy.deckMetaFields({
  showMeta:true,
  metaFields:['organization', 'audience'],
  organization:'客户经营复盘｜脱敏模拟数据',
  audience:'董事会'
}), ['客户经营复盘', '董事会']);
assert.equal(canvasMotifs.canvasMotifKind({ industry:'beauty-consumer' }, {}, 'light'), 'none');
assert.equal(canvasMotifs.canvasMotifKind({ industry:'beauty-consumer', enableDecorativeMotifs:true }, {}, 'light'), 'beauty-editorial-veil');
assert.equal(canvasMotifs.canvasMotifKind({}, { compositionPlan:{ backgroundMotif:'none' } }, 'dark'), 'none');
canvasMotifs.TintedBackground(motifSlide, {});
assert.equal(motifSlide.background.color, 'F8FAFC');
assert.equal(motifOps.filter(([kind]) => kind === 'rect').length, 2);
canvasMotifs.addCanvasMotif(motifSlide, {}, {}, 'dark', { outer:2, inner:1 });
assert.ok(!motifOps.some(([kind]) => kind === 'darkCircle'));
canvasMotifs.addCanvasMotif(motifSlide, { enableDecorativeMotifs:true }, {}, 'dark', { outer:2, inner:1 });
assert.ok(motifOps.some(([kind]) => kind === 'darkCircle'));
assert.equal(helpers.panelFill(), 'FFFFFF');

console.log('chrome helper factory ok');
