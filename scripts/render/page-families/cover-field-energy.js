function createEnergyCoverField(ctx = {}, opts = {}) {
  const colors = opts.colors || (() => ctx.colors());

  function drawEnergyCoverField(slide, plan = {}) {
    const C = colors();
    if (!plan.motionBackdrop || !ctx.addEnergyMotionBackdrop(slide)) {
      ctx.addEnergyPhotoBackdrop(slide);
    }
    ctx.addEnergyLens(slide, 7.78, 0.70, 4.50, C.accent);
  }

  return {
    drawEnergyCoverField
  };
}

module.exports = {
  createEnergyCoverField
};
