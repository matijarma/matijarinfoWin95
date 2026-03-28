import {
  buildBiosPostLines,
  readBiosProfile,
} from "../core/system-preferences/index.js";

const UBUNTU_SYSTEM_ID = "desktop-ubuntu-server";
const SHELL_USER = "matija";
const SHELL_HOSTNAME = "portfolio-server";
const SHELL_START_DIRECTORY = "/";
const KERNEL_SIGNATURE = "Linux portfolio-server 5.15.0-portfolio #1 SMP x86_64 GNU/Linux";
const SHELL_HISTORY_STORAGE_KEY = "ubuntu-server.shell.history.v1";
const SHELL_HISTORY_MAX_ENTRIES = 300;
const LLM_SHELL_ENDPOINT = "https://llmshell.matijar.info";
const LOCAL_FAST_PATH_META_CONTEXT =
  "User just opened the CV locally. Give a 1-sentence snarky sysadmin observation to print to console.";
const LOCAL_COMMANDS = new Set([
  "help",
  "history",
  "clear",
  "date",
  "uptime",
  "whoami",
  "hostname",
  "uname",
  "pwd",
  "cd",
  "ls",
  "cat",
  "open",
  "oslist",
  "boot",
  "reboot",
  "shutdown",
  "poweroff",
  "halt",
  "msconfig",
]);

const INSTALLED_OS_TARGETS = Object.freeze([
  Object.freeze({
    id: "desktop-win95",
    label: "Windows 95",
    aliases: Object.freeze(["win95", "95", "windows95", "windows-95"]),
  }),
  Object.freeze({
    id: "desktop-winxp-sp2",
    label: "Windows XP SP2",
    aliases: Object.freeze(["winxp", "xp", "windowsxp", "windows-xp", "sp2"]),
  }),
  Object.freeze({
    id: "desktop-ubuntu-server",
    label: "Ubuntu Server",
    aliases: Object.freeze(["ubuntu", "ubuntu-server", "linux"]),
  }),
]);

const FILES = Object.freeze({
  "/etc/motd": [
    "Welcome to Ubuntu Server shell mode.",
    "Use `help` to list commands.",
    "Use `oslist` and `boot <target>` to switch operating systems.",
  ].join("\n"),
  "/etc/os-release": [
    'NAME="Ubuntu"',
    'VERSION="22.04.4 LTS (Jammy Jellyfish)"',
    "ID=ubuntu",
    "PRETTY_NAME=\"Ubuntu Server 22.04.4 LTS\"",
  ].join("\n"),
});

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");
}

function resolveOsTarget(candidate) {
  const token = normalizeToken(candidate);

  if (!token) {
    return null;
  }

  for (const entry of INSTALLED_OS_TARGETS) {
    if (token === entry.id || entry.aliases.includes(token)) {
      return entry;
    }
  }

  return null;
}

function formatUptime(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${minutes}m`);
  }

  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function splitCommand(commandText) {
  return String(commandText || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeLinuxPath(pathInput) {
  const sanitized = String(pathInput || "")
    .trim()
    .replaceAll("\\", "/");

  if (!sanitized) {
    return null;
  }

  const withLeadingSlash = sanitized.startsWith("/") ? sanitized : `/${sanitized}`;
  const sourceSegments = withLeadingSlash.split("/").filter(Boolean);
  const normalizedSegments = [];

  for (const segment of sourceSegments) {
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

  return normalizedSegments.length === 0 ? "/" : `/${normalizedSegments.join("/")}`;
}

function resolveLinuxPath(inputPath, currentDirectory = "/") {
  const sourcePath = String(inputPath || "").trim();

  if (!sourcePath || sourcePath === ".") {
    return normalizeLinuxPath(currentDirectory) || "/";
  }

  if (sourcePath === "~") {
    return "/";
  }

  if (sourcePath.startsWith("~/")) {
    return normalizeLinuxPath(`/${sourcePath.slice(2)}`);
  }

  if (sourcePath.startsWith("/")) {
    return normalizeLinuxPath(sourcePath);
  }

  const baseDirectory = normalizeLinuxPath(currentDirectory) || "/";
  return normalizeLinuxPath(
    baseDirectory === "/"
      ? `/${sourcePath}`
      : `${baseDirectory}/${sourcePath}`,
  );
}

function splitLinuxPath(pathInput) {
  const normalizedPath = normalizeLinuxPath(pathInput);

  if (!normalizedPath || normalizedPath === "/") {
    return [];
  }

  return normalizedPath.slice(1).split("/").filter(Boolean);
}

function formatShellPrompt(currentDirectory) {
  const normalizedPath = normalizeLinuxPath(currentDirectory) || "/";
  const displayPath = normalizedPath === `/home/${SHELL_USER}` ? "~" : normalizedPath;
  return `${SHELL_USER}@${SHELL_HOSTNAME}:${displayPath}$`;
}

function getBiosLineDelayMs(line) {
  if (!line) {
    return 220;
  }

  if (line.endsWith("...")) {
    return 190;
  }

  if (line.includes("Memory Test")) {
    return 170;
  }

  return 110;
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

function readShellHistoryFromStorage(storageRef) {
  if (!storageRef || typeof storageRef.getItem !== "function") {
    return [];
  }

  try {
    const rawValue = storageRef.getItem(SHELL_HISTORY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  } catch {
    return [];
  }
}

function writeShellHistoryToStorage(storageRef, historyEntries) {
  if (!storageRef || typeof storageRef.setItem !== "function") {
    return;
  }

  try {
    storageRef.setItem(SHELL_HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
  } catch {
    // Ignore storage write failures in restricted/private sessions.
  }
}

function clampShellHistory(historyEntries) {
  if (!Array.isArray(historyEntries)) {
    return [];
  }

  if (historyEntries.length <= SHELL_HISTORY_MAX_ENTRIES) {
    return historyEntries;
  }

  return historyEntries.slice(-SHELL_HISTORY_MAX_ENTRIES);
}

export function createUbuntuServerShell({
  root,
  fileLayer,
  eventBus,
  windowManager,
  requestSystemSwitch,
  onRequestSystemSwitch,
  switchContext,
} = {}) {
  if (!root) {
    throw new Error("createUbuntuServerShell requires a root element.");
  }

  let disposed = false;
  let bootedAt = 0;
  let activeInput = null;
  let activeOutput = null;
  let currentDirectory = SHELL_START_DIRECTORY;
  const storageRef = getWindowLocalStorage();
  const linuxMountRoots =
    typeof fileLayer?.listMountRoots === "function"
      ? fileLayer.listMountRoots({ os: "linux" })
      : [];
  const linuxMountPaths = linuxMountRoots
    .map((entry) => normalizeLinuxPath(entry.path))
    .filter(Boolean);
  const linuxMountPathsByLength = [...linuxMountPaths].sort(
    (leftPath, rightPath) => rightPath.length - leftPath.length,
  );
  const etcVirtualFiles = new Map(Object.entries(FILES));
  let commandHistory = clampShellHistory(readShellHistoryFromStorage(storageRef));
  let historyNavigationIndex = -1;
  let historyDraftValue = "";
  const cleanupFns = [];
  const activeTimers = new Set();
  const activeIntervals = new Set();
  const llmOverlayFiles = new Map();
  const llmOverlayDirectories = new Set(["/"]);
  const llmDeletedPaths = new Set();
  let localMetaRequestInFlight = false;

  function scheduleTimeout(callback, delayMs) {
    const timerId = window.setTimeout(() => {
      activeTimers.delete(timerId);
      callback();
    }, delayMs);

    activeTimers.add(timerId);
    return timerId;
  }

  function scheduleInterval(callback, delayMs) {
    const intervalId = window.setInterval(callback, delayMs);
    activeIntervals.add(intervalId);
    return intervalId;
  }

  function clearTimers() {
    for (const timerId of activeTimers) {
      clearTimeout(timerId);
    }

    activeTimers.clear();

    for (const intervalId of activeIntervals) {
      clearInterval(intervalId);
    }

    activeIntervals.clear();
  }

  function clearCleanup() {
    while (cleanupFns.length > 0) {
      const cleanupFn = cleanupFns.pop();
      cleanupFn?.();
    }
  }

  function resetView() {
    clearTimers();
    clearCleanup();
    windowManager?.closeAll?.();
    windowManager?.setContainer?.(null);
    activeInput = null;
    activeOutput = null;
  }

  function appendOutputLine(text, variant = "plain") {
    if (!(activeOutput instanceof HTMLElement)) {
      return null;
    }

    const line = document.createElement("div");
    line.className = `ubuntu-shell__line ubuntu-shell__line--${variant}`;
    line.textContent = text;
    activeOutput.append(line);

    if (activeOutput instanceof HTMLElement) {
      activeOutput.scrollTop = activeOutput.scrollHeight;
    }

    return line;
  }

  function appendOutputBlock(text, variant = "plain") {
    const lines = String(text ?? "").split("\n");

    for (const line of lines) {
      appendOutputLine(line, variant);
    }
  }

  function clearTerminalOutput() {
    if (activeOutput instanceof HTMLElement) {
      activeOutput.innerHTML = "";
    }
  }

  function focusInput() {
    if (activeInput instanceof HTMLInputElement) {
      activeInput.focus();
    }
  }

  function placeCursorAtInputEnd() {
    if (!(activeInput instanceof HTMLInputElement)) {
      return;
    }

    const valueLength = activeInput.value.length;
    activeInput.setSelectionRange(valueLength, valueLength);
  }

  function setInputValue(value) {
    if (!(activeInput instanceof HTMLInputElement)) {
      return;
    }

    activeInput.value = value;
    placeCursorAtInputEnd();
  }

  function enforceInputFocus() {
    scheduleTimeout(() => {
      if (!(activeInput instanceof HTMLInputElement)) {
        return;
      }

      activeInput.focus();
      placeCursorAtInputEnd();
    }, 0);
  }

  function resetHistoryNavigationState() {
    historyNavigationIndex = -1;
    historyDraftValue = "";
  }

  function persistHistory() {
    commandHistory = clampShellHistory(commandHistory);
    writeShellHistoryToStorage(storageRef, commandHistory);
  }

  function pushCommandToHistory(commandText) {
    const normalized = String(commandText || "").trim();

    if (!normalized) {
      return;
    }

    commandHistory.push(normalized);
    persistHistory();
    resetHistoryNavigationState();
  }

  function navigateHistory(direction) {
    if (!(activeInput instanceof HTMLInputElement) || commandHistory.length === 0) {
      return;
    }

    if (direction < 0) {
      if (historyNavigationIndex === -1) {
        historyDraftValue = activeInput.value;
        historyNavigationIndex = commandHistory.length - 1;
      } else if (historyNavigationIndex > 0) {
        historyNavigationIndex -= 1;
      }

      setInputValue(commandHistory[historyNavigationIndex] || "");
      return;
    }

    if (direction > 0) {
      if (historyNavigationIndex === -1) {
        return;
      }

      if (historyNavigationIndex < commandHistory.length - 1) {
        historyNavigationIndex += 1;
        setInputValue(commandHistory[historyNavigationIndex] || "");
        return;
      }

      historyNavigationIndex = -1;
      setInputValue(historyDraftValue);
      historyDraftValue = "";
    }
  }

  function getPrompt() {
    return formatShellPrompt(currentDirectory);
  }

  function resolveTargetPath(pathInput) {
    return resolveLinuxPath(pathInput, currentDirectory);
  }

  function getPathBaseName(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath || normalizedPath === "/") {
      return "/";
    }

    const segments = normalizedPath.split("/").filter(Boolean);
    return segments[segments.length - 1] || "/";
  }

  function getParentPath(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath || normalizedPath === "/") {
      return null;
    }

    const segments = normalizedPath.split("/").filter(Boolean);
    segments.pop();
    return segments.length === 0 ? "/" : `/${segments.join("/")}`;
  }

  function isPathDeleted(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath) {
      return false;
    }

    for (const deletedPath of llmDeletedPaths) {
      if (normalizedPath === deletedPath || normalizedPath.startsWith(`${deletedPath}/`)) {
        return true;
      }
    }

    return false;
  }

  function clearDeletedMarkersForPath(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath) {
      return;
    }

    for (const deletedPath of [...llmDeletedPaths]) {
      if (
        normalizedPath === deletedPath ||
        normalizedPath.startsWith(`${deletedPath}/`) ||
        deletedPath.startsWith(`${normalizedPath}/`)
      ) {
        llmDeletedPaths.delete(deletedPath);
      }
    }
  }

  function ensureOverlayDirectory(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath) {
      return;
    }

    if (normalizedPath === "/") {
      llmOverlayDirectories.add("/");
      return;
    }

    const segments = normalizedPath.split("/").filter(Boolean);
    let currentPath = "";

    llmOverlayDirectories.add("/");

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : `/${segment}`;
      llmOverlayDirectories.add(currentPath);
      clearDeletedMarkersForPath(currentPath);
    }
  }

  function markPathDeleted(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath || normalizedPath === "/") {
      return;
    }

    llmDeletedPaths.add(normalizedPath);

    for (const overlayPath of [...llmOverlayFiles.keys()]) {
      if (overlayPath === normalizedPath || overlayPath.startsWith(`${normalizedPath}/`)) {
        llmOverlayFiles.delete(overlayPath);
      }
    }

    for (const directoryPath of [...llmOverlayDirectories]) {
      if (
        directoryPath !== "/" &&
        (directoryPath === normalizedPath || directoryPath.startsWith(`${normalizedPath}/`))
      ) {
        llmOverlayDirectories.delete(directoryPath);
      }
    }
  }

  const runtimeFileSystem = {
    createFile(pathInput, content = "") {
      const normalizedPath = resolveTargetPath(pathInput);

      if (!normalizedPath || normalizedPath === "/") {
        return false;
      }

      clearDeletedMarkersForPath(normalizedPath);
      const parentPath = getParentPath(normalizedPath);

      if (parentPath) {
        ensureOverlayDirectory(parentPath);
      }

      llmOverlayFiles.set(normalizedPath, String(content ?? ""));
      return true;
    },
    writeFile(pathInput, content = "") {
      return this.createFile(pathInput, content);
    },
    appendFile(pathInput, content = "") {
      const normalizedPath = resolveTargetPath(pathInput);

      if (!normalizedPath || normalizedPath === "/") {
        return false;
      }

      clearDeletedMarkersForPath(normalizedPath);
      const existingContent = llmOverlayFiles.get(normalizedPath) || "";
      const parentPath = getParentPath(normalizedPath);

      if (parentPath) {
        ensureOverlayDirectory(parentPath);
      }

      llmOverlayFiles.set(normalizedPath, `${existingContent}${String(content ?? "")}`);
      return true;
    },
    createDirectory(pathInput) {
      const normalizedPath = resolveTargetPath(pathInput);

      if (!normalizedPath) {
        return false;
      }

      clearDeletedMarkersForPath(normalizedPath);
      ensureOverlayDirectory(normalizedPath);
      return true;
    },
    deletePath(pathInput) {
      const normalizedPath = resolveTargetPath(pathInput);

      if (!normalizedPath || normalizedPath === "/") {
        return false;
      }

      markPathDeleted(normalizedPath);
      return true;
    },
    deleteFile(pathInput) {
      return this.deletePath(pathInput);
    },
    deleteDirectory(pathInput) {
      return this.deletePath(pathInput);
    },
    movePath(fromPathInput, toPathInput) {
      const fromPath = resolveTargetPath(fromPathInput);
      const toPath = resolveTargetPath(toPathInput);

      if (!fromPath || !toPath || fromPath === "/" || toPath === "/") {
        return false;
      }

      const existingFileContent = llmOverlayFiles.get(fromPath);
      const hadOverlayDirectory = llmOverlayDirectories.has(fromPath);
      const hadAnyChildren =
        Array.from(llmOverlayFiles.keys()).some((filePath) => filePath.startsWith(`${fromPath}/`)) ||
        Array.from(llmOverlayDirectories).some(
          (directoryPath) => directoryPath !== fromPath && directoryPath.startsWith(`${fromPath}/`),
        );

      if (typeof existingFileContent === "string") {
        this.createFile(toPath, existingFileContent);
        this.deleteFile(fromPath);
        return true;
      }

      if (hadOverlayDirectory || hadAnyChildren) {
        this.createDirectory(toPath);

        for (const [sourcePath, content] of [...llmOverlayFiles.entries()]) {
          if (!sourcePath.startsWith(`${fromPath}/`)) {
            continue;
          }

          const targetPath = `${toPath}${sourcePath.slice(fromPath.length)}`;
          this.createFile(targetPath, content);
        }

        for (const sourcePath of [...llmOverlayDirectories]) {
          if (!sourcePath.startsWith(`${fromPath}/`)) {
            continue;
          }

          const targetPath = `${toPath}${sourcePath.slice(fromPath.length)}`;
          this.createDirectory(targetPath);
        }

        this.deleteDirectory(fromPath);
        return true;
      }

      return false;
    },
  };

  function collectOverlayChildEntries(parentPath) {
    const normalizedParentPath = normalizeLinuxPath(parentPath);

    if (!normalizedParentPath || isPathDeleted(normalizedParentPath)) {
      return [];
    }

    const childEntriesByName = new Map();

    const pushOverlayEntry = (absoluteChildPath, type) => {
      const normalizedChildPath = normalizeLinuxPath(absoluteChildPath);

      if (
        !normalizedChildPath ||
        normalizedChildPath === normalizedParentPath ||
        isPathDeleted(normalizedChildPath)
      ) {
        return;
      }

      const parentPrefix = normalizedParentPath === "/" ? "/" : `${normalizedParentPath}/`;

      if (!normalizedChildPath.startsWith(parentPrefix)) {
        return;
      }

      const relativePath = normalizedChildPath.slice(parentPrefix.length);

      if (!relativePath || relativePath.includes("/")) {
        return;
      }

      childEntriesByName.set(relativePath, {
        id: `llm-overlay:${type}:${normalizedChildPath}`,
        name: relativePath,
        label: relativePath,
        type,
        nodeType: type,
        path: normalizedChildPath,
        source: "llm-overlay",
      });
    };

    for (const directoryPath of llmOverlayDirectories) {
      if (directoryPath === "/") {
        continue;
      }

      pushOverlayEntry(directoryPath, "directory");
    }

    for (const filePath of llmOverlayFiles.keys()) {
      pushOverlayEntry(filePath, "file");
    }

    return Array.from(childEntriesByName.values());
  }

  function mergeDirectoryEntries(absolutePath, baseEntries = []) {
    const mergedEntriesByName = new Map();

    for (const entry of baseEntries) {
      const entryName = entry?.name || entry?.label || "";

      if (!entryName) {
        continue;
      }

      const entryPath = normalizeLinuxPath(entry.path) || resolveLinuxPath(entryName, absolutePath);

      if (!entryPath || isPathDeleted(entryPath)) {
        continue;
      }

      mergedEntriesByName.set(entryName, {
        ...entry,
        path: entryPath,
      });
    }

    for (const overlayEntry of collectOverlayChildEntries(absolutePath)) {
      mergedEntriesByName.set(overlayEntry.name, overlayEntry);
    }

    return Array.from(mergedEntriesByName.values()).sort((left, right) => {
      const leftType = left.nodeType || left.type;
      const rightType = right.nodeType || right.type;

      if (leftType !== rightType) {
        return leftType === "directory" ? -1 : 1;
      }

      return String(left.name || left.label || "").localeCompare(
        String(right.name || right.label || ""),
      );
    });
  }

  function resolveOverlayFileContent(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath || isPathDeleted(normalizedPath)) {
      return null;
    }

    if (llmOverlayFiles.has(normalizedPath)) {
      return llmOverlayFiles.get(normalizedPath);
    }

    return null;
  }

  function buildCurrentDirectorySnapshot(pathInput = currentDirectory) {
    const resolvedListing = resolveDirectoryListing(pathInput);

    if (!resolvedListing) {
      return {
        path: resolveTargetPath(pathInput) || currentDirectory,
        entries: [],
      };
    }

    return {
      path: resolvedListing.path,
      entries: resolvedListing.entries.map((entry) => ({
        name: entry.name || entry.label || "",
        type: entry.nodeType || entry.type || "unknown",
        path: entry.path || null,
      })),
    };
  }

  function emitUiEvent(eventType, payload = {}) {
    if (typeof eventType !== "string" || !eventType.trim()) {
      return false;
    }

    if (typeof eventBus?.emit !== "function") {
      return false;
    }

    eventBus.emit(eventType, payload);
    return true;
  }

  function requestAppLaunch(appId, launchPayload) {
    if (typeof appId !== "string" || !appId.trim()) {
      return false;
    }

    return emitUiEvent("shell:app-launch-requested", {
      appId: appId.trim(),
      launchPayload,
    });
  }

  function createLoadingIndicator() {
    const line = appendOutputLine("[Kernel daemon computing...]", "status");

    if (!(line instanceof HTMLElement)) {
      return () => {};
    }

    let step = 0;
    const intervalId = scheduleInterval(() => {
      if (!line.isConnected) {
        clearInterval(intervalId);
        activeIntervals.delete(intervalId);
        return;
      }

      step = (step + 1) % 4;
      line.textContent = `[Kernel daemon computing${".".repeat(step)}${" ".repeat(3 - step)}]`;

      if (activeOutput instanceof HTMLElement) {
        activeOutput.scrollTop = activeOutput.scrollHeight;
      }
    }, 170);

    return () => {
      clearInterval(intervalId);
      activeIntervals.delete(intervalId);
      line.remove();
    };
  }

  async function parseLlmResponse(response) {
    if (!response?.ok) {
      const failureText = await response.text().catch(() => "");
      const statusCode = response?.status || 502;
      const summary = failureText.trim() || `HTTP ${statusCode}`;
      throw new Error(`LLM endpoint error: ${summary}`);
    }

    let parsedBody = null;

    try {
      parsedBody = await response.json();
    } catch {
      throw new Error("LLM endpoint returned invalid JSON.");
    }

    if (!parsedBody || typeof parsedBody !== "object") {
      throw new Error("LLM endpoint returned an invalid payload.");
    }

    return parsedBody;
  }

  function findOwningMountPath(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath) {
      return null;
    }

    for (const mountPath of linuxMountPathsByLength) {
      if (normalizedPath === mountPath || normalizedPath.startsWith(`${mountPath}/`)) {
        return mountPath;
      }
    }

    return null;
  }

  function collectMountChildDirectoryNames(parentPath) {
    const normalizedParentPath = normalizeLinuxPath(parentPath);

    if (!normalizedParentPath) {
      return [];
    }

    const parentSegments = splitLinuxPath(normalizedParentPath);
    const childNameSet = new Set();

    for (const mountPath of linuxMountPaths) {
      const mountSegments = splitLinuxPath(mountPath);

      if (mountSegments.length <= parentSegments.length) {
        continue;
      }

      let prefixMatches = true;

      for (let index = 0; index < parentSegments.length; index += 1) {
        if (mountSegments[index] !== parentSegments[index]) {
          prefixMatches = false;
          break;
        }
      }

      if (!prefixMatches) {
        continue;
      }

      childNameSet.add(mountSegments[parentSegments.length]);
    }

    return Array.from(childNameSet).sort((leftName, rightName) =>
      leftName.localeCompare(rightName),
    );
  }

  function listVirtualDirectoryEntries(pathInput) {
    const normalizedPath = normalizeLinuxPath(pathInput);

    if (!normalizedPath) {
      return null;
    }

    if (normalizedPath === "/etc") {
      const fileEntries = [];

      for (const absolutePath of etcVirtualFiles.keys()) {
        const pathSegments = absolutePath.split("/").filter(Boolean);
        const fileName = pathSegments[pathSegments.length - 1];

        if (!fileName) {
          continue;
        }

        fileEntries.push({
          name: fileName,
          label: fileName,
          type: "file",
        });
      }

      return fileEntries.sort((left, right) => left.name.localeCompare(right.name));
    }

    const mountChildren = collectMountChildDirectoryNames(normalizedPath);
    const virtualEntries = [];

    if (normalizedPath === "/") {
      virtualEntries.push({
        name: "etc",
        label: "etc",
        type: "directory",
      });
    }

    for (const childName of mountChildren) {
      virtualEntries.push({
        name: childName,
        label: childName,
        type: "directory",
      });
    }

    if (virtualEntries.length === 0) {
      return null;
    }

    return virtualEntries.sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "directory" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
  }

  function resolveDirectoryListing(pathInput) {
    const absolutePath = resolveTargetPath(pathInput);

    if (!absolutePath || isPathDeleted(absolutePath)) {
      return null;
    }

    let baseListing = null;
    const owningMountPath = findOwningMountPath(absolutePath);

    if (owningMountPath && typeof fileLayer?.listDirectory === "function") {
      const directoryListing = fileLayer.listDirectory({
        os: "linux",
        path: absolutePath,
      });

      if (directoryListing) {
        baseListing = {
          path: absolutePath,
          source: "filesystem",
          entries: directoryListing.entries || [],
        };
      }
    }

    if (!baseListing) {
      const virtualEntries = listVirtualDirectoryEntries(absolutePath);

      if (virtualEntries) {
        baseListing = {
          path: absolutePath,
          source: "virtual",
          entries: virtualEntries,
        };
      }
    }

    const mergedEntries = mergeDirectoryEntries(absolutePath, baseListing?.entries || []);
    const hasOverlayDirectory =
      llmOverlayDirectories.has(absolutePath) && !isPathDeleted(absolutePath);

    if (!baseListing && !hasOverlayDirectory && mergedEntries.length === 0) {
      return null;
    }

    return {
      path: absolutePath,
      source: baseListing
        ? hasOverlayDirectory || mergedEntries.length !== (baseListing.entries || []).length
          ? "hybrid"
          : baseListing.source
        : "overlay",
      entries: mergedEntries,
    };
  }

  function formatLsEntries(entries = []) {
    return entries
      .map((entry) => {
        const label = entry.label || entry.name || entry.path || "";
        const typeToken = entry.nodeType || entry.type;
        const isDirectory = typeToken === "directory" || typeToken === "mount";
        return isDirectory ? `${label}/` : label;
      })
      .filter(Boolean)
      .join("  ");
  }

  function requestTargetSystemSwitch(targetEntry) {
    if (!targetEntry) {
      appendOutputLine("Missing target operating system.", "error");
      return;
    }

    if (targetEntry.id === UBUNTU_SYSTEM_ID) {
      appendOutputLine("Rebooting Ubuntu Server...", "status");
      scheduleTimeout(() => {
        if (!disposed) {
          startPowerOnSequence({ autoContinueBios: false });
        }
      }, 260);
      return;
    }

    appendOutputLine(`Rebooting into ${targetEntry.label}...`, "status");

    if (typeof requestSystemSwitch === "function") {
      scheduleTimeout(() => {
        if (disposed) {
          return;
        }

        requestSystemSwitch(targetEntry.id, {
          source: "ubuntu-shell-command",
          context: {
            autoBoot: false,
            reboot: true,
          },
          forceRemount: true,
        });
      }, 320);
      return;
    }

    if (typeof onRequestSystemSwitch === "function") {
      scheduleTimeout(() => {
        if (disposed) {
          return;
        }

        onRequestSystemSwitch({
          targetSystemId: targetEntry.id,
          sourceDesktopProfileId: "ubuntu-server",
        });
      }, 320);
      return;
    }

    appendOutputLine("System switch callback is unavailable.", "error");
  }

  function printHelp() {
    appendOutputLine("Available commands:", "status");
    appendOutputLine("help                 Show this command list");
    appendOutputLine("history              Show persisted command history");
    appendOutputLine("clear                Clear terminal output");
    appendOutputLine("date                 Show current date and time");
    appendOutputLine("uptime               Show shell uptime");
    appendOutputLine("whoami               Show active user");
    appendOutputLine("hostname             Show host name");
    appendOutputLine("uname [-a]           Show kernel signature");
    appendOutputLine("pwd                  Show current directory");
    appendOutputLine("cd [path]            Change directory");
    appendOutputLine("ls [path]            List available entries");
    appendOutputLine("cat <file>           Show file content");
    appendOutputLine("open <path|url>      Open file, folder, or URL in GUI app layer");
    appendOutputLine("oslist               List installed operating systems");
    appendOutputLine("boot <target>        Reboot into target (win95, winxp, ubuntu)");
    appendOutputLine("reboot [target]      Reboot current or target OS");
    appendOutputLine("shutdown             Halt system and return to power screen");
    appendOutputLine("");
    appendOutputLine("Unknown commands automatically route to llmshell.matijar.info.", "status");
    appendOutputLine("");
    appendOutputLine("Linux mounts from mock filesystem:", "status");

    for (const mountRoot of linuxMountRoots) {
      appendOutputLine(`- ${mountRoot.path} -> ${mountRoot.partition?.volumeName || "volume"}`);
    }
  }

  function printInstalledOs() {
    appendOutputLine("Installed operating systems:", "status");

    for (const entry of INSTALLED_OS_TARGETS) {
      const token = entry.aliases[0] || entry.id;
      const currentMark = entry.id === UBUNTU_SYSTEM_ID ? " (current)" : "";
      appendOutputLine(`- ${token}: ${entry.label}${currentMark}`);
    }

    appendOutputLine("Use: boot <target>");
  }

  async function handleOpenCommand(args = []) {
    const targetInput = String(args[0] || "").trim();

    if (!targetInput) {
      appendOutputLine("open: missing target path or URL", "error");
      return false;
    }

    if (/^https?:\/\//i.test(targetInput)) {
      if (!requestAppLaunch("internet-explorer", { url: targetInput })) {
        appendOutputLine("open: event bus is unavailable for GUI launch.", "error");
        return false;
      }

      return true;
    }

    const absolutePath = resolveTargetPath(targetInput);

    if (!absolutePath || isPathDeleted(absolutePath)) {
      appendOutputLine(`open: ${targetInput}: No such file or directory`, "error");
      return false;
    }

    const resolvedListing = resolveDirectoryListing(absolutePath);

    if (resolvedListing) {
      if (
        !requestAppLaunch("mock-file-browser", {
          os: "linux",
          path: resolvedListing.path,
          title: resolvedListing.path,
        })
      ) {
        appendOutputLine("open: event bus is unavailable for GUI launch.", "error");
        return false;
      }

      return true;
    }

    if (typeof resolveOverlayFileContent(absolutePath) === "string" || etcVirtualFiles.has(absolutePath)) {
      if (
        !requestAppLaunch("mock-file-viewer", {
          os: "linux",
          path: absolutePath,
        })
      ) {
        appendOutputLine("open: event bus is unavailable for GUI launch.", "error");
        return false;
      }

      return true;
    }

    if (typeof fileLayer?.accessPath !== "function") {
      appendOutputLine(`open: ${targetInput}: No such file or directory`, "error");
      return false;
    }

    const accessResult = await fileLayer.accessPath({
      os: "linux",
      path: absolutePath,
    });

    if (!accessResult || typeof accessResult !== "object") {
      appendOutputLine(`open: ${targetInput}: No such file or directory`, "error");
      return false;
    }

    if (accessResult.kind === "directory") {
      if (
        !requestAppLaunch("mock-file-browser", {
          os: "linux",
          path: absolutePath,
          title: absolutePath,
        })
      ) {
        appendOutputLine("open: event bus is unavailable for GUI launch.", "error");
        return false;
      }

      return true;
    }

    if (accessResult.kind === "action") {
      if (typeof accessResult.appId !== "string" || !accessResult.appId) {
        appendOutputLine("open: action mapping is missing app id.", "error");
        return false;
      }

      if (!requestAppLaunch(accessResult.appId, accessResult.launchPayload)) {
        appendOutputLine("open: event bus is unavailable for GUI launch.", "error");
        return false;
      }

      return true;
    }

    if (accessResult.kind !== "file") {
      appendOutputLine(`open: ${targetInput}: No such file or directory`, "error");
      return false;
    }

    if (
      !requestAppLaunch("mock-file-viewer", {
        os: "linux",
        path: absolutePath,
      })
    ) {
      appendOutputLine("open: event bus is unavailable for GUI launch.", "error");
      return false;
    }

    return true;
  }

  function applyVfsMutation(rawMutation) {
    if (!rawMutation || typeof rawMutation !== "object") {
      return false;
    }

    const action = normalizeToken(rawMutation.action);
    const targetPath = rawMutation.path || rawMutation.target || rawMutation.file || rawMutation.source;
    const destinationPath =
      rawMutation.to || rawMutation.destination || rawMutation.newPath || rawMutation.nextPath;
    const content =
      rawMutation.content ??
      rawMutation.value ??
      rawMutation.text ??
      rawMutation.stdout ??
      "";
    const nodeType = normalizeToken(rawMutation.type || rawMutation.nodeType || "");

    if (!action) {
      return false;
    }

    if (action === "mkdir" || action === "create-dir" || action === "create-directory") {
      return runtimeFileSystem.createDirectory(targetPath);
    }

    if (
      action === "create" ||
      action === "touch" ||
      action === "create-file" ||
      action === "write" ||
      action === "update"
    ) {
      if (nodeType === "directory") {
        return runtimeFileSystem.createDirectory(targetPath);
      }

      return runtimeFileSystem.writeFile(targetPath, content);
    }

    if (action === "append" || action === "append-file") {
      return runtimeFileSystem.appendFile(targetPath, content);
    }

    if (
      action === "delete" ||
      action === "remove" ||
      action === "rm" ||
      action === "delete-file" ||
      action === "unlink" ||
      action === "rmdir" ||
      action === "delete-directory"
    ) {
      return runtimeFileSystem.deletePath(targetPath);
    }

    if (action === "move" || action === "mv" || action === "rename") {
      return runtimeFileSystem.movePath(targetPath, destinationPath);
    }

    return false;
  }

  async function executeLlmUiEvents(uiEvents = []) {
    for (const uiEvent of uiEvents) {
      if (!uiEvent || typeof uiEvent !== "object") {
        continue;
      }

      const eventType = typeof uiEvent.type === "string" ? uiEvent.type.trim() : "";
      const payload = uiEvent.payload;

      if (!eventType) {
        continue;
      }

      if (eventType === "OPEN_APP") {
        if (typeof payload === "string" && payload.trim()) {
          await handleOpenCommand([payload.trim()]);
        } else if (payload && typeof payload === "object") {
          if (typeof payload.path === "string" && payload.path.trim()) {
            await handleOpenCommand([payload.path.trim()]);
          } else if (typeof payload.appId === "string" && payload.appId.trim()) {
            requestAppLaunch(payload.appId, payload.launchPayload || payload);
          }
        }
      }

      emitUiEvent(eventType, payload);
    }
  }

  async function processViaLLM(rawCommand) {
    const stopIndicator = createLoadingIndicator();

    try {
      const response = await fetch(LLM_SHELL_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          command: rawCommand,
          cwd: currentDirectory,
          vfs_snapshot: buildCurrentDirectorySnapshot(currentDirectory),
        }),
      });
      const llmResponse = await parseLlmResponse(response);

      if (typeof llmResponse.stdout === "string" && llmResponse.stdout.length > 0) {
        appendOutputBlock(llmResponse.stdout, "plain");
      }

      if (typeof llmResponse.stderr === "string" && llmResponse.stderr.length > 0) {
        appendOutputBlock(llmResponse.stderr, "error");
      }

      if (Array.isArray(llmResponse.vfs_mutations)) {
        for (const mutation of llmResponse.vfs_mutations) {
          const mutationApplied = applyVfsMutation(mutation);

          if (!mutationApplied) {
            appendOutputLine("vfs: unable to apply mutation from LLM response", "error");
          }
        }
      }

      if (Array.isArray(llmResponse.ui_events)) {
        await executeLlmUiEvents(llmResponse.ui_events);
      }
    } catch (error) {
      appendOutputLine(
        error instanceof Error ? error.message : "LLM processing failed unexpectedly.",
        "error",
      );
    } finally {
      stopIndicator();
    }
  }

  async function runLocalFastPathMetaCommentary(rawCommand, command, args = []) {
    if (localMetaRequestInFlight || disposed) {
      return;
    }

    localMetaRequestInFlight = true;

    const looksLikeOpenCvCommand =
      command === "open" &&
      String(args.join(" ") || "")
        .toLowerCase()
        .includes("cv");
    const metaContext = looksLikeOpenCvCommand
      ? LOCAL_FAST_PATH_META_CONTEXT
      : `Local fast path command executed successfully: "${rawCommand}". ${LOCAL_FAST_PATH_META_CONTEXT}`;

    try {
      const response = await fetch(LLM_SHELL_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          command: rawCommand,
          cwd: currentDirectory,
          vfs_snapshot: buildCurrentDirectorySnapshot(currentDirectory),
          meta_context: metaContext,
        }),
      });
      const llmResponse = await parseLlmResponse(response);

      if (typeof llmResponse.stdout === "string" && llmResponse.stdout.length > 0) {
        appendOutputBlock(llmResponse.stdout, "status");
      }
    } catch {
      // Meta commentary is best-effort and should never interrupt shell flow.
    } finally {
      localMetaRequestInFlight = false;
    }
  }

  async function executeLocalCommand(command, args) {
    if (command === "help") {
      printHelp();
      return true;
    }

    if (command === "history") {
      if (commandHistory.length === 0) {
        appendOutputLine("history: empty");
        return false;
      }

      commandHistory.forEach((entry, index) => {
        appendOutputLine(`${String(index + 1).padStart(4, " ")}  ${entry}`);
      });
      return true;
    }

    if (command === "clear") {
      clearTerminalOutput();
      return true;
    }

    if (command === "date") {
      appendOutputLine(new Date().toString());
      return true;
    }

    if (command === "uptime") {
      appendOutputLine(`up ${formatUptime(Date.now() - bootedAt)}`);
      return true;
    }

    if (command === "whoami") {
      appendOutputLine(SHELL_USER);
      return true;
    }

    if (command === "hostname") {
      appendOutputLine(SHELL_HOSTNAME);
      return true;
    }

    if (command === "uname") {
      if (args[0] === "-a") {
        appendOutputLine(KERNEL_SIGNATURE);
        return true;
      }

      appendOutputLine("Linux");
      return true;
    }

    if (command === "pwd") {
      appendOutputLine(currentDirectory);
      return true;
    }

    if (command === "cd") {
      const targetInput = args[0] || "/";
      const resolvedListing = resolveDirectoryListing(targetInput);

      if (!resolvedListing) {
        appendOutputLine(`cd: ${targetInput}: No such file or directory`, "error");
        return false;
      }

      currentDirectory = resolvedListing.path;
      return true;
    }

    if (command === "ls") {
      const targetInput = args[0] || ".";
      const resolvedListing = resolveDirectoryListing(targetInput);

      if (resolvedListing) {
        appendOutputLine(formatLsEntries(resolvedListing.entries) || "(empty)");
        return true;
      }

      const absolutePath = resolveTargetPath(targetInput);

      if (absolutePath && !isPathDeleted(absolutePath)) {
        if (typeof resolveOverlayFileContent(absolutePath) === "string") {
          appendOutputLine(getPathBaseName(absolutePath));
          return true;
        }

        if (typeof fileLayer?.inspectPath === "function") {
          const inspectedEntry = fileLayer.inspectPath({
            os: "linux",
            path: absolutePath,
          });

          if (inspectedEntry?.type === "file") {
            appendOutputLine(inspectedEntry.name || targetInput);
            return true;
          }
        }

        if (etcVirtualFiles.has(absolutePath)) {
          appendOutputLine(getPathBaseName(absolutePath));
          return true;
        }
      }

      appendOutputLine(`ls: cannot access '${targetInput}': No such file or directory`, "error");
      return false;
    }

    if (command === "cat") {
      const targetFile = args[0];

      if (!targetFile) {
        appendOutputLine("cat: missing file operand", "error");
        return false;
      }

      const absolutePath =
        targetFile === "motd"
          ? "/etc/motd"
          : targetFile === "os-release"
            ? "/etc/os-release"
            : resolveTargetPath(targetFile);

      if (!absolutePath || isPathDeleted(absolutePath)) {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return false;
      }

      const overlayContent = resolveOverlayFileContent(absolutePath);

      if (typeof overlayContent === "string") {
        appendOutputBlock(overlayContent);
        return true;
      }

      if (etcVirtualFiles.has(absolutePath)) {
        appendOutputBlock(etcVirtualFiles.get(absolutePath));
        return true;
      }

      if (typeof fileLayer?.accessPath !== "function") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return false;
      }

      const accessResult = await fileLayer.accessPath({
        os: "linux",
        path: absolutePath,
      });

      if (!accessResult || typeof accessResult !== "object") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return false;
      }

      if (accessResult.kind === "directory") {
        appendOutputLine(`cat: ${targetFile}: Is a directory`, "error");
        return false;
      }

      if (accessResult.kind === "action") {
        appendOutputLine(
          `cat: ${targetFile}: mapped to action (${accessResult.actionType})`,
          "error",
        );
        return false;
      }

      if (accessResult.kind !== "file") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return false;
      }

      appendOutputBlock(String(accessResult.content || ""));
      return true;
    }

    if (command === "open") {
      return handleOpenCommand(args);
    }

    if (command === "oslist") {
      printInstalledOs();
      return true;
    }

    if (command === "boot") {
      const target = resolveOsTarget(args[0]);

      if (!target) {
        appendOutputLine("Usage: boot <win95|winxp|ubuntu>", "error");
        return false;
      }

      requestTargetSystemSwitch(target);
      return true;
    }

    if (command === "reboot") {
      if (args.length === 0) {
        requestTargetSystemSwitch(resolveOsTarget("ubuntu"));
        return true;
      }

      const target = resolveOsTarget(args[0]);

      if (!target) {
        appendOutputLine("Usage: reboot [win95|winxp|ubuntu]", "error");
        return false;
      }

      requestTargetSystemSwitch(target);
      return true;
    }

    if (command === "shutdown" || command === "poweroff" || command === "halt") {
      appendOutputLine("System halted.", "status");
      scheduleTimeout(() => {
        if (!disposed) {
          renderPowerOff();
        }
      }, 250);
      return true;
    }

    if (command === "msconfig") {
      appendOutputLine(
        "msconfig is a GUI utility. Use `open /mnt/d/CHANGELOG.MD` or GUI launch commands.",
        "error",
      );
      return false;
    }

    appendOutputLine(`${command}: command not available in local fast path`, "error");
    return false;
  }

  async function executeCommand(commandText) {
    const parts = splitCommand(commandText);
    const command = normalizeToken(parts[0]);
    const args = parts.slice(1);

    if (!command) {
      return;
    }

    if (LOCAL_COMMANDS.has(command)) {
      const localCommandSucceeded = await executeLocalCommand(command, args);

      if (localCommandSucceeded) {
        void runLocalFastPathMetaCommentary(commandText, command, args);
      }

      return;
    }

    await processViaLLM(commandText);
  }

  function renderTerminal() {
    resetView();
    root.className = "shell-root shell-root--desktop";
    root.innerHTML = `
      <main class="ubuntu-shell" data-testid="ubuntu-shell" data-ubuntu-shell>
        <section class="ubuntu-shell__terminal" data-ubuntu-terminal>
          <div class="ubuntu-shell__session">
            <div class="ubuntu-shell__output" data-ubuntu-output></div>
            <form class="ubuntu-shell__input" data-ubuntu-form autocomplete="off">
              <span class="ubuntu-shell__prompt" data-ubuntu-prompt>${getPrompt()}</span>
              <input
                type="text"
                class="ubuntu-shell__command"
                data-ubuntu-command
                autocapitalize="off"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                autofocus
              />
            </form>
          </div>
        </section>
        <div class="window-layer ubuntu-shell__window-layer" data-window-layer></div>
      </main>
    `;

    const shellNode = root.querySelector("[data-ubuntu-shell]");
    const windowLayer = root.querySelector("[data-window-layer]");
    activeOutput = root.querySelector("[data-ubuntu-output]");
    const form = root.querySelector("[data-ubuntu-form]");
    const promptNode = root.querySelector("[data-ubuntu-prompt]");
    activeInput = root.querySelector("[data-ubuntu-command]");

    if (windowLayer instanceof HTMLElement) {
      windowManager?.setContainer?.(windowLayer);
    }

    if (!(form instanceof HTMLFormElement) || !(activeInput instanceof HTMLInputElement)) {
      return;
    }

    const syncPrompt = () => {
      if (promptNode instanceof HTMLElement) {
        promptNode.textContent = getPrompt();
      }
    };

    currentDirectory = SHELL_START_DIRECTORY;
    bootedAt = Date.now();
    syncPrompt();
    appendOutputLine("Welcome to Ubuntu Server shell mode.", "status");
    appendOutputLine("Type `help` for commands. Shared mock partitions are mounted under /mnt and /dev.");
    appendOutputLine("");

    const submitHandler = (event) => {
      event.preventDefault();

      const rawInput = activeInput.value;
      const nextCommand = rawInput.trim();
      const commandPrompt = getPrompt();
      appendOutputLine(nextCommand ? `${commandPrompt} ${rawInput}` : commandPrompt, "command");

      if (!nextCommand) {
        activeInput.value = "";
        appendOutputLine("");
        resetHistoryNavigationState();
        syncPrompt();
        focusInput();
        return;
      }

      pushCommandToHistory(nextCommand);
      activeInput.value = "";
      focusInput();
      void executeCommand(nextCommand)
        .catch(() => {
          appendOutputLine("Command failed unexpectedly.", "error");
        })
        .finally(() => {
          syncPrompt();
          focusInput();
        });
    };

    const inputKeydownHandler = (event) => {
      if (!(activeInput instanceof HTMLInputElement)) {
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateHistory(-1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateHistory(1);
      }
    };

    const inputHandler = () => {
      if (historyNavigationIndex !== -1) {
        historyNavigationIndex = -1;
      }
    };

    const shellPointerHandler = (event) => {
      if (!(event.target instanceof Element)) {
        enforceInputFocus();
        return;
      }

      if (!event.target.closest("[data-ubuntu-command]")) {
        event.preventDefault();
      }

      enforceInputFocus();
    };

    const shellClickHandler = () => {
      enforceInputFocus();
    };

    const inputBlurHandler = () => {
      enforceInputFocus();
    };

    form.addEventListener("submit", submitHandler);
    activeInput.addEventListener("keydown", inputKeydownHandler);
    activeInput.addEventListener("input", inputHandler);
    activeInput.addEventListener("blur", inputBlurHandler);
    shellNode?.addEventListener("pointerdown", shellPointerHandler);
    shellNode?.addEventListener("click", shellClickHandler);
    focusInput();
    scheduleTimeout(focusInput, 0);
    scheduleTimeout(focusInput, 75);

    cleanupFns.push(() => {
      form.removeEventListener("submit", submitHandler);
      activeInput?.removeEventListener("keydown", inputKeydownHandler);
      activeInput?.removeEventListener("input", inputHandler);
      activeInput?.removeEventListener("blur", inputBlurHandler);
      shellNode?.removeEventListener("pointerdown", shellPointerHandler);
      shellNode?.removeEventListener("click", shellClickHandler);
    });
  }

  function renderBiosPost({ autoContinue = false } = {}) {
    resetView();
    root.className = "shell-root shell-root--state";

    const biosProfile = readBiosProfile();
    const biosPostLines = buildBiosPostLines(biosProfile);

    root.innerHTML = `
      <main class="bios95-screen" data-testid="os-state-screen">
        <section class="bios95-screen__viewport">
          <pre class="bios95-screen__text" data-bios-output></pre>
          <p class="bios95-screen__error" data-bios-error hidden>Keyboard error or no keyboard present</p>
          <p class="bios95-screen__prompt" data-bios-prompt hidden>Press F1 to continue</p>
        </section>
        <p class="bios95-screen__hint" data-bios-hint hidden>Awaiting keyboard input...</p>
      </main>
    `;

    const outputNode = root.querySelector("[data-bios-output]");
    const errorNode = root.querySelector("[data-bios-error]");
    const promptNode = root.querySelector("[data-bios-prompt]");
    const hintNode = root.querySelector("[data-bios-hint]");
    let biosLineIndex = 0;
    let biosTimerId = null;
    let biosReadyForInput = false;
    let didContinue = false;

    const continueIntoBoot = () => {
      if (didContinue || disposed) {
        return;
      }

      didContinue = true;
      startBootSequence();
    };

    const renderNextBiosLine = () => {
      if (!(outputNode instanceof HTMLElement)) {
        return;
      }

      if (biosLineIndex >= biosPostLines.length) {
        errorNode?.removeAttribute("hidden");
        promptNode?.removeAttribute("hidden");
        hintNode?.removeAttribute("hidden");
        biosReadyForInput = true;

        if (autoContinue) {
          scheduleTimeout(continueIntoBoot, 820);
        }

        return;
      }

      const nextLine = biosPostLines[biosLineIndex];
      outputNode.textContent = outputNode.textContent
        ? `${outputNode.textContent}\n${nextLine}`
        : nextLine;
      outputNode.scrollTop = outputNode.scrollHeight;
      biosLineIndex += 1;
      biosTimerId = window.setTimeout(renderNextBiosLine, getBiosLineDelayMs(nextLine));
    };

    const keydownHandler = (event) => {
      if (!biosReadyForInput) {
        return;
      }

      if (event.key === "F1" || event.key === "Enter") {
        event.preventDefault();
        continueIntoBoot();
      }
    };

    renderNextBiosLine();
    document.addEventListener("keydown", keydownHandler);
    cleanupFns.push(() => {
      if (biosTimerId !== null) {
        clearTimeout(biosTimerId);
      }

      document.removeEventListener("keydown", keydownHandler);
    });
  }

  function startPowerOnSequence({ autoContinueBios = false } = {}) {
    renderBiosPost({ autoContinue: autoContinueBios });
  }

  function startBootSequence() {
    resetView();
    root.className = "shell-root shell-root--state";
    root.innerHTML = `
      <main class="ubuntu-boot" data-testid="ubuntu-boot-screen">
        <pre class="ubuntu-boot__log" data-ubuntu-boot-log></pre>
      </main>
    `;

    const logNode = root.querySelector("[data-ubuntu-boot-log]");

    if (!(logNode instanceof HTMLElement)) {
      return;
    }

    const bootLines = [
      "Ubuntu Server 22.04.4 LTS portfolio-server ttyS0",
      "",
      "[  OK  ] Started system logging service.",
      "[  OK  ] Reached target Network.",
      "[  OK  ] Started OpenSSH server.",
      "[  OK  ] Mounted root filesystem.",
      "[  OK  ] Started portfolio-shell.service.",
      "",
      "Boot complete.",
    ];

    let lineIndex = 0;

    const renderNextLine = () => {
      if (disposed) {
        return;
      }

      if (lineIndex >= bootLines.length) {
        scheduleTimeout(() => {
          if (!disposed) {
            renderTerminal();
          }
        }, 220);
        return;
      }

      const nextLine = bootLines[lineIndex];
      logNode.textContent = logNode.textContent
        ? `${logNode.textContent}\n${nextLine}`
        : nextLine;
      lineIndex += 1;
      scheduleTimeout(renderNextLine, nextLine ? 150 : 95);
    };

    renderNextLine();
  }

  function renderPowerOff() {
    resetView();
    root.className = "shell-root shell-root--state";
    root.innerHTML = `
      <main class="ubuntu-poweroff" data-testid="ubuntu-poweroff-screen">
        <h1 class="ubuntu-poweroff__title">System halted.</h1>
        <p class="ubuntu-poweroff__hint">Press Enter or select Power On to boot Ubuntu Server.</p>
        <button type="button" class="ubuntu-poweroff__button" data-ubuntu-power-on>Power On</button>
      </main>
    `;

    const powerOnButton = root.querySelector("[data-ubuntu-power-on]");

    const keydownHandler = (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      startPowerOnSequence({ autoContinueBios: false });
    };

    const clickHandler = () => {
      startPowerOnSequence({ autoContinueBios: false });
    };

    window.addEventListener("keydown", keydownHandler);
    powerOnButton?.addEventListener("click", clickHandler);

    cleanupFns.push(() => {
      window.removeEventListener("keydown", keydownHandler);
      powerOnButton?.removeEventListener("click", clickHandler);
    });
  }

  const shouldAutoBoot = switchContext?.autoBoot !== false;

  if (shouldAutoBoot) {
    startPowerOnSequence({ autoContinueBios: false });
  } else {
    renderPowerOff();
  }

  return {
    requestPowerOn() {
      if (disposed) {
        return;
      }

      startPowerOnSequence({ autoContinueBios: false });
    },
    unmount() {
      disposed = true;
      resetView();
      root.innerHTML = "";
    },
  };
}
