const fs = require('fs');

function createImageAssetHelpers(visualSystem = {}) {
  function imageDimensions(assetPath) {
    try {
      if (!assetPath || !fs.existsSync(assetPath)) return null;
      const b = fs.readFileSync(assetPath);
      if (b.length >= 24 && b.toString('ascii', 1, 4) === 'PNG') {
        return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), type: 'png' };
      }
      if (b.length >= 10 && b[0] === 0xff && b[1] === 0xd8) {
        let o = 2;
        while (o < b.length) {
          if (b[o] !== 0xff) break;
          const marker = b[o + 1];
          const len = b.readUInt16BE(o + 2);
          if (marker >= 0xc0 && marker <= 0xc3) {
            return { w: b.readUInt16BE(o + 7), h: b.readUInt16BE(o + 5), type: 'jpg' };
          }
          o += 2 + len;
        }
      }
    } catch (_) {}
    return null;
  }

  function scoreImageAsset(assetPath, role = 'evidence') {
    const dims = imageDimensions(assetPath);
    const minimums = (visualSystem.assetIntelligence && visualSystem.assetIntelligence.minDimensions) || {};
    const min = minimums[role] || minimums.evidence || { w: 900, h: 600 };
    const issues = [];
    let score = 100;
    if (!assetPath || !fs.existsSync(assetPath)) {
      return { exists: false, role, score: 0, verdict: 'missing', issues: ['asset not found'] };
    }
    if (!dims) {
      return { exists: true, role, score: 58, verdict: 'unknown', issues: ['dimensions unavailable'] };
    }
    const aspect = dims.w / Math.max(1, dims.h);
    if (dims.w < min.w || dims.h < min.h) {
      issues.push(`below ${role} minimum ${min.w}x${min.h}`);
      score -= 28;
    }
    if (role === 'background' && aspect < 1.35) {
      issues.push('background image is not wide enough');
      score -= 20;
    }
    if (role === 'showcase' && (aspect > 2.4 || aspect < 0.55)) {
      issues.push('showcase aspect ratio may crop subject');
      score -= 12;
    }
    if (role === 'gallery' && dims.w < 800) {
      issues.push('gallery image may look soft');
      score -= 12;
    }
    return {
      exists: true,
      role,
      dimensions: dims,
      aspectRatio: Number(aspect.toFixed(3)),
      score: Math.max(0, score),
      verdict: score >= 78 ? 'pass' : (score >= 58 ? 'review' : 'reject'),
      issues
    };
  }

  function assetRealismProfile(asset = {}, opts = {}) {
    const spec = typeof asset === 'string' ? { path: asset } : Object.assign({}, asset || {});
    const role = String(opts.role || spec.role || 'evidence').toLowerCase();
    const text = [
      spec.path,
      spec.assetPath,
      spec.source,
      spec.type,
      spec.provenanceClass,
      spec.proofEligibility,
      spec.note,
      ...(Array.isArray(spec.tags) ? spec.tags : [])
    ].filter(Boolean).join(' ').toLowerCase();
    const realismSignals = [];
    const risks = [];
    let score = 50;
    if (/user-owned|owned|client-supplied|first-party|用户|自有|客户提供/.test(text)) {
      score += 28;
      realismSignals.push('first-party');
    }
    if (/public-licensed|licensed|wikimedia|unsplash|pexels|stock|官方|授权/.test(text)) {
      score += 16;
      realismSignals.push('licensed');
    }
    if (/photo|photograph|real|actual|screenshot|screen|site|store|restaurant|kitchen|counter|product|scene|门店|餐厅|后厨|柜台|实拍|截图|现场|产品图|菜品|外卖|堂食/.test(text)) {
      score += 18;
      realismSignals.push('real-world-subject');
    }
    if (/generated|imagegen|model-generated|synthetic|illustration|vector|abstract|concept|mockup|placeholder|fallback|插画|抽象|概念|占位/.test(text) || spec.generated === true) {
      score -= 24;
      risks.push('synthetic-or-abstract');
    }
    if (/illustration|vector|flat|svg|cartoon|插画|扁平/.test(text)) {
      score -= 16;
      risks.push('illustration-style');
    }
    if (['cover', 'showcase', 'evidence', 'gallery'].includes(role) && risks.includes('synthetic-or-abstract')) {
      score -= 10;
      risks.push('weak-for-image-led-role');
    }
    if (/factual-proof/.test(text)) score += 10;
    if (/synthetic-only/.test(text)) score -= 16;
    const normalizedScore = Math.max(0, Math.min(100, score));
    return {
      role,
      score: normalizedScore,
      verdict: normalizedScore >= 76 ? 'strong' : (normalizedScore >= 58 ? 'usable' : 'weak'),
      signals: realismSignals,
      risks
    };
  }

  function rankImageAssetCandidates(candidates = [], opts = {}) {
    return (candidates || []).map((candidate, index) => {
      const pathRef = typeof candidate === 'string'
        ? candidate
        : (candidate && (candidate.absoluteAsset || candidate.path || candidate.assetPath));
      const quality = scoreImageAsset(pathRef, opts.role || (candidate && candidate.role) || 'evidence');
      const realism = assetRealismProfile(candidate, opts);
      const score = Math.round((Number(quality.score || 0) * 0.52) + (Number(realism.score || 0) * 0.48));
      return {
        index,
        candidate,
        score,
        quality,
        realism
      };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });
  }

  function imageAspectRatio(assetPath, fallback = 1.5) {
    const dims = imageDimensions(assetPath);
    return dims ? dims.w / Math.max(1, dims.h) : fallback;
  }

  function chooseFourImageLayout(imagePaths = [], opts = {}) {
    const explicit = opts.layout || opts.imageLayout || opts.catalogLayout;
    if (explicit === 'grid-2x2' || explicit === 'mosaic-1-3') return explicit;
    const existing = imagePaths.filter(p => p && fs.existsSync(p));
    if (!existing.length) return opts.role === 'product' ? 'mosaic-1-3' : 'grid-2x2';
    const aspects = existing.map(p => imageAspectRatio(p)).filter(Number.isFinite);
    const first = aspects[0] || 1.5;
    const spread = aspects.length ? Math.max(...aspects) - Math.min(...aspects) : 0;
    if (opts.featured || opts.preferHero || first >= 1.85 || spread >= 0.55) return 'mosaic-1-3';
    return 'grid-2x2';
  }

  function imageQualityProfile(assetPath) {
    const dims = imageDimensions(assetPath);
    if (!dims) return { exists: Boolean(assetPath && fs.existsSync(assetPath)), category: 'unknown', score: 50 };
    const aspect = dims.w / Math.max(1, dims.h);
    const pixels = dims.w * dims.h;
    const flags = [];
    if (aspect >= 2.2) flags.push('panoramic');
    if (aspect <= 0.72) flags.push('vertical');
    if (pixels < 500000) flags.push('low-res');
    if (dims.type === 'png' && aspect >= 1.15 && aspect <= 1.9) flags.push('screenshot-like');
    const category = flags.includes('vertical') ? 'vertical' :
      (flags.includes('panoramic') ? 'panoramic' :
        (flags.includes('screenshot-like') ? 'screenshot' : 'photo'));
    let score = 100;
    if (flags.includes('low-res')) score -= 28;
    if (aspect > 3.2 || aspect < 0.42) score -= 14;
    return {
      exists: true,
      dimensions: dims,
      aspectRatio: Number(aspect.toFixed(3)),
      pixels,
      category,
      flags,
      score: Math.max(0, score)
    };
  }

  function chooseEvidenceImageLayout(imagePaths = [], opts = {}) {
    const explicit = opts.layout || opts.imageLayout || opts.galleryLayout;
    const allowed = ['grid-2x2', 'mosaic-1-3', 'vertical-strip', 'screenshot-board', 'evidence-contact-sheet'];
    if (allowed.includes(explicit)) return explicit;
    const existing = imagePaths.filter(p => p && fs.existsSync(p));
    const profiles = existing.map(imageQualityProfile);
    if (existing.length >= 5) return 'evidence-contact-sheet';
    if (existing.length === 4) {
      const verticals = profiles.filter(p => p.category === 'vertical').length;
      const screenshots = profiles.filter(p => p.category === 'screenshot').length;
      const panoramas = profiles.filter(p => p.category === 'panoramic').length;
      const aspects = profiles.map(p => p.aspectRatio).filter(Number.isFinite);
      const spread = aspects.length ? Math.max(...aspects) - Math.min(...aspects) : 0;
      if (verticals >= 2) return 'vertical-strip';
      if (screenshots >= 3) return 'screenshot-board';
      if (panoramas >= 1 || spread >= 0.75 || opts.featured || opts.preferHero) return 'mosaic-1-3';
      return chooseFourImageLayout(existing, opts);
    }
    if (existing.length === 3 && profiles.some(p => p.category === 'panoramic' || p.category === 'vertical')) return 'mosaic-1-3';
    return chooseFourImageLayout(existing, opts);
  }

  return {
    assetRealismProfile,
    chooseEvidenceImageLayout,
    chooseFourImageLayout,
    imageAspectRatio,
    imageDimensions,
    imageQualityProfile,
    rankImageAssetCandidates,
    scoreImageAsset
  };
}

module.exports = {
  createImageAssetHelpers
};
