#!/usr/bin/env node
const assert = require('assert');
const {
  createFinancialRenderers
} = require('./render/page-families/financial');
const {
  createFinancialIndustryRenderers
} = require('./render/page-families/financial-industry');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addArrowLine: (...args) => record('addArrowLine', args),
    addHairline: (...args) => record('addHairline', args),
    addLabel: (...args) => record('addLabel', args),
    addNumber: (...args) => record('addNumber', args),
    addRect: (...args) => record('addRect', args),
    addText: (...args) => record('addText', args),
    chartSpecToComponentId: () => '',
    colors: () => ({
      accent: '2563EB',
      body: '334155',
      captionOnImage: 'CBD5E1',
      cyan: '0891B2',
      ink: '0F172A',
      line: 'CBD5E1',
      muted: '64748B',
      onAccent: 'FFFFFF',
      panelAlt: 'F1F5F9',
      risk: 'DC2626',
      softBlue: 'EFF6FF',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    compactEvidenceCaption: value => String(value || ''),
    componentRendererContext: () => ({}),
    footerText: () => 'Footer',
    formatMetricDelta: value => String(value || ''),
    isVisualIndustry: () => false,
    itemBody: item => (item && item.body) || '',
    itemTitle: (item, fallback) => (item && (item.title || item.label)) || fallback,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    publicSlideNote: value => value || '',
    recordChartConsumption: (...args) => record('recordChartConsumption', args),
    renderChartSpec: () => ({ rendered:false }),
    routeChartSpec: () => null,
    sectionKicker: (...args) => record('sectionKicker', args),
    variantOf: section => section.variant || section.layoutVariant || ''
  };
}

function main() {
  const ops = [];
  const ctx = createFakeCtx(ops);
  const renderers = createFinancialIndustryRenderers(ctx);
  const integratedRenderers = createFinancialRenderers(ctx);
  assert.strictEqual(typeof renderers.industryChartSlide, 'function');
  assert.strictEqual(typeof integratedRenderers.industryChartSlide, 'function');

  renderers.industryChartSlide(createSlide(ops), { slides:[{}] }, {
    variant: 'monthly-pulse-trend',
    title: 'Monthly Pulse',
    items: [
      { label:'Jan', value:'456.2w', note:'baseline' },
      { label:'Feb', value:'402.2w', note:'low point' },
      { label:'Mar', value:'618.4w', note:'peak' }
    ]
  }, 2);

  assert(
    ops.some(op => op.name === 'sectionKicker' && op.args[1] === 'MONTHLY PULSE'),
    'expected monthly pulse branch'
  );
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === 'MONTHLY NET SALES TREND'),
    'expected monthly trend chart renderer'
  );
  assert(ops.some(op => op.name === 'addShape'), 'expected native chart shapes');

  console.log('financial industry renderers ok');
}

main();
