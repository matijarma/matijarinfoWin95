const MOBILE_WIDTH_THRESHOLD = 860;

export function isProbablyMobile() {
  const narrowScreen = window.matchMedia(
    `(max-width: ${MOBILE_WIDTH_THRESHOLD}px)`,
  ).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const touchCapable = navigator.maxTouchPoints > 0;

  return narrowScreen && (coarsePointer || noHover || touchCapable);
}
