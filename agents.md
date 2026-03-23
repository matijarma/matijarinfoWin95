# Agent Development Instructions (Project-Specific)

## Project Context
This repository is for a personal portfolio website built as:
- Desktop simulation: Windows 95-inspired operating system.
- Mobile simulation: SymbianOS-inspired separate experience (placeholder first).

Portfolio content will appear inside the simulated OS as apps, files/documents, settings pages, and hidden easter eggs.

## Current Stage
We are in the foundation stage.
Primary objective: build a robust scaffold and architecture that supports fast future expansion.

## Technical Rules
- Use only vanilla `HTML`, `CSS`, and `JavaScript`.
- Use modular ES modules; keep boundaries clean and explicit.
- Keep desktop and mobile runtimes separated.
- Integrate sound/video/html content through reusable APIs, not one-off logic.

## Fidelity Rules (Desktop Win95)
- Behavior fidelity is mandatory, not only visual resemblance.
- Support boot and shutdown sequences as real state transitions.
- Window behavior must feel OS-like (focus, stacking, movement, minimization, close).
- Interactions should be deterministic and testable.

## Mobile Rules (Symbian Placeholder)
- Route mobile users to a dedicated Symbian branch.
- For now, a minimal placeholder shell is enough.
- Do not couple Symbian placeholder logic to desktop shell internals.

## Architecture Priorities
1. Lifecycle state machine.
2. Event-driven core communication.
3. Window manager abstraction.
4. App registry with manifest-driven app definitions.
5. Media integration layer.
6. Virtual file/document layer for portfolio items.

## Code Quality Rules
- Small, single-responsibility modules.
- Clear naming for states/events/actions.
- Avoid hidden side effects between modules.
- Prefer extension points over hardcoded behavior.
- Add concise comments only when logic is non-obvious.

## Workflow Rules
- Keep an append-only progress log in `DEVELOPMENT_JOURNAL.md`.
- Update plan milestones as scope evolves.
- Before major implementation changes, define acceptance criteria.
- Deliver in incremental milestones (`M1`, `M2`, `M3`), each runnable.

## Immediate Implementation Target
Reach `M1`:
- Boot -> desktop -> shutdown lifecycle works.
- Desktop shell skeleton renders.
- One movable windowed app launches.
- Mobile branch routes to Symbian placeholder.
