function createGenericCoverField(ctx = {}) {
  function drawCoverBreathingCircle(slide) {
    ctx.addDarkBreathingCircle(slide, 8.30, 0.84, 4.38, 2.54);
  }

  function drawGenericCoverField(slide) {
    drawCoverBreathingCircle(slide);
  }

  function drawParkCoverField(slide) {
    drawCoverBreathingCircle(slide);
  }

  return {
    drawGenericCoverField,
    drawParkCoverField
  };
}

module.exports = {
  createGenericCoverField
};
