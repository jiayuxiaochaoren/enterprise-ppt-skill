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
    const header = drawScorecardHeader(slide, s, idx, {
      kicker:s.kicker || s.label || '服务质量看板',
      title:'患者体验与响应效率',
      titleW:7.2,
      subtitle:'把满意度、等待时长和服务改进放回患者旅程，而不是孤立展示 KPI。',
      subtitleW:7.6,
      subtitleBreakLine:true,
      headerContentGap:0.36
    });

    const metrics = (s.metrics || []).slice(0,4);
    const satisfaction = findMetric(metrics, /满意|NPS|experience|satisfaction/i, 0);
    const wait = findMetric(metrics, /等待|wait|响应|response/i, 1);
    const closure = findMetric(metrics, /闭环|投诉|反馈|closure|case/i, 2);
    const stageY = Math.max(2.30, Number(header && header.contentTop) || 2.30);
    const stage = { x:0.92, y:stageY, w:10.90, h:Math.max(3.60, 6.10 - stageY) };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

    const hero = { x:1.22, y:stage.y+0.34, w:2.28, h:Math.min(2.98, stage.h-0.92) };
    drawHealthcareExperienceHero(slide, satisfaction, hero);

    const flowX = 4.06;
    const flowY = stage.y + 0.50;
    drawHealthcareJourneyReadout(slide, wait, satisfaction, closure, { x:flowX, y:flowY });

    const queue = { x:4.02, y:Math.min(stage.y + stage.h - 0.94, flowY + 2.04), w:6.70, h:0.62 };
    drawHealthcareServiceQueue(slide, wait, satisfaction, closure, queue);
    addText(slide, s.note || '患者指标页要能回到服务触点、责任动作和质量复盘。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createHealthcareServiceScorecard
};
