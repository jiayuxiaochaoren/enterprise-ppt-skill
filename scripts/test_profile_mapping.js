const assert = require('assert/strict');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  groupsForChangedFiles,
  normalizeChangedFile,
  profileSummaryForChangedFiles
} = require('./test-profile-mapping');

assert.equal(normalizeChangedFile('./scripts/render/text-meta.js'), 'scripts/render/text-meta.js');
assert.equal(
  normalizeChangedFile(path.join(process.cwd(), 'scripts/render/text-meta.js'), process.cwd()),
  'scripts/render/text-meta.js'
);

const renderer = groupsForChangedFiles(['scripts/render/page-families/cover-core.js']);
assert.deepEqual(renderer.groups, ['unit', 'render', 'visual']);
assert.equal(renderer.matchedRules[0].id, 'renderer');
assert.equal(renderer.fallbackToFull, false);
assert.deepEqual(renderer.fileMatches, [{
  file: 'scripts/render/page-families/cover-core.js',
  matched: true,
  ruleIds: ['renderer'],
  groups: ['unit', 'render', 'visual']
}]);

function assertProfile(file, expectedGroups, expectedRuleIds) {
  const profile = profileSummaryForChangedFiles([file]);
  assert.deepEqual(profile.groups, expectedGroups, `${file} groups`);
  assert.deepEqual(profile.matchedRules.map(rule => rule.id), expectedRuleIds, `${file} rules`);
  assert.equal(profile.fallbackToFull, false, `${file} should not fallback to full`);
}

const asset = profileSummaryForChangedFiles(['scripts/deck_asset_decision_gate.js']);
assert.deepEqual(asset.groups, ['unit', 'pipeline', 'delivery']);
assert.ok(asset.commands.includes('npm run test:delivery'));

const assetReport = profileSummaryForChangedFiles(['scripts/reports/asset-decision-summary.js']);
assert.deepEqual(assetReport.groups, ['unit', 'pipeline', 'delivery']);
assert.deepEqual(assetReport.matchedRules.map(rule => rule.id), ['asset']);

const assetResolver = profileSummaryForChangedFiles(['scripts/resolve_visual_assets.js']);
assert.deepEqual(assetResolver.groups, ['unit', 'pipeline', 'delivery']);
assert.deepEqual(assetResolver.matchedRules.map(rule => rule.id), ['asset']);

const assetFacade = profileSummaryForChangedFiles(['scripts/assets/resolution-facade.js']);
assert.deepEqual(assetFacade.groups, ['unit', 'pipeline', 'delivery']);
assert.deepEqual(assetFacade.matchedRules.map(rule => rule.id), ['asset']);

const assetInternals = profileSummaryForChangedFiles([
  'scripts/design/asset-generation.js',
  'assets/media/ATTRIBUTION.md',
  'examples/sample-asset-led-deck-plan.json'
]);
assert.deepEqual(assetInternals.groups, ['unit', 'pipeline', 'delivery']);
assert.deepEqual(assetInternals.matchedRules.map(rule => rule.id), ['asset']);

const material = profileSummaryForChangedFiles(['scripts/material_to_delivery.js']);
assert.deepEqual(material.groups, ['pipeline', 'delivery']);
assert.ok(material.commands.includes('npm run test:pipeline'));

const materialInternals = profileSummaryForChangedFiles([
  'scripts/material/model-results-contract.js',
  'scripts/test_orchestration_contract.js',
  'examples/materials/manufacturing-brief.md'
]);
assert.deepEqual(materialInternals.groups, ['pipeline', 'delivery']);
assert.deepEqual(materialInternals.matchedRules.map(rule => rule.id), ['material']);

const rendererFixture = profileSummaryForChangedFiles(['examples/renderer-family-fixtures/risk-family.json']);
assert.deepEqual(rendererFixture.groups, ['unit', 'render', 'visual']);
assert.deepEqual(rendererFixture.matchedRules.map(rule => rule.id), ['renderer']);

const rendererTemplateFixtures = profileSummaryForChangedFiles([
  'examples/fixtures/premium-closing-anchor.json',
  'scripts/run_template_page_family_fixtures.js',
  'scripts/template_page_family_fixtures.js'
]);
assert.deepEqual(rendererTemplateFixtures.groups, ['unit', 'render', 'visual']);
assert.deepEqual(rendererTemplateFixtures.matchedRules.map(rule => rule.id), ['renderer']);
assert.equal(rendererTemplateFixtures.fallbackToFull, false);

const rendererFixtureTests = profileSummaryForChangedFiles([
  'scripts/test_template_page_family_fixtures.js',
  'scripts/test_component_fixture_qa.js'
]);
assert.deepEqual(rendererFixtureTests.groups, ['unit', 'render', 'visual']);
assert.deepEqual(rendererFixtureTests.matchedRules.map(rule => rule.id), ['renderer']);
assert.equal(rendererFixtureTests.fallbackToFull, false);

const rendererUnitTests = profileSummaryForChangedFiles([
  'scripts/test_financial_scorecard_renderers.js',
  'scripts/test_page_family_splits.js'
]);
assert.deepEqual(rendererUnitTests.groups, ['unit', 'render', 'visual']);
assert.deepEqual(rendererUnitTests.matchedRules.map(rule => rule.id), ['renderer']);
assert.equal(rendererUnitTests.fallbackToFull, false);

const rendererChromeInternals = profileSummaryForChangedFiles([
  'scripts/render/chrome/canvas-motifs.js',
  'scripts/render/chrome/deck-meta-policy.js'
]);
assert.deepEqual(rendererChromeInternals.groups, ['unit', 'render', 'visual']);
assert.deepEqual(rendererChromeInternals.matchedRules.map(rule => rule.id), ['renderer']);
assert.equal(rendererChromeInternals.fallbackToFull, false);
assert.ok(rendererChromeInternals.commands.includes('npm run test:visual'));

const profileMappingChange = profileSummaryForChangedFiles(['scripts/test-profile-mapping.js']);
assert.deepEqual(profileMappingChange.groups, ['unit']);
assert.deepEqual(profileMappingChange.matchedRules.map(rule => rule.id), ['test-profile']);

const mixed = groupsForChangedFiles([
  'scripts/qa/quality-severity-policy.js',
  'scripts/qa/quality-severity-matrix.js',
  'scripts/qa/quality-severity-commercial.js',
  'examples/visual-baseline-region-manifest.example.json'
]);
assert.deepEqual(mixed.groups, ['unit', 'visual', 'delivery']);
assert.deepEqual(mixed.matchedRules.map(rule => rule.id), ['visual-qa']);

const validatePptx = profileSummaryForChangedFiles(['scripts/validate_pptx.js']);
assert.deepEqual(validatePptx.groups, ['unit', 'visual', 'delivery']);
assert.deepEqual(validatePptx.matchedRules.map(rule => rule.id), ['visual-qa']);

[
  'scripts/test_chrome_helpers.js',
  'scripts/test_closing_routing.js',
  'scripts/test_evidence_gallery_routing.js',
  'scripts/test_fallback_renderer.js',
  'scripts/test_financial_chart_utils.js',
  'scripts/test_metadata_policy.js',
  'scripts/test_routing.js'
].forEach(file => assertProfile(file, ['unit', 'render', 'visual'], ['renderer']));

[
  'scripts/test_acceptance_briefs.js',
  'scripts/test_art_direction.js',
  'scripts/test_composition_planner.js',
  'scripts/test_composition_strategy.js',
  'scripts/test_connector_pages.js',
  'scripts/test_content_signals.js',
  'scripts/test_deck_rhythm_helpers.js',
  'scripts/test_density_strategy.js',
  'scripts/test_image_layout_strategy.js',
  'scripts/test_industry_pack_depth.js',
  'scripts/test_intelligence_layers.js',
  'scripts/test_reference_recipe_system.js',
  'scripts/test_rhythm_planner.js',
  'scripts/test_semantic_model.js',
  'scripts/test_slide_normalization_helpers.js',
  'scripts/test_slide_routing_helpers.js',
  'scripts/test_typography_system.js'
].forEach(file => assertProfile(file, ['unit', 'pipeline', 'visual'], ['design']));

[
  'assets/copy-policy.json',
  'assets/industry-benchmarks.json',
  'assets/industry-packs.json',
  'assets/reference-layout-library.json',
  'assets/reference-recipe-library.json',
  'assets/reference-recipes/index.json',
  'assets/reference-recipes/shards/cover.json',
  'assets/template-component-readiness.json',
  'examples/acceptance-financial-results-brief.json',
  'examples/client-brief-trial-deck-plan.json',
  'examples/manufacturing-ops-demo-deck-plan.json',
  'examples/sample-deck-plan.json',
  'scripts/build_chart_regression_samples.js',
  'scripts/build_reference_recipes.js',
  'scripts/generate_industry_stress_demos.js',
  'scripts/industry_acceptance_matrix.js',
  'scripts/inspect_design.js',
  'scripts/run_beauty_chart_benchmark.js',
  'scripts/run_industry_acceptance.js'
].forEach(file => assertProfile(file, ['unit', 'pipeline', 'visual'], ['design']));

[
  'scripts/design/semantic-proof-candidates.js',
  'scripts/design/component-planning-normalization.js',
  'scripts/design/slide-route-sanitization.js',
  'scripts/design/design-system-foundation-helpers.js',
  'scripts/design/design-system-foundation-runtime-assembly.js',
  'scripts/design/design-system-planning-runtime-normalization.js',
  'scripts/design/language-microcopy-translations-core.js',
  'scripts/design/language-microcopy-translations-domain.js',
  'scripts/design/language-microcopy-translations.js',
  'scripts/design/source-trace-audit-primitives.js',
  'scripts/design/typography-tokens.js'
].forEach(file => assertProfile(file, ['unit', 'pipeline', 'visual'], ['design']));

[
  'scripts/render/overlay-component-renderer.js',
  'scripts/render/overlay-native-evidence.js',
  'scripts/render/overlay-native-ownership.js',
  'scripts/render/overlay-renderer-data.js',
  'scripts/render/overlay-renderer-guards.js',
  'scripts/render/industry/energy-deployment-renderers.js',
  'scripts/render/industry/energy-navigation-renderers.js',
  'scripts/render/page-families/beauty-catalog-featured-lead.js',
  'scripts/render/page-families/primitive-stage-shell.js'
].forEach(file => assertProfile(file, ['unit', 'render', 'visual'], ['renderer']));

[
  'scripts/qa/route-metadata-audit.js',
  'scripts/qa/render-meta-schema-audit.js',
  'scripts/qa/visual-slide-audit-primitives.js'
].forEach(file => assertProfile(file, ['unit', 'visual', 'delivery'], ['visual-qa']));

[
  'scripts/render/text-meta.js',
  'scripts/render/text-readability-policy.js',
  'scripts/render/text-box-meta.js'
].forEach(file => assertProfile(file, ['unit', 'visual'], ['render-text']));

[
  'scripts/qa/visual-region-contract.js',
  'scripts/qa/screenshot-baseline-region-rules.js',
  'scripts/qa/visual-slide-regions.js'
].forEach(file => assertProfile(file, ['unit', 'visual'], ['visual-region']));

[
  'scripts/qa/component-consumption-audit.js',
  'scripts/qa/component-consumption-counts.js',
  'scripts/qa/component-consumption-mode-policy.js',
  'scripts/qa/component-consumption-native-evidence.js'
].forEach(file => assertProfile(file, ['unit', 'visual'], ['component-consumption']));

[
  'scripts/design/chart-semantic-qa.js',
  'scripts/design/chart-visual-qa.js',
  'scripts/design/chart-evidence-qa.js',
  'scripts/design/chart-spec-normalization.js'
].forEach(file => assertProfile(file, ['unit', 'visual'], ['chart-qa']));

[
  'scripts/test_commercial_readiness_qa.js',
  'scripts/test_component_screenshot_qa.js',
  'scripts/test_quality_mode.js',
  'scripts/test_semantic_narrative_qa.js'
].forEach(file => assertProfile(file, ['unit', 'visual', 'delivery'], ['visual-qa']));

assertProfile('scripts/test_delivery_fixtures.js', ['pipeline', 'delivery'], ['material']);
assertProfile('scripts/test_hardening_dashboard.js', ['unit', 'delivery'], ['delivery-readiness']);
assertProfile('scripts/test_hardening_matrix_contract.js', ['unit', 'delivery'], ['delivery-readiness']);
assertProfile('scripts/test_hardening_readiness_helpers.js', ['unit', 'delivery'], ['delivery-readiness']);
assertProfile('scripts/test_preview_provider.js', ['unit', 'delivery'], ['delivery-readiness']);
assertProfile('scripts/test_validate_preview_fallback.js', ['unit', 'delivery'], ['delivery-readiness']);

const deliveryReadiness = profileSummaryForChangedFiles([
  'scripts/audit_hardening_readiness.js',
  'scripts/audit_template_readiness.js',
  'scripts/qa/hardening-delivery-gates.js',
  'scripts/qa/hardening-readiness-modes.js',
  'scripts/qa/hardening-template-summary.js',
  'scripts/qa/template-readiness-cli.js',
  'scripts/qa/template-readiness-constants.js',
  'scripts/qa/template-readiness-files.js',
  'scripts/reports/hardening-readiness-format.js',
  'scripts/reports/hardening-readiness-human.js',
  'scripts/reports/hardening-readiness-report.js',
  'scripts/reports/template-readiness-report.js',
  'scripts/clean_outputs.js',
  'scripts/preview_doctor.js',
  'scripts/verify_delivery.js',
  'scripts/reports/verification-report.js'
]);
assert.deepEqual(deliveryReadiness.groups, ['unit', 'delivery']);
assert.deepEqual(deliveryReadiness.matchedRules.map(rule => rule.id), ['delivery-readiness']);
assert.ok(deliveryReadiness.commands.includes('npm run audit:hardening'));

fs.readdirSync(__dirname)
  .filter(file => /^test_.*\.js$/.test(file))
  .forEach(file => {
    const profile = profileSummaryForChangedFiles([`scripts/${file}`]);
    assert.equal(profile.fallbackToFull, false, `${file} should have an explicit test-profile rule`);
  });

const unknown = profileSummaryForChangedFiles(['scripts/new-unknown-area.js']);
assert.equal(unknown.fallbackToFull, true);
assert.deepEqual(unknown.groups, ['unit', 'pipeline', 'render', 'visual', 'delivery']);
assert.ok(unknown.commands.includes('npm test'));

const explain = JSON.parse(cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--changed-files',
  'scripts/render/text-meta.js',
  '--explain',
  '--json'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' }));
assert.equal(explain.fallbackToFull, false);
assert.deepEqual(explain.groups, ['unit', 'visual']);
assert.deepEqual(explain.fileMatches, [{
  file: 'scripts/render/text-meta.js',
  matched: true,
  ruleIds: ['render-text'],
  groups: ['unit', 'visual']
}]);
assert.equal(explain.commands.includes('npm run test:render'), false);

const repeatedChangedFileExplain = JSON.parse(cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--changed-file',
  'scripts/test_chrome_helpers.js',
  '--changed-file',
  'scripts/test_delivery_fixtures.js',
  '--explain',
  '--json'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' }));
assert.equal(repeatedChangedFileExplain.fallbackToFull, false);
assert.deepEqual(repeatedChangedFileExplain.groups, ['unit', 'pipeline', 'render', 'visual', 'delivery']);
assert.deepEqual(repeatedChangedFileExplain.matchedRules.map(rule => rule.id), ['renderer', 'material']);
assert.ok(repeatedChangedFileExplain.commands.includes('npm run test:render'));
assert.ok(repeatedChangedFileExplain.commands.includes('npm run test:pipeline'));

const humanExplain = cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--changed-files',
  'scripts/deck_asset_decision_gate.js',
  '--explain'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' });
assert.match(humanExplain, /CHANGED-FILE PROFILE groups=unit,pipeline,delivery rules=asset fallbackToFull=false/);
assert.match(humanExplain, /MATCH scripts\/deck_asset_decision_gate\.js rules=asset groups=unit,pipeline,delivery/);
assert.match(humanExplain, /MINIMUM GATES npm run test:unit && npm run test:pipeline && npm run test:delivery/);

const changedFileList = JSON.parse(cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--changed-files',
  'scripts/run_all_tests.js,scripts/test_profile_mapping.js,README.md',
  '--list',
  '--json'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' }));
assert.equal(changedFileList.version, 'test-runner-selection/v1');
assert.equal(changedFileList.group, null);
assert.equal(changedFileList.profile, 'full');
assert.deepEqual(changedFileList.changedProfile.groups, ['unit']);
assert.deepEqual(changedFileList.changedProfile.matchedRules.map(rule => rule.id), ['test-profile', 'docs-skill']);
assert.deepEqual(changedFileList.changedProfile.commands, ['npm run test:unit', 'npm run validate:skill']);
assert.deepEqual(changedFileList.changedProfile.fileMatches.map(row => row.ruleIds), [['test-profile'], ['test-profile'], ['docs-skill']]);
assert.ok(changedFileList.tests.includes('test_profile_mapping.js'));
assert.equal(changedFileList.tests.includes('test_component_screenshot_qa.js'), false);

const humanChangedFileList = cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--changed-files',
  'scripts/run_all_tests.js,scripts/test_profile_mapping.js,README.md',
  '--list'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' });
assert.match(humanChangedFileList, /CHANGED-FILE PROFILE groups=unit rules=test-profile,docs-skill fallbackToFull=false/);
assert.match(humanChangedFileList, /MATCH README\.md rules=docs-skill groups=unit/);
assert.match(humanChangedFileList, /SELECTED TESTS \d+/);
assert.match(humanChangedFileList, /test_profile_mapping\.js/);

const visualFastList = JSON.parse(cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--group',
  'visual',
  '--profile',
  'fast',
  '--list',
  '--json'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' }));
assert.equal(visualFastList.profile, 'fast');
assert.ok(visualFastList.tests.includes('test_art_direction.js'));
assert.equal(visualFastList.tests.includes('test_component_screenshot_qa.js'), false);
assert.equal(visualFastList.tests.includes('test_visual_layout_qa.js'), false);
assert.deepEqual(visualFastList.tests, [
  'test_art_direction.js',
  'test_commercial_readiness_qa.js',
  'test_semantic_narrative_qa.js',
  'test_visual_qa_baseline.js',
  'test_visual_qa_content_coverage.js'
]);

const visualSlowList = JSON.parse(cp.execFileSync(process.execPath, [
  path.join(__dirname, 'run_all_tests.js'),
  '--group',
  'visual',
  '--profile',
  'slow',
  '--list',
  '--json'
], { cwd:path.resolve(__dirname, '..'), encoding:'utf8' }));
assert.equal(visualSlowList.profile, 'slow');
assert.deepEqual(visualSlowList.tests, [
  'test_component_screenshot_qa.js',
  'test_visual_layout_qa.js',
  'test_visual_qa_overlap.js',
  'test_visual_qa_render_counts.js'
]);

console.log('test profile mapping ok');
