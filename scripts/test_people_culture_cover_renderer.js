#!/usr/bin/env node
const assert = require('assert/strict');
const {
  createCoverCoreRenderers
} = require('./render/page-families/cover-core');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
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
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkMuted:'94A3B8',
      darkLine:'334155',
      darkText:'E2E8F0',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      softBlue:'EFF6FF',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    copyFallback: (_plan, key, fallbackText) => fallbackText || key,
    designForSlide: () => ({ wantsImage:false, imagePath:'', imageRole:'' }),
    fileExists: () => false,
    footerText: () => 'Footer',
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    industryProfile: () => ({ coverField:'generic', insight:'Culture insight', label:'CULTURE' }),
    isCompanyIntroPlan: () => false,
    itemBody: value => (value && (value.body || value.note || value.text)) || '',
    itemTitle: (value, fallback = '') => (value && (value.title || value.label || value.value)) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    masterDark: (...args) => record('masterDark', args),
    metaDisabled: () => false,
    panelFill: () => 'F8FAFC',
    presentationSpec: () => ({ coverTone:'dark' }),
    profile: () => ({ palette:'Fixture palette' }),
    profileFont: () => 'Aptos Display',
    stageCanvas: (...args) => record('stageCanvas', args),
    surfaceFill: () => 'FFFFFF',
    typeSize: (_name, fallbackSize) => fallbackSize,
    typeToken: (_name, fallbackToken) => fallbackToken || {},
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

const ops = [];
const renderers = createCoverCoreRenderers(createFakeCtx(ops));
renderers.coverDark(
  createSlide(ops),
  { industry:'people-culture-company', title:'星火数科文化与组织介绍' },
  {
    layoutVariant:'culture-cover-with-soft-geometry',
    title:'星火数科文化与组织介绍',
    subtitle:'用使命、团队证据和价值观行为说明公司为什么值得加入',
    values:[
      { title:'真实问题', body:'面向现场而不是抽象口号。' },
      { title:'证据判断', body:'用案例和复盘说明选择。' }
    ]
  }
);

assert.ok(ops.some(op => op.name === 'addLabel' && op.args[1] === 'CULTURE COVER'));
assert.ok(ops.some(op => op.name === 'addText' && op.args[1] === '星火数科文化与组织介绍'));
assert.ok(ops.some(op => op.name === 'addNumber' && op.args[1] === '01'));
assert.ok(ops.some(op => op.name === 'addText' && op.args[1] === 'Footer'));
assert.ok(ops.some(op => op.name === 'stageCanvas'));
assert.ok(!ops.some(op => op.name === 'addHairline'
  && op.args[1] === 0.90
  && op.args[2] === 3.42
  && op.args[3] === 0.90), 'culture cover should not render a middle accent rule');

console.log('people culture cover renderer ok');
