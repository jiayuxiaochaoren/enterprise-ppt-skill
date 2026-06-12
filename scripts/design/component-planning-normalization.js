const {
  canonicalComponentId
} = require('../render/component-capability-manifest');
const {
  normalizeComponentId
} = require('../component-id-normalization');

function componentIdFromHint(value = '') {
  const id = normalizeComponentId(value);
  return canonicalComponentId(id, { preferAlias: true });
}

function normalizeComponentEntry(component, source = 'explicit') {
  if (!component) return null;
  const rawId = typeof component === 'string'
    ? component
    : (component.id || component.name || component.component || component.type || '');
  const id = componentIdFromHint(rawId);
  if (!id) return null;
  return Object.assign({
    id,
    role: typeof component === 'object' ? (component.role || component.purpose || '') : '',
    required: typeof component === 'object' && component.required != null ? Boolean(component.required) : true,
    source,
    renderer: typeof component === 'object' ? (component.renderer || 'auto') : 'auto'
  }, typeof component === 'object' ? component : {});
}

function addComponent(acc, component, source = 'rule') {
  const entry = normalizeComponentEntry(component, source);
  if (!entry) return;
  const existing = acc.find(item => item.id === entry.id);
  if (!existing) {
    acc.push(entry);
    return;
  }
  if (entry.required === true) existing.required = true;
  if (!existing.role && entry.role) existing.role = entry.role;
  if (!existing.source && entry.source) existing.source = entry.source;
  if (!existing.coverageRole && entry.coverageRole) existing.coverageRole = entry.coverageRole;
  if (!existing.coveragePolicy && entry.coveragePolicy) existing.coveragePolicy = entry.coveragePolicy;
  if (entry.allowedModes && !existing.allowedModes) existing.allowedModes = entry.allowedModes;
  if (entry.supportedModes && !existing.supportedModes) existing.supportedModes = entry.supportedModes;
}

function isSystemPlannedComponent(component = {}) {
  return !['explicit', 'explicit-plan', 'component-hint'].includes(component.source || '');
}

function hasContactBlockData(plan = {}, s = {}) {
  return [
    s.contacts,
    s.contact,
    s.contactBlock,
    s.contact_block,
    plan.contacts,
    plan.contact
  ].some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

module.exports = {
  addComponent,
  componentIdFromHint,
  hasContactBlockData,
  isSystemPlannedComponent,
  normalizeComponentEntry,
  normalizeComponentId
};
