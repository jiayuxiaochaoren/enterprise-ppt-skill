#!/usr/bin/env node
const assert = require('assert');
const {
  createBusinessRenderers,
  entries,
  reportBoardItems,
  types
} = require('./render/page-families/business');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    addVisualPhotoPanel: (...args) => {
      record('addVisualPhotoPanel', args);
      return false;
    },
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkMuted:'94A3B8',
      ink:'0F172A',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      paper:'F7FAFD',
      softBlue:'EFF6FF',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    copyFallback: (_plan, key, fallback = '') => fallback || key,
    footerText: () => 'Footer',
    itemBody: (item = {}, fallback = '') => item.body || item.summary || item.note || fallback,
    itemTitle: (item = {}, fallback = '') => item.title || item.label || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    premiumTitle: value => value,
    profileFont: () => 'Fixture Sans',
    publicSlideNote: value => value || '',
    reportBoardNeedsRightOverlayRail: () => false,
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function businessSection(overrides = {}) {
  return {
    title:'Business section',
    intro:'Business intro',
    claim:'Business claim',
    note:'Business note',
    cards:[
      { title:'Card 1', body:'Card body 1' },
      { title:'Card 2', body:'Card body 2' },
      { title:'Card 3', body:'Card body 3' },
      { title:'Card 4', body:'Card body 4' }
    ],
    ...overrides
  };
}

function assertBusinessFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 6, 'expected six business footer draws across exercised branches');

  const sidebar = footers.find(op => (op.args[2] || {}).x === 0.62);
  assert(sidebar, 'expected executive sidebar footer');
  assert.equal(sidebar.args[2].y, 6.86);
  assert.equal(sidebar.args[2].w, 2.6);
  assert.equal(sidebar.args[2].h, 0.14);
  assert.equal(sidebar.args[2].fontSize, 7.5);
  assert.equal(sidebar.args[2].color, '64748B');

  const standardFooters = footers.filter(op => (op.args[2] || {}).x === 0.82);
  assert.equal(standardFooters.length, 5, 'expected five standard business footers');
  standardFooters.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.y, 7.05);
    assert.equal(opts.w, 7.8);
    assert.equal(opts.h, 0.16);
    assert.equal(opts.fontSize, 7.8);
  });
  assert.equal(standardFooters.filter(op => op.args[2].color === '64748B').length, 4);
  assert.equal(standardFooters.filter(op => op.args[2].color === '738297').length, 1);
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertHeaderText(ops, text, expected) {
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
  if (expected.bold != null) assert.strictEqual(opts.bold, expected.bold, `${text} bold`);
  if (expected.color) assert.strictEqual(opts.color, expected.color, `${text} color`);
  if (expected.fit) assert.strictEqual(opts.fit, expected.fit, `${text} fit`);
}

function assertComparisonHeader(ops) {
  assertHeaderText(ops, 'Comparison section', {
    x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Comparison claim', {
    x:0.86, y:1.52, w:6.4, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  const pageNumber = ops.find(op => (
    op.name === 'addNumber'
    && op.args[1] === '04'
    && Math.abs(((op.args[2] || {}).x) - 11.70) < 0.001
  ));
  assert(pageNumber, 'expected comparison page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.x, 11.70, '04 page number x');
  assertNear(opts.y, 0.66, '04 page number y');
  assertNear(opts.w, 0.72, '04 page number width');
  assertNear(opts.h, 0.22, '04 page number height');
  assertNear(opts.fontSize, 13, '04 page number font');
  assert.strictEqual(opts.color, '2563EB', '04 page number color');
  assert.strictEqual(opts.align, 'right', '04 page number align');
}

function assertReportBoardHeader(ops) {
  assertHeaderText(ops, 'Business section', {
    x:0.84, y:1.04, w:6.2, h:0.36, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Business claim', {
    x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  [2, 3].forEach(value => {
    const pageNumber = ops.find(op => op.name === 'PageNumber' && op.args[1] === value);
    assert(pageNumber, `expected report board PageNumber ${value}`);
    assert.deepEqual(pageNumber.args[2], {}, `expected report board PageNumber ${value} opts`);
  });
}

function assertLongReportBoardHeader(ops) {
  const titleText = '多渠道经营底座已成型，2026 年要转向质量增长';
  const subtitleText = '684 个在售 SKU 与五大平台支撑规模基础，下一步同步看营收、毛利和复购。';
  const title = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === titleText);
  assert(title, 'expected long report-board title');
  const titleOpts = title.args[2] || {};
  assert(titleOpts.y > 1.04, 'long title should move below the header boundary');
  assert(titleOpts.h > 0.70, 'long title should reserve two-line height');
  assert.strictEqual(titleOpts.breakLine, true, 'long title should allow line wrapping');

  const subtitle = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === subtitleText);
  assert(subtitle, 'expected long report-board subtitle');
  const subtitleOpts = subtitle.args[2] || {};
  assert(subtitleOpts.y >= titleOpts.y + titleOpts.h + 0.11, 'subtitle should stay below long title');

  const executivePanel = ops.find(op => (
    op.name === 'addRect' &&
    Math.abs((op.args[1] || 0) - 0.92) < 0.001 &&
    Math.abs((op.args[3] || 0) - 2.78) < 0.001 &&
    (op.args[2] || 0) > 2.08
  ));
  assert(executivePanel, 'long report-board content should move below expanded header');
  const evidencePanel = ops.find(op => (
    op.name === 'addRect' &&
    Math.abs((op.args[1] || 0) - 4.12) < 0.001 &&
    (op.args[2] || 0) > 2.08
  ));
  assert(evidencePanel, 'long report-board evidence stack should move below expanded header');
}

function assertValueTilesHeader(ops) {
  assertHeaderText(ops, 'Value section', {
    x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:'111827'
  });
  assertHeaderText(ops, 'Value intro', {
    x:0.86, y:1.52, w:5.7, h:0.22, fontSize:10.8, color:'64748B'
  });
  ['Value section', 'Value intro'].forEach(text => {
    const op = ops.find(candidate => candidate.name === 'addText' && candidate.args[1] === text);
    assert(op, `expected ${text}`);
    assert.strictEqual(op.args[2].fit, undefined, `${text} should preserve no fit option`);
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== '05') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageNumber, 'expected value tiles text page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 13, '05 page number font');
  assert.strictEqual(opts.bold, true, '05 page number bold');
  assert.strictEqual(opts.color, '2563EB', '05 page number color');
  assert.strictEqual(opts.align, 'right', '05 page number align');
}

function main() {
  const ops = [];
  const renderers = createBusinessRenderers(createFakeCtx(ops));
  assert.deepEqual(types, ['cards', 'executive-blocks', 'comparison', 'report-board', 'value-tiles']);
  assert.equal(entries(renderers).length, 4);
  ['executiveBlocks', 'reportBoard', 'comparisonSlide', 'valueTiles'].forEach(name => {
    assert.equal(typeof renderers[name], 'function', `${name} should be exported`);
  });
  assert.deepEqual(reportBoardItems({ rows:[['A', 'B', 'C'], 'D'] }), [
    { title:'A', body:'C' },
    { title:'D', body:'' }
  ]);

  renderers.executiveBlocks(createSlide(ops), {}, businessSection(), 1);
  renderers.reportBoard(createSlide(ops), {}, businessSection({
    rows:[
      { title:'Short 1', body:'Short body 1' },
      { title:'Short 2', body:'Short body 2' },
      { title:'Short 3', body:'Short body 3' }
    ]
  }), 2);
  renderers.reportBoard(createSlide(ops), {}, businessSection(), 3);
  renderers.reportBoard(createSlide(ops), {}, businessSection({
    title:'多渠道经营底座已成型，2026 年要转向质量增长',
    claim:'684 个在售 SKU 与五大平台支撑规模基础，下一步同步看营收、毛利和复购。',
    label:'经营底座',
    sections:[
      { title:'成立年份', body:'2018 · 经营底座' },
      { title:'员工规模', body:'214人 · 团队规模' },
      { title:'在售 SKU', body:'684个 · 产品宽度' },
      { title:'2026 目标', body:'+27% · 营收同比增长' }
    ]
  }), 6);
  renderers.comparisonSlide(createSlide(ops), {}, businessSection({
    title:'Comparison section',
    claim:'Comparison claim',
    columns:[
      { title:'Before', items:['Slow', 'Manual', 'Opaque'] },
      { title:'After', items:['Fast', 'Automated', 'Visible'] }
    ]
  }), 4);
  renderers.valueTiles(createSlide(ops), {}, businessSection({
    title:'Value section',
    intro:'Value intro'
  }), 5);

  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'REPORT BOARD'), 'expected report board branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === '经营底座'), 'expected localized report board branch');
  assert(ops.some(op => op.name === 'addLabel' && op.args[1] === '关键依据'), 'expected public report-board evidence label');
  assert(!ops.some(op => op.name === 'addLabel' && op.args[1] === '证据栈'), 'report-board should not emit developer evidence-stack copy');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'COMPARISON'), 'expected comparison branch');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'VALUE SIGNAL'), 'expected value tiles branch');
  assertReportBoardHeader(ops);
  assertLongReportBoardHeader(ops);
  assertComparisonHeader(ops);
  assertValueTilesHeader(ops);
  assert(ops.filter(op => op.name === 'addVisualPhotoPanel').length >= 2, 'expected visual fallback paths');
  assert(ops.filter(op => op.name === 'PageNumber').length >= 2, 'expected page number helper paths');
  assertBusinessFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected business text output');

  const denseOps = [];
  createBusinessRenderers(createFakeCtx(denseOps)).reportBoard(createSlide(denseOps), {}, businessSection({
    sections:[
      { title:'体质辨识服务', body:'收入贡献高，适合承接会员转化和复诊计划。' },
      { title:'企业员工健康日', body:'客单稳定，适合联动企业团购和体检后调理。' },
      { title:'火龙灸温养套餐', body:'新品爬坡快，需要提升复购承接和排班稳定性。' },
      { title:'女性宫寒调理', body:'复购表现好，适合做季节化服务包。' },
      { title:'正骨评估与治疗', body:'毛利率高，但交付排期需要更稳定。' },
      { title:'穴位埋线管理', body:'会员转化好，需要强化疗程跟进。' }
    ]
  }), 9);
  assert(
    denseOps.some(op => op.name === 'addText' && op.args[1] === '体质辨识服务') &&
      denseOps.some(op => op.name === 'addNumber' && op.args[1] === '06'),
    'dense report-board should render a readable indexed list for six evidence items'
  );

  console.log('business renderers ok');
}

main();
