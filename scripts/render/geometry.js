function zone(id, x, y, w, h, role = 'native') {
  return { id, x:Number(x), y:Number(y), w:Number(w), h:Number(h), role };
}

function zoneBounds(z = {}) {
  return {
    x:Number(z.x || 0),
    y:Number(z.y || 0),
    w:Number(z.w || 0),
    h:Number(z.h || 0)
  };
}

function zonesIntersect(a = {}, b = {}, pad = 0.015) {
  const ra = zoneBounds(a);
  const rb = zoneBounds(b);
  return Math.max(ra.x, rb.x) < Math.min(ra.x + ra.w, rb.x + rb.w) - pad &&
    Math.max(ra.y, rb.y) < Math.min(ra.y + ra.h, rb.y + rb.h) - pad;
}

module.exports = {
  zone,
  zoneBounds,
  zonesIntersect
};
