#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { profileSummaryForChangedFiles } = require('./test-profile-mapping');

const ROOT = path.resolve(__dirname, '..');
const TEST_GROUPS = {
  unit: [
    /^test_(architecture_core_renderers|architecture_energy_renderers|architecture_industry_renderers|beauty_renderers|brand_visual_richness_audit|business_renderers|chapter_renderers|chart_spec|chrome_helpers|closing_core_renderers|closing_industry_renderers|closing_routing|composition_strategy|content_signals|cover_core_renderers|deck_rhythm_helpers|density_strategy|design_proof_profile|design_system_modules|design_text_utils|evidence_brand_story_renderers|evidence_gallery_core_renderers|evidence_gallery_routing|evidence_industry_renderers|evidence_proof_board_renderers|fallback_renderer|financial_chart_utils|financial_industry_renderers|financial_investment_renderers|financial_results_renderers|financial_scorecard_renderers|hardening_dashboard|hardening_matrix_contract|hardening_readiness_helpers|image_layout_strategy|manifesto_renderers|metadata_policy|page_family_splits|profile_mapping|profile_renderers|quality_mode|render_content_helpers|render_geometry|render_meta_audits|render_meta_schema|render_runtime|renderer_api|renderer_context_contract|renderer_modularization|risk_board_renderers|routing|semantic_model|skill_metadata|slide_normalization_helpers|slide_routing_helpers|strategy_renderers|timeline_renderers|toc_renderers|typography_system|visual_qa_utils)\.js$/
  ],
  pipeline: [
    /^test_(acceptance_briefs|asset_decision_gate|composition_planner|connector_pages|industry_evidence_chain|industry_pack_depth|intelligence_layers|material_modules|material_pipeline|model_orchestration|orchestration_contract|reference_recipe_system|rhythm_planner)\.js$/
  ],
  render: [
    /^test_(component_fixture_qa|industry_evidence_chain_smoke|render_contracts|renderer_family_fixtures|template_family_qa|template_novelty_qa|template_page_family_fixtures)\.js$/
  ],
  visual: [
    /^test_(art_direction|commercial_readiness_qa|component_screenshot_qa|semantic_narrative_qa|visual_layout_qa|visual_qa_baseline|visual_qa_content_coverage|visual_qa_overlap|visual_qa_render_counts)\.js$/
  ],
  delivery: [
    /^test_(material_to_delivery|preview_provider|validate_preview_fallback|delivery_fixtures|delivery_report_schema)\.js$/
  ]
};
const SLOW_TESTS = new Set([
  'test_component_screenshot_qa.js',
  'test_delivery_fixtures.js',
  'test_industry_evidence_chain_smoke.js',
  'test_material_to_delivery.js',
  'test_renderer_family_fixtures.js',
  'test_template_page_family_fixtures.js',
  'test_visual_layout_qa.js',
  'test_visual_qa_overlap.js',
  'test_visual_qa_render_counts.js'
]);

function parseArgs(argv) {
  const opts = { pattern: /^test_.*\.js$/ };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--pattern') opts.pattern = new RegExp(argv[++i] || '');
    else if (arg === '--group') opts.group = argv[++i];
    else if (arg === '--profile') opts.profile = argv[++i];
    else if (arg === '--changed-files') opts.changedFiles = String(argv[++i] || '').split(',').map(file => file.trim()).filter(Boolean);
    else if (arg === '--changed-file') {
      opts.changedFiles = opts.changedFiles || [];
      opts.changedFiles.push(String(argv[++i] || '').trim());
    }
    else if (arg === '--explain') opts.explain = true;
    else if (arg === '--list') opts.list = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function usage() {
  console.error(`Usage: node scripts/run_all_tests.js [--pattern regex] [--group ${Object.keys(TEST_GROUPS).join('|')}] [--profile fast|slow|full] [--changed-files file1,file2] [--explain] [--list] [--json]`);
}

function matchesGroup(file, groups) {
  if (!groups || !groups.length) return true;
  groups.forEach(group => {
    if (!TEST_GROUPS[group]) throw new Error(`unknown test group: ${group}`);
  });
  return groups.some(group => TEST_GROUPS[group].some(pattern => pattern.test(file)));
}

function matchesProfile(file, profile) {
  if (!profile || profile === 'full') return true;
  if (profile === 'fast') return !SLOW_TESTS.has(file);
  if (profile === 'slow') return SLOW_TESTS.has(file);
  throw new Error(`unknown test profile: ${profile}`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return;
  }
  const changedFiles = opts.changedFiles || [];
  const changedProfile = changedFiles.length ? profileSummaryForChangedFiles(changedFiles, { cwd: ROOT }) : null;
  if (opts.explain) {
    if (!changedProfile) throw new Error('--explain requires --changed-files or --changed-file');
    if (opts.json) console.log(JSON.stringify(changedProfile, null, 2));
    else {
      console.log(`CHANGED-FILE PROFILE groups=${changedProfile.groups.join(',') || 'none'} rules=${changedProfile.matchedRules.map(rule => rule.id).join(',') || 'none'} fallbackToFull=${changedProfile.fallbackToFull}`);
      (changedProfile.fileMatches || []).forEach(row => {
        console.log(`MATCH ${row.file} rules=${(row.ruleIds || []).join(',') || 'none'} groups=${(row.groups || []).join(',') || 'none'}`);
      });
      if (changedProfile.unmatched.length) console.log(`UNMATCHED ${changedProfile.unmatched.join(',')}`);
      if (changedProfile.commands.length) console.log(`MINIMUM GATES ${changedProfile.commands.join(' && ')}`);
    }
    return;
  }
  const selectedGroups = opts.group
    ? [opts.group]
    : (changedProfile ? changedProfile.groups : []);
  const tests = fs.readdirSync(path.join(ROOT, 'scripts'))
    .filter(file => opts.pattern.test(file))
    .filter(file => matchesGroup(file, selectedGroups))
    .filter(file => matchesProfile(file, opts.profile))
    .sort();
  if (!tests.length) {
    throw new Error('no test scripts matched');
  }

  if (opts.list) {
    const payload = {
      version: 'test-runner-selection/v1',
      group: opts.group || null,
      profile: opts.profile || 'full',
      changedProfile,
      tests
    };
    if (opts.json) console.log(JSON.stringify(payload, null, 2));
    else {
      if (changedProfile) console.log(`CHANGED-FILE PROFILE groups=${changedProfile.groups.join(',') || 'none'} rules=${changedProfile.matchedRules.map(rule => rule.id).join(',') || 'none'} fallbackToFull=${changedProfile.fallbackToFull}`);
      if (changedProfile) {
        (changedProfile.fileMatches || []).forEach(row => {
          console.log(`MATCH ${row.file} rules=${(row.ruleIds || []).join(',') || 'none'} groups=${(row.groups || []).join(',') || 'none'}`);
        });
      }
      console.log(`SELECTED TESTS ${tests.length}`);
      tests.forEach(file => console.log(file));
    }
    return;
  }

  if (changedProfile) {
    console.log(`CHANGED-FILE PROFILE groups=${changedProfile.groups.join(',') || 'none'} rules=${changedProfile.matchedRules.map(rule => rule.id).join(',') || 'none'} fallbackToFull=${changedProfile.fallbackToFull}`);
    if (changedProfile.commands.length) console.log(`MINIMUM GATES ${changedProfile.commands.join(' && ')}`);
  }

  const results = [];
  for (const file of tests) {
    const started = Date.now();
    const result = cp.spawnSync(process.execPath, [path.join('scripts', file)], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const elapsedMs = Date.now() - started;
    const row = {
      file,
      status: result.status === 0 ? 'pass' : 'fail',
      elapsedMs,
      stdout: String(result.stdout || '').trim(),
      stderr: String(result.stderr || '').trim()
    };
    results.push(row);
    console.log(`${row.status.toUpperCase()} ${file} ${elapsedMs}ms`);
    if (row.status === 'fail') {
      if (row.stdout) console.log(row.stdout.slice(-4000));
      if (row.stderr) console.error(row.stderr.slice(-8000));
      break;
    }
  }

  const failed = results.filter(row => row.status === 'fail');
  console.log(`SUMMARY ${results.length - failed.length}/${tests.length} passed`);
  if (failed.length) process.exit(1);
}

try {
  main();
} catch (err) {
  usage();
  console.error(err.stack || err.message || err);
  process.exit(1);
}
