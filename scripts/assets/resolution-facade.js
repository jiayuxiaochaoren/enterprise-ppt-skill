const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {
  buildGate,
  readJson,
  writeJson
} = require('./decision-gate');
const { bindGeneratedAssetsFromFiles } = require('./binder');
const { planAssetPromptsFromFile } = require('./prompt-planner');

const ROOT = path.resolve(__dirname, '..', '..');

function rel(file, root = ROOT) {
  return path.relative(root, path.resolve(file)).split(path.sep).join('/');
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function actionForQuestion(question = {}, opts = {}) {
  const allowed = Array.isArray(question.allowedActions) ? question.allowedActions : [];
  const imagegenAvailable = opts.imagegenCapability === 'available';
  const missingAssetAction = String(opts.missingAssetAction || 'require_user_input').toLowerCase();
  const blockedAction = String(opts.blockedAction || 'require_user_input').toLowerCase();
  if (question.blocked) {
    if (blockedAction === 'skip_image' && allowed.includes('skip_image')) return 'skip_image';
    return '';
  }
  if (missingAssetAction === 'require_user_input') return '';
  if (missingAssetAction === 'auto_generate') {
    if (imagegenAvailable && allowed.includes('auto_generate')) return 'auto_generate';
    return '';
  }
  if (missingAssetAction === 'skip_image' && allowed.includes('skip_image')) return 'skip_image';
  return '';
}

function decisionReason(action, opts = {}, question = {}) {
  if (action === 'auto_generate') {
    return 'imagegen capability available; request synthetic asset before renderer fallback';
  }
  if (action === 'skip_image' && opts.imagegenCapability === 'available' && question.blocked) {
    return 'generated assets cannot satisfy factual proof; use native structure instead';
  }
  if (action === 'skip_image') {
    return 'explicit missing-asset action selected structure-only rendering before renderer fallback';
  }
  return 'asset decision requires user input';
}

function buildAutoAnswers(gate = {}, opts = {}) {
  const decisions = {};
  const unresolved = [];
  const counts = {
    autoGenerate: 0,
    skipImage: 0,
    requireUserInput: 0
  };
  (gate.questions || []).forEach(question => {
    const action = actionForQuestion(question, opts);
    if (!action) {
      counts.requireUserInput += 1;
      unresolved.push(question);
      return;
    }
    decisions[String(question.slide)] = {
      action,
      reason: decisionReason(action, opts, question)
    };
    if (action === 'auto_generate') counts.autoGenerate += 1;
    if (action === 'skip_image') counts.skipImage += 1;
  });
  return { decisions, unresolved, counts };
}

function defaultPaths(opts = {}) {
  const planPath = path.resolve(opts.plan || opts.planPath);
  const outDir = path.resolve(opts.outDir || path.dirname(planPath));
  return {
    outDir,
    gate: path.join(outDir, 'asset-decision-gate.json'),
    answers: path.join(outDir, 'asset-answers.auto-resolution.json'),
    resolvedGate: path.join(outDir, 'asset-decision-gate.resolved.json'),
    postBindGate: path.join(outDir, 'asset-decision-gate.post-bind.json'),
    resolvedPlan: path.resolve(opts.outPlan || path.join(outDir, 'deck-plan.assets-resolved.json')),
    prompts: path.resolve(opts.promptsOut || path.join(outDir, 'asset-prompts.json')),
    report: path.resolve(opts.report || path.join(outDir, 'visual-asset-resolution.json')),
    boundPlan: path.resolve(opts.outPlan || path.join(outDir, 'deck-plan.assets-bound.json')),
    generatedMap: path.resolve(opts.generatedMap || opts.assetMap || path.join(outDir, 'asset-map.generated.json')),
    generatedAssetsDir: path.resolve(opts.generatedAssetsDir || path.join(outDir, 'generated-assets'))
  };
}

function shellQuote(value = '') {
  return `'${String(value || '').replace(/'/g, `'\\''`)}'`;
}

function compileCommandTemplate(template = '', placeholders = {}) {
  let command = String(template || '').trim();
  Object.entries(placeholders || {}).forEach(([key, value]) => {
    command = command.replace(new RegExp(`\\{${key}\\}`, 'g'), shellQuote(value));
  });
  return command;
}

function numericMappingShape(value = null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => /^\d+$/.test(String(key)));
}

function materializeAssetMapFromBridge(stdout = '', fallbackPath = '') {
  const parsed = parseJson(stdout);
  if (!parsed) return '';
  if (parsed.assetMap || parsed.asset_map || parsed.mappingPath || parsed.mapping_path) {
    return path.resolve(String(parsed.assetMap || parsed.asset_map || parsed.mappingPath || parsed.mapping_path));
  }
  if (parsed.mapping && typeof parsed.mapping === 'object') {
    writeJson(fallbackPath, parsed.mapping);
    return fallbackPath;
  }
  if (numericMappingShape(parsed)) {
    writeJson(fallbackPath, parsed);
    return fallbackPath;
  }
  return '';
}

function runImagegenBridge({
  commandTemplate = '',
  promptsPath = '',
  assetMapPath = '',
  assetsDir = '',
  outDir = '',
  planPath = '',
  root = ROOT,
  timeoutMs = 240000
} = {}) {
  const placeholders = {
    prompts: promptsPath,
    assetMap: assetMapPath,
    assetsDir,
    outDir,
    plan: planPath
  };
  const command = compileCommandTemplate(commandTemplate, placeholders);
  const env = Object.assign({}, process.env, {
    CODEX_ASSET_PROMPTS: promptsPath,
    CODEX_ASSET_MAP: assetMapPath,
    CODEX_ASSET_DIR: assetsDir,
    CODEX_ASSET_OUT_DIR: outDir,
    CODEX_DECK_PLAN: planPath
  });
  fs.mkdirSync(path.dirname(assetMapPath), { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });
  const result = cp.spawnSync(command, {
    cwd: root,
    env,
    encoding: 'utf8',
    shell: true,
    timeout: timeoutMs,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  const resolvedAssetMap = materializeAssetMapFromBridge(stdout, assetMapPath) ||
    (fs.existsSync(assetMapPath) ? assetMapPath : '');
  return {
    command,
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: typeof result.status === 'number' ? result.status : null,
    signal: result.signal || '',
    stdout,
    stderr,
    assetMapPath: resolvedAssetMap
  };
}

function summaryForReport(report, paths, root = ROOT) {
  return {
    success: report.status !== 'error',
    status: report.status,
    report: paths.report,
    deckPlan: report.outputs.deckPlan ? path.resolve(root, report.outputs.deckPlan) : undefined,
    prompts: report.outputs.assetPrompts ? path.resolve(root, report.outputs.assetPrompts) : undefined,
    promptCount: report.promptCount || 0,
    nextActions: report.nextActions || []
  };
}

function resolveVisualAssetsFromFiles(opts = {}) {
  const normalizedOpts = Object.assign({
    imagegenCapability: 'unavailable',
    imagegenCommand: process.env.CODEX_IMAGEGEN_COMMAND || '',
    missingAssetAction: 'require_user_input',
    blockedAction: 'require_user_input',
    imagegenTimeoutMs: Number(process.env.CODEX_IMAGEGEN_TIMEOUT_MS || 240000),
    root: ROOT
  }, opts);
  normalizedOpts.imagegenCapability = String(normalizedOpts.imagegenCapability || 'unavailable').toLowerCase();
  normalizedOpts.missingAssetAction = String(normalizedOpts.missingAssetAction || 'require_user_input').toLowerCase();
  normalizedOpts.blockedAction = String(normalizedOpts.blockedAction || 'require_user_input').toLowerCase();
  if (!['available', 'unavailable'].includes(normalizedOpts.imagegenCapability)) {
    throw new Error('imagegenCapability must be available or unavailable');
  }
  if (!['require_user_input', 'auto_generate', 'skip_image'].includes(normalizedOpts.missingAssetAction)) {
    throw new Error('missingAssetAction must be require_user_input, auto_generate, or skip_image');
  }
  if (!['skip_image', 'require_user_input'].includes(normalizedOpts.blockedAction)) {
    throw new Error('blockedAction must be skip_image or require_user_input');
  }

  const root = path.resolve(normalizedOpts.root || ROOT);
  const planPath = path.resolve(normalizedOpts.plan || normalizedOpts.planPath);
  const paths = defaultPaths(Object.assign({}, normalizedOpts, { plan: planPath }));
  fs.mkdirSync(paths.outDir, { recursive: true });

  const initialGate = buildGate(planPath);
  writeJson(paths.gate, initialGate);

  const report = {
    version: 'visual-asset-resolution/v1',
    status: 'started',
    inputPlan: rel(planPath, root),
    imagegenCapability: normalizedOpts.imagegenCapability,
    missingAssetAction: normalizedOpts.missingAssetAction,
    blockedAction: normalizedOpts.blockedAction,
    counts: {
      questionCount: initialGate.questionCount || 0,
      autoGenerate: 0,
      skipImage: 0,
      requireUserInput: 0
    },
    outputs: {
      assetGate: rel(paths.gate, root)
    },
    steps: [],
    nextActions: [],
    policy: {
      generationBeforeRendererFallback: true,
      userChoiceRequiredByDefault: normalizedOpts.missingAssetAction === 'require_user_input',
      noImagegenAction: normalizedOpts.missingAssetAction,
      generatedProofEligibility: 'synthetic-only',
      factualBlockedGeneratedAction: normalizedOpts.blockedAction
    }
  };

  function finish(status, mutate) {
    report.status = status;
    if (typeof mutate === 'function') mutate(report);
    writeJson(paths.report, report);
    return {
      report,
      paths,
      summary: summaryForReport(report, paths, root)
    };
  }

  if (!initialGate.questions || !initialGate.questions.length) {
    writeJson(paths.resolvedPlan, readJson(planPath));
    return finish('ready', r => {
      r.outputs.deckPlan = rel(paths.resolvedPlan, root);
      r.nextActions.push('Render with the resolved deck plan.');
    });
  }

  const auto = buildAutoAnswers(initialGate, normalizedOpts);
  report.counts.autoGenerate = auto.counts.autoGenerate;
  report.counts.skipImage = auto.counts.skipImage;
  report.counts.requireUserInput = auto.counts.requireUserInput;

  if (auto.unresolved.length) {
    return finish('needs_user_input', r => {
      r.unresolved = auto.unresolved;
      r.nextActions.push('Answer the asset decision gate: provide user assets, choose auto_generate for synthetic illustrative visuals, or explicitly rerun with --missing-asset-action skip_image for structure-only pages.');
    });
  }

  writeJson(paths.answers, { decisions: auto.decisions });
  report.outputs.assetAnswers = rel(paths.answers, root);
  const resolvedGate = buildGate(planPath, paths.answers);
  writeJson(paths.resolvedGate, resolvedGate);
  if (resolvedGate.resolvedPlan) writeJson(paths.resolvedPlan, resolvedGate.resolvedPlan);
  report.outputs.assetGateResolved = rel(paths.resolvedGate, root);
  report.outputs.deckPlan = rel(paths.resolvedPlan, root);

  if (resolvedGate.status !== 'ready') {
    return finish('needs_user_input', r => {
      r.unresolved = resolvedGate.questions || [];
      r.nextActions.push('Auto asset resolution left unresolved questions; inspect asset-decision-gate.resolved.json.');
    });
  }

  if (normalizedOpts.assetMap) {
    const bindResult = bindGeneratedAssetsFromFiles({
      planPath: paths.resolvedPlan,
      mapPath: path.resolve(normalizedOpts.assetMap),
      outPath: paths.boundPlan,
      cwd: process.cwd()
    });
    report.steps.push({
      label: 'asset binding',
      command: `bindGeneratedAssetsFromFiles(${rel(paths.resolvedPlan, root)}, ${rel(normalizedOpts.assetMap, root)})`,
      status: bindResult.errors.length ? 'fail' : 'pass',
      stdout: JSON.stringify({ boundSlides: bindResult.boundSlides || 0, errors: bindResult.errors || [] }),
      stderr: ''
    });
    if (bindResult.errors.length) {
      return finish('error', r => {
        r.errors = bindResult.errors;
        r.nextActions.push('Fix the asset mapping paths before rendering.');
      });
    }
    report.outputs.deckPlan = rel(paths.boundPlan, root);
    report.outputs.assetMap = rel(normalizedOpts.assetMap, root);
    report.boundSlides = bindResult.boundSlides || 0;
    const postBindGate = buildGate(paths.boundPlan);
    writeJson(paths.postBindGate, postBindGate);
    report.outputs.assetGatePostBind = rel(paths.postBindGate, root);
    if (postBindGate.status !== 'ready') {
      return finish('needs_image_generation', r => {
        r.unresolved = postBindGate.questions || [];
        r.nextActions.push('Bind all remaining generated/provided assets before rendering.');
      });
    }
    return finish('ready', r => {
      r.nextActions.push('Render with the bound deck plan.');
    });
  }

  if (auto.counts.autoGenerate > 0) {
    const promptPayload = planAssetPromptsFromFile({
      planPath: paths.resolvedPlan,
      outPath: paths.prompts
    });
    report.steps.push({
      label: 'asset prompt planning',
      command: `planAssetPromptsFromFile(${rel(paths.resolvedPlan, root)})`,
      status: promptPayload.blockedCount ? 'fail' : 'pass',
      stdout: JSON.stringify(promptPayload),
      stderr: ''
    });
    report.outputs.assetPrompts = rel(paths.prompts, root);
    if (promptPayload.blockedCount) {
      return finish('error', r => {
        r.nextActions.push('Resolve blocked generated asset prompts before rendering.');
      });
    }
    report.promptCount = promptPayload.promptCount || 0;
    if (report.promptCount > 0) {
      if (normalizedOpts.imagegenCommand) {
        const bridgeRun = runImagegenBridge({
          commandTemplate: normalizedOpts.imagegenCommand,
          promptsPath: paths.prompts,
          assetMapPath: paths.generatedMap,
          assetsDir: paths.generatedAssetsDir,
          outDir: paths.outDir,
          planPath: paths.resolvedPlan,
          root,
          timeoutMs: Number(normalizedOpts.imagegenTimeoutMs || 240000)
        });
        report.steps.push({
          label: 'imagegen bridge',
          command: bridgeRun.command,
          status: bridgeRun.status,
          stdout: bridgeRun.stdout,
          stderr: bridgeRun.stderr
        });
        if (bridgeRun.status !== 'pass') {
          return finish('error', r => {
            r.nextActions.push('Synthetic asset bridge command failed; inspect visual-asset-resolution.json and bridge stderr.');
          });
        }
        if (!bridgeRun.assetMapPath || !fs.existsSync(bridgeRun.assetMapPath)) {
          return finish('error', r => {
            r.nextActions.push('Synthetic asset bridge did not produce an asset mapping JSON.');
          });
        }
        const bindResult = bindGeneratedAssetsFromFiles({
          planPath: paths.resolvedPlan,
          mapPath: bridgeRun.assetMapPath,
          outPath: paths.boundPlan,
          cwd: process.cwd()
        });
        report.steps.push({
          label: 'asset binding',
          command: `bindGeneratedAssetsFromFiles(${rel(paths.resolvedPlan, root)}, ${rel(bridgeRun.assetMapPath, root)})`,
          status: bindResult.errors.length ? 'fail' : 'pass',
          stdout: JSON.stringify({ boundSlides: bindResult.boundSlides || 0, errors: bindResult.errors || [] }),
          stderr: ''
        });
        report.outputs.assetMap = rel(bridgeRun.assetMapPath, root);
        if (bindResult.errors.length) {
          return finish('error', r => {
            r.errors = bindResult.errors;
            r.nextActions.push('Synthetic asset mapping was generated, but binding failed; inspect the asset map and bound paths.');
          });
        }
        report.outputs.deckPlan = rel(paths.boundPlan, root);
        report.boundSlides = bindResult.boundSlides || 0;
        const postBindGate = buildGate(paths.boundPlan);
        writeJson(paths.postBindGate, postBindGate);
        report.outputs.assetGatePostBind = rel(paths.postBindGate, root);
        if (postBindGate.status !== 'ready') {
          return finish('needs_image_generation', r => {
            r.unresolved = postBindGate.questions || [];
            r.nextActions.push('Synthetic asset bridge completed, but some slides still need bound assets or user choices.');
          });
        }
        return finish('ready', r => {
          r.nextActions.push('Synthetic assets were generated and bound automatically; render with the bound deck plan.');
        });
      }
      return finish('needs_image_generation', r => {
        r.nextActions.push('Generate the listed bitmap assets with an imagegen-capable agent, save them locally, then rerun with --asset-map.');
      });
    }
    return finish('ready', r => {
      r.nextActions.push('Render with the resolved deck plan.');
    });
  }

  return finish('ready', r => {
    r.nextActions.push('Render with the resolved deck plan.');
  });
}

module.exports = {
  actionForQuestion,
  buildAutoAnswers,
  decisionReason,
  defaultPaths,
  parseJson,
  rel,
  resolveVisualAssetsFromFiles,
  summaryForReport
};
