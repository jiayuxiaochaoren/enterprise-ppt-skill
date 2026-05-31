#!/usr/bin/env node
const assert = require('assert');
const {
  createEvidenceIndustryRenderers
} = require('./render/page-families/evidence-industry');

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    colors: () => ({
      accent: '2563EB',
      body: '334155',
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
    addArrowLine: (...args) => record('addArrowLine', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addPhotoPanel: (...args) => record('addPhotoPanel', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    footerText: () => 'Footer',
    galleryImages: (_plan, section) => section.images || [],
    genericShowcaseField: (...args) => record('genericShowcaseField', args),
    itemBody: item => (item && item.body) || '',
    itemTitle: (item, fallback) => (item && item.title) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function makeSection(title) {
  return {
    title,
    images: [],
    items: [
      { title: `${title} 1`, body: 'First evidence point' },
      { title: `${title} 2`, body: 'Second evidence point' },
      { title: `${title} 3`, body: 'Third evidence point' }
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
  const renderers = createEvidenceIndustryRenderers(createFakeCtx(ops));
  const names = [
    'energySiteEvidenceGallery',
    'financePortfolioEvidenceGallery',
    'healthcareTouchpointEvidenceGallery',
    'saasPrototypeFlowGallery'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.energySiteEvidenceGallery({}, {}, makeSection('Energy'), 3);
  renderers.financePortfolioEvidenceGallery({}, {}, makeSection('Finance'), 4);
  renderers.healthcareTouchpointEvidenceGallery({}, {}, makeSection('Healthcare'), 5);
  renderers.saasPrototypeFlowGallery({}, {}, makeSection('SaaS'), 6);

  assertKicker(ops, 'SITE EVIDENCE');
  assertKicker(ops, 'PORTFOLIO EVIDENCE');
  assertKicker(ops, 'SERVICE TOUCHPOINTS');
  assertKicker(ops, 'PRODUCT WORKFLOW');
  assert(ops.some(op => op.name === 'genericShowcaseField'), 'expected image fallback rendering');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected flow arrows for healthcare/SaaS renderer');
  assert(ops.filter(op => op.name === 'addText').length >= 24, 'expected renderer text output');

  console.log('evidence industry renderers ok');
}

main();
