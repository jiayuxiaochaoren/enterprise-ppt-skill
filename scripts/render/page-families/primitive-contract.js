const PAGE_FAMILY_PRIMITIVE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'header',
    label: 'Header primitives',
    exports: Object.freeze([
      'drawLightPageHeader',
      'drawDarkPageHeader',
      'drawDarkStageShell'
    ])
  }),
  Object.freeze({
    id: 'footer',
    label: 'Footer and page-number primitives',
    exports: Object.freeze([
      'drawFooter',
      'drawRiskBoardFooter',
      'drawChromePageNumber',
      'drawNumberPageNumber',
      'drawTextPageNumber',
      'drawLightCanvasShell'
    ])
  }),
  Object.freeze({
    id: 'metrics',
    label: 'Metric primitives',
    exports: Object.freeze([
      'drawMetricCard',
      'drawMetricRow'
    ])
  }),
  Object.freeze({
    id: 'evidence',
    label: 'Caption, image, and evidence primitives',
    exports: Object.freeze([
      'drawCaptionStack',
      'drawImagePanel',
      'drawEvidencePanel',
      'drawEvidenceBoard'
    ])
  })
]);

const P2_PAGE_FAMILY_PRIMITIVE_TARGETS = Object.freeze([
  'drawLightPageHeader',
  'drawDarkPageHeader',
  'drawFooter',
  'drawRiskBoardFooter',
  'drawMetricRow',
  'drawCaptionStack',
  'drawImagePanel',
  'drawEvidenceBoard'
]);

function requiredPageFamilyPrimitiveExports(groups = PAGE_FAMILY_PRIMITIVE_GROUPS) {
  return [...new Set(groups.flatMap(group => group.exports || []))].sort();
}

function primitiveGroupIds(groups = PAGE_FAMILY_PRIMITIVE_GROUPS) {
  return groups.map(group => group.id);
}

module.exports = {
  PAGE_FAMILY_PRIMITIVE_GROUPS,
  P2_PAGE_FAMILY_PRIMITIVE_TARGETS,
  primitiveGroupIds,
  requiredPageFamilyPrimitiveExports
};
