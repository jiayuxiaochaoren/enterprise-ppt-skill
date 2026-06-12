const {
  createCoverDarkEnergyCopy
} = require('./cover-dark-energy-copy');
const {
  createCoverDarkStandardCopy
} = require('./cover-dark-standard-copy');

function createCoverDarkRenderer(ctx = {}, deps = {}) {
  const {
    airyConceptOpening,
    beautyBrandEditorialCover,
    colors,
    coverFieldRendererFor,
    coverLightEditorial,
    coverShowcase,
    coverStyleRenderer,
    coverTitleText,
    fileExists,
  } = deps;
  const { drawEnergyCoverCopy } = createCoverDarkEnergyCopy(ctx, deps);
  const { drawStandardCoverCopy } = createCoverDarkStandardCopy(ctx, deps);

  return function coverDark(slide, plan, s) {
    const C = colors();
    ctx.masterDark(slide, plan, '', null, '', { field:false });
    const coverVariant = ctx.variantOf(s, '');
    if (coverVariant === 'beauty-brand-editorial-cover') return beautyBrandEditorialCover(slide, plan, s);
    const industry = ctx.industryProfile(plan);
    const rawTitle = String(s.title || plan.title || '');
    const title = plan.industry === 'energy-utility' ? rawTitle.replace(/\n/g, '') : coverTitleText(rawTitle);
    const coverDesign = ctx.designForSlide(plan, s, 'cover');
    const coverTone = ctx.presentationSpec().coverTone || 'dark';
    const hasCoverImage = coverDesign.imagePath && fileExists(coverDesign.imagePath);
    if (coverStyleRenderer && coverStyleRenderer(slide, plan, s, industry, title)) return;
    if (coverVariant === 'airy-concept-opening') return airyConceptOpening(slide, plan, s);
    if (plan.industry === 'finance-investment' && plan.visualIntent === 'case-led' && hasCoverImage) {
      if (coverShowcase(slide, plan, s, industry, title)) return;
    }
    if (plan.industry !== 'energy-utility' && (coverTone === 'light' || coverTone === 'split')) {
      return coverLightEditorial(slide, plan, s, industry, title);
    }
    if (plan.industry !== 'energy-utility' && coverDesign.imageRole !== 'background' && coverShowcase(slide, plan, s, industry, title)) {
      return;
    }
    const genericPhotoCover = plan.industry !== 'energy-utility' && ctx.addVisualPhotoBackdrop(slide, plan, s, 'cover', { transparency:70 });
    if (!genericPhotoCover) {
      coverFieldRendererFor(industry)(slide, plan);
    } else {
      ctx.addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
    }

    if (plan.industry === 'energy-utility') {
      drawEnergyCoverCopy(slide, plan, s, industry, title);
      return;
    }

    drawStandardCoverCopy(slide, plan, s, industry, title);
  };
}

module.exports = {
  createCoverDarkRenderer
};
