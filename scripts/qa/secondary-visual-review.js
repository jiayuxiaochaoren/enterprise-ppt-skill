const {
  previewSimilarityRisk
} = require('./png-analysis');

function findingsFromPreviewSimilarity(previews = []) {
  const out = [];
  for (let i = 1; i < previews.length; i++) {
    const prev = previews[i - 1].info;
    const cur = previews[i].info;
    const risk = previewSimilarityRisk(prev, cur);
    if (risk.similar) {
      out.push({ slide:i + 1, level:'review', type:'contactSheetRhythmRepeat', message:`adjacent previews ${i} and ${i + 1} are visually too similar (${risk.dist}/64)` });
    }
  }
  return out;
}

function secondaryVisualReview(normalized = {}, aesthetic = null, previews = []) {
  const slides = normalized.slides || [];
  const findings = [];
  const routeCounts = {};
  const densityCounts = {};
  slides.forEach(slide => {
    const route = slide.layoutVariant ? `${slide.type}:${slide.layoutVariant}` : (slide.type || 'unknown');
    routeCounts[route] = (routeCounts[route] || 0) + 1;
    const density = slide.visualDensity || (slide.compositionPlan && (slide.compositionPlan.visualDensity || slide.compositionPlan.density)) || 'unset';
    densityCounts[density] = (densityCounts[density] || 0) + 1;
  });
  const repeatedRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  if (slides.length >= 6 && repeatedRoute[1] / slides.length > 0.45) {
    findings.push({
      level: 'review',
      type: 'repeatedComposition',
      message: `${repeatedRoute[1]}/${slides.length} slides use ${repeatedRoute[0]}`
    });
  }
  const slideScores = aesthetic && Array.isArray(aesthetic.slides) ? aesthetic.slides : [];
  const lowRhythm = slideScores.filter(s => (s.dimensions || {}).rhythm < 82).length;
  const lowBrand = slideScores.filter(s => (s.dimensions || {}).industryFit < 82).length;
  const lowDensity = slideScores.filter(s => (s.dimensions || {}).densityControl < 82).length;
  const lowEvidenceRelation = slideScores.filter(s => (s.dimensions || {}).evidenceRelationship < 82).length;
  if (lowRhythm >= 2) findings.push({ level:'review', type:'pageRhythmWeak', message:`${lowRhythm} slides need stronger page rhythm` });
  if (lowBrand >= 2) findings.push({ level:'review', type:'brandAdaptationWeak', message:`${lowBrand} slides have weak industry/brand fit` });
  if (lowDensity >= 2) findings.push({ level:'review', type:'densityControlWeak', message:`${lowDensity} slides need density tuning` });
  if (lowEvidenceRelation >= 2) findings.push({ level:'review', type:'imageTextRelationshipWeak', message:`${lowEvidenceRelation} slides need clearer image-text evidence relationship` });
  const similarPreviewFindings = findingsFromPreviewSimilarity(previews);
  similarPreviewFindings.forEach(f => findings.push(f));
  return {
    version: 'secondary-visual-review/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    dimensions: {
      pageRhythm: lowRhythm ? 'review' : 'pass',
      repeatedComposition: repeatedRoute[1] > 1 ? 'checked' : 'pass',
      brandAdaptation: lowBrand ? 'review' : 'pass',
      density: lowDensity ? 'review' : 'pass',
      imageTextRelationship: lowEvidenceRelation ? 'review' : 'pass'
    },
    routeCounts,
    densityCounts,
    findings
  };
}

module.exports = {
  findingsFromPreviewSimilarity,
  secondaryVisualReview
};
