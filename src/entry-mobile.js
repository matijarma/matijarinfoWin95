import { createSymbianShell } from "../src/symbian/js/main.js";
import { createFileLayer } from "./core/file-layer/index.js";
import {
  normalizeMobileVariant,
  readLegacyMobileVariantFromSearch,
} from "./core/simulated-systems/index.js";

const MOBILE_STYLESHEET_ID = "mobile-runtime-stylesheet";
const SYMBIAN_STYLESHEET_HREF = "./src/symbian/styles.css";
const SYMBIAN_ASSET_BASE_PATH = "./symbian";
const MOBILE_FILE_SYSTEM_OS = "winxp";

let sharedFileLayerPromise = null;

function loadSharedFileLayer() {
  if (!sharedFileLayerPromise) {
    sharedFileLayerPromise = createFileLayer();
  }

  return sharedFileLayerPromise;
}

function readMobileVariant() {
  return readLegacyMobileVariantFromSearch().variant;
}

function resolveMobileVariant(variant) {
  if (typeof variant === "string" && variant.trim()) {
    return normalizeMobileVariant(variant);
  }

  return readMobileVariant();
}

function ensureMobileStylesheet(mobileVariant) {
  const head = document.head;
  if (!head) {
    return () => {};
  }

  void mobileVariant;

  let link = document.getElementById(MOBILE_STYLESHEET_ID);

  if (!(link instanceof HTMLLinkElement)) {
    link = document.createElement("link");
    link.id = MOBILE_STYLESHEET_ID;
    link.rel = "stylesheet";
    head.append(link);
  }

  if (link.href !== new URL(SYMBIAN_STYLESHEET_HREF, window.location.href).href) {
    link.href = SYMBIAN_STYLESHEET_HREF;
  }

  return () => {
    if (link?.parentNode) {
      link.parentNode.removeChild(link);
    }
  };
}

export async function mountMobileRuntime(
  root,
  { variant, requestSystemSwitch } = {},
) {
  const requestedVariant = resolveMobileVariant(variant);
  const mobileVariant = "uiq-p1i";
  const teardownStylesheet = ensureMobileStylesheet(mobileVariant);
  const fileLayer = await loadSharedFileLayer();
  const shell = await createSymbianShell({
    root,
    fileLayer,
    fileSystemOs: MOBILE_FILE_SYSTEM_OS,
    assetBasePath: SYMBIAN_ASSET_BASE_PATH,
    requestSystemSwitch,
  });

  root.dataset.mobileVariantRequested = requestedVariant;
  root.dataset.mobileVariant = mobileVariant;
  shell.mount();

  return () => {
    delete root.dataset.mobileVariantRequested;
    delete root.dataset.mobileVariant;
    shell.unmount();
    teardownStylesheet();
  };
}
