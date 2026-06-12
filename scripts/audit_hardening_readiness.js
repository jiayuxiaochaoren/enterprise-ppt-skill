#!/usr/bin/env node
const { runHardeningReadinessCli } = require('./qa/hardening-readiness-cli');
const {
  MATRIX_PATH,
  ROOT,
  readJson,
  rel
} = require('./qa/hardening-readiness-environment');
const { summarizeHardeningReadiness } = require('./qa/hardening-readiness-summary');

runHardeningReadinessCli({
  matrixPath: MATRIX_PATH,
  readJson,
  rel,
  root: ROOT,
  summarize: summarizeHardeningReadiness
});
