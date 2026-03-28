import { createDefaultManifests } from "./apps/manifests.js";
import { loadWebAppConfigs } from "./apps/web-apps.js";
import { createAppRegistry } from "./core/app-registry/index.js";
import { createEventBus } from "./core/event-bus/index.js";
import { createFileLayer } from "./core/file-layer/index.js";
import { createMediaEngine } from "./core/media-engine/index.js";
import { createOSKernel } from "./core/os-kernel/index.js";
import { OS_STATES } from "./core/os-kernel/states.js";
import { createWindowManager } from "./core/window-manager/index.js";
import { createDesktopShell } from "./desktop-shell/index.js";
import { createUbuntuServerShell } from "./desktop-shell/ubuntu-server-shell.js";

const TURNSTILE_RENDER_RETRY_LIMIT = 40;
const TURNSTILE_RENDER_RETRY_DELAY_MS = 150;
const TURNSTILE_READY_POLL_INTERVAL_MS = 120;

window.turnstileWidgetId = null;
window.turnstileToken = "";
window.turnstileTokenUpdatedAt = 0;

let turnstileRenderRetryCount = 0;
let turnstileRenderTimerId = null;

function ensureTurnstileContainer() {
  let container = document.getElementById("cf-turnstile-widget");

  if (container instanceof HTMLElement) {
    return container;
  }

  container = document.createElement("div");
  container.id = "cf-turnstile-widget";
  document.body.appendChild(container);
  return container;
}

function clearTurnstileToken() {
  window.turnstileToken = "";
  window.turnstileTokenUpdatedAt = 0;
}

function handleTurnstileToken(token) {
  const normalized = typeof token === "string" ? token.trim() : "";
  window.turnstileToken = normalized;
  window.turnstileTokenUpdatedAt = normalized ? Date.now() : 0;
}

function scheduleTurnstileRenderRetry() {
  if (turnstileRenderTimerId != null) {
    return;
  }

  turnstileRenderTimerId = window.setTimeout(() => {
    turnstileRenderTimerId = null;
    renderTurnstileWidget();
  }, TURNSTILE_RENDER_RETRY_DELAY_MS);
}

function renderTurnstileWidget() {
  if (window.turnstileWidgetId != null && window.turnstileWidgetId !== "") {
    return window.turnstileWidgetId;
  }

  const turnstileRef = window.turnstile;

  if (!turnstileRef || typeof turnstileRef.render !== "function") {
    if (turnstileRenderRetryCount < TURNSTILE_RENDER_RETRY_LIMIT) {
      turnstileRenderRetryCount += 1;
    }

    scheduleTurnstileRenderRetry();
    return null;
  }

  turnstileRenderRetryCount = 0;
  const container = ensureTurnstileContainer();
  window.turnstileWidgetId = turnstileRef.render(`#${container.id}`, {
    sitekey: "0x4AAAAAACw_ppG3kcPvLRXh",
    size: "invisible",
    callback: handleTurnstileToken,
    "expired-callback": clearTurnstileToken,
    "timeout-callback": clearTurnstileToken,
    "error-callback": clearTurnstileToken,
  });

  return window.turnstileWidgetId;
}

window.ensureTurnstileWidgetReady = async function ensureTurnstileWidgetReady(timeoutMs = 6000) {
  if (window.turnstileWidgetId != null && window.turnstileWidgetId !== "") {
    return window.turnstileWidgetId;
  }

  renderTurnstileWidget();
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);

  while (Date.now() < deadline) {
    if (window.turnstileWidgetId != null && window.turnstileWidgetId !== "") {
      return window.turnstileWidgetId;
    }

    renderTurnstileWidget();
    await new Promise((resolve) => {
      window.setTimeout(resolve, TURNSTILE_READY_POLL_INTERVAL_MS);
    });
  }

  return null;
}

renderTurnstileWidget();

function resolveDesktopProfileId(systemId, desktopProfile) {
  if (typeof desktopProfile === "string" && desktopProfile.trim()) {
    return desktopProfile.trim().toLowerCase();
  }

  const normalizedSystemId = String(systemId || "")
    .trim()
    .toLowerCase();

  if (normalizedSystemId === "desktop-winxp-sp2") {
    return "winxp-sp2";
  }

  if (normalizedSystemId === "desktop-win95") {
    return "win95";
  }

  if (normalizedSystemId === "desktop-ubuntu-server") {
    return "ubuntu-server";
  }

  if (normalizedSystemId.startsWith("desktop-")) {
    return normalizedSystemId.slice("desktop-".length) || "win95";
  }

  return "win95";
}

export async function mountDesktopRuntime(
  root,
  {
    desktopProfile,
    systemId,
    onRequestSystemSwitch,
    requestSystemSwitch,
    switchContext,
  } = {},
) {
  const resolvedDesktopProfile = resolveDesktopProfileId(systemId, desktopProfile);
  const fileLayer = await createFileLayer();

  if (resolvedDesktopProfile === "ubuntu-server") {
    const eventBus = createEventBus();
    const mediaEngine = createMediaEngine({ eventBus });
    const windowManager = createWindowManager({ eventBus });
    const webApps = await loadWebAppConfigs();
    const appRegistry = createAppRegistry({
      eventBus,
      windowManager,
      mediaEngine,
      fileLayer,
    });
    const cleanupFns = [];

    appRegistry.registerApps(
      createDefaultManifests({
        fileLayer,
        mediaEngine,
        webApps,
        desktopProfile: resolvedDesktopProfile,
      }),
    );

    cleanupFns.push(
      eventBus.on("shell:app-launch-requested", ({ appId, launchPayload }) => {
        if (typeof appId === "string" && appId) {
          appRegistry.launchApp(appId, launchPayload);
        }
      }),
    );

    cleanupFns.push(
      eventBus.on(
        "shell:system-switch-requested",
        ({ targetSystemId, sourceDesktopProfileId, autoBoot, reboot, rebootRequested } = {}) => {
          if (typeof targetSystemId !== "string" || !targetSystemId) {
            return;
          }

          if (typeof requestSystemSwitch === "function") {
            requestSystemSwitch(targetSystemId, {
              source: "ubuntu-shell-transition",
              context: {
                autoBoot: autoBoot !== false,
                reboot: reboot === true || rebootRequested === true,
              },
              forceRemount: reboot === true || rebootRequested === true,
            });
            return;
          }

          onRequestSystemSwitch?.({
            targetSystemId,
            sourceDesktopProfileId:
              sourceDesktopProfileId || resolvedDesktopProfile,
          });
        },
      ),
    );

    const ubuntuShell = createUbuntuServerShell({
      root,
      fileLayer,
      eventBus,
      windowManager,
      requestSystemSwitch,
      switchContext,
      onRequestSystemSwitch,
    });

    return () => {
      cleanupFns.forEach((cleanupFn) => cleanupFn());
      windowManager.destroy();
      ubuntuShell.unmount?.();
    };
  }

  const eventBus = createEventBus();
  const mediaEngine = createMediaEngine({ eventBus });
  const windowManager = createWindowManager({ eventBus });
  const webApps = await loadWebAppConfigs();
  const appRegistry = createAppRegistry({
    eventBus,
    windowManager,
    mediaEngine,
    fileLayer,
  });
  const kernel = createOSKernel({ eventBus });

  appRegistry.registerApps(
    createDefaultManifests({
      fileLayer,
      mediaEngine,
      webApps,
      desktopProfile: resolvedDesktopProfile,
    }),
  );

  const shell = createDesktopShell({
    root,
    eventBus,
    appRegistry,
    windowManager,
    desktopProfile: resolvedDesktopProfile,
  });

  const cleanupFns = [];
  let pendingRebootSwitch = null;

  function executeSystemSwitch(
    targetSystemId,
    {
      autoBoot = true,
      reboot = false,
      source = "desktop-shell-transition",
      forceRemount = false,
    } = {},
  ) {
    if (typeof requestSystemSwitch !== "function") {
      return false;
    }

    requestSystemSwitch(targetSystemId, {
      source,
      context: {
        autoBoot,
        reboot,
      },
      forceRemount,
    });
    return true;
  }

  function flushPendingRebootSwitch(source = "desktop-reboot-switch") {
    if (!pendingRebootSwitch || typeof requestSystemSwitch !== "function") {
      return false;
    }

    const nextSwitch = pendingRebootSwitch;
    pendingRebootSwitch = null;
    executeSystemSwitch(nextSwitch.targetSystemId, {
      autoBoot: nextSwitch.autoBoot,
      reboot: true,
      source,
      forceRemount: true,
    });
    return true;
  }

  cleanupFns.push(
    eventBus.on("shell:power-on-requested", ({ bootDurationMs } = {}) => {
      void kernel.boot({ bootDurationMs });
    }),
  );

  cleanupFns.push(
    eventBus.on("shell:shutdown-requested", () => {
      void kernel.shutdown();
    }),
  );

  cleanupFns.push(
    eventBus.on("shell:app-launch-requested", ({ appId, launchPayload }) => {
      if (typeof appId === "string") {
        appRegistry.launchApp(appId, launchPayload);
      }
    }),
  );

  cleanupFns.push(
    eventBus.on(
      "shell:system-switch-requested",
      ({
        targetSystemId,
        sourceDesktopProfileId,
        autoBoot,
        reboot,
        rebootRequested,
      } = {}) => {
        if (typeof targetSystemId !== "string" || !targetSystemId) {
          return;
        }

        const isRebootSwitch = reboot === true || rebootRequested === true;
        const nextAutoBoot = autoBoot !== false;

        if (typeof requestSystemSwitch === "function") {
          if (isRebootSwitch) {
            pendingRebootSwitch = {
              targetSystemId,
              autoBoot: nextAutoBoot,
            };

            const kernelState = kernel.getState();

            if (kernelState === OS_STATES.DESKTOP_READY) {
              void kernel.shutdown();
              return;
            }

            if (
              kernelState === OS_STATES.SHUTDOWN_INIT ||
              kernelState === OS_STATES.SHUTTING_DOWN
            ) {
              return;
            }

            flushPendingRebootSwitch();
            return;
          }

          executeSystemSwitch(targetSystemId, {
            autoBoot: nextAutoBoot,
            reboot: false,
            source: "desktop-shell-transition",
            forceRemount: false,
          });
          return;
        }

        onRequestSystemSwitch?.({
          targetSystemId,
          sourceDesktopProfileId:
            sourceDesktopProfileId || resolvedDesktopProfile,
        });
      },
    ),
  );

  cleanupFns.push(
    eventBus.on("os:state-changed", ({ nextState }) => {
      if (nextState === OS_STATES.POWER_OFF) {
        windowManager.closeAll();

        if (flushPendingRebootSwitch("desktop-reboot-switch")) {
          return;
        }
      }

      shell.render(nextState);
    }),
  );

  shell.render(kernel.getState());

  return () => {
    cleanupFns.forEach((cleanupFn) => cleanupFn());
    windowManager.destroy();
    shell.unmount();
  };
}
