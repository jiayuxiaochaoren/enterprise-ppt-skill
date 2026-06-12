const { createSourceTraceAuditPrimitives } = require('./source-trace-audit-primitives');
const {
  effectiveImageAuthorizationStatus,
  imageProvenanceCanSatisfyFactualProof,
  imageProvenanceIsSyntheticOnly,
  preferredAuthorizationStatus,
  sourceEntryDisplayId,
  sourceIdentityValues,
  toArray
} = require('./source-evidence');

function createSourceTraceAuditHelpers({
  compactUnique,
  imageRefsForSlide,
  normalizeDeckPlan,
  slideProofObject,
  sourceEntriesForSlide,
  sourceTraceForSlide,
  sourceTraceIsPlanAuthored
} = {}) {
  const {
    metricTraceEntries,
    normalizeAuthorizationStatus,
    sourceEntryHasExcerpt,
    sourceEntryHasPage
  } = createSourceTraceAuditPrimitives({
    compactUnique,
    sourceTraceIsPlanAuthored
  });

  function imageIdentity(value = {}) { return sourceIdentityValues(value)[0] || 'unknown'; }
  function imageProvenanceMatchesEntry(img = {}, entry = {}) {
    const imageIds = sourceIdentityValues(img);
    return sourceIdentityValues(entry).some(id => imageIds.includes(id));
  }
  function createImageAliasIndex() {
    const aliasToId = new Map();
    return {
      canonical(value = {}, preferred = '') {
        const aliases = sourceIdentityValues(value);
        const existing = aliases.map(alias => aliasToId.get(alias)).find(Boolean);
        const auditId = existing || preferred || aliases[0] || 'unknown';
        aliases.forEach(alias => aliasToId.set(alias, auditId));
        return auditId;
      },
      link(value = {}, auditId = '') {
        sourceIdentityValues(value).forEach(alias => aliasToId.set(alias, auditId));
      }
    };
  }
  function createAuthorizationFindingPusher(findings, slideNumber, keyed = false) {
    const byId = new Map();
    const keys = new Set();
    return function pushFinding(type, level, id, message) {
      const statusId = id || 'unknown';
      const existing = byId.get(statusId);
      if (existing && existing.type === 'assetAuthorizationBlocked') return;
      if (existing && type === 'assetAuthorizationBlocked') {
        if (keyed) {
          keys.delete(`${existing.type}:${statusId}`);
          keys.add(`${type}:${statusId}`);
        }
        Object.assign(existing, { level, type, message });
        return;
      }
      if (existing && !keyed) return;
      const key = `${type}:${statusId}`;
      if (keyed && keys.has(key)) return;
      if (keyed) keys.add(key);
      const finding = { slide: slideNumber, level, type, message };
      byId.set(statusId, finding);
      findings.push(finding);
    };
  }

  function explicitAssetAuthorizationTraceForSlide(slide = {}) {
    const proof = slide.proof || {};
    const chartSpec = slide.chartSpec || slide.chart_spec || {};
    const traceObjects = [proof, proof.sourceTrace || proof.source_trace || {}, slide.sourceTrace || slide.source_trace || {}, chartSpec.sourceTrace || chartSpec.source_trace || {}, slide];
    const statuses = traceObjects.flatMap(trace => [
      trace && trace.assetAuthorizationStatus,
      trace && trace.asset_authorization_status,
      ...toArray(trace && trace.assetAuthorizationStatuses),
      ...toArray(trace && trace.asset_authorization_statuses)
    ]);
    return { assetAuthorizationStatus: preferredAuthorizationStatus(statuses), assetAuthorizationStatuses: statuses };
  }

  function sourceTraceAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    slides.forEach((slide, i) => {
      if (['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(slide.type || '')) return;
      const entries = sourceEntriesForSlide(slide);
      const trace = sourceTraceForSlide(slide);
      const authorizationTrace = explicitAssetAuthorizationTraceForSlide(slide);
      const proof = slideProofObject(slide);
      const imageAliases = createImageAliasIndex();
      const pushAuthorizationFinding = createAuthorizationFindingPusher(findings, i + 1, true);
      function matchedImageAuditId(entry = {}, img = {}) {
        const preferred = imageIdentity(entry) !== 'unknown' ? imageIdentity(entry) : imageIdentity(img);
        const auditId = imageAliases.canonical(entry, preferred);
        imageAliases.link(img, auditId);
        return auditId;
      }
      const imageProvenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
      const hasFactualProofImage = imageProvenance.some(imageProvenanceCanSatisfyFactualProof);
      const hasTextSourceEvidence = entries.length || (proof.sourceIds || []).length;
      const hasSource = hasTextSourceEvidence || hasFactualProofImage;
      if (!hasSource && proof.factual) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'sourceTraceMissing',
          message: 'factual proof object has no source trace'
        });
      }
      entries.forEach(entry => {
        const entryDisplayId = sourceEntryDisplayId(entry) || 'unknown';
        const isImage = entry.kind === 'image' || entry.assetProvenance || /image|screenshot|photo/i.test(entry.provenance || '');
        const matchingImageProvenance = isImage
          ? (trace.imageProvenance || []).find(img => imageProvenanceMatchesEntry(img, entry))
          : null;
        if (!isImage && !sourceEntryHasPage(entry)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'sourceTraceNotExplainable',
            message: `source ${entryDisplayId} needs page/pageRef`
          });
        }
        if (!isImage && !sourceEntryHasExcerpt(entry)) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'sourceTraceNotExplainable',
            message: `source ${entryDisplayId} needs original excerpt`
          });
        }
        if (isImage && !entry.assetProvenance && !matchingImageProvenance) {
          const statusId = imageAliases.canonical(entry);
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'imageProvenanceMissing',
            message: `image source ${statusId} needs screenshot/image provenance`
          });
        }
        if (isImage) {
          const statusId = matchingImageProvenance
            ? matchedImageAuditId(entry, matchingImageProvenance)
            : imageAliases.canonical(entry);
          const authorizationItem = matchingImageProvenance
            ? {
                authorizationStatus: preferredAuthorizationStatus([
                  entry.authorizationStatus,
                  entry.authorization_status,
                  matchingImageProvenance.authorizationStatus,
                  matchingImageProvenance.authorization_status
                ])
              }
            : entry;
          const entryStatus = normalizeAuthorizationStatus(effectiveImageAuthorizationStatus(authorizationItem, authorizationTrace));
          if (entryStatus === 'blocked') {
            pushAuthorizationFinding('assetAuthorizationBlocked', 'fail', statusId, `image source ${statusId} is not authorized for external use`);
          } else if (entryStatus === 'unknown' && !matchingImageProvenance) {
            pushAuthorizationFinding('assetAuthorizationUnknown', 'review', statusId, `image source ${statusId} authorization is unknown`);
          }
        }
      });
      (Array.isArray(slide.metrics) ? slide.metrics : []).forEach((metric, metricIndex) => {
        if (!metric || (!metric.value && !metric.amount && !metric.delta)) return;
        const metricEntries = metricTraceEntries(metric, trace);
        if (!metricEntries.length) {
          findings.push({
            slide: i + 1,
            level: 'fail',
            type: 'metricSourceTraceMissing',
            message: `metric ${metricIndex + 1} needs source id, page, and original excerpt`
          });
          return;
        }
        metricEntries.forEach(entry => {
          if (!sourceEntryHasPage(entry) || !sourceEntryHasExcerpt(entry)) {
            findings.push({
              slide: i + 1,
              level: 'fail',
              type: 'metricSourceTraceNotExplainable',
              message: `metric ${metricIndex + 1} source ${sourceEntryDisplayId(entry) || 'unknown'} needs page and original excerpt`
            });
          }
        });
      });
      (trace.imageProvenance || []).forEach(img => {
        const statusId = imageAliases.canonical(img);
        const status = normalizeAuthorizationStatus(effectiveImageAuthorizationStatus(img, authorizationTrace));
        if (status === 'blocked') {
          pushAuthorizationFinding('assetAuthorizationBlocked', 'fail', statusId, `image source ${statusId} is not authorized for external use`);
        } else if (status === 'unknown') {
          pushAuthorizationFinding('assetAuthorizationUnknown', 'review', statusId, `image source ${statusId} authorization is unknown`);
        }
      });
      const generatedOnly = imageProvenance.length > 0 && imageProvenance.every(imageProvenanceIsSyntheticOnly);
      if (proof.factual && imageProvenance.length && generatedOnly && !hasFactualProofImage && !hasTextSourceEvidence) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'generatedAssetCannotSatisfyFactualProof',
          message: 'factual proof slide only has generated/synthetic image provenance'
        });
      }
    });
    return {
      version: 'source-trace-audit/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      findings
    };
  }

  function assetAuthorizationGate(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const required = Boolean(
      plan.formalMaterialGeneration ||
      plan.outputIntent === 'formal' ||
      plan.materialIntelligence ||
      (plan.commercialReview && plan.commercialReview.requiresAssetGate)
    );
    const findings = [];
    slides.forEach((slide, i) => {
      const trace = sourceTraceForSlide(slide);
      const authorizationTrace = explicitAssetAuthorizationTraceForSlide(slide);
      const imageRefs = imageRefsForSlide(slide);
      const provenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
      const imageAliases = createImageAliasIndex();
      const pushGateFinding = createAuthorizationFindingPusher(findings, i + 1);
      if (imageRefs.length && required && !provenance.length) {
        findings.push({
          slide: i + 1,
          level: 'fail',
          type: 'assetAuthorizationGateMissing',
          message: 'formal material generation requires image/screenshot provenance and authorization status before rendering'
        });
      }
      provenance.forEach(item => {
        const itemId = imageAliases.canonical(item);
        const itemStatus = normalizeAuthorizationStatus(effectiveImageAuthorizationStatus(item, authorizationTrace));
        if (itemStatus === 'blocked') {
          pushGateFinding('assetAuthorizationBlocked', 'fail', itemId, `asset ${itemId} is blocked for external material generation`);
        } else if (required && itemStatus !== 'cleared' && itemStatus !== 'internal-only') {
          pushGateFinding('assetAuthorizationUnresolved', 'fail', itemId, `asset ${itemId} authorization must be resolved before formal rendering`);
        }
      });
    });
    const explicit = plan.assetAuthorizationGate || {};
    const explicitUnresolved = /needs|pending|blocked|unresolved|待|未/i.test(String(explicit.status || ''));
    const hasFailingFinding = findings.some(f => f.level === 'fail');
    const status = hasFailingFinding || explicitUnresolved ? 'needs_authorization' : 'ready';
    return {
      version: 'asset-authorization-gate/v1',
      required,
      status,
      canRenderFormal: !required || status === 'ready',
      findings
    };
  }

  return {
    assetAuthorizationGate,
    metricTraceEntries,
    normalizeAuthorizationStatus,
    sourceEntryHasExcerpt,
    sourceEntryHasPage,
    sourceTraceAudit
  };
}

module.exports = { createSourceTraceAuditHelpers };
