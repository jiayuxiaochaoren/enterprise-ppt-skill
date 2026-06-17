#!/usr/bin/env node
const assert = require('assert');
const {
  createTimelineRenderers
} = require('./render/page-families/timeline');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    addArrowLine: (...args) => record('addArrowLine', args),
    addClockwiseLoopConnectors: (...args) => record('addClockwiseLoopConnectors', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      darkMuted: '94A3B8',
      ink: '0F172A',
      ink2: '111827',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    compactEvidenceCaption: value => String(value || ''),
    footerText: () => 'Footer',
    itemBody: value => (value && (value.body || value.note || value.text)) || '',
    itemTitle: (value, fallback = '') => (value && (value.title || value.name || value.label)) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: (_section, fallback = '') => fallback
  };
}

function section() {
  return {
    title: 'Operating Path',
    subtitle: 'Process board subtitle',
    phases: [
      { title:'Discover', body:'Find the signal' },
      { title:'Decide', body:'Choose the action' },
      { title:'Run', body:'Execute the motion' },
      { title:'Review', body:'Fold learning back' }
    ],
    note: 'Review cadence stays visible.'
  };
}

function assertKicker(ops, text) {
  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === text),
    `expected section kicker ${text}`
  );
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

function assertProcessBoardHeader(ops) {
  assert.equal(ops.filter(op => op.name === 'lightCanvas').length, 1, 'expected one primitive light timeline header');
  assertHeaderText(ops, 'Operating Path', {
    x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Process board subtitle', {
    x:0.86, y:1.52, w:6.1, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageOp = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '03') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageOp, 'expected process board page number 03');
  const opts = pageOp.args[2] || {};
  assertNear(opts.fontSize, 13, '03 page number font');
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertDarkTimelinePageNumber(ops, value) {
  const pageOp = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== value) return false;
    const opts = op.args[2] || {};
    return opts.x === 11.76 && opts.y === 0.74 && opts.w === 0.58 && opts.h === 0.18;
  });
  assert(pageOp, `expected dark timeline page number ${value}`);
  const opts = pageOp.args[2] || {};
  assertNear(opts.fontSize, 11.5, `${value} dark page number font`);
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertDarkTimelineHeaders(ops) {
  assertHeaderText(ops, 'Operating Path', {
    x:0.82, y:1.06, w:6.2, h:0.40, fontSize:24, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertHeaderText(ops, 'Process board subtitle', {
    x:0.84, y:1.54, w:5.9, h:0.20, fontSize:10.4, color:'94A3B8', fit:'shrink'
  });
  assertDarkTimelinePageNumber(ops, '01');

  assertHeaderText(ops, 'Operating Path', {
    x:0.82, y:1.06, w:6.9, h:0.38, fontSize:24, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertHeaderText(ops, 'Process board subtitle', {
    x:0.84, y:1.54, w:6.2, h:0.20, fontSize:10.2, color:'94A3B8', fit:'shrink'
  });
  assertDarkTimelinePageNumber(ops, '02');

  assertHeaderText(ops, 'Operating Path', {
    x:0.82, y:1.04, w:7.55, h:0.40, fontSize:23.2, bold:true, color:'FFFFFF', fit:'shrink'
  });
  const pathwayPage = ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== '04') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.76 && opts.y === 0.74 && opts.w === 0.58 && opts.h === 0.18;
  });
  assert(pathwayPage, 'expected pathway text page number 04');
  const opts = pathwayPage.args[2] || {};
  assertNear(opts.fontSize, 11.5, '04 pathway page number font');
  assert.equal(opts.bold, true);
  assert.equal(opts.color, '94A3B8');
  assert.equal(opts.align, 'right');
}

function assertClosedLoopShell(ops) {
  const board = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.04
    && op.args[3] === 10.84
    && op.args[4] === 4.18);
  assert(board, 'expected closed-loop board shell');

  [
    [1.22, 2.74, 2.46, 1.06],
    [8.46, 2.74, 2.46, 1.06],
    [8.46, 4.78, 2.46, 1.06],
    [1.22, 4.78, 2.46, 1.06]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected closed-loop phase card ${x}/${y}`);
  });

  [
    ['动作 · 数据 · 复盘', { x:1.22, y:2.32, w:3.10, h:0.10, fontSize:5.8, color:'64748B', charSpace:0 }],
    ['复盘回到下一轮动作', { x:5.28, y:4.295, w:2.12, h:0.09, fontSize:5.2, color:'64748B', align:'center', charSpace:0 }],
    ['动作顺序 01 → 02 → 03 → 04 → 01', { x:8.40, y:2.32, w:3.06, h:0.10, fontSize:5.3, color:'94A3B8', align:'right', charSpace:0 }]
  ].forEach(([label, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addLabel' || candidate.args[1] !== label) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => (
        typeof value === 'number'
          ? Math.abs(opts[key] - value) < 0.001
          : opts[key] === value
      ));
    });
    assert(op, `expected closed-loop label ${label}`);
  });

  const center = ops.find(op => {
    if (op.name !== 'addShape' || op.args[0] !== 'ellipse') return false;
    const opts = op.args[1] || {};
    return Math.abs(opts.x - 5.00) < 0.001
      && Math.abs(opts.y - 3.49) < 0.001
      && Math.abs(opts.w - 2.68) < 0.001
      && Math.abs(opts.h - 1.40) < 0.001;
  });
  assert(center, 'expected closed-loop center ellipse');

  ['闭环复盘', 'Discover', 'Decide', 'Run', 'Review', 'Find the signal', 'Fold learning back', 'Review cadence stays visible.'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected closed-loop content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createTimelineRenderers(createFakeCtx(ops));
  [
    'timelineClosedLoop',
    'timelineFlywheel',
    'timelineProcessBoard',
    'timelineDark'
  ].forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.timelineClosedLoop(createSlide(ops), {}, section(), 1);
  renderers.timelineFlywheel(createSlide(ops), {}, section(), 2);
  renderers.timelineProcessBoard(createSlide(ops), {}, section(), 3);
  renderers.timelineDark(createSlide(ops), {}, section(), 4);

  assertKicker(ops, '经营动作闭环');
  assertKicker(ops, 'OPERATING FLYWHEEL');
  assertKicker(ops, 'PROCESS BOARD');
  assertKicker(ops, 'PATHWAY');
  assert(ops.some(op => op.name === 'addClockwiseLoopConnectors'), 'expected closed-loop connectors');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected flywheel arrow lines');
  assertDarkTimelineHeaders(ops);
  assertClosedLoopShell(ops);
  assertProcessBoardHeader(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 40, 'expected timeline text output');
  assert.strictEqual(
    ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer').length,
    4,
    'expected one primitive footer per timeline renderer'
  );
  ['ACTION · DATA · REVIEW', 'DATA BACK TO ACTION', 'SEQUENCE 01 → 02 → 03 → 04 → 01'].forEach(text => {
    assert.equal(
      ops.some(op => op.args.includes(text)),
      false,
      `closed-loop renderer should not leak English template label ${text}`
    );
  });

  console.log('timeline renderers ok');
}

main();
