function createRendererApi(deps = {}) {
  const fs = deps.fs || require('fs');
  const chromeHelpers = deps.chromeHelpers || {};
  return Object.assign({}, chromeHelpers, {
    colors: deps.colors,
    canvasWidth: deps.canvasWidth,
    canvasHeight: deps.canvasHeight,
    fileExists: file => fs.existsSync(file),
    copyPolicyList: deps.copyPolicyList,
    compactEvidenceCaption: deps.compactEvidenceCaption,
    chooseEvidenceImageLayout: deps.chooseEvidenceImageLayout,
    chooseFourImageLayout: deps.chooseFourImageLayout,
    formatMetricDelta: deps.formatMetricDelta,
    itemBody: deps.itemBody,
    itemBodyNoEllipsis: deps.itemBodyNoEllipsis,
    itemTitle: deps.itemTitle,
    publicSlideNote: deps.publicSlideNote,
    recordChartConsumption: deps.recordChartConsumption,
    reportBoardNeedsRightOverlayRail: deps.reportBoardNeedsRightOverlayRail,
    routeChartSpec: deps.routeChartSpec,
    renderChartSpec: deps.renderChartSpec,
    chartSpecToComponentId: deps.chartSpecToComponentId,
    variantOf: deps.variantOf,
    galleryImages: deps.galleryImages,
    mediaForRole: deps.mediaForRole,
    resolveAssetPath: deps.resolveAssetPath,
    slideWantsImage: deps.slideWantsImage
  });
}

module.exports = {
  createRendererApi
};
