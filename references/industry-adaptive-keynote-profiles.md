# Industry-Adaptive Keynote Profiles

Use this reference when a user wants PPTX output that feels tailored to the industry rather than a generic modern-business template with swapped copy.

## Core lesson

Industry adaptation must affect visual language and page rhythm, not just wording. A deck that only replaces text while keeping the same cover dots, background circles, capability radar, and timeline structure will feel merely acceptable, not premium or surprising.

A strong industry deck should adapt:
- cover insight sentence
- cover right-side abstract object
- background field / motif
- architecture layer wording and grouping
- capability-map core metaphor
- timeline framing
- value and risk language

## Cover rules

Keep the cover concise and Keynote-like:
- Kicker: industry label + year, e.g. `ENERGY OPERATIONS / 2026`.
- Title: 1-2 lines, no awkward mid-word breaks.
- Insight: one industry-specific sentence, preferably under ~26 Chinese characters.
- Meta: one light bottom row only.
- Avoid generic slogans such as `清晰决策 · 快速闭环 · 可持续运营` unless the user explicitly wants a general corporate slogan.
- Avoid generic node/dot diagrams as the only right-side visual.

## Industry motifs

### manufacturing-operations

Signals: 设备、产线、车间、班组、点检、保养、维修、工单、停机、故障、备件、OEE、MTTR、MES、SCADA、PLC、质量、生产节拍。

Cover motif:
- production-line telemetry field
- horizontal status rail
- equipment nodes / status lights
- OEE / MTTR / ALARM micro labels
- takt rhythm pulses

Capability metaphor:
- equipment health / maintenance loop
- assets, alarms, work orders, maintenance, spare parts, production indicators

### industrial-park

Signals: 园区、空间、楼宇、企业、招商、入驻、物业、工单、能耗、门禁、政策、活动、合同、租赁、资产、管委会。

Cover motif:
- spatial blocks / tenant nodes
- service-flow paths
- subtle site-map or asset-network feel

Capability metaphor:
- space-enterprise-service network
- space assets, tenants, service requests, contracts, energy, management dashboard

### energy-utility

Signals: 能源、电站、光伏、储能、PCS、BMS、SOC、逆变器、电表、负荷、告警、峰谷价差、需量、调度、发电量、微网。

Cover motif:
- grid topology
- load curve
- storage dispatch pulse
- LOAD / SOC / GRID micro labels

Capability metaphor:
- energy operations loop
- station monitoring, alarms, work orders, storage strategy review, equipment health, operations indicators

## Material-to-deck workflow

When the user provides raw material, extract a working schema before generating PPTX:

```json
{
  "industry": "energy-utility",
  "ppt_type": "solution",
  "audience": "management",
  "decision_goal": "approve pilot / align plan",
  "facts": [],
  "pain_points": [],
  "capabilities": [],
  "implementation": [],
  "value_claims": [],
  "risks": [],
  "missing_info": []
}
```

Then create a deck plan with:
- `style: premium-commercial-keynote`
- `industry: <detected-profile>`
- `coverInsight: <one industry insight sentence>`
- industry-specific architecture and capability wording

Do not place missing-data placeholders in the visible slides unless the user requests placeholders. Mention missing information in the assistant response instead.

## Architecture pitfall

Do not hardcode one industry's business group labels inside reusable architecture components. In a previous iteration, an energy deck inherited park labels such as `经营与招商 / 政策与活动`. Architecture cards and labels must be derived from the current deck plan's application items or from the active industry profile.

## QA checklist

- [ ] Does the cover visual clearly signal the industry without becoming a literal dashboard screenshot?
- [ ] Is the cover reduced to title + one insight + light meta?
- [ ] Does the right-side visual differ across manufacturing, park, and energy examples?
- [ ] Are architecture labels free of cross-industry residue?
- [ ] Does the capability page use the industry default core title/body or an explicit override?
- [ ] Are generated slides free of `示例 / 测试稿 / 验收稿 / 占位 / 待补充` unless requested?
- [ ] Does the result feel designed for the material, not merely a text-swapped template?
