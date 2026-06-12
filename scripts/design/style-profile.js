const BASE_COLORS = {
  ink: '0B1020',
  ink2: '111827',
  slate: '1E293B',
  paper: 'F8FAFC',
  white: 'FFFFFF',
  text: '111827',
  body: '475569',
  muted: '64748B',
  line: 'E2E8F0',
  darkText: 'F8FAFC',
  darkMuted: 'A8B3C3',
  darkLine: '334155',
  panelAlt: 'F1F5F9',
  photoOverlay: '0B1020',
  captionOnImage: 'CBD5E1',
  onAccent: 'FFFFFF',
  success: '16A34A',
  warning: 'F59E0B',
  accent: '3B82F6',
  cyan: '22D3EE',
  violet: '8B5CF6',
  risk: 'EF4444',
  softBlue: 'EFF6FF',
  softCyan: 'ECFEFF'
};

function createStyleProfiles(fontStack = {}) {
  return {
    'premium-commercial-keynote': {
      name: 'premium-commercial-keynote',
      font: fontStack.zh,
      latinFont: fontStack.latin,
      numberFont: fontStack.number,
      density: 'commercial',
      pageFamilies: ['stage-cover', 'spatial-navigation', 'light-narrative', 'split-insight', 'system-architecture', 'capability-map', 'pathway-timeline', 'value-signal', 'risk-matrix'],
      C: BASE_COLORS
    },
    'modern-business-keynote': {
      extends: 'premium-commercial-keynote',
      name: 'modern-business-keynote'
    },
    'executive-consulting': {
      extends: 'premium-commercial-keynote',
      name: 'executive-consulting',
      density: 'consulting',
      C: { accent: '2563EB', cyan: '06B6D4', violet: '7C3AED', paper: 'F9FAFB' }
    },
    'premium-consulting-keynote': {
      extends: 'executive-consulting',
      name: 'premium-consulting-keynote'
    },
    'enterprise-tech-stage': {
      extends: 'premium-commercial-keynote',
      name: 'enterprise-tech-stage',
      density: 'stage',
      C: { ink: '070C18', ink2: '0E1726', accent: '38BDF8', cyan: '2DD4BF', violet: 'A78BFA', paper: 'F8FAFC' }
    },
    'minimal-executive-white': {
      extends: 'premium-commercial-keynote',
      name: 'minimal-executive-white',
      density: 'minimal',
      C: { ink: '111827', ink2: '1F2937', accent: '2563EB', cyan: '0891B2', violet: '6D28D9', paper: 'FBFCFE' }
    },
    'conservative-enterprise': {
      extends: 'premium-commercial-keynote',
      name: 'conservative-enterprise',
      density: 'conservative',
      C: { ink: '10233F', ink2: '163455', accent: '2F65B0', cyan: '3BA7C9', violet: '64748B', paper: 'F6F8FB' }
    }
  };
}

function paletteToColors(palette = {}, base = BASE_COLORS) {
  return Object.assign({}, base, {
    ink: palette.dark || base.ink,
    ink2: palette.darkPanel || base.ink2,
    slate: palette.darkPanel || base.slate,
    paper: palette.background || base.paper,
    white: palette.panel || base.white,
    text: palette.text || base.text,
    body: palette.body || base.body,
    muted: palette.muted || base.muted,
    line: palette.line || base.line,
    darkText: palette.darkText || base.darkText,
    darkMuted: palette.darkMuted || base.darkMuted,
    darkLine: palette.darkLine || palette.darkPanel || base.darkLine,
    panelAlt: palette.panelAlt || palette.soft || base.panelAlt,
    photoOverlay: palette.photoOverlay || palette.dark || base.photoOverlay,
    captionOnImage: palette.captionOnImage || palette.darkText || base.captionOnImage,
    onAccent: palette.onAccent || base.onAccent,
    success: palette.success || base.success,
    warning: palette.warning || palette.dataHighlight || base.warning,
    accent: palette.accent || base.accent,
    cyan: palette.secondary || base.cyan,
    violet: palette.tertiary || base.violet,
    softBlue: palette.soft || base.softBlue,
    softCyan: palette.soft || base.softCyan,
    risk: palette.risk || base.risk
  });
}

function createStyleProfileHelpers({ fontStack = {} } = {}) {
  const STYLE_PROFILES = createStyleProfiles(fontStack);

  function resolveStyleProfile(name = 'premium-commercial-keynote') {
    const selected = STYLE_PROFILES[name] || STYLE_PROFILES['premium-commercial-keynote'];
    if (!selected.extends) return Object.assign({}, selected, { C: Object.assign({}, selected.C) });
    const base = resolveStyleProfile(selected.extends);
    return Object.assign({}, base, selected, {
      name: selected.name || name,
      C: Object.assign({}, base.C, selected.C || {})
    });
  }

  return {
    BASE_COLORS,
    STYLE_PROFILES,
    paletteToColors,
    resolveStyleProfile
  };
}

module.exports = {
  BASE_COLORS,
  createStyleProfileHelpers,
  createStyleProfiles,
  paletteToColors
};
