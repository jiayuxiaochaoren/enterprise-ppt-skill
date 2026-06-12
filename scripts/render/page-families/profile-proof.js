const {
  createProfileProofCardsRenderer
} = require('./profile-proof-cards');
const {
  createProfileProofIdentityRenderer
} = require('./profile-proof-identity');
const {
  createProfileProofMediaRenderer
} = require('./profile-proof-media');

function createProfileProofRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addText,
    isCompanyIntroPlan,
    publicSlideNote
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader,
    financeProfileProof
  } = deps;
  const { drawProfileProofCards } = createProfileProofCardsRenderer(ctx);
  const { drawProfileProofIdentity } = createProfileProofIdentityRenderer(ctx);
  const { drawProfileProofMedia } = createProfileProofMediaRenderer(ctx);

  return function profileProof(slide, plan, s, idx) {
    if (plan.industry === 'finance-investment') return financeProfileProof(slide, plan, s, idx);
    const companyIntro = isCompanyIntroPlan(plan);
    drawLightPageHeader(slide, {
      kicker:companyIntro ? '公司概况' : 'PROFILE PROOF',
      title:s.title || '公司与能力证明',
      titleW:5.5,
      titleSize:24,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.2,
      subtitleSize:10.0,
      idx
    });
    const metrics = (s.metrics || []).slice(0,4);
    drawProfileProofIdentity(slide, plan, s, companyIntro);
    const { hasProofImage, proofIsPortrait } = drawProfileProofMedia(slide, plan, s, companyIntro);
    const cards = metrics.length ? metrics : (s.cards || []).slice(0,4);
    drawProfileProofCards(slide, cards, { companyIntro, hasProofImage, proofIsPortrait });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:4.68, y:6.28, w:6.10, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createProfileProofRenderer
};
