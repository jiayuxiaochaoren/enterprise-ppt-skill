#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceProofBoardRenderers
} = require('./render/page-families/evidence-proof-boards');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
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
      risk: 'DC2626',
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
    itemBodyNoEllipsis: (item, fallback = '') => (item && item.body) || fallback,
    itemTitle: (item, fallback) => (item && item.title) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function section(title) {
  return {
    title,
    subtitle: `${title} subtitle`,
    images: [],
    items: [
      { title: `${title} 1`, body: 'First proof point' },
      { title: `${title} 2`, body: 'Second proof point' },
      { title: `${title} 3`, body: 'Third proof point' },
      { title: `${title} 4`, body: 'Decision proof point' }
    ]
  };
}

function assertKicker(ops, text) {
  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === text),
    `expected section kicker ${text}`
  );
}

function assertStandardFooters(ops, expectedCount) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, expectedCount, `expected ${expectedCount} evidence proof footers`);
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'evidence proof footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'evidence proof footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'evidence proof footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'evidence proof footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'evidence proof footer font size should use primitive default');
    assert.equal(opts.color, '64748B', 'evidence proof footer color should preserve muted token');
  });
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

function assertProofBoardHeaders(ops) {
  assert.equal(ops.filter(op => op.name === 'lightCanvas').length, 3, 'expected three primitive evidence proof headers');
  [
    ['Consumer', 'Consumer subtitle', 4, 6.1],
    ['Product', 'Product subtitle', 5, 6.0],
    ['Executive', 'Executive subtitle', 6, 6.1]
  ].forEach(([title, subtitle, page, titleW]) => {
    assertHeaderText(ops, title, {
      x:0.84, y:1.05, w:titleW, h:0.35, fontSize:23.5, bold:true, color:'111827', fit:'shrink'
    });
    assertHeaderText(ops, subtitle, {
      x:0.86, y:1.52, w:7.0, h:0.20, fontSize:9.6, color:'64748B', fit:'shrink'
    });
    assert(
      ops.some(op => op.name === 'PageNumber' && op.args[1] === page),
      `expected evidence proof PageNumber ${page}`
    );
  });
}

function assertConsumerProofGridShell(ops) {
  [
    [0.92, 2.50, 2.54, 3.52],
    [3.74, 2.50, 2.54, 3.52],
    [6.56, 2.50, 2.54, 3.52],
    [9.38, 2.50, 2.54, 3.52]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && Math.abs(candidate.args[1] - x) < 0.0001
      && Math.abs(candidate.args[2] - y) < 0.0001
      && Math.abs(candidate.args[3] - w) < 0.0001
      && Math.abs(candidate.args[4] - h) < 0.0001);
    assert(op, `expected consumer proof grid slot ${x}/${y}`);
  });
  ['SCENE', 'REASON', 'CHANNEL', 'BOUNDARY'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected consumer proof grid label ${label}`
    );
  });
  ['Consumer 1', 'Consumer 2', 'Consumer 3', 'Consumer 4', 'First proof point', 'Decision proof point'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected consumer proof grid content ${text}`
    );
  });
  ['01', '02', '03', '04'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addNumber' && op.args[1] === text),
      `expected consumer proof grid fallback number ${text}`
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

function assertProductEvidenceStoryShell(ops) {
  assert(hasRect(ops, { x:0.92, y:2.50, w:5.44, h:3.60 }), 'expected product evidence hero panel');
  assert(hasRect(ops, { x:0.92, y:5.20, w:5.44, h:0.90 }), 'expected product evidence hero caption band');
  assert(hasRect(ops, { x:6.86, y:2.50, w:4.72, h:3.60 }), 'expected product evidence proof list panel');
  assert(
    ops.some(op => op.name === 'genericShowcaseField' && op.args.includes('HERO PRODUCT')),
    'expected product evidence hero image fallback'
  );
  ['HERO PRODUCT PROOF', '产品证据矩阵', '产品 / 场景 / 证据 / 经营'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected product evidence label ${label}`
    );
  });
  ['Product 1', 'Product 2', 'Product 3', 'Product 4', 'First proof point', 'Second proof point', 'Third proof point', 'Decision proof point'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected product evidence content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createEvidenceProofBoardRenderers(createFakeCtx(ops));
  const names = ['consumerProofPhotoGrid', 'productEvidenceStory', 'executiveProofBoard'];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.consumerProofPhotoGrid({}, {}, section('Consumer'), 4);
  renderers.productEvidenceStory({}, {}, section('Product'), 5);
  renderers.executiveProofBoard({}, {}, section('Executive'), 6);

  assertKicker(ops, 'CONSUMER PROOF PHOTO GRID');
  assertKicker(ops, 'PRODUCT EVIDENCE STORY');
  assertKicker(ops, 'EXECUTIVE PROOF BOARD');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected image fallback rendering');
  assertProofBoardHeaders(ops);
  assertConsumerProofGridShell(ops);
  assertProductEvidenceStoryShell(ops);
  assert.equal(ops.filter(op => op.name === 'PageNumber').length, 3, 'expected page numbering');
  assertStandardFooters(ops, 3);
  assert(ops.filter(op => op.name === 'addText').length >= 28, 'expected text output');

  console.log('evidence proof board renderers ok');
}

main();
