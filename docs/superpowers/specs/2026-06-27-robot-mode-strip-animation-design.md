# Robot mode: strip Scratch animation UI

**Date:** 2026-06-27
**Repo:** scratch-primastem (fork of TurboWarp/scratch-gui)
**Goal:** Turn the editor into a robot-coding tool (vibe of Vittascience Blue-bot) by
removing the Scratch-for-animation surface that has no meaning for a physical robot.

## Motivation

PrimaSTEM drives a physical Bluetooth robot. The Scratch stage, sprites, costumes,
sounds, and sprite-motion blocks are animation features with no robot use. They add
clutter and confuse the target audience. Reference: the Vittascience Blue-bot editor
has no stage/sprite/costume/sound at all — palette → blocks → code → console.

This fork cannot become Vittascience (different engine: TurboWarp/scratch-vm vs custom
Blockly), so we strip rather than rebuild. Run controls (green flag / stop) are kept —
just relocated — because the robot program still needs a start/stop trigger.

## Scope

Remove four pieces of animation UI; relocate run controls; leave logic blocks and the
PrimaSTEM robot category intact.

### 1. Block palette categories
File: `src/lib/make-toolbox-xml.js`, the `everything` array (~line 812).

- Remove **Motion**, **Looks**, **Sound** from the default toolbox.
- Keep: Events, Control, Sensing, Operators, Variables, My Blocks, the TurboWarp
  category (if present), and all extension categories (PrimaSTEM Robot, etc.).
- Pen / Music are extension categories, not in the default toolbox — no change needed.

Implementation note: drop `motionXML`, `looksXML`, `soundXML` (and their trailing
`gap`s) from the `everything` array. Leave the category builder functions defined
(unused) to minimize diff and keep the change reversible.

### 2. Costumes / Sounds tabs
File: `src/components/gui/gui.jsx` (~lines 351-386, 421-428).

- Render only the **Code** tab and its panel.
- Remove the Costumes and Sounds `<Tab>`s from the `TabList` and their two
  `<TabPanel>`s (CostumeTab, SoundTab).
- Keep the `Tabs`/`TabList` wrapper with a single tab (lowest-risk; react-tabs still
  needs a TabList). The lone "Code" tab is acceptable; hiding the tab bar entirely is
  a possible follow-up, out of scope here.

### 3. Sprite/stage management (TargetPane)
File: `src/components/gui/gui.jsx` (~lines 443-448).

- Remove the `targetWrapper` Box containing `<TargetPane>` (sprite list, stage
  selector, sprite info: x/y/size/direction/show-hide, add-sprite buttons).

### 4. Stage canvas (StageWrapper)
File: `src/components/gui/gui.jsx` (~lines 435-442, and the `stageAndTargetWrapper`
Box that wraps stage + target).

- Remove the visible stage. With #3 also removed, the entire
  `stageAndTargetWrapper` Box is removed → the blocks panel takes full width.

### 5. Relocate run controls (green flag / stop)
The green flag + stop buttons live in the stage header (`Controls` container,
rendered by `stage-header.jsx`). Removing the stage removes them.

- Render `<Controls vm={vm} />` (from `src/containers/controls.jsx`) in the menu bar,
  near the PrimaSTEM "Connect robot" button.
- `Controls` is a self-contained container (wires `vm.greenFlag()` / `vm.stopAll()`),
  so it works standalone outside the stage header.

## Renderer risk and two-tier approach

scratch-vm's renderer is created and attached to the stage `<canvas>` in
`src/components/stage/stage.jsx`. Removing `StageWrapper` means no renderer is
attached and `vm.renderer` is undefined. Robot blocks never touch the renderer, but
some GUI/VM code paths reference `vm.renderer` and could throw.

- **Plan A (preferred):** fully remove `StageWrapper`, relocate `Controls`. Verify the
  green flag starts a script that calls a PrimaSTEM robot block, stop halts it, and the
  console is clean (no renderer errors).
- **Plan B (fallback):** if Plan A throws renderer errors, keep `StageWrapper` mounted
  but visually hidden (e.g. wrapper `display:none`), so the renderer attaches and run
  controls keep working; the dango stage is simply not shown. Less clean but robust.

Decision is empirical: try A, fall back to B only if the console shows renderer errors.

## Out of scope (possible follow-ups)

- Removing TurboWarp chrome: "See Project Page", "Advanced" menu, "Addons" menu.
- Generated-code panel like Vittascience (TurboWarp has no Python codegen).
- Bottom console panel.
- Hiding the single Code tab bar entirely.

## Verification

Local dev (`http://localhost:8601/editor.html`):

1. Palette shows no Motion / Looks / Sound; shows Events, Control, Sensing,
   Operators, Variables, My Blocks, and PrimaSTEM Robot (auto-loaded).
2. Only the Code tab is present (no Costumes / Sounds).
3. No stage canvas, no sprite list, no sprite info panel.
4. Green flag / stop appear in the menu bar and start/stop a script that calls a
   PrimaSTEM robot block.
5. Browser console is clean (no renderer/undefined errors) — confirms Plan A, else B.

## Risk

Medium. The toolbox and tab edits are low-risk and reversible. The stage removal plus
control relocation is the real change; the two-tier approach bounds the risk.
