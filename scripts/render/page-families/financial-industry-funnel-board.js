const {
  coerceChartItems
} = require('./financial-chart-utils');

function createAdoptionOrPatientFunnelBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addCardToCardConnector,
    addLabel,
    addRect,
    addText,
    itemTitle
  } = ctx;

  function numericValue(item = {}) {
    const raw = item.value != null ? item.value : (item.rawValue != null ? item.rawValue : item.body);
    const n = Number(String(raw == null ? '' : raw).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function compactNumber(item = {}) {
    const raw = item.rawValue != null ? item.rawValue : item.value;
    const text = String(raw == null ? '' : raw).trim();
    if (!text) return '';
    if (/[^\d.,+\-\s]/.test(text)) return text;
    const n = numericValue(item);
    if (!Number.isFinite(n)) return text;
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1).replace(/\.0$/, '')}亿`;
    if (abs >= 10000) {
      const places = abs < 100000 ? 2 : 1;
      return `${sign}${(abs / 10000).toFixed(places).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')}万`;
    }
    if (Math.round(abs) === abs) return `${sign}${String(abs)}`;
    return `${sign}${abs.toFixed(1).replace(/\.0$/, '')}`;
  }

  function formatRate(current, previous) {
    if (!previous || !current || !Number.isFinite(previous) || !Number.isFinite(current)) return '';
    const rate = (current / previous) * 100;
    if (!Number.isFinite(rate)) return '';
    return `${rate >= 10 ? rate.toFixed(1) : rate.toFixed(1)}%`.replace(/\.0%$/, '%');
  }

  function renderAdoptionOrPatientFunnelBoard(slide, s, variant, board) {
    const source = variant === 'adoption-funnel'
      ? (s.adoptionFunnel || s.activationFunnel || s.cohortFunnel)
      : (s.patientBottlenecks || s.waitBottlenecks);
    const fallback = variant === 'adoption-funnel'
      ? [{title:'注册',value:100},{title:'激活',value:64},{title:'集成',value:46},{title:'扩展',value:28}]
      : [{title:'预约',value:100,body:'入口等待'},{title:'到院',value:72,body:'签到等待'},{title:'检查',value:48,body:'资源瓶颈'},{title:'反馈',value:34,body:'处置瓶颈'}];
    const items = coerceChartItems(source, fallback).slice(0,5);
    const values = items.map(numericValue);
    const accents = [C.accent, C.cyan, C.violet, C.tertiary || C.success || '20B77A', C.warning || 'D59A2F'];
    const label = variant === 'adoption-funnel' ? '阶段转化链路' : '瓶颈分层链路';
    addLabel(slide, label, {
      x:board.x+0.36, y:board.y+0.34, w:1.72, h:0.12,
      fontSize:6.8, color:C.accent, charSpace:0
    });
    const count = Math.max(1, items.length);
    const gap = count >= 5 ? 0.34 : 0.56;
    const startX = board.x + 0.44;
    const cardY = board.y + 0.94;
    const cardH = 1.42;
    const cardW = (board.w - 0.88 - gap * (count - 1)) / count;
    const cardBoxes = [];
    items.forEach((it,i)=>{
      const x = startX + i * (cardW + gap);
      const accent = accents[i % accents.length];
      const prev = i > 0 ? values[i - 1] : 0;
      const current = values[i] || 0;
      const rate = i > 0 ? formatRate(current, prev) : '';
      addRect(slide, x, cardY, cardW, cardH, C.panelAlt || 'F8FAFC', accent, {
        fill:{ color:C.panelAlt || 'F8FAFC', transparency:i === 0 ? 0 : 5 },
        line:{ color:accent, transparency:i === 0 ? 16 : 38, width:0.38 }
      });
      addLabel(slide, String(i+1).padStart(2,'0'), {
        x:x+0.16, y:cardY+0.14, w:0.32, h:0.10,
        fontSize:6.2, color:accent, charSpace:0
      });
      addText(slide, itemTitle(it, `阶段 ${i+1}`), {
        x:x+0.16, y:cardY+0.42, w:cardW-0.32, h:0.16,
        fontSize:9.0, bold:true, color:C.text, fit:'shrink', valign:'mid'
      });
      addText(slide, compactNumber(it), {
        x:x+0.16, y:cardY+0.76, w:cardW-0.32, h:0.20,
        fontSize:12.8, bold:true, color:accent, fit:'shrink', valign:'mid'
      });
      addText(slide, i === 0 ? (it.note || '起点样本') : `上一步转化 ${rate || '-'}`, {
        x:x+0.16, y:cardY+1.12, w:cardW-0.32, h:0.12,
        fontSize:6.4, color:C.body, fit:'shrink', valign:'mid'
      });
      cardBoxes.push({ x, y:cardY, w:cardW, h:cardH, accent });
    });
    cardBoxes.slice(0, -1).forEach((card, i) => {
      const next = cardBoxes[i + 1];
      if (typeof addCardToCardConnector === 'function') {
        addCardToCardConnector(slide, card, next, card.accent || C.line, {
          gap:0.08,
          transparency:18,
          width:0.46
        });
      } else if (typeof addArrowLine === 'function') {
        const start = card.x + card.w + 0.08;
        const end = next.x - 0.08;
        if (end > start) addArrowLine(slide, start, card.y + card.h / 2, end - start, 0, card.accent || C.line, { transparency:18, width:0.46 });
      }
    });
    const railY = board.y + board.h - 0.96;
    addRect(slide, board.x+0.44, railY, board.w-0.88, 0.54, C.panelAlt || 'F8FAFC', C.line, {
      fill:{ color:C.panelAlt || 'F8FAFC', transparency:2 },
      line:{ color:C.line, transparency:54, width:0.28 }
    });
    const rateText = items.slice(1).map((it, i) => {
      const rate = formatRate(values[i + 1], values[i]);
      return `${itemTitle(items[i], `阶段${i+1}`)}→${itemTitle(it, `阶段${i+2}`)} ${rate || '-'}`;
    }).join('  |  ');
    addText(slide, rateText || (s.subtitle || s.claim || ''), {
      x:board.x+0.64, y:railY+0.19, w:board.w-1.28, h:0.12,
      fontSize:6.8, color:C.body, fit:'shrink', valign:'mid'
    });
  }

  return {
    renderAdoptionOrPatientFunnelBoard
  };
}

module.exports = {
  createAdoptionOrPatientFunnelBoard
};
