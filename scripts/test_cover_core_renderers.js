#!/usr/bin/env node
const assert = require('assert');
const {
  createCoverRenderers
} = require('./render/page-families/cover');
const {
  createCoverCoreRenderers
} = require('./render/page-families/cover-core');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops, specRef) {
  const record = (name, args) => ops.push({ name, args });
  const fallback = {
    coverProof: 'Source-bound proof.',
    coverProofTitle: 'Proof title',
    coverTitle: 'Cover title',
    fallbackCaption: 'Reference visual',
    industryInsight: 'Industry insight'
  };
  return {
    addArrowLine: (...args) => record('addArrowLine', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addDeckMeta: (...args) => record('addDeckMeta', args),
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
    addPulseCurve: (...args) => record('addPulseCurve', args),
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
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    copyFallback: (_plan, key, fallbackText) => fallbackText || fallback[key] || key,
    designForSlide: () => ({ wantsImage:false, imagePath:'', imageRole:'' }),
    fileExists: () => false,
    footerText: () => 'Footer',
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    industryProfile: plan => ({
      coverField: plan.coverField || (plan.industry === 'energy-utility' ? 'energy' : (plan.industry === 'manufacturing-operations' ? 'manufacturing' : 'generic')),
      insight: plan.coverInsight || 'Industry insight',
      label: plan.industryLabel || 'DIGITAL'
    }),
    isCompanyIntroPlan: plan => Boolean(plan && plan.isCompanyIntro),
    itemBody: value => (value && (value.body || value.note || value.text)) || '',
    itemTitle: value => (value && (value.title || value.label || value.value)) || '',
    lightCanvas: (...args) => record('lightCanvas', args),
    masterDark: (...args) => record('masterDark', args),
    metaDisabled: () => false,
    panelFill: () => 'F8FAFC',
    presentationSpec: () => specRef.current,
    profile: () => ({ palette:'Fixture palette' }),
    profileFont: () => 'Aptos Display',
    stageCanvas: (...args) => record('stageCanvas', args),
    surfaceFill: () => 'FFFFFF',
    typeSize: (_name, fallbackSize) => fallbackSize,
    typeToken: (_name, fallbackToken) => fallbackToken || {},
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function renderWith(plan, section, specRef, direct, ops) {
  direct.coverDark(createSlide(ops), plan, section);
}

function hasOp(ops, name, value) {
  return ops.some(op => op.name === name && op.args.includes(value));
}

function main() {
  const ops = [];
  const specRef = { current:{ coverTone:'dark', coverMotif:'editorial-rule' } };
  const ctx = createFakeCtx(ops, specRef);
  const direct = createCoverCoreRenderers(ctx);
  const integrated = createCoverRenderers(ctx);
  assert.strictEqual(typeof direct.coverDark, 'function');
  assert.strictEqual(typeof integrated.coverDark, 'function');

  renderWith({ title:'Operations Platform', date:'2026' }, { title:'Operations Platform', subtitle:'Insight' }, specRef, direct, ops);
  specRef.current = { coverTone:'light', coverMotif:'calm-field' };
  renderWith({ title:'Light Cover', date:'2026' }, { title:'Light Cover', subtitle:'Insight' }, specRef, integrated, ops);
  specRef.current = { coverTone:'dark', coverMotif:'editorial-rule' };
  renderWith({ title:'Beauty Cover' }, { variant:'beauty-brand-editorial-cover', title:'Beauty Cover' }, specRef, direct, ops);
  renderWith({ title:'Airy Cover' }, { variant:'airy-concept-opening', title:'Airy Cover' }, specRef, direct, ops);
  renderWith({
    title:'Manufacturing Cover',
    industry:'manufacturing-operations',
    coverMetrics:[
      { label:'Line readiness', value:'92%' },
      { label:'Controls', value:'PLC' },
      { label:'Install', value:'Field' }
    ]
  }, { title:'Manufacturing Cover' }, specRef, direct, ops);
  renderWith({ title:'Energy Smart Platform', industry:'energy-utility', date:'2026' }, { title:'Energy Smart Platform' }, specRef, direct, ops);

  assert(ops.filter(op => op.name === 'masterDark').length >= 5, 'expected dark cover setup');
  assert(ops.some(op => op.name === 'addDeckMeta'), 'expected deck meta output');
  assert(ops.some(op => op.name === 'addEnergyLens'), 'expected energy cover lens');
  assert(ops.some(op => op.name === 'addEnergyPhotoBackdrop'), 'expected energy photo fallback');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected manufacturing proof flow');
  assert(ops.some(op => op.name === 'addShape'), 'expected airy object shape');
  assert(hasOp(ops, 'addLabel', 'BEAUTY BRAND WORLD'), 'expected beauty cover branch');
  assert(hasOp(ops, 'addLabel', 'CONCEPT OPENING'), 'expected airy cover branch');
  assert(hasOp(ops, 'addLabel', 'MANUFACTURING PROOF'), 'expected manufacturing cover branch');
  assert(ops.filter(op => op.name === 'addText').length >= 30, 'expected cover text output');

  console.log('cover core renderers ok');
}

main();
