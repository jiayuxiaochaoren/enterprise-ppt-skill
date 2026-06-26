const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function applePath(p) {
  return String(p).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function commandExists(cmd) {
  if (!cmd) return '';
  if (cmd.includes(path.sep) && fs.existsSync(cmd)) return cmd;
  const res = cp.spawnSync(process.platform === 'win32' ? 'where' : 'command', process.platform === 'win32' ? [cmd] : ['-v', cmd], {
    encoding: 'utf8',
    shell: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const found = String(res.stdout || '').split(/\r?\n/).map(s => s.trim()).find(Boolean);
  return res.status === 0 && found ? found : '';
}

function firstCommand(candidates = []) {
  for (const candidate of candidates.filter(Boolean)) {
    const found = commandExists(candidate);
    if (found) return found;
  }
  return '';
}

function numericEnv(env = {}, key, fallback) {
  const value = Number(env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch (_) {
    const end = Date.now() + ms;
    while (Date.now() < end) {}
  }
}

function transientKeynoteError(detail = '') {
  return /Connection Invalid|Connection invalid|cannot get application|不能获得|Application isn't running|-1728/i.test(String(detail));
}

function previewFilesInDir(dir) {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(x => /\.png$/i.test(x)).sort().map(x => path.join(dir, x))
    : [];
}

function keynoteAutomationStatus(env = process.env, opts = {}) {
  const keynoteApp = '/Applications/Keynote.app';
  if (env.PPTX_DISABLE_KEYNOTE_PREVIEW === '1') {
    return { available:false, app:'', detail:'PPTX_DISABLE_KEYNOTE_PREVIEW=1' };
  }
  if (process.platform !== 'darwin' || !fs.existsSync(keynoteApp)) {
    return { available:false, app:'', detail:'Keynote.app is not installed' };
  }
  const attempts = Math.max(1, Math.floor(opts.attempts || numericEnv(env, 'PPTX_KEYNOTE_PROBE_ATTEMPTS', 2)));
  const delayMs = Math.max(0, Math.floor(opts.delayMs || numericEnv(env, 'PPTX_KEYNOTE_RETRY_DELAY_MS', 400)));
  let detail = '';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = cp.spawnSync('osascript', ['-e', 'tell application "Keynote" to count documents'], {
      encoding:'utf8',
      stdio:['ignore', 'pipe', 'pipe'],
      timeout:10000
    });
    if (res.status === 0) return { available:true, app:keynoteApp, detail:'' };
    detail = String(res.stderr || res.stdout || '').trim() || `osascript exited with ${res.status}`;
    if (attempt < attempts && transientKeynoteError(detail)) sleepSync(delayMs);
    else break;
  }
  return { available:false, app:keynoteApp, detail:`Keynote automation unavailable: ${detail}` };
}

function keynoteExportScript({ file, previewDir }) {
  return [
    'tell application "Keynote"',
    `  set theDoc to open POSIX file "${applePath(file)}"`,
    `  export theDoc to POSIX file "${applePath(previewDir)}" as slide images`,
    '  close theDoc saving no',
    'end tell',
    ''
  ].join('\n');
}

function detectPreviewProviders(env = process.env) {
  const keynote = keynoteAutomationStatus(env);
  const libreoffice = firstCommand([env.LIBREOFFICE_BIN, env.SOFFICE_BIN, 'soffice', 'libreoffice']);
  const pdftoppm = firstCommand([env.PDFTOPPM_BIN, 'pdftoppm']);
  const quicklook = env.PPTX_DISABLE_QUICKLOOK_PREVIEW === '1' || process.platform !== 'darwin'
    ? ''
    : firstCommand([env.QLMANAGE_BIN, 'qlmanage']);
  return {
    keynote: keynote.available ? keynote.app : '',
    keynoteDetail: keynote.detail || '',
    libreoffice,
    pdftoppm,
    quicklook,
    preferredProvider: keynote.available
      ? 'keynote'
      : (libreoffice && pdftoppm ? 'libreoffice' : (quicklook ? 'quicklook' : 'metadata_fallback'))
  };
}

function exportKeynotePreviews({ file, previewDir, run, env = process.env }) {
  const keynote = keynoteAutomationStatus(env);
  if (!keynote.available) return { skipped:true, detail:keynote.detail };
  const scriptPath = path.join(previewDir, `.keynote-export-${process.pid}-${Date.now()}.applescript`);
  const attempts = Math.max(1, Math.floor(numericEnv(env, 'PPTX_KEYNOTE_EXPORT_ATTEMPTS', 2)));
  const delayMs = Math.max(0, Math.floor(numericEnv(env, 'PPTX_KEYNOTE_RETRY_DELAY_MS', 400)));
  let detail = '';
  try {
    fs.writeFileSync(scriptPath, keynoteExportScript({ file, previewDir }), 'utf8');
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        run('osascript', [scriptPath], { timeout:90000 });
        detail = '';
        break;
      } catch (e) {
        detail = String(e.message || e);
        if (attempt < attempts && transientKeynoteError(detail)) sleepSync(delayMs);
        else return { failed:true, detail };
      }
    }
  } finally {
    fs.rmSync(scriptPath, { force:true });
  }
  const files = previewFilesInDir(previewDir);
  return files.length ? { provider:'keynote', files } : { failed:true, detail:'Keynote export completed but produced no PNG files' };
}

function exportLibreOfficePreviews({ file, previewDir, run, env = process.env }) {
  if (env.PPTX_DISABLE_LIBREOFFICE_PREVIEW === '1') return { skipped:true, detail:'PPTX_DISABLE_LIBREOFFICE_PREVIEW=1' };
  const office = firstCommand([env.LIBREOFFICE_BIN, env.SOFFICE_BIN, 'soffice', 'libreoffice']);
  if (!office) return { skipped:true, detail:'LibreOffice/soffice not found' };
  const pdftoppm = firstCommand([env.PDFTOPPM_BIN, 'pdftoppm']);
  const tempDir = path.join(previewDir, '.libreoffice');
  fs.rmSync(tempDir, { recursive:true, force:true });
  fs.mkdirSync(tempDir, { recursive:true });
  try {
    cp.execFileSync(office, ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, file], {
      encoding:'utf8',
      stdio:['ignore', 'pipe', 'pipe'],
      timeout:90000
    });
  } catch (e) {
    return { failed:true, detail:`LibreOffice conversion failed: ${String(e.message || e)}` };
  }
  const pdf = fs.readdirSync(tempDir).find(name => /\.pdf$/i.test(name));
  if (!pdf) return { failed:true, detail:'LibreOffice conversion produced no PDF' };
  const pdfPath = path.join(tempDir, pdf);
  if (!pdftoppm) {
    return { provider:'metadata_fallback', files:[], detail:`LibreOffice produced ${path.basename(pdfPath)} but pdftoppm is unavailable for PNG export` };
  }
  try {
    cp.execFileSync(pdftoppm, ['-png', '-r', '144', pdfPath, path.join(tempDir, 'preview')], {
      encoding:'utf8',
      stdio:['ignore', 'pipe', 'pipe'],
      timeout:90000
    });
  } catch (e) {
    return { provider:'metadata_fallback', files:[], detail:`pdftoppm preview export failed: ${String(e.message || e)}` };
  }
  const generated = previewFilesInDir(tempDir);
  generated.forEach((src, i) => {
    fs.copyFileSync(src, path.join(previewDir, `preview.${String(i + 1).padStart(3, '0')}.png`));
  });
  const files = previewFilesInDir(previewDir);
  return files.length ? { provider:'libreoffice', files, detail:`LibreOffice via ${path.basename(office)}` } : { provider:'metadata_fallback', files:[], detail:'LibreOffice/pdftoppm produced no PNG previews' };
}

function exportQuickLookCoverPreview({ file, previewDir, run, env = process.env }) {
  if (env.PPTX_DISABLE_QUICKLOOK_PREVIEW === '1') return { skipped:true, detail:'PPTX_DISABLE_QUICKLOOK_PREVIEW=1' };
  if (process.platform !== 'darwin') return { skipped:true, detail:'Quick Look preview is only available on macOS' };
  const qlmanage = firstCommand([env.QLMANAGE_BIN, 'qlmanage']);
  if (!qlmanage) return { skipped:true, detail:'qlmanage not found' };
  const size = Math.max(320, Math.floor(numericEnv(env, 'PPTX_QUICKLOOK_PREVIEW_SIZE', 1800)));
  let detail = '';
  try {
    run(qlmanage, ['-t', '-s', String(size), '-o', previewDir, file], { timeout:90000 });
  } catch (e) {
    detail = String(e.message || e);
  }
  const generated = previewFilesInDir(previewDir);
  if (!generated.length) return { failed:true, detail:detail || 'Quick Look produced no PNG thumbnail' };
  const newest = generated
    .map(filePath => ({ filePath, mtime:fs.statSync(filePath).mtimeMs, size:fs.statSync(filePath).size }))
    .sort((a, b) => (b.mtime - a.mtime) || (b.size - a.size))[0].filePath;
  const target = path.join(previewDir, 'preview.cover.png');
  if (path.resolve(newest) !== path.resolve(target)) {
    fs.copyFileSync(newest, target);
    generated.forEach(filePath => {
      if (path.resolve(filePath) !== path.resolve(target)) fs.rmSync(filePath, { force:true });
    });
  }
  return {
    provider:'quicklook',
    files:[target],
    detail:'Quick Look cover thumbnail only; full slide previews are unavailable in this environment'
  };
}

function exportPreviews(opts = {}) {
  const { file, previewDir, qualityMode = 'draft', previewOptional = false, env = process.env } = opts;
  const run = opts.run || ((cmd, argv, runOpts = {}) => cp.execFileSync(cmd, argv, Object.assign({ encoding:'utf8' }, runOpts)));
  const state = {
    requested: Boolean(previewDir),
    required: Boolean(previewDir) && qualityMode === 'delivery' && !previewOptional,
    status: previewDir ? 'pending' : 'not_requested',
    provider: previewDir ? 'pending' : 'none',
    error: null,
    detail: null
  };
  if (!previewDir) return { files:[], state };
  fs.mkdirSync(previewDir, { recursive:true });
  previewFilesInDir(previewDir).forEach(filePath => fs.rmSync(filePath, { force:true }));
  const keynote = exportKeynotePreviews({ file, previewDir, run, env });
  if (keynote.files && keynote.files.length) {
    state.status = 'available';
    state.provider = keynote.provider;
    state.detail = keynote.detail || null;
    return { files:keynote.files, state };
  }
  const libre = exportLibreOfficePreviews({ file, previewDir, run, env });
  if (libre.files && libre.files.length) {
    state.status = 'available';
    state.provider = libre.provider;
    state.detail = libre.detail || null;
    return { files:libre.files, state };
  }
  const quicklook = exportQuickLookCoverPreview({ file, previewDir, run, env });
  if (quicklook.files && quicklook.files.length) {
    state.status = 'cover_thumbnail';
    state.provider = quicklook.provider;
    state.detail = quicklook.detail || null;
    return { files:quicklook.files, state };
  }
  const details = [keynote.detail, libre.detail, quicklook.detail].filter(Boolean).join('; ');
  state.status = libre.provider === 'metadata_fallback' ? 'metadata_fallback' : 'unavailable';
  state.provider = libre.provider === 'metadata_fallback' ? 'metadata_fallback' : 'unavailable';
  state.error = 'visual_preview_unavailable';
  state.detail = details || 'No preview provider could export PNG files';
  return { files:[], state };
}

module.exports = {
  commandExists,
  detectPreviewProviders,
  exportQuickLookCoverPreview,
  exportPreviews,
  firstCommand,
  keynoteAutomationStatus,
  keynoteExportScript,
  previewFilesInDir
};
