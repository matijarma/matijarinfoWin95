import { createSymbianShell } from "./mobile-symbian/index.js";
import {
  normalizeMobileVariant,
  readLegacyMobileVariantFromSearch,
} from "./core/simulated-systems/index.js";

const MOBILE_STYLESHEET_ID = "mobile-runtime-stylesheet";

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
    return;
  }

  void mobileVariant;

  const href = "./src/styles/symbian.css";

  let link = document.getElementById(MOBILE_STYLESHEET_ID);

  if (!(link instanceof HTMLLinkElement)) {
    link = document.createElement("link");
    link.id = MOBILE_STYLESHEET_ID;
    link.rel = "stylesheet";
    head.append(link);
  }

  if (link.href !== new URL(href, window.location.href).href) {
    link.href = href;
  }
}

export function mountMobileRuntime(root, { variant } = {}) {
  const requestedVariant = resolveMobileVariant(variant);
  const mobileVariant = "s60-3rd";

  ensureMobileStylesheet(mobileVariant);
  const shell = createSymbianShell({ root, variant: mobileVariant });

  root.dataset.mobileVariantRequested = requestedVariant;
  root.dataset.mobileVariant = mobileVariant;
  shell.mount();

  return () => {
    delete root.dataset.mobileVariantRequested;
    delete root.dataset.mobileVariant;
    shell.unmount();
  };
}
