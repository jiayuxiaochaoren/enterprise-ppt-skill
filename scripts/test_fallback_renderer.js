const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { createFallbackRenderers } = require('./render/fallback-renderer');
const { runVisualQa } = require('./qa/visual-qa-runner');

const calls = [];
const fallback = createFallbackRenderers({
  colors: () => ({ body:'222222' }),
  masterLight: (...args) => calls.push(['masterLight', args]),
  profile: () => ({ font:'Fixture Font' })
});
const slide = {
  addText(text, opts) {
    calls.push(['addText', [text, opts]]);
  }
};
fallback.fallbackBulletsSlide(slide, {}, { title:'Fallback', bullets:['A', 'B'] }, 1);
assert.ok(calls.some(([kind]) => kind === 'masterLight'), 'fallback renderer should draw standard light chrome');
assert.ok(calls.some(([kind, args]) => kind === 'addText' && Array.isArray(args[0]) && args[0].length === 2), 'fallback renderer should draw bullet runs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-fallback-renderer');
fs.rmSync(OUT, { recursive:true, force:true });
fs.mkdirSync(OUT, { recursive:true });

function writePlan(name, plan) {
  const file = path.join(OUT, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return file;
}
function generate(planFile, outName) {
  return cp.spawnSync(process.execPath, ['scripts/generate_pptx.js', planFile, path.join(OUT, outName)], {
    cwd: ROOT,
    encoding: 'utf8'
  });
}

const draftPlan = writePlan('draft-unknown', {
  title:'Unknown fallback draft',
  allowDraftRender:true,
  slides:[{ type:'unknown-draft-slide', title:'Fallback title', bullets:['One', 'Two'] }]
});
const draft = generate(draftPlan, 'draft-unknown.pptx');
assert.equal(draft.status, 0, draft.stderr || draft.stdout);
const meta = JSON.parse(fs.readFileSync(path.join(OUT, 'draft-unknown.pptx.render-meta.json'), 'utf8'));
assert.equal(meta.slides[0].rendererMatch.matchKind, 'fallback');
assert.equal(meta.slides[0].rendererMatch.rendererName, 'fallbackBulletsSlide');
const fallbackFormalJson = runVisualQa({
  file: path.join(OUT, 'draft-unknown.pptx'),
  qualityMode: 'formal'
});
assert.equal(fallbackFormalJson.success, false, 'formal QA should reject fallback-rendered PPTX');
const fallbackFinding = fallbackFormalJson.findings.find(f => f.type === 'fallbackRendererUsed');
assert.equal(fallbackFinding.level, 'fail');
assert.equal(fallbackFinding.originalLevel, 'review');
assert.equal(fallbackFinding.fatalBecauseOfQualityMode, 'formal');

const strictPlan = writePlan('strict-unknown', {
  title:'Unknown fallback strict',
  strictRendering:true,
  slides:[{ type:'unknown-strict-slide', title:'Strict blocks fallback' }]
});
const strict = generate(strictPlan, 'strict-unknown.pptx');
assert.notEqual(strict.status, 0, 'strict rendering should reject fallback');
assert.match(`${strict.stdout}\n${strict.stderr}`, /Strict render mode disallows fallback renderer/);

console.log('fallback renderer ok');
