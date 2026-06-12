#!/usr/bin/env node
const { detectPreviewProviders } = require('./preview/provider');

const providers = detectPreviewProviders();
console.log(JSON.stringify({
  version: 'preview-doctor/v1',
  success: true,
  providers,
  nextActions: providers.preferredProvider === 'metadata_fallback'
    ? ['Install Keynote on macOS or LibreOffice + pdftoppm for screenshot-level preview QA.']
    : []
}, null, 2));
