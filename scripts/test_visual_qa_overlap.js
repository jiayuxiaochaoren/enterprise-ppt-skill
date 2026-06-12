const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-overlap');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let visualQaRunId = 0;

async function writeFixture(name, covered) {
  const pptxPath = path.join(OUT, `${name}.pptx`);
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  if (!covered) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.92,
      y: 1.16,
      w: 3.35,
      h: 0.58,
      fill: { color: 'E5E7EB', transparency: 0 },
      line: { color: 'E5E7EB', transparency: 100 }
    });
  }
  slide.addText('Visible operating margin signal', {
    x: 1.0,
    y: 1.25,
    w: 3.1,
    h: 0.34,
    fontFace: 'Avenir Next',
    fontSize: 18,
    color: '111827'
  });
  if (covered) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.94,
      y: 1.18,
      w: 3.3,
      h: 0.54,
      fill: { color: '111827', transparency: 0 },
      line: { color: '111827', transparency: 100 }
    });
  }
  await pptx.writeFile({ fileName: pptxPath });
  return pptxPath;
}

function runQa(pptxPath) {
  const args = ['scripts/visual_qa.js', pptxPath, '--json'];
  const stdoutPath = path.join(OUT, `visual-qa-${++visualQaRunId}.json`);
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  const qa = cp.spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', stdoutFd, 'pipe']
  });
  fs.closeSync(stdoutFd);
  const stdout = fs.readFileSync(stdoutPath, 'utf8');
  return { status: qa.status == null ? 1 : qa.status, stdout, result: JSON.parse(stdout) };
}

async function writeRenderedFinancialHeaderFixture() {
  const planPath = path.join(OUT, 'financial-header-safe-zone-plan.json');
  const pptxPath = path.join(OUT, 'financial-header-safe-zone.pptx');
  const plan = {
    style: 'premium-commercial-keynote',
    industry: 'finance-investment',
    title: 'Financial header safe-zone regression',
    slides: [
      {
        type: 'metric-comparison',
        layoutVariant: 'quarterly-results-summary',
        title: '收入增长来自核心业务恢复和现金回收改善，需要在董事会语境里先解释质量',
        claim: '指标页同时解释结果、驱动因素和下季度管理动作，长副标题也不应该被正文背景覆盖。',
        metrics: [
          { label:'收入', value:'+12.4%', note:'核心业务恢复' },
          { label:'经营现金流', value:'+18.0%', note:'回款节奏改善' },
          { label:'毛利率', value:'36.8%', note:'产品组合改善' },
          { label:'费用率', value:'-2.1pt', note:'组织效率提升' }
        ],
        businessLogic: {
          currentState:'收入和现金流同步改善。',
          cause:'核心客户复购和费用纪律共同驱动。',
          action:'继续压实回款和费用边界。'
        }
      },
      {
        type: 'portfolio-table',
        title: '组合行动表把资源配置转成明确选择，并保持长标题下方内容安全区',
        claim: '不同业务单元进入加码、观察和收缩三类动作，说明文字需要保留边界。',
        portfolio: [
          { name:'核心业务', theme:'现金回收', weight:45, irr:'18%', dpi:'0.6x', risk:'低', action:'继续加码' },
          { name:'成长业务', theme:'客户扩张', weight:30, irr:'14%', dpi:'0.2x', risk:'中', action:'观察投入效率' },
          { name:'低效业务', theme:'毛利压力', weight:15, irr:'7%', dpi:'0.1x', risk:'高', action:'压缩预算' }
        ]
      },
      {
        type: 'risk-table',
        layoutVariant: 'guidance-and-risk-board',
        title: '下季度指引需要同时锁定增长假设和风险边界，避免长标题压到正文',
        claim: '风险页以假设、责任和触发条件承接经营结果，副标题应完整可读。',
        rows: [
          ['需求恢复低于预期', '中', '按周更新订单与复购数据'],
          ['回款节奏波动', '高', '重点客户建立现金流预警'],
          ['毛利率承压', '中', '审查低毛利订单和费用投入'],
          ['渠道投放效率下降', '中', '保留高转化渠道预算']
        ]
      },
      {
        type: 'case-gallery',
        layoutVariant: 'executive-proof-board',
        title: '管理层证据板把指标、案例和风险连接到决策，标题再长也要留出呼吸',
        subtitle: '最终建议必须来自多类证据，而不是单一 KPI。',
        cards: [
          { title:'指标证据', body:'收入、现金流和毛利率同步改善。' },
          { title:'案例证据', body:'重点客户复购稳定贡献收入。' },
          { title:'风险证据', body:'回款和毛利仍需月度预警。' },
          { title:'决策含义', body:'建议维持核心业务投入边界。' }
        ]
      }
    ]
  };
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', planPath, pptxPath], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180000
  });
  return pptxPath;
}

async function writeRenderedLifestyleStrategyFixture() {
  const planPath = path.join(OUT, 'lifestyle-strategy-native-process-plan.json');
  const pptxPath = path.join(OUT, 'lifestyle-strategy-native-process.pptx');
  const plan = {
    style: 'premium-commercial-keynote',
    industry: 'lifestyle-food-tourism-fashion',
    visualIntent: 'image-rich',
    title: 'Lifestyle strategy overlap regression',
    slides: [
      {
        type: 'strategy-map',
        layoutVariant: 'scene-conversion-board',
        proofObject: 'customer-journey-map',
        title: '场景经营看板把空间、活动、内容和供应链连起来',
        claim: '用路线设计和商户联动形成可复盘的体验产品。场景经营看板把空间、活动、内容和供应链连起来。',
        drivers: ['空间场景', '主题活动', '社交内容'],
        actions: ['路线设计', '商户联动', '会员权益'],
        outcomes: ['停留变长', '连带提升', '复游改善'],
        note: '价值流动、投入动作与经营结果保持在同一套链路中。'
      }
    ]
  };
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', planPath, pptxPath], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180000
  });
  return pptxPath;
}

async function writeRenderedPeopleMosaicFixture() {
  const planPath = path.join(OUT, 'people-mosaic-header-safe-zone-plan.json');
  const pptxPath = path.join(OUT, 'people-mosaic-header-safe-zone.pptx');
  const plan = {
    style: 'premium-commercial-keynote',
    industry: 'people-culture-company',
    title: 'People mosaic overlap regression',
    slides: [
      {
        type: 'case-gallery',
        layoutVariant: 'people-proof-mosaic',
        proofObject: 'people-proof-mosaic',
        title: '人物图册必须解释团队如何协作、交付和成长，而不是只摆一组氛围图片',
        subtitle: '长标题和长副标题都需要让正文证据墙从页头安全区之后开始。',
        cards: [
          { title:'客户现场', body:'角色、场景和交付产出需要同时出现。' },
          { title:'产品复盘', body:'跨职能把问题转成机制。' },
          { title:'交付节奏', body:'用例会和里程碑证明协作方式。' },
          { title:'成长路径', body:'培训与授权连接组织能力。' }
        ],
        note: '人物图册必须解释团队如何协作、交付和成长。'
      }
    ]
  };
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', planPath, pptxPath], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180000
  });
  return pptxPath;
}

(async () => {
  const goodPptx = await writeFixture('background-before-text', false);
  const good = runQa(goodPptx);
  assert.equal(good.status, 0, 'background rectangles drawn before text should not fail visual QA');
  assert.equal(good.result.findings.some(f => f.type === 'textCoveredByShape'), false);

  const badPptx = await writeFixture('text-covered-by-shape', true);
  const bad = runQa(badPptx);
  assert.notEqual(bad.status, 0, 'a later filled rectangle covering text should fail visual QA');
  assert.equal(bad.result.findings.some(f => f.type === 'textCoveredByShape'), true);

  const financialPptx = await writeRenderedFinancialHeaderFixture();
  const financial = runQa(financialPptx);
  const covered = financial.result.findings.filter(f => f.type === 'textCoveredByShape');
  assert.deepEqual(
    covered.map(f => ({ slide:f.slide, type:f.type, message:f.message })),
    [],
    'financial route renderers should not cover long header subtitles with later filled rectangles'
  );

  const lifestylePptx = await writeRenderedLifestyleStrategyFixture();
  const lifestyle = runQa(lifestylePptx);
  const lifestyleCovered = lifestyle.result.findings.filter(f => f.type === 'textCoveredByShape');
  assert.deepEqual(
    lifestyleCovered.map(f => ({ slide:f.slide, type:f.type, message:f.message })),
    [],
    'strategy-map native process rail should not be redrawn as a bottom overlay over native captions'
  );

  const peoplePptx = await writeRenderedPeopleMosaicFixture();
  const people = runQa(peoplePptx);
  const peopleCovered = people.result.findings.filter(f => f.type === 'textCoveredByShape');
  assert.deepEqual(
    peopleCovered.map(f => ({ slide:f.slide, type:f.type, message:f.message })),
    [],
    'people-proof mosaic evidence wall should start below long header subtitles'
  );

  console.log('visual QA overlap ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
