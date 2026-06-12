function catalogGridLayout(productList = []) {
  const compact = productList.length <= 6;
  const cardW = compact ? 3.02 : 2.42;
  const cardH = compact ? 1.70 : 1.68;
  const slots = compact
    ? productList.map((_, i) => {
      const row = Math.floor(i / 3);
      const inRow = row === 0 ? Math.min(3, productList.length) : productList.length - 3;
      const rowStart = inRow === 1 ? 5.12 : (inRow === 2 ? 3.42 : 1.72);
      return [rowStart + (i % 3) * 3.48, 2.16 + row * 2.16];
    })
    : [
      [0.92,2.16], [3.74,2.16], [6.56,2.16], [9.38,2.16],
      [0.92,4.48], [3.74,4.48], [6.56,4.48], [9.38,4.48]
    ];
  return {
    cardH,
    cardW,
    compact,
    slots
  };
}

module.exports = {
  catalogGridLayout
};
