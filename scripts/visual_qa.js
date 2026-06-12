#!/usr/bin/env node
/* Structural visual QA for generated PPTX files.
   This complements Keynote preview review by catching tiny text, text-heavy slides,
   missing previews, placeholder copy, and weak image-role fit signals. */
const {
  failResult,
  parseVisualQaArgs,
  usage
} = require('./qa/visual-qa-cli');
const {
  runVisualQa
} = require('./qa/visual-qa-runner');

const options = parseVisualQaArgs(process.argv.slice(2));
if (options.usage) usage();
const {
  baselinePath,
  file,
  jsonOnly,
  planPath,
  previewDir,
  qualityMode
} = options;
const result = runVisualQa({
  baselinePath,
  file,
  planPath,
  previewDir,
  qualityMode
});
if (result.error && !result.findings) failResult(file, result.error);

const output = JSON.stringify(result, null, 2);
if (jsonOnly || !result.success) console.log(output);
else console.log(output);
if (!result.success) process.exitCode = 1;
