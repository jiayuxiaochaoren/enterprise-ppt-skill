const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const CACHE_DIR = path.join(
  process.env.HERMES_HOME || path.join(os.homedir(), '.hermes'),
  'cache',
  'premium-commercial-ppt-node'
);

function requirePptxGen() {
  try {
    return require('pptxgenjs');
  } catch (_) {
    try {
      return require(path.join(CACHE_DIR, 'node_modules', 'pptxgenjs'));
    } catch (__) {
      console.error('[premium-commercial-ppt] pptxgenjs not found; installing into Hermes cache...');
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      if (!fs.existsSync(path.join(CACHE_DIR, 'package.json'))) {
        cp.execFileSync('npm', ['init', '-y'], { cwd: CACHE_DIR, stdio: 'ignore' });
      }
      cp.execFileSync('npm', ['install', 'pptxgenjs', '--silent'], { cwd: CACHE_DIR, stdio: 'inherit' });
      return require(path.join(CACHE_DIR, 'node_modules', 'pptxgenjs'));
    }
  }
}

module.exports = {
  CACHE_DIR,
  requirePptxGen
};
