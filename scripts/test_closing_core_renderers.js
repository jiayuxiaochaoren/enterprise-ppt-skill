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
  assert(ops.some(op => op.name === 'ContactBlock'), 'expected company contact block path');
  assert(ops.some(op => op.name === 'addPhotoPanel'), 'expected image statement photo panel path');
  assert(ops.filter(op => op.name === 'addText').length >= 70, 'expected closing renderer text output');

  console.log('closing core renderers ok');
}

main();
