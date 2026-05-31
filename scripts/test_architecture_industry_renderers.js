#!/usr/bin/env node
const assert = require('assert');
const {
  createArchitectureIndustryRenderers
} = require('./render/page-families/architecture-industry');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    addArrowLine: (...args) => record('addArrowLine', args),
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
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    footerText: () => 'Footer',
    itemBody: value => (value && (value.body || value.note || value.text)) || '',
    itemTitle: (value, fallback = '') => (value && (value.title || value.name || value.label)) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
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
  const renderers = createArchitectureIndustryRenderers(createFakeCtx(ops));
  const names = [
    'architectureServiceBlueprint',
    'architectureSaasCapabilityMap',
    'architectureManufacturingTopology'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.architectureServiceBlueprint(createSlide(ops), {}, {
    title: 'Service map',
    serviceBlueprint: [
      { title:'Book', patient:'Book online', frontstage:'Confirm need', backstage:'Schedule resources', evidence:'Wait time' },
      { title:'Visit', patient:'Check in', frontstage:'Guide flow', backstage:'Sync rooms', evidence:'Queue state' }
    ]
  }, 6);
  renderers.architectureSaasCapabilityMap(createSlide(ops), {}, {
    title: 'SaaS map',
    capabilities: [
      { title:'Workflow', body:'Core flow' },
      { title:'Automation', body:'Rules' },
      { title:'Workspace', body:'Team use' },
      { title:'Template', body:'Reuse' }
    ],
    layers: [
      { title:'入口', items:['Web', 'Admin', 'API'] },
      { title:'工作流', items:['Flow', 'Task', 'Review'] },
      { title:'数据', items:['Events', 'Audit', 'Metrics'] }
    ],
    metrics: [{ label:'Adoption', value:'72%' }]
  }, 7);
  renderers.architectureManufacturingTopology(createSlide(ops), {}, {
    title: 'Manufacturing topology',
    layers: [
      { title:'设备与现场层', items:['PLC', 'Sensor', 'Terminal'] },
      { title:'业务应用层', items:['Health', 'Work order', 'Parts'] },
      { title:'数据支撑层', items:['Device DB', 'Fault DB', 'OEE'] }
    ]
  }, 8);

  assertKicker(ops, 'SERVICE BLUEPRINT');
  assertKicker(ops, 'PLATFORM CAPABILITY MAP');
  assertKicker(ops, 'LINE SYSTEM TOPOLOGY');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected manufacturing topology arrows');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'ellipse'), 'expected SaaS capability center nodes');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'line'), 'expected SaaS capability connectors');
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected architecture text output');

  console.log('architecture industry renderers ok');
}

main();
