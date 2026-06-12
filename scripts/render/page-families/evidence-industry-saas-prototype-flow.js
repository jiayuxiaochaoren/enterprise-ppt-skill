const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createSaasPrototypeHeroRenderer
} = require('./evidence-industry-saas-prototype-flow-hero');
const {
  createSaasPrototypeStateRenderer
} = require('./evidence-industry-saas-prototype-flow-states');
const {
  createSaasPrototypeWorkflowRenderer
} = require('./evidence-industry-saas-prototype-flow-workflow');

function createSaasPrototypeFlowGalleryRenderer(ctx = {}, deps = {}) {
  const { drawEvidenceHeader } = deps;
  const C = ctx.colors();
  const {
    addRect,
    addText,
    galleryImages
  } = ctx;
  const {
    drawFooter
  } = createPageFamilyPrimitives(ctx);
  const { drawSaasPrototypeHero } = createSaasPrototypeHeroRenderer(ctx);
  const { drawSaasScreenStates } = createSaasPrototypeStateRenderer(ctx);
  const {
    drawSaasWorkflowPath
  } = createSaasPrototypeWorkflowRenderer(ctx);

  return function saasPrototypeFlowGallery(slide, plan, s, idx) {
    const header = drawEvidenceHeader(slide, s, idx, {
      kicker:'PRODUCT WORKFLOW',
      title:'产品原型工作流',
      subtitle:'SaaS 原型页要先说明用户工作流，再展示界面状态和采用信号。',
      subtitleW:6.7
    });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const contentY = Math.max(2.00, (header && header.contentTop) || 2.00);
    const heroH = Math.max(3.12, 5.88 - contentY);
    const hero = { x:0.92, y:contentY, w:5.52, h:heroH };
    drawSaasPrototypeHero(slide, images, items, hero);
    const flow = { x:6.86, y:contentY, w:4.72, h:2.14 };
    const steps = drawSaasWorkflowPath(slide, items, flow);
    drawSaasScreenStates(slide, images, steps, { y:contentY + 2.54 });
    addRect(slide, 0.92, 6.18, 10.66, 0.34, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addText(slide, s.note || '界面、核心动作、自动化路径和采用信号放在同一条工作流里。', { x:1.14, y:6.25, w:9.78, h:0.12, fontSize:8.2, color:C.body, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createSaasPrototypeFlowGalleryRenderer
};
