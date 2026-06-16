const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pipeline = require('./material_pipeline');
const { buildClarificationGate } = require('./material/clarification');
const { extractionDepthFindings, validateExtraction } = require('./material/deck-plan-compiler');
const { extractionSchema } = require('./material/extraction-schema');
const {
  classifyImageRole,
  collectFiles,
  detectIndustry,
  fileKind,
  splitChunks
} = require('./material/ingest');
const {
  classifyImageRole: directClassifyImageRole,
  collectFiles: directCollectFiles,
  detectIndustry: directDetectIndustry,
  fileKind: directFileKind,
  splitChunks: directSplitChunks
} = require('./material/ingest-file-utils');
const {
  chartFieldForProof,
  claimVisibleText,
  imagesForClaim,
  metricsFromClaim
} = require('./material/claim-slide-fields');
const {
  isCompanyProfileMetricClaim,
  manufacturingServiceScopeSlideFromClaim,
  slideFromClaim
} = require('./material/claim-to-slide');
const {
  companyIntroTocItems,
  materialHygieneSummary,
  shouldSuppressCompanyIntroClaim
} = require('./material/company-intro-planning');
const { targetSlideContract } = require('./material/slide-contract');
const {
  proofObjectForClaim,
  sourceTraceForClaim
} = require('./material/source-trace');
const { detectStructuredTables } = require('./material/tables');
const {
  normalizeOcrResults,
  ocrConfidence,
  ocrMatchFor,
  ocrPages,
  ocrText
} = require('./material/ocr');

const tables = detectStructuredTables([
  '指标 | 当前 | 目标',
  'OEE | 78% | 85%',
  'MTTR | 46分钟 | 30分钟'
].join('\n'), { id:'src-001', name:'ops.md' });
assert.equal(tables.length, 1);
assert.equal(tables[0].rowCount, 3);
assert.deepEqual(tables[0].headers, ['指标', '当前', '目标']);
assert.equal(classifyImageRole, directClassifyImageRole);
assert.equal(collectFiles, directCollectFiles);
assert.equal(detectIndustry, directDetectIndustry);
assert.equal(fileKind, directFileKind);
assert.equal(splitChunks, directSplitChunks);
assert.equal(classifyImageRole('factory-dashboard-screen.png', { category:'screenshot' }), 'evidence');
assert.equal(classifyImageRole('product-detail.jpg', { category:'photo' }), 'showcase');
assert.equal(fileKind('brief.md'), 'text');
assert.equal(fileKind('deck.pptx'), 'office');
assert.ok(splitChunks('第一段\n\n第二段', 20).length >= 1);
assert.ok(detectIndustry('新能源 光伏 储能').length >= 1);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-material-modules-'));
const image = path.join(dir, 'scan.png');
fs.writeFileSync(image, 'fake');
assert.deepEqual(collectFiles([dir]).map(file => path.basename(file)), ['scan.png']);
const ocrMap = normalizeOcrResults({
  results: [{
    path: image,
    provider: 'fixture',
    pages: [
      { page: 1, text: '第一页 OCR 文本', confidence: 0.91, bbox: [0, 0, 100, 100] },
      { page: 2, text: '第二页 OCR 文本', confidence: 0.73 }
    ]
  }]
});
const match = ocrMatchFor(ocrMap, { path:image, name:'scan.png' });
assert.ok(match);
assert.equal(ocrText(match), '第一页 OCR 文本\n\n第二页 OCR 文本');
assert.equal(ocrPages(match).length, 2);
assert.ok(ocrConfidence(match) < 0.9);

const schema = extractionSchema();
assert.equal(schema.version, 'material-extraction/v1');
assert.ok(schema.claim_spine[0].source_pages);
['business_domain', 'chain_stage', 'depth_domain', 'industry_objects', 'proof_intent'].forEach(field => {
  assert.ok(Object.prototype.hasOwnProperty.call(schema.claim_spine[0], field), `claim schema should include ${field}`);
});
assert.ok(Object.prototype.hasOwnProperty.call(schema.claim_spine[0], 'display_copy'));
assert.equal(chartFieldForProof('monthly-pulse-trend'), 'monthlyPulse');
assert.deepEqual(metricsFromClaim({ claim:'OEE 提升至 78%，计划达到 85%' }).map(m => m.value), ['78%', '85%']);
assert.ok(claimVisibleText({ claim:'核心判断', bullets:['证据一'] }).includes('证据一'));
assert.equal(isCompanyProfileMetricClaim({
  claim: '公司成立于 2010 年，厂区面积 20000 平方米',
  metrics: [{ label:'厂区面积', value:'20000㎡' }]
}), true);
assert.equal(shouldSuppressCompanyIntroClaim({
  narrative_role: 'governance',
  proof_object: 'risk-board',
  claim: '未经授权的客户案例不可外发'
}), true);
assert.deepEqual(
  companyIntroTocItems({
    facts: [{ text:'拥有高新技术企业认证' }],
    evidence: [{ text:'交付多个客户项目案例' }],
    claim_spine: []
  }, ['sales@example.com']).slice(-2),
  ['资质荣誉', '联系方式']
);
assert.equal(materialHygieneSummary({
  sources: [{ id:'src-1', name:'brief.md', materialHygiene: { removedLineCount:2, removedSample:[{ lineNumber:3, text:'internal', reasons:['internal-note'] }] } }]
}).removedSample[0].sourceId, 'src-1');
assert.equal(manufacturingServiceScopeSlideFromClaim({ bullets:['输送系统', '控制系统'] }).type, 'report-board');
assert.equal(slideFromClaim({
  claim:'OEE 提升',
  proof_object:'monthly-pulse-trend',
  source_ids:['src-001'],
  metrics:[{ label:'OEE', value:'78%' }]
}, { evidence: [] }, { sources: [{ id:'src-001', kind:'text', name:'brief.md' }] }).monthlyPulse.length, 1);
const customerParetoSlide = slideFromClaim({
  claim:'客户痛点呈现帕累托：交付周期与海外认证并列第一',
  support:'60 份调研中，项目交付周期长和海外认证周期不确定各出现 16 次。',
  proof_object:'downtime-pareto',
  coreTitle:'复购不只是价格问题',
  source_ids:['src-001'],
  metrics:[
    { label:'交付周期长', value:'16次', note:'客户顾虑' },
    { label:'海外认证不确定', value:'16次', note:'客户顾虑' }
  ]
}, { evidence: [] }, { sources: [{ id:'src-001', kind:'text', name:'research.csv' }] });
assert.equal(customerParetoSlide.title, '客户痛点排序：交付周期与海外认证并列第一');
assert.equal(customerParetoSlide.coreTitle, '复购不只是价格问题');
assert.equal(customerParetoSlide.proofObject, 'issue-frequency-ranking');
const displayCopyPrioritySlide = slideFromClaim({
  claim:'内部旧标题：DOWNTIME PARETO',
  support:'旧副标题',
  proof_object:'responsibility-loop',
  display_copy:{
    title:'经营动作闭环',
    subtitle:'按角色、资料与复盘节奏推进重点事项。',
    core_title:'动作闭环',
    core_body:'避免通用责任文案外泄。'
  },
  bullets:['制造交付', '认证验收']
}, { evidence: [] }, { sources: [] });
assert.equal(displayCopyPrioritySlide.title, '经营动作闭环');
assert.equal(displayCopyPrioritySlide.subtitle, '按角色、资料与复盘节奏推进重点事项。');
assert.equal(displayCopyPrioritySlide.proofObject, 'generic-action-loop');
const foundationMetricSlide = slideFromClaim({
  claim:'多渠道经营底座已成型，后续转向质量增长',
  support:'SKU、平台和团队规模构成增长基础。',
  proof_object:'metric-board',
  metrics:[
    { label:'成立年份', value:'2018', note:'经营底座' },
    { label:'员工规模', value:'214人', note:'团队规模' },
    { label:'在售 SKU', value:'684个', note:'产品宽度' },
    { label:'2026 目标', value:'+27%', note:'营收同比增长' }
  ]
}, { evidence: [] }, { sources: [] });
assert.equal(foundationMetricSlide.type, 'report-board');
assert.equal(foundationMetricSlide.proofObject, 'report-board');
assert.equal(foundationMetricSlide.label, '经营底座');
assert.equal(foundationMetricSlide.sections.length, 4);
const financeMetricSlide = slideFromClaim({
  claim:'利润质量修复后，费用要绑定现金回款',
  support:'Q4 利润率承压，Q1 修复，继续加码前要明确回收周期。',
  proof_object:'metric-board',
  metrics:[
    { label:'2025Q4 利润率', value:'-16.0%', note:'经营利润承压' },
    { label:'2026Q1 利润率', value:'17.4%', note:'利润质量修复' },
    { label:'2026Q1 回款', value:'5214.48万', note:'现金回款' },
    { label:'2025Q3 销售费用', value:'1486.08万', note:'费用投放增加' }
  ]
}, { evidence: [] }, { sources: [] });
assert.equal(financeMetricSlide.type, 'metric-comparison');
assert.equal(financeMetricSlide.layoutVariant, 'financial-kpi-snapshot');
assert.equal(financeMetricSlide.proofObject, 'financial-kpi-snapshot');
assert.deepEqual(
  imagesForClaim(
    { visuals:[{ source_id:'img-001', caption:'现场照片', role:'evidence' }] },
    { evidence:[] },
    { sources:[{ id:'img-001', kind:'image', path:'/tmp/site.png', name:'site.png' }] }
  ),
  [{ path:'/tmp/site.png', caption:'现场照片', role:'evidence' }]
);
const contract = targetSlideContract(
  { document: { requested_slide_count: 8 }, claim_spine: [{}, {}, {}], evidence: [{}], facts: [{}] },
  { images: [], sources: [{}], textSummary: { numbers: ['78%'], charCount: 2000 } },
  {},
  { baseSlides: 3, claimCount: 3 }
);
assert.equal(contract.version, 'target-slides/v1');
assert.equal(contract.requested, 8);

const trace = sourceTraceForClaim(
  { id:'claim-1', source_ids:['src-001'], source_pages:{ 'src-001':2 }, source_excerpts:{ 'src-001':'原文摘录' } },
  { evidence: [] },
  { sources: [{ id:'src-001', kind:'text', name:'brief.md', relativePath:'brief.md' }] }
);
assert.equal(trace.version, 'source-trace/v2');
assert.equal(trace.sources[0].page, 2);
const scalarTraceInput = {
  id:'claim-scalar',
  claim:'Scalar source evidence',
  evidence_ids:'ev1',
  source_ids:'src-a',
  source_pages:{ 'src-a':3 },
  source_excerpts:{ 'src-a':'scalar source excerpt' }
};
const scalarExtraction = {
  evidence:[{ id:'ev1', type:'metric', sourceIds:['src-a'], summary:'camelCase evidence summary' }]
};
const scalarBundle = {
  sources:[{ id:'src-a', kind:'text', name:'brief.md', relativePath:'brief.md' }]
};
const scalarTrace = sourceTraceForClaim(scalarTraceInput, scalarExtraction, scalarBundle);
assert.deepEqual(scalarTrace.evidenceIds, ['ev1']);
assert.deepEqual(scalarTrace.sourceIds, ['src-a']);
const scalarProof = proofObjectForClaim(scalarTraceInput, scalarExtraction, scalarBundle);
assert.equal(scalarProof.factual, true);
assert.deepEqual(scalarProof.sourceIds, scalarTrace.sourceIds);
const scalarSlide = slideFromClaim(scalarTraceInput, scalarExtraction, scalarBundle);
assert.deepEqual(
  scalarSlide.proof.sourceIds,
  scalarSlide.sourceTrace.sourceIds,
  'slide proof sourceIds should come from canonical sourceTrace'
);
const depthFindings = extractionDepthFindings({
  version:'material-extraction/v1',
  document:{ industry:'brand-retail' },
  claim_spine:[{
    id:'claim-depth-missing',
    claim:'产品与视觉证据缺少深度字段',
    source_ids:['src-a']
  }]
});
assert.equal(depthFindings[0].type, 'extractionDepthFieldsMissing');
assert.ok(depthFindings[0].missingFields.includes('business_domain'));
const editorialSlide = slideFromClaim({
  id:'claim-editorial',
  claim:'核心 SKU 已经形成产品角色，但缺少可外发产品图',
  support:'产品宽度和消费者反馈可以先结构化呈现。',
  business_domain:'editorial-proof',
  chain_stage:'visual-claim',
  depth_domain:'editorial-proof',
  proof_intent:'visual claim',
  proof_object:'editorial-proof-board',
  industry_objects:{
    product_skus:['P01 基础款', 'P04 防晒'],
    platforms_channels:['Amazon', 'TikTok Shop'],
    customer_or_user_signals:['物流顾虑', '品质升级']
  },
  asset_requirements:[{ role:'product', required:true, provenance:'user-provided product image required' }],
  missing_info:['缺少真实产品图'],
  source_ids:['src-a'],
  source_pages:{ 'src-a':1 },
  source_excerpts:{ 'src-a':'SKU 与消费者反馈样本' }
}, { evidence: [] }, scalarBundle);
assert.equal(editorialSlide.type, 'report-board');
assert.equal(editorialSlide.layoutVariant, 'editorial-proof-board');
assert.equal(editorialSlide.proofObject, 'editorial-proof-board');
assert.equal(editorialSlide.depthDomain, 'editorial-proof');
assert.ok(editorialSlide.sections.some(section => /产品/.test(section.title)));
assert.ok(editorialSlide.informationGap, 'missing factual editorial assets should remain as an information gap');
assert.equal(editorialSlide.assetGeneration.status, 'blocked');
const assetOnlyClaim = { id:'claim-asset-only', claim:'Asset-only evidence', evidenceIds:'ev-asset' };
const assetOnlyExtraction = {
  evidence:[{ id:'ev-asset', type:'image', assetSourceId:'img-asset', summary:'asset evidence', authorizationStatus:'cleared' }]
};
const assetOnlyBundle = {
  sources:[{ id:'img-asset', kind:'image', path:'/tmp/asset.png', relativePath:'asset.png', name:'asset.png', authorizationStatus:'cleared' }]
};
const assetOnlyTrace = sourceTraceForClaim(assetOnlyClaim, assetOnlyExtraction, assetOnlyBundle);
assert.deepEqual(assetOnlyTrace.sourceIds, ['img-asset']);
assert.equal(assetOnlyTrace.imageProvenance[0].sourceId, 'img-asset');
assert.equal(assetOnlyTrace.imageProvenance[0].authorizationStatus, 'cleared');
const assetOnlyProof = proofObjectForClaim(assetOnlyClaim, assetOnlyExtraction, assetOnlyBundle);
assert.equal(assetOnlyProof.factual, true);
assert.equal(assetOnlyProof.provenance, 'real-asset-evidence');
assert.equal(assetOnlyProof.sourceTrace.imageProvenance[0].sourceId, 'img-asset');
assert.deepEqual(
  imagesForClaim(assetOnlyClaim, assetOnlyExtraction, assetOnlyBundle),
  [{ path:'/tmp/asset.png', caption:'asset evidence', role:'image' }],
  'imagesForClaim should consume scalar camelCase evidenceIds and assetSourceId'
);
const reviewTrace = sourceTraceForClaim(
  { id:'claim-review', source_ids:['src-cleared'], evidence_ids:['ev-review'], source_pages:{ 'src-cleared':1, 'img-review':2 }, source_excerpts:{ 'src-cleared':'文本来源', 'img-review':'图片来源' } },
  { evidence:[{ id:'ev-review', asset_source_id:'img-review', authorizationStatus:'needs-review' }] },
  { sources:[
    { id:'src-cleared', kind:'text', name:'brief.md', authorizationStatus:'cleared' },
    { id:'img-review', kind:'image', relativePath:'review.png', authorizationStatus:'cleared' }
  ] }
);
assert.equal(reviewTrace.assetAuthorizationStatus, 'needs-review');
const blockedTrace = sourceTraceForClaim(
  { id:'claim-blocked', source_ids:['src-cleared'], evidence_ids:['ev-blocked'], source_pages:{ 'src-cleared':1, 'img-blocked':2 }, source_excerpts:{ 'src-cleared':'文本来源', 'img-blocked':'图片来源' } },
  { evidence:[{ id:'ev-blocked', asset_source_id:'img-blocked', authorizationStatus:'blocked' }] },
  { sources:[
    { id:'src-cleared', kind:'text', name:'brief.md', authorizationStatus:'cleared' },
    { id:'img-blocked', kind:'image', relativePath:'blocked.png', authorizationStatus:'cleared' }
  ] }
);
assert.equal(blockedTrace.assetAuthorizationStatus, 'blocked');

const gate = buildClarificationGate(
  { images: [], textSummary: { numbers: [] }, sources: [{ text:'客户案例授权不明确，缺少联系人。' }] },
  { missing_inputs: ['客户案例授权', '联系方式'] },
  { ppt_type:'solution', audience:'客户销售/对外', decision_goal:'推进合作' },
  { external:true }
);
assert.equal(gate.version, 'material-clarification-gate/v1');
assert.ok(gate.questions.some(q => q.priority === 'blocking'));

assert.deepEqual(
  validateExtraction({ version:'material-extraction/v1', document:{}, claim_spine:[] }),
  ['extraction.claim_spine must contain at least two claims']
);
assert.equal(pipeline.buildClarificationGate, buildClarificationGate);

console.log('material modules ok');
