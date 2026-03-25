import { OS_STATES } from "../core/os-kernel/states.js";
import {
  BIOS_CPU_SPEED_OPTIONS,
  BIOS_MODEM_SPEED_OPTIONS,
  buildBiosPostLines,
  estimateBootDurationMs,
  formatClockTime,
  formatClockTooltip,
  getBiosCpuLabel,
  getBiosModemLabel,
  getBiosNetworkLabel,
  getClockDate,
  readBiosProfile,
  readClockProfile,
  writeBiosProfile,
} from "../core/system-preferences/index.js";
import { createContextMenu } from "../ui/context-menu/index.js";
import { createIconSurface } from "../ui/icon-surface/index.js";
import { createIconGlyph, createWindowsLogoGlyph } from "../ui/icons/index.js";
import { createStartMenu } from "../ui/start-menu/index.js";
import { createSystemTray } from "../ui/system-tray/index.js";

const BOOT_SCREEN_IMAGE_URL = new URL(
  "../../visuals-to-use/win95bootscreen.png",
  import.meta.url,
).toString();
const BOOT_SOUND_URL = new URL(
  "../../visuals-to-use/win95bootsound.aac",
  import.meta.url,
).toString();
const SHUTDOWN_VIDEO_URL = new URL(
  "../../visuals-to-use/win95shutdownvideoaudio.mp4",
  import.meta.url,
).toString();
const DESKTOP_ICON_POSITIONS_STORAGE_KEY = "win95.desktop.iconPositions.v1";

function buildBootPreludeLines(biosProfile) {
  const lines = [
    "Starting MS-DOS...",
    "CONFIG.SYS: DEVICE=HIMEM.SYS /TESTMEM:ON",
    "CONFIG.SYS: DEVICE=EMM386.EXE RAM 4096",
    "AUTOEXEC.BAT: SMARTDRV /X",
    "AUTOEXEC.BAT: SET TEMP=C:\\WINDOWS\\TEMP",
    `Detected CPU profile: ${getBiosCpuLabel(biosProfile)}`,
    `Network stack: ${getBiosNetworkLabel(biosProfile)}`,
    `Dial-up modem: ${getBiosModemLabel(biosProfile)}`,
  ];

  if (biosProfile.cpuMHz >= 66) {
    lines.push("Warning: Overclock profile active. Keep your coffee nearby.");
  }

  if (biosProfile.cacheMode === "reckless") {
    lines.push("L2 cache mode: Reckless Turbo");
  }

  lines.push("Starting Windows 95...");

  return lines;
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

function getBootPreludeLineDelayMs(line) {
  if (line.includes("Warning")) {
    return 900;
  }

  if (line.startsWith("Starting")) {
    return 700;
  }

  return 420;
}

function normalizeStoredDesktopPosition(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const x = Number(candidate.x);
  const y = Number(candidate.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

function readDesktopIconPositionsFromStorage() {
  try {
    if (!("localStorage" in window)) {
      return {};
    }

    const rawValue = window.localStorage.getItem(DESKTOP_ICON_POSITIONS_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const normalized = {};

    for (const [itemId, position] of Object.entries(parsed)) {
      const safePosition = normalizeStoredDesktopPosition(position);

      if (safePosition) {
        normalized[itemId] = safePosition;
      }
    }

    return normalized;
  } catch {
    return {};
  }
}

function persistDesktopIconPositions(positionsById) {
  try {
    if (!("localStorage" in window)) {
      return;
    }

    window.localStorage.setItem(
      DESKTOP_ICON_POSITIONS_STORAGE_KEY,
      JSON.stringify(positionsById || {}),
    );
  } catch {
    // Ignore storage errors (private mode, quota, and others).
  }
}

function createStartMenuEntries(appRegistry) {
  const findApp = (appId) => appRegistry.getApp(appId);
  const createAppEntry = (appId, { label, iconKey } = {}) => {
    const app = findApp(appId);

    if (!app) {
      return null;
    }

    return {
      type: "app",
      id: `start-${appId}`,
      appId,
      label: label || app.title,
      iconKey: iconKey || app.iconKey,
    };
  };

  return [
    {
      type: "submenu",
      id: "start-programs",
      label: "&Programs",
      iconKey: "folder",
      children: [
        createAppEntry("my-computer"),
        createAppEntry("internet-explorer"),
        createAppEntry("about-matijar", {
          label: "Portfolio Notebook",
          iconKey: "document",
        }),
        createAppEntry("recycle-bin"),
      ].filter(Boolean),
    },
    {
      type: "submenu",
      id: "start-documents",
      label: "&Documents",
      iconKey: "document",
      children: [
        {
          type: "item",
          id: "doc-recent",
          label: "(Empty)",
          iconKey: "document",
          disabled: true,
        },
      ],
    },
    {
      type: "submenu",
      id: "start-settings",
      label: "&Settings",
      iconKey: "settings",
      children: [createAppEntry("control-panel"), createAppEntry("date-time-properties")].filter(
        Boolean,
      ),
    },
    {
      type: "submenu",
      id: "start-find",
      label: "F&ind",
      iconKey: "document",
      children: [
        { type: "item", id: "find-files", label: "&Files or Folders...", iconKey: "folder", disabled: true },
        { type: "item", id: "find-computer", label: "&Computer...", iconKey: "computer", disabled: true },
      ],
    },
    {
      type: "item",
      id: "start-help",
      label: "&Help",
      iconKey: "document",
      disabled: true,
    },
    { type: "separator" },
    {
      type: "command",
      id: "start-run",
      label: "&Run...",
      iconKey: "run",
      command: "run",
    },
    { type: "separator" },
    {
      type: "command",
      id: "start-shutdown",
      label: "Sh&ut Down...",
      iconKey: "settings",
      command: "shutdown",
    },
  ];
}

function buildSystemMenuEntries(windowState) {
  if (!windowState) {
    return [];
  }

  return [
    {
      id: `sys-restore-${windowState.id}`,
      label: "Restore",
      iconKey: "app",
      action: "restore",
      disabled: !windowState.maximized && !windowState.minimized,
    },
    {
      id: `sys-move-${windowState.id}`,
      label: "Move",
      iconKey: "app",
      action: "move",
      disabled: true,
    },
    {
      id: `sys-size-${windowState.id}`,
      label: "Size",
      iconKey: "app",
      action: "size",
      disabled: true,
    },
    {
      id: `sys-min-${windowState.id}`,
      label: "Minimize",
      iconKey: "app",
      action: "minimize",
      disabled: !windowState.minimizable || windowState.minimized,
    },
    {
      id: `sys-max-${windowState.id}`,
      label: windowState.maximized ? "Restore" : "Maximize",
      iconKey: "app",
      action: "toggle-maximize",
      disabled: !windowState.maximizable,
    },
    { type: "separator" },
    {
      id: `sys-close-${windowState.id}`,
      label: "Close",
      iconKey: "app",
      action: "close",
      disabled: !windowState.closable,
    },
  ];
}

export function createDesktopShell({ root, eventBus, appRegistry, windowManager }) {
  if (!root) {
    throw new Error("createDesktopShell requires a root element.");
  }

  const cleanupFns = [];
  let hasBootedOnce = false;
  let powerOffMode = "post";
  let biosProfile = readBiosProfile();
  let pendingBootDurationMs = estimateBootDurationMs(biosProfile);
  let clockProfile = readClockProfile();

  function clearSideEffects() {
    while (cleanupFns.length > 0) {
      const cleanupFn = cleanupFns.pop();
      cleanupFn?.();
    }
  }

  function requestBoot(nextProfile = biosProfile) {
    biosProfile = { ...nextProfile };
    pendingBootDurationMs = estimateBootDurationMs(biosProfile);
    powerOffMode = "post";
    eventBus.emit("shell:power-on-requested", {
      biosProfile,
      bootDurationMs: pendingBootDurationMs,
    });
  }

  function renderBiosSetup() {
    root.className = "shell-root shell-root--state";
    root.innerHTML = `
      <main class="bios95-setup" data-testid="bios-setup">
        <header class="bios95-setup__header">
          <span>PhoenixBIOS Setup Utility</span>
          <span>A486 Rev 1.10</span>
        </header>
        <div class="bios95-setup__body">
          <section class="bios95-setup__panel">
            <h2 class="bios95-setup__title">Advanced Configuration</h2>
            <div class="bios95-setup__grid">
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">CPU Clock</span>
                <div class="bios95-setup__spinner">
                  <button type="button" class="bios95-setup__button" data-bios-action="cpu-down">-</button>
                  <span class="bios95-setup__value" data-bios-value="cpu"></span>
                  <button type="button" class="bios95-setup__button" data-bios-action="cpu-up">+</button>
                </div>
              </div>
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">Modem Profile</span>
                <div class="bios95-setup__spinner">
                  <button type="button" class="bios95-setup__button" data-bios-action="modem-down">-</button>
                  <span class="bios95-setup__value" data-bios-value="modem"></span>
                  <button type="button" class="bios95-setup__button" data-bios-action="modem-up">+</button>
                </div>
              </div>
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">Network Adapter</span>
                <button type="button" class="bios95-setup__toggle" data-bios-action="toggle-network"></button>
              </div>
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">Memory Test</span>
                <button type="button" class="bios95-setup__toggle" data-bios-action="toggle-memory"></button>
              </div>
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">Cache Mode</span>
                <button type="button" class="bios95-setup__toggle" data-bios-action="toggle-cache"></button>
              </div>
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">Boot Sector Protection</span>
                <button type="button" class="bios95-setup__toggle" data-bios-action="toggle-protection"></button>
              </div>
              <div class="bios95-setup__row">
                <span class="bios95-setup__label">Drive A</span>
                <button type="button" class="bios95-setup__toggle" data-bios-action="toggle-floppy"></button>
              </div>
            </div>
            <div class="bios95-setup__drives">
              <p>Primary Master: SYS HDD 128MB (C:)</p>
              <p>Primary Slave: STORAGE HDD 512MB (D:)</p>
              <p>Secondary Master: None (CD-ROM removed for historical accuracy)</p>
            </div>
          </section>
          <aside class="bios95-setup__panel bios95-setup__panel--summary">
            <h2 class="bios95-setup__title">System Summary</h2>
            <ul class="bios95-setup__summary" data-bios-summary></ul>
            <p class="bios95-setup__quip" data-bios-quip></p>
            <div class="bios95-setup__quick-actions">
              <button type="button" class="bios95-setup__button" data-bios-action="load-ludicrous">Load Ludicrous Defaults</button>
              <button type="button" class="bios95-setup__button" data-bios-action="load-safe">Load Fail-Safe Defaults</button>
            </div>
          </aside>
        </div>
        <footer class="bios95-setup__footer">
          <div class="bios95-setup__footer-actions">
            <button type="button" class="bios95-setup__button" data-bios-action="save-exit">Save &amp; Exit</button>
            <button type="button" class="bios95-setup__button" data-bios-action="cancel-exit">Exit Without Saving</button>
            <button type="button" class="bios95-setup__button bios95-setup__button--primary" data-bios-action="boot-now">Boot Windows 95</button>
          </div>
          <p class="bios95-setup__help">F10 Save | ESC Cancel | F1 Boot</p>
        </footer>
      </main>
    `;

    let draftProfile = { ...biosProfile };
    const summaryNode = root.querySelector("[data-bios-summary]");
    const quipNode = root.querySelector("[data-bios-quip]");
    const cpuValueNode = root.querySelector('[data-bios-value="cpu"]');
    const modemValueNode = root.querySelector('[data-bios-value="modem"]');
    const networkToggleButton = root.querySelector('[data-bios-action="toggle-network"]');
    const memoryToggleButton = root.querySelector('[data-bios-action="toggle-memory"]');
    const cacheToggleButton = root.querySelector('[data-bios-action="toggle-cache"]');
    const protectionToggleButton = root.querySelector('[data-bios-action="toggle-protection"]');
    const floppyToggleButton = root.querySelector('[data-bios-action="toggle-floppy"]');

    function spinOption(options, currentValue, direction) {
      const currentIndex = options.indexOf(currentValue);
      const startIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (startIndex + direction + options.length) % options.length;
      return options[nextIndex];
    }

    function updateSetupView() {
      if (cpuValueNode) {
        cpuValueNode.textContent = `${draftProfile.cpuMHz} MHz`;
      }

      if (modemValueNode) {
        modemValueNode.textContent =
          draftProfile.modemKbps >= 56 ? "56k (V.90)" : "33.6k (V.34)";
      }

      if (networkToggleButton) {
        networkToggleButton.textContent = draftProfile.networkTurbo
          ? "Turbo 10 MBps (Experimental)"
          : "NE2000 Compatible (2 MBps)";
      }

      if (memoryToggleButton) {
        memoryToggleButton.textContent =
          draftProfile.memoryTest === "full" ? "Full POST Test" : "Quick POST";
      }

      if (cacheToggleButton) {
        cacheToggleButton.textContent =
          draftProfile.cacheMode === "reckless" ? "Reckless Turbo" : "Safe";
      }

      if (protectionToggleButton) {
        protectionToggleButton.textContent = draftProfile.bootSectorProtection
          ? "Enabled"
          : "Disabled";
      }

      if (floppyToggleButton) {
        floppyToggleButton.textContent = draftProfile.floppyEnabled ? "1.44MB Enabled" : "Disabled";
      }

      if (summaryNode) {
        summaryNode.innerHTML = "";
        const summaryLines = [
          `CPU: ${getBiosCpuLabel(draftProfile)}`,
          `Network: ${getBiosNetworkLabel(draftProfile)}`,
          `Modem: ${getBiosModemLabel(draftProfile)}`,
          `Expected Boot Delay: ${(estimateBootDurationMs(draftProfile) / 1000).toFixed(1)}s`,
        ];

        for (const line of summaryLines) {
          const item = document.createElement("li");
          item.textContent = line;
          summaryNode.append(item);
        }
      }

      if (quipNode) {
        if (draftProfile.cpuMHz >= 80) {
          quipNode.textContent = "80MHz selected. This machine now runs on hope and airflow.";
          return;
        }

        if (draftProfile.networkTurbo && draftProfile.modemKbps >= 56) {
          quipNode.textContent =
            "Network turbo + 56k modem enabled. The internet has never loaded this quickly in 1995.";
          return;
        }

        quipNode.textContent = "Tip: Delete key got you here. F1 still boots Windows 95.";
      }
    }

    function closeSetup(saveDraft = false) {
      if (saveDraft) {
        biosProfile = writeBiosProfile(draftProfile);
      }

      powerOffMode = "post";
      render(OS_STATES.POWER_OFF);
    }

    function handleSetupAction(actionName) {
      if (actionName === "cpu-down") {
        draftProfile.cpuMHz = spinOption(BIOS_CPU_SPEED_OPTIONS, draftProfile.cpuMHz, -1);
      } else if (actionName === "cpu-up") {
        draftProfile.cpuMHz = spinOption(BIOS_CPU_SPEED_OPTIONS, draftProfile.cpuMHz, 1);
      } else if (actionName === "modem-down") {
        draftProfile.modemKbps = spinOption(BIOS_MODEM_SPEED_OPTIONS, draftProfile.modemKbps, -1);
      } else if (actionName === "modem-up") {
        draftProfile.modemKbps = spinOption(BIOS_MODEM_SPEED_OPTIONS, draftProfile.modemKbps, 1);
      } else if (actionName === "toggle-network") {
        draftProfile.networkTurbo = !draftProfile.networkTurbo;
      } else if (actionName === "toggle-memory") {
        draftProfile.memoryTest = draftProfile.memoryTest === "full" ? "quick" : "full";
      } else if (actionName === "toggle-cache") {
        draftProfile.cacheMode = draftProfile.cacheMode === "safe" ? "reckless" : "safe";
      } else if (actionName === "toggle-protection") {
        draftProfile.bootSectorProtection = !draftProfile.bootSectorProtection;
      } else if (actionName === "toggle-floppy") {
        draftProfile.floppyEnabled = !draftProfile.floppyEnabled;
      } else if (actionName === "load-ludicrous") {
        draftProfile = {
          ...draftProfile,
          cpuMHz: 80,
          networkTurbo: true,
          modemKbps: 56,
          memoryTest: "quick",
          cacheMode: "reckless",
          bootSectorProtection: false,
        };
      } else if (actionName === "load-safe") {
        draftProfile = {
          ...draftProfile,
          cpuMHz: 33,
          networkTurbo: false,
          modemKbps: 33,
          memoryTest: "full",
          cacheMode: "safe",
          bootSectorProtection: true,
          floppyEnabled: true,
        };
      } else if (actionName === "save-exit") {
        closeSetup(true);
        return;
      } else if (actionName === "cancel-exit") {
        closeSetup(false);
        return;
      } else if (actionName === "boot-now") {
        biosProfile = writeBiosProfile(draftProfile);
        requestBoot(biosProfile);
        return;
      }

      updateSetupView();
    }

    const clickHandler = (event) => {
      const source = event.target instanceof Element ? event.target : null;
      const trigger = source?.closest("[data-bios-action]");
      const actionName = trigger?.dataset.biosAction;

      if (!actionName) {
        return;
      }

      handleSetupAction(actionName);
    };

    const keydownHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSetup(false);
        return;
      }

      if (event.key === "F10") {
        event.preventDefault();
        closeSetup(true);
        return;
      }

      if (event.key === "F1") {
        event.preventDefault();
        biosProfile = writeBiosProfile(draftProfile);
        requestBoot(biosProfile);
      }
    };

    root.addEventListener("click", clickHandler);
    document.addEventListener("keydown", keydownHandler);
    cleanupFns.push(() => {
      root.removeEventListener("click", clickHandler);
      document.removeEventListener("keydown", keydownHandler);
    });

    updateSetupView();
    windowManager.setContainer(null);
  }

  function renderPowerOff() {
    root.className = "shell-root shell-root--state";

    if (!hasBootedOnce) {
      if (powerOffMode === "setup") {
        renderBiosSetup();
        return;
      }

      const biosPostLines = buildBiosPostLines(biosProfile);
      root.innerHTML = `
        <main class="bios95-screen" data-testid="os-state-screen">
          <section class="bios95-screen__viewport">
            <pre class="bios95-screen__text" data-bios-output></pre>
            <p class="bios95-screen__error" data-bios-error hidden>Keyboard error or no keyboard present</p>
            <p class="bios95-screen__prompt" data-bios-prompt hidden>Press F1 to continue, DEL to enter Setup</p>
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

      const renderNextBiosLine = () => {
        if (!outputNode) {
          return;
        }

        if (biosLineIndex >= biosPostLines.length) {
          errorNode?.removeAttribute("hidden");
          promptNode?.removeAttribute("hidden");
          hintNode?.removeAttribute("hidden");
          biosReadyForInput = true;
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

      renderNextBiosLine();

      const keydownHandler = (event) => {
        if (!biosReadyForInput) {
          return;
        }

        if (event.key === "F1") {
          event.preventDefault();
          requestBoot();
          return;
        }

        if (event.key === "Delete") {
          event.preventDefault();
          powerOffMode = "setup";
          render(OS_STATES.POWER_OFF);
        }
      };

      document.addEventListener("keydown", keydownHandler);
      cleanupFns.push(() => {
        if (biosTimerId !== null) {
          clearTimeout(biosTimerId);
        }
        document.removeEventListener("keydown", keydownHandler);
      });
      windowManager.setContainer(null);
      return;
    }

    root.innerHTML = `
      <main class="safeoff95-screen" data-testid="os-state-screen">
        <div class="safeoff95-screen__message">
          It is now safe to turn off your computer.
        </div>
        <p class="safeoff95-screen__hint">Power cycle required. This 386 has no soft restart.</p>
      </main>
    `;

    windowManager.setContainer(null);
  }

  function renderBooting() {
    root.className = "shell-root shell-root--state";
    root.innerHTML = `
      <main class="boot95-screen" data-testid="booting-screen">
        <section class="boot95-screen__prelude" data-boot-prelude>
          <pre class="boot95-screen__log" data-boot-log></pre>
          <p class="boot95-screen__status" data-boot-status>Performing startup sequence...</p>
        </section>
        <section class="boot95-screen__asset" data-boot-asset hidden>
          <img src="${BOOT_SCREEN_IMAGE_URL}" class="boot95-screen__image" alt="Windows 95 startup screen" />
          <div class="boot95-screen__bar"><span class="boot95-screen__bar-fill" data-boot-progress></span></div>
          <p class="boot95-screen__final-status" data-boot-final-status>Starting Windows 95 shell...</p>
        </section>
      </main>
    `;

    const preludeNode = root.querySelector("[data-boot-prelude]");
    const logNode = root.querySelector("[data-boot-log]");
    const statusNode = root.querySelector("[data-boot-status]");
    const bootAssetNode = root.querySelector("[data-boot-asset]");
    const progressNode = root.querySelector("[data-boot-progress]");
    const finalStatusNode = root.querySelector("[data-boot-final-status]");
    const bootLines = buildBootPreludeLines(biosProfile);
    const lineDurationMs = Math.max(240, Math.floor((pendingBootDurationMs * 0.42) / bootLines.length));
    const preludeExpectedDurationMs = lineDurationMs * bootLines.length;
    const progressPhaseDurationMs = Math.max(2200, pendingBootDurationMs - preludeExpectedDurationMs);

    let bootLineIndex = 0;
    let preludeTimerId = null;
    let progressIntervalId = null;

    function startProgressPhase() {
      preludeNode?.setAttribute("hidden", "hidden");
      bootAssetNode?.removeAttribute("hidden");
      const progressStartTimestamp = Date.now();

      progressIntervalId = window.setInterval(() => {
        if (!progressNode) {
          return;
        }

        const elapsedMs = Date.now() - progressStartTimestamp;
        const progressRatio = Math.min(1, elapsedMs / progressPhaseDurationMs);
        const jitter = (Math.sin(elapsedMs / 260) + 1) * 1.2;
        const visiblePercent = Math.min(97, Math.max(1, progressRatio * 100 - 1.8 + jitter));

        progressNode.style.width = `${visiblePercent}%`;

        if (!finalStatusNode) {
          return;
        }

        if (visiblePercent < 45) {
          finalStatusNode.textContent = "Loading VxD drivers...";
          return;
        }

        if (visiblePercent < 75) {
          finalStatusNode.textContent = "Initializing dial-up networking...";
          return;
        }

        finalStatusNode.textContent = "Painting desktop and taskbar...";
      }, 120);
    }

    function renderNextBootLine() {
      if (bootLineIndex >= bootLines.length) {
        if (statusNode) {
          statusNode.textContent = "DOS phase complete.";
        }
        startProgressPhase();
        return;
      }

      const nextLine = bootLines[bootLineIndex];
      if (logNode) {
        logNode.textContent = logNode.textContent
          ? `${logNode.textContent}\n${nextLine}`
          : nextLine;
      }
      if (statusNode) {
        statusNode.textContent = nextLine;
      }
      bootLineIndex += 1;
      preludeTimerId = window.setTimeout(
        renderNextBootLine,
        Math.max(lineDurationMs, getBootPreludeLineDelayMs(nextLine)),
      );
    }

    renderNextBootLine();

    const bootAudio = new Audio(BOOT_SOUND_URL);
    bootAudio.volume = 0.86;
    void bootAudio.play().catch(() => {});

    cleanupFns.push(() => {
      if (preludeTimerId !== null) {
        clearTimeout(preludeTimerId);
      }

      if (progressIntervalId !== null) {
        clearInterval(progressIntervalId);
      }

      bootAudio.pause();
      bootAudio.src = "";
    });

    windowManager.setContainer(null);
  }

  function renderShutdown(state) {
    root.className = "shell-root shell-root--state";

    if (state === OS_STATES.SHUTDOWN_INIT) {
      root.innerHTML = `
        <main class="shutdown95-screen" data-testid="shutdown-screen">
          <p class="shutdown95-screen__text">Windows is shutting down...</p>
        </main>
      `;
      windowManager.setContainer(null);
      return;
    }

    root.innerHTML = `
      <main class="shutdown95-media" data-testid="shutdown-screen">
        <video class="shutdown95-media__video" autoplay playsinline preload="auto">
          <source src="${SHUTDOWN_VIDEO_URL}" type="video/mp4" />
        </video>
      </main>
    `;

    const video = root.querySelector(".shutdown95-media__video");
    if (video instanceof HTMLVideoElement) {
      video.volume = 0.9;
      void video.play().catch(() => {});
    }

    windowManager.setContainer(null);
  }

  function renderDesktop() {
    root.className = "shell-root shell-root--desktop";
    clockProfile = readClockProfile();
    const storedIconPositions = readDesktopIconPositionsFromStorage();

    const desktopApps = appRegistry
      .listApps({ placement: "desktop" })
      .sort((leftApp, rightApp) => leftApp.title.localeCompare(rightApp.title));

    root.innerHTML = `
      <main class="desktop-shell" role="application" aria-label="Windows 95 style portfolio shell" data-testid="desktop-shell">
        <section class="desktop-surface" data-desktop-surface>
          <div class="desktop-icons" data-desktop-icons></div>
          <div class="window-layer" data-window-layer></div>
        </section>
        <footer class="taskbar" data-testid="taskbar">
          <button type="button" class="taskbar__start" data-action="toggle-start" data-testid="start-button">
            <span class="taskbar__start-icon" data-start-logo></span>
            <span class="taskbar__start-text">Start</span>
          </button>
          <div class="taskbar__windows" data-task-windows aria-label="Open windows"></div>
          <div class="taskbar__right">
            <div class="taskbar__systray" data-systray></div>
            <div class="taskbar__clock" data-clock></div>
          </div>
        </footer>
        <section data-start-menu></section>
      </main>
    `;

    const desktopShellNode = root.querySelector(".desktop-shell");
    const iconContainer = root.querySelector("[data-desktop-icons]");
    const startMenuNode = root.querySelector("[data-start-menu]");
    const startButton = root.querySelector('[data-action="toggle-start"]');
    const startLogoMount = root.querySelector("[data-start-logo]");
    const clockNode = root.querySelector("[data-clock]");
    const systrayNode = root.querySelector("[data-systray]");
    const taskWindowsNode = root.querySelector("[data-task-windows]");
    const windowLayer = root.querySelector("[data-window-layer]");

    startLogoMount?.append(createWindowsLogoGlyph({ compact: true }));

    windowManager.setContainer(windowLayer);

    const contextMenu = createContextMenu({
      container: desktopShellNode,
    });
    cleanupFns.push(() => contextMenu.destroy());

    const desktopIconSurface = createIconSurface({
      container: iconContainer,
      items: desktopApps.map((app) => ({
        id: `desktop-${app.id}`,
        appId: app.id,
        label: app.title,
        iconKey: app.iconKey,
      })),
      ariaLabel: "Desktop icons",
      draggable: true,
      initialPositions: storedIconPositions,
      onPositionsChanged(nextPositions) {
        persistDesktopIconPositions(nextPositions);
      },
      onActivate: (item) => {
        if (item.appId) {
          eventBus.emit("shell:app-launch-requested", { appId: item.appId });
        }
      },
      onContextMenu(details) {
        if (details.type === "item") {
          contextMenu.open({
            x: details.x,
            y: details.y,
            entries: [
              {
                id: `desktop-open-${details.item.id}`,
                label: "Open",
                iconKey: details.item.iconKey,
                action: "open",
              },
              { type: "separator" },
              {
                id: `desktop-shortcut-${details.item.id}`,
                label: "Create Shortcut",
                iconKey: "folder",
                action: "shortcut",
                disabled: true,
              },
              {
                id: `desktop-delete-${details.item.id}`,
                label: "Delete",
                iconKey: "recycle_bin",
                action: "delete",
                disabled: true,
              },
              {
                id: `desktop-rename-${details.item.id}`,
                label: "Rename",
                iconKey: "document",
                action: "rename",
                disabled: true,
              },
              { type: "separator" },
              {
                id: `desktop-props-${details.item.id}`,
                label: "Properties",
                iconKey: "settings",
                action: "properties",
              },
            ],
            onSelect(entry) {
              if (entry.action === "open") {
                eventBus.emit("shell:app-launch-requested", {
                  appId: details.item.appId,
                });
                return;
              }

              if (entry.action === "properties") {
                eventBus.emit("shell:app-launch-requested", {
                  appId: "about-matijar",
                });
              }
            },
          });

          return;
        }

        contextMenu.open({
          x: details.x,
          y: details.y,
          entries: [
            {
              id: "desktop-arrange",
              label: "Arrange Icons",
              iconKey: "folder",
              children: [
                { id: "arrange-name", label: "by Name", iconKey: "document", disabled: true },
                { id: "arrange-type", label: "by Type", iconKey: "document", disabled: true },
                { id: "arrange-auto", label: "Auto Arrange", iconKey: "settings", disabled: true },
              ],
            },
            {
              id: "desktop-refresh",
              label: "Refresh",
              iconKey: "document",
              action: "refresh",
            },
            { type: "separator" },
            {
              id: "desktop-properties",
              label: "Properties",
              iconKey: "settings",
              action: "properties",
            },
          ],
          onSelect(entry) {
            if (entry.action === "refresh") {
              desktopIconSurface.clearSelection();
              return;
            }

            if (entry.action === "properties") {
              eventBus.emit("shell:app-launch-requested", { appId: "control-panel" });
            }
          },
        });
      },
    });

    cleanupFns.push(() => desktopIconSurface.destroy());

    const startMenu = createStartMenu({
      root: startMenuNode,
      entries: createStartMenuEntries(appRegistry),
      onVisibilityChange() {
        syncStartButtonState();
      },
      onSelect(entry) {
        if (entry.type === "app" && entry.appId) {
          eventBus.emit("shell:app-launch-requested", { appId: entry.appId });
          return;
        }

        if (entry.type !== "command") {
          return;
        }

        if (entry.command === "run") {
          eventBus.emit("shell:app-launch-requested", { appId: "run-dialog" });
        }

        if (entry.command === "shutdown") {
          eventBus.emit("shell:shutdown-requested");
        }
      },
    });

    function syncStartButtonState() {
      startButton?.classList.toggle("is-open", startMenu.isOpen());
    }

    cleanupFns.push(() => startMenu.destroy());
    syncStartButtonState();

    if (startButton) {
      const startClickHandler = (event) => {
        event.stopPropagation();
        if (contextMenu.isOpen()) {
          contextMenu.close();
        }
        startMenu.toggle();
        syncStartButtonState();
      };

      startButton.addEventListener("click", startClickHandler);
      cleanupFns.push(() => startButton.removeEventListener("click", startClickHandler));
    }

    const outsideClickHandler = (event) => {
      const target = event.target;

      if (startMenuNode.contains(target) || target === startButton || startButton?.contains(target)) {
        return;
      }

      startMenu.close();
      syncStartButtonState();
    };

    document.addEventListener("pointerdown", outsideClickHandler);
    cleanupFns.push(() =>
      document.removeEventListener("pointerdown", outsideClickHandler),
    );

    const systemTray = createSystemTray({
      container: systrayNode,
      items: [
        {
          id: "tray-volume",
          label: "Volume Control",
          iconKey: "volume",
          command: "open-control-panel",
        },
        {
          id: "tray-network",
          label: `Network Adapter: ${getBiosNetworkLabel(biosProfile)}`,
          iconKey: "network",
          command: "open-browser",
        },
        {
          id: "tray-modem",
          label: `Dial-Up Modem: ${getBiosModemLabel(biosProfile)}`,
          iconKey: "modem",
          command: "open-datetime",
        },
      ],
      onSelect(item) {
        if (item.command === "open-control-panel") {
          eventBus.emit("shell:app-launch-requested", { appId: "control-panel" });
        }

        if (item.command === "open-browser") {
          eventBus.emit("shell:app-launch-requested", {
            appId: "internet-explorer",
          });
        }

        if (item.command === "open-datetime") {
          eventBus.emit("shell:app-launch-requested", {
            appId: "date-time-properties",
          });
        }
      },
    });

    cleanupFns.push(() => systemTray.destroy());

    const updateClock = () => {
      if (!clockNode) {
        return;
      }

      const virtualNow = getClockDate(clockProfile);
      clockNode.textContent = formatClockTime(clockProfile, virtualNow);
      clockNode.title = formatClockTooltip(clockProfile, virtualNow);
    };

    updateClock();

    const openClockProperties = () => {
      eventBus.emit("shell:app-launch-requested", { appId: "date-time-properties" });
    };

    if (clockNode) {
      clockNode.tabIndex = 0;
      clockNode.setAttribute("role", "button");
      clockNode.setAttribute("aria-label", "Clock. Double-click to open Date/Time Properties.");

      const clockDoubleClickHandler = (event) => {
        event.stopPropagation();
        openClockProperties();
      };

      const clockKeydownHandler = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openClockProperties();
        }
      };

      clockNode.addEventListener("dblclick", clockDoubleClickHandler);
      clockNode.addEventListener("keydown", clockKeydownHandler);
      cleanupFns.push(() => {
        clockNode.removeEventListener("dblclick", clockDoubleClickHandler);
        clockNode.removeEventListener("keydown", clockKeydownHandler);
      });
    }

    const clockInterval = setInterval(updateClock, 1000);
    cleanupFns.push(() => clearInterval(clockInterval));
    cleanupFns.push(
      eventBus.on("clock:profile-changed", ({ profile }) => {
        clockProfile = profile || readClockProfile();
        updateClock();
      }),
    );

    function openSystemMenuForWindow(windowId, coordinates) {
      const windowState = windowManager.getWindow(windowId);

      if (!windowState) {
        return;
      }

      contextMenu.open({
        x: coordinates.x,
        y: coordinates.y,
        entries: buildSystemMenuEntries(windowState),
        onSelect(entry) {
          if (entry.action === "restore") {
            if (windowState.minimized) {
              windowManager.restoreWindow(windowId);
              return;
            }

            if (windowState.maximized) {
              windowManager.restoreMaximizedWindow(windowId);
            }
            return;
          }

          if (entry.action === "minimize") {
            windowManager.minimizeWindow(windowId);
            return;
          }

          if (entry.action === "toggle-maximize") {
            windowManager.toggleMaximizeWindow(windowId);
            return;
          }

          if (entry.action === "close") {
            windowManager.closeWindow(windowId);
          }
        },
      });
    }

    const renderTaskButtons = () => {
      if (!taskWindowsNode) {
        return;
      }

      taskWindowsNode.innerHTML = "";

      const windows = windowManager.listWindows();

      if (windows.length === 0) {
        return;
      }

      for (const windowRecord of windows) {
        const taskButton = document.createElement("button");
        taskButton.type = "button";
        taskButton.className = "taskbar__window";
        taskButton.dataset.windowId = windowRecord.id;

        const appManifest = appRegistry.getApp(windowRecord.appId);
        taskButton.append(createIconGlyph(appManifest?.iconKey, { compact: true }));

        const labelNode = document.createElement("span");
        labelNode.className = "taskbar__window-label";
        labelNode.textContent = windowRecord.title;
        taskButton.append(labelNode);

        if (windowRecord.focused && !windowRecord.minimized) {
          taskButton.classList.add("is-active");
        }

        if (windowRecord.minimized) {
          taskButton.classList.add("is-minimized");
        }

        taskButton.addEventListener("click", () => {
          if (windowRecord.minimized) {
            windowManager.restoreWindow(windowRecord.id);
            return;
          }

          if (windowRecord.focused) {
            windowManager.minimizeWindow(windowRecord.id);
            return;
          }

          windowManager.focusWindow(windowRecord.id);
        });

        taskButton.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          openSystemMenuForWindow(windowRecord.id, {
            x: event.clientX,
            y: event.clientY,
          });
        });

        taskWindowsNode.append(taskButton);
      }
    };

    renderTaskButtons();

    const taskbarEvents = [
      "window:opened",
      "window:closed",
      "window:minimized",
      "window:restored",
      "window:focused",
      "window:resized",
      "window:maximized",
      "window:restored-size",
    ];

    for (const eventName of taskbarEvents) {
      cleanupFns.push(eventBus.on(eventName, renderTaskButtons));
    }

    const titlebarContextHandler = (event) => {
      const titlebar = event.target.closest(".os-window__titlebar");

      if (!titlebar) {
        return;
      }

      const windowNode = titlebar.closest(".os-window");
      const windowId = windowNode?.dataset.windowId;

      if (!windowId) {
        return;
      }

      event.preventDefault();
      openSystemMenuForWindow(windowId, {
        x: event.clientX,
        y: event.clientY,
      });
    };

    windowLayer.addEventListener("contextmenu", titlebarContextHandler);
    cleanupFns.push(() =>
      windowLayer.removeEventListener("contextmenu", titlebarContextHandler),
    );

    const keyboardHandler = (event) => {
      if (event.key === "Escape") {
        if (contextMenu.isOpen()) {
          contextMenu.close();
          return;
        }

        if (startMenu.isOpen()) {
          startMenu.close();
          syncStartButtonState();
          return;
        }

        desktopIconSurface.clearSelection();
        return;
      }

      if (event.altKey && event.key === "Tab") {
        event.preventDefault();
        windowManager.cycleFocus(event.shiftKey ? -1 : 1);
        return;
      }

      if (event.altKey && event.key === "F4") {
        event.preventDefault();
        const activeWindowId = windowManager.getActiveWindowId();

        if (activeWindowId) {
          windowManager.closeWindow(activeWindowId);
        }
        return;
      }

      if (event.ctrlKey && event.key === "Escape") {
        event.preventDefault();
        startMenu.open();
        syncStartButtonState();
      }
    };

    document.addEventListener("keydown", keyboardHandler);
    cleanupFns.push(() => document.removeEventListener("keydown", keyboardHandler));
  }

  function render(state) {
    clearSideEffects();

    if (state === OS_STATES.POWER_OFF) {
      renderPowerOff();
      return;
    }

    if (state === OS_STATES.BOOTING) {
      renderBooting();
      return;
    }

    if (state === OS_STATES.DESKTOP_READY) {
      hasBootedOnce = true;
      renderDesktop();
      return;
    }

    if (state === OS_STATES.SHUTDOWN_INIT || state === OS_STATES.SHUTTING_DOWN) {
      renderShutdown(state);
    }
  }

  function unmount() {
    clearSideEffects();
    windowManager.setContainer(null);
    root.className = "";
    root.innerHTML = "";
  }

  return {
    render,
    unmount,
  };
}
