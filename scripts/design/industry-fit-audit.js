function createIndustryFitAuditHelpers({
  flattenText = value => String(value || ''),
  industryExpressionRules = {},
  industryPackFor = () => null,
  normalizeDeckPlan = plan => plan,
  proofObjectIdForSlide = () => '',
  visualIndustryId = value => value
} = {}) {
  function industryFitAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const industry = normalized.industry || plan.industry || '';
    const pack = industryPackFor(industry);
    const findings = [];
    if (!pack) {
      return {
        version: 'industry-fit-audit/v1',
        industry,
        status: 'review',
        findings: [{ level: 'review', type: 'industryPackMissing', message: `no industry pack for ${industry || 'unknown industry'}` }]
      };
    }
    const text = flattenText(normalized.slides || []);
    (pack.forbiddenTemplates || []).forEach(item => {
      const normalizedItem = String(item || '').toLowerCase();
      if (/generic|decorative|risk page as plain table|beautiful photo without proof/i.test(normalizedItem)) return;
      if (normalizedItem && text.toLowerCase().includes(normalizedItem)) {
        findings.push({
          level: 'review',
          type: 'industryForbiddenPattern',
          message: `deck visible text appears to use forbidden industry pattern: ${item}`
        });
      }
    });
    const expressionRules = industryExpressionRules[industry] || industryExpressionRules[visualIndustryId(industry)] || {};
    const expectedProof = new Set([...(pack.proofObjects || []), ...((expressionRules.proofObjects) || [])].map(String));
    const presentProof = new Set((normalized.slides || []).map(proofObjectIdForSlide).filter(Boolean));
    const matched = [...presentProof].filter(id => expectedProof.has(id));
    if ((normalized.slides || []).length >= 8 && expectedProof.size && matched.length < Math.min(2, expectedProof.size)) {
      findings.push({
        level: 'review',
        type: 'industryFitProofObjectsThin',
        message: `${pack.labelZh || industry} report only uses ${matched.length} expected proof objects`
      });
    }
    return {
      version: 'industry-fit-audit/v1',
      industry,
      packId: pack.id,
      matchedProofObjects: matched,
      expectedProofObjects: [...expectedProof],
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  return {
    industryFitAudit
  };
}

module.exports = {
  createIndustryFitAuditHelpers
};
