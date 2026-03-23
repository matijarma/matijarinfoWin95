import { OS_STATES } from "../core/os-kernel/states.js";
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
const BIOS_POST_LINES = [
  "Phoenix BIOS A486 Version 1.10",
  "Copyright 1985-1994 Phoenix Technologies Ltd.",
  "",
  "CPU = Intel 80386DX (33 MHz)",
  "Memory Test: 8192K OK",
  "Primary Master: 256MB IDE HDD",
  "Primary Slave: None",
  "Secondary Master: ATAPI CD-ROM",
  "Secondary Slave: None",
  "",
  "Detecting floppy drive A... 1.44MB",
  "Initializing Plug and Play cards...",
];

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
      children: [createAppEntry("control-panel")].filter(Boolean),
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

  function clearSideEffects() {
    while (cleanupFns.length > 0) {
      const cleanupFn = cleanupFns.pop();
      cleanupFn?.();
    }
  }

  function renderPowerOff() {
    root.className = "shell-root shell-root--state";
    if (!hasBootedOnce) {
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

        if (biosLineIndex >= BIOS_POST_LINES.length) {
          errorNode?.removeAttribute("hidden");
          promptNode?.removeAttribute("hidden");
          hintNode?.removeAttribute("hidden");
          biosReadyForInput = true;
          return;
        }

        const nextLine = BIOS_POST_LINES[biosLineIndex];
        outputNode.textContent = outputNode.textContent
          ? `${outputNode.textContent}\n${nextLine}`
          : nextLine;
        outputNode.scrollTop = outputNode.scrollHeight;
        biosLineIndex += 1;
        biosTimerId = window.setTimeout(renderNextBiosLine, getBiosLineDelayMs(nextLine));
      };

      renderNextBiosLine();

      const keydownHandler = (event) => {
        if (event.key !== "F1" || !biosReadyForInput) {
          return;
        }

        event.preventDefault();
        eventBus.emit("shell:power-on-requested");
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
      </main>
    `;

    windowManager.setContainer(null);
  }

  function renderBooting() {
    root.className = "shell-root shell-root--state";
    root.innerHTML = `
      <main class="boot95-screen" data-testid="booting-screen">
        <section class="boot95-screen__asset">
          <img src="${BOOT_SCREEN_IMAGE_URL}" class="boot95-screen__image" alt="Windows 95 startup screen" />
          <div class="boot95-screen__bar"><span class="boot95-screen__bar-fill"></span></div>
        </section>
      </main>
    `;

    const bootAudio = new Audio(BOOT_SOUND_URL);
    bootAudio.volume = 0.86;
    void bootAudio.play().catch(() => {});

    cleanupFns.push(() => {
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

    cleanupFns.push(() => startMenu.destroy());

    if (startButton) {
      const startClickHandler = (event) => {
        event.stopPropagation();
        if (contextMenu.isOpen()) {
          contextMenu.close();
        }
        startMenu.toggle();
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
          label: "Network",
          iconKey: "network",
          command: "open-browser",
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
      },
    });

    cleanupFns.push(() => systemTray.destroy());

    const updateClock = () => {
      if (!clockNode) {
        return;
      }

      clockNode.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    updateClock();

    const clockInterval = setInterval(updateClock, 1000);
    cleanupFns.push(() => clearInterval(clockInterval));

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
