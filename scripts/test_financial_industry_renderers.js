#!/usr/bin/env node
const assert = require('assert');
const {
  createFinancialRenderers
} = require('./render/page-families/financial');
const {
  createFinancialIndustryRenderers
} = require('./render/page-families/financial-industry');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addArrowLine: (...args) => record('addArrowLine', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    chartSpecToComponentId: () => '',
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
    componentRendererContext: () => ({}),
    footerText: () => 'Footer',
    formatMetricDelta: value => String(value || ''),
    isVisualIndustry: () => false,
    itemBody: item => (item && item.body) || '',
    itemTitle: (item, fallback) => (item && (item.title || item.label)) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    publicSlideNote: value => value || '',
    recordChartConsumption: (...args) => record('recordChartConsumption', args),
    renderChartSpec: () => ({ rendered:false }),
    routeChartSpec: () => null,
    sectionKicker: (...args) => record('sectionKicker', args),
    variantOf: section => section.variant || section.layoutVariant || ''
  };
}

function main() {
  const ops = [];
  const ctx = createFakeCtx(ops);
  const renderers = createFinancialIndustryRenderers(ctx);
  const integratedRenderers = createFinancialRenderers(ctx);
  assert.strictEqual(typeof renderers.industryChartSlide, 'function');
  assert.strictEqual(typeof integratedRenderers.industryChartSlide, 'function');

  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'monthly-pulse-trend',
    title: 'Monthly Pulse',
    subtitle: 'Monthly pulse subtitle',
    items: [
      { label:'Jan', value:'456.2w', note:'baseline' },
      { label:'Feb', value:'402.2w', note:'low point' },
      { label:'Mar', value:'618.4w', note:'peak' }
    ]
  }, 2);
  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'waterfall-bridge',
    title: 'Target Bridge',
    subtitle: 'Target bridge subtitle',
    waterfallBridge: [
      { label:'Start', value:'100', kind:'start' },
      { label:'Upside', value:'+25', kind:'up' },
      { label:'Risk', value:'-8', kind:'down' },
      { label:'Target', value:'117', kind:'end' }
    ]
  }, 3);
  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'channel-efficiency-matrix',
    title: 'Channel Efficiency',
    subtitle: 'Channel efficiency subtitle',
    channels: [
      { label:'CRM', value:'8x', x:22, y:82, size:64 },
      { label:'Search', value:'4x', x:56, y:44, size:48 },
      { label:'Social', value:'3x', x:84, y:34, size:42 }
    ]
  }, 4);
  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'downtime-pareto',
    title: 'Downtime Pareto',
    subtitle: 'Downtime pareto subtitle',
    downtimePareto: [
      { title:'Line stop', value:42, unit:'min' },
      { title:'Material wait', value:24, unit:'min' },
      { title:'Changeover', value:18, unit:'min' }
    ]
  }, 5);
  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'quality-handoff',
    title: 'Quality Handoff',
    subtitle: 'Quality handoff subtitle',
    qualityHandoff: [
      { from:'Triage', to:'Lab', title:'Patient context', body:'Same-day transfer' },
      { from:'Lab', to:'Doctor', title:'Critical result', body:'Priority callback' },
      { from:'Doctor', to:'Follow-up', title:'Care plan', body:'Closed-loop review' }
    ]
  }, 6);
  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'dispatch-map',
    title: 'Dispatch Map',
    subtitle: 'Dispatch map subtitle',
    centerTitle: 'Grid Control',
    dispatchMap: [
      { title:'Site A', value:'SOC 63%', body:'Alert first' },
      { title:'Site B', value:'Peak', body:'Discharge' },
      { title:'Site C', value:'Curtailment', body:'Review' },
      { title:'Control', value:'36min', body:'Mean response' }
    ]
  }, 7);
  integratedRenderers.metricComparison(createSlide(ops), { slides:[{}], industry:'general' }, {
    title: 'Performance Signal',
    claim: 'Performance signal claim',
    businessLogic: {
      currentState:'Revenue improved after campaign mix shift',
      cause:'Higher activation lifted expansion quality',
      action:'Move budget toward proven onboarding path',
      metric:'Revenue retention and activation'
    },
    metrics: [
      { label:'Revenue', value:'118%', delta:'+8pp', note:'expansion quality' },
      { label:'Activation', value:'64%', note:'onboarding signal' },
      { label:'Retention', value:'91%', note:'stable cohort' }
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
    assert.strictEqual(opts.color, expected.color);
    assert.strictEqual(opts.fit, 'shrink');
    if (expected.bold != null) assert.strictEqual(opts.bold, expected.bold);
  }

  function assertIndustryHeaders() {
    [
      ['Monthly Pulse', 'Monthly pulse subtitle', '02'],
      ['Target Bridge', 'Target bridge subtitle', '03'],
      ['Channel Efficiency', 'Channel efficiency subtitle', '04'],
      ['Downtime Pareto', 'Downtime pareto subtitle', '05'],
      ['Quality Handoff', 'Quality handoff subtitle', '06'],
      ['Dispatch Map', 'Dispatch map subtitle', '07']
    ].forEach(([title, subtitle, page]) => {
      assertHeaderText(title, {
        x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
      });
      assertHeaderText(subtitle, {
        x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:'64748B', fit:'shrink'
      });
      const pageOp = ops.find(op => op.name === 'addNumber' && op.args[1] === page);
      assert(pageOp, `expected industry page number ${page}`);
      const opts = pageOp.args[2] || {};
      assertNear(opts.x, 11.70, `${page} page number x`);
      assertNear(opts.y, 0.66, `${page} page number y`);
      assertNear(opts.w, 0.72, `${page} page number width`);
      assertNear(opts.h, 0.22, `${page} page number height`);
      assertNear(opts.fontSize, 13, `${page} page number font`);
      assert.strictEqual(opts.color, '2563EB');
      assert.strictEqual(opts.align, 'right');
    });
  }

  function assertGenericFinancialHeader() {
    assertHeaderText('Performance Signal', {
      x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
    });
    assertHeaderText('Performance signal claim', {
      x:0.86, y:1.54, w:6.8, h:0.20, fontSize:10.2, color:'64748B', fit:'shrink'
    });
    const pageOp = ops.find(op => op.name === 'addNumber' && op.args[1] === '08');
    assert(pageOp, 'expected generic financial page number 08');
    const opts = pageOp.args[2] || {};
    assertNear(opts.x, 11.70, '08 page number x');
    assertNear(opts.y, 0.66, '08 page number y');
    assertNear(opts.w, 0.72, '08 page number width');
    assertNear(opts.h, 0.22, '08 page number height');
    assertNear(opts.fontSize, 13, '08 page number font');
    assert.strictEqual(opts.color, '2563EB');
    assert.strictEqual(opts.align, 'right');
  }

  function assertGenericMetricComparisonShell() {
    const panel = ops.find(op => {
      if (op.name !== 'addRect') return false;
      return op.args[1] === 0.92
        && op.args[2] === 2.12
        && op.args[3] === 11.28
        && op.args[4] === 3.72;
    });
    assert(panel, 'expected generic metric comparison panel shell');
    ['PRIMARY KPI', 'SUPPORT 01', 'SUPPORT 02'].forEach(label => {
      assert(
        ops.some(op => op.name === 'addLabel' && op.args[1] === label),
        `expected generic metric label ${label}`
      );
    });
    assert(
      ops.some(op => op.name === 'addNumber' && op.args[1] === '118%'),
      'expected generic metric primary KPI value'
    );
    ['现状', '原因', '动作', '衡量'].forEach(label => {
      assert(
        ops.some(op => op.name === 'addLabel' && op.args[1] === label),
        `expected generic metric business logic label ${label}`
      );
    });
  }

  function assertOperationalBoards() {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === 'LOSS SOURCES'),
      'expected downtime Pareto operational board'
    );
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === 'ROLE HANDOFFS'),
      'expected quality handoff operational board'
    );
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === 'Grid Control'),
      'expected dispatch map center node'
    );
    const handoffArrows = ops.filter(op => op.name === 'addArrowLine' && (op.args[6] || {}).width === 0.34);
    assert.strictEqual(handoffArrows.length, 2, 'expected quality handoff connectors');
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === '42min'),
      'expected downtime Pareto value/unit label'
    );
  }

  function countRect(expected) {
    return ops.filter(op => op.name === 'addRect'
      && op.args[1] === expected.x
      && op.args[2] === expected.y
      && op.args[3] === expected.w
      && op.args[4] === expected.h).length;
  }

  function assertIndustryChartSlideShell() {
    assert.strictEqual(
      countRect({ x:0.92, y:2.10, w:2.62, h:3.96 }),
      6,
      'expected one proof object side panel per industry chart slide'
    );
    assert.strictEqual(
      countRect({ x:3.92, y:2.10, w:7.76, h:3.96 }),
      6,
      'expected one chart board shell per industry chart slide'
    );
    assert.strictEqual(
      ops.filter(op => op.name === 'addLabel' && op.args[1] === 'PROOF OBJECT').length,
      6,
      'expected proof object label on each industry chart slide'
    );
    ['MONTHLY PULSE', 'TARGET BRIDGE', 'CHANNEL EFFICIENCY', 'DOWNTIME PARETO', 'QUALITY HANDOFF', 'DISPATCH MAP'].forEach(text => {
      assert(
        ops.some(op => op.name === 'addText' && op.args[1] === text),
        `expected proof object title ${text}`
      );
    });
  }

  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'MONTHLY PULSE'),
    'expected monthly pulse branch'
  );
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === 'MONTHLY NET SALES TREND'),
    'expected monthly trend chart renderer'
  );
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === 'CONTRIBUTION BRIDGE'),
    'expected waterfall chart renderer'
  );
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === 'ROAS × SPEND MATRIX'),
    'expected channel efficiency chart renderer'
  );
  assertOperationalBoards();
  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'PERFORMANCE SIGNAL'),
    'expected generic metric comparison branch'
  );
  assert(ops.some(op => op.name === 'addShape'), 'expected native chart shapes');
  assertIndustryHeaders();
  assertIndustryChartSlideShell();
  assertGenericFinancialHeader();
  assertGenericMetricComparisonShell();
  const footerOps = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footerOps.length, 7, 'expected each industry/generic financial branch to use the shared footer primitive');
  footerOps.forEach(op => {
    assert.strictEqual(op.args[2].x, 0.82);
    assert.strictEqual(op.args[2].y, 7.05);
    assert.strictEqual(op.args[2].w, 7.8);
    assert.strictEqual(op.args[2].h, 0.16);
    assert.strictEqual(op.args[2].fontSize, 7.8);
  });

  console.log('financial industry renderers ok');
}

main();
