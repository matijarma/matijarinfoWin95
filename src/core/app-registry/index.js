const REQUIRED_FIELDS = ["id", "title", "window", "createContent"];

export function createAppRegistry({
  eventBus,
  windowManager,
  mediaEngine,
  fileLayer,
} = {}) {
  if (!windowManager) {
    throw new Error("createAppRegistry requires a windowManager instance.");
  }

  const manifestMap = new Map();

  function validateManifest(manifest) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in manifest)) {
        throw new Error(`App manifest is missing required field: ${field}`);
      }
    }

    if (typeof manifest.createContent !== "function") {
      throw new Error("App manifest createContent must be a function.");
    }
  }

  function registerApp(manifest) {
    validateManifest(manifest);
    manifestMap.set(manifest.id, manifest);
    eventBus?.emit("app:registered", { appId: manifest.id });
  }

  function registerApps(manifests) {
    for (const manifest of manifests) {
      registerApp(manifest);
    }
  }

  function getApp(appId) {
    return manifestMap.get(appId) || null;
  }

  function listApps({ placement, includeHidden = false } = {}) {
    let manifests = Array.from(manifestMap.values());

    if (!includeHidden) {
      manifests = manifests.filter((manifest) => !manifest.hidden);
    }

    if (!placement) {
      return manifests;
    }

    return manifests.filter((manifest) => manifest.placements?.includes(placement));
  }

  function launchApp(appId, launchPayload = {}) {
    const manifest = getApp(appId);

    if (!manifest) {
      eventBus?.emit("app:launch-failed", {
        appId,
        reason: "missing-manifest",
      });
      return null;
    }

    if (manifest.window?.singleInstance) {
      const existingWindow = windowManager
        .listWindows()
        .find((windowRecord) => windowRecord.appId === manifest.id);

      if (existingWindow) {
        if (existingWindow.minimized) {
          windowManager.restoreWindow(existingWindow.id);
        } else {
          windowManager.focusWindow(existingWindow.id);
        }

        eventBus?.emit("app:launch-reused", {
          appId: manifest.id,
          windowId: existingWindow.id,
          launchPayload,
        });

        return existingWindow.id;
      }
    }

    const contentResult = manifest.createContent({
      app: manifest,
      eventBus,
      fileLayer,
      mediaEngine,
      launchPayload,
      launchApp,
      appRegistry: {
        getApp,
        listApps,
        launchApp,
      },
      windowManager,
    });
    const infoPanel =
      typeof manifest.createInfoPanel === "function"
        ? manifest.createInfoPanel({
            app: manifest,
            launchPayload,
            eventBus,
            fileLayer,
            mediaEngine,
          })
        : manifest.infoPanel;

    let content = contentResult;
    let onDispose = null;

    if (
      contentResult &&
      typeof contentResult === "object" &&
      contentResult.element instanceof HTMLElement
    ) {
      content = contentResult.element;
      onDispose =
        typeof contentResult.dispose === "function"
          ? contentResult.dispose
          : null;
    }

    const windowId = windowManager.openWindow({
      appId: manifest.id,
      title: manifest.title,
      width: manifest.window.width,
      height: manifest.window.height,
      minWidth: manifest.window.minWidth,
      minHeight: manifest.window.minHeight,
      resizable: manifest.window.resizable !== false,
      minimizable: manifest.window.minimizable !== false,
      maximizable:
        typeof manifest.window.maximizable === "boolean"
          ? manifest.window.maximizable
          : manifest.window.resizable !== false,
      closable: manifest.window.closable !== false,
      startMaximized: manifest.window.startMaximized === true,
      infoPanel,
      content,
      onDispose,
    });

    eventBus?.emit("app:launched", {
      appId: manifest.id,
      windowId,
    });

    return windowId;
  }

  return {
    registerApp,
    registerApps,
    getApp,
    listApps,
    launchApp,
  };
}
