const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-asset-decision-gate');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const planPath = path.join(OUT, 'beauty-plan.json');
const gatePath = path.join(OUT, 'asset-gate.json');
const answersPath = path.join(OUT, 'asset-answers.json');
const resolvedGatePath = path.join(OUT, 'asset-gate-resolved.json');
const resolvedPlanPath = path.join(OUT, 'beauty-plan.resolved.json');
const blockedPlanPath = path.join(OUT, 'blocked-plan.json');
const blockedGatePath = path.join(OUT, 'blocked-gate.json');
const blockedAnswersPath = path.join(OUT, 'blocked-answers.json');
const blockedResolvedGatePath = path.join(OUT, 'blocked-gate-resolved.json');
const blockedResolvedPlanPath = path.join(OUT, 'blocked-plan.resolved.json');
const productBlockedPlanPath = path.join(OUT, 'product-blocked-plan.json');
const productBlockedGatePath = path.join(OUT, 'product-blocked-gate.json');
const promptPlanPath = path.join(OUT, 'prompt-plan.json');
const promptOutPath = path.join(OUT, 'asset-prompts.json');
const bindPlanPath = path.join(OUT, 'bind-plan.json');
const bindMapPath = path.join(OUT, 'bind-map.json');
const bindOutPath = path.join(OUT, 'bind-plan.bound.json');
const bindPptxPath = path.join(OUT, 'bind-plan.pptx');
const invalidBindMapPath = path.join(OUT, 'bind-map-invalid.json');
const tinyPngPath = path.join(OUT, 'tiny.png');
const bridgeUnavailableDir = path.join(OUT, 'bridge-unavailable');
const bridgeAvailableDir = path.join(OUT, 'bridge-available');
const bridgeBlockedDir = path.join(OUT, 'bridge-blocked');

fs.writeFileSync(planPath, JSON.stringify({
  industry: 'beauty-consumer',
  visualIntent: 'image-rich',
  title: '肌研之光品牌经营报告',
  slides: [
    { type: 'cover', title: '肌研之光品牌经营报告', layoutVariant: 'beauty-brand-editorial-cover' },
    {
      type: 'strategy-map',
      title: '品牌世界观与经营证据',
      proofObject: 'brand-world-and-business-proof',
      layoutVariant: 'brand-world-and-business-proof',
      drivers: [{ title:'产品承诺' }],
      actions: [{ title:'成分故事' }],
      outcomes: [{ title:'会员复购' }]
    },
    { type: 'closing', title: '下一步', actions: [{ title:'确认产品素材' }] }
  ]
}, null, 2));

cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', planPath, '--out', gatePath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
assert.equal(gate.status, 'needs_user_input');
assert.ok(gate.questions.length >= 2, 'image-led beauty plan should ask for missing visual decisions');
assert.ok(gate.questions.every(q => q.options.some(o => o.action === 'provide_assets') && q.options.some(o => o.action === 'auto_generate') && q.options.some(o => o.action === 'skip_image')));
assert.equal(gate.severityPolicy.matrixVersion, 'quality-severity-matrix/v1');
assert.ok(gate.questions.every(q => q.severityPolicy && q.severityPolicy.formal === 'fail'));

const bridgeUnavailable = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/resolve_visual_assets.js',
  planPath,
  '--out-dir',
  bridgeUnavailableDir,
  '--imagegen-capability',
  'unavailable'
], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(bridgeUnavailable.status, 'ready');
const bridgeUnavailableReport = JSON.parse(fs.readFileSync(path.join(bridgeUnavailableDir, 'visual-asset-resolution.json'), 'utf8'));
assert.equal(bridgeUnavailableReport.imagegenCapability, 'unavailable');
assert.equal(bridgeUnavailableReport.counts.autoGenerate, 0);
assert.ok(bridgeUnavailableReport.counts.skipImage >= 2, 'unavailable imagegen should explicitly skip missing image decisions');
const bridgeUnavailablePlan = JSON.parse(fs.readFileSync(path.join(ROOT, bridgeUnavailableReport.outputs.deckPlan), 'utf8'));
assert.equal(bridgeUnavailablePlan.slides[0].visual.mode, 'solid');
assert.equal(bridgeUnavailablePlan.slides[0].assetGeneration.status, 'none');
assert.equal(bridgeUnavailablePlan.slides[0].assetGeneration.decisionSource, 'asset-decision-gate/v1');
assert.equal(Boolean(bridgeUnavailablePlan.slides[0].generatedAssetPrompt), false);

const bridgeAvailable = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/resolve_visual_assets.js',
  planPath,
  '--out-dir',
  bridgeAvailableDir,
  '--imagegen-capability',
  'available'
], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(bridgeAvailable.status, 'needs_image_generation');
const bridgeAvailableReport = JSON.parse(fs.readFileSync(path.join(bridgeAvailableDir, 'visual-asset-resolution.json'), 'utf8'));
assert.equal(bridgeAvailableReport.imagegenCapability, 'available');
assert.ok(bridgeAvailableReport.counts.autoGenerate >= 2, 'available imagegen should request generation before fallback');
assert.equal(bridgeAvailableReport.counts.skipImage, 0);
assert.ok(bridgeAvailableReport.promptCount >= 2);
const bridgeAvailablePlan = JSON.parse(fs.readFileSync(path.join(ROOT, bridgeAvailableReport.outputs.deckPlan), 'utf8'));
assert.equal(bridgeAvailablePlan.slides[0].visual.mode, 'generated');
assert.equal(bridgeAvailablePlan.slides[0].assetGeneration.status, 'required');
assert.equal(bridgeAvailablePlan.slides[0].assetGeneration.decisionSource, 'asset-decision-gate/v1');
const bridgePrompts = JSON.parse(fs.readFileSync(path.join(bridgeAvailableDir, 'asset-prompts.json'), 'utf8'));
assert.equal(bridgePrompts.status, 'ready');
assert.equal(bridgePrompts.promptCount, bridgeAvailableReport.promptCount);

fs.writeFileSync(answersPath, JSON.stringify({
  decisions: {
    '1': { action: 'auto_generate' },
    '2': { action: 'skip_image' }
  }
}, null, 2));
cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', planPath, '--answers', answersPath, '--out', resolvedGatePath, '--out-plan', resolvedPlanPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const resolvedPlan = JSON.parse(fs.readFileSync(resolvedPlanPath, 'utf8'));
assert.equal(resolvedPlan.slides[0].visual.mode, 'generated');
assert.equal(resolvedPlan.slides[0].assetGeneration.status, 'required');
assert.equal(resolvedPlan.slides[0].assetGeneration.decisionSource, 'asset-decision-gate/v1');
assert.equal(resolvedPlan.slides[1].visual.mode, 'solid');
assert.equal(resolvedPlan.slides[1].assetGeneration.status, 'none');
assert.equal(resolvedPlan.slides[1].assetGeneration.decisionSource, 'asset-decision-gate/v1');
const skipAuditPptxPath = path.join(OUT, 'skip-audit.pptx');
cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', resolvedPlanPath, skipAuditPptxPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const skipAuditMeta = JSON.parse(fs.readFileSync(`${skipAuditPptxPath}.render-meta.json`, 'utf8'));
assert.equal(skipAuditMeta.slides[1].assetDecision.action, 'skip_image');
assert.equal(skipAuditMeta.slides[1].assetDecision.boundAssetCount, 0);
assert.deepEqual(skipAuditMeta.slides[1].assetDecision.proofEligibility, ['none']);

fs.writeFileSync(blockedPlanPath, JSON.stringify({
  industry: 'beauty-consumer',
  title: '事实素材阻断验证',
  slides: [
    {
      type: 'case-gallery',
      title: '真实客户截图与产品证书',
      images: [],
      assetGeneration: {
        status: 'blocked',
        role: 'evidence',
        mustBind: false,
        syntheticOnly: true,
        reason: 'visible content implies factual customer screenshot or certificate evidence'
      }
    }
  ]
}, null, 2));
cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', blockedPlanPath, '--out', blockedGatePath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const blockedGate = JSON.parse(fs.readFileSync(blockedGatePath, 'utf8'));
assert.equal(blockedGate.status, 'needs_user_input');
assert.equal(blockedGate.questions.length, 1);
assert.equal(blockedGate.questions[0].blocked, true);
assert.equal(blockedGate.questions[0].options.some(o => o.action === 'auto_generate'), false);
assert.deepEqual(blockedGate.questions[0].allowedActions, ['provide_assets', 'skip_image']);
assert.equal(blockedGate.questions[0].severityFindingType, 'skippedCriticalAsset');

const bridgeBlocked = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/resolve_visual_assets.js',
  blockedPlanPath,
  '--out-dir',
  bridgeBlockedDir,
  '--imagegen-capability',
  'available',
  '--blocked-action',
  'require_user_input'
], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(bridgeBlocked.status, 'needs_user_input');
const bridgeBlockedReport = JSON.parse(fs.readFileSync(path.join(bridgeBlockedDir, 'visual-asset-resolution.json'), 'utf8'));
assert.equal(bridgeBlockedReport.counts.autoGenerate, 0);
assert.equal(bridgeBlockedReport.counts.requireUserInput, 1);
assert.equal(bridgeBlockedReport.unresolved[0].blocked, true);

fs.writeFileSync(blockedAnswersPath, JSON.stringify({
  decisions: {
    '1': { action: 'auto_generate' }
  }
}, null, 2));
cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', blockedPlanPath, '--answers', blockedAnswersPath, '--out', blockedResolvedGatePath, '--out-plan', blockedResolvedPlanPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const blockedResolvedGate = JSON.parse(fs.readFileSync(blockedResolvedGatePath, 'utf8'));
assert.equal(blockedResolvedGate.status, 'needs_user_input');
assert.equal(blockedResolvedGate.questions.length, 1);
assert.equal(blockedResolvedGate.questions[0].status, 'error');
assert.equal(fs.existsSync(blockedResolvedPlanPath), true, 'resolved plan sidecar should still be emitted for review');
const blockedResolvedPlan = JSON.parse(fs.readFileSync(blockedResolvedPlanPath, 'utf8'));
assert.equal(Boolean(blockedResolvedPlan.slides[0].generatedAssetPrompt), false);
assert.equal(blockedResolvedPlan.slides[0].visual && blockedResolvedPlan.slides[0].visual.mode, undefined);

fs.writeFileSync(productBlockedPlanPath, JSON.stringify({
  industry: 'beauty-consumer',
  visualIntent: 'image-rich',
  title: '真实SKU包装证据验证',
  slides: [{
    type: 'case-gallery',
    title: '真实SKU包装与门店陈列照片',
    visual: { mode: 'generated', role: 'showcase' },
    claim: '需要展示真实产品包装、SKU条码和门店货架陈列。'
  }]
}, null, 2));
cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', productBlockedPlanPath, '--out', productBlockedGatePath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const productBlockedGate = JSON.parse(fs.readFileSync(productBlockedGatePath, 'utf8'));
assert.equal(productBlockedGate.status, 'needs_user_input');
assert.equal(productBlockedGate.questions[0].blocked, true);
assert.equal(productBlockedGate.questions[0].options.some(o => o.action === 'auto_generate'), false);
assert.match(productBlockedGate.questions[0].reason, /factual|真实|proof|substitute/i);

fs.writeFileSync(promptPlanPath, JSON.stringify({
  industry: 'beauty-consumer',
  title: 'Prompt blocked validation',
  slides: [{
    type: 'case-gallery',
    title: '真实客户截图',
    assetGeneration: {
      status: 'blocked',
      role: 'evidence',
      reason: 'real customer screenshot evidence cannot be generated'
    }
  }]
}, null, 2));
const promptResult = cp.spawnSync(process.execPath, ['scripts/asset_prompt_planner.js', promptPlanPath, '--out', promptOutPath, '--fail-on-blocked'], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.notEqual(promptResult.status, 0, 'asset prompt planner should fail on blocked when requested');
const promptOut = JSON.parse(fs.readFileSync(promptOutPath, 'utf8'));
assert.equal(promptOut.status, 'blocked');
assert.equal(promptOut.promptCount, 0);
assert.equal(promptOut.blockedCount, 1);

fs.writeFileSync(tinyPngPath, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
));
fs.writeFileSync(bindPlanPath, JSON.stringify({
  title: 'Bind validation',
  slides: [
    { type: 'cover', title: '封面' },
    { type: 'case-gallery', title: '图片证据页' }
  ]
}, null, 2));
fs.writeFileSync(bindMapPath, JSON.stringify({
  '2': {
    path: path.relative(ROOT, tinyPngPath),
    type: 'generated-image',
    role: 'evidence',
    source: 'Codex imagegen test'
  }
}, null, 2));
const bindResult = JSON.parse(cp.execFileSync(process.execPath, ['scripts/bind_generated_assets.js', bindPlanPath, bindMapPath, bindOutPath], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(bindResult.success, true);
assert.equal(bindResult.boundSlides, 1);
const boundPlan = JSON.parse(fs.readFileSync(bindOutPath, 'utf8'));
assert.equal(boundPlan.slides[1].visual.image, path.relative(ROOT, tinyPngPath));
assert.equal(boundPlan.slides[1].assetGeneration.decisionSource, 'asset-binder/v1');
assert.equal(boundPlan.slides[1].sourceTrace.imageProvenance.length, 1);
assert.equal(boundPlan.slides[1].sourceTrace.imageProvenance[0].provenanceClass, 'model-generated-preview');
assert.equal(boundPlan.slides[1].sourceTrace.imageProvenance[0].proofEligibility, 'synthetic-only');

cp.execFileSync(process.execPath, ['scripts/generate_pptx.js', bindOutPath, bindPptxPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const renderMeta = JSON.parse(fs.readFileSync(`${bindPptxPath}.render-meta.json`, 'utf8'));
assert.equal(renderMeta.slides[1].assetDecision.version, 'asset-decision/v1');
assert.equal(renderMeta.slides[1].assetDecision.status, 'bound');
assert.equal(renderMeta.slides[1].assetDecision.action, 'bound_asset');
assert.equal(renderMeta.slides[1].assetDecision.reason, 'asset bound from slide media');
assert.equal(renderMeta.slides[1].assetDecision.riskLevel, 'low');
assert.equal(renderMeta.slides[1].assetDecision.originalRole, 'evidence');
assert.equal(renderMeta.slides[1].assetDecision.resolvedRole, 'evidence');
assert.equal(renderMeta.slides[1].assetDecision.provenanceClass, 'model-generated-preview');
assert.deepEqual(renderMeta.slides[1].assetDecision.proofEligibility, ['synthetic-only']);
assert.equal(renderMeta.slides[1].assetDecision.boundAssetCount, 1);
assert.equal(renderMeta.slides[1].assetDecision.proofUse, 'synthetic-only');
const visualQaRun = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', bindPptxPath, '--json'], {
  cwd: ROOT,
  encoding: 'utf8'
});
const visualQa = JSON.parse(visualQaRun.stdout);
assert.equal(visualQa.render_meta_schema_qa.status, 'pass');

fs.writeFileSync(invalidBindMapPath, JSON.stringify({
  '99': { path: 'missing.png' },
  '1': { path: 'also-missing.png' }
}, null, 2));
const invalidBind = cp.spawnSync(process.execPath, ['scripts/bind_generated_assets.js', bindPlanPath, invalidBindMapPath, path.join(OUT, 'invalid-bound.json')], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.notEqual(invalidBind.status, 0, 'invalid bind mappings should fail');
const invalidPayload = JSON.parse(invalidBind.stderr || invalidBind.stdout);
assert.equal(invalidPayload.success, false);
assert.ok(invalidPayload.errors.some(e => e.type === 'slideOutOfRange'));
assert.ok(invalidPayload.errors.some(e => e.type === 'assetFileMissing'));

console.log('asset decision gate ok');
