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

  function drawDeviceLayer(slide, board, devices = []) {
    const deviceW = Math.min(1.28, (board.w - 0.96) / Math.max(1, devices.length));
    devices.forEach((name, i) => {
      const x = board.x + 0.36 + i * (deviceW + 0.14);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, board.y+0.78, deviceW, 0.48, i===0 ? (C.panelAlt || C.softBlue) : panelFill(), accent, {
        fill:{color:i===0 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:i===0?6:0},
        line:{color:accent, transparency:i===0?20:52, width:0.34}
      });
      addText(slide, name, { x:x+0.08, y:board.y+0.93, w:deviceW-0.16, h:0.12, fontSize:7.5, bold:true, color:C.text, align:'center', fit:'shrink' });
    });
  }

  function drawApplicationLayer(slide, board, appItems = []) {
    const bar = { x:board.x+0.36, y:board.y+1.70, w:board.w-0.72, h:0.90 };
    addRect(slide, bar.x, bar.y, bar.w, bar.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, '制造交付动作', { x:board.x+0.62, y:board.y+1.98, w:1.12, h:0.09, fontSize:6.8, color:C.darkMuted || '94A3B8', charSpace:0 });
    const startX = board.x + 1.84;
    const endX = board.x + board.w - 0.24;
    const slotW = Math.max(1.14, (endX - startX) / Math.max(1, appItems.length));
    appItems.forEach((name, i) => {
      const x = startX + i * slotW;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:board.y+1.92, w:0.24, h:0.09, fontSize:6.8, color:accent });
      addText(slide, name, { x:x+0.30, y:board.y+1.89, w:Math.max(0.94, slotW-0.34), h:0.14, fontSize:6.5, bold:true, color:C.white, fit:'shrink' });
      if (i < appItems.length - 1) addHairline(slide, x+slotW-0.14, board.y+2.04, 0.16, '94A3B8', 58, 0.24);
    });
  }

  function drawDataLayer(slide, board, data, dataItems = []) {
    addLabel(slide, data.title || '证据与交付资料', { x:board.x+0.36, y:board.y+2.84, w:1.36, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    const columns = Math.max(1, Math.min(4, dataItems.length || 1));
    const slotW = Math.max(1.16, (board.w - 0.72) / columns);
    dataItems.forEach((name, i) => {
      const x = board.x + 0.36 + (i % columns) * slotW;
      const y = board.y + 3.08 + Math.floor(i / columns) * 0.26;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:y+0.02, w:0.24, h:0.09, fontSize:6.8, color:accent });
      addText(slide, name, { x:x+0.34, y:y-0.01, w:Math.max(0.96, slotW-0.42), h:0.12, fontSize:7.0, color:C.body, fit:'shrink' });
    });
  }

  return function drawManufacturingReadout(slide, board, topology) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.52}
    });
    addLabel(slide, '系统读数', { x:board.x+0.30, y:board.y+0.30, w:1.38, h:0.10, fontSize:6.8, color:C.muted, charSpace:0 });
    drawDeviceLayer(slide, board, topology.devices);
    drawApplicationLayer(slide, board, topology.appItems);
    drawDataLayer(slide, board, topology.data, topology.dataItems);
    addArrowLine(slide, board.x+board.w*0.50, board.y+1.34, 0, 0.24, C.accent, { transparency:34, width:0.32 });
    addArrowLine(slide, board.x+board.w*0.50, board.y+2.64, 0, 0.28, C.cyan, { transparency:40, width:0.32 });
  };
}

module.exports = {
  createArchitectureManufacturingReadout
};
