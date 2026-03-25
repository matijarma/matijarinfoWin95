import { createIconGlyph } from "../icons/index.js";

const DRAG_THRESHOLD_PX = 3;
const ICON_SLOT_WIDTH = 78;
const ICON_SLOT_HEIGHT = 74;
const ICON_DRAG_BOUNDS_PADDING = 4;

function intersects(rectA, rectB) {
  return !(
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );
}

function normalizeRect(startX, startY, currentX, currentY) {
  return {
    left: Math.min(startX, currentX),
    top: Math.min(startY, currentY),
    right: Math.max(startX, currentX),
    bottom: Math.max(startY, currentY),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createIconSurface({
  container,
  items,
  onActivate,
  onSelectionChanged,
  onContextMenu,
  className = "",
  ariaLabel = "Icon surface",
  draggable = false,
  initialPositions = {},
  onPositionsChanged,
} = {}) {
  if (!container) {
    throw new Error("createIconSurface requires a container element.");
  }

  const iconMap = new Map();
  const selectedIds = new Set();
  const iconPositions = new Map();

  let itemList = [];
  let marqueeDragState = null;
  let iconDragState = null;
  let focusedId = null;
  let recentlyDraggedId = null;

  const root = document.createElement("div");
  root.className = `icon-surface ${className}`.trim();
  root.setAttribute("role", "listbox");
  root.setAttribute("aria-label", ariaLabel);
  root.tabIndex = 0;

  if (draggable) {
    root.classList.add("icon-surface--draggable");
  }

  const grid = document.createElement("div");
  grid.className = "icon-surface__grid";

  const marquee = document.createElement("div");
  marquee.className = "icon-surface__marquee";
  marquee.hidden = true;

  root.append(grid, marquee);
  container.append(root);

  function getItemById(itemId) {
    return itemList.find((item) => item.id === itemId) || null;
  }

  function notifySelectionChanged() {
    if (!onSelectionChanged) {
      return;
    }

    const selectedItems = itemList.filter((item) => selectedIds.has(item.id));
    onSelectionChanged(selectedItems);
  }

  function getInitialPosition(itemId) {
    if (!initialPositions) {
      return null;
    }

    const sourcePosition =
      initialPositions instanceof Map ? initialPositions.get(itemId) : initialPositions[itemId];

    if (!sourcePosition || typeof sourcePosition !== "object") {
      return null;
    }

    const x = Number(sourcePosition.x);
    const y = Number(sourcePosition.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return { x, y };
  }

  function getIconPositionsSnapshot() {
    const snapshot = {};

    for (const [itemId, position] of iconPositions.entries()) {
      snapshot[itemId] = {
        x: Math.round(position.x),
        y: Math.round(position.y),
      };
    }

    return snapshot;
  }

  function notifyPositionsChanged() {
    if (!draggable || !onPositionsChanged) {
      return;
    }

    onPositionsChanged(getIconPositionsSnapshot());
  }

  function getGridRowsForDesktop() {
    const availableHeight = Math.max(ICON_SLOT_HEIGHT, root.clientHeight - ICON_DRAG_BOUNDS_PADDING);
    return Math.max(1, Math.floor(availableHeight / ICON_SLOT_HEIGHT));
  }

  function getDefaultDesktopPosition(index) {
    const rows = getGridRowsForDesktop();
    const column = Math.floor(index / rows);
    const row = index % rows;

    return {
      x: ICON_DRAG_BOUNDS_PADDING + column * ICON_SLOT_WIDTH,
      y: ICON_DRAG_BOUNDS_PADDING + row * ICON_SLOT_HEIGHT,
    };
  }

  function clampDesktopPosition(x, y) {
    const maxX = Math.max(0, root.clientWidth - ICON_SLOT_WIDTH);
    const maxY = Math.max(0, root.clientHeight - ICON_SLOT_HEIGHT);

    return {
      x: clamp(x, ICON_DRAG_BOUNDS_PADDING, maxX),
      y: clamp(y, ICON_DRAG_BOUNDS_PADDING, maxY),
    };
  }

  function snapDesktopPosition(x, y) {
    const snappedColumn = Math.round((x - ICON_DRAG_BOUNDS_PADDING) / ICON_SLOT_WIDTH);
    const snappedRow = Math.round((y - ICON_DRAG_BOUNDS_PADDING) / ICON_SLOT_HEIGHT);

    return clampDesktopPosition(
      ICON_DRAG_BOUNDS_PADDING + snappedColumn * ICON_SLOT_WIDTH,
      ICON_DRAG_BOUNDS_PADDING + snappedRow * ICON_SLOT_HEIGHT,
    );
  }

  function applyButtonPosition(itemId) {
    if (!draggable) {
      return;
    }

    const button = iconMap.get(itemId);

    if (!button) {
      return;
    }

    const position = iconPositions.get(itemId);

    if (!position) {
      return;
    }

    button.style.left = `${position.x}px`;
    button.style.top = `${position.y}px`;
  }

  function setFocusedId(nextFocusedId, { focusDom = false } = {}) {
    focusedId = nextFocusedId && iconMap.has(nextFocusedId) ? nextFocusedId : null;

    for (const [itemId, iconButton] of iconMap.entries()) {
      iconButton.tabIndex = itemId === focusedId ? 0 : -1;
    }

    if (focusDom && focusedId) {
      iconMap.get(focusedId)?.focus();
    }
  }

  function moveFocus(direction) {
    if (itemList.length === 0) {
      return;
    }

    const currentIndex = itemList.findIndex((item) => item.id === focusedId);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (startIndex + direction + itemList.length) % itemList.length;
    const nextItem = itemList[nextIndex];

    if (!nextItem) {
      return;
    }

    setFocusedId(nextItem.id, { focusDom: true });
    setSelection([nextItem.id]);
  }

  function applySelectionClasses() {
    for (const [id, iconButton] of iconMap.entries()) {
      iconButton.classList.toggle("is-selected", selectedIds.has(id));
      iconButton.setAttribute(
        "aria-selected",
        selectedIds.has(id) ? "true" : "false",
      );
    }
  }

  function setSelection(nextIds, { emit = true } = {}) {
    selectedIds.clear();

    for (const id of nextIds) {
      if (iconMap.has(id)) {
        selectedIds.add(id);
      }
    }

    if (selectedIds.size > 0 && !selectedIds.has(focusedId)) {
      const firstId = Array.from(selectedIds)[0];
      setFocusedId(firstId);
    }

    applySelectionClasses();

    if (emit) {
      notifySelectionChanged();
    }
  }

  function selectAll() {
    setSelection(itemList.map((item) => item.id));
  }

  function clearSelection({ emit = true } = {}) {
    if (selectedIds.size === 0) {
      return;
    }

    selectedIds.clear();
    applySelectionClasses();

    if (emit) {
      notifySelectionChanged();
    }
  }

  function activateItem(itemId) {
    const item = getItemById(itemId);

    if (!item) {
      return;
    }

    onActivate?.(item);
  }

  function openContextMenuForItem(itemId, eventOrCoords) {
    const item = getItemById(itemId);

    if (!item) {
      return;
    }

    const iconButton = iconMap.get(itemId);
    let x = 0;
    let y = 0;

    if ("clientX" in eventOrCoords) {
      x = eventOrCoords.clientX;
      y = eventOrCoords.clientY;
    } else {
      x = eventOrCoords.x;
      y = eventOrCoords.y;
    }

    onContextMenu?.({
      type: "item",
      item,
      anchorElement: iconButton,
      x,
      y,
    });
  }

  function renderItems(nextItems = []) {
    const previousPositions = new Map(iconPositions);

    itemList = nextItems.map((itemEntry, index) => ({
      ...itemEntry,
      id: itemEntry.id || `icon-${index + 1}`,
      _renderIndex: index,
    }));

    grid.innerHTML = "";
    iconMap.clear();
    iconPositions.clear();
    selectedIds.clear();

    for (const item of itemList) {
      const iconButton = document.createElement("button");
      iconButton.type = "button";
      iconButton.className = "win-icon";
      iconButton.dataset.iconId = item.id;
      iconButton.setAttribute("role", "option");
      iconButton.setAttribute("aria-selected", "false");
      iconButton.title = item.label;
      iconButton.tabIndex = -1;

      const glyph = createIconGlyph(item.iconKey, { iconUrl: item.iconUrl });
      const label = document.createElement("span");
      label.className = "win-icon__label";
      label.textContent = item.label;

      iconButton.append(glyph, label);

      if (draggable) {
        const sourcePosition =
          (typeof item.x === "number" && typeof item.y === "number"
            ? { x: item.x, y: item.y }
            : previousPositions.get(item.id)) ||
          getInitialPosition(item.id) ||
          getDefaultDesktopPosition(item._renderIndex);

        iconPositions.set(item.id, clampDesktopPosition(sourcePosition.x, sourcePosition.y));
      }

      iconButton.addEventListener("focus", () => {
        setFocusedId(item.id);
      });

      iconButton.addEventListener("pointerdown", (event) => {
        if (!draggable || event.button !== 0) {
          return;
        }

        root.focus();

        if (!selectedIds.has(item.id)) {
          setSelection([item.id]);
        }

        setFocusedId(item.id);

        iconDragState = {
          pointerId: event.pointerId,
          itemId: item.id,
          startX: event.clientX,
          startY: event.clientY,
          startPosition: { ...iconPositions.get(item.id) },
          dragging: false,
        };

        iconButton.setPointerCapture(event.pointerId);

        window.addEventListener("pointermove", onIconPointerMove);
        window.addEventListener("pointerup", onIconPointerUp);
      });

      iconButton.addEventListener("click", (event) => {
        if (recentlyDraggedId === item.id) {
          recentlyDraggedId = null;
          return;
        }

        setFocusedId(item.id);

        if (event.ctrlKey || event.metaKey) {
          if (selectedIds.has(item.id)) {
            selectedIds.delete(item.id);
          } else {
            selectedIds.add(item.id);
          }

          applySelectionClasses();
          notifySelectionChanged();
          return;
        }

        setSelection([item.id]);
      });

      iconButton.addEventListener("dblclick", () => {
        activateItem(item.id);
      });

      iconButton.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          activateItem(item.id);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus(1);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus(-1);
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveFocus(1);
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveFocus(-1);
          return;
        }

        if (event.key === " " && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          setSelection([item.id]);
          return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
          event.preventDefault();
          selectAll();
          return;
        }

        if (event.key === "ContextMenu") {
          event.preventDefault();
          const rect = iconButton.getBoundingClientRect();
          openContextMenuForItem(item.id, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
      });

      iconButton.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        if (!selectedIds.has(item.id)) {
          setSelection([item.id]);
        }

        setFocusedId(item.id);
        openContextMenuForItem(item.id, event);
      });

      iconMap.set(item.id, iconButton);
      grid.append(iconButton);
      applyButtonPosition(item.id);
    }

    const initialFocus = itemList[0]?.id || null;
    setFocusedId(initialFocus);
    applySelectionClasses();

    if (draggable) {
      notifyPositionsChanged();
    }
  }

  function updateMarqueeVisual() {
    if (!marqueeDragState) {
      return;
    }

    const normalized = normalizeRect(
      marqueeDragState.startX,
      marqueeDragState.startY,
      marqueeDragState.currentX,
      marqueeDragState.currentY,
    );

    marquee.style.left = `${normalized.left}px`;
    marquee.style.top = `${normalized.top}px`;
    marquee.style.width = `${normalized.right - normalized.left}px`;
    marquee.style.height = `${normalized.bottom - normalized.top}px`;

    const nextSelection = marqueeDragState.additive
      ? new Set(marqueeDragState.baseSelection)
      : new Set();

    for (const [itemId, iconButton] of iconMap.entries()) {
      const iconRect = {
        left: iconButton.offsetLeft,
        top: iconButton.offsetTop,
        right: iconButton.offsetLeft + iconButton.offsetWidth,
        bottom: iconButton.offsetTop + iconButton.offsetHeight,
      };

      if (intersects(normalized, iconRect)) {
        nextSelection.add(itemId);
      }
    }

    setSelection(nextSelection, { emit: false });
  }

  function stopMarqueeDrag(pointerId) {
    if (!marqueeDragState || marqueeDragState.pointerId !== pointerId) {
      return;
    }

    try {
      root.releasePointerCapture(pointerId);
    } catch {
      // Ignore if capture was already released.
    }

    window.removeEventListener("pointermove", onMarqueePointerMove);
    window.removeEventListener("pointerup", onMarqueePointerUp);

    marquee.hidden = true;

    if (!marqueeDragState.hasDragged && !marqueeDragState.additive) {
      clearSelection({ emit: false });
    }

    marqueeDragState = null;
    notifySelectionChanged();
  }

  function onMarqueePointerMove(event) {
    if (!marqueeDragState || event.pointerId !== marqueeDragState.pointerId) {
      return;
    }

    const rect = root.getBoundingClientRect();
    marqueeDragState.currentX = event.clientX - rect.left;
    marqueeDragState.currentY = event.clientY - rect.top;

    const deltaX = Math.abs(marqueeDragState.currentX - marqueeDragState.startX);
    const deltaY = Math.abs(marqueeDragState.currentY - marqueeDragState.startY);

    if (deltaX > DRAG_THRESHOLD_PX || deltaY > DRAG_THRESHOLD_PX) {
      marqueeDragState.hasDragged = true;
    }

    updateMarqueeVisual();
  }

  function onMarqueePointerUp(event) {
    stopMarqueeDrag(event.pointerId);
  }

  function onIconPointerMove(event) {
    if (!iconDragState || event.pointerId !== iconDragState.pointerId) {
      return;
    }

    const iconButton = iconMap.get(iconDragState.itemId);

    if (!iconButton) {
      return;
    }

    const deltaX = event.clientX - iconDragState.startX;
    const deltaY = event.clientY - iconDragState.startY;

    if (!iconDragState.dragging) {
      if (Math.abs(deltaX) <= DRAG_THRESHOLD_PX && Math.abs(deltaY) <= DRAG_THRESHOLD_PX) {
        return;
      }

      iconDragState.dragging = true;
      iconButton.classList.add("is-dragging");
    }

    const nextPosition = clampDesktopPosition(
      iconDragState.startPosition.x + deltaX,
      iconDragState.startPosition.y + deltaY,
    );

    iconPositions.set(iconDragState.itemId, nextPosition);
    applyButtonPosition(iconDragState.itemId);
  }

  function stopIconDrag(pointerId) {
    if (!iconDragState || iconDragState.pointerId !== pointerId) {
      return;
    }

    const iconButton = iconMap.get(iconDragState.itemId);

    if (iconButton) {
      try {
        iconButton.releasePointerCapture(pointerId);
      } catch {
        // Ignore if capture was already released.
      }

      if (iconDragState.dragging) {
        const current = iconPositions.get(iconDragState.itemId) || iconDragState.startPosition;
        const snapped = snapDesktopPosition(current.x, current.y);
        iconPositions.set(iconDragState.itemId, snapped);
        applyButtonPosition(iconDragState.itemId);
        iconButton.classList.remove("is-dragging");
        recentlyDraggedId = iconDragState.itemId;
        notifyPositionsChanged();
      }
    }

    window.removeEventListener("pointermove", onIconPointerMove);
    window.removeEventListener("pointerup", onIconPointerUp);

    iconDragState = null;
  }

  function onIconPointerUp(event) {
    stopIconDrag(event.pointerId);
  }

  function onPointerDown(event) {
    if (event.button !== 0 || iconDragState) {
      return;
    }

    const iconButton = event.target.closest(".win-icon");

    if (iconButton) {
      return;
    }

    root.focus();

    const rect = root.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    marqueeDragState = {
      pointerId: event.pointerId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      baseSelection: new Set(selectedIds),
      additive: event.ctrlKey || event.metaKey,
      hasDragged: false,
    };

    if (!marqueeDragState.additive) {
      selectedIds.clear();
      applySelectionClasses();
    }

    marquee.hidden = false;
    updateMarqueeVisual();

    root.setPointerCapture(event.pointerId);

    window.addEventListener("pointermove", onMarqueePointerMove);
    window.addEventListener("pointerup", onMarqueePointerUp);
  }

  function onSurfaceContextMenu(event) {
    const iconButton = event.target.closest(".win-icon");

    if (iconButton) {
      return;
    }

    event.preventDefault();

    onContextMenu?.({
      type: "surface",
      x: event.clientX,
      y: event.clientY,
      selectedItems: itemList.filter((item) => selectedIds.has(item.id)),
    });
  }

  function onRootKeydown(event) {
    if (document.activeElement !== root) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(1);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(-1);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selectAll();
      return;
    }

    if (event.key === "ContextMenu" && focusedId) {
      event.preventDefault();
      const focusedElement = iconMap.get(focusedId);

      if (focusedElement) {
        const rect = focusedElement.getBoundingClientRect();
        openContextMenuForItem(focusedId, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    }
  }

  function onWindowResize() {
    if (!draggable) {
      return;
    }

    let positionsChanged = false;

    for (const item of itemList) {
      const current = iconPositions.get(item.id);

      if (!current) {
        continue;
      }

      const clamped = clampDesktopPosition(current.x, current.y);

      if (clamped.x !== current.x || clamped.y !== current.y) {
        positionsChanged = true;
      }

      iconPositions.set(item.id, clamped);
      applyButtonPosition(item.id);
    }

    if (positionsChanged) {
      notifyPositionsChanged();
    }
  }

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("contextmenu", onSurfaceContextMenu);
  root.addEventListener("keydown", onRootKeydown);
  window.addEventListener("resize", onWindowResize);

  renderItems(items);

  return {
    element: root,
    setItems(nextItems) {
      renderItems(nextItems);
    },
    clearSelection,
    selectAll,
    focusFirst() {
      const firstItem = itemList[0];

      if (!firstItem) {
        return;
      }

      setFocusedId(firstItem.id, { focusDom: true });
      setSelection([firstItem.id]);
    },
    getSelectedItems() {
      return itemList.filter((item) => selectedIds.has(item.id));
    },
    getSelectedIds() {
      return Array.from(selectedIds);
    },
    destroy() {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("contextmenu", onSurfaceContextMenu);
      root.removeEventListener("keydown", onRootKeydown);
      window.removeEventListener("resize", onWindowResize);

      if (marqueeDragState) {
        stopMarqueeDrag(marqueeDragState.pointerId);
      }

      if (iconDragState) {
        stopIconDrag(iconDragState.pointerId);
      }

      root.remove();
    },
  };
}
