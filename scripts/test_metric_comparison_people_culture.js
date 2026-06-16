#!/usr/bin/env node
const assert = require('assert/strict');
const {
  createFinancialRenderers
} = require('./render/page-families/financial');

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
    brandWorldBusinessProof: (...args) => record('brandWorldBusinessProof', args),
    compactEvidenceCaption: (value, max = 32) => String(value || '').slice(0, max),
    colors: () => ({
      accent:'2563EB',
      body:'334155',
      captionOnImage:'CBD5E1',
      cyan:'0891B2',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      muted:'64748B',
      panelAlt:'F1F5F9',
      risk:'DC2626',
      softBlue:'EFF6FF',
      tertiary:'7C3AED',
      text:'111827',
      violet:'7C3AED',
      white:'FFFFFF'
    }),
    consumerProofPhotoGrid: (...args) => record('consumerProofPhotoGrid', args),
    fileExists: () => false,
    footerText: () => 'Footer',
    formatMetricDelta: value => String(value || ''),
    isVisualIndustry: (plan, id) => plan.industry === id,
    lightCanvas: (...args) => record('lightCanvas', args),
    panelFill: () => 'F8FAFC',
    productEvidenceStory: (...args) => record('productEvidenceStory', args),
    publicSlideNote: value => value || '',
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    sustainabilityProofSpread: (...args) => record('sustainabilityProofSpread', args),
    variantOf: section => section.variant || section.layoutVariant || ''
  };
}

const ops = [];
const renderers = createFinancialRenderers(createFakeCtx(ops));
renderers.metricComparison(
  createSlide(ops),
  { industry:'people-culture-company', footer:'Spark Culture Introduction' },
  {
    layoutVariant:'company-profile-proof',
    title:'组织成长用项目经验、客户复购和人才培养共同证明',
    claim:'公司介绍页要把文化落到业务事实和团队成长上。',
    metrics:[
      { label:'核心项目', value:'42个', note:'覆盖制造、零售和政企场景' },
      { label:'客户复购', value:'68%', note:'长期服务关系稳定' },
      { label:'内部晋升', value:'31%', note:'导师和项目制培养' }
    ],
    businessLogic:{
      currentState:'团队在多行业项目中沉淀方法。',
      cause:'项目复盘、导师机制和平台工具共同支撑成长。',
      action:'把候选人培养路径写进岗位沟通。'
    }
  },
  6
);

assert.ok(ops.some(op => op.name === 'addLabel' && op.args[1] === '团队成长证据'));
assert.ok(ops.some(op => op.name === 'addText' && op.args[1] === '42个'));
assert.ok(ops.some(op => op.name === 'addText' && op.args[1] === '68%'));
assert.ok(ops.some(op => op.name === 'addText' && op.args[1] === '31%'));
['核心项目', '客户关系', '人才培养', '项目沉淀', '成长原因', '候选人沟通'].forEach(text => {
  assert.ok(ops.some(op => op.args.includes(text)), `expected people-culture proof copy ${text}`);
});
['PRIMARY KPI', 'SUPPORT 01', 'SUPPORT 02'].forEach(text => {
  assert.ok(!ops.some(op => op.args.includes(text)), `should not reuse generic metric labels ${text}`);
});
assert.ok(ops.some(op => op.name === 'addRect'
  && op.args[1] === 0.92
  && op.args[2] === 2.08
  && op.args[3] === 11.28
  && op.args[4] === 3.88), 'expected people-culture board shell');
assert.ok(ops.some(op => op.name === 'addText' && op.args[1] === 'Footer'));

console.log('people culture metric comparison ok');
