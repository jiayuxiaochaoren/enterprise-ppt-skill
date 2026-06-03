const {
  componentAliasTargetFor,
  isComponentAlias
} = require('../render/component-capability-manifest');

function createComponentPlanAuditHelpers({
  flattenText = value => String(value || ''),
  hasComponentCapability = () => false,
  normalizeDeckPlan = plan => plan
} = {}) {
  function componentPlanAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    slides.forEach((slide, i) => {
      if (['cover', 'closing'].includes(slide.type || '')) return;
      const componentPlan = slide.componentPlan || {};
      const components = Array.isArray(componentPlan.components) ? componentPlan.components : [];
      const unknownComponents = Array.isArray(componentPlan.unknownComponents) ? componentPlan.unknownComponents : [];
      unknownComponents.forEach(component => {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'unknownComponentId',
          message: `unknown component id in plan: ${component.id}`
        });
      });
      if (componentPlan.version !== 'component-plan/v1' || !components.length) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'componentPlanMissing',
          message: 'slide has no executable componentPlan'
        });
        return;
      }
      components.forEach(component => {
        if (isComponentAlias(component.id)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'componentAliasNotCanonical',
            message: `component alias ${component.id} must be normalized to ${componentAliasTargetFor(component.id)}`
          });
        }
        if (!hasComponentCapability(component.id)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'unknownComponentId',
            message: `component has no capability registry entry: ${component.id}`
          });
        }
      });
      const required = components.filter(c => c.required !== false).map(c => c.id);
      if (!required.length) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'componentRequiredMissing',
          message: 'componentPlan has no required components, so renderer consumption cannot be meaningfully checked'
        });
      }
      if (required.includes('risk-matrix') && componentPlan.riskMatrixPolicy !== 'render-only-when-explicit') {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'riskMatrixDefaulted',
          message: 'risk-matrix component must be explicitly triggered, not defaulted'
        });
      }
      const ids = components.map(c => c.id);
      const hasProcessStructure = ['timeline', 'timeline-dark'].includes(slide.type || '') ||
        Array.isArray(slide.phases) ||
        Array.isArray(slide.actions) ||
        Array.isArray(slide.steps) ||
        Array.isArray(slide.timeline) ||
        Array.isArray(slide.milestones);
      if (ids.includes('process-rail') && !hasProcessStructure) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'processRailWithoutStructure',
          message: 'process-rail requires phases/actions/steps or an explicit timeline route'
        });
      }
      const hasRiskStructure = ['risk-table'].includes(slide.type || '') ||
        Array.isArray(slide.rows) ||
        Array.isArray(slide.risks) ||
        Array.isArray(slide.controls) ||
        Boolean(slide.riskRegister || slide.riskMatrix || slide.controlsMatrix || slide.matrix);
      if (ids.includes('risk-register') && !hasRiskStructure) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'riskRegisterWithoutRows',
          message: 'risk-register requires rows/risks/controls or explicit risk structure'
        });
      }
      const hasArchitectureStructure = ['architecture', 'architecture-dark', 'strategy-map'].includes(slide.type || '') ||
        Array.isArray(slide.layers) ||
        Boolean(slide.architecture || slide.systemMap || slide.topology || slide.capabilityMap || slide.platformCapabilities || slide.valueChain || slide.capitals);
      if (ids.includes('system-rail') && !hasArchitectureStructure) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'systemRailWithoutArchitecture',
          message: 'system-rail requires architecture/strategy route or explicit layers/topology/capability data'
        });
      }
      const text = flattenText(slide);
      const hasCurveStructure = slide.loadCurve || slide.loadCurveBand || slide.curve || slide.trend || slide.monthlyTrend || slide.monthlyPulse ||
        /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(text);
      if (ids.includes('load-curve-band') && !hasCurveStructure) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'loadCurveWithoutSemantics',
          message: 'load-curve-band requires explicit curve/trend/load semantics'
        });
      }
    });
    return {
      version: 'component-plan-audit/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  return {
    componentPlanAudit
  };
}

module.exports = {
  createComponentPlanAuditHelpers
};
