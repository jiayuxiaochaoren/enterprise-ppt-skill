# Material-to-Industry Deck Workflow

Use this reference when the user provides raw materials, meeting notes, product descriptions, company introductions, proposal text, screenshots, or scattered bullet points and expects the skill to generate PPT structure, content, and layouts.

## Goal

Do not simply summarize the user's material into generic slides. Convert materials into an industry-aware deck plan:

1. identify industry and scenario
2. infer audience and decision goal
3. extract facts, claims, constraints, and missing data
4. select an industry profile and page-family rhythm
5. run a clarification gate when missing inputs affect external delivery, data proof, cases, certificates, contacts, or visual evidence
6. generate page-level content and layout choices from confirmed facts and chosen fallbacks
7. only then render PPTX

## Industry detection

Infer `plan.industry` from material keywords, but keep it overridable by the user.

### manufacturing-operations

Signals:
- 设备、产线、车间、班组、点检、保养、维修、工单、停机、故障、备件、OEE、MTTR、MES、SCADA、PLC、质量、生产节拍

Default visual/layout direction:
- coverField: production-line telemetry field
- capability: maintenance / equipment health map
- architecture: shopfloor data → operations applications → management cockpit
- timeline: pilot line → key equipment → multi-line rollout

### industrial-park

Signals:
- 园区、空间、楼宇、企业、招商、入驻、物业、工单、能耗、门禁、政策、活动、合同、租赁、资产、管委会

Default visual/layout direction:
- coverField: spatial network / service flow
- capability: space-enterprise-service capability map
- architecture: tenant/service/data strata
- timeline: core service loop → tenant services → system integration

### energy-utility

Signals:
- 能耗、电力、负荷、光伏、储能、配电、碳排、抄表、用能、能效、调度、需量、峰谷

Default visual/layout direction:
- coverField: grid/load field
- capability: load-carbon-dispatch map
- architecture: meter/device data → energy applications → carbon/management dashboard

### logistics-supply-chain

Signals:
- 仓储、运输、订单、库存、配送、干线、路径、履约、供应链、采购、WMS、TMS、车辆、末端

Default visual/layout direction:
- coverField: route/hub flow
- capability: order-inventory-fulfillment map
- architecture: warehouse/transport/order data strata

### healthcare-operations

Signals:
- 医院、门诊、住院、病区、护理、排班、患者、医嘱、耗材、设备、院内、质控

Default visual/layout direction:
- coverField: care pathway / resource flow
- capability: patient-resource-quality map
- architecture: patient flow + resource scheduling + quality control

## Material extraction schema

Before writing slides, extract the material into this working schema:

```json
{
  "industry": "manufacturing-operations",
  "ppt_type": "solution / report / company-intro / training / review",
  "audience": "客户高层 / 管理层 / 政府部门 / 内部团队",
  "decision_goal": "争取预算 / 方案汇报 / 项目立项 / 内部对齐",
  "facts": ["用户材料中明确给出的事实"],
  "pain_points": ["当前问题"],
  "capabilities": ["方案能力或产品模块"],
  "implementation": ["阶段、计划、里程碑"],
  "value_claims": ["价值主张，不编造数值"],
  "risks": ["风险、依赖、前置条件"],
  "missing_info": ["应补充但材料未提供的信息"]
}
```

Rules:
- Preserve real facts from the source material.
- Do not invent customer names, metrics, revenue, awards, policy endorsements, or successful cases.
- If data is missing, phrase as `需结合实际数据测算` in the assistant response, not as PPT-visible placeholder copy unless the user asks for placeholders.
- Before structured extraction, run `scripts/material_clarification_gate.js` after source audit and story architecture. If it returns `needs_user_input`, ask the user the listed questions and apply their choices before writing the final claim spine.
- Before PPTX rendering, run `scripts/resolve_visual_assets.js` on the compiled deck plan. It uses the asset decision gate, then either stops with imagegen prompts when synthetic assets are allowed, binds provided/generated assets from an asset map, or explicitly skips image use when imagegen is unavailable. Never let a missing image silently become a visible placeholder.
- Generated preview decks should look client-facing; avoid `示例 / 测试稿 / 验收稿 / 占位 / 待补充` in slide text.

## Deck structure generation

Use a 10-page default unless the user requests otherwise:

1. Cover — industry-specific title, one insight sentence, light meta
2. Contents — 4-5 sections
3. Background / current situation — facts and drivers from material
4. Problem / opportunity decomposition — 3-4 key issues
5. Architecture / overall solution — industry-specific strata
6. Capability map — industry-specific modules
7. Implementation path — phases from material or inferred conservative phases
8. Value signal — values grounded in material, no fabricated numbers
9. Risk and assurance — risks + safeguards
10. Closing — one strategic statement

## Layout selection by material type

- If material is mostly product modules: emphasize architecture + capability map.
- If material is mostly pain points: emphasize split-insight + value signal.
- If material is mostly project progress: emphasize timeline + risk/assurance.
- If material is company intro: use company profile, capability proof, cases if provided, cooperation value.
- If material has dense data: create metric/value pages, but only with provided numbers.

## Page plan output requirements

Every generated deck plan should include:

```json
{
  "style": "premium-commercial-keynote",
  "industry": "manufacturing-operations",
  "title": "...",
  "subtitle": "...",
  "coverInsight": "行业洞察句",
  "organization": "...",
  "audience": "...",
  "date": "...",
  "slides": [ ... ]
}
```

Industry-specific fields:
- `industry` must be set whenever identifiable.
- `coverInsight` should be one sentence, no more than ~26 Chinese characters when possible.
- `module-matrix` may set `coreTitle` and `coreBody`, but if omitted the generator should use the industry profile defaults.

## QA checklist for material-generated decks

- [ ] Does the deck reflect the user's actual material rather than generic industry knowledge?
- [ ] Is the industry profile set correctly?
- [ ] Does the cover visual match the industry motif?
- [ ] Is the cover text reduced to title + one insight + meta?
- [ ] Are page families selected according to the material type?
- [ ] Are missing facts handled outside the PPT or as clearly marked assumptions?
- [ ] Did the clarification gate ask about missing contacts, data basis, asset rights, case authorization, certificates, and visual evidence when relevant?
- [ ] Does the deck avoid fabricated metrics/cases/policies?
- [ ] Does the layout differ meaningfully across industries, not just the wording?
