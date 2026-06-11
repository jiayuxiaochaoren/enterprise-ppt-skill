#!/usr/bin/env node
const assert = require('assert');
const {
  createStrategyRenderers,
  entries,
  types
} = require('./render/page-families/strategy');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addArrowLine: (...args) => record('addArrowLine', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkLine:'334155',
      darkMuted:'94A3B8',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      softBlue:'EFF6FF',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    footerText: () => 'Footer',
    galleryImages: () => [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    glassPanel: (...args) => record('glassPanel', args),
    industryProfile: () => ({ coreTitle:'Industry core', coreBody:'Industry body' }),
    itemBody: (item = {}) => item.body || item.note || '',
    itemTitle: (item = {}, fallback = '') => {
      if (typeof item === 'string') return item;
      return item.title || item.label || item.value || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function strategySection(overrides = {}) {
  return {
    title:'Strategy section',
    claim:'Strategy claim',
    drivers:[
      { title:'Input 1', body:'Input body 1' },
      { title:'Input 2', body:'Input body 2' }
    ],
    actions:[
      { title:'Action 1', body:'Action body 1' },
      { title:'Action 2', body:'Action body 2' },
      { title:'Action 3', body:'Action body 3' }
    ],
    outcomes:[
      { title:'Outcome 1', body:'Outcome body 1' },
      { title:'Outcome 2', body:'Outcome body 2' }
    ],
    cards:[
      { title:'Capability 1', body:'Capability body 1' },
      { title:'Capability 2', body:'Capability body 2' },
      { title:'Capability 3', body:'Capability body 3' },
      { title:'Capability 4', body:'Capability body 4' }
    ],
    metrics:[
      { value:'42%', label:'Growth' },
      { value:'18', label:'Markets' }
    ],
    ...overrides
  };
}

function hasOp(ops, name, value) {
  return ops.some(op => op.name === name && op.args.includes(value));
}

function assertStrategyFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 5, 'expected one footer per exercised strategy branch');
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'strategy footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'strategy footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'strategy footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'strategy footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'strategy footer font size should use primitive default');
  });
  assert.equal(footers.filter(op => op.args[2].color === '64748B').length, 4);
  assert.equal(footers.filter(op => op.args[2].color === '738297').length, 1);
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
  if (expected.fit != null) assert.equal(opts.fit, expected.fit);
  if (expected.bold != null) assert.equal(opts.bold, expected.bold);
}

function assertDefaultStrategyHeader(ops) {
  assertHeaderText(ops, 'Strategy section', {
    x:0.84, y:1.05, w:5.7, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Strategy claim', {
    x:0.86, y:1.52, w:6.6, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageOp = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '01') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageOp, 'expected default strategy page number 01');
  const opts = pageOp.args[2] || {};
  assertNear(opts.fontSize, 13, '01 page number font');
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertDefaultStrategyMapShell(ops) {
  [
    [0.92, 2.10, 2.50, 3.86],
    [4.16, 1.96, 4.02, 4.14],
    [8.72, 2.10, 2.92, 3.86]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addRect') return false;
      return candidate.args[1] === x
        && candidate.args[2] === y
        && candidate.args[3] === w
        && candidate.args[4] === h;
    });
    assert(op, `expected default strategy map panel ${x}/${y}`);
  });
  ['INPUT', 'OPERATING MODEL', 'OUTCOME'].forEach(label => {
    assert(hasOp(ops, 'addLabel', label), `expected default strategy map label ${label}`);
  });
  ['Input 1', 'Action 1', 'Outcome 1'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected default strategy map item ${text}`
    );
  });
  const firstAction = ops.find(op => op.name === 'addRect'
    && op.args[1] === 4.50
    && op.args[2] === 3.58
    && op.args[3] === 3.36
    && op.args[4] === 0.34);
  assert(firstAction, 'expected default strategy operating model action row');
  const arrows = ops.filter(op => op.name === 'addArrowLine' && op.args[2] === 4.02);
  assert.equal(arrows.length, 2, 'expected default strategy map connector arrows');
}

function assertCapabilityHeader(ops) {
  assertHeaderText(ops, 'Capability section', {
    x:0.84, y:1.05, w:4.8, h:0.35, fontSize:24, bold:true, color:'111827'
  });
  assertHeaderText(ops, 'Capability intro', {
    x:0.86, y:1.52, w:5.2, h:0.22, fontSize:10.8, color:'64748B'
  });
  ['Capability section', 'Capability intro'].forEach(text => {
    const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
    assert(op, `expected ${text}`);
    assert.equal(op.args[2].fit, undefined, `${text} should preserve no fit option`);
  });
  const pageOp = ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== '02') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageOp, 'expected capability text page number 02');
  const opts = pageOp.args[2] || {};
  assertNear(opts.fontSize, 13, '02 page number font');
  assert.equal(opts.bold, true);
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertBrandWorldHeader(ops) {
  assertHeaderText(ops, 'Brand proof', {
    x:0.84, y:1.05, w:6.2, h:0.35, fontSize:23.5, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Brand claim', {
    x:0.86, y:1.52, w:7.1, h:0.20, fontSize:9.6, color:'64748B', fit:'shrink'
  });
  assert(
    ops.some(op => op.name === 'PageNumber' && op.args[1] === 3),
    'expected brand proof to keep chrome PageNumber helper'
  );
}

function assertBrandWorldShell(ops) {
  const findRect = (x, y, w, h) => ops.find(candidate => {
    if (candidate.name !== 'addRect') return false;
    return Math.abs(candidate.args[1] - x) < 0.001
      && Math.abs(candidate.args[2] - y) < 0.001
      && Math.abs(candidate.args[3] - w) < 0.001
      && Math.abs(candidate.args[4] - h) < 0.001;
  });

  assert(findRect(0.92, 2.04, 4.72, 4.02), 'expected brand world hero panel');
  assert(findRect(6.18, 2.04, 5.26, 4.02), 'expected brand proof board');
  assert(!findRect(0.92, 6.28, 10.86, 0.42), 'brand proof link strip should not render in delivery pages');
  assert(
    !ops.some(op => op.name === 'genericShowcaseField' && op.args[5] === 'BRAND WORLD'),
    'brand world should use structured content instead of the generic showcase fallback'
  );

  ['品牌信号', '经营动作', '业务证明', '经营主线'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected brand world label ${label}`
    );
  });
  ['BRAND SIGNAL', 'OPERATING ACTION', 'BUSINESS PROOF'].forEach(label => {
    assert(
      !ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `brand world board should not leak hard-coded English label ${label}`
    );
  });
  assert(
    !ops.some(op => op.name === 'addLabel' && op.args[1] === 'BRAND WORLD'),
    'structured no-image brand world card should not draw the old overlapping BRAND WORLD label'
  );
  assert(
    !ops.some(op => op.name === 'addLabel' && op.args[1] === 'PROOF LINK'),
    'brand world should not emit the legacy PROOF LINK label'
  );

  ['Input 1', 'Action 1', 'Outcome 1', '把品牌主张、渠道动作和复购质量放在同一张经营看板里判断。'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected brand world content ${text}`
    );
  });
}

function assertValueCreationHeader(ops) {
  assertHeaderText(ops, 'Value process', {
    x:0.84, y:1.05, w:6.0, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Value process claim', {
    x:0.86, y:1.52, w:6.8, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageOp = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '04') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageOp, 'expected value creation page number 04');
  const opts = pageOp.args[2] || {};
  assertNear(opts.fontSize, 13, '04 page number font');
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertSingleObjectHeader(ops) {
  assertHeaderText(ops, 'Single object', {
    x:0.82, y:1.06, w:5.90, h:0.38, fontSize:24, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertHeaderText(ops, 'Single object claim', {
    x:0.84, y:1.54, w:5.70, h:0.20, fontSize:9.8, color:'CBD5E1', fit:'shrink'
  });
  const pageOp = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '05') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.74 && opts.w === 0.62 && opts.h === 0.18;
  });
  assert(pageOp, 'expected single object page number 05');
  const opts = pageOp.args[2] || {};
  assertNear(opts.fontSize, 11.5, '05 page number font');
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function main() {
  const ops = [];
  const renderers = createStrategyRenderers(createFakeCtx(ops));
  assert.deepEqual(types, ['strategy-map', 'module-matrix']);
  assert.equal(entries(renderers).length, 2);
  ['strategyMap', 'moduleMatrix', 'brandWorldBusinessProof', 'valueCreationProcessMapSlide', 'singleObjectConceptMapSlide'].forEach(name => {
    assert.equal(typeof renderers[name], 'function', `${name} should be exported`);
  });

  renderers.strategyMap(createSlide(ops), {}, strategySection(), 1);
  renderers.moduleMatrix(createSlide(ops), {}, strategySection({
    title:'Capability section',
    intro:'Capability intro'
  }), 2);
  renderers.strategyMap(createSlide(ops), {}, strategySection({
    title:'Brand proof',
    claim:'Brand claim',
    variant:'brand-world-and-business-proof'
  }), 3);
  renderers.strategyMap(createSlide(ops), {}, strategySection({
    title:'Value process',
    claim:'Value process claim',
    variant:'value-creation-process-map'
  }), 4);
  renderers.strategyMap(createSlide(ops), {}, strategySection({
    title:'Single object',
    claim:'Single object claim',
    variant:'single-object-concept-map'
  }), 5);

  assert(hasOp(ops, 'sectionKicker', 'VALUE CREATION MAP'), 'expected default strategy map branch');
  assert(hasOp(ops, 'sectionKicker', 'CAPABILITY MAP'), 'expected module matrix branch');
  assert(hasOp(ops, 'sectionKicker', 'BRAND WORLD / BUSINESS PROOF'), 'expected evidence strategy branch');
  assert(hasOp(ops, 'sectionKicker', 'VALUE CREATION PROCESS'), 'expected value creation strategy branch');
  assert(hasOp(ops, 'sectionKicker', 'SINGLE OBJECT MAP'), 'expected single object strategy branch');
  assert(ops.some(op => op.name === 'glassPanel'), 'expected module matrix glass panel');
  assert(!ops.some(op => op.name === 'genericShowcaseField' && op.args[5] === 'BRAND WORLD'), 'brand proof should not use generic evidence fallback');
  assert(ops.filter(op => op.name === 'addArrowLine').length >= 2, 'expected strategy arrows');
  assertDefaultStrategyHeader(ops);
  assertDefaultStrategyMapShell(ops);
  assertCapabilityHeader(ops);
  assertBrandWorldHeader(ops);
  assertBrandWorldShell(ops);
  assertValueCreationHeader(ops);
  assertSingleObjectHeader(ops);
  assertStrategyFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected strategy text output');

  console.log('strategy renderers ok');
}

main();
