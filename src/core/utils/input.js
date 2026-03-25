const MOBILE_WIDTH_THRESHOLD = 860;

function readRuntimeOverride() {
  const params = new URLSearchParams(window.location.search);
  const forceMobile = params.get("mobile");
  const forceDesktop = params.get("desktop");
  const mode = params.get("mode");

  if (forceDesktop === "1" || forceDesktop === "true" || mode === "desktop") {
    return "desktop";
  }

  if (forceMobile === "1" || forceMobile === "true" || mode === "mobile") {
    return "mobile";
  }

  return null;
}

export function isProbablyMobile() {
  const runtimeOverride = readRuntimeOverride();

  if (runtimeOverride === "mobile") {
    return true;
  }

  if (runtimeOverride === "desktop") {
    return false;
  }

  const narrowScreen = window.matchMedia(
    `(max-width: ${MOBILE_WIDTH_THRESHOLD}px)`,
  ).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const touchCapable = navigator.maxTouchPoints > 0;

  return narrowScreen && (coarsePointer || noHover || touchCapable);
}
