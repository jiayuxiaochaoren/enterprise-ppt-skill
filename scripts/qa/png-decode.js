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

function decodePngPixels(p) {
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
    return { width, height, bytes:b.length, channels, stride, pixels };
  } catch (_) {
    return null;
  }
}

module.exports = {
  decodePngPixels,
  pngInfo
};
