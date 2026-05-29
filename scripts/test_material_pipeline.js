const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  sourceTraceAudit,
  normalizeDeckPlan
} = require('./design-system');
const {
  buildClarificationGate,
  buildModelPrompt,
  compileDeckPlan,
  ingestMaterials,
  validateExtraction
} = require('./material_pipeline');

function fakePng(file, w, h) {
  const b = Buffer.alloc(24);
  b.writeUInt8(0x89, 0);
  b.write('PNG', 1, 'ascii');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  fs.writeFileSync(file, b);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-material-pipeline-'));
const brief = path.join(dir, 'manufacturing-brief.md');
const image = path.join(dir, 'zz-line-dashboard.png');
fs.writeFileSync(brief, [
  '# 恒越精工设备运维升级材料',
  '',
  '管理层希望把设备状态、现场点检和维修工单做成一个最小可运行产品包。',
  '当前产线停机主要来自等待备件、重复故障和换型调试，OEE 约为 78%，MTTR 需要下降。',
  '试点先覆盖关键设备，再扩展到多车间协同；设备部、生产部和信息化团队共同负责。',
  '下一步需要确认 PLC、传感器和备件台账的数据接口。'
].join('\n'), 'utf8');
fakePng(image, 1440, 900);

const bundle = ingestMaterials([dir], { root: dir });
assert.equal(bundle.sourceCount, 2);
assert.equal(bundle.images.length, 1);
assert.equal(bundle.textSummary.industryCandidates[0].industry, 'manufacturing-operations');
assert.ok(bundle.modelContract.nextStep.includes('material_orchestration_prompt.js'));
assert.ok(bundle.modelContract.nextStep.includes('material_clarification_gate.js'));
assert.ok(bundle.modelContract.nextStep.includes('material_model_prompt.js is only'));

const prompt = buildModelPrompt(bundle);
assert.ok(prompt.includes('material-extraction/v1'));
assert.ok(prompt.includes('src-001'));
assert.ok(prompt.includes('source_ids'));
assert.ok(prompt.includes('commercial_risks'));
assert.ok(prompt.includes('材料显示'));

const extraction = {
  version: 'material-extraction/v1',
  document: {
    title: '恒越精工设备运维升级方案',
    subtitle: '先把关键设备接入产品包跑通，再扩展到多车间协同。',
    ppt_type: 'solution',
    industry: 'manufacturing-operations',
    organization: '恒越精工',
    audience: '管理层 / 工厂厂长 / 设备负责人',
    decision_goal: '确认关键设备试点范围和数据接口'
  },
  facts: [
    {
      id: 'fact-001',
      text: '当前 OEE 约为 78%，停机主要来自等待备件、重复故障和换型调试。',
      source_ids: ['src-001'],
      source_pages: { 'src-001': 1 },
      source_excerpts: { 'src-001': '当前产线停机主要来自等待备件、重复故障和换型调试，OEE 约为 78%，MTTR 需要下降。' },
      confidence: 0.9
    }
  ],
  evidence: [
    {
      id: 'ev-001',
      type: 'metric',
      title: 'OEE 与停机损失',
      summary: '证明维修闭环应优先解决备件和重复故障。',
      source_ids: ['src-001'],
      page: 1,
      excerpt: '当前产线停机主要来自等待备件、重复故障和换型调试，OEE 约为 78%，MTTR 需要下降。'
    },
    {
      id: 'ev-002',
      type: 'image',
      title: '产线界面截图',
      summary: '作为设备接入和状态可视证据。',
      source_ids: ['src-002'],
      asset_source_id: 'src-002',
      provenance: 'user-provided-screenshot',
      authorization_status: 'unknown'
    }
  ],
  claim_spine: [
    {
      id: 'claim-001',
      narrative_role: 'diagnosis',
      claim: '停机损失先集中在备件等待和重复故障',
      support: 'OEE 约为 78%，MTTR 需要下降。',
      proof_object: 'downtime-pareto',
      evidence_ids: ['ev-001'],
      source_ids: ['src-001'],
      source_pages: { 'src-001': 1 },
      source_excerpts: { 'src-001': '当前产线停机主要来自等待备件、重复故障和换型调试，OEE 约为 78%，MTTR 需要下降。' },
      business_logic: {
        current_state: 'OEE 约为 78%，停机来自等待备件、重复故障和换型调试。',
        impact: '维修响应慢会拉低产线节拍与设备可用性。',
        cause: '备件、故障记录和工单复盘没有形成统一口径。',
        action: '先建立停机根因排序，再把工单和备件动作接入闭环。',
        metric: 'OEE、MTTR、重复故障占比'
      },
      data_component: 'root-cause-matrix',
      metrics: [
        { label: '等待备件', value: '36%', note: '停机主要来源' },
        { label: '重复故障', value: '28%', note: '维修记录未复盘' },
        { label: '换型调试', value: '22%', note: '节拍损失' }
      ],
      confidence: 0.9
    },
    {
      id: 'claim-002',
      narrative_role: 'solution',
      claim: '关键设备接入包先把状态、点检和工单跑通',
      support: '设备状态、现场点检和维修工单构成最小可运行产品包。',
      proof_object: 'production-topology',
      evidence_ids: ['ev-002'],
      source_ids: ['src-001', 'src-002'],
      source_pages: { 'src-001': 1 },
      source_excerpts: { 'src-001': '管理层希望把设备状态、现场点检和维修工单做成一个最小可运行产品包。' },
      bullets: ['PLC 与传感器接入', '点检终端记录异常', '维修工单闭环留痕'],
      visuals: [{ source_id: 'src-002', role: 'evidence', caption: '设备状态界面用于说明接入范围。', provenance: 'user-provided-screenshot', authorization_status: 'unknown' }],
      confidence: 0.86
    },
    {
      id: 'claim-003',
      narrative_role: 'operating-model',
      claim: '试点闭环验证后再扩展到多车间协同',
      support: '先覆盖关键设备，再把工单和备件台账扩展到更多车间。',
      proof_object: 'maintenance-loop',
      source_ids: ['src-001'],
      source_pages: { 'src-001': 1 },
      source_excerpts: { 'src-001': '试点先覆盖关键设备，再扩展到多车间协同；设备部、生产部和信息化团队共同负责。' },
      bullets: ['关键设备试点', '维修工单闭环', '多车间推广'],
      confidence: 0.82
    },
    {
      id: 'claim-004',
      narrative_role: 'decision',
      claim: '下一步确认试点设备和数据接口',
      support: '需要确认 PLC、传感器和备件台账的数据接口。',
      proof_object: 'decision-summary',
      source_ids: ['src-001'],
      source_pages: { 'src-001': 1 },
      source_excerpts: { 'src-001': '下一步需要确认 PLC、传感器和备件台账的数据接口。' },
      bullets: ['确认设备清单', '梳理数据接口', '定义试点验收口径'],
      confidence: 0.88
    }
  ],
  clarifications: [
    { id: 'metric_basis', choice: 'provide', value: 'OEE 与 MTTR 使用设备部口径', effect: '保留数据页' }
  ],
  missing_info: ['备件台账字段', 'PLC 协议清单']
};

assert.deepEqual(validateExtraction(extraction), []);
const plan = compileDeckPlan(extraction, bundle);
assert.equal(plan.industry, 'manufacturing-operations');
assert.equal(plan.materialIntelligence.missingInfo.length, 2);
assert.equal(plan.materialIntelligence.clarifications.length, 1);
assert.ok(plan.commercialReview.openRisks.length >= 1);
assert.ok(plan.slides.some(s => s.type === 'industry-chart' && s.layoutVariant === 'downtime-pareto'));
const downtimeSlide = plan.slides.find(s => s.layoutVariant === 'downtime-pareto');
assert.equal(downtimeSlide.dataComponent, 'root-cause-matrix');
assert.equal(downtimeSlide.businessLogic.metric, 'OEE、MTTR、重复故障占比');
assert.ok(plan.slides.some(s => s.layoutVariant === 'production-topology'));
const topology = plan.slides.find(s => s.layoutVariant === 'production-topology');
assert.ok(
  topology.layers.every(layer => Array.isArray(layer.items) && layer.items.length > 0),
  'production topology should not compile empty layer containers when claim bullets are strings'
);
const topologySources = new Map(topology.sourceTrace.sources.map(source => [source.id, source]));
assert.equal(topologySources.get('src-001').provenance, 'text-source-excerpt');
assert.equal(topologySources.get('src-001').assetProvenance, undefined);
assert.equal(topologySources.get('src-002').provenance, 'image-provenance');
assert.equal(
  topology.sourceTrace.imageProvenance.some(item => item.sourceId === 'src-002'),
  true,
  'image provenance should only attach to the actual image source'
);
assert.ok(plan.slides.some(s => s.sourceTrace && s.sourceTrace.sourceIds.includes('src-001')));
assert.equal(
  sourceTraceAudit(plan, normalizeDeckPlan(plan)).findings.some(f => f.type === 'sourceTraceNotExplainable'),
  false
);
assert.equal(plan.slides.some(s => /用户材料自动整理|该页用于|模型抽取/.test(JSON.stringify(s))), false);

const gate = buildClarificationGate(
  bundle,
  {
    version: 'material-source-audit/v1',
    missing_inputs: ['PLC 协议清单', '客户案例授权'],
    global_risks: ['现场截图外发授权不明确']
  },
  {
    version: 'material-story-architecture/v1',
    ppt_type: 'solution',
    industry: 'manufacturing-operations',
    audience: '管理层',
    decision_goal: '确认关键设备试点范围和数据接口'
  }
);
assert.equal(gate.version, 'material-clarification-gate/v1');
assert.ok(gate.questions.some(q => q.id === 'customer_case_authorization'));
assert.ok(gate.questions.some(q => q.id === 'metric_basis'));

const companyIntro = JSON.parse(JSON.stringify(extraction));
companyIntro.document = Object.assign({}, companyIntro.document, {
  title: '恒越精工能力介绍',
  ppt_type: 'company-intro',
  organization: '恒越精工',
  audience: '潜在客户高层 / 采购负责人',
  date: '2026年5月'
});
companyIntro.claim_spine = companyIntro.claim_spine.map(c => Object.assign({}, c));
const introPlan = compileDeckPlan(companyIntro, bundle);
assert.equal(introPlan.title, '恒越精工');
assert.equal(introPlan.audience, undefined);
assert.equal(introPlan.date, undefined);
assert.equal(introPlan.showMeta, false);
assert.equal(introPlan.coverKicker, false);
assert.equal(introPlan.footer, '恒越精工');
assert.equal(introPlan.slides[1].type, 'toc-clean');
assert.equal(introPlan.slides[1].title, '目录');
assert.equal(introPlan.slides[2].type, 'company-profile-spread');
assert.equal(
  introPlan.slides.some((s, i) => i > 2 && /78%/.test(JSON.stringify(s)) && /OEE/.test(JSON.stringify(s))),
  true,
  'solution-specific OEE proof should remain when it is not duplicated by the company profile'
);
assert.equal(introPlan.slides.at(-1).closingVariant, 'company-thanks');
assert.equal(/潜在客户|采购负责人|2026年5月/.test(JSON.stringify(introPlan.slides)), false);

const incompleteExternalIntro = JSON.parse(JSON.stringify(companyIntro));
incompleteExternalIntro.claim_spine.push(
  {
    id: 'claim-risk',
    claim: '外发前需要核验证书、案例授权与联系方式',
    support: '资质编号、客户案例、联系人、官网和地址不明确时不能写成事实。',
    proof_object: 'risk-matrix',
    narrative_role: 'governance',
    source_ids: ['src-001'],
    confidence: 0.8
  },
  {
    id: 'claim-scope',
    claim: '项目行业标签帮助客户快速判断适配场景',
    support: '正式外发版需要补充可公开展示的行业项目与授权边界。',
    proof_object: 'report-board',
    narrative_role: 'proof',
    bullets: ['输送系统', '涂装设备', '控制系统', '现场安调服务'],
    source_ids: ['src-001'],
    confidence: 0.8
  }
);
incompleteExternalIntro.missing_info = ['联系人、电话、官网、地址或二维码', '资质证书名称/编号/有效期', '可公开展示的典型项目案例'];
const incompletePlan = compileDeckPlan(incompleteExternalIntro, bundle);
assert.equal(
  incompletePlan.slides.some(s => s.type === 'risk-table' || s.layoutVariant === 'risk-matrix'),
  false,
  'company intro should not turn missing external-use evidence into a customer-facing risk matrix'
);
assert.equal(
  /项目案例|资质荣誉/.test(JSON.stringify(incompletePlan.slides[1].items)),
  false,
  'company intro TOC should not promise cases or certificates when the material only says they are missing'
);
assert.ok(
  incompletePlan.slides.some(s => s.title === '服务范围覆盖输送、涂装、控制与现场安调'),
  'placeholder case/certificate risk should be replaced by a real service-scope page when product bullets exist'
);

const companyMetricIntro = JSON.parse(JSON.stringify(companyIntro));
companyMetricIntro.claim_spine[0] = Object.assign({}, companyMetricIntro.claim_spine[0], {
  claim: '长期制造基础支撑非标输送项目交付',
  support: '公司以厂区、车间和加工中心承接输送、涂装与现场安装调试需求。',
  proof_object: 'metric-board',
  metrics: [
    { label: '始建年份', value: '1993', note: '长期服务工业装备场景' },
    { label: '厂区规模', value: '20.5亩', note: '承载制造与装配' },
    { label: '生产车间', value: '3000余平米', note: '支撑一期生产' },
    { label: '加工中心', value: '1000余平米', note: '支撑加工与装配' }
  ]
});
const dedupedIntro = compileDeckPlan(companyMetricIntro, bundle);
assert.equal(
  dedupedIntro.slides.some(s => s.title === '长期制造基础支撑非标输送项目交付'),
  false,
  'duplicated company profile metrics should be removed from body slides'
);
assert.ok(
  dedupedIntro.materialIntelligence.dedupedSlides.some(s => /company-profile metrics/.test(s.reason)),
  'deduplication report should explain why the repeated metric slide was removed'
);

console.log('material pipeline ok');
