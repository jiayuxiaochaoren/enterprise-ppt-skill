const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ingestMaterials, writeJson } = require('./material_pipeline');

function fakePng(file, w, h) {
  const b = Buffer.alloc(24);
  b.writeUInt8(0x89, 0);
  b.write('PNG', 1, 'ascii');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  fs.writeFileSync(file, b);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-model-orchestration-'));
const materialsDir = path.join(root, 'materials');
const outDir = path.join(root, 'orchestration');
fs.mkdirSync(materialsDir, { recursive: true });

const brief = path.join(materialsDir, 'company-intro.md');
const siteImage = path.join(materialsDir, 'site-photo.png');

fs.writeFileSync(brief, [
  '# 承德环宇输送机械制造有限公司公司介绍',
  '',
  '公司始建于 1993 年，厂区占地 20.5 亩，拥有 3000 余平米生产车间和 1000 余平米加工中心。',
  '主营非标输送设备、涂装设备、控制系统和现场安装调试服务。',
  '上一版 PPT 制作备注：第二页先做公司历史，后续页面图册页优先展示。',
  '外发前需确认客户案例授权、资质证书编号、联系人、官网和地址。'
].join('\n'), 'utf8');
fakePng(siteImage, 1600, 900);

const bundlePath = path.join(root, 'material-bundle.json');
const bundle = ingestMaterials([materialsDir], { root: materialsDir });
writeJson(bundlePath, bundle);

execFileSync(process.execPath, [
  path.resolve(__dirname, 'material_orchestration_prompt.js'),
  '--bundle',
  bundlePath,
  '--out-dir',
  outDir
], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });

const expectedFiles = [
  '00-orchestration.md',
  '01-source-audit.prompt.md',
  '02-story-architecture.prompt.md',
  '03-clarification-gate.md',
  '04-extraction.prompt.md',
  '05-critic.prompt.md'
];
for (const name of expectedFiles) {
  assert.ok(fs.existsSync(path.join(outDir, name)), `${name} should be generated`);
}

const sourceAuditPrompt = fs.readFileSync(path.join(outDir, '01-source-audit.prompt.md'), 'utf8');
const storyPrompt = fs.readFileSync(path.join(outDir, '02-story-architecture.prompt.md'), 'utf8');
const gateInstructions = fs.readFileSync(path.join(outDir, '03-clarification-gate.md'), 'utf8');
const extractionPrompt = fs.readFileSync(path.join(outDir, '04-extraction.prompt.md'), 'utf8');
const criticPrompt = fs.readFileSync(path.join(outDir, '05-critic.prompt.md'), 'utf8');
const overview = fs.readFileSync(path.join(outDir, '00-orchestration.md'), 'utf8');

assert.ok(sourceAuditPrompt.includes('material-source-audit/v1'));
assert.ok(sourceAuditPrompt.includes('污染文本'));
assert.ok(sourceAuditPrompt.includes('不要写 deck plan'));
assert.ok(storyPrompt.includes('material-story-architecture/v1'));
assert.ok(storyPrompt.includes('anti_repetition_rules'));
assert.ok(storyPrompt.includes('industry_deep_dive'));
assert.ok(storyPrompt.includes('clarification_candidates'));
assert.ok(gateInstructions.includes('material_clarification_gate.js'));
assert.ok(extractionPrompt.includes('material-extraction/v1'));
assert.ok(extractionPrompt.includes('Clarification gate'));
assert.ok(extractionPrompt.includes('公司介绍页已经消费的基础规模/年份/厂区事实'));
assert.ok(extractionPrompt.includes('Stage 1 来源审计'));
assert.ok(extractionPrompt.includes('Stage 2 叙事架构'));
assert.ok(criticPrompt.includes('material-model-critic/v1'));
assert.ok(criticPrompt.includes('safe_to_compile'));
assert.ok(overview.includes('six checkpoints'));
assert.ok(overview.includes('clarification-gate.json'));

const sourceAuditJson = path.join(root, 'source-audit.json');
const storyJson = path.join(root, 'story-architecture.json');
fs.writeFileSync(sourceAuditJson, JSON.stringify({
  version: 'material-source-audit/v1',
  source_inventory: [{ source_id: 'src-001', usable_facts: ['始建于 1993 年'], rights_risks: ['现场图片授权不明确'] }],
  missing_inputs: ['联系人、电话、官网和地址', '客户案例授权']
}), 'utf8');
fs.writeFileSync(storyJson, JSON.stringify({
  version: 'material-story-architecture/v1',
  ppt_type: 'company-intro',
  industry: 'manufacturing-operations',
  audience: '潜在客户',
  decision_goal: '推动对外合作',
  external_delivery_risks: ['资质证书编号和有效期缺失'],
  anti_repetition_rules: ['公司介绍基础事实不再生成第二个指标页'],
  clarification_candidates: [
    {
      id: 'project_scope',
      priority: 'recommended',
      category: 'story-architecture',
      question: '是否有最想突出的一类项目场景？',
      affects: ['outline']
    }
  ]
}), 'utf8');

const clarificationJson = path.join(root, 'clarification-gate.json');
execFileSync(process.execPath, [
  path.resolve(__dirname, 'material_clarification_gate.js'),
  '--bundle',
  bundlePath,
  '--source-audit',
  sourceAuditJson,
  '--story-plan',
  storyJson,
  '--out',
  clarificationJson
], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
const gate = JSON.parse(fs.readFileSync(clarificationJson, 'utf8'));
assert.equal(gate.version, 'material-clarification-gate/v1');
assert.equal(gate.status, 'needs_user_input');
assert.ok(gate.questions.some(q => q.id === 'contact_block' && q.priority === 'blocking'));
assert.ok(gate.questions.some(q => q.id === 'customer_case_authorization'));
assert.ok(gate.questions.some(q => q.id === 'project_scope'));

const singleStageOut = path.join(root, 'single-extraction.prompt.md');
execFileSync(process.execPath, [
  path.resolve(__dirname, 'material_orchestration_prompt.js'),
  '--bundle',
  bundlePath,
  '--stage',
  'extraction',
  '--source-audit',
  sourceAuditJson,
  '--story-plan',
  storyJson,
  '--clarifications',
  clarificationJson,
  '--out',
  singleStageOut
], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
const singleStagePrompt = fs.readFileSync(singleStageOut, 'utf8');
assert.ok(singleStagePrompt.includes('始建于 1993 年'));
assert.ok(singleStagePrompt.includes('公司介绍基础事实不再生成第二个指标页'));
assert.ok(singleStagePrompt.includes('contact_block'));

console.log('model orchestration ok');
