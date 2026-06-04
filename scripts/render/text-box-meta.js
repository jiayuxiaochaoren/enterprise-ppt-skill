const TEXT_META_READINESS_FIELDS = Object.freeze([
  'areaDensity',
  'charsPerInch',
  'readabilityRiskLevel',
  'shrinkRisk',
  'textBoxes'
]);

function textRegionForBox(x, y) {
  if (y >= 6.62) return 'footer';
  if (x >= 7.8) return 'rightEvidence';
  if (y >= 1.18 && y <= 6.7) return 'mainBody';
  return 'chrome';
}

function createTextBoxMetaRecorder(deps = {}) {
  const {
    compactText,
    currentVisualSystem
  } = deps;

  function recordTextBoxMeta(slide, rawText, displayText, inputOpts = {}, textOpts = {}, role = '') {
    if (!slide || !String(displayText || rawText || '').trim()) return;
    const text = String(displayText || rawText || '');
    const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const w = Number(textOpts.w || inputOpts.w || 0);
    const h = Number(textOpts.h || inputOpts.h || 0);
    const fontSize = Number(textOpts.fontSize || inputOpts.fontSize || 0);
    const x = Number(textOpts.x || inputOpts.x || 0);
    const y = Number(textOpts.y || inputOpts.y || 0);
    const fitStrategy = textOpts.__finalFitStrategy || (textOpts.fit === false || textOpts.noFit === true
      ? 'none'
      : (textOpts.fit || inputOpts.fit || ''));
    const charsPerInch = w > 0 ? Number((cjkChars / w).toFixed(2)) : 0;
    const boxArea = w > 0 && h > 0 ? Number((w * h).toFixed(4)) : 0;
    const areaDensity = boxArea > 0 ? Number((text.length / boxArea).toFixed(2)) : 0;
    const qa = (currentVisualSystem().visualQA || {});
    const preferredBodyMin = Number(qa.preferredBodyMin || 8.8);
    const minRenderedCjkSize = Number(qa.minRenderedCjkSize || 7.2);
    const shrink = /shrink/i.test(String(fitStrategy || ''));
    const dense = charsPerInch > 18 || areaDensity > 95 || (h > 0 && h < 0.18 && cjkChars >= 10);
    const failRisk = cjkChars > 0 && shrink && (fontSize < minRenderedCjkSize || areaDensity > 130 || charsPerInch > 32);
    const reviewRisk = cjkChars > 0 && shrink && (fontSize < preferredBodyMin || dense);
    slide.__codexTextBoxes = slide.__codexTextBoxes || [];
    slide.__codexTextBoxes.push({
      role: role || textOpts.__typeRole || inputOpts.typeRole || inputOpts.textRole || '',
      originalFontSize: Number(inputOpts.fontSize || fontSize || 0),
      fontSize,
      fitStrategy: fitStrategy ? String(fitStrategy) : '',
      textLength: text.length,
      cjkChars,
      region: textRegionForBox(x, y),
      boxArea,
      box: {
        x,
        y,
        w,
        h
      },
      charsPerInch,
      areaDensity,
      shrinkRisk: Boolean(failRisk || reviewRisk),
      readabilityRiskLevel: failRisk ? 'fail' : (reviewRisk ? 'review' : ''),
      readabilityRiskReason: failRisk || reviewRisk
        ? 'shrink fit with dense or undersized CJK text'
        : '',
      sample: typeof compactText === 'function' ? compactText(text, 64) : text.slice(0, 64)
    });
  }

  return {
    recordTextBoxMeta
  };
}

module.exports = {
  TEXT_META_READINESS_FIELDS,
  createTextBoxMetaRecorder,
  textRegionForBox
};
