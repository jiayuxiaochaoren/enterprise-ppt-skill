const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out', 'component-screenshot-qa');
const PLAN = path.join(OUT, 'component-screenshot-plan.json');
const PPTX = path.join(OUT, 'component-screenshot-plan.pptx');
const PREVIEW = path.join(OUT, 'preview');
const META = `${PPTX}.render-meta.json`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const requiredComponents = ['kpi-strip', 'proof-gallery', 'risk-register', 'value-chain', 'product-matrix'];
const sourceTrace = (claimId, excerpt) => ({
  version: 'source-trace/v2',
  claimId,
  sourceIds: ['component-src'],
  sources: [{
    id: 'component-src',
    kind: 'test-fixture',
    name: 'component screenshot fixture',
    page: 1,
    excerpt,
    provenance: 'test-fixture-excerpt',
    authorizationStatus: 'cleared'
  }],
  imageProvenance: [],
  assetAuthorizationStatus: 'cleared'
});
const plan = {
  style: 'premium-commercial-keynote',
  industry: 'general-operations',
  title: '组件截图单测',
  slides: [
    { type: 'cover', title: '组件截图单测', subtitle: '验证关键组件可视、无遮挡、不越界。' },
    {
      type: 'report-board',
      title: 'KPI 条组件可视性',
      subtitle: '指标说明保持可读。',
      metrics: [
        { label: '完成率', value: '86%', note: '进入复盘', sourceId: 'component-src' },
        { label: '响应', value: '24h', note: '责任清晰', sourceId: 'component-src' },
        { label: '风险', value: '3项', note: '持续跟踪', sourceId: 'component-src' }
      ],
      sourceTrace: sourceTrace('component-kpi', 'KPI strip uses three visible metrics with source-backed values.'),
      componentHints: [{ id: 'kpi-strip', required: true }]
    },
    {
      type: 'report-board',
      title: '证据图库组件可视性',
      subtitle: '证据块有说明。',
      cards: [
        { title: '对象', body: '说明证明对象' },
        { title: '证据', body: '说明来源边界' },
        { title: '动作', body: '说明下一步' }
      ],
      sourceTrace: sourceTrace('component-proof', 'Proof gallery uses three evidence cards with source captions.'),
      componentHints: [{ id: 'proof-gallery', required: true }]
    },
    {
      type: 'report-board',
      title: '风险台账组件可视性',
      subtitle: '风险动作同屏。',
      rows: [
        ['输入缺口', '高', '补齐来源字段'],
        ['指标口径不清', '中', '补页码与摘录'],
        ['受众版本未定', '中', '确认阅读对象']
      ],
      riskRegister: [
        ['输入缺口', '高', '补齐来源字段'],
        ['指标口径不清', '中', '补页码与摘录'],
        ['受众版本未定', '中', '确认阅读对象']
      ],
      sourceTrace: sourceTrace('component-risk', 'Risk register lists authorization, metric basis, and audience boundary risks.'),
      componentHints: [{ id: 'risk-register', required: true }]
    },
    {
      type: 'report-board',
      title: '价值链组件可视性',
      subtitle: '输入动作结果相连。',
      actions: [
        { title: '输入事实' },
        { title: '形成动作' },
        { title: '复盘结果' }
      ],
      sourceTrace: sourceTrace('component-value-chain', 'Value chain connects input facts, actions, and review results.'),
      componentHints: [{ id: 'value-chain', required: true }]
    },
    {
      type: 'report-board',
      title: '产品证明矩阵组件可视性',
      subtitle: '产品、场景、证明和经营意义同屏。',
      products: [
        { name: '修护精华', scene: '柜台咨询', efficacy: '屏障修护', businessMeaning: '复购入口' },
        { name: '面霜系列', scene: '换季护理', efficacy: '舒缓锁水', businessMeaning: '套装承接' }
      ],
      sourceTrace: sourceTrace('component-product-matrix', 'Product matrix lists products, scenes, proof claims, and business meaning.'),
      componentHints: [{ id: 'product-matrix', required: true }]
    },
    { type: 'closing', title: '组件验证完成', subtitle: '关键组件已生成截图和 render-meta。', actions: [{ title: '记录', body: '保留 QA 结果。' }] }
  ]
};

fs.writeFileSync(PLAN, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', PLAN, PPTX], { cwd: ROOT, stdio: 'pipe' });
const validation = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/validate_pptx.js',
  PPTX,
  '--expect-slides',
  String(plan.slides.length),
  '--require',
  '组件,证据,风险,完成',
  '--preview-dir',
  PREVIEW,
  '--summary'
], { cwd: ROOT, encoding: 'utf8', timeout: 120000 }));
const qa = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/visual_qa.js',
  PPTX,
  '--preview-dir',
  PREVIEW,
  '--plan',
  PLAN,
  '--json'
], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 20 * 1024 * 1024 }));

const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const consumed = meta.slides.flatMap(slide => slide.consumedComponents || []);
requiredComponents.forEach(id => {
  const hit = consumed.find(component => component.id === id && component.rendered);
  assert.ok(hit, `${id} should be rendered by a supported component path`);
  assert.ok(['overlay', 'native-renderer'].includes(hit.mode), `${id} should report a supported component consumption mode`);
  if (hit.mode === 'overlay') {
    assert.ok(hit.rendererModule && hit.rendererModule.includes('components/'), `${id} should report component renderer module`);
  } else {
    assert.ok(hit.rendererModule && hit.rendererModule.includes('native-page-renderer'), `${id} should report native renderer module`);
  }
  assert.ok(hit.bbox && hit.bbox.w > 0.4 && hit.bbox.h > 0.2, `${id} should report a visible bbox`);
  assert.ok(hit.bbox.x >= 0 && hit.bbox.y >= 0, `${id} bbox should stay on canvas`);
  assert.ok(hit.bbox.x + hit.bbox.w <= 13.333, `${id} bbox should fit canvas width`);
  assert.ok(hit.bbox.y + hit.bbox.h <= 7.5, `${id} bbox should fit canvas height`);
});

const previews = fs.existsSync(PREVIEW) ? fs.readdirSync(PREVIEW).filter(file => /\.png$/i.test(file)) : [];
if (validation.preview.status === 'available') {
  assert.equal(validation.preview.count, plan.slides.length);
  assert.equal(previews.length, plan.slides.length);
  previews.forEach(file => {
    const stat = fs.statSync(path.join(PREVIEW, file));
    assert.ok(stat.size > 10000, `${file} should be a non-empty component screenshot`);
  });
} else {
  assert.equal(previews.length, 0, 'preview directory should be empty when the provider reports unavailable');
  assert.ok(['metadata_fallback', 'unavailable'].includes(validation.preview.status), `unexpected preview status ${validation.preview.status}`);
  assert.equal(validation.preview.error, 'visual_preview_unavailable');
  assert.ok(validation.preview.detail, 'preview fallback should explain the missing screenshot provider');
}
assert.equal(qa.component_consumption_qa.status, 'pass');
assert.equal(qa.findings.some(f => f.level === 'fail' && /overlap|unreadable|blank/i.test(f.type || f.message || '')), false);

console.log(validation.preview.status === 'available' ? 'component screenshot QA ok' : 'component screenshot QA metadata fallback ok');
