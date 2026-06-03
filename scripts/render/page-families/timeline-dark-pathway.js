function createTimelineDarkPathway(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addRect,
    addText
  } = ctx;
  const {
    drawDarkPageHeader,
    drawFooter
  } = deps;

  return function timelineDark(slide, plan, s, idx) {
    // Pathway Timeline v12: Keynote-style rail with unified milestone cards.
    // Number, title and body are one compact group; no alternating scattered labels.
    drawDarkPageHeader(slide, {
      kicker:'PATHWAY',
      title:s.title,
      titleY:1.04,
      titleW:7.55,
      titleH:0.40,
      titleSize:23.2,
      idx,
      pageNumberMethod:'text',
      pageNumberOpts:{ color:C.darkMuted || 'D8CDD0' }
    });

    const phases = (s.phases || []).slice(0,4);
    const axisY = 4.62;
    const cardXs = [0.98, 3.78, 6.58, 9.38];
    const cardW = 2.36;
    const nodeXs = cardXs.map(x => x + 0.38);
    addHairline(slide, nodeXs[0], axisY, nodeXs[nodeXs.length-1]-nodeXs[0], '334155', 22, 0.72);

    phases.forEach((p,i)=>{
      const nodeX = nodeXs[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===3 ? (C.darkMuted || 'D8CDD0') : (C.captionOnImage || 'F7ECEF')));
      const cardX = cardXs[i];
      const cardY = 2.42;

      // One grouped milestone: num + title on the same baseline, body below.
      addRect(slide, cardX-0.18, cardY-0.10, cardW+0.36, 1.18, C.ink2, '334155', { fill:{color:C.ink2, transparency:72}, line:{color:'334155', transparency:86, width:0.35} });
      addText(slide, String(i+1).padStart(2,'0'), { x:cardX, y:cardY, w:0.34, h:0.14, fontSize:8.0, bold:true, color:accent });
      addText(slide, p.title, { x:cardX+0.48, y:cardY-0.04, w:cardW-0.48, h:0.20, fontSize:12.3, bold:true, color:C.white, fit:'shrink' });
      addText(slide, p.body, { x:cardX+0.48, y:cardY+0.48, w:cardW-0.48, h:0.42, fontSize:8.6, color:C.darkMuted || 'D8CDD0', breakLine:true, valign:'top', fit:'shrink' });

      // Connector is a short local cue from the grouped card to the rail.
      const tickTop = cardY + 1.08;
      slide.addShape('line', { x:nodeX, y:tickTop, w:0, h:axisY-tickTop-0.14, line:{color:'334155', transparency:36, width:0.48} });
      slide.addShape('ellipse', { x:nodeX-0.08, y:axisY-0.08, w:0.20, h:0.20, fill:{color:accent}, line:{color:accent, transparency:100} });
    });

    if (s.note) {
      addHairline(slide, 0.86, 6.10, 8.20, '334155', 42, 0.45);
      addText(slide, s.note, { x:0.86, y:6.30, w:8.6, h:0.22, fontSize:12.2, bold:true, color:'CBD5E1' });
    }
    drawFooter(slide, plan, { color:C.darkMuted || 'D8CDD0' });
  };
}

module.exports = {
  createTimelineDarkPathway
};
