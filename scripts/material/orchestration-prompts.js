const path = require('path');
const {
  buildModelPrompt,
  bundleForPrompt,
  extractionSchema,
  referenceContextForPrompt
} = require('../material_pipeline');
const {
  criticSchema,
  sourceAuditSchema,
  storyArchitectureSchema
} = require('./orchestration-schemas');

const STAGES = ['source-audit', 'story-architecture', 'extraction', 'critic'];

function jsonBlock(value) {
  return ['```json', JSON.stringify(value || {}, null, 2), '```'].join('\n');
}

function sourceAuditPrompt(bundle) {
  const payload = bundleForPrompt(bundle);
  return [
    '# Stage 1 - Source Audit',
    '',
    '你是材料来源审计器。只判断材料来源、事实可用性、污染文本、视觉证据和外发风险；不要写 deck plan，不要写页面标题。',
    '',
    '必须区分：',
    '- 原始企业事实',
    '- 上一版 PPT 或模型生成稿中的二次加工表达',
    '- 制作备注、QA 备注、交付说明、内部受众说明',
    '- 可作为真实证据的图片/截图/证书/现场图',
    '',
    '输出 JSON，schema 如下：',
    '',
    jsonBlock(sourceAuditSchema()),
    '',
    '材料包：',
    '',
    jsonBlock(payload)
  ].join('\n');
}

function storyArchitecturePrompt(bundle, sourceAudit) {
  const payload = bundleForPrompt(bundle);
  const referenceContext = referenceContextForPrompt(bundle);
  return [
    '# Stage 2 - Story Architecture',
    '',
    '你是商用 PPT 叙事架构师。基于 Stage 1 来源审计，先决定 deck 类型、行业、受众目标、章节顺序、每章 proof object 和禁重复规则。',
    '',
    '硬规则：',
    '- 不写最终 slide 坐标，不生成 PPT 页面。',
    '- 不能只规划“标题 + 卡片 + 编号 + 装饰圆”；每个章节要说明它为什么是这个行业/这个客户材料长出来的。',
    '- 对诊断页、数据页、方案页和价值页，必须规划商业逻辑链：现状/影响/原因/动作/指标。',
    '- 需要先做行业 deep dive：说明该行业/该 deck 类型的决策标准、常见证据、推荐目录和缺失输入。',
    '- 必须阅读 reference_context：先用行业包确定目录、proof object、禁用模板和缺信息问题，再从 recommendedReferenceRecipes 选择页面族与组件；不要复制来源版式、图片、logo 或原文。',
    '- 必须判断目标输出语言。如果是中文 PPT，language 写 zh-CN，并规划 visible_language_policy：除品牌名、产品名、URL、邮箱、股票代码和 API/OEE/IRR/SKU 等标准缩写外，所有用户可见标题、目录、标签、caption、结尾和组件微文案都使用中文。',
    '- 必须输出 deck_art_direction：只写设计导演意图，不写页面坐标。它要覆盖 palette、语义色角色、节奏地图、页面 themeIntent 和布局多样性规则。',
    '- rhythm_map 必须让 8-12 页 deck 至少出现 opening/navigation/diagnosis or setup/proof/system/value or risk/closing 等不同页面意图，避免整套都是同一种浅色卡片。',
    '- 数据组件不能只写“大数字卡片”；必须在 comparison、funnel、root-cause-matrix、journey-breakpoint、before-after、heatmap、milestone、scorecard 中选择一个合适表达。',
    '- 不重复使用已经放入公司概况页的一组基础事实。',
    '- 传统制造企业公司介绍必须像企业画册，不像泛咨询方案。',
    '- 如果素材/客户/军工/证书授权不明，只能列为风险或脱敏策略。',
    '- 公司介绍/企业画册中，缺客户案例、缺证书编号、缺联系方式这类信息只能进入 missing_info / commercial_risks，不能规划成面向客户的风险矩阵页。',
    '- 目录只列有真实事实或素材支撑的章节；没有可公开案例就不要写“项目案例”，没有证书编号/有效期就不要写“资质荣誉”。',
    '- 客户案例、资质证书和联系方式各自需要独立证据密度；不能把三者压成右侧三行一句话。',
    '- 如果缺失信息会影响目录、外发合规、数据页、案例页或图片证据页，写入 clarification_candidates，供 clarification gate 询问用户。',
    '',
    '输出 JSON，schema 如下：',
    '',
    jsonBlock(storyArchitectureSchema()),
    '',
    'Stage 1 来源审计：',
    '',
    sourceAudit ? jsonBlock(sourceAudit) : '```json\n{ "paste": "material-source-audit/v1 output here" }\n```',
    '',
    '材料包摘要：',
    '',
    jsonBlock(payload),
    '',
    'reference_context（行业包 + reference recipe 检索结果）：',
    '',
    jsonBlock(referenceContext)
  ].join('\n');
}

function extractionPrompt(bundle, sourceAudit, storyPlan, clarifications) {
  const base = buildModelPrompt(bundle);
  const referenceContext = referenceContextForPrompt(bundle, { storyPlan });
  return [
    '# Stage 4 - Structured Extraction',
    '',
    '你是结构化抽取器。基于 Stage 1 来源审计和 Stage 2 叙事架构，输出最终 `material-extraction/v1` JSON。',
    '',
    '额外硬规则：',
    '- 事实必须来自 Stage 1 标为可用的来源；source_ids 必填。',
    '- claim_spine 必须服从 Stage 2 的章节顺序和 proof_object_plan。',
    '- 如果 Stage 2 提供 reference_recipe_plan，把 recipe_id / layoutVariant / component_suggestions 写入对应 claim；component_suggestions 只是非执行建议。',
    '- 每个 claim 必须输出 page-level themeIntent、proof_object、layoutVariant、referenceRecipeIds、asset_requirements、source_pages/source_excerpts 和 source_note/provenance_note；只有材料证据或用户偏好明确支持时才写 componentSuggestions，不要输出 componentHints。缺素材时写入 missing_info 或 clarification_candidates，不要静默忽略。',
    '- 每个诊断、数据、方案、价值 claim 尽量填写 business_logic；如果材料没有依据，字段留空但不要编造。',
    '- 每个数据 claim 填写 data_component，用来驱动后续 renderer 和 QA。',
    '- 保留 Stage 2 的 deck_art_direction，并把对应的 themeIntent/accentRole/layoutEnergy/visualDensity/rhythmTransition 写入每个 claim；这些字段不代表事实，不需要 source_ids。',
    '- 保留 Stage 2 的 language / visible_language_policy；中文 PPT 中所有非必要可见微文案必须中文化，保留品牌名、产品名、URL、邮箱、股票代码和 API/OEE/IRR/SKU 等标准缩写。',
    '- 每个 claim 要有 novelty：不能复用前一页已经承担的事实。',
    '- 公司介绍页已经消费的基础规模/年份/厂区事实，不再单独生成第二个指标页。',
    '- 图片只绑定真实 source_id；生成图不能冒充现场、客户案例、证书、logo 或数据截图。',
    '- 缺失证书、客户案例授权、联系人/官网/地址等只写入 missing_info 或 commercial_risks；不要作为 risk-matrix / report-board / case-gallery 进入 claim_spine。',
    '- 如果 clarification gate 有用户回答，把回答写入 clarifications，并只把用户明确补充的内容当作事实。',
    '- 如果 clarification gate 仍有未解决的 blocking question，不要生成对应外发承诺；按 fallbackStrategy 生成保守内审稿或等待用户。',
    '- 如果用户选择跳过/脱敏/定性表达，目录和 claim_spine 必须同步移除或降级相关案例页、资质页、数据页。',
    '',
    'Stage 1 来源审计：',
    '',
    sourceAudit ? jsonBlock(sourceAudit) : '```json\n{ "paste": "material-source-audit/v1 output here" }\n```',
    '',
    'Stage 2 叙事架构：',
    '',
    storyPlan ? jsonBlock(storyPlan) : '```json\n{ "paste": "material-story-architecture/v1 output here" }\n```',
    '',
    'Clarification gate（如果已有用户选择，必须遵守；如果仍未解决，不要擅自填补）：',
    '',
    clarifications ? jsonBlock(clarifications) : '```json\n{ "optional": "run scripts/material_clarification_gate.js after Stage 2 and paste material-clarification-gate/v1 here" }\n```',
    '',
    '最终输出 schema：',
    '',
    jsonBlock(extractionSchema()),
    '',
    '原始单轮抽取提示词约束如下，仍然全部有效：',
    '',
    'reference_context：',
    '',
    jsonBlock(referenceContext),
    '',
    base
  ].join('\n');
}

function criticPrompt(bundle, extraction, qa) {
  return [
    '# Stage 5 - Model Critic',
    '',
    '你是交付前模型审稿人。基于材料包、最终抽取 JSON 和可选 visual_qa 结果，判断能否进入 deck plan 编译。',
    '',
    '必须重点检查：',
    '- 是否把制作备注、上一版 PPT 表述或内部受众信息当成事实。',
    '- 是否存在相邻页/全 deck 重复事实，尤其公司介绍与指标页重复。',
    '- 是否缺少传统制造企业公司介绍的画册感和真实图片证据。',
    '- 数据页是否只是漂亮数字，没有现状、差距/影响、原因、动作和衡量指标。',
    '- 页面是否有高级模板感：同一套“标题 + 副标题 + 卡片 + 编号 + 装饰圆”连续复用，而不是围绕客户事实和行业 proof object 生长。',
    '- 图片是否只是在“让页面好看”，没有作为产品、现场、案例、截图、证书或场景证据服务具体观点。',
    '- 是否用生成图替代真实现场、客户案例、证书、logo 或数据截图。',
    '- 结束页是否符合 deck 语义：公司介绍走致谢/联系方式，提案评审才走下一步。',
    '',
    '输出 JSON，schema 如下：',
    '',
    jsonBlock(criticSchema()),
    '',
    '材料包摘要：',
    '',
    jsonBlock(bundleForPrompt(bundle)),
    '',
    '最终抽取 JSON：',
    '',
    extraction ? jsonBlock(extraction) : '```json\n{ "paste": "material-extraction/v1 output here" }\n```',
    '',
    'visual_qa 结果（如果已有）：',
    '',
    qa ? jsonBlock(qa) : '```json\n{ "optional": "visual_qa output after rendering can be pasted here" }\n```'
  ].join('\n');
}

function stagePrompt(stage, bundle, opts = {}) {
  if (stage === 'source-audit') return sourceAuditPrompt(bundle);
  if (stage === 'story-architecture') return storyArchitecturePrompt(bundle, opts.sourceAudit);
  if (stage === 'extraction') return extractionPrompt(bundle, opts.sourceAudit, opts.storyPlan, opts.clarifications);
  if (stage === 'critic') return criticPrompt(bundle, opts.extraction, opts.qa);
  throw new Error(`unknown stage: ${stage}`);
}

function orchestrationOverview(outDir) {
  const root = outDir || 'out/model-orchestration';
  return [
    '# Material Model Orchestration',
    '',
    'Run the process through six checkpoints. Do not collapse these into one response unless the material set is tiny and low risk.',
    '',
    '1. `01-source-audit.prompt.md` -> save JSON as `source-audit.json`.',
    '2. `02-story-architecture.prompt.md` -> save JSON as `story-architecture.json`.',
    '3. Run the clarification gate and ask the user any `needs_user_input` questions before external-delivery extraction.',
    '',
    '```bash',
    `node scripts/material_clarification_gate.js --bundle <bundle.json> --source-audit ${path.join(root, 'source-audit.json')} --story-plan ${path.join(root, 'story-architecture.json')} --out ${path.join(root, 'clarification-gate.json')}`,
    '```',
    '',
    '4. Re-run `04-extraction.prompt.md` with source audit, story architecture, and clarification JSON embedded, then save `material-extraction.json`.',
    '5. `05-critic.prompt.md` -> save JSON as `model-critic.json`; only compile when `safe_to_compile` is true or all revision instructions are handled.',
    '6. After compiling a deck plan, run the visual asset resolution bridge before PPTX rendering. The bridge executes the asset decision gate, then resolves missing visuals before any renderer fallback. If it returns `needs_image_generation`, generate and bind synthetic visuals before the final PPTX. If imagegen is unavailable, rerun the bridge with unavailable capability so missing images become explicit structure-only skips instead of renderer placeholders.',
    '',
    'If the user answers questions, save them as `clarification-answers.json`, then resolve the gate:',
    '',
    '```bash',
    `node scripts/material_clarification_gate.js --bundle <bundle.json> --source-audit ${path.join(root, 'source-audit.json')} --story-plan ${path.join(root, 'story-architecture.json')} --answers ${path.join(root, 'clarification-answers.json')} --out ${path.join(root, 'clarification-gate.json')}`,
    '```',
    '',
    'Compile after the model passes:',
    '',
    '```bash',
    `node scripts/material_to_deck_plan.js --bundle <bundle.json> --model-json ${path.join(root, 'material-extraction.json')} --out ${path.join(root, 'deck-plan.json')}`,
    `node scripts/resolve_visual_assets.js ${path.join(root, 'deck-plan.json')} --out-dir ${root} --imagegen-capability available`,
    '```',
    '',
    'If the bridge returns `needs_image_generation`, bind saved image outputs before rendering:',
    '',
    '```bash',
    `node scripts/resolve_visual_assets.js ${path.join(root, 'deck-plan.json')} --out-dir ${root} --imagegen-capability available --asset-map <asset-mapping.json> --out-plan ${path.join(root, 'deck-plan.assets-bound.json')}`,
    '```'
  ].join('\n');
}

function clarificationGateInstructions(outDir) {
  return [
    '# Stage 3 - Clarification Gate',
    '',
    'After saving `source-audit.json` and `story-architecture.json`, run:',
    '',
    '```bash',
    `node scripts/material_clarification_gate.js --bundle <bundle.json> --source-audit ${path.join(outDir, 'source-audit.json')} --story-plan ${path.join(outDir, 'story-architecture.json')} --out ${path.join(outDir, 'clarification-gate.json')}`,
    '```',
    '',
    'If `status` is `needs_user_input`, ask the user the listed questions. Save their choices as `clarification-answers.json`, resolve the gate, and embed the resolved JSON in Stage 4 extraction.'
  ].join('\n');
}

module.exports = {
  STAGES,
  clarificationGateInstructions,
  criticPrompt,
  extractionPrompt,
  jsonBlock,
  orchestrationOverview,
  sourceAuditPrompt,
  stagePrompt,
  storyArchitecturePrompt
};
