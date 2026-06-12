const ACCEPTANCE_READINESS_VERSION = 'acceptance-readiness/v1';

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort();
}

function acceptanceReadinessForFindings(findings = [], opts = {}) {
  const allowedReviewTypes = new Set(opts.allowedReviewTypes || []);
  const blockingTypes = uniqueSorted(findings.filter(f => f.level === 'fail').map(f => f.type));
  const reviewTypes = uniqueSorted(findings.filter(f => f.level !== 'fail').map(f => f.type));
  const unallowedReviewTypes = reviewTypes.filter(type => !allowedReviewTypes.has(type));
  const status = blockingTypes.length
    ? 'blocked'
    : (unallowedReviewTypes.length ? 'client-review' : 'delivery-ready');
  const deliveryReadyReason = status === 'delivery-ready'
    ? (reviewTypes.length ? 'only allowed review types remain' : 'no blocking or review findings')
    : (status === 'blocked' ? 'blocking findings remain' : 'unresolved review findings remain');
  return {
    version: ACCEPTANCE_READINESS_VERSION,
    status,
    allowedUse: status === 'blocked' ? 'blocked' : status,
    blockingTypes,
    reviewTypes,
    allowedReviewTypes: [...allowedReviewTypes].sort(),
    unallowedReviewTypes,
    deliveryReadyReason
  };
}

module.exports = {
  ACCEPTANCE_READINESS_VERSION,
  acceptanceReadinessForFindings
};
