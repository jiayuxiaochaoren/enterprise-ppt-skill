const {
  closingRendererKey,
  closingTextForSlide
} = require('./closing-routing');
const {
  createClosingIndustryRenderers
} = require('./closing-industry');
const {
  createClosingStandardRenderers
} = require('./closing-standard');
const {
  assertRendererContext
} = require('../renderer-context');

function createClosingCoreRenderers(ctx = {}) {
  assertRendererContext(ctx, ['closing'], { label:'closing renderer context' });

  function closingMeta(plan) {
    if (ctx.isCompanyIntroPlan(plan)) return ctx.footerText(plan);
    if (ctx.metaDisabled(plan)) return '';
    return ctx.coverMetaText(plan);
  }

  function closingActions(s = {}) {
    if (Array.isArray(s.actions)) return s.actions.slice(0, 3).map(v => typeof v === 'string' ? { title:v, body:'' } : v);
    if (Array.isArray(s.items)) return s.items.slice(0, 3).map(v => typeof v === 'string' ? { title:v, body:'' } : v);
    const plan = ctx.activePlan();
    const actions = ctx.copyPolicyList(plan, 'closingActions', []);
    if (actions.length) return actions.slice(0, 3);
    const note = s.note || s.nextStep || ctx.copyFallback(plan, 'closingNote');
    return [{ title:'Scope', body:note }];
  }

  const sharedClosingApi = { closingActions, closingMeta };
  const standardRenderers = createClosingStandardRenderers(ctx, sharedClosingApi);
  const industryRenderers = createClosingIndustryRenderers(ctx, sharedClosingApi);

  function closingAdaptive(slide, plan, s, idx) {
    const design = ctx.designForSlide(plan, s, 'closing');
    const closingVariant = ctx.variantOf(s) || s.closingVariant || '';
    const tone = ctx.presentationSpec().coverTone || 'dark';
    const rendererKey = closingRendererKey(plan, s, {
      variant: closingVariant,
      closingText: closingTextForSlide(s),
      isCompanyIntro: ctx.isCompanyIntroPlan(plan),
      hasImageStatement: Boolean(design.wantsImage && design.imagePath && ctx.fileExists(design.imagePath)),
      coverTone: tone
    });
    const renderers = Object.assign({}, standardRenderers, industryRenderers);
    const renderer = renderers[rendererKey];
    if (typeof renderer !== 'function') throw new Error(`missing closing renderer: ${rendererKey}`);
    return renderer(slide, plan, s, idx);
  }

  return Object.assign({
    closingAdaptive
  }, standardRenderers, industryRenderers);
}

module.exports = {
  createClosingCoreRenderers
};
