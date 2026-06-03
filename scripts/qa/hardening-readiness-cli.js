const fs = require('fs');
const path = require('path');
const {
  hardeningReadinessMarkdown,
  printHardeningReadinessHuman
} = require('../reports/hardening-readiness-report');

function runHardeningReadinessCli(opts = {}) {
  const {
    matrixPath,
    readJson,
    rel,
    root,
    summarize
  } = opts;
  const args = process.argv.slice(2);
  const matrix = readJson(matrixPath, null);
  if (!matrix) {
    console.error(`Missing or invalid matrix: ${rel(matrixPath)}`);
    process.exit(1);
  }
  const summary = summarize(matrix);
  const summaryMdIndex = args.indexOf('--summary-md');
  const summaryMdPath = summaryMdIndex >= 0 ? path.resolve(root, String(args[summaryMdIndex + 1] || '')) : '';
  if (summaryMdPath) {
    fs.mkdirSync(path.dirname(summaryMdPath), { recursive: true });
    fs.writeFileSync(summaryMdPath, hardeningReadinessMarkdown(summary), 'utf8');
  }
  if (args.includes('--json')) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (args.includes('--markdown')) {
    console.log(hardeningReadinessMarkdown(summary));
  } else {
    printHardeningReadinessHuman(summary);
  }
  process.exitCode = summary.blockingCount === 0 ? 0 : 1;
  return summary;
}

module.exports = {
  runHardeningReadinessCli
};
