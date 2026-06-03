#!/usr/bin/env node
const assert = require('assert');
const {
  createBusinessRenderers,
  entries,
  reportBoardItems,
  types
} = require('./render/page-families/business');

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
    addText: (...args) => record('addText', args),
    addVisualPhotoPanel: (...args) => {
      record('addVisualPhotoPanel', args);
      return false;
    },
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkMuted:'94A3B8',
      ink:'0F172A',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      paper:'F7FAFD',
      softBlue:'EFF6FF',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    copyFallback: (_plan, key, fallback = '') => fallback || key,
    footerText: () => 'Footer',
    itemBody: (item = {}, fallback = '') => item.body || item.summary || item.note || fallback,
    itemTitle: (item = {}, fallback = '') => item.title || item.label || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    premiumTitle: value => value,
    profileFont: () => 'Fixture Sans',
    publicSlideNote: value => value || '',
    reportBoardNeedsRightOverlayRail: () => false,
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function businessSection(overrides = {}) {
  return {
    title:'Business section',
    intro:'Business intro',
    claim:'Business claim',
    note:'Business note',
    cards:[
      { title:'Card 1', body:'Card body 1' },
      { title:'Card 2', body:'Card body 2' },
      { title:'Card 3', body:'Card body 3' },
      { title:'Card 4', body:'Card body 4' }
    ],
    ...overrides
  };
}

function assertBusinessFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 5, 'expected five business footer draws across exercised branches');

  const sidebar = footers.find(op => (op.args[2] || {}).x === 0.62);
  assert(sidebar, 'expected executive sidebar footer');
  assert.equal(sidebar.args[2].y, 6.86);
  assert.equal(sidebar.args[2].w, 2.6);
  assert.equal(sidebar.args[2].h, 0.14);
  assert.equal(sidebar.args[2].fontSize, 7.5);
  assert.equal(sidebar.args[2].color, '64748B');

  const standardFooters = footers.filter(op => (op.args[2] || {}).x === 0.82);
  assert.equal(standardFooters.length, 4, 'expected four standard business footers');
  standardFooters.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.y, 7.05);
    assert.equal(opts.w, 7.8);
    assert.equal(opts.h, 0.16);
    assert.equal(opts.fontSize, 7.8);
  });
  assert.equal(standardFooters.filter(op => op.args[2].color === '64748B').length, 3);
  assert.equal(standardFooters.filter(op => op.args[2].color === '738297').length, 1);
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
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
  if (expected.bold != null) assert.strictEqual(opts.bold, expected.bold, `${text} bold`);
  if (expected.color) assert.strictEqual(opts.color, expected.color, `${text} color`);
  if (expected.fit) assert.strictEqual(opts.fit, expected.fit, `${text} fit`);
}

function assertComparisonHeader(ops) {
  assertHeaderText(ops, 'Comparison section', {
    x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Comparison claim', {
    x:0.86, y:1.52, w:6.4, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageNumber = ops.find(op => (
    op.name === 'addNumber'
    && op.args[1] === '04'
    && Math.abs(((op.args[2] || {}).x) - 11.70) < 0.001
  ));
  assert(pageNumber, 'expected comparison page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.x, 11.70, '04 page number x');
  assertNear(opts.y, 0.66, '04 page number y');
  assertNear(opts.w, 0.72, '04 page number width');
  assertNear(opts.h, 0.22, '04 page number height');
  assertNear(opts.fontSize, 13, '04 page number font');
  assert.strictEqual(opts.color, '2563EB', '04 page number color');
  assert.strictEqual(opts.align, 'right', '04 page number align');
}

function assertReportBoardHeader(ops) {
  assertHeaderText(ops, 'Business section', {
    x:0.84, y:1.04, w:6.2, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Business claim', {
    x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  [2, 3].forEach(value => {
    const pageNumber = ops.find(op => op.name === 'PageNumber' && op.args[1] === value);
    assert(pageNumber, `expected report board PageNumber ${value}`);
    assert.deepEqual(pageNumber.args[2], {}, `expected report board PageNumber ${value} opts`);
  });
}

function assertValueTilesHeader(ops) {
  assertHeaderText(ops, 'Value section', {
    x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:'111827'
  });
  assertHeaderText(ops, 'Value intro', {
    x:0.86, y:1.52, w:5.7, h:0.22, fontSize:10.8, color:'64748B'
  });
  ['Value section', 'Value intro'].forEach(text => {
    const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
    assert(op, `expected ${text}`);
    assert.strictEqual(op.args[2].fit, undefined, `${text} should preserve no fit option`);
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== '05') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageNumber, 'expected value tiles text page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 13, '05 page number font');
  assert.strictEqual(opts.bold, true, '05 page number bold');
  assert.strictEqual(opts.color, '2563EB', '05 page number color');
  assert.strictEqual(opts.align, 'right', '05 page number align');
}

function main() {
  const ops = [];
  const renderers = createBusinessRenderers(createFakeCtx(ops));
  assert.deepEqual(types, ['cards', 'executive-blocks', 'comparison', 'report-board', 'value-tiles']);
  assert.equal(entries(renderers).length, 4);
  ['executiveBlocks', 'reportBoard', 'comparisonSlide', 'valueTiles'].forEach(name => {
    assert.equal(typeof renderers[name], 'function', `${name} should be exported`);
  });
  assert.deepEqual(reportBoardItems({ rows:[['A', 'B', 'C'], 'D'] }), [
    { title:'A', body:'C' },
    { title:'D', body:'' }
  ]);

  renderers.executiveBlocks(createSlide(ops), {}, businessSection(), 1);
  renderers.reportBoard(createSlide(ops), {}, businessSection({
    rows:[
      { title:'Short 1', body:'Short body 1' },
      { title:'Short 2', body:'Short body 2' },
      { title:'Short 3', body:'Short body 3' }
    ]
  }), 2);
  renderers.reportBoard(createSlide(ops), {}, businessSection(), 3);
  renderers.comparisonSlide(createSlide(ops), {}, businessSection({
    title:'Comparison section',
    claim:'Comparison claim',
    columns:[
      { title:'Before', items:['Slow', 'Manual', 'Opaque'] },
      { title:'After', items:['Fast', 'Automated', 'Visible'] }
    ]
  }), 4);
  renderers.valueTiles(createSlide(ops), {}, businessSection({
    title:'Value section',
    intro:'Value intro'
  }), 5);

  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'REPORT BOARD'), 'expected report board branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'COMPARISON'), 'expected comparison branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'VALUE SIGNAL'), 'expected value tiles branch');
  assertReportBoardHeader(ops);
  assertComparisonHeader(ops);
  assertValueTilesHeader(ops);
  assert(ops.filter(op => op.name === 'addVisualPhotoPanel').length >= 2, 'expected visual fallback paths');
  assert(ops.filter(op => op.name === 'PageNumber').length >= 2, 'expected page number helper paths');
  assertBusinessFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected business text output');

  console.log('business renderers ok');
}

main();
