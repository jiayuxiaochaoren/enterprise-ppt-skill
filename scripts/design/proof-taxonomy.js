const data = require('./proof-taxonomy-data');
const common = require('./proof-taxonomy-common');
const proof = require('./proof-taxonomy-proof');
const layout = require('./proof-taxonomy-layout');

module.exports = Object.assign({}, data, common, proof, layout);
