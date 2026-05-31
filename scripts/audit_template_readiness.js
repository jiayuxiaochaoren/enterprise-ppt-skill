#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(ROOT, 'assets', 'template-readiness-matrix.json');
const STATUS_VALUES = ['missing', 'partial', 'pass'];
const STATUS_RANK = { missing: 0, partial: 1, pass: 2 };
const REQUIRED_STATUS_FIELDS = [
  'recipe',
  'visualGrammar',
  'renderer',
  'orchestration',
  'qa',
  'fixturePptx',
  'previewPng',
  'acceptanceDeck'
];
const REQUIRED_PAGE_FAMILIES = [
  'financial-kpi-snapshot',
  'chart-grid-with-commentary',
  'quarterly-results-summary',
  'guidance-and-risk-board',
  'value-creation-process-map',
  'materiality-matrix-board',
  'sustainability-proof-spread',
  'governance-table-editorial',
  'culture-cover-with-soft-geometry',
  'mission-statement-stage',
  'people-proof-mosaic',
  'value-principle-cards',
  'beauty-brand-editorial-cover',
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'product-evidence-story',
  'airy-concept-opening',
  'single-object-concept-map',
  'executive-proof-board',
  'premium-closing-anchor'
];

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function absolute(p) {
  if (!p) return '';
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function readText(relPath) {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  } catch (_) {
    return '';
  }
}

function readJson(relPath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function listFiles(dir, predicate = () => true) {
  try {
    return fs.readdirSync(dir)
      .map(name => path.join(dir, name))
      .filter(file => fs.statSync(file).isFile())
      .filter(predicate);
  } catch (_) {
    return [];
  }
}

function countPngs(dir) {
  try {
    return fs.readdirSync(dir).filter(name => /\.png$/i.test(name)).length;
  } catch (_) {
    return 0;
  }
}

function evidenceStrengthForRow(row = {}) {
  const statuses = row.statuses || {};
  const fixtures = row.fixtures || {};
  const fixtureEvidence = [fixtures.plan, fixtures.pptx, fixtures.preview, fixtures.renderMeta]
    .filter(Boolean)
    .every(file => fs.existsSync(absolute(file)));
  const qaEvidence = row.qa && row.qa.evidence && fs.existsSync(absolute(row.qa.evidence));
  const acceptanceEvidence = Array.isArray(row.acceptanceEvidence) && row.acceptanceEvidence.length > 0;
  const statusAllPass = REQUIRED_STATUS_FIELDS.every(field => normalizeStatus(statuses[field]) === 'pass');
  if (statusAllPass && fixtureEvidence && qaEvidence && acceptanceEvidence) return 'strong';
  if (statusAllPass && fixtureEvidence && qaEvidence) return 'moderate';
  if (fixtureEvidence || qaEvidence) return 'partial';
  return 'weak';
}

function statusMax(a, b) {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

function normalizeStatus(value) {
  return STATUS_VALUES.includes(value) ? value : 'missing';
}

function containsId(text, id) {
  return String(text || '').includes(id);
}

function collectAcceptanceEvidence(matrix) {
  const root = absolute(matrix.acceptanceRoot || '');
  const manifest = readJson(path.relative(ROOT, path.join(root, 'manifest.json')), { decks: [] });
  const planDir = path.join(root, 'plans');
  const evidence = new Map();
  REQUIRED_PAGE_FAMILIES.forEach(id => evidence.set(id, []));

  const decks = Array.isArray(manifest.decks) ? manifest.decks : [];
  const deckBySlug = new Map(decks.map(deck => [deck.slug, deck]));
  listFiles(planDir, file => /\.json$/i.test(file)).forEach(file => {
    const text = fs.readFileSync(file, 'utf8');
    const slug = path.basename(file, '.json');
    const deck = deckBySlug.get(slug) || {};
    REQUIRED_PAGE_FAMILIES.forEach(id => {
      if (!text.includes(id)) return;
      const previewDir = absolute(deck.previewDir || path.join(root, 'preview', slug));
      evidence.get(id).push({
        slug,
        plan: rel(file),
        pptx: deck.pptx ? rel(absolute(deck.pptx)) : '',
        previewCount: countPngs(previewDir),
        acceptanceStatus: deck.acceptanceStatus || 'unknown'
      });
    });
  });
  return evidence;
}

function recipeStatus(row, recipeLibraryText, designText) {
  const prioritySpecPattern = new RegExp(`\\[\\s*['"]${row.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*,`);
  if (containsId(recipeLibraryText, row.id) || prioritySpecPattern.test(designText)) return 'pass';
  if (containsId(designText, row.id)) return 'partial';
  return 'missing';
}

function visualGrammarStatus(row) {
  const grammar = row.grammar || {};
  const markers = Array.isArray(grammar.requiredMarkers) ? grammar.requiredMarkers.filter(Boolean) : [];
  if (grammar.primaryStructure && markers.length >= 3) return 'pass';
  if (grammar.primaryStructure || markers.length) return 'partial';
  return 'missing';
}

function rendererStatus(row, generateText) {
  const hasExactVariantUse = containsId(generateText, row.id);
  if (!hasExactVariantUse) return 'missing';
  if (row.renderer && row.renderer.approvedDistinctBranch === true) return 'pass';
  return 'partial';
}

function orchestrationStatus(row, designText, orchestrationText) {
  const inDesignRouter = containsId(designText, row.id);
  const inPlannerContract = containsId(orchestrationText, row.id);
  if (inDesignRouter && inPlannerContract) return 'pass';
  if (inDesignRouter || inPlannerContract) return 'partial';
  return 'missing';
}

function qaStatus(row, qaText) {
  if (row.qa && row.qa.approvedFamilyGate === true && containsId(qaText, row.id)) return 'pass';
  if (/acceptanceAudit|compositionAudit|imageEvidence|semantic-color|layout-repetition/.test(qaText)) return 'partial';
  return 'missing';
}

function fixtureStatus(filePath) {
  return filePath && fs.existsSync(absolute(filePath)) ? 'pass' : 'missing';
}

function acceptanceStatus(row, acceptanceEvidence) {
  const hits = acceptanceEvidence.get(row.id) || [];
  if (hits.some(hit => hit.acceptanceStatus === 'pass' && hit.previewCount > 0)) return 'pass';
  if (hits.length) return 'partial';
  return 'missing';
}

function buildObserved(row, context) {
  return {
    recipe: recipeStatus(row, context.recipeLibraryText, context.designText),
    visualGrammar: visualGrammarStatus(row),
    renderer: rendererStatus(row, context.generateText),
    orchestration: orchestrationStatus(row, context.designText, context.orchestrationText),
    qa: qaStatus(row, context.qaText),
    fixturePptx: fixtureStatus(row.fixtures && row.fixtures.pptx),
    previewPng: fixtureStatus(row.fixtures && row.fixtures.preview),
    acceptanceDeck: acceptanceStatus(row, context.acceptanceEvidence)
  };
}

function summarize(matrix) {
  const recipeLibraryText = readText('assets/reference-recipe-library.json');
  const designText = [
    readText('scripts/design-system.js'),
    readText('scripts/design/page-family-routing.js')
  ].join('\n');
  const generateText = readText('scripts/generate_pptx.js');
  const orchestrationText = [
    readText('scripts/material_orchestration_prompt.js'),
    readText('scripts/material_pipeline.js'),
    readText('scripts/material/clarification.js'),
    readText('scripts/material/deck-plan-compiler.js'),
    readText('scripts/material/extraction-schema.js'),
    readText('scripts/material/ingest.js'),
    readText('scripts/material_to_deck_plan.js'),
    readText('scripts/industry_acceptance_matrix.js')
  ].join('\n');
  const qaText = [
    designText,
    readText('scripts/visual_qa.js'),
    ...listFiles(path.join(ROOT, 'scripts'), file => /^test_.*\.js$/.test(path.basename(file))).map(file => fs.readFileSync(file, 'utf8'))
  ].join('\n');
  const acceptanceEvidence = collectAcceptanceEvidence(matrix);
  const context = { recipeLibraryText, designText, generateText, orchestrationText, qaText, acceptanceEvidence };
  const rows = Array.isArray(matrix.pageFamilies) ? matrix.pageFamilies : [];
  const ids = rows.map(row => row.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missingIds = REQUIRED_PAGE_FAMILIES.filter(id => !ids.includes(id));
  const extraIds = ids.filter(id => !REQUIRED_PAGE_FAMILIES.includes(id));
  const invalidRows = [];
  const issues = [];

  rows.forEach(row => {
    const statuses = row.statuses || {};
    REQUIRED_STATUS_FIELDS.forEach(field => {
      if (!STATUS_VALUES.includes(statuses[field])) {
        invalidRows.push(`${row.id}.${field}=${statuses[field] || 'undefined'}`);
      }
    });
    const observed = buildObserved(row, context);
    row.observed = observed;
    row.acceptanceEvidence = acceptanceEvidence.get(row.id) || [];
    REQUIRED_STATUS_FIELDS.forEach(field => {
      const tracked = normalizeStatus(statuses[field]);
      const actual = observed[field];
      if (STATUS_RANK[tracked] > STATUS_RANK[actual]) {
        issues.push({
          id: row.id,
          field,
          type: 'overstated-status',
          message: `matrix says ${field}:${tracked}, observed ${actual}`
        });
      }
    });
    if (statuses.renderer === 'missing') {
      issues.push({
        id: row.id,
        field: 'renderer',
        type: 'missing-renderer',
        message: 'high-value page family has no distinct renderer or variant branch'
      });
    }
    if (statuses.previewPng !== 'pass') {
      issues.push({
        id: row.id,
        field: 'previewPng',
        type: 'missing-rendered-preview',
        message: 'no one-page rendered PNG proof exists for this page family'
      });
    }
  });

  if (rows.length !== REQUIRED_PAGE_FAMILIES.length) {
    issues.push({
      id: 'matrix',
      field: 'pageFamilies',
      type: 'wrong-page-family-count',
      message: `expected ${REQUIRED_PAGE_FAMILIES.length}, found ${rows.length}`
    });
  }
  missingIds.forEach(id => issues.push({ id, field: 'pageFamilies', type: 'missing-page-family', message: 'required page family is absent from matrix' }));
  duplicateIds.forEach(id => issues.push({ id, field: 'pageFamilies', type: 'duplicate-page-family', message: 'page family appears more than once' }));
  extraIds.forEach(id => issues.push({ id, field: 'pageFamilies', type: 'extra-page-family', message: 'matrix contains a non-priority page family' }));
  invalidRows.forEach(label => issues.push({ id: label, field: 'statuses', type: 'invalid-status', message: `status must be one of ${STATUS_VALUES.join(', ')}` }));

  const totals = {};
  const evidenceStrength = { strong: 0, moderate: 0, partial: 0, weak: 0 };
  REQUIRED_STATUS_FIELDS.forEach(field => {
    totals[field] = { missing: 0, partial: 0, pass: 0 };
    rows.forEach(row => {
      totals[field][normalizeStatus((row.statuses || {})[field])] += 1;
    });
  });
  rows.forEach(row => {
    const strength = evidenceStrengthForRow(row);
    evidenceStrength[strength] = (evidenceStrength[strength] || 0) + 1;
    if (normalizeStatus((row.statuses || {}).qa) === 'pass' && strength !== 'strong') {
      issues.push({
        id: row.id,
        field: 'evidenceStrength',
        type: 'weak-evidence-strength',
        message: `page family evidence strength is ${strength}`
      });
    }
  });

  const allPass = rows.length === REQUIRED_PAGE_FAMILIES.length && rows.every(row =>
    REQUIRED_STATUS_FIELDS.every(field => normalizeStatus((row.statuses || {})[field]) === 'pass')
  );
  const blocking = issues.filter(issue =>
    issue.type === 'missing-renderer' ||
    issue.type === 'missing-rendered-preview' ||
    issue.type === 'overstated-status' ||
    issue.type === 'invalid-status' ||
    issue.type === 'missing-page-family' ||
    issue.type === 'duplicate-page-family' ||
    issue.type === 'wrong-page-family-count'
  );

  return {
    matrix: rel(MATRIX_PATH),
    pageFamilyCount: rows.length,
    requiredPageFamilyCount: REQUIRED_PAGE_FAMILIES.length,
    totals,
    evidenceStrength,
    allPass,
    blockingCount: blocking.length,
    issues,
    rows: rows.map(row => ({
      id: row.id,
      statuses: row.statuses,
      evidenceStrength: evidenceStrengthForRow(row),
      observed: row.observed,
      acceptanceEvidence: row.acceptanceEvidence
    }))
  };
}

function printHuman(summary) {
  console.log('Template readiness audit');
  console.log(`Matrix: ${summary.matrix}`);
  console.log(`Coverage: ${summary.pageFamilyCount}/${summary.requiredPageFamilyCount} priority page families`);
  REQUIRED_STATUS_FIELDS.forEach(field => {
    const t = summary.totals[field];
    console.log(`${field.padEnd(15)} pass ${String(t.pass).padStart(2)}  partial ${String(t.partial).padStart(2)}  missing ${String(t.missing).padStart(2)}`);
  });
  console.log(`Evidence strength ${' '.padEnd(1)}strong ${String(summary.evidenceStrength.strong || 0).padStart(2)}  moderate ${String(summary.evidenceStrength.moderate || 0).padStart(2)}  partial ${String(summary.evidenceStrength.partial || 0).padStart(2)}  weak ${String(summary.evidenceStrength.weak || 0).padStart(2)}`);
  console.log('');
  const blockers = summary.issues.filter(issue =>
    issue.type === 'missing-renderer' ||
    issue.type === 'missing-rendered-preview' ||
    issue.type === 'overstated-status'
  );
  if (blockers.length) {
    console.log('Blocking gaps');
    blockers.slice(0, 80).forEach(issue => {
      console.log(`- ${issue.id}: ${issue.message}`);
    });
    if (blockers.length > 80) console.log(`- ... ${blockers.length - 80} more`);
  } else {
    console.log('No blocking gaps found.');
  }
}

function main() {
  const matrix = readJson(path.relative(ROOT, MATRIX_PATH), null);
  if (!matrix) {
    console.error(`Missing or invalid matrix: ${rel(MATRIX_PATH)}`);
    process.exit(1);
  }
  const summary = summarize(matrix);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printHuman(summary);
  }
  process.exit(summary.blockingCount === 0 && summary.allPass ? 0 : 1);
}

main();
