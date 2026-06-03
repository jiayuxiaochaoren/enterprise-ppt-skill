const {
  canonicalComponentId
} = require('../render/component-capability-manifest');

function normalizeComponentId(value = '') {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_+\s/]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

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
  if (!acc.some(item => item.id === entry.id)) acc.push(entry);
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
