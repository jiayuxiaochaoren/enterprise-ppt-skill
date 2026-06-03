const {
  TYPE_ROLE_ALIASES,
  createTypographyTokenHelpers
} = require('./typography-tokens');

function createTypographyHelpers({
  visualSystem = {},
  fontStack = {},
  deepMerge,
  compactUnique,
  industryMatchIds,
  visualIndustryId
} = {}) {
  const {
    normalizeTypographyOptions,
    resolveTypeToken,
    textHasCjk,
    typographyFontSet,
    typographyProfileFor,
    typographyRoot
  } = createTypographyTokenHelpers({
    visualSystem,
    fontStack,
    deepMerge,
    compactUnique,
    industryMatchIds,
    visualIndustryId
  });

  function typographyAudit(plan = {}, normalizedPlan = null, renderMeta = null) {
    const normalized = normalizedPlan || plan;
    const profile = typographyProfileFor(normalized);
    const fonts = typographyFontSet(normalized);
    const root = typographyRoot();
    const findings = [];
    const requiredRoles = ['coverTitle', 'pageTitle', 'body', 'caption', 'sourceNote', 'kicker', 'tableBody', 'chartLabel', 'metricLarge'];
    requiredRoles.forEach(role => {
      const token = resolveTypeToken(normalized, role);
      if (!token || !Number.isFinite(Number(token.size))) {
        findings.push({ level:'fail', type:'typographyTokenMissing', message:`missing typography token: ${role}` });
      }
    });
    if (!fonts.cjk || !fonts.latin || !fonts.number) {
      findings.push({ level:'fail', type:'typographyFontPolicyMissing', message:'typography font policy must define cjk, latin, and number fonts' });
    }
    const body = resolveTypeToken(normalized, 'body');
    const caption = resolveTypeToken(normalized, 'caption');
    if (body.size < 9 && /beauty|government|public/i.test(String(normalized.industry || ''))) {
      findings.push({ level:'review', type:'typographyBodyTooSmall', message:`body token ${body.size}pt is low for ${normalized.industry}` });
    }
    if (caption.size > body.size - 0.6) {
      findings.push({ level:'review', type:'typographyScaleTooFlat', message:'caption and body sizes are too close to create hierarchy' });
    }
    const metaSlides = renderMeta && Array.isArray(renderMeta.slides) ? renderMeta.slides : [];
    metaSlides.forEach(slideMeta => {
      const slideNo = Number(slideMeta.slide || 0);
      const boxes = Array.isArray(slideMeta.textBoxes) ? slideMeta.textBoxes : [];
      boxes.forEach(box => {
        const role = box.role || 'body';
        if (['microLabel', 'pageFolio', 'sourceNote', 'number'].includes(role)) return;
        const cjkChars = Number(box.cjkChars || 0);
        if (!cjkChars) return;
        const fit = String(box.fitStrategy || '');
        const fontSize = Number(box.fontSize || 0);
        const roleToken = resolveTypeToken(normalized, role || 'body');
        const roleMin = Number(roleToken.min || roleToken.size || body.min || 8.8);
        const boxH = Number((box.box && box.box.h) || 0);
        const charsPerInch = Number(box.charsPerInch || 0);
        const areaDensity = Number(box.areaDensity || 0);
        const shrink = /shrink/i.test(fit);
        const metaRisk = String(box.readabilityRiskLevel || '').toLowerCase();
        const metaShrinkRisk = box.shrinkRisk === true || ['review', 'fail'].includes(metaRisk);
        const dense = charsPerInch > 18 || areaDensity > 95 || (boxH > 0 && boxH < 0.18 && cjkChars >= 10);
        if ((shrink || metaShrinkRisk) && (fontSize < roleMin || dense || metaShrinkRisk)) {
          const riskLevel = metaRisk === 'fail'
            ? 'fail'
            : (metaRisk === 'review'
              ? 'review'
              : (fontSize < Math.max(7.8, roleMin - 1.2) || areaDensity > 130 ? 'fail' : 'review'));
          findings.push({
            slide: slideNo,
            level: riskLevel,
            type:'textShrinkRisk',
            message:`${role} text uses fit:${fit || 'meta-risk'} with ${cjkChars} CJK chars in ${Number(((box.box && box.box.w) || 0)).toFixed(2)}x${boxH.toFixed(2)}in box`,
            role,
            fontSize,
            roleMin,
            charsPerInch,
            areaDensity,
            region: box.region || '',
            readabilityRiskLevel: box.readabilityRiskLevel || '',
            sample:box.sample || ''
          });
        }
      });
    });
    return {
      version:'typography-audit/v1',
      status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
      profile,
      fonts,
      scale: root.scale || [],
      findings
    };
  }

  return {
    normalizeTypographyOptions,
    resolveTypeToken,
    textHasCjk,
    typographyAudit,
    typographyFontSet,
    typographyProfileFor
  };
}

module.exports = {
  TYPE_ROLE_ALIASES,
  createTypographyHelpers
};
