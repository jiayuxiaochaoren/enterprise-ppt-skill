#!/usr/bin/env node
const assert = require('assert');
const {
  createBeautyRenderers,
  entries
} = require('./render/page-families/beauty');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addSmartPhotoPanel: (...args) => record('addSmartPhotoPanel', args),
    addText: (...args) => record('addText', args),
    chooseFourImageLayout: (_imagePaths, opts = {}) => opts.layout || 'featured-list',
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      darkMuted: '94A3B8',
      ink: '0F172A',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    designForSlide: (_plan, s) => ({ imagePath:s.imagePath || '', imageRole:s.imageRole || '' }),
    fileExists: file => Boolean(file && String(file).includes('/exists/')),
    footerText: () => 'Footer',
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    imagePathFromItem: (item = {}, fallback = '') => item.imagePath || item.image || fallback || '',
    itemBody: (item = {}, fallback = '') => item.body || item.note || item.text || fallback,
    itemTitle: (item = {}, fallback = '') => item.title || item.label || item.value || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function product(index, imagePath) {
  return {
    title:`Product ${index}`,
    body:`Product ${index} body`,
    imagePath
  };
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertBeautyFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footers.length, 5, 'expected one footer per beauty renderer branch');
  footers.forEach((op, i) => {
    const box = op.args[2] || {};
    assertNear(box.x, 0.82, `footer ${i + 1} x`);
    assertNear(box.y, 7.05, `footer ${i + 1} y`);
    assertNear(box.w, 7.8, `footer ${i + 1} width`);
    assertNear(box.h, 0.16, `footer ${i + 1} height`);
    assertNear(box.fontSize, 7.8, `footer ${i + 1} font`);
    assert.strictEqual(box.color, '64748B', `footer ${i + 1} color`);
  });
}

function assertHeaderTitle(ops, title, expected) {
  const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === title);
  assert(op, `expected header title ${title}`);
  const box = op.args[2] || {};
  assertNear(box.x, 0.84, `${title} header x`);
  assertNear(box.y, 1.05, `${title} header y`);
  assertNear(box.w, expected.w, `${title} header width`);
  assertNear(box.h, expected.h, `${title} header height`);
  assertNear(box.fontSize, 24, `${title} header font`);
  assert.strictEqual(box.bold, true, `${title} header bold`);
  assert.strictEqual(box.fit, 'shrink', `${title} header fit`);
}

function assertBeautyHeaders(ops) {
  const kickerCounts = new Map();
  ops.filter(op => op.name === 'sectionKicker').forEach(op => {
    kickerCounts.set(op.args[1], (kickerCounts.get(op.args[1]) || 0) + 1);
  });
  assert.strictEqual(kickerCounts.get('PRODUCT LINEUP'), 3, 'expected catalog-grid headers');
  assert.strictEqual(kickerCounts.get('PRODUCT SYSTEM'), 1, 'expected feature-strip header');
  assert.strictEqual(kickerCounts.get('PRODUCT HERO'), 1, 'expected hero-object header');

  [
    ['Catalog Grid', { w:5.8, h:0.35 }],
    ['Catalog Featured', { w:5.8, h:0.35 }],
    ['Catalog Cards', { w:5.8, h:0.35 }],
    ['Feature Strip', { w:5.9, h:0.35 }],
    ['Hero Object', { w:5.6, h:0.36 }]
  ].forEach(([title, expected]) => assertHeaderTitle(ops, title, expected));

  const chromeNumbers = ops.filter(op => op.name === 'addNumber' && (op.args[2] || {}).x === 11.70 && (op.args[2] || {}).y === 0.66);
  assert.strictEqual(chromeNumbers.length, 4, 'expected primitive addNumber chrome for catalog and feature branches');
  ['01', '02', '03', '04'].forEach((label, i) => {
    assert.strictEqual(chromeNumbers[i].args[1], label, `expected page number ${label}`);
  });
  const pageNumberOps = ops.filter(op => op.name === 'PageNumber');
  assert.strictEqual(pageNumberOps.length, 1, 'expected hero branch PageNumber chrome');
  assert.strictEqual(pageNumberOps[0].args[1], 5, 'expected hero branch index');
}

function assertProductHeroShell(ops) {
  const captionBand = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 5.06
    && op.args[3] === 6.18
    && op.args[4] === 0.72);
  assert(captionBand, 'expected product hero visual caption band');
  const sidePanel = ops.find(op => op.name === 'addRect'
    && op.args[1] === 7.62
    && op.args[2] === 2.00
    && op.args[3] === 3.78
    && op.args[4] === 3.78);
  assert(sidePanel, 'expected product hero positioning panel');
  ['VISUAL PROOF', 'POSITIONING'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected product hero label ${label}`
    );
  });
  ['INSPECTABLE OBJECT', 'Product 1', 'Product 1 body', 'Product 2'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected product hero content ${text}`
    );
  });
}

function findRect(ops, expected) {
  return ops.find(op => {
    if (op.name !== 'addRect') return false;
    return ['x', 'y', 'w', 'h'].every((key, i) => Math.abs(op.args[i + 1] - expected[key]) < 0.001);
  });
}

function assertCatalogGridCardsShell(ops) {
  [
    [1.72, 2.16, 3.02, 1.70],
    [5.20, 2.16, 3.02, 1.70],
    [8.68, 2.16, 3.02, 1.70],
    [3.42, 4.32, 3.02, 1.70],
    [6.90, 4.32, 3.02, 1.70]
  ].forEach(([x, y, w, h]) => {
    assert(findRect(ops, { x, y, w, h }), `expected catalog grid product card ${x}/${y}`);
  });

  [
    [1.84, 2.28, 2.78, 0.82],
    [5.32, 2.28, 2.78, 0.82],
    [8.80, 2.28, 2.78, 0.82],
    [3.54, 4.44, 2.78, 0.82],
    [7.02, 4.44, 2.78, 0.82]
  ].forEach(([x, y, w, h]) => {
    assert(findRect(ops, { x, y, w, h }), `expected catalog grid product image placeholder ${x}/${y}`);
  });

  ['Product 5', 'Product 5 body', '产品对象、应用场景和证据说明保持在同一张产品谱系页。'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected catalog grid content ${text}`
    );
  });
}

function assertTextBox(ops, text, expected) {
  const op = ops.find(candidate => {
    if (candidate.name !== 'addText' || candidate.args[1] !== text) return false;
    const box = candidate.args[2] || {};
    return Math.abs(box.x - expected.x) < 0.001
      && Math.abs(box.y - expected.y) < 0.001
      && Math.abs(box.w - expected.w) < 0.001
      && Math.abs(box.h - expected.h) < 0.001;
  });
  assert(op, `expected featured list content ${text}`);
}

function assertCatalogFeaturedListShell(ops) {
  assert(findRect(ops, { x:0.92, y:2.04, w:4.70, h:3.96 }), 'expected featured lead panel');
  [
    [6.14, 2.04, 5.42, 1.02],
    [6.14, 3.32, 5.42, 1.02],
    [6.14, 4.60, 5.42, 1.02]
  ].forEach(([x, y, w, h]) => {
    assert(findRect(ops, { x, y, w, h }), `expected featured list row ${x}/${y}`);
  });

  const leadPhoto = ops.find(op => op.name === 'addSmartPhotoPanel' && op.args[1] === '/exists/lead.jpg');
  assert(leadPhoto, 'expected featured lead image panel');
  assertNear(leadPhoto.args[2], 1.10, 'featured lead image x');
  assertNear(leadPhoto.args[3], 2.22, 'featured lead image y');
  assertNear(leadPhoto.args[4], 4.34, 'featured lead image width');
  assertNear(leadPhoto.args[5], 2.34, 'featured lead image height');

  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === 'PRIMARY PRODUCT'),
    'expected featured lead label'
  );
  [
    ['Product 1', { x:1.20, y:5.12, w:1.82, h:0.18 }],
    ['Product 1 body', { x:3.16, y:5.10, w:1.86, h:0.22 }],
    ['Product 2', { x:7.76, y:2.30, w:1.42, h:0.16 }],
    ['Product 2 body', { x:9.34, y:2.27, w:1.62, h:0.22 }],
    ['Product 3', { x:7.76, y:3.58, w:1.42, h:0.16 }],
    ['Product 3 body', { x:9.34, y:3.55, w:1.62, h:0.22 }],
    ['Product 4', { x:7.76, y:4.86, w:1.42, h:0.16 }],
    ['Product 4 body', { x:9.34, y:4.83, w:1.62, h:0.22 }]
  ].forEach(([text, expected]) => assertTextBox(ops, text, expected));

  [
    ['02', 6.42, 2.42],
    ['03', 6.42, 3.70],
    ['04', 6.42, 4.98]
  ].forEach(([label, x, y]) => {
    const op = ops.find(candidate => candidate.name === 'addNumber'
      && candidate.args[1] === label
      && Math.abs((candidate.args[2] || {}).x - x) < 0.001
      && Math.abs((candidate.args[2] || {}).y - y) < 0.001);
    assert(op, `expected featured row number ${label}`);
  });
}

function main() {
  const ops = [];
  const ctx = createFakeCtx(ops);
  const renderers = createBeautyRenderers(ctx);
  assert.strictEqual(typeof renderers.productShowcase, 'function');
  assert.strictEqual(entries(renderers)[0].source, 'page-family:beauty');

  const plan = { title:'Beauty fixture' };
  const gridProducts = [1, 2, 3, 4].map(i => product(i, `/exists/product-${i}.jpg`));
  renderers.productShowcase(createSlide(ops), plan, {
    variant:'catalog-grid',
    catalogLayout:'grid-2x2',
    products:gridProducts,
    title:'Catalog Grid'
  }, 1);
  renderers.productShowcase(createSlide(ops), plan, {
    variant:'catalog-grid',
    products:[product(1, '/exists/lead.jpg'), product(2), product(3), product(4)],
    title:'Catalog Featured'
  }, 2);
  renderers.productShowcase(createSlide(ops), plan, {
    variant:'catalog-grid',
    products:[product(1), product(2), product(3), product(4), product(5)],
    title:'Catalog Cards'
  }, 3);
  renderers.productShowcase(createSlide(ops), plan, {
    variant:'feature-strip',
    imagePath:'/exists/feature.jpg',
    products:[product(1), product(2), product(3), product(4)],
    title:'Feature Strip'
  }, 4);
  renderers.productShowcase(createSlide(ops), plan, {
    variant:'hero-object',
    product:product(1),
    features:[product(1), product(2), product(3)],
    title:'Hero Object'
  }, 5);

  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'PRODUCT LINEUP'), 'expected catalog branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'PRODUCT SYSTEM'), 'expected feature-strip branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'PRODUCT HERO'), 'expected hero branch');
  assert(ops.some(op => op.name === 'addSmartPhotoPanel'), 'expected product image rendering path');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected product placeholder path');
  assertBeautyHeaders(ops);
  assertCatalogFeaturedListShell(ops);
  assertCatalogGridCardsShell(ops);
  assertProductHeroShell(ops);
  assertBeautyFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected beauty renderer text output');

  console.log('beauty renderers ok');
}

main();
