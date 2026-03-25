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

## 2026-03-24 11:04 (CET)
- Summary: Delivered major Win95 fidelity pass with interactive BIOS setup hardware tuning, slower staged 386 boot flow, and full clock/timezone properties integration.
- Changes made:
  - Added shared preferences module `src/core/system-preferences/index.js`:
    - BIOS profile persistence and normalization (CPU, modem, turbo NIC, cache/memory test toggles).
    - Dynamic BIOS POST line generation (no CD-ROM, floppy + dual HDD layout).
    - Boot duration estimation tied to BIOS profile (overclock/turbo options influence startup delay).
    - Clock profile persistence with default `hr-HR`, Zagreb/CET-like timezone entry, and 24-hour formatting.
    - Timezone preset dataset and helpers for map positioning and timezone-based date/time conversion.
  - Reworked desktop shell lifecycle:
    - Added `DEL`-triggered BIOS setup utility with keyboard shortcuts (`F10`, `ESC`, `F1`) and funny "ludicrous defaults".
    - Added interactive BIOS controls including CPU up to 80MHz, network turbo 10 MBps, modem 56k mode, and related summary telemetry.
    - Replaced one-stage boot screen with staged DOS prelude + delayed Windows splash/progress to emulate slower 386 startup.
    - Wired boot requests to include profile-derived duration payloads.
  - Updated runtime/kernel integration:
    - `os-kernel.boot()` now accepts optional per-boot duration overrides.
    - Desktop entrypoint now passes requested boot duration from shell to kernel.
  - Added Date/Time Properties app:
    - New hidden manifest app launchable via Run (`timedate`) and Control Panel.
    - Taskbar clock now reflects persisted timezone/locale/24h profile.
    - Double-clicking taskbar clock opens Date/Time Properties.
    - Timezone tab includes a Win95-style clickable map + preset dropdown, with apply/sync behavior.
  - Updated shell UI details:
    - Start button active-state fidelity and start-menu visibility sync improvements.
    - Removed start menu bottom dead-space by dropping forced minimum height.
    - Refined systray icon treatment and content (network/modem state surfaced from BIOS profile).
    - Added safer power-off hint copy for post-shutdown state.
  - Expanded icon mapping with classic drive/clock/modem assets for better contextual visuals.
  - Ran syntax checks across all JS modules (`node --check` per file) successfully.
- Decisions:
  - Keep BIOS/clock profiles localStorage-backed and shared by shell/apps to avoid duplicating state logic.
  - Use hidden app manifest for Date/Time Properties so it remains system-internal but launchable by shell affordances.
- Risks / blockers:
  - Timezone map is a custom approximation of Win95 behavior/visuals, not a pixel-exact legacy asset.
  - No browser automation pass was executed in this iteration; behavior verified at static/syntax level.
- Next steps:
  - Run manual browser QA for BIOS setup flows, boot pacing, start menu spacing, and clock interaction paths.
  - Fine-tune timezone map hitbox widths and marker placement after visual QA on multiple viewport sizes.

## 2026-03-25 02:51 (CET)
- Summary: Added a full Task Manager system app replica with live runtime integration and control actions.
- Changes made:
  - Added new app module `src/apps/task-manager.js` with Win95-style menu bar, tabs (`Applications`, `Processes`, `Performance`), live counters/history graphs, and periodic sampling.
  - Implemented live task/process controls:
    - `Switch To`, `End Task`, `End Process`, and `New Task...` action flows.
    - Menu actions for refresh/update-speed toggles and runtime options.
    - Automatic updates on window lifecycle events (`opened`, `closed`, `focused`, `minimized`, etc.).
  - Registered `task-manager` in app manifests as a single-instance system app and wired Run commands (`taskmgr`, `taskman`, `task manager`).
  - Integrated launch paths:
    - Start menu `Programs > Accessories > System Tools > Task Manager`.
    - Desktop shortcut `Ctrl+Shift+Escape`.
  - Extended app runtime context by passing `windowManager` and `appRegistry` into app `createContent` payloads via `core/app-registry`.
  - Added dedicated icon token `task_manager` mapped to original icon asset `w95_58.ico`.
  - Added full Task Manager styling block in `src/styles/main.css` and included its controls in Win95 button treatment selectors.
  - Ran syntax checks across all JS modules (`node --check` for every `src/**/*.js`).
- Decisions:
  - Built Task Manager as a system-level app (hidden manifest + explicit launch vectors) to mirror legacy UX entry points.
  - Used simulated-but-live metrics based on actual open windows and focus state to keep behavior believable while preserving current runtime architecture.
- Risks / blockers:
  - Some legacy options (e.g. exact "Always on Top" z-order semantics) are approximated due current window-manager constraints.
  - No browser automation pass was executed for this iteration; validation is syntax/static plus runtime wiring review.
- Next steps:
  - Add optional process-column toggles and sorting for deeper parity.
  - Add window-manager support for true top-most windows to complete `Always on Top` fidelity.
  - Add smoke tests for Task Manager launch paths and action flows.

## 2026-03-25 03:46 (CET)
- Summary: Replaced the mobile placeholder with a full SymbianOS-inspired runtime experience and dedicated visual system.
- Changes made:
  - Rebuilt `src/mobile-symbian/index.js` into a complete runtime controller with:
    - boot phase sequencing and progress output,
    - standby/home/menu/app navigation state,
    - history stack + back behavior,
    - softkey model (`left/center/right`) and keyboard mappings (`F1/F2/F3`, arrows, enter, escape, keypad shortcuts),
    - clickable on-screen navpad/utility keys,
    - rotating signal/operator/battery status bar updates,
    - toast/dialog feedback flows.
  - Integrated detailed app surfaces and state flows for Contacts, Messaging, Calendar, Gallery, Music, Browser, File Manager, Notes, Settings, Extras, Profiles, and Call Log using new render/data modules.
  - Added and integrated new Symbian modules:
    - `src/mobile-symbian/apps.js` (pure render helpers for all mobile screens/apps),
    - `src/mobile-symbian/data.js` (seed datasets + helpers for contacts/messages/events/media/files/settings/profiles/status).
  - Added `src/styles/symbian.css` and expanded it with compatibility styling for all `symbian-*` classes emitted by the render layer (lists, tabs, status messages, standby blocks, app panes, calendar grid, boot screen, etc.).
  - Wired stylesheet loading in `index.html` so Symbian visuals are available during mobile runtime mount.
  - Ran syntax validation successfully for all JS modules (`node --check` across every `src/**/*.js`).
- Decisions:
  - Keep Symbian implementation isolated to the mobile branch while preserving the existing desktop runtime path.
  - Use data-driven app renderers + a stateful controller to keep future feature additions (new apps/screens/actions) straightforward.
- Risks / blockers:
  - No browser interaction smoke suite was run in this pass; validation is syntax-level plus runtime code review.
  - Fidelity is behavior-first and stylistically close to S60-era devices, but not a 1:1 asset-perfect hardware recreation.
- Next steps:
  - Add mobile interaction smoke tests (softkeys, app routing, back stack, file navigation).
  - Add richer in-app edit flows (compose message, edit note, settings persistence) for deeper simulation parity.

## 2026-03-25 03:47 (CET)
- Summary: Added deterministic runtime override flags for desktop/mobile branch preview.
- Changes made:
  - Updated `src/core/utils/input.js` to support URL overrides:
    - `?mobile=1` (or `?mode=mobile`) forces Symbian/mobile runtime.
    - `?desktop=1` (or `?mode=desktop`) forces desktop Win95 runtime.
  - Preserved existing heuristic routing as default when no override is provided.
- Decisions:
  - Keep override mechanism query-param-based for zero-state, no-storage debugging.
- Risks / blockers:
  - None observed; behavior remains backward-compatible without query flags.
- Next steps:
  - Add quick QA note documenting override usage for manual testing flows.

## 2026-03-25 04:49 (CET)
- Summary: Archived current Symbian mobile build as `v1995` and rebuilt active mobile runtime as Sony Ericsson P1i-style Symbian 9.1 UIQ 3.0 experience.
- Changes made:
  - Preserved previous mobile implementation as a versioned snapshot under `src/mobile-variants/v1995-s60/`:
    - copied runtime (`index.js`), render helpers (`apps.js`), seed data (`data.js`), and stylesheet (`symbian.css`).
  - Added mobile variant routing in `src/entry-mobile.js`:
    - default mobile runtime now points to UIQ/P1i build,
    - archived runtime remains loadable via query aliases (e.g. `?mobileVariant=v1995`, `?mobileVariant=s60`, `?mobileVariant=legacy`).
  - Replaced active `src/mobile-symbian/index.js` with a new UIQ-focused controller:
    - boot sequencing and skip behavior,
    - Today/home screen, launcher pages, app routing, app back-stack,
    - softkey + keyboard + navpad interactions,
    - dialog/toast system,
    - status bar updates (operator/signal/battery/time),
    - app flows for Phone/Calls, Messages, Contacts, Calendar/Tasks/Organizer, Media, Camera, Browser, File Manager, Notes, Control Panel/Connections, Profiles, RSS, Clock, Calculator, Converter, Recorder, and Help.
  - Integrated new UIQ modules:
    - `src/mobile-symbian/uiq-data.js` (UIQ datasets + helpers),
    - `src/mobile-symbian/uiq-views.js` (pure HTML view renderers).
  - Added `src/styles/uiq-p1i.css` and expanded it with compatibility classes matching all `uiq-*` hooks emitted by the view layer.
  - Updated `index.html` to load UIQ stylesheet globally.
  - Ran syntax validation across all JS files (`node --check` over every `src/**/*.js`).
- Decisions:
  - Keep both mobile generations available: UIQ/P1i as default and v1995 S60 archived behind explicit variant query flag.
  - Keep UIQ view/data/controller split to enable future UIQ-specific app expansion without monolithic edits.
- Risks / blockers:
  - No browser automation pass was run for this UIQ migration; validation is syntax-level + integration checks.
- Next steps:
  - Add UIQ-specific smoke tests for launcher page switching, app routing, and softkey/back-stack behavior.
  - Add persistence for active profile/settings edits and recorder/media additions across reloads.

## 2026-03-25 05:12 (CET)
- Summary: Fixed UIQ null-toast runtime crash and set the uploaded profile image as global favicon.
- Changes made:
  - Patched `src/mobile-symbian/uiq-views.js` to guard `renderToast` and `renderStatusBanner` against `null`/non-object payloads before destructuring.
  - Added favicon links in `index.html` pointing to `mr-icon.png` (`icon`, `shortcut icon`, `apple-touch-icon`) so all runtime variants share the same tab icon.
- Decisions:
  - Keep `mr-icon.png` as the canonical favicon asset to match user-provided branding.
  - Use defensive object normalization in UIQ view helpers to prevent transient state from crashing renders.
- Risks / blockers:
  - Browser may cache favicon and old JS aggressively; hard reload may be needed to observe updates immediately.
- Next steps:
  - Run a browser-level smoke pass for UIQ route rendering (`?mobile=1&mobileVariant=uiq-p1i`) and legacy variant switching.

## 2026-03-25 05:34 (CET)
- Summary: Corrected UIQ direction to a 2006-era Sony Ericsson P1i look and isolated mobile variant styling.
- Changes made:
  - Reworked `src/styles/uiq-p1i.css` to a compact UIQ 3.0 visual language (240x320-class display geometry, thin status/title bars, classic CBA strip, tighter list/menu density, blue gradient selection states, period-like launcher and dialog surfaces).
  - Updated `src/mobile-symbian/uiq-views.js` markup semantics for compact/classic list/menu structures while preserving all existing render contracts and interaction hooks.
  - Refactored `src/mobile-symbian/index.js` hardware footer markup to class-based compact nav controls and decorative P1i-style keyboard deck (removed inline styling from markup).
  - Added mobile stylesheet runtime selection in `src/entry-mobile.js` so:
    - UIQ variant loads `src/styles/uiq-p1i.css`.
    - legacy `v1995` variant loads `src/mobile-variants/v1995-s60/symbian.css`.
  - Removed global mobile stylesheet links from `index.html` to prevent desktop and cross-variant style bleed.
- Decisions:
  - Keep legacy S60 styling archived and loaded only when explicitly selected via variant flag.
  - Use class-only hardware styling for maintainability and fast visual iteration.
- Risks / blockers:
  - Visual fidelity remains approximation-based without original UIQ sprite assets/fonts; browser/device rendering still varies.
  - No browser screenshot automation run in this pass; validation is syntax/static-level.
- Next steps:
  - Run browser-level QA with forced URL variants to validate perceived fidelity and tune spacing/iconography further.

## 2026-03-25 21:40 (CET)
- Summary: Implemented multi-OS desktop architecture (Win95 + XP SP2), persisted OS boot target, and `msconfig`-driven system switching workflow.
- Changes made:
  - Added simulated-systems registry/host flow for multiple desktop and mobile OS identities:
    - Added explicit desktop IDs (`desktop-win95`, `desktop-winxp-sp2`) and aliases.
    - Updated initial system resolution to prefer persisted system selection over URL query.
  - Added persistent simulated-system selection in host (`localStorage` key: `simulated-system-id`) and removed URL-based system synchronization.
  - Added startup URL cleanup in `src/main.js` to strip legacy query keys (`system`, `mobileVariant`, `mobile_variant`, `symbian`) via `history.replaceState`.
  - Added desktop profile support for Win95 and XP SP2 with per-profile transition icon metadata.
  - Replaced direct upgrade/downgrade shortcuts with `Change OS` shortcut that opens Run prefilled with `msconfig /boot`.
  - Added `System Configuration` app (`msconfig`) with tab model and Boot tab:
    - Lists installed OS entries.
    - Supports `Apply` (persist default boot target) and `Apply and Restart` (reboot + switch).
  - Extended Run command resolution for `msconfig` and boot-tab launch payload routing.
  - Added reboot-aware switch path in desktop runtime:
    - `shell:system-switch-requested` can queue reboot transitions.
    - Switch executes after power-off and remounts target system with auto-boot context.
  - Added XP boot/shutdown visual/audio pipeline and distinct XP boot screen path (no Win95 asset reuse).
  - Added selective XP asset extraction from `WinXp.zip` and docs:
    - curated runtime-ready assets under `visuals-to-use/winxp/`
    - archive index + inventory documentation for deferred assets.
- Decisions:
  - Make `localStorage` the source of truth for selected default boot OS.
  - Route OS changes through `msconfig /boot` for realism and future extensibility (more installed OS targets).
  - Keep query-string overrides as legacy compatibility only (cleanup on load), not core runtime state.
- Risks / blockers:
  - Browser-level interaction QA was manual/syntax-oriented; no full automated UX regression suite for multi-OS flows yet.
  - Fidelity still depends on iterative CSS tuning across app surfaces and shell chrome.
- Next steps:
  - Add stronger visual parity pass for system apps and Explorer interiors under both Win95 and XP.
  - Add browser smoke tests for `Change OS` -> Run -> `msconfig` -> Apply/Restart -> boot target landing.

## 2026-03-25 23:30 (CET)
- Summary: Addressed post-integration usability issues for BIOS boot entry behavior, `msconfig` boot-tab usability, Run auto-close, and Explorer-like interior chrome.
- Changes made:
  - Enforced BIOS POST/prompt on fresh load for all desktop OS profiles (including XP), removing quick-boot startup path dependence.
  - Updated XP profile startup prompt mode to BIOS-first parity with Win95.
  - Reworked `msconfig` Boot tab UI for reliable visibility/clickability:
    - Explicit boot-entry list/cards with full-row selection behavior.
    - State labels (current OS, saved default, selected), per-entry action button, keyboard activation.
    - Added dedicated Boot-tab styling in both Win95 and XP theme scopes.
  - Extended run-command alias handling for common `msconfig boot` command variants.
  - Updated Run dialog behavior to close after successful app command execution.
  - Reworked folder-window internals from plain content panes to Explorer-like interior structure:
    - menubar, toolbar, address bar, multi-pane status bar.
    - live selection/status feedback and selection-aware menu/toolbar actions.
  - Migrated Control Panel app content to use folder-window/Explorer shell pattern instead of a plain white utility pane.
- Decisions:
  - Prefer behavior-level guarantees for startup flow (BIOS first) instead of relying solely on profile defaults.
  - Treat `msconfig` Boot tab as a first-class interactive surface with explicit layout and interaction affordances.
  - Standardize app-window interior chrome toward Explorer conventions for baseline shell authenticity.
- Risks / blockers:
  - Some non-Explorer system apps still need deeper pixel-fidelity passes for full OS parity.
  - No Playwright/browser screenshot assertions currently enforce `msconfig` Boot tab visibility and clickability regressions.
- Next steps:
  - Add automated UI checks for Boot-tab OS row selection, Apply/Restart flow, and Run auto-close.
  - Continue app-by-app parity pass (menu/toolbar/address/status fidelity and spacing metrics) for both Win95 and XP.

## 2026-03-26 00:23 (CET)
- Summary: Rebuilt `msconfig` layout behavior to remove multi-panel overlap, restore usability, and keep Win95/XP presentation separated.
- Changes made:
  - Completed a full structural rebuild of System Configuration rendering with profile-specific tab sets (Win95 vs XP) and a real dialog layout (`header -> tabs/content -> fixed footer actions`).
  - Fixed the root cause of the unusable window: inactive tab panels were not being hidden because `.msconfig__panel` forced `display: grid`; added explicit `.msconfig__panel[hidden] { display: none; }`.
  - Added missing style definitions required by rebuilt markup (`msconfig__dialog`, script list/check rows, boot options fields, input styling, primary action button) and constrained boot list/panel scrolling.
  - Reworked footer/actions sizing so `OK`, `Cancel`, `Apply`, and `Apply and Restart` stay visible and reachable without chaotic internal layout expansion.
  - Added stronger XP-specific `msconfig` visual overrides while preserving Win95 defaults to prevent cross-profile visual bleed.
  - Wired `windowManager` into `system-configuration` app content creation so `OK`/`Cancel` close behavior resolves the correct window instance.
  - Set `system-configuration` window manifest to `resizable: false` to match dialog behavior and prevent geometry-driven breakage.
  - Ran syntax validation (`node --check src/apps/manifests.js`) after patching.
- Decisions:
  - Treat `msconfig` as a strict single-surface dialog where only one panel is rendered at a time and footer actions are always anchored.
  - Keep boot-target persistence on `localStorage["simulated-system-id"]` so `Apply` directly affects next startup target.
- Risks / blockers:
  - No automated browser test currently asserts `.msconfig__panel[hidden]` behavior, footer visibility, or boot-target persistence path end-to-end.
- Next steps:
  - Add a browser regression test for `msconfig /boot` tab switching and footer visibility.
  - Add an end-to-end test for selecting XP, pressing `Apply`, and confirming XP boot on reload.

## 2026-03-26 01:32 (CET)
- Summary: Added Ubuntu Server shell UX upgrades and enforced BIOS-first power-on sequence for Ubuntu runtime parity with desktop boot behavior.
- Changes made:
  - Implemented Ubuntu shell interaction improvements in `src/desktop-shell/ubuntu-server-shell.js`:
    - Persisted command history in `localStorage` (`ubuntu-server.shell.history.v1`) with bounded retention (300 entries).
    - Added shell-style history navigation via `ArrowUp` / `ArrowDown`, including draft restore behavior.
    - Added `history` command output.
    - Improved input readiness with `autofocus` + delayed focus reinforcement so typing works immediately after shell load.
    - Allowed empty-enter behavior: pressing Enter on empty input now emits an empty output row (shell-like blank line behavior).
  - Improved Ubuntu shell layout comfort in `src/styles/main.css`:
    - Introduced centered session container (`.ubuntu-shell__session`) so prompt/input remains directly below output in the center area, rather than feeling bottom-stuck.
  - Enforced BIOS-first startup for Ubuntu:
    - Added BIOS POST rendering flow in `src/desktop-shell/ubuntu-server-shell.js` using shared BIOS profile helpers.
    - Updated all Ubuntu power-on paths to route through BIOS before Ubuntu boot log/terminal:
      - initial auto-boot mount,
      - power-on from halted screen,
      - in-shell reboot targeting Ubuntu,
      - external `requestPowerOn()` entry.
- Decisions:
  - Keep Ubuntu as a shell-only runtime (no GUI desktop/window layer), but preserve hardware-faithful startup semantics (BIOS -> OS boot).
  - Reuse shared BIOS profile generation (`buildBiosPostLines`, `readBiosProfile`) for consistency with existing desktop systems.
- Risks / blockers:
  - Ubuntu BIOS stage currently supports continue behavior only (no BIOS setup utility branch in Ubuntu runtime).
  - No browser automation currently verifies Ubuntu BIOS-first sequencing + history persistence paths end-to-end.
- Next steps:
  - Add automated UI coverage for Ubuntu boot chain (`power on -> BIOS -> boot log -> shell`).
  - Add focused UX regression checks for history navigation and auto-focus behavior after runtime remount.
