const assert = require('assert/strict');
const {
  compositionAudit,
  normalizeDeckPlan,
  visualAestheticModel
} = require('./design-system');

const deck = normalizeDeckPlan({
  industry: 'energy-utility',
  title: '新能源电站区域运维方案',
  slides: [
    { type: 'auto', title: '新能源电站区域运维方案', subtitle: '以站端证据、告警闭环和收益复盘支撑区域运维' },
    { type: 'toc-clean', title: '汇报路径', items: ['站端现状', '问题断点', '系统架构', '现场证据', '价值信号', '风险保障'] },
    { type: 'content', title: '多站扩张后告警、工单和收益复盘需要统一节奏', cards: [{ title: '告警分散', body: '站端口径不一。' }, { title: '收益滞后', body: '复盘无法及时联动调度。' }] },
    { type: 'content', title: '站端到区域的数据拓扑', layers: [{ title: '站端设备', items: ['PCS', 'BMS'] }, { title: '区域调度', items: ['告警', '工单'] }] },
    { type: 'content', title: '现场证据图册', images: ['site-a.png', 'site-b.png', 'site-c.png'], cards: [{ title: '储能现场' }, { title: '设备细节' }, { title: '区域视角' }] },
    { type: 'content', title: '告警响应和收益偏差是试点价值信号', metrics: [{ label: '告警响应', value: '-22%' }, { label: '收益偏差', value: '-8%' }] },
    { type: 'content', title: '授权、数据质量和责任边界需要前置治理', rows: [['数据质量', '中', '建立校验'], ['责任边界', '高', '明确工单归属']] },
    { type: 'content', title: '先跑通重点站点再扩展多区域', phases: [{ title: '首批站点' }, { title: '闭环验证' }, { title: '区域推广' }] },
    { type: 'content', title: '经营复盘沉淀为月度调度动作', cards: [{ title: '收益复盘', body: '月度更新。' }, { title: '策略迭代', body: '按偏差调整。' }] },
    { type: 'closing', title: '让站端证据进入区域化经营', actions: [{ title: '站端' }, { title: '告警' }, { title: '收益' }] }
  ]
});

const intents = new Set(deck.slides.map(s => s.themeIntent).filter(Boolean));
assert.ok(intents.size >= 6, `expected rich theme intent spread, got ${[...intents].join(', ')}`);
assert.ok(intents.has('industry-opening'));
assert.ok(intents.has('navigation-map'));
assert.ok(intents.has('system-architecture'));
assert.ok(intents.has('case-evidence'));
assert.ok(intents.has('value-signal'));
assert.ok(intents.has('risk-warning'));
assert.ok(intents.has('closing-anchor'));

const tones = new Set(deck.slides.map(s => s.compositionPlan.backgroundTone));
assert.ok(tones.has('dark-stage'), 'deck should include dark-stage anchors');
assert.ok(tones.has('accent-wash'), 'deck should include accent-wash rhythm shifts');
assert.ok(tones.has('tinted-paper'), 'deck should keep calm paper pages for business readability');

deck.slides.forEach((slide, i) => {
  assert.ok(slide.compositionPlan.themeIntent, `slide ${i + 1} should expose themeIntent`);
  assert.ok(slide.compositionPlan.accentRole, `slide ${i + 1} should expose accentRole`);
  assert.ok(slide.compositionPlan.layoutEnergy, `slide ${i + 1} should expose layoutEnergy`);
  assert.ok(slide.compositionPlan.visualDensity, `slide ${i + 1} should expose visualDensity`);
  assert.ok(slide.compositionPlan.rhythmTransition, `slide ${i + 1} should expose rhythmTransition`);
});

let longestPlainRun = 0;
let run = 0;
deck.slides.forEach(slide => {
  const cp = slide.compositionPlan;
  const anchored = /dark|stage|accent/i.test(cp.backgroundTone) ||
    (cp.primaryColorUse || []).includes('side-color-field') ||
    (cp.microComponents || []).includes('rhythm-anchor');
  run = anchored ? 0 : run + 1;
  longestPlainRun = Math.max(longestPlainRun, run);
});
assert.ok(longestPlainRun < 4, `plain run should stay below 4, got ${longestPlainRun}`);

assert.equal(
  compositionAudit(deck, deck).some(f => f.type === 'flatPageRhythm' || f.type === 'tooManyWhitePages'),
  false,
  'rhythm planner should avoid flat contact-sheet rhythm for this mixed deck'
);
assert.equal(
  visualAestheticModel(deck, deck).findings.some(f => f.type === 'themeIntentVarietyLow'),
  false,
  'theme intent variety should satisfy aesthetic model'
);

console.log('rhythm planner ok');
