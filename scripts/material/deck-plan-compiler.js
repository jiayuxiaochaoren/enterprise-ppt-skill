const {
  assetAuthorizationGate,
  inferDeckLanguage,
  languagePolicyFor,
  normalizeDeckPlan
} = require('../design-system');
const {
  hasBadVisibleCopy,
  usageError
} = require('./common');
const { referenceContextForPrompt } = require('./extraction-schema');
const {
  agendaTitleForClaim,
  contactListFromDoc,
  factText,
  textItems
} = require('./claim-slide-fields');
const {
  isCompanyProfileMetricClaim,
  slideFromClaim,
  slideFromCompanyIntroClaim
} = require('./claim-to-slide');
const {
  applyCompanyIntroRhythm,
  companyIntroTocItems,
  filterCompanyIntroDuplicateSlides,
  imageCaptionCards,
  materialHygieneSummary,
  shouldSuppressCompanyIntroClaim
} = require('./company-intro-planning');
const { targetSlideContract } = require('./slide-contract');
const {
  claimSpineContract,
  proofObjectForClaim,
  sourceTraceForClaim
} = require('./source-trace');

function validateExtraction(extraction = {}) {
  const errors = [];
  if (extraction.version !== 'material-extraction/v1') errors.push('extraction.version must be material-extraction/v1');
  if (!extraction.document || typeof extraction.document !== 'object') errors.push('extraction.document is required');
  if (!Array.isArray(extraction.claim_spine) || extraction.claim_spine.length < 2) errors.push('extraction.claim_spine must contain at least two claims');
  (extraction.claim_spine || []).forEach((claim, i) => {
    if (!claim.claim) errors.push(`claim_spine[${i}].claim is required`);
    if (!Array.isArray(claim.source_ids) || !claim.source_ids.length) errors.push(`claim_spine[${i}].source_ids is required`);
    const visibleCopy = [
      claim.claim,
      claim.support,
      claim.summary,
      claim.note,
      ...(Array.isArray(claim.bullets) ? claim.bullets : [])
    ].filter(Boolean).join(' ');
    if (hasBadVisibleCopy(visibleCopy)) errors.push(`claim_spine[${i}] contains production-note wording that would leak into visible slides`);
  });
  return errors;
}

function paletteForIndustry(industry = '', extraction = {}) {
  const art = extraction.deck_art_direction || extraction.deckArtDirection || {};
  const requested = art.palette || art.paletteName || '';
  if ((industry === 'energy-utility' || industry === 'energy-infrastructure') &&
    (!requested || requested === 'boardroom-ink')) {
    return 'energy-ops-clean';
  }
  return requested || undefined;
}

function chargingServiceArtDirection(industry = '', extraction = {}, doc = {}) {
  const art = Object.assign({}, extraction.deck_art_direction || extraction.deckArtDirection || {});
  const text = [
    doc.title,
    doc.subtitle,
    doc.organization,
    doc.decision_goal,
    ...(extraction.facts || []).map(f => f && f.text),
    ...(extraction.claim_spine || []).map(c => c && (c.claim || c.support || c.proof_object))
  ].filter(Boolean).join(' ');
  if (industry !== 'energy-utility' || !/新能源汽车|充电服务|充电枪|快充站|车队|补能|站点|ROI/i.test(text)) return art;
  return Object.assign({
    reportType:'ev-charging-service-ops-review',
    palette:'energy-ops-clean',
    visualTemperament:'dark-cover-light-data-ops-report',
    rendererPreference:'energy-service-report',
    forbiddenReferenceSignals:['financial-strategy', 'beauty', 'consumer', 'saas', 'generic-kpi-deck'],
    preferredReferenceSignals:['energy-utility', 'operations', 'service-quality', 'site-operations', 'charging-service']
  }, art);
}

function compileDeckPlan(extraction = {}, bundle = {}, options = {}) {
  const errors = validateExtraction(extraction);
  if (errors.length) usageError(`invalid material extraction:\n- ${errors.join('\n- ')}`);
  const doc = extraction.document || {};
  const industry = doc.industry || ((bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0] || {}).industry) || 'general-operations';
  const deckArtDirection = chargingServiceArtDirection(industry, extraction, doc);
  const claims = extraction.claim_spine || [];
  const bodyClaims = claims.filter(c => !['cover', 'orientation'].includes(c.narrative_role));
  const title = doc.title || options.title || '材料整理汇报';
  const subtitle = doc.subtitle || doc.decision_goal || '围绕事实、证据与下一步行动形成清晰汇报';
  const companyIntro = doc.ppt_type === 'company-intro';
  const language = doc.language || doc.target_language || doc.output_language || extraction.language || inferDeckLanguage({
    title,
    subtitle,
    document: doc,
    claim_spine: claims
  });
  const zhDeck = /^zh/i.test(String(language || ''));
  const coverMetricClaim = companyIntro
    ? bodyClaims.find(isCompanyProfileMetricClaim)
    : bodyClaims.find(c => Array.isArray(c.metrics) && c.metrics.length);
  const contacts = contactListFromDoc(doc);
  const displayTitle = companyIntro && doc.organization ? doc.organization : title;
  const firstImage = ((bundle.images || []).find(Boolean) || {}).path;
  const materialImages = (bundle.images || []).map(img => img.path).filter(Boolean);
  const presentationClaims = companyIntro
    ? bodyClaims.filter(c => !shouldSuppressCompanyIntroClaim(c))
    : bodyClaims;
  const nonDecisionClaims = presentationClaims.filter(c => c.narrative_role !== 'decision');
  const baseSlideCount = companyIntro ? 4 : 3;
  const targetContract = targetSlideContract(extraction, bundle, options, {
    companyIntro,
    baseSlides: baseSlideCount,
    claimCount: nonDecisionClaims.length
  });
  const introDescription = (extraction.facts || []).map(factText).filter(Boolean).slice(0, 2).join('；') ||
    '围绕装备制造、输送系统和现场交付形成综合服务能力。';
  const companyTocItems = companyIntroTocItems(Object.assign({}, extraction, { images: bundle.images || [] }), contacts);
  const slides = [
    {
      type: 'auto',
      title: displayTitle,
      subtitle: companyIntro && title !== displayTitle ? title.replace(displayTitle, '').replace(/^[\s｜|/·-]+/, '') || subtitle : subtitle,
      visual: firstImage ? { mode: 'photo', role: companyIntro ? 'showcase' : 'cover', image: firstImage } : undefined
    }
  ];
  if (companyIntro) {
    slides.push({
      type: 'toc-clean',
      title: '目录',
      label: '目录',
      navigationLabel: '章节目录',
      subtitle: companyTocItems.includes('项目案例') || companyTocItems.includes('资质荣誉')
        ? '从公司概况、产品能力到项目案例与资质荣誉'
        : '从公司概况、产品工艺到制造交付与现场图像',
      items: companyTocItems
    });
    const profileSlide = {
      type: industry === 'manufacturing-operations' ? 'company-profile-spread' : 'profile-proof',
      title: '公司介绍',
      subtitle: '以长期制造基础、厂区车间和产品经验建立合作信任。',
      company: doc.organization || displayTitle,
      description: introDescription,
      metrics: coverMetricClaim ? coverMetricClaim.metrics.slice(0, 4) : [],
      images: materialImages.slice(0, 3),
      cards: imageCaptionCards(bundle, 3),
      visual: firstImage ? { mode: 'photo', role: 'evidence', image: firstImage, caption: '企业现场或产品图片' } : undefined
    };
    slides.push(profileSlide);
  } else {
    slides.push({
      type: 'chapter-divider',
      title: '汇报路径',
      claim: bodyClaims.length
        ? (zhDeck
            ? `本报告沿着${bodyClaims.slice(0, 4).map(c => agendaTitleForClaim(c)).join('、')}展开证据路径。`
            : `This report follows ${bodyClaims.slice(0, 4).map(c => agendaTitleForClaim(c)).join(', ')} as the evidence path.`)
        : (zhDeck ? '本报告先梳理有来源支撑的判断，再收束到决策路径。' : 'This report follows source-backed claims before closing on the decision path.'),
      chapter: '01',
      label: industry === 'manufacturing-operations' ? (zhDeck ? '能力证据路径' : 'CAPABILITY EVIDENCE PATH') : undefined,
      bottomLabel: industry === 'manufacturing-operations' ? (zhDeck ? '证据路径' : 'EVIDENCE PATH') : undefined,
      subtitle: undefined,
      items: bodyClaims.slice(0, 5).map(c => ({ title: agendaTitleForClaim(c), body: c.support || c.proof_object || '' }))
    });
  }
  const bodySlides = presentationClaims
    .filter(c => c.narrative_role !== 'decision')
    .slice(0, targetContract.bodyLimit)
    .map(c => companyIntro ? slideFromCompanyIntroClaim(c, extraction, bundle, industry) : slideFromClaim(c, extraction, bundle));
  let dedupeReport = [];
  if (companyIntro) {
    const profileSlide = slides.find(s => s.type === 'company-profile-spread' || s.type === 'profile-proof') || {};
    const filtered = filterCompanyIntroDuplicateSlides(bodySlides, profileSlide);
    dedupeReport = filtered.removed;
    slides.push(...applyCompanyIntroRhythm(filtered.slides));
  } else {
    slides.push(...bodySlides);
  }
  const decision = bodyClaims.find(c => c.narrative_role === 'decision') || claims.find(c => c.narrative_role === 'decision');
  const decisionSourceTrace = decision ? sourceTraceForClaim(decision, extraction, bundle) : undefined;
  slides.push({
    type: 'closing',
    title: companyIntro ? '谢谢观看' : (decision ? decision.claim : '下一步行动'),
    subtitle: companyIntro ? (doc.organization || displayTitle) : (decision ? decision.support || '' : doc.decision_goal || '确认范围、事实口径和评审节奏。'),
    proofObject: companyIntro ? undefined : (decision ? (decision.proof_object || decision.proofObject || 'premium-closing-anchor') : 'premium-closing-anchor'),
    proof: companyIntro || !decision ? undefined : proofObjectForClaim(decision, extraction, bundle, { sourceTrace: decisionSourceTrace }),
    closingVariant: companyIntro ? 'company-thanks' : undefined,
    label: companyIntro ? '致谢' : undefined,
    showMeta: companyIntro ? false : undefined,
    contacts: companyIntro ? contacts : (contacts.length ? contacts : undefined),
    actions: companyIntro
      ? (contacts.length ? undefined : [
          { title: '目标场景确认', body: '对齐行业、工艺段和产线边界。' },
          { title: '重点案例核验', body: '筛选可公开展示的项目证据。' },
          { title: '技术方案评审', body: '进入参数、交付范围和排期讨论。' }
        ])
      : (decision ? textItems(decision.bullets, ['确认范围', '补齐事实', '进入评审']) : [{ title: '确认范围', body: '对齐受众与决策目标。' }, { title: '补齐事实', body: '补充缺失数据与素材授权。' }, { title: '进入评审', body: '生成 PPTX 并完成 QA。' }]),
    visual: firstImage && companyIntro ? { mode: 'photo', role: 'closing', image: firstImage } : undefined,
    sourceTrace: decisionSourceTrace
  });

  const plan = {
    style: options.style || 'premium-commercial-keynote',
    industry,
    requestedSlideCount: targetContract.requested,
    targetSlides: Object.assign({}, targetContract, { actual: slides.length }),
    claimSpine: claimSpineContract(claims, extraction, bundle),
    deckArtDirection,
    palette: paletteForIndustry(industry, extraction),
    visualMode: 'auto',
    visualIntent: (bundle.images || []).length >= 3 ? 'case-led' : 'strategy',
    title: displayTitle,
    subtitle,
    coverInsight: subtitle,
    organization: doc.organization || undefined,
    audience: companyIntro ? undefined : doc.audience || undefined,
    date: companyIntro ? undefined : doc.date || undefined,
    language,
    visibleLanguagePolicy: extraction.visible_language_policy || extraction.visibleLanguagePolicy || doc.visible_language_policy || doc.visibleLanguagePolicy || undefined,
    showMeta: companyIntro ? false : undefined,
    coverKicker: companyIntro ? false : undefined,
    footer: companyIntro ? (doc.organization || displayTitle) : title,
    coverMetrics: coverMetricClaim ? coverMetricClaim.metrics.slice(0, 5) : undefined,
    coverTags: industry === 'manufacturing-operations' ? ['工艺', '输送', '控制', '交付'] : undefined,
    materialIntelligence: {
      bundleVersion: bundle.version,
      extractionVersion: extraction.version,
      decisionGoal: doc.decision_goal || '',
      pptType: doc.ppt_type || '',
      missingInfo: extraction.missing_info || [],
      commercialRisks: extraction.commercial_risks || [],
      assetRights: extraction.asset_rights || '',
      clarifications: extraction.clarifications || [],
      claimSpine: claimSpineContract(claims, extraction, bundle),
      targetSlides: Object.assign({}, targetContract, { actual: slides.length }),
      deckArtDirection,
      referenceContext: referenceContextForPrompt(bundle, { industry }),
      materialHygiene: materialHygieneSummary(bundle),
      dedupedSlides: dedupeReport,
      facts: extraction.facts || [],
      evidence: extraction.evidence || []
    },
    contacts,
    commercialReview: {
      readyForExternalUse: false,
      openRisks: [
        ...(extraction.commercial_risks || []),
        ...(contacts.length ? [] : ['缺少可外发展示的联系人/官网/地址/二维码']),
        ...((extraction.asset_rights && !/用户自有|public|公开|授权/i.test(extraction.asset_rights)) ? [`素材授权状态：${extraction.asset_rights}`] : [])
      ]
    },
    slides
  };
  const normalizedPlan = normalizeDeckPlan(plan);
  normalizedPlan.language = normalizedPlan.language || language || inferDeckLanguage(normalizedPlan);
  normalizedPlan.visibleLanguagePolicy = languagePolicyFor(normalizedPlan);
  normalizedPlan.assetAuthorizationGate = assetAuthorizationGate(normalizedPlan, normalizedPlan);
  return normalizedPlan;
}

module.exports = {
  compileDeckPlan,
  validateExtraction
};
