const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-material-to-delivery');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-material-delivery-'));
const brief = path.join(inputDir, 'brief.md');
fs.writeFileSync(brief, [
  '# 智能巡检产品内部草案',
  '',
  '试点团队希望把巡检记录、异常处理和复盘节奏统一起来。',
  '当前异常处理依赖人工登记，响应时效和责任闭环不稳定。',
  '第一阶段需要确认试点场景、数据接口和验收口径。',
  '第二阶段再把经验扩展到更多站点。'
].join('\n'), 'utf8');

const pauseDir = path.join(OUT, 'pause');
const pause = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  pauseDir,
  '--skip-preview'
], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.equal(pause.status, 0, pause.stderr || pause.stdout);
const pauseResult = JSON.parse(pause.stdout);
assert.equal(pauseResult.status, 'awaiting_model_extraction');
assert.ok(fs.existsSync(path.join(pauseDir, 'material-bundle.json')));
assert.ok(fs.existsSync(path.join(pauseDir, 'model-orchestration', '04-extraction.prompt.md')));

const draftDir = path.join(OUT, 'draft');
const draft = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  draftDir,
  '--auto-draft',
  '--skip-preview',
  '--quality-mode',
  'draft',
  '--summary-md',
  path.join(draftDir, 'delivery-summary.md')
], {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: 180000
});
assert.equal(draft.status, 0, draft.stderr || draft.stdout);
const draftResult = JSON.parse(draft.stdout);
assert.equal(draftResult.status, 'complete');
assert.ok(fs.existsSync(path.join(draftDir, 'deck-plan.json')));
assert.ok(fs.existsSync(path.join(draftDir, 'deck.pptx')));
assert.ok(fs.existsSync(path.join(draftDir, 'deck.pptx.render-meta.json')));
assert.ok(fs.existsSync(path.join(draftDir, 'delivery-summary.md')));
const report = JSON.parse(fs.readFileSync(path.join(draftDir, 'delivery-report.json'), 'utf8'));
assert.equal(report.status, 'complete');
assert.equal(report.report.version, 'delivery-report-summary/v1');
assert.equal(report.report.kind, 'delivery');
assert.equal(report.report.meta.previewProvider, 'none');
assert.ok(Number.isInteger(report.report.meta.ocrPossibleMissingCount));
assert.equal(report.report.meta.assetGateStatus, 'ready');
assert.ok(report.nextActions.some(item => /Auto-draft/.test(item)));

const modelResultsDir = path.join(OUT, 'model-results');
const draftExtraction = JSON.parse(fs.readFileSync(path.join(draftDir, 'model-orchestration', 'material-extraction.draft.json'), 'utf8'));
const modelResultsPath = path.join(OUT, 'model-results.json');
fs.writeFileSync(modelResultsPath, `${JSON.stringify({ extraction: draftExtraction, critic: { status: 'pass', notes: [] } }, null, 2)}\n`, 'utf8');
const modelResultsRun = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  modelResultsDir,
  '--model-results',
  modelResultsPath,
  '--skip-preview',
  '--quality-mode',
  'draft'
], {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: 180000
});
assert.equal(modelResultsRun.status, 0, modelResultsRun.stderr || modelResultsRun.stdout);
const modelResultsOutput = JSON.parse(modelResultsRun.stdout);
assert.ok(['complete', 'needs_asset_decisions'].includes(modelResultsOutput.status));
assert.ok(fs.existsSync(path.join(modelResultsDir, 'model-orchestration', 'material-extraction.json')));

const stdinDir = path.join(OUT, 'model-results-stdin');
const stdinRun = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  stdinDir,
  '--model-results-stdin',
  '--skip-preview',
  '--quality-mode',
  'draft'
], {
  cwd: ROOT,
  input: JSON.stringify({ extraction: draftExtraction }),
  encoding: 'utf8',
  timeout: 180000
});
assert.equal(stdinRun.status, 0, stdinRun.stderr || stdinRun.stdout);
assert.ok(['complete', 'needs_asset_decisions'].includes(JSON.parse(stdinRun.stdout).status));

const partialDir = path.join(OUT, 'model-results-partial');
const partialPath = path.join(OUT, 'model-results-partial.json');
fs.writeFileSync(partialPath, `${JSON.stringify({ sourceAudit: { version: 'material-source-audit/v1', missing_inputs: [] } }, null, 2)}\n`, 'utf8');
const partialRun = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  partialDir,
  '--model-results',
  partialPath,
  '--skip-preview',
  '--quality-mode',
  'draft'
], {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: 180000
});
assert.equal(partialRun.status, 0, partialRun.stderr || partialRun.stdout);
assert.equal(JSON.parse(partialRun.stdout).status, 'awaiting_model_extraction');

const invalidPath = path.join(OUT, 'model-results-invalid.json');
fs.writeFileSync(invalidPath, `${JSON.stringify({ extraction: 'bad' }, null, 2)}\n`, 'utf8');
const invalidRun = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  path.join(OUT, 'model-results-invalid'),
  '--model-results',
  invalidPath,
  '--skip-preview'
], {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: 180000
});
assert.notEqual(invalidRun.status, 0);
assert.equal(JSON.parse(invalidRun.stdout).status, 'invalid_model_results');

const blockedPath = path.join(OUT, 'model-results-blocked.json');
fs.writeFileSync(blockedPath, `${JSON.stringify({
  extraction: draftExtraction,
  critic: {
    status: 'block',
    findings: [{ severity: 'high', type: 'unsupported_source', message: '关键事实缺少来源。' }]
  }
}, null, 2)}\n`, 'utf8');
const blockedRun = cp.spawnSync(process.execPath, [
  'scripts/material_to_delivery.js',
  brief,
  '--out-dir',
  path.join(OUT, 'model-results-blocked'),
  '--model-results',
  blockedPath,
  '--skip-preview'
], {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: 180000
});
assert.equal(blockedRun.status, 0, blockedRun.stderr || blockedRun.stdout);
assert.equal(JSON.parse(blockedRun.stdout).status, 'critic_blocked');

console.log('material to delivery orchestrator ok');
