function createArchitectureIndustryRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    footerText,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker
  } = ctx;

  function architectureServiceBlueprint(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'SERVICE BLUEPRINT', 0.86, 0.72, false);
    addText(slide, s.title || '医疗服务蓝图', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把患者触点、前台服务、后台协同和质量证据放在同一张服务蓝图里。';
    addText(slide, claim, { x:0.86, y:1.52, w:7.1, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const raw = s.serviceBlueprint || s.touchpoints || s.journeyMap || s.phases || [];
    const steps = (Array.isArray(raw) ? raw : []).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
    const fallback = [
      { title:'预约', patient:'线上预约/资料确认', frontstage:'客服确认需求', backstage:'排班与号源协调', evidence:'等待时长' },
      { title:'到院', patient:'导诊/签到', frontstage:'导诊台分流', backstage:'诊室与检查资源联动', evidence:'排队状态' },
      { title:'检查', patient:'完成检查项目', frontstage:'医护解释流程', backstage:'检查排程与结果同步', evidence:'异常反馈' },
      { title:'随访', patient:'接收结果和建议', frontstage:'客服回访', backstage:'质控复盘和整改', evidence:'满意度' }
    ];
    const cols = (steps.length ? steps : fallback).slice(0,4).map((step,i)=>Object.assign({}, fallback[i] || {}, step));
    const lanes = [
      { label:'患者动作', key:'patient', color:C.accent },
      { label:'前台服务', key:'frontstage', color:C.cyan },
      { label:'后台协同', key:'backstage', color:C.violet },
      { label:'质量证据', key:'evidence', color:'94A3B8' }
    ];

    const ribbon = { x:0.92, y:2.04, w:10.84, h:0.60 };
    addRect(slide, ribbon.x, ribbon.y, ribbon.w, ribbon.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'CARE JOURNEY', { x:ribbon.x+0.28, y:ribbon.y+0.20, w:1.18, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '从触点到责任', { x:ribbon.x+1.72, y:ribbon.y+0.16, w:1.62, h:0.17, fontSize:10.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '服务蓝图不只画流程，而是把患者体验、医护协同和质量复盘绑定起来。', {
      x:ribbon.x+3.74, y:ribbon.y+0.18, w:3.38, h:0.14, fontSize:6.8, color:C.captionOnImage, fit:'shrink'
    });
    addText(slide, s.note || '多角色触点按前台、后台和证据链协同展开。', {
      x:ribbon.x+7.78, y:ribbon.y+0.18, w:2.58, h:0.14, fontSize:6.8, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });

    const board = { x:0.92, y:2.86, w:10.84, h:3.36 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'TOUCHPOINTS · FRONTSTAGE · BACKSTAGE · QUALITY', { x:board.x+0.30, y:board.y+0.28, w:3.30, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
    const colW = (board.w - 1.48) / cols.length;
    cols.forEach((step,i)=>{
      const x = board.x + 1.06 + i*colW;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:board.y+0.64, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, step.title || `触点 ${i+1}`, { x:x+0.36, y:board.y+0.58, w:colW-0.54, h:0.14, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      if (i<cols.length-1) addHairline(slide, x+colW-0.08, board.y+0.70, 0.28, accent, 38, 0.34);
    });
    lanes.forEach((lane,row)=>{
      const y = board.y + 1.08 + row*0.56;
      addText(slide, lane.label, { x:board.x+0.30, y:y+0.15, w:0.72, h:0.12, fontSize:6.8, bold:true, color:lane.color, fit:'shrink' });
      cols.forEach((step,i)=>{
        const x = board.x + 1.42 + i*colW;
        const text = step[lane.key] || step[lane.key === 'evidence' ? 'metric' : 'body'] || fallback[i][lane.key];
        addRect(slide, x, y, colW-0.20, 0.42, row===1 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
          fill:{color:row===1 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:row===1?8:0},
          line:{color:row===0 && i===0 ? lane.color : C.line, transparency:row===0 && i===0 ? 24 : 18, width:0.32}
        });
        addText(slide, text, { x:x+0.12, y:y+0.13, w:colW-0.44, h:0.12, fontSize:6.6, color:row===0 ? C.text : C.body, fit:'shrink' });
      });
    });
    addHairline(slide, board.x+0.30, 5.78, board.w-0.60, C.line, 16, 0.45);
    addText(slide, s.footerNote || '服务蓝图页强调触点之间的责任和证据，不把患者旅程压成单条时间线。', { x:board.x+0.30, y:5.96, w:6.3, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function architectureSaasCapabilityMap(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PLATFORM CAPABILITY MAP', 0.86, 0.72, false);
    addText(slide, s.title || '平台能力地图', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把产品入口、核心工作流、数据事件、集成和治理放进同一张平台能力地图。';
    addText(slide, claim, { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const layers = Array.isArray(s.layers) ? s.layers : [];
    const explicit = s.platformCapabilities || s.capabilityMap || s.capabilities;
    const sourceCaps = Array.isArray(explicit) ? explicit : [];
    const businessLayer = layers.find(l => /业务|工作流|应用|workflow|application/i.test(l.title || l.name || '')) || layers[1] || {};
    const dataLayer = layers.find(l => /数据|事件|审计|data|event|audit/i.test(l.title || l.name || '')) || layers[2] || {};
    const integrationLayer = layers.find(l => /集成|入口|API|SSO|CRM|工单|integration|access/i.test(l.title || l.name || '')) || layers[3] || layers[0] || {};
    const fallbackCaps = (businessLayer.items || ['工作流', '自动化', '协同空间', '模板库']).slice(0,4).map(title => ({ title, body:'进入核心使用路径。' }));
    const caps = (sourceCaps.length ? sourceCaps : fallbackCaps).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
    const metrics = (s.metrics || []).slice(0,3);

    const left = { x:0.92, y:2.08, w:2.54, h:4.10 };
    addRect(slide, left.x, left.y, left.w, left.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRODUCT CORE', { x:left.x+0.28, y:left.y+0.34, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '核心工作流成立，平台才有复利', { x:left.x+0.28, y:left.y+0.78, w:1.68, h:0.42, fontSize:14.0, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.coreBody || 'SaaS 能力页应把模块放回用户动作、数据事件和企业治理，不只是功能列表。', { x:left.x+0.28, y:left.y+1.64, w:1.72, h:0.70, fontSize:7.4, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, left.x+0.28, left.y+2.72, 0.78, C.accent, 0, 0.60);
    metrics.slice(0,2).forEach((m,i)=>{
      const y = left.y + 3.02 + i*0.44;
      addNumber(slide, m.value || '—', { x:left.x+0.28, y, w:0.70, h:0.14, fontSize:12.2, color:i===0?C.accent:C.cyan, fit:'shrink' });
      addText(slide, m.label || '', { x:left.x+1.08, y:y+0.02, w:0.82, h:0.12, fontSize:8.8, color:'A8B3C3', fit:'shrink' });
    });

    const stage = { x:3.86, y:2.06, w:4.66, h:4.12 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, C.ink, '334155', { fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:34, width:0.42} });
    addLabel(slide, 'WORKFLOW FIELD', { x:stage.x+0.28, y:stage.y+0.28, w:1.18, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
    const cx = stage.x + stage.w * 0.50;
    const cy = stage.y + 2.08;
    slide.addShape('ellipse', { x:cx-1.12, y:cy-1.12, w:2.24, h:2.24, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:56, width:0.38} });
    slide.addShape('ellipse', { x:cx-0.66, y:cy-0.66, w:1.32, h:1.32, fill:{color:C.ink2, transparency:10}, line:{color:C.accent, transparency:24, width:0.50} });
    addText(slide, s.centerTitle || '核心工作流', { x:cx-0.46, y:cy-0.16, w:0.92, h:0.14, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'EVENTS · DATA · RIGHTS', { x:cx-0.70, y:cy+0.12, w:1.40, h:0.08, fontSize:5.0, color:'64748B', align:'center', charSpace:0.5 });
    const capSlots = [
      { x:stage.x+0.34, y:stage.y+0.88, anchor:[cx-0.72, cy-0.54], color:C.accent },
      { x:stage.x+2.76, y:stage.y+0.88, anchor:[cx+0.72, cy-0.54], color:C.cyan },
      { x:stage.x+2.76, y:stage.y+2.78, anchor:[cx+0.72, cy+0.54], color:C.violet },
      { x:stage.x+0.34, y:stage.y+2.78, anchor:[cx-0.72, cy+0.54], color:'94A3B8' }
    ];
    caps.forEach((cap,i)=>{
      const slot = capSlots[i];
      slide.addShape('line', { x:slot.anchor[0], y:slot.anchor[1], w:slot.x+0.80-slot.anchor[0], h:slot.y+0.26-slot.anchor[1], line:{color:slot.color, transparency:62, width:0.28} });
      addRect(slide, slot.x, slot.y, 1.54, 0.72, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i===0?6:20},
        line:{color:i===0 ? slot.color : '334155', transparency:i===0?24:52, width:0.34}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.14, y:slot.y+0.20, w:0.24, h:0.10, fontSize:6.4, color:slot.color });
      addText(slide, itemTitle(cap, `能力 ${i+1}`), { x:slot.x+0.48, y:slot.y+0.12, w:0.82, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(cap), { x:slot.x+0.48, y:slot.y+0.42, w:0.82, h:0.12, fontSize:8.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });

    const right = { x:8.92, y:2.08, w:2.82, h:4.10 };
    addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'ENTERPRISE FIT', { x:right.x+0.26, y:right.y+0.32, w:1.30, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    const proofRows = [
      { title:'入口', body:(integrationLayer.items || ['Web App', 'Admin Console', 'API']).slice(0,3).join(' / ') },
      { title:'数据', body:(dataLayer.items || ['客户数据', '事件流', '审计日志']).slice(0,3).join(' / ') },
      { title:'治理', body:(s.governance || ['SSO', '权限模型', '审计']).slice(0,3).join(' / ') }
    ];
    proofRows.forEach((row,i)=>{
      const y = right.y + 0.88 + i*0.86;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addText(slide, row.title, { x:right.x+0.28, y:y, w:0.42, h:0.14, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, row.body, { x:right.x+0.86, y:y-0.02, w:1.34, h:0.16, fontSize:8.8, color:C.text, fit:'shrink' });
      addHairline(slide, right.x+0.28, y+0.42, 2.14, C.line, 20, 0.34);
    });
    addRect(slide, right.x+0.28, right.y+3.42, 2.10, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    addText(slide, s.footerNote || '能力地图必须能解释采用深度和扩展收入。', { x:right.x+0.40, y:right.y+3.48, w:1.82, h:0.14, fontSize:8.8, color:C.body, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function architectureManufacturingTopology(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'LINE SYSTEM TOPOLOGY', 0.86, 0.72, false);
    addText(slide, s.title || '设备运维能力架构', { x:0.84, y:1.05, w:5.9, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把设备接入、工单处置和指标复盘放进同一条产线证据链。';
    addText(slide, claim, { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const layers = Array.isArray(s.layers) ? s.layers : [];
    const layerTitle = (layer) => String((layer && (layer.title || layer.name || layer.label)) || '').trim();
    const layerItems = (layer) => Array.isArray(layer && layer.items)
      ? layer.items.map(v => typeof v === 'string' ? v : (v.title || v.name || v.label || '')).filter(Boolean)
      : [];
    const hasLayerItems = layers.some(layer => layerItems(layer).length);
    const bulletTitles = layers.map(layerTitle).filter(Boolean);
    const access = hasLayerItems
      ? (layers[0] || { title:'设备与现场层', items:['PLC','传感器','点检终端','备件台账'] })
      : { title:'产品与工艺对象', items:(bulletTitles.length ? bulletTitles : ['非标输送设备','涂装设备','控制系统','现场安装调试']).slice(0, 5) };
    const apps = hasLayerItems
      ? (layers[1] || { title:'业务应用层', items:['设备健康','统一运营核心','维修工单','备件协同'] })
      : { title:'制造交付动作', items:['需求确认','加工制造','控制联调','现场安装'] };
    const data = hasLayerItems
      ? (layers[2] || { title:'数据支撑层', items:['设备库','故障库','工单库','备件库','OEE 指标'] })
      : { title:'证据与交付资料', items:['图纸参数','设备铭牌','调试记录','项目验收','服务反馈'] };

    const side = { x:0.92, y:2.08, w:2.58, h:4.02 };
    const board = { x:3.82, y:2.08, w:7.78, h:4.02 };
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '产品谱系', { x:side.x+0.30, y:side.y+0.34, w:0.92, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    addText(slide, access.title || '产品与工艺对象', { x:side.x+0.30, y:side.y+0.86, w:1.80, h:0.28, fontSize:14.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, '把产品、制造动作和交付资料放进同一张可读结构图，避免只画空框。', {
      x:side.x+0.30, y:side.y+1.52, w:1.82, h:0.62, fontSize:8.0, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, side.x+0.30, side.y+2.60, 0.82, C.accent, 0, 0.62);
    addText(slide, s.note || '统一产品口径 · 统一制造动作 · 统一交付证据', {
      x:side.x+0.30, y:side.y+2.92, w:1.82, h:0.34, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true
    });

    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.52}
    });
    addLabel(slide, 'SYSTEM READOUT', { x:board.x+0.30, y:board.y+0.30, w:1.38, h:0.10, fontSize:6.8, color:C.muted, charSpace:0.72 });

    const devices = (layerItems(access).length ? layerItems(access) : ['非标输送设备','涂装设备','控制系统','现场安装调试']).slice(0,5);
    const deviceW = Math.min(1.28, (board.w - 0.96) / Math.max(1, devices.length));
    devices.forEach((name,i)=>{
      const x = board.x + 0.36 + i * (deviceW + 0.14);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, board.y+0.78, deviceW, 0.48, i===0 ? (C.panelAlt || C.softBlue) : panelFill(), accent, {
        fill:{color:i===0 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:i===0?6:0},
        line:{color:accent, transparency:i===0?20:52, width:0.34}
      });
      addText(slide, name, { x:x+0.08, y:board.y+0.93, w:deviceW-0.16, h:0.12, fontSize:7.5, bold:true, color:C.text, align:'center', fit:'shrink' });
    });

    const appItems = (layerItems(apps).length ? layerItems(apps) : ['需求确认','加工制造','控制联调','现场安装']).slice(0,4);
    addRect(slide, board.x+0.36, board.y+1.70, board.w-0.72, 0.86, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, '制造交付动作', { x:board.x+0.62, y:board.y+1.96, w:1.04, h:0.09, fontSize:6.8, color:C.darkMuted || '94A3B8', charSpace:0 });
    appItems.forEach((name,i)=>{
      const x = board.x + 2.10 + i * 1.22;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:board.y+1.92, w:0.24, h:0.09, fontSize:6.8, color:accent });
      addText(slide, name, { x:x+0.34, y:board.y+1.89, w:0.72, h:0.12, fontSize:7.4, bold:true, color:C.white, fit:'shrink' });
      if (i < appItems.length - 1) addHairline(slide, x+0.92, board.y+2.02, 0.28, '94A3B8', 48, 0.28);
    });

    const dataItems = (layerItems(data).length ? layerItems(data) : ['图纸参数','设备铭牌','调试记录','项目验收','服务反馈']).slice(0,5);
    addLabel(slide, data.title || '证据与交付资料', { x:board.x+0.36, y:board.y+3.04, w:1.36, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    dataItems.forEach((name,i)=>{
      const x = board.x + 0.36 + (i % 3) * 2.26;
      const y = board.y + 3.30 + Math.floor(i / 3) * 0.34;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:y+0.02, w:0.24, h:0.09, fontSize:6.8, color:accent });
      addText(slide, name, { x:x+0.34, y:y-0.01, w:1.16, h:0.12, fontSize:7.2, color:C.body, fit:'shrink' });
    });

    addArrowLine(slide, board.x+board.w*0.50, board.y+1.34, 0, 0.24, C.accent, { transparency:34, width:0.32 });
    addArrowLine(slide, board.x+board.w*0.50, board.y+2.64, 0, 0.28, C.cyan, { transparency:40, width:0.32 });

    addRect(slide, 0.92, 6.34, 9.82, 0.26, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:18}, line:{color:C.line, transparency:100} });
    addText(slide, s.bottomLine || '产品对象、制造动作与交付资料保持一一对应，方便客户快速判断适配范围。', {
      x:1.12, y:6.40, w:9.24, h:0.10, fontSize:7.4, color:C.body, fit:'shrink'
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    architectureManufacturingTopology,
    architectureSaasCapabilityMap,
    architectureServiceBlueprint
  };
}

module.exports = {
  createArchitectureIndustryRenderers
};
