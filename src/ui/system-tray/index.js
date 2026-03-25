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
      button.className = "systray__icon";
      button.title = item.label;
      button.dataset.trayId = item.id;
      button.setAttribute("aria-label", item.label);

      button.append(createIconGlyph(item.iconKey, { compact: true }));

      const labelNode = document.createElement("span");
      labelNode.className = "systray__sr";
      labelNode.textContent = item.label;
      button.append(labelNode);

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
