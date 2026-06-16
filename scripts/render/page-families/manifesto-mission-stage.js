const {
  createPageFamilyPrimitives
} = require('./primitives');

function createMissionStatementStage(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;
  const {
    drawDarkStageShell,
    drawFooter
  } = createPageFamilyPrimitives(ctx);

  return function missionStatementStage(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      kicker:'MISSION STAGE',
      kickerOpts:{ x:0.86, y:0.90, w:1.50, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 },
      idx,
      pageNumberMethod:'number',
      pageNumberOpts:{ x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' }
    });
    addText(slide, s.statement || s.title || '使命必须被行为证明', {
      x:0.82, y:1.42, w:7.10, h:1.10, fontSize:34.0, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.claim || s.subtitle || '使命页必须用行为原则和证据支撑。', { x:0.86, y:2.82, w:5.60, h:0.20, fontSize:10.0, color:C.captionOnImage, fit:'shrink' });

    const values = (s.values || s.items || []).slice(0, 4);
    const board = { x:0.92, y:4.24, w:10.54, h:1.42 };
    values.forEach((v, i) => {
      const x = board.x + i * 2.58;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8'));
      addRect(slide, x, board.y, 2.18, board.h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i === 0 ? 18 : 38},
        line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 22 : 58, width:0.42}
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:x+0.22, y:board.y+0.32, w:0.28, h:0.09, fontSize:6.2, color:accent });
      addText(slide, itemTitle(v, `行为 ${i + 1}`), { x:x+0.60, y:board.y+0.25, w:1.08, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(v), { x:x+0.24, y:board.y+0.78, w:1.56, h:0.18, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    addRect(slide, 0.92, 6.18, 8.72, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:28}, line:{color:'334155', transparency:68, width:0.30} });
    addLabel(slide, 'PROOF REQUIRED', { x:1.14, y:6.28, w:1.22, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
    addText(slide, s.note || '使命必须落到行为、角色和产出证据。', { x:2.62, y:6.26, w:6.34, h:0.11, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createMissionStatementStage
};
