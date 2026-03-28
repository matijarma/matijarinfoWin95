import { makeDraggable } from "../utils/drag.js";
import { createFocusManager } from "../utils/focus.js";

const WINDOW_CASCADE_OFFSET = 24;
const MAX_CASCADE_STEPS = 7;
const DEFAULT_MIN_WIDTH = 280;
const DEFAULT_MIN_HEIGHT = 200;
const INFO_PANEL_DEFAULT_WIDTH = 270;
const INFO_PANEL_MIN_HEIGHT = 180;
const INFO_PANEL_GAP = 6;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeInfoPanelConfig(infoPanelConfig) {
  if (!infoPanelConfig || typeof infoPanelConfig !== "object") {
    return null;
  }

  const heading =
    typeof infoPanelConfig.heading === "string" && infoPanelConfig.heading.trim()
      ? infoPanelConfig.heading.trim()
      : "Application Info";
  const description =
    typeof infoPanelConfig.description === "string"
      ? infoPanelConfig.description.trim()
      : "";
  const meta = Array.isArray(infoPanelConfig.meta)
    ? infoPanelConfig.meta
        .map((item, index) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const label =
            typeof item.label === "string" && item.label.trim()
              ? item.label.trim()
              : `Field ${index + 1}`;
          const value =
            typeof item.value === "string" && item.value.trim()
              ? item.value.trim()
              : "";

          if (!value) {
            return null;
          }

          return { label, value };
        })
        .filter(Boolean)
    : [];
  const actions = Array.isArray(infoPanelConfig.actions)
    ? infoPanelConfig.actions
        .map((item, index) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const label =
            typeof item.label === "string" && item.label.trim()
              ? item.label.trim()
              : null;

          if (!label) {
            return null;
          }

          return {
            id:
              typeof item.id === "string" && item.id.trim()
                ? item.id.trim()
                : `info-action-${index + 1}`,
            label,
            action:
              typeof item.action === "string" && item.action.trim()
                ? item.action.trim()
                : "",
            url:
              typeof item.url === "string" && item.url.trim()
                ? item.url.trim()
                : "",
            onClick: typeof item.onClick === "function" ? item.onClick : null,
          };
        })
        .filter(Boolean)
    : [];

  return {
    heading,
    description,
    meta,
    actions,
  };
}

export function createWindowManager({ eventBus, container = null } = {}) {
  if (!eventBus) {
    throw new Error("createWindowManager requires an eventBus instance.");
  }

  const windows = new Map();
  const focusManager = createFocusManager();

  let activeContainer = container;
  let nextWindowIndex = 1;
  let cascadeStep = 0;
  let activeWindowId = null;

  function getContainerBounds() {
    if (!activeContainer) {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }

    const rect = activeContainer.getBoundingClientRect();

    return {
      width: Math.max(0, rect.width),
      height: Math.max(0, rect.height),
    };
  }

  function clampGeometry({
    left,
    top,
    width,
    height,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
  }) {
    const bounds = getContainerBounds();
    const maxWidth = Math.max(1, bounds.width || width || minWidth);
    const maxHeight = Math.max(1, bounds.height || height || minHeight);

    const effectiveMinWidth = Math.min(minWidth, maxWidth);
    const effectiveMinHeight = Math.min(minHeight, maxHeight);

    const safeWidth = clamp(width, effectiveMinWidth, maxWidth);
    const safeHeight = clamp(height, effectiveMinHeight, maxHeight);

    return {
      left: clamp(left, 0, Math.max(0, bounds.width - safeWidth)),
      top: clamp(top, 0, Math.max(0, bounds.height - safeHeight)),
      width: safeWidth,
      height: safeHeight,
    };
  }

  function getMaximizedGeometry() {
    const bounds = getContainerBounds();

    return {
      left: 0,
      top: 0,
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
    };
  }

  function ensureInfoPanelElement(record) {
    if (!record?.infoPanel || !activeContainer) {
      return null;
    }

    if (record.infoPanelElement) {
      if (record.infoPanelElement.parentElement !== activeContainer) {
        activeContainer.append(record.infoPanelElement);
      }

      return record.infoPanelElement;
    }

    const panel = document.createElement("aside");
    panel.className = "os-window-info-panel";
    panel.dataset.windowId = record.id;
    panel.hidden = true;

    const header = document.createElement("header");
    header.className = "os-window-info-panel__header";

    const heading = document.createElement("h3");
    heading.className = "os-window-info-panel__title";
    heading.textContent = record.infoPanel.heading;
    header.append(heading);

    const body = document.createElement("div");
    body.className = "os-window-info-panel__body";

    if (record.infoPanel.description) {
      const description = document.createElement("p");
      description.className = "os-window-info-panel__description";
      description.textContent = record.infoPanel.description;
      body.append(description);
    }

    if (record.infoPanel.meta.length > 0) {
      const metaList = document.createElement("dl");
      metaList.className = "os-window-info-panel__meta";

      for (const item of record.infoPanel.meta) {
        const term = document.createElement("dt");
        term.textContent = item.label;

        const value = document.createElement("dd");
        value.textContent = item.value;

        metaList.append(term, value);
      }

      body.append(metaList);
    }

    const actionCleanupFns = [];

    if (record.infoPanel.actions.length > 0) {
      const actions = document.createElement("div");
      actions.className = "os-window-info-panel__actions";

      for (const action of record.infoPanel.actions) {
        const actionButton = document.createElement("button");
        actionButton.type = "button";
        actionButton.className = "os-window-info-panel__button";
        actionButton.dataset.actionId = action.id;
        actionButton.textContent = action.label;

        const actionHandler = (event) => {
          event.stopPropagation();

          if (typeof action.onClick === "function") {
            action.onClick({
              windowId: record.id,
              appId: record.appId,
              action,
            });
          }

          if (action.action === "open-url" && action.url) {
            window.open(action.url, "_blank", "noopener,noreferrer");
          }
        };

        actionButton.addEventListener("click", actionHandler);
        actionCleanupFns.push(() => actionButton.removeEventListener("click", actionHandler));
        actions.append(actionButton);
      }

      body.append(actions);
    }

    panel.append(header, body);

    const panelPointerHandler = () => {
      focusWindow(record.id);
    };

    panel.addEventListener("pointerdown", panelPointerHandler);
    activeContainer.append(panel);

    record.infoPanelElement = panel;
    record.disposeInfoPanel = () => {
      panel.removeEventListener("pointerdown", panelPointerHandler);

      while (actionCleanupFns.length > 0) {
        const cleanup = actionCleanupFns.pop();
        cleanup?.();
      }

      panel.remove();
      record.infoPanelElement = null;
    };

    return panel;
  }

  function syncInfoPanelPosition(record) {
    if (!record?.infoPanel) {
      return;
    }

    const panel = ensureInfoPanelElement(record);

    if (!panel) {
      return;
    }

    if (!record.infoPanelVisible || record.minimized) {
      panel.hidden = true;
      return;
    }

    const bounds = getContainerBounds();
    const panelWidth = Math.min(
      INFO_PANEL_DEFAULT_WIDTH,
      Math.max(220, Math.round(bounds.width * 0.36)),
    );
    const panelHeight = Math.min(
      Math.max(INFO_PANEL_MIN_HEIGHT, record.element.offsetHeight),
      Math.max(INFO_PANEL_MIN_HEIGHT, bounds.height),
    );
    const preferredLeft = record.element.offsetLeft + record.element.offsetWidth + INFO_PANEL_GAP;
    const hasRoomOnRight = preferredLeft + panelWidth <= bounds.width;
    const canDockLeft = record.element.offsetLeft >= panelWidth + INFO_PANEL_GAP;
    const fallbackDockRight = Math.max(0, bounds.width - panelWidth);
    const left = hasRoomOnRight
      ? preferredLeft
      : canDockLeft
        ? record.element.offsetLeft - panelWidth - INFO_PANEL_GAP
        : fallbackDockRight;
    const top = clamp(
      record.element.offsetTop,
      0,
      Math.max(0, bounds.height - panelHeight),
    );

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${panelWidth}px`;
    panel.style.height = `${panelHeight}px`;
    panel.style.zIndex = String(Number(record.element.style.zIndex || 0) + 1);
    panel.hidden = false;
  }

  function syncAllInfoPanels() {
    for (const record of windows.values()) {
      syncInfoPanelPosition(record);
    }
  }

  function setInfoPanelVisible(record, visible) {
    if (!record?.infoPanel) {
      return false;
    }

    record.infoPanelVisible = Boolean(visible);
    syncWindowControlState(record);
    syncInfoPanelPosition(record);

    eventBus.emit("window:info-panel-toggled", {
      windowId: record.id,
      appId: record.appId,
      visible: record.infoPanelVisible,
    });

    return true;
  }

  function toggleInfoPanel(windowId) {
    const record = windows.get(windowId);

    if (!record?.infoPanel) {
      return false;
    }

    return setInfoPanelVisible(record, !record.infoPanelVisible);
  }

  function applyWindowGeometry(record, geometry) {
    record.element.style.left = `${geometry.left}px`;
    record.element.style.top = `${geometry.top}px`;
    record.element.style.width = `${geometry.width}px`;
    record.element.style.height = `${geometry.height}px`;

    if (record.infoPanel) {
      syncInfoPanelPosition(record);
    }
  }

  function captureWindowGeometry(record) {
    return {
      left: record.element.offsetLeft,
      top: record.element.offsetTop,
      width: record.element.offsetWidth,
      height: record.element.offsetHeight,
    };
  }

  function findTopVisibleWindowRecord() {
    let topWindowRecord = null;

    for (const otherRecord of windows.values()) {
      if (otherRecord.minimized) {
        continue;
      }

      if (!topWindowRecord) {
        topWindowRecord = otherRecord;
        continue;
      }

      const currentZIndex = Number(otherRecord.element.style.zIndex || 0);
      const topZIndex = Number(topWindowRecord.element.style.zIndex || 0);

      if (currentZIndex > topZIndex) {
        topWindowRecord = otherRecord;
      }
    }

    return topWindowRecord;
  }

  function getVisibleWindowsSortedByZIndex() {
    return Array.from(windows.values())
      .filter((record) => !record.minimized)
      .sort(
        (leftRecord, rightRecord) =>
          Number(leftRecord.element.style.zIndex || 0) -
          Number(rightRecord.element.style.zIndex || 0),
      );
  }

  function syncWindowControlState(record) {
    if (!record.maximizable) {
      record.maximizeButton.hidden = true;
      record.maximizeButton.disabled = true;
    } else {
      record.maximizeButton.hidden = false;
      record.maximizeButton.disabled = false;
      record.maximizeButton.classList.toggle("is-maximized", record.maximized);
      record.maximizeButton.title = record.maximized ? "Restore" : "Maximize";
      record.maximizeButton.setAttribute(
        "aria-label",
        record.maximized ? "Restore window" : "Maximize window",
      );
    }

    record.minimizeButton.hidden = !record.minimizable;
    record.minimizeButton.disabled = !record.minimizable;

    record.closeButton.hidden = !record.closable;
    record.closeButton.disabled = !record.closable;

    if (record.infoButton) {
      const hasInfoPanel = Boolean(record.infoPanel);
      record.infoButton.hidden = !hasInfoPanel;
      record.infoButton.disabled = !hasInfoPanel;
      record.infoButton.classList.toggle(
        "is-active",
        hasInfoPanel && record.infoPanelVisible && !record.minimized,
      );
    }

    record.resizeHandle.hidden = !record.resizable || record.maximized;
    record.element.classList.toggle("is-maximized", record.maximized);
    syncInfoPanelPosition(record);
  }

  function clampRecordToViewport(record) {
    if (record.minimized) {
      return;
    }

    if (record.maximized) {
      applyWindowGeometry(record, getMaximizedGeometry());
      return;
    }

    const currentGeometry = captureWindowGeometry(record);
    const clamped = clampGeometry({
      ...currentGeometry,
      minWidth: record.minWidth,
      minHeight: record.minHeight,
    });
    applyWindowGeometry(record, clamped);
  }

  function clampAllWindowsToViewport() {
    for (const record of windows.values()) {
      clampRecordToViewport(record);
    }
  }

  function setContainer(nextContainer) {
    activeContainer = nextContainer;

    for (const record of windows.values()) {
      if (!record.infoPanelElement) {
        continue;
      }

      if (activeContainer) {
        activeContainer.append(record.infoPanelElement);
      } else {
        record.infoPanelElement.hidden = true;
      }
    }

    clampAllWindowsToViewport();
    syncAllInfoPanels();
  }

  function listWindows() {
    return Array.from(windows.values()).map((windowRecord) => ({
      id: windowRecord.id,
      appId: windowRecord.appId,
      title: windowRecord.title,
      minimized: windowRecord.minimized,
      maximized: windowRecord.maximized,
      focused: windowRecord.id === activeWindowId,
    }));
  }

  function getWindow(windowId) {
    const record = windows.get(windowId);

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      appId: record.appId,
      title: record.title,
      minimized: record.minimized,
      maximized: record.maximized,
      focused: record.id === activeWindowId,
      minimizable: record.minimizable,
      maximizable: record.maximizable,
      closable: record.closable,
    };
  }

  function getActiveWindowId() {
    return activeWindowId;
  }

  function focusWindow(windowId) {
    const record = windows.get(windowId);

    if (!record || record.minimized) {
      return false;
    }

    for (const otherRecord of windows.values()) {
      otherRecord.element.classList.remove("is-focused");
    }

    record.element.classList.add("is-focused");
    record.element.style.zIndex = String(focusManager.claim(windowId));
    activeWindowId = windowId;
    syncAllInfoPanels();

    eventBus.emit("window:focused", { windowId });

    return true;
  }

  function cycleFocus(direction = 1) {
    const visibleWindows = getVisibleWindowsSortedByZIndex();

    if (visibleWindows.length === 0) {
      return false;
    }

    const currentIndex = visibleWindows.findIndex(
      (windowRecord) => windowRecord.id === activeWindowId,
    );

    const safeDirection = direction < 0 ? -1 : 1;
    const baseIndex = currentIndex === -1 ? visibleWindows.length - 1 : currentIndex;

    const nextIndex =
      (baseIndex + safeDirection + visibleWindows.length) % visibleWindows.length;
    const nextWindow = visibleWindows[nextIndex];

    if (!nextWindow) {
      return false;
    }

    return focusWindow(nextWindow.id);
  }

  function maximizeWindow(windowId) {
    const record = windows.get(windowId);

    if (!record || record.minimized || !record.maximizable || record.maximized) {
      return false;
    }

    record.previousGeometry = captureWindowGeometry(record);
    record.maximized = true;

    applyWindowGeometry(record, getMaximizedGeometry());
    syncWindowControlState(record);
    focusWindow(windowId);

    eventBus.emit("window:maximized", {
      windowId,
      appId: record.appId,
    });

    return true;
  }

  function restoreMaximizedWindow(windowId) {
    const record = windows.get(windowId);

    if (!record || !record.maximized) {
      return false;
    }

    record.maximized = false;

    const fallback = {
      left: 70,
      top: 50,
      width: 460,
      height: 300,
    };

    const restoredGeometry = clampGeometry({
      ...(record.previousGeometry || fallback),
      minWidth: record.minWidth,
      minHeight: record.minHeight,
    });

    applyWindowGeometry(record, restoredGeometry);
    syncWindowControlState(record);
    focusWindow(windowId);

    eventBus.emit("window:restored-size", {
      windowId,
      appId: record.appId,
    });

    return true;
  }

  function toggleMaximizeWindow(windowId) {
    const record = windows.get(windowId);

    if (!record || !record.maximizable) {
      return false;
    }

    if (record.maximized) {
      return restoreMaximizedWindow(windowId);
    }

    return maximizeWindow(windowId);
  }

  function closeWindow(windowId) {
    const record = windows.get(windowId);

    if (!record) {
      return false;
    }

    record.disposeDrag();
    record.disposeResize();
    record.disposeInfoPanel?.();
    record.disposeContent?.();
    record.element.remove();

    focusManager.release(windowId);
    windows.delete(windowId);

    if (activeWindowId === windowId) {
      activeWindowId = null;
    }

    eventBus.emit("window:closed", {
      windowId,
      appId: record.appId,
    });

    const topWindowRecord = findTopVisibleWindowRecord();

    if (topWindowRecord) {
      focusWindow(topWindowRecord.id);
    }

    return true;
  }

  function minimizeWindow(windowId) {
    const record = windows.get(windowId);

    if (!record || record.minimized || !record.minimizable) {
      return false;
    }

    record.minimized = true;
    record.element.classList.add("is-minimized");
    record.element.hidden = true;
    syncWindowControlState(record);

    if (activeWindowId === windowId) {
      activeWindowId = null;
      const topWindowRecord = findTopVisibleWindowRecord();

      if (topWindowRecord) {
        focusWindow(topWindowRecord.id);
      }
    }

    eventBus.emit("window:minimized", {
      windowId,
      appId: record.appId,
    });

    return true;
  }

  function restoreWindow(windowId) {
    const record = windows.get(windowId);

    if (!record || !record.minimized) {
      return false;
    }

    record.minimized = false;
    record.element.classList.remove("is-minimized");
    record.element.hidden = false;

    clampRecordToViewport(record);
    syncWindowControlState(record);
    focusWindow(windowId);

    eventBus.emit("window:restored", {
      windowId,
      appId: record.appId,
    });

    return true;
  }

  function closeAll() {
    const windowIds = Array.from(windows.keys());

    for (const windowId of windowIds) {
      closeWindow(windowId);
    }

    focusManager.reset();
    activeWindowId = null;
  }

  function openWindow({
    appId,
    title,
    content,
    onDispose,
    width = 460,
    height = 300,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
    resizable = true,
    minimizable = true,
    maximizable = resizable,
    closable = true,
    startMaximized = false,
    infoPanel = null,
    left,
    top,
  }) {
    if (!activeContainer) {
      throw new Error("Window container has not been set.");
    }

    const id = `window-${nextWindowIndex}`;
    nextWindowIndex += 1;

    const requestedLeft =
      typeof left === "number"
        ? left
        : 70 + (cascadeStep % MAX_CASCADE_STEPS) * WINDOW_CASCADE_OFFSET;
    const requestedTop =
      typeof top === "number"
        ? top
        : 50 + (cascadeStep % MAX_CASCADE_STEPS) * WINDOW_CASCADE_OFFSET;

    cascadeStep += 1;

    const element = document.createElement("article");
    element.className = "os-window";
    element.dataset.windowId = id;
    element.dataset.appId = appId;

    const titlebar = document.createElement("header");
    titlebar.className = "os-window__titlebar";

    const titleLabel = document.createElement("span");
    titleLabel.className = "os-window__title";
    titleLabel.textContent = title || "Application";
    const normalizedInfoPanel = normalizeInfoPanelConfig(infoPanel);

    const titlebarActions = document.createElement("div");
    titlebarActions.className = "os-window__titlebar-actions";

    const controls = document.createElement("div");
    controls.className = "os-window__controls";

    const minimizeButton = document.createElement("button");
    minimizeButton.type = "button";
    minimizeButton.className = "os-window__control os-window__control--minimize";
    minimizeButton.title = "Minimize";
    minimizeButton.setAttribute("aria-label", "Minimize window");
    minimizeButton.innerHTML = '<span class="os-window__control-icon os-window__control-icon--minimize"></span>';

    const maximizeButton = document.createElement("button");
    maximizeButton.type = "button";
    maximizeButton.className = "os-window__control os-window__control--maximize";
    maximizeButton.title = "Maximize";
    maximizeButton.setAttribute("aria-label", "Maximize window");
    maximizeButton.innerHTML = '<span class="os-window__control-icon os-window__control-icon--maximize"></span>';

    const infoButton = document.createElement("button");
    infoButton.type = "button";
    infoButton.className = "os-window__control os-window__control--info";
    infoButton.title = "App Info";
    infoButton.setAttribute("aria-label", "Open app information panel");
    infoButton.innerHTML = '<span class="os-window__control-icon os-window__control-icon--info"></span>';

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "os-window__control os-window__control--close";
    closeButton.title = "Close";
    closeButton.setAttribute("aria-label", "Close window");
    closeButton.innerHTML = '<span class="os-window__control-icon os-window__control-icon--close"></span>';

    controls.append(minimizeButton, maximizeButton, closeButton);
    titlebarActions.append(infoButton, controls);
    titlebar.append(titleLabel, titlebarActions);

    const body = document.createElement("div");
    body.className = "os-window__body";

    if (content instanceof HTMLElement) {
      body.append(content);
    } else if (typeof content === "string") {
      body.innerHTML = content;
    }

    const resizeHandle = document.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "os-window__resize-handle";
    resizeHandle.title = "Resize";
    resizeHandle.setAttribute("aria-label", "Resize window");

    element.append(titlebar, body, resizeHandle);
    activeContainer.append(element);

    const initialGeometry = clampGeometry({
      left: requestedLeft,
      top: requestedTop,
      width,
      height,
      minWidth,
      minHeight,
    });

    applyWindowGeometry(
      { element },
      {
        left: initialGeometry.left,
        top: initialGeometry.top,
        width: initialGeometry.width,
        height: initialGeometry.height,
      },
    );

    let record = null;

    const disposeDrag = makeDraggable({
      handle: titlebar,
      target: element,
      shouldStart(event) {
        if (!record) {
          return false;
        }

        if (record.maximized) {
          return false;
        }

        return !event.target.closest("button");
      },
      constrainPosition({ left: nextLeft, top: nextTop }) {
        if (!record) {
          return {
            left: nextLeft,
            top: nextTop,
          };
        }

        const clamped = clampGeometry({
          left: nextLeft,
          top: nextTop,
          width: element.offsetWidth,
          height: element.offsetHeight,
          minWidth: record.minWidth,
          minHeight: record.minHeight,
        });

        return {
          left: clamped.left,
          top: clamped.top,
        };
      },
      onMove() {
        if (record) {
          syncInfoPanelPosition(record);
        }
      },
      onMoveEnd() {
        if (record) {
          syncInfoPanelPosition(record);
        }
      },
    });

    let resizePointerId = null;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let resizeStartWidth = 0;
    let resizeStartHeight = 0;
    let resizeStartLeft = 0;
    let resizeStartTop = 0;

    function onResizePointerMove(event) {
      if (!record || event.pointerId !== resizePointerId || record.maximized) {
        return;
      }

      const deltaX = event.clientX - resizeStartX;
      const deltaY = event.clientY - resizeStartY;

      const nextWidth = Math.max(record.minWidth, resizeStartWidth + deltaX);
      const nextHeight = Math.max(record.minHeight, resizeStartHeight + deltaY);

      const clamped = clampGeometry({
        left: resizeStartLeft,
        top: resizeStartTop,
        width: nextWidth,
        height: nextHeight,
        minWidth: record.minWidth,
        minHeight: record.minHeight,
      });

      applyWindowGeometry(record, clamped);

      eventBus.emit("window:resized", {
        windowId: id,
        width: clamped.width,
        height: clamped.height,
      });
    }

    function stopResize(pointerId) {
      if (resizePointerId !== pointerId) {
        return;
      }

      try {
        resizeHandle.releasePointerCapture(pointerId);
      } catch {
        // Ignore if capture is already released.
      }

      resizePointerId = null;

      window.removeEventListener("pointermove", onResizePointerMove);
      window.removeEventListener("pointerup", onResizePointerUp);
    }

    function onResizePointerUp(event) {
      stopResize(event.pointerId);
    }

    function onResizePointerDown(event) {
      if (!record || event.button !== 0 || record.maximized || !record.resizable) {
        return;
      }

      resizePointerId = event.pointerId;
      resizeStartX = event.clientX;
      resizeStartY = event.clientY;
      resizeStartWidth = element.offsetWidth;
      resizeStartHeight = element.offsetHeight;
      resizeStartLeft = element.offsetLeft;
      resizeStartTop = element.offsetTop;

      resizeHandle.setPointerCapture(resizePointerId);
      window.addEventListener("pointermove", onResizePointerMove);
      window.addEventListener("pointerup", onResizePointerUp);

      event.stopPropagation();
      focusWindow(id);
    }

    resizeHandle.addEventListener("pointerdown", onResizePointerDown);

    record = {
      id,
      appId,
      title,
      minimized: false,
      maximized: false,
      infoPanelVisible: false,
      minWidth,
      minHeight,
      resizable,
      minimizable,
      maximizable,
      closable,
      infoPanel: normalizedInfoPanel,
      previousGeometry: null,
      element,
      titlebar,
      minimizeButton,
      maximizeButton,
      infoButton,
      closeButton,
      resizeHandle,
      infoPanelElement: null,
      disposeInfoPanel: null,
      disposeDrag,
      disposeResize() {
        resizeHandle.removeEventListener("pointerdown", onResizePointerDown);

        if (resizePointerId !== null) {
          stopResize(resizePointerId);
        }
      },
      disposeContent: typeof onDispose === "function" ? onDispose : null,
    };

    syncWindowControlState(record);

    element.addEventListener("pointerdown", () => {
      focusWindow(id);
    });

    titlebar.addEventListener("dblclick", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      toggleMaximizeWindow(id);
    });

    minimizeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      minimizeWindow(id);
    });

    maximizeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMaximizeWindow(id);
    });

    infoButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleInfoPanel(id);
      focusWindow(id);
    });

    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      closeWindow(id);
    });

    windows.set(id, record);

    focusWindow(id);

    eventBus.emit("window:opened", {
      windowId: id,
      appId,
      title,
    });

    if (startMaximized) {
      if (maximizable) {
        maximizeWindow(id);
      } else {
        record.previousGeometry = captureWindowGeometry(record);
        record.maximized = true;
        applyWindowGeometry(record, getMaximizedGeometry());
        syncWindowControlState(record);

        eventBus.emit("window:maximized", {
          windowId: id,
          appId: record.appId,
        });
      }
    }

    return id;
  }

  window.addEventListener("resize", clampAllWindowsToViewport);

  return {
    setContainer,
    listWindows,
    getWindow,
    getActiveWindowId,
    openWindow,
    focusWindow,
    cycleFocus,
    maximizeWindow,
    restoreMaximizedWindow,
    toggleMaximizeWindow,
    closeWindow,
    closeAll,
    minimizeWindow,
    restoreWindow,
    toggleInfoPanel,
    destroy() {
      window.removeEventListener("resize", clampAllWindowsToViewport);
      closeAll();
    },
  };
}
