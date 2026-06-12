const { createPageFamilyPrimitives } = require('./primitives');

function createBrandStoryChrome(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);

  function drawBrandStoryHeader(slide, s, idx, opts = {}) {
    return drawLightPageHeader(slide, {
      kicker:opts.kicker,
      title:s.title || opts.title,
      titleW:opts.titleW,
      titleSize:23.5,
      subtitle:s.subtitle || s.intro || s.claim || opts.subtitle,
      subtitleW:opts.subtitleW,
      subtitleSize:opts.subtitleSize || 9.6,
      idx,
      pageNumber:opts.pageNumber
    });
  }

  return {
    drawBrandStoryHeader,
    drawFooter
  };
}

module.exports = {
  createBrandStoryChrome
};
