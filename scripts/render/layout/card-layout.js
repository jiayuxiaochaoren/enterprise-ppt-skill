function centerY(y, h, boxH) {
  return y + Math.max(0, (h - boxH) / 2);
}

function centeredStackY(y, h, boxHeights = [], gap = 0) {
  const heights = boxHeights.map(value => Math.max(0, Number(value) || 0));
  const total = heights.reduce((sum, value) => sum + value, 0) + Math.max(0, heights.length - 1) * gap;
  let cursor = centerY(y, h, total);
  return heights.map(value => {
    const current = cursor;
    cursor += value + gap;
    return current;
  });
}

module.exports = {
  centerY,
  centeredStackY
};
