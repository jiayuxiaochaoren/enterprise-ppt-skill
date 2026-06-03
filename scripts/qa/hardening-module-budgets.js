const {
  localRequireDependencies,
  normalizedFile,
  requireClosureFiles,
  resolveLocalRequire
} = require('./hardening-require-closure');

function lineCount(text = '') {
  if (!text) return 0;
  return String(text).replace(/\r\n/g, '\n').split('\n').length - (String(text).endsWith('\n') ? 1 : 0);
}

function directoryBudgetRows(directories = [], opts = {}) {
  const {
    directoryExists = () => true,
    listFiles = () => []
  } = opts;
  return (Array.isArray(directories) ? directories : []).map(directory => {
    const config = typeof directory === 'string' ? { path: directory } : (directory || {});
    const dir = config.path || config.directory || '';
    const extension = config.extension || '.js';
    const present = Boolean(dir) && directoryExists(dir);
    const files = present ? listFiles(dir, { extension }) : [];
    return {
      path: dir,
      extension,
      exists: present,
      empty: present && files.length === 0,
      fileCount: files.length,
      files
    };
  }).filter(row => row.path);
}

function directoryBudgetFiles(directories = [], opts = {}) {
  return directoryBudgetRows(directories, opts).flatMap(row => row.files);
}

function budgetFiles(budget = {}, opts = {}) {
  return [...new Set([
    ...(Array.isArray(budget.files) ? budget.files : []),
    ...directoryBudgetFiles(budget.directories, opts)
  ])].sort();
}

function moduleBudgetRows(budgets = [], opts = {}) {
  const {
    directoryExists = () => true,
    exists = () => false,
    listFiles = () => [],
    readText = () => ''
  } = opts;
  return (Array.isArray(budgets) ? budgets : []).map(budget => {
    const maxLines = Number(budget.maxLines || 0);
    const directories = directoryBudgetRows(budget.directories, { directoryExists, listFiles });
    const trackedFiles = budgetFiles(budget, { directoryExists, listFiles });
    const requireClosureRoots = Array.isArray(budget.requireClosureRoots) ? budget.requireClosureRoots.map(normalizedFile).filter(Boolean) : [];
    const requireClosureFilesForBudget = requireClosureFiles(requireClosureRoots, { exists, readText });
    const trackedFileSet = new Set(trackedFiles.map(normalizedFile));
    const untrackedRequireClosureFiles = requireClosureFilesForBudget.filter(file => !trackedFileSet.has(file));
    const files = trackedFiles.map(file => {
      const present = exists(file);
      const lines = present ? lineCount(readText(file)) : 0;
      return {
        file,
        lines,
        exists: present,
        overLimit: present && maxLines > 0 && lines > maxLines
      };
    });
    const missingFiles = files.filter(row => !row.exists).map(row => row.file);
    const missingDirectories = directories.filter(row => !row.exists).map(row => row.path);
    const emptyDirectories = directories.filter(row => row.empty).map(row => row.path);
    const overLimitFiles = files.filter(row => row.overLimit).map(row => row.file);
    const maxObservedLines = files.reduce((max, row) => Math.max(max, row.lines || 0), 0);
    const lineHeadroom = maxLines > 0 ? maxLines - maxObservedLines : 0;
    const lineUsagePercent = maxLines > 0 ? Math.round((maxObservedLines / maxLines) * 100) : 0;
    return {
      id: budget.id || 'module-budget',
      title: budget.title || '',
      maxLines,
      fileCount: files.length,
      maxObservedLines,
      lineHeadroom,
      lineUsagePercent,
      status: missingFiles.length || missingDirectories.length || emptyDirectories.length
        || untrackedRequireClosureFiles.length
        ? 'missing'
        : (overLimitFiles.length ? 'over_limit' : 'pass'),
      directories,
      emptyDirectories,
      missingDirectories,
      missingFiles,
      overLimitFiles,
      requireClosureFiles: requireClosureFilesForBudget,
      requireClosureRoots,
      untrackedRequireClosureFiles,
      files
    };
  });
}

function moduleBudgetTotals(rows = []) {
  return rows.reduce((totals, row) => {
    totals[row.status] = (totals[row.status] || 0) + 1;
    return totals;
  }, { pass: 0, over_limit: 0, missing: 0 });
}

function moduleBudgetDirectoryTotals(rows = []) {
  return rows.reduce((totals, row) => {
    const directories = Array.isArray(row.directories) ? row.directories : [];
    totals.tracked += directories.length;
    totals.present += directories.filter(directory => directory.exists).length;
    totals.missing += (row.missingDirectories || []).length;
    totals.empty += (row.emptyDirectories || []).length;
    return totals;
  }, { tracked: 0, present: 0, missing: 0, empty: 0 });
}

function moduleBudgetRequireClosureTotals(rows = []) {
  return rows.reduce((totals, row) => {
    const roots = Array.isArray(row.requireClosureRoots) ? row.requireClosureRoots : [];
    const files = Array.isArray(row.requireClosureFiles) ? row.requireClosureFiles : [];
    const untracked = Array.isArray(row.untrackedRequireClosureFiles) ? row.untrackedRequireClosureFiles : [];
    if (roots.length) totals.budgetsWithClosure += 1;
    totals.roots += roots.length;
    totals.files += files.length;
    totals.untracked += untracked.length;
    return totals;
  }, { budgetsWithClosure: 0, roots: 0, files: 0, untracked: 0 });
}

function moduleBudgetIssues(rows = [], issue = () => ({})) {
  const issues = [];
  rows.forEach(row => {
    (row.missingDirectories || []).forEach(directory => {
      issues.push(issue('review', 'moduleBudgetDirectoryMissing', row.id, `module budget directory missing: ${directory}`));
    });
    (row.emptyDirectories || []).forEach(directory => {
      issues.push(issue('review', 'moduleBudgetDirectoryEmpty', row.id, `module budget directory has no matching files: ${directory}`));
    });
    (row.missingFiles || []).forEach(file => {
      issues.push(issue('review', 'moduleBudgetFileMissing', row.id, `module budget file missing: ${file}`));
    });
    (row.untrackedRequireClosureFiles || []).forEach(file => {
      issues.push(issue('review', 'moduleBudgetRequireClosureUntracked', row.id, `module budget require closure is not tracked: ${file}`));
    });
    (row.overLimitFiles || []).forEach(file => {
      const fileRow = (row.files || []).find(item => item.file === file) || {};
      issues.push(issue('review', 'moduleBudgetExceeded', row.id, `${file} has ${fileRow.lines || 0} lines; budget is ${row.maxLines}`));
    });
  });
  return issues;
}

module.exports = {
  budgetFiles,
  directoryBudgetFiles,
  directoryBudgetRows,
  lineCount,
  localRequireDependencies,
  moduleBudgetDirectoryTotals,
  moduleBudgetIssues,
  moduleBudgetRequireClosureTotals,
  moduleBudgetRows,
  moduleBudgetTotals,
  requireClosureFiles,
  resolveLocalRequire
};
