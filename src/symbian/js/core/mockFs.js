const STORAGE_KEY = "uiq3_mock_fs_v3";

const DEFAULT_FS = Object.freeze({
  "C:": {
    Documents: {
      "todo.txt": "- Buy milk\n- Backup SIM contacts\n- Charge battery",
    },
    Notes: {
      "quicknote.txt":
        "UIQ demo note: wheel navigation works with mouse scroll and arrows.",
    },
    Music: {
      "Track 01.mp3": "[binary audio stream]",
      "Track 02.mp3": "[binary audio stream]",
    },
    System: {
      "readme.txt": "System data. Do not edit manually.",
    },
  },
  "E:": {
    Photos: {
      "IMG0001.jpg": "[photo data]",
      "IMG0002.jpg": "[photo data]",
    },
    Videos: {
      "clip01.3gp": "[video data]",
    },
    Downloads: {
      "Map.tile": "[cached map tile]",
    },
  },
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function splitPath(path) {
  if (!path) {
    return [];
  }

  return path
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parentPath(path) {
  const parts = splitPath(path);
  parts.pop();
  return parts.join("/");
}

function basename(path) {
  const parts = splitPath(path);
  return parts[parts.length - 1] || "";
}

function normalizeDriveKey(pathValue, fallbackIndex = 0) {
  const normalizedPath = String(pathValue || "")
    .trim()
    .replace(/\\/g, "/");
  const match = /^([a-z]):/i.exec(normalizedPath);
  if (match) {
    return `${match[1].toUpperCase()}:`;
  }

  return `V${fallbackIndex + 1}:`;
}

function isDirectoryValue(value) {
  return Boolean(value) && typeof value === "object";
}

function normalizeSeedData(seedData) {
  if (!seedData || typeof seedData !== "object" || Array.isArray(seedData)) {
    return clone(DEFAULT_FS);
  }

  return clone(seedData);
}

async function readFileLayerText(fileLayer, { os, path }) {
  if (!fileLayer || typeof fileLayer.accessPath !== "function") {
    return "[File layer unavailable]";
  }

  const access = await fileLayer.accessPath({ os, path });
  if (!access) {
    return `[Unavailable file]\nPath: ${path}`;
  }

  if (access.kind === "file") {
    return String(access.content || "");
  }

  if (access.kind === "action") {
    return [
      "[Linked Action]",
      `Path: ${path}`,
      `Action: ${access.actionType || "unknown"}`,
      `App: ${access.appId || "n/a"}`,
    ].join("\n");
  }

  if (access.kind === "directory") {
    return `[Directory]\nPath: ${path}`;
  }

  return `[Missing]\nPath: ${path}\n${access.reason || "No reason provided."}`;
}

async function buildDirectoryFromLayer(fileLayer, { os, path }) {
  const listing = fileLayer.listDirectory({ os, path });
  if (!listing || !Array.isArray(listing.entries)) {
    return {};
  }

  const directory = {};

  for (const entry of listing.entries) {
    if (!entry?.name || !entry?.path) {
      continue;
    }

    if (entry.type === "directory") {
      directory[entry.name] = await buildDirectoryFromLayer(fileLayer, {
        os,
        path: entry.path,
      });
      continue;
    }

    directory[entry.name] = await readFileLayerText(fileLayer, {
      os,
      path: entry.path,
    });
  }

  return directory;
}

export async function buildMockFileSystemFromFileLayer({
  fileLayer,
  os = "winxp",
} = {}) {
  if (!fileLayer || typeof fileLayer.listMountRoots !== "function") {
    return clone(DEFAULT_FS);
  }

  const mountRoots = fileLayer.listMountRoots({ os });
  if (!Array.isArray(mountRoots) || mountRoots.length === 0) {
    return clone(DEFAULT_FS);
  }

  const nextFs = {};

  for (let index = 0; index < mountRoots.length; index += 1) {
    const mount = mountRoots[index];
    const driveKey = normalizeDriveKey(mount?.path, index);
    nextFs[driveKey] = await buildDirectoryFromLayer(fileLayer, {
      os,
      path: mount.path,
    });
  }

  return nextFs;
}

function normalizeConstructorOptions(storageKeyOrOptions = STORAGE_KEY, options = {}) {
  if (
    storageKeyOrOptions &&
    typeof storageKeyOrOptions === "object" &&
    !Array.isArray(storageKeyOrOptions)
  ) {
    return {
      storageKey: storageKeyOrOptions.storageKey || STORAGE_KEY,
      persist: storageKeyOrOptions.persist !== false,
      seedData: storageKeyOrOptions.seedData || DEFAULT_FS,
    };
  }

  return {
    storageKey: storageKeyOrOptions || STORAGE_KEY,
    persist: options.persist !== false,
    seedData: options.seedData || DEFAULT_FS,
  };
}

export class MockFileSystem {
  constructor(storageKeyOrOptions = STORAGE_KEY, options = {}) {
    const resolved = normalizeConstructorOptions(storageKeyOrOptions, options);
    this.storageKey = resolved.storageKey;
    this.persist = resolved.persist;
    this.defaults = normalizeSeedData(resolved.seedData);
    this.data = this.#load();
  }

  #load() {
    if (!this.persist || !this.storageKey) {
      return clone(this.defaults);
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return clone(this.defaults);
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return clone(this.defaults);
      }

      return parsed;
    } catch {
      return clone(this.defaults);
    }
  }

  #save() {
    if (!this.persist || !this.storageKey) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch {
      // Ignore storage quota/access failures and continue in-memory.
    }
  }

  reset() {
    this.data = clone(this.defaults);
    this.#save();
  }

  #getNode(path) {
    const parts = splitPath(path);
    let node = this.data;

    for (const part of parts) {
      if (!isDirectoryValue(node) || !(part in node)) {
        return null;
      }

      node = node[part];
    }

    return node;
  }

  exists(path) {
    return this.#getNode(path) !== null;
  }

  isDirectory(path) {
    const node = this.#getNode(path);
    return isDirectoryValue(node);
  }

  list(path = "") {
    const node = this.#getNode(path);
    if (!isDirectoryValue(node)) {
      return [];
    }

    return Object.entries(node)
      .map(([name, value]) => {
        const cleanPath = path ? `${path}/${name}` : name;
        const type = isDirectoryValue(value) ? "dir" : "file";
        return {
          name,
          path: cleanPath,
          type,
        };
      })
      .sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }

        return a.type === "dir" ? -1 : 1;
      });
  }

  readFile(path) {
    const node = this.#getNode(path);
    if (typeof node === "string") {
      return node;
    }

    return null;
  }

  writeFile(path, content) {
    const parts = splitPath(path);
    if (parts.length < 2) {
      return false;
    }

    const filename = parts.pop();
    const directoryPath = parts.join("/");
    const directory = this.#getNode(directoryPath);

    if (!isDirectoryValue(directory)) {
      return false;
    }

    directory[filename] = String(content);
    this.#save();
    return true;
  }

  mkdir(path) {
    const parts = splitPath(path);
    if (parts.length < 2) {
      return false;
    }

    const folderName = parts.pop();
    const parent = this.#getNode(parts.join("/"));

    if (!isDirectoryValue(parent) || folderName in parent) {
      return false;
    }

    parent[folderName] = {};
    this.#save();
    return true;
  }

  remove(path) {
    const parts = splitPath(path);
    if (parts.length < 2) {
      return false;
    }

    const key = parts.pop();
    const parent = this.#getNode(parts.join("/"));

    if (!isDirectoryValue(parent) || !(key in parent)) {
      return false;
    }

    delete parent[key];
    this.#save();
    return true;
  }

  rename(path, nextName) {
    if (!nextName || /[\\/]/.test(nextName)) {
      return false;
    }

    const oldName = basename(path);
    const parent = this.#getNode(parentPath(path));

    if (!oldName || !isDirectoryValue(parent)) {
      return false;
    }

    if (!(oldName in parent) || nextName in parent) {
      return false;
    }

    parent[nextName] = parent[oldName];
    delete parent[oldName];
    this.#save();
    return true;
  }

  parent(path) {
    return parentPath(path);
  }

  basename(path) {
    return basename(path);
  }
}
