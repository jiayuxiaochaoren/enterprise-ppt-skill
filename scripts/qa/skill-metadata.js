const fs = require('fs');
const path = require('path');

function validateSkillMetadata(opts = {}) {
  const root = opts.root || path.resolve(__dirname, '..', '..');
  const file = opts.file || path.join(root, 'SKILL.md');
  const text = fs.readFileSync(file, 'utf8');
  const findings = [];

  if (!text.startsWith('---')) {
    findings.push({
      id: 'frontmatter_start_missing',
      message: 'SKILL.md must start with frontmatter'
    });
  }

  const end = text.indexOf('\n---\n', 3);
  if (end < 0) {
    findings.push({
      id: 'frontmatter_close_missing',
      message: 'frontmatter close not found'
    });
  }

  const frontmatter = end >= 0 ? text.slice(0, end + 1) : text;
  if (!/\nname:\s*premium-commercial-ppt(?:\s|$)/.test(frontmatter)) {
    findings.push({
      id: 'name_missing',
      message: 'name missing'
    });
  }
  if (!/\ndescription:\s+/.test(frontmatter)) {
    findings.push({
      id: 'description_missing',
      message: 'description missing'
    });
  }

  return {
    version: 'skill-metadata-validation/v1',
    success: findings.length === 0,
    file,
    findings
  };
}

function assertSkillMetadata(opts = {}) {
  const result = validateSkillMetadata(opts);
  if (!result.success) {
    throw new Error(result.findings.map(finding => finding.message).join('; '));
  }
  return result;
}

module.exports = {
  assertSkillMetadata,
  validateSkillMetadata
};
