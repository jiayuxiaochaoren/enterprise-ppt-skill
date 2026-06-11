const {
  evidenceGalleryRendererKey
} = require('./evidence-gallery-routing');
const {
  createCaseFeaturedGallery
} = require('./evidence-gallery-case-featured');
const {
  createCaseTriptychGallery
} = require('./evidence-gallery-case-triptych');

function createCaseGalleryRenderer(ctx = {}, deps = {}) {
  const {
    galleryImages
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader,
    variantRenderers
  } = deps;
  const { renderCaseFeaturedGallery } = createCaseFeaturedGallery(ctx, deps);
  const { renderCaseTriptychGallery } = createCaseTriptychGallery(ctx, deps);

  function renderScreenshotContactSheet(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'SCREENSHOT REVIEW',
      title:s.title || '16:9 页面截图预览',
      titleSize:22.5,
      subtitle:s.subtitle || '完整等比展示页面截图，避免证据图槽位裁切。',
      subtitleW:6.8,
      subtitleSize:8.8,
      idx
    });

    const images = galleryImages(plan, s);
    const items = s.items || s.cards || [];
    const slots = [
      { x:0.86, y:1.84, w:5.66, h:3.18 },
      { x:6.82, y:1.84, w:5.66, h:3.18 }
    ];
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      const image = images[i];
      ctx.addRect(slide, slot.x, slot.y, slot.w, slot.h, ctx.panelFill(), ctx.colors().line, {
        fill:{ color:ctx.panelFill(), transparency:0 },
        line:{ color:ctx.colors().line, transparency:18, width:0.38 }
      });
      if (image) {
        ctx.addPhotoPanel(slide, image, slot.x, slot.y, slot.w, slot.h, {
          fit:'contain',
          tone:'light',
          transparency:100,
          stroke:ctx.colors().line,
          strokeTransparency:28,
          strokeWidth:0.38
        });
      }
      ctx.addText(slide, String((s.startIndex || 1) + i).padStart(2, '0'), {
        x:slot.x,
        y:slot.y + slot.h + 0.28,
        w:0.36,
        h:0.12,
        fontSize:6.8,
        bold:true,
        color:i === 0 ? ctx.colors().accent : ctx.colors().cyan,
        fit:'shrink'
      });
      ctx.addText(slide, item.title || `样张 ${i + 1}`, {
        x:slot.x + 0.48,
        y:slot.y + slot.h + 0.24,
        w:3.88,
        h:0.14,
        fontSize:8.4,
        bold:true,
        color:ctx.colors().text,
        fit:'shrink'
      });
      if (item.body) {
        ctx.addText(slide, item.body, {
          x:slot.x + 0.48,
          y:slot.y + slot.h + 0.52,
          w:4.44,
          h:0.12,
          fontSize:6.6,
          color:ctx.colors().muted,
          fit:'shrink'
        });
      }
    });
    ctx.addText(slide, s.note || '截图槽位为 16:9，并使用 contain 等比展示；用于检查页面整体质感。', {
      x:0.88,
      y:6.44,
      w:8.20,
      h:0.14,
      fontSize:7.6,
      color:ctx.colors().muted,
      fit:'shrink'
    });
    drawFooter(slide, plan, { color:'738297' });
  }

  return function caseGallery(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, 'triptych-gallery');
    if (variant === 'screenshot-contact-sheet') {
      renderScreenshotContactSheet(slide, plan, s, idx);
      return;
    }
    const rendererKey = evidenceGalleryRendererKey(variant, plan);
    if (rendererKey) {
      const renderer = variantRenderers[rendererKey];
      if (typeof renderer !== 'function') throw new Error(`missing evidence gallery renderer: ${rendererKey}`);
      return renderer(slide, plan, s, idx);
    }
    drawLightPageHeader(slide, {
      kicker:'CASE EVIDENCE',
      title:s.title || '案例与素材证据',
      titleSize:23.5,
      subtitle:s.subtitle || s.intro,
      subtitleW:5.9,
      subtitleSize:9.0,
      idx
    });

    const images = galleryImages(plan, s);
    const items = s.items || s.cards || [];
    if (images.length >= 3 && items.length <= 4) {
      renderCaseTriptychGallery(slide, plan, s, images, items);
      return;
    }
    renderCaseFeaturedGallery(slide, plan, s, images, items);
  };
}

module.exports = {
  createCaseGalleryRenderer
};
