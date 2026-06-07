#!/usr/bin/env node
const assert = require('assert');
const {
  createFinancialResultsRenderers
} = require('./render/page-families/financial-results');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
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
      risk: 'DC2626',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    compactEvidenceCaption: value => String(value || ''),
    footerText: () => 'Footer',
    formatMetricDelta: value => String(value || ''),
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function section(overrides = {}) {
  return {
    title: 'Financial Result',
    subtitle: 'Financial result subtitle',
    period: 'Q1',
    metrics: [
      { label:'Revenue', value:'128m', delta:'+12%', note:'growth quality' },
      { label:'Cash', value:'42m', note:'collection' },
      { label:'Risk', value:'Low', note:'exposure' },
      { label:'Margin', value:'36%', note:'discipline' }
    ],
    businessLogic: {
      currentState: 'Ahead of plan',
      cause: 'Better mix',
      action: 'Hold spend discipline'
    },
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
  assert(op, `expected financial results header text ${text}`);
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

function assertFinancialHeaders(ops) {
  [
    ['Portfolio Result', 'Portfolio result subtitle', { titleY:1.06, titleW:5.9, titleH:0.36, titleSize:24, subtitleY:1.54, subtitleSize:10.2 }],
    ['KPI Snapshot Result', 'KPI snapshot subtitle', { titleY:1.05, titleW:6.2, titleH:0.34, titleSize:24, subtitleY:1.50, subtitleSize:10.0 }],
    ['Chart Commentary Result', 'Chart commentary subtitle', { titleY:1.05, titleW:6.2, titleH:0.34, titleSize:24, subtitleY:1.50, subtitleSize:10.0 }],
    ['Quarterly Result', 'Quarterly result subtitle', { titleY:1.05, titleW:6.5, titleH:0.34, titleSize:23.0, subtitleY:1.50, subtitleSize:10.0 }]
  ].forEach(([title, subtitle, expected]) => {
    assertHeaderText(ops, title, {
      x:0.84,
      y:expected.titleY,
      w:expected.titleW,
      h:expected.titleH,
      fontSize:expected.titleSize,
      color:'111827',
      bold:true
    });
    assertHeaderText(ops, subtitle, {
      x:0.86,
      y:expected.subtitleY,
      w:7.0,
      h:0.20,
      fontSize:expected.subtitleSize,
      color:'64748B'
    });
  });

  const pageNumbers = ops.filter(op => op.name === 'PageNumber');
  assert.strictEqual(pageNumbers.length, 4, 'expected one PageNumber per financial results renderer');
  [1, 2, 3, 4].forEach((idx, i) => {
    assert.strictEqual(pageNumbers[i].args[1], idx, `expected financial results page number ${idx}`);
  });
}

function assertFinancialFooters(ops) {
  const footerOps = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footerOps.length, 4, 'expected one primitive footer per financial results renderer');
  footerOps.forEach((op, i) => {
    const box = op.args[2] || {};
    assertNear(box.x, 0.82, `footer ${i + 1} x`);
    assertNear(box.y, 7.05, `footer ${i + 1} y`);
    assertNear(box.w, 7.8, `footer ${i + 1} width`);
    assertNear(box.h, 0.16, `footer ${i + 1} height`);
    assertNear(box.fontSize, 7.8, `footer ${i + 1} font`);
    assert.strictEqual(box.color, '64748B', `footer ${i + 1} color`);
  });
}

function assertChartGridShell(ops) {
  [
    [0.92, 2.08, 2.78, 1.58],
    [4.02, 2.08, 2.78, 1.58],
    [0.92, 4.18, 5.88, 1.68],
    [7.18, 2.08, 4.34, 3.78]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected chart grid panel ${x}/${y}`);
  });
  ['CHART 01', 'CHART 02', 'CHART 03', 'COMMENTARY RAIL'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected chart grid label ${label}`
    );
  });
  ['Revenue', 'Ahead of plan', 'Better mix', 'Hold spend discipline'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected chart grid content ${text}`
    );
  });
}

function assertPortfolioDashboardShell(ops) {
  [
    [0.92, 2.08, 3.10, 3.94],
    [4.46, 2.10, 3.16, 3.86],
    [8.08, 2.10, 3.64, 3.86]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected portfolio dashboard panel ${x}/${y}`);
  });
  ['PRIMARY RETURN', 'IC VIEW', 'RETURN / CASH / RISK', 'MANAGEMENT READOUT'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected portfolio dashboard label ${label}`
    );
  });
  ['Revenue', '128m', '+12%', 'Cash', 'Risk', 'growth quality', 'collection', 'exposure'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected portfolio dashboard content ${text}`
    );
  });
}

function assertQuarterlyResultsShell(ops) {
  [
    [0.92, 2.06, 2.46, 3.86],
    [3.82, 2.06, 4.22, 3.86],
    [8.46, 2.06, 2.96, 3.86]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected quarterly results panel ${x}/${y}`);
  });

  ['REPORTING PERIOD', 'SOURCE', 'REPORTED METRICS', 'VARIANCE / ACTION'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected quarterly results label ${label}`
    );
  });

  ['Q1', 'Ahead of plan', 'Management reporting', 'Revenue', '128m', 'growth quality', 'Better mix', 'Hold spend discipline'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected quarterly results content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createFinancialResultsRenderers(createFakeCtx(ops));
  const names = [
    'financeMetricDashboard',
    'financialKpiSnapshot',
    'chartGridWithCommentary',
    'quarterlyResultsSummary'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.financeMetricDashboard({}, {}, section({
    title:'Portfolio Result',
    subtitle:'Portfolio result subtitle'
  }), 1);
  renderers.financialKpiSnapshot({}, {}, section({
    title:'KPI Snapshot Result',
    subtitle:'KPI snapshot subtitle'
  }), 2);
  renderers.chartGridWithCommentary({}, {}, section({
    title:'Chart Commentary Result',
    subtitle:'Chart commentary subtitle'
  }), 3);
  renderers.quarterlyResultsSummary({}, {}, section({
    title:'Quarterly Result',
    subtitle:'Quarterly result subtitle'
  }), 4);

  assertKicker(ops, 'PORTFOLIO DASHBOARD');
  assertKicker(ops, 'FINANCIAL KPI SNAPSHOT');
  assertKicker(ops, 'CHART GRID WITH COMMENTARY');
  assertKicker(ops, 'QUARTERLY RESULTS SUMMARY');
  assertFinancialHeaders(ops);
  assertPortfolioDashboardShell(ops);
  assertChartGridShell(ops);
  assertQuarterlyResultsShell(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 40, 'expected text output');
  assertFinancialFooters(ops);

  const hiddenSourceOps = [];
  createFinancialResultsRenderers(createFakeCtx(hiddenSourceOps)).financialKpiSnapshot({}, {}, section({
    sourceNote:'Hidden Source A',
    sourceTrace:{ sourceNote:'Hidden Trace Source A' }
  }), 1);
  assert(
    !hiddenSourceOps.some(op => op.name === 'addText' && /Hidden Source A|Hidden Trace Source A/.test(String(op.args[1] || ''))),
    'financial KPI snapshot should not render source text by default'
  );

  const visibleSourceOps = [];
  createFinancialResultsRenderers(createFakeCtx(visibleSourceOps)).financialKpiSnapshot({}, { visibleSourceNotes:true }, section({
    sourceNote:'Visible Source A'
  }), 1);
  assert(
    visibleSourceOps.some(op => op.name === 'addText' && op.args[1] === 'Visible Source A'),
    'financial KPI snapshot should render explicit source text only when opted in'
  );

  const visibleTraceSourceOps = [];
  createFinancialResultsRenderers(createFakeCtx(visibleTraceSourceOps)).financialKpiSnapshot({}, { visibleSourceNotes:true }, section({
    sourceTrace:{ sourceNote:'Visible Trace Source A' }
  }), 1);
  assert(
    visibleTraceSourceOps.some(op => op.name === 'addText' && op.args[1] === 'Visible Trace Source A'),
    'financial KPI snapshot should use sourceTrace note as an opt-in fallback'
  );

  console.log('financial results renderers ok');
}

main();
