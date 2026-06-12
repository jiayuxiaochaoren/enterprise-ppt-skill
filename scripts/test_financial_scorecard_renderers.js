#!/usr/bin/env node
const assert = require('assert');
const {
  createFinancialScorecardRenderers
} = require('./render/page-families/financial-scorecards');
const {
  findMetric,
  metricPctWidth
} = require('./render/page-families/financial-scorecard-primitives');

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
      onAccent: 'FFFFFF',
      panelAlt: 'F1F5F9',
      paper: 'FFF7F0',
      risk: 'DC2626',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    footerText: () => 'Footer',
    formatMetricDelta: value => String(value || ''),
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function section(overrides = {}) {
  return {
    title: 'Scorecard',
    metrics: [
      { label:'OEE', value:'82%', delta:'+6%', note:'output stabilized' },
      { label:'响应效率', value:'18min', delta:'-5min', note:'faster handling' },
      { label:'满意度', value:'93%', delta:'+4%', note:'experience improved' },
      { label:'复购率', value:'41%', delta:'+8%', note:'cohort lift' }
    ],
    oee: [
      { label:'稼动率', value:'92%', body:'downtime controlled' },
      { label:'性能率', value:'84%', body:'cycle time visible' },
      { label:'良率', value:'97%', body:'quality stable' }
    ],
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
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertHeaderText(ops, text, expected) {
  const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
  assert(op, `expected scorecard header text ${text}`);
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

function assertScorecardHeaders(ops) {
  [
    ['Manufacturing Scorecard', '把稼动、节拍、良率、停机和维修动作放到同一张产线复盘页。', { titleW:5.9, subtitleW:7.0, subtitleSize:10.2 }],
    ['Healthcare Scorecard', 'Healthcare scorecard subtitle', { titleW:5.9, subtitleW:7.0, subtitleSize:10.0 }],
    ['Retail Scorecard', 'Retail scorecard subtitle', { titleW:5.8, subtitleW:6.8, subtitleSize:10.0 }],
    ['SaaS Scorecard', 'SaaS scorecard subtitle', { titleW:5.9, subtitleW:7.0, subtitleSize:10.0 }]
  ].forEach(([title, subtitle, expected]) => {
    assertHeaderText(ops, title, {
      x:0.84,
      y:1.06,
      w:expected.titleW,
      h:0.36,
      fontSize:24,
      color:'111827',
      bold:true
    });
    assertHeaderText(ops, subtitle, {
      x:0.86,
      y:1.54,
      w:expected.subtitleW,
      h:0.20,
      fontSize:expected.subtitleSize,
      color:'64748B'
    });
  });

  const pageNumbers = ops.filter(op => {
    const box = op.name === 'addNumber' ? (op.args[2] || {}) : {};
    return box.x === 11.70 && box.y === 0.66 && box.w === 0.72 && box.h === 0.22;
  });
  assert.strictEqual(pageNumbers.length, 4, 'expected one header page number per scorecard renderer');
  ['01', '02', '03', '04'].forEach((label, i) => {
    assert.strictEqual(pageNumbers[i].args[1], label, `expected scorecard page number ${label}`);
    const box = pageNumbers[i].args[2] || {};
    assertNear(box.fontSize, 13, `${label} page number font`);
    assert.strictEqual(box.color, '2563EB', `${label} page number color`);
    assert.strictEqual(box.align, 'right', `${label} page number align`);
  });
}

function assertScorecardPrimitiveHelpers() {
  const metrics = [
    { label:'收入', value:'+12%' },
    { title:'等待时长', value:'18min', note:'响应改善' }
  ];
  assert.strictEqual(findMetric(metrics, /响应/).title, '等待时长');
  assert.strictEqual(findMetric(metrics, /不存在/, 0).label, '收入');
  assert.deepStrictEqual(findMetric([], /none/), {});
  assertNear(metricPctWidth('50%', 2), 1, 'metric pct width');
  assertNear(metricPctWidth('not-number', 2, 0.4), 0.8, 'metric pct fallback width');
  assertNear(metricPctWidth('300%', 2), 2, 'metric pct max clamp');
  assertNear(metricPctWidth('1%', 2), 0.22, 'metric pct min clamp');
}

function assertRetailScorecardShell(ops) {
  const band = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.16
    && op.args[3] === 10.42
    && op.args[4] === 3.62);
  assert(band, 'expected retail scorecard band');
  const hero = ops.find(op => op.name === 'addRect'
    && op.args[1] === 1.18
    && op.args[2] === 2.50
    && op.args[3] === 2.42
    && op.args[4] === 2.94);
  assert(hero, 'expected retail loyalty hero panel');
  ['复购风险信号', '问题分层', '商品信号', '履约信号'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected retail scorecard label ${label}`
    );
  });
  ['LOYALTY SIGNAL', 'COHORT / PRODUCT STORY', 'BASKET', 'STORE CONVERSION'].forEach(label => {
    assert(
      !ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `retail scorecard should not emit English template label ${label}`
    );
  });
  ['复购率', '响应效率', '满意度', '41%'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected retail scorecard content ${text}`
    );
  });
}

function assertHealthcareScorecardShell(ops) {
  const stage = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.10
    && op.args[3] === 10.90
    && op.args[4] === 3.92);
  assert(stage, 'expected healthcare service stage panel');
  const hero = ops.find(op => op.name === 'addRect'
    && op.args[1] === 1.22
    && op.args[2] === 2.44
    && op.args[3] === 2.28
    && op.args[4] === 2.98);
  assert(hero, 'expected healthcare primary experience hero panel');
  const queue = ops.find(op => op.name === 'addRect'
    && op.args[1] === 4.02
    && op.args[2] === 4.64
    && op.args[3] === 6.70
    && op.args[4] === 0.62);
  assert(queue, 'expected healthcare service queue panel');
  ['PRIMARY EXPERIENCE', 'JOURNEY READOUT', 'WAIT', 'SATISFACTION', 'CLOSURE'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected healthcare scorecard label ${label}`
    );
  });
  ['预约', '到院', '反馈', '满意度', '响应效率', '93%', '18min'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected healthcare scorecard content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const slide = createSlide(ops);
  const renderers = createFinancialScorecardRenderers(createFakeCtx(ops));
  const names = [
    'healthcareServiceScorecard',
    'manufacturingOeeBoard',
    'retailMemberGrowthBoard',
    'saasAdoptionRevenueBoard'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.manufacturingOeeBoard(slide, { industry:'manufacturing-operations' }, section({
    title:'Manufacturing Scorecard',
    subtitle:'Manufacturing scorecard subtitle'
  }), 1);
  renderers.healthcareServiceScorecard(slide, { industry:'healthcare-operations' }, section({
    title:'Healthcare Scorecard',
    subtitle:'Healthcare scorecard subtitle'
  }), 2);
  renderers.retailMemberGrowthBoard(slide, { industry:'brand-retail' }, section({
    title:'Retail Scorecard',
    subtitle:'Retail scorecard subtitle'
  }), 3);
  renderers.saasAdoptionRevenueBoard(slide, { industry:'saas-technology' }, section({
    title:'SaaS Scorecard',
    subtitle:'SaaS scorecard subtitle'
  }), 4);

  assertKicker(ops, 'OEE / LINE READOUT');
  assertKicker(ops, 'PATIENT SERVICE SCORECARD');
  assertKicker(ops, '会员增长看板');
  assertKicker(ops, 'ADOPTION / REVENUE BOARD');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected flow arrows');
  assert(ops.some(op => op.name === 'addShape'), 'expected native shapes');
  assertScorecardHeaders(ops);
  assertScorecardPrimitiveHelpers();
  assertHealthcareScorecardShell(ops);
  assertRetailScorecardShell(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 50, 'expected scorecard text output');
  const footerOps = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footerOps.length, 4, 'expected each scorecard renderer to use the shared footer primitive');
  footerOps.forEach(op => {
    assert.strictEqual(op.args[2].x, 0.82);
    assert.strictEqual(op.args[2].y, 7.05);
    assert.strictEqual(op.args[2].w, 7.8);
    assert.strictEqual(op.args[2].h, 0.16);
    assert.strictEqual(op.args[2].fontSize, 7.8);
  });

  console.log('financial scorecard renderers ok');
}

main();
