import { createSymbianShell as createUIQP1iShell } from "./mobile-symbian/index.js";
import { createSymbianShell as createV1995S60Shell } from "./mobile-variants/v1995-s60/index.js";

const MOBILE_STYLESHEET_ID = "mobile-runtime-stylesheet";

function readMobileVariant() {
  const params = new URLSearchParams(window.location.search);
  const explicitVariant =
    params.get("mobileVariant") ||
    params.get("mobile_variant") ||
    params.get("symbian");

  if (typeof explicitVariant !== "string" || !explicitVariant.trim()) {
    return "uiq-p1i";
  }

  const normalized = explicitVariant.trim().toLowerCase();

  if (
    normalized === "v1995" ||
    normalized === "s60" ||
    normalized === "legacy"
  ) {
    return "v1995-s60";
  }

  if (
    normalized === "uiq" ||
    normalized === "uiq3" ||
    normalized === "uiq3.0" ||
    normalized === "p1i" ||
    normalized === "uiq-p1i"
  ) {
    return "uiq-p1i";
  }

  return "uiq-p1i";
}

function ensureMobileStylesheet(mobileVariant) {
  const head = document.head;
  if (!head) {
    return;
  }

  const href =
    mobileVariant === "v1995-s60"
      ? "./src/mobile-variants/v1995-s60/symbian.css"
      : "./src/styles/uiq-p1i.css";

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

export function mountMobileRuntime(root) {
  const mobileVariant = readMobileVariant();
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
