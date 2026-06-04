const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-content-coverage');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let visualQaRunId = 0;

function runVisualQa(args) {
  const stdoutPath = path.join(OUT, `visual-qa-${++visualQaRunId}.json`);
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  try {
    const qa = cp.spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', stdoutFd, 'pipe']
    });
    fs.closeSync(stdoutFd);
    return {
      status: qa.status == null ? 1 : qa.status,
      stdout: fs.readFileSync(stdoutPath, 'utf8'),
      stderr: String(qa.stderr || '')
    };
  } catch (error) {
    fs.closeSync(stdoutFd);
    throw error;
  }
}

const pptxPath = path.join(OUT, 'blank-body.pptx');
const planPath = path.join(OUT, 'blank-body-plan.json');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
const slide = pptx.addSlide();
slide.background = { color: 'FFFFFF' };
slide.addText('只有标题的内容页', { x: 0.8, y: 0.65, w: 7.4, h: 0.36, fontFace: 'PingFang SC', fontSize: 24, bold: true, color: '111827' });
slide.addText('页脚', { x: 0.8, y: 7.05, w: 2.0, h: 0.16, fontFace: 'PingFang SC', fontSize: 8, color: '6B7280' });
[
  { x: 0.9, y: 1.7, w: 3.1, h: 1.0 },
  { x: 4.2, y: 1.7, w: 3.1, h: 1.0 },
  { x: 0.9, y: 3.0, w: 6.4, h: 1.2 }
].forEach(box => slide.addShape(pptx.ShapeType.rect, {
  ...box,
  fill: { color: 'EEF2F7', transparency: 8 },
  line: { color: 'D9E2EF', transparency: 18 }
}));
const evidenceSlide = pptx.addSlide();
evidenceSlide.background = { color: 'FFFFFF' };
evidenceSlide.addText('证据区缺失检测页', { x: 0.8, y: 0.65, w: 7.4, h: 0.36, fontFace: 'PingFang SC', fontSize: 24, bold: true, color: '111827' });
evidenceSlide.addText('左侧正文已经覆盖主内容区，但右侧证据图像或图库组件没有任何可见内容，应被截图区域密度规则拦截。', {
  x: 0.9,
  y: 1.75,
  w: 5.2,
  h: 0.75,
  fontFace: 'PingFang SC',
  fontSize: 15,
  color: '111827'
});

pptx.writeFile({ fileName: pptxPath }).then(() => {
  const shrinkTextBox = {
    role: 'body',
    fontSize: 8.2,
    fitStrategy: 'shrink',
    cjkChars: 52,
    region: 'mainBody',
    boxArea: 0.28,
    box: { x: 1.0, y: 2.0, w: 1.12, h: 0.25 },
    charsPerInch: 46.43,
    areaDensity: 120,
    shrinkRisk: true,
    readabilityRiskLevel: 'review',
    sample: '这是一段会在正式审阅中触发压缩风险的长中文正文'
  };
  fs.writeFileSync(`${pptxPath}.render-meta.json`, JSON.stringify({
    version: 'render-meta/v1',
    slideCount: 2,
    slides: [{
      slide: 1,
      type: 'content',
      rendererMatch: {
        requestedType: 'content',
        matchedType: 'content',
        matchKind: 'exact',
        rendererId: 'content',
        rendererName: 'testContent',
        source: 'test'
      },
      renderRoute: {
        version: 'render-route/v1',
        family: 'business',
        requestedType: 'content',
        renderer: { id:'content', name:'testContent', matchKind:'exact', source:'test' },
        layoutVariant: '',
        componentPlan: { version:'component-plan/v1', componentIds:[], unknownComponents:[], rulesApplied:[] },
        assetPolicy: { status:'none', role:'none', mustBind:false, syntheticOnly:false, staleForRoute:false, hasPrompt:false, hasBoundAsset:false }
      },
      assetDecision: {
        version: 'asset-decision/v1',
        status: 'none',
        mode: 'structure-only',
        action: 'structure_only',
        reason: 'no image required for resolved slide route',
        riskLevel: 'low',
        originalRole: 'none',
        resolvedRole: 'none',
        provenanceClass: 'none',
        proofEligibility: ['none'],
        boundAssetCount: 0
      },
      plannedComponents: [],
      unknownComponents: [],
      drawnComponents: [],
      consumedComponents: [],
      missingRequiredComponents: [],
      textBoxes: [shrinkTextBox]
    }, {
      slide: 2,
      type: 'case-gallery',
      rendererMatch: {
        requestedType: 'case-gallery',
        matchedType: 'case-gallery',
        matchKind: 'exact',
        rendererId: 'case-gallery',
        rendererName: 'testCaseGallery',
        source: 'test'
      },
      renderRoute: {
        version: 'render-route/v1',
        family: 'evidence-gallery',
        requestedType: 'case-gallery',
        renderer: { id:'case-gallery', name:'testCaseGallery', matchKind:'exact', source:'test' },
        layoutVariant: '',
        componentPlan: { version:'component-plan/v1', componentIds:['proof-gallery'], unknownComponents:[], rulesApplied:[] },
        assetPolicy: { status:'none', role:'gallery', mustBind:false, syntheticOnly:false, staleForRoute:false, hasPrompt:false, hasBoundAsset:false }
      },
      assetDecision: {
        version: 'asset-decision/v1',
        status: 'none',
        mode: 'structure-only',
        action: 'structure_only',
        reason: 'fixture intentionally omits expected right evidence image',
        riskLevel: 'review',
        originalRole: 'gallery',
        resolvedRole: 'gallery',
        provenanceClass: 'none',
        proofEligibility: ['none'],
        boundAssetCount: 0
      },
      plannedComponents: [{
        id: 'proof-gallery',
        required: true,
        allowedModes: ['native'],
        slotPolicy: 'native-evidence-required',
        repairPolicy: 'no-unplanned-repair',
        priority: 'required'
      }],
      unknownComponents: [],
      drawnComponents: [],
      consumedComponents: [],
      missingRequiredComponents: ['proof-gallery'],
      textBoxes: []
    }]
  }, null, 2));
  fs.writeFileSync(planPath, JSON.stringify({
    industry: 'beauty-consumer',
    sourceTracePolicy: { mode: 'plan-authored' },
    slides: [{
      type: 'content',
      title: '只有标题的内容页',
      body: shrinkTextBox.sample
    }, {
      type: 'case-gallery',
      title: '证据区缺失检测页',
      body: '左侧正文已经覆盖主内容区，但右侧证据图像或图库组件没有任何可见内容。'
    }]
  }, null, 2));
  const qa = runVisualQa(['scripts/visual_qa.js', pptxPath, '--json']);
  assert.notEqual(qa.status, 0, 'blank content body should fail visual QA');
  const result = JSON.parse(qa.stdout);
  assert.equal(result.content_coverage_qa.status, 'fail');
  assert.ok(result.slides[0].mainBodyCoverage >= 0.015, 'decorative rectangles should create non-trivial body coverage');
  assert.ok(result.slides[0].mainBodyElements >= 3, 'decorative rectangles should count as body elements');
  assert.equal(result.findings.some(f => f.type === 'mainBodyMissingContent'), true);
  const decorativeMainFinding = result.findings.find(f => f.type === 'mainBodyMissingContent' && /non-text shapes/.test(f.message));
  assert.equal(decorativeMainFinding.reason, 'main_body_decorative_only');
  assert.equal(decorativeMainFinding.regionName, 'mainBody');
  assert.equal(typeof decorativeMainFinding.mainBodyCoverage, 'number');
  const rightEvidenceFinding = result.findings.find(f => f.type === 'rightEvidenceRegionMissing' && f.slide === 2);
  assert.ok(rightEvidenceFinding, 'expected right-side evidence gap should fail visual QA');
  assert.equal(rightEvidenceFinding.reason, 'expected_evidence_region_empty');
  assert.equal(rightEvidenceFinding.regionName, 'rightEvidence');
  assert.equal(rightEvidenceFinding.rightEvidenceCoverage, 0);
  assert.deepEqual(rightEvidenceFinding.expectedComponentIds, ['proof-gallery']);
  const formalQa = runVisualQa(['scripts/visual_qa.js', pptxPath, '--plan', planPath, '--quality-mode', 'formal', '--json']);
  assert.notEqual(formalQa.status, 0, 'formal visual QA should fail long Chinese shrink risk');
  const formalResult = JSON.parse(formalQa.stdout);
  const shrinkFinding = formalResult.findings.find(f => f.type === 'textShrinkRisk');
  assert.equal(shrinkFinding.level, 'fail');
  assert.equal(shrinkFinding.originalLevel, 'review');
  assert.equal(shrinkFinding.fatalBecauseOfQualityMode, 'formal');
  assert.equal(shrinkFinding.severityCategory, 'shrink_risk');
  assert.equal(shrinkFinding.role, 'body');
  assert.equal(shrinkFinding.readabilityRiskLevel, 'review');
  assert.ok(shrinkFinding.charsPerInch > 18);
  assert.ok(shrinkFinding.areaDensity > 95);
  console.log('visual QA content coverage ok');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
