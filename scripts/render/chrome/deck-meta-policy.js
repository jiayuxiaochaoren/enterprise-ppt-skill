function createDeckMetaPolicy(deps = {}) {
  const addText = deps.addText || (() => false);

  function metaDisabled(plan = {}) {
    return plan.showMeta === false || plan.meta === false || plan.metaPolicy === 'none';
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
    if (plan.metaText) return [String(plan.metaText)];
    const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
    if (isCompanyIntroPlan(plan) && !Array.isArray(plan.metaFields)) {
      const org = metadata.organization || plan.organization || '';
      return plan.showMeta === true && org ? [String(org)] : [];
    }
    const raw = Array.isArray(plan.metaFields)
      ? plan.metaFields
      : [metadata.organization || plan.organization, metadata.audience || plan.audience, metadata.date || plan.date];
    return raw.map(v => metaValue(plan, v)).filter(Boolean);
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
      if (typeof plan.footerText === 'string') return plan.footerText.replace(/(能力介绍|公司介绍|企业介绍|宣传册)$/g, '').trim() || plan.footerText;
      if (typeof plan.footer === 'string') {
        if (org && (plan.footer.includes(org) || /能力介绍|公司介绍|企业介绍|宣传册/i.test(plan.footer))) return String(org);
        return plan.footer;
      }
      if (org) return String(org);
    }
    if (typeof plan.footerText === 'string') return plan.footerText;
    if (typeof plan.footer === 'string') return plan.footer;
    if (plan.footerPolicy === 'title' || plan.useTitleAsFooter === true) return plan.title || '';
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
    planPptType
  };
}

module.exports = {
  createDeckMetaPolicy
};
