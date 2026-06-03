const {
  findMetric
} = require('./financial-scorecard-primitives');
const {
  createHealthcareExperienceHeroRenderer
} = require('./financial-scorecard-healthcare-hero');
const {
  createHealthcareJourneyRenderer
} = require('./financial-scorecard-healthcare-journey');
const {
  createHealthcareQueueRenderer
} = require('./financial-scorecard-healthcare-queue');

function createHealthcareServiceScorecard(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
    panelFill,
  } = ctx;
  const {
    drawFooter,
    drawScorecardHeader
  } = deps;
  const { drawHealthcareExperienceHero } = createHealthcareExperienceHeroRenderer(ctx);
  const { drawHealthcareJourneyReadout } = createHealthcareJourneyRenderer(ctx);
  const { drawHealthcareServiceQueue } = createHealthcareQueueRenderer(ctx);

  return function healthcareServiceScorecard(slide, plan, s, idx) {
    drawScorecardHeader(slide, s, idx, {
      kicker:'PATIENT SERVICE SCORECARD',
      title:'患者体验与响应效率',
      titleW:5.9,
      subtitle:'把满意度、等待时长和反馈闭环放回患者旅程，而不是孤立展示 KPI。',
      subtitleW:7.0
    });

    const metrics = (s.metrics || []).slice(0,4);
    const satisfaction = findMetric(metrics, /满意|NPS|experience|satisfaction/i, 0);
    const wait = findMetric(metrics, /等待|wait|响应|response/i, 1);
    const closure = findMetric(metrics, /闭环|投诉|反馈|closure|case/i, 2);
    const stage = { x:0.92, y:2.10, w:10.90, h:3.92 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

    const hero = { x:1.22, y:2.44, w:2.28, h:2.98 };
    drawHealthcareExperienceHero(slide, satisfaction, hero);

    const flowX = 4.06;
    const flowY = 2.60;
    drawHealthcareJourneyReadout(slide, wait, satisfaction, closure, { x:flowX, y:flowY });

    const queue = { x:4.02, y:4.64, w:6.70, h:0.62 };
    drawHealthcareServiceQueue(slide, wait, satisfaction, closure, queue);
    addText(slide, s.note || '患者指标页要能回到服务触点、责任动作和质量复盘。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createHealthcareServiceScorecard
};
