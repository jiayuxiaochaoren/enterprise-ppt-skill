const { createPageFamilyPrimitives } = require('./primitives');
const {
  saasCapabilityData
} = require('./architecture-saas-capability-data');
const {
  createSaasCapabilityCorePanel
} = require('./architecture-saas-core-panel');
const {
  createSaasEnterpriseFitPanel
} = require('./architecture-saas-enterprise-fit');
const {
  createSaasWorkflowField
} = require('./architecture-saas-workflow-field');

function createArchitectureSaasCapabilityMap(ctx = {}, deps = {}) {
  const {
    drawFooter,
    drawLightPageHeader
  } = deps.drawFooter && deps.drawLightPageHeader ? deps : createPageFamilyPrimitives(ctx);
  const {
    drawProductCorePanel
  } = createSaasCapabilityCorePanel(ctx);
  const {
    drawEnterpriseFit
  } = createSaasEnterpriseFitPanel(ctx);
  const {
    drawWorkflowField
  } = createSaasWorkflowField(ctx);

  return function architectureSaasCapabilityMap(slide, plan, s, idx) {
    const claim = s.claim || s.subtitle || '把产品入口、核心工作流、数据事件、集成和治理放进同一张平台能力地图。';
    drawLightPageHeader(slide, {
      kicker:'PLATFORM CAPABILITY MAP',
      title:s.title || '平台能力地图',
      titleW:5.9,
      titleSize:24,
      subtitle:claim,
      subtitleW:7.0,
      subtitleSize:10.0,
      idx
    });

    const { caps, dataLayer, integrationLayer, metrics } = saasCapabilityData(s);
    drawProductCorePanel(slide, s, metrics);
    drawWorkflowField(slide, s, caps);
    drawEnterpriseFit(slide, s, dataLayer, integrationLayer);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createArchitectureSaasCapabilityMap
};
