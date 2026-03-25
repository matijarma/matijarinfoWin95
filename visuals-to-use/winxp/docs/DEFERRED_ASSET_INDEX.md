# Deferred Asset Index (WinXp.zip)

Purpose: quick lookup for assets intentionally left inside `WinXp.zip` so we can stay selective now and expand later without re-discovery work.

## High-priority deferred groups

| Group | Archive path | Deferred now | When to pull |
| --- | --- | --- | --- |
| Clippy animation set | `WinXp/Clip/` | 50 files (ASE + sprite sheets) | Only when building assistant/help/mascot features |
| Extra cursor families | `WinXp/Cursor/` | 195 files | When adding full cursor theme packs or variant switching |
| Additional shell sounds | `WinXp/Sounds/` | 13 files | When wiring specific events not covered by current sound set |
| Wallpaper expansion | `WinXp/Wallpapers/` | 19 files | When building wallpaper picker/personalization panel |
| Alternate font | `WinXp/Fonts/framdit.ttf` | 1 file | When a decorative display font is explicitly needed |
| Pack metadata | `WinXp/Pack by NullTale.url` | 1 file | Usually never for runtime; keep for attribution traceability |

## Deferred sound filenames (remaining in archive)

- `Windows Feed Discovered.wav`
- `Windows Information Bar.wav`
- `Windows Navigation Start.wav`
- `Windows Pop-up Blocked.wav`
- `Windows XP Balloon.wav`
- `Windows XP Battery Critical.wav`
- `Windows XP Battery Low.wav`
- `Windows XP Hardware Fail.wav`
- `Windows XP Information Bar.wav`
- `Windows XP Pop-up Blocked.wav`
- `Windows XP Print complete.wav`
- `Windows XP Ringin.wav`
- `Windows XP Ringout.wav`

## Deferred wallpaper filenames (remaining in archive)

- `Ascent.png`
- `Autumn.png`
- `Azul.png`
- `Crystal.png`
- `Follow.png`
- `Friend.png`
- `Home.png`
- `Moon_flower.png`
- `Peace.png`
- `Power.png`
- `Purple_flower.png`
- `Radiance.png`
- `Red_moon_desert.png`
- `Ripple.png`
- `Stonehenge.png`
- `Tulips.png`
- `Vortec_space.png`
- `Wind.png`
- `Windows_XP_Home_Edition.png`

## Cursor pull strategy for later

Start with exact families needed by feature instead of bulk extraction.

- For alternate arrow looks: `arrow_*.png`, `larrow.png`, `harrow.png`
- For link/wait animation variants: `link_*.png`, `wait_*.png`, `busy_*.png`, `appstar*_st.png`, `hourgla*_st.png`
- For full resize/state variants: `size*_*.png`, `move_*.png`, `no_*.png`, `help_*.png`, `pen_*.png`

## Notes

- Branding, icon sheets, primary frame theme sheet, and core shell sounds are already extracted.
- Full archive paths are available in `visuals-to-use/winxp/docs/ARCHIVE_FILELIST.txt`.
