function createDeckRhythmHelpers(deps = {}) {
  const {
    accentRoleFor,
    compactUnique,
    contentSignals,
    dataGrammarVariant,
    imageRefsForSlide,
    layoutEnergyFor,
    normalizeSlide,
    preferredProofObjectIdForTrace,
    proofObjectIdForSlide,
    rhythmTransitionFor,
    routeKey,
    semanticColorRolesFor,
    themeIntentFor,
    visualDensityFor
  } = deps;

  function claimSpineForSlides(plan = {}, slides = []) {
    return slides
      .map((slide, i) => Object.assign({}, slide, { __slideIndex: i }))
      .filter(slide => !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || ''))
      .map(slide => ({
        slide: slide.__slideIndex + 1,
        type: slide.type || '',
        title: slide.title || '',
        claim: slide.claim || slide.subtitle || slide.intro || slide.title || '',
        proofObject: preferredProofObjectIdForTrace(slide) || '',
        sourceIds: compactUnique([
          ...(((slide.sourceTrace || {}).sourceIds) || []),
          ...(((slide.proof || {}).sourceIds) || [])
        ])
      }));
  }

  function applyDataComponentDiversity(plan = {}, slides = []) {
    const seenRoutes = new Map();
    return slides.map((slide, i) => {
      const key = routeKey(slide);
      const body = !['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || '');
      const imageCaseRoute = ['case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(slide.type || '') ||
        (imageRefsForSlide(slide).length > 0 && /gallery|proof|photo|mosaic|evidence|product|lookbook/i.test(proofObjectIdForSlide(slide)));
      const processRoute = ['timeline', 'timeline-dark'].includes(slide.type || '') ||
        Array.isArray(slide.phases) ||
        Array.isArray(slide.actions) ||
        Array.isArray(slide.steps) ||
        Array.isArray(slide.timeline) ||
        Array.isArray(slide.milestones) ||
        /process|timeline|pathway|flywheel|loop/i.test(String(slide.layoutVariant || slide.variant || ''));
      const grammarVariant = dataGrammarVariant(plan, slide, contentSignals(plan, slide, i, slides.length));
      let next = slide;
      if (body && !imageCaseRoute && !processRoute && seenRoutes.has(key) && grammarVariant && key !== `industry-chart:${grammarVariant}`) {
        next = Object.assign({}, slide, {
          type: 'industry-chart',
          layoutVariant: grammarVariant,
          variant: grammarVariant,
          layoutRationale: `data component diversity: ${grammarVariant}`
        });
        next.compositionPlan = undefined;
        next.componentPlan = undefined;
        next = normalizeSlide(plan, next, i, slides.length);
      }
      const nextKey = routeKey(next);
      seenRoutes.set(nextKey, (seenRoutes.get(nextKey) || 0) + 1);
      return next;
    });
  }

  function applyDeckRhythm(plan = {}, slides = []) {
    if (!slides.length) return slides;
    let lightRun = 0;
    let lastIntent = '';
    return slides.map((slide, i) => {
      const cp = Object.assign({}, slide.compositionPlan || {});
      const intent = cp.themeIntent || themeIntentFor(plan, slide, i, slides.length);
      const accentRole = cp.accentRole || accentRoleFor(plan, slide, i, slides.length, intent);
      const tone = cp.backgroundTone || 'tinted-paper';
      const isDark = /dark|stage/i.test(tone);
      lightRun = isDark ? 0 : lightRun + 1;
      const next = Object.assign({}, cp);
      const use = Array.isArray(next.primaryColorUse) ? next.primaryColorUse.slice() : [];
      const micros = Array.isArray(next.microComponents) ? next.microComponents.slice() : [];
      next.themeIntent = intent;
      next.accentRole = accentRole;
      next.layoutEnergy = next.layoutEnergy || layoutEnergyFor(plan, slide, i, slides.length, intent);
      next.visualDensity = next.visualDensity || visualDensityFor(plan, slide, i, slides.length);
      next.rhythmTransition = next.rhythmTransition || rhythmTransitionFor(plan, slide, i, slides.length, intent);
      next.semanticColorRoles = next.semanticColorRoles || semanticColorRolesFor(plan, accentRole);
      if (i === 0) {
        next.rhythmRole = 'opener';
        next.themeCoverage = 'high';
        next.backgroundTone = isDark ? tone : 'accent-wash';
      } else if (i === slides.length - 1) {
        next.rhythmRole = 'closer';
        next.themeCoverage = 'high';
        next.backgroundTone = /dark|stage|accent/i.test(String(next.backgroundTone || '')) ? next.backgroundTone : 'dark-stage';
        use.push('dark-anchor');
        micros.push('rhythm-anchor', 'back-cover-anchor');
      } else if (/risk-warning|value-signal/i.test(intent)) {
        next.backgroundTone = 'accent-wash';
        next.themeCoverage = next.themeCoverage === 'low' ? 'medium' : next.themeCoverage;
        use.push(accentRole === 'risk' ? 'risk-band' : 'metric-highlight', 'side-color-field');
        micros.push('rhythm-anchor');
        lightRun = 1;
      } else if (/case-evidence|company-proof/i.test(intent)) {
        next.themeCoverage = 'high';
        use.push('caption-bar', 'evidence-frame');
        micros.push('caption-bar', 'evidence-frame');
      } else if (lightRun >= 3) {
        next.backgroundTone = 'accent-wash';
        next.themeCoverage = next.themeCoverage === 'high' ? 'high' : 'medium';
        use.push('side-color-field');
        micros.push('rhythm-anchor');
        lightRun = 1;
      }
      if (i > 0 && i % 4 === 0 && !isDark) {
        next.backgroundTone = next.backgroundTone === 'tinted-paper' ? 'accent-wash' : next.backgroundTone;
        use.push('side-color-field');
        micros.push('rhythm-anchor');
      }
      next.primaryColorUse = compactUnique(use);
      next.microComponents = compactUnique(micros);
      const rhythmTransition = lastIntent && lastIntent !== intent ? next.rhythmTransition || 'theme-shift' : next.rhythmTransition;
      lastIntent = intent;
      return Object.assign({}, slide, {
        themeIntent: intent,
        accentRole,
        layoutEnergy: next.layoutEnergy,
        visualDensity: next.visualDensity,
        rhythmTransition,
        compositionPlan: Object.assign({}, next, { rhythmTransition })
      });
    });
  }

  return {
    applyDataComponentDiversity,
    applyDeckRhythm,
    claimSpineForSlides
  };
}

module.exports = {
  createDeckRhythmHelpers
};
