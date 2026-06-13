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

function assertRiskMatrixShell(ops) {
  const gate = ops.find(op => op.name === 'addRect'
    && op.args[1] === 0.92
    && op.args[2] === 2.12
    && op.args[3] === 2.48
    && op.args[4] === 3.96);
  assert(gate, 'expected risk matrix control gate panel');
  const matrix = ops.find(op => op.name === 'addRect'
    && op.args[1] === 3.78
    && op.args[2] === 2.14
    && op.args[3] === 3.78
    && op.args[4] === 3.74);
  assert(matrix, 'expected risk matrix grid panel');
  ['外发门禁', '缓解队列'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected risk matrix label ${label}`
    );
  });
  ['发生概率', '业务影响', '高风险 / 优先处置'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected risk matrix text ${text}`
    );
  });
  assert(
    ops.some(op => op.name === 'addText' && op.args[1] === '2' && (op.args[2] || {}).fontSize === 5.5),
    'expected high-risk matrix count badge'
  );
}

function near(actual, expected) {
  return Math.abs(actual - expected) < 0.0001;
}

function hasRect(ops, expected) {
  return ops.some(op => op.name === 'addRect'
    && near(op.args[1], expected.x)
    && near(op.args[2], expected.y)
    && near(op.args[3], expected.w)
    && near(op.args[4], expected.h));
}

function assertGovernanceTableEditorialShell(ops) {
  assert(hasRect(ops, { x:0.92, y:2.06, w:2.36, h:3.86 }), 'expected governance editorial core panel');
  assert(hasRect(ops, { x:3.54, y:2.06, w:8.00, h:3.86 }), 'expected governance action table panel');
  assert(hasRect(ops, { x:3.72, y:2.70, w:7.64, h:0.56 }), 'expected first governance row shell');
  assert(hasRect(ops, { x:3.72, y:3.44, w:7.64, h:0.56 }), 'expected second governance row shell');
  ['治理重点', '责任 · 节奏 · 记录 · 决策'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected governance editorial label ${label}`
    );
  });
  ['责任', '节奏', '应对动作', '责任可追踪', '授权缺失', '季度审议', '补齐授权文件', '交付延迟', '月度复盘', '明确里程碑', '成本波动', '年度留痕'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected governance table text ${text}`
    );
  });
}

function assertMaterialityMatrixBoardShell(ops) {
  assert(hasRect(ops, { x:0.92, y:2.02, w:6.18, h:4.10 }), 'expected materiality matrix plot panel');
  assert(hasRect(ops, { x:4.04, y:2.20, w:2.76, h:1.58 }), 'expected materiality priority zone');
  assert(hasRect(ops, { x:7.62, y:2.02, w:3.78, h:4.10 }), 'expected materiality topic readout panel');
  assert(
    ops.some(op => op.name === 'addLabel' && op.args[1] === 'TOPIC READOUT'),
    'expected materiality readout label'
  );
  ['优先治理区', '利益相关方影响', '业务影响', '授权缺失', '补齐授权文件', '交付延迟', '明确里程碑'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected materiality matrix text ${text}`
    );
  });
  assert(
    ops.some(op => op.name === 'addShape' && op.args[0] === 'ellipse'),
    'expected materiality issue markers'
  );
}

function assertGuidanceAndRiskBoardShell(ops) {
  assert(hasRect(ops, { x:0.92, y:2.04, w:2.82, h:4.00 }), 'expected guidance assumptions panel');
  assert(hasRect(ops, { x:4.02, y:2.04, w:7.54, h:4.00 }), 'expected guidance risk action board');
  assert(hasRect(ops, { x:4.24, y:2.72, w:7.10, h:0.58 }), 'expected first guidance risk row');
  assert(hasRect(ops, { x:4.24, y:3.44, w:7.10, h:0.58 }), 'expected second guidance risk row');
  ['GUIDANCE ASSUMPTIONS', 'RISK', 'TRIGGER', 'OWNER / ACTION'].forEach(label => {
    assert(
      ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `expected guidance board label ${label}`
    );
  });
  ['下季度边界', '授权完成', '成本可控', '里程碑稳定', '授权缺失', '触发后即升级', '补齐授权文件', '交付延迟', '达到阈值后跟踪', '明确里程碑', '成本波动', '持续监控'].forEach(text => {
    assert(
      ops.some(op => op.name === 'addText' && op.args[1] === text),
      `expected guidance board text ${text}`
    );
  });
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

  assertKicker(ops, '风险矩阵');
  assertKicker(ops, 'CONTROL SYSTEM');
  assertKicker(ops, '责任分工');
  assertKicker(ops, 'GUIDANCE AND RISK BOARD');
  assertKicker(ops, 'MATERIALITY MATRIX');
  assertKicker(ops, 'GOVERNANCE TABLE EDITORIAL');
  assertKicker(ops, '治理看板');
  assertRiskMatrixShell(ops);
  assertGuidanceAndRiskBoardShell(ops);
  assertMaterialityMatrixBoardShell(ops);
  assertGovernanceTableEditorialShell(ops);
  assert(ops.some(op => op.name === 'addClockwiseLoopConnectors'), 'expected responsibility loop connectors');
  const loopConnectors = ops.find(op => op.name === 'addClockwiseLoopConnectors');
  const loopSlots = (loopConnectors && loopConnectors.args[1]) || [];
  const loopOptions = (loopConnectors && loopConnectors.args[3]) || {};
  assert(loopSlots.length === 4, 'expected four responsibility loop card slots');
  assert(
    loopSlots[2].y - (loopSlots[1].y + loopSlots[1].h) > 0.62,
    'responsibility loop should leave enough vertical span for balanced right-side arrows'
  );
  assert(loopOptions.gap <= 0.12, 'responsibility loop connectors should not be shortened by a large gap');
  const processEvidence = ops.find(op => op.name === 'addText' && op.args[1] === '过程留痕');
  assert(processEvidence, 'expected readable process-evidence label in responsibility core panel');
  assert.strictEqual((processEvidence.args[2] || {}).color, 'E2E8F0', 'process evidence text should not use low-contrast gray');
  ['RESPONSIBILITY LOOP', 'RISK · OWNER · ACTION', 'NO ORPHAN RISK', 'EDITORIAL CORE', 'OWNER · CADENCE · EVIDENCE · DECISION'].forEach(label => {
    assert(
      !ops.some(op => op.name === 'sectionKicker' && op.args[1] === label) &&
        !ops.some(op => op.name === 'addLabel' && op.args[1] === label),
      `risk renderers should not emit English template label ${label}`
    );
  });
  assert(ops.some(op => op.name === 'addShape'), 'expected matrix native shapes');
  assert(ops.filter(op => op.name === 'addText').length >= 80, 'expected risk board text output');
  assert.strictEqual(
    ops.filter(op => op.name === 'PageNumber').length,
    5,
    'expected PageNumber-backed headers to keep chrome folio behavior'
  );
  assert.strictEqual(
    ops.filter(op => op.name === 'stageCanvas').length,
    0,
    'expected risk board renderers to stay on light header primitives'
  );
  assert.strictEqual(
    ops.filter(op => op.name === 'addText' && op.args[1] === 'Footer').length,
    8,
    'expected one primitive footer per risk board render'
  );

  console.log('risk board renderers ok');
}

main();
