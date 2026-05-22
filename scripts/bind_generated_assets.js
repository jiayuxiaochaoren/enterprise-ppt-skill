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
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node scripts/bind_generated_assets.js <deck-plan.json> <mapping.json> <out-plan.json>');
  process.exit(2);
}

const [planArg, mapArg, outArg] = process.argv.slice(2);
if (!planArg || !mapArg || !outArg) usage();

const planPath = path.resolve(planArg);
const mapPath = path.resolve(mapArg);
const outPath = path.resolve(outArg);
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const mapping = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const slides = Array.isArray(plan.slides) ? plan.slides : [];

function normalizeAssetSpec(asset) {
  const spec = typeof asset === 'string' ? { path: asset } : (asset || {});
  if (!spec.path) return null;
  const absoluteAsset = path.isAbsolute(spec.path) ? spec.path : path.resolve(process.cwd(), spec.path);
  const assetPath = path.isAbsolute(spec.path) ? spec.path : path.relative(process.cwd(), absoluteAsset);
  return Object.assign({}, spec, { assetPath });
}

Object.entries(mapping).forEach(([slideNo, asset]) => {
  const idx = Number(slideNo) - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx >= slides.length) return;
  const spec = typeof asset === 'string' ? { path: asset } : (asset || {});
  const slide = slides[idx];
  if (Array.isArray(spec.images) && spec.images.length) {
    const assets = spec.images.map(normalizeAssetSpec).filter(Boolean);
    if (!assets.length) return;
    slide.images = assets.map(item => item.assetPath);
    slide.visual = Object.assign({}, slide.visual || {}, {
      mode: spec.mode || 'hybrid',
      role: spec.role || 'gallery',
      generated: assets.every(item => item.type === 'generated-image' || item.generated === true)
    });
    if (!slide.assetAttribution) slide.assetAttribution = [];
    assets.forEach(item => {
      slide.assetAttribution.push({
        type: item.type || spec.type || 'generated-image',
        path: item.assetPath,
        source: item.source || spec.source || 'Codex imagegen / gpt-image-2 workflow',
        url: item.url || spec.url || undefined,
        license: item.license || spec.license || undefined,
        note: item.note || spec.note || 'Generated asset must not be used as factual proof for named customers, real sites, real employees, real screenshots, or real data.'
      });
    });
    return;
  }
  const single = normalizeAssetSpec(spec);
  if (!single) return;
  slide.visual = Object.assign({}, slide.visual || {}, {
    image: single.assetPath,
    mode: single.mode || (slide.visual && slide.visual.mode === 'photo' ? 'photo' : 'hybrid'),
    role: single.role || (slide.visual && slide.visual.role),
    generated: single.type === 'generated-image' || single.generated === true
  });
  if (!slide.assetAttribution) slide.assetAttribution = [];
  slide.assetAttribution.push({
    type: single.type || 'generated-image',
    path: single.assetPath,
    source: single.source || 'Codex imagegen / gpt-image-2 workflow',
    url: single.url || undefined,
    license: single.license || undefined,
    note: single.note || 'Generated asset must not be used as factual proof for named customers, real sites, real employees, real screenshots, or real data.'
  });
});

fs.mkdirSync(path.dirname(outPath), { recursive:true });
fs.writeFileSync(outPath, JSON.stringify(plan, null, 2));
console.log(JSON.stringify({
  success: true,
  input: planPath,
  mapping: mapPath,
  output: outPath,
  boundSlides: Object.keys(mapping).length
}, null, 2));
