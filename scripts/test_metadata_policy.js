const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'out', 'metadata-policy');
fs.mkdirSync(outDir, { recursive: true });

function writePlan(name, plan) {
  const file = path.join(outDir, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(plan, null, 2));
  return file;
}

function generate(name, plan) {
  const planPath = writePlan(name, plan);
  const pptxPath = path.join(outDir, `${name}.pptx`);
  execFileSync('node', [path.join(repoRoot, 'scripts', 'generate_pptx.js'), planPath, pptxPath], {
    cwd: repoRoot,
    stdio: 'pipe'
  });
  return pptxPath;
}

function slideXml(pptxPath) {
  const entries = execFileSync('unzip', ['-Z1', pptxPath], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const ai = Number(a.match(/slide(\d+)\.xml/)[1]);
      const bi = Number(b.match(/slide(\d+)\.xml/)[1]);
      return ai - bi;
    });
  return entries.map(name => execFileSync('unzip', ['-p', pptxPath, name], { encoding: 'utf8' })).join('\n');
}

function assertAbsent(label, text, needles) {
  needles.forEach(needle => {
    assert.equal(text.includes(needle), false, `${label}: should not include "${needle}"`);
  });
}

function assertPresent(label, text, needles) {
  needles.forEach(needle => {
    assert.equal(text.includes(needle), true, `${label}: should include "${needle}"`);
  });
}

const baseSlides = [
  { type: 'cover', title: '元信息策略验证', subtitle: '只展示材料里明确给出的内容。' },
  { type: 'chapter-divider', title: '汇报议题', items: ['现状判断', '方案路径', '下一步'] },
  { type: 'closing', title: '谢谢观看', subtitle: '期待继续交流。', closingVariant: 'simple-end' }
];

const minimalXml = slideXml(generate('minimal', {
  title: '元信息策略验证',
  industry: 'manufacturing-operations',
  slides: baseSlides
}));
assertPresent('minimal visible content', minimalXml, ['元信息策略验证', '谢谢观看']);
assertAbsent('minimal implicit metadata', minimalXml, ['曜能', '恒越', '2026', '商务演示稿', 'undefined', 'null']);

const hiddenXml = slideXml(generate('hidden-meta', {
  title: '元信息关闭验证',
  industry: 'manufacturing-operations',
  organization: '曜能数智科技有限公司',
  audience: '恒越精工管理层',
  date: '2026年5月',
  footer: '恒越精工设备运维升级方案',
  showMeta: false,
  showFooter: false,
  coverKicker: false,
  slides: [
    { type: 'cover', title: '元信息关闭验证', subtitle: '显式关闭后不显示组织、受众、日期和页脚。' },
    { type: 'closing', title: '谢谢观看', subtitle: '期待继续交流。', closingVariant: 'thank-you' }
  ]
}));
assertPresent('hidden visible content', hiddenXml, ['元信息关闭验证', '谢谢观看']);
assertAbsent('hidden metadata policy', hiddenXml, ['曜能数智科技有限公司', '恒越精工管理层', '2026年5月', '恒越精工设备运维升级方案']);

const explicitXml = slideXml(generate('explicit-meta', {
  title: '元信息显式展示',
  industry: 'manufacturing-operations',
  organization: '明示组织',
  audience: '董事会',
  date: '2026年5月',
  footer: '明示页脚',
  showMeta: true,
  metaFields: ['organization', 'audience', 'date'],
  showFooter: true,
  slides: [
    { type: 'cover', title: '元信息显式展示', subtitle: '材料给了才展示。' },
    { type: 'closing', title: '谢谢观看', subtitle: '期待继续交流。', closingVariant: 'simple-end' }
  ]
}));
assertPresent('explicit metadata', explicitXml, ['明示组织', '董事会', '2026年5月', '明示页脚']);

console.log('metadata policy tests passed');
