const { compactUnique } = require('./common');

function sourceById(bundle = {}) {
  return new Map((bundle.sources || []).map(s => [s.id, s]));
}

function evidenceById(extraction = {}) {
  return new Map((extraction.evidence || []).map(e => [e.id, e]));
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

module.exports = {
  claimSpineContract,
  evidenceById,
  proofObjectForClaim,
  sourceById,
  sourceTraceForClaim
};
