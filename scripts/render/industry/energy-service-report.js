function createEnergyServiceReportRenderers(ctx = {}) {
  const C = ctx.colors();
  const W = () => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = () => typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const accents = () => [C.accent || '2F6FED', C.secondary || C.cyan || '19BFD1', C.violet || '8B5CF6', C.tertiary || C.green || '20B77A', C.warning || 'E9A23B'];

  function text(slide, value, opts = {}) {
    const raw = value == null ? '' : String(value);
    const hasCjk = /[\u3400-\u9fff]/.test(raw);
    const next = Object.assign({
      margin:0,
      fit:false,
      breakLine:false
    }, opts);
    if (hasCjk) {
      next.fontSize = Math.max(Number(next.fontSize || 9.0), 8.8);
      if (Number(next.h || 0) < 0.16) next.h = 0.16;
      next.fit = false;
      delete next.allowTiny;
    }
    delete next.allowShrink;
    delete next.allowCjkShrink;
    return ctx.addText(slide, raw, next);
  }

  function rect(slide, x, y, w, h, fill, line = fill, opts = {}) {
    return ctx.addRect(slide, x, y, w, h, fill, line, Object.assign({
      fill:{ color:fill, transparency:opts.fillTransparency == null ? 0 : opts.fillTransparency },
      line:{ color:line, transparency:opts.lineTransparency == null ? 100 : opts.lineTransparency, width:opts.lineWidth || 0.35 }
    }, opts.shape || {}));
  }

  function roundRect(slide, x, y, w, h, fill, line = fill, opts = {}) {
    const isLight = /^(F|E|D)/i.test(String(fill || ''));
    slide.addShape('roundRect', {
      x, y, w, h,
      rectRadius:opts.radius || 0.08,
      fill:{ color:fill, transparency:opts.fillTransparency == null ? 0 : opts.fillTransparency },
      line:{
        color:line,
        transparency:opts.lineTransparency == null ? (isLight ? 20 : 34) : opts.lineTransparency,
        width:opts.lineWidth == null ? (isLight ? 0.28 : 0.42) : opts.lineWidth
      }
    });
  }

  function line(slide, x1, y1, x2, y2, color = C.line || 'DCE7F2', width = 0.5, transparency = 0) {
    slide.addShape('line', {
      x:Math.min(x1, x2),
      y:Math.min(y1, y2),
      w:Math.abs(x2 - x1),
      h:Math.abs(y2 - y1),
      flipH:x2 < x1,
      flipV:y2 < y1,
      line:{ color, width, transparency }
    });
  }

  function dot(slide, x, y, size, color) {
    slide.addShape('ellipse', {
      x, y, w:size, h:size,
      fill:{ color },
      line:{ color, transparency:100 }
    });
  }

  function cleanText(value = '') {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function stripCoverTitle(title, plan = {}) {
    let value = cleanText(title);
    const org = cleanText(plan.organization || '星驿充电');
    if (org && value.startsWith(org)) value = value.slice(org.length).trim();
    value = value.replace(/^新能源汽?车?充电服务经营复盘$/, '新能源汽车充电服务经营复盘');
    return value || '新能源汽车充电服务经营复盘';
  }

  function splitCoverTitle(title) {
    const value = cleanText(title);
    if (value.length > 22) {
      const cut = value.length > 22 ? 14 : Math.ceil(value.length / 2);
      return `${value.slice(0, cut)}\n${value.slice(cut)}`;
    }
    return value;
  }

  function coverTitleLayout(title) {
    const lines = String(title || '').split('\n').length;
    const len = cleanText(title).length;
    if (lines > 1) return { y:2.26, h:0.98, fontSize:29.0, breakLine:true, w:10.6 };
    if (len > 16) return { y:2.42, h:0.48, fontSize:30.0, breakLine:false, w:10.8 };
    return { y:2.36, h:0.54, fontSize:34.0, breakLine:false, w:10.8 };
  }

  function nonDuplicateInsight(plan = {}, s = {}) {
    const subtitle = cleanText(s.subtitle || plan.subtitle || '');
    const raw = cleanText(plan.coverInsight || s.claim || '');
    if (raw && raw !== subtitle) return raw;
    return '收入增长已经形成，下一阶段要把枪效、在线率、回款和客户体验一起拉齐。';
  }

  function numberValue(value) {
    const textValue = String(value || '').replace(/[,，%xX倍万亿支人份单/]/g, '');
    const n = parseFloat(textValue);
    return Number.isFinite(n) ? n : 0;
  }

  function fmtWan(value) {
    const n = Number(value) || 0;
    if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(2)}亿`;
    return `${Math.round(n).toLocaleString('zh-CN')}万`;
  }

  function slideBy(plan, test) {
    return (plan.slides || []).find(test) || {};
  }

  function titleSize(title = '') {
    const len = cleanText(title).length;
    if (len > 27) return 18.8;
    if (len > 22) return 20.2;
    return 21.5;
  }

  function addHeader(slide, title, subtitle, idx, dark = false) {
    const titleText = cleanText(title);
    const titleH = titleText.length > 22 ? 0.54 : 0.36;
    const subY = titleText.length > 22 ? 1.08 : 0.96;
    text(slide, titleText, {
      x:0.70, y:0.48, w:8.90, h:titleH,
      fontSize:titleSize(titleText), bold:true,
      color:dark ? (C.darkText || 'FFFFFF') : (C.text || '0F172A'),
      fit:'shrink'
    });
    if (subtitle) {
      text(slide, cleanText(subtitle), {
        x:0.72, y:subY, w:8.85, h:0.22,
        fontSize:8.7,
        color:dark ? (C.darkMuted || '9AAABE') : (C.muted || '69788C'),
        fit:'shrink'
      });
    }
    text(slide, String(idx).padStart(2, '0'), {
      x:12.02, y:0.50, w:0.58, h:0.18,
      fontSize:11.0, bold:true, align:'right',
      color:dark ? (C.secondary || '19BFD1') : (C.accent || '2F6FED'),
      typeRole:'pageFolio'
    });
    line(slide, 0.70, 1.34, 12.62, 1.34, dark ? '17243A' : (C.line || 'DCE7F2'), 0.62, dark ? 18 : 0);
  }

  function addFooter(slide, plan, dark = false) {
    const footer = typeof ctx.footerText === 'function' ? ctx.footerText(plan) : (plan.footer || plan.title || '');
    if (!footer) return;
    text(slide, footer, {
      x:0.70, y:7.08, w:8.6, h:0.14,
      fontSize:6.8,
      color:dark ? (C.darkMuted || '8390A4') : (C.muted || '75849A'),
      typeRole:'caption'
    });
  }

  function metricCard(slide, x, y, w, h, metric, color, dark = false) {
    const bg = dark ? '101B2E' : (C.panel || 'FFFFFF');
    const border = dark ? '263853' : (C.line || 'DCE7F2');
    roundRect(slide, x, y, w, h, bg, border, { lineTransparency:dark ? 26 : 20, lineWidth:0.30 });
    text(slide, metric.label || metric.title || '', {
      x:x + 0.20, y:y + 0.18, w:w - 0.40, h:0.16,
      fontSize:7.5, bold:true, valign:'mid',
      color:dark ? 'AAB6C8' : (C.muted || '69788C')
    });
    text(slide, metric.value || '', {
      x:x + 0.20, y:y + h * 0.43, w:w - 0.40, h:0.25,
      fontSize:h < 1.05 ? 16.0 : 18.3, bold:true, valign:'mid',
      color
    });
    text(slide, metric.note || '', {
      x:x + 0.20, y:y + h - 0.30, w:w - 0.40, h:0.15,
      fontSize:7.0, valign:'mid',
      color:dark ? 'D4DCEA' : (C.text || '0F172A')
    });
  }

  function sectionLabel(slide, x, y, label, color = C.accent || '2F6FED') {
    rect(slide, x, y + 0.04, 0.08, 0.08, color, color, { lineTransparency:0 });
    text(slide, label, {
      x:x + 0.16, y, w:1.8, h:0.18,
      fontSize:7.2, bold:true, valign:'mid',
      color:C.muted || '69788C'
    });
  }

  function recordChart(slide, s) {
    if (!s.chartSpec || typeof ctx.recordChartConsumption !== 'function') return;
    const componentId = typeof ctx.chartSpecToComponentId === 'function'
      ? ctx.chartSpecToComponentId(s.chartSpec)
      : (s.chartSpec.componentId || '');
    ctx.recordChartConsumption(slide, s.chartSpec, {
      rendered:true,
      componentId,
      rendererModule:'render/industry/energy-service-report',
      visualChecks:{ chartAreaFilled:true }
    }, {
      plannedComponentId:componentId,
      mode:'native-energy-service-report'
    });
  }

  function horizontalBars(slide, data, opt = {}) {
    const list = (data || []).filter(Boolean);
    if (!list.length) return;
    const colors = accents();
    const max = opt.max || Math.max(...list.map(d => Number(d.value) || 1), 1);
    const rowH = opt.h / list.length;
    list.forEach((d, i) => {
      const yy = opt.y + i * rowH;
      const color = colors[i % colors.length];
      text(slide, d.label, {
        x:opt.x, y:yy + 0.03, w:opt.labelW || 1.65, h:0.16,
        fontSize:7.8, bold:true, color:C.text || '0F172A', valign:'mid'
      });
      rect(slide, opt.x + (opt.labelW || 1.65), yy + 0.10, opt.w - (opt.labelW || 1.65) - (opt.valueW || 0.82), 0.12, C.soft || 'EAF4FF', C.soft || 'EAF4FF', { lineTransparency:0 });
      rect(slide, opt.x + (opt.labelW || 1.65), yy + 0.10, (opt.w - (opt.labelW || 1.65) - (opt.valueW || 0.82)) * ((Number(d.value) || 0) / max), 0.12, color, color, { lineTransparency:0 });
      text(slide, d.display || String(d.value || ''), {
        x:opt.x + opt.w - (opt.valueW || 0.82), y:yy + 0.03, w:(opt.valueW || 0.82), h:0.15,
        fontSize:7.8, bold:true, align:'right', color, valign:'mid'
      });
      if (d.note) {
        text(slide, d.note, {
          x:opt.x + (opt.labelW || 1.65), y:yy + 0.30, w:opt.w - (opt.labelW || 1.65), h:0.12,
          fontSize:6.5, color:C.muted || '69788C', fit:'shrink'
        });
      }
    });
  }

  function businessMixReadouts(data) {
    const sorted = (data || []).filter(Boolean).slice().sort((a, b) => (b.value || 0) - (a.value || 0));
    const top = sorted[0] || {};
    const second = sorted[1] || {};
    const low = sorted[sorted.length - 1] || {};
    const spread = top.value ? (((top.value - (low.value || 0)) / top.value) * 100).toFixed(1) : '';
    const topGap = top.value && second.value ? (((top.value - second.value) / top.value) * 100).toFixed(1) : '';
    return [
      {
        label:'收入带宽',
        value:spread ? `${spread}%` : '接近均衡',
        body:top.label && low.label ? `${top.label}到${low.label}的收入差距有限。` : '多条业务线收入接近，避免单点依赖。'
      },
      {
        label:'头部差距',
        value:topGap ? `${topGap}%` : '小幅领先',
        body:top.label && second.label ? `${top.label}仅小幅领先${second.label}。` : '头部业务线不是断层领先。'
      },
      {
        label:'最低口径',
        value:low.value ? fmtWan(low.value) : '需复核',
        body:low.label ? `${low.label}仍需看转化质量和体验规则。` : '低位业务线需要单独拆质量口径。'
      }
    ];
  }

  function lineChart(slide, items, box) {
    const list = (items || []).slice(0, 6);
    if (!list.length) return;
    roundRect(slide, box.x, box.y, box.w, box.h, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:14, lineWidth:0.38 });
    const left = box.x + 0.60;
    const top = box.y + 0.58;
    const cw = box.w - 1.05;
    const ch = box.h - 1.05;
    for (let i = 0; i < 4; i += 1) {
      const yy = top + (ch * i / 3);
      line(slide, left, yy, left + cw, yy, 'E7EEF7', 0.42, 0);
    }
    const vals = list.map(d => Number(d.value) || numberValue(d.rawValue || d.value));
    const min = Math.min(...vals) * 0.92;
    const max = Math.max(...vals) * 1.08;
    const points = list.map((d, i) => {
      const px = left + (cw * i / Math.max(1, list.length - 1));
      const py = top + ch - (((Number(d.value) || numberValue(d.value)) - min) / Math.max(1, max - min)) * ch;
      return { x:px, y:py, item:d };
    });
    points.forEach((p, i) => {
      if (i > 0) line(slide, points[i - 1].x, points[i - 1].y, p.x, p.y, C.accent || '2F6FED', 1.7, 0);
      dot(slide, p.x - 0.045, p.y - 0.045, 0.09, i === points.length - 1 ? (C.secondary || '19BFD1') : (C.accent || '2F6FED'));
      text(slide, p.item.label || p.item.category || '', {
        x:p.x - 0.24, y:top + ch + 0.15, w:0.50, h:0.12,
        fontSize:6.7, align:'center', color:C.muted || '69788C'
      });
    });
  }

  function energyServiceReportCover(slide, plan, s) {
    slide.background = { color:C.dark || '08111F' };
    const bgOk = (typeof ctx.addVisualPhotoBackdrop === 'function' && ctx.addVisualPhotoBackdrop(slide, plan, s, 'cover', { transparency:34 })) ||
      (typeof ctx.addEnergyPhotoBackdrop === 'function' && ctx.addEnergyPhotoBackdrop(slide));
    if (!bgOk) rect(slide, 0, 0, W(), H(), C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    rect(slide, 0, 0, W(), H(), C.dark || '08111F', C.dark || '08111F', { fillTransparency:44, lineTransparency:100 });
    rect(slide, 0, 0, W(), H(), '020813', '020813', { fillTransparency:72, lineTransparency:100 });
    rect(slide, 0, 6.92, W(), 0.58, '071325', '071325', { fillTransparency:24, lineTransparency:0 });
    text(slide, '2025-2026', { x:8.28, y:5.72, w:3.68, h:0.42, fontSize:31.0, bold:true, color:'315579', transparency:64, align:'right', allowShrink:true, fit:'shrink' });
    text(slide, plan.organization || '星驿充电', { x:0.76, y:0.66, w:2.2, h:0.22, fontSize:12.0, bold:true, color:C.secondary || '19BFD1' });
    const coverTitle = splitCoverTitle(stripCoverTitle(s.title || plan.title || '', plan));
    const titleBox = coverTitleLayout(coverTitle);
    line(slide, 0.78, titleBox.y - 0.28, 1.86, titleBox.y - 0.28, C.secondary || '19BFD1', 1.6, 0);
    text(slide, coverTitle, {
      x:0.76, y:titleBox.y, w:titleBox.w, h:titleBox.h,
      fontSize:titleBox.fontSize, bold:true,
      color:C.darkText || 'FFFFFF',
      breakLine:titleBox.breakLine,
      margin:0.02,
      allowShrink:true,
      fit:'shrink'
    });
    text(slide, s.subtitle || plan.subtitle || '2025-2026经营质量与增长动作', {
      x:0.78, y:titleBox.y + titleBox.h + 0.20, w:6.80, h:0.22,
      fontSize:13.2, color:'C8D6E6', allowShrink:true, fit:'shrink'
    });
    text(slide, nonDuplicateInsight(plan, s), {
      x:0.78, y:titleBox.y + titleBox.h + 0.64, w:7.10, h:0.22,
      fontSize:10.4, color:'D6E2F0', allowShrink:true, fit:'shrink'
    });
    addFooter(slide, plan, true);
    text(slide, plan.date || '2026年6月', { x:11.52, y:6.92, w:1.06, h:0.16, fontSize:7.8, color:'8D9CB2', align:'right' });
  }

  function energyServiceReportAgenda(slide, plan, s, idx) {
    slide.background = { color:C.dark || '08111F' };
    rect(slide, 0, 0, W(), H(), C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    addHeader(slide, '经营复盘路径', '从规模信号到经营动作，形成可讨论的增长闭环', idx, true);
    const items = (s.items || []).slice(0, 5);
    const fallback = [
      ['规模判断', '充电枪、收入、订单与回款质量'],
      ['收入结构', '月度趋势与五条业务线贡献'],
      ['渠道产品', '渠道ROI分层与产品组合升级'],
      ['客户与KPI', '体验短板、在线率和新增客户'],
      ['财务动作', '利润修复、现金回款和90天动作']
    ];
    const cards = (items.length ? items : fallback.map(([title, body]) => ({ title, body }))).slice(0, 5);
    cards.forEach((it, i) => {
      const x = 0.82 + i * 2.45;
      const active = i === 0;
      const color = accents()[i];
      roundRect(slide, x, 2.42, 2.05, 2.45, active ? '0E1E37' : '0B1729', active ? color : '1A2A43', { lineTransparency:active ? 0 : 34, lineWidth:active ? 0.72 : 0.38 });
      dot(slide, x + 0.28, 2.75, 0.12, color);
      text(slide, String(i + 1).padStart(2, '0'), { x:x + 0.50, y:2.69, w:0.42, h:0.13, fontSize:7.0, bold:true, color });
      text(slide, it.title || '', { x:x + 0.28, y:3.25, w:1.54, h:0.24, fontSize:14.6, bold:true, color:C.darkText || 'FFFFFF', fit:'shrink' });
      text(slide, it.body || '', { x:x + 0.28, y:3.85, w:1.56, h:0.44, fontSize:7.7, color:'B4C1D3', fit:'shrink', breakLine:true });
    });
    text(slide, '汇报原则：所有判断都回到收入、毛利、回款、客户体验和运营稳定性，不只看营收规模。', {
      x:0.82, y:5.70, w:8.90, h:0.18, fontSize:8.4, color:'C7D4E6', align:'left', valign:'mid'
    });
    addFooter(slide, plan, true);
  }

  function energyServiceReportMetricBoard(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '规模已成，质量回到枪效与回款', s.subtitle || s.claim || '', idx, false);
    const metrics = (s.metrics || []).slice(0, 4);
    const primary = metrics[0] || { label:'规模底座', value:'4860支', note:'运营充电枪' };
    roundRect(slide, 0.78, 1.76, 3.32, 4.38, C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    text(slide, primary.label || '规模底座', { x:1.06, y:2.12, w:1.3, h:0.14, fontSize:8, bold:true, color:C.secondary || '19BFD1' });
    text(slide, primary.value || '', { x:1.04, y:2.58, w:2.02, h:0.55, fontSize:40, bold:true, color:C.darkText || 'FFFFFF', fit:'shrink' });
    text(slide, primary.note || '', { x:1.10, y:3.22, w:1.70, h:0.17, fontSize:8.8, color:'B7C4D7' });
    text(slide, '管理层口径不能只看营收，需要同步看毛利、现金回款、渠道成本和客户满意度。', {
      x:1.06, y:4.34, w:2.54, h:0.52, fontSize:9.7, color:C.darkText || 'FFFFFF', fit:'shrink', breakLine:true
    });
    line(slide, 1.06, 5.30, 1.86, 5.30, C.accent || '2F6FED', 1.3, 0);
    metrics.slice(1, 4).concat(s.title && /利润|回款|KPI/i.test(s.title) ? [] : [{ label:'经营质量', value:'同口径', note:'枪效/在线率/回款' }]).slice(0, 4).forEach((m, i) => {
      metricCard(slide, 4.45 + (i % 2) * 3.55, 1.86 + Math.floor(i / 2) * 1.52, 3.05, 1.12, m, accents()[(i + 1) % accents().length], false);
    });
    sectionLabel(slide, 4.45, 5.12, '经营判断', C.accent || '2F6FED');
    roundRect(slide, 4.45, 5.44, 6.95, 0.74, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:18, lineWidth:0.30 });
    text(slide, s.claim || s.note || '下一阶段增长放大前，要先把枪效、在线率、回款和客户体验作为同一套经营质量指标管理。', {
      x:4.68, y:5.68, w:6.20, h:0.18, fontSize:8.7, bold:true, color:C.text || '0F172A', valign:'mid', fit:'shrink'
    });
    addFooter(slide, plan);
  }

  function energyServiceReportTrend(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '前五月收入增长信号已经出现', s.subtitle || s.claim || '', idx, false);
    const items = (s.monthlyPulse || ((s.chartSpec && s.chartSpec.series && s.chartSpec.series[0] && s.chartSpec.series[0].values) || [])).map(it => ({
      label:it.label || it.category,
      value:Number(it.value) || numberValue(it.rawValue || it.value),
      rawValue:it.rawValue || it.value,
      note:it.note
    }));
    lineChart(slide, items, { x:0.78, y:1.72, w:7.35, h:4.20 });
    const first = items[0] && items[0].value;
    const last = items[items.length - 1] && items[items.length - 1].value;
    const growth = first ? ((last / first - 1) * 100).toFixed(1) : '53.2';
    roundRect(slide, 8.50, 1.72, 3.95, 1.04, C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    text(slide, '前五月信号', { x:8.78, y:1.99, w:0.90, h:0.12, fontSize:7.2, color:'B7C4D7' });
    text(slide, `${growth}%`, { x:9.74, y:1.88, w:1.34, h:0.28, fontSize:21.0, bold:true, color:C.secondary || '19BFD1' });
    text(slide, `${items[0] ? items[0].rawValue : ''} → ${items[items.length - 1] ? items[items.length - 1].rawValue : ''}`, {
      x:8.78, y:2.32, w:2.90, h:0.12, fontSize:7.4, color:C.darkText || 'FFFFFF'
    });
    [
      ['现状', '4-5月连续抬升，增长信号已经出现。'],
      ['原因', '车队订单、站点承载和渠道节奏共同驱动。'],
      ['动作', '用高峰样本复盘在线率、枪效和服务稳定性。']
    ].forEach((item, i) => {
      roundRect(slide, 8.50, 3.06 + i * 0.88, 3.95, 0.68, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:14 });
      text(slide, item[0], { x:8.76, y:3.28 + i * 0.88, w:0.46, h:0.11, fontSize:7.0, bold:true, color:accents()[i] });
      text(slide, item[1], { x:9.34, y:3.20 + i * 0.88, w:2.64, h:0.24, fontSize:7.5, color:C.text || '0F172A', fit:'shrink', breakLine:true });
    });
    addFooter(slide, plan);
    recordChart(slide, s);
  }

  function energyServiceReportBusinessMix(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '业务线收入结构', s.subtitle || s.claim || '', idx, false);
    const data = (s.waterfallBridge || []).map(it => ({
      label:String(it.label || '').replace('订单', ''),
      value:Number(it.value) || 0,
      display:fmtWan(Number(it.value) || 0),
      note:it.note || ''
    }));
    horizontalBars(slide, data, { x:0.84, y:1.78, w:6.85, h:3.60, labelW:1.70, valueW:0.86 });
    sectionLabel(slide, 8.08, 1.80, '结构读数', C.accent || '2F6FED');
    businessMixReadouts(data).forEach((it, i) => {
      const y = 2.16 + i * 0.98;
      const color = accents()[i];
      roundRect(slide, 8.08, y, 3.98, 0.76, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:18, lineWidth:0.28 });
      rect(slide, 8.08, y, 0.06, 0.76, color, color, { lineTransparency:0 });
      text(slide, it.label || '', { x:8.34, y:y + 0.16, w:0.82, h:0.14, fontSize:7.2, bold:true, color:C.muted || '69788C', valign:'mid' });
      text(slide, it.value || '', { x:9.18, y:y + 0.12, w:0.92, h:0.18, fontSize:11.4, bold:true, color, valign:'mid', allowShrink:true, fit:'shrink' });
      text(slide, it.body || '', { x:8.34, y:y + 0.44, w:3.20, h:0.14, fontSize:6.9, color:C.body || '415168', valign:'mid', allowShrink:true, fit:'shrink' });
    });
    roundRect(slide, 0.84, 5.72, 11.22, 0.52, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:18, lineWidth:0.30 });
    text(slide, `结论：${s.claim || '收入结构均衡是优势，但下一阶段要把每条业务线拆成不同管理口径。'}`, {
      x:1.10, y:5.88, w:10.35, h:0.16, fontSize:8.1, bold:true, color:C.text || '0F172A', valign:'mid', fit:'shrink'
    });
    addFooter(slide, plan);
    recordChart(slide, s);
  }

  function energyServiceReportManagement(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '管理拆解', s.subtitle || s.claim || '', idx, false);
    sectionLabel(slide, 0.84, 1.68, s.label || '管理拆解', C.accent || '2F6FED');
    (s.sections || []).slice(0, 4).forEach((it, i) => {
      const y = 2.12 + i * 0.92;
      const color = accents()[i];
      roundRect(slide, 0.86, y, 11.20, 0.70, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:18, lineWidth:0.30 });
      rect(slide, 0.86, y, 0.09, 0.70, color, color, { lineTransparency:0 });
      text(slide, it.title || '', { x:1.22, y:y + 0.24, w:1.55, h:0.18, fontSize:9.6, bold:true, color:C.text || '0F172A', valign:'mid' });
      text(slide, it.body || '', { x:3.38, y:y + 0.23, w:7.70, h:0.18, fontSize:9.0, bold:true, color:C.body || '415168', valign:'mid', fit:'shrink' });
    });
    addFooter(slide, plan);
  }

  function energyServiceReportChannel(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '渠道预算要分层管理', s.subtitle || s.claim || '', idx, false);
    const list = (s.channelEfficiency || []).map(it => {
      const roi = numberValue(it.value);
      return { label:it.label || '', value:roi, display:it.value || `${roi.toFixed(2)}x`, note:it.body || '' };
    });
    roundRect(slide, 0.84, 1.72, 7.18, 4.16, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:16, lineWidth:0.35 });
    text(slide, '渠道效率排序', { x:1.12, y:1.98, w:1.20, h:0.14, fontSize:8.0, bold:true, color:C.text || '0F172A', valign:'mid' });
    horizontalBars(slide, list, { x:1.12, y:2.54, w:6.42, h:2.72, labelW:1.55, valueW:0.70 });
    roundRect(slide, 8.46, 1.72, 3.82, 1.08, C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    text(slide, '预算判断', { x:8.74, y:1.98, w:0.80, h:0.12, fontSize:7.2, bold:true, color:C.secondary || '19BFD1' });
    text(slide, '不只看ROI', { x:9.70, y:1.90, w:1.20, h:0.20, fontSize:15.0, bold:true, color:C.darkText || 'FFFFFF' });
    text(slide, '还要看规模、转化质量和渠道状态。', { x:8.74, y:2.34, w:2.45, h:0.12, fontSize:7.4, color:'BFD0E5' });
    const rows = [['渠道', 'ROI', '状态']];
    list.slice(0, 4).forEach(it => rows.push([it.label.replace('目的地站', '目的地'), it.display, (it.note.split('｜')[1] || it.note || '').slice(0, 7)]));
    rows.forEach((row, r) => {
      const y = 3.08 + r * 0.46;
      rect(slide, 8.46, y, 3.82, 0.40, r === 0 ? 'F0F6FF' : (C.panel || 'FFFFFF'), C.line || 'DCE7F2', { lineTransparency:r === 0 ? 0 : 28, lineWidth:0.24 });
      [0, 1, 2].forEach(c => {
        const xs = [8.62, 10.26, 10.98][c];
        const ws = [1.45, 0.50, 0.92][c];
        text(slide, row[c], { x:xs, y:y + 0.12, w:ws, h:0.12, fontSize:r === 0 ? 6.9 : 6.8, bold:r === 0 || c === 0, color:c === 1 && r > 0 ? (C.accent || '2F6FED') : (C.text || '0F172A'), align:c === 1 ? 'right' : 'left', valign:'mid', fit:'shrink' });
      });
    });
    text(slide, '活动侧：高ROI渠道要先区分可复制增长动作与小规模试探动作，避免预算被单一ROI误导。', {
      x:8.46, y:5.35, w:3.58, h:0.28, fontSize:7.2, color:C.muted || '69788C', fit:'shrink', breakLine:true
    });
    addFooter(slide, plan);
    recordChart(slide, s);
  }

  function energyServiceReportProduct(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '产品组合转向场景套餐', s.subtitle || s.claim || '', idx, false);
    (s.sections || []).slice(0, 6).forEach((it, i) => {
      const x = 0.82 + (i % 2) * 5.82;
      const y = 1.72 + Math.floor(i / 2) * 1.22;
      const color = accents()[i];
      roundRect(slide, x, y, 5.35, 0.92, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:16, lineWidth:0.28 });
      rect(slide, x, y, 0.08, 0.92, color, color, { lineTransparency:0 });
      text(slide, it.title || '', { x:x + 0.24, y:y + 0.18, w:1.88, h:0.16, fontSize:9.0, bold:true, color:C.text || '0F172A', fit:'shrink' });
      text(slide, it.body || '', { x:x + 2.08, y:y + 0.18, w:2.80, h:0.34, fontSize:7.2, color:C.muted || '69788C', fit:'shrink', breakLine:true });
    });
    roundRect(slide, 0.82, 5.34, 11.70, 0.78, C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    text(slide, '组合建议', { x:1.10, y:5.59, w:0.80, h:0.20, fontSize:7.4, bold:true, color:C.secondary || '19BFD1', valign:'mid' });
    text(slide, s.summary || s.claim || '将高复购服务与高客单场景打包：车队包月 + 休息区套餐 + 异常保障 + 光储充托管。', {
      x:2.05, y:5.54, w:8.95, h:0.28, fontSize:8.4, bold:true, color:C.darkText || 'FFFFFF', valign:'mid', fit:'shrink'
    });
    addFooter(slide, plan);
  }

  function energyServiceReportCustomer(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '体验短板集中在三件事', s.subtitle || s.claim || '', idx, false);
    const top = (s.downtimePareto || []).map(it => ({ label:it.label, value:Number(it.value) || 0, display:`${it.value}次` }));
    horizontalBars(slide, top, { x:0.86, y:1.86, w:6.25, h:3.22, labelW:1.80, valueW:0.72 });
    (s.metrics || []).slice(0, 4).forEach((m, i) => {
      metricCard(slide, 7.72 + (i % 2) * 2.36, 1.82 + Math.floor(i / 2) * 1.36, 2.00, 1.08, m, accents()[i], false);
    });
    roundRect(slide, 7.72, 4.74, 4.36, 0.78, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:18, lineWidth:0.30 });
    text(slide, '经营含义', { x:7.98, y:5.02, w:0.65, h:0.14, fontSize:7.4, bold:true, color:C.accent || '2F6FED', valign:'mid' });
    text(slide, '用户不是只要低价，而是要稳定、清晰和可预期的补能体验。', {
      x:8.82, y:4.96, w:2.78, h:0.20, fontSize:8.0, bold:true, color:C.text || '0F172A', valign:'mid', fit:'shrink'
    });
    addFooter(slide, plan);
    recordChart(slide, s);
  }

  function energyServiceReportFinance(slide, plan, s, idx) {
    slide.background = { color:C.background || 'F4F8FC' };
    rect(slide, 0, 0, W(), H(), C.background || 'F4F8FC', C.background || 'F4F8FC', { lineTransparency:0 });
    addHeader(slide, s.title || '利润修复后仍要盯回款', s.subtitle || s.claim || '', idx, false);
    (s.metrics || []).slice(0, 4).forEach((m, i) => {
      metricCard(slide, 0.84 + (i % 2) * 3.40, 1.72 + Math.floor(i / 2) * 1.38, 3.00, 1.08, m, accents()[i], false);
    });
    roundRect(slide, 0.84, 4.28, 6.45, 1.72, C.panel || 'FFFFFF', C.line || 'DCE7F2', { lineTransparency:18, lineWidth:0.30 });
    text(slide, '财务趋势读数', { x:1.10, y:4.52, w:1.10, h:0.14, fontSize:7.3, bold:true, color:C.text || '0F172A' });
    const bars = (s.metrics || []).slice(0, 4).map(m => ({ label:m.label, value:numberValue(m.value), color:/回款|现金/.test(m.label) ? (C.warning || 'E9A23B') : (C.accent || '2F6FED') }));
    const max = Math.max(...bars.map(b => b.value), 1);
    bars.forEach((b, i) => {
      const x = 2.08 + i * 1.08;
      const bh = 0.92 * b.value / max;
      rect(slide, x, 5.60 - bh, 0.42, bh, b.color, b.color, { lineTransparency:0 });
      text(slide, String(b.value || ''), { x:x - 0.12, y:5.60 - bh - 0.16, w:0.66, h:0.10, fontSize:6.2, bold:true, color:b.color, align:'center', allowShrink:true, fit:'shrink' });
      text(slide, String(b.label || '').replace(/^202[56]/, ''), { x:x - 0.34, y:5.74, w:0.86, h:0.12, fontSize:5.8, color:C.muted || '69788C', align:'center', allowShrink:true, fit:'shrink' });
    });
    roundRect(slide, 8.10, 1.70, 4.00, 4.18, C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    text(slide, '财务结论', { x:8.42, y:2.04, w:0.82, h:0.14, fontSize:7.6, bold:true, color:C.secondary || '19BFD1', valign:'mid' });
    text(slide, s.claim || '2025Q4利润率修复明显，但2026Q1现金转换仍需跟紧。', {
      x:8.42, y:2.52, w:3.00, h:0.74, fontSize:8.7, color:C.darkText || 'FFFFFF', fit:'shrink', breakLine:true, valign:'mid'
    });
    line(slide, 8.42, 3.76, 9.30, 3.76, C.accent || '2F6FED', 1.2, 0);
    text(slide, '动作：投放预算、大促毛利和回款节奏要一起复盘。', {
      x:8.42, y:4.12, w:2.70, h:0.26, fontSize:7.7, color:'C5D2E5', fit:'shrink', breakLine:true
    });
    roundRect(slide, 8.42, 4.76, 2.86, 0.50, '102039', '233C5D', { lineTransparency:0, lineWidth:0.30 });
    text(slide, '90天复盘：现金转换 / 费用效率 / 渠道毛利', { x:8.60, y:4.92, w:2.50, h:0.12, fontSize:6.8, color:C.darkText || 'FFFFFF', align:'center', valign:'mid', fit:'shrink' });
    addFooter(slide, plan);
  }

  function energyServiceReportClosing(slide, plan, s, idx) {
    slide.background = { color:C.dark || '08111F' };
    rect(slide, 0, 0, W(), H(), C.dark || '08111F', C.dark || '08111F', { lineTransparency:0 });
    addHeader(slide, '下一步动作收口', s.subtitle || '把增长动作收口到站点稳定、渠道分层和套餐复购', idx, true);
    const fallbackActions = [
      { title:'试点验证', body:'确认首批重点站点、设备接入和指标口径。' },
      { title:'闭环复盘', body:'把告警工单、储能策略和收益波动放入同一复盘节奏。' },
      { title:'区域推广', body:'按站点成熟度扩展到区域运维中心。' }
    ];
    const rawActions = []
      .concat(Array.isArray(s.actions) ? s.actions : [])
      .concat(Array.isArray(s.cards) ? s.cards : [])
      .concat(Array.isArray(s.items) ? s.items : [])
      .concat(Array.isArray(s.phases) ? s.phases : []);
    const note = cleanText(s.note || s.summary || s.decision || s.subtitle || '');
    const noteActions = note
      ? note.split(/[，,；;。]/).map(part => cleanText(part)).filter(Boolean).slice(0, 3).map((body, i) => ({
        title:['试点验证', '闭环复盘', '区域推广'][i] || `动作${i + 1}`,
        body
      }))
      : [];
    const actions = (rawActions.length ? rawActions : noteActions.length ? noteActions : fallbackActions).slice(0, 3);
    actions.forEach((a, i) => {
      const x = 0.88 + i * 4.05;
      const color = accents()[i];
      roundRect(slide, x, 2.00, 3.45, 2.65, '0C182B', '1E304C', { lineTransparency:0, lineWidth:0.70 });
      dot(slide, x + 0.32, 2.34, 0.14, color);
      text(slide, a.title || '', { x:x + 0.32, y:2.82, w:1.50, h:0.24, fontSize:17.0, bold:true, color:C.darkText || 'FFFFFF' });
      text(slide, a.body || '', { x:x + 0.32, y:3.42, w:2.72, h:0.32, fontSize:8.2, color:'C9D5E5', fit:'shrink', breakLine:true });
      line(slide, x + 0.32, 4.08, x + 1.12, 4.08, color, 1.4, 0);
      text(slide, ['在线率 / 闭环时长 / 排队投诉', 'ROI / 成交质量 / 回款周期', '复购率 / 毛利率 / 客单价'][i] || '', {
        x:x + 0.32, y:4.25, w:2.62, h:0.13, fontSize:7.0, color:'91A0B8'
      });
    });
    roundRect(slide, 2.20, 5.44, 8.95, 0.66, '102039', '244164', { lineTransparency:0 });
    text(slide, '建议节奏：30天完成站点与渠道复盘，60天形成套餐组合与预算分层，90天进入区域推广和财务复盘。', {
      x:2.55, y:5.69, w:8.10, h:0.13, fontSize:8.2, bold:true, color:C.darkText || 'FFFFFF', align:'center', fit:'shrink'
    });
    addFooter(slide, plan, true);
  }

  return {
    energyServiceReportAgenda,
    energyServiceReportBusinessMix,
    energyServiceReportChannel,
    energyServiceReportClosing,
    energyServiceReportCover,
    energyServiceReportCustomer,
    energyServiceReportFinance,
    energyServiceReportManagement,
    energyServiceReportMetricBoard,
    energyServiceReportProduct,
    energyServiceReportTrend
  };
}

function isEnergyChargingServiceReport(plan = {}, s = {}) {
  if (plan.industry !== 'energy-utility') return false;
  const text = [
    plan.title,
    plan.subtitle,
    plan.organization,
    plan.deckArtDirection && plan.deckArtDirection.reportType,
    s.title,
    s.subtitle,
    s.claim,
    s.proofObject,
    s.layoutVariant
  ].filter(Boolean).join(' ');
  return /新能源汽车|充电服务|充电枪|快充站|充电站|车队充电|补能|换电|ROI/i.test(text);
}

function energyServiceReportRendererNameFor(plan = {}, s = {}) {
  if (!isEnergyChargingServiceReport(plan, s)) return '';
  const type = String(s.type || '');
  const variant = String(s.layoutVariant || s.variant || '');
  const proof = String(s.proofObject || s.proof_object || '');
  const title = String(s.title || '');
  const routeText = `${title} ${variant} ${proof}`;
  const titleLooksLikeQualityBoard = /规模|质量|枪效|底座/.test(title) && !/利润|KPI/.test(title);
  const hasFinanceTitleSignal = /利润|现金|财务|KPI|费用|毛利/i.test(title);
  const hasFinanceRouteSignal = hasFinanceTitleSignal || (/quarterly-results-summary/i.test(routeText) && hasFinanceTitleSignal);
  if (type === 'cover' || type === 'cover-dark') return 'energyServiceReportCover';
  if (type === 'chapter-divider') return 'energyServiceReportAgenda';
  if (type === 'metric-comparison' && titleLooksLikeQualityBoard) return 'energyServiceReportMetricBoard';
  if (type === 'metric-comparison' && hasFinanceRouteSignal) return 'energyServiceReportFinance';
  if (type === 'metric-comparison') return 'energyServiceReportMetricBoard';
  if (type === 'industry-chart' && /monthly-pulse-trend/.test(`${variant} ${proof}`)) return 'energyServiceReportTrend';
  if (type === 'industry-chart' && /waterfall-bridge/.test(`${variant} ${proof}`)) return 'energyServiceReportBusinessMix';
  if (type === 'industry-chart' && /channel-efficiency-matrix/.test(`${variant} ${proof}`)) return 'energyServiceReportChannel';
  if (type === 'industry-chart' && /downtime-pareto/.test(`${variant} ${proof}`)) return 'energyServiceReportCustomer';
  if (type === 'report-board' && /产品|套餐|复购/.test(title)) return 'energyServiceReportProduct';
  if (type === 'report-board') return 'energyServiceReportManagement';
  if (type === 'closing' || type === 'closing-dark') return 'energyServiceReportClosing';
  return '';
}

module.exports = {
  createEnergyServiceReportRenderers,
  energyServiceReportRendererNameFor,
  isEnergyChargingServiceReport
};
