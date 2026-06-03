const {
  chooseChannelLabelBox,
  computeChannelMatrixBubbles,
  firstChartItems
} = require('./financial-chart-utils');

function createChannelEfficiencyMatrixDrawer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addText
  } = ctx;

  return function drawChannelEfficiencyMatrix(slide, board, s) {
    const items = firstChartItems(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'], s.items || s.cards || [
      { label:'私域CRM', title:'私域CRM', value:'8x', x:22, y:82, size:64, body:'ROAS高、花费低' },
      { label:'天猫搜索', title:'天猫搜索', value:'4.1x', x:56, y:44, size:48, body:'承接品牌词' },
      { label:'抖音', title:'抖音', value:'4.1x', x:84, y:44, size:46, body:'脚本收口' },
      { label:'小红书KOL', title:'小红书KOL', value:'3.3x', x:66, y:34, size:42, body:'种草承接' },
      { label:'京东广告', title:'京东广告', value:'3.2x', x:30, y:33, size:40, body:'资源位' }
    ]).slice(0, 6);
    const chart = { x:board.x+0.54, y:board.y+0.62, w:board.w-1.06, h:2.84 };
    addLabel(slide, 'ROAS × SPEND MATRIX', { x:board.x+0.30, y:board.y+0.30, w:1.58, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
    addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 8, 0.52);
    slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:8, width:0.52} });
    slide.addShape('line', { x:chart.x + chart.w * 0.50, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:58, width:0.28} });
    addText(slide, 'ROAS', { x:chart.x-0.06, y:chart.y-0.28, w:0.56, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink' });
    addText(slide, '花费', { x:chart.x+chart.w-0.40, y:chart.y+chart.h+0.16, w:0.40, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink', align:'right' });
    addText(slide, '高效触点', { x:chart.x+0.18, y:chart.y+0.12, w:0.78, h:0.11, fontSize:6.4, color:C.accent, fit:'shrink' });
    addText(slide, '规模触点', { x:chart.x+chart.w-0.88, y:chart.y+0.12, w:0.76, h:0.11, fontSize:6.4, color:C.muted, fit:'shrink', align:'right' });
    const bubbles = computeChannelMatrixBubbles(items, chart, [C.accent, C.cyan, C.violet, C.risk, '94A3B8', C.muted]);
    bubbles.forEach(p => {
      slide.addShape('ellipse', { x:p.x-p.r, y:p.y-p.r, w:p.r*2, h:p.r*2, fill:{color:p.color, transparency:8}, line:{color:p.color, transparency:100} });
      addText(slide, p.item.value || p.item.roas || '', { x:p.x-p.r, y:p.y-0.06, w:p.r*2, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink', allowTiny:true });
    });
    const occupiedLabels = [];
    bubbles.forEach(p => {
      const labelBox = chooseChannelLabelBox(p, { chart, bubbles, occupiedLabels });
      occupiedLabels.push(labelBox);
      const labelMidY = labelBox.y + labelBox.h / 2;
      if (labelBox.x > p.x + p.r && Math.abs(labelMidY - p.y) < 0.18) {
        const w = labelBox.x - (p.x + p.r + 0.05);
        if (w > 0.08) addHairline(slide, p.x+p.r+0.03, p.y, w, C.line, 44, 0.22);
      } else if (labelBox.x + labelBox.w < p.x - p.r && Math.abs(labelMidY - p.y) < 0.18) {
        const w = p.x - p.r - (labelBox.x + labelBox.w + 0.05);
        if (w > 0.08) addHairline(slide, labelBox.x+labelBox.w+0.03, p.y, w, C.line, 44, 0.22);
      }
      addText(slide, labelBox.label, { x:labelBox.x, y:labelBox.y+0.02, w:labelBox.w, h:labelBox.h, fontSize:7.0, bold:true, color:C.text, fit:'shrink' });
    });
    const legendY = board.y + 3.56;
    ['低花费/高效率', '高花费/高效率', '需优化'].forEach((label, i) => {
      const color = [C.accent, C.cyan, C.risk][i];
      slide.addShape('ellipse', { x:board.x+0.56+i*1.70, y:legendY+0.03, w:0.09, h:0.09, fill:{color}, line:{color, transparency:100} });
      addText(slide, label, { x:board.x+0.72+i*1.70, y:legendY, w:1.10, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
    });
  };
}

module.exports = {
  createChannelEfficiencyMatrixDrawer
};
