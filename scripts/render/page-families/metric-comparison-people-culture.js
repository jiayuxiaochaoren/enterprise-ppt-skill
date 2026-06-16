const {
  createPageFamilyPrimitives
} = require('./primitives');

function createPeopleCultureGrowthBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = createPageFamilyPrimitives(ctx);

  return function peopleCultureGrowthBoard(slide, plan, s, idx) {
    const claim = s.claim || s.subtitle || '公司介绍页要把文化落到业务事实、客户关系和人才成长上。';
    drawLightPageHeader(slide, {
      kicker:'组织成长证明',
      title:s.title || '组织成长用业务事实和人才路径共同证明',
      titleY:1.06,
      titleW:6.90,
      titleH:0.36,
      titleSize:24,
      subtitle:claim,
      subtitleY:1.54,
      subtitleW:7.20,
      subtitleSize:10.0,
      idx
    });

    const metrics = (s.metrics || []).slice(0, 3);
    const project = metrics[0] || { label:'核心项目', value:'—', note:'围绕真实场景沉淀方法。' };
    const repurchase = metrics[1] || { label:'客户复购', value:'—', note:'长期关系来自稳定交付。' };
    const promotion = metrics[2] || { label:'内部晋升', value:'—', note:'培养机制服务于长期成长。' };
    const logic = s.businessLogic || {};

    const board = { x:0.92, y:2.08, w:11.28, h:3.88 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{ color:panelFill(), transparency:0 },
      line:{ color:C.line, transparency:14, width:0.52 }
    });
    addLabel(slide, '团队成长证据', {
      x:board.x+0.22, y:board.y+0.20, w:1.36, h:0.10,
      fontSize:6.0, color:C.accent, charSpace:0
    });

    const rail = { x:board.x+0.18, y:board.y+0.52, w:3.08, h:2.62 };
    addRect(slide, rail.x, rail.y, rail.w, rail.h, C.panelAlt || 'F1F5F9', C.line, {
      fill:{ color:C.panelAlt || 'F1F5F9', transparency:0 },
      line:{ color:C.line, transparency:20, width:0.36 }
    });
    addRect(slide, rail.x, rail.y, 0.06, rail.h, C.accent, C.accent, {
      fill:{ color:C.accent, transparency:0 },
      line:{ color:C.accent, transparency:100 }
    });
    addLabel(slide, project.label || '核心项目', {
      x:rail.x+0.28, y:rail.y+0.26, w:1.28, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:0
    });
    addText(slide, String(project.value || '—'), {
      x:rail.x+0.28, y:rail.y+0.70, w:1.52, h:0.48,
      fontSize:26, bold:true, color:C.accent, fit:'shrink'
    });
    addText(slide, project.note || '围绕制造、零售和政企项目沉淀工作方法。', {
      x:rail.x+0.28, y:rail.y+1.42, w:2.18, h:0.42,
      fontSize:8.0, color:C.body, fit:'shrink', breakLine:true
    });
    addText(slide, logic.currentState || '团队在多行业项目中持续沉淀可复用经验。', {
      x:rail.x+0.28, y:rail.y+2.08, w:2.36, h:0.30,
      fontSize:7.2, color:C.muted, fit:'shrink', breakLine:true
    });

    const columns = [
      {
        title:'客户关系',
        metric:repurchase,
        color:C.cyan,
        x:4.02
      },
      {
        title:'人才培养',
        metric:promotion,
        color:C.violet,
        x:7.32
      }
    ];
    columns.forEach(column => {
      addRect(slide, column.x, board.y+0.74, 2.80, 2.12, 'FFFFFF', column.color, {
        fill:{ color:'FFFFFF', transparency:0 },
        line:{ color:column.color, transparency:36, width:0.36 }
      });
      addText(slide, column.title, {
        x:column.x+0.26, y:board.y+0.98, w:1.08, h:0.14,
        fontSize:8.8, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, column.metric.label || '', {
        x:column.x+0.26, y:board.y+1.30, w:1.44, h:0.12,
        fontSize:6.8, color:column.color, fit:'shrink'
      });
      addText(slide, String(column.metric.value || '—'), {
        x:column.x+0.26, y:board.y+1.60, w:1.54, h:0.28,
        fontSize:21, bold:true, color:column.color, fit:'shrink'
      });
      addText(slide, compactEvidenceCaption(column.metric.note || '', 34), {
        x:column.x+0.26, y:board.y+2.10, w:2.10, h:0.28,
        fontSize:7.2, color:C.body, fit:'shrink', breakLine:true
      });
      addRect(slide, column.x+2.08, board.y+1.12, 0.30, 0.03, column.color, column.color, {
        fill:{ color:column.color, transparency:18 },
        line:{ color:column.color, transparency:100 }
      });
      addRect(slide, column.x+2.08, board.y+1.62, 0.46, 0.03, column.color, column.color, {
        fill:{ color:column.color, transparency:0 },
        line:{ color:column.color, transparency:100 }
      });
    });

    const summary = [
      ['项目沉淀', logic.currentState || '团队在多行业项目中沉淀方法。'],
      ['成长原因', logic.cause || '项目复盘、导师机制和平台工具共同支撑成长。'],
      ['候选人沟通', logic.action || '把成长路径和项目现场写进岗位沟通。']
    ];
    summary.forEach((item, i) => {
      const x = board.x + 0.22 + i * 3.72;
      const color = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+3.16, 3.48, 0.54, i === 0 ? C.ink : 'FFFFFF', color, {
        fill:{ color:i === 0 ? C.ink : 'FFFFFF', transparency:0 },
        line:{ color:color, transparency:i === 0 ? 20 : 38, width:0.30 }
      });
      addLabel(slide, item[0], {
        x:x+0.16, y:board.y+3.34, w:0.66, h:0.08,
        fontSize:5.8, color:color, charSpace:0
      });
      addText(slide, compactEvidenceCaption(item[1], 28), {
        x:x+0.88, y:board.y+3.28, w:2.42, h:0.16,
        fontSize:7.2, color:i === 0 ? C.white : C.body, fit:'shrink', breakLine:true
      });
    });

    drawFooter(slide, plan);
  };
}

module.exports = {
  createPeopleCultureGrowthBoard
};
