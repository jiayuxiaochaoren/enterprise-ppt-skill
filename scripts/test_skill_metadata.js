const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  assertSkillMetadata,
  validateSkillMetadata
} = require('./qa/skill-metadata');

const ROOT = path.resolve(__dirname, '..');

const result = validateSkillMetadata({ root: ROOT });
assert.equal(result.success, true);
assert.equal(result.findings.length, 0);
assert.doesNotThrow(() => assertSkillMetadata({ root: ROOT }));

const invalidPath = path.join(ROOT, 'out', 'test-skill-metadata', 'invalid-SKILL.md');
fs.mkdirSync(path.dirname(invalidPath), { recursive: true });
fs.writeFileSync(invalidPath, 'name: wrong\n', 'utf8');
const invalid = validateSkillMetadata({ file: invalidPath });
assert.equal(invalid.success, false);
assert.deepEqual(invalid.findings.map(finding => finding.id), [
  'frontmatter_start_missing',
  'frontmatter_close_missing',
  'name_missing',
  'description_missing'
]);

const cli = cp.spawnSync(process.execPath, ['scripts/validate_skill_metadata.js'], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
assert.equal(cli.status, 0, cli.stderr || cli.stdout);
assert.match(cli.stdout, /SKILL\.md basic validation ok/);

const packageJson = require('../package.json');
assert.equal(packageJson.scripts['validate:skill'], 'node scripts/validate_skill_metadata.js');

console.log('skill metadata validation ok');
