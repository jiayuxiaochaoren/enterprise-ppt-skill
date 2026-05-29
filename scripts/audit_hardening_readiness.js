#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(ROOT, 'assets', 'hardening-readiness-matrix.json');
const TEMPLATE_MATRIX_PATH = path.join(ROOT, 'assets', 'template-readiness-matrix.json');
const BACKLOG_PATH = path.join(ROOT, 'references', 'pptx-skill-hardening-backlog.md');
const STATUS_VALUES = ['missing', 'partial', 'pass'];
const STATUS_RANK = { missing: 0, partial: 1, pass: 2 };
const REQUIRED_TEMPLATE_FIELDS = ['recipe', 'visualGrammar', 'renderer', 'orchestration', 'qa', 'fixturePptx', 'previewPng', 'acceptanceDeck'];

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function absolute(file) {
  if (!file) return '';
  return path.isAbsolute(file) ? file : path.join(ROOT, file);
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (_) {
    return '';
  }
}

function exists(file) {
  return Boolean(file) && fs.existsSync(absolute(file));
}

function commandScript(command = '') {
  const match = String(command).match(/\bnode\s+(scripts\/[^\s]+\.js)\b/);
  return match ? match[1] : '';
}

function commandLooksAvailable(command = '') {
  const script = commandScript(command);
  if (!script) return /\bnpm\s+run\s+/.test(command);
  return exists(script);
}

function backlogTaskIds() {
  const text = readText(BACKLOG_PATH);
  return [...text.matchAll(/^###\s+(P\d-\d{2})\s+/gm)].map(match => match[1]);
}

function issue(level, type, id, message, extra = {}) {
  return { level, type, id, message, ...extra };
}

function templateReadinessSummary() {
  const matrix = readJson(TEMPLATE_MATRIX_PATH, { pageFamilies: [] });
  const rows = Array.isArray(matrix.pageFamilies) ? matrix.pageFamilies : [];
  const missing = [];
  rows.forEach(row => {
    const statuses = row.statuses || {};
    REQUIRED_TEMPLATE_FIELDS.forEach(field => {
      if (statuses[field] !== 'pass') missing.push(`${row.id}.${field}:${statuses[field] || 'missing'}`);
    });
  });
  return {
    matrix: rel(TEMPLATE_MATRIX_PATH),
    pageFamilyCount: rows.length,
    requiredFields: REQUIRED_TEMPLATE_FIELDS,
    ready: rows.length > 0 && missing.length === 0,
    missing
  };
}

function summarize(matrix) {
  const issues = [];
  const tasks = Array.isArray(matrix.tasks) ? matrix.tasks : [];
  const ids = tasks.map(task => task.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const backlogIds = backlogTaskIds();
  const missingBacklogIds = backlogIds.filter(id => !ids.includes(id));
  const extraIds = ids.filter(id => !backlogIds.includes(id));

  if (matrix.version !== 'hardening-readiness/v1') {
    issues.push(issue('blocking', 'matrixVersionInvalid', 'matrix', 'matrix version must be hardening-readiness/v1'));
  }
  duplicates.forEach(id => issues.push(issue('blocking', 'duplicateTask', id, 'task appears more than once')));
  missingBacklogIds.forEach(id => issues.push(issue('blocking', 'backlogTaskMissing', id, 'task from backlog is not represented in readiness matrix')));
  extraIds.forEach(id => issues.push(issue('review', 'extraTask', id, 'task is not present in source backlog headings')));

  const totals = {};
  ['P0', 'P1', 'P2'].forEach(priority => {
    totals[priority] = { missing: 0, partial: 0, pass: 0 };
  });

  tasks.forEach(task => {
    const status = STATUS_VALUES.includes(task.status) ? task.status : 'missing';
    const priority = task.priority || task.id.slice(0, 2);
    if (!totals[priority]) totals[priority] = { missing: 0, partial: 0, pass: 0 };
    totals[priority][status] += 1;

    if (!STATUS_VALUES.includes(task.status)) {
      issues.push(issue('blocking', 'invalidStatus', task.id, `status must be one of ${STATUS_VALUES.join(', ')}`));
    }
    if (!task.owner) {
      issues.push(issue(priority === 'P0' ? 'blocking' : 'review', 'ownerMissing', task.id, 'task owner is required'));
    }
    (task.files || []).forEach(file => {
      if (!exists(file)) {
        issues.push(issue(status === 'pass' || priority === 'P0' ? 'blocking' : 'review', 'evidenceFileMissing', task.id, `evidence file missing: ${file}`));
      }
    });
    (task.tests || []).forEach(command => {
      if (!commandLooksAvailable(command)) {
        issues.push(issue(status === 'pass' || priority === 'P0' ? 'blocking' : 'review', 'testCommandUnavailable', task.id, `test command is not backed by an existing script: ${command}`));
      }
    });
    (task.renderedProof || []).forEach(file => {
      if (!exists(file)) {
        issues.push(issue(status === 'pass' || priority === 'P0' ? 'blocking' : 'review', 'renderedProofMissing', task.id, `rendered proof missing: ${file}`));
      }
    });
    if (priority === 'P0' && status !== 'pass') {
      issues.push(issue('blocking', 'p0NotPass', task.id, `P0 task is ${status}, not pass`));
    }
    if (priority === 'P0' && !(task.tests || []).length) {
      issues.push(issue('blocking', 'p0TestMissing', task.id, 'P0 task must list at least one automated test'));
    }
    if (status === 'pass' && task.affectsVisualOutput && !(task.renderedProof || []).length) {
      issues.push(issue(priority === 'P0' ? 'blocking' : 'review', 'visualProofMissing', task.id, 'visual-affecting pass task must list rendered proof'));
    }
    if (status === 'pass' && Array.isArray(task.remainingGaps) && task.remainingGaps.length) {
      issues.push(issue(priority === 'P0' ? 'blocking' : 'review', 'passTaskHasRemainingGaps', task.id, 'pass task should not list remaining gaps'));
    }
  });

  const gates = Array.isArray(matrix.deliveryGates) ? matrix.deliveryGates : [];
  const formalGate = gates.find(gate => /validate_pptx\.js/.test(gate.command || '') && /--formal/.test(gate.command || ''));
  if (!formalGate) {
    issues.push(issue('blocking', 'formalValidationGateMissing', 'deliveryGates', 'delivery-mode validation must include validate_pptx.js --formal'));
  }
  gates.filter(gate => gate.required !== false).forEach(gate => {
    if (!commandLooksAvailable(gate.command || '')) {
      issues.push(issue('blocking', 'deliveryGateCommandUnavailable', gate.id || 'deliveryGate', `delivery gate command is not available: ${gate.command || ''}`));
    }
    (gate.artifacts || []).forEach(file => {
      if (!exists(file)) issues.push(issue('blocking', 'deliveryGateArtifactMissing', gate.id || 'deliveryGate', `delivery gate artifact missing: ${file}`));
    });
  });

  const template = templateReadinessSummary();
  if (!template.ready) {
    issues.push(issue('review', 'templateReadinessIncomplete', 'template-readiness', `template readiness has ${template.missing.length} non-pass fields`));
  }

  const p0Ready = tasks.filter(task => task.priority === 'P0').every(task => task.status === 'pass');
  const p1Ready = tasks.filter(task => task.priority === 'P1').every(task => task.status === 'pass');
  const noP0Missing = tasks.filter(task => task.priority === 'P0').every(task => STATUS_RANK[task.status] >= STATUS_RANK.partial);
  const formalGateReady = Boolean(formalGate) && commandLooksAvailable(formalGate.command || '');
  const modes = {
    draft: {
      safe: noP0Missing,
      reason: noP0Missing ? 'all P0 tasks are at least partial' : 'one or more P0 tasks are missing'
    },
    formal_review: {
      safe: p0Ready && formalGateReady,
      reason: p0Ready && formalGateReady ? 'all P0 tasks pass and formal validation is available' : 'P0 readiness or formal validation is incomplete'
    },
    delivery: {
      safe: p0Ready && p1Ready && formalGateReady && template.ready,
      reason: p0Ready && p1Ready && formalGateReady && template.ready
        ? 'P0/P1 hardening, formal validation, and template readiness are all green'
        : 'delivery still has P1 hardening, gate, or template readiness gaps'
    }
  };

  const blocking = issues.filter(item => item.level === 'blocking');
  return {
    version: 'hardening-readiness-audit/v1',
    matrix: rel(MATRIX_PATH),
    backlog: rel(BACKLOG_PATH),
    taskCount: tasks.length,
    backlogTaskCount: backlogIds.length,
    totals,
    modes,
    template,
    blockingCount: blocking.length,
    reviewCount: issues.length - blocking.length,
    issues,
    tasks: tasks.map(task => ({
      id: task.id,
      priority: task.priority,
      status: task.status,
      owner: task.owner,
      tests: task.tests || [],
      renderedProof: task.renderedProof || [],
      remainingGaps: task.remainingGaps || []
    }))
  };
}

function printHuman(summary) {
  console.log('Hardening readiness audit');
  console.log(`Matrix: ${summary.matrix}`);
  console.log(`Backlog coverage: ${summary.taskCount}/${summary.backlogTaskCount} tasks`);
  Object.entries(summary.totals).forEach(([priority, totals]) => {
    console.log(`${priority.padEnd(3)} pass ${String(totals.pass).padStart(2)}  partial ${String(totals.partial).padStart(2)}  missing ${String(totals.missing).padStart(2)}`);
  });
  console.log('');
  Object.entries(summary.modes).forEach(([mode, result]) => {
    console.log(`${mode.padEnd(13)} ${result.safe ? 'safe' : 'not safe'} - ${result.reason}`);
  });
  console.log('');
  if (summary.issues.length) {
    console.log('Issues');
    summary.issues.slice(0, 80).forEach(item => {
      console.log(`- [${item.level}] ${item.id}: ${item.message}`);
    });
    if (summary.issues.length > 80) console.log(`- ... ${summary.issues.length - 80} more`);
  } else {
    console.log('No readiness issues found.');
  }
}

function main() {
  const matrix = readJson(MATRIX_PATH, null);
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
  process.exit(summary.blockingCount === 0 ? 0 : 1);
}

main();
