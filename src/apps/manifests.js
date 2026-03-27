import { createFolderWindow } from "./folder-window.js";
import { createTaskManagerContent } from "./task-manager.js";
import { createWebAppManifests } from "./web-apps.js";
import {
  CLOCK_LOCALE_OPTIONS,
  TIMEZONE_PRESETS,
  convertZonedDateTimeToUtcMs,
  formatClockTooltip,
  formatClockTime,
  getClockDate,
  getBiosModemLabel,
  getBiosNetworkLabel,
  getClockInputValues,
  getTimeZoneMapPositionPercent,
  getTimeZonePresetById,
  readBiosProfile,
  readClockProfile,
  writeClockProfile,
} from "../core/system-preferences/index.js";

function createAboutContent(fileLayer) {
  const wrapper = document.createElement("section");
  wrapper.className = "app-about";

  const heading = document.createElement("h2");
  heading.textContent = "Portfolio Workstation";

  const text = document.createElement("p");
  text.textContent =
    "Win95 simulation scaffold. Core shell systems are active; portfolio content and media integrations expand from here.";

  const docsHeading = document.createElement("h3");
  docsHeading.textContent = "Virtual Files";

  const docsList = document.createElement("ul");
  docsList.className = "app-about__docs";

  for (const doc of fileLayer.listDocuments()) {
    const item = document.createElement("li");
    item.textContent = `${doc.name}: ${doc.content}`;
    docsList.append(item);
  }

  wrapper.append(heading, text, docsHeading, docsList);

  return wrapper;
}

function resolveFileSystemOsKey(candidateProfile) {
  const normalized = String(candidateProfile || "")
    .trim()
    .toLowerCase();

  if (normalized.includes("linux") || normalized.includes("ubuntu")) {
    return "linux";
  }

  if (normalized.includes("xp")) {
    return "winxp";
  }

  return "win95";
}

function createMyComputerContent(launchApp, fileLayer, { desktopProfile } = {}) {
  const osKey = resolveFileSystemOsKey(desktopProfile);
  const biosProfile = readBiosProfile();
  const floppyLabel = biosProfile.floppyEnabled
    ? "3 1/2 Floppy (A:)"
    : "3 1/2 Floppy (A:) (Disabled in BIOS)";
  const mountedVolumes = fileLayer.listMountRoots({ os: osKey }).map((volume, index) => {
    const partition = volume.partition || {};
    const partitionDetails = [partition.fileSystem, partition.devicePath]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" · ");

    return {
      id: `my-computer-volume-${index + 1}`,
      label: partitionDetails ? `${volume.label} ${partitionDetails}` : volume.label,
      iconKey: "drive_hdd",
      nodeType: "directory",
      path: volume.path,
      os: osKey,
    };
  });

  return createFolderWindow({
    title: "My Computer",
    subtitle: "Tri-boot SYS drive + shared exFAT storage.",
    items: [
      {
        id: "my-computer-floppy",
        label: floppyLabel,
        iconKey: "drive_floppy",
      },
      ...mountedVolumes,
      {
        id: "my-computer-ie",
        label: "Internet Explorer",
        iconKey: "internet_explorer",
        appId: "internet-explorer",
      },
      {
        id: "my-computer-control-panel",
        label: "Control Panel",
        iconKey: "control_panel",
        appId: "control-panel",
      },
      {
        id: "my-computer-network-neighborhood",
        label: "Network Neighborhood",
        iconKey: "network",
        appId: "network-status",
      },
      {
        id: "my-computer-dialup",
        label: "Dial-Up Networking",
        iconKey: "modem",
        appId: "network-status",
        launchPayload: {
          focus: "modem",
        },
      },
      {
        id: "my-computer-recycle-bin",
        label: "Recycle Bin",
        iconKey: "recycle_bin",
        appId: "recycle-bin",
      },
      {
        id: "my-computer-portfolio",
        label: "Portfolio Briefcase",
        iconKey: "folder",
        appId: "about-matijar",
      },
    ],
    onItemActivate: (item) => {
      if (item.path) {
        launchApp("mock-file-browser", {
          os: item.os || osKey,
          path: item.path,
          title: item.label,
        });
        return true;
      }

      if (item.appId) {
        launchApp(item.appId, item.launchPayload);
        return true;
      }

      return false;
    },
  });
}

function createMockFileBrowserContent({
  fileLayer,
  launchApp,
  launchPayload = {},
  desktopProfile,
} = {}) {
  const osKey = resolveFileSystemOsKey(launchPayload.os || desktopProfile);
  const requestedPath =
    typeof launchPayload.path === "string" ? launchPayload.path.trim() : "";
  const listing =
    fileLayer.listDirectory({
      os: osKey,
      path: requestedPath,
    }) || fileLayer.listDirectory({ os: osKey });

  if (!listing) {
    const errorRoot = document.createElement("section");
    errorRoot.className = "file-viewer";
    errorRoot.innerHTML = `
      <header class="file-viewer__header">
        <h2>File Explorer</h2>
      </header>
      <pre class="file-viewer__content">Path is unavailable in the current mock filesystem map.</pre>
      <p class="file-viewer__status">Missing path: ${requestedPath || "(root)"}</p>
    `;
    return errorRoot;
  }

  const explorerItems = (listing.entries || []).map((entry) => ({
    id: entry.id || `${entry.type}-${entry.path || entry.label}`,
    label: entry.label || entry.name || entry.path || "Unknown",
    iconKey: entry.iconKey || (entry.type === "directory" ? "folder" : "document"),
    nodeType: entry.nodeType || entry.type,
    path: entry.path,
    os: osKey,
    launchAppId: entry.launchAppId || null,
    launchPayload: entry.launchPayload,
  }));

  const title =
    (typeof launchPayload.title === "string" && launchPayload.title.trim()) ||
    listing.path ||
    "File Explorer";
  const subtitle = listing.partition
    ? `${listing.partition.volumeName} · ${listing.partition.fileSystem} · ${listing.partition.devicePath || "virtual-device"}`
    : `Mounted volumes for ${osKey}`;

  return createFolderWindow({
    title,
    subtitle,
    items: explorerItems,
    onItemActivate(item) {
      if (!item || typeof item !== "object") {
        return false;
      }

      if (item.nodeType === "directory" || item.nodeType === "mount") {
        launchApp("mock-file-browser", {
          os: item.os || osKey,
          path: item.path,
          title: item.label,
        });
        return true;
      }

      if (item.launchAppId) {
        launchApp(item.launchAppId, item.launchPayload);
        return true;
      }

      if (!item.path) {
        return false;
      }

      launchApp("mock-file-viewer", {
        os: item.os || osKey,
        path: item.path,
        title: item.label,
      });

      return true;
    },
    onItemProperties(item) {
      if (!item?.path) {
        return;
      }

      launchApp("mock-file-viewer", {
        os: item.os || osKey,
        path: item.path,
        title: item.label,
        mode: "properties",
      });
    },
  });
}

function createMockFileViewerContent({
  fileLayer,
  launchPayload = {},
  launchApp,
  desktopProfile,
} = {}) {
  const osKey = resolveFileSystemOsKey(launchPayload.os || desktopProfile);
  const targetPath =
    typeof launchPayload.path === "string" ? launchPayload.path.trim() : "";
  const root = document.createElement("section");
  root.className = "file-viewer";
  root.innerHTML = `
    <header class="file-viewer__header">
      <h2>File Viewer</h2>
      <p class="file-viewer__meta" data-file-viewer-meta>Loading...</p>
    </header>
    <pre class="file-viewer__content" data-file-viewer-content>Loading content...</pre>
    <p class="file-viewer__status" data-file-viewer-status>Ready.</p>
  `;

  const metadataNode = root.querySelector("[data-file-viewer-meta]");
  const contentNode = root.querySelector("[data-file-viewer-content]");
  const statusNode = root.querySelector("[data-file-viewer-status]");
  const isPropertiesMode = launchPayload.mode === "properties";
  let disposed = false;

  function setStatus(text) {
    if (statusNode) {
      statusNode.textContent = text;
    }
  }

  function setMetadata(text) {
    if (metadataNode) {
      metadataNode.textContent = text;
    }
  }

  function setContent(text) {
    if (contentNode) {
      contentNode.textContent = text;
    }
  }

  async function renderFileView() {
    if (!targetPath) {
      setMetadata("No target path.");
      setContent("No path payload was provided.");
      setStatus("Unable to open file.");
      return;
    }

    setMetadata(`${osKey} · ${targetPath}`);
    setStatus("Opening...");

    const accessResult = await fileLayer.accessPath({
      os: osKey,
      path: targetPath,
    });

    if (disposed) {
      return;
    }

    if (!accessResult || typeof accessResult !== "object") {
      setContent("Unknown file access result.");
      setStatus("Access failed.");
      return;
    }

    if (accessResult.kind === "action" && accessResult.actionType === "launch-app") {
      if (typeof accessResult.appId === "string" && accessResult.appId) {
        launchApp(accessResult.appId, accessResult.launchPayload);
        setContent(`Delegated to app launch: ${accessResult.appId}`);
        setStatus("Executed mapped action.");
        return;
      }

      setContent("Mapped action is missing appId.");
      setStatus("Action mapping error.");
      return;
    }

    if (accessResult.kind === "directory") {
      const listingEntries = accessResult.listing?.entries || [];
      const directoryPreview =
        listingEntries.length > 0
          ? listingEntries
              .map((entry) =>
                entry.type === "directory" ? `${entry.label}/` : entry.label,
              )
              .join("\n")
          : "(empty directory)";

      setContent(directoryPreview);
      setStatus("Directory listed.");
      return;
    }

    if (accessResult.kind === "file") {
      const sourceToken = accessResult.simulated
        ? `${accessResult.source} (simulated)`
        : accessResult.source;
      const partitionLabel = accessResult.partition?.volumeName || "unknown";
      setMetadata(`${targetPath} · ${partitionLabel} · ${sourceToken}`);

      if (isPropertiesMode) {
        setContent(
          [
            `Path: ${targetPath}`,
            `OS: ${osKey}`,
            `Source: ${sourceToken}`,
            `Partition: ${partitionLabel}`,
            `MIME: ${accessResult.mimeType || "text/plain"}`,
          ].join("\n"),
        );
        setStatus("Properties loaded.");
        return;
      }

      setContent(String(accessResult.content || ""));
      setStatus(accessResult.simulated ? "Opened simulated file." : "Opened file.");
      return;
    }

    setContent(
      accessResult.reason || "Path is unavailable in the current filesystem map.",
    );
    setStatus("Missing path.");
  }

  void renderFileView();

  return {
    element: root,
    dispose() {
      disposed = true;
    },
  };
}

function createRecycleBinContent() {
  return createFolderWindow({
    title: "Recycle Bin",
    subtitle: "Items waiting to be permanently removed.",
    items: [
      {
        id: "trash-note-1",
        label: "Old Portfolio Draft.txt",
        iconKey: "document",
      },
      {
        id: "trash-note-2",
        label: "Unused Theme.css",
        iconKey: "document",
      },
    ],
    onItemActivate: () => {
      // Placeholder behavior for baseline scaffold.
    },
  });
}

function createControlPanelContent(launchApp) {
  return createFolderWindow({
    title: "Control Panel",
    subtitle: "Double-click an icon to open a settings category.",
    items: [
      { id: "cp-accessibility", label: "Accessibility Options", iconKey: "settings" },
      { id: "cp-add-hardware", label: "Add New Hardware", iconKey: "settings" },
      { id: "cp-add-remove", label: "Add/Remove Programs", iconKey: "settings" },
      { id: "cp-display", label: "Display", iconKey: "settings" },
      { id: "cp-fonts", label: "Fonts", iconKey: "document" },
      { id: "cp-game-controllers", label: "Game Controllers", iconKey: "settings" },
      {
        id: "cp-internet",
        label: "Internet",
        iconKey: "internet_explorer",
        appId: "internet-explorer",
      },
      { id: "cp-keyboard", label: "Keyboard", iconKey: "settings" },
      {
        id: "cp-modems",
        label: "Modems",
        iconKey: "modem",
        appId: "network-status",
        launchPayload: {
          focus: "modem",
        },
      },
      { id: "cp-mouse", label: "Mouse", iconKey: "settings" },
      { id: "cp-multimedia", label: "Multimedia", iconKey: "volume" },
      { id: "cp-network", label: "Network", iconKey: "network", appId: "network-status" },
      { id: "cp-passwords", label: "Passwords", iconKey: "settings" },
      { id: "cp-power", label: "Power", iconKey: "settings" },
      { id: "cp-printers", label: "Printers", iconKey: "folder" },
      { id: "cp-regional", label: "Regional Settings", iconKey: "settings" },
      { id: "cp-sounds", label: "Sounds", iconKey: "volume" },
      { id: "cp-system", label: "System", iconKey: "computer" },
      {
        id: "cp-clock",
        label: "Date/Time",
        iconKey: "clock",
        appId: "date-time-properties",
      },
    ],
    onItemActivate(item) {
      if (!item.appId) {
        return false;
      }

      launchApp(item.appId, item.launchPayload);
      return true;
    },
    onItemProperties(item) {
      if (!item.appId) {
        return;
      }

      launchApp(item.appId, item.launchPayload);
    },
  });
}

function createNetworkStatusContent(launchPayload = {}) {
  const root = document.createElement("section");
  root.className = "network-status";
  root.innerHTML = `
    <header class="network-status__header">
      <h2>Network Status</h2>
      <p class="network-status__subtitle">BIOS Ethernet profile and active Windows networking stack.</p>
    </header>
    <section class="network-status__panel">
      <div class="network-status__grid">
        <span class="network-status__label">Adapter</span>
        <span data-network-field="adapter"></span>
        <span class="network-status__label">BIOS Profile</span>
        <span data-network-field="profile"></span>
        <span class="network-status__label">Link Throughput</span>
        <span data-network-field="throughput"></span>
        <span class="network-status__label">Stack</span>
        <span data-network-field="stack"></span>
        <span class="network-status__label">IRQ / I-O Base</span>
        <span data-network-field="io"></span>
        <span class="network-status__label">Dial-Up Fallback</span>
        <span data-network-field="modem"></span>
      </div>
    </section>
    <footer class="network-status__footer">
      <div class="network-status__actions">
        <button type="button" class="network-status__button" data-network-action="refresh">Refresh</button>
      </div>
      <p class="network-status__status" data-network-status>Ready.</p>
    </footer>
  `;

  const adapterNode = root.querySelector('[data-network-field="adapter"]');
  const profileNode = root.querySelector('[data-network-field="profile"]');
  const throughputNode = root.querySelector('[data-network-field="throughput"]');
  const stackNode = root.querySelector('[data-network-field="stack"]');
  const ioNode = root.querySelector('[data-network-field="io"]');
  const modemNode = root.querySelector('[data-network-field="modem"]');
  const statusNode = root.querySelector("[data-network-status]");
  const refreshButton = root.querySelector('[data-network-action="refresh"]');

  function setStatus(textContent) {
    if (statusNode) {
      statusNode.textContent = textContent;
    }
  }

  function renderBiosNetworkStatus(statusMessage) {
    const biosProfile = readBiosProfile();
    const isTurbo = biosProfile.networkTurbo;

    if (adapterNode) {
      adapterNode.textContent = isTurbo
        ? "3Com EtherLink III (Turbo bridge mode)"
        : "Novell NE2000 Compatible";
    }

    if (profileNode) {
      profileNode.textContent = getBiosNetworkLabel(biosProfile);
    }

    if (throughputNode) {
      throughputNode.textContent = isTurbo
        ? "10.0 MBps (full duplex)"
        : "2.0 MBps (compatibility mode)";
    }

    if (stackNode) {
      stackNode.textContent = isTurbo ? "TCP/IP + NetBEUI" : "TCP/IP + IPX/SPX";
    }

    if (ioNode) {
      ioNode.textContent = isTurbo ? "IRQ 10 / 0300h" : "IRQ 5 / 0320h";
    }

    if (modemNode) {
      modemNode.textContent = getBiosModemLabel(biosProfile);
    }

    setStatus(statusMessage || "Status refreshed from BIOS profile.");
  }

  const refreshHandler = () => {
    renderBiosNetworkStatus("Status refreshed from BIOS profile.");
  };

  if (refreshButton instanceof HTMLButtonElement) {
    refreshButton.addEventListener("click", refreshHandler);
  }

  const openedFromModemTray = launchPayload && launchPayload.focus === "modem";
  renderBiosNetworkStatus(
    openedFromModemTray
      ? "Opened from modem path. Showing Ethernet profile with dial-up fallback."
      : "Ready.",
  );

  return {
    element: root,
    dispose() {
      if (refreshButton instanceof HTMLButtonElement) {
        refreshButton.removeEventListener("click", refreshHandler);
      }
    },
  };
}

function createDateTimePropertiesContent({ eventBus } = {}) {
  const root = document.createElement("section");
  root.className = "clock-properties";
  root.innerHTML = `
    <header class="clock-properties__header">
      <h2>Date/Time Properties</h2>
      <p class="clock-properties__subtitle">Set the system clock and select your timezone.</p>
    </header>
    <div class="clock-properties__tabs">
      <button type="button" class="clock-properties__tab is-active" data-tab-button="datetime">Date &amp; Time</button>
      <button type="button" class="clock-properties__tab" data-tab-button="timezone">Time Zone</button>
    </div>
    <section class="clock-properties__panel" data-tab-panel="datetime">
      <p class="clock-properties__preview" data-clock-preview></p>
      <div class="clock-properties__fields">
        <label class="clock-properties__field">
          <span>Date</span>
          <input type="date" class="clock-properties__input" data-clock-date />
        </label>
        <label class="clock-properties__field">
          <span>Time</span>
          <input type="time" class="clock-properties__input" data-clock-time step="60" />
        </label>
      </div>
      <div class="clock-properties__inline-actions">
        <button type="button" class="clock-properties__button" data-action="set-clock">Set Clock</button>
      </div>
    </section>
    <section class="clock-properties__panel" data-tab-panel="timezone" hidden>
      <div class="timezone-map" data-timezone-map></div>
      <label class="clock-properties__field">
        <span>Time zone</span>
        <select class="clock-properties__select" data-timezone-select></select>
      </label>
      <label class="clock-properties__field">
        <span>Regional format</span>
        <select class="clock-properties__select" data-locale-select></select>
      </label>
      <label class="clock-properties__check">
        <input type="checkbox" data-use-24-hour />
        <span>Use 24-hour format</span>
      </label>
    </section>
    <footer class="clock-properties__footer">
      <div class="clock-properties__actions">
        <button type="button" class="clock-properties__button" data-action="sync">Sync to Host Clock</button>
        <button type="button" class="clock-properties__button" data-action="apply">Apply</button>
      </div>
      <p class="clock-properties__status" data-clock-status>Ready.</p>
    </footer>
  `;

  let draftProfile = readClockProfile();

  const tabButtons = Array.from(root.querySelectorAll("[data-tab-button]"));
  const tabPanels = Array.from(root.querySelectorAll("[data-tab-panel]"));
  const previewNode = root.querySelector("[data-clock-preview]");
  const statusNode = root.querySelector("[data-clock-status]");
  const dateInput = root.querySelector("[data-clock-date]");
  const timeInput = root.querySelector("[data-clock-time]");
  const timeZoneSelect = root.querySelector("[data-timezone-select]");
  const localeSelect = root.querySelector("[data-locale-select]");
  const use24HourInput = root.querySelector("[data-use-24-hour]");
  const timeZoneMap = root.querySelector("[data-timezone-map]");
  const setClockButton = root.querySelector('[data-action="set-clock"]');
  const syncButton = root.querySelector('[data-action="sync"]');
  const applyButton = root.querySelector('[data-action="apply"]');

  function setStatus(textContent) {
    if (statusNode) {
      statusNode.textContent = textContent;
    }
  }

  function setActiveTab(nextTab) {
    for (const button of tabButtons) {
      button.classList.toggle("is-active", button.dataset.tabButton === nextTab);
    }

    for (const panel of tabPanels) {
      panel.hidden = panel.dataset.tabPanel !== nextTab;
    }
  }

  function updatePreview() {
    const nowDate = getClockDate(draftProfile);
    if (previewNode) {
      previewNode.textContent = formatClockTooltip(draftProfile, nowDate);
    }
  }

  function updateDateTimeInputs() {
    if (!(dateInput instanceof HTMLInputElement) || !(timeInput instanceof HTMLInputElement)) {
      return;
    }

    const inputValues = getClockInputValues(draftProfile);
    dateInput.value = inputValues.dateValue;
    timeInput.value = inputValues.timeValue;
  }

  function populateSelectOptions() {
    if (timeZoneSelect instanceof HTMLSelectElement) {
      timeZoneSelect.innerHTML = "";

      for (const preset of TIMEZONE_PRESETS) {
        const option = document.createElement("option");
        option.value = preset.id;
        option.textContent = preset.label;
        option.selected = preset.id === draftProfile.timeZoneId;
        timeZoneSelect.append(option);
      }
    }

    if (localeSelect instanceof HTMLSelectElement) {
      localeSelect.innerHTML = "";

      for (const optionValue of CLOCK_LOCALE_OPTIONS) {
        const option = document.createElement("option");
        option.value = optionValue.id;
        option.textContent = optionValue.label;
        option.selected = optionValue.id === draftProfile.locale;
        localeSelect.append(option);
      }
    }

    if (use24HourInput instanceof HTMLInputElement) {
      use24HourInput.checked = draftProfile.use24Hour;
    }
  }

  function renderTimeZoneMap() {
    if (!timeZoneMap) {
      return;
    }

    timeZoneMap.innerHTML = "";

    for (const preset of TIMEZONE_PRESETS) {
      const zoneButton = document.createElement("button");
      zoneButton.type = "button";
      zoneButton.className = "timezone-map__zone";
      zoneButton.dataset.timeZoneId = preset.id;
      zoneButton.title = preset.label;
      zoneButton.style.left = `${getTimeZoneMapPositionPercent(preset.id)}%`;

      if (preset.id === draftProfile.timeZoneId) {
        zoneButton.classList.add("is-selected");
      }

      const widthPercent = Number.isInteger(preset.utcOffsetHours) ? 3.8 : 2.1;
      zoneButton.style.width = `${widthPercent}%`;

      zoneButton.addEventListener("click", () => {
        draftProfile.timeZoneId = preset.id;
        populateSelectOptions();
        updateDateTimeInputs();
        updatePreview();
        renderTimeZoneMap();
      });

      timeZoneMap.append(zoneButton);
    }

    const marker = document.createElement("span");
    marker.className = "timezone-map__marker";
    marker.style.left = `${getTimeZoneMapPositionPercent(draftProfile.timeZoneId)}%`;
    marker.textContent = getTimeZonePresetById(draftProfile.timeZoneId).label;
    timeZoneMap.append(marker);
  }

  const tabButtonHandler = (event) => {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    setActiveTab(button.dataset.tabButton);
  };

  for (const button of tabButtons) {
    button.addEventListener("click", tabButtonHandler);
  }

  const timeZoneChangeHandler = () => {
    if (!(timeZoneSelect instanceof HTMLSelectElement)) {
      return;
    }

    draftProfile.timeZoneId = timeZoneSelect.value;
    updateDateTimeInputs();
    updatePreview();
    renderTimeZoneMap();
  };

  const localeChangeHandler = () => {
    if (!(localeSelect instanceof HTMLSelectElement)) {
      return;
    }

    draftProfile.locale = localeSelect.value;
    updatePreview();
  };

  const use24HourChangeHandler = () => {
    if (!(use24HourInput instanceof HTMLInputElement)) {
      return;
    }

    draftProfile.use24Hour = use24HourInput.checked;
    updatePreview();
    setStatus(`Taskbar clock preview: ${formatClockTime(draftProfile)}.`);
  };

  const setClockHandler = () => {
    if (!(dateInput instanceof HTMLInputElement) || !(timeInput instanceof HTMLInputElement)) {
      return;
    }

    const targetUtcMs = convertZonedDateTimeToUtcMs(
      dateInput.value,
      timeInput.value,
      draftProfile,
    );

    if (!Number.isFinite(targetUtcMs)) {
      setStatus("Enter a valid date and time.");
      return;
    }

    draftProfile.manualOffsetMs = Math.round(targetUtcMs - Date.now());
    updatePreview();
    setStatus("Virtual RTC adjusted. Press Apply to keep it.");
  };

  const syncHandler = () => {
    draftProfile.manualOffsetMs = 0;
    updateDateTimeInputs();
    updatePreview();
    setStatus("Clock synced to host hardware time.");
  };

  const applyHandler = () => {
    draftProfile = writeClockProfile(draftProfile);
    eventBus?.emit("clock:profile-changed", {
      profile: draftProfile,
      source: "date-time-properties",
    });
    updatePreview();
    setStatus("Date/Time settings saved.");
  };

  if (timeZoneSelect instanceof HTMLSelectElement) {
    timeZoneSelect.addEventListener("change", timeZoneChangeHandler);
  }

  if (localeSelect instanceof HTMLSelectElement) {
    localeSelect.addEventListener("change", localeChangeHandler);
  }

  if (use24HourInput instanceof HTMLInputElement) {
    use24HourInput.addEventListener("change", use24HourChangeHandler);
  }

  if (setClockButton instanceof HTMLButtonElement) {
    setClockButton.addEventListener("click", setClockHandler);
  }

  if (syncButton instanceof HTMLButtonElement) {
    syncButton.addEventListener("click", syncHandler);
  }

  if (applyButton instanceof HTMLButtonElement) {
    applyButton.addEventListener("click", applyHandler);
  }

  populateSelectOptions();
  renderTimeZoneMap();
  updateDateTimeInputs();
  updatePreview();

  const previewTicker = window.setInterval(updatePreview, 1000);

  return {
    element: root,
    dispose() {
      clearInterval(previewTicker);

      for (const button of tabButtons) {
        button.removeEventListener("click", tabButtonHandler);
      }

      if (timeZoneSelect instanceof HTMLSelectElement) {
        timeZoneSelect.removeEventListener("change", timeZoneChangeHandler);
      }

      if (localeSelect instanceof HTMLSelectElement) {
        localeSelect.removeEventListener("change", localeChangeHandler);
      }

      if (use24HourInput instanceof HTMLInputElement) {
        use24HourInput.removeEventListener("change", use24HourChangeHandler);
      }

      if (setClockButton instanceof HTMLButtonElement) {
        setClockButton.removeEventListener("click", setClockHandler);
      }

      if (syncButton instanceof HTMLButtonElement) {
        syncButton.removeEventListener("click", syncHandler);
      }

      if (applyButton instanceof HTMLButtonElement) {
        applyButton.removeEventListener("click", applyHandler);
      }
    },
  };
}

function normalizeAddress(inputValue) {
  const trimmed = inputValue.trim();

  if (!trimmed) {
    return "about:blank";
  }

  if (trimmed.startsWith("about:")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function createInternetExplorerContent(launchPayload = {}) {
  const root = document.createElement("section");
  root.className = "ie-window";

  root.innerHTML = `
    <div class="ie-window__toolbar">
      <label class="ie-window__label" for="ie-address">Address</label>
      <input id="ie-address" class="ie-window__address" type="text" />
      <button type="button" class="ie-window__go">Go</button>
    </div>
    <iframe class="ie-window__frame" title="Internet Explorer viewport"></iframe>
    <p class="ie-window__status">Ready</p>
  `;

  const addressInput = root.querySelector(".ie-window__address");
  const goButton = root.querySelector(".ie-window__go");
  const frame = root.querySelector(".ie-window__frame");
  const status = root.querySelector(".ie-window__status");

  function navigate() {
    const nextAddress = normalizeAddress(addressInput.value);
    frame.src = nextAddress;
    status.textContent = `Navigated to ${nextAddress}`;
  }

  const initialAddress =
    typeof launchPayload.url === "string" && launchPayload.url
      ? launchPayload.url
      : "https://matijar.info";

  addressInput.value = initialAddress;
  navigate();

  const goClickHandler = () => {
    navigate();
  };

  const addressKeydownHandler = (event) => {
    if (event.key === "Enter") {
      navigate();
    }
  };

  goButton.addEventListener("click", goClickHandler);
  addressInput.addEventListener("keydown", addressKeydownHandler);

  return {
    element: root,
    dispose() {
      goButton.removeEventListener("click", goClickHandler);
      addressInput.removeEventListener("keydown", addressKeydownHandler);
    },
  };
}

const SIMULATED_SYSTEM_STORAGE_KEY = "simulated-system-id";
const SYSTEM_CONFIGURATION_BOOT_TAB_ID = "boot";
const SYSTEM_CONFIGURATION_BOOT_ENTRIES = Object.freeze([
  Object.freeze({
    targetSystemId: "desktop-win95",
    desktopProfileId: "win95",
    label: "Windows 95",
  }),
  Object.freeze({
    targetSystemId: "desktop-winxp-sp2",
    desktopProfileId: "winxp-sp2",
    label: "Windows XP SP2",
  }),
  Object.freeze({
    targetSystemId: "desktop-ubuntu-server",
    desktopProfileId: "ubuntu-server",
    label: "Ubuntu Server",
  }),
]);
const SYSTEM_CONFIGURATION_BOOT_COMMAND_ACTION = Object.freeze({
  appId: "system-configuration",
  launchPayload: Object.freeze({
    focusTab: SYSTEM_CONFIGURATION_BOOT_TAB_ID,
  }),
});
const SYSTEM_CONFIGURATION_BOOT_COMMAND_SUFFIX_ALIASES = new Set([
  "boot",
  "/boot",
  "-boot",
  "--boot",
]);

const RUN_COMMANDS = new Map([
  ["iexplore", "internet-explorer"],
  ["internet", "internet-explorer"],
  ["control", "control-panel"],
  ["control panel", "control-panel"],
  ["network", "network-status"],
  ["network status", "network-status"],
  ["dial-up", "network-status"],
  ["dialup", "network-status"],
  ["timedate", "date-time-properties"],
  ["date/time", "date-time-properties"],
  ["clock", "date-time-properties"],
  ["timezone", "date-time-properties"],
  ["explorer", "my-computer"],
  ["my computer", "my-computer"],
  ["recycle", "recycle-bin"],
  ["recycle bin", "recycle-bin"],
  ["portfolio", "about-matijar"],
  ["taskmgr", "task-manager"],
  ["taskman", "task-manager"],
  ["task manager", "task-manager"],
  ["msconfig", "system-configuration"],
  ["msconfig /boot", SYSTEM_CONFIGURATION_BOOT_COMMAND_ACTION],
]);

function normalizeRunCommand(rawCommand) {
  return String(rawCommand || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveMsconfigBootAliasAction(normalizedCommand) {
  if (
    typeof normalizedCommand !== "string" ||
    !normalizedCommand.startsWith("msconfig")
  ) {
    return null;
  }

  const commandSuffix = normalizedCommand.slice("msconfig".length);

  if (!commandSuffix) {
    return null;
  }

  const firstSuffixCharacter = commandSuffix[0];

  if (
    firstSuffixCharacter !== " " &&
    firstSuffixCharacter !== "/" &&
    firstSuffixCharacter !== "-"
  ) {
    return null;
  }

  const normalizedSuffix = commandSuffix.trim().replace(/\s+/g, "");

  if (!SYSTEM_CONFIGURATION_BOOT_COMMAND_SUFFIX_ALIASES.has(normalizedSuffix)) {
    return null;
  }

  return {
    normalizedCommand,
    appId: SYSTEM_CONFIGURATION_BOOT_COMMAND_ACTION.appId,
    launchPayload: SYSTEM_CONFIGURATION_BOOT_COMMAND_ACTION.launchPayload,
  };
}

function resolveRunCommandAction(rawCommand) {
  const normalizedCommand = normalizeRunCommand(rawCommand);

  if (!normalizedCommand) {
    return null;
  }

  const mapping = RUN_COMMANDS.get(normalizedCommand);

  if (!mapping) {
    return resolveMsconfigBootAliasAction(normalizedCommand);
  }

  if (typeof mapping === "string") {
    return {
      normalizedCommand,
      appId: mapping,
      launchPayload: undefined,
    };
  }

  if (typeof mapping.appId !== "string" || !mapping.appId) {
    return null;
  }

  return {
    normalizedCommand,
    appId: mapping.appId,
    launchPayload: mapping.launchPayload,
  };
}

function getRunDialogPrefillFromPayload(launchPayload = {}) {
  if (!launchPayload || typeof launchPayload !== "object") {
    return "";
  }

  const candidateCommand =
    typeof launchPayload.prefillCommand === "string"
      ? launchPayload.prefillCommand
      : typeof launchPayload.command === "string"
        ? launchPayload.command
        : "";

  return candidateCommand.trim();
}

function resolveSystemConfigurationInitialTab(launchPayload = {}) {
  if (!launchPayload || typeof launchPayload !== "object") {
    return "general";
  }

  const normalizedTab = String(launchPayload.focusTab || "")
    .trim()
    .toLowerCase();

  if (normalizedTab === "general") {
    return "general";
  }

  if (
    normalizedTab === SYSTEM_CONFIGURATION_BOOT_TAB_ID ||
    normalizedTab === "bootini"
  ) {
    return "boot";
  }

  if (normalizedTab === "services") {
    return "services";
  }

  if (normalizedTab === "startup") {
    return "startup";
  }

  if (normalizedTab === "configsys" || normalizedTab === "config.sys") {
    return "configsys";
  }

  if (normalizedTab === "autoexec" || normalizedTab === "autoexec.bat") {
    return "autoexec";
  }

  if (normalizedTab === "winini" || normalizedTab === "win.ini") {
    return "winini";
  }

  if (normalizedTab === "systemini" || normalizedTab === "system.ini") {
    return "systemini";
  }

  if (normalizedTab === "tools") {
    return "tools";
  }

  return "general";
}

function resolveDesktopProfileIdFromSystemId(systemId) {
  if (systemId === "desktop-win95") {
    return "win95";
  }

  if (systemId === "desktop-winxp-sp2") {
    return "winxp-sp2";
  }

  if (systemId === "desktop-ubuntu-server") {
    return "ubuntu-server";
  }

  return "";
}

function readCurrentSystemIdFromDocument() {
  if (typeof document === "undefined") {
    return "";
  }

  const appRoot = document.getElementById("app");
  const systemId = appRoot?.dataset?.systemId;

  return typeof systemId === "string" ? systemId : "";
}

function isKnownBootTargetSystemId(targetSystemId) {
  return SYSTEM_CONFIGURATION_BOOT_ENTRIES.some((entry) => entry.targetSystemId === targetSystemId);
}

function readPersistedBootTargetSystemId() {
  try {
    if (!("localStorage" in window)) {
      return "";
    }

    const rawValue = window.localStorage.getItem(SIMULATED_SYSTEM_STORAGE_KEY);
    const normalizedValue = String(rawValue || "").trim();

    return isKnownBootTargetSystemId(normalizedValue) ? normalizedValue : "";
  } catch {
    return "";
  }
}

function writePersistedBootTargetSystemId(targetSystemId) {
  try {
    if (!("localStorage" in window)) {
      return false;
    }

    window.localStorage.setItem(SIMULATED_SYSTEM_STORAGE_KEY, targetSystemId);
    return true;
  } catch {
    return false;
  }
}

function createSystemConfigurationContent({
  eventBus,
  launchPayload = {},
  windowManager,
} = {}) {
  const currentSystemId = readCurrentSystemIdFromDocument();
  const currentProfileId = resolveDesktopProfileIdFromSystemId(currentSystemId) || "win95";
  const isWindowsXpProfile = currentProfileId === "winxp-sp2";
  const isUbuntuServerProfile = currentProfileId === "ubuntu-server";
  const tabDefinitions = isWindowsXpProfile
    ? [
        { id: "general", label: "General" },
        { id: "systemini", label: "SYSTEM.INI" },
        { id: "winini", label: "WIN.INI" },
        { id: "boot", label: "BOOT.INI" },
        { id: "services", label: "Services" },
        { id: "startup", label: "Startup" },
        { id: "tools", label: "Tools" },
      ]
    : [
        { id: "general", label: "General" },
        { id: "configsys", label: "Config.sys" },
        { id: "autoexec", label: "Autoexec.bat" },
        { id: "winini", label: "Win.ini" },
        { id: "systemini", label: "System.ini" },
        { id: "startup", label: "Startup" },
        { id: "boot", label: "Boot Menu" },
      ];
  const availableTabIds = new Set(tabDefinitions.map((tab) => tab.id));
  const root = document.createElement("section");
  root.className = `msconfig msconfig--${currentProfileId}`;
  root.dataset.desktopProfileId = currentProfileId;

  function buildScriptPanelMarkup(lines = []) {
    return `
      <fieldset class="msconfig__group msconfig__group--script">
        <legend>Configuration lines</legend>
        <ul class="msconfig__script-list">
          ${lines
            .map(
              (line, lineIndex) => `
            <li class="msconfig__script-line">
              <label class="msconfig__check">
                <input type="checkbox" ${lineIndex === 0 ? "checked" : ""} disabled />
                <span>${line}</span>
              </label>
            </li>
          `,
            )
            .join("")}
        </ul>
      </fieldset>
      <p class="msconfig__hint">Direct editing is intentionally disabled in this simulation.</p>
    `;
  }

  function buildTabPanelMarkup(tabId) {
    if (tabId === "general") {
      return `
        <fieldset class="msconfig__group">
          <legend>Startup Selection</legend>
          <label class="msconfig__option">
            <input type="radio" checked disabled />
            <span>Normal startup - load all device drivers and services.</span>
          </label>
          <label class="msconfig__option">
            <input type="radio" disabled />
            <span>Diagnostic startup - load basic devices and services only.</span>
          </label>
          <label class="msconfig__option">
            <input type="radio" disabled />
            <span>Selective startup - choose startup files and services.</span>
          </label>
        </fieldset>
        <p class="msconfig__hint">
          ${
            isWindowsXpProfile
              ? "Use BOOT.INI tab to choose default operating system."
              : "Use Boot Menu tab to choose default operating system."
          }
        </p>
      `;
    }

    if (tabId === "boot") {
      return `
        <div class="msconfig__boot-shell">
          <p class="msconfig__hint">
            ${
              isWindowsXpProfile
                ? "Select default operating system and startup behavior from BOOT.INI."
                : "Select default operating system for this simulated multi-boot setup."
            }
          </p>
          <fieldset class="msconfig__boot-group">
            <legend>${isWindowsXpProfile ? "Operating Systems" : "Boot Menu Entries"}</legend>
            <div class="msconfig__boot-list" data-msconfig-boot-list role="radiogroup" aria-label="Installed operating systems"></div>
          </fieldset>
          <div class="msconfig__boot-options">
            <label class="msconfig__field msconfig__field--inline">
              <span>Timeout</span>
              <input type="number" class="msconfig__input" min="0" max="999" value="30" disabled />
            </label>
            <label class="msconfig__check">
              <input type="checkbox" disabled />
              <span>${isWindowsXpProfile ? "/NOGUIBOOT (placeholder)" : "Show startup menu at boot"}</span>
            </label>
          </div>
          <p class="msconfig__boot-selection" data-msconfig-boot-selection aria-live="polite"></p>
        </div>
      `;
    }

    if (tabId === "services") {
      return `
        <fieldset class="msconfig__group">
          <legend>Services</legend>
          <ul class="msconfig__todo-list">
            <li>Remote Procedure Call (RPC)</li>
            <li>Workstation</li>
            <li>Network Connections</li>
            <li>Windows Audio</li>
          </ul>
        </fieldset>
        <p class="msconfig__hint">Service toggles are read-only in this build.</p>
      `;
    }

    if (tabId === "startup") {
      return `
        <fieldset class="msconfig__group">
          <legend>Startup Items</legend>
          <ul class="msconfig__todo-list">
            <li>SystemTray.exe</li>
            <li>Explorer.exe</li>
            <li>TaskbarClock.exe</li>
          </ul>
        </fieldset>
        <p class="msconfig__hint">Startup toggles are read-only in this build.</p>
      `;
    }

    if (tabId === "tools") {
      return `
        <fieldset class="msconfig__group">
          <legend>Tools</legend>
          <ul class="msconfig__todo-list">
            <li>Run (run)</li>
            <li>Date/Time Properties (timedate)</li>
            <li>Task Manager (taskmgr)</li>
          </ul>
        </fieldset>
      `;
    }

    if (tabId === "configsys") {
      return buildScriptPanelMarkup([
        "DOS=HIGH,UMB",
        "DEVICE=C:\\WINDOWS\\HIMEM.SYS",
        "DEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS",
        "FILES=40",
      ]);
    }

    if (tabId === "autoexec") {
      return buildScriptPanelMarkup([
        "@ECHO OFF",
        "SET PATH=C:\\WINDOWS;C:\\WINDOWS\\COMMAND",
        "SET TEMP=C:\\WINDOWS\\TEMP",
        "LH SMARTDRV.EXE",
      ]);
    }

    if (tabId === "winini") {
      return buildScriptPanelMarkup([
        "[windows]",
        "load=",
        "run=",
        "[intl]",
      ]);
    }

    if (tabId === "systemini") {
      return buildScriptPanelMarkup([
        "[boot]",
        "shell=Explorer.exe",
        "[drivers]",
        "wave=mmdrv.dll",
      ]);
    }

    return `<p class="msconfig__hint">This tab is unavailable in this build.</p>`;
  }

  const header = document.createElement("header");
  header.className = "msconfig__header";
  header.innerHTML = `
    <h2 class="msconfig__title">System Configuration Utility</h2>
    <p class="msconfig__subtitle">${
      isWindowsXpProfile
        ? "Microsoft Windows XP startup configuration."
        : isUbuntuServerProfile
          ? "Ubuntu Server startup configuration."
          : "Microsoft Windows 95 startup configuration."
    }</p>
  `;

  const dialog = document.createElement("div");
  dialog.className = "msconfig__dialog";

  const tabsNode = document.createElement("div");
  tabsNode.className = "msconfig__tabs";
  tabsNode.setAttribute("role", "tablist");
  tabsNode.setAttribute("aria-label", "System Configuration tabs");

  for (const tab of tabDefinitions) {
    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = "msconfig__tab";
    tabButton.dataset.msconfigTabButton = tab.id;
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", "false");
    tabButton.tabIndex = -1;
    tabButton.textContent = tab.label;
    tabsNode.append(tabButton);
  }

  const contentNode = document.createElement("div");
  contentNode.className = "msconfig__content";

  for (const tab of tabDefinitions) {
    const panel = document.createElement("section");
    panel.className = `msconfig__panel msconfig__panel--${tab.id}`;
    panel.dataset.msconfigTabPanel = tab.id;
    panel.hidden = true;
    panel.innerHTML = buildTabPanelMarkup(tab.id);
    contentNode.append(panel);
  }

  dialog.append(tabsNode, contentNode);

  const footer = document.createElement("footer");
  footer.className = "msconfig__footer";
  footer.innerHTML = `
    <p class="msconfig__status" data-msconfig-status>Ready.</p>
    <div class="msconfig__actions">
      <button type="button" class="msconfig__button msconfig__button--primary" data-msconfig-action="ok">OK</button>
      <button type="button" class="msconfig__button" data-msconfig-action="cancel">Cancel</button>
      <button type="button" class="msconfig__button" data-msconfig-action="apply">Apply</button>
      <button type="button" class="msconfig__button" data-msconfig-action="apply-restart">Apply and Restart</button>
    </div>
  `;

  root.append(header, dialog, footer);

  const tabButtons = Array.from(root.querySelectorAll("[data-msconfig-tab-button]"));
  const tabPanels = Array.from(root.querySelectorAll("[data-msconfig-tab-panel]"));
  const bootListNode = root.querySelector("[data-msconfig-boot-list]");
  const bootSelectionNode = root.querySelector("[data-msconfig-boot-selection]");
  const okButton = root.querySelector('[data-msconfig-action="ok"]');
  const cancelButton = root.querySelector('[data-msconfig-action="cancel"]');
  const applyButton = root.querySelector('[data-msconfig-action="apply"]');
  const applyRestartButton = root.querySelector('[data-msconfig-action="apply-restart"]');
  const statusNode = root.querySelector("[data-msconfig-status]");
  const launchPayloadSourceProfileId =
    typeof launchPayload.sourceDesktopProfileId === "string"
      ? launchPayload.sourceDesktopProfileId
      : "";
  const persistedBootTargetSystemId = readPersistedBootTargetSystemId();
  const defaultBootTargetSystemId =
    persistedBootTargetSystemId ||
    SYSTEM_CONFIGURATION_BOOT_ENTRIES.find((entry) => entry.desktopProfileId === currentProfileId)
      ?.targetSystemId ||
    SYSTEM_CONFIGURATION_BOOT_ENTRIES[0]?.targetSystemId ||
    "desktop-win95";
  const bootState = {
    persistedTargetSystemId: persistedBootTargetSystemId || "",
  };
  const selectedBootTarget = {
    systemId: defaultBootTargetSystemId,
  };
  let systemConfigurationWindowId = "";

  function rememberSystemConfigurationWindowId(candidateWindowId) {
    if (typeof candidateWindowId !== "string" || !candidateWindowId) {
      return;
    }

    systemConfigurationWindowId = candidateWindowId;
  }

  function resolveSystemConfigurationWindowId() {
    if (!windowManager || typeof windowManager.closeWindow !== "function") {
      return "";
    }

    if (systemConfigurationWindowId) {
      if (typeof windowManager.getWindow !== "function") {
        return systemConfigurationWindowId;
      }

      const knownWindow = windowManager.getWindow(systemConfigurationWindowId);

      if (knownWindow?.appId === "system-configuration") {
        return systemConfigurationWindowId;
      }
    }

    if (
      typeof windowManager.getActiveWindowId === "function" &&
      typeof windowManager.getWindow === "function"
    ) {
      const activeWindowId = windowManager.getActiveWindowId();
      const activeWindow = activeWindowId ? windowManager.getWindow(activeWindowId) : null;

      if (activeWindow?.appId === "system-configuration") {
        rememberSystemConfigurationWindowId(activeWindowId);
        return activeWindowId;
      }
    }

    if (typeof windowManager.listWindows === "function") {
      const systemConfigurationWindow = windowManager
        .listWindows()
        .find((windowRecord) => windowRecord.appId === "system-configuration");

      if (systemConfigurationWindow?.id) {
        rememberSystemConfigurationWindowId(systemConfigurationWindow.id);
        return systemConfigurationWindow.id;
      }
    }

    return "";
  }

  function closeSystemConfigurationWindow() {
    const windowId = resolveSystemConfigurationWindowId();

    if (!windowId || !windowManager || typeof windowManager.closeWindow !== "function") {
      return false;
    }

    return windowManager.closeWindow(windowId);
  }

  function setStatus(textContent) {
    if (statusNode) {
      statusNode.textContent = textContent;
    }
  }

  function setActiveTab(nextTab) {
    const normalizedNextTab =
      typeof nextTab === "string" && nextTab.trim() ? nextTab.trim().toLowerCase() : "general";
    const resolvedTabId = availableTabIds.has(normalizedNextTab)
      ? normalizedNextTab
      : availableTabIds.has("general")
        ? "general"
        : tabDefinitions[0]?.id || "";

    for (const button of tabButtons) {
      const isActive = button.dataset.msconfigTabButton === resolvedTabId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isActive ? 0 : -1;
    }

    for (const panel of tabPanels) {
      panel.hidden = panel.dataset.msconfigTabPanel !== resolvedTabId;
    }
  }

  function getBootEntryBySystemId(targetSystemId) {
    return (
      SYSTEM_CONFIGURATION_BOOT_ENTRIES.find((entry) => entry.targetSystemId === targetSystemId) || null
    );
  }

  function updateBootSelectionSummary() {
    if (!(bootSelectionNode instanceof HTMLElement)) {
      return;
    }

    const selectedEntry = getBootEntryBySystemId(selectedBootTarget.systemId);

    if (!selectedEntry) {
      bootSelectionNode.textContent = "Selected operating system: none.";
      return;
    }

    const badges = [];

    if (selectedEntry.targetSystemId === currentSystemId) {
      badges.push("current OS");
    }

    if (bootState.persistedTargetSystemId === selectedEntry.targetSystemId) {
      badges.push("saved default");
    }

    const badgeText = badges.length > 0 ? ` (${badges.join(", ")})` : "";
    bootSelectionNode.textContent = `Selected operating system: ${selectedEntry.label}${badgeText}.`;
  }

  function syncBootSelectionUI() {
    if (!bootListNode) {
      updateBootSelectionSummary();
      return;
    }

    const entryNodes = Array.from(bootListNode.querySelectorAll("[data-msconfig-boot-entry]"));

    for (const entryNode of entryNodes) {
      if (!(entryNode instanceof HTMLElement)) {
        continue;
      }

      const targetSystemId = String(entryNode.dataset.msconfigBootEntry || "");
      const entry = getBootEntryBySystemId(targetSystemId);

      if (!entry) {
        continue;
      }

      const isSelected = targetSystemId === selectedBootTarget.systemId;
      entryNode.setAttribute("aria-selected", isSelected ? "true" : "false");

      const radioInput = entryNode.querySelector('input[name="msconfig-boot-target"]');

      if (radioInput instanceof HTMLInputElement) {
        radioInput.checked = isSelected;
      }

      const stateNode = entryNode.querySelector("[data-msconfig-boot-state]");

      if (stateNode instanceof HTMLElement) {
        const stateTokens = [];

        if (entry.targetSystemId === currentSystemId) {
          stateTokens.push("Current OS");
        }

        if (bootState.persistedTargetSystemId === entry.targetSystemId) {
          stateTokens.push("Saved default");
        }

        if (isSelected) {
          stateTokens.push("Selected");
        }

        stateNode.textContent = stateTokens.length > 0 ? stateTokens.join(" | ") : "Available";
      }

      const selectButton = entryNode.querySelector("[data-msconfig-boot-select]");

      if (selectButton instanceof HTMLButtonElement) {
        selectButton.disabled = isSelected;
        selectButton.textContent = isSelected ? "Selected" : "Set as default";
      }
    }

    updateBootSelectionSummary();
  }

  function persistBootTargetSystemId(targetSystemId, { announce = false } = {}) {
    if (!isKnownBootTargetSystemId(targetSystemId)) {
      return false;
    }

    const didPersist = writePersistedBootTargetSystemId(targetSystemId);

    if (!didPersist) {
      setStatus("Unable to save default boot target in this browser session.");
      return false;
    }

    bootState.persistedTargetSystemId = targetSystemId;
    syncBootSelectionUI();

    if (announce) {
      const selectedEntry = getBootEntryBySystemId(targetSystemId);
      setStatus(`Default boot target saved: ${selectedEntry?.label || targetSystemId}.`);
    }

    return true;
  }

  function setSelectedBootTargetSystemId(
    targetSystemId,
    { announce = false, persist = false } = {},
  ) {
    if (!isKnownBootTargetSystemId(targetSystemId)) {
      return false;
    }

    selectedBootTarget.systemId = targetSystemId;
    syncBootSelectionUI();

    if (persist) {
      return persistBootTargetSystemId(targetSystemId, { announce });
    }

    if (announce) {
      const selectedEntry = getBootEntryBySystemId(targetSystemId);
      setStatus(`Selected boot entry: ${selectedEntry?.label || targetSystemId}.`);
    }

    return true;
  }

  function renderBootEntries() {
    if (!bootListNode) {
      updateBootSelectionSummary();
      return;
    }

    bootListNode.innerHTML = "";
    const entryList = document.createElement("ol");
    entryList.className = "msconfig__boot-entry-list";

    for (const entry of SYSTEM_CONFIGURATION_BOOT_ENTRIES) {
      const listItem = document.createElement("li");
      listItem.className = "msconfig__boot-entry";
      listItem.dataset.msconfigBootEntry = entry.targetSystemId;
      listItem.tabIndex = 0;

      const inputId = `msconfig-boot-target-${entry.desktopProfileId}`;
      const selectorRow = document.createElement("div");
      selectorRow.className = "msconfig__boot-selector";
      const radioInput = document.createElement("input");
      radioInput.id = inputId;
      radioInput.type = "radio";
      radioInput.name = "msconfig-boot-target";
      radioInput.value = entry.targetSystemId;

      const label = document.createElement("label");
      label.className = "msconfig__boot-label";
      label.setAttribute("for", inputId);
      label.textContent = entry.label;

      selectorRow.append(radioInput, label);

      const systemIdNode = document.createElement("div");
      systemIdNode.className = "msconfig__boot-system-id";
      systemIdNode.textContent = isWindowsXpProfile
        ? `${entry.label} /fastdetect`
        : entry.label;

      const stateNode = document.createElement("div");
      stateNode.className = "msconfig__boot-state";
      stateNode.dataset.msconfigBootState = "true";

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "msconfig__button msconfig__boot-select";
      selectButton.dataset.msconfigBootSelect = entry.targetSystemId;
      selectButton.textContent = "Set as default";

      listItem.append(selectorRow, systemIdNode, stateNode, selectButton);
      entryList.append(listItem);
    }

    bootListNode.append(entryList);
    syncBootSelectionUI();
  }

  function getSelectedBootTargetSystemId() {
    return selectedBootTarget.systemId;
  }

  function applyBootSelection({ restart = false } = {}) {
    const targetSystemId = getSelectedBootTargetSystemId();

    if (!isKnownBootTargetSystemId(targetSystemId)) {
      setStatus("Select a valid boot entry.");
      return false;
    }

    const selectedEntry = getBootEntryBySystemId(targetSystemId);
    const didPersist = persistBootTargetSystemId(targetSystemId);

    if (!didPersist) {
      return false;
    }

    if (!restart) {
      setStatus(`Default boot target saved: ${selectedEntry?.label || targetSystemId}.`);
      return true;
    }

    eventBus?.emit("shell:system-switch-requested", {
      targetSystemId,
      sourceDesktopProfileId: launchPayloadSourceProfileId || currentProfileId || "win95",
      autoBoot: true,
      reboot: true,
      rebootRequested: true,
      source: "msconfig-boot-tab",
    });
    setStatus(`Restart requested into ${selectedEntry?.label || targetSystemId}.`);
    return true;
  }

  function moveTabFocus(currentButton, direction) {
    if (!(currentButton instanceof HTMLButtonElement)) {
      return;
    }

    const currentIndex = tabButtons.indexOf(currentButton);

    if (currentIndex === -1 || tabButtons.length === 0) {
      return;
    }

    const nextIndex = (currentIndex + direction + tabButtons.length) % tabButtons.length;
    const nextButton = tabButtons[nextIndex];
    nextButton?.focus();
    if (nextButton) {
      setActiveTab(nextButton.dataset.msconfigTabButton);
    }
  }

  const tabButtonHandler = (event) => {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    setActiveTab(button.dataset.msconfigTabButton);
  };

  const tabButtonKeydownHandler = (event) => {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTabFocus(button, 1);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTabFocus(button, -1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      const firstButton = tabButtons[0];
      firstButton?.focus();
      if (firstButton) {
        setActiveTab(firstButton.dataset.msconfigTabButton);
      }
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastButton = tabButtons[tabButtons.length - 1];
      lastButton?.focus();
      if (lastButton) {
        setActiveTab(lastButton.dataset.msconfigTabButton);
      }
    }
  };

  const bootSelectionHandler = (event) => {
    const input = event.target;

    if (!(input instanceof HTMLInputElement) || input.name !== "msconfig-boot-target") {
      return;
    }

    setSelectedBootTargetSystemId(input.value, { announce: true, persist: true });
  };

  const bootSelectionButtonHandler = (event) => {
    if (!bootListNode) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest("[data-msconfig-boot-select]");

    if (!(button instanceof HTMLButtonElement) || !bootListNode.contains(button)) {
      return;
    }

    setSelectedBootTargetSystemId(button.dataset.msconfigBootSelect, {
      announce: true,
      persist: true,
    });
  };

  const bootEntryClickHandler = (event) => {
    if (!bootListNode) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("[data-msconfig-boot-select]")) {
      return;
    }

    if (target.closest('input[name="msconfig-boot-target"]')) {
      return;
    }

    const entryNode = target.closest("[data-msconfig-boot-entry]");

    if (!(entryNode instanceof HTMLElement) || !bootListNode.contains(entryNode)) {
      return;
    }

    setSelectedBootTargetSystemId(entryNode.dataset.msconfigBootEntry, {
      announce: true,
      persist: true,
    });
  };

  const bootEntryKeydownHandler = (event) => {
    if (!bootListNode) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const entryNode = target.closest("[data-msconfig-boot-entry]");

    if (!(entryNode instanceof HTMLElement) || !bootListNode.contains(entryNode)) {
      return;
    }

    event.preventDefault();
    setSelectedBootTargetSystemId(entryNode.dataset.msconfigBootEntry, {
      announce: true,
      persist: true,
    });
  };

  const okHandler = () => {
    applyBootSelection();
    closeSystemConfigurationWindow();
  };

  const cancelHandler = () => {
    closeSystemConfigurationWindow();
  };

  const applyHandler = () => {
    applyBootSelection();
  };

  const applyAndRestartHandler = () => {
    applyBootSelection({ restart: true });
  };

  const handleLaunchReused = ({ appId, windowId, launchPayload: reusedLaunchPayload } = {}) => {
    if (appId !== "system-configuration") {
      return;
    }

    rememberSystemConfigurationWindowId(windowId);
    const nextTab = resolveSystemConfigurationInitialTab(reusedLaunchPayload);
    setActiveTab(nextTab);
  };

  const appLaunchedHandler = ({ appId, windowId } = {}) => {
    if (appId !== "system-configuration") {
      return;
    }

    rememberSystemConfigurationWindowId(windowId);
  };

  const removeLaunchReusedListener = eventBus?.on("app:launch-reused", handleLaunchReused) || null;
  const removeAppLaunchedListener = eventBus?.on("app:launched", appLaunchedHandler) || null;

  for (const button of tabButtons) {
    button.addEventListener("click", tabButtonHandler);
    button.addEventListener("keydown", tabButtonKeydownHandler);
  }

  if (bootListNode) {
    bootListNode.addEventListener("change", bootSelectionHandler);
    bootListNode.addEventListener("click", bootSelectionButtonHandler);
    bootListNode.addEventListener("click", bootEntryClickHandler);
    bootListNode.addEventListener("keydown", bootEntryKeydownHandler);
  }

  if (okButton instanceof HTMLButtonElement) {
    okButton.addEventListener("click", okHandler);
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener("click", cancelHandler);
  }

  if (applyButton instanceof HTMLButtonElement) {
    applyButton.addEventListener("click", applyHandler);
  }

  if (applyRestartButton instanceof HTMLButtonElement) {
    applyRestartButton.addEventListener("click", applyAndRestartHandler);
  }

  renderBootEntries();
  setActiveTab(resolveSystemConfigurationInitialTab(launchPayload));
  setStatus("Ready.");

  return {
    element: root,
    dispose() {
      for (const button of tabButtons) {
        button.removeEventListener("click", tabButtonHandler);
        button.removeEventListener("keydown", tabButtonKeydownHandler);
      }

      if (bootListNode) {
        bootListNode.removeEventListener("change", bootSelectionHandler);
        bootListNode.removeEventListener("click", bootSelectionButtonHandler);
        bootListNode.removeEventListener("click", bootEntryClickHandler);
        bootListNode.removeEventListener("keydown", bootEntryKeydownHandler);
      }

      if (okButton instanceof HTMLButtonElement) {
        okButton.removeEventListener("click", okHandler);
      }

      if (cancelButton instanceof HTMLButtonElement) {
        cancelButton.removeEventListener("click", cancelHandler);
      }

      if (applyButton instanceof HTMLButtonElement) {
        applyButton.removeEventListener("click", applyHandler);
      }

      if (applyRestartButton instanceof HTMLButtonElement) {
        applyRestartButton.removeEventListener("click", applyAndRestartHandler);
      }

      if (typeof removeLaunchReusedListener === "function") {
        removeLaunchReusedListener();
      }

      if (typeof removeAppLaunchedListener === "function") {
        removeAppLaunchedListener();
      }
    },
  };
}

function createRunDialogContent({ launchApp, eventBus, windowManager, launchPayload = {} } = {}) {
  const root = document.createElement("section");
  root.className = "run-dialog";

  root.innerHTML = `
    <h2 class="run-dialog__title">Run</h2>
    <p class="run-dialog__text">Type the name of a program, folder, document, or Internet resource.</p>
    <form class="run-dialog__form">
      <label for="run-command" class="run-dialog__label">Open:</label>
      <input id="run-command" name="command" class="run-dialog__input" type="text" autocomplete="off" />
      <div class="run-dialog__actions">
        <button type="submit" class="run-dialog__button">OK</button>
      </div>
    </form>
    <p class="run-dialog__hint">Try: iexplore, control, network, timedate, taskmgr, explorer, recycle, portfolio, msconfig /boot</p>
    <p class="run-dialog__status">Ready.</p>
  `;

  const form = root.querySelector(".run-dialog__form");
  const input = root.querySelector(".run-dialog__input");
  const status = root.querySelector(".run-dialog__status");
  let runDialogWindowId = "";

  function rememberRunDialogWindowId(candidateWindowId) {
    if (typeof candidateWindowId !== "string" || !candidateWindowId) {
      return;
    }

    runDialogWindowId = candidateWindowId;
  }

  function resolveRunDialogWindowId() {
    if (!windowManager || typeof windowManager.closeWindow !== "function") {
      return "";
    }

    if (runDialogWindowId) {
      if (typeof windowManager.getWindow !== "function") {
        return runDialogWindowId;
      }

      const knownWindow = windowManager.getWindow(runDialogWindowId);

      if (knownWindow?.appId === "run-dialog") {
        return runDialogWindowId;
      }
    }

    if (
      typeof windowManager.getActiveWindowId === "function" &&
      typeof windowManager.getWindow === "function"
    ) {
      const activeWindowId = windowManager.getActiveWindowId();
      const activeWindow = activeWindowId ? windowManager.getWindow(activeWindowId) : null;

      if (activeWindow?.appId === "run-dialog") {
        rememberRunDialogWindowId(activeWindowId);
        return activeWindowId;
      }
    }

    if (typeof windowManager.listWindows === "function") {
      const runDialogWindow = windowManager
        .listWindows()
        .find((windowRecord) => windowRecord.appId === "run-dialog");

      if (runDialogWindow?.id) {
        rememberRunDialogWindowId(runDialogWindow.id);
        return runDialogWindow.id;
      }
    }

    return "";
  }

  function closeRunDialogWindow() {
    const windowId = resolveRunDialogWindowId();

    if (!windowId || !windowManager || typeof windowManager.closeWindow !== "function") {
      return false;
    }

    return windowManager.closeWindow(windowId);
  }

  const submitHandler = (event) => {
    event.preventDefault();

    const action = resolveRunCommandAction(input.value);

    if (!action) {
      const attemptedCommand = normalizeRunCommand(input.value);
      if (!attemptedCommand) {
        status.textContent = "Enter a command.";
      } else {
        status.textContent = `No app mapped for command \"${attemptedCommand}\".`;
      }
      return;
    }

    const launchedWindowId = launchApp(action.appId, action.launchPayload);

    if (!launchedWindowId) {
      status.textContent = `Unable to open ${action.normalizedCommand}.`;
      return;
    }

    status.textContent = `Opened ${action.normalizedCommand}.`;
    closeRunDialogWindow();
  };

  const launchReusedHandler = ({
    appId,
    windowId,
    launchPayload: reusedLaunchPayload,
  } = {}) => {
    if (appId !== "run-dialog") {
      return;
    }

    rememberRunDialogWindowId(windowId);

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const prefillCommand = getRunDialogPrefillFromPayload(reusedLaunchPayload);

    if (!prefillCommand) {
      return;
    }

    input.value = prefillCommand;
    input.focus();
    input.select();
    status.textContent = `Prepared command: ${prefillCommand}`;
  };

  const appLaunchedHandler = ({ appId, windowId } = {}) => {
    if (appId !== "run-dialog") {
      return;
    }

    rememberRunDialogWindowId(windowId);
  };

  const removeLaunchReusedListener = eventBus?.on("app:launch-reused", launchReusedHandler) || null;
  const removeAppLaunchedListener = eventBus?.on("app:launched", appLaunchedHandler) || null;

  form.addEventListener("submit", submitHandler);

  const initialPrefillCommand = getRunDialogPrefillFromPayload(launchPayload);

  if (initialPrefillCommand && input instanceof HTMLInputElement) {
    input.value = initialPrefillCommand;
  }

  setTimeout(() => {
    input.focus();
    if (initialPrefillCommand) {
      input.select();
    }
  }, 0);

  return {
    element: root,
    dispose() {
      form.removeEventListener("submit", submitHandler);

      if (typeof removeLaunchReusedListener === "function") {
        removeLaunchReusedListener();
      }

      if (typeof removeAppLaunchedListener === "function") {
        removeAppLaunchedListener();
      }
    },
  };
}

export function createDefaultManifests({
  fileLayer,
  webApps = [],
  desktopProfile = "win95",
} = {}) {
  const manifests = [
    {
      id: "my-computer",
      title: "My Computer",
      iconKey: "computer",
      placements: ["desktop", "start"],
      startGroup: "programs",
      window: {
        width: 620,
        height: 420,
        minWidth: 420,
        minHeight: 300,
      },
      createContent: ({ launchApp }) =>
        createMyComputerContent(launchApp, fileLayer, {
          desktopProfile,
        }),
    },
    {
      id: "mock-file-browser",
      title: "File Explorer",
      iconKey: "folder",
      placements: ["start"],
      startGroup: "special",
      hidden: true,
      window: {
        width: 700,
        height: 460,
        minWidth: 460,
        minHeight: 300,
      },
      createContent: ({ launchPayload, launchApp }) =>
        createMockFileBrowserContent({
          fileLayer,
          launchPayload,
          launchApp,
          desktopProfile,
        }),
    },
    {
      id: "mock-file-viewer",
      title: "File Viewer",
      iconKey: "document",
      placements: ["start"],
      startGroup: "special",
      hidden: true,
      window: {
        width: 680,
        height: 500,
        minWidth: 440,
        minHeight: 320,
      },
      createContent: ({ launchPayload, launchApp }) =>
        createMockFileViewerContent({
          fileLayer,
          launchPayload,
          launchApp,
          desktopProfile,
        }),
    },
    {
      id: "recycle-bin",
      title: "Recycle Bin",
      iconKey: "recycle_bin",
      placements: ["desktop", "start"],
      startGroup: "programs",
      window: {
        width: 520,
        height: 360,
        minWidth: 380,
        minHeight: 260,
      },
      createContent: () => createRecycleBinContent(),
    },
    {
      id: "control-panel",
      title: "Control Panel",
      iconKey: "control_panel",
      placements: ["start"],
      startGroup: "settings",
      window: {
        width: 560,
        height: 380,
        minWidth: 420,
        minHeight: 280,
        singleInstance: true,
      },
      createContent: ({ launchApp }) => createControlPanelContent(launchApp),
    },
    {
      id: "network-status",
      title: "Network",
      iconKey: "network",
      placements: ["start"],
      startGroup: "settings",
      hidden: true,
      window: {
        width: 560,
        height: 350,
        minWidth: 420,
        minHeight: 280,
        resizable: false,
        singleInstance: true,
      },
      createContent: ({ launchPayload }) => createNetworkStatusContent(launchPayload),
    },
    {
      id: "date-time-properties",
      title: "Date/Time Properties",
      iconKey: "clock",
      placements: ["start"],
      startGroup: "settings",
      hidden: true,
      window: {
        width: 640,
        height: 430,
        minWidth: 480,
        minHeight: 360,
        resizable: false,
        singleInstance: true,
      },
      createContent: ({ eventBus }) => createDateTimePropertiesContent({ eventBus }),
    },
    {
      id: "internet-explorer",
      title: "Internet Explorer",
      iconKey: "internet_explorer",
      placements: ["desktop", "start"],
      startGroup: "programs",
      window: {
        width: 760,
        height: 520,
        minWidth: 460,
        minHeight: 320,
      },
      createContent: ({ launchPayload }) => createInternetExplorerContent(launchPayload),
    },
    {
      id: "system-configuration",
      title: "System Configuration",
      iconKey: "settings",
      placements: ["start"],
      startGroup: "settings",
      hidden: true,
      window: {
        width: 660,
        height: 440,
        minWidth: 520,
        minHeight: 360,
        resizable: false,
        singleInstance: true,
      },
      createContent: ({ eventBus, launchPayload, windowManager }) =>
        createSystemConfigurationContent({
          eventBus,
          launchPayload,
          windowManager,
        }),
    },
    {
      id: "run-dialog",
      title: "Run",
      iconKey: "run",
      placements: ["start"],
      startGroup: "special",
      hidden: true,
      window: {
        width: 420,
        height: 250,
        minWidth: 360,
        minHeight: 220,
        resizable: false,
        minimizable: false,
        maximizable: false,
        singleInstance: true,
      },
      createContent: ({ launchApp, eventBus, windowManager, launchPayload }) =>
        createRunDialogContent({
          launchApp,
          eventBus,
          windowManager,
          launchPayload,
        }),
    },
    {
      id: "task-manager",
      title: "Windows Task Manager",
      iconKey: "task_manager",
      placements: ["start"],
      startGroup: "special",
      hidden: true,
      window: {
        width: 700,
        height: 500,
        minWidth: 580,
        minHeight: 390,
        singleInstance: true,
      },
      createContent: ({ eventBus, windowManager, appRegistry, launchApp }) =>
        createTaskManagerContent({
          eventBus,
          windowManager,
          appRegistry,
          launchApp,
        }),
    },
    {
      id: "about-matijar",
      title: "Portfolio Notebook",
      iconKey: "document",
      placements: ["start"],
      startGroup: "programs",
      window: {
        width: 500,
        height: 360,
        minWidth: 360,
        minHeight: 240,
      },
      createContent: () => createAboutContent(fileLayer),
    },
  ];

  return manifests.concat(createWebAppManifests(webApps));
}
