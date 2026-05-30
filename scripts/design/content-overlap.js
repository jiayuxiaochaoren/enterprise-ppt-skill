function createContentOverlapHelpers({
  normalizeDeckPlan,
  textKeywords
} = {}) {
const OVERLAP_STOPWORDS = new Set([
  '公司', '企业', '能力', '介绍', '项目', '客户', '材料', '支撑', '形成', '说明', '用于', '核心',
  'the', 'and', 'for', 'with', 'from', 'into', 'about', 'this', 'that'
]);

function contentOverlapTokens(text = '') {
  const raw = String(text || '')
    .replace(/[a-z]:?[\\/][^\s]+/gi, ' ')
    .replace(/(?:^|[\s/])(?:src|ev|claim)-\d+\b/gi, ' ')
    .replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi, ' ')
    .toLowerCase();
  const numberTokens = raw.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|万元|亿元|人|件|台|亩|平米|平方米|mw|mwh|年)?/g) || [];
  const words = textKeywords(raw)
    .filter(w => w.length >= 2 && w.length <= 18)
    .filter(w => !OVERLAP_STOPWORDS.has(w));
  const cjkChunks = [];
  const cjkRuns = String(text || '').match(/[\u4e00-\u9fff]{4,}/g) || [];
  cjkRuns.forEach(run => {
    for (let i = 0; i <= run.length - 4; i += 2) {
      cjkChunks.push(run.slice(i, i + 4));
    }
  });
  return [...new Set([...numberTokens.map(s => s.replace(/\s+/g, '')), ...words, ...cjkChunks])]
    .filter(t => t && !OVERLAP_STOPWORDS.has(t));
}

function overlapText(value = {}) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(overlapText).filter(Boolean).join(' ');
  if (typeof value !== 'object') return '';
  const visibleKeys = [
    'title', 'subtitle', 'claim', 'intro', 'note', 'label', 'chapter', 'bottomLabel',
    'value', 'body', 'text', 'name',
    'coreTitle', 'coreBody', 'summary', 'description', 'metrics', 'items', 'cards',
    'rows', 'phases', 'actions', 'sections', 'values', 'bridge', 'dataComponent',
    'drivers', 'actions', 'outcomes', 'inputs', 'outputs'
  ];
  return visibleKeys
    .filter(k => Object.prototype.hasOwnProperty.call(value, k))
    .map(k => overlapText(value[k]))
    .filter(Boolean)
    .join(' ');
}

function slideContentOverlap(a = {}, b = {}) {
  const textA = overlapText(a);
  const textB = overlapText(b);
  const tokensA = new Set(contentOverlapTokens(textA));
  const tokensB = new Set(contentOverlapTokens(textB));
  const shared = [...tokensA].filter(t => tokensB.has(t));
  const unionSize = new Set([...tokensA, ...tokensB]).size || 1;
  const numbersA = new Set((textA.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|万元|亿元|人|件|台|亩|平米|平方米|MW|MWh|年)?/g) || []).map(s => s.replace(/\s+/g, '')));
  const numbersB = new Set((textB.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|万元|亿元|人|件|台|亩|平米|平方米|MW|MWh|年)?/g) || []).map(s => s.replace(/\s+/g, '')));
  const sharedNumbers = [...numbersA].filter(t => numbersB.has(t));
  const score = shared.length / unionSize;
  return {
    score: Number(score.toFixed(3)),
    sharedTokens: shared.slice(0, 16),
    sharedNumbers,
    tokenCounts: [tokensA.size, tokensB.size]
  };
}

function contentOverlapAudit(plan = {}, normalizedPlan = null) {
  const normalized = normalizedPlan || normalizeDeckPlan(plan);
  const slides = normalized.slides || [];
  const findings = [];
  for (let i = 1; i < slides.length; i++) {
    const prev = slides[i - 1];
    const cur = slides[i];
    if (['cover', 'toc', 'toc-clean', 'chapter-divider'].includes(prev.type) || ['toc', 'toc-clean', 'chapter-divider'].includes(cur.type)) continue;
    const overlap = slideContentOverlap(prev, cur);
    const adjacentCritical = overlap.sharedNumbers.length >= 2 || overlap.score >= 0.46;
    if (adjacentCritical) {
      findings.push({
        slide: i + 1,
        level: 'fail',
        type: 'contentOverlap',
        message: `slide ${i} and ${i + 1} reuse too many facts (${overlap.sharedNumbers.join(', ') || overlap.sharedTokens.slice(0, 6).join(', ')})`
      });
    }
  }
  for (let i = 0; i < slides.length; i++) {
    for (let j = i + 2; j < slides.length; j++) {
      if (j === slides.length - 1 || i === 0) continue;
      if (['cover', 'toc', 'toc-clean', 'chapter-divider'].includes(slides[i].type) || ['toc', 'toc-clean', 'chapter-divider'].includes(slides[j].type)) continue;
      const overlap = slideContentOverlap(slides[i], slides[j]);
      if (overlap.sharedNumbers.length >= 3 || overlap.score >= 0.54) {
        findings.push({
          slide: j + 1,
          level: 'review',
          type: 'deckFactReuse',
          message: `slide ${i + 1} and ${j + 1} may repeat the same proof facts (${overlap.sharedNumbers.join(', ') || overlap.sharedTokens.slice(0, 6).join(', ')})`
        });
      }
    }
  }
  return findings;
}

  return {
    contentOverlapAudit,
    contentOverlapTokens,
    overlapText,
    slideContentOverlap
  };
}

module.exports = {
  createContentOverlapHelpers
};
