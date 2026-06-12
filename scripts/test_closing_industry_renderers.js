#!/usr/bin/env node
const assert = require('assert');
const {
  createClosingIndustryRenderers
} = require('./render/page-families/closing-industry');

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
      ink: '0F172A',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    copyFallback: (_plan, key) => `fallback ${key}`,
    footerText: () => 'Footer',
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    profileFont: () => 'Aptos Display',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function makeSection(title) {
  return {
    title,
    subtitle:`${title} subtitle`,
    actions: [
      { title:'Action 1', body:'First action' },
      { title:'Action 2', body:'Second action' },
      { title:'Action 3', body:'Third action' }
    ],
    decision: `${title} decision`
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

function assertIndustryFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footers.length, 4, 'expected one footer per closing industry renderer');
  footers.forEach((op, i) => {
    const box = op.args[2] || {};
    assertNear(box.x, 0.86, `footer ${i + 1} x`);
    assertNear(box.y, 6.98, `footer ${i + 1} y`);
    assertNear(box.w, 7.80, `footer ${i + 1} width`);
    assertNear(box.h, 0.13, `footer ${i + 1} height`);
    assertNear(box.fontSize, 7.2, `footer ${i + 1} font`);
    assert.strictEqual(box.color, '64748B', `footer ${i + 1} color`);
    assert.strictEqual(box.fit, 'shrink', `footer ${i + 1} fit`);
  });
}

function assertHeaderTitle(ops, title, expected) {
  const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === title);
  assert(op, `expected closing header title ${title}`);
  const box = op.args[2] || {};
  assertNear(box.x, 0.84, `${title} header x`);
  assertNear(box.y, 1.08, `${title} header y`);
  assertNear(box.w, expected.w, `${title} header width`);
  assertNear(box.h, 0.66, `${title} header height`);
  assertNear(box.fontSize, expected.fontSize, `${title} header font`);
  assert.strictEqual(box.bold, true, `${title} header bold`);
  assert.strictEqual(box.color, '111827', `${title} header color`);
  assert.strictEqual(box.fit, 'shrink', `${title} header fit`);
  assert.strictEqual(box.breakLine, true, `${title} header breakLine`);
}

function assertHeaderSubtitle(ops, text, expected) {
  const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
  assert(op, `expected closing header subtitle ${text}`);
  const box = op.args[2] || {};
  assertNear(box.x, 0.86, `${text} subtitle x`);
  assertNear(box.y, expected.y, `${text} subtitle y`);
  assertNear(box.w, expected.w, `${text} subtitle width`);
  assertNear(box.h, 0.22, `${text} subtitle height`);
  assertNear(box.fontSize, 10.6, `${text} subtitle font`);
  assert.strictEqual(box.color, '334155', `${text} subtitle color`);
  assert.strictEqual(box.fit, 'shrink', `${text} subtitle fit`);
}

function assertIndustryHeaders(ops) {
  [
    ['Manufacturing', { w:6.90, fontSize:29.0, subtitleY:2.06, subtitleW:6.40 }],
    ['Finance', { w:6.80, fontSize:28.0, subtitleY:2.04, subtitleW:6.40 }],
    ['Healthcare', { w:6.70, fontSize:28.0, subtitleY:2.04, subtitleW:6.55 }],
    ['SaaS', { w:6.90, fontSize:28.5, subtitleY:2.04, subtitleW:6.60 }]
  ].forEach(([title, expected]) => {
    assertHeaderTitle(ops, title, expected);
    assertHeaderSubtitle(ops, `${title} subtitle`, { y:expected.subtitleY, w:expected.subtitleW });
  });

  const pageNumbers = ops.filter(op => {
    const box = op.name === 'addNumber' ? (op.args[2] || {}) : {};
    return box.x === 11.70 && box.y === 0.66 && box.w === 0.72 && box.h === 0.22;
  });
  assert.strictEqual(pageNumbers.length, 4, 'expected one header page number per closing industry renderer');
  ['09', '10', '11', '12'].forEach((label, i) => {
    assert.strictEqual(pageNumbers[i].args[1], label, `expected closing page number ${label}`);
    const box = pageNumbers[i].args[2] || {};
    assertNear(box.fontSize, 13, `${label} page number font`);
    assert.strictEqual(box.color, '2563EB', `${label} page number color`);
    assert.strictEqual(box.align, 'right', `${label} page number align`);
  });
}

function assertRightSideCards(ops) {
  const rects = ops.filter(op => op.name === 'addRect').map(op => op.args.slice(1, 5));
  const near = (value, expected) => Math.abs(value - expected) < 0.001;
  const hasRect = (x, y, w, h) => rects.some(([rx, ry, rw, rh]) =>
    near(rx, x) && near(ry, y) && near(rw, w) && near(rh, h)
  );

  [
    ['manufacturing card', 8.42, 1.34, 2.98, 4.86],
    ['manufacturing rail', 8.255, 1.34, 0.035, 4.86],
    ['finance card', 8.34, 1.34, 3.06, 4.86],
    ['finance rail', 8.175, 1.34, 0.035, 4.86],
    ['saas card', 8.50, 1.34, 2.90, 4.86],
    ['saas rail', 8.335, 1.34, 0.035, 4.86]
  ].forEach(([label, x, y, w, h]) => {
    assert(hasRect(x, y, w, h), `expected aligned right side ${label}`);
  });
}

function assertRightCardPagesDisableDefaultMotif(ops) {
  const lightCanvasCalls = ops.filter(op => op.name === 'lightCanvas');
  assert.strictEqual(lightCanvasCalls.length, 4, 'expected one light canvas call per industry closing');
  lightCanvasCalls.forEach((op, i) => {
    assert.deepStrictEqual(op.args[1], { motif:'none' }, `expected industry closing ${i + 1} to disable default right circle motif`);
  });
}

function main() {
  const ops = [];
  const helpers = {
    closingActions: s => s.actions,
    closingMeta: () => 'Meta'
  };
  const renderers = createClosingIndustryRenderers(createFakeCtx(ops), helpers);
  const names = [
    'closingManufacturingPilotRollout',
    'closingFinanceInvestmentDecision',
    'closingHealthcareQualityHandoff',
    'closingSaasAdoptionClose'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.closingManufacturingPilotRollout(createSlide(ops), {}, makeSection('Manufacturing'), 9);
  renderers.closingFinanceInvestmentDecision(createSlide(ops), {}, makeSection('Finance'), 10);
  renderers.closingHealthcareQualityHandoff(createSlide(ops), {}, makeSection('Healthcare'), 11);
  renderers.closingSaasAdoptionClose(createSlide(ops), {}, makeSection('SaaS'), 12);

  assertKicker(ops, 'PILOT ROLLOUT');
  assertKicker(ops, 'INVESTMENT DECISION');
  assertKicker(ops, 'QUALITY HANDOFF');
  assertKicker(ops, 'ADOPTION TO REVENUE');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected closing flow arrows');
  assert(ops.some(op => op.name === 'addShape'), 'expected native timeline node shapes');
  assertIndustryHeaders(ops);
  assertRightSideCards(ops);
  assertRightCardPagesDisableDefaultMotif(ops);
  assertIndustryFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 30, 'expected renderer text output');

  console.log('closing industry renderers ok');
}

main();
