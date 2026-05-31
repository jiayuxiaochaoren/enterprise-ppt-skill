const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-render-contracts');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function writePlan(name, plan) {
  const planPath = path.join(OUT, `${name}.json`);
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return planPath;
}

function generate(planPath, outName) {
  return cp.spawnSync(process.execPath, ['scripts/generate_pptx.js', planPath, path.join(OUT, outName)], {
    cwd: ROOT,
    encoding: 'utf8'
  });
}

const unknownType = writePlan('unknown-type-strict', {
  title: '严格渲染未知类型验证',
  industry: 'general-operations',
  strictRendering: true,
  slides: [{
    type: 'unknown-hardening-type',
    title: '未知类型不能静默 fallback'
  }]
});
const unknownResult = generate(unknownType, 'unknown-type.pptx');
assert.notEqual(unknownResult.status, 0, 'strict rendering should reject unknown slide types that would use fallback');
assert.match(`${unknownResult.stdout}\n${unknownResult.stderr}`, /Strict render mode disallows fallback renderer/);

const finalizedStale = writePlan('finalized-stale-route', {
  normalizationMode: 'finalized',
  industry: 'finance-investment',
  title: 'finalized guard',
  slides: [{
    type: 'portfolio-table',
    title: '组合行动表',
    layoutVariant: 'product-evidence-story',
    portfolio: [{ company: 'A', action: '退出' }]
  }]
});
const finalizedResult = generate(finalizedStale, 'finalized-stale-route.pptx');
assert.notEqual(finalizedResult.status, 0, 'finalized planner output should fail when normalization changes route-sensitive fields');
assert.match(`${finalizedResult.stdout}\n${finalizedResult.stderr}`, /planner_output_mutated_during_render/);

const nativeContractPlan = writePlan('native-contract-product-story', {
  title: '原生组件所有权验证',
  industry: 'beauty-consumer',
  allowDraftRender: true,
  slides: [{
    type: 'case-gallery',
    layoutVariant: 'product-evidence-story',
    proofObject: 'product-evidence-story',
    title: '产品证据故事',
    cards: [{ title: '包装语言', body: '解释购买理由。' }]
  }]
});
const nativeContractPptx = path.join(OUT, 'native-contract-product-story.pptx');
const nativeContractResult = cp.spawnSync(process.execPath, ['scripts/generate_pptx.js', nativeContractPlan, nativeContractPptx], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(nativeContractResult.status, 0, nativeContractResult.stderr || nativeContractResult.stdout);
const nativeMeta = JSON.parse(fs.readFileSync(`${nativeContractPptx}.render-meta.json`, 'utf8'));
const owned = nativeMeta.slides[0].nativeRendererContract.ownedComponents;
assert.ok(owned.includes('proof-gallery'), 'product evidence story should own its native proof gallery');
assert.equal(owned.includes('risk-register'), false, 'product evidence story must not blanket-own unrelated risk register overlays');
assert.equal(owned.includes('value-chain'), false, 'product evidence story must not blanket-own unrelated value-chain overlays');

const crossFamilyPlan = writePlan('financial-evidence-cross-family', {
  title: '跨页面族 renderer 复用验证',
  industry: 'beauty-consumer',
  allowDraftRender: true,
  slides: [
    {
      type: 'metric-comparison',
      layoutVariant: 'product-evidence-story',
      proofObject: 'product-evidence-story',
      title: '产品证据故事复用',
      cards: [{ title: '明星单品', body: '解释购买理由。' }]
    },
    {
      type: 'metric-comparison',
      layoutVariant: 'consumer-proof-photo-grid',
      proofObject: 'consumer-proof-photo-grid',
      title: '消费者证据格复用',
      cards: [{ title: '触点', body: '说明场景。' }]
    },
    {
      type: 'metric-comparison',
      layoutVariant: 'sustainability-proof-spread',
      proofObject: 'sustainability-proof-spread',
      title: '可持续证据展开复用',
      cards: [{ title: '行动证明', body: '绑定指标来源。' }]
    }
  ]
});
const crossFamilyPptx = path.join(OUT, 'financial-evidence-cross-family.pptx');
const crossFamilyResult = cp.spawnSync(process.execPath, ['scripts/generate_pptx.js', crossFamilyPlan, crossFamilyPptx], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(crossFamilyResult.status, 0, crossFamilyResult.stderr || crossFamilyResult.stdout);
const crossFamilyMeta = JSON.parse(fs.readFileSync(`${crossFamilyPptx}.render-meta.json`, 'utf8'));
assert.ok((crossFamilyMeta.slides || []).every(slide => slide.rendererMatch && slide.rendererMatch.source === 'page-family:financial'), 'metric-comparison should keep financial ownership while reusing evidence renderers');

console.log('render contract gates ok');
