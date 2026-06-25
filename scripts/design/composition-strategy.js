const {
  createCompositionIndustryArchetypeHelpers
} = require('./composition-industry-archetypes');

function createCompositionStrategyHelpers(deps = {}) {
  const {
    accentRoleFor,
    compactUnique,
    contentSignals,
    dialectColorCarriersFor,
    dialectComponentsFor,
    explicitArtValue,
    flattenText,
    industryDesignDialect,
    industryPackFor,
    normalizeAssetRole,
    palettes,
    selectPaletteName,
    slideDesign,
    slideRole,
    slideWantsImage,
    themeIntentFor
	  } = deps;

  const {
    closingArchetype,
    coverArchetype,
    fallbackCompositionFromBodyPool,
    nativeIndustrialCover
  } = createCompositionIndustryArchetypeHelpers({
    compactUnique,
    contentSignals,
    industryPackFor,
    inferredThemeIntent
  });

  function isCompanyIntroDeck(plan = {}) {
    return /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(String(
      (plan.materialIntelligence && plan.materialIntelligence.pptType) ||
      plan.ppt_type ||
      plan.pptType ||
      plan.title ||
      ''
    ));
  }

  function inferredThemeIntent(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    return s.themeIntent ||
      s.theme_intent ||
      (s.compositionPlan && s.compositionPlan.themeIntent) ||
      themeIntentFor(plan, s, 1, 3, signals);
  }

  function inferredAccentRole(plan = {}, s = {}, signals = contentSignals(plan, s), intent = inferredThemeIntent(plan, s, signals)) {
    return s.accentRole ||
      s.accent_role ||
      (s.compositionPlan && s.compositionPlan.accentRole) ||
      accentRoleFor(plan, s, 1, 3, intent, signals);
  }

	  function compositionNameFor(plan = {}, s = {}, type = s.type, variant = s.layoutVariant, signals = contentSignals(plan, s), themeIntent = '') {
	    const intent = themeIntent || inferredThemeIntent(plan, s, signals);
      const industry = String(plan.industry || '');
	    if (type === 'cover') {
	      const archetype = coverArchetype(plan, s);
	      if (nativeIndustrialCover(plan, s)) return 'industrial-structure-stage';
	      if (archetype === 'boardroom-proof-cover') return 'boardroom-proof-stage';
	      if (archetype === 'platform-system-cover') return 'platform-command-hero';
	      if (archetype === 'editorial-brand-cover') return 'beauty-editorial-showcase';
	      if (archetype === 'clinical-quality-cover') return 'clinical-quality-brief';
	      if (archetype === 'lifestyle-editorial-cover') return 'lifestyle-journey-hero';
	      if (archetype === 'civic-executive-cover') return 'civic-executive-stage';
	      if (archetype === 'culture-soft-cover') return 'culture-soft-hero';
	      if (variant === 'beauty-brand-editorial-cover') return 'beauty-editorial-showcase';
	      if (variant === 'culture-cover-with-soft-geometry') return 'culture-soft-hero';
	      if (variant === 'airy-concept-opening') return 'airy-concept-stage';
	      if (variant === 'editorial-cover') return 'editorial-proof-stage';
	      return slideWantsImage(plan, s, 'cover') ? 'brand-hero-showcase' : 'brand-hero-stage';
	    }
	    if (type === 'closing') {
	      const archetype = closingArchetype(plan, s);
	      if (variant === 'company-thanks') return 'company-thanks-stage';
	      if (variant === 'contact-closing' || archetype === 'contact-closing-close') return 'contact-closing-board';
	      if (variant === 'pilot-rollout' || archetype === 'decision-rollout-close') return 'manufacturing-rollout-close';
	      if (variant === 'investment-decision' || archetype === 'investment-decision-close') return 'finance-investment-close';
	      if (variant === 'quality-handoff' || archetype === 'quality-handoff-close') return 'healthcare-handoff-close';
	      if (variant === 'adoption-close' || archetype === 'adoption-rollout-close') return 'saas-adoption-close';
	      if (variant === 'experience-rollout' || archetype === 'experience-rollout-close') return 'experience-rollout-close';
	      if (variant === 'governance-next-step' || archetype === 'governance-next-step-close') return 'governance-next-step-close';
	      if (variant === 'premium-closing-anchor' || archetype === 'premium-editorial-close') return 'premium-editorial-close';
	      return /decision|pilot|investment|handoff|adoption/i.test(String(variant || '')) ? 'decision-close-board' : 'editorial-close-statement';
	    }
    if (type === 'finance-bridge') return 'return-bridge-board';
    if (type === 'portfolio-table') return 'portfolio-action-table';
    if (type === 'industry-chart' && variant === 'valuation-sensitivity') return 'scenario-sensitivity-board';
    if (type === 'industry-chart' && variant === 'quality-handoff' && industry === 'healthcare-operations') return 'healthcare-handoff-stage-board';
    if (type === 'risk-table' && variant === 'guidance-and-risk-board' && industry === 'finance-investment') return 'finance-boundary-band-board';
    if (type === 'risk-table' && variant === 'governance-table-editorial' && industry === 'people-culture-company') return 'people-governance-banner-board';
    if (type === 'risk-table' && variant === 'healthcare-quality-loop' && industry === 'healthcare-operations') return 'healthcare-quality-loop-stage';
	    if (/risk-warning/i.test(intent)) return /action-loop/.test(String(variant || '')) ? 'governance-loop-board' : 'risk-control-board';
    if (/case-evidence/i.test(intent) && (signals.imageCount || type === 'case-gallery')) return signals.imageCount >= 3 ? 'triptych-evidence-gallery' : 'hero-image-with-evidence-strip';
    if (type === 'metric-comparison' && variant === 'company-profile-proof' && industry === 'people-culture-company') return 'people-growth-evidence-board';
    if (/value-signal/i.test(intent) && ['metric-comparison', 'industry-chart', 'finance-bridge', 'value-tiles'].includes(type)) return 'metric-readout-board';
    if (/system-architecture/i.test(intent) && ['architecture', 'architecture-dark', 'strategy-map'].includes(type)) return 'system-map-with-proof-rail';
    if (/operating-path/i.test(intent) && ['timeline', 'timeline-dark'].includes(type)) return 'process-rail-with-control-points';
    if (type === 'toc' || type === 'toc-clean' || type === 'chapter-divider') return 'chapter-pathway-board';
    if (type === 'company-profile-spread') return 'company-profile-evidence-spread';
    if (type === 'profile-proof') return 'identity-proof-sidebar';
    if (type === 'case-gallery') {
      if (variant === 'case-hero') return 'hero-image-with-evidence-strip';
      if (variant === 'case-comparison') return 'before-after-evidence-spread';
      if (variant === 'evidence-board') return 'evidence-contact-board';
      if (variant === 'lookbook-story') return 'lookbook-editorial-story';
      if (variant === 'service-touchpoint') return 'journey-touchpoint-gallery';
      if (variant === 'site-evidence') return 'site-evidence-readout';
      if (variant === 'prototype-flow') return 'prototype-workflow-proof';
      return signals.imageCount >= 3 ? 'triptych-evidence-gallery' : 'hero-image-with-evidence-strip';
    }
    if (type === 'finance-bridge') return 'return-bridge-board';
    if (type === 'portfolio-table') return 'portfolio-action-table';
    if (type === 'industry-chart' && variant === 'valuation-sensitivity') return 'scenario-sensitivity-board';
    if (type === 'metric-comparison' || type === 'industry-chart') return 'metric-readout-board';
    if (type === 'architecture' || type === 'architecture-dark' || type === 'strategy-map') return 'system-map-with-proof-rail';
    if (type === 'timeline' || type === 'timeline-dark') return 'process-rail-with-control-points';
	    if (type === 'risk-table' || type === 'table') return /action-loop/.test(String(variant || '')) ? 'governance-loop-board' : 'risk-control-board';
    if (type === 'product-showcase') return 'product-showcase-with-callouts';
    if (type === 'report-board') return 'editorial-report-board';
    if (type === 'module-matrix') return 'capability-matrix-board';
    if (type === 'comparison') return 'two-sided-comparison-board';
    const pooledFallback = fallbackCompositionFromBodyPool(plan, s, type, variant, signals, intent);
    if (pooledFallback) return pooledFallback;
    return signals.isDenseText ? 'editorial-report-board' : 'executive-insight-board';
  }

  function rhythmRoleFor(plan = {}, s = {}, index = 0, total = 1) {
    const type = s.type || '';
    if (index === 0 || type === 'cover') return 'opener';
    if (index === total - 1 || type === 'closing') return 'closer';
    if (type === 'toc' || type === 'toc-clean' || type === 'chapter-divider') return 'orientation';
    if (['case-gallery', 'company-profile-spread', 'profile-proof'].includes(type)) return 'evidence';
    if (['metric-comparison', 'industry-chart', 'finance-bridge', 'portfolio-table'].includes(type)) return 'proof';
    if (['architecture', 'architecture-dark', 'strategy-map'].includes(type)) return 'system';
    if (['timeline', 'timeline-dark'].includes(type)) return 'operating-rhythm';
    if (['risk-table', 'table'].includes(type)) return 'governance';
    return 'narrative';
  }

  function themeCoverageFor(plan = {}, s = {}, signals = contentSignals(plan, s), role = slideRole(s), themeIntent = '') {
    const explicit = s.themeCoverage || s.theme_coverage;
    if (explicit) return explicit;
    const type = s.type || '';
    const intent = themeIntent || inferredThemeIntent(plan, s, signals);
    if (['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(type)) return 'high';
    if (s.layoutVariant === 'company-thanks' || type === 'company-profile-spread') return 'high';
    if (/company-proof|case-evidence/i.test(intent)) return 'high';
    if (/value-signal|risk-warning|system-architecture/i.test(intent)) return 'medium';
    if (type === 'case-gallery' || signals.imageCount >= 2 || signals.hasMetrics || type === 'metric-comparison' || type === 'industry-chart') return 'medium';
    if (signals.isDenseText || type === 'report-board' || type === 'risk-table') return 'medium';
    if (role === 'architecture' || role === 'timeline' || role === 'value') return 'medium';
    return 'medium';
  }

  function backgroundToneFor(plan = {}, s = {}, index = 0, total = 1, coverage = 'medium') {
    const explicit = explicitArtValue(plan, s, index, 'backgroundTone');
    if (explicit) return String(explicit);
    const type = s.type || '';
    const variant = s.layoutVariant || '';
    const intent = themeIntentFor(plan, s, index, total);
    if (type === 'cover' && !/decision-summary|pilot-rollout|quality-handoff|adoption-close/i.test(variant)) {
      const tone = (((palettes[selectPaletteName(plan)] || {}).presentation || {}).coverTone) || '';
      return (tone === 'light' || tone === 'split') ? 'accent-wash' : 'dark-stage';
    }
    if (type === 'closing') {
      if (/premium-closing-anchor|contact-closing|experience-rollout|editorial-light/i.test(variant)) return 'tinted-paper';
      if (/investment-decision|decision-summary|quality-handoff|adoption-close/i.test(variant)) return 'accent-wash';
      return 'dark-stage';
    }
    if (/closing-anchor|industry-opening/i.test(intent)) return index === 0 && type !== 'cover' ? 'accent-wash' : 'dark-stage';
    if (/risk-warning|value-signal/i.test(intent)) return 'accent-wash';
    if (/case-evidence|company-proof/i.test(intent)) return 'tinted-paper';
    if (type === 'chapter-divider' || (type === 'toc-clean' && /agenda-board|line-agenda|editorial-agenda/i.test(variant))) return 'dark-stage';
    if (type === 'case-gallery' && /hero|lookbook|site|prototype|portfolio/i.test(variant)) return 'tinted-paper';
    if (type === 'company-profile-spread') return 'tinted-paper';
    if (coverage === 'high') return 'accent-wash';
    return 'tinted-paper';
  }

  function primaryColorUseFor(plan = {}, s = {}, signals = contentSignals(plan, s), coverage = 'medium', themeIntent = '', roleOverride = '') {
    const uses = ['top-rule', 'page-number', 'watermark-circle'];
    const intent = themeIntent || inferredThemeIntent(plan, s, signals);
    const accentRole = roleOverride || inferredAccentRole(plan, s, signals, intent);
    if (coverage !== 'low') uses.push('accent-rail');
    if (['metric-comparison', 'industry-chart', 'finance-bridge'].includes(s.type)) uses.push('metric-highlight');
    if (s.type === 'case-gallery' || signals.imageCount) uses.push('caption-bar');
    if (['architecture', 'architecture-dark', 'timeline', 'timeline-dark', 'strategy-map'].includes(s.type)) uses.push('flow-connector');
    if (['risk-table', 'table'].includes(s.type)) uses.push('priority-line');
    if (['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(s.type) || coverage === 'high') uses.push('dark-anchor');
    if (accentRole === 'risk') uses.push('priority-line', 'risk-band');
    if (accentRole === 'evidence') uses.push('caption-bar', 'evidence-frame');
    if (accentRole === 'data') uses.push('metric-highlight', 'data-readout');
    if (accentRole === 'action') uses.push('process-rail', 'action-strip');
    if (accentRole === 'brand' && coverage !== 'low') uses.push('side-color-field');
    return compactUnique([...uses, ...dialectColorCarriersFor(plan, s)]);
  }

  function imageTreatmentFor(plan = {}, s = {}, design = slideDesign(plan, s), signals = contentSignals(plan, s)) {
    if (!signals.imageCount && !(design && design.wantsImage)) return 'none';
    const role = normalizeAssetRole((s.visual && s.visual.role) || (design && design.imageRole) || 'evidence');
    if (s.type === 'cover' && role === 'background') {
      return slideWantsImage(plan, s, 'cover')
        ? 'inspectable-showcase-frame'
        : 'graded-atmosphere';
    }
    if (s.type === 'closing' && /premium-closing-anchor/i.test(String(s.layoutVariant || s.closingVariant || ''))) {
      return role === 'background' ? 'media-showcase-frame' : 'inspectable-showcase-frame';
    }
    if (role === 'background') return 'graded-atmosphere';
    if (role === 'showcase') return 'inspectable-showcase-frame';
    if (role === 'gallery') return signals.imageCount >= 4 ? 'captioned-contact-sheet' : 'hero-plus-supporting-evidence';
    if (role === 'evidence') return 'framed-evidence-caption';
    return 'framed-visual-proof';
  }

  function microComponentsFor(plan = {}, s = {}, signals = contentSignals(plan, s), design = slideDesign(plan, s), themeIntent = '', roleOverride = '') {
    const type = s.type || '';
    const components = ['top-rule', 'page-number', 'watermark-circle'];
    const intent = themeIntent || inferredThemeIntent(plan, s, signals);
    const accentRole = roleOverride || inferredAccentRole(plan, s, signals, intent);
    if (!['cover', 'closing'].includes(type)) components.push('section-kicker');
    if (signals.imageCount || (design && design.wantsImage)) components.push('source-caption', 'evidence-frame');
    if (signals.hasMetrics || type === 'metric-comparison' || type === 'industry-chart') components.push('metric-strip');
    if (['architecture', 'architecture-dark', 'strategy-map'].includes(type)) components.push('system-rail');
    if (['timeline', 'timeline-dark'].includes(type)) components.push('process-rail');
    if (['risk-table', 'table'].includes(type)) components.push('control-tag');
    components.push(...dialectComponentsFor(plan, s));
    if (isCompanyIntroDeck(plan) && type === 'closing') components.push('contact-block', 'back-cover-anchor');
    if (type === 'company-profile-spread') components.push('dark-sidebar', 'metric-strip');
    if (accentRole === 'risk') components.push('control-tag', 'priority-line');
    if (accentRole === 'evidence') components.push('caption-bar', 'source-caption', 'evidence-frame');
    if (accentRole === 'data') components.push('metric-strip', 'source-caption');
    if (accentRole === 'action') components.push('process-rail', 'decision-caption');
    if (/system-architecture/i.test(intent)) components.push('system-rail');
    const avoid = new Set(industryDesignDialect(plan).avoidComponents || []);
    return compactUnique(components).filter(component => !avoid.has(component));
  }

  return {
    backgroundToneFor,
    compositionNameFor,
    imageTreatmentFor,
    inferredAccentRole,
    inferredThemeIntent,
    isCompanyIntroDeck,
    microComponentsFor,
    primaryColorUseFor,
    rhythmRoleFor,
    themeCoverageFor
  };
}

module.exports = {
  createCompositionStrategyHelpers
};
