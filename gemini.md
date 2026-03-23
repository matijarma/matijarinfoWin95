# Gemini Collaboration Guide

## Purpose
This document explains how any Gemini-based contributor should work on this project.
Project goal: a deeply interactive portfolio site implemented as a Win95 desktop simulation plus a separate Symbian mobile simulation path.

## What We Are Building
- Desktop experience:
  - Win95-like OS simulation with boot/shutdown flows.
  - Windowed applications, documents, settings pages, hidden easter eggs.
  - Seamless sound/video/html content integration.
- Mobile experience:
  - Distinct SymbianOS-style branch.
  - Placeholder at current stage; full experience later.

## Mandatory Constraints
- Vanilla `HTML`, `CSS`, `JS` only.
- No framework lock-in.
- Maintain separation between desktop and mobile runtime paths.
- Build reusable systems before content-heavy features.

## Development Strategy
1. Build scaffold first.
2. Implement core runtime and state management.
3. Add desktop shell and window management.
4. Add app/document/settings/easter-egg integration contracts.
5. Expand media handling and content population.
6. Iterate on fidelity and polish.

## Module Expectations
- `core`: lifecycle state machine, event bus, shared utilities.
- `desktop`: shell UI, taskbar/start menu, window system integration.
- `mobile`: Symbian routing and placeholder shell.
- `apps`: app contracts and app implementations.
- `media`: centralized audio/video/embed helpers.
- `assets`: themed UI/audio/visual resources.

## Behavioral Priorities
- Win95 fidelity should include behavior timing and interaction patterns.
- Interactions must be consistent and deterministic.
- Architecture must allow "infinite play" extension through app manifests/plugins.

## Contribution Rules
- Make incremental, testable changes.
- Prefer explicit contracts and small modules.
- Avoid one-off logic that bypasses shared systems.
- Document key decisions in `DEVELOPMENT_JOURNAL.md`.
- Keep `DEVELOPMENT_PLAN.md` aligned with actual implementation direction.

## Done Criteria for Foundation Work
- Clear lifecycle transitions: off/boot/desktop/shutdown.
- Desktop shell skeleton mounted via lifecycle.
- Basic window manager interactions working.
- Mobile routing to Symbian placeholder implemented.
- Documentation and journal maintained.
