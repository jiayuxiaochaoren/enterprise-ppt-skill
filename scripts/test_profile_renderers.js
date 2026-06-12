#!/usr/bin/env node
const assert = require('assert');
const {
  createProfileRenderers,
  entries,
  types
} = require('./render/page-families/profile');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    EvidenceImageFrame: (...args) => record('EvidenceImageFrame', args),
    MetricStrip: (...args) => record('MetricStrip', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addEquipmentNameplate: (...args) => record('addEquipmentNameplate', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkLine:'334155',
      darkMuted:'94A3B8',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    designForSlide: () => ({ imagePath:'' }),
    fileExists: () => false,
    footerText: () => 'Footer',
    galleryImages: () => [],
    imageAspect: () => 1.6,
    isCompanyIntroPlan: () => false,
    itemTitle: (item, fallback = '') => {
      if (typeof item === 'string') return item;
      return (item && (item.title || item.label || item.value)) || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    mediaForRole: () => '',
    panelFill: () => 'F8FAFC',
    publicSlideNote: value => value || '',
    resolveAssetPath: value => value || '',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args)
  };
}

function profileSection(overrides = {}) {
  return {
    title:'Profile',
    subtitle:'Profile proof',
    company:'Example Co.',
    description:'Profile description',
    metrics:[
      { value:'1993', label:'Founded' },
      { value:'42', label:'Projects' }
    ],
    cards:[
      { title:'Proof 1', body:'Proof body' },
      { title:'Proof 2', body:'Proof body' }
    ],
    ...overrides
  };
}

function hasOp(ops, name, value) {
  return ops.some(op => op.name === name && op.args.includes(value));
}

function assertStandardFooters(ops, expectedCount) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, expectedCount, `expected ${expectedCount} standard profile footers`);
  footers.forEach(op => {
    const opts = op.args[2] || {};
    assert.equal(opts.x, 0.82, 'profile footer x should use primitive default');
    assert.equal(opts.y, 7.05, 'profile footer y should use primitive default');
    assert.equal(opts.w, 7.8, 'profile footer width should use primitive default');
    assert.equal(opts.h, 0.16, 'profile footer height should use primitive default');
    assert.equal(opts.fontSize, 7.8, 'profile footer font size should use primitive default');
    assert.equal(opts.color, '64748B', 'profile footer color should preserve muted token');
  });
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.0001, `${label}: expected ${expected}, got ${actual}`);
}

function findTextBox(ops, text, expected) {
  return ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== text) return false;
    const opts = op.args[2] || {};
    return Object.entries(expected).every(([key, value]) => opts[key] === value);
  });
}

function findTextBoxNear(ops, text, expected) {
  return ops.find(op => {
    if (op.name !== 'addText' || op.args[1] !== text) return false;
    const opts = op.args[2] || {};
    return Object.entries(expected).every(([key, value]) => {
      if (typeof value === 'number') return Math.abs((opts[key] || 0) - value) < 0.0001;
      return opts[key] === value;
    });
  });
}

function countTextBoxes(ops, text, expected) {
  return ops.filter(op => {
    if (op.name !== 'addText' || op.args[1] !== text) return false;
    const opts = op.args[2] || {};
    return Object.entries(expected).every(([key, value]) => opts[key] === value);
  }).length;
}

function assertHeaderText(ops, text, expected) {
  const box = findTextBox(ops, text, expected);
  assert(box, `expected header text ${text}`);
  const opts = box.args[2] || {};
  assertNear(opts.x, expected.x, `${text} x`);
  assertNear(opts.y, expected.y, `${text} y`);
  assertNear(opts.w, expected.w, `${text} width`);
  assertNear(opts.h, expected.h, `${text} height`);
  assertNear(opts.fontSize, expected.fontSize, `${text} font`);
  assert.equal(opts.bold, expected.bold);
  assert.equal(opts.color, expected.color);
  assert.equal(opts.fit, 'shrink');
  if (expected.breakLine != null) assert.equal(opts.breakLine, expected.breakLine);
}

function assertProfileHeaders(ops) {
  assert.equal(ops.filter(op => op.name === 'lightCanvas').length, 3, 'expected three primitive light profile headers');
  assertHeaderText(ops, 'Example Co.', {
    x:0.84, y:1.14, w:4.62, h:0.72, fontSize:24.5, bold:true, color:'111827', fit:'shrink', breakLine:true
  });
  assertHeaderText(ops, 'Profile proof', {
    x:0.86, y:2.06, w:4.60, h:0.22, fontSize:10.6, color:'334155', fit:'shrink'
  });
  assertHeaderText(ops, 'Profile', {
    x:0.84, y:1.04, w:5.40, h:0.36, fontSize:24.0, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Profile proof', {
    x:0.86, y:1.52, w:6.20, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  assertHeaderText(ops, 'Profile', {
    x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:'111827', fit:'shrink'
  });
  assertHeaderText(ops, 'Profile proof', {
    x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  });
  assert.equal(countTextBoxes(ops, 'Profile proof', {
    x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:'64748B', fit:'shrink'
  }), 2, 'expected manufacturing and generic proof subtitles to share primitive contract');
  ['01', '02', '03'].forEach(label => {
    const op = ops.find(candidate => candidate.name === 'addNumber' && candidate.args[1] === label);
    assert(op, `expected profile page number ${label}`);
    const opts = op.args[2] || {};
    assertNear(opts.x, 11.70, `${label} page number x`);
    assertNear(opts.y, 0.66, `${label} page number y`);
    assertNear(opts.w, 0.72, `${label} page number width`);
    assertNear(opts.h, 0.22, `${label} page number height`);
    assertNear(opts.fontSize, 13, `${label} page number font`);
    assert.equal(opts.color, '2563EB');
    assert.equal(opts.align, 'right');
  });
  assertHeaderText(ops, 'Profile', {
    x:0.82, y:1.06, w:6.3, h:0.38, fontSize:24, bold:true, color:'FFFFFF', fit:'shrink'
  });
  assertHeaderText(ops, 'Profile proof', {
    x:0.84, y:1.54, w:6.4, h:0.20, fontSize:10.2, color:'94A3B8', fit:'shrink'
  });
  const darkPage = ops.find(candidate => {
    if (candidate.name !== 'addNumber' || candidate.args[1] !== '04') return false;
    const opts = candidate.args[2] || {};
    return opts.x === 11.76 && opts.y === 0.74 && opts.w === 0.58 && opts.h === 0.18;
  });
  assert(darkPage, 'expected finance profile dark page number 04');
  const darkOpts = darkPage.args[2] || {};
  assertNear(darkOpts.fontSize, 11.5, '04 dark page number font');
  assert.equal(darkOpts.color, '2563EB');
  assert.equal(darkOpts.align, 'right');

  const quotePage = ops.find(candidate => {
    if (candidate.name !== 'addText' || candidate.args[1] !== '05') return false;
    const opts = candidate.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.76 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(quotePage, 'expected quote proof text page number 05');
  const quoteOpts = quotePage.args[2] || {};
  assertNear(quoteOpts.fontSize, 13, '05 quote page number font');
  assert.equal(quoteOpts.bold, true);
  assert.equal(quoteOpts.color, '2563EB');
  assert.equal(quoteOpts.align, 'right');
}

function assertQuoteStageShell(ops) {
  const stages = ops.filter(op => op.name === 'stageCanvas');
  assert(stages.some(op => (op.args[1] || {}).field === false), 'expected quote proof dark stage canvas');
  const circle = ops.find(op => {
    if (op.name !== 'addDarkBreathingCircle') return false;
    const args = op.args;
    return args[1] === 8.72 && args[2] === 0.70 && args[3] === 3.88 && args[4] === 2.10 && args[5] === '2563EB';
  });
  assert(circle, 'expected quote proof breathing circle to keep original geometry');
  const label = ops.find(op => {
    if (op.name !== 'addLabel' || op.args[1] !== 'CUSTOMER VOICE') return false;
    const opts = op.args[2] || {};
    return opts.x === 0.86 && opts.y === 0.94 && opts.w === 1.92 && opts.h === 0.14;
  });
  assert(label, 'expected quote proof kicker to keep original geometry');
}

function assertProfileProofShell(ops) {
  const identityPanel = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.10
    && op.args[3] === 3.18
    && op.args[4] === 3.72);
  assert(identityPanel, 'expected profile proof identity panel');

  const identityLabel = ops.find(op => {
    if (op.name !== 'addLabel' || op.args[1] !== 'IDENTITY') return false;
    const opts = op.args[2] || {};
    return opts.x === 1.20 && opts.y === 2.44 && opts.w === 1.0 && opts.h === 0.10;
  });
  assert(identityLabel, 'expected profile proof identity label');

  [
    ['Example Co.', { x:1.20, y:2.90, w:2.12, h:0.36, fontSize:18.8, bold:true, color:'FFFFFF', fit:'shrink' }],
    ['Profile description', { x:1.20, y:3.58, w:2.30, h:0.70, fontSize:8.8, color:'CBD5E1', breakLine:true, fit:'shrink' }],
    ['以可验证经验建立决策信任', { x:1.20, y:5.05, w:2.12, h:0.14, fontSize:7.4, color:'94A3B8', fit:'shrink' }]
  ].forEach(([text, expected]) => {
    assert(
      findTextBox(ops, text, expected),
      `expected profile proof text ${text}`
    );
  });

  [
    [4.64, 2.18, 2.70, 1.16],
    [7.68, 2.18, 2.70, 1.16]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected profile proof metric card ${x}/${y}`);
  });

  ['PROOF 01', 'PROOF 02'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected profile proof card label ${label}`
    );
  });
  ['1993', '42', 'Founded', 'Projects'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected profile proof card content ${text}`
    );
  });
}

function assertFinanceProfileProofShell(ops) {
  const credentialsPanel = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.08
    && op.args[3] === 4.18
    && op.args[4] === 4.00);
  assert(credentialsPanel, 'expected finance profile credentials panel');

  const credentialsLabel = ops.find(op => {
    if (op.name !== 'addLabel' || op.args[1] !== 'MANAGER CREDENTIALS') return false;
    const opts = op.args[2] || {};
    return opts.x === 1.26 && opts.y === 2.46 && opts.w === 1.86 && opts.h === 0.11;
  });
  assert(credentialsLabel, 'expected finance profile credentials label geometry');

  [
    ['Example Co.', { x:1.26, y:2.96, w:2.74, h:0.42, fontSize:20, bold:true, color:'FFFFFF', fit:'shrink' }],
    ['Profile description', { x:1.26, y:3.78, w:2.86, h:0.78, fontSize:8.8, color:'CBD5E1', breakLine:true, fit:'shrink' }],
    ['以历史业绩、项目经验和复盘机制建立长期信任。', { x:1.26, y:5.34, w:2.74, h:0.18, fontSize:7.4, color:'94A3B8', fit:'shrink' }]
  ].forEach(([text, expected]) => {
    assert(
      findTextBoxNear(ops, text, expected),
      `expected finance profile credentials text ${text}`
    );
  });

  const trackRecordLabel = ops.find(op => {
    if (op.name !== 'addLabel' || op.args[1] !== 'TRACK RECORD SIGNALS') return false;
    const opts = op.args[2] || {};
    return opts.x === 5.62 && opts.y === 2.18 && opts.w === 1.86 && opts.h === 0.11;
  });
  assert(trackRecordLabel, 'expected finance track record label geometry');

  [
    [5.62, 2.56, 2.62, 1.20],
    [8.64, 2.56, 2.62, 1.20]
  ].forEach(([x, y, w, h]) => {
    const op = ops.find(candidate => candidate.name === 'addRect'
      && candidate.args[1] === x
      && candidate.args[2] === y
      && candidate.args[3] === w
      && candidate.args[4] === h);
    assert(op, `expected finance track record card ${x}/${y}`);
  });

  const noteStrip = ops.find(op => op.name === 'addRect'
    && op.args[1] === 5.62
    && op.args[2] === 6.34
    && op.args[3] === 4.98
    && op.args[4] === 0.34);
  assert(noteStrip, 'expected finance note strip geometry');

  ['1993', '42', 'Founded', 'Projects'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected finance track record content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const renderers = createProfileRenderers(createFakeCtx(ops));
  assert.deepEqual(types, ['company-profile-spread', 'profile-proof', 'quote-proof']);
  assert.equal(typeof renderers.companyProfileSpread, 'function');
  assert.equal(typeof renderers.profileProof, 'function');
  assert.equal(typeof renderers.quoteProof, 'function');
  assert.equal(entries(renderers).length, 3);

  renderers.companyProfileSpread(createSlide(ops), { title:'Generic Co.' }, profileSection(), 1);
  renderers.companyProfileSpread(createSlide(ops), { title:'Factory Co.', industry:'manufacturing-operations' }, profileSection(), 2);
  renderers.profileProof(createSlide(ops), { organization:'Generic Co.' }, profileSection(), 3);
  renderers.profileProof(createSlide(ops), { organization:'Fund Co.', industry:'finance-investment' }, profileSection(), 4);
  renderers.quoteProof(createSlide(ops), {}, profileSection({ quote:'Customer quote' }), 5);

  assert(hasOp(ops, 'sectionKicker', '公司概况'), 'expected company profile spread');
  assert(hasOp(ops, 'addLabel', '制造基础'), 'expected manufacturing profile branch');
  assert(hasOp(ops, 'sectionKicker', 'PROFILE PROOF'), 'expected generic profile proof branch');
  assert(hasOp(ops, 'sectionKicker', 'INVESTMENT PLATFORM PROOF'), 'expected finance profile proof branch');
  assert(hasOp(ops, 'addLabel', 'MANAGER CREDENTIALS'), 'expected finance credentials panel');
  assert(hasOp(ops, 'addLabel', 'CUSTOMER VOICE'), 'expected quote proof branch');
  assert(ops.some(op => op.name === 'EvidenceImageFrame'), 'expected image frame path');
  assert(ops.some(op => op.name === 'MetricStrip'), 'expected metric strip path');
  assert(ops.some(op => op.name === 'addEquipmentNameplate'), 'expected manufacturing fallback plate');
  assertProfileHeaders(ops);
  assertProfileProofShell(ops);
  assertFinanceProfileProofShell(ops);
  assertQuoteStageShell(ops);
  assertStandardFooters(ops, 5);
  assert(ops.filter(op => op.name === 'addText').length >= 30, 'expected profile text output');

  console.log('profile renderers ok');
}

main();
