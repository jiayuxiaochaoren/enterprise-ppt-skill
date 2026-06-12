function createSemanticProofCandidateHelpers(deps = {}) {
  const {
    contentSignals,
    flattenText,
    industryKnowledgeProfile,
    matchKeywordList,
    semanticRelationPatterns = {}
  } = deps;

  function fieldHitScore(s = {}, fields = []) {
    return fields.reduce((score, field) => {
      const value = s[field];
      if (Array.isArray(value)) return score + (value.length ? 4 : 0);
      return score + (value != null && value !== false && value !== '' ? 4 : 0);
    }, 0);
  }

  function industryProofCandidates(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const profile = industryKnowledgeProfile(plan);
    if (!profile || !Array.isArray(profile.proofObjects)) return [];
    const text = flattenText(s);
    return profile.proofObjects
      .map(proof => {
        const fieldScore = fieldHitScore(s, proof.fields || []);
        const keywordHits = matchKeywordList(text, proof.keywords || []);
        let score = fieldScore + keywordHits.length * 1.8;
        if (signals.hasMetrics && /metric|scorecard|bridge|analysis|model/i.test(proof.depth || '')) score += 1.2;
        if (signals.hasGallery && /proof|evidence|editorial|product/i.test(proof.depth || '')) score += 1.2;
        if (signals.hasLoop && /loop|control|governance/i.test(proof.depth || '')) score += 1.2;
        if (signals.hasArchitecture && /map|architecture|system/i.test(proof.depth || '')) score += 1.2;
        return Object.assign({}, proof, {
          score: Number(score.toFixed(2)),
          fieldScore,
          keywordHits
        });
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function semanticRelationProfile(text = '') {
    return Object.entries(semanticRelationPatterns).reduce((acc, [name, pattern]) => {
      acc[name] = pattern.test(text);
      return acc;
    }, {});
  }

  return {
    fieldHitScore,
    industryProofCandidates,
    semanticRelationProfile
  };
}

module.exports = {
  createSemanticProofCandidateHelpers
};
