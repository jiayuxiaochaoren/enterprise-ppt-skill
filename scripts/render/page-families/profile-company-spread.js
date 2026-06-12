const {
  createCompanyProfileIntroPanel
} = require('./profile-company-intro-panel');
const {
  createCompanyProfileMediaPanel
} = require('./profile-company-media-panel');
const {
  createCompanyProfileMetrics
} = require('./profile-company-metrics');

function createCompanyProfileSpread(ctx = {}, deps = {}) {
  const {
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader,
    manufacturingCompanyProfileSpread
  } = deps;
  const { drawCompanyProfileIntro } = createCompanyProfileIntroPanel(ctx, { drawLightPageHeader });
  const { drawCompanyProfileMedia } = createCompanyProfileMediaPanel(ctx);
  const { drawCompanyProfileMetrics } = createCompanyProfileMetrics(ctx);

  return function companyProfileSpread(slide, plan, s, idx) {
    if (plan.industry === 'manufacturing-operations') return manufacturingCompanyProfileSpread(slide, plan, s, idx);
    const company = s.company || plan.organization || plan.title || '公司名称';
    const profileCards = (s.cards || s.items || []).map(v => typeof v === 'string' ? { title:v } : v);
    drawCompanyProfileIntro(slide, plan, s, idx, company);
    drawCompanyProfileMedia(slide, plan, s, company, profileCards);
    drawCompanyProfileMetrics(slide, s);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createCompanyProfileSpread
};
