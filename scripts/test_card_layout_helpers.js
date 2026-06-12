const assert = require('assert/strict');
const {
  centerY,
  centeredStackY
} = require('./render/layout/card-layout');

assert.equal(centerY(2, 1, 0.4), 2.3);
assert.equal(centerY(2, 0.2, 0.4), 2);
assert.deepEqual(centeredStackY(5, 1, [0.2, 0.3], 0.1), [5.2, 5.5]);

console.log('card layout helpers ok');
