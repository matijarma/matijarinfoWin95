import {
  UIQ_CALENDAR_EVENTS,
  UIQ_CALENDAR_TASKS,
  UIQ_CALL_LOG,
  UIQ_CONTACTS,
  UIQ_FILE_TREE,
  UIQ_LAUNCHER_GRID,
  UIQ_MEDIA_PHOTOS,
  UIQ_MEDIA_TRACKS,
  UIQ_MESSAGE_FOLDERS,
  UIQ_NOTES,
  UIQ_PROFILES,
  UIQ_SETTINGS_SECTIONS,
  UIQ_TODAY_CARDS,
  cloneUIQFileTree,
  cloneUIQSettingsSections,
  formatUIQDateLabel,
  formatUIQTimeLabel,
  formatUIQTrackLength,
  getUIQStatusSnapshot,
  getUIQThreadsByFolder,
} from "./uiq-data.js";
import {
  renderBootScreen,
  renderDialogPanel,
  renderLauncherView,
  renderListAppScreen,
  renderTodayView,
} from "./uiq-views.js";

const BOOT_STEP_INTERVAL_MS = 360;
const BOOT_READY_DELAY_MS = 420;
const CLOCK_TICK_MS = 1000;
const TOAST_DEFAULT_MS = 2300;
const LAUNCHER_COLUMNS = 3;

const BOOT_SEQUENCE = [
  "Symbian OS v9.1 kernel initialized",
  "UIQ framework services loaded",
  "Touch panel driver online",
  "Telephony service attached",
  "Mounting phone memory",
  "Mounting memory stick",
  "Applying active profile",
  "Building Today screen widgets",
  "Preparing launcher",
  "Handset ready",
];

const BROWSER_BOOKMARKS = [
  {
    id: "bookmark-portfolio",
    label: "matijar.info/docs",
    subtitle: "https://matijar.info/docs",
    trailing: "Today",
    iconToken: "WB",
  },
  {
    id: "bookmark-uiq",
    label: "UIQ design archive",
    subtitle: "https://archive.uiq.dev",
    trailing: "Yesterday",
    iconToken: "WB",
  },
  {
    id: "bookmark-symbian",
    label: "Symbian reference",
    subtitle: "https://developer.symbian.org",
    trailing: "Mar 24",
    iconToken: "WB",
  },
];

const RSS_ENTRIES = [
  {
    id: "rss-1",
    label: "UIQ archive: command bar patterns",
    subtitle: "New article about CBA behavior on P1i",
    trailing: "3 min",
    iconToken: "RS",
  },
  {
    id: "rss-2",
    label: "Legacy mobile typography",
    subtitle: "How UIQ balanced density and readability",
    trailing: "18 min",
    iconToken: "RS",
  },
  {
    id: "rss-3",
    label: "Symbian app lifecycle notes",
    subtitle: "Cold-start and background service guidance",
    trailing: "1 h",
    iconToken: "RS",
  },
];

const HELP_ENTRIES = [
  {
    id: "help-nav",
    label: "Navigation",
    subtitle: "Arrows move, center selects",
    trailing: "F2",
    iconToken: "HP",
  },
  {
    id: "help-softkeys",
    label: "Softkeys",
    subtitle: "Left options, right back",
    trailing: "F1/F3",
    iconToken: "HP",
  },
  {
    id: "help-launcher",
    label: "Launcher",
    subtitle: "Use # and * to switch pages",
    trailing: "#/*",
    iconToken: "HP",
  },
  {
    id: "help-home",
    label: "Today screen",
    subtitle: "Press H to return home",
    trailing: "H",
    iconToken: "HP",
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeIndex(index, length) {
  if (!Number.isFinite(length) || length <= 0) {
    return 0;
  }

  const safe = Number.isFinite(index) ? Math.trunc(index) : 0;
  return clamp(safe, 0, length - 1);
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseIsoDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatEventTimeRange(event) {
  const start = parseIsoDate(event.startIso);
  const end = parseIsoDate(event.endIso || event.startIso);
  const startLabel = formatUIQTimeLabel(start, { hour12: false });
  const endLabel = formatUIQTimeLabel(end, { hour12: false });
  return `${startLabel}-${endLabel}`;
}

function groupLauncherShortcuts(cards) {
  return cards.slice(0, 4).map((card) => ({
    id: card.actionId,
    label: card.title,
    iconToken: (card.title || "").slice(0, 2).toUpperCase(),
    disabled: false,
  }));
}

function flattenFileNodes(node, list = []) {
  if (!node || typeof node !== "object") {
    return list;
  }

  list.push(node);

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      flattenFileNodes(child, list);
    }
  }

  return list;
}

function findNodeByPath(rootNode, ids) {
  if (!rootNode || !Array.isArray(ids) || !ids.length) {
    return rootNode;
  }

  let current = rootNode;

  for (let i = 1; i < ids.length; i += 1) {
    const id = ids[i];
    const children = Array.isArray(current?.children) ? current.children : [];
    const next = children.find((child) => child.id === id);

    if (!next) {
      return current;
    }

    current = next;
  }

  return current;
}

function cycleSettingValue(item, direction = 1) {
  if (!item || typeof item !== "object") {
    return;
  }

  if (item.type === "toggle") {
    item.value = !item.value;
    return;
  }

  if (item.type === "select" && Array.isArray(item.options) && item.options.length > 0) {
    const currentIndex = item.options.findIndex((entry) => entry === item.value);
    const safeCurrent = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeCurrent + direction + item.options.length) % item.options.length;
    item.value = item.options[nextIndex];
  }
}

function formatSettingValue(value) {
  if (value === true) {
    return "On";
  }

  if (value === false) {
    return "Off";
  }

  return String(value ?? "");
}

function makeSelectionKey(appId, tabId = "default") {
  return `${appId}::${tabId}`;
}

function moveGridSelection(index, key, count, columns) {
  if (count <= 0) {
    return 0;
  }

  const safe = safeIndex(index, count);
  const col = safe % columns;

  if (key === "ArrowLeft" && col > 0) {
    return safe - 1;
  }

  if (key === "ArrowRight" && col < columns - 1 && safe + 1 < count) {
    return safe + 1;
  }

  if (key === "ArrowUp" && safe - columns >= 0) {
    return safe - columns;
  }

  if (key === "ArrowDown" && safe + columns < count) {
    return safe + columns;
  }

  return safe;
}

function pickToneBySignalBars(bars) {
  if (bars >= 4) {
    return "success";
  }

  if (bars >= 2) {
    return "info";
  }

  return "warning";
}

export function createSymbianShell({ root }) {
  const settingsSections = cloneUIQSettingsSections(UIQ_SETTINGS_SECTIONS);
  const fileTree = cloneUIQFileTree(UIQ_FILE_TREE);
  const notes = UIQ_NOTES.map((entry) => ({ ...entry }));
  const tasks = UIQ_CALENDAR_TASKS.map((entry) => ({ ...entry }));
  const photos = UIQ_MEDIA_PHOTOS.map((entry) => ({ ...entry }));
  const recordings = [];

  const launcherPages = Array.isArray(UIQ_LAUNCHER_GRID.pages)
    ? UIQ_LAUNCHER_GRID.pages.map((page) => ({
        ...page,
        tiles: Array.isArray(page.tiles) ? page.tiles.map((tile) => ({ ...tile })) : [],
      }))
    : [];

  const statusState = {
    now: new Date(),
    tick: 0,
  };

  const state = {
    phase: "booting",
    bootLineCount: 0,
    view: "boot",
    appId: null,
    history: [],
    launcherPageIndex: 0,
    launcherSelectedByPage: {},
    todayShortcutIndex: 0,
    todayAgendaIndex: 0,
    todayNotificationIndex: 0,
    tabByApp: {
      messages: "inbox",
      calendar: "agenda",
      media: "tracks",
      browser: "bookmarks",
      organizer: "agenda",
      "control-panel": settingsSections[0]?.id || "connectivity",
    },
    selectedByKey: {},
    filesPathIds: [fileTree?.id || "root"],
    activeProfileId: UIQ_PROFILES[0]?.id || "general",
    musicPlaying: false,
    musicTrackIndex: 0,
    musicElapsedSec: 0,
    recorderActive: false,
    browserLoading: false,
    browserHistory: [
      {
        id: "hist-1",
        label: "matijar.info",
        subtitle: "https://matijar.info",
        trailing: "13:02",
        iconToken: "HB",
      },
      {
        id: "hist-2",
        label: "UIQ docs",
        subtitle: "https://archive.uiq.dev",
        trailing: "12:48",
        iconToken: "HB",
      },
    ],
    calculatorExpression: "2+2",
    calculatorResult: "4",
    dialog: null,
    toast: null,
    statusMessage: "Today screen ready.",
  };

  const timers = {
    bootInterval: null,
    bootReadyTimeout: null,
    clockInterval: null,
    toastTimeout: null,
    browserTimeout: null,
  };

  function clearTimer(timerKey) {
    const timerId = timers[timerKey];

    if (!timerId) {
      return;
    }

    if (timerKey === "bootReadyTimeout" || timerKey === "toastTimeout" || timerKey === "browserTimeout") {
      window.clearTimeout(timerId);
    } else {
      window.clearInterval(timerId);
    }

    timers[timerKey] = null;
  }

  function clearAllTimers() {
    clearTimer("bootInterval");
    clearTimer("bootReadyTimeout");
    clearTimer("clockInterval");
    clearTimer("toastTimeout");
    clearTimer("browserTimeout");
  }

  function setToast(message, tone = "info", durationMs = TOAST_DEFAULT_MS) {
    state.toast = {
      message,
      tone,
    };

    clearTimer("toastTimeout");

    if (durationMs > 0) {
      timers.toastTimeout = window.setTimeout(() => {
        state.toast = null;
        timers.toastTimeout = null;
        render();
      }, durationMs);
    }
  }

  function clearToast() {
    state.toast = null;
    clearTimer("toastTimeout");
  }

  function openDialog({
    title = "Info",
    message = "",
    lines = [],
    tone = "info",
    confirmLabel = "OK",
    cancelLabel = "",
    onConfirm = null,
    onCancel = null,
  } = {}) {
    state.dialog = {
      title,
      message,
      lines: Array.isArray(lines) ? [...lines] : [],
      tone,
      confirmLabel,
      cancelLabel,
      onConfirm,
      onCancel,
    };
  }

  function closeDialog() {
    state.dialog = null;
  }

  function pushHistorySnapshot() {
    state.history.push({
      view: state.view,
      appId: state.appId,
      launcherPageIndex: state.launcherPageIndex,
    });
  }

  function openToday({ clearHistory = false } = {}) {
    state.view = "today";
    state.appId = null;
    state.statusMessage = "Today screen active.";

    if (clearHistory) {
      state.history = [];
    }
  }

  function openLauncher({ pushHistory = true } = {}) {
    if (state.phase !== "ready") {
      return;
    }

    if (pushHistory && (state.view !== "launcher" || state.appId)) {
      pushHistorySnapshot();
    }

    state.view = "launcher";
    state.appId = null;
    state.statusMessage = "Main menu.";
  }

  function openApp(appId, { pushHistory = true } = {}) {
    if (state.phase !== "ready") {
      return;
    }

    const appExists = launcherPages.some((page) => page.tiles.some((tile) => tile.id === appId));

    if (!appExists) {
      setToast(`App '${appId}' is unavailable.`, "warning");
      return;
    }

    if (pushHistory && (state.view !== "app" || state.appId !== appId)) {
      pushHistorySnapshot();
    }

    state.view = "app";
    state.appId = appId;
    state.statusMessage = `${appId} opened.`;
  }

  function goBack() {
    if (state.dialog) {
      closeDialog();
      return;
    }

    if (state.history.length > 0) {
      const previous = state.history.pop();
      state.view = previous.view;
      state.appId = previous.appId || null;
      state.launcherPageIndex = safeIndex(previous.launcherPageIndex, launcherPages.length);
      state.statusMessage = "Returned.";
      return;
    }

    if (state.view !== "today") {
      openToday({ clearHistory: true });
      return;
    }

    setToast("Today screen is already active.", "info");
  }

  function getLauncherPage() {
    return launcherPages[safeIndex(state.launcherPageIndex, launcherPages.length)] || launcherPages[0] || {
      id: "main",
      label: "Main",
      tiles: [],
    };
  }

  function getLauncherSelectedIndex(pageId, count) {
    const stored = state.launcherSelectedByPage[pageId] ?? 0;
    const safe = safeIndex(stored, count);
    state.launcherSelectedByPage[pageId] = safe;
    return safe;
  }

  function setLauncherSelectedIndex(pageId, index, count) {
    state.launcherSelectedByPage[pageId] = safeIndex(index, count);
  }

  function getCurrentTab(appId, fallback) {
    const tab = state.tabByApp[appId];
    return typeof tab === "string" && tab ? tab : fallback;
  }

  function setCurrentTab(appId, tabId) {
    if (typeof tabId === "string" && tabId) {
      state.tabByApp[appId] = tabId;
    }
  }

  function getSelection(appId, tabId, count) {
    const key = makeSelectionKey(appId, tabId);
    const stored = state.selectedByKey[key] ?? 0;
    const safe = safeIndex(stored, count);
    state.selectedByKey[key] = safe;
    return safe;
  }

  function setSelection(appId, tabId, index, count) {
    const key = makeSelectionKey(appId, tabId);
    state.selectedByKey[key] = safeIndex(index, count);
  }

  function getCurrentFileNode() {
    const rootId = fileTree?.id || "root";

    if (!Array.isArray(state.filesPathIds) || state.filesPathIds.length === 0) {
      state.filesPathIds = [rootId];
    }

    if (state.filesPathIds[0] !== rootId) {
      state.filesPathIds[0] = rootId;
    }

    return findNodeByPath(fileTree, state.filesPathIds);
  }

  function getCurrentFileItems() {
    const node = getCurrentFileNode();
    const children = Array.isArray(node?.children) ? node.children : [];

    return children.map((entry) => ({
      id: entry.id,
      label: entry.name,
      subtitle:
        entry.type === "folder"
          ? `${(entry.children || []).length} item(s)`
          : `Size ${entry.sizeLabel || "unknown"}`,
      trailing: entry.type === "folder" ? "Folder" : entry.sizeLabel || "--",
      iconToken: entry.type === "folder" ? "FD" : "FI",
    }));
  }

  function getFilePathLabel() {
    const flat = flattenFileNodes(fileTree, []);
    const names = state.filesPathIds
      .map((id) => flat.find((entry) => entry.id === id))
      .filter(Boolean)
      .map((entry) => entry.name);

    return names.join(" / ") || "Phone memory";
  }

  function getConnectivitySection() {
    return settingsSections.find((section) => section.id === "connectivity") || settingsSections[0] || null;
  }

  function getActiveProfile() {
    return UIQ_PROFILES.find((profile) => profile.id === state.activeProfileId) || UIQ_PROFILES[0] || null;
  }

  function getTodayAgendaItems() {
    return [...UIQ_CALENDAR_EVENTS]
      .sort((left, right) => left.startIso.localeCompare(right.startIso))
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        label: `${formatEventTimeRange(event)} ${event.title}`,
        subtitle: `${formatUIQDateLabel(parseIsoDate(event.startIso), { long: false })} • ${event.location}`,
        trailing: parseIsoDate(event.startIso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
        }),
        iconToken: "AG",
      }));
  }

  function getTodayNotifications() {
    return UIQ_TODAY_CARDS.map((card) => ({
      id: card.actionId,
      label: card.title,
      subtitle: card.subtitle,
      trailing: card.detail,
      iconToken: (card.type || "NT").slice(0, 2).toUpperCase(),
      unread: card.type === "messages" || card.type === "calls",
    }));
  }

  function resolveAction(actionId) {
    if (actionId === "open-calendar") {
      openApp("calendar");
      return;
    }

    if (actionId === "open-messages") {
      openApp("messages");
      return;
    }

    if (actionId === "open-calls") {
      openApp("calls");
      return;
    }

    if (actionId === "open-connections") {
      openApp("connections");
      return;
    }

    if (actionId === "open-rss") {
      openApp("rss");
      return;
    }

    if (actionId === "open-launcher") {
      openLauncher();
      return;
    }

    setToast("Action not wired yet.", "warning");
  }

  function renderStatusBar(statusSnapshot) {
    const signalBars = clamp(Number(statusSnapshot.signal?.bars) || 0, 0, 5);
    const batteryPercent = clamp(Number(statusSnapshot.battery?.percent) || 0, 0, 100);
    const connectivity = getConnectivitySection();
    const bluetooth = connectivity?.items?.find((entry) => entry.id === "bluetooth")?.value === true;
    const wlan = connectivity?.items?.find((entry) => entry.id === "wlan")?.value === true;

    return `
      <header class="uiq-statusbar" aria-label="Status bar">
        <div class="uiq-statusbar__left">
          <span class="uiq-statusbar__date">${safeText(statusSnapshot.dateLabel)}</span>
        </div>
        <div class="uiq-statusbar__center">
          <span class="uiq-statusbar__operator">${safeText(statusSnapshot.operator?.label || "T-Mobile HR")}</span>
        </div>
        <div class="uiq-statusbar__right">
          <span class="uiq-status-icon ${bluetooth ? "is-active" : ""}" title="Bluetooth"></span>
          <span class="uiq-status-icon ${wlan ? "is-active" : ""}" title="WLAN"></span>
          <span class="uiq-signal" aria-label="Signal ${signalBars} of 5">
            ${[0, 1, 2, 3]
              .map(
                (index) =>
                  `<span class="uiq-signal__bar ${index < Math.round((signalBars / 5) * 4) ? "is-active" : ""}"></span>`,
              )
              .join("")}
          </span>
          <span class="uiq-battery" aria-label="Battery ${batteryPercent}%">
            <span class="uiq-battery__cell" style="--uiq-battery-level: ${batteryPercent}%">
              <span class="uiq-battery__fill"></span>
            </span>
            <span class="uiq-battery__cap"></span>
            <span class="uiq-battery__text">${safeText(String(batteryPercent))}%</span>
          </span>
          <span class="uiq-statusbar__time">${safeText(statusSnapshot.clockLabel)}</span>
        </div>
      </header>
    `;
  }

  function renderHardwareControls() {
    return `
      <footer class="uiq-phone__bottom" aria-hidden="true">
        <div class="uiq-navpad uiq-navpad--compact">
          <span class="uiq-navpad__ring"></span>
          <button type="button" class="uiq-navpad__hint uiq-navpad__hint--up" data-nav-key="ArrowUp">Up</button>
          <button type="button" class="uiq-navpad__hint uiq-navpad__hint--left" data-nav-key="ArrowLeft">Lt</button>
          <button type="button" class="uiq-navpad__ok" data-softkey="center">OK</button>
          <button type="button" class="uiq-navpad__hint uiq-navpad__hint--right" data-nav-key="ArrowRight">Rt</button>
          <button type="button" class="uiq-navpad__hint uiq-navpad__hint--down" data-nav-key="ArrowDown">Dn</button>
        </div>
        <div class="uiq-keyboard-deck">
          <div class="uiq-keyboard-deck__hinge"></div>
          <div class="uiq-keyboard-deck__row">
            <span class="uiq-keyboard-deck__key">Q</span>
            <span class="uiq-keyboard-deck__key">W</span>
            <span class="uiq-keyboard-deck__key">E</span>
            <span class="uiq-keyboard-deck__key">R</span>
            <span class="uiq-keyboard-deck__split">|</span>
            <span class="uiq-keyboard-deck__key">Y</span>
            <span class="uiq-keyboard-deck__key">U</span>
            <span class="uiq-keyboard-deck__key">I</span>
            <span class="uiq-keyboard-deck__key">O</span>
          </div>
          <div class="uiq-keyboard-deck__row">
            <span class="uiq-keyboard-deck__key">A</span>
            <span class="uiq-keyboard-deck__key">S</span>
            <span class="uiq-keyboard-deck__key">D</span>
            <span class="uiq-keyboard-deck__key">F</span>
            <span class="uiq-keyboard-deck__split">|</span>
            <span class="uiq-keyboard-deck__key">H</span>
            <span class="uiq-keyboard-deck__key">J</span>
            <span class="uiq-keyboard-deck__key">K</span>
            <span class="uiq-keyboard-deck__key">L</span>
          </div>
          <div class="uiq-keyboard-deck__row">
            <span class="uiq-keyboard-deck__key">Z</span>
            <span class="uiq-keyboard-deck__key">X</span>
            <span class="uiq-keyboard-deck__key">C</span>
            <span class="uiq-keyboard-deck__key">SYM</span>
            <span class="uiq-keyboard-deck__split">|</span>
            <span class="uiq-keyboard-deck__key">B</span>
            <span class="uiq-keyboard-deck__key">N</span>
            <span class="uiq-keyboard-deck__key">M</span>
            <span class="uiq-keyboard-deck__key">SP</span>
          </div>
        </div>
      </footer>
    `;
  }

  function getAppScreenConfig() {
    const appId = state.appId;

    if (!appId) {
      return {
        appId: "empty",
        title: "Application",
        subtitle: "No app",
        tabs: [],
        activeTabId: "",
        items: [],
        selectedIndex: 0,
        detailPanel: {
          title: "No application",
          description: "Select an app from launcher.",
        },
        softkeys: {
          left: "Options",
          center: "Select",
          right: "Back",
        },
      };
    }

    if (appId === "phone" || appId === "calls") {
      const items = UIQ_CALL_LOG.map((call) => ({
        id: call.id,
        label: call.contactName,
        subtitle: `${call.kind.toUpperCase()} • ${call.phone}`,
        trailing: call.atLabel,
        iconToken: "CL",
      }));
      const selectedIndex = getSelection(appId, "all", items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: appId === "phone" ? "Phone" : "Call Log",
        subtitle: "Recent calls",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "No call",
          subtitle: selected?.subtitle || "",
          rows: [
            { label: "When", value: selected?.trailing || "--" },
            { label: "Action", value: "Center key places callback" },
          ],
          actions: [
            { id: "call-back", label: "Call back" },
            { id: "message", label: "Message" },
          ],
        },
        softkeys: {
          left: "Options",
          center: "Call",
          right: "Back",
        },
      };
    }

    if (appId === "messages") {
      const folders = UIQ_MESSAGE_FOLDERS.map((folder) => ({
        id: folder.id,
        label: folder.label,
        badge: folder.unreadCount > 0 ? String(folder.unreadCount) : "",
      }));
      const activeTabId = getCurrentTab(appId, folders[0]?.id || "inbox");
      const threads = getUIQThreadsByFolder(activeTabId);

      const items = threads.map((thread) => ({
        id: thread.id,
        label: thread.participant,
        subtitle: thread.preview,
        trailing: thread.updatedAt,
        iconToken: "MS",
        badge: thread.unreadCount > 0 ? String(thread.unreadCount) : "",
        unread: thread.unreadCount > 0,
      }));
      const selectedIndex = getSelection(appId, activeTabId, items.length);
      const selectedThread = threads[selectedIndex];

      return {
        appId,
        title: "Messages",
        subtitle: `Folder: ${activeTabId}`,
        tabs: folders,
        activeTabId,
        items,
        selectedIndex,
        detailPanel: {
          title: selectedThread?.subject || "No thread",
          subtitle: selectedThread?.participant || "",
          rows: (selectedThread?.messages || []).slice(-3).map((message) => ({
            label: message.direction === "in" ? selectedThread.participant : "You",
            value: message.body,
          })),
          actions: [
            { id: "open-thread", label: "Open" },
            { id: "reply", label: "Reply" },
          ],
        },
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
      };
    }

    if (appId === "contacts") {
      const tabs = [
        { id: "all", label: "All" },
        { id: "work", label: "Work" },
        { id: "recent", label: "Recent" },
      ];
      const activeTabId = getCurrentTab(appId, "all");

      let pool = UIQ_CONTACTS;
      if (activeTabId === "work") {
        pool = UIQ_CONTACTS.filter((contact) => Boolean(contact.company));
      }
      if (activeTabId === "recent") {
        pool = UIQ_CONTACTS.slice(0, 4);
      }

      const items = pool.map((contact) => ({
        id: contact.id,
        label: contact.displayName,
        subtitle: `${contact.company} • ${contact.title}`,
        trailing: contact.lastInteraction,
        iconToken: "CT",
      }));
      const selectedIndex = getSelection(appId, activeTabId, items.length);
      const selectedContact = pool[selectedIndex];

      return {
        appId,
        title: "Contacts",
        subtitle: `${pool.length} entries`,
        tabs,
        activeTabId,
        items,
        selectedIndex,
        detailPanel: {
          title: selectedContact?.displayName || "No contact",
          subtitle: selectedContact?.company || "",
          rows: selectedContact
            ? [
                { label: "Mobile", value: selectedContact.phones?.[0]?.value || "--" },
                { label: "Email", value: selectedContact.emails?.[0] || "--" },
                { label: "Notes", value: selectedContact.notes || "--" },
              ]
            : [],
          actions: [
            { id: "call-contact", label: "Call" },
            { id: "sms-contact", label: "Message" },
          ],
        },
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
      };
    }

    if (appId === "calendar" || appId === "tasks" || appId === "organizer") {
      const tabs = [
        { id: "agenda", label: "Agenda" },
        { id: "tasks", label: "Tasks" },
      ];
      const activeTabId = getCurrentTab(appId, "agenda");

      const items =
        activeTabId === "tasks"
          ? tasks.map((task) => ({
              id: task.id,
              label: task.title,
              subtitle: `${task.priority.toUpperCase()} • ${task.status}`,
              trailing: `${task.percentDone}%`,
              iconToken: "TK",
            }))
          : UIQ_CALENDAR_EVENTS.map((event) => ({
              id: event.id,
              label: `${formatEventTimeRange(event)} ${event.title}`,
              subtitle: `${formatUIQDateLabel(parseIsoDate(event.startIso), { long: false })} • ${event.location}`,
              trailing: event.type,
              iconToken: "CL",
            }));

      const selectedIndex = getSelection(appId, activeTabId, items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: appId === "tasks" ? "Tasks" : appId === "organizer" ? "Organizer" : "Calendar",
        subtitle: activeTabId === "tasks" ? "Task list" : "Agenda",
        tabs,
        activeTabId,
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "No item",
          subtitle: selected?.subtitle || "",
          rows: [
            { label: "Type", value: activeTabId === "tasks" ? "Task" : "Event" },
            { label: "Status", value: selected?.trailing || "--" },
          ],
          actions: [
            { id: "open-calendar-item", label: "Open" },
            { id: "toggle-task", label: "Toggle" },
          ],
        },
        softkeys: {
          left: "Options",
          center: activeTabId === "tasks" ? "Toggle" : "Open",
          right: "Back",
        },
      };
    }

    if (appId === "media") {
      const tabs = [
        { id: "tracks", label: "Tracks" },
        { id: "photos", label: "Photos" },
      ];
      const activeTabId = getCurrentTab(appId, "tracks");

      const items =
        activeTabId === "tracks"
          ? UIQ_MEDIA_TRACKS.map((track) => ({
              id: track.id,
              label: track.title,
              subtitle: track.artist,
              trailing: formatUIQTrackLength(track.durationSec),
              iconToken: "MU",
            }))
          : photos.map((photo) => ({
              id: photo.id,
              label: photo.title,
              subtitle: photo.resolution,
              trailing: photo.sizeLabel,
              iconToken: "PH",
            }));

      const selectedIndex = getSelection(appId, activeTabId, items.length);
      const selectedItem = items[selectedIndex];

      return {
        appId,
        title: "Media",
        subtitle: activeTabId === "tracks" ? "Music library" : "Photo gallery",
        tabs,
        activeTabId,
        items,
        selectedIndex,
        detailPanel: {
          title: selectedItem?.label || "No item",
          subtitle: selectedItem?.subtitle || "",
          rows:
            activeTabId === "tracks"
              ? [
                  { label: "Length", value: selectedItem?.trailing || "--" },
                  {
                    label: "Playback",
                    value:
                      state.musicPlaying && selectedIndex === state.musicTrackIndex ? "Playing" : "Stopped",
                  },
                ]
              : [
                  { label: "Resolution", value: selectedItem?.subtitle || "--" },
                  { label: "Size", value: selectedItem?.trailing || "--" },
                ],
          actions: [
            { id: activeTabId === "tracks" ? "play-track" : "view-photo", label: activeTabId === "tracks" ? "Play" : "View" },
          ],
        },
        softkeys: {
          left: "Options",
          center: activeTabId === "tracks" ? "Play" : "View",
          right: "Back",
        },
      };
    }

    if (appId === "camera") {
      const items = [
        {
          id: "camera-capture",
          label: "Capture photo",
          subtitle: "5 MP / autofocus",
          trailing: "Ready",
          iconToken: "CM",
        },
        {
          id: "camera-mode",
          label: "Scene mode",
          subtitle: "Auto",
          trailing: "Change",
          iconToken: "CM",
        },
        {
          id: "camera-storage",
          label: "Storage",
          subtitle: "Memory Stick",
          trailing: "1.8 GB free",
          iconToken: "CM",
        },
      ];
      const selectedIndex = getSelection(appId, "default", items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: "Camera",
        subtitle: "Sony Ericsson",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "Camera",
          subtitle: selected?.subtitle || "",
          rows: [
            { label: "Tip", value: "Center key captures a sample photo." },
            { label: "Storage", value: "Saved to Images folder" },
          ],
          actions: [{ id: "capture-photo", label: "Capture" }],
        },
        softkeys: {
          left: "Options",
          center: "Capture",
          right: "Back",
        },
      };
    }

    if (appId === "browser") {
      const tabs = [
        { id: "bookmarks", label: "Bookmarks" },
        { id: "history", label: "History" },
      ];
      const activeTabId = getCurrentTab(appId, "bookmarks");
      const items = activeTabId === "history" ? state.browserHistory : BROWSER_BOOKMARKS;
      const selectedIndex = getSelection(appId, activeTabId, items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: "Browser",
        subtitle: state.browserLoading ? "Loading..." : "Ready",
        tabs,
        activeTabId,
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "No page",
          subtitle: selected?.subtitle || "",
          rows: [
            { label: "Last", value: selected?.trailing || "--" },
            { label: "State", value: state.browserLoading ? "Loading" : "Idle" },
          ],
          actions: [
            { id: "open-page", label: "Open" },
            { id: "refresh-page", label: "Refresh" },
          ],
        },
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
      };
    }

    if (appId === "file-manager") {
      const items = getCurrentFileItems();
      const selectedIndex = getSelection(appId, getFilePathLabel(), items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: "File Manager",
        subtitle: getFilePathLabel(),
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "Folder",
          subtitle: selected?.subtitle || "",
          rows: [
            { label: "Path", value: getFilePathLabel() },
            { label: "Action", value: "Center key opens file/folder" },
          ],
          actions: [
            { id: "open-file-node", label: "Open" },
            { id: "go-up-path", label: "Up" },
          ],
        },
        softkeys: {
          left: "Up",
          center: "Open",
          right: "Back",
        },
      };
    }

    if (appId === "notes") {
      const items = notes.map((note) => ({
        id: note.id,
        label: note.title,
        subtitle: note.body,
        trailing: note.updatedAt,
        iconToken: "NT",
      }));
      const selectedIndex = getSelection(appId, "default", items.length);
      const selected = notes[selectedIndex];

      return {
        appId,
        title: "Notes",
        subtitle: `${notes.length} saved`,
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.title || "No note",
          subtitle: selected?.updatedAt || "",
          description: selected?.body || "",
          actions: [
            { id: "open-note", label: "Open" },
            { id: "new-note", label: "New" },
          ],
        },
        softkeys: {
          left: "New",
          center: "Open",
          right: "Back",
        },
      };
    }

    if (appId === "control-panel" || appId === "connections") {
      const isConnectionsOnly = appId === "connections";
      const tabs = isConnectionsOnly
        ? [{ id: "connectivity", label: "Connectivity" }]
        : settingsSections.map((section) => ({ id: section.id, label: section.title }));
      const activeTabId = isConnectionsOnly
        ? "connectivity"
        : getCurrentTab(appId, tabs[0]?.id || settingsSections[0]?.id || "connectivity");
      const section = settingsSections.find((entry) => entry.id === activeTabId) || settingsSections[0];
      const items = (section?.items || []).map((item) => ({
        id: item.id,
        label: item.label,
        subtitle: item.type,
        trailing: formatSettingValue(item.value),
        iconToken: "ST",
      }));
      const selectedIndex = getSelection(appId, activeTabId, items.length);
      const selectedItem = section?.items?.[selectedIndex];

      return {
        appId,
        title: isConnectionsOnly ? "Connections" : "Control Panel",
        subtitle: section?.title || "Settings",
        tabs,
        activeTabId,
        items,
        selectedIndex,
        detailPanel: {
          title: selectedItem?.label || "No setting",
          subtitle: selectedItem?.type || "",
          rows: [
            { label: "Current", value: formatSettingValue(selectedItem?.value) },
            { label: "Action", value: "Center key cycles values" },
          ],
          actions: [
            { id: "setting-prev", label: "Prev" },
            { id: "setting-next", label: "Next" },
          ],
        },
        softkeys: {
          left: "Prev",
          center: "Change",
          right: "Back",
        },
      };
    }

    if (appId === "profiles") {
      const items = UIQ_PROFILES.map((profile) => ({
        id: profile.id,
        label: profile.label,
        subtitle: `Volume ${profile.ringVolume}/10`,
        trailing: profile.vibrate ? "Vibrate" : "No vibrate",
        iconToken: "PR",
        badge: state.activeProfileId === profile.id ? "Active" : "",
      }));
      const selectedIndex = getSelection(appId, "default", items.length);
      const selected = UIQ_PROFILES[selectedIndex];

      return {
        appId,
        title: "Profiles",
        subtitle: getActiveProfile()?.label || "General",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "No profile",
          subtitle: `Ring ${selected?.ringVolume ?? "--"}/10`,
          rows: [
            { label: "Vibrate", value: selected?.vibrate ? "On" : "Off" },
            { label: "Warnings", value: selected?.warningTones ? "On" : "Off" },
          ],
          actions: [{ id: "activate-profile", label: "Activate" }],
        },
        softkeys: {
          left: "Options",
          center: "Activate",
          right: "Back",
        },
      };
    }

    if (appId === "rss") {
      const items = RSS_ENTRIES;
      const selectedIndex = getSelection(appId, "default", items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: "RSS Reader",
        subtitle: "Subscribed feeds",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "No entry",
          subtitle: selected?.trailing || "",
          description: selected?.subtitle || "",
          actions: [{ id: "open-rss-entry", label: "Read" }],
        },
        softkeys: {
          left: "Update",
          center: "Read",
          right: "Back",
        },
      };
    }

    if (appId === "clock") {
      const items = [
        {
          id: "clock-time",
          label: "Current time",
          subtitle: formatUIQTimeLabel(statusState.now, { hour12: false }),
          trailing: formatUIQDateLabel(statusState.now, { long: false }),
          iconToken: "CK",
        },
        {
          id: "clock-alarm",
          label: "Alarm",
          subtitle: "Weekdays 07:20",
          trailing: "On",
          iconToken: "CK",
        },
        {
          id: "clock-timezone",
          label: "Time zone",
          subtitle: "Europe/Zagreb",
          trailing: "GMT+1",
          iconToken: "CK",
        },
      ];
      const selectedIndex = getSelection(appId, "default", items.length);

      return {
        appId,
        title: "Clock",
        subtitle: "Time settings",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: items[selectedIndex]?.label || "Clock",
          subtitle: items[selectedIndex]?.subtitle || "",
          rows: [
            { label: "Tip", value: "Use Date/Time app on desktop branch for full controls." },
          ],
          actions: [{ id: "clock-open", label: "Open" }],
        },
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
      };
    }

    if (appId === "calculator") {
      const items = [
        {
          id: "calc-expression",
          label: "Expression",
          subtitle: state.calculatorExpression,
          trailing: "Edit",
          iconToken: "CA",
        },
        {
          id: "calc-result",
          label: "Result",
          subtitle: state.calculatorResult,
          trailing: "Ready",
          iconToken: "CA",
        },
        {
          id: "calc-hint",
          label: "Hint",
          subtitle: "Use 0-9 + - * / and Enter",
          trailing: "Input",
          iconToken: "CA",
        },
      ];
      const selectedIndex = getSelection(appId, "default", items.length);

      return {
        appId,
        title: "Calculator",
        subtitle: "Basic mode",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: "Current expression",
          subtitle: state.calculatorExpression,
          rows: [
            { label: "Result", value: state.calculatorResult },
          ],
          actions: [
            { id: "calc-eval", label: "Evaluate" },
            { id: "calc-clear", label: "Clear" },
          ],
        },
        softkeys: {
          left: "Clear",
          center: "Eval",
          right: "Back",
        },
      };
    }

    if (appId === "converter") {
      const items = [
        {
          id: "conv-km-mi",
          label: "Kilometers to Miles",
          subtitle: "1 km = 0.621 mi",
          trailing: "Preset",
          iconToken: "CV",
        },
        {
          id: "conv-c-f",
          label: "Celsius to Fahrenheit",
          subtitle: "25 C = 77 F",
          trailing: "Preset",
          iconToken: "CV",
        },
        {
          id: "conv-eur-hrk",
          label: "Euro to Kuna (legacy)",
          subtitle: "1 EUR = 7.5345 HRK",
          trailing: "Archive",
          iconToken: "CV",
        },
      ];
      const selectedIndex = getSelection(appId, "default", items.length);

      return {
        appId,
        title: "Converter",
        subtitle: "Quick conversions",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: items[selectedIndex]?.label || "Converter",
          subtitle: items[selectedIndex]?.subtitle || "",
          rows: [{ label: "Action", value: "Center key copies conversion" }],
          actions: [{ id: "convert-copy", label: "Copy" }],
        },
        softkeys: {
          left: "Options",
          center: "Copy",
          right: "Back",
        },
      };
    }

    if (appId === "recorder") {
      const items = [
        {
          id: "rec-state",
          label: "Recorder state",
          subtitle: state.recorderActive ? "Recording" : "Idle",
          trailing: state.recorderActive ? "Stop" : "Start",
          iconToken: "VR",
        },
        ...recordings.map((entry) => ({
          id: entry.id,
          label: entry.label,
          subtitle: entry.subtitle,
          trailing: entry.trailing,
          iconToken: "VR",
        })),
      ];
      const selectedIndex = getSelection(appId, "default", items.length);

      return {
        appId,
        title: "Recorder",
        subtitle: `${recordings.length} clip(s)` ,
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: state.recorderActive ? "Recording..." : "Ready",
          subtitle: state.recorderActive ? "Tap center to stop" : "Tap center to record",
          rows: [
            { label: "Clips", value: String(recordings.length) },
          ],
          actions: [{ id: "toggle-recorder", label: state.recorderActive ? "Stop" : "Record" }],
        },
        softkeys: {
          left: "Options",
          center: state.recorderActive ? "Stop" : "Record",
          right: "Back",
        },
      };
    }

    if (appId === "help") {
      const items = HELP_ENTRIES;
      const selectedIndex = getSelection(appId, "default", items.length);
      const selected = items[selectedIndex];

      return {
        appId,
        title: "Help",
        subtitle: "UIQ controls",
        tabs: [],
        activeTabId: "",
        items,
        selectedIndex,
        detailPanel: {
          title: selected?.label || "Help",
          subtitle: selected?.trailing || "",
          description: selected?.subtitle || "",
          actions: [{ id: "help-open", label: "Open" }],
        },
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
      };
    }

    const items = [
      {
        id: `${appId}-placeholder`,
        label: appId,
        subtitle: "UIQ app scaffold",
        trailing: "Ready",
        iconToken: "AP",
      },
    ];

    return {
      appId,
      title: appId,
      subtitle: "Preview module",
      tabs: [],
      activeTabId: "",
      items,
      selectedIndex: 0,
      detailPanel: {
        title: appId,
        description: "This app is scaffolded and can be expanded with richer behavior.",
      },
      softkeys: {
        left: "Options",
        center: "Open",
        right: "Back",
      },
    };
  }

  function renderCurrentScreen(statusSnapshot) {
    const statusBanner = {
      message: state.statusMessage,
      tone: pickToneBySignalBars(Number(statusSnapshot.signal?.bars) || 0),
      iconToken: statusSnapshot.operator?.technology || "UIQ",
    };

    if (state.phase === "booting") {
      const progress = clamp(Math.round((state.bootLineCount / BOOT_SEQUENCE.length) * 100), 0, 100);
      const currentStatus = BOOT_SEQUENCE[Math.max(0, state.bootLineCount - 1)] || "Initializing handset services...";

      return renderBootScreen({
        brand: "Sony Ericsson",
        model: "P1i",
        platform: "UIQ 3.0",
        progress,
        steps: BOOT_SEQUENCE.slice(0, state.bootLineCount),
        statusText: currentStatus,
        softkeys: {
          left: "",
          center: "Skip",
          right: "",
        },
        statusBanner: {
          message: "Symbian OS 9.1 startup",
          tone: "info",
          iconToken: "OS",
        },
      });
    }

    if (state.view === "today") {
      return renderTodayView({
        title: "Today",
        timeLabel: formatUIQTimeLabel(statusState.now, { hour12: false }),
        dateLabel: formatUIQDateLabel(statusState.now, { long: false }),
        operatorLabel: `${statusSnapshot.operator?.label || "T-Mobile HR"} ${statusSnapshot.operator?.technology || "3G"}`,
        profileLabel: getActiveProfile()?.label || "General",
        shortcuts: groupLauncherShortcuts(UIQ_TODAY_CARDS),
        selectedShortcutIndex: state.todayShortcutIndex,
        agendaItems: getTodayAgendaItems(),
        selectedAgendaIndex: state.todayAgendaIndex,
        notifications: getTodayNotifications(),
        softkeys: {
          left: "Menu",
          center: "Open",
          right: "Contacts",
        },
        statusBanner,
        toast: state.toast,
      });
    }

    if (state.view === "launcher") {
      const page = getLauncherPage();
      const selectedIndex = getLauncherSelectedIndex(page.id, page.tiles.length);

      return renderLauncherView({
        title: page.label || "Main menu",
        pageLabel: `${state.launcherPageIndex + 1}/${launcherPages.length}`,
        apps: page.tiles.map((tile) => ({
          id: tile.id,
          label: tile.label,
          iconToken: tile.iconToken,
          badge: tile.shortcut || "",
        })),
        selectedIndex,
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusBanner,
        toast: state.toast,
      });
    }

    const appScreen = getAppScreenConfig();

    return renderListAppScreen({
      appId: appScreen.appId,
      title: appScreen.title,
      subtitle: appScreen.subtitle,
      tabs: appScreen.tabs,
      activeTabId: appScreen.activeTabId,
      items: appScreen.items,
      selectedIndex: appScreen.selectedIndex,
      detailPanel: appScreen.detailPanel,
      softkeys: appScreen.softkeys,
      statusBanner,
      toast: state.toast,
    });
  }

  function render() {
    const statusSnapshot = getUIQStatusSnapshot(statusState.tick, statusState.now, {
      time: { hour12: false },
      date: { long: false },
    });

    const wallpaperClass = state.view === "today" ? " uiq-wallpaper--today" : "";

    root.innerHTML = `
      <main class="uiq-shell" role="application" aria-label="Sony Ericsson P1i UIQ 3.0 simulation">
        <section class="uiq-phone">
          <header class="uiq-phone__top">
            <span class="uiq-phone__speaker"></span>
            <p class="uiq-phone__brand">Sony Ericsson</p>
          </header>
          <section class="uiq-display">
            <div class="uiq-wallpaper${wallpaperClass}"></div>
            ${renderStatusBar(statusSnapshot)}
            <section class="uiq-viewport">
              ${renderCurrentScreen(statusSnapshot)}
              ${
                state.dialog
                  ? renderDialogPanel({
                      open: true,
                      title: state.dialog.title,
                      message: state.dialog.message,
                      lines: state.dialog.lines,
                      tone: state.dialog.tone,
                      confirmLabel: state.dialog.confirmLabel || "OK",
                      cancelLabel: state.dialog.cancelLabel || "",
                    })
                  : ""
              }
            </section>
          </section>
          ${renderHardwareControls()}
        </section>
      </main>
    `;
  }

  function openSelectedFromToday() {
    const shortcuts = groupLauncherShortcuts(UIQ_TODAY_CARDS);
    const shortcut = shortcuts[safeIndex(state.todayShortcutIndex, shortcuts.length)];

    if (!shortcut) {
      return;
    }

    resolveAction(shortcut.id);
  }

  function openSelectedFromLauncher() {
    const page = getLauncherPage();
    const selectedIndex = getLauncherSelectedIndex(page.id, page.tiles.length);
    const selectedTile = page.tiles[selectedIndex];

    if (selectedTile?.id) {
      openApp(selectedTile.id);
    }
  }

  function executeCalculatorExpression() {
    try {
      const sanitized = state.calculatorExpression.replace(/[^0-9+\-*/(). ]/g, "").trim();

      if (!sanitized) {
        state.calculatorResult = "0";
        return;
      }

      const evaluated = Function(`"use strict"; return (${sanitized});`)();

      if (!Number.isFinite(Number(evaluated))) {
        state.calculatorResult = "Error";
      } else {
        state.calculatorResult = String(evaluated);
      }
    } catch {
      state.calculatorResult = "Error";
    }
  }

  function handleAppAction(actionId = "center") {
    const appId = state.appId;
    const appScreen = getAppScreenConfig();
    const selected = appScreen.items[appScreen.selectedIndex];

    if (!appId) {
      return;
    }

    if (appId === "phone" || appId === "calls") {
      if (actionId === "call-back" || actionId === "center") {
        setToast(`Calling ${selected?.label || "contact"}...`, "info");
      } else if (actionId === "message") {
        setToast(`Opening message composer for ${selected?.label || "contact"}.`, "success");
      }
      return;
    }

    if (appId === "messages") {
      const tab = getCurrentTab(appId, "inbox");
      const thread = getUIQThreadsByFolder(tab)[appScreen.selectedIndex];

      if (!thread) {
        return;
      }

      openDialog({
        title: thread.subject,
        message: `${thread.participant} · ${thread.updatedAt}`,
        lines: (thread.messages || []).slice(-4).map((message) => {
          const author = message.direction === "in" ? thread.participant : "You";
          return `${author}: ${message.body}`;
        }),
        confirmLabel: "Close",
      });
      return;
    }

    if (appId === "contacts") {
      const tab = getCurrentTab(appId, "all");
      let pool = UIQ_CONTACTS;
      if (tab === "work") {
        pool = UIQ_CONTACTS.filter((contact) => Boolean(contact.company));
      }
      if (tab === "recent") {
        pool = UIQ_CONTACTS.slice(0, 4);
      }
      const contact = pool[appScreen.selectedIndex];

      if (!contact) {
        return;
      }

      if (actionId === "sms-contact") {
        setToast(`Composing SMS to ${contact.displayName}.`, "success");
        return;
      }

      openDialog({
        title: contact.displayName,
        message: `${contact.company} · ${contact.title}`,
        lines: [
          `Mobile: ${contact.phones?.[0]?.value || "--"}`,
          `Email: ${contact.emails?.[0] || "--"}`,
          contact.notes || "",
        ],
        confirmLabel: "Close",
      });
      return;
    }

    if (appId === "calendar" || appId === "tasks" || appId === "organizer") {
      const tab = getCurrentTab(appId, "agenda");

      if (tab === "tasks") {
        const task = tasks[appScreen.selectedIndex];

        if (!task) {
          return;
        }

        if (actionId === "toggle-task" || actionId === "center") {
          task.status = task.status === "done" ? "todo" : "done";
          task.percentDone = task.status === "done" ? 100 : task.percentDone >= 60 ? 60 : 30;
          setToast(`Task '${task.title}' set to ${task.status}.`, "success");
        } else {
          openDialog({
            title: task.title,
            message: `${task.priority.toUpperCase()} priority`,
            lines: [
              `Status: ${task.status}`,
              `Due: ${formatUIQDateLabel(parseIsoDate(task.dueIso), { long: true })}`,
              `Progress: ${task.percentDone}%`,
            ],
            confirmLabel: "Close",
          });
        }

        return;
      }

      const event = UIQ_CALENDAR_EVENTS[appScreen.selectedIndex];

      if (!event) {
        return;
      }

      openDialog({
        title: event.title,
        message: `${formatUIQDateLabel(parseIsoDate(event.startIso), { long: true })} ${formatEventTimeRange(event)}`,
        lines: [`Location: ${event.location}`, event.notes],
        confirmLabel: "Close",
      });
      return;
    }

    if (appId === "media") {
      const tab = getCurrentTab(appId, "tracks");

      if (tab === "tracks") {
        state.musicTrackIndex = appScreen.selectedIndex;
        state.musicPlaying = !state.musicPlaying;
        state.musicElapsedSec = 0;
        const track = UIQ_MEDIA_TRACKS[state.musicTrackIndex];
        setToast(
          state.musicPlaying
            ? `Playing ${track?.title || "track"}.`
            : `Paused ${track?.title || "track"}.`,
          "info",
        );
      } else {
        const photo = photos[appScreen.selectedIndex];
        if (!photo) {
          return;
        }
        openDialog({
          title: photo.title,
          message: `${photo.resolution} · ${photo.sizeLabel}`,
          lines: [`Taken: ${formatUIQDateLabel(parseIsoDate(photo.takenAt), { long: true })}`],
          confirmLabel: "Close",
        });
      }
      return;
    }

    if (appId === "camera") {
      const capturePhoto = () => {
        const timestamp = new Date();
        photos.unshift({
          id: `photo-capture-${Date.now()}`,
          title: `Capture ${formatUIQTimeLabel(timestamp, { hour12: false })}`,
          takenAt: timestamp.toISOString(),
          resolution: "1600x1200",
          sizeLabel: "395 KB",
          palette: "#5f84a8",
        });
        setToast("Photo captured and saved to Images.", "success");
      };

      if (actionId === "capture-photo" || actionId === "center") {
        capturePhoto();
      } else {
        setToast("Camera options opened.", "info");
      }
      return;
    }

    if (appId === "browser") {
      const tab = getCurrentTab(appId, "bookmarks");
      const pool = tab === "history" ? state.browserHistory : BROWSER_BOOKMARKS;
      const target = pool[appScreen.selectedIndex];

      if (!target) {
        return;
      }

      clearTimer("browserTimeout");
      state.browserLoading = true;
      state.statusMessage = `Loading ${target.label}...`;

      timers.browserTimeout = window.setTimeout(() => {
        state.browserLoading = false;
        state.statusMessage = `Loaded ${target.label}.`;
        state.browserHistory.unshift({
          id: `hist-${Date.now()}`,
          label: target.label,
          subtitle: target.subtitle,
          trailing: formatUIQTimeLabel(statusState.now, { hour12: false }),
          iconToken: "HB",
        });
        setToast("Page loaded.", "success");
        render();
      }, 860);
      return;
    }

    if (appId === "file-manager") {
      if (actionId === "go-up-path") {
        if (state.filesPathIds.length > 1) {
          state.filesPathIds.pop();
          setToast("Moved up one folder.", "info");
        } else {
          setToast("Already at root.", "warning");
        }
        return;
      }

      const currentNode = getCurrentFileNode();
      const children = Array.isArray(currentNode?.children) ? currentNode.children : [];
      const node = children[appScreen.selectedIndex];

      if (!node) {
        return;
      }

      if (node.type === "folder") {
        state.filesPathIds.push(node.id);
        setToast(`Opened ${node.name}.`, "success");
      } else {
        openDialog({
          title: node.name,
          message: `Size ${node.sizeLabel || "unknown"}`,
          lines: [`Path: ${getFilePathLabel()}`],
          confirmLabel: "Close",
        });
      }
      return;
    }

    if (appId === "notes") {
      if (actionId === "new-note") {
        notes.unshift({
          id: `note-${Date.now()}`,
          title: "Quick note",
          body: "Created from UIQ runtime softkey.",
          updatedAt: `${formatUIQDateLabel(statusState.now, { long: false })} ${formatUIQTimeLabel(statusState.now, {
            hour12: false,
          })}`,
        });
        setSelection(appId, "default", 0, notes.length);
        setToast("New note created.", "success");
        return;
      }

      const note = notes[appScreen.selectedIndex];

      if (!note) {
        return;
      }

      openDialog({
        title: note.title,
        message: note.updatedAt,
        lines: [note.body],
        confirmLabel: "Close",
      });
      return;
    }

    if (appId === "control-panel" || appId === "connections") {
      const tab = appId === "connections" ? "connectivity" : getCurrentTab(appId, settingsSections[0]?.id || "connectivity");
      const section = settingsSections.find((entry) => entry.id === tab) || settingsSections[0];
      const item = section?.items?.[appScreen.selectedIndex];

      if (!item) {
        return;
      }

      if (actionId === "setting-prev") {
        cycleSettingValue(item, -1);
      } else {
        cycleSettingValue(item, 1);
      }

      setToast(`${item.label}: ${formatSettingValue(item.value)}.`, "info");
      return;
    }

    if (appId === "profiles") {
      const profile = UIQ_PROFILES[appScreen.selectedIndex];

      if (!profile) {
        return;
      }

      state.activeProfileId = profile.id;
      setToast(`Profile '${profile.label}' activated.`, "success");
      return;
    }

    if (appId === "rss") {
      const entry = RSS_ENTRIES[appScreen.selectedIndex];

      if (!entry) {
        return;
      }

      if (actionId === "update-rss") {
        setToast("Feeds updated. 2 new posts.", "success");
        return;
      }

      openDialog({
        title: entry.label,
        message: entry.trailing,
        lines: [entry.subtitle, "Full article view can be added next."],
        confirmLabel: "Close",
      });
      return;
    }

    if (appId === "clock") {
      setToast("Clock settings opened.", "info");
      return;
    }

    if (appId === "calculator") {
      if (actionId === "calc-clear") {
        state.calculatorExpression = "";
        state.calculatorResult = "0";
        return;
      }

      executeCalculatorExpression();
      setToast(`Result: ${state.calculatorResult}`, "success");
      return;
    }

    if (appId === "converter") {
      const selected = appScreen.items[appScreen.selectedIndex];
      if (selected) {
        setToast(`${selected.subtitle} copied.`, "success");
      }
      return;
    }

    if (appId === "recorder") {
      state.recorderActive = !state.recorderActive;

      if (!state.recorderActive) {
        recordings.unshift({
          id: `rec-${Date.now()}`,
          label: `Voice clip ${recordings.length + 1}`,
          subtitle: formatUIQDateLabel(statusState.now, { long: false }),
          trailing: formatUIQTimeLabel(statusState.now, { hour12: false }),
        });
        setToast("Recording saved.", "success");
      } else {
        setToast("Recording started.", "warning");
      }
      return;
    }

    if (appId === "help") {
      const help = HELP_ENTRIES[appScreen.selectedIndex];

      if (!help) {
        return;
      }

      openDialog({
        title: help.label,
        message: help.trailing,
        lines: [help.subtitle],
        confirmLabel: "Close",
      });
      return;
    }

    setToast("Action executed.", "info");
  }

  function triggerLeftSoftkey() {
    if (state.phase === "booting") {
      return;
    }

    if (state.view === "today") {
      openLauncher();
      return;
    }

    if (state.view === "launcher") {
      setToast("Options: move, sort, create folder.", "info");
      return;
    }

    if (state.view === "app") {
      if (state.appId === "file-manager") {
        handleAppAction("go-up-path");
      } else if (state.appId === "control-panel" || state.appId === "connections") {
        handleAppAction("setting-prev");
      } else if (state.appId === "rss") {
        handleAppAction("update-rss");
      } else if (state.appId === "calculator") {
        handleAppAction("calc-clear");
      } else if (state.appId === "notes") {
        handleAppAction("new-note");
      } else {
        setToast("Options opened.", "info");
      }
    }
  }

  function triggerCenterSoftkey() {
    if (state.phase === "booting") {
      state.bootLineCount = BOOT_SEQUENCE.length;
      clearTimer("bootInterval");
      clearTimer("bootReadyTimeout");
      timers.bootReadyTimeout = window.setTimeout(() => {
        state.phase = "ready";
        openToday({ clearHistory: true });
        state.statusMessage = "System ready.";
        render();
      }, 120);
      return;
    }

    if (state.dialog) {
      if (typeof state.dialog.onConfirm === "function") {
        state.dialog.onConfirm();
      }
      closeDialog();
      return;
    }

    if (state.view === "today") {
      openSelectedFromToday();
      return;
    }

    if (state.view === "launcher") {
      openSelectedFromLauncher();
      return;
    }

    if (state.view === "app") {
      handleAppAction("center");
    }
  }

  function triggerRightSoftkey() {
    if (state.phase === "booting") {
      return;
    }

    if (state.view === "today") {
      openApp("contacts");
      return;
    }

    goBack();
  }

  function applySoftkey(action) {
    if (action === "left") {
      triggerLeftSoftkey();
    } else if (action === "center") {
      triggerCenterSoftkey();
    } else if (action === "right") {
      triggerRightSoftkey();
    }
  }

  function moveSelectionInApp(key) {
    const appScreen = getAppScreenConfig();

    if (!appScreen) {
      return;
    }

    if (appScreen.tabs.length > 0 && (key === "ArrowLeft" || key === "ArrowRight")) {
      const direction = key === "ArrowLeft" ? -1 : 1;
      const currentIndex = appScreen.tabs.findIndex((tab) => tab.id === appScreen.activeTabId);
      const safeCurrent = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeCurrent + direction + appScreen.tabs.length) % appScreen.tabs.length;
      setCurrentTab(state.appId, appScreen.tabs[nextIndex].id);
      return;
    }

    if (key === "ArrowUp" || key === "ArrowDown") {
      const direction = key === "ArrowUp" ? -1 : 1;
      const next = safeIndex(appScreen.selectedIndex + direction, appScreen.items.length);
      setSelection(state.appId, appScreen.activeTabId || "default", next, appScreen.items.length);
    }
  }

  function moveSelectionInToday(key) {
    const shortcutCount = groupLauncherShortcuts(UIQ_TODAY_CARDS).length;
    const agendaCount = getTodayAgendaItems().length;

    if (key === "ArrowLeft") {
      state.todayShortcutIndex = safeIndex(state.todayShortcutIndex - 1, shortcutCount);
      return;
    }

    if (key === "ArrowRight") {
      state.todayShortcutIndex = safeIndex(state.todayShortcutIndex + 1, shortcutCount);
      return;
    }

    if (key === "ArrowUp") {
      state.todayAgendaIndex = safeIndex(state.todayAgendaIndex - 1, agendaCount);
      return;
    }

    if (key === "ArrowDown") {
      state.todayAgendaIndex = safeIndex(state.todayAgendaIndex + 1, agendaCount);
    }
  }

  function moveSelectionInLauncher(key) {
    const page = getLauncherPage();
    const selectedIndex = getLauncherSelectedIndex(page.id, page.tiles.length);
    const nextIndex = moveGridSelection(selectedIndex, key, page.tiles.length, LAUNCHER_COLUMNS);
    setLauncherSelectedIndex(page.id, nextIndex, page.tiles.length);
  }

  function moveLauncherPage(direction) {
    if (launcherPages.length <= 1) {
      return;
    }

    const next = (state.launcherPageIndex + direction + launcherPages.length) % launcherPages.length;
    state.launcherPageIndex = next;
  }

  function handleKeydown(event) {
    const { key } = event;

    if (key === "F1" || key === "q" || key === "Q") {
      event.preventDefault();
      applySoftkey("left");
      render();
      return;
    }

    if (key === "F2" || key === "w" || key === "W" || key === "Enter" || key === " ") {
      event.preventDefault();
      applySoftkey("center");
      render();
      return;
    }

    if (key === "F3" || key === "e" || key === "E" || key === "Escape" || key === "Backspace") {
      event.preventDefault();
      applySoftkey("right");
      render();
      return;
    }

    if (key === "m" || key === "M") {
      event.preventDefault();
      openLauncher();
      render();
      return;
    }

    if (key === "h" || key === "H" || key === "Home") {
      event.preventDefault();
      openToday({ clearHistory: true });
      render();
      return;
    }

    if (key === "#" || key === "PageDown") {
      if (state.view === "launcher") {
        event.preventDefault();
        moveLauncherPage(1);
        render();
      }
      return;
    }

    if (key === "*" || key === "PageUp") {
      if (state.view === "launcher") {
        event.preventDefault();
        moveLauncherPage(-1);
        render();
      }
      return;
    }

    if (state.view === "app" && state.appId === "calculator") {
      if (/^[0-9]$/.test(key) || ["+", "-", "*", "/", ".", "(", ")"].includes(key)) {
        event.preventDefault();
        state.calculatorExpression += key;
        render();
        return;
      }

      if (key === "Delete") {
        event.preventDefault();
        state.calculatorExpression = state.calculatorExpression.slice(0, -1);
        render();
        return;
      }
    }

    if (state.view === "launcher" && /^\d$/.test(key)) {
      event.preventDefault();
      const page = getLauncherPage();
      const found = page.tiles.find((tile) => tile.shortcut === key);

      if (found) {
        openApp(found.id);
      }

      render();
      return;
    }

    if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();

      if (state.view === "today") {
        moveSelectionInToday(key);
      } else if (state.view === "launcher") {
        moveSelectionInLauncher(key);
      } else if (state.view === "app") {
        moveSelectionInApp(key);
      }

      render();
    }
  }

  function handleClick(event) {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const navKey = target.closest("[data-nav-key]")?.getAttribute("data-nav-key");
    if (navKey) {
      if (state.view === "today") {
        moveSelectionInToday(navKey);
      } else if (state.view === "launcher") {
        moveSelectionInLauncher(navKey);
      } else if (state.view === "app") {
        moveSelectionInApp(navKey);
      }
      render();
      return;
    }

    const explicitSoftkey = target.closest("[data-softkey]")?.getAttribute("data-softkey");
    if (explicitSoftkey) {
      applySoftkey(explicitSoftkey);
      render();
      return;
    }

    const commandKey = target.closest(".uiq-commandbar__key");
    if (commandKey) {
      if (commandKey.classList.contains("uiq-commandbar__key--left")) {
        applySoftkey("left");
      } else if (commandKey.classList.contains("uiq-commandbar__key--center")) {
        applySoftkey("center");
      } else if (commandKey.classList.contains("uiq-commandbar__key--right")) {
        applySoftkey("right");
      }
      render();
      return;
    }

    const dialogAction = target.closest("[data-dialog-action]")?.getAttribute("data-dialog-action");
    if (dialogAction && state.dialog) {
      if (dialogAction === "confirm" && typeof state.dialog.onConfirm === "function") {
        state.dialog.onConfirm();
      }
      if (dialogAction === "cancel" && typeof state.dialog.onCancel === "function") {
        state.dialog.onCancel();
      }
      closeDialog();
      render();
      return;
    }

    const actionButton = target.closest("[data-action-id]")?.getAttribute("data-action-id");
    if (actionButton) {
      handleAppAction(actionButton);
      render();
      return;
    }

    const tabId = target.closest("[data-tab-id]")?.getAttribute("data-tab-id");
    if (tabId && state.view === "app" && state.appId) {
      setCurrentTab(state.appId, tabId);
      render();
      return;
    }

    const shortcutId = target.closest("[data-shortcut-id]")?.getAttribute("data-shortcut-id");
    if (shortcutId && state.view === "today") {
      resolveAction(shortcutId);
      render();
      return;
    }

    const appId = target.closest("[data-app-id]")?.getAttribute("data-app-id");
    if (appId && state.view === "launcher") {
      const tileElement = target.closest("[data-app-id]");
      const page = getLauncherPage();
      const index = Array.from(tileElement?.parentElement?.children || []).indexOf(tileElement);
      setLauncherSelectedIndex(page.id, index, page.tiles.length);
      openApp(appId);
      render();
      return;
    }

    const itemElement = target.closest("[data-item-id]");
    if (itemElement) {
      const itemId = itemElement.getAttribute("data-item-id");

      if (state.view === "today") {
        const agendaItems = getTodayAgendaItems();
        const notificationItems = getTodayNotifications();
        const agendaIndex = agendaItems.findIndex((item) => item.id === itemId);
        const notificationIndex = notificationItems.findIndex((item) => item.id === itemId);

        if (agendaIndex >= 0) {
          state.todayAgendaIndex = agendaIndex;
          const event = UIQ_CALENDAR_EVENTS[agendaIndex];
          if (event) {
            openDialog({
              title: event.title,
              message: `${formatUIQDateLabel(parseIsoDate(event.startIso), { long: true })} ${formatEventTimeRange(
                event,
              )}`,
              lines: [`Location: ${event.location}`, event.notes],
              confirmLabel: "Close",
            });
          }
        } else if (notificationIndex >= 0) {
          state.todayNotificationIndex = notificationIndex;
          resolveAction(notificationItems[notificationIndex].id);
        }

        render();
        return;
      }

      if (state.view === "app" && state.appId) {
        const appScreen = getAppScreenConfig();
        const index = appScreen.items.findIndex((item) => item.id === itemId);
        setSelection(state.appId, appScreen.activeTabId || "default", index, appScreen.items.length);
        handleAppAction("center");
        render();
      }
    }
  }

  function startBootSequence() {
    state.phase = "booting";
    state.view = "boot";
    state.appId = null;
    state.bootLineCount = 0;

    clearTimer("bootInterval");
    clearTimer("bootReadyTimeout");

    timers.bootInterval = window.setInterval(() => {
      if (state.bootLineCount < BOOT_SEQUENCE.length) {
        state.bootLineCount += 1;
        render();
        return;
      }

      clearTimer("bootInterval");
      timers.bootReadyTimeout = window.setTimeout(() => {
        state.phase = "ready";
        openToday({ clearHistory: true });
        state.statusMessage = "UIQ 3.0 ready.";
        render();
      }, BOOT_READY_DELAY_MS);
    }, BOOT_STEP_INTERVAL_MS);
  }

  function startClock() {
    clearTimer("clockInterval");

    timers.clockInterval = window.setInterval(() => {
      statusState.now = new Date();
      statusState.tick += 1;

      if (state.phase === "ready" && state.musicPlaying) {
        const currentTrack = UIQ_MEDIA_TRACKS[safeIndex(state.musicTrackIndex, UIQ_MEDIA_TRACKS.length)];
        if (currentTrack) {
          state.musicElapsedSec += 1;
          if (state.musicElapsedSec > currentTrack.durationSec) {
            state.musicElapsedSec = 0;
            state.musicTrackIndex = (state.musicTrackIndex + 1) % UIQ_MEDIA_TRACKS.length;
          }
        }
      }

      render();
    }, CLOCK_TICK_MS);
  }

  function mount() {
    window.addEventListener("keydown", handleKeydown);
    root.addEventListener("click", handleClick);
    startClock();
    startBootSequence();
    render();
  }

  function unmount() {
    window.removeEventListener("keydown", handleKeydown);
    root.removeEventListener("click", handleClick);
    clearAllTimers();
    root.innerHTML = "";
  }

  return {
    mount,
    unmount,
  };
}
