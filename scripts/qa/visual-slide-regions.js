const {
  intersectionArea
} = require('./pptx-xml');
const {
  regionCoverage,
  textCharsInRegion
} = require('./visual-slide-audit-primitives');
const {
  visualRegion
} = require('./visual-region-contract');

const SLIDE_REGION_METRIC_FIELDS = Object.freeze([
  'mainBodyCoverage',
  'mainBodyElements',
  'rightEvidenceCoverage'
]);

function significantRectShapes(rectShapes = []) {
  return rectShapes.filter(shape => {
    const area = shape.w * shape.h;
    return area >= 0.025 && area <= 24 && !(shape.w > 12.5 && shape.h > 6.8);
  });
}

function contentShapesForRegions(textShapes = [], rectShapes = [], imageShapes = []) {
  return [
    ...textShapes.filter(shape => shape.y == null || shape.y < 6.82),
    ...significantRectShapes(rectShapes),
    ...imageShapes
  ];
}

function slideRegionMetrics(textShapes = [], rectShapes = [], imageShapes = []) {
  const mainBodyRegion = visualRegion('mainBody');
  const rightEvidenceRegion = visualRegion('rightEvidence');
  const significantRects = significantRectShapes(rectShapes);
  const contentShapes = [
    ...textShapes.filter(shape => shape.y == null || shape.y < 6.82),
    ...significantRects,
    ...imageShapes
  ];
  return {
    contentShapes,
    mainBodyCharCount: textCharsInRegion(textShapes, mainBodyRegion),
    mainBodyCoverage: regionCoverage(contentShapes, mainBodyRegion),
    mainBodyElements: contentShapes.filter(shape => intersectionArea(shape, mainBodyRegion) > 0).length,
    mainBodyRegion,
    rightEvidenceCoverage: regionCoverage(contentShapes, rightEvidenceRegion),
    rightEvidenceRegion,
    significantRects
  };
}

module.exports = {
  SLIDE_REGION_METRIC_FIELDS,
  contentShapesForRegions,
  significantRectShapes,
  slideRegionMetrics
};
