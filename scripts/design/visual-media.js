const fs = require('fs');
const path = require('path');
const {
  contentThemeForCoverStyle,
  coverStyleDecision
} = require('./cover-style');

function createVisualMediaHelpers({
  assetDir,
  assetRoleNeedsImage,
  industryPackFor,
  industryVisualPolicy,
  mediaAssets = {},
  normalizeAssetRole,
  visualRouter = {},
  visualSystem = {}
} = {}) {
  function slideRole(s = {}) {
    const type = s.type || 'content';
    if (type === 'cover' || type === 'cover-dark') return 'cover';
    if (type === 'closing' || type === 'closing-dark') return 'closing';
    if (type === 'chapter-divider') return 'navigation';
    if (type === 'company-profile-spread') return 'situation';
    if (type === 'profile-proof') return 'situation';
    if (type === 'comparison') return 'value';
    if (type === 'quote-proof') return 'split';
    if (type === 'toc' || type === 'toc-clean') return 'navigation';
    if (type === 'two-column' || type === 'two-column-clean') return 'situation';
    if (type === 'cards' || type === 'executive-blocks') return 'split';
    if (type === 'metric-comparison') return 'value';
    if (type === 'finance-bridge' || type === 'portfolio-table') return 'value';
    if (type === 'manifesto') return 'split';
    if (type === 'product-showcase') return 'product';
    if (type === 'strategy-map') return 'architecture';
    if (type === 'module-matrix') return 'capability';
    if (type === 'architecture' || type === 'architecture-dark') return 'architecture';
    if (type === 'timeline' || type === 'timeline-dark') return 'timeline';
    if (type === 'value-tiles') return 'value';
    if (type === 'table' || type === 'risk-table') return 'risk';
    if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio') return 'case-gallery';
    return 'content';
  }

  function resolveVisualMode(plan = {}, s = {}, role = slideRole(s)) {
    const explicit = s.visual && s.visual.mode ? s.visual.mode : s.visualMode;
    if (explicit) return explicit;
    if (plan.visualMode && plan.visualMode !== 'auto') return plan.visualMode;
    const policy = industryVisualPolicy(plan);
    if ((policy.caseRoles || []).includes(role) || role === 'case-gallery') return 'case-gallery';
    return policy.visualMode || 'solid';
  }

  function visualRole(plan = {}, s = {}, role = slideRole(s)) {
    const visual = s.visual || {};
    if (visual.role) return visual.role;
    const recipeRole = s.referenceRecipe && s.referenceRecipe.assetRole;
    if (assetRoleNeedsImage(recipeRole)) return normalizeAssetRole(recipeRole);
    const policy = industryVisualPolicy(plan);
    const roles = Object.assign({}, policy.defaultImageRoles || {});
    if (roles[role]) return roles[role];
    if (role === 'case-gallery') return 'gallery';
    if (role === 'product') return 'showcase';
    if (role === 'situation') return 'evidence';
    if (role === 'cover') return 'showcase';
    return 'structure';
  }

  function slideWantsImage(plan = {}, s = {}, role = slideRole(s)) {
    const explicitMode = s.visual && s.visual.mode ? s.visual.mode : s.visualMode;
    if (explicitMode === 'solid') return false;
    if (explicitMode && explicitMode !== 'solid') return true;
    if ((s.visual && s.visual.image) || s.image || (Array.isArray(s.images) && s.images.length)) return true;
    if (role === 'case-gallery' && plan.media && plan.media.gallery) return true;
    if (plan.visualMode === 'solid') return false;
    if (plan.visualMode === 'photo' || plan.visualMode === 'case-gallery') return true;
    const policy = industryVisualPolicy(plan);
    const recipeRole = s.referenceRecipe && s.referenceRecipe.assetRole;
    const imageLedRecipe = assetRoleNeedsImage(recipeRole) &&
      /captioned-real-asset|showcase|gallery|proof|product|beauty/i.test(String(
        (s.referenceRecipe && (s.referenceRecipe.mainVisualMethod || s.referenceRecipe.layout || s.referenceRecipe.proofObject || s.referenceRecipe.id)) ||
        s.layoutVariant ||
        s.proofObject ||
        ''
      ));
    if (imageLedRecipe && (policy.visualMode === 'case-gallery' || policy.visualMode === 'hybrid' || ['image-rich', 'case-led', 'asset-led', 'luxury'].includes(plan.visualIntent || plan.assetMode || ''))) {
      return true;
    }
    if ((policy.photoRoles || []).includes(role)) return true;
    const rich = ['image-rich', 'case-led', 'asset-led', 'portfolio'].includes(plan.visualIntent || plan.assetMode || '');
    return rich && (policy.optionalPhotoRoles || []).includes(role);
  }

  function resolveAssetPath(assetPath) {
    if (!assetPath || typeof assetPath !== 'string') return '';
    if (path.isAbsolute(assetPath)) return assetPath;
    const cwdPath = path.resolve(process.cwd(), assetPath);
    if (fs.existsSync(cwdPath)) return cwdPath;
    return path.resolve(assetDir, assetPath.replace(/^assets\//, ''));
  }

  function mediaKeyForRole(role) {
    if (role === 'cover' || role === 'closing') return 'cover';
    if (role === 'navigation' || role === 'timeline') return 'band';
    if (role === 'case-gallery') return 'gallery';
    return 'detail';
  }

  function configuredIndustryMedia(plan = {}, role = 'cover') {
    const defaults = visualSystem.mediaDefaults || {};
    const industryDefaults = defaults[plan.industry] || {};
    const value = industryDefaults[mediaKeyForRole(role)] || industryDefaults[role];
    if (Array.isArray(value)) return resolveAssetPath(value[0]);
    return value ? resolveAssetPath(value) : '';
  }

  function defaultIndustryMedia(plan = {}, role = 'cover') {
    const configured = configuredIndustryMedia(plan, role);
    if (configured) return configured;
    if (plan.industry !== 'energy-utility') return '';
    if (role === 'cover' || role === 'closing') return mediaAssets.energyStorageCover;
    if (role === 'navigation' || role === 'timeline') return mediaAssets.energyStorageBand;
    if (role === 'situation' || role === 'split' || role === 'value' || role === 'case-gallery') return mediaAssets.energyStorageDetail;
    return '';
  }

  function mediaForRole(plan = {}, s = {}, role = slideRole(s), opts = {}) {
    const visual = s.visual || {};
    const direct = visual.image || s.image;
    if (direct) return resolveAssetPath(direct);
    const slideImages = [
      ...(Array.isArray(visual.images) ? visual.images : []),
      ...(Array.isArray(s.images) ? s.images : [])
    ];
    if (slideImages.length && ['cover', 'product', 'situation', 'case-gallery', 'value'].includes(role)) {
      return resolveAssetPath(slideImages[0]);
    }
    const media = plan.media || {};
    const key = mediaKeyForRole(role);
    const val = media[key];
    if (Array.isArray(val)) return resolveAssetPath(val[0]);
    if (val) return resolveAssetPath(val);
    if (opts && opts.includeDefault === false) return '';
    return defaultIndustryMedia(plan, role);
  }

  function galleryImages(plan = {}, s = {}) {
    const raw = s.images || (s.visual && s.visual.images) || (plan.media && plan.media.gallery) || [];
    return (Array.isArray(raw) ? raw : [raw]).map(resolveAssetPath).filter(p => p && fs.existsSync(p));
  }

  function pageFamily(plan = {}, s = {}, roleOverride) {
    const role = roleOverride || slideRole(s);
    const mode = resolveVisualMode(plan, s, role);
    const imageRole = visualRole(plan, s, role);
    const wantsImage = slideWantsImage(plan, s, role);
    const familyKey = wantsImage ? imageRole : mode;
    const families = (((visualRouter.layoutFamilies || {})[role] || {})[familyKey]) ||
      (((visualRouter.layoutFamilies || {})[role] || {})[mode]);
    if (families) return families;
    return {
      cover: 'stage-cover',
      closing: 'stage-closing',
      navigation: 'spatial-navigation',
      situation: imageRole === 'evidence' ? 'evidence-split' : 'light-narrative',
      split: 'split-insight',
      architecture: 'system-architecture',
      capability: 'capability-map',
      product: 'product-showcase',
      timeline: 'pathway-timeline',
      value: 'value-signal',
      risk: 'risk-matrix',
      'case-gallery': 'case-gallery'
    }[role] || 'light-narrative';
  }

  function slideDesign(plan = {}, s = {}, roleOverride) {
    const role = roleOverride || slideRole(s);
    const mode = resolveVisualMode(plan, s, role);
    const style = coverStyleDecision(plan, s, { visualSystem, industryPackFor });
    const preset = style.preset || null;
    const explicitVisualRole = Boolean(s.visual && s.visual.role);
    const imageRole = role === 'cover' && preset && preset.imageRole && !explicitVisualRole
      ? preset.imageRole
      : visualRole(plan, s, role);
    const wantsStyleImage = role === 'cover' && preset && preset.assetPolicy && preset.assetPolicy !== 'none';
    const wantsImage = slideWantsImage(plan, s, role) || Boolean(wantsStyleImage);
    const imagePath = wantsImage ? mediaForRole(plan, s, role) : '';
    return {
      role,
      mode,
      imageRole,
      wantsImage,
      imagePath,
      mediaKey: mediaKeyForRole(role),
      coverStyle: role === 'closing' ? '' : style.id,
      coverStyleSource: role === 'closing' ? '' : style.source,
      coverStylePreset: role === 'closing' ? null : preset,
      contentTheme: role === 'closing' ? null : contentThemeForCoverStyle(preset),
      pageFamily: pageFamily(plan, s, role)
    };
  }

  return {
    coverStyleForPlan: (plan = {}, s = {}) => coverStyleDecision(plan, s, { visualSystem, industryPackFor }).id,
    defaultIndustryMedia,
    galleryImages,
    mediaForRole,
    mediaKeyForRole,
    pageFamily,
    resolveAssetPath,
    resolveVisualMode,
    slideDesign,
    slideRole,
    slideWantsImage,
    visualRole
  };
}

module.exports = {
  createVisualMediaHelpers
};
