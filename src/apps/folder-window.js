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

export function createFolderWindow({
  title,
  subtitle,
  items,
  onItemActivate,
  onItemProperties,
} = {}) {
  const root = document.createElement("section");
  root.className = "folder-window";
  root.tabIndex = -1;

  const header = document.createElement("header");
  header.className = "folder-window__header";

  const titleNode = document.createElement("h2");
  titleNode.className = "folder-window__title";
  titleNode.textContent = title || "Folder";

  const subtitleNode = document.createElement("p");
  subtitleNode.className = "folder-window__subtitle";
  subtitleNode.textContent = subtitle || "Select an item to open.";

  const menuBar = document.createElement("nav");
  menuBar.className = "folder-window__menubar";
  menuBar.setAttribute("aria-label", "Explorer menu bar");

  header.append(titleNode, subtitleNode, menuBar);

  const surfaceMount = document.createElement("div");
  surfaceMount.className = "folder-window__surface";

  const statusNode = document.createElement("p");
  statusNode.className = "folder-window__status";
  statusNode.textContent = "Ready";

  root.append(header, surfaceMount, statusNode);

  const contextMenu = createContextMenu({
    container: root,
  });

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function runExplorerMenuAction(action, payload = {}) {
    if (action === "open-selected") {
      const selectedItems = iconSurface.getSelectedItems();

      if (selectedItems.length === 0) {
        setStatus("No item selected.");
        return;
      }

      onItemActivate?.(selectedItems[0]);
      setStatus(`Opened ${selectedItems[0].label}`);
      return;
    }

    if (action === "select-all") {
      iconSurface.selectAll();
      setStatus(`Selected ${iconSurface.getSelectedItems().length} item(s).`);
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
      setStatus(`About ${title || "Folder"}: Win95 Explorer simulation.`);
      return;
    }

    if (action === "properties" && payload.item) {
      onItemProperties?.(payload.item);
      setStatus(`${payload.item.label}: properties unavailable in this build.`);
    }
  }

  function getExplorerMenuEntries(menuKey) {
    if (menuKey === "file") {
      return [
        {
          id: "file-open",
          label: "Open",
          iconKey: "folder",
          action: "open-selected",
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
          disabled: true,
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

  const iconSurface = createIconSurface({
    container: surfaceMount,
    items,
    className: "icon-surface--folder",
    ariaLabel: `${title || "Folder"} items`,
    onActivate: (item) => {
      onItemActivate?.(item);
      setStatus(`Opened ${item.label}`);
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
              onItemActivate?.(details.item);
              setStatus(`Opened ${details.item.label}`);
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
            disabled: true,
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
      iconSurface.destroy();
      contextMenu.destroy();
    },
  };
}
