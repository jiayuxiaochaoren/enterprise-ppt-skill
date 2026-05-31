#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TEST_GROUPS = {
  unit: [
    /^test_(chart_spec|density_strategy|design_system_modules|image_layout_strategy|metadata_policy|quality_mode|render_meta_audits|render_meta_schema|renderer_modularization|routing|typography_system)\.js$/
  ],
  pipeline: [
    /^test_(acceptance_briefs|asset_decision_gate|composition_planner|connector_pages|industry_pack_depth|intelligence_layers|material_modules|material_pipeline|model_orchestration|orchestration_contract|reference_recipe_system|rhythm_planner)\.js$/
  ],
  render: [
    /^test_(component_fixture_qa|render_contracts|renderer_family_fixtures|template_family_qa|template_novelty_qa|template_page_family_fixtures)\.js$/
  ],
  visual: [
    /^test_(art_direction|commercial_readiness_qa|component_screenshot_qa|semantic_narrative_qa|visual_layout_qa|visual_qa_baseline|visual_qa_content_coverage|visual_qa_overlap|visual_qa_render_counts)\.js$/
  ],
  delivery: [
    /^test_(material_to_delivery|preview_provider|validate_preview_fallback|delivery_fixtures)\.js$/
  ]
};
const SLOW_TESTS = new Set([
  'test_component_screenshot_qa.js',
  'test_delivery_fixtures.js',
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
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function usage() {
  console.error(`Usage: node scripts/run_all_tests.js [--pattern regex] [--group ${Object.keys(TEST_GROUPS).join('|')}] [--profile fast|slow|full]`);
}

function matchesGroup(file, group) {
  if (!group) return true;
  const patterns = TEST_GROUPS[group];
  if (!patterns) throw new Error(`unknown test group: ${group}`);
  return patterns.some(pattern => pattern.test(file));
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
  const tests = fs.readdirSync(path.join(ROOT, 'scripts'))
    .filter(file => opts.pattern.test(file))
    .filter(file => matchesGroup(file, opts.group))
    .filter(file => matchesProfile(file, opts.profile))
    .sort();
  if (!tests.length) {
    throw new Error('no test scripts matched');
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
