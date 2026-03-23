# Development Journal

This file is append-only and serves as the running log for project progress.

## Logging Rules
- Add a new dated entry for each meaningful change or decision.
- Keep entries short, factual, and implementation-focused.
- Always include: what changed, why, and what is next.

## Entry Template
```md
## YYYY-MM-DD HH:MM (timezone)
- Summary:
- Changes made:
- Decisions:
- Risks / blockers:
- Next steps:
```

## Entries

## 2026-03-23 18:25 (Europe/Zagreb)
- Summary: Initialized documentation scaffold for the OS-simulation portfolio project.
- Changes made:
  - Added `DEVELOPMENT_PLAN.md` with phased architecture and M1 target.
  - Added `DEVELOPMENT_JOURNAL.md` with append-only workflow and template.
  - Added `agents.md` and `gemini.md` with collaboration/development instructions.
- Decisions:
  - Start from scaffold-first architecture before content-heavy implementation.
  - Keep desktop Win95 simulation and mobile Symbian simulation as separate runtime branches.
- Risks / blockers:
  - Fidelity requirements need concrete acceptance tests before deep UI work.
- Next steps:
  - Build Phase 1 code scaffold (folders, entrypoints, core module stubs).

## 2026-03-23 18:39 (CET)
- Summary: Implemented Phase 1 scaffold and a runnable M1 baseline skeleton.
- Changes made:
  - Added root app entrypoint structure: `index.html`, `src/main.js`, `src/entry-desktop.js`, `src/entry-mobile.js`.
  - Created modular core contracts and first implementations for:
    - `core/event-bus`
    - `core/os-kernel` (state machine + boot/shutdown timing)
    - `core/window-manager` (open/focus/minimize/close + drag)
    - `core/app-registry` (manifest registration + launch)
    - `core/media-engine` (integration stubs)
    - `core/file-layer` (virtual document abstraction)
    - `core/utils` (`timing`, `input`, `drag`, `focus`)
  - Added desktop shell skeleton with lifecycle-driven rendering:
    - power-off screen
    - booting screen
    - desktop surface + taskbar + start menu placeholder
    - shutdown states
  - Added one sample manifest-driven app (`About MatijaR`) that opens as a draggable/focusable window.
  - Added mobile branch routing and Symbian placeholder shell.
  - Added baseline Win95-style tokenized CSS in `src/styles/main.css`.
  - Ran JavaScript syntax validation for all `src/**/*.js` files with `node --check`.
- Decisions:
  - Keep lifecycle ownership in OS kernel and keep shell purely render/event-oriented.
  - Keep app launch path manifest-driven from day one to avoid hardcoded app UI branching.
  - Keep mobile route fully separate at entrypoint level and only share safe low-level utilities.
- Risks / blockers:
  - No automated browser-level interaction tests yet (window drag/focus/start-menu behavior currently manual).
  - No true media playback wiring yet; media engine is API scaffold only.
- Next steps:
  - Add regression checklist and lightweight browser test harness for lifecycle + window interactions.
  - Implement window restore/taskbar buttons and stronger focus/z-index invariants.
  - Expand app manifest schema to include document viewer/settings/easter-egg placeholder types.

## 2026-03-23 18:40 (CET)
- Summary: Fixed desktop shell visibility regression on narrow non-mobile viewports.
- Changes made:
  - Removed CSS media rule that forcibly hid `.desktop-shell` under `860px` width.
- Decisions:
  - Runtime route selection (`isProbablyMobile`) is now the only source of truth for desktop vs mobile shell mounting.
- Risks / blockers:
  - Mobile detection heuristic may still need tuning across edge devices.
- Next steps:
  - Add explicit manual QA checks for narrow desktop windows and touch laptops.

## 2026-03-23 18:40 (CET)
- Summary: Added taskbar window controls and completed minimize/restore loop.
- Changes made:
  - Updated `core/window-manager` to track focused window id and expose focused state via `listWindows()`.
  - Added top-visible-window focus fallback on close/minimize.
  - Extended desktop shell taskbar to render dynamic window buttons.
  - Wired taskbar buttons to `focus/minimize/restore` actions.
  - Added taskbar window button styling and empty-state label.
- Decisions:
  - Keep taskbar UI state derived from `windowManager.listWindows()` plus emitted window events.
- Risks / blockers:
  - Taskbar button rendering currently rebuilds buttons on each window event; acceptable for M1 scale but may need optimization later.
- Next steps:
  - Add keyboard shortcuts and stricter viewport boundary constraints during window dragging.

## 2026-03-23 18:40 (CET)
- Summary: Added baseline manual QA checklist for M1 behavior verification.
- Changes made:
  - Added `QA_CHECKLIST.md` covering lifecycle, desktop shell, window manager, and mobile route checks.
- Decisions:
  - Keep early-stage QA manual and deterministic before introducing automated browser tooling.
- Risks / blockers:
  - Regressions may still slip without automated CI checks.
- Next steps:
  - Convert highest-risk checklist items to automated interaction tests.

## 2026-03-23 19:07 (CET)
- Summary: Implemented requested Win95 baseline systems, core apps, interaction constraints, and browser smoke tests.
- Changes made:
  - Added reusable UI primitives:
    - `ui/icons` for icon token mapping.
    - `ui/icon-surface` with desktop/folder icon rendering and mouse marquee selection.
    - `ui/start-menu` with reusable menu entries and nested submenu support.
    - `ui/system-tray` for systray item rendering.
  - Reworked desktop shell to use reusable primitives:
    - Desktop icons now use icon surface + double-click activation.
    - Start menu now supports grouped entries/submenus plus special actions (`Run...`, `Shut Down...`).
    - Added systray placeholders and improved taskbar open-program buttons.
    - Added keyboard shortcuts: `Escape`, `Alt+Tab`, `Alt+F4`.
  - Expanded app set and manifests:
    - Added baseline Win95 apps: `My Computer`, `Recycle Bin`, `Control Panel`, `Internet Explorer`, `Run`, and `Portfolio Notebook`.
    - Added folder-style app surfaces reusing icon-surface for in-window icon interactions.
  - Upgraded window manager:
    - Added active-window tracking and focus cycling.
    - Added viewport clamping during move/restore/resize.
    - Added resize handle skeleton and min-size controls.
    - Added disposal hooks for app-owned content.
  - Added smoke test infrastructure:
    - `package.json` + Playwright config.
    - Static local server script (`scripts/static-server.mjs`).
    - Browser smoke tests covering lifecycle, launch/minimize/restore/close, marquee selection, keyboard shortcuts, and constraints.
  - Updated global CSS to cover reusable Win95 components and new app UIs.
- Decisions:
  - Use shared icon-surface and menu primitives as extension points for future desktop/folder/start-menu behavior.
  - Keep app registration manifest-driven and route all app launches through the registry.
- Risks / blockers:
  - Menu behavior is baseline and not yet fully keyboard-navigable like original Win95.
  - Icon visuals are token-based placeholders and not yet pixel-accurate sprite assets.
- Next steps:
  - Add true keyboard navigation for start menus/icons/windows.
  - Add context menus and folder toolbar/status fidelity.
  - Add broader smoke coverage for start-menu submenu navigation and multi-window z-order edge cases.

## 2026-03-23 19:33 (CET)
- Summary: Delivered Win95 fidelity upgrade pass with faithful lifecycle screens, richer window controls, improved icon visuals, keyboard navigation, and right-click system/context menus.
- Changes made:
  - Replaced boot/shutdown/power-off visuals with Win95-style lifecycle screens:
    - Boot panel with Windows branding and animated startup progress bar.
    - Blue shutdown screen (`Windows is shutting down...`).
    - Safe-off black screen (`It is now safe to turn off your computer.`).
  - Reworked desktop shell:
    - Start button now includes Windows logo glyph and updated Win95 taskbar treatment.
    - Start menu upgraded with deeper Win95-style hierarchy (`Programs`, `Documents`, `Settings`, `Find`, `Run`, `Shut Down`).
    - Added desktop, taskbar, and titlebar right-click context menus.
    - Added system-menu actions for taskbar/titlebar context menus (restore/minimize/maximize/close pathing).
    - Improved keyboard interactions (`Esc`, `Ctrl+Esc`, `Alt+Tab`, `Alt+F4`).
  - Upgraded icon system from text placeholders to reusable SVG-based Win95-like icon glyphs.
  - Upgraded icon-surface behavior:
    - Kept marquee selection for desktop/folder surfaces.
    - Added keyboard navigation and context-menu key support.
    - Added icon-level and surface-level context menu callbacks.
  - Added generic reusable context menu component (`ui/context-menu`).
  - Upgraded window manager:
    - Added maximize/restore support and titlebar double-click maximize.
    - Added explicit window capabilities (`minimizable`, `maximizable`, `closable`).
    - Added runtime window state access (`getWindow`) for shell/system menus.
    - Preserved viewport clamping and resize skeleton behavior under maximize/minimize transitions.
  - Updated folder window scaffold to include internal context menus and status feedback.
  - Expanded smoke tests to cover right-click context menus and maximize/restore behavior in addition to lifecycle and window interactions.
- Decisions:
  - Keep Win95 look grounded in reusable primitives (`icons`, `start-menu`, `context-menu`) so deeper fidelity can iterate in one place.
  - Treat system-menu behavior as a shared pattern for both titlebar and taskbar interactions.
- Risks / blockers:
  - Icon artwork is now significantly closer but still hand-authored vector approximations, not sprite-exact originals.
  - Start menu keyboard behavior is baseline-complete, but not yet fully exhaustive of all original Win95 key edge cases.
- Next steps:
  - Introduce sprite-sheet icon pack + exact spacing metrics for tighter pixel parity.
  - Add full menu accelerator underlines and Alt-based mnemonic navigation.
  - Implement dedicated desktop/taskbar context actions currently disabled (arrange, rename, delete flows).

## 2026-03-23 20:05 (CET)
- Summary: Integrated provided Win95 visual assets, added BIOS-first startup flow, implemented desktop icon dragging, added Explorer-style menus, and fixed startup/taskbar bugs.
- Changes made:
  - Integrated user-provided visual/media assets from `visuals-to-use/`:
    - Boot image (`win95bootscreen.png`) used directly in boot sequence.
    - Boot sound (`win95bootsound.aac`) played during booting state.
    - Shutdown video/audio (`win95shutdownvideoaudio.mp4`) shown during shutdown progress state.
    - Original Win95 `.ico` pack mapped into reusable icon renderer.
  - Reworked lifecycle visuals/flow:
    - First load now shows BIOS-like POST screen (Intel 386 / memory / HDD mock data).
    - Added `Keyboard error or no keyboard present` behavior requiring `F1` to continue boot.
    - Safe-off screen preserved for post-shutdown power-off state.
  - Fixed startup bug:
    - Initial page load no longer starts on safe-off screen.
  - Fixed taskbar bug:
    - Removed the always-present empty placeholder button from taskbar when no apps are open.
  - Implemented desktop icon dragging:
    - Added draggable desktop icon mode with snap-to-grid positioning and viewport clamping.
    - Preserved marquee selection and keyboard selection behavior.
  - Implemented Explorer-style menu bar for folder windows:
    - Added `File`, `Edit`, `View`, `Help` menubar with dropdown menus and `Alt+<key>` open behavior.
    - Kept right-click context menus for folder surface and folder items.
  - Kept and extended keyboard/system interactions:
    - Start/taskbar/window behavior remains with `Ctrl+Esc`, `Alt+Tab`, `Alt+F4`, `Esc` handling.
- Decisions:
  - Use real `.ico` resources for fidelity over vector approximations.
  - Keep BIOS stage as a shell-level gate before OS kernel boot transition.
- Risks / blockers:
  - `.ico` to browser rendering can vary slightly by platform/browser scaling.
  - Explorer menubar is functionally scaffolded but still not 100% complete to all legacy Win95 commands.
- Next steps:
  - Map additional authentic icons for all future app/file types from provided pack.
  - Add deeper Explorer command behavior for `View` modes and sorting.
  - Add persistence for dragged desktop icon positions.

## 2026-03-23 20:22 (CET)
- Summary: Improved BIOS readability/realism, persisted desktop icon layout, and implemented mnemonic underlines + accelerator flows for Start/Explorer menus.
- Changes made:
  - Reworked first-boot BIOS screen rendering into a progressive line-by-line POST animation instead of a static text block.
  - Increased BIOS readability with larger monospace typography and clearer spacing separation between POST output, keyboard error line, and `Press F1` prompt.
  - Gated boot input so `F1` only triggers after BIOS prompt visibility.
  - Added desktop icon position persistence:
    - `icon-surface` now accepts `initialPositions` and emits `onPositionsChanged`.
    - Shell now stores desktop icon coordinates in `localStorage` (`win95.desktop.iconPositions.v1`) with parse/validation guards.
  - Added reusable mnemonic utility (`ui/mnemonics`) to parse/render underlined menu accelerators.
  - Updated Start menu rendering to support mnemonic underlines and keyboard letter activation for menu entries/submenus.
  - Updated Explorer menubar (`File/Edit/View/Help`) to render underlined mnemonics and support Alt-based accelerator behavior plus arrow navigation between top-level menus.
  - Expanded smoke tests for BIOS prompt timing, icon persistence across reload, and mnemonic-triggered actions.
- Decisions:
  - Use explicit `&` markers for primary Start menu labels while keeping automatic fallback mnemonics for entries without markers.
  - Keep persisted icon positions shell-owned in browser storage and icon-surface-owned for runtime drag/grid behavior.
- Risks / blockers:
  - Mnemonic collision handling currently follows first-match behavior per menu level.
  - BIOS line timing is tuned for realism but still deterministic (not hardware-speed adaptive).
- Next steps:
  - Add explicit “Reset Desktop Icons” action in desktop context menu for persisted-layout recovery.
  - Expand accelerator parity to additional menus/context menus where applicable.
