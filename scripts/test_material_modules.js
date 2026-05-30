const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pipeline = require('./material_pipeline');
const { buildClarificationGate } = require('./material/clarification');
const { validateExtraction } = require('./material/deck-plan-compiler');
const { extractionSchema } = require('./material/extraction-schema');
const { classifyImageRole } = require('./material/ingest');
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
