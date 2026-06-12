function createDeckMetaPolicy(deps = {}) {
  const addText = deps.addText || (() => false);
  const visiblePolicySegmentRe = /(脱敏|模拟数据|不代表真实|外发前|真实授权|授权数据|仅用于|测试文案|测试数据|数据性质|敏感信息|不可公开|公开前|来源[:：]?\s*用户提供|用户提供的?行业基础数据包|行业基础数据包|desensiti[sz]e|simulated data|dummy data|test data|not real|placeholder|source\s*:)/i;

  function metaDisabled(plan = {}) {
    return plan.showMeta === false || plan.meta === false || plan.metaPolicy === 'none';
  }

  function sanitizeVisibleMetaText(value = '') {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const parts = text
      .split(/\s*(?:[|｜/／;；,，]+)\s*/g)
      .map(part => part.trim())
      .filter(Boolean);
    const candidates = parts.length ? parts : [text];
    const kept = candidates.filter(part => !visiblePolicySegmentRe.test(part));
    if (kept.length) return kept.join('｜');
    return visiblePolicySegmentRe.test(text) ? '' : text;
  }

  function metaValue(plan = {}, keyOrValue = '') {
    if (keyOrValue == null || keyOrValue === false) return '';
    if (typeof keyOrValue !== 'string') return String(keyOrValue);
    const key = keyOrValue.trim();
    if (!key) return '';
    const source = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
    if (Object.prototype.hasOwnProperty.call(plan, key) || Object.prototype.hasOwnProperty.call(source, key)) {
      return String(source[key] || plan[key] || '');
    }
    return key;
  }

  function planPptType(plan = {}) {
    return String((plan.materialIntelligence && plan.materialIntelligence.pptType) || plan.ppt_type || plan.pptType || '');
  }

  function isCompanyIntroPlan(plan = {}) {
    const text = [
      planPptType(plan),
      plan.title,
      plan.subtitle,
      plan.deckType
    ].filter(Boolean).join(' ');
    return /company-intro|公司介绍|企业介绍|企业简介|能力介绍|宣传册/i.test(text);
  }

  function deckMetaFields(plan = {}) {
    if (metaDisabled(plan)) return [];
    if (plan.metaText) return [sanitizeVisibleMetaText(plan.metaText)].filter(Boolean);
    const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
    const hasExplicitFields = Array.isArray(plan.metaFields);
    if (isCompanyIntroPlan(plan) && !Array.isArray(plan.metaFields)) {
      const org = metadata.organization || plan.organization || '';
      return plan.showMeta === true && org ? [sanitizeVisibleMetaText(org)].filter(Boolean) : [];
    }
    if (!hasExplicitFields && plan.showMeta !== true && plan.metaPolicy !== 'auto') return [];
    const raw = hasExplicitFields
      ? plan.metaFields
      : [metadata.organization || plan.organization, metadata.audience || plan.audience, metadata.date || plan.date];
    return raw.map(v => sanitizeVisibleMetaText(metaValue(plan, v))).filter(Boolean);
  }

  function coverMetaText(plan) {
    return deckMetaFields(plan).join('  /  ');
  }

  function addDeckMeta(slide, plan, opts = {}) {
    const text = coverMetaText(plan);
    if (!text) return false;
    addText(slide, text, opts);
    return true;
  }

  function footerText(plan = {}) {
    if (plan.showFooter === false || plan.footer === false || plan.footerPolicy === 'none') return '';
    const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
    const org = metadata.organization || plan.organization || '';
    if (isCompanyIntroPlan(plan)) {
      if (typeof plan.footerText === 'string') {
        const text = plan.footerText.replace(/(能力介绍|公司介绍|企业介绍|宣传册)$/g, '').trim() || plan.footerText;
        return sanitizeVisibleMetaText(text);
      }
      if (typeof plan.footer === 'string') {
        if (org && (plan.footer.includes(org) || /能力介绍|公司介绍|企业介绍|宣传册/i.test(plan.footer))) return sanitizeVisibleMetaText(org);
        return sanitizeVisibleMetaText(plan.footer);
      }
      if (org) return sanitizeVisibleMetaText(org);
    }
    if (typeof plan.footerText === 'string') return sanitizeVisibleMetaText(plan.footerText);
    if (typeof plan.footer === 'string') return sanitizeVisibleMetaText(plan.footer);
    if (plan.footerPolicy === 'title' || plan.useTitleAsFooter === true) return sanitizeVisibleMetaText(plan.title || '');
    return '';
  }

  return {
    addDeckMeta,
    coverMetaText,
    deckMetaFields,
    footerText,
    isCompanyIntroPlan,
    metaDisabled,
    metaValue,
    planPptType,
    sanitizeVisibleMetaText
  };
}

module.exports = {
  createDeckMetaPolicy
};
