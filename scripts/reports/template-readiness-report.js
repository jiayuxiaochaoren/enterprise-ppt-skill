const { REQUIRED_STATUS_FIELDS } = require('../qa/template-readiness-constants');

function printTemplateReadinessHuman(summary = {}) {
  console.log('Template readiness audit');
  console.log(`Matrix: ${summary.matrix}`);
  console.log(`Coverage: ${summary.pageFamilyCount}/${summary.requiredPageFamilyCount} priority page families`);
  REQUIRED_STATUS_FIELDS.forEach(field => {
    const t = (summary.totals || {})[field] || {};
    console.log(`${field.padEnd(15)} pass ${String(t.pass || 0).padStart(2)}  partial ${String(t.partial || 0).padStart(2)}  missing ${String(t.missing || 0).padStart(2)}`);
  });
  const strength = summary.evidenceStrength || {};
  console.log(`Evidence strength ${' '.padEnd(1)}strong ${String(strength.strong || 0).padStart(2)}  moderate ${String(strength.moderate || 0).padStart(2)}  partial ${String(strength.partial || 0).padStart(2)}  weak ${String(strength.weak || 0).padStart(2)}`);
  console.log('');
  const blockers = (summary.issues || []).filter(issue =>
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

module.exports = {
  printTemplateReadinessHuman
};
