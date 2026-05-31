#!/usr/bin/env node
const assert = require('assert');
const {
  createRiskRenderers
} = require('./render/page-families/risk');
const {
  createRiskBoardRenderers
} = require('./render/page-families/risk-boards');

function createSlide(ops) {
  return {
    addShape: (...args) => ops.push({ name:'addShape', args })
  };
}

function createFakeCtx(ops) {
  const record = (name, args) => ops.push({ name, args });
  return {
    PageNumber: (...args) => record('PageNumber', args),
    addClockwiseLoopConnectors: (...args) => record('addClockwiseLoopConnectors', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
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
      darkMuted: '94A3B8',
      darkText: 'E2E8F0',
      ink: '0F172A',
      ink2: '111827',
      line: 'CBD5E1',
      muted: '64748B',
      onAccent: 'FFFFFF',
      panelAlt: 'F1F5F9',
      risk: 'DC2626',
      text: '111827',
      violet: '7C3AED',
      white: 'FFFFFF'
    }),
    compactEvidenceCaption: (value, max = 24) => String(value || '').slice(0, max),
    footerText: () => 'Footer',
    itemBody: value => {
      if (typeof value === 'string') return '';
      return (value && (value.body || value.note || value.text)) || '';
    },
    itemTitle: (value, fallback = '') => {
      if (typeof value === 'string') return value;
      return (value && (value.title || value.label || value.value)) || fallback;
    },
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: section => section.variant || section.layoutVariant || ''
  };
}

function riskSection(overrides = {}) {
  return {
    title: 'Risk Board',
    claim: 'Prioritize risks with owners and evidence.',
    rows: [
      ['授权缺失', '高', '补齐授权文件'],
      ['交付延迟', '中', '明确里程碑'],
      ['成本波动', '低', '持续监控'],
      ['事实无来源', '高', '回填出处']
    ],
    assumptions: ['授权完成', '成本可控', '里程碑稳定'],
    responsibilities: [
      { title:'定责', owner:'PM', body:'明确责任人' },
      { title:'处置', owner:'Ops', body:'推进动作' },
      { title:'留痕', owner:'QA', body:'保留证据' },
      { title:'复盘', owner:'Lead', body:'更新机制' }
    ],
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
  const direct = createRiskBoardRenderers(ctx);
  const integrated = createRiskRenderers(ctx);
  const names = [
    'governanceTableEditorial',
    'guidanceAndRiskBoard',
    'materialityMatrixBoard',
    'riskAdaptive',
    'riskControlStack',
    'riskMatrixSlide',
    'riskResponsibilityLoop',
    'riskTable'
  ];
  names.forEach(name => {
    assert.strictEqual(typeof direct[name], 'function', `${name} should be exported`);
    assert.strictEqual(typeof integrated[name], 'function', `${name} should be exported through family`);
  });

  direct.riskMatrixSlide(slide, { industry:'manufacturing-operations' }, riskSection(), 1);
  direct.riskControlStack(slide, {}, riskSection(), 2);
  direct.riskResponsibilityLoop(slide, {}, riskSection(), 3);
  direct.guidanceAndRiskBoard(slide, {}, riskSection(), 4);
  direct.materialityMatrixBoard(slide, {}, riskSection(), 5);
  direct.governanceTableEditorial(slide, {}, riskSection(), 6);
  integrated.riskAdaptive(slide, {}, riskSection({ variant:'risk-matrix' }), 7);
  integrated.riskTable(slide, {}, riskSection(), 8);

  assertKicker(ops, 'RISK MATRIX');
  assertKicker(ops, 'CONTROL SYSTEM');
  assertKicker(ops, 'RESPONSIBILITY LOOP');
  assertKicker(ops, 'GUIDANCE AND RISK BOARD');
  assertKicker(ops, 'MATERIALITY MATRIX');
  assertKicker(ops, 'GOVERNANCE TABLE EDITORIAL');
  assertKicker(ops, 'GOVERNANCE BOARD');
  assert(ops.some(op => op.name === 'addClockwiseLoopConnectors'), 'expected responsibility loop connectors');
  assert(ops.some(op => op.name === 'addShape'), 'expected matrix native shapes');
  assert(ops.filter(op => op.name === 'addText').length >= 80, 'expected risk board text output');

  console.log('risk board renderers ok');
}

main();
