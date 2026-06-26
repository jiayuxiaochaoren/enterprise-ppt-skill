#!/usr/bin/env node
const { detectPreviewProviders } = require('./preview/provider');

const providers = detectPreviewProviders();
const fullPreviewAvailable = providers.preferredProvider === 'keynote' || providers.preferredProvider === 'libreoffice';
console.log(JSON.stringify({
  version: 'preview-doctor/v1',
  success: true,
  providers,
  nextActions: fullPreviewAvailable
    ? []
    : [providers.preferredProvider === 'quicklook'
      ? 'Quick Look can generate only a cover thumbnail; install Keynote or LibreOffice + pdftoppm for screenshot-level slide previews.'
      : 'Install Keynote on macOS or LibreOffice + pdftoppm for screenshot-level preview QA.']
}, null, 2));
