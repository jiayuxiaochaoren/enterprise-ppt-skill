#!/usr/bin/env node
const assert = require('assert');
const {
  createArchitectureEnergyRenderers
} = require('./render/page-families/architecture-energy');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent: '2563EB',
      cyan: '0891B2',
      ink: '0F172A',
      ink2: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    footerText: () => 'Footer',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args)
  };
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertEnergyHeader(ops) {
  const title = ops.find(op => op.name === 'addText' && op.args[1] === 'Energy topology');
  assert(title, 'expected energy topology title');
  const titleOpts = title.args[2] || {};
  assertNear(titleOpts.x, 0.82, 'energy title x');
  assertNear(titleOpts.y, 1.06, 'energy title y');
  assertNear(titleOpts.w, 5.8, 'energy title width');
  assertNear(titleOpts.h, 0.36, 'energy title height');
  assertNear(titleOpts.fontSize, 24, 'energy title font');
  assert.strictEqual(titleOpts.bold, true, 'energy title bold');
  assert.strictEqual(titleOpts.color, 'FFFFFF', 'energy title color');
  assert.strictEqual(titleOpts.fit, undefined, 'energy title fit should remain unset');

  const subtitle = ops.find(op => op.name === 'addText' && op.args[1] === 'Dispatch loop');
  assert(subtitle, 'expected energy topology subtitle');
  const subtitleOpts = subtitle.args[2] || {};
  assertNear(subtitleOpts.x, 0.84, 'energy subtitle x');
  assertNear(subtitleOpts.y, 1.52, 'energy subtitle y');
  assertNear(subtitleOpts.w, 6.2, 'energy subtitle width');
  assertNear(subtitleOpts.h, 0.22, 'energy subtitle height');
  assertNear(subtitleOpts.fontSize, 10.8, 'energy subtitle font');
  assert.strictEqual(subtitleOpts.color, '94A3B8', 'energy subtitle color');
  assert.strictEqual(subtitleOpts.fit, undefined, 'energy subtitle fit should remain unset');

  const pageNumber = ops.find(op => op.name === 'addNumber' && op.args[1] === '05');
  assert(pageNumber, 'expected energy page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.x, 11.76, '05 page number x');
  assertNear(opts.y, 0.74, '05 page number y');
  assertNear(opts.w, 0.58, '05 page number width');
  assertNear(opts.h, 0.18, '05 page number height');
  assertNear(opts.fontSize, 11.5, '05 page number font');
  assert.strictEqual(opts.color, '64748B', '05 page number color');
  assert.strictEqual(opts.align, 'right', '05 page number align');
}

function assertEnergyTopologyShell(ops) {
  const frame = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.78
    && op.args[2] === 2.04
    && op.args[3] === 11.48
    && op.args[4] === 4.26);
  assert(frame, 'expected energy topology frame');
  ['REAL-TIME DATA FLOW', 'EDGE  →  DATA  →  DISPATCH  →  MANAGEMENT', 'OPERATING DATA BUS'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected energy topology label ${label}`
    );
  });
  ['PV', 'Protocols', '告警工单'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected energy topology text ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createArchitectureEnergyRenderers(createFakeCtx(ops));
  assert.strictEqual(typeof renderers.energyArchitecture, 'function', 'energyArchitecture should be exported');

  renderers.energyArchitecture(createSlide(ops), {}, {
    title: 'Energy topology',
    subtitle: 'Dispatch loop',
    layers: [
      { title:'Edge', items:['PV', 'PCS', 'BMS'] },
      { title:'Data', items:['Protocols', 'Metrics', 'Curves'] },
      { title:'Dispatch', items:['Alerts', 'Tickets', 'SOC'] },
      { title:'Management', items:['Sites', 'Yield', 'Crew'] }
    ]
  }, 5);

  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'ENERGY TOPOLOGY'),
    'expected energy topology section kicker'
  );
  assertEnergyHeader(ops);
  assertEnergyTopologyShell(ops);
  assert(ops.some(op => op.name === 'addDarkBreathingCircle'), 'expected dark energy backdrop');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'ellipse'), 'expected node markers');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'line'), 'expected connector lines');
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 1, 'expected one energy architecture footer');
  assert.deepEqual(
    footers[0].args[2],
    { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B', fit:undefined }
  );
  assert(ops.filter(op => op.name === 'addText').length >= 16, 'expected topology text output');

  console.log('architecture energy renderers ok');
}

main();
