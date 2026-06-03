#!/usr/bin/env node
const {
  assertSkillMetadata,
  validateSkillMetadata
} = require('./qa/skill-metadata');

function main() {
  const json = process.argv.includes('--json');
  if (json) {
    const result = validateSkillMetadata();
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exit(1);
    return;
  }
  assertSkillMetadata();
  console.log('SKILL.md basic validation ok');
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
