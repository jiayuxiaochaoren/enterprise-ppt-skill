#!/usr/bin/env node
const assert = require('assert');
const {
  createClosingIndustryRenderers
} = require('./render/page-families/closing-industry');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    addArrowLine: (...args) => record('addArrowLine', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
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
    copyFallback: (_plan, key) => `fallback ${key}`,
    footerText: () => 'Footer',
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    profileFont: () => 'Aptos Display',
    sectionKicker: (...args) => record('sectionKicker', args)
  };
}

function makeSection(title) {
  return {
    title,
    actions: [
      { title:'Action 1', body:'First action' },
      { title:'Action 2', body:'Second action' },
      { title:'Action 3', body:'Third action' }
    ],
    decision: `${title} decision`
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
  const helpers = {
    closingActions: s => s.actions,
    closingMeta: () => 'Meta'
  };
  const renderers = createClosingIndustryRenderers(createFakeCtx(ops), helpers);
  const names = [
    'closingManufacturingPilotRollout',
    'closingFinanceInvestmentDecision',
    'closingHealthcareQualityHandoff',
    'closingSaasAdoptionClose'
  ];
  names.forEach(name => assert.strictEqual(typeof renderers[name], 'function', `${name} should be exported`));

  renderers.closingManufacturingPilotRollout(createSlide(ops), {}, makeSection('Manufacturing'), 9);
  renderers.closingFinanceInvestmentDecision(createSlide(ops), {}, makeSection('Finance'), 10);
  renderers.closingHealthcareQualityHandoff(createSlide(ops), {}, makeSection('Healthcare'), 11);
  renderers.closingSaasAdoptionClose(createSlide(ops), {}, makeSection('SaaS'), 12);

  assertKicker(ops, 'PILOT ROLLOUT');
  assertKicker(ops, 'INVESTMENT DECISION');
  assertKicker(ops, 'QUALITY HANDOFF');
  assertKicker(ops, 'ADOPTION TO REVENUE');
  assert(ops.some(op => op.name === 'addArrowLine'), 'expected closing flow arrows');
  assert(ops.some(op => op.name === 'addShape'), 'expected native timeline node shapes');
  assert(ops.filter(op => op.name === 'addText').length >= 30, 'expected renderer text output');

  console.log('closing industry renderers ok');
}

main();
