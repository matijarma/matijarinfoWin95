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

  if (resolvedDesktopProfile === "ubuntu-server") {
    const ubuntuShell = createUbuntuServerShell({
      root,
      requestSystemSwitch,
      switchContext,
      onRequestSystemSwitch,
    });

    return () => {
      ubuntuShell.unmount?.();
    };
  }

  const eventBus = createEventBus();
  const mediaEngine = createMediaEngine({ eventBus });
  const fileLayer = createFileLayer();
  const windowManager = createWindowManager({ eventBus });
  const webApps = await loadWebAppConfigs();
  const appRegistry = createAppRegistry({
    eventBus,
    windowManager,
    mediaEngine,
    fileLayer,
  });
  const kernel = createOSKernel({ eventBus });

  appRegistry.registerApps(createDefaultManifests({ fileLayer, mediaEngine, webApps }));

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

  if (switchContext?.autoBoot === true) {
    shell.requestPowerOn?.();
  }

  return () => {
    cleanupFns.forEach((cleanupFn) => cleanupFn());
    windowManager.destroy();
    shell.unmount();
  };
}
