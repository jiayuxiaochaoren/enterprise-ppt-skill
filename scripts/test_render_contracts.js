const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-render-contracts');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let jsonCommandRunId = 0;

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

function runJsonCommand(args) {
  const stdoutPath = path.join(OUT, `json-command-${++jsonCommandRunId}.json`);
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  try {
    const result = cp.spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', stdoutFd, 'pipe']
    });
    fs.closeSync(stdoutFd);
    return {
      status: result.status == null ? 1 : result.status,
      stdout: fs.readFileSync(stdoutPath, 'utf8'),
      stderr: String(result.stderr || '')
    };
  } catch (error) {
    fs.closeSync(stdoutFd);
    throw error;
  }
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

const formalAuditedStale = writePlan('formal-audited-stale-route', {
  qualityMode: 'formal',
  allowDraftRender: true,
  industry: 'beauty-consumer',
  title: 'formal route audit',
  slides: [{
    type: 'industry-chart',
    layoutVariant: 'channel-efficiency-matrix',
    proofObject: 'timeline',
    title: '90天打法按阶段推进',
    phases: [{ title: '验证样品' }, { title: '锁定脚本' }],
    componentPlan: { version:'component-plan/v1', components:[{ id:'scorecard', required:true }], staleMarker:true },
    assetGeneration: { status:'required', role:'evidence', reason:'old route expected chart visual' },
    generatedAssetPrompt: 'OLD ROUTE PROMPT'
  }]
});
const formalAuditedPptx = path.join(OUT, 'formal-audited-stale-route.pptx');
const formalAuditedResult = cp.spawnSync(process.execPath, ['scripts/generate_pptx.js', formalAuditedStale, formalAuditedPptx], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(formalAuditedResult.status, 0, formalAuditedResult.stderr || formalAuditedResult.stdout);
const formalAuditedMeta = JSON.parse(fs.readFileSync(`${formalAuditedPptx}.render-meta.json`, 'utf8'));
const routeAuditMeta = formalAuditedMeta.slides[0].routeSanitization;
assert.ok(routeAuditMeta, 'formal stale route should record routeSanitization');
assert.ok(routeAuditMeta.suppressed.some(item => item.field === 'componentPlan'));
assert.ok(routeAuditMeta.suppressed.some(item => item.field === 'assetGeneration'));
assert.ok(routeAuditMeta.staleForRoute.some(item => item.field === 'generatedAssetPrompt' && item.resolution === 'removed'));
assert.equal(routeAuditMeta.active.includes('variant'), false);
assert.equal(formalAuditedMeta.slides[0].assetDecision.staleForRoute, false);
const formalAuditedQa = runJsonCommand(['scripts/visual_qa.js', formalAuditedPptx, '--plan', formalAuditedStale, '--quality-mode', 'formal', '--json']);
const formalAuditedQaJson = JSON.parse(formalAuditedQa.stdout);
assert.equal(formalAuditedQaJson.route_metadata_qa.status, 'pass');

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

const industryChainPlan = path.join(ROOT, 'examples', 'sample-deck-plan.json');
const industryChainPptx = path.join(OUT, 'industry-chain-coverage.pptx');
const industryChainResult = cp.spawnSync(process.execPath, ['scripts/generate_pptx.js', industryChainPlan, industryChainPptx], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(industryChainResult.status, 0, industryChainResult.stderr || industryChainResult.stdout);
const industryChainMetaPath = `${industryChainPptx}.render-meta.json`;
const industryChainPlanJson = JSON.parse(fs.readFileSync(industryChainPlan, 'utf8'));
const industryChainMeta = JSON.parse(fs.readFileSync(industryChainMetaPath, 'utf8'));
const industryChainAudit = auditIndustryEvidenceChain(industryChainPlanJson, normalizeDeckPlan(industryChainPlanJson), { renderMeta: industryChainMeta });
const recognizedIndustrySlides = industryChainAudit.slides.filter(slide => slide.chainId && slide.chainId !== 'neutral-general');
assert.ok(recognizedIndustrySlides.length > 0, 'sample deck should contain recognized industry evidence-chain slides');
assert.ok(industryChainAudit.slides.some(slide => slide.chainId === 'neutral-general'), 'sample deck should keep neutral slides so coverage consistency skips them');
recognizedIndustrySlides.forEach(slideAudit => {
  const rendered = (industryChainMeta.slides || []).find(slide => Number(slide.slide) === slideAudit.slide) || {};
  const coverage = rendered.industryEvidenceCoverage || {};
  assert.equal(coverage.version, 'industry-evidence-coverage/v1', `slide ${slideAudit.slide} should emit industry evidence coverage`);
  assert.equal(coverage.plannedStatus.status, slideAudit.coverageStatus.status, `slide ${slideAudit.slide} render-meta planned coverage should match QA recompute`);
  assert.equal(coverage.consumedStatus.status, slideAudit.coverageStatus.status, `slide ${slideAudit.slide} render-meta consumed coverage should match QA recompute`);
});

const industryChainCli = runJsonCommand(['scripts/audit_industry_chain.js', '--plan', industryChainPlan, '--render-meta', industryChainMetaPath, '--json']);
assert.equal(industryChainCli.status, 0, industryChainCli.stderr || industryChainCli.stdout);
const industryChainReport = JSON.parse(industryChainCli.stdout);
assert.equal(industryChainReport.version, 'industry-chain-report/v1');
assert.equal(industryChainReport.status, 'pass');
assert.equal(industryChainReport.summary.version, 'industry-evidence-chain-summary/v1');
assert.ok(Array.isArray(industryChainReport.slides));
assert.ok(industryChainReport.slides.every(slide => Number.isInteger(slide.slide) && Array.isArray(slide.expectedComponents) && Array.isArray(slide.plannedComponents) && Array.isArray(slide.consumedComponents)));
assert.ok(industryChainReport.slides.some(slide => slide.coverageStatus === 'pass'));
const industryChainCliMissingPlan = cp.spawnSync(process.execPath, ['scripts/audit_industry_chain.js'], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(industryChainCliMissingPlan.status, 2);
assert.match(industryChainCliMissingPlan.stderr, /Usage: node scripts\/audit_industry_chain\.js/);

console.log('render contract gates ok');
