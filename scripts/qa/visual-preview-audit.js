const fs = require('fs');
const path = require('path');
const {
  pngAnalysis,
  pngInfo,
  previewSimilarityRisk
} = require('./png-analysis');

function buildPreviewReports(previewDir = '', slideCount = 0, qa = {}) {
  const findings = [];
  if (!previewDir) return { previewReports: [], findings };
  const previews = fs.existsSync(previewDir)
    ? fs.readdirSync(previewDir).filter(x => /\.png$/i.test(x)).sort().map(x => path.join(previewDir, x))
    : [];
  if (previews.length && previews.length !== slideCount) {
    findings.push({ level:'review', type:'previewCount', message:`preview count ${previews.length} differs from slide count ${slideCount}` });
  }
  if (!previews.length && qa.requirePreviewForFinal) {
    findings.push({ level:'review', type:'previewMissing', message:'preview PNGs missing; final visual review is incomplete' });
  }
  const previewReports = previews.map((p, i) => {
    const slideNo = slideNumberFromPreviewFile(p, i + 1);
    const info = pngAnalysis(p) || pngInfo(p);
    if (!info) findings.push({ slide:slideNo, level:'review', type:'previewUnreadable', message:path.basename(p) });
    else if (info.bytes < 12000) findings.push({ slide:slideNo, level:'review', type:'possiblyBlankPreview', message:`small preview file ${info.bytes} bytes` });
    else if (info.stddev != null && info.stddev < 3.2) findings.push({ slide:slideNo, level:'review', type:'lowVisualVariance', message:`preview may be blank or overly plain; stddev ${info.stddev}` });
    return { slide:slideNo, file:p, info };
  });
  for (let i=1; i<previewReports.length; i++) {
    const prevReport = previewReports[i-1];
    const curReport = previewReports[i];
    const prev = prevReport.info;
    const cur = curReport.info;
    const risk = previewSimilarityRisk(prev, cur);
    if (risk.similar) {
      findings.push({ slide:curReport.slide, level:'review', type:'slideSimilarity', message:`slide ${prevReport.slide} and ${curReport.slide} look too similar by preview hash (${risk.dist}/64)` });
    }
  }
  return { previewReports, findings };
}

function slideNumberFromPreviewFile(file = '', fallback = 1) {
  const base = path.basename(String(file || ''));
  const labeled = base.match(/(?:slide|page)\s*0*(\d+)/i);
  if (labeled) return Number(labeled[1]);
  const standalone = base.match(/(?:^|[^\d])0*(\d+)(?=[^\d]*\.png$)/i);
  return standalone ? Number(standalone[1]) : fallback;
}

module.exports = {
  buildPreviewReports,
  slideNumberFromPreviewFile
};
