# Energy Utility Keynote Iteration Notes

Use this reference when a user asks for a modern commercial / Keynote-level PPT for新能源、电站、储能、能源运维、能源管理平台, especially after they complain that the deck is only a superficial industry reskin.

## User correction captured

When the user says the deck still feels unchanged, generic, or ugly, do not keep the same page families and only replace text/colors. For energy decks, the industry profile must reshape the page metaphors:

- Cover: avoid unrelated dot/node constellations and generic tech diagrams. Prefer a real station / BESS / solar-storage image when a clear-source asset is available, then add an energy lens: low-contrast circular field + very restrained load/SOC/dispatch signal. Use orthogonal step signals rather than repeated diagonal slash clusters. If the user asks the right-side visual to be removed, remove it or replace it with a restrained energy-specific object. Keep the left title as close to one line as possible; widen the title block and reduce font size before allowing awkward wrapping.
- Directory / TOC: do not use generic navigation stack language. Convert it into a station operating pathway, e.g. DATA → MONITOR → ALARM → DISPATCH → VALUE, or 站点接入 → 运行监测 → 告警处置 → 调度复盘 → 管理价值. A quiet load curve below the path can add industry meaning without clutter.
- Situation: do not use a plain two-column facts/cards page. Use a site-image editorial split: left BESS detail / station image with current-state facts, right upgrade-demand signals with vertically centered text.
- Problem split: do not use generic four white cards. Use an operating-breakpoint page with FROM/TO logic, dark field cards, and a real equipment-detail visual.
- Architecture: do not use a generic three-layer platform diagram. Use an energy topology: 设备侧 → 数据侧 → 调度侧 → 管理侧. Example nodes: 逆变器 / PCS / BMS / 电表 → 统一数据底座 → 告警工单与策略复盘 → 区域运维驾驶舱.
- Capability map: avoid a generic radar or equal feature-card grid. Use a closed operating loop: 负荷曲线 / 多站点监测 → 储能策略复盘 → 告警事件管理 → 运维工单闭环. Prefer one clean oval loop with fixed node positions; avoid mixing a full ellipse with arrow lines unless the arrows are geometrically exact and unobstructed.
- Timeline: if the normal milestone rail still feels generic, upgrade it to a pilot-station expansion / regional operations radius visual. Content should move from重点站点试点 to多站接入, 储能策略/负荷曲线, and区域集中运维.
- Value: do not use four equal tiles. Use one dominant value outcome with a photo-backed value panel and three supporting signals.

## Implementation pattern

1. Add an `energy-utility` branch in the generator rather than hacking one slide.
2. Create dedicated functions for energy cover field, energy TOC, situation editorial split, operating breakpoint, energy architecture, capability loop, deployment radius, and value signal.
3. Generate the full PPTX, then also generate one-slide preview decks for key page families (cover, TOC, situation, problem split, architecture, capability, timeline, value) and export PNG previews via `qlmanage -t -s 1600`.
4. Validate both structure and visual page-family intent. `validate_pptx.js` passing is not enough; inspect previews for title wrap, irrelevant right-side visuals, repeated layouts, generic labels, line/text overlap, and too-small labels.

## QA questions

- Does the cover visual clearly relate to load/SOC/dispatch/energy operations rather than abstract dots?
- Is the main title single-line or at least not awkwardly broken?
- Does the TOC read like an energy operations path rather than a generic navigation list?
- Do middle pages use real industry page families rather than the same generic card layout?
- Does architecture show 设备侧 → 数据侧 → 调度侧 → 管理侧?
- Is the capability page a loop/closed workflow rather than a generic radar or 3×2 cards?
- Are preview images exported for the changed page families before final delivery?
