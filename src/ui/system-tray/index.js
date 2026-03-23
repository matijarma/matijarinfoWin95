import { createIconGlyph } from "../icons/index.js";

export function createSystemTray({ container, items = [], onSelect } = {}) {
  if (!container) {
    throw new Error("createSystemTray requires a container element.");
  }

  const root = document.createElement("div");
  root.className = "systray";
  container.append(root);

  function render(nextItems = []) {
    root.innerHTML = "";

    for (const item of nextItems) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "systray__item";
      button.title = item.label;
      button.dataset.trayId = item.id;

      button.append(createIconGlyph(item.iconKey, { compact: true }));

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelect?.(item);
      });

      root.append(button);
    }
  }

  render(items);

  return {
    setItems(nextItems) {
      render(nextItems);
    },
    destroy() {
      root.remove();
    },
  };
}
