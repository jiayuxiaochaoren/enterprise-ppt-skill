#!/usr/bin/env node
const assert = require('assert/strict');
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
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      darkMuted:'94A3B8',
      darkText:'E2E8F0',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      onAccent:'FFFFFF',
      panelAlt:'F1F5F9',
      risk:'DC2626',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    compactEvidenceCaption: (value, max = 32) => String(value || '').slice(0, max),
    footerText: () => 'Footer',
    itemBody: value => Array.isArray(value) ? value[2] : ((value && (value.body || value.note || value.text)) || ''),
    itemTitle: (value, fallback = '') => Array.isArray(value) ? value[0] : ((value && (value.title || value.label || value.value)) || fallback),
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: section => section.variant || section.layoutVariant || ''
  };
}

function section() {
  return {
    title:'Risk Variant',
    claim:'risk board claim',
    rows:[
      ['价值观口号空泛', '中', '每条价值观必须绑定行为证据'],
      ['人物照片授权不清', '高', '外发前确认肖像与渠道授权'],
      ['岗位承诺过度', '中', '薪酬、福利和成长路径按实际口径表达'],
      ['公司信息缺联系人', '低', '结束页保留官网、邮箱和下一步动作']
    ],
    assumptions:['需求恢复不低于预算阈值', '回款节奏不超过预警线', '毛利率不跌破红线']
  };
}

const ops = [];
const renderers = createRiskBoardRenderers(createFakeCtx(ops));

renderers.guidanceAndRiskBoard(
  createSlide(ops),
  { industry:'finance-investment' },
  {
    title:'下季度指引需要同时锁定增长假设和风险边界',
    guidance:'下季度边界',
    rows:[
      ['需求恢复低于预期', '中', '按周更新订单与复购数据'],
      ['回款节奏波动', '高', '重点客户建立现金流预警'],
      ['毛利率承压', '中', '审查低毛利订单和费用投入']
    ],
    assumptions:['需求恢复不低于预算阈值', '回款节奏不超过预警线', '毛利率不跌破红线']
  },
  4
);

renderers.governanceTableEditorial(
  createSlide(ops),
  { industry:'people-culture-company' },
  Object.assign(section(), {
    title:'招聘沟通需要避免空泛口号和未经授权的人物素材'
  }),
  6
);

['预算边界', '风险事项', '触发阈值', '管理动作', '表达与授权', '招聘治理', '校准节奏', '沟通动作', '授权', '口径', '联系人', '下一步'].forEach(text => {
  assert.ok(ops.some(op => op.args.includes(text)), `expected industry-specific risk copy ${text}`);
});
['治理重点', '责任可追踪', '责任 · 节奏 · 记录 · 决策'].forEach(text => {
  assert.ok(!ops.some(op => op.args.includes(text)), `people-culture risk board should not reuse generic governance copy ${text}`);
});
assert.ok(!ops.some(op => op.name === 'addHairline'
  && op.args[1] === 1.20
  && op.args[2] === 4.60), 'industry-specific risk variants should not depend on legacy decorative hairlines');

console.log('risk board industry variants ok');
