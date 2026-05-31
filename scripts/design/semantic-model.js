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

  function dataGrammarVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const industry = plan.industry || '';
    const visualIndustry = visualIndustryId(industry);
    const isRetail = industry === 'brand-retail' || industry === 'beauty-consumer' || visualIndustry === 'brand-retail';
    const text = flattenText(s);
    const dataComponent = String(s.dataComponent || s.data_component || s.proofObject || s.proof_object || '').toLowerCase();
    if (hasValueField(s, ['waterfallBridge', 'targetBridge']) || /waterfall|bridge|target-?bridge|目标桥|目标差额|缺口/.test(dataComponent)) return 'waterfall-bridge';
    if (hasValueField(s, ['monthlyPulse', 'monthlyTrend']) || /monthly|trend|pulse|line|月度|趋势|脉冲/.test(dataComponent)) return 'monthly-pulse-trend';
    if (hasValueField(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels']) || /scatter|bubble|efficiency|channel|media|roas|roi|渠道|投放/.test(dataComponent)) return 'channel-efficiency-matrix';
    if (isRetail && /投放|花费|ROAS|ROI|渠道|搜索|广告|抖音|小红书|KOC|KOL|通勤防晒|media efficiency/i.test(text)) return 'channel-efficiency-matrix';
    if (isRetail && /月度|月脉冲|低谷|1月|2月|3月|一月|二月|三月|环比|同比|趋势|拉回来|monthly|pulse/i.test(text)) return 'monthly-pulse-trend';
    if (isRetail && /目标差额|目标桥|增长桥|缺口|Q2目标|净销|GMV|退款|实收|导出GMV|财务净销|waterfall|bridge/i.test(text)) return 'waterfall-bridge';
    return '';
  }

  function industryChartVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const industry = plan.industry || '';
    const visualIndustry = visualIndustryId(industry);
    const text = flattenText(s);
    const grammarVariant = dataGrammarVariant(plan, s, signals);
    if (grammarVariant) return grammarVariant;
    const chartProof = industryProofCandidates(plan, s, signals)
      .find(p => String(p.route || '').startsWith('industry-chart:') && p.score >= 3);
    if (chartProof) return String(chartProof.route).split(':')[1] || chartProof.id;
    if (hasValueField(s, ['downtimePareto', 'pareto', 'lossPareto', 'oeeLosses']) || /停机.*(Pareto|帕累托|TOP|排行)|故障.*(Pareto|帕累托)|节拍损失|OEE.*损失/i.test(text)) return 'downtime-pareto';
    if (hasValueField(s, ['valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity']) || /敏感性|估值矩阵|退出情景|IRR.*DPI|valuation sensitivity|scenario/i.test(text)) return 'valuation-sensitivity';
    if (hasValueField(s, ['qualityHandoff', 'handoffs', 'handoffMap']) || /交接|handoff|护理交接|科室交接|质量交接/i.test(text)) return 'quality-handoff';
    if (hasValueField(s, ['patientBottlenecks', 'waitBottlenecks']) || /等待瓶颈|排队瓶颈|患者等待|候诊|bottleneck/i.test(text)) return 'patient-bottleneck';
    if (hasValueField(s, ['memberCohorts', 'cohorts', 'rfmLadder']) || /会员分层|RFM| cohort|复购阶梯|客群阶梯/i.test(text)) return 'member-cohort-ladder';
    if (hasValueField(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'])) return 'channel-efficiency-matrix';
    if (hasValueField(s, ['monthlyPulse', 'monthlyTrend', 'trend'])) return 'monthly-pulse-trend';
    if (hasValueField(s, ['waterfallBridge', 'targetBridge'])) return 'waterfall-bridge';
    if (hasValueField(s, ['dispatchMap', 'siteDispatch', 'loadStorageDispatch']) || /调度地图|站点调度|负荷.*储能|SOC|dispatch/i.test(text)) return 'dispatch-map';
    if (hasValueField(s, ['adoptionFunnel', 'activationFunnel', 'cohortFunnel']) || /采用漏斗|激活漏斗|扩展漏斗|activation funnel|adoption funnel/i.test(text)) return 'adoption-funnel';
    if (industry === 'manufacturing-operations' && signals.hasOeeBoard) return 'downtime-pareto';
    if (industry === 'finance-investment' && signals.isNumberHeavy) return 'valuation-sensitivity';
    if (industry === 'healthcare-operations' && signals.hasServiceBlueprint) return 'quality-handoff';
    if ((industry === 'brand-retail' || industry === 'beauty-consumer' || visualIndustry === 'brand-retail') && /会员|复购|RFM|cohort/i.test(text)) return 'member-cohort-ladder';
    if (industry === 'energy-utility' && /站点|电站|储能|告警/i.test(text)) return 'dispatch-map';
    if (industry === 'saas-technology' && /采用|激活|留存|NRR|ARR/i.test(text)) return 'adoption-funnel';
    return 'evidence-readout';
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
    if (/pareto|帕累托|敏感性|交接|瓶颈|调度|漏斗|cohort|funnel|dispatch|sensitivity|handoff|roas|roi|投放|渠道|月度|低谷|趋势|目标桥|目标差额|waterfall|bridge/i.test(lower)) scores.industryChart += 3;
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
      if (primaryIntent === 'industryChart') return variant;
      if (meaning.bestProofObject && ((meaning.proofCandidates[0] || {}).score >= 3)) return meaning.bestProofObject;
      if (signals.hasOeeBoard) return 'OEE';
      if (signals.hasServiceBlueprint) return 'service-blueprint';
      if (signals.hasSaasCapability) return 'platform-capability-map';
      if (signals.hasLookbook) return 'lookbook';
      if (signals.hasCaseComparison) return 'before-after-evidence';
      if (signals.hasGallery) return 'evidence-gallery';
      if (signals.hasMetrics) return 'metric-board';
      if (signals.hasResponsibilityLoop) return 'responsibility-loop';
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
