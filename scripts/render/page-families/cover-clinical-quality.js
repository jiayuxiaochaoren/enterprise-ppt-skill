function createClinicalQualityCover(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    drawFooter,
    fileExists
  } = deps;

  return function clinicalQualityCover(slide, plan, s) {
    const C = colors();
    const industry = typeof ctx.industryProfile === 'function' ? (ctx.industryProfile(plan) || {}) : {};
    const accent = C.secondary || C.accent;
    const paper = 'F7FBF9';
    const title = String(s.title || plan.title || ctx.copyFallback(plan, 'coverTitle') || '')
      .replace(/\s+/g, '')
      .replace(/复盘$/, '\n复盘');
    const tagline = s.coverTagline || '渠道效率 · 服务履约 · 客户信任';
    const subline = s.coverInsightShort || '推动增长回到可复诊、可续费、可复盘。';
    const coverImage = s.coverImage || plan.coverImage || '';
    const hasCoverImage = coverImage && (!fileExists || fileExists(coverImage));

    ctx.addRect(slide, 0, 0, 13.333, 7.5, paper, paper, {
      fill:{ color:paper, transparency:0 },
      line:{ color:paper, transparency:100 }
    });
    if (hasCoverImage) {
      if (typeof ctx.addPhotoPanel === 'function') {
        ctx.addPhotoPanel(slide, coverImage, 0, 0, 13.333, 7.5, {
          role:'cover-background',
          fit:'cover',
          tone:'light',
          transparency:100,
          recordFit:true
        });
      } else if (slide && typeof slide.addImage === 'function') {
        slide.__codexImageFits = slide.__codexImageFits || [];
        slide.__codexImageFits.push({
          path:coverImage,
          role:'cover-background',
          fit:'cover',
          fallbackContain:false,
          slot:{ w:13.333, h:7.5 },
          slotAspectRatio:1.778
        });
        slide.addImage({
          path:coverImage,
          x:0, y:0, w:13.333, h:7.5,
          sizing:{ type:'cover', x:0, y:0, w:13.333, h:7.5 }
        });
      }
      ctx.addRect(slide, 0, 0, 6.08, 7.5, paper, paper, {
        fill:{ color:paper, transparency:6 },
        line:{ color:paper, transparency:100 }
      });
    }
    ctx.addText(slide, '01', {
      x:11.66, y:0.70, w:0.48, h:0.18,
      fontSize:11.2, bold:true, color:accent, align:'right', fit:'shrink'
    });

    ctx.addRect(slide, 0.88, 1.06, 0.055, 4.84, accent, accent, {
      fill:{ color:accent, transparency:0 },
      line:{ color:accent, transparency:100 }
    });

    addCoverKicker(slide, plan, industry, { x:1.20, y:1.02, w:3.80, h:0.14, fontSize:7.1, color:accent, charSpace:0.9 });
    ctx.addText(slide, title, {
      x:1.18, y:1.90, w:6.20, h:1.24,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 34.0),
      bold:true, color:C.text, breakLine:true, fit:'shrink'
    });
    ctx.addText(slide, tagline, {
      x:1.22, y:3.56, w:3.70, h:0.16,
      fontSize:8.9, bold:true, color:C.body, fit:'shrink'
    });
    ctx.addText(slide, subline, {
      x:1.22, y:3.92, w:4.24, h:0.18,
      fontSize:8.4, color:C.muted, fit:'shrink'
    });

    ctx.addRect(slide, 1.20, 5.72, 4.20, 0.035, accent, accent, {
      fill:{ color:accent, transparency:22 },
      line:{ color:accent, transparency:100 }
    });
    ctx.addDeckMeta(slide, plan, { x:1.20, y:6.20, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted });
  };
}

module.exports = {
  createClinicalQualityCover
};
