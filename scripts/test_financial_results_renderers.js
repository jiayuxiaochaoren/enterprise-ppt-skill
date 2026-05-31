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

function section() {
  return {
    title: 'Financial Result',
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
    }
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
  const renderers = createFinancialResultsRenderers(createFakeCtx(ops));
  const names = [
    'financeMetricDashboard',
    'financialKpiSnapshot',
    'chartGridWithCommentary',
    'quarterlyResultsSummary'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.financeMetricDashboard({}, {}, section(), 1);
  renderers.financialKpiSnapshot({}, {}, section(), 2);
  renderers.chartGridWithCommentary({}, {}, section(), 3);
  renderers.quarterlyResultsSummary({}, {}, section(), 4);

  assertKicker(ops, 'PORTFOLIO DASHBOARD');
  assertKicker(ops, 'FINANCIAL KPI SNAPSHOT');
  assertKicker(ops, 'CHART GRID WITH COMMENTARY');
  assertKicker(ops, 'QUARTERLY RESULTS SUMMARY');
  assert(ops.filter(op => op.name === 'PageNumber').length >= 4, 'expected page numbering');
  assert(ops.filter(op => op.name === 'addText').length >= 40, 'expected text output');

  console.log('financial results renderers ok');
}

main();
