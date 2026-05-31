function createDeckPlanAuditHelpers({
  compositionAudit = () => [],
  contentOverlapAudit = () => [],
  contentSignals = () => ({}),
  flattenText = value => String(value || ''),
  hasCommercialLogicChain = () => false,
  industryExpressionRules = {},
  industryKnowledgeAudit = () => ({ findings: [] }),
  normalizeDeckPlan = plan => plan,
  productionCopyBans = [],
  routeKey = slide => String(slide.type || ''),
  routeMatches = (key, expected) => key === expected,
  visualAestheticModel = () => ({ findings: [] }),
  visualIndustryId = value => value
} = {}) {
  function visibleProductionCopyIssues(text = '') {
    return productionCopyBans
      .filter(re => re.test(String(text || '')))
      .map(re => String(re).replace(/^\/|\/[a-z]*$/g, ''));
  }

  function auditDeckPlan(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    const industry = normalized.industry || plan.industry || '';
    if (!slides.length) {
      findings.push({ level: 'fail', type: 'emptyPlan', message: 'deck plan has no slides' });
      return findings;
    }
    const keys = slides.map(routeKey);
    const rules = industryExpressionRules[industry] || industryExpressionRules[visualIndustryId(industry)];
    if (rules && slides.length >= 5 && !rules.requiredRoutes.some(route => keys.some(key => routeMatches(key, route)))) {
      findings.push({
        level: 'review',
        type: 'industryWeakExpression',
        message: `${industry} deck lacks a dedicated proof object route (${rules.proofObjects.join(', ')})`
      });
    }
    let streak = 1;
    for (let i = 1; i < keys.length; i++) {
      streak = keys[i] === keys[i - 1] ? streak + 1 : 1;
      if (streak >= 3 && !['case-gallery:evidence-board', 'metric-comparison'].includes(keys[i])) {
        findings.push({ slide: i + 1, level: 'review', type: 'templateRhythm', message: `three consecutive slides use ${keys[i]}` });
        break;
      }
    }
    const genericDefaults = slides.filter(s => s.layoutRationale === 'default commercial split');
    if (slides.length >= 6 && genericDefaults.length >= 2) {
      findings.push({ level: 'review', type: 'genericRoute', message: `${genericDefaults.length} slides fell back to the default commercial split` });
    }
    slides.forEach((slide, i) => {
      const visibleText = flattenText(slide);
      const copyIssues = visibleProductionCopyIssues(visibleText);
      if (copyIssues.length) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'productionNoteLeak',
          message: `visible slide copy contains production-note wording: ${copyIssues.join(', ')}`
        });
      }
      const generation = slide.assetGeneration || {};
      if (generation.status === 'blocked' && ((slide.visual && slide.visual.mode === 'generated') || slide.assetMode === 'generated')) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'unsafeGeneratedAssetRequest',
          message: generation.reason || 'generated asset request is not safe for this factual proof object'
        });
      }
      const signals = contentSignals(normalized, slide, i, slides.length);
      const captions = (Array.isArray(slide.cards) ? slide.cards.length : 0) +
        (Array.isArray(slide.items) ? slide.items.length : 0) +
        (Array.isArray(slide.lookbook) ? slide.lookbook.length : 0) +
        (Array.isArray(slide.productStory) ? slide.productStory.length : 0);
      if (signals.imageCount >= 3 && captions < Math.min(3, signals.imageCount)) {
        findings.push({ slide: i + 1, level: 'review', type: 'captionCoverage', message: 'image-heavy slide lacks enough captions or evidence labels' });
      }
      if ((slide.type === 'metric-comparison' || slide.type === 'industry-chart') && !hasCommercialLogicChain(slide)) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'metricBusinessLogic',
          message: 'metric/data slide needs a visible business chain: current state, gap/impact, cause, action, and success metric'
        });
      }
      if (
        slide.type === 'case-gallery' &&
        (slide.layoutVariant === 'evidence-board' || slide.variant === 'evidence-board') &&
        signals.imageCount >= 4
      ) {
        const evidenceItems = [
          ...(Array.isArray(slide.cards) ? slide.cards : []),
          ...(Array.isArray(slide.items) ? slide.items : [])
        ].filter(Boolean);
        const overBudget = evidenceItems.filter(item => {
          const title = typeof item === 'string' ? item : (item.title || item.label || item.name || '');
          const body = typeof item === 'string' ? '' : (item.body || item.note || item.text || item.description || '');
          return String(title).trim().length > 18 || String(body).trim().length > 30;
        });
        if (overBudget.length) {
          findings.push({
            slide: i + 1,
            level: 'review',
            type: 'evidenceCaptionBudget',
            message: `${overBudget.length} evidence captions exceed the evidence-board readability budget; use concise titles, short captions, or move detail into a source note`
          });
        }
      }
      const loopText = [slide.title, slide.centerTitle, slide.loopTitle].filter(Boolean).join(' ');
      const closedLoopOk = slide.type === 'timeline' || slide.layoutVariant === 'responsibility-loop' || slide.layoutVariant === 'flywheel' || slide.layoutVariant === 'closed-loop';
      const energyLoopOk = plan.industry === 'energy-utility' && ['module-matrix', 'metric-comparison'].includes(slide.type);
      if (/闭环|循环|能力环|loop|cycle/i.test(loopText) && !closedLoopOk && !energyLoopOk && !slide.centerTitle && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(slide.type)) {
        findings.push({ slide: i + 1, level: 'review', type: 'loopSemantics', message: 'loop language is present but the slide is not routed to a loop or responsibility grammar' });
      }
      if (slide.layoutVariant === 'risk-matrix' && !slide.matrix && (!Array.isArray(slide.rows) || slide.rows.length < 3)) {
        findings.push({ slide: i + 1, level: 'review', type: 'matrixCoordinates', message: 'risk matrix route needs matrix data or at least three positioned risks' });
      }
    });
    const last = slides[slides.length - 1] || {};
    const allVisibleText = flattenText({ title: plan.title, organization: plan.organization, contacts: plan.contacts, slides });
    const isCompanyIntro = /company-intro|公司介绍|能力介绍|企业介绍/i.test(String((plan.materialIntelligence && plan.materialIntelligence.pptType) || plan.ppt_type || plan.title || ''));
    const hasContactOrAction = Boolean(
      flattenText(plan.contacts || plan.contact || '').trim() ||
      flattenText(last.contacts || last.contact || last.actions || last.items || '').trim() ||
      /电话|邮箱|官网|地址|二维码|联系人|contact|www\.|@/i.test(allVisibleText)
    );
    if (isCompanyIntro && routeKey(last).startsWith('closing') && !hasContactOrAction) {
      findings.push({
        slide: slides.length,
        level: 'review',
        type: 'closingContactMissing',
        message: 'company-introduction closing needs contact details, website/QR code, address, or explicit next-step actions for external commercial use'
      });
    }
    const visibleSlideText = flattenText(slides);
    if (/第二页先|后续页面|后续再|本页仅|证明页优先|对比页优先|测试\s*closing|正式结束页用于/i.test(visibleSlideText)) {
      findings.push({
        level: 'fail',
        type: 'visibleProductionNote',
        message: 'visible slide copy contains production-note or test wording'
      });
    }
    if (isCompanyIntro && /潜在客户|采购与项目|产业合作伙伴|客户高层|内部评审对象|受众|audience/i.test(visibleSlideText)) {
      findings.push({
        level: 'review',
        type: 'externalMetaLeak',
        message: 'company-introduction deck exposes internal audience or review-positioning metadata; use company name/contact only for external delivery'
      });
    }
    const sensitiveCaseSignal = /特斯拉|中航|军工|中车|中船|客户名单|客户项目|logo|LOGO/i.test(allVisibleText);
    const review = plan.commercialReview || {};
    if (sensitiveCaseSignal && !review.customerCaseAuthorization && !review.customerNamesAuthorized && !review.publicAuthorizationConfirmed) {
      findings.push({
        level: 'review',
        type: 'customerCaseAuthorization',
        message: 'deck mentions customer/sensitive case evidence; confirm public-use authorization or desensitize before external delivery'
      });
    }
    visualAestheticModel(plan, normalized).findings.forEach(f => findings.push(f));
    industryKnowledgeAudit(plan, normalized).findings.forEach(f => findings.push(f));
    contentOverlapAudit(plan, normalized).forEach(f => findings.push(f));
    compositionAudit(plan, normalized).forEach(f => findings.push(f));
    return findings;
  }

  return {
    visibleProductionCopyIssues,
    auditDeckPlan
  };
}

module.exports = {
  createDeckPlanAuditHelpers
};
