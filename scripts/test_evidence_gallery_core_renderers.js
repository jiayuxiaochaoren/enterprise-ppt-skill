#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceGalleryRenderers
} = require('./render/page-families/evidence-gallery');
const {
  createEvidenceGalleryCoreRenderers
} = require('./render/page-families/evidence-gallery-core');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addArrowBetweenRects: (...args) => record('addArrowBetweenRects', args),
    addArrowLine: (...args) => record('addArrowLine', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addEvidenceCaptionStack: (...args) => record('addEvidenceCaptionStack', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addLightBreathingCircle: (...args) => record('addLightBreathingCircle', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addPulseCurve: (...args) => record('addPulseCurve', args),
    addRect: (...args) => record('addRect', args),
    addSmartPhotoPanel: (...args) => record('addSmartPhotoPanel', args),
    addText: (...args) => record('addText', args),
    brandWorldBusinessProof: (...args) => record('brandWorldBusinessProof', args),
    chooseEvidenceImageLayout: () => 'mosaic-1-3',
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
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
    compactEvidenceCaption: (value, max = 24) => String(value || '').slice(0, max),
    fileExists: () => false,
    footerText: () => 'Footer',
    galleryImages: (_plan, section) => section.images || [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    itemBody: (item, fallback = '') => {
      if (typeof item === 'string') return '';
      return (item && (item.body || item.note || item.text)) || fallback;
    },
    itemBodyNoEllipsis: (item, fallback = '') => {
      if (typeof item === 'string') return '';
      return (item && (item.body || item.note || item.text)) || fallback;
    },
    itemTitle: (item, fallback = '') => {
      if (typeof item === 'string') return item;
      return (item && (item.title || item.label || item.value)) || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    resolveAssetPath: value => value || '',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function section(overrides = {}) {
  return {
    title: 'Evidence Gallery',
    subtitle: 'Source-bound proof.',
    note: 'Proof should stay traceable.',
    images: [],
    items: [
      { title:'Proof 1', body:'First proof.' },
      { title:'Proof 2', body:'Second proof.' },
      { title:'Proof 3', body:'Third proof.' },
      { title:'Proof 4', body:'Fourth proof.' }
    ],
    facts: [
      { label:'Impact', value:'42%' },
      { label:'Scope', value:'3' },
      { label:'Reuse', value:'18%' }
    ],
    before: { title:'Before', body:'Before state.' },
    after: { title:'After', body:'After state.' },
    ...overrides
  };
}

function assertKicker(ops, text) {
  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === text),
    `expected section kicker ${text}`
  );
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertHeaderText(ops, text, expected) {
  const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
  assert(op, `expected header text ${text}`);
  const opts = op.args[2] || {};
  assertNear(opts.x, expected.x, `${text} x`);
  assertNear(opts.y, expected.y, `${text} y`);
  assertNear(opts.w, expected.w, `${text} width`);
  assertNear(opts.h, expected.h, `${text} height`);
  assertNear(opts.fontSize, expected.fontSize, `${text} font`);
  if (expected.bold != null) assert.strictEqual(opts.bold, expected.bold, `${text} bold`);
  if (expected.color) assert.strictEqual(opts.color, expected.color, `${text} color`);
  if (expected.fit) assert.strictEqual(opts.fit, expected.fit, `${text} fit`);
}

function assertCaseGalleryHeader(ops) {
  assertHeaderText(ops, 'Default Case Gallery', {
    x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Default source proof.', {
    x:0.86, y:1.52, w:5.9, h:0.20, fontSize:9.0, color:'64748B', fit:'shrink'
  });
  const pageNumber = ops.find(op => op.name === 'addNumber' && op.args[1] === '05');
  assert(pageNumber, 'expected case gallery page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.x, 11.70, '05 page number x');
  assertNear(opts.y, 0.66, '05 page number y');
  assertNear(opts.w, 0.72, '05 page number width');
  assertNear(opts.h, 0.22, '05 page number height');
  assertNear(opts.fontSize, 13, '05 page number font');
  assert.strictEqual(opts.color, '2563EB', '05 page number color');
  assert.strictEqual(opts.align, 'right', '05 page number align');
}

function assertSiteComparisonHeader(ops) {
  assertHeaderText(ops, 'Site Before After Header', {
    x:0.82, y:1.06, w:6.1, h:0.36, fontSize:23.5, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertHeaderText(ops, 'Site dispatch proof.', {
    x:0.84, y:1.50, w:6.3, h:0.20, fontSize:9.8, color:'94A3B8', fit:'shrink'
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '04') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.66 && opts.y === 0.72 && opts.w === 0.62 && opts.h === 0.18;
  });
  assert(pageNumber, 'expected site comparison page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 11.5, '04 site page number font');
  assert.strictEqual(opts.color, '2563EB', '04 site page number color');
  assert.strictEqual(opts.align, 'right', '04 site page number align');
}

function assertSiteComparisonStageShell(ops) {
  const stage = ops.find(op => op.name === 'stageCanvas' && (op.args[1] || {}).field === false);
  assert(stage, 'expected site comparison dark stage field');
  const circle = ops.find(op => {
    if (op.name !== 'addDarkBreathingCircle') return false;
    const args = op.args;
    return args[1] === 8.28 && args[2] === 0.64 && args[3] === 4.14 && args[4] === 2.28 && args[5] === '7C3AED';
  });
  assert(circle, 'expected site comparison breathing circle geometry');
}

function findRect(ops, expected) {
  return ops.find(op => {
    if (op.name !== 'addRect') return false;
    return ['x', 'y', 'w', 'h'].every((key, i) => Math.abs(op.args[i + 1] - expected[key]) < 0.001);
  });
}

function findShowcaseField(ops, label, expected) {
  return ops.find(op => {
    if (op.name !== 'genericShowcaseField' || op.args[5] !== label) return false;
    return ['x', 'y', 'w', 'h'].every((key, i) => Math.abs(op.args[i + 1] - expected[key]) < 0.001);
  });
}

function assertCaseComparisonShell(ops) {
  [
    [0.92, 2.02, 4.82, 3.92],
    [7.02, 2.02, 4.82, 3.92]
  ].forEach(([x, y, w, h]) => {
    assert(findRect(ops, { x, y, w, h }), `expected case comparison panel ${x}/${y}`);
  });

  [
    ['BEFORE', 1.10, 2.20, 4.46, 2.48],
    ['AFTER', 7.20, 2.20, 4.46, 2.48]
  ].forEach(([label, x, y, w, h]) => {
    assert(findShowcaseField(ops, label, { x, y, w, h }), `expected case comparison fallback ${label}`);
  });

  const arrow = ops.find(op => {
    if (op.name !== 'addArrowBetweenRects') return false;
    const beforePanel = op.args[1] || {};
    const afterPanel = op.args[2] || {};
    return beforePanel.x === 0.92 && beforePanel.y === 2.02 && beforePanel.w === 4.82 && beforePanel.h === 3.92
      && afterPanel.x === 7.02 && afterPanel.y === 2.02 && afterPanel.w === 4.82 && afterPanel.h === 3.92
      && op.args[3] === 'right';
  });
  assert(arrow, 'expected case comparison transition arrow geometry');

  const dot = ops.find(op => {
    if (op.name !== 'addShape' || op.args[0] !== 'ellipse') return false;
    const box = op.args[1] || {};
    return Math.abs(box.x - 6.32) < 0.001 && Math.abs(box.y - 3.38) < 0.001 && box.w === 0.12 && box.h === 0.12;
  });
  assert(dot, 'expected case comparison transition dot');

  ['BEFORE', 'AFTER', 'CHANGE'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected case comparison label ${label}`
    );
  });

  ['Before', 'Before state.', 'After', 'After state.', 'Proof should stay traceable.'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected case comparison content ${text}`
    );
  });
}

function assertSiteComparisonShell(ops) {
  [
    [0.92, 2.02, 4.50, 3.56],
    [7.10, 2.02, 4.50, 3.56]
  ].forEach(([x, y, w, h]) => {
    assert(findRect(ops, { x, y, w, h }), `expected site comparison panel ${x}/${y}`);
  });

  [
    ['BEFORE', 1.10, 2.22, 4.14, 2.14],
    ['AFTER', 7.28, 2.22, 4.14, 2.14]
  ].forEach(([label, x, y, w, h]) => {
    assert(findShowcaseField(ops, label, { x, y, w, h }), `expected site comparison fallback ${label}`);
  });

  assert(findRect(ops, { x:5.86, y:3.08, w:0.72, h:0.72 }), 'expected site dispatch bridge panel');

  const arrow = ops.find(op => {
    if (op.name !== 'addArrowLine') return false;
    return Math.abs(op.args[1] - 6.04) < 0.001
      && Math.abs(op.args[2] - 3.44) < 0.001
      && op.args[3] === 0.36
      && op.args[4] === 0
      && op.args[5] === '2563EB';
  });
  assert(arrow, 'expected site dispatch arrow geometry');

  ['BEFORE', 'AFTER', 'DISPATCH'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected site comparison label ${label}`
    );
  });

  ['Before', 'Before state.', 'After', 'After state.', '42%', 'Impact', 'Proof should stay traceable.'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected site comparison content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const ctx = createFakeCtx(ops);
  const slide = createSlide(ops);
  const direct = createEvidenceGalleryCoreRenderers(ctx);
  const integrated = createEvidenceGalleryRenderers(ctx);
  const names = [
    'caseGallery',
    'caseComparisonSlide',
    'caseEvidenceBoard',
    'caseEvidenceHero',
    'consumerProofPhotoGrid',
    'energySiteComparisonSlide',
    'energySiteEvidenceGallery',
    'executiveProofBoard',
    'financePortfolioEvidenceGallery',
    'healthcareTouchpointEvidenceGallery',
    'peopleProofMosaic',
    'productEvidenceStory',
    'retailLookbookStory',
    'saasPrototypeFlowGallery',
    'sustainabilityProofSpread'
  ];
  names.forEach(name => {
    assert.strictEqual(typeof direct[name], 'function', `${name} should be exported`);
    assert.strictEqual(typeof integrated[name], 'function', `${name} should be exported through family`);
  });

  direct.caseEvidenceHero(slide, {}, section(), 1);
  direct.caseEvidenceBoard(slide, {}, section({ images:['a.png', 'b.png', 'c.png', 'd.png'] }), 2);
  const genericBoardStart = ops.length;
  direct.caseEvidenceBoard(slide, {}, section({
    title:'Generic Evidence Board',
    subtitle:'Mixed source proof.',
    note:null,
    images:['fallback.png'],
    items:[
      { title:'Fallback 1', body:'One image with more evidence cards.' },
      { title:'Fallback 2', body:'Second fallback card.' },
      { title:'Fallback 3', body:'Third fallback card.' },
      { title:'Fallback 4', body:'Fourth fallback card.' }
    ]
  }), 7);
  const genericBoardOps = ops.slice(genericBoardStart);
  direct.caseComparisonSlide(slide, {}, section(), 3);
  direct.energySiteComparisonSlide(slide, { industry:'energy-utility' }, section({
    title:'Site Before After Header',
    subtitle:'Site dispatch proof.'
  }), 4);
  direct.caseGallery(slide, {}, section({
    title:'Default Case Gallery',
    subtitle:'Default source proof.'
  }), 5);
  integrated.caseGallery(slide, {}, section({ variant:'case-hero' }), 6);

  assertKicker(ops, 'CASE PROOF');
  assertKicker(ops, 'EVIDENCE BOARD');
  assertKicker(ops, 'CASE COMPARISON');
  assertKicker(ops, 'SITE BEFORE / AFTER');
  assertKicker(ops, 'CASE EVIDENCE');
  assertCaseGalleryHeader(ops);
  assertCaseComparisonShell(ops);
  assertSiteComparisonHeader(ops);
  assertSiteComparisonStageShell(ops);
  assertSiteComparisonShell(ops);
  assert(ops.some(op => op.name === 'addArrowBetweenRects'), 'expected comparison arrow');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected site comparison arrow');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected image fallback path');
  assert(ops.some(op => op.name === 'addSmartPhotoPanel'), 'expected gallery image panel path');
  assert(
    genericBoardOps.filter(op => op.name === 'addEvidenceCaptionStack').length >= 4,
    'expected generic evidence board caption grid'
  );
  assert(
    genericBoardOps.some(op => op.name === 'addText' && op.args[1] === '图片与案例统一裁切比例和 caption，形成可核验的现场证据板。'),
    'expected generic evidence board fallback note'
  );
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected evidence gallery text output');

  console.log('evidence gallery core renderers ok');
}

main();
