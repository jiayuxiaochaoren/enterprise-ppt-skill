const { printTemplateReadinessHuman } = require('../reports/template-readiness-report');

function runTemplateReadinessCli(opts = {}) {
  const {
    matrixPath,
    readJson,
    rel,
    summarize
  } = opts;
  const matrix = readJson(rel(matrixPath), null);
  if (!matrix) {
    console.error(`Missing or invalid matrix: ${rel(matrixPath)}`);
    process.exit(1);
  }
  const summary = summarize(matrix);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printTemplateReadinessHuman(summary);
  }
  process.exit(summary.blockingCount === 0 && summary.allPass ? 0 : 1);
}

module.exports = {
  runTemplateReadinessCli
};
