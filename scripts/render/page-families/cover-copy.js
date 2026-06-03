function createCoverCopyHelpers(ctx = {}) {
  function coverKickerText(plan = {}, industry = {}) {
    if (plan.coverKicker === false || plan.kicker === false) return '';
    if (ctx.isCompanyIntroPlan(plan) && plan.coverKicker == null && plan.kicker == null) return '';
    const label = typeof plan.coverKicker === 'string' ? plan.coverKicker
      : (typeof plan.kicker === 'string' ? plan.kicker : (industry.label || 'DIGITAL OPERATIONS'));
    if (!label) return '';
    const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
    const date = ctx.metaDisabled(plan) ? '' : (metadata.date || plan.date || '');
    const year = date ? String(date).slice(0, 4) : '';
    if (year && plan.showYear !== false) return `${label}  /  ${year}`;
    return label;
  }

  function addCoverKicker(slide, plan, industry, opts = {}) {
    const text = coverKickerText(plan, industry);
    if (!text) return false;
    ctx.addLabel(slide, text, opts);
    return true;
  }

  function splitEnergyTitle(title) {
    const text = String(title || '').replace(/\n/g, '').trim();
    const index = text.indexOf('智能');
    if (index > 3 && text.length <= 18) return [text.slice(0, index), text.slice(index)];
    return [text, ''];
  }

  function premiumTitle(title, opts = {}) {
    const text = String(title || '').trim();
    if (opts.mode === 'none') return text.replace(/\s*\n\s*/g, ' ');
    const threshold = opts.threshold || 20;
    if (text.length > threshold && !text.includes('\n')) {
      const cut = Math.min(Math.max(8, Math.round(text.length * 0.58)), text.length - 4);
      return `${text.slice(0, cut)}\n${text.slice(cut)}`;
    }
    return text;
  }

  function coverTitleText(title) {
    const spec = ctx.presentationSpec();
    const token = ctx.typeToken('coverTitle', { breakAt:22 });
    const mode = spec.coverTitleBreak === 'none' ? 'none' : 'auto';
    return premiumTitle(title, { mode, threshold:spec.coverTitleBreakAt || token.breakAt || 22 });
  }

  return {
    addCoverKicker,
    coverKickerText,
    coverTitleText,
    premiumTitle,
    splitEnergyTitle
  };
}

module.exports = {
  createCoverCopyHelpers
};
