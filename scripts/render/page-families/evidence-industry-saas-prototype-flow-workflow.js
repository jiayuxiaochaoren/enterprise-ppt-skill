function saasPrototypeSteps(items = []) {
  return [
    items[0] || { title:'工作台', body:'进入团队空间。' },
    items[1] || { title:'自动化', body:'触发流程动作。' },
    items[2] || { title:'分析视图', body:'看见价值信号。' }
  ];
}

function createSaasPrototypeWorkflowRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawSaasWorkflowPath(slide, items, flow) {
    addLabel(slide, 'WORKFLOW PATH', {
      x:flow.x, y:flow.y+0.02, w:1.22, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    const steps = saasPrototypeSteps(items);
    steps.forEach((it,i)=>{
      const y = flow.y + 0.42 + i*0.54;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, flow.x, y, flow.w, 0.40, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:i===0?0:4},
        line:{color:i===0?accent:C.line, transparency:i===0?18:18, width:0.38}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x:flow.x+0.18, y:y+0.13, w:0.28, h:0.09, fontSize:6.2, color:accent
      });
      addText(slide, itemTitle(it, `步骤 ${i+1}`), {
        x:flow.x+0.64, y:y+0.10, w:1.08, h:0.12, fontSize:8.4, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, itemBody(it), {
        x:flow.x+2.14, y:y+0.09, w:1.70, h:0.13, fontSize:7.2, color:C.body, fit:'shrink'
      });
    });
    return steps;
  }

  return {
    drawSaasWorkflowPath
  };
}

module.exports = {
  createSaasPrototypeWorkflowRenderer,
  saasPrototypeSteps
};
