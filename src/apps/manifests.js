import { createFolderWindow } from "./folder-window.js";
import { createIconSurface } from "../ui/icon-surface/index.js";
import {
  CLOCK_LOCALE_OPTIONS,
  TIMEZONE_PRESETS,
  convertZonedDateTimeToUtcMs,
  formatClockTooltip,
  formatClockTime,
  getClockDate,
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

function createMyComputerContent(launchApp) {
  const biosProfile = readBiosProfile();
  const floppyLabel = biosProfile.floppyEnabled
    ? "3 1/2 Floppy (A:)"
    : "3 1/2 Floppy (A:) (Disabled in BIOS)";

  return createFolderWindow({
    title: "My Computer",
    subtitle: "Classic workstation: floppy + dual IDE drives.",
    items: [
      {
        id: "my-computer-floppy",
        label: floppyLabel,
        iconKey: "drive_floppy",
      },
      {
        id: "my-computer-sys",
        label: "SYS (C:) 128MB",
        iconKey: "drive_hdd",
      },
      {
        id: "my-computer-storage",
        label: "STORAGE (D:) 512MB",
        iconKey: "drive_hdd",
      },
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
      if (item.appId) {
        launchApp(item.appId);
      }
    },
  });
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
  const root = document.createElement("section");
  root.className = "control-panel-app";

  const heading = document.createElement("h2");
  heading.textContent = "Control Panel";

  const subtitle = document.createElement("p");
  subtitle.className = "control-panel-app__subtitle";
  subtitle.textContent = "Double-click an icon to open a settings category.";

  const surfaceMount = document.createElement("div");
  surfaceMount.className = "control-panel-app__surface";

  const status = document.createElement("p");
  status.className = "control-panel-app__status";
  status.textContent = "Ready.";

  root.append(heading, subtitle, surfaceMount, status);

  const iconSurface = createIconSurface({
    container: surfaceMount,
    className: "icon-surface--folder",
    ariaLabel: "Control Panel categories",
    items: [
      { id: "cp-display", label: "Display", iconKey: "settings" },
      { id: "cp-mouse", label: "Mouse", iconKey: "settings" },
      { id: "cp-sounds", label: "Multimedia", iconKey: "volume" },
      { id: "cp-network", label: "Network", iconKey: "network" },
      {
        id: "cp-clock",
        label: "Date/Time",
        iconKey: "clock",
        appId: "date-time-properties",
      },
    ],
    onActivate: (item) => {
      if (item.appId) {
        launchApp(item.appId);
        status.textContent = `Opened ${item.label}.`;
        return;
      }

      status.textContent = `${item.label} settings are a placeholder in this milestone.`;
    },
  });

  return {
    element: root,
    dispose() {
      iconSurface.destroy();
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

const RUN_COMMANDS = new Map([
  ["iexplore", "internet-explorer"],
  ["internet", "internet-explorer"],
  ["control", "control-panel"],
  ["control panel", "control-panel"],
  ["timedate", "date-time-properties"],
  ["date/time", "date-time-properties"],
  ["clock", "date-time-properties"],
  ["timezone", "date-time-properties"],
  ["explorer", "my-computer"],
  ["my computer", "my-computer"],
  ["recycle", "recycle-bin"],
  ["recycle bin", "recycle-bin"],
  ["portfolio", "about-matijar"],
]);

function createRunDialogContent(launchApp) {
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
    <p class="run-dialog__hint">Try: iexplore, control, timedate, explorer, recycle, portfolio</p>
    <p class="run-dialog__status">Ready.</p>
  `;

  const form = root.querySelector(".run-dialog__form");
  const input = root.querySelector(".run-dialog__input");
  const status = root.querySelector(".run-dialog__status");

  const submitHandler = (event) => {
    event.preventDefault();

    const command = input.value.trim().toLowerCase();

    if (!command) {
      status.textContent = "Enter a command.";
      return;
    }

    const appId = RUN_COMMANDS.get(command);

    if (!appId) {
      status.textContent = `No app mapped for command \"${command}\".`;
      return;
    }

    launchApp(appId);
    status.textContent = `Opened ${command}.`;
  };

  form.addEventListener("submit", submitHandler);

  setTimeout(() => {
    input.focus();
  }, 0);

  return {
    element: root,
    dispose() {
      form.removeEventListener("submit", submitHandler);
    },
  };
}

export function createDefaultManifests({ fileLayer }) {
  return [
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
      createContent: ({ launchApp }) => createMyComputerContent(launchApp),
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
      },
      createContent: ({ launchApp }) => createControlPanelContent(launchApp),
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
      },
      createContent: ({ launchApp }) => createRunDialogContent(launchApp),
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
}
