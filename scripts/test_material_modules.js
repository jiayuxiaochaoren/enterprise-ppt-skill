const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pipeline = require('./material_pipeline');
const { buildClarificationGate } = require('./material/clarification');
const { validateExtraction } = require('./material/deck-plan-compiler');
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
const { sourceTraceForClaim } = require('./material/source-trace');
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
