function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === "function";
}

function getWindowLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
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
  storageRef = getWindowLocalStorage(),
  storageKey = "simulated-system-id",
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

  function readPersistedSystemId() {
    if (!storageRef || typeof storageRef.getItem !== "function" || !storageKey) {
      return "";
    }

    try {
      return storageRef.getItem(storageKey) || "";
    } catch (error) {
      console.error("Failed to read persisted simulated system selection.", error);
      return "";
    }
  }

  function persistSystemId(systemId) {
    if (!storageRef || typeof storageRef.setItem !== "function" || !storageKey || !systemId) {
      return;
    }

    try {
      if (
        typeof storageRef.getItem === "function" &&
        storageRef.getItem(storageKey) === systemId
      ) {
        return;
      }

      storageRef.setItem(storageKey, systemId);
    } catch (error) {
      console.error("Failed to persist simulated system selection.", error);
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
      if (options.persist !== false) {
        persistSystemId(nextSystem.id);
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

    if (options.persist !== false) {
      persistSystemId(nextSystem.id);
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
    source,
    search,
    persistedSystemId,
    isMobileDevice,
    defaultDesktopSystemId,
    defaultMobileSystemId,
  } = {}) {
    const nextPersistedSystemId =
      persistedSystemId === undefined ? readPersistedSystemId() : persistedSystemId;

    const resolution = registry.resolveInitialSystem({
      search,
      persistedSystemId: nextPersistedSystemId,
      isMobileDevice,
      defaultDesktopSystemId,
      defaultMobileSystemId,
    });

    return switchSystem(resolution.system.id, {
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
