import { createIconGlyph } from "../icons/index.js";

function isSubmenuEntry(entry) {
  return Array.isArray(entry.children) && entry.children.length > 0;
}

function buildMenu(entries, { onSelect }) {
  const menu = document.createElement("ul");
  menu.className = "context-menu__list";

  for (const entry of entries) {
    if (entry.type === "separator") {
      const separator = document.createElement("li");
      separator.className = "context-menu__separator";
      separator.setAttribute("role", "separator");
      menu.append(separator);
      continue;
    }

    const item = document.createElement("li");
    item.className = "context-menu__item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-menu__button";
    button.dataset.menuId = entry.id || entry.label;

    if (entry.disabled) {
      button.disabled = true;
    }

    button.append(createIconGlyph(entry.iconKey, { compact: true, iconUrl: entry.iconUrl }));

    const label = document.createElement("span");
    label.className = "context-menu__label";
    label.textContent = entry.label;
    button.append(label);

    if (isSubmenuEntry(entry)) {
      item.classList.add("has-submenu");

      const arrow = document.createElement("span");
      arrow.className = "context-menu__arrow";
      arrow.textContent = ">";
      button.append(arrow);

      const submenu = buildMenu(entry.children, { onSelect });
      item.append(button, submenu);

      button.addEventListener("mouseenter", () => {
        item.classList.add("is-open");
      });

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        item.classList.toggle("is-open");
      });
    } else {
      item.append(button);

      button.addEventListener("click", (event) => {
        event.stopPropagation();

        if (entry.disabled) {
          return;
        }

        onSelect(entry);
      });
    }

    menu.append(item);
  }

  return menu;
}

function getSiblingButtons(button) {
  const menu = button.closest(".context-menu__list");

  if (!menu) {
    return [];
  }

  return Array.from(
    menu.querySelectorAll(":scope > .context-menu__item > .context-menu__button:not(:disabled)"),
  );
}

function focusNextButton(currentButton, direction) {
  const siblings = getSiblingButtons(currentButton);

  if (siblings.length === 0) {
    return;
  }

  const currentIndex = siblings.indexOf(currentButton);
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + direction + siblings.length) % siblings.length;

  siblings[nextIndex]?.focus();
}

function focusFirstButton(menuRoot) {
  const firstButton = menuRoot.querySelector(
    ".context-menu__list > .context-menu__item > .context-menu__button:not(:disabled)",
  );
  firstButton?.focus();
}

export function createContextMenu({ container } = {}) {
  if (!container) {
    throw new Error("createContextMenu requires a container element.");
  }

  const root = document.createElement("div");
  root.className = "context-menu";
  root.hidden = true;

  container.append(root);

  let currentOnSelect = null;

  function closeSubmenus() {
    for (const item of root.querySelectorAll(".context-menu__item.is-open")) {
      item.classList.remove("is-open");
    }
  }

  function close() {
    root.hidden = true;
    root.innerHTML = "";
    currentOnSelect = null;
    closeSubmenus();
  }

  function handleOutsidePointerDown(event) {
    if (root.hidden) {
      return;
    }

    if (root.contains(event.target)) {
      return;
    }

    close();
  }

  function handleKeydown(event) {
    if (root.hidden) {
      return;
    }

    const activeButton = document.activeElement?.closest?.(".context-menu__button");

    if (event.key === "Escape") {
      close();
      return;
    }

    if (!activeButton) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusNextButton(activeButton, 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusNextButton(activeButton, -1);
      return;
    }

    if (event.key === "ArrowRight") {
      const item = activeButton.closest(".context-menu__item");

      if (item?.classList.contains("has-submenu")) {
        item.classList.add("is-open");
        const firstSubButton = item.querySelector(
          ".context-menu__list .context-menu__button:not(:disabled)",
        );
        firstSubButton?.focus();
      }

      return;
    }

    if (event.key === "ArrowLeft") {
      const parentItem =
        activeButton.closest(".context-menu__list")?.closest(".context-menu__item");

      if (parentItem) {
        parentItem.classList.remove("is-open");
        const parentButton = parentItem.querySelector(
          ":scope > .context-menu__button:not(:disabled)",
        );
        parentButton?.focus();
      }

      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activeButton.click();
    }
  }

  document.addEventListener("pointerdown", handleOutsidePointerDown);
  document.addEventListener("keydown", handleKeydown);

  function open({ x, y, entries, onSelect }) {
    currentOnSelect = onSelect;
    root.innerHTML = "";

    const menu = buildMenu(entries, {
      onSelect(entry) {
        currentOnSelect?.(entry);
        close();
      },
    });

    root.append(menu);

    root.hidden = false;
    root.style.left = `${x}px`;
    root.style.top = `${y}px`;

    const bounds = root.getBoundingClientRect();

    if (bounds.right > window.innerWidth) {
      root.style.left = `${Math.max(4, window.innerWidth - bounds.width - 4)}px`;
    }

    if (bounds.bottom > window.innerHeight) {
      root.style.top = `${Math.max(4, window.innerHeight - bounds.height - 4)}px`;
    }

    focusFirstButton(root);
  }

  return {
    open,
    close,
    isOpen() {
      return !root.hidden;
    },
    destroy() {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
      document.removeEventListener("keydown", handleKeydown);
      root.remove();
    },
  };
}
