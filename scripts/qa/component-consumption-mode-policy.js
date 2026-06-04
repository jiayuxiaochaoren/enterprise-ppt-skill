const {
  componentCapabilityFor
} = require('../render/component-capability-manifest');

function actualComponentMode(component = {}) {
  if (component.mode === 'native-renderer') return 'native';
  if (component.mode === 'overlay') return 'overlay';
  return '';
}

function modeFindingsForComponent(slideNo, component = {}, planned = {}) {
  const findings = [];
  const allowedModes = planned.allowedModes || planned.supportedModes || [];
  const actualMode = actualComponentMode(component);
  const capability = componentCapabilityFor(component.id);
  const manifestModes = capability && Array.isArray(capability.supportedModes) ? capability.supportedModes : [];
  if (component.rendered && actualMode && manifestModes.length && !manifestModes.includes(actualMode)) {
    findings.push({
      slide: slideNo,
      level:'fail',
      type:'componentModeMismatch',
      message:`component ${component.id} rendered as ${actualMode}, but capability manifest allows ${manifestModes.join(',')}`
    });
  }
  if (component.rendered && actualMode && Array.isArray(allowedModes) && allowedModes.length && !allowedModes.includes(actualMode)) {
    findings.push({
      slide: slideNo,
      level:'fail',
      type:'componentModeMismatch',
      message:`component ${component.id} rendered as ${actualMode}, but allowed modes are ${allowedModes.join(',')}`
    });
  }
  return findings;
}

module.exports = {
  actualComponentMode,
  modeFindingsForComponent
};
