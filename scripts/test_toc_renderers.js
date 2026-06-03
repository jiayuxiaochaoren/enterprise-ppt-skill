#!/usr/bin/env node
const assert = require('assert');
const {
  createTocRenderers,
  entries
} = require('./render/page-families/toc');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addHairline: (...args) => record('addHairline', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    colors: () => ({
      accent: '2563EB',
      cyan: '0891B2',
      darkMuted: '94A3B8',
      ink: '0F172A',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    copyFallback: (_plan, _key, fallback) => fallback || 'Fallback copy',
    copyPolicyList: () => ['Context', 'Evidence', 'Model', 'Decision', 'Risks'],
    footerText: () => 'Footer',
    glassPanel: (...args) => record('glassPanel', args),
    isCompanyIntroPlan: () => false
  };
}

function assertNear(actual, expected, label) {
  assert(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

function assertTocFooter(ops) {
  const footers = ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer');
  assert.strictEqual(footers.length, 1, 'expected one toc footer');
  const box = footers[0].args[2] || {};
  assertNear(box.x, 0.80, 'footer x');
  assertNear(box.y, 6.82, 'footer y');
  assertNear(box.w, 2.75, 'footer width');
  assertNear(box.h, 0.14, 'footer height');
  assertNear(box.fontSize, 7.5, 'footer font');
  assert.strictEqual(box.color, '94A3B8', 'footer color');
}

function assertTocPageNumber(ops) {
  const pageNumbers = ops.filter(op => op.name === 'PageNumber');
  assert.strictEqual(pageNumbers.length, 1, 'expected one toc page number');
  const op = pageNumbers[0];
  assert.strictEqual(op.args[1], 2, 'toc page number index should be forwarded');
  const opts = op.args[2] || {};
  assert.strictEqual(opts.color, '94A3B8', 'toc page number color should be preserved');
  assertNear(opts.fontSize, 11.5, 'toc page number font');
}

function main() {
  const ops = [];
  const renderers = createTocRenderers(createFakeCtx(ops));
  assert.strictEqual(typeof renderers.tocClean, 'function');
  assert.strictEqual(entries(renderers)[0].source, 'page-family:toc');
  renderers.tocClean(createSlide(ops), {}, {
    title:'目录',
    subtitle:'汇报路径',
    items:['现状', '证据', '方案', '行动', '风险']
  }, 2);

  assert(ops.some(op => op.name === 'glassPanel'), 'expected navigation glass panel');
  assertTocPageNumber(ops);
  assert(ops.filter(op => op.name === 'addShape').length >= 3, 'expected toc atmosphere shapes');
  assertTocFooter(ops);
  assert(ops.filter(op => op.name === 'addText').length >= 10, 'expected toc text output');

  console.log('toc renderers ok');
}

main();
