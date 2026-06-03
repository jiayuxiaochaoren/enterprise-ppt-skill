#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceIndustryRenderers
} = require('./render/page-families/evidence-industry');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      cyan: '0891B2',
      ink: '0F172A',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    addArrowLine: (...args) => record('addArrowLine', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    footerText: () => 'Footer',
    galleryImages: (_plan, section) => section.images || [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    itemBody: item => (item && item.body) || '',
    itemTitle: (item, fallback) => (item && item.title) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function makeSection(title) {
  return {
    title,
    subtitle:`${title} subtitle`,
    images: [],
    items: [
      { title: `${title} 1`, body: 'First evidence point' },
      { title: `${title} 2`, body: 'Second evidence point' },
      { title: `${title} 3`, body: 'Third evidence point' }
    ]
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
  assert(op, `expected evidence header text ${text}`);
  const box = op.args[2] || {};
  assertNear(box.x, expected.x, `${text} x`);
  assertNear(box.y, expected.y, `${text} y`);
  assertNear(box.w, expected.w, `${text} width`);
  assertNear(box.h, expected.h, `${text} height`);
  assertNear(box.fontSize, expected.fontSize, `${text} font`);
  assert.strictEqual(box.color, expected.color, `${text} color`);
  assert.strictEqual(box.fit, 'shrink', `${text} fit`);
  if (expected.bold != null) assert.strictEqual(box.bold, expected.bold, `${text} bold`);
}

function findGenericShowcaseField(ops, label, expected) {
  return ops.find(op => {
    if (op.name !== 'genericShowcaseField' || op.args[5] !== label) return false;
    return ['x', 'y', 'w', 'h'].every((key, i) => Math.abs(op.args[i + 1] - expected[key]) < 0.001);
  });
}

function assertEvidenceHeaders(ops) {
  [
    ['Energy', 'Energy subtitle', { subtitleW:6.6 }],
    ['Finance', 'Finance subtitle', { subtitleW:6.8 }],
    ['Healthcare', 'Healthcare subtitle', { subtitleW:6.8 }],
    ['SaaS', 'SaaS subtitle', { subtitleW:6.7 }]
  ].forEach(([title, subtitle, expected]) => {
    assertHeaderText(ops, title, {
      x:0.84,
      y:1.05,
      w:5.9,
      h:0.35,
      fontSize:23.5,
      color:'111827',
      bold:true
    });
    assertHeaderText(ops, subtitle, {
      x:0.86,
      y:1.52,
      w:expected.subtitleW,
      h:0.20,
      fontSize:9.4,
      color:'64748B'
    });
  });

  const pageNumbers = ops.filter(op => {
    const box = op.name === 'addNumber' ? (op.args[2] || {}) : {};
    return box.x === 11.70 && box.y === 0.66 && box.w === 0.72 && box.h === 0.22;
  });
  assert.strictEqual(pageNumbers.length, 4, 'expected one header page number per evidence industry renderer');
  ['03', '04', '05', '06'].forEach((label, i) => {
    assert.strictEqual(pageNumbers[i].args[1], label, `expected evidence page number ${label}`);
    const box = pageNumbers[i].args[2] || {};
    assertNear(box.fontSize, 13, `${label} page number font`);
    assert.strictEqual(box.color, '2563EB', `${label} page number color`);
    assert.strictEqual(box.align, 'right', `${label} page number align`);
  });
}

function assertEvidenceFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footers.length, 4, 'expected one footer per evidence industry renderer');
  footers.forEach((op, i) => {
    const box = op.args[2] || {};
    assertNear(box.x, 0.82, `footer ${i + 1} x`);
    assertNear(box.y, 7.05, `footer ${i + 1} y`);
    assertNear(box.w, 7.8, `footer ${i + 1} width`);
    assertNear(box.h, 0.16, `footer ${i + 1} height`);
    assertNear(box.fontSize, 7.8, `footer ${i + 1} font`);
    assert.strictEqual(box.color, i === 3 ? '64748B' : '738297', `footer ${i + 1} color`);
  });
}

function assertEnergySiteEvidenceShell(ops) {
  const heroFallback = ops.find(op => op.name === 'genericShowcaseField'
    && op.args[1] === 0.92
    && op.args[2] === 2.02
    && op.args[3] === 6.36
    && op.args[4] === 2.52
    && op.args[5] === 'SITE EVIDENCE');
  assert(heroFallback, 'expected energy site hero fallback');

  [
    [0.92, 3.82, 6.36, 0.72],
    [7.70, 2.02, 3.80, 2.52],
    [0.92, 4.86, 5.18, 1.10],
    [6.34, 4.86, 5.16, 1.10]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && Math.abs(candidate.args[1] - x) < 0.001
      && Math.abs(candidate.args[2] - y) < 0.001
      && Math.abs(candidate.args[3] - w) < 0.001
      && Math.abs(candidate.args[4] - h) < 0.001);
    assert(op, `expected energy site panel ${x}/${y}`);
  });

  ['PRIMARY SITE', 'ASSET READOUT'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected energy site label ${label}`
    );
  });

  ['Energy 1', 'Energy 2', 'Energy 3', 'First evidence point', 'Second evidence point', 'Third evidence point', '站端资产', '设备状态', '区域调度'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected energy site content ${text}`
    );
  });
}

function assertFinancePortfolioEvidenceShell(ops) {
  const hero = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.02
    && op.args[3] === 4.96
    && op.args[4] === 3.86);
  assert(hero, 'expected finance portfolio hero panel');

  const heroFallback = ops.find(op => op.name === 'genericShowcaseField'
    && op.args[1] === 1.12
    && op.args[2] === 2.24
    && op.args[3] === 4.56
    && op.args[4] === 2.56
    && op.args[5] === 'DEAL EVIDENCE');
  assert(heroFallback, 'expected finance portfolio hero fallback');

  [
    [6.28, 2.02, 2.42, 1.74],
    [9.00, 2.02, 2.42, 1.74],
    [6.28, 4.26, 5.14, 1.62]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && Math.abs(candidate.args[1] - x) < 0.001
      && Math.abs(candidate.args[2] - y) < 0.001
      && Math.abs(candidate.args[3] - w) < 0.001
      && Math.abs(candidate.args[4] - h) < 0.001);
    assert(op, `expected finance portfolio panel ${x}/${y}`);
  });

  ['PRIMARY DEAL MATERIAL', 'COMMERCIAL PROOF', 'GOVERNANCE PROOF', 'IC READOUT'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected finance portfolio label ${label}`
    );
  });

  ['Finance 1', 'Finance 2', 'Finance 3', 'First evidence point', '项目质量', '风险信号', '资本动作'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected finance portfolio content ${text}`
    );
  });
}

function assertSaasPrototypeFlowShell(ops) {
  const hero = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.00
    && op.args[3] === 5.52
    && op.args[4] === 3.72);
  assert(hero, 'expected SaaS prototype hero panel');

  const heroFallback = findGenericShowcaseField(ops, 'PRIMARY SCREEN', {
    x:1.12, y:2.22, w:5.12, h:2.70
  });
  assert(heroFallback, 'expected SaaS prototype primary screen fallback');

  [
    [6.86, 2.42, 4.72, 0.40],
    [6.86, 2.96, 4.72, 0.40],
    [6.86, 3.50, 4.72, 0.40],
    [0.92, 6.18, 10.66, 0.34]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && Math.abs(candidate.args[1] - x) < 0.001
      && Math.abs(candidate.args[2] - y) < 0.001
      && Math.abs(candidate.args[3] - w) < 0.001
      && Math.abs(candidate.args[4] - h) < 0.001);
    assert(op, `expected SaaS prototype panel ${x}/${y}`);
  });

  [
    ['STATE 02', 6.86, 4.54, 2.16, 1.18],
    ['STATE 03', 9.42, 4.54, 2.16, 1.18]
  ].forEach(([label, x, y, w, h]) => {
    const op = findGenericShowcaseField(ops, label, { x, y, w, h });
    assert(op, `expected SaaS prototype state fallback ${label}`);
  });

  ['PRIMARY SCREEN', 'WORKFLOW PATH', 'STATE 02', 'STATE 03'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected SaaS prototype label ${label}`
    );
  });

  ['SaaS 1', 'SaaS 2', 'SaaS 3', 'First evidence point', 'Second evidence point', 'Third evidence point'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected SaaS prototype content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createEvidenceIndustryRenderers(createFakeCtx(ops));
  const names = [
    'energySiteEvidenceGallery',
    'financePortfolioEvidenceGallery',
    'healthcareTouchpointEvidenceGallery',
    'saasPrototypeFlowGallery'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.energySiteEvidenceGallery({}, {}, makeSection('Energy'), 3);
  renderers.financePortfolioEvidenceGallery({}, {}, makeSection('Finance'), 4);
  renderers.healthcareTouchpointEvidenceGallery({}, {}, makeSection('Healthcare'), 5);
  renderers.saasPrototypeFlowGallery({}, {}, makeSection('SaaS'), 6);

  assertKicker(ops, 'SITE EVIDENCE');
  assertKicker(ops, 'PORTFOLIO EVIDENCE');
  assertKicker(ops, 'SERVICE TOUCHPOINTS');
  assertKicker(ops, 'PRODUCT WORKFLOW');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected image fallback rendering');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected flow arrows for healthcare/SaaS renderer');
  assertEvidenceHeaders(ops);
  assertEnergySiteEvidenceShell(ops);
  assertFinancePortfolioEvidenceShell(ops);
  assertSaasPrototypeFlowShell(ops);
  assertEvidenceFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 24, 'expected renderer text output');

  console.log('evidence industry renderers ok');
}

main();
