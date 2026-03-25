import { createIconGlyph } from "../icons/index.js";
import { createMnemonicLabelNode, getMnemonicFromKeyEvent } from "../mnemonics/index.js";

function isSubmenuEntry(entry) {
  return Array.isArray(entry.children) && entry.children.length > 0;
}

function getMenuButtons(menu) {
  if (!menu) {
    return [];
  }

  // Keep class names profile-neutral; Win95/XP visuals are scoped in CSS profile selectors.
  return Array.from(
    menu.querySelectorAll(":scope > .os-menu__item > .os-menu__button:not(:disabled)"),
  );
}

export function createStartMenu({
  root,
  entries,
  onSelect,
  onVisibilityChange,
  railLabel = "Windows",
} = {}) {
  if (!root) {
    throw new Error("createStartMenu requires a root element.");
  }

  root.classList.add("start-menu", "is-hidden");
  root.innerHTML = "";

  const buttonMeta = new Map();

  function closeSubtree(item) {
    item.classList.remove("is-open");

    for (const nestedItem of item.querySelectorAll(":scope .os-menu__item.is-open")) {
      nestedItem.classList.remove("is-open");
    }
  }

  function closeSiblingSubmenus(item) {
    const menu = item.parentElement;

    if (!menu) {
      return;
    }

    const siblings = menu.querySelectorAll(":scope > .os-menu__item.is-open");

    for (const sibling of siblings) {
      if (sibling === item) {
        continue;
      }

      closeSubtree(sibling);
    }
  }

  function openSubmenu(item, { closeSiblings = true } = {}) {
    if (!item.classList.contains("has-submenu")) {
      return;
    }

    if (closeSiblings) {
      closeSiblingSubmenus(item);
    }

    item.classList.add("is-open");
  }

  function buildMenuList(menuEntries, level = 0, parentItem = null) {
    const list = document.createElement("ul");
    list.className = `os-menu ${level > 0 ? "os-menu--submenu" : ""}`.trim();

    for (const entry of menuEntries) {
      if (entry.type === "separator") {
        const separator = document.createElement("li");
        separator.className = "os-menu__separator";
        separator.setAttribute("role", "separator");
        list.append(separator);
        continue;
      }

      const item = document.createElement("li");
      item.className = "os-menu__item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "os-menu__button";
      button.dataset.level = String(level);

      if (entry.disabled) {
        button.disabled = true;
      }

      button.append(createIconGlyph(entry.iconKey, { compact: true, iconUrl: entry.iconUrl }));
      const { node: labelNode, parsed: parsedLabel } = createMnemonicLabelNode(
        entry.label,
        "os-menu__label",
      );
      button.dataset.menuId = entry.id || parsedLabel.label;
      button.append(labelNode);

      let submenu = null;

      if (isSubmenuEntry(entry)) {
        item.classList.add("has-submenu");

        const arrow = document.createElement("span");
        arrow.className = "os-menu__arrow";
        arrow.textContent = ">";
        button.append(arrow);

        submenu = buildMenuList(entry.children, level + 1, item);
        item.append(button, submenu);

        button.addEventListener("mouseenter", () => {
          openSubmenu(item);
        });

        button.addEventListener("click", (event) => {
          event.stopPropagation();

          if (item.classList.contains("is-open")) {
            closeSubtree(item);
            return;
          }

          openSubmenu(item);

          const firstSubButton = getMenuButtons(submenu)[0];
          firstSubButton?.focus();
        });
      } else {
        item.append(button);

        button.addEventListener("click", (event) => {
          event.stopPropagation();

          if (entry.disabled) {
            return;
          }

          onSelect?.(entry);
          close();
        });
      }

      buttonMeta.set(button, {
        item,
        parentItem,
        submenu,
        entry,
        mnemonic: parsedLabel.mnemonic,
      });

      list.append(item);
    }

    return list;
  }

  const shell = document.createElement("div");
  shell.className = "start-menu__shell";

  const rail = document.createElement("aside");
  rail.className = "start-menu__rail";

  const railText = document.createElement("span");
  railText.className = "start-menu__rail-text";
  railText.textContent = railLabel;
  rail.append(railText);

  const content = document.createElement("section");
  content.className = "start-menu__content";

  const menuList = buildMenuList(entries);

  content.append(menuList);
  shell.append(rail, content);
  root.append(shell);

  function closeSubmenus() {
    for (const item of root.querySelectorAll(".os-menu__item.is-open")) {
      item.classList.remove("is-open");
    }
  }

  function focusFirst(menu = menuList) {
    const firstButton = getMenuButtons(menu)[0];
    firstButton?.focus();
  }

  function focusSibling(currentButton, direction) {
    const menu = currentButton.closest(".os-menu");
    const buttons = getMenuButtons(menu);

    if (buttons.length === 0) {
      return;
    }

    const currentIndex = buttons.indexOf(currentButton);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + direction + buttons.length) % buttons.length;

    buttons[nextIndex]?.focus();
  }

  function activateByMnemonic(menu, mnemonic) {
    if (!menu || !mnemonic) {
      return false;
    }

    const buttons = getMenuButtons(menu);

    for (const button of buttons) {
      const meta = buttonMeta.get(button);

      if (meta?.mnemonic !== mnemonic) {
        continue;
      }

      button.focus();

      if (meta.submenu) {
        openSubmenu(meta.item);
        focusFirst(meta.submenu);
      } else {
        button.click();
      }

      return true;
    }

    return false;
  }

  function open() {
    if (!root.classList.contains("is-hidden")) {
      return;
    }

    root.classList.remove("is-hidden");
    onVisibilityChange?.(true);
    focusFirst();
  }

  function close() {
    if (root.classList.contains("is-hidden")) {
      return;
    }

    root.classList.add("is-hidden");
    closeSubmenus();
    onVisibilityChange?.(false);
  }

  function toggle() {
    if (root.classList.contains("is-hidden")) {
      open();
      return;
    }

    close();
  }

  function isOpen() {
    return !root.classList.contains("is-hidden");
  }

  function handleKeydown(event) {
    if (!isOpen()) {
      return;
    }

    const activeButton = document.activeElement?.closest?.(".os-menu__button");
    const mnemonic = getMnemonicFromKeyEvent(event);

    if (event.key === "Escape") {
      close();
      return;
    }

    if (mnemonic) {
      const activeMenu = activeButton?.closest(".os-menu") || menuList;
      const handled = activateByMnemonic(activeMenu, mnemonic);

      if (!handled && activeMenu !== menuList) {
        activateByMnemonic(menuList, mnemonic);
      }

      if (handled || activeMenu !== menuList) {
        event.preventDefault();
      }
      return;
    }

    if (!activeButton) {
      return;
    }

    const meta = buttonMeta.get(activeButton);

    if (!meta) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusSibling(activeButton, 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusSibling(activeButton, -1);
      return;
    }

    if (event.key === "ArrowRight") {
      if (meta.submenu) {
        event.preventDefault();
        openSubmenu(meta.item);
        focusFirst(meta.submenu);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      if (meta.parentItem) {
        event.preventDefault();
        meta.parentItem.classList.remove("is-open");
        const parentButton = meta.parentItem.querySelector(
          ":scope > .os-menu__button:not(:disabled)",
        );
        parentButton?.focus();
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activeButton.click();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      const menu = activeButton.closest(".os-menu");
      const buttons = getMenuButtons(menu);
      buttons[0]?.focus();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const menu = activeButton.closest(".os-menu");
      const buttons = getMenuButtons(menu);
      buttons.at(-1)?.focus();
    }
  }

  root.addEventListener("keydown", handleKeydown);

  return {
    open,
    close,
    toggle,
    isOpen,
    destroy() {
      close();
      root.removeEventListener("keydown", handleKeydown);
      root.innerHTML = "";
    },
  };
}
