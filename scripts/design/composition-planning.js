function createCompositionPlanningHelpers(deps = {}) {
  const {
    accentRoleFor,
    backgroundToneFor,
    compactUnique,
    compositionNameFor,
    contentSignals,
    dialectComponentsFor,
    imageTreatmentFor,
    industryDesignDialect,
    industryPackFor,
    layoutEnergyFor,
    microComponentsFor,
    primaryColorUseFor,
    rhythmRoleFor,
    rhythmTransitionFor,
    semanticColorRolesFor,
    slideDesign,
    slideRole,
    themeCoverageFor,
    themeIntentFor,
    visualDensityFor
  } = deps;

  function zonePlanFor(plan = {}, s = {}, signals = contentSignals(plan, s), design = slideDesign(plan, s)) {
    const type = s.type || '';
    const variant = s.layoutVariant || '';
    if (['cover', 'closing'].includes(type)) {
      return { primaryZone: 'hero-claim', secondaryZone: 'visual-anchor', proofZone: 'meta-or-contact-block' };
    }
    if (type === 'company-profile-spread') {
      return { primaryZone: 'left-company-story', secondaryZone: 'right-real-image', proofZone: 'bottom-metric-strip' };
    }
    if (type === 'case-gallery') {
      if (variant === 'case-hero') return { primaryZone: 'left-hero-image', secondaryZone: 'right-evidence-list', proofZone: 'image-caption-bar' };
      if (variant === 'evidence-board') return { primaryZone: 'evidence-grid', secondaryZone: 'caption-system', proofZone: 'source-note' };
      return { primaryZone: 'image-story', secondaryZone: 'caption-and-context', proofZone: 'evidence-labels' };
    }
    if (['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) {
      return { primaryZone: 'metric-readout', secondaryZone: 'explanation-panel', proofZone: 'driver-or-caveat-strip' };
    }
    if (['architecture', 'architecture-dark', 'strategy-map'].includes(type)) {
      return { primaryZone: 'system-map', secondaryZone: 'claim-panel', proofZone: 'connector-rail' };
    }
    if (['timeline', 'timeline-dark'].includes(type)) {
      return { primaryZone: 'process-rail', secondaryZone: 'phase-cards', proofZone: 'control-points' };
    }
    if (['risk-table', 'table'].includes(type)) {
      return { primaryZone: 'risk-or-control-board', secondaryZone: 'owner/action-detail', proofZone: 'priority-signal' };
    }
    if (signals.isDenseText) return { primaryZone: 'editorial-summary', secondaryZone: 'structured-evidence', proofZone: 'source-note' };
    return { primaryZone: 'claim', secondaryZone: 'supporting-points', proofZone: design && design.wantsImage ? 'proof-image' : 'accent-rail' };
  }

  function compositionPlan(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total), recipe = null, design = slideDesign(plan, s)) {
    const themeIntent = themeIntentFor(plan, s, index, total, signals);
    const accentRole = accentRoleFor(plan, s, index, total, themeIntent, signals);
    const visualDensity = visualDensityFor(plan, s, index, total, signals);
    const intentSlide = Object.assign({}, s, { themeIntent, accentRole });
    const coverage = themeCoverageFor(plan, intentSlide, signals, slideRole(s), themeIntent);
    const composition = compositionNameFor(plan, intentSlide, s.type, s.layoutVariant, signals, themeIntent);
    const layoutPlan = zonePlanFor(plan, s, signals, design);
    const dialect = industryDesignDialect(plan);
    const pack = typeof industryPackFor === 'function' ? industryPackFor(plan) : null;
    const dialectComponents = dialectComponentsFor(plan, s);
    const recipeComponents = recipe && Array.isArray(recipe.componentHints) ? recipe.componentHints : [];
    return {
      version: 'composition-plan/v1',
      composition,
      layoutPlan,
      themeIntent,
      accentRole,
      layoutEnergy: layoutEnergyFor(plan, s, index, total, themeIntent, signals),
      visualDensity,
      rhythmTransition: rhythmTransitionFor(plan, s, index, total, themeIntent),
      backgroundTone: backgroundToneFor(plan, s, index, total, coverage),
      themeCoverage: coverage,
      primaryZone: layoutPlan.primaryZone,
      secondaryZone: layoutPlan.secondaryZone,
      proofZone: layoutPlan.proofZone,
      primaryColorUse: primaryColorUseFor(plan, intentSlide, signals, coverage, themeIntent, accentRole),
      semanticColorRoles: semanticColorRolesFor(plan, accentRole),
      imageTreatment: imageTreatmentFor(plan, s, design, signals),
      microComponents: compactUnique([
        ...microComponentsFor(plan, intentSlide, signals, design, themeIntent, accentRole),
        ...recipeComponents.slice(0, 8)
      ]),
      rhythmRole: rhythmRoleFor(plan, s, index, total),
      industryExpression: {
        dialect: dialect.name || '',
        motif: dialect.motif || '',
        principle: dialect.principle || '',
        primaryColorLogic: dialect.primaryColorLogic || '',
        components: dialectComponents,
        visualGrammar: pack && pack.visualGrammar ? pack.visualGrammar : null
      },
      referenceRecipeId: recipe ? recipe.id : '',
      density: visualDensity
    };
  }

  return {
    compositionPlan,
    zonePlanFor
  };
}

module.exports = {
  createCompositionPlanningHelpers
};
