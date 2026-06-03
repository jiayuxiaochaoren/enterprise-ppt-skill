const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function usage() {
  console.error('Usage: node scripts/visual_qa.js <file.pptx> [--preview-dir dir] [--baseline manifest.json] [--plan deck-plan.json] [--quality-mode draft|formal|delivery] [--json]');
  process.exit(2);
}

function normalizeQualityMode(value = '') {
  const mode = String(value || '').trim().toLowerCase().replace(/_/g, '-');
  if (mode === 'formal-review') return 'formal';
  if (['draft', 'formal', 'delivery'].includes(mode)) return mode;
  return '';
}

function parseVisualQaArgs(args = []) {
  if (!args[0]) return { usage:true };
  let fileArg = '';
  let previewDir = '';
  let baselinePath = '';
  let planPath = '';
  let jsonOnly = false;
  let qualityMode = 'draft';
  for (let i=0; i<args.length; i++) {
    if (args[i] === '--preview-dir') previewDir = path.resolve(String(args[++i] || ''));
    else if (args[i] === '--baseline') baselinePath = path.resolve(String(args[++i] || ''));
    else if (args[i] === '--plan') planPath = path.resolve(String(args[++i] || ''));
    else if (args[i] === '--quality-mode') {
      qualityMode = normalizeQualityMode(args[++i]);
      if (!qualityMode) return { usage:true };
    }
    else if (args[i] === '--json') jsonOnly = true;
    else if (!fileArg) fileArg = args[i];
    else return { usage:true };
  }
  if (!fileArg) return { usage:true };
  return {
    baselinePath,
    file: path.resolve(fileArg),
    jsonOnly,
    planPath,
    previewDir,
    qualityMode,
    usage:false
  };
}

function run(cmd, argv) {
  return cp.execFileSync(cmd, argv, { encoding:'utf8' });
}

function pptxInput(file) {
  if (!fs.existsSync(file)) return { ok:false, error:'file_not_found', entries:[], unzipText:() => '' };
  try {
    run('unzip', ['-t', file]);
    const entries = run('unzip', ['-Z1', file]).split(/\r?\n/).filter(Boolean);
    return {
      ok:true,
      entries,
      unzipText(entry) {
        try { return run('unzip', ['-p', file, entry]); } catch (_) { return ''; }
      }
    };
  } catch (_) {
    return { ok:false, error:'invalid_pptx_zip', entries:[], unzipText:() => '' };
  }
}

function failResult(file, error) {
  console.error(JSON.stringify({ success:false, error, file }, null, 2));
  process.exit(1);
}

function readRenderMeta(pptxFile) {
  const candidates = [
    `${pptxFile}.render-meta.json`,
    path.join(path.dirname(pptxFile), `${path.basename(pptxFile, '.pptx')}.render-meta.json`)
  ];
  const metaFile = candidates.find(p => fs.existsSync(p));
  if (!metaFile) return { file:'', meta:null };
  try {
    return { file: metaFile, meta:JSON.parse(fs.readFileSync(metaFile, 'utf8')) };
  } catch (e) {
    return { file: metaFile, meta:null, error:String(e.message || e) };
  }
}

module.exports = {
  failResult,
  normalizeQualityMode,
  parseVisualQaArgs,
  pptxInput,
  readRenderMeta,
  usage
};
