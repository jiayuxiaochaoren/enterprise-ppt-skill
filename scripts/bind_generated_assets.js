#!/usr/bin/env node
/* Bind generated or found image assets back into a deck plan.
   Mapping JSON shape:
   {
     "1": "assets/generated/cover.png",
     "4": "assets/generated/gallery.png",
     "5": {
       "path": "assets/found/scene.jpg",
       "type": "found-image",
       "role": "showcase",
       "source": "Unsplash",
       "url": "https://unsplash.com/...",
       "note": "Use as generic mood/scene visual, not factual proof."
     },
     "8": {
       "images": [
         { "path": "assets/found/gallery-1.jpg", "role": "gallery" },
         { "path": "assets/found/gallery-2.jpg", "role": "gallery" }
       ]
     }
   }
*/
const path = require('path');
const { bindGeneratedAssetsFromFiles } = require('./assets/binder');

function usage() {
  console.error('Usage: node scripts/bind_generated_assets.js <deck-plan.json> <mapping.json> <out-plan.json>');
  process.exit(2);
}

function runCli(argv = process.argv.slice(2)) {
  const [planArg, mapArg, outArg] = argv;
  if (!planArg || !mapArg || !outArg) usage();
  const planPath = path.resolve(planArg);
  const mapPath = path.resolve(mapArg);
  const outPath = path.resolve(outArg);
  const result = bindGeneratedAssetsFromFiles({
    planPath,
    mapPath,
    outPath,
    cwd: process.cwd()
  });
  const payload = {
    success: result.errors.length === 0,
    input: planPath,
    mapping: mapPath,
    output: outPath,
    boundSlides: result.boundSlides || 0,
    errors: result.errors || []
  };
  const json = JSON.stringify(payload, null, 2);
  if (result.errors.length) {
    console.error(json);
    process.exit(1);
  }
  console.log(json);
}

if (require.main === module) {
  runCli();
} else {
  module.exports = require('./assets/binder');
  module.exports.runCli = runCli;
}
