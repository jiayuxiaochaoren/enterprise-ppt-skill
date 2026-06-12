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

function assertStandardFooters(ops, expectedCount) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, expectedCount, `expected ${expectedCount} architecture industry footers`);
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'architecture industry footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'architecture industry footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'architecture industry footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'architecture industry footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'architecture industry footer font size should use primitive default');
    assert.equal(opts.color, '64748B', 'architecture industry footer color should preserve muted token');
  });
}

function assertServiceBlueprintShell(ops) {
  const ribbon = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.04
    && op.args[3] === 10.84
    && op.args[4] === 0.60);
  assert(ribbon, 'expected service blueprint journey ribbon');
  const board = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.86
    && op.args[3] === 10.84
    && op.args[4] === 3.36);
  assert(board, 'expected service blueprint board panel');
  ['CARE JOURNEY', 'TOUCHPOINTS · FRONTSTAGE · BACKSTAGE · QUALITY'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected service blueprint label ${label}`
    );
  });
  ['患者动作', '前台服务', '后台协同', '质量证据', 'Book', 'Wait time'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected service blueprint text ${text}`
    );
  });
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
    subtitle: 'Service blueprint subtitle',
    serviceBlueprint: [
      { title:'Book', patient:'Book online', frontstage:'Confirm need', backstage:'Schedule resources', evidence:'Wait time' },
      { title:'Visit', patient:'Check in', frontstage:'Guide flow', backstage:'Sync rooms', evidence:'Queue state' }
    ]
  }, 6);
  renderers.architectureSaasCapabilityMap(createSlide(ops), {}, {
    title: 'SaaS map',
    subtitle: 'SaaS capability subtitle',
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
    subtitle: 'Manufacturing topology subtitle',
    layers: [
      { title:'设备与现场层', items:['PLC', 'Sensor', 'Terminal'] },
      { title:'业务应用层', items:['Health', 'Work order', 'Parts'] },
      { title:'数据支撑层', items:['Device DB', 'Fault DB', 'OEE'] }
    ]
  }, 8);

  function assertNear(actual, expected, label) {
    assert(Math.abs(actual - expected) < 0.0001, `${label}: expected ${expected}, got ${actual}`);
  }

  function assertHeaderText(text, expected) {
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

  function assertArchitectureHeaders() {
    assert.equal(ops.filter(op => op.name === 'lightCanvas').length, 3, 'expected three primitive architecture headers');
    [
      ['Service map', 'Service blueprint subtitle', '06', 5.8, 7.1],
      ['SaaS map', 'SaaS capability subtitle', '07', 5.9, 7.0],
      ['Manufacturing topology', 'Manufacturing topology subtitle', '08', 5.9, 7.0]
    ].forEach(([title, subtitle, page, titleW, subtitleW]) => {
      assertHeaderText(title, {
        x:0.84, y:1.05, w:titleW, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
      });
      assertHeaderText(subtitle, {
        x:0.86, y:1.52, w:subtitleW, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
      });
      const pageOp = ops.find(op => op.name === 'addNumber' && op.args[1] === page);
      assert(pageOp, `expected architecture page number ${page}`);
      const opts = pageOp.args[2] || {};
      assertNear(opts.x, 11.70, `${page} page number x`);
      assertNear(opts.y, 0.66, `${page} page number y`);
      assertNear(opts.w, 0.72, `${page} page number width`);
      assertNear(opts.h, 0.22, `${page} page number height`);
      assertNear(opts.fontSize, 13, `${page} page number font`);
      assert.equal(opts.color, '2563EB');
      assert.equal(opts.align, 'right');
    });
  }

  assertKicker(ops, 'SERVICE BLUEPRINT');
  assertKicker(ops, 'PLATFORM CAPABILITY MAP');
  assertKicker(ops, 'LINE SYSTEM TOPOLOGY');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected manufacturing topology arrows');
  assert.equal(ops.filter(op => op.name === 'addShape' && op.args[0] === 'ellipse').length, 1, 'expected one SaaS capability center ring');
  assert.equal(ops.filter(op => op.name === 'addShape' && op.args[0] === 'line').length, 0, 'SaaS capability map should not draw imprecise diagonal connectors');
  assertServiceBlueprintShell(ops);
  assertArchitectureHeaders();
  assertStandardFooters(ops, 3);
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected architecture text output');

  console.log('architecture industry renderers ok');
}

main();
