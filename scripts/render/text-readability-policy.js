function containsCjk(text) {
  return /[\u3400-\u9fff]/.test(String(text || ''));
}

const TEXT_READABILITY_POLICY_FIELDS = Object.freeze([
  'charsPerInch',
  'areaDensity',
  'shrinkRisk',
  'readabilityRiskLevel'
]);

function createTextReadabilityPolicy(deps = {}) {
  const {
    currentCanvasWidth,
    currentPlan,
    currentVisualSystem,
    folioPolicy,
    normalizeTypographyOptions
  } = deps;

  function textOptionWithReadabilityFloor(text, opts = {}) {
    const next = typeof normalizeTypographyOptions === 'function'
      ? normalizeTypographyOptions(currentPlan(), text, opts)
      : Object.assign({}, opts);
    if (folioPolicy.isPageFolioText(text, next)) return folioPolicy.normalizePageFolioTextOptions(next);
    if (typeof next.fontSize !== 'number' || !containsCjk(text)) return next;
    const isFooter = Number(next.y || 0) >= 6.62;
    const isMicroSlot = Number(next.w || 0) < 0.72 || Number(next.h || 0) < 0.11;
    if (isMicroSlot && !containsCjk(text)) return next;
    const cjkChars = (String(text || '').match(/[\u3400-\u9fff]/g) || []).length;
    if (next.fit === 'shrink') next.fit = false;
    if (!next.allowNarrowCjk && cjkChars >= 12 && Number(next.w || 0) > 0 && Number(next.w || 0) < 1.42) {
      const maxWidth = Math.max(Number(next.w || 0), currentCanvasWidth() - Number(next.x || 0) - 0.36);
      next.w = Math.min(maxWidth, Math.max(1.56, Math.min(2.56, cjkChars * 0.12)));
      if (Number(next.h || 0) > 0 && Number(next.h || 0) < 0.22) next.h = 0.22;
      next.breakLine = true;
    }
    const qa = (currentVisualSystem().visualQA || {});
    const bodyFloor = Number(qa.preferredBodyMin || 8.8);
    const captionFloor = Math.max(
      Number(qa.preferredCaptionMin || 7.2),
      Number(qa.preferredCjkCaptionMin || qa.minRenderedCjkSize || 8.0)
    );
    const titleFloor = next.bold ? 9.6 : bodyFloor;
    const floor = isFooter ? captionFloor : Math.max(bodyFloor, titleFloor);
    if (next.fontSize < floor) {
      next.fontSize = floor;
      if (!isFooter && Number(next.h || 0) > 0 && Number(next.h || 0) < 0.18) next.h = 0.18;
    }
    return next;
  }

  return {
    textOptionWithReadabilityFloor
  };
}

module.exports = {
  TEXT_READABILITY_POLICY_FIELDS,
  containsCjk,
  createTextReadabilityPolicy
};
