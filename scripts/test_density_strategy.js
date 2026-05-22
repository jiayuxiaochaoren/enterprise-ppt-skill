const assert = require('assert/strict');
const { contentSignals, normalizeSlide } = require('./design-system');

function route(plan, slide, options = {}) {
  return normalizeSlide(plan, Object.assign({ type:'content' }, slide), options.index ?? 1, options.total ?? 4);
}

function expectDensityRoute(name, plan, slide, expected, options = {}) {
  const signals = contentSignals(plan, Object.assign({ type:'content' }, slide), options.index ?? 1, options.total ?? 4);
  const out = route(plan, slide, options);
  assert.equal(out.type, expected.type, `${name}: expected type ${expected.type}, got ${out.type}`);
  if (expected.variant !== undefined) {
    assert.equal(out.layoutVariant, expected.variant, `${name}: expected variant ${expected.variant}, got ${out.layoutVariant}`);
  }
  if (expected.notType) {
    assert.notEqual(out.type, expected.notType, `${name}: should not route to ${expected.notType}`);
  }
  if (expected.signal) {
    assert.equal(!!signals[expected.signal], true, `${name}: expected signal ${expected.signal}`);
  }
  if (expected.metricCountAtLeast) {
    assert.ok(Array.isArray(out.metrics) && out.metrics.length >= expected.metricCountAtLeast, `${name}: expected derived metrics`);
  }
  return { out, signals };
}

const longText = '这是一段用于模拟真实商业材料的较长说明，包含背景、证据、约束和下一步动作，目标是让路由器判断材料密度，而不是只看字段名。';

const cases = [
  {
    name:'text heavy material becomes report board',
    plan:{ contentDensity:'text-heavy' },
    slide:{
      title:'运营现状与管理断点信息板',
      claim:'文案多时应自动进入报告型信息板，压缩装饰，用编号、分栏和层级承接材料。',
      cards:Array.from({ length:8 }, (_, i) => ({
        title:`管理断点 ${i+1}`,
        body:`${longText} 该项需要明确责任、证据和复盘节奏。`
      }))
    },
    expected:{ type:'report-board', signal:'isTextHeavy', notType:'executive-blocks' }
  },
  {
    name:'logic chain beats text heavy board',
    plan:{ contentDensity:'text-heavy' },
    slide:{
      title:'从客户输入到收入结果的逻辑链',
      claim:'逻辑链强时应表达为因果链或价值创造图，而不是因为文案长就退回信息板。',
      leftTitle:'输入信号',
      left:[
        '客户画像输入与使用频次形成初始判断。',
        '集成深度和支持工单暴露采用阻力。',
        '续约窗口决定下一步经营优先级。'
      ],
      cards:[
        { title:'识别', body:`${longText} 先识别高价值客户与低采用客户。` },
        { title:'动作', body:`${longText} 再推动激活、集成和权限治理。` },
        { title:'复盘', body:`${longText} 把采用信号回写到客户健康模型。` },
        { title:'扩展', body:`${longText} 将健康客户转成扩展收入机会。` }
      ],
      rightTitle:'结果信号',
      right:['激活率提升', 'NRR 改善', '续约风险收敛'],
      note:'输入、动作、产出和结果必须在同一条链路上被读懂。'
    },
    expected:{ type:'strategy-map', signal:'hasLogicChain', notType:'report-board' }
  },
  {
    name:'number heavy cards become metric board',
    plan:{ densityProfile:'number-heavy' },
    slide:{
      title:'经营指标复盘',
      subtitle:'激活率 64%，NRR 118%，毛利率 72%，流失率 4.2%。',
      cards:[
        { title:'激活率', body:'64%，较上期提升 11%。' },
        { title:'NRR', body:'118%，扩展收入贡献提升。' },
        { title:'毛利率', body:'72%，服务成本下降。' },
        { title:'流失率', body:'4.2%，高风险客户减少。' }
      ]
    },
    expected:{ type:'metric-comparison', signal:'isNumberHeavy', metricCountAtLeast:3, notType:'module-matrix' }
  },
  {
    name:'image heavy material becomes evidence board',
    plan:{ visualIntent:'image-rich' },
    slide:{
      title:'现场证据图册',
      images:['a.png','b.png','c.png','d.png'],
      cards:[
        { title:'现场一', body:'确认对象。' },
        { title:'现场二', body:'确认状态。' },
        { title:'现场三', body:'确认动作。' },
        { title:'现场四', body:'确认结果。' }
      ]
    },
    expected:{ type:'case-gallery', variant:'evidence-board', signal:'isImageHeavy' }
  },
  {
    name:'image heavy product material stays product matrix',
    plan:{ visualIntent:'image-rich' },
    slide:{
      title:'产品矩阵',
      products:[
        { title:'单品 A', image:'a.png' },
        { title:'单品 B', image:'b.png' },
        { title:'单品 C', image:'c.png' },
        { title:'单品 D', image:'d.png' }
      ]
    },
    expected:{ type:'product-showcase', variant:'catalog-grid', signal:'hasProductShowcase' }
  },
  {
    name:'long process becomes process board',
    plan:{ contentDensity:'text-heavy' },
    slide:{
      title:'跨部门实施路径',
      phases:Array.from({ length:6 }, (_, i) => ({
        title:`阶段 ${i+1}`,
        body:`${longText} 明确输入、动作、产出和责任边界。`
      }))
    },
    expected:{ type:'timeline', variant:'process-board', signal:'hasTimeline' }
  }
];

for (const c of cases) {
  expectDensityRoute(c.name, c.plan, c.slide, c.expected, c.options || {});
}

console.log(`density strategy ok (${cases.length} cases)`);
