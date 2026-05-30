const fs = require('fs');
const zlib = require('zlib');

function pngInfo(p) {
  try {
    const b = fs.readFileSync(p);
    if (b.length >= 24 && b.toString('ascii', 1, 4) === 'PNG') {
      return { w:b.readUInt32BE(16), h:b.readUInt32BE(20), bytes:b.length };
    }
  } catch (_) {}
  return null;
}

function paeth(a, b, c) {
  const pr = a + b - c;
  const pa = Math.abs(pr - a);
  const pb = Math.abs(pr - b);
  const pc = Math.abs(pr - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function pngAnalysis(p) {
  try {
    const b = fs.readFileSync(p);
    if (b.length < 32 || b.toString('ascii', 1, 4) !== 'PNG') return null;
    let off = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0;
    const idat = [];
    while (off < b.length) {
      const len = b.readUInt32BE(off); off += 4;
      const type = b.toString('ascii', off, off + 4); off += 4;
      const data = b.subarray(off, off + len); off += len + 4;
      if (type === 'IHDR') {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        bitDepth = data[8];
        colorType = data[9];
      } else if (type === 'IDAT') {
        idat.push(data);
      } else if (type === 'IEND') break;
    }
    if (!width || !height || bitDepth !== 8 || ![0,2,6].includes(colorType)) return null;
    const channels = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
    const stride = width * channels;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const pixels = Buffer.alloc(width * height * channels);
    let src = 0;
    for (let y = 0; y < height; y++) {
      const filter = raw[src++];
      const row = raw.subarray(src, src + stride);
      src += stride;
      const out = pixels.subarray(y * stride, (y + 1) * stride);
      const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
      for (let x = 0; x < stride; x++) {
        const left = x >= channels ? out[x - channels] : 0;
        const up = prev ? prev[x] : 0;
        const upLeft = prev && x >= channels ? prev[x - channels] : 0;
        let val = row[x];
        if (filter === 1) val = (val + left) & 255;
        else if (filter === 2) val = (val + up) & 255;
        else if (filter === 3) val = (val + Math.floor((left + up) / 2)) & 255;
        else if (filter === 4) val = (val + paeth(left, up, upLeft)) & 255;
        out[x] = val;
      }
    }
    const grid = 8;
    const vals = [];
    let sum = 0, sumSq = 0, count = 0;
    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        let block = 0, blockCount = 0;
        const y0 = Math.floor(gy * height / grid);
        const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * height / grid));
        const x0 = Math.floor(gx * width / grid);
        const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * width / grid));
        for (let y = y0; y < y1; y += Math.max(1, Math.floor((y1 - y0) / 12))) {
          for (let x = x0; x < x1; x += Math.max(1, Math.floor((x1 - x0) / 12))) {
            const i = y * stride + x * channels;
            const lum = channels === 1 ? pixels[i] : (0.2126 * pixels[i] + 0.7152 * pixels[i+1] + 0.0722 * pixels[i+2]);
            block += lum;
            blockCount += 1;
            sum += lum;
            sumSq += lum * lum;
            count += 1;
          }
        }
        vals.push(block / Math.max(1, blockCount));
      }
    }
    const avg = vals.reduce((a,v)=>a+v,0) / vals.length;
    const hash = vals.map(v => v >= avg ? '1' : '0').join('');
    const mean = sum / Math.max(1, count);
    const variance = sumSq / Math.max(1, count) - mean * mean;
    const lumAt = (x, y) => {
      const i = y * stride + x * channels;
      return channels === 1 ? pixels[i] : (0.2126 * pixels[i] + 0.7152 * pixels[i+1] + 0.0722 * pixels[i+2]);
    };
    const cornerSamples = [
      lumAt(0, 0),
      lumAt(Math.max(0, width - 1), 0),
      lumAt(0, Math.max(0, height - 1)),
      lumAt(Math.max(0, width - 1), Math.max(0, height - 1))
    ];
    const bg = cornerSamples.reduce((a,v)=>a+v,0) / cornerSamples.length;
    const contentThreshold = 10;
    let minX = width, minY = height, maxX = -1, maxY = -1, contentSamples = 0, totalSamples = 0;
    const sx = Math.max(1, Math.floor(width / 180));
    const sy = Math.max(1, Math.floor(height / 120));
    for (let y = 0; y < height; y += sy) {
      for (let x = 0; x < width; x += sx) {
        totalSamples += 1;
        if (Math.abs(lumAt(x, y) - bg) <= contentThreshold) continue;
        contentSamples += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    const regionDefs = {
      mainBody: { x:0.052, y:0.17, w:0.89, h:0.72 },
      rightEvidence: { x:0.60, y:0.16, w:0.33, h:0.74 },
      cardGrid: { x:0.07, y:0.24, w:0.86, h:0.58 },
      chartBoard: { x:0.30, y:0.24, w:0.62, h:0.52 },
      footer: { x:0.05, y:0.88, w:0.90, h:0.08 }
    };
    const regionStats = {};
    Object.entries(regionDefs).forEach(([name, region]) => {
      const x0 = Math.max(0, Math.floor(region.x * width));
      const y0 = Math.max(0, Math.floor(region.y * height));
      const x1 = Math.min(width, Math.ceil((region.x + region.w) * width));
      const y1 = Math.min(height, Math.ceil((region.y + region.h) * height));
      let rSum = 0, rSumSq = 0, rCount = 0, nonBg = 0;
      const stepX = Math.max(1, Math.floor((x1 - x0) / 80));
      const stepY = Math.max(1, Math.floor((y1 - y0) / 50));
      for (let y = y0; y < y1; y += stepY) {
        for (let x = x0; x < x1; x += stepX) {
          const lum = lumAt(x, y);
          rSum += lum;
          rSumSq += lum * lum;
          rCount += 1;
          if (Math.abs(lum - bg) > contentThreshold) nonBg += 1;
        }
      }
      const rMean = rSum / Math.max(1, rCount);
      const rVariance = rSumSq / Math.max(1, rCount) - rMean * rMean;
      regionStats[name] = {
        mean: Number(rMean.toFixed(2)),
        stddev: Number(Math.sqrt(Math.max(0, rVariance)).toFixed(2)),
        coverage: Number((nonBg / Math.max(1, rCount)).toFixed(4))
      };
    });
    return {
      w: width,
      h: height,
      bytes: b.length,
      mean: Number(mean.toFixed(2)),
      stddev: Number(Math.sqrt(Math.max(0, variance)).toFixed(2)),
      hash,
      contentCoverage: Number((contentSamples / Math.max(1, totalSamples)).toFixed(4)),
      contentBBox: contentSamples ? {
        x:Number((minX / width).toFixed(4)),
        y:Number((minY / height).toFixed(4)),
        w:Number(((maxX - minX + 1) / width).toFixed(4)),
        h:Number(((maxY - minY + 1) / height).toFixed(4))
      } : null,
      regions: regionStats
    };
  } catch (_) {
    return null;
  }
}

function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let n = 0;
  for (let i=0; i<a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

function bboxDelta(a = null, b = null) {
  if (!a || !b) return null;
  return Number((Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.w - b.w) + Math.abs(a.h - b.h)).toFixed(4));
}

module.exports = {
  bboxDelta,
  hamming,
  pngAnalysis,
  pngInfo
};
