import { createSymbianShell as createUIQP1iShell } from "./mobile-symbian/index.js";
import { createSymbianShell as createV1995S60Shell } from "./mobile-variants/v1995-s60/index.js";
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
  const mobileVariant = resolveMobileVariant(variant);
  ensureMobileStylesheet(mobileVariant);
  const shellFactory =
    mobileVariant === "v1995-s60" ? createV1995S60Shell : createUIQP1iShell;
  const shell = shellFactory({ root });

  root.dataset.mobileVariant = mobileVariant;
  shell.mount();

  return () => {
    delete root.dataset.mobileVariant;
    shell.unmount();
  };
}
