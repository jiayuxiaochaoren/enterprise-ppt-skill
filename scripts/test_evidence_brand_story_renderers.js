#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceBrandStoryRenderers
} = require('./render/page-families/evidence-brand-stories');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addLightBreathingCircle: (...args) => record('addLightBreathingCircle', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addSmartPhotoPanel: (...args) => record('addSmartPhotoPanel', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      ink: '0F172A',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    compactEvidenceCaption: value => String(value || ''),
    footerText: () => 'Footer',
    galleryImages: (_plan, section) => section.images || [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    itemBody: (item, fallback = '') => (item && item.body) || fallback,
    itemTitle: (item, fallback) => (item && item.title) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    variantOf: (section, fallback) => section.variant || section.layoutVariant || fallback
  };
}

function storySection(title, extra = {}) {
  return Object.assign({
    title,
    subtitle: `${title} subtitle`,
    items: [
      { title: `${title} 1`, body: 'First story proof' },
      { title: `${title} 2`, body: 'Second story proof' },
      { title: `${title} 3`, body: 'Third story proof' },
      { title: `${title} 4`, body: 'Fourth story proof' }
    ],
    metrics: [
      { label:'Impact', value:'42%', note:'source-bound' },
      { label:'Reuse', value:'18%', note:'verified' },
      { label:'Scope', value:'3', note:'tracked' }
    ]
  }, extra);
}

function assertKicker(ops, text) {
  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === text),
    `expected section kicker ${text}`
  );
}

function assertBrandStoryFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 5, 'expected one footer per exercised brand story branch');
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'brand story footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'brand story footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'brand story footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'brand story footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'brand story footer font size should use primitive default');
  });
  assert.equal(footers.filter(op => op.args[2].color === '738297').length, 2);
  assert.equal(footers.filter(op => op.args[2].color === '64748B').length, 3);
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.0001, `${label}: expected ${expected}, got ${actual}`);
}

function assertHeaderText(ops, text, expected) {
  const op = ops.find(candidate => {
    if (candidate.name !== 'addText' || candidate.args[1] !== text) return false;
    const opts = candidate.args[2] || {};
    return Object.entries(expected).every(([key, value]) => opts[key] === value);
  });
  assert(op, `expected header text ${text}`);
  const opts = op.args[2] || {};
  assertNear(opts.x, expected.x, `${text} x`);
  assertNear(opts.y, expected.y, `${text} y`);
  assertNear(opts.w, expected.w, `${text} width`);
  assertNear(opts.h, expected.h, `${text} height`);
  assertNear(opts.fontSize, expected.fontSize, `${text} font`);
  assert.equal(opts.color, expected.color);
  assert.equal(opts.fit, 'shrink');
  if (expected.bold != null) assert.equal(opts.bold, expected.bold);
}

function assertPageNumberBox(ops, label) {
  const op = ops.find(candidate => {
    if (candidate.name !== 'addNumber' || candidate.args[1] !== label) return false;
    const opts = candidate.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(op, `expected brand story page number ${label}`);
  const opts = op.args[2] || {};
  assertNear(opts.fontSize, 13, `${label} page number font`);
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertBrandStoryHeaders(ops) {
  assert.equal(ops.filter(op => op.name === 'lightCanvas').length, 5, 'expected five primitive brand story headers');
  [
    ['Lookbook', 'Lookbook subtitle', '07', 5.9, 6.4, 9.4, 'addNumber'],
    ['Consumer', 'Consumer subtitle', '08', 5.9, 6.6, 9.4, 'addNumber'],
    ['People', 'People subtitle', 9, 6.0, 7.0, 9.6, 'PageNumber'],
    ['Sustainability', 'Sustainability subtitle', 10, 6.1, 7.2, 9.6, 'PageNumber'],
    ['Sustainability Items', 'Sustainability Items subtitle', 11, 6.1, 7.2, 9.6, 'PageNumber']
  ].forEach(([title, subtitle, page, titleW, subtitleW, subtitleSize, mode]) => {
    assertHeaderText(ops, title, {
      x:0.84, y:1.05, w:titleW, h:0.35, fontSize:23.5, bold:true, color:'111827', fit:'shrink'
    });
    assertHeaderText(ops, subtitle, {
      x:0.86, y:1.52, w:subtitleW, h:0.20, fontSize:subtitleSize, color:'64748B', fit:'shrink'
    });
    if (mode === 'addNumber') assertPageNumberBox(ops, page);
    else assert(ops.some(op => op.name === 'PageNumber' && op.args[1] === page), `expected brand story PageNumber ${page}`);
  });
}

function assertBrandLookbookSceneShell(ops) {
  const hero = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.04
    && op.args[3] === 5.38
    && op.args[4] === 4.10);
  assert(hero, 'expected lookbook primary scene panel');

  const overlay = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && Math.abs(op.args[2] - 5.12) < 0.0001
    && op.args[3] === 5.38
    && op.args[4] === 1.02);
  assert(overlay, 'expected lookbook primary scene caption overlay');

  const circle = ops.find(op => op.name === 'addLightBreathingCircle'
    && Math.abs(op.args[1] - 4.12) < 0.0001
    && Math.abs(op.args[2] - 2.44) < 0.0001
    && op.args[3] === 1.92
    && op.args[4] === 'EFF6FF'
    && op.args[5] === 36);
  assert(circle, 'expected lookbook primary scene fallback circle');

  [
    [6.70, 2.04, 2.12, 1.66],
    [9.24, 2.04, 2.12, 1.66]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected lookbook supporting scene placeholder ${x}/${y}`);
  });

  ['PRIMARY SCENE'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected lookbook scene label ${label}`
    );
  });

  ['Lookbook 1', 'Lookbook 2', 'Lookbook 3', 'First story proof', 'Second story proof', 'Third story proof'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected lookbook scene content ${text}`
    );
  });
}

function hasRect(ops, expected) {
  return ops.some(op => op.name === 'addRect'
    && Math.abs(op.args[1] - expected.x) < 0.0001
    && Math.abs(op.args[2] - expected.y) < 0.0001
    && Math.abs(op.args[3] - expected.w) < 0.0001
    && Math.abs(op.args[4] - expected.h) < 0.0001);
}

function assertConsumerProofGridShell(ops) {
  assert(hasRect(ops, { x:0.92, y:2.50, w:3.20, h:3.48 }), 'expected consumer proof shopper signal panel');
  [
    { x:4.58, y:2.50, w:2.08, h:3.48 },
    { x:6.96, y:2.50, w:2.08, h:3.48 },
    { x:9.34, y:2.50, w:2.08, h:3.48 }
  ].forEach((rect, index) => {
    assert(hasRect(ops, rect), `expected consumer proof slot ${index + 1}`);
  });
  ['SHOPPER SIGNAL', '触点', '理由', '复购'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected consumer proof label ${label}`
    );
  });
  ['场景推动复购', 'SCENE', 'REASON', 'REPEAT', 'Consumer 1', 'First story proof', 'Consumer 2', 'Second story proof', 'Consumer 3', 'Third story proof'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected consumer proof content ${text}`
    );
  });
  ['触点', '理由', '复购'].forEach(label => {
    assert(
      ops.some(op => op.name === 'genericShowcaseField' && op.args.includes(label)),
      `expected consumer proof image fallback ${label}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createEvidenceBrandStoryRenderers(createFakeCtx(ops));
  const names = ['retailLookbookStory', 'peopleProofMosaic', 'sustainabilityProofSpread'];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.retailLookbookStory({}, {}, storySection('Lookbook'), 7);
  renderers.retailLookbookStory({}, {}, storySection('Consumer', { variant:'consumer-proof-photo-grid' }), 8);
  renderers.peopleProofMosaic({}, {}, storySection('People'), 9);
  renderers.sustainabilityProofSpread({}, {}, storySection('Sustainability'), 10);
  renderers.sustainabilityProofSpread({}, {}, storySection('Sustainability Items', { metrics:[] }), 11);

  assertKicker(ops, 'LOOKBOOK STORY');
  assertKicker(ops, 'CONSUMER PROOF GRID');
  assertKicker(ops, 'PEOPLE PROOF MOSAIC');
  assertKicker(ops, 'SUSTAINABILITY PROOF SPREAD');
  assert(ops.some(op => op.name === 'addLightBreathingCircle'), 'expected lookbook image fallback treatment');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected proof image fallback treatment');
  assertBrandStoryHeaders(ops);
  assertBrandLookbookSceneShell(ops);
  assertConsumerProofGridShell(ops);
  assert.equal(ops.filter(op => op.name === 'PageNumber').length, 3, 'expected page numbering for story boards');
  assertBrandStoryFooters(ops);

  console.log('evidence brand story renderers ok');
}

main();
