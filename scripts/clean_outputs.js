#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
['out', 'outputs'].forEach(dir => {
  const target = path.join(ROOT, dir);
  fs.rmSync(target, { recursive:true, force:true });
  console.log(`removed ${dir}/`);
});
