# Personal Portfolio OS Simulation - Development Plan

## Project Vision
Build `https://matijar.info` as a highly customized, highly interactive simulation:
- Desktop: faithful Windows 95 style OS experience.
- Mobile: separate SymbianOS-style simulation path (placeholder logic first).
- Portfolio content integrated inside the simulated OS as apps, documents, settings, and hidden easter eggs.

## Core Constraints
- Vanilla `HTML`, `CSS`, and `JavaScript` only.
- Seamless integration of sound, video, and HTML content into OS-like apps/windows.
- High interactivity and behavior-focused Win95 fidelity, not only visual similarity.
- Boot and shutdown sequences are first-class core features.
- Mobile branch must be architecturally separate from desktop branch.

## Non-Goals for Current Stage
- No final visual polish yet.
- No full app library yet.
- No deep content population yet.
- No advanced persistence/data sync yet.

## Architecture Direction (Scaffold First)
Use modular ES modules with clear subsystem boundaries:
1. `core/os-kernel`: global state machine and lifecycle.
2. `core/event-bus`: pub/sub for cross-module communication.
3. `core/window-manager`: focus, z-index, move, resize, minimize, close.
4. `core/app-registry`: declarative app manifest and launcher hooks.
5. `core/media-engine`: shared APIs for audio, video, and embedded HTML content.
6. `core/file-layer`: virtual docs/files abstraction (future content system).
7. `desktop-shell`: taskbar, start menu, desktop icons, notifications.
8. `mobile-symbian`: separate entrypoint and placeholder shell logic.

## State Machine (Desktop)
Initial lifecycle states:
- `POWER_OFF`
- `BOOTING`
- `DESKTOP_READY`
- `SHUTDOWN_INIT`
- `SHUTTING_DOWN`

Required transitions:
- `POWER_OFF -> BOOTING -> DESKTOP_READY`
- `DESKTOP_READY -> SHUTDOWN_INIT -> SHUTTING_DOWN -> POWER_OFF`

## Phased Delivery Plan

### Phase 0 - Specs and Rules Lock
- Finalize Win95 fidelity criteria (interaction, motion, audio cues, behavior).
- Define portfolio integration map (which content appears where).
- Define mobile branch behavior and placeholder acceptance.
- Freeze naming conventions and module boundaries.

### Phase 1 - Repo Scaffold
- Create folder structure and module shells.
- Add global CSS variables/tokens for Win95 baseline theming.
- Add minimal bootstrapping entrypoints for desktop and mobile.
- Add utility modules for drag/focus/input/timing.

### Phase 2 - Core Runtime Skeleton
- Implement OS lifecycle state machine.
- Implement event bus and debug logging hooks.
- Implement shell mount/unmount flow by lifecycle state.
- Stub boot/shutdown sequence orchestration.

### Phase 3 - Desktop Shell Skeleton
- Render desktop surface and taskbar skeleton.
- Render Start button/menu placeholder.
- Implement basic clock/update placeholder.
- Add app launch hooks from Start menu and desktop icons.

### Phase 4 - Windowing Skeleton
- Create base window component/system.
- Implement open/focus/close/minimize logic.
- Implement drag movement and basic size constraints.
- Establish z-index/focus policy.

### Phase 5 - Portfolio Integration Scaffold
- Define app manifest schema for portfolio items.
- Add placeholder app types:
  - app window
  - document viewer
  - settings panel
  - hidden/easter egg trigger
- Ensure media engine hooks are callable from any app.

### Phase 6 - Mobile Placeholder Branch
- Add mobile detection and separate mobile entrypoint routing.
- Mount Symbian placeholder shell only.
- Keep desktop/mobile cores isolated while sharing safe utilities.

### Phase 7 - QA and Expansion Baseline
- Add regression checklist for lifecycle + shell + window manager.
- Define performance targets and browser support policy.
- Prepare backlog for first real portfolio apps/content and polish pass.

## Milestone M1 (First Build Target)
Deliver a minimal but complete scaffold:
1. Boot sequence runs and reaches desktop shell.
2. Desktop shell shows taskbar and Start/menu placeholder.
3. One sample app opens in a movable, focusable window.
4. Shutdown sequence returns to powered-off state.
5. Mobile user gets Symbian placeholder route.

## Coding Standards (Initial)
- Keep modules small and single-purpose.
- Use explicit, predictable naming for events/state transitions.
- Avoid inline scripts/styles in HTML where possible.
- Prefer declarative app manifests over hardcoded branch logic.
- Keep architecture extensible for many future apps/easter eggs.

## Backlog Tracking Method
- Use milestone tags: `M1`, `M2`, `M3`.
- Use priority tags: `P0` (critical), `P1` (high), `P2` (normal).
- Every task must include:
  - expected behavior
  - acceptance criteria
  - touched modules

## Immediate Next Step
Implement Phase 1 scaffold with directory layout, entrypoints, and empty module contracts.
