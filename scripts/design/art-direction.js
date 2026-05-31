function createArtDirectionHelpers({
  compactUnique,
  contentSignals,
  flattenText,
  industryDesignDialect,
  industryVisualPolicy,
  slideRole,
  visualSystem = {}
} = {}) {
  function deckArtDirection(plan = {}) {
    return plan.deckArtDirection || plan.deck_art_direction || plan.artDirection || plan.art_direction || {};
  }

  function selectPaletteName(plan = {}) {
    const dialect = industryDesignDialect(plan);
    const policy = industryVisualPolicy(plan);
    const art = deckArtDirection(plan);
    return plan.palette || art.palette || art.paletteName || dialect.defaultPalette || policy.defaultPalette || 'boardroom-ink';
  }

  function normalizedArtMap(plan = {}) {
    const art = deckArtDirection(plan);
    const raw = art.rhythmMap || art.rhythm_map || art.slideIntents || art.slides || [];
    return Array.isArray(raw) ? raw : [];
  }

  function artDirectionEntry(plan = {}, s = {}, index = 0) {
    const candidates = compactUnique([
      s.id,
      s.slideId,
      s.claimId,
      s.claim_id,
      s.sourceTrace && s.sourceTrace.claimId,
      s.title,
      s.claim,
      String(index + 1),
      String(index + 1).padStart(2, '0')
    ].map(v => v == null ? '' : String(v)));
    const map = normalizedArtMap(plan);
    const explicit = map.find(entry => {
      if (!entry || typeof entry !== 'object') return false;
      const keys = [
        entry.slideId,
        entry.slide_id,
        entry.claimId,
        entry.claim_id,
        entry.id,
        entry.title,
        entry.slide,
        entry.index != null ? Number(entry.index) + 1 : ''
      ].map(v => v == null ? '' : String(v));
      return keys.some(key => key && candidates.includes(key));
    });
    if (explicit) return explicit;
    const positional = map[index];
    return positional && typeof positional === 'object' && !(positional.slideId || positional.claimId || positional.id || positional.title)
      ? positional
      : {};
  }

  function explicitArtValue(plan = {}, s = {}, index = 0, ...keys) {
    const entry = artDirectionEntry(plan, s, index);
    for (const key of keys) {
      if (s[key] != null && s[key] !== '') return s[key];
      const snake = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
      if (s[snake] != null && s[snake] !== '') return s[snake];
      if (entry[key] != null && entry[key] !== '') return entry[key];
      if (entry[snake] != null && entry[snake] !== '') return entry[snake];
    }
    return '';
  }

  function themeIntentFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total)) {
    const explicit = explicitArtValue(plan, s, index, 'themeIntent');
    if (explicit) return String(explicit);
    const type = s.type || '';
    const role = s.narrativeRole || s.narrative_role || slideRole(s);
    const text = flattenText(s);
    if (index === 0 || type === 'cover') return 'industry-opening';
    if (index === total - 1 || type === 'closing') return 'closing-anchor';
    if (type === 'toc' || type === 'toc-clean' || type === 'chapter-divider') return 'navigation-map';
    if (type === 'company-profile-spread' || type === 'profile-proof') return 'company-proof';
    if (type === 'architecture' || type === 'architecture-dark' || type === 'strategy-map' || signals.hasArchitecture) return 'system-architecture';
    if (type === 'case-gallery' || signals.imageCount >= 2 || /案例|截图|lookbook|gallery/i.test(text) || (/现场|证据/i.test(text) && (signals.imageCount > 0 || signals.hasGallery))) return 'case-evidence';
    if (type === 'risk-table' || type === 'table' || signals.hasRisk) return 'risk-warning';
    if (type === 'metric-comparison' || type === 'industry-chart' || type === 'finance-bridge' || type === 'value-tiles') return 'value-signal';
    if (type === 'timeline' || type === 'timeline-dark' || signals.hasTimeline || signals.hasLoop) return 'operating-path';
    if (signals.hasMetrics || signals.isNumberHeavy) return 'value-signal';
    if (role === 'diagnosis' || /问题|痛点|现状|差距|瓶颈|断点/i.test(text)) return 'diagnosis';
    if (role === 'solution' || role === 'operating-model') return 'solution-build';
    return 'executive-narrative';
  }

  function accentRoleFor(plan = {}, s = {}, index = 0, total = 1, themeIntent = themeIntentFor(plan, s, index, total), signals = contentSignals(plan, s, index, total)) {
    const explicit = explicitArtValue(plan, s, index, 'accentRole');
    if (explicit) return String(explicit);
    if (/risk|warning|diagnosis/i.test(themeIntent) || s.type === 'risk-table') return 'risk';
    if (/case|evidence|company-proof/i.test(themeIntent) || signals.imageCount) return 'evidence';
    if (/operating|path|closing|action|solution/i.test(themeIntent) || s.type === 'timeline') return 'action';
    if (/value|metric|proof/i.test(themeIntent) || signals.hasMetrics || signals.isNumberHeavy) return 'data';
    if (/opening|navigation|architecture|system/i.test(themeIntent)) return 'brand';
    return 'neutral';
  }

  function layoutEnergyFor(plan = {}, s = {}, index = 0, total = 1, themeIntent = themeIntentFor(plan, s, index, total), signals = contentSignals(plan, s, index, total)) {
    const explicit = explicitArtValue(plan, s, index, 'layoutEnergy');
    if (explicit) return String(explicit);
    if (/opening|closing/i.test(themeIntent)) return 'hero';
    if (/risk|diagnosis/i.test(themeIntent)) return 'high-contrast';
    if (/case|evidence|architecture|system/i.test(themeIntent)) return 'structured';
    if (signals.isDenseText) return 'editorial-dense';
    return 'calm';
  }

  function visualDensityFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total)) {
    const explicit = explicitArtValue(plan, s, index, 'visualDensity');
    if (explicit) return String(explicit);
    if (signals.isImageHeavy) return 'image-led';
    if (signals.isNumberHeavy || signals.hasMetrics) return 'metric-led';
    if (signals.isDenseText || signals.isTextHeavy) return 'dense';
    return 'balanced';
  }

  function rhythmTransitionFor(plan = {}, s = {}, index = 0, total = 1, themeIntent = themeIntentFor(plan, s, index, total)) {
    const explicit = explicitArtValue(plan, s, index, 'rhythmTransition');
    if (explicit) return String(explicit);
    if (index === 0) return 'start';
    if (index === total - 1) return 'return-to-anchor';
    if (/risk|diagnosis/i.test(themeIntent)) return 'turning-point';
    if (/case|evidence|value/i.test(themeIntent)) return 'proof-anchor';
    if (/architecture|system|operating/i.test(themeIntent)) return 'structure-shift';
    return 'continue';
  }

  function semanticColorRolesFor(plan = {}, accentRole = 'brand') {
    const art = deckArtDirection(plan);
    const configured = Object.assign({}, art.semanticColorRoles || art.semantic_color_roles || {});
    const defaults = (visualSystem.semanticColorRoles || {});
    const roleDefaults = defaults.roles || defaults;
    const role = Object.assign({}, roleDefaults[accentRole] || {}, configured[accentRole] || {});
    return {
      activeRole: accentRole,
      brand: (configured.brand && (configured.brand.token || configured.brand)) || ((roleDefaults.brand || {}).token) || 'accent',
      evidence: (configured.evidence && (configured.evidence.token || configured.evidence)) || ((roleDefaults.evidence || {}).token) || 'success',
      risk: (configured.risk && (configured.risk.token || configured.risk)) || ((roleDefaults.risk || {}).token) || 'risk',
      action: (configured.action && (configured.action.token || configured.action)) || ((roleDefaults.action || {}).token) || 'warning',
      data: (configured.data && (configured.data.token || configured.data)) || ((roleDefaults.data || {}).token) || 'dataHighlight',
      neutral: (configured.neutral && (configured.neutral.token || configured.neutral)) || ((roleDefaults.neutral || {}).token) || 'muted',
      activeToken: role.token || configured[accentRole] || accentRole,
      carrierGuidance: role.carriers || []
    };
  }

  return {
    accentRoleFor,
    artDirectionEntry,
    deckArtDirection,
    explicitArtValue,
    layoutEnergyFor,
    normalizedArtMap,
    rhythmTransitionFor,
    selectPaletteName,
    semanticColorRolesFor,
    themeIntentFor,
    visualDensityFor
  };
}

module.exports = {
  createArtDirectionHelpers
};
