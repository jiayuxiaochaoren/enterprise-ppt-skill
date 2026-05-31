function createAcceptanceAuditHelpers({
  assetAuthorizationGate = () => ({ status: 'clear', findings: [] }),
  auditDeckPlan = () => [],
  chartAcceptanceGate = () => ({}),
  chartEvidenceQA = () => ({ findings: [] }),
  chartSemanticQA = () => ({ findings: [] }),
  chartVisualQA = () => ({ findings: [] }),
  componentPlanAudit = () => ({ findings: [] }),
  compositionAudit = () => [],
  evidenceAudit = () => ({ findings: [] }),
  industryFitAudit = () => ({ findings: [] }),
  industryKnowledgeAudit = () => ({ findings: [] }),
  normalizeDeckPlan = plan => plan,
  pageCountAudit = () => ({ findings: [] }),
  pageLevelChartScores = () => [],
  reportDepthAudit = () => ({ findings: [] }),
  sourceTraceAudit = () => ({ status: 'pass', findings: [] }),
  visualAestheticModel = () => ({ findings: [] })
} = {}) {
  function acceptanceAudit(plan = {}, normalizedPlan = null, options = {}) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const renderMeta = options.renderMeta || null;
    const previewReports = Array.isArray(options.previewReports) ? options.previewReports : [];
    const deckFindings = auditDeckPlan(plan, normalized);
    const compositionFindings = compositionAudit(plan, normalized);
    const knowledge = industryKnowledgeAudit(plan, normalized);
    const aesthetic = visualAestheticModel(plan, normalized);
    const reportDepth = reportDepthAudit(plan, normalized);
    const evidence = evidenceAudit(plan, normalized);
    const pageCount = pageCountAudit(plan, normalized);
    const componentPlan = componentPlanAudit(plan, normalized);
    const industryFit = industryFitAudit(plan, normalized);
    const chartSemantic = chartSemanticQA(plan, normalized);
    const chartVisual = chartVisualQA(plan, normalized, renderMeta);
    const chartEvidence = chartEvidenceQA(plan, normalized);
    const pageChartScores = pageLevelChartScores(plan, normalized, renderMeta);
    const chartGate = chartAcceptanceGate(plan, normalized, renderMeta, {
      previewReports,
      requireContactSheet: options.requireContactSheet === true,
      strict: options.strict === true
    });
    const checks = [
      {
        id: 'report-depth',
        label: '报告深度 QA',
        description: '是否像一份报告，而不是模板页面展示。',
        findings: reportDepth.findings
      },
      {
        id: 'evidence',
        label: 'Evidence QA',
        description: '每页 proof object 是否真实、可解释，并区分生成示意图。',
        findings: evidence.findings
      },
      {
        id: 'page-count',
        label: '页数 QA',
        description: '是否符合用户指定页数或 targetSlides contract。',
        findings: pageCount.findings
      },
      {
        id: 'component-plan',
        label: '组件计划 QA',
        description: '每页是否输出可执行组件组合，而不是只选择页面类型。',
        findings: componentPlan.findings
      },
      {
        id: 'chart-semantic',
        label: 'Chart Semantic QA',
        description: '图表类型是否匹配数据结构，避免假趋势、假瀑布和假漏斗。',
        findings: chartSemantic.findings
      },
      {
        id: 'chart-visual',
        label: 'Chart Visual QA',
        description: '图表是否有轴标签、单位、来源和可读标签。',
        findings: chartVisual.findings.filter(f => f.level === 'fail')
      },
      {
        id: 'chart-evidence',
        label: 'Chart Evidence QA',
        description: '图表是否可追溯到 proof object 和真实/生成证据模式。',
        findings: chartEvidence.findings
      },
      {
        id: 'industry-customization',
        label: '行业定制 QA',
        description: '是否像这个行业，而不是通用模板换字。',
        findings: [
          ...deckFindings.filter(f => ['industryWeakExpression'].includes(f.type)),
          ...(knowledge.findings || []),
          ...(industryFit.findings || []),
          ...aesthetic.findings.filter(f => ['visualTemplateFatigue', 'commercialLogicThin'].includes(f.type))
        ]
      },
      {
        id: 'layout-repetition',
        label: '布局重复 QA',
        description: '连续页面是否重复同一种卡片/结构。',
        findings: [
          ...deckFindings.filter(f => ['templateRhythm', 'genericRoute'].includes(f.type)),
          ...compositionFindings.filter(f => ['adjacentLayoutSimilarity', 'compositionTooGeneric', 'flatPageRhythm'].includes(f.type)),
          ...aesthetic.findings.filter(f => f.type === 'visualTemplateFatigue')
        ]
      },
      {
        id: 'semantic-color',
        label: '色彩语义 QA',
        description: '主色是否承担 brand/evidence/risk/action/data，而不是乱点缀。',
        findings: compositionFindings.filter(f => ['semanticColorMismatch', 'accentOnlyAsThinLine'].includes(f.type))
      },
      {
        id: 'image-evidence',
        label: '图片证据 QA',
        description: '图片是否有证明作用，还是只是好看。',
        findings: [
          ...deckFindings.filter(f => ['captionCoverage', 'weakImageTreatment', 'unsafeGeneratedAssetRequest'].includes(f.type)),
          ...aesthetic.findings.filter(f => ['evidenceRelationshipWeak'].includes(f.type))
        ]
      }
    ].map(check => Object.assign({}, check, {
      status: check.findings.some(f => f.level === 'fail') ? 'fail' : (check.findings.length ? 'review' : 'pass')
    }));
    return {
      version: 'acceptance-audit/v1',
      industry: normalized.industry || plan.industry || '',
      slideCount: slides.length,
      status: checks.some(c => c.status === 'fail') ? 'fail' : (checks.some(c => c.status === 'review') ? 'review' : 'pass'),
      checks,
      reportDepth,
      evidence,
      pageCount,
      componentPlan,
      industryFit,
      chartSemantic,
      chartVisual,
      chartEvidence,
      chartGate,
      pageChartScores,
      findings: checks.flatMap(check => check.findings.map(f => Object.assign({ qa: check.id }, f)))
    };
  }

  function commercialReadinessAudit(plan = {}, normalizedPlan = null, extraFindings = [], options = {}) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const acceptance = acceptanceAudit(plan, normalized, options);
    const sourceTrace = sourceTraceAudit(plan, normalized);
    const assetGate = assetAuthorizationGate(plan, normalized);
    const findings = [
      ...(acceptance.findings || []),
      ...(sourceTrace.findings || []).map(f => Object.assign({ qa: 'source-trace' }, f)),
      ...(assetGate.findings || []).map(f => Object.assign({ qa: 'asset-authorization' }, f)),
      ...extraFindings
    ];
    const failTypes = new Set(findings.filter(f => f.level === 'fail').map(f => f.type));
    const reviewTypes = new Set(findings.filter(f => f.level !== 'fail').map(f => f.type));
    let level = 'client-review';
    let canExternalShare = true;
    const reasons = [];
    if (
      failTypes.size ||
      assetGate.status === 'needs_authorization' ||
      failTypes.has('sourceTraceMissing') ||
      failTypes.has('sourceTraceNotExplainable') ||
      failTypes.has('assetAuthorizationBlocked') ||
      failTypes.has('assetAuthorizationUnresolved') ||
      failTypes.has('productionNoteLeak') ||
      failTypes.has('placeholderText') ||
      failTypes.has('generatedEvidenceMisclassified')
    ) {
      level = 'client-final-blocked';
      canExternalShare = false;
      reasons.push('blocking QA finding, unresolved authorization, or unexplained source trace');
    } else if (
      reviewTypes.has('assetAuthorizationUnknown') ||
      reviewTypes.has('customerCaseAuthorization') ||
      reviewTypes.has('externalMetaLeak') ||
      (plan.commercialReview && Array.isArray(plan.commercialReview.openRisks) && plan.commercialReview.openRisks.length)
    ) {
      level = 'internal-ready';
      canExternalShare = false;
      reasons.push('usable internally, but external sharing still needs risk or authorization clearance');
    } else if (
      reviewTypes.has('visualTemplateFatigue') ||
      reviewTypes.has('aestheticScore') ||
      reviewTypes.has('themeIntentVarietyLow') ||
      reviewTypes.has('industryKnowledgeCoverage')
    ) {
      level = 'draft';
      canExternalShare = false;
      reasons.push('content is structurally valid but visual/story craft needs another iteration');
    } else {
      reasons.push('no blocking QA, source trace is explainable, and asset authorization gate is clear');
    }
    return {
      version: 'commercial-readiness/v1',
      level,
      canExternalShare,
      allowedUse: level === 'client-review'
        ? 'client-review'
        : (level === 'internal-ready' ? 'internal-only' : (level === 'draft' ? 'draft-only' : 'blocked')),
      scale: ['draft', 'internal-ready', 'client-review', 'client-final-blocked'],
      reasons,
      failTypes: [...failTypes],
      reviewTypes: [...reviewTypes],
      acceptanceStatus: acceptance.status,
      sourceTraceStatus: sourceTrace.status,
      assetAuthorizationStatus: assetGate.status,
      findings
    };
  }

  return {
    acceptanceAudit,
    commercialReadinessAudit
  };
}

module.exports = {
  createAcceptanceAuditHelpers
};
