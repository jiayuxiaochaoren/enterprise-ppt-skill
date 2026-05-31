#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceProofBoardRenderers
} = require('./render/page-families/evidence-proof-boards');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
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
      risk: 'DC2626',
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
    itemBodyNoEllipsis: (item, fallback = '') => (item && item.body) || fallback,
    itemTitle: (item, fallback) => (item && item.title) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function section(title) {
  return {
    title,
    images: [],
    items: [
      { title: `${title} 1`, body: 'First proof point' },
      { title: `${title} 2`, body: 'Second proof point' },
      { title: `${title} 3`, body: 'Third proof point' },
      { title: `${title} 4`, body: 'Decision proof point' }
    ]
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
  const renderers = createEvidenceProofBoardRenderers(createFakeCtx(ops));
  const names = ['consumerProofPhotoGrid', 'productEvidenceStory', 'executiveProofBoard'];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.consumerProofPhotoGrid({}, {}, section('Consumer'), 4);
  renderers.productEvidenceStory({}, {}, section('Product'), 5);
  renderers.executiveProofBoard({}, {}, section('Executive'), 6);

  assertKicker(ops, 'CONSUMER PROOF PHOTO GRID');
  assertKicker(ops, 'PRODUCT EVIDENCE STORY');
  assertKicker(ops, 'EXECUTIVE PROOF BOARD');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected image fallback rendering');
  assert(ops.filter(op => op.name === 'PageNumber').length >= 3, 'expected page numbering');
  assert(ops.filter(op => op.name === 'addText').length >= 28, 'expected text output');

  console.log('evidence proof board renderers ok');
}

main();
