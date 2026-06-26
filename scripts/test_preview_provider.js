const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  detectPreviewProviders,
  exportPreviews,
  keynoteAutomationStatus,
  keynoteExportScript
} = require('./preview/provider');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-preview-provider-'));
const pptx = path.join(dir, 'sample.pptx');
fs.writeFileSync(pptx, 'not a real pptx; provider mock only');

const keynoteScript = keynoteExportScript({
  file: '/tmp/deck "quote".pptx',
  previewDir: '/tmp/preview dir'
});
assert.ok(keynoteScript.includes('export theDoc to POSIX file "/tmp/preview dir" as slide images'));
assert.ok(!keynoteScript.includes('image format:PNG'));
assert.ok(keynoteScript.includes('/tmp/deck \\"quote\\".pptx'));
assert.equal(keynoteAutomationStatus({ PPTX_DISABLE_KEYNOTE_PREVIEW: '1' }).available, false);

const unavailable = exportPreviews({
  file: pptx,
  previewDir: path.join(dir, 'none'),
  qualityMode: 'formal',
  previewOptional: true,
  env: {
    PPTX_DISABLE_KEYNOTE_PREVIEW: '1',
    PPTX_DISABLE_LIBREOFFICE_PREVIEW: '1',
    PPTX_DISABLE_QUICKLOOK_PREVIEW: '1'
  }
});
assert.equal(unavailable.state.status, 'unavailable');
assert.equal(unavailable.state.provider, 'unavailable');

const fakeOffice = path.join(dir, 'fake-soffice');
const fakePdf = path.join(dir, 'fake-pdftoppm');
fs.writeFileSync(fakeOffice, [
  '#!/bin/sh',
  'out=""',
  'while [ "$#" -gt 0 ]; do',
  '  if [ "$1" = "--outdir" ]; then shift; out="$1"; fi',
  '  shift',
  'done',
  'mkdir -p "$out"',
  'printf "%s" "%PDF-1.4" > "$out/mock.pdf"'
].join('\n'), 'utf8');
fs.writeFileSync(fakePdf, [
  '#!/bin/sh',
  'for arg in "$@"; do prefix="$arg"; done',
  'printf "\\211PNG\\015\\012\\032\\012" > "$prefix-1.png"'
].join('\n'), 'utf8');
fs.chmodSync(fakeOffice, 0o755);
fs.chmodSync(fakePdf, 0o755);

const libre = exportPreviews({
  file: pptx,
  previewDir: path.join(dir, 'libre'),
  qualityMode: 'formal',
  previewOptional: true,
  env: {
    PPTX_DISABLE_KEYNOTE_PREVIEW: '1',
    LIBREOFFICE_BIN: fakeOffice,
    PDFTOPPM_BIN: fakePdf
  }
});
assert.equal(libre.state.status, 'available');
assert.equal(libre.state.provider, 'libreoffice');
assert.equal(libre.files.length, 1);

const fakeQl = path.join(dir, 'fake-qlmanage');
fs.writeFileSync(fakeQl, '#!/bin/sh\nexit 0\n', 'utf8');
fs.chmodSync(fakeQl, 0o755);
const quicklook = exportPreviews({
  file: pptx,
  previewDir: path.join(dir, 'quicklook'),
  qualityMode: 'formal',
  previewOptional: true,
  env: {
    PPTX_DISABLE_KEYNOTE_PREVIEW: '1',
    PPTX_DISABLE_LIBREOFFICE_PREVIEW: '1',
    QLMANAGE_BIN: fakeQl
  },
  run: (cmd, argv) => {
    assert.equal(cmd, fakeQl);
    const outDir = argv[argv.indexOf('-o') + 1];
    fs.writeFileSync(path.join(outDir, 'sample.pptx.png'), Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]));
  }
});
assert.equal(quicklook.state.status, process.platform === 'darwin' ? 'cover_thumbnail' : 'unavailable');
if (process.platform === 'darwin') {
  assert.equal(quicklook.state.provider, 'quicklook');
  assert.equal(path.basename(quicklook.files[0]), 'preview.cover.png');
  assert.match(quicklook.state.detail, /cover thumbnail only/);
}

const doctor = detectPreviewProviders({
  PPTX_DISABLE_KEYNOTE_PREVIEW: '1',
  LIBREOFFICE_BIN: fakeOffice,
  PDFTOPPM_BIN: fakePdf
});
assert.equal(doctor.preferredProvider, 'libreoffice');

console.log('preview provider ok');
