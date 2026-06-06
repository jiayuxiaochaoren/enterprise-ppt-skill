const {
  extractionSchema
} = require('./extraction-schema');

function sourceAuditSchema() {
  return {
    version: 'material-source-audit/v1',
    source_inventory: [
      {
        source_id: 'src-001',
        source_name: 'file name',
        source_role: 'primary-fact-source | visual-source | previous-deck-or-derived-material | low-confidence',
        usable_facts: ['facts that can be quoted or paraphrased'],
        contaminated_or_secondary_notes: ['previous deck wording, production notes, model/test language, or derived commentary'],
        visual_assets: [{ source_id: 'src-002', role: 'showcase | evidence | gallery | background', why_it_matters: 'what this image proves' }],
        rights_risks: ['authorization or public-use risk'],
        extraction_confidence: 0.85
      }
    ],
    source_priority: ['src-001'],
    global_risks: ['facts or assets that need confirmation'],
    missing_inputs: ['inputs required before external delivery'],
    recommended_next_focus: ['what the next model pass should pay attention to']
  };
}

function storyArchitectureSchema() {
  return {
    version: 'material-story-architecture/v1',
    ppt_type: 'company-intro | solution | report | investor | review | training',
    industry: extractionSchema().document.industry,
    language: 'zh-CN for Chinese decks; otherwise explicit target language',
    visible_language_policy: {
      language: 'zh-CN',
      localize_non_essential_microcopy: true,
      preserve_terms: ['brand names, product names, URLs, emails, stock tickers, standard acronyms such as API/OEE/IRR/SKU']
    },
    organization: 'explicit organization name or empty',
    audience: 'explicit audience or empty',
    decision_goal: 'what the deck should help decide or communicate',
    narrative_thesis: 'one sentence describing the deck spine',
    section_sequence: [
      { section: '公司概况', role: 'setup', must_cover: ['facts/evidence'], avoid: ['repeated facts or internal notes'] }
    ],
    proof_object_plan: [
      { section: '产品与工艺', proof_object: 'production-topology', evidence_ids_or_sources: ['src-001'] }
    ],
    reference_recipe_plan: [
      { section: '数据页', recipe_id: 'reference recipe id from reference_context', layoutVariant: 'financial-kpi-snapshot', component_suggestions: ['metric-strip', 'chart-commentary-panel'], referenceRecipeIds: ['recipe id'] }
    ],
    asset_requirements: [
      { section: '案例证据', role: 'site-photo | product-photo | screenshot | source-table', required: true, provenance: 'source id, user-owned asset, or missing input question' }
    ],
    commercial_logic_plan: [
      {
        section: '诊断/数据/方案页',
        current_state: 'what the material proves today',
        impact: 'measurable or observable business consequence',
        cause: 'driver or root cause',
        action: 'operating move or solution action',
        metric: 'success measure or verification signal'
      }
    ],
    data_component_plan: [
      { section: '数据页', component: 'comparison | funnel | root-cause-matrix | journey-breakpoint | before-after | heatmap | milestone | scorecard', reason: 'why this component fits the evidence' }
    ],
    deck_art_direction: {
      tone: 'premium-industrial-editorial | executive-boardroom | calm-clinical | capital-governance | product-platform',
      palette: 'recommended visual-system palette id',
      semantic_color_roles: {
        brand: 'identity color role',
        evidence: 'proof/caption/source color role',
        risk: 'constraint/compliance color role',
        action: 'path/next-step color role',
        data: 'metric/value color role',
        neutral: 'background/text/rule color role'
      },
      layout_diversity_rules: ['what repetition must be avoided in this deck'],
      rhythm_map: [
        {
          slideId: 'claim-001 or planned section id',
          themeIntent: 'industry-opening | navigation-map | diagnosis | risk-warning | case-evidence | system-architecture | value-signal | operating-path | company-proof | closing-anchor',
          accentRole: 'brand | evidence | risk | action | data | neutral',
          backgroundTone: 'dark-stage | tinted-paper | accent-wash',
          layoutEnergy: 'hero | calm | structured | high-contrast | editorial-dense',
          visualDensity: 'balanced | dense | metric-led | image-led',
          rhythmTransition: 'start | continue | turning-point | proof-anchor | structure-shift | return-to-anchor'
        }
      ]
    },
    industry_deep_dive: {
      industry_context: 'what this industry usually cares about in this deck type',
      decision_criteria: ['what the audience will use to judge the deck'],
      expected_metrics: ['metrics or proof signals that would strengthen the argument'],
      common_evidence: ['site photos, screenshots, certificates, case records, tables, or logs expected in this industry']
    },
    recommended_outline: [
      { section: '章节名', purpose: 'why this section belongs in this industry deck', required_evidence: ['facts or assets needed'] }
    ],
    clarification_candidates: [
      {
        id: 'metric_basis',
        priority: 'blocking | recommended | optional',
        category: 'data-proof | external-readiness | visual-evidence | evidence-authorization | story-architecture',
        question: 'short user-facing question',
        why: 'what this unlocks or prevents',
        affects: ['metric-board', 'case-gallery', 'closing'],
        fallback_strategy: 'conservative fallback if the user chooses not to provide it'
      }
    ],
    customization_strategy: {
      industry_specific_elements: ['industry proof objects, entities, scenes, metrics'],
      client_specific_evidence: ['facts/images/cases unique to this material'],
      template_fatigue_avoidance: ['layout rhythm changes and repeated motif limits']
    },
    visual_strategy: {
      real_assets_first: true,
      generated_asset_allowed_only_for: ['abstract atmosphere'],
      blocked_generated_uses: ['real customer case', 'site evidence', 'certificates', 'logos', 'data screenshots']
    },
    anti_repetition_rules: ['facts consumed by company profile should not become a second metric slide'],
    external_delivery_risks: ['contacts, authorization, certificates, sensitive cases']
  };
}

function criticSchema() {
  return {
    version: 'material-model-critic/v1',
    verdict: 'pass | revise | blocked',
    blocking_issues: [
      { type: 'fact-source | repetition | visual-proof | external-risk | production-note-leak | narrative-gap', message: 'specific issue', affected_claim_ids: ['claim-001'] }
    ],
    coverage_gaps: ['missing section or evidence'],
    repetition_gaps: ['facts repeated across planned slides'],
    visual_gaps: ['image role or authorization issue'],
    revision_instructions: ['concrete change to make before compiling deck plan'],
    safe_to_compile: false
  };
}

module.exports = {
  criticSchema,
  sourceAuditSchema,
  storyArchitectureSchema
};
