const path = require('path');

const ALL_TEST_GROUPS = ['unit', 'pipeline', 'render', 'visual', 'delivery'];

const TEST_PROFILE_RULES = [
  {
    id: 'render-text',
    label: 'Text rendering/readability metadata change',
    patterns: [
      /^scripts\/render\/text-[^/]+\.js$/
    ],
    groups: ['unit', 'visual'],
    commands: ['npm run test:unit', 'npm run test:visual']
  },
  {
    id: 'visual-region',
    label: 'Visual region contract or baseline-region rule change',
    patterns: [
      /^scripts\/qa\/[^/]*region[^/]*\.js$/
    ],
    groups: ['unit', 'visual'],
    commands: ['npm run test:unit', 'npm run test:visual']
  },
  {
    id: 'component-consumption',
    label: 'Component consumption QA rule-part change',
    patterns: [
      /^scripts\/qa\/component-consumption-[^/]+\.js$/
    ],
    groups: ['unit', 'visual'],
    commands: ['npm run test:unit', 'npm run test:visual']
  },
  {
    id: 'chart-qa',
    label: 'Chart QA rule-part or normalization change',
    patterns: [
      /^scripts\/design\/chart-.*qa.*\.js$/,
      /^scripts\/design\/chart-spec-normalization\.js$/
    ],
    groups: ['unit', 'visual'],
    commands: ['npm run test:unit', 'npm run test:visual']
  },
  {
    id: 'renderer',
    label: 'Renderer/runtime/layout change',
    patterns: [
      /^scripts\/render\/(?!text-[^/]+\.js$)/,
      /^scripts\/components\//,
      /^scripts\/generate_pptx\.js$/,
      /^scripts\/test_renderer_/,
      /^scripts\/test_render_/,
      /^scripts\/test_.*_renderers\.js$/,
      /^scripts\/test_(chrome_helpers|closing_routing|evidence_gallery_routing|fallback_renderer|financial_chart_utils|metadata_policy|routing)\.js$/,
      /^scripts\/test_page_family_splits\.js$/,
      /^scripts\/test_(component_fixture_qa|renderer_family_fixtures|template_family_qa|template_novelty_qa|template_page_family_fixtures)\.js$/,
      /^scripts\/(run_template_(page_family_fixtures|novelty_baselines)|template_page_family_fixtures)\.js$/,
      /^examples\/fixtures\//,
      /^examples\/renderer-family-fixtures\//
    ],
    groups: ['unit', 'render', 'visual'],
    commands: ['npm run test:unit', 'npm run test:render', 'npm run test:visual']
  },
  {
    id: 'asset',
    label: 'Asset decision/provenance change',
    patterns: [
      /^scripts\/deck_asset_decision_gate\.js$/,
      /^scripts\/asset_prompt_planner\.js$/,
      /^scripts\/resolve_visual_assets\.js$/,
      /^scripts\/bind_generated_assets\.js$/,
      /^scripts\/assets\//,
      /^scripts\/design\/asset-generation\.js$/,
      /^scripts\/design\/image-assets\.js$/,
      /^scripts\/design\/visual-media\.js$/,
      /^scripts\/render\/asset-decision-meta\.js$/,
      /^scripts\/reports\/asset-decision-summary\.js$/,
      /^scripts\/reports\/delivery-report\.js$/,
      /^scripts\/test_asset_decision_gate\.js$/,
      /^scripts\/test_delivery_report_schema\.js$/,
      /^assets\/media\//,
      /^examples\/sample-asset/,
      /^examples\/.*asset/i
    ],
    groups: ['unit', 'pipeline', 'delivery'],
    commands: ['npm run test:unit', 'npm run test:pipeline', 'npm run test:delivery']
  },
  {
    id: 'material',
    label: 'Material ingestion/orchestration change',
    patterns: [
      /^scripts\/material/,
      /^scripts\/material_pipeline\.js$/,
      /^scripts\/material\//,
      /^scripts\/test_delivery_fixtures\.js$/,
      /^scripts\/test_material/,
      /^scripts\/test_model_orchestration\.js$/,
      /^scripts\/test_orchestration_contract\.js$/,
      /^examples\/delivery-fixtures\//,
      /^examples\/materials\//,
      /^examples\/material-extraction/
    ],
    groups: ['pipeline', 'delivery'],
    commands: ['npm run test:pipeline', 'npm run test:delivery']
  },
  {
    id: 'visual-qa',
    label: 'Visual QA or screenshot baseline change',
    patterns: [
      /^scripts\/visual_qa\.js$/,
      /^scripts\/validate_pptx\.js$/,
      /^scripts\/qa\/(?!(hardening-|template-readiness-|skill-metadata\.js$|[^/]*region[^/]*\.js$|component-consumption-[^/]+\.js$))/,
      /^scripts\/test_brand_visual_richness_audit\.js$/,
      /^scripts\/test_(commercial_readiness_qa|component_screenshot_qa|quality_mode|semantic_narrative_qa)\.js$/,
      /^scripts\/test_visual_qa/,
      /^scripts\/test_visual_layout_qa\.js$/,
      /^assets\/visual-system\.json$/,
      /^examples\/visual-baseline/
    ],
    groups: ['unit', 'visual', 'delivery'],
    commands: ['npm run test:unit', 'npm run test:visual', 'npm run test:delivery']
  },
  {
    id: 'design',
    label: 'Design planning/audit change',
    patterns: [
      /^scripts\/design\/(?!asset-generation\.js$|image-assets\.js$|visual-media\.js$|chart-.*qa.*\.js$|chart-spec-normalization\.js$)/,
      /^scripts\/design-system\.js$/,
      /^scripts\/chart-spec\.js$/,
      /^scripts\/test_(acceptance_briefs|art_direction|composition_planner|composition_strategy|connector_pages|content_signals|deck_rhythm_helpers|density_strategy|image_layout_strategy|industry_evidence_chain|industry_evidence_chain_smoke|industry_pack_depth|intelligence_layers|reference_recipe_system|rhythm_planner|semantic_model|slide_normalization_helpers|slide_routing_helpers|typography_system)\.js$/,
      /^scripts\/test_design/,
      /^scripts\/test_chart_spec\.js$/,
      /^scripts\/(build_chart_regression_samples|build_reference_recipes|generate_industry_stress_demos|industry_acceptance_matrix|inspect_design|run_beauty_chart_benchmark|run_industry_acceptance|run_industry_evidence_chain_smoke)\.js$/,
      /^assets\/(copy-policy|industry-benchmarks|industry-packs|reference-layout-library|reference-recipe-library|template-component-readiness|template-readiness-matrix)\.json$/,
      /^assets\/reference-recipes\//,
      /^examples\/acceptance-.*brief\.json$/,
      /^examples\/industry-evidence-chain\//,
      /^examples\/(client-brief-trial-deck-plan|manufacturing-ops-demo-deck-plan|sample-deck-plan)\.json$/
    ],
    groups: ['unit', 'pipeline', 'visual'],
    commands: ['npm run test:unit', 'npm run test:pipeline', 'npm run test:visual']
  },
  {
    id: 'docs-skill',
    label: 'Docs or skill metadata change',
    patterns: [
      /^README\.md$/,
      /^SKILL\.md$/,
      /^package\.json$/,
      /^scripts\/qa\/skill-metadata\.js$/,
      /^scripts\/validate_skill_metadata\.js$/,
      /^scripts\/test_skill_metadata\.js$/,
      /^references\//,
      /^CONTEXT\.md$/
    ],
    groups: ['unit'],
    commands: ['npm run validate:skill', 'npm run test:unit']
  },
  {
    id: 'delivery-readiness',
    label: 'Delivery verification or hardening dashboard change',
    patterns: [
      /^scripts\/verify_delivery\.js$/,
      /^scripts\/audit_hardening_readiness\.js$/,
      /^scripts\/audit_template_readiness\.js$/,
      /^scripts\/(clean_outputs|preview_doctor)\.js$/,
      /^scripts\/preview\//,
      /^scripts\/qa\/(hardening-|template-readiness-)/,
      /^scripts\/reports\/(delivery-summary-report|hardening-readiness-(format|human|report)|template-readiness-report|validation-report|verification-report|report-utils)\.js$/,
      /^scripts\/test_(hardening_dashboard|hardening_matrix_contract|hardening_readiness_helpers|preview_provider|validate_preview_fallback)\.js$/,
      /^assets\/hardening-readiness-matrix\.json$/,
      /^assets\/template-readiness-matrix\.json$/
    ],
    groups: ['unit', 'delivery'],
    commands: ['npm run test:unit', 'npm run test:delivery', 'npm run audit:hardening']
  },
  {
    id: 'test-profile',
    label: 'Test runner/profile mapping change',
    patterns: [
      /^scripts\/run_all_tests\.js$/,
      /^scripts\/test-profile-mapping\.js$/,
      /^scripts\/test_profile_mapping\.js$/
    ],
    groups: ['unit'],
    commands: ['npm run test:unit']
  }
];

function normalizeChangedFile(file = '', cwd = process.cwd()) {
  const raw = String(file || '').trim();
  if (!raw) return '';
  const relative = path.isAbsolute(raw) ? path.relative(cwd, raw) : raw;
  return relative.replace(/\\/g, '/').replace(/^\.\//, '');
}

function orderedGroups(groups = []) {
  const set = new Set(groups);
  return ALL_TEST_GROUPS.filter(group => set.has(group));
}

function rulesForFile(file = '') {
  return TEST_PROFILE_RULES.filter(rule => rule.patterns.some(pattern => pattern.test(file)));
}

function groupsForChangedFiles(files = [], opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const normalized = files.map(file => normalizeChangedFile(file, cwd)).filter(Boolean);
  const matchedRules = [];
  const groups = new Set();
  const unmatched = [];
  const fileMatches = [];
  normalized.forEach(file => {
    const fileRules = rulesForFile(file);
    if (!fileRules.length) {
      unmatched.push(file);
      fileMatches.push({ file, matched: false, ruleIds: [], groups: [] });
      return;
    }
    const fileGroups = new Set();
    fileRules.forEach(rule => {
      if (!matchedRules.some(item => item.id === rule.id)) matchedRules.push(rule);
      rule.groups.forEach(group => groups.add(group));
      rule.groups.forEach(group => fileGroups.add(group));
    });
    fileMatches.push({
      file,
      matched: true,
      ruleIds: fileRules.map(rule => rule.id),
      groups: orderedGroups(fileGroups)
    });
  });
  if (unmatched.length) ALL_TEST_GROUPS.forEach(group => groups.add(group));
  return {
    version: 'test-profile-mapping/v1',
    files: normalized,
    fileMatches,
    groups: orderedGroups(groups),
    matchedRules: matchedRules.map(rule => ({ id: rule.id, label: rule.label, groups: orderedGroups(rule.groups), commands: rule.commands })),
    unmatched,
    fallbackToFull: unmatched.length > 0
  };
}

function profileSummaryForChangedFiles(files = [], opts = {}) {
  const profile = groupsForChangedFiles(files, opts);
  const commands = [];
  profile.matchedRules.forEach(rule => {
    rule.commands.forEach(command => {
      if (!commands.includes(command)) commands.push(command);
    });
  });
  if (profile.fallbackToFull) commands.push('npm test');
  return Object.assign({}, profile, { commands });
}

module.exports = {
  ALL_TEST_GROUPS,
  TEST_PROFILE_RULES,
  groupsForChangedFiles,
  normalizeChangedFile,
  profileSummaryForChangedFiles
};
