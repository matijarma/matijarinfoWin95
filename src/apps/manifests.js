import { createFolderWindow } from "./folder-window.js";
import { createIconSurface } from "../ui/icon-surface/index.js";

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
  return createFolderWindow({
    title: "My Computer",
    subtitle: "Select an item to open.",
    items: [
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

function createControlPanelContent() {
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
    ],
    onActivate: (item) => {
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
    <p class="run-dialog__hint">Try: iexplore, control, explorer, recycle, portfolio</p>
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
      createContent: () => createControlPanelContent(),
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
