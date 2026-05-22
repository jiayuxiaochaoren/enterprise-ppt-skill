# Premium Keynote Layout Corrections

Use this reference when iterating on modern commercial / Keynote-like PPTX generation after the user points out visual glitches, layout collisions, or a page that feels less elegant than expected.

## Principle

Do not treat visual feedback as one-off coordinates for the current deck. Convert each correction into a reusable layout rule for the page family: architecture, capability map, timeline, navigation, risk matrix, etc. Future decks may have different page counts, content length, and industries, so fixes should be geometry rules rather than hardcoded positions.

## Architecture / Platform Section

Problem pattern:
- A central “operating core” or similar block is drawn as a tall translucent shape crossing multiple strata.
- It visually looks like z-order damage, accidental overlay, or a card hidden behind other layers.

Reusable rule:
- Central core elements must be foreground objects with clear bounds.
- Keep the core inside the stratum it belongs to, usually the application/platform layer.
- If the core needs to connect layers, use a small foreground capsule plus short local connector lines, not a tall background card spanning all rows.
- Avoid diagonal connector spaghetti; prefer horizontal strata and short orthogonal/near-orthogonal cues.

## Capability Map / Radar Field

Problem pattern:
- A radar/capability field is drawn on top of a large decorative background circle.
- The page looks like duplicated images or stacked charts.
- The radar is visually off-center inside the content region, even if mathematically centered on the slide.
- Labels wrap into the radar grid, get clipped near the right/bottom edge, or make the radar feel incomplete.

Reusable rule:
- For radar pages, either disable the decorative canvas circle or move it far enough that it is clearly background atmosphere.
- Center the radar within the content region, not the whole slide. If there is a left explanation panel, the radar’s visual center should be the remaining right-side stage.
- Use a bounded right-side capability stage/panel with explicit x/y/w/h, then compute the radar center from that stage.
- Keep only one dominant circular field. Supporting rings should belong to the radar, not compete as a second illustration.
- Size the radar so labels have clean whitespace around it; avoid letting circular grid lines run under large text blocks.
- Put labels in fixed safe-zone boxes around the radar, with subtle backing if needed; do not let labels float on top of rings or rely on ad-hoc slide coordinates.

## Pathway Timeline

Problem pattern:
- Vertical node ticks pass through phase titles or body descriptions.
- Simply shortening tick lines removes the collision but feels mechanical and leaves awkward gaps.
- The timeline cluster sits too close to the bottom “recommendation/note” statement.
- Lower alternating items hang too far below the node/tick, so the dot and copy feel disconnected.
- Page numbers or phase numbers drift into the page title area; number/title/body become separate floating elements.
- Alternating top/bottom layouts make one side close to the axis and the other far away, creating a non-Keynote, improvised feel.

Reusable rule:
- Prefer a single rail with unified milestone cards for premium Keynote-style timelines.
- Number, phase title, and body should be one compact grouped object, with number and title on the same visual row.
- Place grouped milestone cards in a consistent band near the rail; avoid alternating top/bottom unless there is enough vertical space and an explicit rhythm.
- Text should dodge the node/tick, not merely wait for the tick to be shortened.
- Node connectors should be short local cues from the grouped card to the rail; they should never cross title/body boxes.
- Reserve a clear note band at the bottom. Timeline content and recommendation text should have enough vertical separation to read as separate modules.
- Define safe zones: page title band, milestone card band, rail band, and note band. Milestone numbers may never enter the page title band.

## Navigation / Contents

Problem pattern:
- “Constellation” or radial navigation becomes busy: lines compete with chapter titles and create a chaotic field.

Reusable rule:
- If spatial navigation becomes noisy, switch to a disciplined glass navigation rail or chapter stack.
- Keep one dominant navigation metaphor per page: either orbital/spatial or linear rail, not both.

## Risk Matrix

Problem pattern:
- A scatter/risk matrix lacks visible axes, center lines, or grid, making it feel unfinished.
- Left-side risk content is just another list, so the page lacks hierarchy.

Reusable rule:
- Provide visible axes, midpoint lines/quadrants, and a light grid before placing risk points.
- Use the left side for diagnostic summary/context: high-risk count, medium-risk count, risk signals, and governance frame.
- The matrix should be the analytic visual; the left panel should explain how to read it.
