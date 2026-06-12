function createIndustryEvidenceChainShapeHelpers(deps = {}) {
  const {
    compactUnique,
    coveragePolicyShapeIssues,
    hasFieldPath,
    normalizeKey,
    normalizeStageCoveragePolicy,
    proofObjectIdForSlide,
    version
  } = deps;

  function neutralEvidenceChain(reason = 'industry evidence chain was not inferred') {
    return {
      version,
      industry: 'neutral-general',
      chainId: 'neutral-general',
      chainLabel: '通用/中性',
      stage: 'neutral',
      stageId: 'neutral-general',
      stageLabel: 'neutral/general',
      position: 0,
      confidence: 'neutral',
      components: [],
      coveragePolicy: normalizeStageCoveragePolicy({ components: [] }),
      avoidComponents: [],
      matchedFields: [],
      matchedKeywords: [],
      matchedProofObjects: [],
      matchedRoutes: [],
      evidenceReasons: [reason],
      requiresCaption: false,
      requiresSource: false
    };
  }

  function nativeProcessOrTimelineSlide(slide = {}) {
    const type = normalizeKey(slide.type);
    const routeText = normalizeKey([
      slide.layoutVariant || slide.layout_variant || slide.variant,
      proofObjectIdForSlide(slide),
      slide.dataComponent || slide.data_component
    ].filter(Boolean).join(' '));
    const nativeProcessRoute = ['timeline', 'timeline-dark'].includes(type) ||
      /process-rail|workflow-rail|closed-loop|operating-path|milestone|timeline/.test(routeText);
    if (!nativeProcessRoute) return false;
    return [
      'phases',
      'actions',
      'steps',
      'timeline',
      'milestones',
      'loopItems',
      'workflows',
      'workflow'
    ].some(field => hasFieldPath(slide, field));
  }

  function normalizeIndustryEvidenceChainShape(chain = null) {
    if (!chain || typeof chain !== 'object' || Array.isArray(chain)) return null;
    const coveragePolicy = normalizeStageCoveragePolicy({
      coveragePolicy: chain.coveragePolicy || chain.coverage_policy,
      components: chain.components
    });
    return Object.assign({}, chain, {
      version: chain.version || version,
      chainId: String(chain.chainId || '').trim(),
      chainLabel: chain.chainLabel || '',
      stageId: String(chain.stageId || '').trim(),
      stageLabel: chain.stageLabel || '',
      components: compactUnique(Array.isArray(chain.components) ? chain.components : coveragePolicy.components),
      coveragePolicy,
      avoidComponents: compactUnique(Array.isArray(chain.avoidComponents) ? chain.avoidComponents : []),
      matchedFields: compactUnique(Array.isArray(chain.matchedFields) ? chain.matchedFields : []),
      matchedKeywords: compactUnique(Array.isArray(chain.matchedKeywords) ? chain.matchedKeywords : []),
      matchedProofObjects: compactUnique(Array.isArray(chain.matchedProofObjects) ? chain.matchedProofObjects : []),
      matchedRoutes: compactUnique(Array.isArray(chain.matchedRoutes) ? chain.matchedRoutes : []),
      evidenceReasons: compactUnique(Array.isArray(chain.evidenceReasons) ? chain.evidenceReasons : [])
    });
  }

  function industryEvidenceChainShapeIssues(chain = null) {
    const issues = [];
    if (!chain || typeof chain !== 'object' || Array.isArray(chain)) {
      return ['industryEvidenceChain must be an object'];
    }
    if (!String(chain.chainId || '').trim()) issues.push('missing chainId');
    if (!String(chain.stageId || '').trim()) issues.push('missing stageId');
    ['components', 'matchedFields', 'matchedProofObjects'].forEach(field => {
      if (!Array.isArray(chain[field])) issues.push(`${field} must be an array`);
    });
    const coveragePolicy = chain.coveragePolicy != null ? chain.coveragePolicy : chain.coverage_policy;
    if (coveragePolicy != null && (typeof coveragePolicy !== 'object' || Array.isArray(coveragePolicy))) {
      issues.push('coveragePolicy must be an object when present');
    } else if (coveragePolicy) {
      issues.push(...coveragePolicyShapeIssues(coveragePolicy));
    }
    ['matchedKeywords', 'matchedRoutes', 'evidenceReasons'].forEach(field => {
      if (chain[field] != null && !Array.isArray(chain[field])) issues.push(`${field} must be an array when present`);
    });
    return issues;
  }

  function chainsShareIdentity(a = null, b = null) {
    return Boolean(a && b && a.chainId && b.chainId && a.stageId && b.stageId &&
      a.chainId === b.chainId &&
      a.stageId === b.stageId);
  }

  return {
    chainsShareIdentity,
    industryEvidenceChainShapeIssues,
    nativeProcessOrTimelineSlide,
    neutralEvidenceChain,
    normalizeIndustryEvidenceChainShape
  };
}

module.exports = { createIndustryEvidenceChainShapeHelpers };
