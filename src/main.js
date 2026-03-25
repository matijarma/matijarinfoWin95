import { isProbablyMobile } from "./core/utils/input.js";
import { createSimulatedSystemsHost } from "./core/simulated-systems/host.js";
import { createSimulatedSystemsRegistry } from "./core/simulated-systems/index.js";
import { mountDesktopRuntime } from "./entry-desktop.js";
import { mountMobileRuntime } from "./entry-mobile.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app mount node.");
}

function stripLegacySystemQueryParams() {
  if (!window.history || !window.location) {
    return;
  }

  const url = new URL(window.location.href);
  const legacyKeys = [
    "system",
    "mobileVariant",
    "mobile_variant",
    "symbian",
  ];

  let hasChanged = false;

  for (const key of legacyKeys) {
    if (!url.searchParams.has(key)) {
      continue;
    }

    url.searchParams.delete(key);
    hasChanged = true;
  }

  if (!hasChanged) {
    return;
  }

  window.history.replaceState(window.history.state, "", url);
}

stripLegacySystemQueryParams();

const registry = createSimulatedSystemsRegistry();
const host = createSimulatedSystemsHost({
  root,
  registry,
  mountSystem: ({ system, requestSystemSwitch, switchContext }) => {
    if (system.family === "mobile") {
      return mountMobileRuntime(root, {
        variant: system.mobileVariant,
        requestSystemSwitch,
        switchContext,
      });
    }

    if (system.family === "desktop") {
      return mountDesktopRuntime(root, {
        systemId: system.id,
        desktopProfile: system.desktopProfile,
        requestSystemSwitch,
        switchContext,
      });
    }

    throw new Error(`Unsupported system family "${system.family}".`);
  },
});

void host
  .mountInitial({
    isMobileDevice: isProbablyMobile(),
  })
  .catch((error) => {
    console.error("Failed to mount simulated runtime host.", error);
    root.textContent = "Runtime failed to initialize.";
  });
