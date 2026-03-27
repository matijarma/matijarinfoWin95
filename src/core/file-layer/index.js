const SUPPORTED_OS_KEYS = Object.freeze(["win95", "winxp", "linux"]);
const DEFAULT_CONFIG_URL = new URL("./mock-file-system.json", import.meta.url).toString();
const DEFAULT_MISSING_FILE_TEMPLATE = [
  "[SIMULATED FILE]",
  "Path: {{path}}",
  "OS: {{os}}",
  "Partition: {{partitionId}}",
  "",
  "This file is virtual-only in the mock filesystem.",
].join("\n");

const DEFAULT_DOCUMENTS = Object.freeze([
  Object.freeze({
    id: "welcome-note",
    name: "WELCOME.TXT",
    content:
      "Welcome to my portfolio OS simulation. This layer hosts virtual drives and JSON-controlled file access rules.",
  }),
]);

const FALLBACK_FILE_SYSTEM_CONFIG = Object.freeze({
  version: 1,
  missingBehavior: {
    file: {
      mode: "simulate",
      template: DEFAULT_MISSING_FILE_TEMPLATE,
    },
    directory: {
      mode: "simulate-empty",
    },
  },
  partitions: [
    {
      id: "sys-c-win95",
      label: "WIN95",
      volumeName: "WIN95",
      fileSystem: "fat32",
      sizeLabel: "2.0 GB",
      devicePath: "/dev/sda1",
      displayOrder: 1,
      mounts: {
        win95: "C:/",
        winxp: "C:/",
        linux: "/mnt/c",
      },
      tree: {
        type: "directory",
        children: [
          {
            type: "file",
            name: "WELCOME.TXT",
            access: {
              type: "inline-text",
              content:
                "Fallback filesystem loaded. The JSON configuration file was unavailable.",
            },
          },
        ],
      },
    },
  ],
});

function normalizeOsKey(candidate) {
  const rawToken = String(candidate || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");

  if (!rawToken) {
    return "win95";
  }

  if (rawToken.startsWith("desktop-")) {
    return normalizeOsKey(rawToken.slice("desktop-".length));
  }

  if (rawToken === "win95" || rawToken === "windows95" || rawToken === "windows-95") {
    return "win95";
  }

  if (
    rawToken === "winxp" ||
    rawToken === "windowsxp" ||
    rawToken === "windows-xp" ||
    rawToken.includes("xp")
  ) {
    return "winxp";
  }

  if (rawToken === "linux" || rawToken.includes("ubuntu")) {
    return "linux";
  }

  return "win95";
}

function normalizeWindowsPath(pathInput) {
  const sanitizedPath = String(pathInput || "")
    .trim()
    .replaceAll("\\", "/");

  if (!sanitizedPath) {
    return null;
  }

  const match = /^([a-z]):(?:\/(.*))?$/i.exec(sanitizedPath);

  if (!match) {
    return null;
  }

  const driveToken = `${match[1].toUpperCase()}:`;
  const restSegments = String(match[2] || "")
    .split("/")
    .filter(Boolean);

  if (restSegments.length === 0) {
    return `${driveToken}/`;
  }

  return `${driveToken}/${restSegments.join("/")}`;
}

function normalizeLinuxPath(pathInput) {
  const sanitizedPath = String(pathInput || "")
    .trim()
    .replaceAll("\\", "/");

  if (!sanitizedPath) {
    return null;
  }

  const withLeadingSlash = sanitizedPath.startsWith("/") ? sanitizedPath : `/${sanitizedPath}`;
  const inputSegments = withLeadingSlash.split("/").filter(Boolean);
  const normalizedSegments = [];

  for (const segment of inputSegments) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (normalizedSegments.length > 0) {
        normalizedSegments.pop();
      }
      continue;
    }

    normalizedSegments.push(segment);
  }

  if (normalizedSegments.length === 0) {
    return "/";
  }

  return `/${normalizedSegments.join("/")}`;
}

function normalizePathForOs(osKey, pathInput) {
  const resolvedOs = normalizeOsKey(osKey);

  if (resolvedOs === "linux") {
    return normalizeLinuxPath(pathInput);
  }

  return normalizeWindowsPath(pathInput);
}

function normalizeMountPathForOs(osKey, mountPathInput) {
  const normalized = normalizePathForOs(osKey, mountPathInput);

  if (!normalized) {
    return null;
  }

  if (normalizeOsKey(osKey) !== "linux" && /^[A-Z]:\/?$/.test(normalized)) {
    return `${normalized.slice(0, 2)}/`;
  }

  return normalized;
}

function isPathInsideMount(osKey, normalizedPath, mountPath) {
  if (normalizedPath === mountPath) {
    return true;
  }

  if (normalizeOsKey(osKey) === "linux") {
    return normalizedPath.startsWith(`${mountPath}/`);
  }

  return normalizedPath.startsWith(mountPath);
}

function getRelativePathFromMount(osKey, normalizedPath, mountPath) {
  if (normalizedPath === mountPath) {
    return "";
  }

  if (normalizeOsKey(osKey) === "linux") {
    return normalizedPath.slice(mountPath.length + 1);
  }

  return normalizedPath.slice(mountPath.length);
}

function joinPath(osKey, mountPath, relativeSegments = []) {
  const resolvedOs = normalizeOsKey(osKey);

  if (!Array.isArray(relativeSegments) || relativeSegments.length === 0) {
    return mountPath;
  }

  if (resolvedOs === "linux") {
    return `${mountPath}/${relativeSegments.join("/")}`;
  }

  const mountPrefix = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  return `${mountPrefix}/${relativeSegments.join("/")}`;
}

function findChildNode(directoryNode, segment) {
  if (!directoryNode || directoryNode.type !== "directory") {
    return null;
  }

  const exactMatch = directoryNode.children.find((child) => child.name === segment);
  if (exactMatch) {
    return exactMatch;
  }

  const loweredSegment = segment.toLowerCase();
  return (
    directoryNode.children.find((child) => child.name.toLowerCase() === loweredSegment) || null
  );
}

function resolveNodeWithinPartition(partitionRecord, relativeSegments = []) {
  if (!partitionRecord || !partitionRecord.tree) {
    return null;
  }

  let currentNode = partitionRecord.tree;

  for (const segment of relativeSegments) {
    if (currentNode.type !== "directory") {
      return null;
    }

    const nextNode = findChildNode(currentNode, segment);

    if (!nextNode) {
      return null;
    }

    currentNode = nextNode;
  }

  return currentNode;
}

function isLikelyFilePath(pathValue) {
  const normalizedPath = String(pathValue || "");
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const leaf = pathSegments[pathSegments.length - 1] || "";
  return leaf.includes(".") && !leaf.endsWith(".");
}

function renderTemplate(template, variables = {}) {
  let output = String(template || DEFAULT_MISSING_FILE_TEMPLATE);

  for (const [key, value] of Object.entries(variables)) {
    output = output.replaceAll(`{{${key}}}`, String(value ?? ""));
  }

  return output;
}

function formatFileSystemLabel(fileSystem) {
  const normalized = String(fileSystem || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "UnknownFS";
  }

  if (normalized === "fat32") {
    return "FAT32";
  }

  if (normalized === "ntfs") {
    return "NTFS";
  }

  if (normalized === "ext4") {
    return "ext4";
  }

  if (normalized === "exfat") {
    return "exFAT";
  }

  return normalized.toUpperCase();
}

function normalizeAccessRule(accessRule) {
  if (!accessRule || typeof accessRule !== "object") {
    return null;
  }

  return {
    ...accessRule,
    type: String(accessRule.type || "").trim().toLowerCase(),
  };
}

function normalizeTreeNode(rawNode, { isRoot = false } = {}) {
  const rawType = String(rawNode?.type || (isRoot ? "directory" : ""))
    .trim()
    .toLowerCase();
  const nodeType = rawType === "file" ? "file" : "directory";
  const rawName = isRoot ? "/" : String(rawNode?.name || "").trim();

  if (!isRoot && !rawName) {
    return null;
  }

  const normalizedNode = {
    id: typeof rawNode?.id === "string" ? rawNode.id : null,
    name: rawName || "/",
    type: nodeType,
    iconKey:
      typeof rawNode?.iconKey === "string" && rawNode.iconKey.trim()
        ? rawNode.iconKey.trim()
        : nodeType === "directory"
          ? "folder"
          : "document",
    description:
      typeof rawNode?.description === "string" ? rawNode.description : null,
    access: nodeType === "file" ? normalizeAccessRule(rawNode?.access) : null,
    children: [],
  };

  if (nodeType === "directory") {
    const rawChildren = Array.isArray(rawNode?.children) ? rawNode.children : [];
    const usedNames = new Set();

    for (const childNode of rawChildren) {
      const normalizedChild = normalizeTreeNode(childNode, { isRoot: false });

      if (!normalizedChild) {
        continue;
      }

      const childNameKey = normalizedChild.name.toLowerCase();

      if (usedNames.has(childNameKey)) {
        continue;
      }

      usedNames.add(childNameKey);
      normalizedNode.children.push(normalizedChild);
    }
  }

  return normalizedNode;
}

function normalizeMissingBehavior(rawMissingBehavior = {}) {
  const fileMode = String(rawMissingBehavior?.file?.mode || "")
    .trim()
    .toLowerCase();
  const directoryMode = String(rawMissingBehavior?.directory?.mode || "")
    .trim()
    .toLowerCase();

  return {
    file: {
      mode: fileMode === "error" ? "error" : "simulate",
      template:
        typeof rawMissingBehavior?.file?.template === "string" &&
        rawMissingBehavior.file.template.trim().length > 0
          ? rawMissingBehavior.file.template
          : DEFAULT_MISSING_FILE_TEMPLATE,
    },
    directory: {
      mode: directoryMode === "error" ? "error" : "simulate-empty",
    },
  };
}

function normalizePartitionRecord(rawPartition, index) {
  if (!rawPartition || typeof rawPartition !== "object") {
    return null;
  }

  const partitionId = String(rawPartition.id || "").trim();

  if (!partitionId) {
    return null;
  }

  const mounts = {};

  for (const osKey of SUPPORTED_OS_KEYS) {
    const mountPath = normalizeMountPathForOs(osKey, rawPartition?.mounts?.[osKey]);

    if (mountPath) {
      mounts[osKey] = mountPath;
    }
  }

  if (Object.keys(mounts).length === 0) {
    return null;
  }

  const normalizedTree =
    normalizeTreeNode(rawPartition?.tree, { isRoot: true }) ||
    normalizeTreeNode({ type: "directory", children: [] }, { isRoot: true });

  return {
    id: partitionId,
    diskId: typeof rawPartition.diskId === "string" ? rawPartition.diskId : null,
    label:
      typeof rawPartition.label === "string" && rawPartition.label.trim()
        ? rawPartition.label.trim()
        : partitionId,
    volumeName:
      typeof rawPartition.volumeName === "string" && rawPartition.volumeName.trim()
        ? rawPartition.volumeName.trim()
        : partitionId.toUpperCase(),
    devicePath:
      typeof rawPartition.devicePath === "string" && rawPartition.devicePath.trim()
        ? rawPartition.devicePath.trim()
        : null,
    fileSystem:
      typeof rawPartition.fileSystem === "string" && rawPartition.fileSystem.trim()
        ? rawPartition.fileSystem.trim()
        : "unknown",
    sizeLabel:
      typeof rawPartition.sizeLabel === "string" && rawPartition.sizeLabel.trim()
        ? rawPartition.sizeLabel.trim()
        : "n/a",
    displayOrder: Number.isFinite(rawPartition.displayOrder)
      ? Number(rawPartition.displayOrder)
      : index + 1,
    mounts,
    tree: normalizedTree,
  };
}

function buildFileSystemState(config) {
  const rawPartitions = Array.isArray(config?.partitions) ? config.partitions : [];
  const partitions = rawPartitions
    .map((partition, index) => normalizePartitionRecord(partition, index))
    .filter(Boolean)
    .sort((left, right) => left.displayOrder - right.displayOrder);

  const mountRecordsByOs = new Map();

  for (const osKey of SUPPORTED_OS_KEYS) {
    mountRecordsByOs.set(osKey, []);
  }

  for (const partition of partitions) {
    for (const osKey of SUPPORTED_OS_KEYS) {
      const mountPath = partition.mounts[osKey];

      if (!mountPath) {
        continue;
      }

      mountRecordsByOs.get(osKey).push({
        os: osKey,
        mountPath,
        partition,
      });
    }
  }

  for (const osKey of SUPPORTED_OS_KEYS) {
    mountRecordsByOs.get(osKey).sort((left, right) => {
      if (left.mountPath.length !== right.mountPath.length) {
        return right.mountPath.length - left.mountPath.length;
      }

      return left.partition.displayOrder - right.partition.displayOrder;
    });
  }

  return {
    version: Number(config?.version) || 1,
    missingBehavior: normalizeMissingBehavior(config?.missingBehavior),
    partitions,
    mountRecordsByOs,
  };
}

function normalizeDocumentSeeds(seedDocuments) {
  if (!Array.isArray(seedDocuments)) {
    return [...DEFAULT_DOCUMENTS];
  }

  return seedDocuments.filter((entry) => entry && typeof entry === "object");
}

function createDocumentStore(configDocuments, seedDocuments) {
  const mergedEntries = [...normalizeDocumentSeeds(seedDocuments)];

  if (Array.isArray(configDocuments)) {
    for (const configDocument of configDocuments) {
      if (!configDocument || typeof configDocument !== "object") {
        continue;
      }

      const id = String(configDocument.id || "").trim();

      if (!id) {
        continue;
      }

      const nameCandidate = String(configDocument.name || "").trim();
      const pathCandidate = String(configDocument.path || "").trim();
      const contentCandidate = String(configDocument.content || "").trim();

      mergedEntries.push({
        id,
        name: nameCandidate || id,
        content: contentCandidate || (pathCandidate ? `Mapped path: ${pathCandidate}` : ""),
      });
    }
  }

  return new Map(
    mergedEntries.map((documentEntry) => [
      documentEntry.id,
      {
        ...documentEntry,
      },
    ]),
  );
}

async function loadFileSystemConfig(configUrl) {
  const targetUrl = configUrl || DEFAULT_CONFIG_URL;

  if (typeof fetch !== "function") {
    return FALLBACK_FILE_SYSTEM_CONFIG;
  }

  try {
    const response = await fetch(targetUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Unable to load filesystem config: ${response.status}`);
    }

    const parsedConfig = await response.json();

    if (!parsedConfig || typeof parsedConfig !== "object") {
      throw new Error("Filesystem config is not an object.");
    }

    return parsedConfig;
  } catch {
    return FALLBACK_FILE_SYSTEM_CONFIG;
  }
}

function createPartitionSummary(partitionRecord) {
  return {
    id: partitionRecord.id,
    diskId: partitionRecord.diskId,
    label: partitionRecord.label,
    volumeName: partitionRecord.volumeName,
    devicePath: partitionRecord.devicePath,
    fileSystem: formatFileSystemLabel(partitionRecord.fileSystem),
    sizeLabel: partitionRecord.sizeLabel,
    displayOrder: partitionRecord.displayOrder,
  };
}

function formatMountLabel(osKey, partitionRecord, mountPath) {
  if (normalizeOsKey(osKey) === "linux") {
    return `${partitionRecord.volumeName} (${mountPath})`;
  }

  const driveToken = mountPath.slice(0, 2);
  return `${partitionRecord.volumeName} (${driveToken})`;
}

function mapChildEntry({
  osKey,
  partitionRecord,
  mountPath,
  parentRelativeSegments,
  childNode,
}) {
  const childRelativeSegments = [...parentRelativeSegments, childNode.name];
  const childPath = joinPath(osKey, mountPath, childRelativeSegments);
  const accessRule = childNode.type === "file" ? childNode.access : null;

  return {
    id: `${partitionRecord.id}:${childPath}`,
    name: childNode.name,
    label: childNode.name,
    type: childNode.type,
    nodeType: childNode.type,
    path: childPath,
    iconKey:
      childNode.iconKey || (childNode.type === "directory" ? "folder" : "document"),
    simulated: false,
    accessType: accessRule?.type || null,
    launchAppId: accessRule?.type === "launch-app" ? accessRule.appId || null : null,
    launchPayload:
      accessRule?.type === "launch-app" && accessRule.launchPayload
        ? { ...accessRule.launchPayload }
        : undefined,
    partition: createPartitionSummary(partitionRecord),
  };
}

function buildSimulatedFileContent(missingBehavior, context = {}) {
  return renderTemplate(missingBehavior.file.template, {
    path: context.path || "",
    os: context.os || "",
    partitionId: context.partitionId || "unknown",
  });
}

function resolvePartitionPath({
  osKey,
  path,
  mountRecordsByOs,
}) {
  const resolvedOs = normalizeOsKey(osKey);
  const normalizedPath = normalizePathForOs(resolvedOs, path);

  if (!normalizedPath) {
    return null;
  }

  const mountRecords = mountRecordsByOs.get(resolvedOs) || [];
  const mountRecord = mountRecords.find((candidate) =>
    isPathInsideMount(resolvedOs, normalizedPath, candidate.mountPath),
  );

  if (!mountRecord) {
    return null;
  }

  const relativePath = getRelativePathFromMount(resolvedOs, normalizedPath, mountRecord.mountPath);
  const relativeSegments = relativePath ? relativePath.split("/").filter(Boolean) : [];

  return {
    os: resolvedOs,
    normalizedPath,
    mountPath: mountRecord.mountPath,
    partition: mountRecord.partition,
    relativeSegments,
  };
}

async function readHostFileText(hostPath) {
  if (typeof hostPath !== "string" || hostPath.trim().length === 0) {
    return {
      ok: false,
      error: "host-file mapping is missing the path field.",
    };
  }

  const normalizedPath = hostPath.trim();

  try {
    const response = await fetch(normalizedPath, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Failed to fetch ${normalizedPath} (${response.status}).`,
      };
    }

    return {
      ok: true,
      text: await response.text(),
      mimeType: response.headers.get("content-type") || "text/plain",
      hostPath: normalizedPath,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown fetch error.",
    };
  }
}

export async function createFileLayer({
  seedDocuments = DEFAULT_DOCUMENTS,
  configUrl = DEFAULT_CONFIG_URL,
  configOverride,
} = {}) {
  const rawConfig =
    configOverride && typeof configOverride === "object"
      ? configOverride
      : await loadFileSystemConfig(configUrl);
  const fileSystemState = buildFileSystemState(rawConfig);
  const documents = createDocumentStore(rawConfig?.documents, seedDocuments);

  function listDocuments() {
    return Array.from(documents.values()).map((documentEntry) => ({
      ...documentEntry,
    }));
  }

  function getDocument(documentId) {
    const documentEntry = documents.get(documentId);
    return documentEntry ? { ...documentEntry } : null;
  }

  function upsertDocument(documentEntry) {
    if (!documentEntry?.id) {
      throw new Error("upsertDocument requires a document object with an id.");
    }

    documents.set(documentEntry.id, { ...documentEntry });
    return getDocument(documentEntry.id);
  }

  function listMountRoots({ os = "win95" } = {}) {
    const osKey = normalizeOsKey(os);
    const mountRecords = fileSystemState.mountRecordsByOs.get(osKey) || [];
    const sortedRecords = [...mountRecords].sort(
      (left, right) => left.partition.displayOrder - right.partition.displayOrder,
    );

    return sortedRecords.map(({ mountPath, partition }) => ({
      id: `mount:${osKey}:${partition.id}`,
      name: partition.volumeName,
      label: formatMountLabel(osKey, partition, mountPath),
      type: "mount",
      nodeType: "mount",
      path: mountPath,
      iconKey: "drive_hdd",
      os: osKey,
      mountPath,
      partition: createPartitionSummary(partition),
    }));
  }

  function listDirectory({ os = "win95", path } = {}) {
    const osKey = normalizeOsKey(os);

    if (typeof path !== "string" || !path.trim()) {
      return {
        os: osKey,
        path: null,
        simulated: false,
        partition: null,
        entries: listMountRoots({ os: osKey }),
      };
    }

    const resolvedPath = resolvePartitionPath({
      osKey,
      path,
      mountRecordsByOs: fileSystemState.mountRecordsByOs,
    });

    if (!resolvedPath) {
      return null;
    }

    const targetNode = resolveNodeWithinPartition(
      resolvedPath.partition,
      resolvedPath.relativeSegments,
    );

    if (!targetNode) {
      if (fileSystemState.missingBehavior.directory.mode === "simulate-empty") {
        return {
          os: osKey,
          path: resolvedPath.normalizedPath,
          simulated: true,
          partition: createPartitionSummary(resolvedPath.partition),
          entries: [],
        };
      }

      return null;
    }

    if (targetNode.type !== "directory") {
      return null;
    }

    const entries = targetNode.children
      .map((childNode) =>
        mapChildEntry({
          osKey,
          partitionRecord: resolvedPath.partition,
          mountPath: resolvedPath.mountPath,
          parentRelativeSegments: resolvedPath.relativeSegments,
          childNode,
        }),
      )
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "directory" ? -1 : 1;
        }

        return left.label.localeCompare(right.label);
      });

    return {
      os: osKey,
      path: resolvedPath.normalizedPath,
      simulated: false,
      partition: createPartitionSummary(resolvedPath.partition),
      entries,
    };
  }

  function inspectPath({ os = "win95", path } = {}) {
    const osKey = normalizeOsKey(os);
    const resolvedPath = resolvePartitionPath({
      osKey,
      path,
      mountRecordsByOs: fileSystemState.mountRecordsByOs,
    });

    if (!resolvedPath) {
      return null;
    }

    const targetNode = resolveNodeWithinPartition(
      resolvedPath.partition,
      resolvedPath.relativeSegments,
    );

    if (!targetNode) {
      return null;
    }

    return {
      os: osKey,
      path: resolvedPath.normalizedPath,
      type: targetNode.type,
      nodeType: targetNode.type,
      name: targetNode.name,
      iconKey: targetNode.iconKey,
      accessType: targetNode.access?.type || null,
      launchAppId:
        targetNode.access?.type === "launch-app" ? targetNode.access.appId || null : null,
      launchPayload:
        targetNode.access?.type === "launch-app" && targetNode.access.launchPayload
          ? { ...targetNode.access.launchPayload }
          : undefined,
      partition: createPartitionSummary(resolvedPath.partition),
    };
  }

  async function accessPath({ os = "win95", path } = {}) {
    const osKey = normalizeOsKey(os);
    const resolvedPath = resolvePartitionPath({
      osKey,
      path,
      mountRecordsByOs: fileSystemState.mountRecordsByOs,
    });

    if (!resolvedPath) {
      return {
        kind: "missing",
        os: osKey,
        path: typeof path === "string" ? path : "",
        reason: "Path is not mapped to any mounted partition.",
      };
    }

    const targetNode = resolveNodeWithinPartition(
      resolvedPath.partition,
      resolvedPath.relativeSegments,
    );
    const partitionSummary = createPartitionSummary(resolvedPath.partition);

    if (targetNode && targetNode.type === "directory") {
      return {
        kind: "directory",
        os: osKey,
        path: resolvedPath.normalizedPath,
        partition: partitionSummary,
        listing: listDirectory({
          os: osKey,
          path: resolvedPath.normalizedPath,
        }),
      };
    }

    if (targetNode && targetNode.type === "file") {
      const accessRule = targetNode.access;

      if (accessRule?.type === "launch-app") {
        return {
          kind: "action",
          actionType: "launch-app",
          os: osKey,
          path: resolvedPath.normalizedPath,
          appId: accessRule.appId || null,
          launchPayload: accessRule.launchPayload ? { ...accessRule.launchPayload } : undefined,
          partition: partitionSummary,
        };
      }

      if (accessRule?.type === "host-file") {
        const hostFileResult = await readHostFileText(accessRule.path);

        if (hostFileResult.ok) {
          return {
            kind: "file",
            os: osKey,
            path: resolvedPath.normalizedPath,
            name: targetNode.name,
            content: hostFileResult.text,
            source: "host-file",
            simulated: false,
            hostPath: hostFileResult.hostPath,
            mimeType: hostFileResult.mimeType,
            partition: partitionSummary,
          };
        }

        return {
          kind: "file",
          os: osKey,
          path: resolvedPath.normalizedPath,
          name: targetNode.name,
          content: [
            buildSimulatedFileContent(fileSystemState.missingBehavior, {
              path: resolvedPath.normalizedPath,
              os: osKey,
              partitionId: resolvedPath.partition.id,
            }),
            "",
            `Host file error: ${hostFileResult.error}`,
          ].join("\n"),
          source: "host-file-fallback",
          simulated: true,
          hostPath: accessRule.path || "",
          mimeType: "text/plain",
          partition: partitionSummary,
        };
      }

      if (accessRule?.type === "inline-text") {
        return {
          kind: "file",
          os: osKey,
          path: resolvedPath.normalizedPath,
          name: targetNode.name,
          content: String(accessRule.content || ""),
          source: "inline-text",
          simulated: Boolean(accessRule.simulated),
          mimeType: "text/plain",
          partition: partitionSummary,
        };
      }

      if (accessRule?.type === "simulate") {
        return {
          kind: "file",
          os: osKey,
          path: resolvedPath.normalizedPath,
          name: targetNode.name,
          content:
            typeof accessRule.content === "string" && accessRule.content.length > 0
              ? accessRule.content
              : buildSimulatedFileContent(fileSystemState.missingBehavior, {
                  path: resolvedPath.normalizedPath,
                  os: osKey,
                  partitionId: resolvedPath.partition.id,
                }),
          source: "simulate",
          simulated: true,
          mimeType: "text/plain",
          partition: partitionSummary,
        };
      }

      return {
        kind: "file",
        os: osKey,
        path: resolvedPath.normalizedPath,
        name: targetNode.name,
        content: buildSimulatedFileContent(fileSystemState.missingBehavior, {
          path: resolvedPath.normalizedPath,
          os: osKey,
          partitionId: resolvedPath.partition.id,
        }),
        source: "default-simulated",
        simulated: true,
        mimeType: "text/plain",
        partition: partitionSummary,
      };
    }

    if (fileSystemState.missingBehavior.file.mode === "simulate" || isLikelyFilePath(path)) {
      return {
        kind: "file",
        os: osKey,
        path: resolvedPath.normalizedPath,
        name: resolvedPath.relativeSegments[resolvedPath.relativeSegments.length - 1] || "UNTITLED.TXT",
        content: buildSimulatedFileContent(fileSystemState.missingBehavior, {
          path: resolvedPath.normalizedPath,
          os: osKey,
          partitionId: resolvedPath.partition.id,
        }),
        source: "missing-simulated",
        simulated: true,
        mimeType: "text/plain",
        partition: partitionSummary,
      };
    }

    return {
      kind: "missing",
      os: osKey,
      path: resolvedPath.normalizedPath,
      reason: "Path is missing and missing-file simulation is disabled.",
      partition: partitionSummary,
    };
  }

  return {
    version: fileSystemState.version,
    listDocuments,
    getDocument,
    upsertDocument,
    listMountRoots,
    listDirectory,
    inspectPath,
    accessPath,
    normalizeOsKey,
  };
}
