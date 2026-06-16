#!/usr/bin/env node
const assert = require('assert');
const {
  createFinancialRenderers
} = require('./render/page-families/financial');
const {
  createFinancialIndustryRenderers
} = require('./render/page-families/financial-industry');
const {
  createChannelEfficiencyMatrixDrawer
} = require('./render/page-families/financial-industry-channel-efficiency');
const {
  createMonthlyPulseTrendDrawer
} = require('./render/page-families/financial-industry-monthly-trend');

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
    variant: 'loss-pareto',
    title: 'Loss Ranking',
    subtitle: 'Loss ranking subtitle',
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
      ['Loss Ranking', 'Loss ranking subtitle', '05'],
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
    const firstLogicCard = ops.find(op => op.name === 'addRect'
      && op.args[1] === 1.00
      && op.args[2] === 6.20
      && Math.abs(op.args[4] - 0.46) < 0.001);
    assert(firstLogicCard, 'expected generic metric logic to render centered cards');
    const firstLogicLabel = ops.find(op => op.name === 'addLabel'
      && op.args[1] === '现状'
      && (op.args[2] || {}).x === 1.12);
    const firstLogicBody = ops.find(op => op.name === 'addText'
      && op.args[1] === 'Revenue improved after campaign mix shift');
    assert(firstLogicLabel && firstLogicBody, 'expected generic metric first logic label/body');
    const labelBox = firstLogicLabel.args[2] || {};
    const bodyBox = firstLogicBody.args[2] || {};
    assertNear((labelBox.y + bodyBox.y + bodyBox.h) / 2, 6.20 + 0.46 / 2, 'generic logic card stack center');
    assert.strictEqual(bodyBox.valign, 'mid');
  }

  function assertOperationalBoards() {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === '停机损失排序'),
      'expected loss ranking operational board'
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
      'expected loss ranking value/unit label'
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
      countRect({ x:0.92, y:2.10, w:2.62, h:4.16 }),
      6,
      'expected one proof object side panel per industry chart slide'
    );
    assert.strictEqual(
      countRect({ x:3.92, y:2.10, w:7.76, h:4.16 }),
      6,
      'expected one chart board shell per industry chart slide'
    );
    assert.strictEqual(
      ops.filter(op => op.name === 'addLabel' && op.args[1] === '经营依据').length,
      6,
      'expected operating basis label on each industry chart slide'
    );
    ['月度趋势', '目标桥', '渠道效率', '停机损失排序', '质量交接', '调度地图'].forEach(text => {
      assert(
        ops.some(op => op.name === 'addText' && op.args[1] === text),
        `expected industry chart side title ${text}`
      );
    });
  }

  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === '月度趋势'),
    'expected monthly trend branch'
  );
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === '月度营收趋势'),
    'expected monthly trend chart renderer'
  );
  const trendSegments = ops.filter(op =>
    op.name === 'addShape' &&
    ['line', 'lineInv'].includes(op.args[0]) &&
    (op.args[1] && op.args[1].line && op.args[1].line.width) === 1.15
  );
  assert(
    trendSegments.some(op => op.args[0] === 'lineInv'),
    'expected upward monthly trend segments to use lineInv instead of negative-height line'
  );
  trendSegments.forEach(op => {
    assert(
      (op.args[1] || {}).h >= 0,
      'monthly trend segment should not use negative height'
    );
  });
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === '贡献桥'),
    'expected waterfall chart renderer'
  );
  assert(
    ops.some(op => op.name === 'addText' && op.args[1] === 'ROAS') &&
      ops.some(op => op.name === 'addText' && op.args[1] === '高效触点'),
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

  const rankOps = [];
  const rankCtx = createFakeCtx(rankOps);
  createChannelEfficiencyMatrixDrawer(rankCtx)(
    createSlide(rankOps),
    { x:3.92, y:2.10, w:7.76, h:3.96 },
    {
      title:'活动投放要按场景复盘ROI',
      metrics:[
        { label:'C009', value:'8.74', unit:'ROI', note:'堂食' },
        { label:'C008', value:'8.22', unit:'ROI', note:'团餐' }
      ]
    }
  );
  assert(
    rankOps.some(op => op.name === 'addLabel' && op.args[1] === '活动ROI排行'),
    'expected activity rank board title to be content-specific'
  );
  assert(
    !rankOps.some(op => op.name === 'addLabel' && op.args[1] === '渠道效率排行'),
    'activity rank board should not reuse generic channel title'
  );
  const unitOps = [];
  const unitCtx = createFakeCtx(unitOps);
  createChannelEfficiencyMatrixDrawer(unitCtx)(
    createSlide(unitOps),
    { x:3.92, y:2.10, w:7.76, h:3.96 },
    {
      title:'活动ROI排行',
      metrics:[
        { label:'抖音直播间', value:'5605.1万', unit:'万', note:'月度经营明细' },
        { label:'线下专柜', value:'5602.5万', unit:'万', note:'月度经营明细' }
      ]
    }
  );
  assert(
    unitOps.some(op => op.name === 'addText' && op.args[1] === '5605.1万'),
    'rank board should preserve values that already include 万'
  );
  assert(
    !unitOps.some(op => op.name === 'addText' && /万\s+万/.test(String(op.args[1]))),
    'rank board should not append duplicate 万 units'
  );
  const denseChannelOps = [];
  createChannelEfficiencyMatrixDrawer(createFakeCtx(denseChannelOps))(
    createSlide(denseChannelOps),
    { x:3.92, y:2.10, w:7.76, h:3.96 },
    {
      title:'五个平台收入接近，资源动作必须按效率分层',
      channels:[
        { label:'大众点评', value:'7.7x', x:12, y:18, size:62, body:'低花费高复购' },
        { label:'私域社群', value:'7.6x', x:18, y:20, size:60, body:'老客续费稳定' },
        { label:'抖音直播', value:'7.5x', x:22, y:21, size:58, body:'转化波动' },
        { label:'线下转介绍', value:'6.9x', x:20, y:19, size:56, body:'到店率高' },
        { label:'企业团购', value:'6.2x', x:25, y:22, size:54, body:'规模触达' },
        { label:'搜索广告', value:'4.8x', x:28, y:16, size:50, body:'需优化' },
        { label:'社区义诊', value:'4.6x', x:24, y:17, size:48, body:'补充触点' }
      ]
    }
  );
  assert(
    denseChannelOps.some(op => op.name === 'addText' && op.args[1] === '效率') &&
      denseChannelOps.some(op => op.name === 'addText' && op.args[1] === '投入'),
    'dense coordinate board should use compact Chinese axes'
  );
  assert(
    denseChannelOps.some(op => op.name === 'addText' && op.args[1] === '01') &&
      denseChannelOps.some(op => op.name === 'addText' && op.args[1] === '大众点评'),
    'dense coordinate board should connect numbered bubbles to a readable rank list'
  );
  assert(
    !denseChannelOps.some(op => op.name === 'addText' && op.args[1] === 'ROAS'),
    'dense coordinate board should avoid the crowded scatter label mode'
  );
  const denseBubbles = denseChannelOps.filter(op => op.name === 'addShape' && op.args[0] === 'ellipse');
  assert(
    denseBubbles.length === 7 && denseBubbles.every(op => ((op.args[1] || {}).w || 0) <= 0.30),
    'dense coordinate board should use compact bubbles instead of oversized overlapping scatter marks'
  );
  ['大众点评', '私域社群', '抖音直播', '线下转介绍', '企业团购', '搜索广告', '社区义诊'].forEach(label => {
    assert(
      denseChannelOps.some(op => op.name === 'addText' && op.args[1] === label),
      `dense coordinate board should keep a readable list row for ${label}`
    );
  });
  const bubbleBoxes = denseBubbles.map(op => op.args[1] || {});
  const bubbleXs = bubbleBoxes.map(box => box.x + box.w / 2);
  const bubbleYs = bubbleBoxes.map(box => box.y + box.h / 2);
  assert(
    Math.max(...bubbleXs) - Math.min(...bubbleXs) > 1.20 &&
      Math.max(...bubbleYs) - Math.min(...bubbleYs) > 1.20,
    'dense coordinate board should normalize clustered real values into a readable plot spread'
  );

  const denseTrendOps = [];
  createMonthlyPulseTrendDrawer(createFakeCtx(denseTrendOps))(
    createSlide(denseTrendOps),
    { x:3.92, y:2.10, w:7.76, h:3.96 },
    {
      monthlyPulse:[
        { label:'2025-01', value:'873.65' },
        { label:'2025-02', value:'666.03' },
        { label:'2025-03', value:'842.10' },
        { label:'2025-04', value:'798.44' },
        { label:'2025-05', value:'720.35' },
        { label:'2025-06', value:'850.22' },
        { label:'2025-07', value:'837.49' }
      ]
    }
  );
  ['873.65', '666.03', '842.10', '798.44', '720.35', '850.22', '837.49'].forEach(value => {
    assert(
      denseTrendOps.some(op => op.name === 'addText' && op.args[1] === value),
      `dense monthly trend should keep value label ${value}`
    );
  });

  const beautyOps = [];
  const beautyRenderers = createFinancialRenderers(createFakeCtx(beautyOps));
  beautyRenderers.metricComparison(createSlide(beautyOps), { slides:[{}], industry:'beauty-consumer' }, {
    title:'利润弹性先于放量修复',
    layoutVariant:'financial-kpi-snapshot',
    proofObject:'monthly-pulse-trend',
    businessLogic:{
      currentState:'Q4 利润转负，Q1 回正。',
      cause:'费用投放增加。',
      action:'预算审批加入利润率和回款。',
      metric:'经营利润率、现金回款'
    },
    chartSpec:{
      kind:'line',
      componentId:'line-chart',
      series:[{
        values:[
          { category:'2025Q4', value:-7.7, rawValue:'-7.7%', note:'转负' },
          { category:'2026Q1', value:2.8, rawValue:'2.8%', note:'回正' }
        ]
      }]
    },
    metrics:[
      { label:'Q4利润', value:'-7.7%', note:'已回正' },
      { label:'Q1利润', value:'2.8%', note:'现金口径' }
    ]
  }, 1);
  assert(
    beautyOps.some(op => op.name === 'sectionKicker' && op.args[1] === '月度趋势'),
    'beauty chart evidence should route metric-comparison through industry chart slide'
  );
  assert(
    !beautyOps.some(op => op.name === 'addLabel' && op.args[1] === 'PRIMARY KPI'),
    'beauty chart evidence should not fall back to the financial KPI snapshot template'
  );
  const currentStateLabel = beautyOps.find(op => op.name === 'addLabel' && op.args[1] === '现状');
  assert(
    currentStateLabel &&
      (currentStateLabel.args[2] || {}).x >= 3.90 &&
      (currentStateLabel.args[2] || {}).y >= 5.50 &&
      (currentStateLabel.args[2] || {}).y <= 6.20,
    'beauty chart evidence should place business logic inside the main content area'
  );
  const currentStateText = beautyOps.find(op => op.name === 'addText' && op.args[1] === 'Q4 利润转负，Q1 回正。');
  assert(currentStateText, 'expected beauty chart business logic body');
  const currentStateBox = currentStateLabel.args[2] || {};
  const currentStateTextBox = currentStateText.args[2] || {};
  assertNear(
    (currentStateBox.y + currentStateTextBox.y + currentStateTextBox.h) / 2,
    5.78 + 0.74 / 2,
    'beauty chart logic card stack center'
  );
  assert.strictEqual(currentStateTextBox.valign, 'mid');
  ['现状', '原因', '动作', '衡量'].forEach(label => {
    assert(
      beautyOps.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected beauty chart business logic label ${label}`
    );
  });

  const sparseOps = [];
  const sparseRenderers = createFinancialIndustryRenderers(createFakeCtx(sparseOps));
  const repeatedLogicSlide = i => ({
    type:'industry-chart',
    variant:'channel-efficiency-matrix',
    title:`Repeated logic ${i}`,
    businessLogic:{
      currentState:'同一经营诊断',
      cause:'同一原因',
      action:'同一动作',
      metric:'同一衡量'
    },
    metrics:[
      { label:'A', value:'10' },
      { label:'B', value:'8' }
    ]
  });
  const repeatedLogicPlan = { industry:'brand-retail', slides:[1, 2, 3, 4].map(repeatedLogicSlide) };
  repeatedLogicPlan.slides.forEach((slideSpec, index) => {
    sparseRenderers.industryChartSlide(createSlide(sparseOps), repeatedLogicPlan, slideSpec, index + 1);
  });
  assert(
    !sparseOps.some(op => op.name === 'addLabel' && op.args[1] === '现状'),
    'repeated industry chart slides should not auto-render the same business logic card row on every page'
  );

  const explicitLogicOps = [];
  const explicitRenderers = createFinancialIndustryRenderers(createFakeCtx(explicitLogicOps));
  const explicitPlan = { industry:'brand-retail', slides:[1, 2, 3, 4].map(repeatedLogicSlide) };
  explicitRenderers.industryChartSlide(createSlide(explicitLogicOps), explicitPlan, Object.assign({}, explicitPlan.slides[0], {
    businessLogicMode:'show'
  }), 1);
  assert(
    explicitLogicOps.some(op => op.name === 'addLabel' && op.args[1] === '现状'),
    'explicit businessLogicMode=show should still render a diagnostic logic row'
  );

  const fullBoardOps = [];
  const fullBoardRenderers = createFinancialIndustryRenderers(createFakeCtx(fullBoardOps));
  fullBoardRenderers.industryChartSlide(createSlide(fullBoardOps), { slides:[{}] }, {
    variant:'adoption-funnel',
    title:'活动复盘要看完整漏斗',
    subtitle:'不要只看单场 ROAS',
    adoptionFunnel:[
      { title:'曝光', value:100 },
      { title:'点击', value:64 },
      { title:'加购', value:46 },
      { title:'复购', value:28 }
    ]
  }, 1);
  assert(
    fullBoardOps.some(op => op.name === 'addRect'
      && op.args[1] === 0.92
      && op.args[2] === 2.10
      && op.args[3] === 10.84
      && op.args[4] === 4.16),
    'full-board industry variants should use the wide content board'
  );
  assert(
    !fullBoardOps.some(op => op.name === 'addLabel' && op.args[1] === '经营依据'),
    'full-board industry variants should not repeat the left proof rail shell'
  );
  assert(
    fullBoardOps.some(op => op.name === 'addLabel' && op.args[1] === '阶段转化链路'),
    'adoption funnel should render as a stage conversion board'
  );

  const largeFunnelOps = [];
  const largeFunnelRenderers = createFinancialIndustryRenderers(createFakeCtx(largeFunnelOps));
  largeFunnelRenderers.industryChartSlide(createSlide(largeFunnelOps), { slides:[{}] }, {
    variant:'adoption-funnel',
    title:'活动复盘要看完整漏斗',
    subtitle:'不要把跨量级漏斗画成普通条形图',
    adoptionFunnel:[
      { title:'曝光', value:3073197, note:'Prime Day' },
      { title:'点击', value:85809 },
      { title:'线索', value:7019 },
      { title:'订单', value:2533 }
    ]
  }, 1);
  assert(
    largeFunnelOps.some(op => op.name === 'addText' && op.args[1] === '307.3万'),
    'large adoption funnel should compact high-volume counts'
  );
  assert(
    largeFunnelOps.some(op => op.name === 'addText' && op.args[1] === '8.58万'),
    'large adoption funnel should keep mid-volume counts readable'
  );
  assert(
    largeFunnelOps.some(op => op.name === 'addText' && String(op.args[1]).includes('曝光→点击 2.8%')),
    'large adoption funnel should show adjacent conversion rates'
  );
  assert(
    !largeFunnelOps.some(op => op.name === 'addText' && /3073197%|85809%|7019%|2533%/.test(String(op.args[1]))),
    'large adoption funnel should not append fake percent units to raw counts'
  );

  const memberOps = [];
  const memberCtx = createFakeCtx(memberOps);
  memberCtx.renderChartSpec = () => {
    memberOps.push({ name:'renderChartSpecCalled', args:[] });
    return { rendered:true };
  };
  const memberRenderers = createFinancialIndustryRenderers(memberCtx);
  memberRenderers.industryChartSlide(createSlide(memberOps), { slides:[{}] }, {
    variant:'member-cohort-ladder',
    title:'会员结构要用分层动作承接',
    subtitle:'不能被通用 scorecard 抢占布局',
    chartSpec:{
      kind:'scorecard',
      componentId:'scorecard',
      series:[{ values:[{ category:'样本量', value:60, rawValue:'60条次' }] }]
    },
    memberCohorts:[
      { title:'新客', value:'31%', body:'首购转化' },
      { title:'活跃会员', value:'42%', body:'复购贡献' },
      { title:'高价值会员', value:'18%', body:'客单提升' },
      { title:'沉睡会员', value:'9%', body:'召回动作' }
    ]
  }, 1);
  assert(
    memberOps.some(op => op.name === 'addText' && op.args[1] === '新客'),
    'member-cohort-ladder should render the native cohort ladder'
  );
  assert(
    !memberOps.some(op => op.name === 'renderChartSpecCalled'),
    'member-cohort-ladder should not let generic chartSpec scorecard consume the board first'
  );

  const factMetricOps = [];
  const factMetricCtx = createFakeCtx(factMetricOps);
  factMetricCtx.renderChartSpec = () => {
    factMetricOps.push({ name:'renderChartSpecCalled', args:[] });
    return { rendered:true };
  };
  const factMetricRenderers = createFinancialIndustryRenderers(factMetricCtx);
  factMetricRenderers.industryChartSlide(createSlide(factMetricOps), { slides:[{}] }, {
    variant:'fact-metrics',
    title:'事实指标要保留经营依据侧栏',
    subtitle:'避免全屏四卡片模板吞掉页面设计',
    chartSpec:{
      kind:'scorecard',
      componentId:'scorecard',
      series:[{ values:[{ category:'样本量', value:60, rawValue:'60条次' }] }]
    },
    items:[
      { title:'样本量', body:'60条次' },
      { title:'物流顾虑', body:'16次' }
    ]
  }, 1);
  assert(
    factMetricOps.some(op => op.name === 'addLabel' && op.args[1] === '经营依据'),
    'fact-metrics should keep the operating-basis rail instead of becoming full-page cards'
  );
  assert(
    factMetricOps.some(op => op.name === 'addRect'
      && op.args[1] === 3.92
      && op.args[2] === 2.10
      && op.args[3] === 7.76),
    'fact-metrics should use the standard board beside the proof rail'
  );
  assert(
    !factMetricOps.some(op => op.name === 'renderChartSpecCalled'),
    'fact-metrics should not let generic scorecard consume the board first'
  );

  const longTitleOps = [];
  const longTitleRenderers = createFinancialIndustryRenderers(createFakeCtx(longTitleOps));
  longTitleRenderers.industryChartSlide(createSlide(longTitleOps), { slides:[{}] }, {
    variant:'channel-efficiency-matrix',
    title:'五个平台收入接近，资源动作必须按效率分层',
    subtitle:'各平台营收差距不大，但退款率、复购率和 ROAS 结构不同。',
    channels:[
      { label:'Amazon', value:'8x', x:22, y:82, size:64 }
    ]
  }, 1);
  const longTitle = longTitleOps.find(op => op.name === 'addText' && op.args[1] === '五个平台收入接近，资源动作必须按效率分层');
  const longSubtitle = longTitleOps.find(op => op.name === 'addText' && op.args[1] === '各平台营收差距不大，但退款率、复购率和 ROAS 结构不同。');
  assert(longTitle && longSubtitle, 'expected long-title industry page header');
  assert.strictEqual((longTitle.args[2] || {}).w, 10.12, 'long-but-not-extra title should get wide header space');
  assert.strictEqual((longSubtitle.args[2] || {}).y, 1.72, 'single-line long title should not force an excessive subtitle gap');

  console.log('financial industry renderers ok');
}

main();
