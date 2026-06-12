function createIndustryKnowledgeAuditHelpers({
  contentSignals,
  industryKnowledgeBase,
  industryPackFor,
  normalizeDeckPlan,
  normalizeIndustryId,
  profileFromIndustryPack,
  routeKey,
  routeMatches,
  semanticMeaning,
  visualIndustryId
} = {}) {
  function recommendationForDepthDomain(domain = '', profile = {}) {
    const proof = (profile.proofObjects || []).find(item => item.depth === domain) || {};
    const generic = {
      depthDomain: domain,
      recommendedRoute: proof.route || 'report-board',
      proofObject: proof.id || '',
      fields: proof.fields || [],
      assetStrategy: 'use structured evidence fields first; request factual assets only when the page claims real product/site/screenshot/certificate proof'
    };
    if (domain === 'editorial-proof') {
      return Object.assign({}, generic, {
        recommendedRoute: 'report-board:editorial-proof-board',
        alternateRoutes: ['case-gallery:lookbook-story', 'cover:beauty-brand-editorial-cover'],
        proofObject: proof.id === 'beauty-brand-editorial-cover' ? 'editorial-proof-board' : (proof.id || 'editorial-proof-board'),
        suggestedPage: '产品/品牌/视觉证据页',
        fields: ['editorialProof', 'productStory', 'productItems', 'skuMatrix', 'consumerQuotes', 'reviews', 'informationGap'],
        assetStrategy: '真实产品图、平台截图或场景图缺失时进入资产决策；没有事实图时用 editorial-proof-board 承接结构化 SKU/消费者/平台证据或 information gap，不自动生成事实图'
      });
    }
    if (domain === 'channel-efficiency') {
      return Object.assign({}, generic, {
        suggestedPage: '渠道效率矩阵页',
        fields: proof.fields && proof.fields.length ? proof.fields : ['channelEfficiency', 'mediaEfficiency', 'channels', 'metrics']
      });
    }
    if (domain === 'cohort-system') {
      return Object.assign({}, generic, {
        suggestedPage: '会员/客群分层页',
        fields: proof.fields && proof.fields.length ? proof.fields : ['memberCohorts', 'cohorts', 'rfmLadder', 'metrics']
      });
    }
    if (domain === 'business-metric') {
      return Object.assign({}, generic, {
        suggestedPage: '经营指标/趋势/目标桥页',
        fields: proof.fields && proof.fields.length ? proof.fields : ['monthlyPulse', 'monthlyTrend', 'waterfallBridge', 'bridge', 'metrics']
      });
    }
    if (domain === 'growth-loop') {
      return Object.assign({}, generic, {
        suggestedPage: '行动闭环/增长飞轮页',
        fields: proof.fields && proof.fields.length ? proof.fields : ['flywheel', 'loopItems', 'phases', 'actions']
      });
    }
    return generic;
  }

  function industryKnowledgeProfile(plan = {}) {
    const id = normalizeIndustryId(plan.industry);
    const visualId = visualIndustryId(id);
    const packProfile = profileFromIndustryPack(industryPackFor(id));
    return industryKnowledgeBase[id] ||
      packProfile ||
      industryKnowledgeBase[visualId] ||
      profileFromIndustryPack(industryPackFor(visualId)) ||
      null;
  }

  function industryKnowledgeAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const profile = industryKnowledgeProfile(normalized);
    const slides = normalized.slides || [];
    if (!profile || !slides.length) return { industry: normalized.industry || '', covered: [], missingDomains: [], findings: [] };
    const covered = new Map();
    slides.forEach((slide, i) => {
      const signals = contentSignals(normalized, slide, i, slides.length);
      const meaning = semanticMeaning(normalized, slide, signals);
      const route = routeKey(slide);
      (meaning.proofCandidates || []).forEach(candidate => {
        if (candidate.score >= 3 || routeMatches(route, candidate.route) || slide.proofObject === candidate.id) {
          const prev = covered.get(candidate.id);
          if (!prev || prev.score < candidate.score) {
            covered.set(candidate.id, {
              id: candidate.id,
              route: candidate.route,
              depth: candidate.depth,
              slide: i + 1,
              score: candidate.score
            });
          }
        }
      });
      if (slide.proofObject) {
        const proof = (profile.proofObjects || []).find(p => p.id === slide.proofObject || String(p.route || '').endsWith(`:${slide.proofObject}`));
        if (proof && !covered.has(proof.id)) {
          covered.set(proof.id, { id: proof.id, route: proof.route, depth: proof.depth, slide: i + 1, score: 3 });
        }
      }
    });
    const coveredList = [...covered.values()];
    const domains = new Set(coveredList.map(p => p.depth).filter(Boolean));
    const pptTypeText = String((normalized.materialIntelligence && normalized.materialIntelligence.pptType) || normalized.ppt_type || normalized.pptType || normalized.title || '');
    const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i.test(pptTypeText);
    const gate = isCompanyIntro && normalized.industry === 'manufacturing-operations'
      ? { minProofObjects: 2, requiredDomains: ['system-map', 'operating-loop'] }
      : (profile.depthGates || { minProofObjects: 2, requiredDomains: [] });
    const minProofObjects = slides.length >= 10 ? Math.max(gate.minProofObjects || 2, 3) : (gate.minProofObjects || 2);
    const missingDomains = (gate.requiredDomains || []).filter(d => !domains.has(d));
    const findings = [];
    if (slides.length >= 7 && coveredList.length < minProofObjects) {
      findings.push({
        level: 'review',
        type: 'industryKnowledgeCoverage',
        message: `${profile.label} deck covers ${coveredList.length}/${minProofObjects} expected industry proof objects`
      });
    }
    if (slides.length >= 8 && missingDomains.length >= 1) {
      findings.push({
        level: 'review',
        type: 'industryDepthMissing',
        missingDomains,
        recommendations: missingDomains.map(domain => recommendationForDepthDomain(domain, profile)),
        message: `${profile.label} deck misses depth domains: ${missingDomains.join(', ')}`
      });
    }
    return {
      industry: normalized.industry || '',
      label: profile.label,
      narrativeArchetype: profile.narrativeArchetype,
      covered: coveredList,
      missingDomains,
      minProofObjects,
      findings
    };
  }

  return {
    industryKnowledgeAudit,
    industryKnowledgeProfile
  };
}

module.exports = {
  createIndustryKnowledgeAuditHelpers
};
