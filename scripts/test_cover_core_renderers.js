#!/usr/bin/env node
const assert = require('assert');
const {
  createCoverRenderers
} = require('./render/page-families/cover');
const {
  createCoverCoreRenderers
} = require('./render/page-families/cover-core');
const {
  createCoverStyleRenderer
} = require('./render/page-families/cover-style');
const {
  createCoverCopyHelpers
} = require('./render/page-families/cover-copy');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops, specRef) {
  const record = (name, args) => ops.push({ name, args });
  const fallback = {
    coverProof: 'Source-bound proof.',
    coverProofTitle: 'Proof title',
    coverTitle: 'Cover title',
    fallbackCaption: 'Reference visual',
    industryInsight: 'Industry insight'
  };
  return {
    addArrowLine: (...args) => record('addArrowLine', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addDeckMeta: (...args) => record('addDeckMeta', args),
    addEnergyLens: (...args) => record('addEnergyLens', args),
    addEnergyMotionBackdrop: (...args) => {
      record('addEnergyMotionBackdrop', args);
      return false;
    },
    addEnergyPhotoBackdrop: (...args) => record('addEnergyPhotoBackdrop', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addLightBreathingCircle: (...args) => record('addLightBreathingCircle', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addPulseCurve: (...args) => record('addPulseCurve', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    addVisualPhotoBackdrop: (...args) => {
      record('addVisualPhotoBackdrop', args);
      return false;
    },
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      darkLine: '334155',
      darkMuted: '94A3B8',
      darkText: 'E2E8F0',
      ink: '0F172A',
      ink2: '111827',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    copyFallback: (_plan, key, fallbackText) => fallbackText || fallback[key] || key,
    designForSlide: plan => ({
      wantsImage:Boolean(plan && plan.coverImagePath),
      imagePath:(plan && plan.coverImagePath) || '',
      imageRole:(plan && plan.imageRole) || '',
      coverStylePreset:(plan && plan.coverStylePreset) || null
    }),
    fileExists: file => Boolean(file && String(file).includes('/exists/')),
    footerText: () => 'Footer',
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    industryProfile: plan => ({
      coverField: plan.coverField || (plan.industry === 'energy-utility' ? 'energy' : (plan.industry === 'manufacturing-operations' ? 'manufacturing' : 'generic')),
      insight: plan.coverInsight || 'Industry insight',
      label: plan.industryLabel || 'DIGITAL'
    }),
    isCompanyIntroPlan: plan => Boolean(plan && plan.isCompanyIntro),
    itemBody: value => (value && (value.body || value.note || value.text)) || '',
    itemTitle: value => (value && (value.title || value.label || value.value)) || '',
    lightCanvas: (...args) => record('lightCanvas', args),
    masterDark: (...args) => record('masterDark', args),
    metaDisabled: () => false,
    panelFill: () => 'F8FAFC',
    presentationSpec: () => specRef.current,
    profile: () => ({ palette:'Fixture palette' }),
    profileFont: () => 'Aptos Display',
    stageCanvas: (...args) => record('stageCanvas', args),
    surfaceFill: () => 'FFFFFF',
    typeSize: (_name, fallbackSize) => fallbackSize,
    typeToken: (_name, fallbackToken) => fallbackToken || {},
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function renderWith(plan, section, specRef, direct, ops) {
  direct.coverDark(createSlide(ops), plan, section);
}

function hasOp(ops, name, value) {
  return ops.some(op => op.name === name && op.args.includes(value));
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertFooterShape(op, expected) {
  const box = op.args[2] || {};
  assertNear(box.x, 0.82, 'footer x');
  assertNear(box.y, 7.05, 'footer y');
  assertNear(box.w, 7.8, 'footer width');
  assertNear(box.h, 0.16, 'footer height');
  assertNear(box.fontSize, expected.fontSize, `footer font ${expected.fontSize}`);
  assert.strictEqual(box.color, '64748B', `footer color ${expected.fontSize}`);
}

function assertCoverFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footers.length, 4, 'expected cover footer evidence for showcase, light, beauty, and airy branches');
  assert.strictEqual(footers.filter(op => (op.args[2] || {}).fontSize === 7.6).length, 2, 'expected specialty cover footers');
  [7.5, 7.4, 7.6, 7.6].forEach(fontSize => {
    const op = footers.find(candidate => (candidate.args[2] || {}).fontSize === fontSize);
    assert(op, `expected cover footer font size ${fontSize}`);
    assertFooterShape(op, { fontSize });
  });
}

function assertShowcaseStageShell(ops) {
  const stage = ops.find(op => op.name === 'stageCanvas');
  assert(stage, 'expected showcase cover to draw a stage shell');
  assert.deepStrictEqual(stage.args[1], { field:false }, 'expected showcase cover stage without field overlay');
  const circle = ops.find(op => op.name === 'addDarkBreathingCircle'
    && op.args[1] === 8.72
    && op.args[2] === 0.62
    && op.args[3] === 3.72
    && op.args[4] === 2.04);
  assert(circle, 'expected showcase cover breathing circle geometry');
  assert.strictEqual(circle.args[5], '2563EB', 'expected showcase cover breathing circle accent');
}

function assertSpecialtyLightCanvasShells(ops) {
  assert.strictEqual(
    ops.filter(op => op.name === 'lightCanvas').length,
    2,
    'expected two specialty cover light canvas shells'
  );
}

function hasRect(ops, expected) {
  return ops.some(op => op.name === 'addRect'
    && Math.abs(op.args[1] - expected.x) < 0.001
    && Math.abs(op.args[2] - expected.y) < 0.001
    && Math.abs(op.args[3] - expected.w) < 0.001
    && Math.abs(op.args[4] - expected.h) < 0.001);
}

function assertLightEditorialShell(ops) {
  assert(hasRect(ops, { x:0, y:0, w:13.333, h:7.5 }), 'expected light editorial full background');
  assert(hasRect(ops, { x:8.50, y:1.34, w:2.90, h:4.86 }), 'expected light editorial proof panel');
  assert(hasRect(ops, { x:8.335, y:1.34, w:0.035, h:4.86 }), 'expected light editorial proof rail aligned with panel');
  const oldDetachedRail = hasRect(ops, { x:8.54, y:0.92, w:0.024, h:4.90 });
  assert(!oldDetachedRail, 'old detached editorial proof rail should not render');
  assert(!ops.some(op => op.name === 'addLightBreathingCircle'), 'light editorial proof panel should not add a right-side circle motif');
  [
    ['01', { x:8.92, y:1.76, w:0.44, h:0.18, fontSize:10.2, color:'2563EB' }],
    ['Proof title', { x:8.92, y:2.38, w:2.02, h:0.22, fontSize:12.2, color:'111827' }],
    ['Industry insight', { x:8.92, y:3.12, w:1.98, h:0.62, fontSize:8.4, color:'334155' }]
  ].forEach(([text, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addText' || candidate.args[1] !== text) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => (
        typeof value === 'number'
          ? Math.abs((opts[key] || 0) - value) < 0.001
          : opts[key] === value
      ));
    });
    assert(op, `expected light editorial proof text ${text}`);
  });
}

function assertTextBox(ops, text, expected) {
  const op = ops.find(candidate => {
    if (candidate.name !== 'addText' || candidate.args[1] !== text) return false;
    const opts = candidate.args[2] || {};
    return Object.entries(expected).every(([key, value]) => opts[key] === value);
  });
  assert(op, `expected cover text ${text}`);
}

function assertDarkStandardCoverShell(ops) {
  assertTextBox(ops, 'Operations Platform', {
    x:0.88, y:2.05, w:6.55, h:1.08, fontSize:31, bold:true, color:'FFFFFF', breakLine:true, fit:'shrink'
  });
  assertTextBox(ops, 'Industry insight', {
    x:0.92, y:3.36, w:5.7, h:0.20, fontSize:11.5, color:'CBD5E1', fit:'shrink'
  });
  const accentRule = ops.find(op => op.name === 'addHairline'
    && op.args[1] === 0.92
    && op.args[2] === 3.78
    && op.args[3] === 0.82
    && op.args[4] === '2563EB');
  assert(accentRule, 'expected standard dark cover accent rule');
  const meta = ops.find(op => op.name === 'addDeckMeta'
    && (op.args[2] || {}).x === 0.92
    && (op.args[2] || {}).y === 6.30
    && (op.args[2] || {}).fontSize === 8.2);
  assert(meta, 'expected standard dark cover deck meta');
}

function assertEnergyCoverShell(ops) {
  assertTextBox(ops, 'Energy Smart Platform', {
    x:0.84, y:2.30, w:7.25, h:0.62, fontSize:33, bold:true, color:'FFFFFF', fit:'shrink', breakLine:false
  });
  assertTextBox(ops, 'Industry insight', {
    x:0.88, y:3.48, w:5.85, h:0.22, fontSize:11.2, color:'CBD5E1', fit:'shrink'
  });
  assert(hasRect(ops, { x:0.88, y:3.92, w:0.82, h:0.035 }), 'expected energy cover accent rule');
  assert(hasRect(ops, { x:1.82, y:3.92, w:0.34, h:0.035 }), 'expected energy cover cyan rule');
  const meta = ops.find(op => op.name === 'addDeckMeta'
    && (op.args[2] || {}).x === 0.88
    && (op.args[2] || {}).y === 6.24
    && (op.args[2] || {}).fontSize === 7.8);
  assert(meta, 'expected energy cover deck meta');
}

function main() {
  const ops = [];
  const specRef = { current:{ coverTone:'dark', coverMotif:'editorial-rule' } };
  const ctx = createFakeCtx(ops, specRef);
  const copyHelpers = createCoverCopyHelpers(ctx);
  assert.strictEqual(
    copyHelpers.coverTitleText('AI 工作台进入\n团队级采用阶段'),
    'AI 工作台进入 团队级采用阶段',
    'short cover titles should not keep manual line breaks'
  );
  assert.strictEqual(
    copyHelpers.coverTitleText('新能源汽车充电服务经营复盘'),
    '新能源汽车充电服务经营复盘',
    'medium-length cover titles should prefer one-line rendering'
  );
  const direct = createCoverCoreRenderers(ctx);
  const integrated = createCoverRenderers(ctx);
  assert.strictEqual(typeof direct.coverDark, 'function');
  assert.strictEqual(typeof integrated.coverDark, 'function');

  renderWith({ title:'Operations Platform', date:'2026' }, { title:'Operations Platform', subtitle:'Insight' }, specRef, direct, ops);
  renderWith({
    title:'Showcase Cover',
    industry:'finance-investment',
    visualIntent:'case-led',
    coverImagePath:'/exists/showcase.jpg'
  }, { title:'Showcase Cover', subtitle:'Insight' }, specRef, direct, ops);
  specRef.current = { coverTone:'light', coverMotif:'calm-field' };
  renderWith({ title:'Light Cover', date:'2026' }, { title:'Light Cover', subtitle:'Insight' }, specRef, integrated, ops);
  specRef.current = { coverTone:'dark', coverMotif:'editorial-rule' };
  renderWith(
    { title:'栀颜集美妆个护品牌经营复盘', organization:'栀颜集' },
    { variant:'beauty-brand-editorial-cover', title:'栀颜集美妆个护品牌经营复盘' },
    specRef,
    direct,
    ops
  );
  renderWith({ title:'Airy Cover' }, { variant:'airy-concept-opening', title:'Airy Cover' }, specRef, direct, ops);
  renderWith({
    title:'Manufacturing Cover',
    industry:'manufacturing-operations',
    coverMetrics:[
      { label:'Line readiness', value:'92%' },
      { label:'Controls', value:'PLC' },
      { label:'Install', value:'Field' }
    ]
  }, { title:'Manufacturing Cover' }, specRef, direct, ops);
  renderWith({ title:'Energy Smart Platform', industry:'energy-utility', date:'2026' }, { title:'Energy Smart Platform' }, specRef, direct, ops);

  assert(ops.filter(op => op.name === 'masterDark').length >= 5, 'expected dark cover setup');
  assert(ops.some(op => op.name === 'addDeckMeta'), 'expected deck meta output');
  assert(ops.some(op => op.name === 'addEnergyLens'), 'expected energy cover lens');
  assert(ops.some(op => op.name === 'addEnergyPhotoBackdrop'), 'expected energy photo fallback');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected manufacturing proof flow');
  assert(ops.some(op => op.name === 'addShape'), 'expected airy object shape');
  assert(hasOp(ops, 'addLabel', '美妆品牌世界'), 'expected localized beauty cover branch');
  assert(hasOp(ops, 'addLabel', '首发到手价'), 'expected localized launch price label');
  assert(hasOp(ops, 'addText', '栀颜集'), 'expected beauty cover to use the plan organization as brand mark');
  ['BEAUTY BRAND WORLD', 'LAUNCH PRICE', 'PRODUCT TEXTURE', 'LUMÉA'].forEach(text => {
    assert(
      !ops.some(op => op.args.includes(text)),
      `beauty cover should not render English fixture label ${text}`
    );
  });
  assert(hasOp(ops, 'addLabel', 'CONCEPT OPENING'), 'expected airy cover branch');
  assert(hasOp(ops, 'addLabel', 'MANUFACTURING PROOF'), 'expected manufacturing cover branch');
  assertShowcaseStageShell(ops);
  assertDarkStandardCoverShell(ops);
  assertEnergyCoverShell(ops);
  assertSpecialtyLightCanvasShells(ops);
  assertLightEditorialShell(ops);
  assertCoverFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 30, 'expected cover text output');

  const styleOps = [];
  const styleSpecRef = { current:{ coverTone:'light' } };
  const styleCtx = createFakeCtx(styleOps, styleSpecRef);
  const styleCopy = createCoverCopyHelpers(styleCtx);
  const styleRenderer = createCoverStyleRenderer(styleCtx, {
    addCoverKicker: styleCopy.addCoverKicker,
    colors: () => styleCtx.colors()
  });
  assert.equal(styleRenderer(
    createSlide(styleOps),
    {
      title:'Brand System Board',
      coverImagePath:'/exists/brand-system-board.jpg',
      coverStylePreset:{ rendererFlavor:'brand-product-showcase' }
    },
    { title:'Brand System Board' },
    { label:'BRAND RETAIL' },
    'Brand System Board'
  ), true);
  const brandPhoto = styleOps.find(op => op.name === 'addPhotoPanel' && op.args[1] === '/exists/brand-system-board.jpg');
  assert(brandPhoto, 'expected brand product showcase to render the right cover image panel');
  assert(
    (brandPhoto.args[6] || {}).transparency >= 80,
    'brand product showcase should not wash out cover imagery with an opaque white overlay'
  );
  const leftSurface = styleOps.find(op => op.name === 'addRect'
    && op.args[1] === 0
    && op.args[2] === 0
    && op.args[3] === brandPhoto.args[2]
    && op.args[4] === 7.5);
  assert(leftSurface, 'brand product showcase copy panel should stop exactly at the image boundary');

  const noImageOps = [];
  const noImageCtx = createFakeCtx(noImageOps, styleSpecRef);
  noImageCtx.addPhotoPanel = (...args) => {
    noImageOps.push({ name:'addPhotoPanel', args });
    return false;
  };
  const noImageCopy = createCoverCopyHelpers(noImageCtx);
  const noImageRenderer = createCoverStyleRenderer(noImageCtx, {
    addCoverKicker: noImageCopy.addCoverKicker,
    colors: () => noImageCtx.colors()
  });
  assert.equal(noImageRenderer(
    createSlide(noImageOps),
    {
      title:'Commerce Signal Board',
      coverStylePreset:{ rendererFlavor:'brand-product-showcase' }
    },
    { title:'Commerce Signal Board' },
    { label:'BRAND RETAIL' },
    'Commerce Signal Board'
  ), true);
  assert(
    noImageOps.some(op => op.name === 'addLabel' && op.args[1] === '经营信号板'),
    'brand product showcase skip-image branch should render a native signal board'
  );
  ['渠道效率', 'SKU 组合', '复购质量'].forEach(text => {
    assert(
      noImageOps.some(op => op.name === 'addText' && op.args[1] === text),
      `expected native cover signal ${text}`
    );
  });

  console.log('cover core renderers ok');
}

main();
