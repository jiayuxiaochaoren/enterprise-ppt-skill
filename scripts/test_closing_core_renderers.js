#!/usr/bin/env node
const assert = require('assert');
const {
  createClosingRenderers
} = require('./render/page-families/closing');
const {
  createClosingCoreRenderers
} = require('./render/page-families/closing-core');

function createSlide(ops) {
  return {
    addImage: (...args) => ops.push({ name:'addImage', args }),
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops, activePlanRef) {
  const record = (name, args) => ops.push({ name, args });
  const fallback = {
    closingContactFallback: 'Contact pending',
    closingDecisionOutcome: 'Decision ready',
    closingNote: 'Confirm final decision and owner.',
    closingSimpleSubtitle: 'Next step alignment.',
    closingSimpleTitle: 'Thank you',
    closingSubtitle: 'Move from review to action.',
    closingTitle: 'Final alignment',
    fallbackCaption: 'Reference visual'
  };
  return {
    ContactBlock: (...args) => {
      record('ContactBlock', args);
      return false;
    },
    activePlan: () => activePlanRef.current,
    addArrowLine: (...args) => record('addArrowLine', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addEnergyLens: (...args) => record('addEnergyLens', args),
    addEnergyMotionBackdrop: (...args) => {
      record('addEnergyMotionBackdrop', args);
      return false;
    },
    addEnergyPhotoBackdrop: (...args) => record('addEnergyPhotoBackdrop', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addLightBreathingCircle: (...args) => record('addLightBreathingCircle', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    addVisualPhotoBackdrop: (...args) => {
      record('addVisualPhotoBackdrop', args);
      return false;
    },
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      darkLine: '334155',
      darkMuted: '94A3B8',
      darkText: 'E2E8F0',
      ink: '0F172A',
      ink2: '111827',
      line: 'CBD5E1',
      muted: '64748B',
      onAccent: 'FFFFFF',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    copyFallback: (_plan, key) => fallback[key] || key,
    copyPolicyList: () => [
      { title:'Scope', body:'Confirm scope.' },
      { title:'Owner', body:'Assign owner.' },
      { title:'Review', body:'Schedule review.' }
    ],
    coverMetaText: plan => [plan.organization, plan.audience, plan.date].filter(Boolean).join(' | '),
    designForSlide: () => ({ wantsImage:false, imagePath:'' }),
    fileExists: () => false,
    footerText: () => 'Footer',
    galleryImages: () => [],
    isCompanyIntroPlan: plan => Boolean(plan && plan.isCompanyIntro),
    itemBody: value => {
      if (typeof value === 'string') return '';
      return (value && (value.body || value.note || value.text)) || '';
    },
    itemTitle: (value, fallbackText = '') => {
      if (typeof value === 'string') return value;
      return (value && (value.title || value.label || value.value)) || fallbackText;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    mediaForRole: () => '',
    metaDisabled: () => false,
    panelFill: () => 'F8FAFC',
    presentationSpec: () => ({ coverTone:'dark' }),
    profileFont: () => 'Aptos Display',
    resolveAssetPath: value => value,
    sectionKicker: (...args) => record('sectionKicker', args),
    smartPhotoFit: () => 'cover',
    stageCanvas: (...args) => record('stageCanvas', args),
    surfaceFill: () => 'FFFFFF',
    typeSize: (_name, fallbackSize) => fallbackSize,
    variantOf: section => section.variant || section.layoutVariant || section.closingVariant || ''
  };
}

function section(overrides = {}) {
  return {
    title: 'Final alignment',
    subtitle: 'Move from review to action.',
    note: 'Confirm final decision and owner.',
    decision: 'Proceed with the rollout.',
    actions: [
      { title:'Scope', body:'Confirm scope.' },
      { title:'Owner', body:'Assign owner.' },
      { title:'Review', body:'Schedule review.' }
    ],
    contacts: ['ops@example.com', 'PMO'],
    ...overrides
  };
}

function hasOp(ops, name, value) {
  return ops.some(op => op.name === name && op.args.includes(value));
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
  if (expected.bold != null) assert.equal(opts.bold, expected.bold, `${text} bold`);
  if (expected.color) assert.equal(opts.color, expected.color, `${text} color`);
  if (expected.fit) assert.equal(opts.fit, expected.fit, `${text} fit`);
  if (expected.breakLine != null) assert.equal(opts.breakLine, expected.breakLine, `${text} breakLine`);
}

function assertDecisionSummaryHeader(ops) {
  assertHeaderText(ops, 'Final alignment', {
    x:0.84, y:1.18, w:6.72, h:0.72, fontSize:30.0, bold:true, color:'111827', fit:'shrink', breakLine:true
  });
  assertHeaderText(ops, 'Move from review to action.', {
    x:0.86, y:2.20, w:5.88, h:0.22, fontSize:11.0, color:'334155', fit:'shrink'
  });
  const pageNumber = ops.find(op => {
    if (op.name !== 'addNumber' || op.args[1] !== '09') return false;
    const opts = op.args[2] || {};
    return opts.x === 11.70 && opts.y === 0.66 && opts.w === 0.72 && opts.h === 0.22;
  });
  assert(pageNumber, 'expected decision summary page number');
  const opts = pageNumber.args[2] || {};
  assertNear(opts.fontSize, 13, '09 page number font');
  assert.equal(opts.color, '2563EB');
  assert.equal(opts.align, 'right');
}

function assertClosingFooters(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.equal(footers.length, 8, 'expected closing footer output for standard, executive, and adaptive paths');

  const standardDark = footers.filter(op => {
    const opts = op.args[2] || {};
    return opts.x === 0.82 && opts.y === 7.05 && opts.w === 7.8 && opts.h === 0.16 && opts.fontSize === 7.8;
  });
  assert.equal(standardDark.length, 2, 'expected two standard dark closing footers');
  standardDark.forEach(op => assert.equal(op.args[2].color, '94A3B8'));

  const lowerLeft = footers.filter(op => {
    const opts = op.args[2] || {};
    return opts.x === 0.86 && opts.y === 6.98 && opts.w === 7.80 && opts.h === 0.13 && opts.fontSize === 7.2;
  });
  assert.equal(lowerLeft.length, 3, 'expected thank-you/editorial/decision summary footers');
  lowerLeft.forEach(op => {
    assert.equal(op.args[2].color, '64748B');
    assert.equal(op.args[2].fit, 'shrink');
  });

  const simpleEnd = footers.filter(op => {
    const opts = op.args[2] || {};
    return opts.x === 1.18 && opts.y === 6.72 && opts.w === 7.0 && opts.h === 0.14 && opts.fontSize === 7.4;
  });
  assert.equal(simpleEnd.length, 2, 'expected direct and adaptive simple-end footers');
  simpleEnd.forEach(op => {
    assert.equal(op.args[2].color, '64748B');
    assert.equal(op.args[2].fit, 'shrink');
  });

  const companyThanks = footers.filter(op => {
    const opts = op.args[2] || {};
    return opts.x === 0.86 && opts.y === 6.76 && opts.w === 5.80 && opts.h === 0.14 && opts.fontSize === 7.8;
  });
  assert.equal(companyThanks.length, 1, 'expected company thanks footer');
  assert.equal(companyThanks[0].args[2].color, '94A3B8');
  assert.equal(companyThanks[0].args[2].fit, 'shrink');
}

function assertClosingDarkStageShells(ops) {
  const stages = ops.filter(op => op.name === 'stageCanvas');
  assert.equal(stages.length, 4, 'expected four dark closing stage shells');
  stages.forEach((op, i) => {
    assert.deepStrictEqual(op.args[1], { field:false }, `expected dark closing stage ${i + 1} without field overlay`);
  });

  const decisionCircle = ops.find(op => {
    if (op.name !== 'addDarkBreathingCircle') return false;
    const args = op.args;
    return args[1] === 8.16 && args[2] === 0.72 && args[3] === 4.18 && args[4] === 2.44 && args[5] === '2563EB';
  });
  assert(decisionCircle, 'expected decision board breathing circle geometry');

  const companyCircle = ops.find(op => {
    if (op.name !== 'addDarkBreathingCircle') return false;
    const args = op.args;
    return args[1] === 8.54 && args[2] === 0.40 && args[3] === 4.18 && args[4] === 2.36 && args[5] === '2563EB';
  });
  assert(companyCircle, 'expected company thanks breathing circle geometry');

  [
    ['FINAL POSITION', { x:0.92, y:0.98, w:1.70, h:0.13, fontSize:6.9, color:'0891B2', charSpace:1.05 }],
    ['致谢', { x:0.86, y:0.82, w:1.10, h:0.12, fontSize:7.0, color:'2563EB', charSpace:0 }]
  ].forEach(([label, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addLabel' || candidate.args[1] !== label) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => opts[key] === value);
    });
    assert(op, `expected closing shell label ${label}`);
  });

  [
    ['06', { x:11.58, y:0.92, w:0.56, h:0.18, fontSize:10.8 }],
    ['07', { x:11.70, y:0.72, w:0.72, h:0.22, fontSize:13 }]
  ].forEach(([value, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addNumber' || candidate.args[1] !== value) return false;
      const opts = candidate.args[2] || {};
      return opts.x === expected.x && opts.y === expected.y && opts.w === expected.w && opts.h === expected.h;
    });
    assert(op, `expected closing shell page number ${value}`);
    const opts = op.args[2] || {};
    assertNear(opts.fontSize, expected.fontSize, `${value} shell page number font`);
    assert.equal(opts.color, '2563EB');
    assert.equal(opts.align, 'right');
  });
}

function assertClosingEditorialLightShell(ops) {
  const findRect = (x, y, w, h) => ops.find(candidate => {
    if (candidate.name !== 'addRect') return false;
    return Math.abs(candidate.args[1] - x) < 0.001
      && Math.abs(candidate.args[2] - y) < 0.001
      && Math.abs(candidate.args[3] - w) < 0.001
      && Math.abs(candidate.args[4] - h) < 0.001;
  });

  assert(findRect(0, 0, 13.333, 7.5), 'expected editorial light background fill');
  assert(findRect(0, 0, 13.333, 0.10), 'expected editorial light top accent rule');
  assert(findRect(8.92, 1.10, 2.60, 4.70), 'expected editorial light right rail panel');
  [
    [0.86, 4.72, 2.52, 0.98],
    [3.58, 4.72, 2.52, 0.98],
    [6.30, 4.72, 2.52, 0.98]
  ].forEach(([x, y, w, h]) => {
    assert(findRect(x, y, w, h), `expected editorial light action card ${x}/${y}`);
  });

  const circle = ops.find(op => {
    if (op.name !== 'addLightBreathingCircle') return false;
    const args = op.args;
    return args[1] === 8.30 && args[2] === 0.34 && args[3] === 4.38 && args[4] === 'EFF6FF' && args[5] === 38;
  });
  assert(circle, 'expected editorial light breathing circle');

  [
    ['FINAL DECISION', { x:0.86, y:1.02, w:1.54, h:0.13, fontSize:6.9, color:'2563EB', charSpace:1.05 }],
    ['NEXT DECISION', { x:9.28, y:3.12, w:1.12, h:0.10, fontSize:5.8, color:'2563EB', charSpace:0.8 }]
  ].forEach(([label, expected]) => {
    const op = ops.find(candidate => {
      if (candidate.name !== 'addLabel' || candidate.args[1] !== label) return false;
      const opts = candidate.args[2] || {};
      return Object.entries(expected).every(([key, value]) => opts[key] === value);
    });
    assert(op, `expected editorial light label ${label}`);
  });

  [
    ['END', { x:9.20, y:1.42, w:1.92, h:0.48, fontSize:26, bold:true, color:'2563EB', fit:'shrink' }],
    ['Final alignment', { x:0.84, y:1.96, w:6.92, h:0.92, fontSize:31.5, bold:true, color:'111827', fit:'shrink', breakLine:true }],
    ['Move from review to action.', { x:0.88, y:3.12, w:5.92, h:0.22, fontSize:11.4, color:'334155', fit:'shrink' }],
    ['Confirm final decision and owner.', { x:9.28, y:3.48, w:1.76, h:0.42, fontSize:8.0, color:'CBD5E1', fit:'shrink', breakLine:true }],
    ['Example Co | Board | 2026-06-01', { x:0.86, y:6.70, w:7.60, h:0.16, fontSize:7.6, color:'64748B', fit:'shrink' }]
  ].forEach(([text, expected]) => {
    assert(
      ops.some(op => {
        if (op.name !== 'addText' || op.args[1] !== text) return false;
        const opts = op.args[2] || {};
        return Object.entries(expected).every(([key, value]) => opts[key] === value);
      }),
      `expected editorial light text ${text}`
    );
  });

  ['Scope', 'Owner', 'Review'].forEach(text => {
    assert(
      ops.some(op => op.args.includes(text)),
      `expected editorial light action content ${text}`
    );
  });
}

function main() {
  const ops = [];
  const activePlanRef = {
    current: {
      audience: 'Board',
      date: '2026-06-01',
      organization: 'Example Co'
    }
  };
  const ctx = createFakeCtx(ops, activePlanRef);
  const direct = createClosingCoreRenderers(ctx);
  const integrated = createClosingRenderers(ctx);
  const names = [
    'closingAdaptive',
    'closingCompanyThanks',
    'closingDark',
    'closingDecisionBoard',
    'closingDecisionSummary',
    'closingEditorialLight',
    'closingImageStatement',
    'closingSimpleEnd',
    'closingThankYou',
    'premiumClosingAnchor'
  ];
  names.forEach(name => {
    assert.strictEqual(typeof direct[name], 'function', `${name} should be exported`);
    assert.strictEqual(typeof integrated[name], 'function', `${name} should be exported through family`);
  });

  const slide = createSlide(ops);
  direct.closingDark(slide, activePlanRef.current, section(), 1);
  direct.closingThankYou(slide, activePlanRef.current, section(), 2);
  direct.closingSimpleEnd(slide, activePlanRef.current, section(), 3);
  direct.closingEditorialLight(slide, activePlanRef.current, section(), 4);
  direct.closingImageStatement(slide, activePlanRef.current, section(), 5);
  direct.closingDecisionBoard(slide, activePlanRef.current, section(), 6);
  direct.closingCompanyThanks(slide, activePlanRef.current, section(), 7);
  direct.premiumClosingAnchor(slide, activePlanRef.current, section(), 8);
  direct.closingDecisionSummary(slide, activePlanRef.current, section(), 9);
  integrated.closingAdaptive(slide, activePlanRef.current, section({ closingVariant:'simple-end' }), 10);

  assert(hasOp(ops, 'addLabel', 'FINAL ALIGNMENT'), 'expected dark closing label');
  assert(hasOp(ops, 'addLabel', 'CLOSING'), 'expected thank-you closing label');
  assert(hasOp(ops, 'addLabel', 'END'), 'expected simple end label');
  assert(hasOp(ops, 'addLabel', 'FINAL DECISION'), 'expected decision label');
  assert(hasOp(ops, 'addLabel', 'CLOSING ANCHOR'), 'expected premium anchor label');
  assert(ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'FINAL DECISION'), 'expected decision summary kicker');
  assertDecisionSummaryHeader(ops);
  assert(ops.some(op => op.name === 'ContactBlock'), 'expected company contact block path');
  assert(ops.some(op => op.name === 'addPhotoPanel'), 'expected image statement photo panel path');
  assertClosingDarkStageShells(ops);
  assertClosingEditorialLightShell(ops);
  assertClosingFooters(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 70, 'expected closing renderer text output');

  console.log('closing core renderers ok');
}

main();
