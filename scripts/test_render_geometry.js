const assert = require('assert/strict');
const {
  zone,
  zoneBounds,
  zonesIntersect
} = require('./render/geometry');

const a = zone('a', '1', '2', '3', '4', 'safe-overlay');
assert.deepEqual(a, { id: 'a', x: 1, y: 2, w: 3, h: 4, role: 'safe-overlay' });
assert.deepEqual(zoneBounds({ x: '0.5', y: '1.5', w: '2', h: '3' }), { x: 0.5, y: 1.5, w: 2, h: 3 });
assert.equal(zonesIntersect({ x: 0, y: 0, w: 1, h: 1 }, { x: 0.5, y: 0.5, w: 1, h: 1 }), true);
assert.equal(zonesIntersect({ x: 0, y: 0, w: 1, h: 1 }, { x: 1.02, y: 0, w: 1, h: 1 }), false);
assert.equal(zonesIntersect({ x: 0, y: 0, w: 1, h: 1 }, { x: 0.99, y: 0, w: 1, h: 1 }, 0.02), false);

console.log('render geometry ok');
