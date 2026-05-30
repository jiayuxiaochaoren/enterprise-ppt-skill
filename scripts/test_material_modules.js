const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pipeline = require('./material_pipeline');
const { buildClarificationGate } = require('./material/clarification');
const { validateExtraction } = require('./material/deck-plan-compiler');
const { extractionSchema } = require('./material/extraction-schema');
const { classifyImageRole } = require('./material/ingest');
const {
  chartFieldForProof,
  claimVisibleText,
  imagesForClaim,
  metricsFromClaim
} = require('./material/claim-slide-fields');
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
assert.equal(classifyImageRole('factory-dashboard-screen.png', { category:'screenshot' }), 'evidence');
assert.equal(classifyImageRole('product-detail.jpg', { category:'photo' }), 'showcase');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-material-modules-'));
const image = path.join(dir, 'scan.png');
fs.writeFileSync(image, 'fake');
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
