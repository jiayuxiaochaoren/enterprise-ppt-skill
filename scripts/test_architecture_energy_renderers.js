#!/usr/bin/env node
const assert = require('assert');
const {
  createArchitectureEnergyRenderers
} = require('./render/page-families/architecture-energy');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    colors: () => ({
      accent: '2563EB',
      cyan: '0891B2',
      ink: '0F172A',
      ink2: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    footerText: () => 'Footer',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args)
  };
}

function main() {
  const ops = [];
  const renderers = createArchitectureEnergyRenderers(createFakeCtx(ops));
  assert.strictEqual(typeof renderers.energyArchitecture, 'function', 'energyArchitecture should be exported');

  renderers.energyArchitecture(createSlide(ops), {}, {
    title: 'Energy topology',
    subtitle: 'Dispatch loop',
    layers: [
      { title:'Edge', items:['PV', 'PCS', 'BMS'] },
      { title:'Data', items:['Protocols', 'Metrics', 'Curves'] },
      { title:'Dispatch', items:['Alerts', 'Tickets', 'SOC'] },
      { title:'Management', items:['Sites', 'Yield', 'Crew'] }
    ]
  }, 5);

  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'ENERGY TOPOLOGY'),
    'expected energy topology section kicker'
  );
  assert(ops.some(op => op.name === 'addDarkBreathingCircle'), 'expected dark energy backdrop');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'ellipse'), 'expected node markers');
  assert(ops.some(op => op.name === 'addShape' && op.args[0] === 'line'), 'expected connector lines');
  assert(ops.filter(op => op.name === 'addText').length >= 16, 'expected topology text output');

  console.log('architecture energy renderers ok');
}

main();
