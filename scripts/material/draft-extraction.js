const path = require('path');

function compactLine(text = '', max = 42) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function sourceExcerpt(source = {}) {
  return (source.candidateFacts && source.candidateFacts[0]) || String(source.text || '').slice(0, 140) || source.name || '';
}

function cleanDraftFact(text = '') {
  return String(text || '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDraftExtraction(bundle = {}, opts = {}) {
  const textSources = (bundle.sources || []).filter(source => source.kind !== 'image' && String(source.text || '').trim());
  const primary = textSources[0] || (bundle.sources || [])[0] || { id: 'src-001', name: '材料' };
  const topIndustry = bundle.textSummary && bundle.textSummary.industryCandidates && bundle.textSummary.industryCandidates[0];
  const industry = topIndustry && Number(topIndustry.score || 0) >= 2 ? topIndustry.industry : 'general-operations';
  const facts = (bundle.textSummary && bundle.textSummary.candidateFacts || [])
    .map(cleanDraftFact)
    .filter(Boolean)
    .slice(0, 6)
    .map((line, i) => ({
      id: `fact-${String(i + 1).padStart(3, '0')}`,
      text: line,
      source_ids: [primary.id],
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: line },
      confidence: 0.6
    }));
  while (facts.length < 2) {
    const fallback = sourceExcerpt(primary) || `材料事实 ${facts.length + 1}`;
    facts.push({
      id: `fact-${String(facts.length + 1).padStart(3, '0')}`,
      text: fallback,
      source_ids: [primary.id],
      source_pages: { [primary.id]: 1 },
      source_excerpts: { [primary.id]: fallback },
      confidence: 0.45
    });
  }
  const claimLines = facts.slice(0, 4).map(fact => fact.text);
  const title = compactLine(path.basename(primary.name || '材料自动整理', path.extname(primary.name || '')), 24) || '材料自动整理';
  const sourceIds = [primary.id].filter(Boolean);
  const claims = claimLines.map((line, i) => ({
    id: `claim-${String(i + 1).padStart(3, '0')}`,
    narrative_role: ['diagnosis', 'evidence', 'solution', 'operating-model'][i] || 'evidence',
    claim: compactLine(line, 30),
    support: line,
    proof_object: i === 0 ? 'diagnosis-board' : (i === 1 ? 'value-signal' : 'process-map'),
    source_ids: sourceIds,
    source_pages: { [primary.id]: 1 },
    source_excerpts: { [primary.id]: line },
    confidence: 0.55
  }));
  claims.push({
    id: `claim-${String(claims.length + 1).padStart(3, '0')}`,
    narrative_role: 'decision',
    claim: '下一步确认事实口径与交付边界',
    support: '后续需要确认事实、素材授权和联系人信息。',
    proof_object: 'decision-summary',
    source_ids: sourceIds,
    source_pages: { [primary.id]: 1 },
    source_excerpts: { [primary.id]: sourceExcerpt(primary) },
    bullets: ['确认事实口径', '补齐素材授权', '进入正式设计 QA'],
    confidence: 0.5
  });
  return {
    version: 'material-extraction/v1',
    document: {
      title,
      subtitle: '基于已摄取材料生成的保守草案',
      ppt_type: 'draft',
      industry,
      decision_goal: '确认事实口径、缺失信息和后续交付范围',
      targetSlides: opts.targetSlides
    },
    facts,
    evidence: facts.slice(0, 4).map((fact, i) => ({
      id: `ev-${String(i + 1).padStart(3, '0')}`,
      type: 'text',
      title: compactLine(fact.text, 22),
      summary: fact.text,
      source_ids: fact.source_ids,
      excerpt: fact.text
    })),
    claim_spine: claims,
    missing_info: [
      '该 deck 由 --auto-draft 生成，只能作为内部草案；正式交付需补齐模型抽取、事实复核和素材授权。'
    ],
    commercial_risks: [
      '自动草案未经过人工 source audit / model critic，不建议直接外发。'
    ],
    asset_rights: 'unknown'
  };
}

module.exports = {
  buildDraftExtraction,
  cleanDraftFact,
  compactLine,
  sourceExcerpt
};
