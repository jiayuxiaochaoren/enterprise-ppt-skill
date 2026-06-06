const {
  canonicalIndustryEvidenceChainForSlide
} = require('../design/industry-evidence-chain');

function createOverlayZoneHelpers(deps = {}) {
  const {
    H,
    W,
    reportBoardNeedsRightOverlayRail,
    z
  } = deps;

  function chainIdForSlide(planOrSlide = {}, maybeSlide = null) {
    const plan = maybeSlide ? planOrSlide : {};
    const s = maybeSlide || planOrSlide || {};
    const chain = canonicalIndustryEvidenceChainForSlide(plan, s);
    return String(chain && chain.stageId !== 'neutral-general' ? chain.chainId : '');
  }

  function defaultSafeOverlayZonesFor(planOrSlide = {}, maybeSlide = null) {
    const plan = maybeSlide ? planOrSlide : {};
    const s = maybeSlide || planOrSlide || {};
    const type = String(s.type || '');
    if (['cover', 'cover-dark'].includes(type)) {
      return {
        'source-note': z('source-note-footer', 0.82, 7.02, 7.80, 0.22, 'safe-overlay')
      };
    }
    if (['closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type)) return {};
    if (type === 'report-board') {
      const rightRail = reportBoardNeedsRightOverlayRail(s);
      const zones = {
        'caption-bar': z('caption-bar-lower-left', 0.86, 6.44, 4.80, 0.36, 'safe-overlay'),
        'hero-image': z('hero-image-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
        'kpi-strip': z('kpi-strip-bottom-band', 0.86, 6.34, 10.30, 0.58, 'safe-overlay'),
        'metric-strip': z('kpi-strip-bottom-band', 0.86, 6.34, 10.30, 0.58, 'safe-overlay'),
        'process-rail': z('process-rail-bottom-left', 0.94, 6.36, 4.48, 0.50, 'safe-overlay'),
        'source-note': z('source-note-footer-right', 8.10, 7.02, 4.20, 0.22, 'safe-overlay'),
        'system-rail': z('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay'),
        'value-chain': z('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay'),
        'value-chain-connector': z('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay')
      };
      if (rightRail) {
        Object.assign(zones, {
          'chart-commentary-panel': z('commentary-right-rail', 8.04, 5.96, 3.72, 0.48, 'safe-overlay'),
          'commentary-panel': z('commentary-right-rail', 8.04, 5.92, 3.72, 0.52, 'safe-overlay'),
          'product-matrix': z('product-matrix-right-rail', 8.04, 4.90, 3.58, 0.64, 'safe-overlay'),
          'proof-gallery': z('proof-gallery-right-rail', 8.04, 5.46, 3.72, 0.80, 'safe-overlay'),
          'risk-register': z('risk-register-right-rail', 8.04, 4.68, 3.72, 1.70, 'safe-overlay')
        });
      }
      return zones;
    }
    const zones = {
      'caption-bar': z('caption-bar-lower-left', 0.86, 6.44, 4.80, 0.36, 'safe-overlay'),
      'chart-commentary-panel': z('commentary-lower-right', 8.22, 5.96, 3.42, 0.50, 'safe-overlay'),
      'commentary-panel': z('commentary-side-pocket', 9.10, 5.70, 2.44, 0.58, 'safe-overlay'),
      'hero-image': z('hero-image-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
      'kpi-strip': z('kpi-strip-bottom-band', 0.86, 6.06, 10.30, 0.66, 'safe-overlay'),
      'metric-strip': z('kpi-strip-bottom-band', 0.86, 6.06, 10.30, 0.66, 'safe-overlay'),
      'process-rail': z('process-rail-bottom-left', 0.94, 6.12, 4.48, 0.54, 'safe-overlay'),
      'product-matrix': z('product-matrix-lower-right', 8.04, 4.90, 3.58, 0.64, 'safe-overlay'),
      'proof-gallery': z('proof-gallery-lower-right', 8.02, 5.50, 3.72, 0.82, 'safe-overlay'),
      'risk-register': z('risk-register-lower-right', 8.04, 4.82, 3.72, 1.68, 'safe-overlay'),
      'source-note': z('source-note-footer-right', 8.10, 7.02, 4.20, 0.22, 'safe-overlay'),
      'system-rail': z('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay'),
      'value-chain': z('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay'),
      'value-chain-connector': z('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay')
    };
    const chainId = chainIdForSlide(plan, s);
    if (chainId === 'industrial-manufacturing') {
      Object.assign(zones, {
        'equipment-nameplate': z('equipment-nameplate-upper-right', 8.06, 1.04, 3.56, 0.70, 'safe-overlay'),
        'inspection-matrix': z('inspection-matrix-lower-right', 8.04, 4.70, 3.72, 1.28, 'safe-overlay'),
        'quality-scorecard': z('quality-scorecard-bottom-band', 0.86, 5.72, 6.70, 0.54, 'safe-overlay'),
        'proof-gallery': z('field-proof-gallery-lower-right', 8.04, 5.96, 3.72, 0.62, 'safe-overlay')
      });
    } else if (chainId === 'finance-investment') {
      Object.assign(zones, {
        'governance-table': z('governance-table-upper-right', 8.04, 3.68, 3.72, 1.20, 'safe-overlay'),
        'risk-register': z('risk-register-lower-right', 8.04, 4.92, 3.72, 1.48, 'safe-overlay'),
        'disclosure-footnote': z('disclosure-footnote-footer-left', 0.86, 7.00, 6.90, 0.24, 'safe-overlay'),
        'source-note': z('source-note-footer-right', 8.10, 7.00, 4.20, 0.24, 'safe-overlay')
      });
    } else if (chainId === 'healthcare-operations') {
      Object.assign(zones, {
        'patient-journey-band': z('patient-journey-band-bottom', 0.86, 6.02, 6.86, 0.62, 'safe-overlay'),
        'service-blueprint-lane': z('service-blueprint-lane-mid', 7.90, 3.82, 3.86, 1.18, 'safe-overlay'),
        'quality-scorecard': z('quality-scorecard-bottom-band', 0.86, 5.72, 6.70, 0.54, 'safe-overlay')
      });
    } else if (chainId === 'saas-technology') {
      Object.assign(zones, {
        'prototype-frame': z('prototype-frame-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
        'workflow-rail': z('workflow-rail-bottom-left', 0.94, 6.12, 5.10, 0.54, 'safe-overlay'),
        'adoption-funnel': z('adoption-funnel-right', 8.04, 3.52, 3.72, 1.52, 'safe-overlay'),
        'permission-audit-tag': z('permission-audit-tag-lower-right', 8.04, 5.14, 3.72, 0.66, 'safe-overlay')
      });
    }
    return zones;
  }

  function energyOccupiedZonesForRenderer(rendererName = '') {
    const base = [z('footer-strip', 0.72, 6.88, 11.10, 0.36, 'native-footer')];
    const map = {
      energyToc: [
        z('title-block', 0.72, 0.66, 5.30, 1.35, 'native-title'),
        z('navigation-path', 0.96, 2.88, 10.34, 1.72, 'native-path'),
        z('media-band', 0, 5.58, W(), 1.28, 'native-visual'),
        z('main-visual-ring', 10.26, 0.28, 2.72, 2.64, 'native-visual')
      ],
      energySituationEditorial: [
        z('left-state-column', 0, 0, 4.82, H(), 'native-text'),
        z('right-demand-column', 5.42, 0.96, 6.18, 5.62, 'native-cards')
      ],
      energyProblemSplit: [
        z('title-block', 0.76, 0.68, 6.18, 1.20, 'native-title'),
        z('transition-band', 0.90, 2.16, 7.24, 0.62, 'native-flow'),
        z('breakpoint-cards', 0.88, 3.10, 7.34, 2.58, 'native-cards'),
        z('right-visual-panel', 8.62, 0.66, 3.62, 5.72, 'native-visual')
      ],
      energyCapabilityLoop: [
        z('title-block', 0.78, 0.70, 6.15, 1.18, 'native-title'),
        z('left-summary-panel', 0.92, 2.12, 3.18, 3.60, 'native-text'),
        z('closed-loop-board', 4.42, 1.98, 7.66, 4.42, 'native-loop')
      ],
      energyArchitecture: [
        z('title-block', 0.78, 0.70, 6.50, 1.18, 'native-title'),
        z('topology-board', 0.78, 2.04, 11.48, 4.26, 'native-architecture'),
        z('data-bus', 1.02, 5.30, 10.56, 0.72, 'native-data-bus')
      ],
      energyDeploymentRadius: [
        z('title-block', 0.78, 0.70, 7.45, 1.18, 'native-title'),
        z('phase-list', 0.88, 2.04, 5.84, 3.52, 'native-process'),
        z('radius-panel', 7.05, 1.78, 4.72, 3.70, 'native-visual'),
        z('media-band', 0, 5.72, W(), 1.00, 'native-visual')
      ],
      energyValueSignal: [
        z('title-block', 0.78, 0.70, 6.45, 1.14, 'native-title'),
        z('primary-outcome-panel', 0.92, 2.08, 4.76, 3.70, 'native-visual'),
        z('value-signal-cards', 6.30, 2.10, 5.38, 3.22, 'native-cards'),
        z('caption-strip', 6.30, 5.68, 5.38, 0.68, 'native-caption')
      ]
    };
    return [...(map[rendererName] || []), ...base];
  }

  function genericOccupiedZonesForSlide(s = {}) {
    const type = String(s.type || '');
    if (['cover', 'cover-dark'].includes(type)) return [z('cover-stage', 0, 0, W(), H(), 'native')];
    if (['toc', 'toc-clean'].includes(type)) return [z('navigation-stage', 0.70, 0.60, 10.50, 6.34, 'native')];
    if (['closing', 'closing-dark'].includes(type)) return [z('closing-stage', 0.70, 0.60, 10.90, 6.34, 'native')];
    if (type === 'timeline' || type === 'timeline-dark') return [z('timeline-main-stage', 0.80, 1.90, 11.20, 4.70, 'native')];
    if (type === 'architecture' || type === 'architecture-dark') return [z('architecture-main-stage', 0.80, 1.92, 11.20, 4.70, 'native')];
    if (type === 'risk-table' || type === 'table') return [z('risk-table-main-stage', 0.82, 1.90, 10.95, 4.78, 'native')];
    if (type === 'portfolio-table') return [
      z('portfolio-summary-panel', 0.92, 2.10, 2.72, 3.94, 'native-summary'),
      z('portfolio-action-table', 4.08, 2.10, 7.64, 3.94, 'native-table'),
      z('portfolio-footer-note', 0.94, 6.34, 8.60, 0.34, 'native-footer-note')
    ];
    if (type === 'report-board') {
      const compactBoard = reportBoardNeedsRightOverlayRail(s);
      return [
        z('report-board-executive-read', 0.92, 2.08, 2.78, 4.16, 'native'),
        z('report-board-evidence-stack', 4.12, 2.08, compactBoard ? 3.54 : 7.46, 4.16, 'native')
      ];
    }
    return [z('primary-content-stage', 0.82, 1.00, 6.95, 4.92, 'native')];
  }

  return {
    defaultSafeOverlayZonesFor,
    energyOccupiedZonesForRenderer,
    genericOccupiedZonesForSlide
  };
}

module.exports = {
  createOverlayZoneHelpers
};
