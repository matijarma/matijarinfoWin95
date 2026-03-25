import { createContextMenu } from "../ui/context-menu/index.js";
import { createIconSurface } from "../ui/icon-surface/index.js";
import { createMnemonicLabelNode, getMnemonicFromKeyEvent } from "../ui/mnemonics/index.js";

const EXPLORER_MENUS = [
  { key: "file", label: "&File" },
  { key: "edit", label: "&Edit" },
  { key: "view", label: "&View" },
  { key: "help", label: "&Help" },
];
const EXPLORER_MENU_KEYS = EXPLORER_MENUS.map((menu) => menu.key);
const EXPLORER_TOOLBAR_ITEMS = [
  { id: "toolbar-back", label: "Back", disabled: true },
  { id: "toolbar-forward", label: "Forward", disabled: true },
  { type: "separator" },
  { id: "toolbar-up", label: "Up", action: "up" },
  { id: "toolbar-refresh", label: "Refresh", action: "refresh" },
  { type: "separator" },
  { id: "toolbar-properties", label: "Properties", action: "properties" },
];

function formatItemCount(count) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

function createStatusPane(className, initialText) {
  const pane = document.createElement("p");
  pane.className = `folder-window__status-pane ${className}`;
  pane.textContent = initialText;
  return pane;
}

function createExplorerToolbar(onAction) {
  const toolbar = document.createElement("div");
  toolbar.className = "folder-window__toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Explorer toolbar");

  const actionButtons = new Map();

  for (const item of EXPLORER_TOOLBAR_ITEMS) {
    if (item.type === "separator") {
      const separator = document.createElement("span");
      separator.className = "folder-window__toolbar-separator";
      separator.setAttribute("aria-hidden", "true");
      toolbar.append(separator);
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = item.id;
    button.className = "folder-window__tool-button";
    button.textContent = item.label;
    button.disabled = Boolean(item.disabled);

    if (item.action) {
      actionButtons.set(item.action, button);
      button.addEventListener("click", () => {
        onAction(item.action);
      });
    }

    toolbar.append(button);
  }

  return {
    element: toolbar,
    actionButtons,
  };
}

export function createFolderWindow({
  title,
  subtitle,
  items,
  onItemActivate,
  onItemProperties,
} = {}) {
  const folderTitle = title || "Folder";
  const folderSubtitle = subtitle || "Select an item to open.";
  const folderItems = Array.isArray(items) ? items : [];

  const root = document.createElement("section");
  root.className = "folder-window";
  root.tabIndex = -1;
  root.setAttribute("aria-label", `${folderTitle} explorer view`);

  const menuBar = document.createElement("nav");
  menuBar.className = "folder-window__menubar";
  menuBar.setAttribute("aria-label", "Explorer menu bar");

  const toolbar = createExplorerToolbar((action) => {
    runExplorerMenuAction(action);
  });

  const addressBar = document.createElement("div");
  addressBar.className = "folder-window__addressbar";
  addressBar.setAttribute("role", "group");
  addressBar.setAttribute("aria-label", "Explorer address bar");

  const addressLabel = document.createElement("span");
  addressLabel.className = "folder-window__address-label";
  addressLabel.textContent = "Address";

  const addressValue = document.createElement("p");
  addressValue.className = "folder-window__address-value";
  addressValue.textContent = folderTitle;
  addressValue.title = folderTitle;

  addressBar.append(addressLabel, addressValue);

  const surfaceMount = document.createElement("div");
  surfaceMount.className = "folder-window__surface";

  const statusBar = document.createElement("footer");
  statusBar.className = "folder-window__statusbar";

  const statusMessageNode = createStatusPane("folder-window__status-pane--message", "Ready.");
  const statusSelectionNode = createStatusPane(
    "folder-window__status-pane--selection",
    formatItemCount(folderItems.length),
  );
  const statusDetailsNode = createStatusPane(
    "folder-window__status-pane--details",
    folderSubtitle,
  );

  statusBar.append(statusMessageNode, statusSelectionNode, statusDetailsNode);

  root.append(menuBar, toolbar.element, addressBar, surfaceMount, statusBar);

  const contextMenu = createContextMenu({
    container: root,
  });
  let iconSurface = null;

  function setStatus(message) {
    statusMessageNode.textContent = message;
  }

  function syncSelectionFeedback(selectedItems = []) {
    const selectedCount = selectedItems.length;
    const hasSelection = selectedCount > 0;
    const propertiesButton = toolbar.actionButtons.get("properties");

    if (propertiesButton) {
      propertiesButton.disabled = !hasSelection;
    }

    if (!hasSelection) {
      statusSelectionNode.textContent = formatItemCount(folderItems.length);
      statusDetailsNode.textContent = folderSubtitle;
      return;
    }

    statusSelectionNode.textContent =
      selectedCount === 1 ? "1 selected" : `${selectedCount} selected`;

    if (selectedCount === 1) {
      statusDetailsNode.textContent = selectedItems[0].label;
      return;
    }

    statusDetailsNode.textContent = `${selectedCount} of ${formatItemCount(folderItems.length)}`;
  }

  function getSelectedItems() {
    return iconSurface?.getSelectedItems() || [];
  }

  function activateItem(item) {
    const activationResult = onItemActivate?.(item);

    if (activationResult === false) {
      setStatus(`${item.label} is unavailable in this build.`);
      return false;
    }

    setStatus(`Opened ${item.label}.`);
    return true;
  }

  function runExplorerMenuAction(action, payload = {}) {
    if (action === "open-selected") {
      const selectedItems = getSelectedItems();

      if (selectedItems.length === 0) {
        setStatus("No item selected.");
        return;
      }

      activateItem(selectedItems[0]);
      return;
    }

    if (action === "select-all") {
      iconSurface?.selectAll();
      setStatus(`Selected ${getSelectedItems().length} items.`);
      return;
    }

    if (action === "up") {
      setStatus("Up one level is unavailable in this build.");
      return;
    }

    if (action === "refresh") {
      setStatus("Refreshed.");
      return;
    }

    if (action === "details") {
      setStatus("Details view is a placeholder in this build.");
      return;
    }

    if (action === "about") {
      setStatus(`About ${folderTitle}: Win95 Explorer simulation.`);
      return;
    }

    if (action === "properties") {
      const selectedItem = payload.item || getSelectedItems()[0];

      if (!selectedItem) {
        setStatus("No item selected.");
        return;
      }

      onItemProperties?.(selectedItem);
      setStatus(`${selectedItem.label}: properties unavailable in this build.`);
    }
  }

  function getExplorerMenuEntries(menuKey) {
    const hasSelection = getSelectedItems().length > 0;

    if (menuKey === "file") {
      return [
        {
          id: "file-open",
          label: "Open",
          iconKey: "folder",
          action: "open-selected",
          disabled: !hasSelection,
        },
        {
          id: "file-explore",
          label: "Explore",
          iconKey: "folder",
          disabled: true,
        },
        { type: "separator" },
        {
          id: "file-delete",
          label: "Delete",
          iconKey: "recycle_bin",
          disabled: true,
        },
        {
          id: "file-rename",
          label: "Rename",
          iconKey: "document",
          disabled: true,
        },
        {
          id: "file-properties",
          label: "Properties",
          iconKey: "settings",
          action: "properties",
          disabled: !hasSelection,
        },
      ];
    }

    if (menuKey === "edit") {
      return [
        { id: "edit-undo", label: "Undo", iconKey: "document", disabled: true },
        { type: "separator" },
        { id: "edit-cut", label: "Cut", iconKey: "document", disabled: true },
        { id: "edit-copy", label: "Copy", iconKey: "document", disabled: true },
        { id: "edit-paste", label: "Paste", iconKey: "document", disabled: true },
        { type: "separator" },
        {
          id: "edit-select-all",
          label: "Select All",
          iconKey: "document",
          action: "select-all",
          disabled: folderItems.length === 0,
        },
      ];
    }

    if (menuKey === "view") {
      return [
        { id: "view-large", label: "Large Icons", iconKey: "folder", disabled: true },
        { id: "view-small", label: "Small Icons", iconKey: "folder", disabled: true },
        { id: "view-list", label: "List", iconKey: "folder", disabled: true },
        {
          id: "view-details",
          label: "Details",
          iconKey: "folder",
          action: "details",
        },
        { type: "separator" },
        {
          id: "view-refresh",
          label: "Refresh",
          iconKey: "document",
          action: "refresh",
        },
      ];
    }

    return [
      { id: "help-topics", label: "Help Topics", iconKey: "document", disabled: true },
      { type: "separator" },
      {
        id: "help-about",
        label: "About Explorer",
        iconKey: "settings",
        action: "about",
      },
    ];
  }

  function openExplorerMenu(menuKey, button) {
    const bounds = button.getBoundingClientRect();

    contextMenu.open({
      x: bounds.left,
      y: bounds.bottom,
      entries: getExplorerMenuEntries(menuKey),
      onSelect(entry) {
        if (entry.action) {
          runExplorerMenuAction(entry.action);
        }
      },
    });
  }

  const menuButtons = new Map();
  const menuMnemonicMap = new Map();
  let pendingAltToggle = false;

  for (const menu of EXPLORER_MENUS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "folder-window__menu-button";
    button.dataset.menuKey = menu.key;
    const { node: labelNode, parsed } = createMnemonicLabelNode(
      menu.label,
      "folder-window__menu-label",
    );
    button.append(labelNode);
    menuMnemonicMap.set(parsed.mnemonic, menu.key);

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openExplorerMenu(menu.key, button);
    });

    menuButtons.set(menu.key, button);
    menuBar.append(button);
  }

  function focusMenuByKey(menuKey) {
    const button = menuButtons.get(menuKey);
    button?.focus();
  }

  function isActiveWindow() {
    const windowNode = root.closest(".os-window");
    return !windowNode || windowNode.classList.contains("is-focused");
  }

  function focusAdjacentMenu(currentMenuKey, direction) {
    const currentIndex = EXPLORER_MENU_KEYS.indexOf(currentMenuKey);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      (currentIndex + direction + EXPLORER_MENU_KEYS.length) % EXPLORER_MENU_KEYS.length;
    const nextKey = EXPLORER_MENU_KEYS[nextIndex];
    const nextButton = menuButtons.get(nextKey);

    if (!nextButton) {
      return;
    }

    nextButton.focus();
    openExplorerMenu(nextKey, nextButton);
  }

  function activateMenuByMnemonic(mnemonic) {
    const menuKey = menuMnemonicMap.get(mnemonic);

    if (!menuKey) {
      return false;
    }

    const button = menuButtons.get(menuKey);

    if (!button) {
      return false;
    }

    button.focus();
    openExplorerMenu(menuKey, button);
    return true;
  }

  iconSurface = createIconSurface({
    container: surfaceMount,
    items: folderItems,
    className: "icon-surface--folder",
    ariaLabel: `${folderTitle} items`,
    onActivate: (item) => {
      activateItem(item);
    },
    onSelectionChanged: (selectedItems) => {
      syncSelectionFeedback(selectedItems);

      if (selectedItems.length === 0) {
        setStatus("Ready.");
        return;
      }

      if (selectedItems.length === 1) {
        setStatus(`Selected ${selectedItems[0].label}.`);
        return;
      }

      setStatus(`Selected ${selectedItems.length} items.`);
    },
    onContextMenu: (details) => {
      if (details.type === "item") {
        contextMenu.open({
          x: details.x,
          y: details.y,
          entries: [
            {
              id: `open-${details.item.id}`,
              label: "Open",
              iconKey: details.item.iconKey,
              action: "open",
            },
            { type: "separator" },
            {
              id: `delete-${details.item.id}`,
              label: "Delete",
              iconKey: "recycle_bin",
              action: "delete",
              disabled: true,
            },
            {
              id: `props-${details.item.id}`,
              label: "Properties",
              iconKey: "settings",
              action: "properties",
            },
          ],
          onSelect(entry) {
            if (entry.action === "open") {
              activateItem(details.item);
              return;
            }

            if (entry.action === "properties") {
              runExplorerMenuAction("properties", { item: details.item });
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
            id: "refresh",
            label: "Refresh",
            iconKey: "document",
            action: "refresh",
          },
          {
            id: "select-all",
            label: "Select All",
            iconKey: "document",
            action: "select-all",
          },
          { type: "separator" },
          {
            id: "folder-properties",
            label: "Properties",
            iconKey: "settings",
            action: "properties",
            disabled: false,
          },
        ],
        onSelect(entry) {
          if (entry.action) {
            runExplorerMenuAction(entry.action);
          }
        },
      });
    },
  });
  syncSelectionFeedback([]);

  function onRootKeydown(event) {
    if (!isActiveWindow()) {
      return;
    }

    if (
      event.key === "Alt" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      pendingAltToggle = true;
      return;
    }

    pendingAltToggle = false;
    const activeMenuButton = document.activeElement?.closest?.(".folder-window__menu-button");
    const mnemonic = getMnemonicFromKeyEvent(event);

    if (event.altKey && mnemonic && activateMenuByMnemonic(mnemonic)) {
      event.preventDefault();
      return;
    }

    if (!activeMenuButton) {
      return;
    }

    const activeKey = activeMenuButton.dataset.menuKey;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAdjacentMenu(activeKey, 1);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAdjacentMenu(activeKey, -1);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openExplorerMenu(activeKey, activeMenuButton);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      contextMenu.close();
      root.focus();
      return;
    }

    if (mnemonic && activateMenuByMnemonic(mnemonic)) {
      event.preventDefault();
    }
  }

  function onRootKeyup(event) {
    if (!isActiveWindow()) {
      return;
    }

    if (event.key !== "Alt") {
      return;
    }

    if (!pendingAltToggle) {
      return;
    }

    pendingAltToggle = false;
    event.preventDefault();

    const activeMenuButton = document.activeElement?.closest?.(".folder-window__menu-button");

    if (activeMenuButton) {
      contextMenu.close();
      root.focus();
      return;
    }

    focusMenuByKey(EXPLORER_MENU_KEYS[0]);
  }

  document.addEventListener("keydown", onRootKeydown);
  document.addEventListener("keyup", onRootKeyup);

  return {
    element: root,
    dispose() {
      document.removeEventListener("keydown", onRootKeydown);
      document.removeEventListener("keyup", onRootKeyup);
      iconSurface?.destroy();
      contextMenu.destroy();
    },
  };
}
