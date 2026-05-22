# Style Deconstruction Workflow for PPTX Generation

Use this reference when a user critiques the generated PPTX visual style, asks to blend in another design tradition, or says to plan before executing.

## Core lesson

Do not treat visual critique as a local shape bug. In this session, repeated fixes failed because the generator patched individual symptoms:

- background looked wrong -> changed to light grey / white containers;
- left accent bar looked split -> changed all bars to horizontal bars;
- card felt weak -> added shadows and title strips.

Those were not design-system fixes. They made the deck look like a web dashboard and ignored the intended blue presentation background.

## Required sequence

1. Pause before editing the generator.
2. Name the target style profile, e.g. `executive-keynote`, `consulting-mckinsey`, `state-owned-red`, `huawei-launch`.
3. Reverse-engineer the style at the system level:
   - background system;
   - typography hierarchy;
   - color roles and proportions;
   - component grammar;
   - slide rhythm;
   - explicit do-not rules.
4. Decide how the style merges with traditional enterprise reporting, instead of copying the source style literally.
5. Only then refactor the generator’s style layer and components.
6. Generate both a full deck and small component preview decks for visual review.

## Style profile schema

Each style profile should define:

- `design_intent`: where it fits and where it does not.
- `background_system`: dark/light/brand pages and when to use them.
- `color_tokens`: primary, secondary, neutral, accent, text, line colors.
- `typography`: title/body/caption sizes, weight, color, spacing.
- `layout_principles`: grid, margin, whitespace, density, page rhythm.
- `components`: cards, timelines, tables, value tiles, TOC, cover/closing pages.
- `do_not`: anti-patterns specific to the style.
- `qa_checklist`: how to visually reject bad outputs.

## User-specific visual preferences learned

- The user expects the original blue background idea to remain meaningful. Do not replace it with shallow grey/white paste-on panels.
- The user dislikes grey background plus white container layers that feel like web UI rather than PPT design.
- The user does not accept “convert vertical bars to horizontal bars everywhere” as a real fix. Accent bars must be component-integrated, or the component should be redesigned intentionally.
- The user wants concise, elegant, Keynote-like PPT style: simple, atmospheric, typographically clear, and not over-decorated.
- The architecture must allow future style deconstructions to be added, not hardcode one visual system.

## QA checks before declaring success

- Does this look like a presentation, not a web dashboard?
- Is the background a coherent stage/motherboard, not a stack of patches?
- Are accent shapes part of a component grammar, not external shapes glued beside cards?
- Does each slide have one clear visual intention?
- Is there enough whitespace without looking empty or unfinished?
- Does the deck still feel appropriate for traditional enterprise / government / SOE reporting?
