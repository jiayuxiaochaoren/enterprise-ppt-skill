function createCompositionAuditHelpers({
  contentSignals = () => ({}),
  normalizeDeckPlan = plan => plan
} = {}) {
  function compositionAudit(plan = {}, normalizedPlan = null) {
    const normalized = normalizedPlan || normalizeDeckPlan(plan);
    const slides = normalized.slides || [];
    const findings = [];
    if (!slides.length) return findings;
    const bodySlides = slides.filter(s => !['cover', 'closing'].includes(s.type || ''));
    const missing = bodySlides.filter(s => !s.compositionPlan || s.compositionPlan.version !== 'composition-plan/v1');
    if (missing.length) {
      findings.push({
        level: 'fail',
        type: 'compositionPlanMissing',
        message: `${missing.length} body slides lack executable compositionPlan`
      });
    }
    let paleRun = 0;
    let longestPaleRun = 0;
    let darkAnchors = 0;
    let generic = 0;
    let thinAccentOnly = 0;
    let roleMismatch = 0;
    slides.forEach((slide, i) => {
      const cp = slide.compositionPlan || {};
      const tone = String(cp.backgroundTone || '');
      const coverage = String(cp.themeCoverage || '');
      const intent = String(cp.themeIntent || slide.themeIntent || '');
      const accentRole = String(cp.accentRole || slide.accentRole || '');
      const colorUse = Array.isArray(cp.primaryColorUse) ? cp.primaryColorUse : [];
      const micro = Array.isArray(cp.microComponents) ? cp.microComponents : [];
      const composition = String(cp.composition || '');
      const signals = contentSignals(normalized, slide, i, slides.length);
      const type = slide.type || '';
      const isAccentAnchor = /accent-wash/i.test(tone) ||
        colorUse.includes('side-color-field') ||
        colorUse.includes('dark-anchor') ||
        micro.includes('rhythm-anchor');
      const isPale = !/dark|stage/i.test(tone) && !isAccentAnchor;
      paleRun = isPale ? paleRun + 1 : 0;
      longestPaleRun = Math.max(longestPaleRun, paleRun);
      if (/dark|stage|anchor/i.test(tone) || colorUse.includes('dark-anchor') || micro.includes('rhythm-anchor')) darkAnchors += 1;
      if (/executive-insight-board|editorial-report-board|capability-matrix-board/.test(composition)) generic += 1;
      const substantialColorUse = colorUse.filter(x =>
        /caption|side-color-field|dark-anchor|metric|sidebar|connector|priority|highlight/i.test(x) ||
        (/rail/i.test(x) && !/accent-rail/i.test(x))
      );
      const substantialMicro = micro.filter(x => /caption|sidebar|metric|process|system|equipment|ruler|tag|contact|anchor/i.test(x));
      if (!['cover', 'closing'].includes(type) && colorUse.length > 0 && substantialColorUse.length === 0 && substantialMicro.length === 0) {
        thinAccentOnly += 1;
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'accentOnlyAsThinLine',
          message: 'primary color appears only as thin decoration; add a caption bar, metric highlight, side field, dark block, or evidence frame'
        });
      }
      if (!['cover', 'closing'].includes(type) && (coverage === 'low' || colorUse.length < 3)) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'themeCoverageLow',
          message: 'slide has too little primary color budget for a finished commercial deck'
        });
      }
      if (!['cover', 'closing'].includes(type) && !micro.some(x => /top-rule|page-number|watermark|caption|rail|sidebar|metric|tag/i.test(x))) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'missingBrandMotif',
          message: 'slide lacks reusable brand motifs such as rule, folio, watermark, caption bar, or rail'
        });
      }
      if (signals.imageCount > 0 && !/caption|frame|showcase|contact|evidence/i.test(String(cp.imageTreatment || ''))) {
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'weakImageTreatment',
          message: 'image material is present but compositionPlan does not turn it into proof/showcase treatment'
        });
      }
      if (/risk-warning/i.test(intent) && accentRole !== 'risk') {
        roleMismatch += 1;
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'semanticColorMismatch',
          message: 'risk-warning slide should use risk accentRole'
        });
      }
      if (/case-evidence/i.test(intent) && accentRole !== 'evidence') {
        roleMismatch += 1;
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'semanticColorMismatch',
          message: 'case-evidence slide should use evidence accentRole'
        });
      }
      if (/value-signal/i.test(intent) && accentRole !== 'data') {
        roleMismatch += 1;
        findings.push({
          slide: i + 1,
          level: 'review',
          type: 'semanticColorMismatch',
          message: 'value-signal slide should use data accentRole'
        });
      }
      if (i > 0) {
        const prev = slides[i - 1] || {};
        const prevCp = prev.compositionPlan || {};
        const prevMicro = Array.isArray(prevCp.microComponents) ? prevCp.microComponents : [];
        const sharedMicro = micro.filter(component => prevMicro.includes(component));
        const sameComposition = String(prevCp.composition || '') === composition;
        const sameTone = String(prevCp.backgroundTone || '') === tone;
        const sameIntent = String(prevCp.themeIntent || prev.themeIntent || '') === intent;
        const sameAccent = String(prevCp.accentRole || prev.accentRole || '') === accentRole;
        if (!['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider'].includes(type) &&
            sameComposition && sameTone && sameIntent && sameAccent && sharedMicro.length >= Math.min(3, micro.length)) {
          findings.push({
            slide: i + 1,
            level: 'review',
            type: 'adjacentLayoutSimilarity',
            message: `slide ${i} and ${i + 1} share composition, tone, theme intent, accent role, and micro-components`
          });
        }
      }
    });
    if (slides.length >= 7 && longestPaleRun >= 4) {
      findings.push({
        level: 'review',
        type: 'tooManyWhitePages',
        message: `deck has ${longestPaleRun} consecutive pale pages; add dark/accent rhythm anchors`
      });
    }
    if (slides.length >= 8 && darkAnchors < 2) {
      findings.push({
        level: 'review',
        type: 'flatPageRhythm',
        message: `deck only has ${darkAnchors} dark/accent rhythm anchors; contact sheet will feel flat`
      });
    }
    if (bodySlides.length >= 6 && generic / bodySlides.length > 0.45) {
      findings.push({
        level: 'review',
        type: 'compositionTooGeneric',
        message: `${generic}/${bodySlides.length} body slides use generic compositions instead of proof-object grammar`
      });
    }
    if (bodySlides.length >= 5 && thinAccentOnly / bodySlides.length > 0.35) {
      findings.push({
        level: 'review',
        type: 'accentOnlyAsThinLine',
        message: `${thinAccentOnly}/${bodySlides.length} body slides use accent only as hairlines or folios; theme coverage needs stronger carriers`
      });
    }
    if (bodySlides.length >= 5 && roleMismatch / bodySlides.length > 0.2) {
      findings.push({
        level: 'review',
        type: 'semanticColorMismatch',
        message: `${roleMismatch}/${bodySlides.length} body slides use a semantic accent role that does not match their theme intent`
      });
    }
    const last = slides[slides.length - 1] || {};
    const lastCp = last.compositionPlan || {};
    const lastColorUse = Array.isArray(lastCp.primaryColorUse) ? lastCp.primaryColorUse : [];
    const lastMicro = Array.isArray(lastCp.microComponents) ? lastCp.microComponents : [];
    const hasClosingAnchor = lastColorUse.includes('dark-anchor') ||
      lastMicro.some(x => /contact-block|back-cover-anchor|dark-sidebar|rhythm-anchor/i.test(x)) ||
      /dark|stage/i.test(String(lastCp.backgroundTone || ''));
    if ((last.type || '') === 'closing' && (String(lastCp.themeCoverage || '') !== 'high' || !hasClosingAnchor)) {
      findings.push({
        slide: slides.length,
        level: 'review',
        type: 'closingLacksWeight',
        message: 'closing slide should carry high theme coverage and a visible back-cover anchor'
      });
    }
    return findings;
  }

  return {
    compositionAudit
  };
}

module.exports = {
  createCompositionAuditHelpers
};
