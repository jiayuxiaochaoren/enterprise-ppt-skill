const {
  findMetric
} = require('./financial-scorecard-primitives');
const {
  createRetailCohortStoryRenderer
} = require('./financial-scorecard-retail-cohort');
const {
  createRetailLoyaltyHeroRenderer
} = require('./financial-scorecard-retail-hero');
const {
  createRetailSignalCardsRenderer
} = require('./financial-scorecard-retail-signal-cards');

function createRetailMemberGrowthBoard(ctx = {}, deps = {}) {
  const {
    addRect,
    addText,
    panelFill,
  } = ctx;
  const C = ctx.colors();
  const {
    drawFooter,
    drawScorecardHeader
  } = deps;
  const { drawRetailCohortStory } = createRetailCohortStoryRenderer(ctx);
  const { drawRetailLoyaltyHero } = createRetailLoyaltyHeroRenderer(ctx);
  const { drawRetailSignalCards } = createRetailSignalCardsRenderer(ctx);

  return function retailMemberGrowthBoard(slide, plan, s, idx) {
    drawScorecardHeader(slide, s, idx, {
      kicker:'会员增长看板',
      title:'会员增长指标',
      titleW:5.8,
      subtitle:'把复购、客单和门店转化放进会员经营节奏，而不是只展示数字。',
      subtitleW:6.8
    });

    const metrics = (s.metrics || []).slice(0,4);
    const repurchase = findMetric(metrics, /复购|repeat|retention/i, 0);
    const basket = findMetric(metrics, /客单|AOV|basket|order/i, 1);
    const conversion = findMetric(metrics, /转化|conversion|门店/i, 2);
    const band = { x:0.92, y:2.16, w:10.42, h:3.62 };
    addRect(slide, band.x, band.y, band.w, band.h, C.paper || 'FFF7F0', C.line, {
      fill:{color:C.paper || 'FFF7F0', transparency:6},
      line:{color:C.line, transparency:100}
    });
    addRect(slide, band.x, band.y, 10.42, 0.12, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });

    const hero = { x:1.18, y:2.50, w:2.42, h:2.94 };
    drawRetailLoyaltyHero(slide, repurchase, hero);

    const cohort = { x:4.08, y:2.48, w:3.34, h:2.76 };
    drawRetailCohortStory(slide, cohort, metrics);

    const right = { x:7.72, y:3.02, w:3.08, h:2.42 };
    drawRetailSignalCards(slide, basket, conversion, right);
    addText(slide, s.note || '零售指标页应把数字解释为会员分层、商品组合和门店动作的结果。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createRetailMemberGrowthBoard
};
