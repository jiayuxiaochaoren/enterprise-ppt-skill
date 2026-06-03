function createDeckPlanNormalizationHelpers({
  applyDataComponentDiversity,
  applyDeckRhythm,
  applyNarrativeMetadata,
  claimSpineForSlides,
  deckNarrativeSummary,
  normalizeSlide,
  sequenceSlidesByNarrative
} = {}) {
  function normalizeDeckPlan(plan = {}) {
    const slides = Array.isArray(plan.slides) ? plan.slides : [];
    const routed = slides.map((s, i) => normalizeSlide(plan, s, i, slides.length));
    const narrated = applyNarrativeMetadata(plan, routed);
    const sequenced = (plan.autoSequence === true || plan.narrativeMode === 'auto-sequence')
      ? sequenceSlidesByNarrative(plan, narrated)
      : narrated;
    const diversified = applyDataComponentDiversity(plan, sequenced);
    const rhythmic = applyDeckRhythm(plan, diversified);
    const claimSpine = claimSpineForSlides(plan, rhythmic);
    return Object.assign({}, plan, {
      deckNarrative: deckNarrativeSummary(plan, rhythmic),
      claimSpine,
      slides: rhythmic
    });
  }

  return {
    normalizeDeckPlan
  };
}

module.exports = {
  createDeckPlanNormalizationHelpers
};
