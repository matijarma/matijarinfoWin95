export class AppManager {
  constructor() {
    this.registry = new Map();
  }

  register(manifest, createApp) {
    if (!manifest?.id) {
      throw new Error("Manifest must include an id.");
    }

    this.registry.set(manifest.id, {
      manifest: { ...manifest },
      createApp,
      instance: null,
      launchedAt: null
    });
  }

  getManifests() {
    return [...this.registry.values()].map((entry) => ({ ...entry.manifest }));
  }

  getManifest(id) {
    const entry = this.registry.get(id);
    return entry ? { ...entry.manifest } : null;
  }

  launch(id, lifecycleContext = null) {
    const entry = this.registry.get(id);
    if (!entry) {
      return null;
    }

    if (!entry.instance) {
      entry.instance = entry.createApp();
      if (entry.instance.onCreate) {
        entry.instance.onCreate(lifecycleContext);
      }
    }

    entry.launchedAt = Date.now();
    if (entry.instance.onActivate) {
      entry.instance.onActivate(lifecycleContext);
    }

    return entry.instance;
  }

  deactivate(id, lifecycleContext = null) {
    const entry = this.registry.get(id);
    if (!entry?.instance?.onPause) {
      return;
    }

    entry.instance.onPause(lifecycleContext);
  }

  terminate(id, lifecycleContext = null) {
    const entry = this.registry.get(id);
    if (!entry?.instance) {
      return;
    }

    if (entry.instance.onClose) {
      entry.instance.onClose(lifecycleContext);
    }

    entry.instance = null;
    entry.launchedAt = null;
  }

  terminateAll(lifecycleContext = null) {
    [...this.registry.keys()].forEach((id) => this.terminate(id, lifecycleContext));
  }

  listRunning() {
    return [...this.registry.entries()]
      .filter(([, entry]) => Boolean(entry.instance))
      .map(([id, entry]) => ({
        id,
        name: entry.manifest.name,
        icon: entry.manifest.icon,
        launchedAt: entry.launchedAt
      }))
      .sort((a, b) => (b.launchedAt || 0) - (a.launchedAt || 0));
  }
}
