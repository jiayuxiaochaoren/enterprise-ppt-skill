const {
  centerY
} = require('../layout/card-layout');

function createArchitectureManufacturingReadout(ctx = {}, C = ctx.colors()) {
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function resolveReadoutLayout(board) {
    const inner = { x:board.x + 0.36, w:board.w - 0.72 };
    const deviceH = 0.48;
    const deviceY = board.y + Math.max(0.78, Math.min(0.96, board.h * 0.19));
    const barH = Math.max(0.82, Math.min(0.92, board.h * 0.224));
    const barY = board.y + Math.max(1.64, Math.min(1.86, board.h * 0.42));
    const bar = { x:inner.x, y:barY, w:inner.w, h:barH };
    const dataLabelY = bar.y + bar.h + Math.max(0.18, Math.min(0.26, board.h * 0.07));
    const dataZoneTop = dataLabelY + 0.16;
    const dataZoneBottom = board.y + board.h - 0.18;
    return {
      inner,
      deviceY,
      deviceH,
      bar,
      dataLabelY,
      dataZone:{
        x:inner.x,
        y:dataZoneTop,
        w:inner.w,
        h:Math.max(0.24, dataZoneBottom - dataZoneTop)
      }
    };
  }

  function drawDeviceLayer(slide, board, layout, devices = []) {
    const deviceGap = devices.length > 4 ? 0.10 : 0.14;
    const deviceW = Math.min(1.28, (layout.inner.w - deviceGap * Math.max(0, devices.length - 1)) / Math.max(1, devices.length));
    devices.forEach((name, i) => {
      const x = layout.inner.x + i * (deviceW + deviceGap);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, layout.deviceY, deviceW, layout.deviceH, i===0 ? (C.panelAlt || C.softBlue) : panelFill(), accent, {
        fill:{color:i===0 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:i===0?6:0},
        line:{color:accent, transparency:i===0?20:52, width:0.34}
      });
      addText(slide, name, {
        x:x+0.08,
        y:centerY(layout.deviceY, layout.deviceH, 0.12) + 0.01,
        w:deviceW-0.16,
        h:0.12,
        fontSize:7.5,
        bold:true,
        color:C.text,
        align:'center',
        fit:'shrink',
        valign:'mid'
      });
    });
  }

  function drawApplicationLayer(slide, layout, appItems = []) {
    const bar = layout.bar;
    addRect(slide, bar.x, bar.y, bar.w, bar.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, '制造交付动作', {
      x:bar.x + 0.18,
      y:centerY(bar.y, bar.h, 0.09),
      w:1.02,
      h:0.09,
      fontSize:6.6,
      color:C.darkMuted || '94A3B8',
      charSpace:0
    });
    const startX = bar.x + 1.24;
    const endX = bar.x + bar.w - 0.20;
    const slotW = Math.max(1.14, (endX - startX) / Math.max(1, appItems.length));
    const numberY = centerY(bar.y, bar.h, 0.09);
    const titleY = centerY(bar.y, bar.h, 0.18);
    appItems.forEach((name, i) => {
      const x = startX + i * slotW;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x,
        y:numberY,
        w:0.24,
        h:0.09,
        fontSize:6.8,
        color:accent
      });
      addText(slide, name, {
        x:x+0.28,
        y:titleY,
        w:Math.max(0.90, slotW-0.32),
        h:0.18,
        fontSize:6.8,
        bold:true,
        color:C.white,
        fit:'shrink',
        valign:'mid'
      });
      if (i < appItems.length - 1) addHairline(slide, x + slotW - 0.12, bar.y + bar.h / 2, 0.14, '94A3B8', 58, 0.24);
    });
  }

  function drawDataLayer(slide, layout, data, dataItems = []) {
    addLabel(slide, data.title || '证据与交付资料', {
      x:layout.inner.x,
      y:layout.dataLabelY,
      w:1.36,
      h:0.10,
      fontSize:6.8,
      color:C.accent,
      charSpace:0
    });
    const columns = Math.max(1, Math.min(dataItems.length <= 5 ? 5 : 4, dataItems.length || 1));
    const rows = Math.max(1, Math.ceil(dataItems.length / columns));
    const slotW = layout.dataZone.w / columns;
    const idealRowH = rows > 1 ? 0.20 : 0.24;
    let rowGap = rows > 1 ? 0.08 : 0;
    let rowH = idealRowH;
    let totalRowsH = rowH * rows + rowGap * Math.max(0, rows - 1);
    if (totalRowsH > layout.dataZone.h) {
      const minGap = rows > 1 ? 0.04 : 0;
      rowH = Math.max(0.16, (layout.dataZone.h - minGap * Math.max(0, rows - 1)) / rows);
      rowGap = rows > 1 ? Math.max(0.03, (layout.dataZone.h - rowH * rows) / (rows - 1)) : 0;
      totalRowsH = rowH * rows + rowGap * Math.max(0, rows - 1);
    } else if (rows > 1) {
      rowGap = Math.min(0.12, (layout.dataZone.h - rowH * rows) / (rows - 1));
      totalRowsH = rowH * rows + rowGap * Math.max(0, rows - 1);
    }
    const startY = layout.dataZone.y + Math.max(0, (layout.dataZone.h - totalRowsH) / 2);
    dataItems.forEach((name, i) => {
      const row = Math.floor(i / columns);
      const x = layout.dataZone.x + (i % columns) * slotW;
      const y = startY + row * (rowH + rowGap);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x,
        y:centerY(y, rowH, 0.09),
        w:0.24,
        h:0.09,
        fontSize:6.8,
        color:accent
      });
      addText(slide, name, {
        x:x+0.34,
        y:centerY(y, rowH, 0.12),
        w:Math.max(0.92, slotW-0.42),
        h:0.12,
        fontSize:7.0,
        color:C.body,
        fit:'shrink',
        valign:'mid'
      });
    });
  }

  return function drawManufacturingReadout(slide, board, topology) {
    const layout = resolveReadoutLayout(board);
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.52}
    });
    addLabel(slide, '系统读数', { x:board.x+0.30, y:board.y+0.30, w:1.38, h:0.10, fontSize:6.8, color:C.muted, charSpace:0 });
    drawDeviceLayer(slide, board, layout, topology.devices);
    drawApplicationLayer(slide, layout, topology.appItems);
    drawDataLayer(slide, layout, topology.data, topology.dataItems);
    addArrowLine(slide, board.x + board.w * 0.50, layout.deviceY + layout.deviceH + 0.10, 0, Math.max(0.18, layout.bar.y - (layout.deviceY + layout.deviceH) - 0.14), C.accent, { transparency:34, width:0.32 });
    addArrowLine(slide, board.x + board.w * 0.50, layout.bar.y + layout.bar.h + 0.08, 0, Math.max(0.18, layout.dataLabelY - (layout.bar.y + layout.bar.h) - 0.12), C.cyan, { transparency:40, width:0.32 });
  };
}

module.exports = {
  createArchitectureManufacturingReadout
};
