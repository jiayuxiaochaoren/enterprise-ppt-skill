const assert = require('assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  assetRealismProfile,
  chooseEvidenceImageLayout,
  chooseFourImageLayout,
  imageQualityProfile,
  rankImageAssetCandidates
} = require('./design-system');

const media = name => path.resolve(__dirname, '..', 'assets', 'media', name);

const balanced = [
  media('manufacturing-cover.jpg'),
  media('manufacturing-modern-line.jpg'),
  media('energy-storage-cover.jpg'),
  media('energy-storage-detail.jpg')
];

const panoramicLead = [
  media('manufacturing-modern-band.jpg'),
  media('manufacturing-cover.jpg'),
  media('manufacturing-modern-detail.jpg'),
  media('energy-storage-detail.jpg')
];

assert.equal(
  chooseFourImageLayout(balanced, { role:'evidence' }),
  'grid-2x2',
  'balanced landscape evidence images should use 2x2'
);

assert.equal(
  chooseFourImageLayout(panoramicLead, { role:'evidence' }),
  'mosaic-1-3',
  'panoramic or distinctive lead image should use 1+3 mosaic'
);

assert.equal(
  chooseFourImageLayout(balanced, { role:'product', layout:'mosaic-1-3' }),
  'mosaic-1-3',
  'explicit layout override should win'
);

assert.equal(
  chooseFourImageLayout([], { role:'product' }),
  'mosaic-1-3',
  'four product items without image proof should avoid centered 3+1 grids'
);

assert.equal(
  chooseFourImageLayout([], { role:'evidence' }),
  'grid-2x2',
  'four generic evidence slots without aspect data should stay balanced'
);

function fakePng(file, w, h) {
  const b = Buffer.alloc(24);
  b.writeUInt8(0x89, 0);
  b.write('PNG', 1, 'ascii');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  fs.writeFileSync(file, b);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-image-layout-'));
const verticals = ['v1.png', 'v2.png', 'v3.png', 'v4.png'].map((name, i) => {
  const file = path.join(dir, name);
  fakePng(file, i < 2 ? 640 : 1200, i < 2 ? 1100 : 800);
  return file;
});
const screenshots = ['s1.png', 's2.png', 's3.png', 's4.png'].map(name => {
  const file = path.join(dir, name);
  fakePng(file, 1440, 900);
  return file;
});

assert.equal(
  imageQualityProfile(verticals[0]).category,
  'vertical',
  'image profile should detect vertical dirty evidence'
);

assert.equal(
  chooseEvidenceImageLayout(verticals, { role:'evidence' }),
  'vertical-strip',
  'mixed vertical evidence should use stable vertical strips'
);

assert.equal(
  chooseEvidenceImageLayout(screenshots, { role:'evidence' }),
  'screenshot-board',
  'screenshot-like evidence should use screenshot board rhythm'
);

const realRestaurant = path.join(dir, 'restaurant-real-photo.png');
const generatedIllustration = path.join(dir, 'restaurant-generated-illustration.png');
fakePng(realRestaurant, 1800, 1200);
fakePng(generatedIllustration, 1800, 1200);
const ranked = rankImageAssetCandidates([
  {
    path: generatedIllustration,
    type: 'generated-image',
    source: 'model generated abstract restaurant illustration',
    generated: true,
    role: 'cover'
  },
  {
    path: realRestaurant,
    type: 'user-owned',
    source: 'user provided real restaurant counter photo',
    proofEligibility: 'factual-proof',
    role: 'cover'
  }
], { role:'cover' });
assert.equal(ranked[0].candidate.path, realRestaurant, 'real industry photo should outrank generated illustration for cover slots');
assert.equal(assetRealismProfile(ranked[0].candidate, { role:'cover' }).verdict, 'strong');

console.log('image layout strategy ok');
