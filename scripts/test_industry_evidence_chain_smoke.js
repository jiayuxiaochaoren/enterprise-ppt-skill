const assert = require('assert/strict');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRIORITY_COMPONENTS = {
  'manufacturing-oee-evidence-chain': ['equipment-nameplate', 'inspection-matrix', 'quality-scorecard'],
  'finance-thesis-portfolio-risk-evidence-chain': ['governance-table', 'risk-register', 'disclosure-footnote'],
  'healthcare-service-handoff-quality-evidence-chain': ['patient-journey-band', 'service-blueprint-lane'],
  'saas-platform-workflow-adoption-evidence-chain': ['workflow-rail', 'prototype-frame', 'adoption-funnel']
};
const EXTENDED_INDUSTRIES = new Map([
  ['lifestyle-experience-journey-retention-evidence-chain', 'lifestyle-food-tourism-fashion'],
  ['public-governance-resource-risk-evidence-chain', 'government-public-sector'],
  ['people-culture-behavior-growth-evidence-chain', 'people-culture-company']
]);

const run = cp.spawnSync(process.execPath, ['scripts/run_industry_evidence_chain_smoke.js'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 16
});

assert.equal(run.status, 0, run.stderr || run.stdout);
const summary = JSON.parse(run.stdout);
assert.equal(summary.version, 'industry-evidence-chain-smoke/v1');
assert.equal(summary.sampleCount, 5);
assert.equal(summary.extendedSampleCount, 3);
assert.equal(summary.status, 'pass', JSON.stringify(summary.rows, null, 2));
assert.equal(summary.visualDifferenceQa.status, 'pass', JSON.stringify(summary.visualDifferenceQa, null, 2));
assert.ok(summary.contactSheetIndex.endsWith('.svg'), 'summary should record contact sheet index');
assert.ok(fs.existsSync(path.join(ROOT, summary.contactSheetIndex)), 'contact sheet index should exist');
assert.ok(summary.extendedContactSheetIndex.endsWith('.svg'), 'summary should record extended contact sheet index');
assert.ok(fs.existsSync(path.join(ROOT, summary.extendedContactSheetIndex)), 'extended contact sheet index should exist');
assert.ok(summary.failureDiagnostics, 'summary should expose failure diagnostics');
assert.ok(['pass', 'review'].includes(summary.failureDiagnostics.status), 'nonblocking review diagnostics should not fail smoke');
assert.ok(!Object.values(summary.failureDiagnostics.sourceCounts || {}).some(row => row.fail > 0), 'summary diagnostics should not contain fail counts');
assert.ok(Array.isArray(summary.artifactTable) && summary.artifactTable.length === 8, 'summary should expose artifact table for P0 and extended samples');
assert.ok(Array.isArray(summary.componentHitTable) && summary.componentHitTable.length === 8, 'summary should expose component hit table');
assert.ok(Array.isArray(summary.industryStageTable) && summary.industryStageTable.length === 8, 'summary should expose industry stage table');
const allRows = [...summary.rows, ...summary.extendedRows];
allRows.forEach(row => {
  assert.equal(row.status, 'pass', `${row.id}: ${row.gapReasons.join('; ')}`);
  assert.equal(row.visualQaStatus, 'pass', `${row.id} visual QA should pass formal mode`);
  assert.equal(row.visualQaSummary.failCount, 0, `${row.id} visual QA should have no formal fail findings`);
  assert.equal(row.slideCount, 3, `${row.id} should report slide count`);
  assert.ok(row.pptx.endsWith('.pptx'), `${row.id} should emit pptx`);
  assert.ok(row.renderMeta.endsWith('.render-meta.json'), `${row.id} should emit render-meta`);
  assert.ok(row.visualQa.endsWith('.visual-qa.json'), `${row.id} should emit visual QA json`);
  assert.ok(row.contactSheet.endsWith('.svg'), `${row.id} should emit contact sheet`);
  assert.ok(fs.existsSync(path.join(ROOT, row.contactSheet)), `${row.id} contact sheet should exist`);
  assert.ok(row.preview && row.preview.requested, `${row.id} should request preview`);
  assert.ok(['available', 'metadata_fallback', 'unavailable'].includes(row.preview.status), `${row.id} should record preview status or fallback`);
  if (row.preview.status === 'available') assert.ok(row.preview.count >= row.slideCount, `${row.id} should emit preview PNGs`);
  assert.ok(row.industryEvidenceChainSummary, `${row.id} should record compact chain summary`);
  assert.equal(row.industryEvidenceChainSummary.status, 'pass', `${row.id} compact chain summary should pass`);
  assert.equal(row.visualQaSummary.industryEvidenceChainSummary.status, 'pass', `${row.id} visual QA summary should carry compact chain summary`);
  assert.ok(row.stageTable.length >= 3, `${row.id} should record stage table`);
  assert.ok(row.componentHitTable.length >= 3, `${row.id} should record component hit table`);
  assert.ok(row.industryMetrics && row.industryMetrics.consumedHits >= 3, `${row.id} should consume industry components`);
  assert.ok(row.failureDiagnostics, `${row.id} should include failure diagnostics`);
  assert.notEqual(row.failureDiagnostics.status, 'fail', `${row.id} diagnostics should not contain blocking failure`);
  (PRIORITY_COMPONENTS[row.id] || []).forEach(componentId => {
    assert.ok(row.keyComponentHits.includes(componentId), `${row.id} should hit ${componentId}`);
    assert.ok(row.consumedComponentHits.includes(componentId), `${row.id} should consume ${componentId}`);
  });
  const renderMeta = JSON.parse(fs.readFileSync(path.join(ROOT, row.renderMeta), 'utf8'));
  const renderedComponents = new Map((renderMeta.slides || []).flatMap(slide => (slide.consumedComponents || [])
    .filter(component => component.industryEvidenceChain)
    .map(component => [component.id, component])));
  (PRIORITY_COMPONENTS[row.id] || []).forEach(componentId => {
    const component = renderedComponents.get(componentId);
    assert.ok(component, `${row.id} should record render-meta for ${componentId}`);
    assert.ok(component.rendererMethod || component.rendererModule, `${componentId} should record renderer evidence`);
    assert.ok(component.bbox && component.bbox.w > 0 && component.bbox.h > 0, `${componentId} should record visible bbox`);
    assert.ok(Number(component.drawnCount || component.itemCount || 0) > 0, `${componentId} should record drawn/item count`);
    assert.ok(component.chainStage, `${componentId} should record chainStage`);
    assert.ok(component.evidenceReason, `${componentId} should record evidenceReason`);
  });
});

assert.equal(summary.extendedIndustrySmoke.status, 'pass', 'extended industry smoke should pass');
assert.equal(summary.extendedIndustrySmoke.rows.length, 3, 'extended compact rows should include three industries');
summary.extendedIndustrySmoke.rows.forEach(row => {
  assert.equal(row.industry, EXTENDED_INDUSTRIES.get(row.id), `${row.id} should keep its extended industry identity`);
  assert.notEqual(row.industry, 'beauty-consumer', `${row.id} should not fall back to consumer chain`);
  assert.equal(row.chainStatus, 'pass', `${row.id} chain should pass`);
  assert.equal(row.visualQaStatus, 'pass', `${row.id} visual QA should pass`);
  assert.ok(row.stages.length >= 3, `${row.id} should record compact stage coverage`);
  assert.ok(row.componentHits.length >= 3, `${row.id} should record component hits`);
  assert.ok(row.consumedHits.length >= 3, `${row.id} should record consumed hits`);
  assert.equal(row.blockingGap, null, `${row.id} should not have compact blocking gap`);
  assert.ok(row.contactSheet.endsWith('.svg'), `${row.id} should record compact contact sheet path`);
  assert.ok(fs.existsSync(path.join(ROOT, row.contactSheet)), `${row.id} compact contact sheet should exist`);
  assert.ok(row.failureDiagnostics, `${row.id} should expose compact failure diagnostics`);
  assert.notEqual(row.failureDiagnostics.status, 'fail', `${row.id} compact diagnostics should not have fail status`);
});

console.log('industry evidence chain smoke ok');
