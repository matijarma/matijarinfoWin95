import {
  buildBiosPostLines,
  readBiosProfile,
} from "../core/system-preferences/index.js";

const UBUNTU_SYSTEM_ID = "desktop-ubuntu-server";
const SHELL_PROMPT = "matija@portfolio-server:~$";
const SHELL_USER = "matija";
const SHELL_HOSTNAME = "portfolio-server";
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
  let activeTerminal = null;
  const storageRef = getWindowLocalStorage();
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
    activeTerminal = null;
  }

  function appendOutputLine(text, variant = "plain") {
    if (!(activeOutput instanceof HTMLElement)) {
      return;
    }

    const line = document.createElement("div");
    line.className = `ubuntu-shell__line ubuntu-shell__line--${variant}`;
    line.textContent = text;
    activeOutput.append(line);

    if (activeTerminal instanceof HTMLElement) {
      activeTerminal.scrollTop = activeTerminal.scrollHeight;
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

  function requestTargetSystemSwitch(targetEntry) {
    if (!targetEntry) {
      appendOutputLine("Missing target operating system.", "error");
      return;
    }

    if (targetEntry.id === UBUNTU_SYSTEM_ID) {
      appendOutputLine("Rebooting Ubuntu Server...", "status");
      scheduleTimeout(() => {
        if (!disposed) {
          startPowerOnSequence({ autoContinueBios: true });
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
            autoBoot: true,
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
    appendOutputLine("ls [path]            List available entries");
    appendOutputLine("cat <file>           Show file content (/etc/motd, /etc/os-release)");
    appendOutputLine("oslist               List installed operating systems");
    appendOutputLine("boot <target>        Reboot into target (win95, winxp, ubuntu)");
    appendOutputLine("reboot [target]      Reboot current or target OS");
    appendOutputLine("shutdown             Halt system and return to power screen");
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

  function executeCommand(commandText) {
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
      appendOutputLine(`/home/${SHELL_USER}`);
      return;
    }

    if (command === "ls") {
      const targetPath = args[0] || ".";

      if (targetPath === "/etc") {
        appendOutputLine("motd  os-release");
        return;
      }

      if (targetPath === "." || targetPath === `~` || targetPath === `/home/${SHELL_USER}`) {
        appendOutputLine("README.md  projects/  /etc/");
        return;
      }

      appendOutputLine(`ls: cannot access '${targetPath}': No such file or directory`, "error");
      return;
    }

    if (command === "cat") {
      const targetFile = args[0];

      if (!targetFile) {
        appendOutputLine("cat: missing file operand", "error");
        return;
      }

      const normalizedFile = targetFile === "motd" ? "/etc/motd" : targetFile;
      const fileContent = FILES[normalizedFile];

      if (typeof fileContent !== "string") {
        appendOutputLine(`cat: ${targetFile}: No such file or directory`, "error");
        return;
      }

      appendOutputBlock(fileContent);
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
      <main class="ubuntu-shell" data-testid="ubuntu-shell">
        <header class="ubuntu-shell__header">
          Ubuntu Server 22.04 LTS (${SHELL_HOSTNAME})
        </header>
        <section class="ubuntu-shell__terminal" data-ubuntu-terminal>
          <div class="ubuntu-shell__session">
            <div class="ubuntu-shell__output" data-ubuntu-output></div>
            <form class="ubuntu-shell__input" data-ubuntu-form autocomplete="off">
              <span class="ubuntu-shell__prompt">${SHELL_PROMPT}</span>
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

    activeTerminal = root.querySelector("[data-ubuntu-terminal]");
    activeOutput = root.querySelector("[data-ubuntu-output]");
    const form = root.querySelector("[data-ubuntu-form]");
    activeInput = root.querySelector("[data-ubuntu-command]");

    if (!(form instanceof HTMLFormElement) || !(activeInput instanceof HTMLInputElement)) {
      return;
    }

    bootedAt = Date.now();
    appendOutputLine("Welcome to Ubuntu Server shell mode.", "status");
    appendOutputLine("Type `help` for commands. Use `boot win95` or `boot winxp` to switch OS.");
    appendOutputLine("");

    const submitHandler = (event) => {
      event.preventDefault();

      const rawInput = activeInput.value;
      const nextCommand = rawInput.trim();
      appendOutputLine(nextCommand ? `${SHELL_PROMPT} ${rawInput}` : SHELL_PROMPT, "command");

      if (!nextCommand) {
        activeInput.value = "";
        appendOutputLine("");
        resetHistoryNavigationState();
        focusInput();
        return;
      }

      pushCommandToHistory(nextCommand);
      executeCommand(nextCommand);
      activeInput.value = "";
      focusInput();
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

    const terminalPointerHandler = () => {
      focusInput();
    };

    form.addEventListener("submit", submitHandler);
    activeInput.addEventListener("keydown", inputKeydownHandler);
    activeInput.addEventListener("input", inputHandler);
    activeTerminal?.addEventListener("pointerdown", terminalPointerHandler);
    focusInput();
    scheduleTimeout(focusInput, 0);
    scheduleTimeout(focusInput, 75);

    cleanupFns.push(() => {
      form.removeEventListener("submit", submitHandler);
      activeInput?.removeEventListener("keydown", inputKeydownHandler);
      activeInput?.removeEventListener("input", inputHandler);
      activeTerminal?.removeEventListener("pointerdown", terminalPointerHandler);
    });
  }

  function renderBiosPost({ autoContinue = true } = {}) {
    resetView();
    root.className = "shell-root shell-root--state";

    const biosProfile = readBiosProfile();
    const biosPostLines = buildBiosPostLines(biosProfile);

    root.innerHTML = `
      <main class="bios95-screen" data-testid="ubuntu-bios-screen">
        <section class="bios95-screen__viewport">
          <pre class="bios95-screen__text" data-bios-output></pre>
          <p class="bios95-screen__error" data-bios-error hidden>Keyboard error or no keyboard present</p>
          <p class="bios95-screen__prompt" data-bios-prompt hidden>Press F1 to continue</p>
        </section>
        <p class="bios95-screen__hint" data-bios-hint hidden>Initializing boot handoff...</p>
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

  function startPowerOnSequence({ autoContinueBios = true } = {}) {
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
      startPowerOnSequence({ autoContinueBios: true });
    };

    const clickHandler = () => {
      startPowerOnSequence({ autoContinueBios: true });
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
    startPowerOnSequence({ autoContinueBios: true });
  } else {
    renderPowerOff();
  }

  return {
    requestPowerOn() {
      if (disposed) {
        return;
      }

      startPowerOnSequence({ autoContinueBios: true });
    },
    unmount() {
      disposed = true;
      resetView();
      root.innerHTML = "";
    },
  };
}
