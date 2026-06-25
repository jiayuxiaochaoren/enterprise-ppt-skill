const {
  createSemanticChartVariantHelpers
} = require('./semantic-chart-variants');
const {
  createSemanticProofCandidateHelpers
} = require('./semantic-proof-candidates');
const {
  normalizeActionLoopProof,
  normalizeProofObject
} = require('./proof-taxonomy');

function createSemanticModelHelpers(deps = {}) {
  const {
    contentSignals,
    flattenText,
    hasArrayField,
    hasValueField,
    industryKnowledgeProfile,
    matchKeywordList,
    semanticRelationPatterns = {},
    visualIndustryId
  } = deps;

  const {
    fieldHitScore,
    industryProofCandidates,
    semanticRelationProfile
  } = createSemanticProofCandidateHelpers({
    contentSignals,
    flattenText,
    industryKnowledgeProfile,
    matchKeywordList,
    semanticRelationPatterns
  });
  const {
    dataGrammarVariant,
    industryChartVariant
  } = createSemanticChartVariantHelpers({
    contentSignals,
    flattenText,
    hasValueField,
    industryProofCandidates,
    visualIndustryId
  });

  function semanticMeaning(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const profile = industryKnowledgeProfile(plan);
    const text = flattenText(s);
    const entityMatches = {};
    if (profile && profile.entities) {
      Object.entries(profile.entities).forEach(([type, keywords]) => {
        const hits = matchKeywordList(text, keywords).slice(0, 8);
        if (hits.length) entityMatches[type] = hits;
      });
    }
    const relations = semanticRelationProfile(text);
    const proofCandidates = industryProofCandidates(plan, s, signals);
    const bestProof = proofCandidates[0] || null;
    const entityCount = Object.values(entityMatches).reduce((sum, hits) => sum + hits.length, 0);
    const relationCount = Object.values(relations).filter(Boolean).length;
    const claimText = String(s.claim || s.subtitle || s.title || '').trim();
    const evidenceSignals = [
      signals.hasMetrics,
      signals.hasGallery || signals.hasCaseComparison,
      signals.hasRisk || signals.hasResponsibilityLoop,
      Boolean(bestProof && bestProof.score >= 3),
      relations.evidence
    ].filter(Boolean).length;
    const actionSignals = [
      Boolean(s.decision || s.summary),
      Array.isArray(s.actions) && s.actions.length > 0,
      relations.decision,
      relations.ownership
    ].filter(Boolean).length;
    const claimStrength = Math.min(1, (claimText.length >= 10 ? 0.35 : 0) + (claimText.length >= 22 ? 0.2 : 0) + Math.min(0.45, evidenceSignals * 0.15));
    const evidenceStrength = Math.min(1, evidenceSignals * 0.2 + Math.min(0.3, (bestProof ? bestProof.score : 0) / 18));
    const actionability = Math.min(1, actionSignals * 0.25 + (entityMatches.actor ? 0.2 : 0));
    const semanticDensity = Math.min(1, (entityCount * 0.05) + (relationCount * 0.12) + (signals.numbers * 0.025) + (signals.imageCount * 0.04));
    const industryFit = Math.min(1, (entityCount * 0.07) + (bestProof ? Math.min(0.45, bestProof.score / 18) : 0) + (profile ? 0.08 : 0));
    const materialPurpose = bestProof ? 'industry-proof' :
      (relations.decision ? 'decision' :
        (relations.cause || relations.dependency ? 'logic' :
          (relations.evidence || signals.hasGallery ? 'evidence' :
            (signals.hasMetrics ? 'metric' : 'narrative'))));
    return {
      industry: plan.industry || '',
      profileLabel: profile ? profile.label : '',
      narrativeArchetype: profile ? profile.narrativeArchetype : '',
      entities: entityMatches,
      relations,
      proofCandidates,
      bestProofObject: bestProof ? bestProof.id : '',
      bestProofRoute: bestProof ? bestProof.route : '',
      materialPurpose,
      scores: {
        claimStrength: Number(claimStrength.toFixed(2)),
        evidenceStrength: Number(evidenceStrength.toFixed(2)),
        actionability: Number(actionability.toFixed(2)),
        semanticDensity: Number(semanticDensity.toFixed(2)),
        industryFit: Number(industryFit.toFixed(2))
      }
    };
  }

  function semanticFrame(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const text = flattenText(s);
    const lower = text.toLowerCase();
    const meaning = semanticMeaning(plan, s, signals);
    const scores = {
      product: 0,
      caseEvidence: 0,
      governance: 0,
      process: 0,
      architecture: 0,
      decision: 0,
      metric: 0,
      logicChain: 0,
      industryChart: 0
    };
    if (s.product || hasArrayField(s, ['products'])) scores.product += 5;
    if (signals.hasProductShowcase) scores.product += 3;
    if (signals.hasGallery || signals.hasCaseSignal || signals.hasCaseComparison) scores.caseEvidence += 4;
    if (signals.imageCount >= 3) scores.caseEvidence += 2;
    if (signals.hasGovernance || signals.hasRisk || signals.hasResponsibilityLoop) scores.governance += 4;
    if (signals.hasTimeline || signals.hasLoop || signals.hasFlywheel) scores.process += 4;
    if (signals.hasArchitecture || signals.layerCount >= 3) scores.architecture += 4;
    if (signals.last || s.decision || s.summary || hasArrayField(s, ['actions'])) scores.decision += 3;
    if (signals.hasMetrics || signals.isNumberHeavy) scores.metric += 4;
    if (signals.hasLogicChain || signals.hasStructuredLogic || signals.hasNamedLogicChain) scores.logicChain += 4;
    if (hasValueField(s, [
      'downtimePareto',
      'pareto',
      'lossPareto',
      'oeeLosses',
      'reviewSentiment',
      'valuationSensitivity',
      'sensitivity',
      'exitScenarios',
      'irrSensitivity',
      'qualityHandoff',
      'handoffs',
      'handoffMap',
      'patientBottlenecks',
      'waitBottlenecks',
      'memberCohorts',
      'cohorts',
      'rfmLadder',
      'channelEfficiency',
      'mediaEfficiency',
      'scatter',
      'channels',
      'monthlyPulse',
      'monthlyTrend',
      'trend',
      'waterfallBridge',
      'targetBridge',
      'dispatchMap',
      'siteDispatch',
      'loadStorageDispatch',
      'adoptionFunnel',
      'activationFunnel',
      'cohortFunnel'
    ])) scores.industryChart += 8;
    if (/pareto|帕累托|敏感性|交接|瓶颈|调度|漏斗|评论|评价|反馈主题|cohort|funnel|dispatch|sensitivity|handoff|roas|roi|投放|渠道|月度|低谷|趋势|目标桥|目标差额|waterfall|bridge/i.test(lower)) scores.industryChart += 3;
    if (dataGrammarVariant(plan, s, signals)) scores.industryChart += 4;
    if (meaning.relations.evidence) scores.caseEvidence += 1.5;
    if (meaning.relations.cause || meaning.relations.dependency) scores.logicChain += 1.5;
    if (meaning.relations.ownership) scores.governance += 1.5;
    if (meaning.relations.decision) scores.decision += 1.5;
    if (meaning.scores.evidenceStrength >= 0.45) scores.metric += 0.8;
    if (meaning.bestProofRoute && String(meaning.bestProofRoute).startsWith('industry-chart:')) scores.industryChart += Math.min(6, Math.max(2, (meaning.proofCandidates[0] || {}).score || 0));
    else if (meaning.bestProofObject) {
      const route = String(meaning.bestProofRoute || '');
      if (route.startsWith('architecture:')) scores.architecture += 2;
      if (route.startsWith('timeline:')) scores.process += 2;
      if (route.startsWith('risk-table:')) scores.governance += 2;
      if (route.startsWith('case-gallery:')) scores.caseEvidence += 2;
      if (route.startsWith('metric-comparison:') || route === 'finance-bridge' || route === 'portfolio-table') scores.metric += 2;
    }

    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [primaryIntent, topScore] = ranked[0] || ['unknown', 0];
    const variant = industryChartVariant(plan, s, signals);
    const proofObject = (() => {
      if (primaryIntent === 'industryChart') return normalizeProofObject(variant, {
        industry: plan.industry || '',
        text,
        proofIntent: s.proofIntent || s.proof_intent,
        displayCopy: s.displayCopy || s.display_copy,
        slide: s,
        signals
      });
      if (meaning.bestProofObject && ((meaning.proofCandidates[0] || {}).score >= 3)) return meaning.bestProofObject;
      if (signals.hasOeeBoard) return 'OEE';
      if (signals.hasServiceBlueprint) return 'service-blueprint';
      if (signals.hasSaasCapability) return 'platform-capability-map';
      if (signals.hasLookbook) return 'lookbook';
      if (signals.hasCaseComparison) return 'before-after-evidence';
      if (signals.hasGallery) return 'evidence-gallery';
      if (signals.hasMetrics) return 'metric-board';
      if (signals.hasResponsibilityLoop) return normalizeActionLoopProof('', {
        industry: plan.industry || '',
        text,
        proofIntent: s.proofIntent || s.proof_intent,
        displayCopy: s.displayCopy || s.display_copy,
        slide: s,
        signals
      });
      if (signals.hasLogicChain) return 'logic-chain';
      return primaryIntent === 'unknown' ? 'narrative-block' : primaryIntent;
    })();
    return {
      primaryIntent: topScore > 0 ? primaryIntent : 'narrative',
      secondaryIntents: ranked.filter(([, score]) => score > 0).slice(1, 4).map(([name]) => name),
      confidence: Math.min(1, Number((topScore / 8).toFixed(2))),
      proofObject,
      industryChartVariant: variant,
      semanticMeaning: meaning,
      scores
    };
  }

  return {
    dataGrammarVariant,
    fieldHitScore,
    industryChartVariant,
    industryProofCandidates,
    semanticFrame,
    semanticMeaning,
    semanticRelationProfile
  };
}

module.exports = {
  createSemanticModelHelpers
};
