const { profileSummaryForChangedFiles } = require('../test-profile-mapping');

const DEFAULT_REQUIRED_GATE_IDS = ['renderer-only', 'asset-only', 'material-only'];

function sameArray(left = [], right = []) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function gateStatus(row = {}) {
  if (row.groupsMatch && row.commandsMatch && row.rulesMatch && row.fallbackMatches) return 'pass';
  if (row.actualGroups.length || row.actualCommands.length || row.actualFallbackToFull) return 'partial';
  return 'missing';
}

function gateMismatchReasons(row = {}) {
  return [
    ['rules', row.rulesMatch],
    ['groups', row.groupsMatch],
    ['commands', row.commandsMatch],
    ['fallback', row.fallbackMatches]
  ]
    .filter(([, matches]) => matches !== true)
    .map(([reason]) => reason);
}

function mismatchDetail(field, expected, actual) {
  return { field, expected, actual };
}

function gateMismatchDetails(row = {}) {
  return [
    ['rules', row.rulesMatch, row.expectedRuleIds || [], row.actualRuleIds || []],
    ['groups', row.groupsMatch, row.expectedGroups || [], row.actualGroups || []],
    ['commands', row.commandsMatch, row.expectedCommands || [], row.actualCommands || []],
    ['fallback', row.fallbackMatches, row.expectedFallbackToFull === true, row.actualFallbackToFull === true]
  ]
    .filter(([, matches]) => matches !== true)
    .map(([field, , expected, actual]) => mismatchDetail(field, expected, actual));
}

function formatMismatchValue(value) {
  if (Array.isArray(value)) return value.join(',') || 'none';
  return value ? 'true' : 'false';
}

function formatMismatchDetail(detail = {}) {
  return `${detail.field} expected=${formatMismatchValue(detail.expected)} actual=${formatMismatchValue(detail.actual)}`;
}

function testProfileGateRows(gates = [], opts = {}) {
  const profileForChangedFiles = opts.profileForChangedFiles || (files => profileSummaryForChangedFiles(files, { cwd: opts.cwd }));
  return (Array.isArray(gates) ? gates : []).map(gate => {
    const changedFiles = Array.isArray(gate.changedFiles) ? gate.changedFiles : [];
    const expectedGroups = Array.isArray(gate.expectedGroups) ? gate.expectedGroups : [];
    const expectedCommands = Array.isArray(gate.expectedCommands) ? gate.expectedCommands : [];
    const expectedRuleIds = Array.isArray(gate.expectedRuleIds) ? gate.expectedRuleIds : [];
    const expectedFallbackToFull = gate.expectedFallbackToFull === true;
    const profile = profileForChangedFiles(changedFiles) || {};
    const actualGroups = Array.isArray(profile.groups) ? profile.groups : [];
    const actualCommands = Array.isArray(profile.commands) ? profile.commands : [];
    const actualRuleIds = Array.isArray(profile.matchedRules) ? profile.matchedRules.map(rule => rule.id) : [];
    const row = {
      id: gate.id || 'testProfileGate',
      required: gate.required !== false,
      changedFiles,
      expectedGroups,
      actualGroups,
      expectedCommands,
      actualCommands,
      expectedRuleIds,
      actualRuleIds,
      expectedFallbackToFull,
      actualFallbackToFull: profile.fallbackToFull === true,
      groupsMatch: sameArray(actualGroups, expectedGroups),
      commandsMatch: sameArray(actualCommands, expectedCommands),
      rulesMatch: sameArray(actualRuleIds, expectedRuleIds),
      fallbackMatches: profile.fallbackToFull === expectedFallbackToFull
    };
    row.mismatchDetails = gateMismatchDetails(row);
    row.mismatchReasons = gateMismatchReasons(row);
    row.status = gateStatus(row);
    row.ready = row.status === 'pass';
    return row;
  });
}

function testProfileGateTotals(rows = []) {
  return rows.reduce((totals, row) => {
    totals[row.status] = (totals[row.status] || 0) + 1;
    return totals;
  }, { pass: 0, partial: 0, missing: 0 });
}

function testProfileGateCoverage(rows = [], opts = {}) {
  const requiredGateIds = Array.isArray(opts.requiredGateIds) && opts.requiredGateIds.length
    ? opts.requiredGateIds
    : DEFAULT_REQUIRED_GATE_IDS;
  const presentGateIds = (Array.isArray(rows) ? rows : []).map(row => row.id).filter(Boolean);
  const readyGateIds = (Array.isArray(rows) ? rows : [])
    .filter(row => row.ready === true)
    .map(row => row.id)
    .filter(Boolean);
  const missingGateIds = requiredGateIds.filter(id => !presentGateIds.includes(id));
  const notReadyGateIds = requiredGateIds.filter(id => presentGateIds.includes(id) && !readyGateIds.includes(id));
  return {
    requiredGateIds,
    presentGateIds,
    readyGateIds,
    missingGateIds,
    notReadyGateIds,
    ready: missingGateIds.length === 0 && notReadyGateIds.length === 0
  };
}

function testProfileGateIssues(rows = [], issue = () => ({})) {
  return (Array.isArray(rows) ? rows : [])
    .filter(row => row.required !== false && row.ready !== true)
    .map(row => {
      const details = (row.mismatchDetails || []).map(formatMismatchDetail).join('; ') || 'unknown mismatch';
      return issue('blocking', 'testProfileGateMismatch', row.id, `test profile gate ${row.id} is ${row.status}: ${details}`);
    });
}

function testProfileGateCoverageIssues(coverage = {}, issue = () => ({})) {
  const issues = [];
  (coverage.missingGateIds || []).forEach(id => {
    issues.push(issue('blocking', 'testProfileGateRequiredMissing', id, `required test profile gate is missing: ${id}`));
  });
  (coverage.notReadyGateIds || []).forEach(id => {
    issues.push(issue('blocking', 'testProfileGateRequiredNotReady', id, `required test profile gate is not ready: ${id}`));
  });
  return issues;
}

function testProfileGatesReady(rows = []) {
  return rows.length > 0 && rows.filter(row => row.required !== false).every(row => row.ready === true);
}

module.exports = {
  DEFAULT_REQUIRED_GATE_IDS,
  formatMismatchDetail,
  gateMismatchDetails,
  gateMismatchReasons,
  sameArray,
  testProfileGateCoverage,
  testProfileGateCoverageIssues,
  testProfileGateIssues,
  testProfileGateRows,
  testProfileGateTotals,
  testProfileGatesReady
};
