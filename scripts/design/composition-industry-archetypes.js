const NON_PACK_INDUSTRIES = new Set(['brand-retail', 'general-operations']);

function createCompositionIndustryArchetypeHelpers({
  compactUnique,
  contentSignals,
  industryPackFor,
  inferredThemeIntent
} = {}) {
  function industryPack(plan = {}) {
    const industry = String(plan.industry || '').trim();
    return typeof industryPackFor === 'function' && !NON_PACK_INDUSTRIES.has(industry)
      ? (industryPackFor(plan) || {})
      : {};
  }

  function nativeIndustrialCover(plan = {}, s = {}) {
    return coverArchetype(plan, s) === 'native-industrial-structure-cover';
  }

  function coverArchetype(plan = {}, s = {}) {
    const pack = industryPack(plan);
    return String(
      s.coverArchetype ||
      s.cover_archetype ||
      plan.coverArchetype ||
      plan.cover_archetype ||
      pack.coverArchetype ||
      ''
    ).toLowerCase();
  }

  function closingArchetype(plan = {}, s = {}) {
    const pack = industryPack(plan);
    return String(
      s.closingArchetype ||
      s.closing_archetype ||
      plan.closingArchetype ||
      plan.closing_archetype ||
      pack.closingArchetype ||
      ''
    ).toLowerCase();
  }

  function bodyLayoutPool(plan = {}, s = {}) {
    const pack = industryPack(plan);
    const pool = s.bodyLayoutPool ||
      s.body_layout_pool ||
      (s.compositionPlan && s.compositionPlan.industryExpression && s.compositionPlan.industryExpression.bodyLayoutPool) ||
      plan.bodyLayoutPool ||
      plan.body_layout_pool ||
      pack.bodyLayoutPool ||
      [];
    return Array.isArray(pool) && typeof compactUnique === 'function'
      ? compactUnique(pool.map(value => String(value || '').trim()).filter(Boolean))
      : [];
  }

  function fallbackCompositionFromBodyPool(plan = {}, s = {}, type = s.type, variant = '', signals = contentSignals(plan, s), themeIntent = '') {
    const pool = bodyLayoutPool(plan, s);
    if (!pool.length || ['cover', 'cover-dark', 'closing', 'closing-dark', 'chapter-divider', 'toc', 'toc-clean'].includes(type)) return '';
    const intent = themeIntent || (typeof inferredThemeIntent === 'function' ? inferredThemeIntent(plan, s, signals) : '');
    const hasFamily = family => pool.includes(family);
    const firstSupported = (...families) => families.find(hasFamily) || '';
    const byFamily = family => {
      if (!family) return '';
      if (family === 'architecture') return 'system-map-with-proof-rail';
      if (['industry-chart', 'metric-comparison', 'finance-bridge', 'value-tiles'].includes(family)) return 'metric-readout-board';
      if (family === 'timeline') return 'process-rail-with-control-points';
      if (family === 'case-gallery') return signals.imageCount >= 3 ? 'triptych-evidence-gallery' : 'hero-image-with-evidence-strip';
      if (family === 'risk-table') return /action-loop/.test(String(variant || '')) ? 'governance-loop-board' : 'risk-control-board';
      if (family === 'report-board' || family === 'manifesto') return 'editorial-report-board';
      if (family === 'module-matrix') return 'capability-matrix-board';
      if (family === 'strategy-map') return 'system-map-with-proof-rail';
      if (family === 'product-showcase') return 'product-showcase-with-callouts';
      return '';
    };
    if ((type === 'risk-table' || type === 'table' || /risk|warning/.test(intent)) && firstSupported('risk-table')) return byFamily('risk-table');
    if ((type === 'timeline' || type === 'timeline-dark' || signals.hasTimeline || signals.hasLoop || /operating|path/.test(intent)) && firstSupported('timeline')) return byFamily('timeline');
    if ((['architecture', 'architecture-dark', 'strategy-map'].includes(type) || signals.hasArchitecture || /architecture|system/.test(intent)) && firstSupported('architecture', 'strategy-map')) return byFamily(firstSupported('architecture', 'strategy-map'));
    if ((['metric-comparison', 'industry-chart', 'finance-bridge', 'value-tiles'].includes(type) || signals.hasMetrics || signals.isNumberHeavy || /value-signal/.test(intent)) && firstSupported('industry-chart', 'metric-comparison', 'finance-bridge', 'value-tiles')) return byFamily(firstSupported('industry-chart', 'metric-comparison', 'finance-bridge', 'value-tiles'));
    if ((type === 'case-gallery' || signals.imageCount >= 2 || /case|evidence|company-proof/.test(intent)) && firstSupported('case-gallery')) return byFamily('case-gallery');
    if ((['report-board', 'manifesto', 'module-matrix'].includes(type) || signals.isDenseText) && firstSupported('report-board', 'manifesto', 'module-matrix')) return byFamily(firstSupported('report-board', 'manifesto', 'module-matrix'));
    return byFamily(pool[0]);
  }

  return {
    closingArchetype,
    coverArchetype,
    fallbackCompositionFromBodyPool,
    nativeIndustrialCover
  };
}

module.exports = {
  createCompositionIndustryArchetypeHelpers
};
