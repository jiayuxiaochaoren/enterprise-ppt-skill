const {
  RENDER_META_SCHEMA_CONTRACT
} = require('./contract-registry');

function hasNativeEvidence(component = {}) {
  return RENDER_META_SCHEMA_CONTRACT.consumedNativeEvidenceFields.every(field => Boolean(component[field])) &&
    Number(component.drawnCount || 0) > 0;
}

function nativeEvidenceFindingsForComponent(slide = {}, component = {}) {
  const findings = [];
  if (component.mode === 'native-renderer' && component.rendered) {
    if (!hasNativeEvidence(component)) {
      findings.push({
        slide: slide.slide,
        level:'fail',
        type:'nativeComponentEvidenceMissing',
        message:`native component ${component.id} was marked rendered without drawnCount/nativeSlot/bbox/rendererMethod evidence`
      });
    }
    const drawn = (slide.drawnComponents || []).find(item => item.id === component.id);
    if (!hasNativeEvidence(drawn)) {
      findings.push({
        slide: slide.slide,
        level:'fail',
        type:'nativeComponentDrawnEvidenceMissing',
        message:`native component ${component.id} was consumed without matching drawnComponents evidence`
      });
    }
  }
  if (component.mode === 'native-claimed-undrawn') {
    findings.push({
      slide: slide.slide,
      level: component.required === false ? 'review' : 'fail',
      type:'nativeComponentClaimedButUndrawn',
      message:`native component ${component.id} was declared owned but no drawn evidence was recorded`
    });
  }
  return findings;
}

module.exports = {
  hasNativeEvidence,
  nativeEvidenceFindingsForComponent
};
