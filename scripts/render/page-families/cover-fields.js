const {
  createEnergyCoverField
} = require('./cover-field-energy');
const {
  createGenericCoverField
} = require('./cover-field-generic');
const {
  createManufacturingCoverField
} = require('./cover-field-manufacturing');

function createCoverFieldRenderers(ctx = {}, opts = {}) {
  const colors = opts.colors || (() => ctx.colors());
  const { drawEnergyCoverField } = createEnergyCoverField(ctx, { colors });
  const { drawGenericCoverField, drawParkCoverField } = createGenericCoverField(ctx);
  const { drawManufacturingCoverField } = createManufacturingCoverField(ctx, { colors });

  function coverFieldRendererFor(industry = {}) {
    if (typeof industry.coverField === 'function') return industry.coverField;
    const coverFields = {
      generic: drawGenericCoverField,
      manufacturing: drawManufacturingCoverField,
      park: drawParkCoverField,
      energy: drawEnergyCoverField
    };
    return coverFields[industry.coverField] || drawGenericCoverField;
  }

  return {
    coverFieldRendererFor,
    drawEnergyCoverField,
    drawGenericCoverField,
    drawManufacturingCoverField
  };
}

module.exports = {
  createCoverFieldRenderers
};
