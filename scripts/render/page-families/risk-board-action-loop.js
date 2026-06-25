const {
  createRiskResponsibilityBoardRenderer
} = require('./risk-board-responsibility-board');
const {
  riskResponsibilityItems
} = require('./risk-board-responsibility-data');

function industryActionLoopCopy(plan = {}) {
  const industry = String(plan.industry || '');
  const variant = String(plan.variant || plan.proofObject || '').toLowerCase();
  if (variant === 'manufacturing-action-loop' || industry === 'manufacturing-operations') {
    return {
      kicker:'经营动作闭环',
      fallbackTitle:'经营动作与复盘机制',
      sideLabel:'经营重点',
      coreTitle:'动作闭环',
      coreBody:'把产品对象、制造动作、交付资料和验收节奏放进同一套经营复盘。',
      loopLabel:'动作 · 角色 · 复盘',
      centerTitle:'经营闭环',
      centerLabel:'可复盘',
      metaRows:[
        ['对象', '产品/产线'],
        ['交付', '资料与验收'],
        ['复盘', '按月更新']
      ],
      note:'每项经营动作都需要明确角色、交付资料和月度复盘口径。'
    };
  }
  if (variant === 'healthcare-quality-loop' || industry === 'healthcare-operations') {
    return {
      kicker:'质量改善闭环',
      fallbackTitle:'服务质量与改进机制',
      sideLabel:'改善重点',
      coreTitle:'服务闭环',
      coreBody:'把触点问题、处理时限、整改记录和质控复盘放进同一条服务链。',
      loopLabel:'问题 · 时限 · 改善',
      centerTitle:'质量复盘',
      centerLabel:'可追踪',
      metaRows:[
        ['触点', '服务节点'],
        ['时限', '处理SLA'],
        ['记录', '整改留痕']
      ],
      note:'每项服务问题都需要处理时限、整改记录和复盘结论。'
    };
  }
  if (variant === 'saas-governance-loop' || industry === 'saas-technology') {
    return {
      kicker:'流程治理闭环',
      fallbackTitle:'流程治理与权限机制',
      sideLabel:'治理重点',
      coreTitle:'流程可追踪',
      coreBody:'把流程节点、权限边界、处理记录和复盘节奏绑定到系统用法。',
      loopLabel:'流程 · 权限 · 动作',
      centerTitle:'流程闭环',
      centerLabel:'可审计',
      metaRows:[
        ['角色', '权限边界'],
        ['流程', '处理节点'],
        ['记录', '审计留痕']
      ],
      note:'每项流程治理都需要权限边界、处理动作和审计记录。'
    };
  }
  return {
    kicker:'治理动作',
    fallbackTitle:'治理动作与复盘机制',
    sideLabel:'治理重点',
    coreTitle:'动作闭环',
    coreBody:'把事项、角色、处理动作和复盘节奏放进同一张治理链路。',
    loopLabel:'事项 · 角色 · 动作',
    centerTitle:'治理闭环',
    centerLabel:'可追踪',
    metaRows:[
      ['角色', '负责人与协同'],
      ['节奏', '处理时限'],
      ['记录', '过程留痕']
    ],
    note:'每项治理动作都需要角色、处置动作、过程记录和复盘节奏。'
  };
}

function createRiskActionLoopRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const drawRiskResponsibilityBoard = createRiskResponsibilityBoardRenderer(ctx, C);

  return function riskActionLoop(slide, plan, s, idx) {
    const copy = industryActionLoopCopy({
      industry: plan.industry,
      variant: s.layoutVariant || s.variant || s.proofObject || s.proofObjectNormalized
    });
    const effective = Object.assign({}, s, {
      coreTitle:s.coreTitle || copy.coreTitle,
      coreBody:s.coreBody || copy.coreBody,
      loopLabel:s.loopLabel || copy.loopLabel,
      centerTitle:s.centerTitle || copy.centerTitle,
      centerLabel:s.centerLabel || copy.centerLabel
    });
    const header = drawRiskLightHeader(slide, effective, idx, { kicker:s.kicker || copy.kicker, fallbackTitle:copy.fallbackTitle, titleW:5.8 });
    const contentY = Math.max(2.08, (header.contentTop || 2.04) + 0.10);
    const bottomLimit = 6.66;
    const contentH = Math.max(3.82, Math.min(4.18, bottomLimit - contentY));
    const dy = contentY - 2.04;

    const items = riskResponsibilityItems(effective);
    const core = { x:0.92, y:contentY, w:2.86, h:contentH };
    addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, copy.sideLabel, { x:core.x+0.30, y:core.y+0.38, w:1.36, h:0.10, fontSize:6.2, color:C.accent, charSpace:0 });
    addText(slide, effective.coreTitle, { x:core.x+0.30, y:core.y+0.86, w:1.72, h:0.28, fontSize:15.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, effective.coreBody, {
      x:core.x+0.30,
      y:core.y+1.44,
      w:1.96,
      h:Math.max(0.64, Math.min(0.88, core.h - 2.82)),
      fontSize:8.8,
      color:C.captionOnImage,
      fit:'shrink',
      breakLine:true
    });
    const metaTop = Math.min(core.y + 2.78, core.y + core.h - 1.34);
    const ruleY = Math.min(core.y + 2.42, metaTop - 0.28);
    if (ruleY > core.y + 2.08) addHairline(slide, core.x+0.30, ruleY, 0.82, C.accent, 0, 0.62);
    copy.metaRows.forEach((row,i)=>{
      const y = metaTop + i*0.46;
      addLabel(slide, row[0], { x:core.x+0.32, y, w:0.84, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0 });
      addText(slide, row[1], { x:core.x+1.18, y:y-0.015, w:1.22, h:0.12, fontSize:7.8, bold:true, color:'E2E8F0', fit:'shrink' });
    });

    const board = { x:4.24, y:contentY, w:7.28, h:contentH };
    drawRiskResponsibilityBoard(slide, effective, items, board);

    const note = String(s.note || '').trim();
    const noteY = board.y + board.h + 0.14;
    if (note && noteY + 0.14 <= 6.82) {
      addHairline(slide, board.x, noteY - 0.10, 1.80, C.line, 22, 0.30);
      addText(slide, note, { x:board.x, y:noteY, w:board.w, h:0.14, fontSize:7.8, color:C.muted, fit:'shrink' });
    }
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createRiskActionLoopRenderer
};
