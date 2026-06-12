const assert = require('assert/strict');
const {
  normalizeComponentId
} = require('./component-id-normalization');
const designNormalization = require('./design/component-planning-normalization');
const renderNormalization = require('./render/component-capability-normalization');
const {
  componentRenderPathsFor
} = require('./render/component-render-path-registry');

assert.equal(designNormalization.normalizeComponentId, normalizeComponentId);
assert.equal(renderNormalization.normalizeComponentId, normalizeComponentId);
assert.equal(normalizeComponentId('Hero_KPIs / Strip'), 'hero-kpis-strip');
assert.equal(designNormalization.componentIdFromHint('gallery grid'), 'proof-gallery');
assert.deepEqual(componentRenderPathsFor('Source Note'), ['overlay', 'suppressed-by-policy']);

console.log('component id normalization ok');
