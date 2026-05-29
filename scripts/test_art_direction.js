const assert = require('assert/strict');
const {
  compositionAudit,
  makeDeckContext,
  normalizeDeckPlan,
  selectPaletteName,
  semanticColorRolesFor
} = require('./design-system');
const { compileDeckPlan } = require('./material_pipeline');

const artDirection = {
  tone: 'premium-industrial-editorial',
  palette: 'factory-steel-amber',
  semantic_color_roles: {
    brand: 'steel-blue',
    evidence: 'inspection-green',
    risk: 'safety-red',
    action: 'safety-orange',
    data: 'amber-readout',
    neutral: 'steel-paper'
  },
  layout_diversity_rules: ['risk page must not reuse generic card grid'],
  rhythm_map: [
    { slideId: 'risk-claim', themeIntent: 'risk-warning', accentRole: 'risk', backgroundTone: 'accent-wash', layoutEnergy: 'high-contrast' },
    { slideId: 'system-claim', themeIntent: 'system-architecture', accentRole: 'brand', layoutEnergy: 'structured' },
    { slideId: 'metric-claim', themeIntent: 'value-signal', accentRole: 'data', visualDensity: 'metric-led' }
  ]
};

const deck = normalizeDeckPlan({
  industry: 'manufacturing-operations',
  deckArtDirection: artDirection,
  slides: [
    { type: 'cover', title: '制造运维升级方案' },
    {
      id: 'risk-claim',
      type: 'content',
      title: '授权与接口风险需要在试点前收敛',
      cards: [
        { title: '接口口径', body: 'PLC 协议需确认。' },
        { title: '图片授权', body: '现场图需确认外发边界。' }
      ]
    },
    {
      id: 'system-claim',
      type: 'content',
      title: '设备、工单和备件进入同一张数据拓扑',
      layers: [
        { title: '设备层', items: ['PLC', '传感器'] },
        { title: '业务层', items: ['工单', '点检'] }
      ]
    },
    {
      id: 'metric-claim',
      type: 'content',
      title: 'OEE 与 MTTR 共同验证试点价值',
      metrics: [
        { label: 'OEE', value: '78%' },
        { label: 'MTTR', value: '-18%' }
      ]
    },
    { type: 'closing', title: '下一步行动', actions: [{ title: '确认接口' }] }
  ]
});

assert.equal(selectPaletteName(deck), 'factory-steel-amber');
assert.equal(makeDeckContext(deck).paletteName, 'factory-steel-amber');

const risk = deck.slides.find(s => s.id === 'risk-claim');
assert.equal(risk.type, 'risk-table');
assert.equal(risk.themeIntent, 'risk-warning');
assert.equal(risk.accentRole, 'risk');
assert.equal(risk.compositionPlan.backgroundTone, 'accent-wash');
assert.ok(risk.compositionPlan.primaryColorUse.includes('risk-band'));
assert.equal(risk.compositionPlan.semanticColorRoles.activeRole, 'risk');

const system = deck.slides.find(s => s.id === 'system-claim');
assert.equal(system.type, 'architecture');
assert.equal(system.themeIntent, 'system-architecture');
assert.equal(system.layoutEnergy, 'structured');

const metric = deck.slides.find(s => s.id === 'metric-claim');
assert.equal(metric.type, 'metric-comparison');
assert.equal(metric.accentRole, 'data');
assert.equal(metric.visualDensity, 'metric-led');

const roles = semanticColorRolesFor(deck, 'evidence');
assert.equal(roles.activeRole, 'evidence');
assert.equal(roles.evidence, 'inspection-green');

const extraction = {
  version: 'material-extraction/v1',
  document: {
    title: '恒越精工设备运维升级方案',
    ppt_type: 'solution',
    industry: 'manufacturing-operations',
    decision_goal: '确认试点边界'
  },
  deck_art_direction: artDirection,
  facts: [{ id: 'fact-001', text: 'OEE 约为 78%。', source_ids: ['src-001'] }],
  evidence: [{ id: 'ev-001', type: 'metric', title: 'OEE', summary: '试点基线', source_ids: ['src-001'] }],
  claim_spine: [
    {
      id: 'risk-claim',
      narrative_role: 'governance',
      claim: '授权与接口风险需要在试点前收敛',
      support: '现场图授权和 PLC 协议清单需要确认。',
      proof_object: 'risk-matrix',
      source_ids: ['src-001'],
      theme_intent: 'risk-warning',
      accent_role: 'risk',
      bullets: ['现场图授权', 'PLC 协议清单']
    },
    {
      id: 'metric-claim',
      narrative_role: 'proof',
      claim: 'OEE 与 MTTR 共同验证试点价值',
      support: '以 OEE 和 MTTR 作为试点验证口径。',
      proof_object: 'metric-board',
      evidence_ids: ['ev-001'],
      source_ids: ['src-001'],
      theme_intent: 'value-signal',
      accent_role: 'data',
      metrics: [{ label: 'OEE', value: '78%' }, { label: 'MTTR', value: '-18%' }]
    }
  ]
};

const compiled = compileDeckPlan(extraction, { version: 'material-bundle/v1', sources: [], images: [], textSummary: {} });
assert.equal(compiled.deckArtDirection.palette, 'factory-steel-amber');
assert.ok(compiled.slides.some(s => s.themeIntent === 'risk-warning' && s.accentRole === 'risk'));

const weak = {
  slides: [
    { type: 'cover', title: '封面' },
    {
      type: 'content',
      title: '事项一',
      compositionPlan: {
        version: 'composition-plan/v1',
        composition: 'executive-insight-board',
        backgroundTone: 'tinted-paper',
        themeCoverage: 'medium',
        themeIntent: 'executive-narrative',
        accentRole: 'brand',
        primaryColorUse: ['top-rule', 'page-number', 'accent-rail'],
        imageTreatment: 'none',
        microComponents: ['top-rule', 'page-number', 'section-kicker'],
        rhythmRole: 'narrative'
      }
    },
    {
      type: 'content',
      title: '事项二',
      compositionPlan: {
        version: 'composition-plan/v1',
        composition: 'executive-insight-board',
        backgroundTone: 'tinted-paper',
        themeCoverage: 'medium',
        themeIntent: 'executive-narrative',
        accentRole: 'brand',
        primaryColorUse: ['top-rule', 'page-number', 'accent-rail'],
        imageTreatment: 'none',
        microComponents: ['top-rule', 'page-number', 'section-kicker'],
        rhythmRole: 'narrative'
      }
    },
    { type: 'closing', title: '结束' }
  ]
};
assert.ok(
  compositionAudit(weak, weak).some(f => f.type === 'adjacentLayoutSimilarity'),
  'composition audit should catch adjacent pages with the same composition, tone, intent, and carriers'
);

console.log('art direction ok');
