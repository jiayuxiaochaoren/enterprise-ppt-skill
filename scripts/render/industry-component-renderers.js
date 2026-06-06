const INDUSTRY_RENDERER_MODULE = 'render/overlay-component-renderer/industry-components';
const {
  canonicalIndustryEvidenceChainForSlide
} = require('../design/industry-evidence-chain');

function createIndustryComponentRenderer(deps = {}) {
  const colors = deps.colors || (() => ({}));
  const panelFill = deps.panelFill || (() => (colors().white || 'FFFFFF'));
  const compactText = deps.compactText || ((text = '', maxChars = 32) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars));
  const slideRole = deps.slideRole || (() => '');
  const mediaForRole = deps.mediaForRole || (() => '');
  const componentSourceNoteText = deps.componentSourceNoteText || (() => '');

  function arr(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value];
  }

  function compactLine(value = '', maxChars = 42) {
    return compactText(value, maxChars);
  }

  function rowText(row = {}, fallback = '') {
    if (Array.isArray(row)) return compactLine(row.filter(Boolean).join(' / '), 48);
    if (typeof row === 'string') return compactLine(row, 48);
    return compactLine([
      row.title || row.label || row.name || row.item || row.role || row.owner || fallback,
      row.value || row.level || row.action || row.body || row.audit || row.cadence || ''
    ].filter(Boolean).join(' / '), 48);
  }

  function overlayImagesForSlide(plan = {}, s = {}) {
    const visual = s.visual || {};
    const images = [
      s.image,
      visual.image,
      ...(Array.isArray(s.images) ? s.images : []),
      ...(Array.isArray(visual.images) ? visual.images : [])
    ].filter(Boolean);
    const roleImage = mediaForRole(plan, s, slideRole(s));
    if (roleImage && !images.includes(roleImage)) images.unshift(roleImage);
    return images.filter(Boolean);
  }

  function metricLinesFrom(s = {}) {
    const metrics = arr(s.metrics).map(metric => {
      if (typeof metric === 'string') return metric;
      return [metric.label || metric.title || metric.name || 'Metric', metric.value || metric.delta || metric.target || ''].filter(Boolean).join(' ');
    });
    const oee = s.oee || s.oeeComponents || {};
    const quality = s.qualityScorecard || {};
    return [
      ...metrics,
      ...Object.keys(oee || {}).map(key => `${key} ${oee[key]}`),
      ...Object.keys(quality || {}).map(key => `${key} ${quality[key]}`)
    ].filter(Boolean);
  }

  function sourceLinesFrom(plan = {}, s = {}) {
    return [
      componentSourceNoteText(plan, s),
      ...arr(s.assumptions).map(item => rowText(item)),
      ...arr(s.disclosure).map(item => rowText(item))
    ].filter(Boolean);
  }

  function resultFor(componentId, bbox, count, title) {
    return {
      id:componentId,
      mode:'native-renderer',
      rendered:true,
      rendererModule:INDUSTRY_RENDERER_MODULE,
      rendererMethod:`drawIndustryComponent:${componentId}`,
      nativeSlot:bbox && bbox.id || '',
      bbox,
      drawnCount:count,
      itemCount:count,
      evidence:`explicit visible industry component renderer drew ${title.toLowerCase()}`
    };
  }

  function drawPanel(slide, componentId, z, title, lines = [], opts = {}) {
    const C = colors();
    const dark = Boolean(opts.dark);
    const visible = lines.map(line => compactLine(line, opts.maxChars || 42)).filter(Boolean).slice(0, opts.max || 3);
    if (!visible.length || !z) return null;
    const fillTransparency = opts.fillTransparency != null ? opts.fillTransparency : 90;
    deps.addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
      fill:{ color:dark ? C.ink2 : panelFill(), transparency:fillTransparency },
      line:{ color:opts.accent || (dark ? C.cyan : C.accent), transparency:dark ? 42 : 16, width:0.46 }
    });
    deps.addLabel(slide, title, {
      x:z.x + 0.14, y:z.y + 0.12, w:Math.max(0.7, z.w - 0.28), h:0.10,
      fontSize:5.2, color:opts.accent || (dark ? C.cyan : C.accent), charSpace:0.5
    });
    const lineH = Math.max(0.12, Math.min(0.18, (z.h - 0.28) / Math.max(1, visible.length)));
    visible.forEach((line, i) => {
      deps.addText(slide, line, {
        x:z.x + 0.14, y:z.y + 0.28 + i * lineH, w:Math.max(0.8, z.w - 0.28), h:lineH,
        fontSize:opts.lineFontSize || 8.8, lockFontSize:true, color:dark ? C.captionOnImage : C.body, fit:'shrink'
      });
    });
    return resultFor(componentId, z, visible.length, title);
  }

  function drawRail(slide, componentId, z, title, items = [], opts = {}) {
    const C = colors();
    const dark = Boolean(opts.dark);
    const visible = items.map(item => rowText(item)).filter(Boolean).slice(0, opts.max || 4);
    if (!visible.length || !z) return null;
    const fillTransparency = opts.fillTransparency != null ? opts.fillTransparency : 90;
    deps.addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
      fill:{ color:dark ? C.ink2 : panelFill(), transparency:fillTransparency },
      line:{ color:opts.accent || (dark ? C.cyan : C.accent), transparency:dark ? 48 : 20, width:0.4 }
    });
    deps.addLabel(slide, title, { x:z.x + 0.12, y:z.y + 0.10, w:0.86, h:0.08, fontSize:4.7, color:opts.accent || (dark ? C.cyan : C.accent), charSpace:0.45 });
    const startX = z.x + 1.02;
    const stepW = Math.max(0.9, z.w - 1.18) / visible.length;
    visible.forEach((line, i) => {
      const x = startX + i * stepW;
      deps.addRect(slide, x, z.y + 0.18, Math.max(0.28, stepW - 0.08), Math.max(0.18, z.h - 0.30), dark ? C.ink : C.white, opts.accent || (dark ? C.cyan : C.accent), {
        fill:{ color:dark ? C.ink : C.white, transparency:fillTransparency },
        line:{ color:opts.accent || (dark ? C.cyan : C.accent), transparency:45, width:0.32 }
      });
      deps.addText(slide, compactLine(line, 18), {
        x:x + 0.05, y:z.y + 0.24, w:Math.max(0.18, stepW - 0.18), h:Math.max(0.10, z.h - 0.42),
        fontSize:5.5, color:dark ? C.captionOnImage : C.body, fit:'shrink'
      });
    });
    return resultFor(componentId, z, visible.length, title);
  }

  function drawFunnel(slide, componentId, z, title, items = [], opts = {}) {
    const C = colors();
    const dark = Boolean(opts.dark);
    const visible = items.map(item => rowText(item)).filter(Boolean).slice(0, 4);
    if (!visible.length || !z) return null;
    const fillTransparency = opts.fillTransparency != null ? opts.fillTransparency : 90;
    deps.addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
      fill:{ color:dark ? C.ink2 : panelFill(), transparency:fillTransparency },
      line:{ color:opts.accent || (dark ? C.cyan : C.accent), transparency:dark ? 48 : 20, width:0.4 }
    });
    deps.addLabel(slide, title, { x:z.x + 0.14, y:z.y + 0.11, w:z.w - 0.28, h:0.10, fontSize:5.0, color:opts.accent || (dark ? C.cyan : C.accent), charSpace:0.45 });
    const barH = Math.max(0.12, (z.h - 0.38) / visible.length - 0.04);
    visible.forEach((line, i) => {
      const shrink = i * 0.22;
      const w = Math.max(0.68, z.w - 0.42 - shrink);
      const x = z.x + 0.18 + shrink / 2;
      const y = z.y + 0.32 + i * (barH + 0.05);
      deps.addRect(slide, x, y, w, barH, opts.accent || (dark ? C.cyan : C.accent), opts.accent || (dark ? C.cyan : C.accent), {
        fill:{ color:opts.accent || (dark ? C.cyan : C.accent), transparency:Math.max(fillTransparency, 90) },
        line:{ color:opts.accent || (dark ? C.cyan : C.accent), transparency:30, width:0.2 }
      });
      deps.addText(slide, compactLine(line, 28), { x:x + 0.08, y:y + 0.03, w:w - 0.16, h:barH - 0.02, fontSize:5.6, color:dark ? C.captionOnImage : C.body, fit:'shrink' });
    });
    return resultFor(componentId, z, visible.length, title);
  }

  function industryComponentResult(slide, plan, s, componentId, slot, dark) {
    const chain = canonicalIndustryEvidenceChainForSlide(plan, s);
    const chainComponents = new Set((chain && chain.components) || []);
    if (!chain || chain.stageId === 'neutral-general' || !chainComponents.has(componentId)) return null;
    const z = slot || null;
    if (componentId === 'equipment-nameplate') {
      const equipment = s.equipment || s.productionLine || {};
      return drawPanel(slide, componentId, z, 'EQUIPMENT', [
        equipment.name || equipment.title || equipment.line || equipment.code,
        equipment.code || equipment.owner || equipment.capacity,
        ...arr(s.layers).map(layer => rowText(layer))
      ].filter(Boolean), { dark, max:3 });
    }
    if (componentId === 'inspection-matrix') {
      const rows = [...arr(s.inspectionMatrix), ...arr(s.inspectionRecords), ...arr(s.controls), ...arr(s.rows), ...arr(s.phases), ...arr(s.steps)];
      return drawPanel(slide, componentId, z, 'INSPECTION', rows.map(row => rowText(row)), { dark, max:4 });
    }
    if (componentId === 'quality-scorecard') return drawPanel(slide, componentId, z, 'QUALITY SCORE', metricLinesFrom(s), { dark, max:4 });
    if (componentId === 'patient-journey-band') {
      const blueprint = s.serviceBlueprint || {};
      const journey = s.journeyMap || {};
      return drawRail(slide, componentId, z, 'JOURNEY', [...arr(blueprint.stages), ...arr(journey.stages), ...arr(s.touchpoints), ...arr(s.phases), ...arr(s.metrics)], { dark, max:4 });
    }
    if (componentId === 'service-blueprint-lane') {
      const blueprint = s.serviceBlueprint || {};
      const items = [...arr(blueprint.frontstage).map(value => `Front ${value}`), ...arr(blueprint.backstage).map(value => `Back ${value}`), ...arr(s.handoffs), ...arr(s.touchpoints), ...arr(s.qualityHandoff)];
      return drawPanel(slide, componentId, z, 'BLUEPRINT LANE', items.map(item => rowText(item)), { dark, max:4 });
    }
    if (componentId === 'workflow-rail') {
      return drawRail(slide, componentId, z, 'WORKFLOW', [...arr(s.workflow), ...arr(s.workflows), ...arr(s.automationWorkflow), ...arr(s.steps), ...arr(s.phases), ...arr(s.platformCapabilities)], { dark, max:4 });
    }
    if (componentId === 'prototype-frame') {
      const images = overlayImagesForSlide(plan, s);
      if (!images.length) return null;
      return drawPanel(slide, componentId, z, 'PROTOTYPE', images.map((image, i) => `Screen ${i + 1}: ${pathlessName(image)}`), { dark, max:3, maxChars:36 });
    }
    if (componentId === 'adoption-funnel') {
      const funnel = s.adoptionFunnel || s.activationFunnel || s.cohortFunnel || {};
      return drawFunnel(slide, componentId, z, 'ADOPTION', arr(funnel.steps).length ? arr(funnel.steps) : arr(s.metrics), { dark });
    }
    if (componentId === 'permission-audit-tag') {
      const items = [...arr(s.permissionGovernance), ...arr(s.permissions), ...arr(s.auditLog), ...arr(s.risks), ...arr(s.rows)];
      return drawPanel(slide, componentId, z, 'PERMISSION AUDIT', items.map(item => rowText(item)), { dark, max:3, maxChars:34 });
    }
    if (componentId === 'governance-table' || componentId === 'risk-register') {
      const rows = [...arr(s.rows), ...arr(s.risks), ...arr(s.controls), ...arr(s.responsibilities), ...arr(s.portfolio)];
      return drawPanel(slide, componentId, z, componentId === 'governance-table' ? 'GOVERNANCE' : 'RISK REGISTER', rows.map(row => rowText(row)), { dark, max:4 });
    }
    if (componentId === 'disclosure-footnote') return drawPanel(slide, componentId, z, 'DISCLOSURE', sourceLinesFrom(plan, s), { dark, max:2, maxChars:68 });
    return null;
  }

  return {
    industryComponentResult,
    overlayImagesForSlide
  };
}

function pathlessName(value = '') {
  return String(value || '').split(/[\\/]/).pop() || String(value || '');
}

module.exports = {
  createIndustryComponentRenderer
};
