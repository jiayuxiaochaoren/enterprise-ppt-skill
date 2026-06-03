#!/usr/bin/env node
const assert = require('assert');
const {
  createArchitectureCoreRenderers
} = require('./render/page-families/architecture-core');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
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
    footerText: () => 'Footer',
    itemBody: value => (value && (value.body || value.note || value.text)) || '',
    itemTitle: (value, fallback = '') => (value && (value.title || value.name || value.label)) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args)
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

function assertBlueprintHeader(ops) {
  assertHeaderText(ops, 'Blueprint', {
    x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Blueprint claim', {
    x:0.86, y:1.52, w:6.1, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageNumber = ops.find(op => op.name === 'addNumber' && op.args[1] === '04');
  assert(pageNumber, 'expected blueprint page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.x, 11.70, '04 page number x');
  assertNear(opts.y, 0.66, '04 page number y');
  assertNear(opts.w, 0.72, '04 page number width');
  assertNear(opts.h, 0.22, '04 page number height');
  assertNear(opts.fontSize, 13, '04 page number font');
  assert.strictEqual(opts.color, '2563EB', '04 page number color');
  assert.strictEqual(opts.align, 'right', '04 page number align');
}

function assertConnectedHeader(ops) {
  assertHeaderText(ops, 'Hub spoke', {
    x:0.82, y:1.08, w:5.9, h:0.36, fontSize:24, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertHeaderText(ops, 'Hub claim', {
    x:0.84, y:1.55, w:5.5, h:0.22, fontSize:10.6, color:'94A3B8', fit:'shrink'
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '05') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.76 && opts.y === 0.74 && opts.w === 0.58 && opts.h === 0.18;
  });
  assert(pageNumber, 'expected connected architecture page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 11.5, '05 page number font');
  assert.strictEqual(opts.color, '2563EB', '05 page number color');
  assert.strictEqual(opts.align, 'right', '05 page number align');
}

function assertSystemHeader(ops) {
  assertHeaderText(ops, 'System architecture', {
    x:0.82, y:1.08, w:5.8, h:0.36, fontSize:24, bold:true, color:'FFFFFF'
  });
  assertHeaderText(ops, 'System subtitle', {
    x:0.84, y:1.55, w:5.4, h:0.22, fontSize:10.8, color:'94A3B8'
  });
  ['System architecture', 'System subtitle'].forEach(text => {
    const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
    assert(op, `expected ${text}`);
    assert.strictEqual(op.args[2].fit, undefined, `${text} should preserve no fit option`);
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== '03') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.76 && opts.y === 0.74 && opts.w === 0.58 && opts.h === 0.18;
  });
  assert(pageNumber, 'expected system architecture text page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 11.5, '03 page number font');
  assert.strictEqual(opts.bold, true, '03 page number bold');
  assert.strictEqual(opts.color, '64748B', '03 page number color');
  assert.strictEqual(opts.align, 'right', '03 page number align');
}

function assertArchitectureDarkShell(ops) {
  [
    [2.45, 2.10, 8.70, 0.58],
    [2.45, 3.18, 8.70, 1.18],
    [2.45, 5.02, 8.70, 0.64],
    [5.66, 3.33, 1.22, 0.78]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected architecture dark panel ${x}/${y}`);
  });

  ['ACCESS', 'APPLICATIONS', 'DATA FOUNDATION'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === label),
      `expected architecture layer label ${label}`
    );
  });

  ['Portal', 'Mobile', 'API', 'Workflow', 'Dispatch', 'Review', 'Ticket', 'Analytics', 'Events', 'Metrics', 'Assets', 'Alerts', '统一运营核心', '认证 · 流程 · 指标'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected architecture dark content ${text}`
    );
  });

  const coreConnector = ops.find(op => {
    if (op.name !== 'addShape' || op.args[0] !== 'line') return false;
    const opts = op.args[1] || {};
    return opts.x === 6.27 && opts.y === 4.11 && opts.w === 0 && opts.h === 0.91;
  });
  assert(coreConnector, 'expected architecture core vertical connector');
}

function main() {
  const ops = [];
  const renderers = createArchitectureCoreRenderers(createFakeCtx(ops));
  ['architectureDark', 'architectureBlueprint', 'architectureHubSpoke']
    .forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  const layers = [
    { title:'Access', items:['Portal', 'Mobile', 'API'] },
    { title:'Apps', items:['Workflow', 'Dispatch', 'Review', 'Ticket', 'Analytics'] },
    { title:'Data', items:['Events', 'Metrics', 'Assets', 'Alerts'] }
  ];

  renderers.architectureDark(createSlide(ops), {}, { title:'System architecture', subtitle:'System subtitle', layers }, 3);
  renderers.architectureBlueprint(createSlide(ops), {}, { title:'Blueprint', claim:'Blueprint claim', layers }, 4);
  renderers.architectureHubSpoke(createSlide(ops), {}, {
    title:'Hub spoke',
    claim:'Hub claim',
    nodes: [
      { title:'Ops', body:'Daily flow' },
      { title:'Data', body:'Signals' },
      { title:'Governance', body:'Controls' }
    ]
  }, 5);

  assertKicker(ops, 'SYSTEM ARCHITECTURE');
  assertKicker(ops, 'SOLUTION BLUEPRINT');
  assertKicker(ops, 'CONNECTED ARCHITECTURE');
  assertSystemHeader(ops);
  assertArchitectureDarkShell(ops);
  assertBlueprintHeader(ops);
  assertConnectedHeader(ops);
  assert(ops.some(op => op.name === 'lightCanvas'), 'expected blueprint light canvas');
  assert(ops.some(op => op.name === 'stageCanvas'), 'expected dark stage canvas');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'line'), 'expected architecture connector lines');
  assert(ops.filter(op => op.name === 'addText').length >= 35, 'expected architecture text output');
  assert.strictEqual(
    ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer').length,
    3,
    'expected one primitive footer per architecture renderer'
  );

  assert.throws(
    () => createArchitectureCoreRenderers({ colors: () => ({ accent:'2563EB' }) }),
    /architecture core.*missing helpers.*addHairline.*missing colors/s
  );

  console.log('architecture core renderers ok');
}

main();
