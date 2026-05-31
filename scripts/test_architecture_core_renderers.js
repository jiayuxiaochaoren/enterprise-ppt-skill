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

  renderers.architectureDark(createSlide(ops), {}, { title:'System architecture', layers }, 3);
  renderers.architectureBlueprint(createSlide(ops), {}, { title:'Blueprint', layers }, 4);
  renderers.architectureHubSpoke(createSlide(ops), {}, {
    title:'Hub spoke',
    nodes: [
      { title:'Ops', body:'Daily flow' },
      { title:'Data', body:'Signals' },
      { title:'Governance', body:'Controls' }
    ]
  }, 5);

  assertKicker(ops, 'SYSTEM ARCHITECTURE');
  assertKicker(ops, 'SOLUTION BLUEPRINT');
  assertKicker(ops, 'CONNECTED ARCHITECTURE');
  assert(ops.some(op => op.name === 'lightCanvas'), 'expected blueprint light canvas');
  assert(ops.some(op => op.name === 'stageCanvas'), 'expected dark stage canvas');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'line'), 'expected architecture connector lines');
  assert(ops.filter(op => op.name === 'addText').length >= 35, 'expected architecture text output');

  assert.throws(
    () => createArchitectureCoreRenderers({ colors: () => ({ accent:'2563EB' }) }),
    /architecture core.*missing helpers.*addHairline.*missing colors/s
  );

  console.log('architecture core renderers ok');
}

main();
