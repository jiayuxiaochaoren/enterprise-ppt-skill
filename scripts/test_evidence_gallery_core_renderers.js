#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceGalleryRenderers
} = require('./render/page-families/evidence-gallery');
const {
  createEvidenceGalleryCoreRenderers
} = require('./render/page-families/evidence-gallery-core');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addArrowBetweenRects: (...args) => record('addArrowBetweenRects', args),
    addArrowLine: (...args) => record('addArrowLine', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addEvidenceCaptionStack: (...args) => record('addEvidenceCaptionStack', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addLightBreathingCircle: (...args) => record('addLightBreathingCircle', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addPulseCurve: (...args) => record('addPulseCurve', args),
    addRect: (...args) => record('addRect', args),
    addSmartPhotoPanel: (...args) => record('addSmartPhotoPanel', args),
    addText: (...args) => record('addText', args),
    chooseEvidenceImageLayout: () => 'mosaic-1-3',
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
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
    compactEvidenceCaption: (value, max = 24) => String(value || '').slice(0, max),
    fileExists: () => false,
    footerText: () => 'Footer',
    galleryImages: (_plan, section) => section.images || [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    itemBody: (item, fallback = '') => {
      if (typeof item === 'string') return '';
      return (item && (item.body || item.note || item.text)) || fallback;
    },
    itemBodyNoEllipsis: (item, fallback = '') => {
      if (typeof item === 'string') return '';
      return (item && (item.body || item.note || item.text)) || fallback;
    },
    itemTitle: (item, fallback = '') => {
      if (typeof item === 'string') return item;
      return (item && (item.title || item.label || item.value)) || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    resolveAssetPath: value => value || '',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: (section, fallback = '') => section.variant || section.layoutVariant || fallback
  };
}

function section(overrides = {}) {
  return {
    title: 'Evidence Gallery',
    subtitle: 'Source-bound proof.',
    note: 'Proof should stay traceable.',
    images: [],
    items: [
      { title:'Proof 1', body:'First proof.' },
      { title:'Proof 2', body:'Second proof.' },
      { title:'Proof 3', body:'Third proof.' },
      { title:'Proof 4', body:'Fourth proof.' }
    ],
    facts: [
      { label:'Impact', value:'42%' },
      { label:'Scope', value:'3' },
      { label:'Reuse', value:'18%' }
    ],
    before: { title:'Before', body:'Before state.' },
    after: { title:'After', body:'After state.' },
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
  const ctx = createFakeCtx(ops);
  const slide = createSlide(ops);
  const direct = createEvidenceGalleryCoreRenderers(ctx);
  const integrated = createEvidenceGalleryRenderers(ctx);
  const names = [
    'caseGallery',
    'caseComparisonSlide',
    'caseEvidenceBoard',
    'caseEvidenceHero',
    'consumerProofPhotoGrid',
    'energySiteComparisonSlide',
    'energySiteEvidenceGallery',
    'executiveProofBoard',
    'financePortfolioEvidenceGallery',
    'healthcareTouchpointEvidenceGallery',
    'peopleProofMosaic',
    'productEvidenceStory',
    'retailLookbookStory',
    'saasPrototypeFlowGallery',
    'sustainabilityProofSpread'
  ];
  names.forEach(name => {
    assert.strictEqual(typeof direct[name], 'function', `${name} should be exported`);
    assert.strictEqual(typeof integrated[name], 'function', `${name} should be exported through family`);
  });

  direct.caseEvidenceHero(slide, {}, section(), 1);
  direct.caseEvidenceBoard(slide, {}, section({ images:['a.png', 'b.png', 'c.png', 'd.png'] }), 2);
  direct.caseComparisonSlide(slide, {}, section(), 3);
  direct.energySiteComparisonSlide(slide, { industry:'energy-utility' }, section(), 4);
  direct.caseGallery(slide, {}, section(), 5);
  integrated.caseGallery(slide, {}, section({ variant:'case-hero' }), 6);

  assertKicker(ops, 'CASE PROOF');
  assertKicker(ops, 'EVIDENCE BOARD');
  assertKicker(ops, 'CASE COMPARISON');
  assertKicker(ops, 'SITE BEFORE / AFTER');
  assertKicker(ops, 'CASE EVIDENCE');
  assert(ops.some(op => op.name === 'addArrowBetweenRects'), 'expected comparison arrow');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected site comparison arrow');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected image fallback path');
  assert(ops.some(op => op.name === 'addSmartPhotoPanel'), 'expected gallery image panel path');
  assert(ops.filter(op => op.name === 'addText').length >= 45, 'expected evidence gallery text output');

  console.log('evidence gallery core renderers ok');
}

main();
