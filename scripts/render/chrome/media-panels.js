function createMediaPanelHelpers(core = {}, helpers = {}) {
  const { C, DESIGN, H, MEDIA_ASSETS, W, deps, fs } = core;
  const h = helpers;

  function addImageIfExists(slide, imagePath, opts) {
    if (imagePath && fs.existsSync(imagePath)) {
      slide.addImage(Object.assign({ path:imagePath }, opts));
      return true;
    }
    return false;
  }
  function addPhotoPanel(slide, imagePath, x, y, w, hgt, opts = {}) {
    if (!imagePath || !fs.existsSync(imagePath)) {
      h.addRect(slide, x, y, w, hgt, opts.fallback || C.ink, opts.fallback || C.ink);
      return false;
    }
    const fit = opts.fit || 'cover';
    slide.addImage({ path:imagePath, x, y, w, h:hgt, sizing:{ type:fit, x, y, w, h:hgt } });
    const overlay = opts.overlay || (opts.tone === 'light' ? 'FFFFFF' : C.ink);
    h.addRect(slide, x, y, w, hgt, overlay, overlay, {
      fill:{ color:overlay, transparency:opts.transparency ?? (opts.tone === 'light' ? 42 : 48) },
      line:{ color:overlay, transparency:100 }
    });
    if (opts.stroke) {
      h.addRect(slide, x, y, w, hgt, overlay, opts.stroke, {
        fill:{ color:overlay, transparency:100 },
        line:{ color:opts.stroke, transparency:opts.strokeTransparency ?? 55, width:opts.strokeWidth || 0.4 }
      });
    }
    return true;
  }
  function imageAspect(imagePath) {
    const dims = deps.imageDimensions(imagePath);
    return dims ? dims.w / Math.max(1, dims.h) : 1.5;
  }
  function imagePathFromItem(item = {}, fallback = '') {
    if (typeof item === 'string') return deps.resolveAssetPath(item);
    return deps.resolveAssetPath(item.image || item.img || item.photo || item.src || fallback || '');
  }
  function smartPhotoFit(imagePath, slot = {}, role = 'evidence') {
    if (!imagePath || !fs.existsSync(imagePath)) return 'cover';
    const slotAspect = slot.w && slot.h ? slot.w / Math.max(0.01, slot.h) : 1.5;
    const aspect = imageAspect(imagePath);
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole.includes('split') && (aspect > slotAspect * 1.45 || aspect < slotAspect * 0.68)) return 'contain';
    if (slotAspect < 0.85 && aspect > slotAspect * 1.70) return 'contain';
    if (role === 'showcase' && (aspect > slotAspect * 1.45 || aspect < slotAspect * 0.68)) return 'contain';
    if (role === 'evidence' && (aspect > slotAspect * 2.10 || aspect < slotAspect * 0.45)) return 'contain';
    return 'cover';
  }
  function recordImageFit(slide, imagePath, slot = {}, role = 'evidence', fit = 'cover') {
    if (!slide || !imagePath) return;
    const dims = deps.imageDimensions(imagePath);
    const slotAspect = slot.w && slot.h ? slot.w / Math.max(0.01, slot.h) : null;
    const imageAspectRatio = dims ? dims.w / Math.max(1, dims.h) : null;
    const aspectMismatch = slotAspect && imageAspectRatio
      ? Math.abs(imageAspectRatio - slotAspect) / slotAspect
      : null;
    slide.__codexImageFits = slide.__codexImageFits || [];
    slide.__codexImageFits.push({
      path: imagePath,
      role,
      fit,
      fallbackContain: fit === 'contain',
      slot: { w:slot.w, h:slot.h },
      slotAspectRatio: slotAspect == null ? undefined : Number(slotAspect.toFixed(3)),
      imageDimensions: dims ? { w:dims.w, h:dims.h, type:dims.type } : undefined,
      imageAspectRatio: imageAspectRatio == null ? undefined : Number(imageAspectRatio.toFixed(3)),
      aspectMismatch: aspectMismatch == null ? undefined : Number(aspectMismatch.toFixed(3))
    });
  }
  function addSmartPhotoPanel(slide, imagePath, x, y, w, hgt, opts = {}) {
    const role = opts.role || 'evidence';
    const fit = opts.fit || smartPhotoFit(imagePath, { w, h:hgt }, role);
    recordImageFit(slide, imagePath, { w, h:hgt }, role, fit);
    return addPhotoPanel(slide, imagePath, x, y, w, hgt, Object.assign({}, opts, { fit }));
  }
  function addCaptionBar(slide, x, y, w, hgt, opts = {}) {
    const dark = opts.dark !== false;
    const fill = opts.fill || (dark ? C.ink : h.panelFill());
    const labelColor = opts.labelColor || C.accent;
    h.addRect(slide, x, y, w, hgt, fill, fill, {
      fill:{ color:fill, transparency:opts.transparency ?? (dark ? 6 : 0) },
      line:{ color:fill, transparency:100 }
    });
    if (opts.label) {
      h.addLabel(slide, opts.label, {
        x:x + 0.22, y:y + 0.14, w:opts.labelWidth || 1.20, h:0.12,
        fontSize:opts.labelSize || 6.8,
        color:labelColor,
        charSpace:opts.charSpace ?? 0.4
      });
    }
    if (opts.caption) {
      const labelW = opts.label ? (opts.labelWidth || 1.20) + 0.34 : 0.22;
      h.addText(slide, opts.caption, {
        x:x + labelW, y:y + 0.14, w:Math.max(0.6, w - labelW - 0.28), h:0.11,
        fontSize:opts.fontSize || 6.8,
        color:opts.color || (dark ? (C.captionOnImage || 'CBD5E1') : C.body),
        fit:'shrink'
      });
    }
  }
  function genericShowcaseField(slide, x, y, w, hgt, label = 'PRODUCT SYSTEM') {
    h.addRect(slide, x, y, w, hgt, C.ink, C.ink, { fill:{ color:C.ink, transparency:0 }, line:{ color:C.ink, transparency:100 } });
    h.addDarkBreathingCircle(slide, x + w * 0.44, y + hgt * 0.12, Math.min(w, hgt) * 0.86, Math.min(w, hgt) * 0.48, C.accent);
    h.addPulseCurve(slide, x + w * 0.16, y + hgt * 0.62, w * 0.58, hgt * 0.14, C.cyan, true, { transparency:50, width:0.38, nodes:false });
    h.addLabel(slide, label, { x:x + 0.32, y:y + hgt - 0.46, w:w - 0.64, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
  }
  function addEvidenceImageFrame(slide, imagePath, x, y, w, hgt, opts = {}) {
    const frameFill = opts.frameFill || (opts.dark ? C.ink : h.panelFill());
    const frameLine = opts.frameLine || (opts.dark ? (C.darkLine || '334155') : C.line);
    h.addRect(slide, x, y, w, hgt, frameFill, frameLine, {
      fill:{ color:frameFill, transparency:opts.frameTransparency ?? (opts.dark ? 0 : 0) },
      line:{ color:frameLine, transparency:opts.lineTransparency ?? 20, width:opts.lineWidth || 0.44 }
    });
    const inset = opts.inset ?? 0.12;
    const captionH = opts.caption || opts.label ? (opts.captionH || 0.42) : 0;
    const photoH = Math.max(0.2, hgt - inset * 2 - captionH);
    if (imagePath && fs.existsSync(imagePath)) {
      addSmartPhotoPanel(slide, imagePath, x + inset, y + inset, w - inset * 2, photoH, {
        role:opts.role || 'evidence',
        tone:opts.dark ? 'dark' : 'light',
        transparency:opts.photoTransparency ?? 100,
        stroke:opts.photoStroke || frameLine,
        strokeTransparency:opts.photoStrokeTransparency ?? 32,
        fit:opts.fit
      });
    } else {
      genericShowcaseField(slide, x + inset, y + inset, w - inset * 2, photoH, opts.fallbackLabel || 'VISUAL PROOF');
    }
    if (captionH) {
      addCaptionBar(slide, x + inset, y + hgt - inset - captionH, w - inset * 2, captionH, {
        dark:opts.dark !== false,
        label:opts.label || 'EVIDENCE',
        caption:opts.caption || '',
        labelWidth:opts.labelWidth,
        transparency:opts.captionTransparency
      });
    }
  }
  function addEquipmentNameplate(slide, x, y, w, opts = {}) {
    const fill = opts.dark ? C.ink : (C.panelAlt || C.softBlue);
    const line = opts.color || C.accent;
    h.addRect(slide, x, y, w, 0.34, fill, line, {
      fill:{ color:fill, transparency:opts.dark ? 8 : 6 },
      line:{ color:line, transparency:20, width:0.38 }
    });
    h.addLabel(slide, opts.label || 'EQUIPMENT PROOF', { x:x + 0.16, y:y + 0.10, w:1.18, h:0.12, fontSize:6.8, color:line, charSpace:0.55 });
    h.addText(slide, opts.text || '', { x:x + 1.50, y:y + 0.10, w:Math.max(0.6, w - 1.72), h:0.10, fontSize:7.0, color:opts.dark ? (C.captionOnImage || 'CBD5E1') : C.body, fit:'shrink' });
  }
  function EvidenceImageFrame(slide, imagePath, x, y, w, hgt, opts = {}) {
    return addEvidenceImageFrame(slide, imagePath, x, y, w, hgt, opts);
  }
  function CaptionBar(slide, x, y, w, hgt, opts = {}) {
    return addCaptionBar(slide, x, y, w, hgt, opts);
  }
  function designForSlide(plan, s, role) {
    if (DESIGN && typeof DESIGN.slideDesign === 'function') return DESIGN.slideDesign(s, role);
    return {
      wantsImage:deps.slideWantsImage(plan, s, role),
      imagePath:deps.mediaForRole(plan, s, role),
      imageRole:deps.visualRole(plan, s, role)
    };
  }
  function addVisualPhotoPanel(slide, plan, s, role, x, y, w, hgt, opts = {}) {
    const designState = designForSlide(plan, s, role);
    if (!designState.wantsImage) return false;
    return addSmartPhotoPanel(slide, designState.imagePath, x, y, w, hgt, Object.assign({ role }, opts));
  }
  function addVisualPhotoBackdrop(slide, plan, s, role = 'cover', opts = {}) {
    const designState = designForSlide(plan, s, role);
    if (!designState.wantsImage) return false;
    return addSmartPhotoPanel(slide, designState.imagePath, 0, 0, W, H, Object.assign({ role, transparency:68 }, opts));
  }
  function addEnergyPhotoBackdrop(slide) {
    if (!addImageIfExists(slide, MEDIA_ASSETS.energyStorageCover, { x:0, y:0, w:W, h:H })) {
      return false;
    }
    h.addRect(slide, 0, 0, W, H, C.ink, C.ink, { fill:{ color:C.ink, transparency:72 }, line:{ color:C.ink, transparency:100 } });
    return true;
  }
  function addEnergyMotionBackdrop(slide) {
    if (!fs.existsSync(MEDIA_ASSETS.energyStorageLoop) || !fs.existsSync(MEDIA_ASSETS.energyStorageCover)) {
      return false;
    }
    const cover = `data:image/jpeg;base64,${fs.readFileSync(MEDIA_ASSETS.energyStorageCover).toString('base64')}`;
    slide.addMedia({ type:'video', path:MEDIA_ASSETS.energyStorageLoop, cover, x:0, y:0, w:W, h:H, objectName:'Energy storage motion backdrop' });
    h.addRect(slide, 0, 0, W, H, C.ink, C.ink, { fill:{ color:C.ink, transparency:72 }, line:{ color:C.ink, transparency:100 } });
    return true;
  }

  return {
    CaptionBar,
    EvidenceImageFrame,
    addCaptionBar,
    addEnergyMotionBackdrop,
    addEnergyPhotoBackdrop,
    addEquipmentNameplate,
    addEvidenceImageFrame,
    addImageIfExists,
    addPhotoPanel,
    addSmartPhotoPanel,
    addVisualPhotoBackdrop,
    addVisualPhotoPanel,
    designForSlide,
    genericShowcaseField,
    imageAspect,
    imagePathFromItem,
    smartPhotoFit
  };
}

module.exports = {
  createMediaPanelHelpers
};
