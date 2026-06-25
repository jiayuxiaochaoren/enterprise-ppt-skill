const {
  firstChartItems
} = require('./financial-chart-utils');

function createIndustryRankingBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    itemTitle
  } = ctx;

  function renderRankingBoard(slide, s, board) {
    const semanticText = [
      s.proofObjectNormalized,
      s.proofObject,
      s.title,
      s.subtitle,
      s.claim
    ].filter(Boolean).join(' ');
    const sentimentMode = /review-sentiment-ranking|评论|评价|口碑|舆情|主题|sentiment/i.test(semanticText);
    const downtimeMode = /loss-pareto|停机|故障|OEE|稼动|设备损失|downtime|loss/i.test(semanticText);
    const customerMode = /issue-frequency-ranking|客户|调研|顾虑|痛点|反馈|售后|认证/i.test(semanticText);
    const boardTitle = sentimentMode
      ? '反馈主题排序'
      : (downtimeMode ? '停机损失排序' : (customerMode ? '高频顾虑排序' : '高频问题排序'));
    const fallback = downtimeMode
      ? [
        { title:'等待备件', value:36, body:'停机分钟' },
        { title:'传感器误报', value:28, body:'停机分钟' },
        { title:'换型调试', value:22, body:'停机分钟' },
        { title:'巡检遗漏', value:14, body:'停机分钟' }
      ]
      : [
        { title:'交付周期长', value:16, body:'高频顾虑' },
        { title:'认证不确定', value:16, body:'高频顾虑' },
        { title:'回款节点复杂', value:10, body:'客户反馈' },
        { title:'售后响应要求高', value:10, body:'客户反馈' }
      ];
    const items = firstChartItems(s, ['reviewSentiment', 'downtimePareto', 'pareto', 'lossPareto', 'oeeLosses'], fallback).slice(0,5);
    const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
    const unit = (s.chartSpec && s.chartSpec.unit) || s.unit || s.metricUnit || '次';
    addLabel(slide, boardTitle, { x:board.x+0.30, y:board.y+0.32, w:1.48, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    addLabel(slide, `单位：${unit}`, { x:board.x+board.w-1.06, y:board.y+0.32, w:0.82, h:0.10, fontSize:5.8, color:C.muted, charSpace:0 });
    items.forEach((it,i)=>{
      const y = board.y + 0.86 + i*0.56;
      const val = Number(it.value) || (max - i*5);
      const w = Math.max(0.44, (board.w - 2.78) * val / max);
      const color = i===0 ? C.risk : (i===1 ? C.accent : C.cyan);
      addText(slide, itemTitle(it, `项目 ${i+1}`), { x:board.x+0.34, y:y-0.02, w:1.28, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addRect(slide, board.x+1.86, y+0.02, board.w-2.60, 0.16, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
      addRect(slide, board.x+1.86, y+0.02, w, 0.16, color, color, { fill:{color, transparency:i===0?0:10}, line:{color, transparency:100} });
      addText(slide, `${val}${it.unit || unit}`, { x:board.x+board.w-0.78, y:y-0.01, w:0.46, h:0.12, fontSize:7.2, bold:true, color:color, align:'right', fit:'shrink' });
    });
    return true;
  }

  return {
    renderRankingBoard
  };
}

module.exports = {
  createIndustryRankingBoardRenderer
};
