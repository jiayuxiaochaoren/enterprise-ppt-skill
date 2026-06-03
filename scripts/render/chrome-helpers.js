const {
  createThemeMetaHelpers
} = require('./chrome/theme-meta');
const {
  createShapeHelpers
} = require('./chrome/shapes');
const {
  createMediaPanelHelpers
} = require('./chrome/media-panels');
const {
  createCanvasChromeHelpers
} = require('./chrome/canvas-chrome');

function createChromeHelpers(deps = {}) {
  const helpers = createThemeMetaHelpers(deps);
  Object.assign(helpers, createShapeHelpers(helpers));
  Object.assign(helpers, createMediaPanelHelpers(helpers, helpers));
  Object.assign(helpers, createCanvasChromeHelpers(helpers, helpers));
  return helpers;
}

module.exports = {
  createChromeHelpers
};
