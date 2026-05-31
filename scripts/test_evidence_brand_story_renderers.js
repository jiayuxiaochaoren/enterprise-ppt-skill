#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceBrandStoryRenderers
} = require('./render/page-families/evidence-brand-stories');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addLightBreathingCircle: (...args) => record('addLightBreathingCircle', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addSmartPhotoPanel: (...args) => record('addSmartPhotoPanel', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      ink: '0F172A',
      line: 'CBD5E1',
      muted: '64748B',
      panelAlt: 'F1F5F9',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    compactEvidenceCaption: value => String(value || ''),
    footerText: () => 'Footer',
    galleryImages: (_plan, section) => section.images || [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    itemBody: (item, fallback = '') => (item && item.body) || fallback,
    itemTitle: (item, fallback) => (item && item.title) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    variantOf: (section, fallback) => section.variant || section.layoutVariant || fallback
  };
}

function storySection(title, extra = {}) {
  return Object.assign({
    title,
    items: [
      { title: `${title} 1`, body: 'First story proof' },
      { title: `${title} 2`, body: 'Second story proof' },
      { title: `${title} 3`, body: 'Third story proof' },
      { title: `${title} 4`, body: 'Fourth story proof' }
    ],
    metrics: [
      { label:'Impact', value:'42%', note:'source-bound' },
      { label:'Reuse', value:'18%', note:'verified' },
      { label:'Scope', value:'3', note:'tracked' }
    ]
  }, extra);
}

function assertKicker(ops, text) {
  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === text),
    `expected section kicker ${text}`
  );
}

function main() {
  const ops = [];
  const renderers = createEvidenceBrandStoryRenderers(createFakeCtx(ops));
  const names = ['retailLookbookStory', 'peopleProofMosaic', 'sustainabilityProofSpread'];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.retailLookbookStory({}, {}, storySection('Lookbook'), 7);
  renderers.retailLookbookStory({}, {}, storySection('Consumer', { variant:'consumer-proof-photo-grid' }), 8);
  renderers.peopleProofMosaic({}, {}, storySection('People'), 9);
  renderers.sustainabilityProofSpread({}, {}, storySection('Sustainability'), 10);

  assertKicker(ops, 'LOOKBOOK STORY');
  assertKicker(ops, 'CONSUMER PROOF GRID');
  assertKicker(ops, 'PEOPLE PROOF MOSAIC');
  assertKicker(ops, 'SUSTAINABILITY PROOF SPREAD');
  assert(ops.some(op => op.name === 'addLightBreathingCircle'), 'expected lookbook image fallback treatment');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected proof image fallback treatment');
  assert(ops.filter(op => op.name === 'PageNumber').length >= 2, 'expected page numbering for story boards');

  console.log('evidence brand story renderers ok');
}

main();
