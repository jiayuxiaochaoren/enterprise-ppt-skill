const {
  collectRenderMetaSchemaFindings
} = require('./render-meta-schema-rules');

function renderMetaSchemaAuditFromRender(renderMetaResult = {}, expectedSlideCount = 0) {
  const findings = [];
  const renderMeta = renderMetaResult.meta;
  if (!renderMeta) {
    findings.push({
      level: renderMetaResult.file ? 'fail' : 'review',
      type: renderMetaResult.file ? 'renderMetaUnreadable' : 'renderMetaMissing',
      message: renderMetaResult.error || 'render metadata sidecar is missing'
    });
    return {
      version:'render-meta-schema-audit/v1',
      schema:'render-meta/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : 'review',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  findings.push(...collectRenderMetaSchemaFindings(renderMeta, expectedSlideCount));
  return {
    version:'render-meta-schema-audit/v1',
    schema:'render-meta/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

module.exports = {
  renderMetaSchemaAuditFromRender
};
