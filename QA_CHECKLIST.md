# QA Checklist (M1 Baseline)

## Scope
Manual regression checks for current scaffold behavior.

## Environment
- Browser: latest Chrome/Firefox/Safari.
- Load `index.html` by visiting https://dev.matijar.info (locked behind cloudflare access)

## Lifecycle Checks
1. Initial load shows BIOS-like POST screen.
2. BIOS lines animate progressively (line-by-line), not all at once.
3. `Keyboard error or no keyboard present` line appears clearly separated from POST output.
4. `Press F1 to continue...` prompt appears clearly separated beneath keyboard error line.
5. Pressing `F1` before prompt visibility does not boot.
6. Pressing `F1` after prompt visibility transitions to booting screen.
7. After boot duration, desktop shell appears.
8. Start menu `Shut Down` runs shutdown sequence.
9. Shutdown video/sound stage is shown before power-off.
10. After shutdown duration, safe-off screen is shown.

## Desktop Shell Checks
1. Taskbar is visible with `Start` button and clock.
2. Start button toggles Start menu open/closed.
3. Clicking outside Start menu closes it.
4. Desktop icon launches app window.

## Window Manager Checks
1. App window opens with title bar and controls.
2. Window can be dragged by title bar.
3. Clicking different windows updates focus (active title bar).
4. Minimize button hides window.
5. Taskbar window button restores minimized window.
6. Maximize button toggles maximize/restore.
7. Titlebar double-click toggles maximize/restore.
8. Closing window removes it and its taskbar entry.

## Desktop Icon Dragging
1. Desktop icons can be dragged with mouse.
2. Dragged icons snap to grid on release.
3. Dragging does not break icon double-click launch.
4. Dragged icon positions persist after page reload.

## Keyboard + Menu Checks
1. `Alt+Tab` cycles focus between open windows.
2. `Alt+F4` closes the focused window.
3. `Ctrl+Esc` opens Start menu.
4. Start menu supports keyboard up/down/left/right + Enter selection.
5. Start menu displays mnemonic underlines and supports letter-key activation (`r` -> `Run...`, etc.).
6. Explorer menubar displays `File/Edit/View/Help` mnemonics and supports `Alt+<letter>` opening.
7. Explorer menubar supports left/right arrow switching between top-level menus.

## Context Menu Checks
1. Right-click desktop icon opens context menu.
2. Right-click empty desktop opens desktop surface context menu.
3. Right-click taskbar program button opens system menu.
4. Right-click window title bar opens system menu.
5. Folder surfaces show right-click context menu for icons and empty area.

## Mobile Route Checks
1. On mobile/touch narrow viewport, Symbian placeholder renders.
2. Desktop shell is not mounted in mobile route.

## Known Gaps
- Smoke tests cover lifecycle/window/menu regressions, but broad cross-browser automation is still limited.
- No persistence of window/app state between sessions.
- Media engine integration is scaffold only.
