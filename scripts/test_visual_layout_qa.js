const cp = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
[
  'scripts/test_visual_qa_baseline.js',
  'scripts/test_visual_qa_content_coverage.js',
  'scripts/test_visual_qa_overlap.js',
  'scripts/test_visual_qa_render_counts.js',
  'scripts/test_typography_system.js'
].forEach(script => {
  cp.execFileSync(process.execPath, [script], {
    cwd: ROOT,
    stdio: 'inherit'
  });
});

console.log('visual layout QA negative suite ok');
