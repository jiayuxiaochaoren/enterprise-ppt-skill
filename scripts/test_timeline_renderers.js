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

function section(overrides = {}) {
  return {
    title: 'Operating Path',
    subtitle: 'Process board subtitle',
    phases: [
      { title:'Discover', body:'Find the signal' },
      { title:'Decide', body:'Choose the action' },
      { title:'Run', body:'Execute the motion' },
      { title:'Review', body:'Fold learning back' }
    ],
    note: 'Review cadence stays visible.',
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
    ['动作 · 数据 · 复盘', { x:1.22, y:2.30, w:3.10, h:0.10, fontSize:5.8, color:'64748B', charSpace:0 }],
    ['复盘回到下一轮动作', { x:5.28, y:4.295, w:2.12, h:0.09, fontSize:5.2, color:'64748B', align:'center', charSpace:0 }]
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
  assert(
    !ops.some(op => op.name === 'addLabel' && op.args[1] === '动作顺序 01 → 02 → 03 → 04 → 01'),
    'closed-loop arrows should carry sequence without a redundant sequence label'
  );

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

function assertClosedLoopLongTitleReflow() {
  const ops = [];
  const renderers = createTimelineRenderers(createFakeCtx(ops));
  const longSection = section({
    title:'制造交付要把项目、安装、验收和维保放进同一闭环',
    subtitle:'把需求、安装、验收和维保放进同一条经营路径，项目经验才能被持续复用。',
    note:''
  });

  renderers.timelineClosedLoop(createSlide(ops), { industry:'manufacturing-operations' }, longSection, 6);

  const board = ops.find(op => op.name === 'addRect'
    && Math.abs(op.args[1] - 0.92) < 0.001
    && Math.abs(op.args[3] - 10.84) < 0.001
    && Math.abs(op.args[4] - (6.58 - op.args[2])) < 0.01);
  assert(board, 'expected long-title closed-loop board shell');
  assert(board.args[2] > 2.20, 'expected long-title closed-loop board to move below the header');

  const subtitleOp = ops.find(op => op.name === 'addText' && op.args[1] === longSection.subtitle);
  assert(subtitleOp, 'expected long-title closed-loop subtitle');
  const subtitleOpts = subtitleOp.args[2] || {};
  assert(
    board.args[2] >= subtitleOpts.y + subtitleOpts.h + 0.20,
    'closed-loop board should sit below the wrapped subtitle with a visible gap'
  );

  const topCard = ops.find(op => op.name === 'addRect'
    && Math.abs(op.args[1] - 1.22) < 0.001
    && Math.abs(op.args[3] - 2.46) < 0.001
    && Math.abs(op.args[4] - 1.14) < 0.001);
  assert(topCard, 'expected long-title closed-loop phase card');
  assert(topCard.args[2] > 2.90, 'expected top closed-loop card to move down with the board');
  const bottomCard = ops.find(op => op.name === 'addRect'
    && Math.abs(op.args[1] - 8.46) < 0.001
    && Math.abs(op.args[3] - 2.46) < 0.001
    && Math.abs(op.args[4] - 1.14) < 0.001
    && op.args[2] > 4.90);
  assert(bottomCard, 'expected bottom closed-loop card to move lower instead of compressing the middle gap');
  assert(
    bottomCard.args[2] - (topCard.args[2] + topCard.args[4]) > 0.55,
    'long-title closed-loop cards should keep a usable middle gap'
  );
  const returnLabel = ops.find(op => op.name === 'addText' && op.args[1] === '资料回流');
  assert(returnLabel, 'expected manufacturing return-flow label');
  const returnOpts = returnLabel.args[2] || {};
  assert(
    returnOpts.y > topCard.args[2] + topCard.args[4] + 0.08,
    'return-flow label should sit below the upper card instead of colliding with its border'
  );
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
  const arrowOps = ops.filter(op => op.name === 'addArrowLine');
  assert(arrowOps.length >= 4, 'expected closed-loop arrow lines');
  const horizontalLoopSegments = arrowOps.filter(op => Math.abs(op.args[4]) < 0.001);
  assert(
    horizontalLoopSegments.some(op => op.args[1] < 4.0 && op.args[3] > 4.0),
    'closed-loop horizontal arrows should read as continuous perimeter rails instead of broken center stubs'
  );
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
  assertClosedLoopLongTitleReflow();

  const roomyOps = [];
  createTimelineRenderers(createFakeCtx(roomyOps)).timelineClosedLoop(createSlide(roomyOps), {}, section({
    note:'',
    centerLabel:'回到下一轮动作'
  }), 10);
  const roomyTopCard = roomyOps.find(op => op.name === 'addRect'
    && Math.abs(op.args[1] - 1.22) < 0.001
    && Math.abs(op.args[3] - 2.46) < 0.001
    && Math.abs(op.args[4] - 1.06) < 0.001);
  const roomyBottomCard = roomyOps.find(op => op.name === 'addRect'
    && Math.abs(op.args[1] - 8.46) < 0.001
    && Math.abs(op.args[3] - 2.46) < 0.001
    && Math.abs(op.args[4] - 1.06) < 0.001
    && op.args[2] > 5.0);
  assert(roomyTopCard && roomyBottomCard, 'expected no-note closed-loop cards to use the roomier layout');
  assert(
    roomyBottomCard.args[2] - (roomyTopCard.args[2] + roomyTopCard.args[4]) > 1.30,
    'no-note closed-loop layout should create enough center space around the loop object'
  );
  const roomyVerticalArrows = roomyOps.filter(op => op.name === 'addArrowLine'
    && Math.abs(op.args[3]) < 0.001
    && op.args[4] > 0.40);
  assert(roomyVerticalArrows.length >= 2, 'no-note closed-loop layout should keep visible vertical connectors');
  assert(
    roomyOps.some(op => op.name === 'addLabel' && op.args[1] === '回到下一轮动作'),
    'closed-loop center label should be configurable for shorter deck-specific copy'
  );

  console.log('timeline renderers ok');
}

main();
