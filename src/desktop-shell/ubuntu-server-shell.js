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

  function scheduleTimeout(callback, delayMs) {
    const timerId = window.setTimeout(() => {
      activeTimers.delete(timerId);
      callback();
    }, delayMs);

    activeTimers.add(timerId);
    return timerId;
  }

  function clearTimers() {
    for (const timerId of activeTimers) {
      clearTimeout(timerId);
    }

    activeTimers.clear();
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
    activeInput = null;
    activeOutput = null;
  }

  function appendOutputLine(text, variant = "plain") {
    if (!(activeOutput instanceof HTMLElement)) {
      return;
    }

    const line = document.createElement("div");
    line.className = `ubuntu-shell__line ubuntu-shell__line--${variant}`;
    line.textContent = text;
    activeOutput.append(line);

    if (activeOutput instanceof HTMLElement) {
      activeOutput.scrollTop = activeOutput.scrollHeight;
    }
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

    if (!absolutePath) {
      return null;
    }

    const owningMountPath = findOwningMountPath(absolutePath);

    if (owningMountPath && typeof fileLayer?.listDirectory === "function") {
      const directoryListing = fileLayer.listDirectory({
        os: "linux",
        path: absolutePath,
      });

      if (directoryListing) {
        return {
          path: absolutePath,
          source: "filesystem",
          entries: directoryListing.entries || [],
        };
      }
    }

    const virtualEntries = listVirtualDirectoryEntries(absolutePath);

    if (virtualEntries) {
      return {
        path: absolutePath,
        source: "virtual",
        entries: virtualEntries,
      };
    }

    return null;
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
    appendOutputLine("oslist               List installed operating systems");
    appendOutputLine("boot <target>        Reboot into target (win95, winxp, ubuntu)");
    appendOutputLine("reboot [target]      Reboot current or target OS");
    appendOutputLine("shutdown             Halt system and return to power screen");
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

  async function executeCommand(commandText) {
    const parts = splitCommand(commandText);
    const command = normalizeToken(parts[0]);
    const args = parts.slice(1);

    if (!command) {
      return;
    }

    if (command === "help") {
      printHelp();
      return;
    }

    if (command === "history") {
      if (commandHistory.length === 0) {
        appendOutputLine("history: empty");
        return;
      }

      commandHistory.forEach((entry, index) => {
        appendOutputLine(`${String(index + 1).padStart(4, " ")}  ${entry}`);
      });
      return;
    }

    if (command === "clear") {
      clearTerminalOutput();
      return;
    }

    if (command === "date") {
      appendOutputLine(new Date().toString());
      return;
    }

    if (command === "uptime") {
      appendOutputLine(`up ${formatUptime(Date.now() - bootedAt)}`);
      return;
    }

    if (command === "whoami") {
      appendOutputLine(SHELL_USER);
      return;
    }

    if (command === "hostname") {
      appendOutputLine(SHELL_HOSTNAME);
      return;
    }

    if (command === "uname") {
      if (args[0] === "-a") {
        appendOutputLine(KERNEL_SIGNATURE);
        return;
      }

      appendOutputLine("Linux");
      return;
    }

    if (command === "pwd") {
      appendOutputLine(currentDirectory);
      return;
    }

    if (command === "cd") {
      const targetInput = args[0] || "/";
      const resolvedListing = resolveDirectoryListing(targetInput);

      if (!resolvedListing) {
        appendOutputLine(`cd: ${targetInput}: No such file or directory`, "error");
        return;
      }

      currentDirectory = resolvedListing.path;
      return;
    }

    if (command === "ls") {
      const targetInput = args[0] || ".";
      const resolvedListing = resolveDirectoryListing(targetInput);

      if (resolvedListing) {
        appendOutputLine(formatLsEntries(resolvedListing.entries) || "(empty)");
        return;
      }

      const absolutePath = resolveTargetPath(targetInput);

      if (absolutePath && typeof fileLayer?.inspectPath === "function") {
        const inspectedEntry = fileLayer.inspectPath({
          os: "linux",
          path: absolutePath,
        });

        if (inspectedEntry?.type === "file") {
          appendOutputLine(inspectedEntry.name || targetInput);
          return;
        }
      }

      if (absolutePath && etcVirtualFiles.has(absolutePath)) {
        const pathSegments = absolutePath.split("/").filter(Boolean);
        appendOutputLine(pathSegments[pathSegments.length - 1] || absolutePath);
        return;
      }

      appendOutputLine(`ls: cannot access '${targetInput}': No such file or directory`, "error");
      return;
    }

    if (command === "cat") {
      const targetFile = args[0];

      if (!targetFile) {
        appendOutputLine("cat: missing file operand", "error");
        return;
      }

      const absolutePath =
        targetFile === "motd"
          ? "/etc/motd"
          : targetFile === "os-release"
            ? "/etc/os-release"
            : resolveTargetPath(targetFile);

      if (!absolutePath) {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return;
      }

      if (etcVirtualFiles.has(absolutePath)) {
        appendOutputBlock(etcVirtualFiles.get(absolutePath));
        return;
      }

      if (typeof fileLayer?.accessPath !== "function") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return;
      }

      const accessResult = await fileLayer.accessPath({
        os: "linux",
        path: absolutePath,
      });

      if (!accessResult || typeof accessResult !== "object") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return;
      }

      if (accessResult.kind === "directory") {
        appendOutputLine(`cat: ${targetFile}: Is a directory`, "error");
        return;
      }

      if (accessResult.kind === "action") {
        appendOutputLine(
          `cat: ${targetFile}: mapped to action (${accessResult.actionType})`,
          "error",
        );
        return;
      }

      if (accessResult.kind !== "file") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return;
      }

      appendOutputBlock(String(accessResult.content || ""));
      return;
    }

    if (command === "oslist") {
      printInstalledOs();
      return;
    }

    if (command === "boot") {
      const target = resolveOsTarget(args[0]);

      if (!target) {
        appendOutputLine("Usage: boot <win95|winxp|ubuntu>", "error");
        return;
      }

      requestTargetSystemSwitch(target);
      return;
    }

    if (command === "reboot") {
      if (args.length === 0) {
        requestTargetSystemSwitch(resolveOsTarget("ubuntu"));
        return;
      }

      const target = resolveOsTarget(args[0]);

      if (!target) {
        appendOutputLine("Usage: reboot [win95|winxp|ubuntu]", "error");
        return;
      }

      requestTargetSystemSwitch(target);
      return;
    }

    if (command === "shutdown" || command === "poweroff" || command === "halt") {
      appendOutputLine("System halted.", "status");
      scheduleTimeout(() => {
        if (!disposed) {
          renderPowerOff();
        }
      }, 250);
      return;
    }

    if (command === "msconfig") {
      appendOutputLine(
        "msconfig is a GUI utility. Use `oslist` and `boot <target>` in Ubuntu shell mode.",
        "error",
      );
      return;
    }

    appendOutputLine(`${command}: command not found`, "error");
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
      </main>
    `;

    const shellNode = root.querySelector("[data-ubuntu-shell]");
    activeOutput = root.querySelector("[data-ubuntu-output]");
    const form = root.querySelector("[data-ubuntu-form]");
    const promptNode = root.querySelector("[data-ubuntu-prompt]");
    activeInput = root.querySelector("[data-ubuntu-command]");

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
