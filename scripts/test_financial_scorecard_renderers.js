#!/usr/bin/env node
const assert = require('assert');
const {
  createFinancialScorecardRenderers
} = require('./render/page-families/financial-scorecards');

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

  renderers.manufacturingOeeBoard(slide, { industry:'manufacturing-operations' }, section(), 1);
  renderers.healthcareServiceScorecard(slide, { industry:'healthcare-operations' }, section(), 2);
  renderers.retailMemberGrowthBoard(slide, { industry:'brand-retail' }, section(), 3);
  renderers.saasAdoptionRevenueBoard(slide, { industry:'saas-technology' }, section(), 4);

  assertKicker(ops, 'OEE / LINE READOUT');
  assertKicker(ops, 'PATIENT SERVICE SCORECARD');
  assertKicker(ops, 'MEMBER GROWTH BOARD');
  assertKicker(ops, 'ADOPTION / REVENUE BOARD');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected flow arrows');
  assert(ops.some(op => op.name === 'addShape'), 'expected native shapes');
  assert(ops.filter(op => op.name === 'addText').length >= 50, 'expected scorecard text output');

  console.log('financial scorecard renderers ok');
}

main();
