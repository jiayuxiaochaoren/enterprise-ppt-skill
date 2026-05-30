const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { detectPreviewProviders, exportPreviews } = require('./preview/provider');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-preview-provider-'));
const pptx = path.join(dir, 'sample.pptx');
fs.writeFileSync(pptx, 'not a real pptx; provider mock only');

const unavailable = exportPreviews({
  file: pptx,
  previewDir: path.join(dir, 'none'),
  qualityMode: 'formal',
  previewOptional: true,
  env: {
    PPTX_DISABLE_KEYNOTE_PREVIEW: '1',
    PPTX_DISABLE_LIBREOFFICE_PREVIEW: '1'
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

const doctor = detectPreviewProviders({
  PPTX_DISABLE_KEYNOTE_PREVIEW: '1',
  LIBREOFFICE_BIN: fakeOffice,
  PDFTOPPM_BIN: fakePdf
});
assert.equal(doctor.preferredProvider, 'libreoffice');

console.log('preview provider ok');
