function recommendationForMissingStage(chainId = '', stage = {}) {
  const base = {
    chainId,
    stageId: stage.id || '',
    stageLabel: stage.label || '',
    recommendedComponents: stage.components || [],
    recommendedRoutes: stage.routes || [],
    requiredFields: stage.fields || [],
    proofObjects: stage.proofObjects || []
  };
  if (chainId === 'consumer-beauty' && stage.id === 'visual-claim') {
    return Object.assign({}, base, {
      suggestedPage: '产品/品牌/视觉证据页',
      recommendedRoutes: ['case-gallery:lookbook-story', 'report-board:editorial-proof-board', ...(stage.routes || [])],
      requiredFields: ['visual/images/lookbook', 'editorialProof', 'productStory/productItems/skuMatrix', 'consumerQuotes/reviews', 'informationGap'],
      assetStrategy: '真实产品图、平台截图或场景图缺失时进入资产决策；事实图只允许 provide_assets 或 skip_image，示意图只能用于非事实视觉'
    });
  }
  return base;
}

module.exports = { recommendationForMissingStage };
