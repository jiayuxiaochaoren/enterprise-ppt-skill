const {
  assetAuthorizationGate,
  inferDeckLanguage,
  languagePolicyFor,
  normalizeDeckPlan,
  slideContentOverlap
} = require('../design-system');
const {
  cleanPublicNote,
  compactUnique,
  extractNumbers,
  hasBadVisibleCopy,
  textBlob,
  usageError
} = require('./common');
const { referenceContextForPrompt } = require('./extraction-schema');

function sourceById(bundle = {}) {
  return new Map((bundle.sources || []).map(s => [s.id, s]));
}

function evidenceById(extraction = {}) {
  return new Map((extraction.evidence || []).map(e => [e.id, e]));
}

function textItems(values = [], fallback = []) {
  const arr = Array.isArray(values) && values.length ? values : fallback;
  return arr.filter(Boolean).slice(0, 5).map(v => {
    if (typeof v === 'string') return { title: v, body: '' };
    return { title: v.title || v.label || v.name || '要点', body: v.body || v.summary || v.note || '' };
  });
}

function metricsFromClaim(claim = {}) {
  if (Array.isArray(claim.metrics) && claim.metrics.length) return claim.metrics.slice(0, 5);
  const text = [claim.claim, claim.support, ...(claim.bullets || [])].join(' ');
  const nums = extractNumbers(text)
    .filter(value => {
      const raw = String(value || '').trim();
      if (/^(19|20)\d{2}$/.test(raw)) return false;
      if (/^[1-9]$/.test(raw)) return false;
      return true;
    })
    .slice(0, 4);
  return nums.map((value, i) => ({ label: ['核心指标', '变化幅度', '目标进度', '补充读数'][i] || '指标', value, note: claim.support || '' }));
}

function attachMetricSourceTrace(metric = {}, sourceTrace = {}) {
  if (metric.sourceTrace || metric.source_trace) return metric;
  const textSource = (sourceTrace.sources || []).find(entry => entry && entry.kind !== 'image');
  if (!textSource) return metric;
  return Object.assign({}, metric, {
    sourceId: metric.sourceId || metric.source_id || textSource.id,
    sourcePage: metric.sourcePage || metric.source_page || textSource.page || textSource.pageRef || textSource.pageNumber,
    sourceExcerpt: metric.sourceExcerpt || metric.source_excerpt || textSource.excerpt,
    sourceTrace: {
      version: 'metric-source-trace/v1',
      sourceIds: [metric.sourceId || metric.source_id || textSource.id].filter(Boolean),
      sources: [{
        id: metric.sourceId || metric.source_id || textSource.id,
        page: metric.sourcePage || metric.source_page || textSource.page || textSource.pageRef || textSource.pageNumber,
        excerpt: metric.sourceExcerpt || metric.source_excerpt || textSource.excerpt,
        provenance: 'metric-source-excerpt'
      }]
    }
  });
}

function businessLogicFromClaim(claim = {}) {
  const raw = claim.business_logic || claim.businessLogic || claim.diagnostic_chain || claim.diagnosticChain || {};
  const logic = {
    currentState: raw.current_state || raw.currentState || raw.status || raw.problem || raw.current || '',
    impact: raw.impact || raw.business_impact || raw.consequence || '',
    cause: raw.cause || raw.root_cause || raw.driver || raw.reason || '',
    action: raw.action || raw.operating_action || raw.response || raw.next_action || '',
    metric: raw.metric || raw.measure || raw.kpi || raw.result_metric || raw.expected_result || ''
  };
  Object.keys(logic).forEach(k => { if (logic[k]) logic[k] = String(logic[k]).trim(); });
  return Object.values(logic).some(Boolean) ? logic : null;
}

function dataComponentForClaim(claim = {}) {
  const explicit = String(claim.data_component || claim.dataComponent || '').trim();
  if (explicit) return explicit;
  const proof = String(claim.proof_object || '').toLowerCase();
  if (/channel|media|efficiency|scatter|bubble|roas|roi/.test(proof)) return 'scatter-bubble';
  if (/monthly|pulse|trend|月度|趋势/.test(proof)) return 'trend-line';
  if (/waterfall|bridge|target|目标桥|目标差额/.test(proof)) return 'waterfall-bridge';
  if (/pareto|root|cause|downtime/.test(proof)) return 'root-cause-matrix';
  if (/funnel|adoption/.test(proof)) return 'funnel';
  if (/journey|handoff|service/.test(proof)) return 'journey-breakpoint';
  if (/comparison|before|after/.test(proof)) return 'before-after';
  if (/milestone|timeline|loop/.test(proof)) return 'milestone';
  if (/scorecard|metric|board/.test(proof)) return 'scorecard';
  return '';
}

function agendaTitleForClaim(claim = {}) {
  if (claim.agenda_title || claim.short_title) return claim.agenda_title || claim.short_title;
  const text = String(claim.claim || claim.title || '');
  const pairs = [
    [/brand icon|operating engine|90-country|ART\/BEAUTY\/SCIENCE/i, 'Brand operating role'],
    [/product story|SKU|ingredient|Power Fermented|Camellia|30 years/i, 'Product proof'],
    [/award|awards|consumer-facing proof/i, 'Award evidence'],
    [/Group results|profit recovery|top-line pressure|net sales|core operating/i, 'Group results'],
    [/second-half|2H|regional|forecast|SHISEIDO 2H/i, 'Recovery signal'],
    [/LISA|campaign|Instagram|TikTok|consumer engagement/i, 'Campaign engagement'],
    [/Packaging|container-weight|refill|plastic|sustainability/i, 'Packaging proof'],
    [/risk agenda|claim discipline|image-rights|volatility/i, 'Risk controls'],
    [/2026 priorities|brand equity|hero franchises|regional execution/i, '2026 priorities'],
    [/照片|图片|车间|现场证据|制造证据|证据/, '现场证据'],
    [/核心价值|完整产线|制造基础|厂区|车间|加工中心/, '制造基础'],
    [/产品谱系|工艺段|控制段|产品|输送节点/, '产品谱系'],
    [/荣誉|资质|知识产权|专精特新|高新/, '资质背书'],
    [/项目清单|客户|应用场景|合作/, '客户项目'],
    [/军工|重载|复杂工艺|喷涂/, '高要求案例'],
    [/闭环|交付|安装|调试|维护/, '交付闭环'],
    [/下一步|评审|决策/, '合作评审']
  ];
  const hit = pairs.find(([re]) => re.test(text));
  if (hit) return hit[1];
  return text.replace(/[，。；：,.].*$/, '').slice(0, 12) || '核心议题';
}

function imagesForClaim(claim = {}, extraction = {}, bundle = {}) {
  const sources = sourceById(bundle);
  const evMap = evidenceById(extraction);
  const refs = [];
  (claim.visuals || []).forEach(v => {
    if (v.source_id) refs.push({ sourceId: v.source_id, caption: v.caption, role: v.role });
  });
  (claim.evidence_ids || []).forEach(id => {
    const ev = evMap.get(id);
    if (ev && ev.asset_source_id) refs.push({ sourceId: ev.asset_source_id, caption: ev.summary || ev.title, role: ev.type });
  });
  const unique = [];
  const seen = new Set();
  refs.forEach(ref => {
    const src = sources.get(ref.sourceId);
    if (!src || src.kind !== 'image' || seen.has(src.id)) return;
    seen.add(src.id);
    unique.push({ path: src.path, caption: ref.caption || src.name, role: ref.role || src.suggestedRole || 'evidence' });
  });
  return unique;
}

function chartFieldForProof(proof = '') {
  const p = String(proof || '').toLowerCase();
  if (p.includes('downtime') || p.includes('pareto')) return 'downtimePareto';
  if (p.includes('valuation') || p.includes('sensitivity')) return 'valuationSensitivity';
  if (p.includes('quality') || p.includes('handoff')) return 'qualityHandoff';
  if (p.includes('member') || p.includes('cohort') || p.includes('rfm')) return 'memberCohorts';
  if (p.includes('channel') || p.includes('media') || p.includes('efficiency') || p.includes('scatter') || p.includes('bubble') || p.includes('roas') || p.includes('roi')) return 'channelEfficiency';
  if (p.includes('monthly') || p.includes('pulse') || p.includes('trend')) return 'monthlyPulse';
  if (p.includes('waterfall') || p.includes('target-bridge') || p.includes('target bridge')) return 'waterfallBridge';
  if (p.includes('dispatch') || p.includes('site')) return 'dispatchMap';
  if (p.includes('adoption') || p.includes('funnel') || p.includes('activation')) return 'adoptionFunnel';
  return '';
}

function tableRowsFromClaim(claim = {}) {
  if (Array.isArray(claim.rows)) return claim.rows;
  if (Array.isArray(claim.risks)) return claim.risks.map(r => [r.title || r.risk || '风险', r.level || '中', r.action || r.mitigation || r.body || '建立跟踪机制']);
  return (claim.bullets || []).slice(0, 5).map((b, i) => [`事项 ${i + 1}`, '中', b]);
}

function contactListFromDoc(doc = {}) {
  const raw = doc.contacts || doc.contact || doc.contact_info || doc.website || doc.phone || doc.email || '';
  const values = Array.isArray(raw) ? raw : String(raw || '').split(/[｜|；;，,\n]/);
  return values.map(v => String(v || '').trim()).filter(Boolean).slice(0, 4);
}

function factText(value) {
  return typeof value === 'string' ? value : (value && (value.text || value.summary || value.title || value.body)) || '';
}

function externalUseCaveatText(value = '') {
  return /正式外发|外发版|授权边界|授权|待补充|补充|缺少|缺口|不明确|不能写成事实|核验|确认联系人|证书编号|客户案例/i.test(String(value || ''));
}

function finitePositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function requestedSlideCountFrom(extraction = {}, options = {}) {
  const doc = extraction.document || {};
  return finitePositiveNumber(
    options.targetSlides ||
    options.requestedSlideCount ||
    doc.targetSlides ||
    doc.target_slides ||
    doc.requestedSlideCount ||
    doc.requested_slide_count ||
    extraction.targetSlides ||
    extraction.target_slides ||
    extraction.requestedSlideCount ||
    extraction.requested_slide_count
  );
}

function materialDensityProfile(extraction = {}, bundle = {}) {
  const claims = Array.isArray(extraction.claim_spine) ? extraction.claim_spine : [];
  const evidence = Array.isArray(extraction.evidence) ? extraction.evidence : [];
  const facts = Array.isArray(extraction.facts) ? extraction.facts : [];
  const imageCount = Array.isArray(bundle.images) ? bundle.images.length : 0;
  const numberCount = ((bundle.textSummary && bundle.textSummary.numbers) || []).length;
  const sourceCount = Array.isArray(bundle.sources) ? bundle.sources.length : 0;
  const textChars = Number((bundle.textSummary && bundle.textSummary.charCount) || 0);
  const score =
    claims.length * 1.9 +
    evidence.length * 1.3 +
    facts.length * 0.8 +
    imageCount * 1.4 +
    Math.min(12, numberCount) * 0.45 +
    Math.min(8, sourceCount) * 0.6 +
    Math.min(12, Math.floor(textChars / 900)) * 0.45;
  const density = score >= 34 ? 'high' : (score >= 18 ? 'medium' : 'low');
  return {
    version: 'material-density/v1',
    density,
    score: Number(score.toFixed(1)),
    claimCount: claims.length,
    evidenceCount: evidence.length,
    factCount: facts.length,
    imageCount,
    numberCount,
    sourceCount,
    textChars
  };
}

function targetSlideContract(extraction = {}, bundle = {}, options = {}, context = {}) {
  const requested = requestedSlideCountFrom(extraction, options);
  const density = materialDensityProfile(extraction, bundle);
  const claimCount = Number(context.claimCount || ((extraction.claim_spine || []).length));
  const baseSlides = Number(context.baseSlides || 3);
  const minSlides = Math.max(baseSlides + 1, context.companyIntro ? 5 : 4);
  const availableSlides = Math.max(baseSlides, baseSlides + claimCount);
  const maxByDensity = density.density === 'high' ? 20 : (density.density === 'medium' ? 12 : 8);
  const recommended = Math.max(minSlides, Math.min(maxByDensity, availableSlides));
  const legacyMaxBody = finitePositiveNumber(options.maxSlides);
  const resolved = requested
    ? Math.max(minSlides, Math.min(20, Math.round(requested)))
    : (legacyMaxBody ? Math.min(maxByDensity, baseSlides + legacyMaxBody) : recommended);
  const bodyLimit = Math.max(0, resolved - baseSlides);
  const enoughMaterial = claimCount >= bodyLimit;
  return {
    version: 'target-slides/v1',
    requested: requested || null,
    resolved,
    targetSlides: resolved,
    baseSlides,
    bodyLimit,
    availableSlides,
    density,
    enoughMaterial,
    policy: enoughMaterial
      ? 'respect-requested-count'
      : 'do-not-hard-fill-without-evidence',
    adjustmentReason: enoughMaterial
      ? ''
      : `only ${claimCount} claim slides are available for ${bodyLimit} requested body slots`
  };
}

function sourceSummariesById(bundle = {}, ids = []) {
  const sources = sourceById(bundle);
  return compactUnique(ids).map(id => {
    const src = sources.get(id);
    return src ? {
      id: src.id,
      kind: src.kind,
      name: src.name,
      relativePath: src.relativePath,
      suggestedRole: src.suggestedRole || undefined,
      page: src.page || src.pageNumber || undefined,
      excerpt: (src.candidateFacts && src.candidateFacts[0]) || (src.chunks && src.chunks[0] && src.chunks[0].text && src.chunks[0].text.slice(0, 240)) || undefined,
      provenance: src.kind === 'image' ? 'ingested-image-asset' : `ingested-${src.kind || 'source'}`,
      authorizationStatus: src.authorizationStatus || src.assetRights || 'unknown'
    } : { id };
  });
}

function firstTextExcerpt(values = [], max = 260) {
  const text = values
    .map(v => String(v || '').replace(/\s+/g, ' ').trim())
    .find(Boolean) || '';
  return text.slice(0, max);
}

function pageRefForSource(source = {}, claim = {}, evidence = []) {
  const explicit = claim.page || claim.pageNumber || claim.source_page || claim.sourcePage || claim.page_ref || claim.pageRef;
  if (explicit) return explicit;
  const sourcePages = claim.source_pages || claim.sourcePages || {};
  if (sourcePages && typeof sourcePages === 'object' && sourcePages[source.id]) return sourcePages[source.id];
  const ev = evidence.find(item => (item.source_ids || item.sourceIds || []).includes(source.id));
  return ev && (ev.page || ev.pageNumber || ev.source_page || ev.sourcePage || ev.page_ref || ev.pageRef);
}

function excerptForSource(source = {}, claim = {}, evidence = []) {
  const explicit = claim.excerpt || claim.source_excerpt || claim.sourceExcerpt || claim.original_excerpt || claim.originalExcerpt;
  if (explicit) return firstTextExcerpt([explicit]);
  const sourceExcerpts = claim.source_excerpts || claim.sourceExcerpts || {};
  if (sourceExcerpts && typeof sourceExcerpts === 'object' && sourceExcerpts[source.id]) return firstTextExcerpt([sourceExcerpts[source.id]]);
  const ev = evidence.find(item => (item.source_ids || item.sourceIds || []).includes(source.id));
  return firstTextExcerpt([
    ev && (ev.excerpt || ev.source_excerpt || ev.original_excerpt || ev.summary || ev.title),
    claim.support,
    claim.summary,
    source.candidateFacts && source.candidateFacts[0],
    source.chunks && source.chunks[0] && source.chunks[0].text
  ]);
}

function assetAuthorizationForSource(source = {}, claim = {}, evidence = []) {
  const ev = evidence.find(item =>
    item.asset_source_id === source.id ||
    item.assetSourceId === source.id ||
    (item.source_ids || item.sourceIds || []).includes(source.id)
  ) || {};
  return ev.authorization_status || ev.authorizationStatus ||
    ev.asset_rights || ev.assetRights ||
    source.authorizationStatus || source.assetRights ||
    claim.asset_rights || claim.assetRights ||
    'unknown';
}

function sourceTraceForClaim(claim = {}, extraction = {}, bundle = {}) {
  const sources = sourceById(bundle);
  const evMap = evidenceById(extraction);
  const evidenceIds = compactUnique(claim.evidence_ids || claim.evidenceIds || []);
  const evidence = evidenceIds.map(id => evMap.get(id)).filter(Boolean);
  const sourceIds = compactUnique([
    ...(claim.source_ids || claim.sourceIds || []),
    ...evidence.flatMap(ev => ev.source_ids || ev.sourceIds || []),
    ...evidence.map(ev => ev.asset_source_id || ev.assetSourceId).filter(Boolean)
  ]);
  const evidenceReferencesSource = (ev = {}, id = '') => {
    const refs = compactUnique([
      ev.asset_source_id,
      ev.assetSourceId,
      ...(ev.source_ids || ev.sourceIds || [])
    ].filter(Boolean));
    return refs.includes(id);
  };
  const sourceEntries = sourceIds.map(id => {
    const src = sources.get(id) || { id, kind: 'unknown' };
    const isImage = src.kind === 'image' || evidence.some(ev =>
      evidenceReferencesSource(ev, id) &&
      ((ev.asset_source_id || ev.assetSourceId) === id || /image|screenshot|photo|visual/i.test(String(ev.type || '')))
    );
    const page = pageRefForSource(src, claim, evidence);
    const excerpt = excerptForSource(src, claim, evidence);
    return {
      id,
      kind: src.kind || 'unknown',
      name: src.name || '',
      relativePath: src.relativePath || '',
      page: page || undefined,
      excerpt: excerpt || undefined,
      provenance: isImage ? 'image-provenance' : 'text-source-excerpt',
      assetProvenance: isImage ? (src.relativePath || src.path || id) : undefined,
      authorizationStatus: assetAuthorizationForSource(src, claim, evidence)
    };
  });
  const imageProvenance = sourceEntries
    .filter(entry => entry.kind === 'image' || entry.assetProvenance)
    .map(entry => ({
      sourceId: entry.id,
      file: entry.relativePath || entry.name,
      provenance: entry.assetProvenance || entry.provenance,
      authorizationStatus: entry.authorizationStatus
    }));
  const authorizationStatuses = compactUnique(sourceEntries.map(entry => entry.authorizationStatus).filter(Boolean));
  return {
    version: 'source-trace/v2',
    claimId: claim.id || '',
    evidenceIds,
    sourceIds,
    sources: sourceEntries,
    imageProvenance,
    assetAuthorizationStatus: authorizationStatuses.includes('blocked') || authorizationStatuses.includes('needs authorization')
      ? 'blocked'
      : (authorizationStatuses.includes('unknown') ? 'unknown' : (authorizationStatuses[0] || 'unknown')),
    confidence: claim.confidence
  };
}

function proofObjectForClaim(claim = {}, extraction = {}, bundle = {}) {
  const evMap = evidenceById(extraction);
  const evidenceIds = compactUnique(claim.evidence_ids || claim.evidenceIds || []);
  const sourceIds = compactUnique(claim.source_ids || claim.sourceIds || []);
  const evidence = evidenceIds.map(id => evMap.get(id)).filter(Boolean);
  const evidenceTypes = compactUnique(evidence.map(ev => ev.type || 'evidence'));
  const visuals = Array.isArray(claim.visuals) ? claim.visuals : [];
  const assetRequirements = Array.isArray(claim.asset_requirements || claim.assetRequirements)
    ? (claim.asset_requirements || claim.assetRequirements)
    : [];
  const generatedSignals = [
    ...visuals.map(v => `${v.mode || ''} ${v.provenance || ''} ${v.role || ''}`),
    ...assetRequirements.map(v => `${v.provenance || ''} ${v.role || ''}`)
  ].join(' ');
  const hasRealEvidence = Boolean(sourceIds.length || evidence.some(ev => Array.isArray(ev.source_ids) && ev.source_ids.length));
  const hasBoundAssetEvidence = evidence.some(ev => ev.asset_source_id) || visuals.some(v => v.source_id);
  const generatedIllustration = /generated|synthetic|model|示意|生成/i.test(generatedSignals);
  const provenance = generatedIllustration && !hasBoundAssetEvidence
    ? 'model-generated-illustration'
    : (hasRealEvidence ? (hasBoundAssetEvidence ? 'real-asset-evidence' : 'source-derived-evidence') : 'unproven');
  return {
    version: 'proof-object/v1',
    id: claim.proof_object || claim.proofObject || 'report-board',
    kind: evidenceTypes[0] || claim.data_component || claim.dataComponent || 'source-summary',
    claimId: claim.id || '',
    evidenceIds,
    sourceIds,
    sources: sourceSummariesById(bundle, sourceIds),
    sourceTrace: sourceTraceForClaim(claim, extraction, bundle),
    evidenceTypes,
    provenance,
    evidenceMode: generatedIllustration ? 'synthetic-illustration' : 'real-evidence',
    factual: hasRealEvidence && !generatedIllustration,
    generatedIllustration,
    explanation: claim.source_note || claim.sourceNote || (evidence[0] && (evidence[0].summary || evidence[0].title)) || claim.support || '',
    sourceNote: claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote || ''
  };
}

function claimSpineContract(claims = [], extraction = {}, bundle = {}) {
  return claims.map((claim, i) => ({
    index: i + 1,
    id: claim.id || `claim-${String(i + 1).padStart(3, '0')}`,
    narrativeRole: claim.narrative_role || claim.narrativeRole || '',
    claim: claim.claim || claim.title || '',
    support: claim.support || claim.summary || '',
    proofObject: proofObjectForClaim(claim, extraction, bundle),
    sourceTrace: sourceTraceForClaim(claim, extraction, bundle),
    sourceIds: compactUnique(claim.source_ids || claim.sourceIds || []),
    evidenceIds: compactUnique(claim.evidence_ids || claim.evidenceIds || []),
    confidence: claim.confidence
  }));
}

function claimVisibleText(claim = {}) {
  return [
    claim.claim,
    claim.title,
    claim.support,
    claim.summary,
    claim.note,
    claim.proof_object,
    claim.narrative_role,
    ...(Array.isArray(claim.bullets) ? claim.bullets : [])
  ].filter(Boolean).join(' ');
}

function shouldSuppressCompanyIntroClaim(claim = {}) {
  const proof = String(claim.proof_object || '').toLowerCase();
  const role = String(claim.narrative_role || '').toLowerCase();
  const text = claimVisibleText(claim);
  if (role === 'governance' || proof.includes('risk') || proof.includes('responsibility')) {
    return externalUseCaveatText(text);
  }
  if (role === 'decision') return true;
  return false;
}

function hasUsableCustomerCase(extraction = {}) {
  const text = [
    ...(extraction.facts || []).map(v => factText(v)),
    ...(extraction.evidence || []).map(v => factText(v)),
    ...(extraction.claim_spine || []).map(v => claimVisibleText(v))
  ].join(' ');
  return /客户|案例|项目|交付|业绩/.test(text) && !externalUseCaveatText(text);
}

function hasUsableCertificate(extraction = {}) {
  const text = [
    ...(extraction.facts || []).map(v => factText(v)),
    ...(extraction.evidence || []).map(v => factText(v)),
    ...(extraction.claim_spine || []).map(v => claimVisibleText(v))
  ].join(' ');
  return /资质|证书|认证|专利|荣誉|高新|专精特新/.test(text) && !externalUseCaveatText(text);
}

function companyIntroTocItems(extraction = {}, contacts = []) {
  const items = ['公司概况', '产品与工艺', '制造与交付能力'];
  const hasImages = Array.isArray(extraction.images) && extraction.images.length;
  if (hasUsableCustomerCase(extraction)) items.push('项目案例');
  else if (hasImages || (extraction.claim_spine || []).some(c => /case-gallery|case-evidence|evidence/i.test(String(c.proof_object || '')))) items.push('产品与现场图像');
  if (hasUsableCertificate(extraction)) items.push('资质荣誉');
  items.push(contacts.length ? '联系方式' : '致谢');
  return [...new Set(items)].slice(0, 6);
}

function manufacturingServiceScopeSlideFromClaim(claim = {}) {
  const bullets = textItems(claim.bullets, ['非标输送设备', '涂装设备', '控制系统', '现场安装调试']).map(item => item.title).filter(Boolean);
  const bodyByTitle = {
    '非标输送设备': '围绕生产线转运、节拍衔接和现场布置进行定制化设计与制造。',
    '涂装设备': '承接涂装工艺相关设备配置、制造装配与现场配合。',
    '控制系统': '配合输送和涂装设备完成控制系统集成、联调与运行交付。',
    '现场安装调试': '围绕安装、调试、验收配合与后续服务形成交付闭环。',
    '现场安调服务': '围绕安装、调试、验收配合与后续服务形成交付闭环。',
    '输送系统': '围绕生产线转运、节拍衔接和现场布置进行定制化设计与制造。'
  };
  return {
    type: 'report-board',
    title: '服务范围覆盖输送、涂装、控制与现场安调',
    subtitle: '按产品对象和交付动作组织能力，便于客户判断适配场景。',
    claim: '按产品对象和交付动作组织能力，便于客户判断适配场景。',
    label: 'SERVICE SCOPE',
    coreTitle: '从产品到现场交付',
    coreBody: '围绕产品对象、控制集成与现场服务形成可交付能力。',
    summary: '产品类型、控制集成和现场服务共同构成项目交付范围。',
    sections: bullets.slice(0, 4).map(title => ({
      title,
      body: bodyByTitle[title] || '围绕该能力项形成设计、制造、安装或调试服务。'
    }))
  };
}

function slideFromCompanyIntroClaim(claim = {}, extraction = {}, bundle = {}, industry = '') {
  const proof = String(claim.proof_object || '').toLowerCase();
  if (industry === 'manufacturing-operations' && proof.includes('report-board') && externalUseCaveatText(claimVisibleText(claim))) {
    return manufacturingServiceScopeSlideFromClaim(claim);
  }
  return slideFromClaim(claim, extraction, bundle);
}

function materialHygieneSummary(bundle = {}) {
  const sources = bundle.sources || [];
  const removedLineCount = sources.reduce((sum, src) => sum + Number((src.materialHygiene || {}).removedLineCount || 0), 0);
  const removedSample = sources.flatMap(src => ((src.materialHygiene || {}).removedSample || []).map(item => ({
    sourceId: src.id,
    sourceName: src.name,
    lineNumber: item.lineNumber,
    text: item.text,
    reasons: item.reasons
  }))).slice(0, 10);
  return { removedLineCount, removedSample };
}

function companyIntroDuplicateReason(slide = {}, profileSlide = {}) {
  const overlap = slideContentOverlap(profileSlide, slide);
  if (overlap.sharedNumbers.length >= 2) {
    return `reuses company-profile metrics: ${overlap.sharedNumbers.join(', ')}`;
  }
  if (overlap.score >= 0.46 && /基础|规模|厂区|车间|加工|概况|简介|成立|始建/i.test([slide.title, slide.subtitle, slide.claim].filter(Boolean).join(' '))) {
    return `overlaps company profile text (${overlap.sharedTokens.slice(0, 6).join(', ')})`;
  }
  return '';
}

function filterCompanyIntroDuplicateSlides(slides = [], profileSlide = {}) {
  const removed = [];
  const kept = slides.filter(slide => {
    const reason = companyIntroDuplicateReason(slide, profileSlide);
    if (!reason) return true;
    removed.push({ title: slide.title || '', type: slide.type || '', reason });
    return false;
  });
  return { slides: kept, removed };
}

function imageCaptionCards(bundle = {}, max = 3) {
  return (bundle.images || []).slice(0, max).map((img, i) => ({
    title: img.caption || img.name || `现场图片 ${i + 1}`,
    body: img.suggestedRole ? `图片角色：${img.suggestedRole}` : '企业现场或产品图片'
  }));
}

function applyCompanyIntroRhythm(slides = []) {
  let galleryIndex = 0;
  return slides.map(slide => {
    const imageCount = Array.isArray(slide.images) ? slide.images.length : 0;
    if (imageCount >= 2) {
      galleryIndex += 1;
      if (!slide.layoutVariant && galleryIndex % 2 === 1) {
        return Object.assign({}, slide, { layoutVariant: 'case-hero' });
      }
    }
    return slide;
  });
}

function isCompanyProfileMetricClaim(claim = {}) {
  if (!Array.isArray(claim.metrics) || !claim.metrics.length) return false;
  const text = claimVisibleText(claim);
  const profileSignal = /公司|企业|成立|始建|厂区|厂房|车间|加工中心|面积|员工|团队|产能|资质|专利|认证|规模|制造基础|长期制造|company profile|foundation|facility|workshop|capacity/i.test(text);
  const operatingProblemSignal = /OEE|MTTR|MTBF|停机|停線|故障|等待备件|换型|维修|告警|缺陷|downtime|maintenance|fault|incident|root cause/i.test(text);
  return profileSignal && !operatingProblemSignal && !externalUseCaveatText(text);
}

function slideFromClaim(claim = {}, extraction = {}, bundle = {}) {
  const proof = String(claim.proof_object || '').toLowerCase();
  const title = claim.claim || claim.title || '核心判断';
  const subtitle = claim.support || claim.summary || '';
  const images = imagesForClaim(claim, extraction, bundle);
  const metrics = metricsFromClaim(claim);
  const sourceTrace = sourceTraceForClaim(claim, extraction, bundle);
  const slide = {
    type: 'content',
    title,
    subtitle,
    claim: subtitle,
    proofObject: claim.proof_object || claim.proofObject || '',
    proof: proofObjectForClaim(claim, extraction, bundle),
    note: cleanPublicNote(claim.note || ''),
    sourceTrace
  };
  if (metrics.length) slide.metrics = metrics.map(metric => attachMetricSourceTrace(metric, sourceTrace));
  if (claim.theme_intent || claim.themeIntent) slide.themeIntent = claim.theme_intent || claim.themeIntent;
  if (claim.accent_role || claim.accentRole) slide.accentRole = claim.accent_role || claim.accentRole;
  if (claim.layout_energy || claim.layoutEnergy) slide.layoutEnergy = claim.layout_energy || claim.layoutEnergy;
  if (claim.visual_density || claim.visualDensity) slide.visualDensity = claim.visual_density || claim.visualDensity;
  if (claim.rhythm_transition || claim.rhythmTransition) slide.rhythmTransition = claim.rhythm_transition || claim.rhythmTransition;
  if (claim.reference_recipe_id || claim.referenceRecipeId) slide.referenceRecipeId = claim.reference_recipe_id || claim.referenceRecipeId;
  if (Array.isArray(claim.reference_recipe_ids || claim.referenceRecipeIds)) {
    slide.referenceRecipeIds = claim.reference_recipe_ids || claim.referenceRecipeIds;
    slide.referenceRecipeId = slide.referenceRecipeId || slide.referenceRecipeIds[0];
  }
  if (claim.reference_category_id || claim.referenceCategoryId) slide.referenceCategoryId = claim.reference_category_id || claim.referenceCategoryId;
  if (Array.isArray(claim.component_hints || claim.componentHints)) slide.componentHints = claim.component_hints || claim.componentHints;
  if (Array.isArray(claim.component_suggestions || claim.componentSuggestions)) slide.componentSuggestions = claim.component_suggestions || claim.componentSuggestions;
  if (!slide.componentHints && slide.componentSuggestions) slide.componentHints = slide.componentSuggestions;
  if (claim.componentPlan || claim.component_plan) slide.componentPlan = claim.componentPlan || claim.component_plan;
  if (Array.isArray(claim.asset_requirements || claim.assetRequirements)) slide.assetRequirements = claim.asset_requirements || claim.assetRequirements;
  if (claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote) {
    slide.sourceNote = claim.source_note || claim.sourceNote || claim.provenance_note || claim.provenanceNote;
  }
  const businessLogic = businessLogicFromClaim(claim);
  if (businessLogic) slide.businessLogic = businessLogic;
  const dataComponent = dataComponentForClaim(claim);
  if (dataComponent) slide.dataComponent = dataComponent;
  if (claim.layoutVariant || claim.variant) {
    slide.layoutVariant = claim.layoutVariant || claim.variant;
    slide.variant = claim.layoutVariant || claim.variant;
  }
  else if (/financial-kpi-snapshot|chart-grid-with-commentary|quarterly-results-summary|guidance-and-risk-board|value-creation-process-map|materiality-matrix-board|sustainability-proof-spread|governance-table-editorial|culture-cover-with-soft-geometry|mission-statement-stage|people-proof-mosaic|value-principle-cards|beauty-brand-editorial-cover|brand-world-and-business-proof|consumer-proof-photo-grid|product-evidence-story|airy-concept-opening|single-object-concept-map|executive-proof-board|premium-closing-anchor/.test(proof)) {
    slide.variant = proof;
  }

  const chartField = chartFieldForProof(proof);
  if (chartField) {
    slide[chartField] = claim.data && Object.keys(claim.data).length ? claim.data : metrics.map(m => ({ title: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || 0, body: m.note || '', unit: /%|％/.test(String(m.value)) ? '%' : '' }));
    slide.coreTitle = title.length > 18 ? String(proof).replace(/-/g, ' ').toUpperCase() : title;
    slide.coreBody = subtitle || '把关键行业指标转化为可核验的判断依据。';
    return slide;
  }
  if (proof.includes('finance-bridge') || proof.includes('return-bridge')) {
    slide.bridge = Array.isArray(claim.bridge) ? claim.bridge : metrics.map((m, i) => ({ label: m.label, value: parseFloat(String(m.value).replace(/[^\d.-]/g, '')) || (i === 0 ? 10 : 3), note: m.note }));
    return slide;
  }
  if (proof === 'report-board' || proof.includes('report-board')) {
    slide.type = 'report-board';
    slide.label = claim.label || 'EVIDENCE BOARD';
    slide.coreTitle = claim.coreTitle || claim.core_title || '材料证据';
    slide.coreBody = claim.coreBody || claim.core_body || subtitle;
    slide.summary = claim.summary || subtitle;
    slide.decision = claim.decision || '';
    slide.note = cleanPublicNote(claim.note || '');
    slide.sections = Array.isArray(claim.sections) && claim.sections.length
      ? claim.sections
      : textItems(claim.cards || claim.bullets, [subtitle || title]).map((it, i) => Object.assign({}, it, {
        body: it.body || claim.support || subtitle || ['适配场景', '制造证据', '交付边界', '外发口径'][i] || '证据说明'
      }));
    return slide;
  }
  if (proof.includes('portfolio')) {
    slide.portfolio = Array.isArray(claim.portfolio) ? claim.portfolio : textItems(claim.bullets, ['重点项目', '观察项目', '退出项目']).map((it, i) => ({ name: it.title, theme: it.body || '投后动作', weight: i === 0 ? 35 : 20, irr: metrics[i] ? metrics[i].value : '—', dpi: '—', risk: i === 0 ? '低' : '中', action: it.body || '维持观察' }));
    return slide;
  }
  if (proof.includes('architecture') || proof.includes('blueprint') || proof.includes('capability-map') || proof.includes('topology') || proof.includes('service-blueprint')) {
    if (proof.includes('service-blueprint')) {
      slide.serviceBlueprint = claim.data || {};
      slide.variant = 'service-blueprint';
    }
    if (proof.includes('platform')) {
      slide.platformCapabilities = textItems(claim.bullets);
      slide.variant = 'platform-capability-map';
    }
    if (proof.includes('production')) {
      slide.productionLine = claim.data || {};
      slide.variant = 'production-topology';
    }
    if (proof.includes('production') && !Array.isArray(claim.layers)) {
      const products = textItems(claim.bullets, ['非标输送设备', '涂装设备', '控制系统', '现场安装调试']).map(it => it.title).filter(Boolean);
      slide.layers = [
        { name:'产品与工艺对象', title:'产品与工艺对象', items:products.slice(0, 5) },
        { name:'制造交付动作', title:'制造交付动作', items:['需求确认', '加工制造', '控制联调', '现场安装'] },
        { name:'证据与交付资料', title:'证据与交付资料', items:['图纸参数', '设备铭牌', '调试记录', '项目验收', '服务反馈'] }
      ];
    } else {
      slide.layers = Array.isArray(claim.layers) ? claim.layers : textItems(claim.bullets, ['数据层', '业务层', '管理层']).map(it => ({ name: it.title, title: it.title, items: it.body ? [it.body] : [it.title].filter(Boolean) }));
    }
    return slide;
  }
  if (proof.includes('risk') || proof.includes('governance') || proof.includes('responsibility') || claim.narrative_role === 'governance') {
    slide.headers = ['风险/责任项', '等级/角色', '应对动作'];
    slide.rows = tableRowsFromClaim(claim);
    if (proof.includes('matrix')) slide.matrix = claim.matrix || { x: '影响程度', y: '发生可能性' };
    if (proof.includes('responsibility')) {
      slide.variant = 'responsibility-loop';
      slide.responsibilities = Array.isArray(claim.responsibilities) && claim.responsibilities.length
        ? claim.responsibilities
        : textItems(claim.bullets).map((it, i) => ({ title: it.title, owner: ['业务', '技术', '管理层'][i] || '负责人', body: it.body }));
    }
    return slide;
  }
  if (proof.includes('loop') || proof.includes('timeline') || proof.includes('process') || claim.narrative_role === 'operating-model') {
    slide.phases = Array.isArray(claim.phases) ? claim.phases : textItems(claim.bullets, ['发现问题', '处置动作', '复盘优化']).map(it => ({ title: it.title, body: it.body || subtitle }));
    if (proof.includes('flywheel') || proof.includes('闭环')) slide.loop = true;
    return slide;
  }
  if (images.length >= 2 || /case|lookbook|evidence|proof|gallery|photo|mosaic|product.*story|brand-world/.test(proof)) {
    slide.images = images.map(x => x.path);
    const fallbackCards = textItems(claim.bullets, [subtitle || title]);
    slide.cards = images.length
      ? images.map((x, i) => ({ title: x.caption || `证据 ${i + 1}`, body: (claim.bullets || [subtitle])[i] || subtitle || '材料证据' }))
      : fallbackCards;
    return slide;
  }
  if (metrics.length >= 2 || proof.includes('metric') || claim.narrative_role === 'proof') {
    slide.metrics = metrics;
    const metricText = metrics.map(m => `${m.label || ''} ${m.value || ''} ${m.note || ''}`).join(' ');
    if (proof.includes('metric-board') && !/OEE|MTTR|MTBF|停机|稼动/i.test(metricText)) {
      slide.variant = 'fact-metrics';
    }
    return slide;
  }
  slide.cards = textItems(claim.bullets, [subtitle || title]);
  return slide;
}

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

function compileDeckPlan(extraction = {}, bundle = {}, options = {}) {
  const errors = validateExtraction(extraction);
  if (errors.length) usageError(`invalid material extraction:\n- ${errors.join('\n- ')}`);
  const doc = extraction.document || {};
  const industry = doc.industry || ((bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0] || {}).industry) || 'general-operations';
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
      subtitle: companyIntro && title !== displayTitle ? title.replace(displayTitle, '').replace(/^[\\s｜|/·-]+/, '') || subtitle : subtitle,
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
  slides.push({
    type: 'closing',
    title: companyIntro ? '谢谢观看' : (decision ? decision.claim : '下一步行动'),
    subtitle: companyIntro ? (doc.organization || displayTitle) : (decision ? decision.support || '' : doc.decision_goal || '确认范围、事实口径和评审节奏。'),
    proofObject: companyIntro ? undefined : (decision ? (decision.proof_object || decision.proofObject || 'premium-closing-anchor') : 'premium-closing-anchor'),
    proof: companyIntro || !decision ? undefined : proofObjectForClaim(decision, extraction, bundle),
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
    sourceTrace: decision ? sourceTraceForClaim(decision, extraction, bundle) : undefined
  });

  const plan = {
    style: options.style || 'premium-commercial-keynote',
    industry,
    requestedSlideCount: targetContract.requested,
    targetSlides: Object.assign({}, targetContract, { actual: slides.length }),
    claimSpine: claimSpineContract(claims, extraction, bundle),
    deckArtDirection: extraction.deck_art_direction || extraction.deckArtDirection || {},
    palette: (extraction.deck_art_direction && extraction.deck_art_direction.palette) || (extraction.deckArtDirection && extraction.deckArtDirection.palette) || undefined,
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
      deckArtDirection: extraction.deck_art_direction || extraction.deckArtDirection || {},
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
