import { createDefaultManifests } from "./apps/manifests.js";
import { createAppRegistry } from "./core/app-registry/index.js";
import { createEventBus } from "./core/event-bus/index.js";
import { createFileLayer } from "./core/file-layer/index.js";
import { createMediaEngine } from "./core/media-engine/index.js";
import { createOSKernel } from "./core/os-kernel/index.js";
import { OS_STATES } from "./core/os-kernel/states.js";
import { createWindowManager } from "./core/window-manager/index.js";
import { createDesktopShell } from "./desktop-shell/index.js";

export function mountDesktopRuntime(root) {
  const eventBus = createEventBus();
  const mediaEngine = createMediaEngine({ eventBus });
  const fileLayer = createFileLayer();
  const windowManager = createWindowManager({ eventBus });
  const appRegistry = createAppRegistry({
    eventBus,
    windowManager,
    mediaEngine,
    fileLayer,
  });
  const kernel = createOSKernel({ eventBus });

  appRegistry.registerApps(createDefaultManifests({ fileLayer, mediaEngine }));

  const shell = createDesktopShell({
    root,
    eventBus,
    appRegistry,
    windowManager,
  });

  const cleanupFns = [];

  cleanupFns.push(
    eventBus.on("shell:power-on-requested", () => {
      void kernel.boot();
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
    eventBus.on("os:state-changed", ({ nextState }) => {
      if (nextState === OS_STATES.POWER_OFF) {
        windowManager.closeAll();
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
