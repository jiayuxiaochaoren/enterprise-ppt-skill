#!/usr/bin/env node
const assert = require('assert');
const {
  createManifestoRenderers,
  entries,
  types
} = require('./render/page-families/manifesto');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkMuted:'94A3B8',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      panelFill:'F8FAFC',
      softBlue:'EFF6FF',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    footerText: () => 'Footer',
    itemBody: item => (item && (item.body || item.note || item.text)) || '',
    itemTitle: (item, fallback = '') => {
      if (typeof item === 'string') return item;
      return (item && (item.title || item.label || item.value)) || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function section(overrides = {}) {
  return {
    title:'Manifesto Title',
    claim:'Manifesto claim',
    statement:'Manifesto statement',
    note:'Manifesto note',
    values:[
      { title:'Value 1', body:'Value body 1' },
      { title:'Value 2', body:'Value body 2' },
      { title:'Value 3', body:'Value body 3' },
      { title:'Value 4', body:'Value body 4' }
    ],
    ...overrides
  };
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

function assertValuePrincipleHeader(ops) {
  assertHeaderText(ops, 'Value Principle Header', {
    x:0.84, y:1.05, w:6.20, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Value principle claim', {
    x:0.86, y:1.52, w:6.70, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '04') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageNumber, 'expected value principle page number 04');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 13, '04 page number font');
  assert.strictEqual(opts.color, '2563EB', '04 page number color');
  assert.strictEqual(opts.align, 'right', '04 page number align');
}

function assertDarkManifestoPageNumbers(ops) {
  const defaultPage = ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== '01') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.76 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(defaultPage, 'expected default manifesto text page number 01');
  const defaultOpts = defaultPage.args[2] || {};
  assertNear(defaultOpts.fontSize, 13, '01 text page number font');
  assert.strictEqual(defaultOpts.bold, true, '01 text page number bold');
  assert.strictEqual(defaultOpts.color, '2563EB', '01 text page number color');
  assert.strictEqual(defaultOpts.align, 'right', '01 text page number align');

  ['02', '03'].forEach(value => {
    const pageNumber = ops.find(op => {
      if (op.name !== 'addNumber' || op.args[1] !== value) return false;
      const opts = op.args[2] || {};
      return opts.x === 11.70 && opts.y === 0.74 && opts.w === 0.62 && opts.h === 0.18;
    });
    assert(pageNumber, `expected manifesto number page number ${value}`);
    const opts = pageNumber.args[2] || {};
    assertNear(opts.fontSize, 11.5, `${value} number page font`);
    assert.strictEqual(opts.color, '2563EB', `${value} number page color`);
    assert.strictEqual(opts.align, 'right', `${value} number page align`);
  });
}

function assertDarkManifestoStageShells(ops) {
  const stageFields = ops
    .filter(op => op.name === 'stageCanvas')
    .map(op => (op.args[1] || {}).field);
  assert.deepEqual(stageFields, [true, true, false], 'expected manifesto dark stage field contract');

  const coverCircle = ops.find(op => {
    if (op.name !== 'addDarkBreathingCircle') return false;
    const args = op.args;
    return args[1] === 8.66 && args[2] === 0.34 && args[3] === 4.12 && args[4] === 2.34 && args[5] === '2563EB';
  });
  assert(coverCircle, 'expected culture cover breathing circle to keep original geometry');

  [
    ['CULTURE MANIFESTO', { x:0.84, y:0.92, w:1.80, h:0.13, fontSize:6.8, charSpace:1.1 }],
    ['CULTURE COVER', { x:0.86, y:0.88, w:1.42, h:0.13, fontSize:7.0, charSpace:1.0 }],
    ['MISSION STAGE', { x:0.86, y:0.90, w:1.50, h:0.13, fontSize:7.0, charSpace:1.0 }]
  ].forEach(([label, expected]) => {
    const op = ops.find(candidate => candidate.name === 'addLabel' && candidate.args[1] === label);
    assert(op, `expected manifesto shell label ${label}`);
    const opts = op.args[2] || {};
    Object.entries(expected).forEach(([key, value]) => {
      assert.strictEqual(opts[key], value, `${label} ${key} should be preserved`);
    });
    assert.strictEqual(opts.color, '0891B2', `${label} color should be preserved`);
  });

  assert(
    !ops.some(op => op.name === 'addHairline'
      && op.args[1] === 0.88
      && op.args[2] === 3.54
      && op.args[3] === 0.86),
    'manifesto pages should not render a decorative mid-page accent hairline'
  );
  assert(
    !ops.some(op => op.name === 'addRect'
      && op.args[1] === 0.88
      && op.args[2] === 3.30
      && op.args[3] === 0.94
      && op.args[4] === 0.05),
    'mission stage should not render a decorative accent bar below the subtitle'
  );
  assert(
    !ops.some(op => op.name === 'addRect'
      && op.args[1] === 1.96
      && op.args[2] === 3.30
      && op.args[3] === 0.34
      && op.args[4] === 0.05),
    'mission stage should not render a decorative cyan bar below the subtitle'
  );
}

function assertManifestoFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 4, 'expected one footer per manifesto branch');
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'manifesto footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'manifesto footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'manifesto footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'manifesto footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'manifesto footer font size should use primitive default');
    assert.equal(opts.color, '64748B', 'manifesto footer color should use muted token');
  });
}

function main() {
  const ops = [];
  const renderers = createManifestoRenderers(createFakeCtx(ops));
  assert.deepEqual(types, ['manifesto']);
  assert.equal(typeof renderers.manifestoSlide, 'function');
  assert.equal(entries(renderers)[0].render, renderers.manifestoSlide);

  renderers.manifestoSlide(createSlide(ops), {}, section(), 1);
  renderers.manifestoSlide(createSlide(ops), {}, section({ variant:'culture-cover-with-soft-geometry' }), 2);
  renderers.manifestoSlide(createSlide(ops), {}, section({ variant:'mission-statement-stage' }), 3);
  renderers.manifestoSlide(createSlide(ops), {}, section({
    variant:'value-principle-cards',
    title:'Value Principle Header',
    claim:'Value principle claim'
  }), 4);

  assert(ops.some(op => op.name === 'addLabel' && op.args[1] === 'CULTURE MANIFESTO'), 'expected default manifesto branch');
  assert(ops.some(op => op.name === 'addLabel' && op.args[1] === 'CULTURE COVER'), 'expected culture cover branch');
  assert(ops.some(op => op.name === 'addLabel' && op.args[1] === 'MISSION STAGE'), 'expected mission branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'VALUE PRINCIPLE CARDS'), 'expected value principle branch');
  assert(ops.some(op => op.name === 'lightCanvas'), 'expected value principle light canvas');
  assertDarkManifestoStageShells(ops);
  assertDarkManifestoPageNumbers(ops);
  assertValuePrincipleHeader(ops);
  assertManifestoFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 35, 'expected manifesto text output');

  console.log('manifesto renderers ok');
}

main();
