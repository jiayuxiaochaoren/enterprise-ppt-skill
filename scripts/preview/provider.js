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

function previewFilesInDir(dir) {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(x => /\.png$/i.test(x)).sort().map(x => path.join(dir, x))
    : [];
}

function detectPreviewProviders(env = process.env) {
  const keynote = process.platform === 'darwin' && fs.existsSync('/Applications/Keynote.app') && env.PPTX_DISABLE_KEYNOTE_PREVIEW !== '1';
  const libreoffice = firstCommand([env.LIBREOFFICE_BIN, env.SOFFICE_BIN, 'soffice', 'libreoffice']);
  const pdftoppm = firstCommand([env.PDFTOPPM_BIN, 'pdftoppm']);
  return {
    keynote: keynote ? '/Applications/Keynote.app' : '',
    libreoffice,
    pdftoppm,
    preferredProvider: keynote ? 'keynote' : (libreoffice && pdftoppm ? 'libreoffice' : 'metadata_fallback')
  };
}

function exportKeynotePreviews({ file, previewDir, run, env = process.env }) {
  const keynoteApp = '/Applications/Keynote.app';
  if (env.PPTX_DISABLE_KEYNOTE_PREVIEW === '1') return { skipped:true, detail:'PPTX_DISABLE_KEYNOTE_PREVIEW=1' };
  if (process.platform !== 'darwin' || !fs.existsSync(keynoteApp)) return { skipped:true, detail:'Keynote.app is not installed' };
  try {
    run('osascript', [
      '-e', 'tell application "Keynote"',
      '-e', `set theDoc to open POSIX file "${applePath(file)}"`,
      '-e', `export theDoc to POSIX file "${applePath(previewDir)}" as slide images with properties {image format:PNG}`,
      '-e', 'close theDoc saving no',
      '-e', 'end tell'
    ], { timeout:90000 });
  } catch (e) {
    return { failed:true, detail:String(e.message || e) };
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
  const details = [keynote.detail, libre.detail].filter(Boolean).join('; ');
  state.status = libre.provider === 'metadata_fallback' ? 'metadata_fallback' : 'unavailable';
  state.provider = libre.provider === 'metadata_fallback' ? 'metadata_fallback' : 'unavailable';
  state.error = 'visual_preview_unavailable';
  state.detail = details || 'No preview provider could export PNG files';
  return { files:[], state };
}

module.exports = {
  commandExists,
  detectPreviewProviders,
  exportPreviews,
  firstCommand,
  previewFilesInDir
};
