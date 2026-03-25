# Windows XP Asset Inventory

Source archive: `WinXp.zip`

This folder intentionally keeps a selective extraction set for near-term shell fidelity work. We are not unpacking the entire archive yet.

## Extracted and ready (51 archive files)

### Cursors (`visuals-to-use/winxp/cursors/`, 21 files)
Core pointer states needed for realistic shell behavior:
- Primary: `default_arrow.png`, `default_ibeam.png`, `default_wait.png`, `default_busy.png`, `default_link.png`, `default_helpsel.png`
- Drag/deny/select: `default_move.png`, `default_no.png`, `default_up.png`, `default_box.png`
- Resizing: `default_size1.png`, `default_size2.png`, `default_size3.png`, `default_size4.png`
- Auto-scroll/navigation: `default_scroll_n.png`, `default_scroll_s.png`, `default_scroll_e.png`, `default_scroll_w.png`, `default_scroll_ns.png`, `default_scroll_ew.png`, `default_scroll_move.png`

### Sounds (`visuals-to-use/winxp/sounds/`, 17 files)
Boot/session sounds plus common shell event sounds:
- Lifecycle: `Windows XP Startup.wav`, `Windows XP Shutdown.wav`, `Windows XP Logon Sound.wav`, `Windows XP Logoff Sound.wav`
- Frequent UI events: `Windows XP Default.wav`, `Windows XP Ding.wav`, `Windows XP Error.wav`, `Windows XP Exclamation.wav`, `Windows XP Critical Stop.wav`, `Windows XP Notify.wav`, `Windows XP Recycle.wav`
- Interaction/system events: `Windows XP Menu Command.wav`, `Windows XP Minimize.wav`, `Windows XP Restore.wav`, `Windows XP Hardware Insert.wav`, `Windows XP Hardware Remove.wav`, `Windows XP Start.wav`

### Branding and logos (`visuals-to-use/winxp/logo/`, 5 files)
- `xp-boot-screen.png`
- `xp-logo-mark-large.png`
- `xp-logo-mark-medium.png`
- `WindowsLogo-small.png`
- `windows-2000-legacy-mark.png` (extra legacy branding reference from archive)

### Frame/theme references (`visuals-to-use/winxp/frame/`, 2 files)
- `UI Theme.png` (main Luna shell/chrome reference sheet)
- `minesweeper-reference.png` (pixel-era app style and control reference)

### Other extracted baseline assets
- Icons: `visuals-to-use/winxp/icons/WinIcons_16.png`, `WinIcons_32.png`, `WinIcons_48.png`
- Wallpapers: `visuals-to-use/winxp/wallpapers/Bliss.png`, `Windows_XP_Professional.png`
- Font: `visuals-to-use/winxp/fonts/tahoma.ttf`

## Deferred in archive (intentionally not extracted yet)

### `WinXp/Clip/` (50 files)
Large Clippy animation sources/sheets. Deferred until an assistant/mascot feature is planned.

### `WinXp/Cursor/` remaining variants (195 files)
Alternative color/style/state families (3D/light/dark/left/right variants, etc.). Deferred until full cursor theme switching is needed.

### `WinXp/Sounds/` remaining event sounds (13 files)
Additional event clips (battery, popup blocked, feed/navigation, telephony, print complete, etc.). Deferred until those exact events are implemented.

### `WinXp/Wallpapers/` remaining images (19 files)
Additional personalization backgrounds; deferred until wallpaper picker/personalization UX is in scope.

### `WinXp/Fonts/framdit.ttf`
Decorative alternate font; deferred until a concrete UI use-case requires it.

### `WinXp/Pack by NullTale.url`
Attribution/pack metadata entry; kept in archive, not needed at runtime.

## Docs for lookup
- Full raw archive listing: `visuals-to-use/winxp/docs/ARCHIVE_FILELIST.txt`
- Deferred lookup guide: `visuals-to-use/winxp/docs/DEFERRED_ASSET_INDEX.md`
