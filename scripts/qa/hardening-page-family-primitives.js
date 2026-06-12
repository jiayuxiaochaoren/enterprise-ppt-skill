const {
  PAGE_FAMILY_PRIMITIVE_GROUPS,
  P2_PAGE_FAMILY_PRIMITIVE_TARGETS,
  requiredPageFamilyPrimitiveExports
} = require('../render/page-families/primitive-contract');
const {
  createPageFamilyPrimitives
} = require('../render/page-families/primitives');

function createPrimitiveProbeContext() {
  const noop = () => {};
  const colors = () => ({
    accent: '2563EB',
    darkMuted: '94A3B8',
    line: 'CBD5E1',
    muted: '64748B',
    text: '111827',
    white: 'FFFFFF'
  });
  const target = {
    PageNumber: noop,
    addEvidenceCaptionStack: noop,
    addNumber: noop,
    addRect: noop,
    addSmartPhotoPanel: noop,
    addText: noop,
    colors,
    footerText: () => '',
    genericShowcaseField: noop,
    lightCanvas: noop,
    panelFill: () => 'FFFFFF',
    sectionKicker: noop,
    stageCanvas: noop
  };
  return new Proxy(target, {
    get(obj, prop) {
      return prop in obj ? obj[prop] : noop;
    }
  });
}

function primitiveFacadeExportNames(opts = {}) {
  if (Array.isArray(opts.facadeExports)) return [...opts.facadeExports].sort();
  const factory = opts.createPageFamilyPrimitives || createPageFamilyPrimitives;
  const primitives = factory(opts.context || createPrimitiveProbeContext()) || {};
  return Object.keys(primitives).filter(name => typeof primitives[name] === 'function').sort();
}

function pageFamilyPrimitiveSummary(opts = {}) {
  const groups = Array.isArray(opts.groups) ? opts.groups : PAGE_FAMILY_PRIMITIVE_GROUPS;
  const targets = Array.isArray(opts.targets) ? opts.targets : P2_PAGE_FAMILY_PRIMITIVE_TARGETS;
  const expectedExports = requiredPageFamilyPrimitiveExports(groups);
  let exposedExports = [];
  let error = '';
  try {
    exposedExports = primitiveFacadeExportNames(opts);
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  }
  const exposed = new Set(exposedExports);
  const missingExports = expectedExports.filter(name => !exposed.has(name));
  const missingTargets = targets.filter(name => !exposed.has(name));
  const extraExports = exposedExports.filter(name => !expectedExports.includes(name));
  const groupRows = groups.map(group => {
    const exports = Array.isArray(group.exports) ? group.exports : [];
    const missing = exports.filter(name => !exposed.has(name));
    return {
      id: group.id || '',
      label: group.label || '',
      exportCount: exports.length,
      exposedCount: exports.length - missing.length,
      missingExports: missing,
      ready: missing.length === 0
    };
  });
  return {
    ready: !error && missingExports.length === 0 && missingTargets.length === 0,
    error,
    groupCount: groupRows.length,
    expectedExportCount: expectedExports.length,
    exposedExportCount: exposedExports.length,
    targetCount: targets.length,
    exposedTargetCount: targets.length - missingTargets.length,
    expectedExports,
    exposedExports,
    extraExports,
    missingExports,
    missingTargets,
    groups: groupRows
  };
}

module.exports = {
  createPrimitiveProbeContext,
  pageFamilyPrimitiveSummary,
  primitiveFacadeExportNames
};
