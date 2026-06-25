#!/usr/bin/env node
const assert = require('assert');
const {
  createRiskBoardRenderers
} = require('./render/page-families/risk-boards');
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
    addClockwiseLoopConnectors: (...args) => record('addClockwiseLoopConnectors', args),
    addDarkBreathingCircle: (...args) => record('addDarkBreathingCircle', args),
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
      darkMuted: '94A3B8',
      darkText: 'E2E8F0',
      ink: '0F172A',
      ink2: '111827',
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
    compactEvidenceCaption: (value, max = 24) => String(value || '').slice(0, max),
    componentRendererContext: () => ({}),
    footerText: () => 'Footer',
    formatMetricDelta: value => String(value || ''),
    isVisualIndustry: () => false,
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
    publicSlideNote: value => value || '',
    recordChartConsumption: (...args) => record('recordChartConsumption', args),
    renderChartSpec: () => ({ rendered:false }),
    routeChartSpec: () => null,
    sectionKicker: (...args) => record('sectionKicker', args),
    stageCanvas: (...args) => record('stageCanvas', args),
    variantOf: section => section.variant || section.layoutVariant || ''
  };
}

function near(actual, expected) {
  return Math.abs(actual - expected) < 0.001;
}

function hasRect(ops, expected) {
  return ops.some(op => op.name === 'addRect'
    && near(op.args[1], expected.x)
    && near(op.args[2], expected.y)
    && near(op.args[3], expected.w)
    && near(op.args[4], expected.h));
}

function findRectByFrame(ops, expected) {
  return ops.find(op => op.name === 'addRect'
    && near(op.args[1], expected.x)
    && near(op.args[3], expected.w)
    && near(op.args[4], expected.h));
}

function main() {
  {
    const ops = [];
    const ctx = createFakeCtx(ops);
    const slide = createSlide(ops);
    const risk = createRiskBoardRenderers(ctx);
    risk.guidanceAndRiskBoard(slide, { industry:'finance-investment' }, {
      title:'下季度指引锁定边界',
      rows:[
        ['需求恢复低于预期', '高', '重点客户建立现金预测'],
        ['回款节奏波动', '中', '按周更新订单与回款数据'],
        ['毛利率承压', '中', '审查低毛利订单和费用投入']
      ],
      assumptions:['需求恢复低于预期 不越过预算阈值', '回款节奏波动 不越过现金警戒值', '毛利率承压 不越过预警阈值']
    }, 1);
    const financeBand = findRectByFrame(ops, { x:0.92, w:10.64, h:1.18 });
    assert(financeBand, 'finance guidance should use a top boundary band');
    const financeBoard = findRectByFrame(ops, { x:0.92, w:10.64, h:2.56 });
    assert(financeBoard, 'finance guidance should use a full-width action table');
    assert(financeBoard.args[2] > financeBand.args[2], 'finance risk table should sit below the top boundary band');
    assert(!hasRect(ops, { x:0.92, y:2.04, w:2.82, h:4.00 }), 'finance guidance should not fall back to the legacy left sidebar');
    ['预算边界', '现金边界', '毛利边界', '边界事项', '监测信号', '管理动作'].forEach(text => {
      assert(ops.some(op => op.args.includes(text)), `expected finance guidance text ${text}`);
    });
  }

  {
    const ops = [];
    const ctx = createFakeCtx(ops);
    const slide = createSlide(ops);
    const risk = createRiskBoardRenderers(ctx);
    risk.governanceTableEditorial(slide, { industry:'people-culture-company' }, {
      title:'招聘沟通需要避免空泛口号和未经授权的人物素材',
      rows:[
        ['价值观口号空泛', '中', '每条价值观必须绑定行为证据'],
        ['人物照片授权不清', '高', '外发前确认肖像与渠道授权'],
        ['岗位承诺过度', '中', '薪酬、福利和成长路径按实际口径表达']
      ]
    }, 1);
    const peopleBanner = findRectByFrame(ops, { x:0.92, w:10.64, h:1.20 });
    assert(peopleBanner, 'people governance should use a horizontal governance banner');
    const peopleTable = findRectByFrame(ops, { x:0.92, w:10.64, h:2.38 });
    assert(peopleTable, 'people governance should use a full-width table stage');
    assert(peopleTable.args[2] > peopleBanner.args[2], 'people governance table should sit below the governance banner');
    assert(!findRectByFrame(ops, { x:0.92, w:2.36, h:3.86 }), 'people governance should not fall back to the legacy editorial sidebar');
    ['招聘治理', '招聘表达与授权', '授权', '口径', '联系人', '下一步', '校准节点', '招聘动作'].forEach(text => {
      assert(ops.some(op => op.args.includes(text)), `expected people governance text ${text}`);
    });
  }

  {
    const ops = [];
    const ctx = createFakeCtx(ops);
    const slide = createSlide(ops);
    const industry = createFinancialIndustryRenderers(ctx);
    industry.industryChartSlide(slide, { slides:[{}], industry:'healthcare-operations' }, {
      variant:'quality-handoff',
      layoutVariant:'quality-handoff',
      title:'质量交接图把跨科室责任转成可检查节点',
      subtitle:'从导诊、检查、医生到随访，每次交接都要留下证据。',
      businessLogic:{
        currentState:'跨科室交接容易出现信息遗漏和响应延迟。',
        action:'把每次交接改成有对象、有时限、有证据的节点。',
        metric:'交接准时率、异常报告响应时长'
      },
      qualityHandoff:[
        { from:'导诊', to:'检查', title:'身份与项目确认', body:'避免重复问询' },
        { from:'检查', to:'医生', title:'报告节点同步', body:'异常优先提醒' },
        { from:'医生', to:'随访', title:'处置建议交接', body:'进入复盘机制' }
      ]
    }, 1);
    assert(findRectByFrame(ops, { x:0.92, w:10.84, h:3.58 }), 'healthcare handoff should use a full-width stage board');
    assert(!findRectByFrame(ops, { x:0.92, w:2.62, h:4.34 }), 'healthcare handoff should not render the legacy proof sidebar');
    assert.strictEqual(ops.filter(op => op.name === 'addArrowLine' && (op.args[6] || {}).width === 0.34).length, 2, 'healthcare handoff should keep three handoff connectors');
    ['交接节点', '质量交接链路', '交接断点', '留痕动作', '追踪指标', '交接对象'].forEach(text => {
      assert(ops.some(op => op.args.includes(text)), `expected healthcare handoff text ${text}`);
    });
  }

  console.log('industry page compositions ok');
}

main();
