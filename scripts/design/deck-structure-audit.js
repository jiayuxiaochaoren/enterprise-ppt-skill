function createDeckStructureAuditHelpers({
  hasCommercialLogicChain = () => false,
  normalizeDeckPlan = plan => plan,
  proofObjectIdForSlide = () => ''
} = {}) {
  function pageCountAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const contract = normalized.targetSlides || plan.targetSlides || {};
    const requested = Number(contract.requested || normalized.requestedSlideCount || plan.requestedSlideCount || 0);
    const resolved = Number(contract.resolved || contract.targetSlides || requested || 0);
    const findings = [];
    if (requested && slides.length !== requested) {
      findings.push({
        level: 'fail',
        type: 'pageCountMismatch',
        message: `requested ${requested} slides but generated ${slides.length}`
      });
    } else if (resolved && slides.length !== resolved) {
      findings.push({
        level: 'review',
        type: 'pageCountResolvedMismatch',
        message: `target contract resolved ${resolved} slides but generated ${slides.length}`
      });
    }
    if (contract.enoughMaterial === false) {
      findings.push({
        level: 'review',
        type: 'pageCountMaterialShortage',
        message: contract.adjustmentReason || 'target slide count exceeds available claim/proof material'
      });
    }
    return {
      version: 'page-count-audit/v1',
      requested: requested || null,
      resolved: resolved || null,
      actual: slides.length,
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  function reportDepthAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    const bodySlides = slides.filter(s => !['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(s.type || ''));
    const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍/i.test(String(
      (normalized.materialIntelligence && normalized.materialIntelligence.pptType) ||
      (plan.materialIntelligence && plan.materialIntelligence.pptType) ||
      normalized.ppt_type ||
      plan.ppt_type ||
      normalized.title ||
      plan.title ||
      ''
    ));
    const proofCount = bodySlides.filter(s => proofObjectIdForSlide(s)).length;
    const logicCount = bodySlides.filter(hasCommercialLogicChain).length;
    const componentPlanCount = bodySlides.filter(s => s.componentPlan && s.componentPlan.version === 'component-plan/v1').length;
    const routeKinds = new Set(bodySlides.map(s => {
      const type = String(s.type || '');
      const variant = String(s.layoutVariant || s.variant || proofObjectIdForSlide(s) || '');
      return variant && ['industry-chart', 'metric-comparison', 'report-board'].includes(type)
        ? `${type}:${variant}`
        : type;
    }));
    if (slides.length >= 8 && proofCount < Math.ceil(bodySlides.length * 0.75)) {
      findings.push({
        level: 'review',
        type: 'reportProofDepthThin',
        message: `${proofCount}/${bodySlides.length} body slides expose proof objects; report may feel like a template showcase`
      });
    }
    if (!isCompanyIntro && slides.length >= 8 && logicCount < Math.max(2, Math.ceil(bodySlides.length * 0.30))) {
      findings.push({
        level: 'review',
        type: 'reportLogicThin',
        message: `${logicCount}/${bodySlides.length} body slides expose business logic chains`
      });
    }
    if (slides.length >= 8 && routeKinds.size < 4) {
      findings.push({
        level: 'review',
        type: 'reportRhythmTooFlat',
        message: `report uses only ${routeKinds.size} body route families`
      });
    }
    if (slides.length >= 8 && componentPlanCount < bodySlides.length) {
      findings.push({
        level: 'fail',
        type: 'componentPlanMissing',
        message: `${bodySlides.length - componentPlanCount} body slides lack component plans`
      });
    }
    return {
      version: 'report-depth-audit/v1',
      checkedSlides: bodySlides.length,
      routeFamilyCount: routeKinds.size,
      proofObjectCoverage: bodySlides.length ? Number((proofCount / bodySlides.length).toFixed(2)) : 0,
      logicCoverage: bodySlides.length ? Number((logicCount / bodySlides.length).toFixed(2)) : 0,
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  return {
    pageCountAudit,
    reportDepthAudit
  };
}

module.exports = {
  createDeckStructureAuditHelpers
};
