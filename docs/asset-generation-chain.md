# Asset Generation Chain

The slide renderer owns the image slot. Image prompts, generated files, and asset maps must follow the slot contract instead of inventing their own aspect ratio.

## Contract

- `assetGeneration.target` uses `asset-target-contract/v1`.
- Authority order: `visual.targetSlot` > `assetGeneration.target` > renderer/page-family slot registry > role fallback.
- Role fallback is only a recovery path. If a required generated asset depends on fallback, QA should review it.
- Prompt text is an expression of the contract. It must not add conflicting `16:9`, `4:3`, landscape, portrait, or crop instructions.
- Historical route fields such as `previousLayoutVariant` and `previousProofObject` are review context only. They must not become executable authority for generated-image size.
- Prompt conflict detection covers English and Chinese size cues, including `16:9横图`, `横版`, `宽屏`, `竖图`, `竖版`, `海报图`, and `方图`.
- Prompt planner exposes both human-readable `sizeHint` and structured `imagegenSizeHint`; prompt text must not be the only place where size is carried.

## Binding

- Generated, required, and user-provided assets are checked against `target.aspectRatio`.
- The decision gate's `provide_assets` action must bind through the same binder path as `scripts/bind_generated_assets.js`; it must not write `slide.visual.image` directly.
- A mismatch above 25% fails binding by default.
- A mapping may set `allowAspectMismatch:true`; the binder will keep the risk in `assetGeneration`, `assetAttribution`, and `sourceTrace.imageProvenance`.
- Multi-image/gallery binding records `assetGeneration.boundAssets[]`, one entry per image with dimensions, target slot, target aspect, actual aspect, mismatch, fit policy, and target source. Slide-level mismatch summarizes the worst per-image mismatch.

## QA

- `generatedTargetMissing` means a required generated asset has no auditable target, or relies on fallback.
- `generatedPromptAspectConflict` means prompt language conflicts with the target orientation.
- `assetAspectMismatch` means a bound asset does not match the rendered slot, whether it came from imagegen or `provide_assets`.
- Render metadata records the target, image dimensions, per-asset mismatch, worst mismatch, and actual fit decision so QA can catch contain fallback or distorted source assets.

## Regression Cases

- Slide 10 haircare split panel: must use a vertical image around `0.567:1`, not a default 16:9 image stretched into the side panel.
- Slide 11 evidence frame: must not inherit Slide 10's vertical target only because stale `previousLayoutVariant=product-evidence-story` remains in the plan.
- Slide 9 control badges: layout fixes belong in the renderer/component layer, not in generated imagery.
- Slide 4 internal notes: provenance and selection logic stay in trace metadata, not visible slide copy.
