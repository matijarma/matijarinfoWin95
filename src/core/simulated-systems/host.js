function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === "function";
}

function getWindowHistory() {
  if (typeof window === "undefined" || !window.history) {
    return null;
  }

  return window.history;
}

function getWindowLocation() {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }

  return window.location;
}

function normalizeCleanup(mountResult) {
  if (typeof mountResult === "function") {
    return mountResult;
  }

  if (
    mountResult &&
    typeof mountResult === "object" &&
    typeof mountResult.unmount === "function"
  ) {
    return () => mountResult.unmount();
  }

  return null;
}

export function createSimulatedSystemsHost({
  root,
  registry,
  mountSystem,
  onSystemChanged,
  historyRef = getWindowHistory(),
  locationRef = getWindowLocation(),
} = {}) {
  if (!root) {
    throw new Error("createSimulatedSystemsHost requires a root node.");
  }

  if (!registry || typeof registry.resolveSystem !== "function") {
    throw new Error("createSimulatedSystemsHost requires a registry with resolveSystem.");
  }

  if (typeof registry.resolveInitialSystem !== "function") {
    throw new Error("createSimulatedSystemsHost requires a registry with resolveInitialSystem.");
  }

  if (typeof mountSystem !== "function") {
    throw new Error("createSimulatedSystemsHost requires a mountSystem callback.");
  }

  let activeSystem = null;
  let activeCleanup = null;
  let destroyed = false;
  let switchQueue = Promise.resolve();

  function setRootDataset(system) {
    if (!root.dataset) {
      return;
    }

    if (!system) {
      delete root.dataset.systemId;
      delete root.dataset.systemFamily;
      return;
    }

    root.dataset.systemId = system.id;
    root.dataset.systemFamily = system.family;
  }

  function syncUrlSystemQueryParam(systemId) {
    if (!historyRef || !locationRef || typeof URL === "undefined") {
      return;
    }

    try {
      const nextUrl = new URL(locationRef.href);
      if (nextUrl.searchParams.get("system") === systemId) {
        return;
      }

      nextUrl.searchParams.set("system", systemId);
      historyRef.replaceState(historyRef.state, "", nextUrl);
    } catch (error) {
      console.error("Failed to sync system query param.", error);
    }
  }

  async function unmountActiveSystem() {
    const cleanup = activeCleanup;
    activeCleanup = null;
    activeSystem = null;
    setRootDataset(null);

    if (typeof cleanup !== "function") {
      return;
    }

    const result = cleanup();
    if (isPromiseLike(result)) {
      await result;
    }
  }

  async function performSwitch(targetSystem, options = {}) {
    if (destroyed) {
      throw new Error("Cannot switch simulated systems after host destruction.");
    }

    const nextSystem =
      typeof targetSystem === "string"
        ? registry.resolveSystem(targetSystem)
        : registry.resolveSystem(targetSystem?.id);

    if (!nextSystem) {
      throw new Error(`Unknown simulated system "${targetSystem}".`);
    }

    if (!options.forceRemount && activeSystem?.id === nextSystem.id) {
      if (options.syncUrl !== false) {
        syncUrlSystemQueryParam(nextSystem.id);
      }
      return nextSystem;
    }

    await unmountActiveSystem();

    const requestSystemSwitch = (nextSystemIdOrAlias, switchOptions = {}) =>
      switchSystem(nextSystemIdOrAlias, {
        ...switchOptions,
        source: switchOptions.source || "runtime-callback",
      });

    const mountResult = await mountSystem({
      root,
      system: nextSystem,
      requestSystemSwitch,
      switchContext: options.context || null,
    });

    activeSystem = nextSystem;
    activeCleanup = normalizeCleanup(mountResult);
    setRootDataset(nextSystem);

    if (options.syncUrl !== false) {
      syncUrlSystemQueryParam(nextSystem.id);
    }

    onSystemChanged?.({
      system: nextSystem,
      source: options.source || "runtime-switch",
    });

    return nextSystem;
  }

  function enqueueSwitch(task) {
    const queued = switchQueue.then(task, task);
    switchQueue = queued.catch(() => {});
    return queued;
  }

  function switchSystem(nextSystemIdOrAlias, options = {}) {
    return enqueueSwitch(() => performSwitch(nextSystemIdOrAlias, options));
  }

  function mountInitial({
    syncUrl = true,
    source,
    search,
    isMobileDevice,
    defaultDesktopSystemId,
    defaultMobileSystemId,
  } = {}) {
    const resolution = registry.resolveInitialSystem({
      search,
      isMobileDevice,
      defaultDesktopSystemId,
      defaultMobileSystemId,
    });

    return switchSystem(resolution.system.id, {
      syncUrl,
      source: source || resolution.source,
    }).then((system) => ({
      ...resolution,
      system,
    }));
  }

  function getActiveSystem() {
    return activeSystem;
  }

  function destroy() {
    return enqueueSwitch(async () => {
      destroyed = true;
      await unmountActiveSystem();
    });
  }

  return {
    mountInitial,
    switchSystem,
    getActiveSystem,
    destroy,
  };
}
