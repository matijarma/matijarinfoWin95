import {
  APP_MENU_ITEMS,
  BATTERY_LEVEL_SEQUENCE,
  BOOT_LINES,
  BROWSER_BOOKMARKS,
  CALENDAR_EVENTS,
  CALL_LOG,
  CONTACTS,
  FILE_MANAGER_TREE,
  GALLERY_ITEMS,
  MESSAGE_THREADS,
  MUSIC_LIBRARY,
  NOTES,
  OPERATOR_SEQUENCE,
  PROFILE_PRESETS,
  SETTINGS_CATEGORIES,
  SIGNAL_LEVEL_SEQUENCE,
  STANDBY_SHORTCUTS,
  cloneFileTree,
  cloneSettingsCategories,
  formatClockDate,
  formatClockTime,
  formatLongDate,
  formatTrackLength,
} from "./data.js";
import {
  renderBrowserApp,
  renderCalendarApp,
  renderContactsApp,
  renderExtrasApp,
  renderFileManagerApp,
  renderGalleryApp,
  renderHomeScreen,
  renderMenuGridScreen,
  renderMessagesApp,
  renderMusicApp,
  renderNotesApp,
  renderSettingsApp,
  renderStandbyScreen,
} from "./apps.js";

const BOOT_LINE_STEP_MS = 360;
const BOOT_FINISH_DELAY_MS = 520;
const CLOCK_TICK_MS = 1000;
const SOFTKEY_FALLBACK_TIMEOUT_MS = 2400;
const MENU_GRID_COLUMNS = 3;
const HOME_GRID_COLUMNS = 2;

const CONTACT_TABS = Object.freeze([
  { id: "all", label: "All" },
  { id: "favorites", label: "Fav" },
  { id: "sim", label: "SIM" },
]);

const MESSAGE_FOLDERS = Object.freeze([
  { id: "inbox", label: "Inbox" },
  { id: "sent", label: "Sent" },
  { id: "drafts", label: "Drafts" },
]);

const CALENDAR_TABS = Object.freeze([
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "agenda", label: "Agenda" },
]);

const GALLERY_ALBUMS = Object.freeze([
  { id: "camera", label: "Camera" },
  { id: "saved", label: "Saved" },
  { id: "received", label: "Received" },
]);

const BROWSER_TABS = Object.freeze([
  { id: "bookmarks", label: "Bookmarks" },
  { id: "history", label: "History" },
]);

const EXTRAS_TOOLS = Object.freeze([
  {
    id: "converter",
    label: "Unit converter",
    subtitle: "Metric and imperial quick conversion",
    trailing: "Ready",
    tip: "Use arrows to switch category, then center key to convert presets.",
  },
  {
    id: "voice-recorder",
    label: "Voice recorder",
    subtitle: "Retro voice memo capture",
    trailing: "00:00",
    tip: "Center key starts a short recording simulation and saves to C:/Notes.",
  },
  {
    id: "calculator",
    label: "Calculator",
    subtitle: "Four function calculator",
    trailing: "Std",
    tip: "Soft left opens scientific mode in full Symbian builds.",
  },
  {
    id: "flashlight",
    label: "Flashlight",
    subtitle: "Display backlight utility",
    trailing: "Off",
    tip: "Center key toggles full white backlight mode.",
  },
]);

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildSortedEvents() {
  return [...CALENDAR_EVENTS].sort((left, right) => {
    const leftStamp = `${left.date || ""} ${left.time || ""}`;
    const rightStamp = `${right.date || ""} ${right.time || ""}`;
    return leftStamp.localeCompare(rightStamp);
  });
}

function buildMessagesByFolder() {
  const inbox = MESSAGE_THREADS.map((thread) => ({
    id: thread.id,
    label: thread.from,
    subtitle: thread.preview,
    trailing: thread.updatedAt,
    iconToken: "SMS",
    badge: thread.unreadCount > 0 ? String(thread.unreadCount) : "",
    isUnread: thread.unreadCount > 0,
  }));

  const sent = MESSAGE_THREADS.flatMap((thread) =>
    (thread.messages || [])
      .filter((message) => message.direction === "out")
      .map((message) => ({
        id: `${thread.id}-${message.id}`,
        label: `To ${thread.from}`,
        subtitle: message.text,
        trailing: message.sentAt,
        iconToken: "OUT",
      })),
  );

  const drafts = [
    {
      id: "draft-portfolio",
      label: "Portfolio launch follow-up",
      subtitle: "Need final icon pass and browser fallback screenshots.",
      trailing: "Today",
      iconToken: "DR",
    },
    {
      id: "draft-reminder",
      label: "Reminder to self",
      subtitle: "Pack charger and memory card before travel.",
      trailing: "Yesterday",
      iconToken: "DR",
    },
  ];

  return {
    inbox,
    sent,
    drafts,
  };
}

function buildGalleryByAlbum() {
  const camera = GALLERY_ITEMS.slice(0, 3).map((item) => ({
    id: item.id,
    label: item.title,
    subtitle: item.resolution,
    trailing: item.size,
    iconToken: "PH",
  }));

  const saved = GALLERY_ITEMS.slice(3).map((item) => ({
    id: item.id,
    label: item.title,
    subtitle: item.capturedAt,
    trailing: item.size,
    iconToken: "IM",
  }));

  const received = [
    {
      id: "recv-storyboard",
      label: "Storyboard",
      subtitle: "MMS attachment from Lana",
      trailing: "212 KB",
      iconToken: "RX",
    },
    {
      id: "recv-logo",
      label: "Logo draft",
      subtitle: "Bluetooth transfer",
      trailing: "84 KB",
      iconToken: "RX",
    },
  ];

  return {
    camera,
    saved,
    received,
  };
}

function buildBrowserHistoryRows() {
  return [
    {
      id: "hist-matijar",
      label: "matijar.info",
      subtitle: "https://matijar.info",
      trailing: "13:02",
      iconToken: "WEB",
    },
    {
      id: "hist-s60",
      label: "S60 API archive",
      subtitle: "https://forum.s60.dev",
      trailing: "12:48",
      iconToken: "WEB",
    },
    {
      id: "hist-docs",
      label: "Deployment docs",
      subtitle: "https://matijar.info/docs",
      trailing: "11:33",
      iconToken: "WEB",
    },
  ];
}

function buildMonthGridCells(isoDate, events) {
  const current = new Date(`${isoDate}T12:00:00`);
  const year = current.getFullYear();
  const month = current.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const eventDateSet = new Set((events || []).map((entry) => entry.date));
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, day);
    const iso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(
      prevDate.getDate(),
    ).padStart(2, "0")}`;
    cells.push({
      day,
      isoDate: iso,
      isOutsideMonth: true,
      isToday: iso === today,
      hasEvent: eventDateSet.has(iso),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      day,
      isoDate: iso,
      isOutsideMonth: false,
      isToday: iso === today,
      hasEvent: eventDateSet.has(iso),
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const nextDate = new Date(year, month + 1, nextDay);
    const iso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(
      nextDate.getDate(),
    ).padStart(2, "0")}`;
    cells.push({
      day: nextDay,
      isoDate: iso,
      isOutsideMonth: true,
      isToday: iso === today,
      hasEvent: eventDateSet.has(iso),
    });
    nextDay += 1;
  }

  const rows = [];
  for (let row = 0; row < 6; row += 1) {
    rows.push(cells.slice(row * 7, row * 7 + 7));
  }

  return rows;
}

function moveGridIndex(index, key, count, columns) {
  if (count <= 0) {
    return 0;
  }

  const safe = safeIndex(index, count);
  const col = safe % columns;

  if (key === "ArrowLeft" && col > 0) {
    return safe - 1;
  }

  if (key === "ArrowRight" && safe + 1 < count && col < columns - 1) {
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

function findNodeById(node, targetId) {
  if (!node || typeof node !== "object") {
    return null;
  }

  if (node.id === targetId) {
    return node;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    const found = findNodeById(child, targetId);
    if (found) {
      return found;
    }
  }

  return null;
}

function findNodeByPath(rootNode, pathIds) {
  if (!rootNode) {
    return null;
  }

  let current = rootNode;
  for (let i = 1; i < pathIds.length; i += 1) {
    const pathId = pathIds[i];
    const children = Array.isArray(current.children) ? current.children : [];
    const next = children.find((entry) => entry.id === pathId);
    if (!next) {
      return current;
    }
    current = next;
  }

  return current;
}

function countFilesRecursive(node) {
  if (!node || typeof node !== "object") {
    return 0;
  }

  if (node.type === "file") {
    return 1;
  }

  return (node.children || []).reduce((total, child) => total + countFilesRecursive(child), 0);
}

function createMessagesRows(thread) {
  return (thread.messages || []).map((message, index) => ({
    id: `${thread.id}-line-${index + 1}`,
    label: message.direction === "in" ? thread.from : "You",
    subtitle: message.text,
    trailing: message.sentAt,
  }));
}

export function createSymbianShell({ root }) {
  const settingsCategories = cloneSettingsCategories(SETTINGS_CATEGORIES);
  const fileTree = cloneFileTree(FILE_MANAGER_TREE);
  const sortedEvents = buildSortedEvents();
  const messageFolders = buildMessagesByFolder();
  const galleryByAlbum = buildGalleryByAlbum();
  const browserHistoryRows = buildBrowserHistoryRows();
  const notesEntries = NOTES.map((note) => ({ ...note }));

  const state = {
    phase: "booting",
    bootLineCount: 0,
    statusTick: 0,
    now: new Date(),
    view: "standby",
    currentApp: null,
    viewStack: [],
    menuIndex: 0,
    homeShortcutIndex: 0,
    contactsTab: "all",
    contactsSelectedByTab: {
      all: 0,
      favorites: 0,
      sim: 0,
    },
    messagesFolder: "inbox",
    messagesSelectedByFolder: {
      inbox: 0,
      sent: 0,
      drafts: 0,
    },
    calendarTab: "agenda",
    calendarAgendaIndex: 0,
    calendarSelectedIsoDate: todayIsoDate(),
    galleryAlbum: "camera",
    gallerySelectedByAlbum: {
      camera: 0,
      saved: 0,
      received: 0,
    },
    musicSelectedIndex: 0,
    musicIsPlaying: false,
    musicElapsedSec: 0,
    browserTab: "bookmarks",
    browserSelectedByTab: {
      bookmarks: 0,
      history: 0,
    },
    browserLoading: false,
    filesPathIds: [fileTree?.id || "root"],
    filesSelectedIndex: 0,
    notesSelectedIndex: 0,
    settingsCategoryIndex: 0,
    settingsDetailIndex: 0,
    settingsFocus: "details",
    extrasIndex: 0,
    profilesIndex: 0,
    activeProfileId: PROFILE_PRESETS[0]?.id || "general",
    callLogIndex: 0,
    toast: null,
    dialog: null,
    statusMessage: "Use Menu or center key to open applications.",
  };

  const timers = {
    bootIntervalId: null,
    bootDoneTimeoutId: null,
    clockIntervalId: null,
    toastTimeoutId: null,
    browserLoadingTimeoutId: null,
  };

  function getSignalLevel() {
    return SIGNAL_LEVEL_SEQUENCE[state.statusTick % SIGNAL_LEVEL_SEQUENCE.length] || 0;
  }

  function getBatteryLevel() {
    return BATTERY_LEVEL_SEQUENCE[state.statusTick % BATTERY_LEVEL_SEQUENCE.length] || 0;
  }

  function getOperatorLabel() {
    return OPERATOR_SEQUENCE[state.statusTick % OPERATOR_SEQUENCE.length] || "SYMBIAN GSM";
  }

  function getActiveProfile() {
    return (
      PROFILE_PRESETS.find((profile) => profile.id === state.activeProfileId) ||
      PROFILE_PRESETS[0] || {
        id: "general",
        label: "General",
        ringVolume: 6,
        vibra: true,
      }
    );
  }

  function clearTimer(timerKey) {
    const timerId = timers[timerKey];
    if (!timerId) {
      return;
    }

    if (timerKey === "bootDoneTimeoutId" || timerKey === "toastTimeoutId" || timerKey === "browserLoadingTimeoutId") {
      window.clearTimeout(timerId);
    } else {
      window.clearInterval(timerId);
    }

    timers[timerKey] = null;
  }

  function clearAllTimers() {
    clearTimer("bootIntervalId");
    clearTimer("bootDoneTimeoutId");
    clearTimer("clockIntervalId");
    clearTimer("toastTimeoutId");
    clearTimer("browserLoadingTimeoutId");
  }

  function setToast(message, tone = "info", durationMs = SOFTKEY_FALLBACK_TIMEOUT_MS) {
    state.toast = {
      message,
      tone,
    };
    clearTimer("toastTimeoutId");

    if (durationMs > 0) {
      timers.toastTimeoutId = window.setTimeout(() => {
        state.toast = null;
        timers.toastTimeoutId = null;
        render();
      }, durationMs);
    }
  }

  function setDialog({ title, lines }) {
    state.dialog = {
      title,
      lines: Array.isArray(lines) ? [...lines] : [],
    };
  }

  function clearDialog() {
    state.dialog = null;
  }

  function pushCurrentViewToStack() {
    state.viewStack.push({
      view: state.view,
      currentApp: state.currentApp,
    });
  }

  function restorePreviousView() {
    const previous = state.viewStack.pop();

    if (!previous) {
      state.view = "standby";
      state.currentApp = null;
      return;
    }

    state.view = previous.view;
    state.currentApp = previous.currentApp || null;
  }

  function openMenu({ pushHistory = true } = {}) {
    if (state.phase !== "ready") {
      return;
    }

    if (pushHistory && (state.view !== "menu" || state.currentApp)) {
      pushCurrentViewToStack();
    }

    state.view = "menu";
    state.currentApp = null;
    state.statusMessage = "Menu ready. Use arrows or keypad numbers.";
  }

  function openApp(appId, { pushHistory = true } = {}) {
    const appExists = APP_MENU_ITEMS.some((entry) => entry.id === appId);

    if (!appExists) {
      setToast(`Application '${appId}' is not installed.`, "warning");
      return;
    }

    if (pushHistory && (state.view !== "app" || state.currentApp !== appId)) {
      pushCurrentViewToStack();
    }

    state.view = "app";
    state.currentApp = appId;
    state.statusMessage = `${appId} opened.`;

    if (appId === "browser") {
      state.browserLoading = false;
      clearTimer("browserLoadingTimeoutId");
    }
  }

  function goToStandby({ clearHistory = false } = {}) {
    state.view = "standby";
    state.currentApp = null;
    state.statusMessage = "Standby active.";

    if (clearHistory) {
      state.viewStack = [];
    }
  }

  function goBack() {
    if (state.dialog) {
      clearDialog();
      return;
    }

    if (state.viewStack.length > 0) {
      restorePreviousView();
      state.statusMessage = "Returned to previous screen.";
      return;
    }

    if (state.view === "standby") {
      setToast("Standby screen. Hold power key on original devices to switch off.", "info");
      return;
    }

    goToStandby({ clearHistory: true });
  }

  function getSelectedContactList() {
    if (state.contactsTab === "favorites") {
      return CONTACTS.slice(0, 3);
    }

    if (state.contactsTab === "sim") {
      return CONTACTS.slice(-3);
    }

    return CONTACTS;
  }

  function getCurrentFileNode() {
    const fallbackId = fileTree?.id || "root";

    if (!Array.isArray(state.filesPathIds) || state.filesPathIds.length === 0) {
      state.filesPathIds = [fallbackId];
    }

    if (state.filesPathIds[0] !== fallbackId) {
      state.filesPathIds[0] = fallbackId;
    }

    const node = findNodeByPath(fileTree, state.filesPathIds);

    if (!node) {
      state.filesPathIds = [fallbackId];
      return fileTree;
    }

    return node;
  }

  function getCurrentFileEntries() {
    const node = getCurrentFileNode();
    const children = Array.isArray(node?.children) ? node.children : [];

    return children.map((entry) => ({
      id: entry.id,
      label: entry.name,
      subtitle:
        entry.type === "folder"
          ? `${(entry.children || []).length} item(s)`
          : `File size ${entry.size || "unknown"}`,
      trailing: entry.type === "folder" ? "Folder" : entry.size || "--",
      iconToken: entry.type === "folder" ? "DIR" : "FIL",
    }));
  }

  function getCurrentFilePathLabel() {
    const names = state.filesPathIds
      .map((pathId) => findNodeById(fileTree, pathId))
      .filter(Boolean)
      .map((node) => node.name);

    if (!names.length) {
      return "Device";
    }

    return names.join(" / ");
  }

  function clampSelections() {
    state.menuIndex = safeIndex(state.menuIndex, APP_MENU_ITEMS.length);
    state.homeShortcutIndex = safeIndex(state.homeShortcutIndex, STANDBY_SHORTCUTS.length);

    const contactsLength = getSelectedContactList().length;
    state.contactsSelectedByTab[state.contactsTab] = safeIndex(
      state.contactsSelectedByTab[state.contactsTab],
      contactsLength,
    );

    const folderRows = messageFolders[state.messagesFolder] || [];
    state.messagesSelectedByFolder[state.messagesFolder] = safeIndex(
      state.messagesSelectedByFolder[state.messagesFolder],
      folderRows.length,
    );

    const galleryRows = galleryByAlbum[state.galleryAlbum] || [];
    state.gallerySelectedByAlbum[state.galleryAlbum] = safeIndex(
      state.gallerySelectedByAlbum[state.galleryAlbum],
      galleryRows.length,
    );

    state.musicSelectedIndex = safeIndex(state.musicSelectedIndex, MUSIC_LIBRARY.length);

    const browserRows = state.browserTab === "history" ? browserHistoryRows : BROWSER_BOOKMARKS;
    state.browserSelectedByTab[state.browserTab] = safeIndex(
      state.browserSelectedByTab[state.browserTab],
      browserRows.length,
    );

    const fileRows = getCurrentFileEntries();
    state.filesSelectedIndex = safeIndex(state.filesSelectedIndex, fileRows.length);

    state.notesSelectedIndex = safeIndex(state.notesSelectedIndex, notesEntries.length);

    state.settingsCategoryIndex = safeIndex(state.settingsCategoryIndex, settingsCategories.length);
    const activeCategory = settingsCategories[state.settingsCategoryIndex];
    const activeItems = Array.isArray(activeCategory?.items) ? activeCategory.items : [];
    state.settingsDetailIndex = safeIndex(state.settingsDetailIndex, activeItems.length);

    state.extrasIndex = safeIndex(state.extrasIndex, EXTRAS_TOOLS.length);
    state.profilesIndex = safeIndex(state.profilesIndex, PROFILE_PRESETS.length);
    state.callLogIndex = safeIndex(state.callLogIndex, CALL_LOG.length);

    if (!MESSAGE_FOLDERS.some((folder) => folder.id === state.messagesFolder)) {
      state.messagesFolder = MESSAGE_FOLDERS[0].id;
    }

    if (!GALLERY_ALBUMS.some((album) => album.id === state.galleryAlbum)) {
      state.galleryAlbum = GALLERY_ALBUMS[0].id;
    }

    if (!BROWSER_TABS.some((tab) => tab.id === state.browserTab)) {
      state.browserTab = BROWSER_TABS[0].id;
    }

    if (!CONTACT_TABS.some((tab) => tab.id === state.contactsTab)) {
      state.contactsTab = CONTACT_TABS[0].id;
    }

    if (!CALENDAR_TABS.some((tab) => tab.id === state.calendarTab)) {
      state.calendarTab = CALENDAR_TABS[0].id;
    }
  }

  function cycleTab(tabList, currentId, direction) {
    const currentIndex = tabList.findIndex((entry) => entry.id === currentId);
    const safeCurrent = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeCurrent + direction + tabList.length) % tabList.length;
    return tabList[nextIndex].id;
  }

  function moveCalendarDate(stepDays) {
    const selectedDate = new Date(`${state.calendarSelectedIsoDate}T12:00:00`);
    selectedDate.setDate(selectedDate.getDate() + stepDays);
    state.calendarSelectedIsoDate = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  }

  function moveSelectionForCurrentContext(key) {
    if (state.phase !== "ready") {
      return;
    }

    if (state.view === "standby") {
      if (key === "ArrowUp" || key === "ArrowDown") {
        state.view = "home";
        state.statusMessage = "Active standby opened.";
      } else if (key === "ArrowLeft") {
        openMenu();
      } else if (key === "ArrowRight") {
        openApp("contacts");
      }
      return;
    }

    if (state.view === "home") {
      state.homeShortcutIndex = moveGridIndex(
        state.homeShortcutIndex,
        key,
        STANDBY_SHORTCUTS.length,
        HOME_GRID_COLUMNS,
      );

      if (key === "ArrowDown") {
        state.statusMessage = "Use center key to launch highlighted shortcut.";
      }
      return;
    }

    if (state.view === "menu") {
      state.menuIndex = moveGridIndex(state.menuIndex, key, APP_MENU_ITEMS.length, MENU_GRID_COLUMNS);
      return;
    }

    if (state.view !== "app") {
      return;
    }

    if (state.currentApp === "contacts") {
      if (key === "ArrowLeft") {
        state.contactsTab = cycleTab(CONTACT_TABS, state.contactsTab, -1);
      } else if (key === "ArrowRight") {
        state.contactsTab = cycleTab(CONTACT_TABS, state.contactsTab, 1);
      } else if (key === "ArrowUp") {
        state.contactsSelectedByTab[state.contactsTab] -= 1;
      } else if (key === "ArrowDown") {
        state.contactsSelectedByTab[state.contactsTab] += 1;
      }
      return;
    }

    if (state.currentApp === "messages") {
      if (key === "ArrowLeft") {
        state.messagesFolder = cycleTab(MESSAGE_FOLDERS, state.messagesFolder, -1);
      } else if (key === "ArrowRight") {
        state.messagesFolder = cycleTab(MESSAGE_FOLDERS, state.messagesFolder, 1);
      } else if (key === "ArrowUp") {
        state.messagesSelectedByFolder[state.messagesFolder] -= 1;
      } else if (key === "ArrowDown") {
        state.messagesSelectedByFolder[state.messagesFolder] += 1;
      }
      return;
    }

    if (state.currentApp === "calendar") {
      if (state.calendarTab === "month") {
        if (key === "ArrowLeft") {
          moveCalendarDate(-1);
        } else if (key === "ArrowRight") {
          moveCalendarDate(1);
        } else if (key === "ArrowUp") {
          moveCalendarDate(-7);
        } else if (key === "ArrowDown") {
          moveCalendarDate(7);
        }
      } else {
        if (key === "ArrowLeft") {
          state.calendarTab = cycleTab(CALENDAR_TABS, state.calendarTab, -1);
        } else if (key === "ArrowRight") {
          state.calendarTab = cycleTab(CALENDAR_TABS, state.calendarTab, 1);
        } else if (key === "ArrowUp") {
          state.calendarAgendaIndex -= 1;
        } else if (key === "ArrowDown") {
          state.calendarAgendaIndex += 1;
        }
      }
      return;
    }

    if (state.currentApp === "gallery") {
      const currentItems = galleryByAlbum[state.galleryAlbum] || [];

      if (key === "ArrowLeft" || key === "ArrowRight") {
        const direction = key === "ArrowLeft" ? -1 : 1;
        state.galleryAlbum = cycleTab(GALLERY_ALBUMS, state.galleryAlbum, direction);
      } else {
        state.gallerySelectedByAlbum[state.galleryAlbum] = moveGridIndex(
          state.gallerySelectedByAlbum[state.galleryAlbum],
          key,
          currentItems.length,
          MENU_GRID_COLUMNS,
        );
      }
      return;
    }

    if (state.currentApp === "music") {
      if (key === "ArrowUp") {
        state.musicSelectedIndex -= 1;
      } else if (key === "ArrowDown") {
        state.musicSelectedIndex += 1;
      }
      return;
    }

    if (state.currentApp === "browser") {
      if (key === "ArrowLeft") {
        state.browserTab = cycleTab(BROWSER_TABS, state.browserTab, -1);
      } else if (key === "ArrowRight") {
        state.browserTab = cycleTab(BROWSER_TABS, state.browserTab, 1);
      } else if (key === "ArrowUp") {
        state.browserSelectedByTab[state.browserTab] -= 1;
      } else if (key === "ArrowDown") {
        state.browserSelectedByTab[state.browserTab] += 1;
      }
      return;
    }

    if (state.currentApp === "files") {
      if (key === "ArrowUp") {
        state.filesSelectedIndex -= 1;
      } else if (key === "ArrowDown") {
        state.filesSelectedIndex += 1;
      } else if (key === "ArrowLeft" && state.filesPathIds.length > 1) {
        state.filesPathIds.pop();
        state.filesSelectedIndex = 0;
      }
      return;
    }

    if (state.currentApp === "notes") {
      if (key === "ArrowUp") {
        state.notesSelectedIndex -= 1;
      } else if (key === "ArrowDown") {
        state.notesSelectedIndex += 1;
      }
      return;
    }

    if (state.currentApp === "settings") {
      if (key === "ArrowLeft") {
        state.settingsFocus = "categories";
      } else if (key === "ArrowRight") {
        state.settingsFocus = "details";
      } else if (key === "ArrowUp") {
        if (state.settingsFocus === "categories") {
          state.settingsCategoryIndex -= 1;
          state.settingsDetailIndex = 0;
        } else {
          state.settingsDetailIndex -= 1;
        }
      } else if (key === "ArrowDown") {
        if (state.settingsFocus === "categories") {
          state.settingsCategoryIndex += 1;
          state.settingsDetailIndex = 0;
        } else {
          state.settingsDetailIndex += 1;
        }
      }
      return;
    }

    if (state.currentApp === "extras") {
      if (key === "ArrowUp") {
        state.extrasIndex -= 1;
      } else if (key === "ArrowDown") {
        state.extrasIndex += 1;
      }
      return;
    }

    if (state.currentApp === "profiles") {
      if (key === "ArrowUp") {
        state.profilesIndex -= 1;
      } else if (key === "ArrowDown") {
        state.profilesIndex += 1;
      }
      return;
    }

    if (state.currentApp === "log") {
      if (key === "ArrowUp") {
        state.callLogIndex -= 1;
      } else if (key === "ArrowDown") {
        state.callLogIndex += 1;
      }
    }
  }

  function activateProfileByIndex(index) {
    const safe = safeIndex(index, PROFILE_PRESETS.length);
    const profile = PROFILE_PRESETS[safe];

    if (!profile) {
      return;
    }

    state.profilesIndex = safe;
    state.activeProfileId = profile.id;
    state.statusMessage = `Profile '${profile.label}' activated.`;
    setToast(`${profile.label} profile active`, "success");
  }

  function changeSelectedSettingValue(direction = 1) {
    const category = settingsCategories[state.settingsCategoryIndex];
    const item = category?.items?.[state.settingsDetailIndex];

    if (!item) {
      return;
    }

    if (item.type === "toggle") {
      item.value = !item.value;
    } else if (Array.isArray(item.options) && item.options.length > 0) {
      const currentIndex = item.options.findIndex((option) => option === item.value);
      const safeCurrent = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeCurrent + direction + item.options.length) % item.options.length;
      item.value = item.options[nextIndex];
    }

    setToast(`${item.label}: ${item.value === true ? "On" : item.value === false ? "Off" : item.value}`, "info");
  }

  function openSelectedEntry() {
    if (state.phase !== "ready") {
      return;
    }

    if (state.dialog) {
      clearDialog();
      return;
    }

    if (state.view === "standby") {
      openMenu();
      return;
    }

    if (state.view === "home") {
      const shortcut = STANDBY_SHORTCUTS[safeIndex(state.homeShortcutIndex, STANDBY_SHORTCUTS.length)];
      if (shortcut?.id) {
        openApp(shortcut.id);
      }
      return;
    }

    if (state.view === "menu") {
      const app = APP_MENU_ITEMS[safeIndex(state.menuIndex, APP_MENU_ITEMS.length)];
      if (app?.id) {
        openApp(app.id);
      }
      return;
    }

    if (state.currentApp === "contacts") {
      const contacts = getSelectedContactList();
      const selected = contacts[safeIndex(state.contactsSelectedByTab[state.contactsTab], contacts.length)];

      if (!selected) {
        return;
      }

      setDialog({
        title: selected.name,
        lines: [
          selected.number,
          selected.company,
          selected.email,
          `${selected.location} • ${selected.lastCall}`,
          selected.note,
        ],
      });
      return;
    }

    if (state.currentApp === "messages") {
      const rows = messageFolders[state.messagesFolder] || [];
      const selectedRow = rows[safeIndex(state.messagesSelectedByFolder[state.messagesFolder], rows.length)];

      if (!selectedRow) {
        return;
      }

      if (state.messagesFolder === "inbox") {
        const thread = MESSAGE_THREADS.find((entry) => entry.id === selectedRow.id);
        const previewRows = thread ? createMessagesRows(thread).slice(-4) : [];

        setDialog({
          title: thread?.from || selectedRow.label,
          lines: previewRows.map((line) => `${line.label}: ${line.subtitle}`),
        });
      } else {
        setDialog({
          title: selectedRow.label,
          lines: [selectedRow.subtitle, `Saved ${selectedRow.trailing}`],
        });
      }
      return;
    }

    if (state.currentApp === "calendar") {
      if (state.calendarTab === "month") {
        state.calendarTab = "agenda";
        state.statusMessage = `Agenda for ${formatLongDate(state.calendarSelectedIsoDate)}.`;
        return;
      }

      const selected = sortedEvents[safeIndex(state.calendarAgendaIndex, sortedEvents.length)];
      if (!selected) {
        return;
      }

      setDialog({
        title: selected.title,
        lines: [
          `${formatLongDate(selected.date)} at ${selected.time}`,
          `Location: ${selected.location}`,
          "Reminder: 15 minutes before",
        ],
      });
      return;
    }

    if (state.currentApp === "gallery") {
      const rows = galleryByAlbum[state.galleryAlbum] || [];
      const selected = rows[safeIndex(state.gallerySelectedByAlbum[state.galleryAlbum], rows.length)];
      if (!selected) {
        return;
      }

      setDialog({
        title: selected.label,
        lines: [selected.subtitle, selected.trailing, `Album: ${state.galleryAlbum}`],
      });
      return;
    }

    if (state.currentApp === "music") {
      const track = MUSIC_LIBRARY[safeIndex(state.musicSelectedIndex, MUSIC_LIBRARY.length)];
      if (!track) {
        return;
      }

      state.musicIsPlaying = true;
      state.musicElapsedSec = Math.min(state.musicElapsedSec, track.lengthSec);
      state.statusMessage = `Now playing: ${track.title}`;
      setToast(`Playing ${track.title}`, "success");
      return;
    }

    if (state.currentApp === "browser") {
      const rows = state.browserTab === "history" ? browserHistoryRows : BROWSER_BOOKMARKS;
      const selected = rows[safeIndex(state.browserSelectedByTab[state.browserTab], rows.length)];
      if (!selected) {
        return;
      }

      state.browserLoading = true;
      clearTimer("browserLoadingTimeoutId");
      timers.browserLoadingTimeoutId = window.setTimeout(() => {
        state.browserLoading = false;
        state.statusMessage = `Loaded ${selected.title || selected.label}.`;
        setToast("Page loaded", "success");
        render();
      }, 900);
      return;
    }

    if (state.currentApp === "files") {
      const entries = getCurrentFileEntries();
      const selected = entries[safeIndex(state.filesSelectedIndex, entries.length)];
      if (!selected) {
        return;
      }

      const node = findNodeById(fileTree, selected.id);
      if (!node) {
        return;
      }

      if (node.type === "folder") {
        state.filesPathIds.push(node.id);
        state.filesSelectedIndex = 0;
        state.statusMessage = `Opened ${node.name}`;
      } else {
        setDialog({
          title: node.name,
          lines: [
            `Type: File`,
            `Size: ${node.size || "Unknown"}`,
            `Path: ${getCurrentFilePathLabel()}`,
          ],
        });
      }
      return;
    }

    if (state.currentApp === "notes") {
      const selected = notesEntries[safeIndex(state.notesSelectedIndex, notesEntries.length)];
      if (!selected) {
        return;
      }

      setDialog({
        title: selected.title,
        lines: [selected.body, `Updated ${selected.updatedAt}`],
      });
      return;
    }

    if (state.currentApp === "settings") {
      changeSelectedSettingValue(1);
      return;
    }

    if (state.currentApp === "extras") {
      const selected = EXTRAS_TOOLS[safeIndex(state.extrasIndex, EXTRAS_TOOLS.length)];
      if (!selected) {
        return;
      }

      if (selected.id === "flashlight") {
        setToast("Backlight mode toggled.", "warning");
      } else if (selected.id === "voice-recorder") {
        setToast("Voice memo saved to C:/Notes.", "success");
      } else {
        setToast(`${selected.label} launched.`, "info");
      }
      return;
    }

    if (state.currentApp === "profiles") {
      activateProfileByIndex(state.profilesIndex);
      return;
    }

    if (state.currentApp === "log") {
      const selected = CALL_LOG[safeIndex(state.callLogIndex, CALL_LOG.length)];
      if (!selected) {
        return;
      }

      setToast(`Calling ${selected.who}...`, "info");
    }
  }

  function triggerLeftSoftkey() {
    if (state.phase !== "ready") {
      return;
    }

    if (state.view === "standby" || state.view === "home") {
      openMenu();
      return;
    }

    if (state.view === "menu") {
      setToast("Options: Move, Folder view, Mark/Unmark.", "info");
      return;
    }

    if (state.currentApp === "contacts") {
      setToast("Options: New contact, Send business card.", "info");
      return;
    }

    if (state.currentApp === "messages") {
      setToast("Options: Write message, Inbox settings.", "info");
      return;
    }

    if (state.currentApp === "calendar") {
      setToast("Options: New meeting, New reminder.", "info");
      return;
    }

    if (state.currentApp === "gallery") {
      setToast("Options: Send, Rename, Organize.", "info");
      return;
    }

    if (state.currentApp === "music") {
      state.musicIsPlaying = !state.musicIsPlaying;
      setToast(state.musicIsPlaying ? "Playback resumed." : "Playback paused.", "info");
      return;
    }

    if (state.currentApp === "browser") {
      state.browserTab = cycleTab(BROWSER_TABS, state.browserTab, 1);
      state.statusMessage = `Browser tab: ${state.browserTab}`;
      return;
    }

    if (state.currentApp === "files") {
      if (state.filesPathIds.length > 1) {
        state.filesPathIds.pop();
        state.filesSelectedIndex = 0;
      } else {
        setToast("Root drive overview.", "info");
      }
      return;
    }

    if (state.currentApp === "notes") {
      const timestamp = formatClockTime(new Date());
      notesEntries.unshift({
        id: `note-auto-${Date.now()}`,
        title: "Quick note",
        body: "Softkey-created note. Edit flow can be extended next.",
        updatedAt: `Today, ${timestamp}`,
      });
      state.notesSelectedIndex = 0;
      setToast("New note created.", "success");
      return;
    }

    if (state.currentApp === "settings") {
      changeSelectedSettingValue(-1);
      return;
    }

    if (state.currentApp === "extras") {
      setToast("Options: Organize, About, Memory details.", "info");
      return;
    }

    if (state.currentApp === "profiles") {
      const selected = PROFILE_PRESETS[safeIndex(state.profilesIndex, PROFILE_PRESETS.length)];
      if (selected) {
        setToast(`Previewing '${selected.label}' profile.`, "info");
      }
      return;
    }

    if (state.currentApp === "log") {
      setToast("Options: Clear list, Filter, Save number.", "info");
    }
  }

  function triggerRightSoftkey() {
    if (state.phase !== "ready") {
      return;
    }

    if (state.view === "standby") {
      openApp("contacts");
      return;
    }

    goBack();
  }

  function triggerCenterSoftkey() {
    if (state.phase === "booting") {
      state.bootLineCount = BOOT_LINES.length;
      clearTimer("bootIntervalId");
      clearTimer("bootDoneTimeoutId");
      timers.bootDoneTimeoutId = window.setTimeout(() => {
        state.phase = "ready";
        goToStandby({ clearHistory: true });
        render();
      }, 150);
      return;
    }

    openSelectedEntry();
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

  function renderBootScreen() {
    const displayedLines = BOOT_LINES.slice(0, state.bootLineCount);
    const progress = clamp(Math.round((displayedLines.length / BOOT_LINES.length) * 100), 0, 100);

    return `
      <section class="symbian-screen symbian-screen--boot" data-view-id="boot">
        <header class="symbian-header">
          <h2 class="symbian-header__title">Symbian OS</h2>
          <span class="symbian-header__meta">S60 3rd Edition</span>
        </header>
        <section class="symbian-pane symbian-boot">
          <p class="symbian-boot__logo">NOKIA</p>
          <p class="symbian-boot__subtitle">Starting services...</p>
          <pre class="symbian-boot__log">${safeText(displayedLines.join("\n"))}</pre>
          <div class="symbian-meter" style="--symbian-meter-value: ${progress}%">
            <span class="symbian-meter__fill"></span>
          </div>
          <p class="symbian-boot__hint">Center key speeds up boot.</p>
        </section>
      </section>
    `;
  }

  function renderProfilesApp() {
    const rows = PROFILE_PRESETS.map((profile, index) => ({
      id: profile.id,
      label: profile.label,
      subtitle: `Ring volume ${profile.ringVolume}/10`,
      trailing: profile.vibra ? "Vibra on" : "Vibra off",
      iconToken: "PR",
      badge: profile.id === state.activeProfileId ? "Active" : "",
      isUnread: profile.id === state.activeProfileId,
      disabled: false,
    }));

    const selected = PROFILE_PRESETS[safeIndex(state.profilesIndex, PROFILE_PRESETS.length)];

    return renderExtrasApp({
      tools: rows,
      selectedIndex: state.profilesIndex,
      tip: selected
        ? `Selected profile '${selected.label}'. Press center to activate and apply sound/vibration behavior.`
        : "No profile selected.",
      softkeys: {
        left: "Options",
        center: "Activate",
        right: "Back",
      },
      statusMessage: "Profiles manager.",
    });
  }

  function renderCallLogApp() {
    const rows = CALL_LOG.map((entry) => ({
      id: entry.id,
      label: entry.who,
      subtitle: `${entry.type.toUpperCase()} • ${entry.at}`,
      trailing: entry.duration,
      iconToken: "CL",
    }));

    const selected = CALL_LOG[safeIndex(state.callLogIndex, CALL_LOG.length)];

    return renderExtrasApp({
      tools: rows,
      selectedIndex: state.callLogIndex,
      tip: selected
        ? `Last ${selected.type} call with ${selected.who}. Center key starts callback.`
        : "Call log is empty.",
      softkeys: {
        left: "Options",
        center: "Call",
        right: "Back",
      },
      statusMessage: "Call log.",
    });
  }

  function renderCurrentView() {
    if (state.phase === "booting") {
      return renderBootScreen();
    }

    const activeProfile = getActiveProfile();
    const batteryLevel = getBatteryLevel();
    const signalLevel = getSignalLevel();

    if (state.view === "standby") {
      return renderStandbyScreen({
        timeLabel: formatClockTime(state.now),
        dateLabel: formatClockDate(state.now),
        profileLabel: `Profile: ${activeProfile.label}`,
        operatorLabel: getOperatorLabel(),
        signalLabel: `Signal ${signalLevel}/5`,
        batteryLabel: `Battery ${batteryLevel}%`,
        notifications: STANDBY_SHORTCUTS.map((entry) => ({
          id: entry.id,
          label: entry.label,
          subtitle: entry.detail,
          trailing: "Open",
          iconToken: "*",
        })),
        softkeys: {
          left: "Menu",
          center: "Select",
          right: "Names",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.view === "home") {
      return renderHomeScreen({
        title: "Active Standby",
        profileLabel: activeProfile.label,
        shortcuts: STANDBY_SHORTCUTS.map((entry) => ({
          id: entry.id,
          label: entry.label,
          iconToken: entry.label.slice(0, 2).toUpperCase(),
        })),
        selectedShortcutIndex: state.homeShortcutIndex,
        agendaItems: sortedEvents.slice(0, 5).map((event) => ({
          id: event.id,
          label: `${event.time} ${event.title}`,
          subtitle: `${formatLongDate(event.date)} • ${event.location}`,
          trailing: event.time,
          iconToken: "AG",
        })),
        selectedAgendaIndex: state.calendarAgendaIndex,
        softkeys: {
          left: "Menu",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.view === "menu") {
      return renderMenuGridScreen({
        title: "Menu",
        apps: APP_MENU_ITEMS.map((app) => ({
          id: app.id,
          label: app.label,
          iconToken: (app.icon || "AP").slice(0, 3).toUpperCase(),
        })),
        selectedIndex: state.menuIndex,
        page: 1,
        pageSize: 12,
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Exit",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "contacts") {
      const contacts = getSelectedContactList();
      const selectedIndex = state.contactsSelectedByTab[state.contactsTab];

      return renderContactsApp({
        contacts: contacts.map((contact) => ({
          id: contact.id,
          label: contact.name,
          subtitle: contact.number,
          trailing: contact.lastCall,
          iconToken: "CT",
        })),
        selectedIndex,
        filterQuery: state.contactsTab === "all" ? "" : state.contactsTab,
        tabs: CONTACT_TABS,
        activeTabId: state.contactsTab,
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "messages") {
      return renderMessagesApp({
        folders: MESSAGE_FOLDERS,
        activeFolderId: state.messagesFolder,
        messagesByFolder: messageFolders,
        selectedIndex: state.messagesSelectedByFolder[state.messagesFolder],
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "calendar") {
      const agendaRows = sortedEvents.map((event) => ({
        id: event.id,
        label: `${event.time} ${event.title}`,
        subtitle: `${formatLongDate(event.date)} • ${event.location}`,
        trailing: event.time,
        iconToken: "EV",
      }));

      return renderCalendarApp({
        dateLabel: formatLongDate(state.calendarSelectedIsoDate),
        tabs: CALENDAR_TABS,
        activeTabId: state.calendarTab,
        agendaItems: agendaRows,
        selectedAgendaIndex: state.calendarAgendaIndex,
        monthGrid: buildMonthGridCells(state.calendarSelectedIsoDate, sortedEvents),
        selectedDate: state.calendarSelectedIsoDate,
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "gallery") {
      return renderGalleryApp({
        albums: GALLERY_ALBUMS,
        activeAlbumId: state.galleryAlbum,
        itemsByAlbum: galleryByAlbum,
        selectedIndex: state.gallerySelectedByAlbum[state.galleryAlbum],
        softkeys: {
          left: "Options",
          center: "View",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "music") {
      const selectedTrack = MUSIC_LIBRARY[safeIndex(state.musicSelectedIndex, MUSIC_LIBRARY.length)];
      const elapsed = clamp(state.musicElapsedSec, 0, selectedTrack?.lengthSec || 0);
      const progressLabel = `${formatTrackLength(elapsed)} / ${formatTrackLength(selectedTrack?.lengthSec || 0)}`;

      return renderMusicApp({
        tracks: MUSIC_LIBRARY.map((track) => ({
          id: track.id,
          label: track.title,
          subtitle: track.artist,
          trailing: formatTrackLength(track.lengthSec),
          iconToken: "MU",
        })),
        selectedTrackIndex: state.musicSelectedIndex,
        nowPlaying: selectedTrack
          ? {
              id: selectedTrack.id,
              label: selectedTrack.title,
              subtitle: selectedTrack.artist,
            }
          : null,
        isPlaying: state.musicIsPlaying,
        progressLabel,
        softkeys: {
          left: "Options",
          center: state.musicIsPlaying ? "Pause" : "Play",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "browser") {
      const itemsByTab = {
        bookmarks: BROWSER_BOOKMARKS.map((bookmark) => ({
          id: bookmark.id,
          label: bookmark.title,
          subtitle: bookmark.url,
          trailing: bookmark.lastVisited,
          iconToken: "WB",
        })),
        history: browserHistoryRows,
      };
      const activeRows = itemsByTab[state.browserTab] || [];
      const selectedIndex = state.browserSelectedByTab[state.browserTab];
      const selectedRow = activeRows[safeIndex(selectedIndex, activeRows.length)] || null;

      return renderBrowserApp({
        pageTitle: selectedRow?.label || "Start page",
        address: selectedRow?.subtitle || "https://",
        tabs: BROWSER_TABS,
        activeTabId: state.browserTab,
        itemsByTab,
        selectedIndex,
        loading: state.browserLoading,
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "files") {
      const currentNode = getCurrentFileNode();
      const entries = getCurrentFileEntries();

      const storageSummary = (fileTree?.children || []).map((drive) => ({
        id: drive.id,
        label: drive.name,
        subtitle: `${countFilesRecursive(drive)} file(s)`,
        trailing: drive.id === currentNode.id ? "Open" : "Drive",
      }));

      return renderFileManagerApp({
        currentPath: getCurrentFilePathLabel(),
        entries,
        selectedIndex: state.filesSelectedIndex,
        storageSummary,
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "notes") {
      return renderNotesApp({
        notes: notesEntries.map((note) => ({
          id: note.id,
          label: note.title,
          subtitle: note.body,
          trailing: note.updatedAt,
          iconToken: "NT",
        })),
        selectedIndex: state.notesSelectedIndex,
        softkeys: {
          left: "New",
          center: "View",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "settings") {
      const categories = settingsCategories.map((category) => ({
        id: category.id,
        label: category.title,
        subtitle: `${(category.items || []).length} entries`,
        iconToken: "SC",
      }));

      const selectedCategory = settingsCategories[state.settingsCategoryIndex];
      const detailItems = (selectedCategory?.items || []).map((item) => ({
        id: item.id,
        label: item.label,
        subtitle: item.type,
        trailing: item.value === true ? "On" : item.value === false ? "Off" : String(item.value),
        iconToken: "ST",
      }));

      return renderSettingsApp({
        categories,
        selectedCategoryIndex: state.settingsCategoryIndex,
        detailItems,
        selectedDetailIndex: state.settingsDetailIndex,
        softkeys: {
          left: "Change",
          center: "Toggle",
          right: "Back",
        },
        statusMessage: `${selectedCategory?.title || "Settings"} (${state.settingsFocus})`,
      });
    }

    if (state.currentApp === "extras") {
      return renderExtrasApp({
        tools: EXTRAS_TOOLS.map((tool) => ({
          id: tool.id,
          label: tool.label,
          subtitle: tool.subtitle,
          trailing: tool.trailing,
          iconToken: "EX",
        })),
        selectedIndex: state.extrasIndex,
        tip: EXTRAS_TOOLS[safeIndex(state.extrasIndex, EXTRAS_TOOLS.length)]?.tip || "",
        softkeys: {
          left: "Options",
          center: "Open",
          right: "Back",
        },
        statusMessage: state.statusMessage,
      });
    }

    if (state.currentApp === "profiles") {
      return renderProfilesApp();
    }

    if (state.currentApp === "log") {
      return renderCallLogApp();
    }

    return renderStandbyScreen({
      timeLabel: formatClockTime(state.now),
      dateLabel: formatClockDate(state.now),
      profileLabel: `Profile: ${activeProfile.label}`,
      operatorLabel: getOperatorLabel(),
      signalLabel: `Signal ${signalLevel}/5`,
      batteryLabel: `Battery ${batteryLevel}%`,
      notifications: [],
      softkeys: {
        left: "Menu",
        center: "Select",
        right: "Names",
      },
      statusMessage: "Unknown view; returning to standby.",
    });
  }

  function renderDialogOverlay() {
    if (!state.dialog) {
      return "";
    }

    const lines = Array.isArray(state.dialog.lines) ? state.dialog.lines : [];

    return `
      <div class="symbian-dialog-layer" data-dialog-layer="true">
        <article class="symbian-dialog" role="dialog" aria-modal="true" aria-label="${safeText(
          state.dialog.title || "Details",
        )}">
          <h3 class="symbian-dialog__title">${safeText(state.dialog.title || "Details")}</h3>
          <div class="symbian-dialog__content">
            ${lines.map((line) => `<p>${safeText(line)}</p>`).join("")}
          </div>
          <div class="symbian-dialog__actions">
            <button type="button" class="symbian-button" data-dialog-action="close">Close</button>
          </div>
        </article>
      </div>
    `;
  }

  function renderStatusBar() {
    const signalLevel = getSignalLevel();
    const batteryLevel = getBatteryLevel();
    const activeSignalBars = clamp(Math.round((signalLevel / 5) * 4), 0, 4);

    return `
      <header class="symbian-statusbar" aria-label="Status bar">
        <div class="symbian-statusbar__left">
          <span class="symbian-statusbar__date">${safeText(formatClockDate(state.now))}</span>
        </div>
        <div class="symbian-statusbar__center">${safeText(getOperatorLabel())}</div>
        <div class="symbian-statusbar__right">
          <span class="symbian-signal" aria-label="Signal ${signalLevel} of 5">
            ${[0, 1, 2, 3]
              .map(
                (index) =>
                  `<span class="symbian-signal__bar ${index < activeSignalBars ? "is-active" : ""}"></span>`,
              )
              .join("")}
          </span>
          <span class="symbian-battery" aria-label="Battery ${batteryLevel}%">
            <span class="symbian-battery__cell" style="--symbian-battery-level: ${batteryLevel}%">
              <span class="symbian-battery__fill"></span>
            </span>
            <span class="symbian-battery__cap"></span>
            <span class="symbian-battery__text">${safeText(String(batteryLevel))}%</span>
          </span>
          <span class="symbian-statusbar__divider"></span>
          <span class="symbian-statusbar__clock">${safeText(formatClockTime(state.now))}</span>
        </div>
      </header>
    `;
  }

  function renderBottomHardware() {
    return `
      <footer class="symbian-phone__bottom" aria-hidden="true">
        <div class="symbian-navpad">
          <button type="button" class="symbian-navpad__hint symbian-navpad__hint--up" data-nav-key="ArrowUp">Up</button>
          <button type="button" class="symbian-navpad__hint symbian-navpad__hint--down" data-nav-key="ArrowDown">Down</button>
          <button type="button" class="symbian-navpad__hint symbian-navpad__hint--left" data-nav-key="ArrowLeft">Left</button>
          <button type="button" class="symbian-navpad__hint symbian-navpad__hint--right" data-nav-key="ArrowRight">Right</button>
          <button type="button" class="symbian-navpad__ok" data-softkey="center">OK</button>
        </div>
        <div class="symbian-utility-row">
          <button type="button" class="symbian-utility-key" data-softkey="left">Left key</button>
          <button type="button" class="symbian-utility-key is-end" data-softkey="right">Right key</button>
        </div>
      </footer>
    `;
  }

  function render() {
    clampSelections();

    const idleWallpaperClass = state.view === "standby" || state.view === "home" ? " symbian-wallpaper--idle" : "";

    root.innerHTML = `
      <main class="symbian-shell" role="application" aria-label="Symbian OS simulation">
        <section class="symbian-phone">
          <header class="symbian-phone__top">
            <span class="symbian-phone__earpiece"></span>
            <span class="symbian-phone__brand">Nokia</span>
          </header>
          <section class="symbian-display">
            <div class="symbian-wallpaper${idleWallpaperClass}"></div>
            ${renderStatusBar()}
            <section class="symbian-workspace">
              <div class="symbian-workspace__viewport">
                ${renderCurrentView()}
              </div>
              ${
                state.toast
                  ? `<p class="symbian-toast is-${safeText(state.toast.tone || "info")}">${safeText(
                      state.toast.message,
                    )}</p>`
                  : ""
              }
              ${renderDialogOverlay()}
            </section>
          </section>
          ${renderBottomHardware()}
        </section>
      </main>
    `;
  }

  function handleItemSelectionClick(itemElement) {
    if (!itemElement) {
      return;
    }

    const list = itemElement.parentElement;
    const index = Array.from(list?.children || []).indexOf(itemElement);

    if (index < 0) {
      return;
    }

    if (state.view === "app") {
      if (state.currentApp === "contacts") {
        state.contactsSelectedByTab[state.contactsTab] = index;
      } else if (state.currentApp === "messages") {
        state.messagesSelectedByFolder[state.messagesFolder] = index;
      } else if (state.currentApp === "calendar") {
        state.calendarAgendaIndex = index;
      } else if (state.currentApp === "music") {
        state.musicSelectedIndex = index;
      } else if (state.currentApp === "browser") {
        state.browserSelectedByTab[state.browserTab] = index;
      } else if (state.currentApp === "files") {
        state.filesSelectedIndex = index;
      } else if (state.currentApp === "notes") {
        state.notesSelectedIndex = index;
      } else if (state.currentApp === "settings") {
        if (itemElement.closest(".symbian-settings__categories")) {
          state.settingsCategoryIndex = index;
          state.settingsDetailIndex = 0;
        } else {
          state.settingsDetailIndex = index;
        }
      } else if (state.currentApp === "extras") {
        state.extrasIndex = index;
      } else if (state.currentApp === "profiles") {
        state.profilesIndex = index;
      } else if (state.currentApp === "log") {
        state.callLogIndex = index;
      }
    }

    openSelectedEntry();
  }

  function handleClick(event) {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const dialogAction = target.closest("[data-dialog-action]");
    if (dialogAction) {
      clearDialog();
      render();
      return;
    }

    const navKey = target.closest("[data-nav-key]")?.getAttribute("data-nav-key");
    if (navKey) {
      moveSelectionForCurrentContext(navKey);
      render();
      return;
    }

    const explicitSoftkey = target.closest("[data-softkey]")?.getAttribute("data-softkey");
    if (explicitSoftkey) {
      applySoftkey(explicitSoftkey);
      render();
      return;
    }

    const softkeyElement = target.closest(".symbian-softkeys__key");
    if (softkeyElement) {
      if (softkeyElement.classList.contains("symbian-softkeys__key--left")) {
        applySoftkey("left");
      } else if (softkeyElement.classList.contains("symbian-softkeys__key--center")) {
        applySoftkey("center");
      } else if (softkeyElement.classList.contains("symbian-softkeys__key--right")) {
        applySoftkey("right");
      }
      render();
      return;
    }

    const tabElement = target.closest("[data-tab-id]");
    if (tabElement && state.view === "app") {
      const tabId = tabElement.getAttribute("data-tab-id");
      if (!tabId) {
        return;
      }

      if (state.currentApp === "contacts") {
        state.contactsTab = tabId;
      } else if (state.currentApp === "messages") {
        state.messagesFolder = tabId;
      } else if (state.currentApp === "calendar") {
        state.calendarTab = tabId;
      } else if (state.currentApp === "gallery") {
        state.galleryAlbum = tabId;
      } else if (state.currentApp === "browser") {
        state.browserTab = tabId;
      }

      render();
      return;
    }

    const menuItem = target.closest("[data-app-id]");
    if (menuItem && state.view === "menu") {
      const appId = menuItem.getAttribute("data-app-id");
      const index = Array.from(menuItem.parentElement?.children || []).indexOf(menuItem);
      state.menuIndex = safeIndex(index, APP_MENU_ITEMS.length);

      if (appId) {
        openApp(appId);
      }

      render();
      return;
    }

    const shortcutItem = target.closest("[data-shortcut-id]");
    if (shortcutItem && state.view === "home") {
      const shortcutId = shortcutItem.getAttribute("data-shortcut-id");
      const index = Array.from(shortcutItem.parentElement?.children || []).indexOf(shortcutItem);
      state.homeShortcutIndex = safeIndex(index, STANDBY_SHORTCUTS.length);

      if (shortcutId) {
        openApp(shortcutId);
      }

      render();
      return;
    }

    const notificationItem = target.closest("[data-notification-id]");
    if (notificationItem && state.view === "standby") {
      const notificationId = notificationItem.getAttribute("data-notification-id");
      if (notificationId) {
        openApp(notificationId);
      }
      render();
      return;
    }

    const listItem = target.closest("[data-item-id]");
    if (listItem) {
      handleItemSelectionClick(listItem);
      render();
    }
  }

  function handleKeydown(event) {
    const { key } = event;

    const softkeyMap = {
      F1: "left",
      F2: "center",
      F3: "right",
      q: "left",
      w: "center",
      e: "right",
    };

    if (key in softkeyMap) {
      event.preventDefault();
      applySoftkey(softkeyMap[key]);
      render();
      return;
    }

    if (key === "Escape" || key === "Backspace") {
      event.preventDefault();
      if (state.view === "standby" && state.phase === "ready") {
        setToast("Standby active. Press Menu or center key to continue.", "info");
      } else {
        applySoftkey("right");
      }
      render();
      return;
    }

    if (key === "Enter" || key === " ") {
      event.preventDefault();
      applySoftkey("center");
      render();
      return;
    }

    if (key === "m" || key === "M") {
      event.preventDefault();
      openMenu();
      render();
      return;
    }

    if (key === "h" || key === "H" || key === "Home") {
      event.preventDefault();
      goToStandby({ clearHistory: true });
      render();
      return;
    }

    if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();
      moveSelectionForCurrentContext(key);
      render();
      return;
    }

    if (state.view === "menu" && /^\d$/.test(key)) {
      const index = Number(key) - 1;
      if (index >= 0 && index < APP_MENU_ITEMS.length) {
        event.preventDefault();
        state.menuIndex = index;
        openSelectedEntry();
        render();
      }
    }
  }

  function startBootSequence() {
    state.phase = "booting";
    state.bootLineCount = 0;

    clearTimer("bootIntervalId");
    clearTimer("bootDoneTimeoutId");

    timers.bootIntervalId = window.setInterval(() => {
      if (state.bootLineCount < BOOT_LINES.length) {
        state.bootLineCount += 1;
        render();
        return;
      }

      clearTimer("bootIntervalId");
      timers.bootDoneTimeoutId = window.setTimeout(() => {
        state.phase = "ready";
        goToStandby({ clearHistory: true });
        state.statusMessage = "System ready.";
        render();
      }, BOOT_FINISH_DELAY_MS);
    }, BOOT_LINE_STEP_MS);
  }

  function startClockTick() {
    clearTimer("clockIntervalId");

    timers.clockIntervalId = window.setInterval(() => {
      state.now = new Date();

      if (state.phase === "ready") {
        state.statusTick += 1;

        if (state.musicIsPlaying) {
          const track = MUSIC_LIBRARY[safeIndex(state.musicSelectedIndex, MUSIC_LIBRARY.length)];
          if (track) {
            state.musicElapsedSec += 1;
            if (state.musicElapsedSec > track.lengthSec) {
              state.musicElapsedSec = 0;
              state.musicSelectedIndex = safeIndex(state.musicSelectedIndex + 1, MUSIC_LIBRARY.length);
            }
          }
        }
      }

      render();
    }, CLOCK_TICK_MS);
  }

  function mount() {
    window.addEventListener("keydown", handleKeydown);
    root.addEventListener("click", handleClick);

    startClockTick();
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
