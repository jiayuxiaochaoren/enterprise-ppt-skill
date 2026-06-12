const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  assetTargetContract,
  createAssetGenerationHelpers,
  generatedPromptAspectConflict,
  generatedAssetTargetSpec
} = require('./design/asset-generation');
const {
  assetDecisionStateFor
} = require('./design/asset-decision-state');
const {
  runPlanAudits
} = require('./qa/visual-plan-audit');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  boundAssetsForMeta
} = require('./render/asset-meta-helpers');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-asset-decision-gate');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const normalizedSaasStructureDeck = normalizeDeckPlan({
  industry:'saas-technology',
  visualIntent:'image-rich',
  title:'SaaS structure asset policy regression',
  slides:[{
    type:'timeline',
    layoutVariant:'automation-workflow',
    title:'落地路径从一个核心工作流扩展到多部门平台化',
    phases:[{ title:'首个团队' }, { title:'系统集成' }, { title:'扩展席位' }]
  }, {
    type:'metric-comparison',
    layoutVariant:'adoption-revenue-board',
    title:'收入扩展来自激活率、集成深度和席位增长',
    metrics:[{ label:'NRR', value:'118%' }, { label:'激活率', value:'64%' }]
  }]
});
assert.equal(normalizedSaasStructureDeck.slides[0].assetGeneration.status, 'none');
assert.equal(normalizedSaasStructureDeck.slides[0].assetGeneration.assetDecisionState.status, 'structure-only');
assert.deepEqual(normalizedSaasStructureDeck.slides[0].assetGeneration.assetDecisionState.allowedActions, []);
assert.equal(normalizedSaasStructureDeck.slides[0].generatedAssetPrompt, undefined);
assert.equal(normalizedSaasStructureDeck.slides[1].assetGeneration.status, 'none');
assert.equal(normalizedSaasStructureDeck.slides[1].generatedAssetPrompt, undefined);
assert.deepEqual(assetDecisionStateFor({ status:'blocked', factual:true }).allowedActions, ['provide_assets', 'skip_image']);
assert.equal(assetDecisionStateFor({ status:'required', mustBind:true }).canAutoGenerate, true);

const normalizedLifestyleStructureDeck = normalizeDeckPlan({
  industry:'lifestyle-food-tourism-fashion',
  visualIntent:'image-rich',
  title:'Lifestyle structure asset policy regression',
  slides:[{
    type:'strategy-map',
    layoutVariant:'scene-conversion-board',
    proofObject:'customer-journey-map',
    title:'场景经营看板把空间、活动、内容和供应链连起来',
    claim:'用路线设计和商户联动形成可复盘的体验产品。',
    drivers:['空间场景', '主题活动', '社交内容'],
    actions:['路线设计', '商户联动', '会员权益'],
    outcomes:['停留变长', '连带提升', '复游改善']
  }]
});
assert.equal(normalizedLifestyleStructureDeck.slides[0].assetGeneration.status, 'none');
assert.equal(normalizedLifestyleStructureDeck.slides[0].assetGeneration.reason, 'native structural route renders without generated imagery');
assert.equal(normalizedLifestyleStructureDeck.slides[0].generatedAssetPrompt, undefined);

const rendererCropAssets = boundAssetsForMeta({}, [], ['cover-crop.png'], [{
  fit:'cover',
  slot:{ w:2, h:2 },
  slotAspectRatio:1,
  imageAspectRatio:1.5,
  aspectMismatch:0.5
}], { aspectRatio:1.778, fitPolicy:'cover' });
assert.equal(rendererCropAssets[0].aspectMismatchAllowed, true);

function writePngHeader(file, w, h) {
  const b = Buffer.alloc(33);
  b[0] = 0x89;
  b.write('PNG', 1, 'ascii');
  b[4] = 0x0d;
  b[5] = 0x0a;
  b[6] = 0x1a;
  b[7] = 0x0a;
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  fs.writeFileSync(file, b);
}

const planPath = path.join(OUT, 'beauty-plan.json');
const gatePath = path.join(OUT, 'asset-gate.json');
const gateSummaryPath = path.join(OUT, 'asset-gate.md');
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
const commerceCoverPlanPath = path.join(OUT, 'commerce-cover-plan.json');
const commerceCoverGatePath = path.join(OUT, 'commerce-cover-gate.json');
const factualCoverPlanPath = path.join(OUT, 'factual-cover-plan.json');
const factualCoverGatePath = path.join(OUT, 'factual-cover-gate.json');
const promptPlanPath = path.join(OUT, 'prompt-plan.json');
const promptOutPath = path.join(OUT, 'asset-prompts.json');
const splitPromptPlanPath = path.join(OUT, 'split-prompt-plan.json');
const splitPromptOutPath = path.join(OUT, 'split-asset-prompts.json');
const bindPlanPath = path.join(OUT, 'bind-plan.json');
const bindMapPath = path.join(OUT, 'bind-map.json');
const bindOutPath = path.join(OUT, 'bind-plan.bound.json');
const bindPptxPath = path.join(OUT, 'bind-plan.pptx');
const invalidBindMapPath = path.join(OUT, 'bind-map-invalid.json');
const tinyPngPath = path.join(OUT, 'tiny.png');
const horizontalPngPath = path.join(OUT, 'wide-16x9.png');
const verticalPngPath = path.join(OUT, 'vertical-split.png');
const galleryPngPath = path.join(OUT, 'gallery-wide.png');
const galleryPngPath2 = path.join(OUT, 'gallery-wide-2.png');
const aspectBindPlanPath = path.join(OUT, 'aspect-bind-plan.json');
const aspectBadMapPath = path.join(OUT, 'aspect-bind-wide-map.json');
const aspectGoodMapPath = path.join(OUT, 'aspect-bind-vertical-map.json');
const aspectGoodOutPath = path.join(OUT, 'aspect-bind-plan.bound.json');
const aspectQaMismatchPlanPath = path.join(OUT, 'aspect-qa-mismatch-plan.json');
const aspectQaBoundMismatchPlanPath = path.join(OUT, 'aspect-qa-bound-mismatch-plan.json');
const gateProvidePlanPath = path.join(OUT, 'gate-provide-plan.json');
const gateProvideBadAnswersPath = path.join(OUT, 'gate-provide-bad-answers.json');
const gateProvideBadPath = path.join(OUT, 'gate-provide-bad.json');
const gateProvideBadOutPath = path.join(OUT, 'gate-provide-bad.resolved.json');
const gateProvideGoodAnswersPath = path.join(OUT, 'gate-provide-good-answers.json');
const gateProvideGoodPath = path.join(OUT, 'gate-provide-good.json');
const gateProvideGoodOutPath = path.join(OUT, 'gate-provide-good.resolved.json');
const gateProvideAllowedAnswersPath = path.join(OUT, 'gate-provide-allowed-answers.json');
const gateProvideAllowedPath = path.join(OUT, 'gate-provide-allowed.json');
const gateProvideAllowedOutPath = path.join(OUT, 'gate-provide-allowed.resolved.json');
const galleryBindPlanPath = path.join(OUT, 'gallery-bind-plan.json');
const galleryBindMapPath = path.join(OUT, 'gallery-bind-map.json');
const galleryBindOutPath = path.join(OUT, 'gallery-bind-plan.bound.json');
const bridgeUnavailableDir = path.join(OUT, 'bridge-unavailable');
const bridgeSkipDir = path.join(OUT, 'bridge-skip');
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

cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', planPath, '--out', gatePath, '--summary-md', gateSummaryPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
const gateSummary = fs.readFileSync(gateSummaryPath, 'utf8');
assert.equal(gate.status, 'needs_user_input');
assert.ok(gate.questions.length >= 2, 'image-led beauty plan should ask for missing visual decisions');
assert.ok(gate.questions.every(q => q.options.some(o => o.action === 'provide_assets') && q.options.some(o => o.action === 'auto_generate') && q.options.some(o => o.action === 'skip_image')));
assert.equal(gate.severityPolicy.matrixVersion, 'quality-severity-matrix/v1');
assert.ok(gate.questions.every(q => q.severityPolicy && q.severityPolicy.formal === 'fail'));
assert.match(gateSummary, /资产决策清单/);
assert.match(gateSummary, /Allowed actions/);
assert.match(gateSummary, /auto_generate/);

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
assert.equal(bridgeUnavailable.status, 'needs_user_input');
const bridgeUnavailableReport = JSON.parse(fs.readFileSync(path.join(bridgeUnavailableDir, 'visual-asset-resolution.json'), 'utf8'));
assert.equal(bridgeUnavailableReport.imagegenCapability, 'unavailable');
assert.equal(bridgeUnavailableReport.missingAssetAction, 'require_user_input');
assert.equal(bridgeUnavailableReport.counts.autoGenerate, 0);
assert.equal(bridgeUnavailableReport.counts.skipImage, 0);
assert.ok(bridgeUnavailableReport.counts.requireUserInput >= 2, 'missing image decisions should require explicit user input by default');
assert.ok(!bridgeUnavailableReport.outputs.deckPlan, 'default unresolved asset decisions must not write a renderable resolved plan');

const bridgeSkip = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/resolve_visual_assets.js',
  planPath,
  '--out-dir',
  bridgeSkipDir,
  '--imagegen-capability',
  'unavailable',
  '--missing-asset-action',
  'skip_image'
], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(bridgeSkip.status, 'ready');
const bridgeSkipReport = JSON.parse(fs.readFileSync(path.join(bridgeSkipDir, 'visual-asset-resolution.json'), 'utf8'));
assert.equal(bridgeSkipReport.imagegenCapability, 'unavailable');
assert.equal(bridgeSkipReport.missingAssetAction, 'skip_image');
assert.equal(bridgeSkipReport.counts.autoGenerate, 0);
assert.ok(bridgeSkipReport.counts.skipImage >= 2, 'explicit skip_image should keep the structure-only batch path available');
const bridgeSkipPlan = JSON.parse(fs.readFileSync(path.join(ROOT, bridgeSkipReport.outputs.deckPlan), 'utf8'));
assert.equal(bridgeSkipPlan.slides[0].visual.mode, 'solid');
assert.equal(bridgeSkipPlan.slides[0].assetGeneration.status, 'none');
assert.equal(bridgeSkipPlan.slides[0].assetGeneration.decisionSource, 'asset-decision-gate/v1');
assert.equal(Boolean(bridgeSkipPlan.slides[0].generatedAssetPrompt), false);

const bridgeAvailable = JSON.parse(cp.execFileSync(process.execPath, [
  'scripts/resolve_visual_assets.js',
  planPath,
  '--out-dir',
  bridgeAvailableDir,
  '--imagegen-capability',
  'available',
  '--missing-asset-action',
  'auto_generate'
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
assert.ok(bridgePrompts.prompts.every(p => p.target && p.target.version === 'asset-target-contract/v1'));
assert.ok(bridgePrompts.prompts.every(p => p.targetAspectRatio), 'prompt planner should expose target aspect ratios');
assert.equal(bridgePrompts.prompts.some(p => p.promptAspectConflict), false, 'planned prompts should not contain target aspect conflicts');

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
assert.equal(resolvedPlan.slides[0].assetGeneration.target.version, 'asset-target-contract/v1');
assert.ok(resolvedPlan.slides[0].assetGeneration.target.aspectRatio);
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

fs.writeFileSync(commerceCoverPlanPath, JSON.stringify({
  industry: 'cross-border-ecommerce',
  visualIntent: 'image-rich',
  title: '跨境电商 SKU 平台增长复盘',
  slides: [{
    type: 'cover',
    title: '跨境电商 SKU 平台增长复盘',
    subtitle: '从平台、商品和履约证据看增长动作',
    visual: {
      mode: 'generated',
      role: 'showcase',
      prompt: '跨境电商经营网络的抽象封面视觉，不出现真实品牌或真实商品'
    }
  }]
}, null, 2));
cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', commerceCoverPlanPath, '--out', commerceCoverGatePath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const commerceCoverGate = JSON.parse(fs.readFileSync(commerceCoverGatePath, 'utf8'));
assert.equal(commerceCoverGate.status, 'needs_user_input');
assert.equal(commerceCoverGate.questions.length, 1);
assert.equal(commerceCoverGate.questions[0].blocked, false, 'abstract commerce cover should not be treated as factual proof');
assert.equal(commerceCoverGate.questions[0].allowedActions.includes('auto_generate'), true);
assert.equal(commerceCoverGate.questions[0].recommendedAction, 'auto_generate');
assert.match(commerceCoverGate.questions[0].generatedAssetPrompt, /premium enterprise PPT cover/i);
assert.doesNotMatch(commerceCoverGate.questions[0].generatedAssetPrompt, /text-safe zone|safe zone/i);
assert.match(commerceCoverGate.questions[0].generatedAssetPrompt, /right-side hero panel|no vertical mask/i);

fs.writeFileSync(factualCoverPlanPath, JSON.stringify({
  industry: 'cross-border-ecommerce',
  visualIntent: 'image-rich',
  title: '跨境电商真实产品图验证',
  slides: [{
    type: 'cover',
    title: '跨境电商真实产品图验证',
    subtitle: '需要真实素材时不能自动生成',
    visual: {
      mode: 'generated',
      role: 'showcase',
      prompt: '真实SKU产品图、平台截图和授权客户案例画面'
    }
  }]
}, null, 2));
cp.execFileSync('node', ['scripts/deck_asset_decision_gate.js', factualCoverPlanPath, '--out', factualCoverGatePath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const factualCoverGate = JSON.parse(fs.readFileSync(factualCoverGatePath, 'utf8'));
assert.equal(factualCoverGate.status, 'needs_user_input');
assert.equal(factualCoverGate.questions.length, 1);
assert.equal(factualCoverGate.questions[0].blocked, true, 'explicit factual cover visual should stay blocked');
assert.equal(factualCoverGate.questions[0].allowedActions.includes('auto_generate'), false);

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

const splitContract = assetTargetContract({}, {
  type: 'executive-blocks',
  visual: { mode: 'generated', role: 'split' }
}, 'split');
fs.writeFileSync(splitPromptPlanPath, JSON.stringify({
  industry: 'beauty-consumer',
  title: 'Split target validation',
  slides: [{
    type: 'executive-blocks',
    title: '椿野用夏季控油蓬松打开直播与复购路径',
    visual: { mode: 'generated', role: 'split' },
    assetGeneration: {
      decisionSource: 'asset-decision-gate/v1',
      status: 'required',
      role: 'showcase',
      originalRole: 'split',
      resolvedRole: 'showcase',
      mustBind: true,
      syntheticOnly: true,
      target: splitContract
    }
  }]
}, null, 2));
cp.execFileSync(process.execPath, ['scripts/asset_prompt_planner.js', splitPromptPlanPath, '--out', splitPromptOutPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const splitPromptOut = JSON.parse(fs.readFileSync(splitPromptOutPath, 'utf8'));
assert.equal(splitPromptOut.promptCount, 1);
assert.equal(splitPromptOut.prompts[0].targetOrientation, 'vertical');
assert.equal(splitPromptOut.prompts[0].targetAspectRatio, 0.567);
assert.match(splitPromptOut.prompts[0].recommendedFilename, /split-vertical-0-567/);
assert.equal(splitPromptOut.prompts[0].mustBind, true);

const splitTarget = generatedAssetTargetSpec({ visual: { role: 'split', targetSlot: { w: 4.25, h: 7.5 } } }, 'split');
assert.equal(splitTarget.orientation, 'vertical');
assert.equal(splitTarget.aspectRatio, 0.567);
const splitPromptHelpers = createAssetGenerationHelpers({
  referenceLayoutLibrary: {
    generatedAssetPromptPatterns: {
      showcase: 'Create showcase for {industryLabel}: {visualBrief}. Wide 16:9, 16:9 or 4:3 crop. Palette {paletteName}.'
    }
  },
  selectPaletteName: () => 'test palette'
});
const splitPrompt = splitPromptHelpers.generatedAssetPrompt(
  { industry: 'beauty-consumer' },
  { title: '椿野用夏季控油蓬松打开直播与复购路径', visual: { role: 'split', targetSlot: { w: 4.25, h: 7.5 } } }
);
assert.match(splitPrompt, /tall vertical image/i);
assert.doesNotMatch(splitPrompt, /16\s*:\s*9|4\s*:\s*3|wide landscape/i);
assert.equal(generatedPromptAspectConflict(splitPrompt, splitTarget), false);
assert.equal(generatedPromptAspectConflict('4:3 product crop', splitTarget), true);
assert.equal(generatedPromptAspectConflict('16:9横图，宽屏，4:3。', splitTarget), true);
const splitPromptZhHelpers = createAssetGenerationHelpers({
  referenceLayoutLibrary: {
    generatedAssetPromptPatterns: {
      showcase: '生成{industryLabel}视觉：{visualBrief}，16:9横图，宽屏，4:3。Palette {paletteName}.'
    }
  },
  selectPaletteName: () => 'test palette'
});
const splitPromptZh = splitPromptZhHelpers.generatedAssetPrompt(
  { industry: 'beauty-consumer' },
  { title: '椿野用夏季控油蓬松打开直播与复购路径', visual: { role: 'split', targetSlot: { w: 4.25, h: 7.5 } } }
);
assert.doesNotMatch(splitPromptZh, /16\s*[:：]\s*9|4\s*[:：]\s*3|横图|宽屏/);
assert.equal(generatedPromptAspectConflict(splitPromptZh, splitTarget), false);
const coverTarget = assetTargetContract({}, { type: 'cover', visual: { role: 'background' } }, 'background');
assert.equal(generatedPromptAspectConflict('竖图，海报图，portrait crop', coverTarget), true);
const coverShowcaseTarget = assetTargetContract({}, { type: 'cover', coverStyle:'brand-system-board', visual: { role: 'showcase' } }, 'showcase');
assert.equal(coverShowcaseTarget.targetSource, 'renderer-slot:cover-showcase-right-panel');
assert.equal(coverShowcaseTarget.orientation, 'balanced');
assert.notEqual(coverShowcaseTarget.aspectRatio, coverTarget.aspectRatio);
assert.doesNotMatch(coverShowcaseTarget.instruction, /text-safe zone/i);

const rendererSplitTarget = assetTargetContract({}, {
  type: 'executive-blocks',
  previousLayoutVariant: 'product-evidence-story',
  visual: { mode: 'generated', role: 'split' }
}, 'split');
assert.equal(rendererSplitTarget.orientation, 'vertical');
assert.equal(rendererSplitTarget.targetSource, 'renderer-slot:executive-blocks');
const stalePreviousTarget = assetTargetContract({}, {
  type: 'industry-chart',
  layoutVariant: 'channel-efficiency-matrix',
  previousLayoutVariant: 'product-evidence-story',
  previousProofObject: 'product-evidence-story',
  visual: { mode: 'generated', role: 'evidence' }
}, 'evidence');
assert.notEqual(stalePreviousTarget.orientation, 'vertical');
assert.notEqual(stalePreviousTarget.targetSource, 'renderer-slot:split-full-height');

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
    allowAspectMismatch: true,
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
assert.equal(boundPlan.slides[1].assetGeneration.aspectMismatchAllowed, true);
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
assert.equal(renderMeta.slides[1].assetDecision.aspectMismatchAllowed, true);
assert.ok(renderMeta.slides[1].assetDecision.assetTarget);
assert.ok(renderMeta.slides[1].assetDecision.imageDimensions);
assert.ok(renderMeta.slides[1].assetDecision.fitDecision);
const visualQaRun = cp.spawnSync(process.execPath, ['scripts/visual_qa.js', bindPptxPath, '--json'], {
  cwd: ROOT,
  encoding: 'utf8'
});
const visualQa = JSON.parse(visualQaRun.stdout);
assert.equal(visualQa.render_meta_schema_qa.status, 'pass');

writePngHeader(horizontalPngPath, 1600, 900);
writePngHeader(verticalPngPath, 581, 1024);
writePngHeader(galleryPngPath, 1600, 989);
writePngHeader(galleryPngPath2, 1200, 742);
fs.writeFileSync(aspectBindPlanPath, JSON.stringify({
  title: 'Aspect bind validation',
  slides: [{
    type: 'executive-blocks',
    title: '竖向分栏生图绑定',
    visual: { mode: 'generated', role: 'split' },
    assetGeneration: {
      decisionSource: 'asset-decision-gate/v1',
      status: 'required',
      role: 'showcase',
      originalRole: 'split',
      resolvedRole: 'showcase',
      mustBind: true,
      syntheticOnly: true,
      target: splitContract
    }
  }]
}, null, 2));
fs.writeFileSync(gateProvidePlanPath, JSON.stringify({
  title: 'Gate provide assets validation',
  slides: [{
    type: 'executive-blocks',
    title: 'provide_assets 竖槽校验',
    visual: { mode: 'generated', role: 'split' },
    assetGeneration: {
      decisionSource: 'asset-decision-gate/v1',
      status: 'required',
      role: 'showcase',
      originalRole: 'split',
      resolvedRole: 'showcase',
      mustBind: true,
      syntheticOnly: true,
      target: splitContract
    }
  }]
}, null, 2));
fs.writeFileSync(gateProvideBadAnswersPath, JSON.stringify({
  decisions: {
    '1': { action: 'provide_assets', asset: path.relative(ROOT, horizontalPngPath) }
  }
}, null, 2));
cp.execFileSync(process.execPath, ['scripts/deck_asset_decision_gate.js', gateProvidePlanPath, '--answers', gateProvideBadAnswersPath, '--out', gateProvideBadPath, '--out-plan', gateProvideBadOutPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const gateProvideBad = JSON.parse(fs.readFileSync(gateProvideBadPath, 'utf8'));
assert.equal(gateProvideBad.status, 'needs_user_input');
assert.equal(gateProvideBad.questions[0].status, 'error');
assert.equal(gateProvideBad.questions[0].errors.some(e => e.type === 'assetAspectMismatch'), true);
const gateProvideBadPlan = JSON.parse(fs.readFileSync(gateProvideBadOutPath, 'utf8'));
assert.equal(gateProvideBadPlan.slides[0].visual && gateProvideBadPlan.slides[0].visual.image, undefined);

fs.writeFileSync(gateProvideGoodAnswersPath, JSON.stringify({
  decisions: {
    '1': { action: 'provide_assets', asset: path.relative(ROOT, verticalPngPath) }
  }
}, null, 2));
cp.execFileSync(process.execPath, ['scripts/deck_asset_decision_gate.js', gateProvidePlanPath, '--answers', gateProvideGoodAnswersPath, '--out', gateProvideGoodPath, '--out-plan', gateProvideGoodOutPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const gateProvideGood = JSON.parse(fs.readFileSync(gateProvideGoodPath, 'utf8'));
assert.equal(gateProvideGood.status, 'ready');
const gateProvideGoodPlan = JSON.parse(fs.readFileSync(gateProvideGoodOutPath, 'utf8'));
assert.equal(gateProvideGoodPlan.slides[0].assetGeneration.decisionSource, 'asset-binder/v1');
assert.equal(gateProvideGoodPlan.slides[0].assetGeneration.gateDecisionSource, 'asset-decision-gate/v1');
assert.equal(gateProvideGoodPlan.slides[0].assetGeneration.targetAspectRatio, 0.567);
assert.equal(gateProvideGoodPlan.slides[0].assetGeneration.boundAssets.length, 1);
assert.equal(gateProvideGoodPlan.slides[0].sourceTrace.imageProvenance[0].targetAspectRatio, 0.567);

fs.writeFileSync(gateProvideAllowedAnswersPath, JSON.stringify({
  decisions: {
    '1': { action: 'provide_assets', asset: path.relative(ROOT, horizontalPngPath), allowAspectMismatch: true }
  }
}, null, 2));
cp.execFileSync(process.execPath, ['scripts/deck_asset_decision_gate.js', gateProvidePlanPath, '--answers', gateProvideAllowedAnswersPath, '--out', gateProvideAllowedPath, '--out-plan', gateProvideAllowedOutPath], {
  cwd: ROOT,
  stdio: 'pipe'
});
const gateProvideAllowed = JSON.parse(fs.readFileSync(gateProvideAllowedPath, 'utf8'));
assert.equal(gateProvideAllowed.status, 'ready');
const gateProvideAllowedPlan = JSON.parse(fs.readFileSync(gateProvideAllowedOutPath, 'utf8'));
assert.equal(gateProvideAllowedPlan.slides[0].assetGeneration.aspectMismatchAllowed, true);
assert.ok(gateProvideAllowedPlan.slides[0].assetGeneration.aspectMismatch > 0.25);

const galleryTarget = assetTargetContract({}, { type: 'case-gallery', visual: { role: 'gallery' } }, 'gallery');
fs.writeFileSync(galleryBindPlanPath, JSON.stringify({
  title: 'Gallery bind validation',
  slides: [{
    type: 'case-gallery',
    title: 'gallery 多图绑定',
    visual: { mode: 'generated', role: 'gallery' },
    assetGeneration: {
      decisionSource: 'asset-decision-gate/v1',
      status: 'required',
      role: 'gallery',
      originalRole: 'gallery',
      resolvedRole: 'gallery',
      mustBind: true,
      syntheticOnly: true,
      target: galleryTarget
    }
  }]
}, null, 2));
fs.writeFileSync(galleryBindMapPath, JSON.stringify({
  '1': {
    role: 'gallery',
    images: [
      { path: path.relative(ROOT, galleryPngPath), type: 'generated-image' },
      { path: path.relative(ROOT, galleryPngPath2), type: 'generated-image' }
    ]
  }
}, null, 2));
const galleryBindResult = JSON.parse(cp.execFileSync(process.execPath, ['scripts/bind_generated_assets.js', galleryBindPlanPath, galleryBindMapPath, galleryBindOutPath], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(galleryBindResult.success, true);
const galleryBoundPlan = JSON.parse(fs.readFileSync(galleryBindOutPath, 'utf8'));
assert.equal(galleryBoundPlan.slides[0].assetGeneration.boundAssets.length, 2);
assert.equal(galleryBoundPlan.slides[0].sourceTrace.imageProvenance.length, 2);
assert.equal(galleryBoundPlan.slides[0].assetGeneration.worstAspectMismatch, galleryBoundPlan.slides[0].assetGeneration.aspectMismatch);
fs.writeFileSync(aspectBadMapPath, JSON.stringify({
  '1': {
    path: path.relative(ROOT, horizontalPngPath),
    type: 'generated-image',
    role: 'split',
    source: 'Codex imagegen test'
  }
}, null, 2));
const badAspectBind = cp.spawnSync(process.execPath, ['scripts/bind_generated_assets.js', aspectBindPlanPath, aspectBadMapPath, path.join(OUT, 'aspect-bind-bad.bound.json')], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.notEqual(badAspectBind.status, 0, '16:9 generated image should not bind into a vertical split target');
const badAspectPayload = JSON.parse(badAspectBind.stderr || badAspectBind.stdout);
assert.equal(badAspectPayload.errors.some(e => e.type === 'assetAspectMismatch'), true);
fs.writeFileSync(aspectQaMismatchPlanPath, JSON.stringify({
  title: 'Aspect QA validation',
  slides: [{
    type: 'executive-blocks',
    title: '竖向分栏 QA 负例',
    visual: {
      image: path.basename(horizontalPngPath),
      mode: 'hybrid',
      role: 'split',
      generated: true
    },
    assetGeneration: {
      decisionSource: 'asset-binder/v1',
      status: 'bound',
      role: 'showcase',
      originalRole: 'split',
      resolvedRole: 'showcase',
      mustBind: true,
      syntheticOnly: true,
      target: splitContract
    }
  }]
}, null, 2));
const mismatchAudit = runPlanAudits({ planPath: aspectQaMismatchPlanPath, renderMetaResult: {} });
assert.equal(mismatchAudit.findings.some(f => f.type === 'assetAspectMismatch'), true, 'visual plan QA should fail aspect mismatches even if a bad asset bypasses binder');

fs.writeFileSync(aspectQaBoundMismatchPlanPath, JSON.stringify({
  title: 'Bound aspect QA validation',
  slides: [{
    type: 'executive-blocks',
    title: '竖向分栏 bound QA 负例',
    visual: {
      image: path.basename(horizontalPngPath),
      mode: 'photo',
      role: 'split'
    },
    assetGeneration: {
      decisionSource: 'asset-binder/v1',
      status: 'bound',
      role: 'split',
      originalRole: 'split',
      resolvedRole: 'split',
      target: splitContract
    }
  }]
}, null, 2));
const boundMismatchAudit = runPlanAudits({ planPath: aspectQaBoundMismatchPlanPath, renderMetaResult: {} });
assert.equal(boundMismatchAudit.findings.some(f => f.type === 'assetAspectMismatch'), true, 'visual plan QA should fail bound aspect mismatches even when the asset is not marked generated');

fs.writeFileSync(aspectGoodMapPath, JSON.stringify({
  '1': {
    path: path.relative(ROOT, verticalPngPath),
    type: 'generated-image',
    role: 'split',
    source: 'Codex imagegen test'
  }
}, null, 2));
const goodAspectBind = JSON.parse(cp.execFileSync(process.execPath, ['scripts/bind_generated_assets.js', aspectBindPlanPath, aspectGoodMapPath, aspectGoodOutPath], {
  cwd: ROOT,
  encoding: 'utf8'
}));
assert.equal(goodAspectBind.success, true);
const aspectBoundPlan = JSON.parse(fs.readFileSync(aspectGoodOutPath, 'utf8'));
assert.equal(aspectBoundPlan.slides[0].assetGeneration.targetAspectRatio, 0.567);
assert.ok(aspectBoundPlan.slides[0].assetGeneration.aspectMismatch <= 0.25);
assert.equal(aspectBoundPlan.slides[0].sourceTrace.imageProvenance[0].targetAspectRatio, 0.567);
assert.ok(aspectBoundPlan.slides[0].sourceTrace.imageProvenance[0].aspectMismatch <= 0.25);

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
