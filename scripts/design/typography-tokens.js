const TYPE_ROLE_ALIASES = {
  display: 'coverTitle',
  heroTitle: 'coverHeroTitle',
  title: 'pageTitle',
  pageSubtitle: 'subtitle',
  label: 'kicker',
  footnote: 'sourceNote',
  footer: 'sourceNote',
  small: 'bodySmall',
  micro: 'microLabel',
  table: 'tableBody',
  chart: 'chartLabel',
  metric: 'metricLarge',
  folio: 'pageFolio'
};

function createTypographyTokenHelpers({
  visualSystem = {},
  fontStack = {},
  deepMerge,
  compactUnique,
  industryMatchIds,
  visualIndustryId
} = {}) {
  function typographyRoot() {
    return visualSystem.typography || {};
  }

  function typographyRoleToken(role = 'body') {
    const root = typographyRoot();
    const key = TYPE_ROLE_ALIASES[role] || role || 'body';
    return deepMerge(root.body || { size: 10.2, min: 8.8 }, (root.roles || {})[key] || root[key] || {});
  }

  function typographyProfileFor(plan = {}) {
    const profiles = visualSystem.typographyProfiles || {};
    const ids = compactUnique([
      'default',
      ...industryMatchIds(plan.industry || ''),
      visualIndustryId(plan.industry || ''),
      plan.typographyProfile,
      plan.typography_profile
    ].filter(Boolean));
    return ids.reduce((profile, id) => profiles[id] ? deepMerge(profile, profiles[id]) : profile, {});
  }

  function typographyFontSet(plan = {}) {
    const root = typographyRoot();
    const policy = root.fontPolicy || {};
    const profile = typographyProfileFor(plan);
    return Object.assign({
      cjk: fontStack.zh || policy.cjk || 'PingFang SC',
      latin: fontStack.latin || policy.latin || 'Avenir Next',
      number: fontStack.number || policy.number || 'DIN Alternate',
      editorial: policy.editorial || 'Songti SC'
    }, policy, profile.fonts || {});
  }

  function typeRoleForSize(size = 10, opts = {}) {
    const n = Number(size || 0);
    if (opts.typeRole) return opts.typeRole;
    if (opts.y != null && Number(opts.y) >= 6.62) return 'sourceNote';
    if (n >= 38) return 'coverHeroTitle';
    if (n >= 27) return 'coverTitle';
    if (n >= 19) return 'pageTitle';
    if (n >= 14.5) return opts.bold ? 'metricMedium' : 'sectionTitle';
    if (n >= 12) return opts.bold ? 'cardTitle' : 'subtitle';
    if (n >= 9.8) return 'body';
    if (n >= 8.4) return opts.bold ? 'metricSmall' : 'bodySmall';
    if (n >= 7) return 'caption';
    return 'microLabel';
  }

  function textHasCjk(text) {
    return /[\u3400-\u9fff]/.test(String(text || ''));
  }

  function textLooksNumeric(text) {
    return /^[\s+\-~≈¥$€£%％.,:;/\dA-Z]+$/i.test(String(text || '').trim()) && /\d/.test(String(text || ''));
  }

  function fontForTypeText(plan = {}, text = '', token = {}, opts = {}) {
    if (opts.fontFace) return opts.fontFace;
    const fonts = typographyFontSet(plan);
    if (token.fontFace) return token.fontFace;
    if (token.role === 'number' || textLooksNumeric(text)) return fonts.number || fonts.latin;
    if (textHasCjk(text)) return fonts.cjk || fonts.latin;
    if (token.role === 'label' || token.role === 'chart') return fonts.latin || fonts.cjk;
    return fonts.latin || fonts.cjk;
  }

  function scaleSnapSize(size, scale = []) {
    const n = Number(size || 0);
    if (!Number.isFinite(n) || !scale.length) return n;
    const closest = scale.reduce((best, value) => Math.abs(value - n) < Math.abs(best - n) ? value : best, scale[0]);
    return Math.abs(closest - n) <= 0.85 ? closest : n;
  }

  function resolveTypeToken(plan = {}, role = 'body', opts = {}) {
    const key = TYPE_ROLE_ALIASES[role] || role || 'body';
    const profile = typographyProfileFor(plan);
    const token = deepMerge(
      typographyRoleToken(key),
      (profile.roles || {})[key] || {},
      opts.token || {}
    );
    const root = typographyRoot();
    const scale = Array.isArray(root.scale) ? root.scale : [];
    const rawSize = opts.fontSize != null ? Number(opts.fontSize) : Number(token.size || token.fontSize || 10.2);
    const size = opts.lockFontSize ? rawSize : scaleSnapSize(token.size || rawSize, scale);
    return Object.assign({}, token, {
      roleName: key,
      size,
      fontSize: size,
      min: Number(token.min || token.minSize || size),
      max: Number(token.max || token.maxSize || token.size || size)
    });
  }

  function normalizeTypographyOptions(plan = {}, text = '', opts = {}, roleOverride = '') {
    const next = Object.assign({}, opts);
    if (next.rawTypography === true) return next;
    const explicitRole = roleOverride || next.typeRole || next.textRole || '';
    const role = explicitRole || typeRoleForSize(next.fontSize || 10.2, next);
    const token = resolveTypeToken(plan, role, next);
    const hasCjk = textHasCjk(text);
    const allowTiny = next.allowTiny === true && !hasCjk;
    const isFooter = Number(next.y || 0) >= 6.62 || role === 'sourceNote' || role === 'caption';
    const isMicroSlot = Number(next.w || 0) < 0.72 || Number(next.h || 0) < 0.11 || role === 'microLabel';
    let size = next.fontSize == null || !next.lockFontSize ? token.fontSize : Number(next.fontSize);
    if (!allowTiny && !(isMicroSlot && !textHasCjk(text))) {
      const qa = visualSystem.visualQA || {};
      const bodyToken = resolveTypeToken(plan, 'body');
      const cjkBodyMin = Math.max(Number(qa.preferredBodyMin || 8.8), Number(bodyToken.min || 8.8));
      const captionMin = hasCjk
        ? Math.max(Number(qa.preferredCaptionMin || 7.2), Number(qa.preferredCjkCaptionMin || qa.minRenderedCjkSize || 8.0))
        : Number(qa.preferredCaptionMin || 7.2);
      const roleMin = Number(token.min || (isFooter ? captionMin : cjkBodyMin));
      const floor = isFooter
        ? (hasCjk ? Math.max(roleMin, captionMin) : Math.min(roleMin, captionMin))
        : (hasCjk ? Math.max(roleMin, cjkBodyMin) : roleMin);
      if (hasCjk || role !== 'microLabel') size = Math.max(size, floor);
    }
    next.fontSize = Number(size.toFixed ? size.toFixed(2) : size);
    next.fontFace = fontForTypeText(plan, text, token, next);
    if (hasCjk && next.fit === 'shrink') next.fit = false;
    if (token.tracking != null && next.charSpace == null) next.charSpace = token.tracking;
    if (token.weight === 'bold' && next.bold == null) next.bold = true;
    if (token.fitPolicy && next.fit == null) next.fit = token.fitPolicy;
    next.__typeRole = role;
    delete next.typeRole;
    delete next.textRole;
    delete next.token;
    delete next.lockFontSize;
    delete next.rawTypography;
    return next;
  }

  return {
    fontForTypeText,
    normalizeTypographyOptions,
    resolveTypeToken,
    scaleSnapSize,
    textHasCjk,
    textLooksNumeric,
    typeRoleForSize,
    typographyFontSet,
    typographyProfileFor,
    typographyRoleToken,
    typographyRoot
  };
}

module.exports = {
  TYPE_ROLE_ALIASES,
  createTypographyTokenHelpers
};
