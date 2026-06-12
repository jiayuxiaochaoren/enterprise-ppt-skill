const os = require('os');
const path = require('path');
const cp = require('child_process');

function decodeXmlEntities(s = '') {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlTextValues(xml = '') {
  return [...String(xml).matchAll(/<[^:>]*:?t\b[^>]*>([\s\S]*?)<\/[^:>]*:?t>/g)]
    .map(m => decodeXmlEntities(m[1].replace(/<[^>]+>/g, '')))
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function unzipList(file) {
  try {
    return cp.execFileSync('unzip', ['-Z1', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function unzipEntry(file, entry) {
  try {
    return cp.execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });
  } catch (_) {
    return '';
  }
}

function extractOfficeText(file) {
  const ext = path.extname(file).toLowerCase();
  const entries = unzipList(file);
  if (!entries.length) return {
    text: '',
    method: 'office-unzip-missing',
    diagnostics: {
      format: ext.slice(1),
      selectedEntryCount: 0,
      textEntryCount: 0,
      tableLikeEntryCount: 0,
      imageEntryCount: 0,
      possibleOcrMissing: false
    }
  };
  let selected = [];
  if (ext === '.pptx') selected = entries.filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e)).sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  else if (ext === '.docx') selected = entries.filter(e => e === 'word/document.xml' || /^word\/header\d+\.xml$/.test(e) || /^word\/footer\d+\.xml$/.test(e));
  else if (ext === '.xlsx') selected = entries.filter(e => e === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(e));
  const parts = selected.map(entry => xmlTextValues(unzipEntry(file, entry)).join('\n')).filter(Boolean);
  const imageEntryCount = entries.filter(e => /\/media\/.+\.(png|jpe?g|gif|webp)$/i.test(e)).length;
  const tableLikeEntryCount = entries.filter(e => /(?:tables?|worksheets?)\//i.test(e) || /sheet\d+\.xml$/i.test(e)).length;
  return {
    text: parts.join('\n\n'),
    method: `office-${ext.slice(1)}`,
    diagnostics: {
      format: ext.slice(1),
      selectedEntryCount: selected.length,
      textEntryCount: parts.length,
      tableLikeEntryCount,
      imageEntryCount,
      possibleOcrMissing: false
    }
  };
}

function extractPdfText(file) {
  try {
    const text = cp.execFileSync('pdftotext', [file, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 });
    return {
      text,
      method: 'pdftotext',
      diagnostics: {
        format: 'pdf',
        textCharCount: text.length,
        possibleOcrMissing: text.trim().length < 32,
        ocrStatus: text.trim().length < 32 ? 'recommended' : 'not_needed'
      }
    };
  } catch (_) {
    const pythonCandidates = [
      process.env.PYTHON,
      process.env.PYTHON3,
      path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),
      'python3',
      'python'
    ].filter(Boolean);
    const code = [
      'import sys',
      'from pypdf import PdfReader',
      'reader = PdfReader(sys.argv[1])',
      'parts = []',
      'for i, page in enumerate(reader.pages):',
      '    text = page.extract_text() or ""',
      '    if text.strip():',
      '        parts.append(f"--- PDF Page {i + 1} ---\\n{text}")',
      'sys.stdout.write("\\n\\n".join(parts))'
    ].join('\n');
    for (const python of pythonCandidates) {
      try {
        const text = cp.execFileSync(python, ['-c', code, file], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          maxBuffer: 1024 * 1024 * 64
        });
        if (String(text || '').trim()) return {
          text,
          method: 'pypdf',
          diagnostics: {
            format: 'pdf',
            textCharCount: text.length,
            possibleOcrMissing: text.trim().length < 32,
            ocrStatus: text.trim().length < 32 ? 'recommended' : 'not_needed'
          }
        };
      } catch (_) {
        // Try the next Python candidate.
      }
    }
    return {
      text: '',
      method: 'pdf-unsupported',
      diagnostics: {
        format: 'pdf',
        textCharCount: 0,
        possibleOcrMissing: true,
        ocrStatus: 'recommended'
      }
    };
  }
}

module.exports = {
  extractOfficeText,
  extractPdfText
};
