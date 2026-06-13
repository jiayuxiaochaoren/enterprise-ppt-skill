#!/usr/bin/env node
const assert = require('assert');
const {
  chapterItems
} = require('./render/page-families/chapter-content');
const {
  createChapterRenderers,
  entries,
  types
} = require('./render/page-families/chapter');

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
    canvasWidth: () => 13.333,
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
      panelAlt:'F1F5F9',
      softBlue:'EFF6FF',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    footerText: () => 'Footer',
    galleryImages: () => [],
    itemBody: item => (item && (item.body || item.note || item.text)) || '',
    itemTitle: (item, fallback = '') => {
      if (typeof item === 'string') return item;
      return (item && (item.title || item.label || item.value)) || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    profileFont: () => 'Aptos Display',
    publicSlideNote: value => value || '',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function section(overrides = {}) {
  return {
    title:'Chapter Title',
    subtitle:'Chapter subtitle',
    note:'Chapter note',
    items:[
      { title:'First', body:'First body' },
      { title:'Second', body:'Second body' },
      { title:'Third', body:'Third body' }
    ],
    ...overrides
  };
}

function hasOp(ops, name, value) {
  return ops.some(op => op.name === name && op.args.includes(value));
}

function assertChapterFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 7, 'expected one footer per chapter variant');
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'chapter footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'chapter footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'chapter footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'chapter footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'chapter footer font size should use primitive default');
  });
  assert.equal(
    footers.filter(op => op.args[2].color === '94A3B8').length,
    1,
    'expected dark hero footer color to be preserved'
  );
  assert.equal(
    footers.filter(op => op.args[2].color === '64748B').length,
    6,
    'expected standard layout footer color to be preserved'
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

function assertStandardPageNumber(ops, value) {
  const pageNumber = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== value) return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageNumber, `expected standard page number ${value}`);
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 13, `${value} page number font`);
  assert.strictEqual(opts.color, '2563EB', `${value} page number color`);
  assert.strictEqual(opts.align, 'right', `${value} page number align`);
}

function assertChapterLightHeaders(ops) {
  assertHeaderText(ops, 'Board Briefing Header', {
    x:0.84, y:1.06, w:6.20, h:0.40, fontSize:24.2, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Board briefing subtitle', {
    x:0.86, y:1.56, w:6.70, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  assertStandardPageNumber(ops, '03');

  assertHeaderText(ops, 'Service Path Header', {
    x:0.84, y:1.06, w:5.80, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Service path subtitle', {
    x:0.86, y:1.52, w:6.20, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  assertStandardPageNumber(ops, '04');

  assertHeaderText(ops, 'Adoption Path Header', {
    x:0.84, y:1.06, w:5.80, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Adoption path subtitle', {
    x:0.86, y:1.52, w:6.30, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  assertStandardPageNumber(ops, '07');
}

function assertAgendaChromePageNumber(ops) {
  const pageNumbers = ops.filter(op => op.name === 'PageNumber');
  assert.equal(pageNumbers.length, 1, 'expected agenda chrome page number');
  const op = pageNumbers[0];
  assert.equal(op.args[1], 2, 'agenda page number index should be forwarded');
  const opts = op.args[2] || {};
  assertNear(opts.fontSize, 11.5, 'agenda page number font');
}

function assertChapterHeroStageShell(ops) {
  const heroStage = ops.find(op => op.name === 'stageCanvas' && (op.args[1] || {}).field === true);
  assert(heroStage, 'expected chapter hero stage field to be preserved');
  const label = ops.find(op => {
    if (op.name !== 'addLabel' || op.args[1] !== 'CHAPTER') return false;
    const opts = op.args[2] || {};
    return opts.x === 0.86 && opts.y === 0.94 && opts.w === 1.38 && opts.h === 0.14;
  });
  assert(label, 'expected chapter hero label geometry');
  const opts = label.args[2] || {};
  assertNear(opts.fontSize, 8.2, 'chapter hero label font');
  assert.strictEqual(opts.color, '94A3B8', 'chapter hero label color');
  assertNear(opts.charSpace, 0.8, 'chapter hero label charSpace');
}

function assertChapterLayoutStageShells(ops) {
  const darkStages = ops.filter(op => op.name === 'stageCanvas' && (op.args[1] || {}).field === false);
  assert.equal(darkStages.length, 3, 'expected three dark chapter layout stages');

  [
    ['MEETING AGENDA', { x:0.86, y:0.90, w:1.64, h:0.13, fontSize:6.9, color:'0891B2', charSpace:1.0 }],
    ['LINE OPERATING PATH', { x:0.84, y:0.82, w:1.84, h:0.13, fontSize:6.9, color:'0891B2', charSpace:1.05 }]
  ].forEach(([label, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addLabel' || candidate.args[1] !== label) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => opts[key] === value);
    });
    assert(op, `expected chapter layout shell label ${label}`);
  });

  [
    ['agenda', { x:8.52, y:0.28, w:4.38, h:2.42 }],
    ['line', { x:8.40, y:0.70, w:4.10, h:2.24 }]
  ].forEach(([name, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addDarkBreathingCircle') return false;
      const args = candidate.args;
      return args[1] === expected.x && args[2] === expected.y && args[3] === expected.w && args[4] === expected.h && args[5] === '2563EB';
    });
    assert(op, `expected ${name} chapter breathing circle geometry`);
  });
}

function assertChapterEditorialShell(ops) {
  const assertEditorialText = (text, expected) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addText' || candidate.args[1] !== text) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => opts[key] === value);
    });
    assert(op, `expected editorial agenda text ${text}`);
  };

  const visual = ops.find(op => op.name === 'addRect'
    && op.args[1] === 6.36
    && op.args[2] === 1.02
    && op.args[3] === 5.72
    && op.args[4] === 4.98);
  assert(visual, 'expected editorial agenda visual map panel');
  [
    ['EDITORIAL AGENDA', { x:0.86, y:0.94, w:1.64, h:0.13, fontSize:7.1, color:'0891B2', charSpace:0.9 }],
    ['汇报路径', { x:6.70, y:1.36, w:1.18, h:0.12, fontSize:6.4, color:'2563EB', charSpace:0 }]
  ].forEach(([label, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addLabel' || candidate.args[1] !== label) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => opts[key] === value);
    });
    assert(op, `expected editorial agenda label ${label}`);
  });
  [
    { x:6.78, y:1.96, w:4.88, h:0.68 },
    { x:6.78, y:2.80, w:4.88, h:0.68 },
    { x:6.78, y:3.64, w:4.88, h:0.68 }
  ].forEach((rect, index) => {
    assert(hasRect(ops, rect), `expected editorial agenda path card ${index + 1}`);
  });

  assertHeaderText(ops, '05', {
    x:0.82, y:1.45, w:0.92, h:0.34, fontSize:22.5, bold:true, color:'2563EB', fit:'shrink'
  });
  assertEditorialText('Chapter Title', {
    x:0.86, y:2.10, w:4.85, h:0.45, fontSize:22.5, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertEditorialText('Chapter subtitle', {
    x:0.90, y:3.02, w:5.30, h:0.22, fontSize:10.5, color:'CBD5E1', fit:'shrink'
  });
}

function assertChapterBoardBriefingShell(ops) {
  const memo = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.14
    && op.args[3] === 10.64
    && op.args[4] === 1.28);
  assert(memo, 'expected board briefing meeting memo panel');

  const memoLine = ops.find(op => op.name === 'addHairline'
    && Math.abs(op.args[1] - 10.66) < 0.001
    && Math.abs(op.args[2] - 2.76) < 0.001
    && op.args[3] === 0.58
    && op.args[4] === '2563EB');
  assert(memoLine, 'expected board briefing memo hairline geometry');

  [
    [0.92, 4.02, 2.36, 1.84],
    [3.64, 4.02, 2.36, 1.84],
    [6.36, 4.02, 2.36, 1.84]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && Math.abs(candidate.args[1] - x) < 0.001
      && Math.abs(candidate.args[2] - y) < 0.001
      && Math.abs(candidate.args[3] - w) < 0.001
      && Math.abs(candidate.args[4] - h) < 0.001);
    assert(op, `expected board briefing decision card ${x}/${y}`);
  });

  ['MEETING MEMO', 'DECISION SEQUENCE'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected board briefing label ${label}`
    );
  });

  ['03', '审议路径', 'Chapter note', 'First', 'First body', 'Second', 'Second body', 'Third', 'Third body'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected board briefing content ${text}`
    );
  });
}

function hasRect(ops, expected) {
  return ops.some(op => op.name === 'addRect'
    && Math.abs(op.args[1] - expected.x) < 0.001
    && Math.abs(op.args[2] - expected.y) < 0.001
    && Math.abs(op.args[3] - expected.w) < 0.001
    && Math.abs(op.args[4] - expected.h) < 0.001);
}

function assertManufacturingLineAgendaShell(ops) {
  const rail = ops.find(op => op.name === 'addHairline'
    && Math.abs(op.args[1] - 1.94) < 0.001
    && Math.abs(op.args[2] - 3.42) < 0.001
    && Math.abs(op.args[3] - 9.453) < 0.001
    && op.args[4] === '334155');
  assert(rail, 'expected manufacturing line rail');

  [
    { x:0.86, y:4.08, w:2.16, h:1.02 },
    { x:5.5865, y:4.08, w:2.16, h:1.02 },
    { x:10.313, y:4.08, w:2.16, h:1.02 }
  ].forEach((rect, index) => {
    assert(hasRect(ops, rect), `expected manufacturing line card ${index + 1}`);
  });
  assert(hasRect(ops, { x:0.92, y:5.88, w:9.92, h:0.34 }), 'expected manufacturing line note panel');
  assert(
    ops.filter(op => op.name === 'addArrowLine' && Math.abs(op.args[2] - 3.42) < 0.001).length >= 2,
    'expected manufacturing line rail arrows'
  );
  ['能力路径', 'First', 'First body', 'Second', 'Second body', 'Third', 'Third body', 'Chapter note'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected manufacturing line content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createChapterRenderers(createFakeCtx(ops));
  assert.deepEqual(types, ['chapter-divider']);
  assert.equal(typeof renderers.chapterDivider, 'function');
  assert.equal(entries(renderers)[0].render, renderers.chapterDivider);
  assert.deepEqual(chapterItems({ items:['One', { title:'Two' }] }).map(item => item.title), ['One', 'Two']);

  [
    { variant:'chapter-hero' },
    { variant:'agenda-board' },
    { variant:'board-briefing', title:'Board Briefing Header', subtitle:'Board briefing subtitle' },
    { variant:'pathway-map', title:'Service Path Header', subtitle:'Service path subtitle' },
    { variant:'editorial-agenda' },
    { variant:'line-agenda' },
    { variant:'adoption-agenda', title:'Adoption Path Header', subtitle:'Adoption path subtitle' }
  ].forEach((variantSpec, index) => {
    renderers.chapterDivider(createSlide(ops), {}, section(variantSpec), index + 1);
  });

  assert(hasOp(ops, 'addLabel', 'CHAPTER'), 'expected default chapter hero');
  assert(hasOp(ops, 'addLabel', 'MEETING AGENDA'), 'expected agenda board branch');
  assert(hasOp(ops, 'sectionKicker', 'BOARD BRIEFING'), 'expected board briefing branch');
  assert(hasOp(ops, 'sectionKicker', 'SERVICE PATH'), 'expected pathway map branch');
  assert(hasOp(ops, 'addLabel', 'EDITORIAL AGENDA'), 'expected editorial agenda branch');
  assert(hasOp(ops, 'addLabel', 'LINE OPERATING PATH'), 'expected manufacturing line branch');
  assert(hasOp(ops, 'sectionKicker', 'ADOPTION PATH'), 'expected SaaS adoption branch');
  assertChapterLightHeaders(ops);
  assertChapterHeroStageShell(ops);
  assertChapterLayoutStageShells(ops);
  assertChapterEditorialShell(ops);
  assertChapterBoardBriefingShell(ops);
  assertManufacturingLineAgendaShell(ops);
  assertAgendaChromePageNumber(ops);
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected pathway arrows');
  assertChapterFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected chapter text output');

  const navOps = [];
  createChapterRenderers(createFakeCtx(navOps)).chapterDivider(createSlide(navOps), {}, section({
    variant:'chapter-hero',
    title:'汇报路径',
    chapter:'01',
    industryEvidenceChainMode:'native-only'
  }), 2);
  assert(
    navOps.some(op => op.name === 'addText' && op.args[1] === '导览'),
    'navigation chapter should display a guide marker instead of a fake chapter number'
  );
  assert(
    !navOps.some(op => op.name === 'addText' && op.args[1] === '01' && (op.args[2] || {}).x === 0.82),
    'navigation chapter should not repeat 01 beside page number 02'
  );

  console.log('chapter renderers ok');
}

main();
