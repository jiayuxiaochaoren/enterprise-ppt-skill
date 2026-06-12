const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const pptxgen = require('pptxgenjs');
const {
  runVisualQa: runVisualQaDirect
} = require('./qa/visual-qa-runner');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs', 'test-visual-qa-render-counts');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let visualQaRunId = 0;

function plannedComponent(overrides = {}) {
  return {
    id: 'content-card-grid',
    required: true,
    allowedModes: ['native'],
    slotPolicy: 'native-evidence-required',
    repairPolicy: 'no-unplanned-repair',
    priority: 'required',
    ...overrides
  };
}

function baseRenderMeta({ title, drawnCount, mode = 'native-renderer', planned = plannedComponent() }) {
  return {
    version: 'render-meta/v1',
    slideCount: 1,
    slides: [{
      slide: 1,
      type: 'cards',
      rendererMatch: {
        requestedType: 'cards',
        matchedType: 'cards',
        matchKind: 'exact',
        rendererId: 'cards',
        rendererName: 'testCards',
        source: 'test'
      },
      renderRoute: {
        version: 'render-route/v1',
        family: 'business',
        requestedType: 'cards',
        renderer: { id:'cards', name:'testCards', matchKind:'exact', source:'test' },
        layoutVariant: '',
        componentPlan: { version:'component-plan/v1', componentIds:['content-card-grid'], unknownComponents:[], rulesApplied:[] },
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
      nativeRendererContract: {
        version: 'native-renderer-contract/v1',
        rendererName: 'testCards',
        slideType: 'cards',
        layoutVariant: '',
        ownedComponents: ['content-card-grid'],
        occupiedZones: [],
        safeOverlayZones: {}
      },
      plannedComponents: [planned],
      unknownComponents: [],
      drawnComponents: [{
        id: 'content-card-grid',
        drawnCount,
        nativeSlot: 'cards',
        bbox: { x: 0.8, y: 1.5, w: 8, h: 3 },
        rendererModule: 'test',
        rendererMethod: 'testCards'
      }],
      consumedComponents: [{
        id: 'content-card-grid',
        required: true,
        mode,
        rendered: true,
        drawnCount,
        nativeSlot: mode === 'native-renderer' ? 'cards' : '',
        bbox: { x: 0.8, y: 1.5, w: 8, h: 3 },
        rendererMethod: mode === 'native-renderer' ? 'testCards' : ''
      }],
      missingRequiredComponents: [],
      textBoxes: [{ text: title, x: 0.8, y: 0.65, w: 7.4, h: 0.36 }]
    }]
  };
}

async function writeFixture(name, plan, renderMeta, labels) {
  const planPath = path.join(OUT, `${name}-plan.json`);
  const pptxPath = path.join(OUT, `${name}.pptx`);
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addText(plan.slides[0].title, { x: 0.8, y: 0.65, w: 7.4, h: 0.36, fontFace: 'Avenir Next', fontSize: 24, bold: true, color: '111827' });
  labels.forEach((label, i) => {
    slide.addText(label, { x: 0.9 + i * 2.0, y: 2.0, w: 1.4, h: 0.3, fontFace: 'Avenir Next', fontSize: 14, color: '111827' });
  });
  await pptx.writeFile({ fileName: pptxPath });
  fs.writeFileSync(`${pptxPath}.render-meta.json`, JSON.stringify(renderMeta, null, 2));
  return { planPath, pptxPath };
}

function runQa(pptxPath, planPath) {
  const args = ['scripts/visual_qa.js', pptxPath, '--plan', planPath, '--json'];
  const stdoutPath = path.join(OUT, `visual-qa-${++visualQaRunId}.json`);
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  const qa = cp.spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', stdoutFd, 'pipe']
  });
  fs.closeSync(stdoutFd);
  const stdout = fs.readFileSync(stdoutPath, 'utf8');
  return { qa: { status: qa.status == null ? 1 : qa.status, stdout, stderr: String(qa.stderr || '') }, result: JSON.parse(stdout) };
}

(async () => {
  const missingCardPlan = {
    industry: 'general-operations',
    slides: [{
      type: 'cards',
      title: 'Four cards are planned',
      cards: [
        { title: 'A', body: 'One' },
        { title: 'B', body: 'Two' },
        { title: 'C', body: 'Three' },
        { title: 'D', body: 'Four' }
      ]
    }]
  };
  const missingCard = await writeFixture(
    'missing-card',
    missingCardPlan,
    baseRenderMeta({ title: 'Four cards are planned', drawnCount: 3 }),
    ['A', 'B', 'C']
  );
  const missingCardQa = runQa(missingCard.pptxPath, missingCard.planPath);
  assert.notEqual(missingCardQa.qa.status, 0, 'missing rendered card should fail visual QA');
  assert.equal(missingCardQa.result.component_consumption_qa.status, 'fail');
  assert.equal(missingCardQa.result.findings.some(f => f.type === 'renderedCountMismatch'), true);
  const directMissingCardQa = runVisualQaDirect({ file: missingCard.pptxPath, planPath: missingCard.planPath });
  assert.equal(directMissingCardQa.success, false);
  assert.equal(directMissingCardQa.component_consumption_qa.status, 'fail');
  assert.equal(directMissingCardQa.findings.some(f => f.type === 'renderedCountMismatch'), true);

  const modeMismatchPlan = {
    industry: 'general-operations',
    slides: [{
      type: 'cards',
      title: 'Native-only component cannot render as overlay',
      cards: [{ title: 'A', body: 'One' }]
    }]
  };
  const modeMismatch = await writeFixture(
    'mode-mismatch',
    modeMismatchPlan,
    baseRenderMeta({ title: 'Native-only component cannot render as overlay', drawnCount: 1, mode: 'overlay' }),
    ['A']
  );
  const modeMismatchQa = runQa(modeMismatch.pptxPath, modeMismatch.planPath);
  assert.notEqual(modeMismatchQa.qa.status, 0, 'mode mismatch should fail visual QA');
  assert.equal(modeMismatchQa.result.component_consumption_qa.status, 'fail');
  assert.equal(modeMismatchQa.result.findings.some(f => f.type === 'componentModeMismatch'), true);
  assert.equal(modeMismatchQa.result.overlay_contract_qa.status, 'fail');
  assert.equal(modeMismatchQa.result.findings.some(f => f.type === 'overlayWithoutDeclaredSlot'), true);

  console.log('visual QA render counts ok');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
