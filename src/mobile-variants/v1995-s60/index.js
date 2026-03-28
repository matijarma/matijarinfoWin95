const BOOT_LINES = Object.freeze([
  "Nokia RM-133 / Symbian OS 9.1",
  "Kernel image loaded.",
  "Applying platform security policy...",
  "Mounting C:, E:, Z: volumes...",
  "Starting telephony server...",
  "Initializing messaging services...",
  "Starting Avkon environment...",
  "Loading active standby plugins...",
  "Ready.",
]);

const MENU_APPS = Object.freeze([
  Object.freeze({ id: "contacts", label: "Contacts", subtitle: "Phonebook", token: "CT" }),
  Object.freeze({ id: "messaging", label: "Messaging", subtitle: "SMS / Email", token: "MS" }),
  Object.freeze({ id: "calendar", label: "Calendar", subtitle: "Agenda", token: "CL" }),
  Object.freeze({ id: "music", label: "Music", subtitle: "Player", token: "MU" }),
  Object.freeze({ id: "browser", label: "Web", subtitle: "Browser", token: "WB" }),
  Object.freeze({ id: "gallery", label: "Gallery", subtitle: "Images", token: "GA" }),
  Object.freeze({ id: "notes", label: "Notes", subtitle: "Text", token: "NT" }),
  Object.freeze({ id: "settings", label: "Settings", subtitle: "Control panel", token: "ST" }),
  Object.freeze({ id: "files", label: "File mgr", subtitle: "Storage", token: "FM" }),
  Object.freeze({ id: "connectivity", label: "Connectivity", subtitle: "Network", token: "CN" }),
  Object.freeze({ id: "tools", label: "Tools", subtitle: "Utilities", token: "TL" }),
  Object.freeze({ id: "clock", label: "Clock", subtitle: "Alarms", token: "CK" }),
]);

const SHORTCUT_APP_IDS = Object.freeze([
  "contacts",
  "messaging",
  "calendar",
  "music",
]);

const CONTACTS = Object.freeze([
  Object.freeze({ name: "Ana Kovac", number: "+385 91 240 118", type: "Mobile" }),
  Object.freeze({ name: "Boris Marin", number: "+385 98 771 622", type: "Mobile" }),
  Object.freeze({ name: "Daria Novak", number: "+385 99 560 930", type: "Work" }),
  Object.freeze({ name: "Ivan Horvat", number: "+385 95 310 744", type: "Mobile" }),
  Object.freeze({ name: "Lana Peric", number: "+385 92 600 124", type: "Home" }),
  Object.freeze({ name: "Marin Jelic", number: "+385 97 455 811", type: "Work" }),
  Object.freeze({ name: "Mia Vuk", number: "+385 93 980 022", type: "Mobile" }),
  Object.freeze({ name: "Nikola Simic", number: "+385 91 662 540", type: "Mobile" }),
  Object.freeze({ name: "Petra Basic", number: "+385 95 218 311", type: "Home" }),
  Object.freeze({ name: "Tin Rado", number: "+385 97 414 882", type: "Mobile" }),
]);

const MESSAGE_SEED = Object.freeze([
  Object.freeze({ from: "Ana Kovac", body: "Meet at the station at 18:30.", time: "17:11", unread: true }),
  Object.freeze({ from: "Mia Vuk", body: "Sent you the gallery photos.", time: "14:42", unread: false }),
  Object.freeze({ from: "Operator", body: "Your prepaid bonus is active.", time: "11:05", unread: false }),
  Object.freeze({ from: "Boris Marin", body: "Call me when free.", time: "Yesterday", unread: false }),
]);

const CALENDAR_EVENTS = Object.freeze([
  Object.freeze({ month: 0, day: 8, title: "Sprint planning", time: "09:30" }),
  Object.freeze({ month: 0, day: 12, title: "Dentist", time: "15:00" }),
  Object.freeze({ month: 0, day: 18, title: "Dinner", time: "20:15" }),
  Object.freeze({ month: 0, day: 23, title: "Train to Zagreb", time: "06:40" }),
  Object.freeze({ month: 0, day: 28, title: "Release check", time: "11:00" }),
]);

const TRACKS = Object.freeze([
  Object.freeze({ title: "Ocean Avenue", artist: "Blue Harbor", durationSec: 245 }),
  Object.freeze({ title: "Northern Lights", artist: "Stereo Drift", durationSec: 221 }),
  Object.freeze({ title: "Nightline", artist: "Signal 57", durationSec: 263 }),
  Object.freeze({ title: "Retro Metro", artist: "Tape Echo", durationSec: 197 }),
]);

const BOOKMARKS = Object.freeze([
  Object.freeze({ title: "matijar.info", url: "https://matijar.info" }),
  Object.freeze({ title: "Symbian docs mirror", url: "https://example.net/symbian-docs" }),
  Object.freeze({ title: "Nokia forum archive", url: "https://example.net/s60-forum" }),
  Object.freeze({ title: "Weather", url: "https://example.net/weather" }),
  Object.freeze({ title: "Mail", url: "https://example.net/mail" }),
]);

const GALLERY_ITEMS = Object.freeze([
  Object.freeze({ label: "IMG_1001", token: "01" }),
  Object.freeze({ label: "IMG_1016", token: "02" }),
  Object.freeze({ label: "IMG_1031", token: "03" }),
  Object.freeze({ label: "IMG_1064", token: "04" }),
  Object.freeze({ label: "IMG_1070", token: "05" }),
  Object.freeze({ label: "IMG_1098", token: "06" }),
  Object.freeze({ label: "IMG_1122", token: "07" }),
  Object.freeze({ label: "IMG_1151", token: "08" }),
  Object.freeze({ label: "IMG_1203", token: "09" }),
]);

const NOTE_SEED = Object.freeze([
  Object.freeze({ title: "Ideas", text: "Prototype Symbian launcher with strict D-pad navigation." }),
  Object.freeze({ title: "Groceries", text: "Coffee, lemons, pasta, olive oil." }),
  Object.freeze({ title: "Travel", text: "Bus 268, seat 14, departure 06:40." }),
  Object.freeze({ title: "Reading", text: "Revisit platform security capabilities on Symbian 9.1." }),
]);

const FILE_VOLUMES = Object.freeze([
  Object.freeze({ name: "Phone memory (C:)", value: "43.1 MB free", usedPercent: 72 }),
  Object.freeze({ name: "Mass memory (E:)", value: "1.2 GB free", usedPercent: 44 }),
  Object.freeze({ name: "Memory card (F:)", value: "6.4 GB free", usedPercent: 38 }),
]);

const CONNECTIVITY_ROWS = Object.freeze([
  Object.freeze({ key: "bluetooth", label: "Bluetooth", detailOn: "Discoverable", detailOff: "Hidden" }),
  Object.freeze({ key: "wifi", label: "WLAN", detailOn: "Connected", detailOff: "Off" }),
  Object.freeze({ key: "gprs", label: "Packet data", detailOn: "When needed", detailOff: "Disabled" }),
  Object.freeze({ key: "usb", label: "USB mode", detailOn: "Mass storage", detailOff: "Not connected" }),
]);

const TOOLS = Object.freeze([
  Object.freeze({ id: "task-switcher", label: "Task switcher", subtitle: "Manage running apps" }),
  Object.freeze({ id: "memory", label: "Memory details", subtitle: "RAM and storage info" }),
  Object.freeze({ id: "profiles", label: "Profiles", subtitle: "Audio behavior" }),
  Object.freeze({ id: "device", label: "Device manager", subtitle: "System information" }),
]);

const PROFILES = Object.freeze(["General", "Silent", "Outdoor", "Meeting"]);
const THEMES = Object.freeze(["S60 Blue", "Graphite", "Sunrise"]);
const NETWORK_MODES = Object.freeze(["Dual mode", "UMTS", "GSM"]);
const KEYPAD_TONES = Object.freeze(["On", "Off"]);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isPrintableCharacter(value) {
  return typeof value === "string" && value.length === 1;
}

function toTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function formatClock(date) {
  return `${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;
}

function formatDateShort(date) {
  const day = toTwoDigits(date.getDate());
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
}

function formatDateLong(date) {
  const weekday = date.toLocaleString("en-US", { weekday: "short" });
  const day = toTwoDigits(date.getDate());
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${toTwoDigits(minutes)}:${toTwoDigits(seconds)}`;
}

function cycleIndex(current, count, direction) {
  if (count <= 0) {
    return 0;
  }

  if (direction > 0) {
    return (current + 1) % count;
  }

  return (current - 1 + count) % count;
}

function moveGridIndex(current, direction, itemCount, columnCount) {
  if (itemCount <= 0) {
    return 0;
  }

  const maxIndex = itemCount - 1;

  if (direction === "left") {
    return clamp(current - 1, 0, maxIndex);
  }

  if (direction === "right") {
    return clamp(current + 1, 0, maxIndex);
  }

  if (direction === "up") {
    return clamp(current - columnCount, 0, maxIndex);
  }

  if (direction === "down") {
    return clamp(current + columnCount, 0, maxIndex);
  }

  return current;
}

function getAppMeta(appId) {
  return MENU_APPS.find((app) => app.id === appId) || null;
}

function createInitialState({ variant }) {
  const now = new Date();

  return {
    variant,
    brand: variant === "uiq-p1i" ? "Sony Ericsson" : "Nokia",
    platformName: variant === "uiq-p1i" ? "Symbian 9.1 / UIQ 3.0" : "Symbian 9.1 / S60 3rd Edition",
    screen: "boot",
    appReturnScreen: "menu",
    currentAppId: null,
    runningApps: [],
    recentApps: [],
    keylock: false,
    now,
    signalBars: 4,
    batteryLevel: 82,
    profileName: "General",
    carrierName: "Operator",
    standbyShortcutIndex: 0,
    standbyNotifications: [
      { label: "1 new message", subtitle: "Ana Kovac", trailing: "now", token: "MS" },
      { label: "Calendar", subtitle: "Sprint planning 09:30", trailing: "today", token: "CL" },
    ],
    menuIndex: 0,
    boot: {
      lineIndex: 0,
      logs: [],
      progress: 2,
      complete: false,
    },
    toast: null,
    popup: null,
    taskSwitcher: {
      open: false,
      cursor: 0,
    },
    apps: {
      contacts: {
        query: "",
        cursor: 0,
      },
      messaging: {
        cursor: 0,
        mode: "inbox",
        recipient: "",
        body: "",
        focus: "body",
        inputMode: "abc",
        messages: MESSAGE_SEED.map((entry) => ({ ...entry })),
      },
      calendar: {
        selectedDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
      music: {
        cursor: 0,
        playing: false,
        trackIndex: 0,
        progressSec: 52,
        volume: 6,
      },
      browser: {
        cursor: 0,
        currentTitle: BOOKMARKS[0].title,
        currentUrl: BOOKMARKS[0].url,
        state: "Ready",
      },
      gallery: {
        cursor: 0,
      },
      notes: {
        cursor: 0,
        notes: NOTE_SEED.map((note) => ({ ...note })),
      },
      settings: {
        cursor: 0,
        profileIndex: 0,
        themeIndex: 0,
        networkIndex: 0,
        keypadToneIndex: 0,
      },
      files: {
        cursor: 0,
      },
      connectivity: {
        cursor: 0,
        toggles: {
          bluetooth: false,
          wifi: true,
          gprs: true,
          usb: false,
        },
      },
      tools: {
        cursor: 0,
      },
      clock: {
        alarmTime: "06:30",
      },
    },
  };
}

function buildCalendarRows(selectedDate, eventsByKey) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const prevMonthEnd = new Date(year, month, 0).getDate();

  const rows = [];
  let cursorDay = 1;
  let nextMonthDay = 1;

  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const row = [];

    for (let columnIndex = 0; columnIndex < 7; columnIndex += 1) {
      const absoluteIndex = rowIndex * 7 + columnIndex;
      let day = 0;
      let date = null;
      let isOutside = false;

      if (absoluteIndex < firstWeekday) {
        day = prevMonthEnd - firstWeekday + absoluteIndex + 1;
        date = new Date(year, month - 1, day);
        isOutside = true;
      } else if (cursorDay <= daysInMonth) {
        day = cursorDay;
        date = new Date(year, month, day);
        cursorDay += 1;
      } else {
        day = nextMonthDay;
        date = new Date(year, month + 1, day);
        nextMonthDay += 1;
        isOutside = true;
      }

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isSelected =
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate();

      row.push({
        day,
        key,
        isOutside,
        isSelected,
        hasEvent: eventsByKey.has(key),
      });
    }

    rows.push(row);
  }

  return rows;
}

export function createSymbianShell({ root, variant = "v1995-s60" } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("createSymbianShell requires a valid root HTMLElement.");
  }

  const state = createInitialState({ variant });
  const timeouts = new Set();
  const intervals = new Set();

  let mounted = false;
  let clockTickCount = 0;
  let toastTimeoutId = null;
  let popupTimeoutId = null;

  function setManagedTimeout(callback, delayMs) {
    const timeoutId = window.setTimeout(() => {
      timeouts.delete(timeoutId);
      callback();
    }, delayMs);

    timeouts.add(timeoutId);
    return timeoutId;
  }

  function setManagedInterval(callback, intervalMs) {
    const intervalId = window.setInterval(callback, intervalMs);
    intervals.add(intervalId);
    return intervalId;
  }

  function clearManagedTimeout(timeoutId) {
    if (timeoutId == null) {
      return;
    }

    window.clearTimeout(timeoutId);
    timeouts.delete(timeoutId);
  }

  function clearAllTimers() {
    for (const timeoutId of timeouts) {
      window.clearTimeout(timeoutId);
    }
    timeouts.clear();

    for (const intervalId of intervals) {
      window.clearInterval(intervalId);
    }
    intervals.clear();
  }

  function getTaskSwitcherApps() {
    return state.recentApps.filter((appId) => state.runningApps.includes(appId));
  }

  function addRunningApp(appId) {
    if (!state.runningApps.includes(appId)) {
      state.runningApps.push(appId);
    }

    state.recentApps = [appId, ...state.recentApps.filter((id) => id !== appId)].slice(0, 8);
  }

  function removeRunningApp(appId) {
    state.runningApps = state.runningApps.filter((id) => id !== appId);
    state.recentApps = state.recentApps.filter((id) => id !== appId);

    if (state.currentAppId === appId) {
      state.currentAppId = null;
      state.screen = "menu";
    }

    const taskApps = getTaskSwitcherApps();
    state.taskSwitcher.cursor = clamp(state.taskSwitcher.cursor, 0, Math.max(0, taskApps.length - 1));
  }

  function setToast(message, variantName = "info", durationMs = 1400) {
    state.toast = {
      message,
      variant: variantName,
    };

    clearManagedTimeout(toastTimeoutId);
    toastTimeoutId = setManagedTimeout(() => {
      state.toast = null;
      toastTimeoutId = null;
      render();
    }, durationMs);
  }

  function setPopup(message, variantName = "info", durationMs = 1600) {
    state.popup = {
      message,
      variant: variantName,
    };

    clearManagedTimeout(popupTimeoutId);
    popupTimeoutId = setManagedTimeout(() => {
      state.popup = null;
      popupTimeoutId = null;
      render();
    }, durationMs);
  }

  function getFilteredContacts() {
    const query = state.apps.contacts.query.trim().toLowerCase();

    if (!query) {
      return CONTACTS;
    }

    return CONTACTS.filter((contact) =>
      contact.name.toLowerCase().includes(query) || contact.number.toLowerCase().includes(query),
    );
  }

  function getEventsByDate() {
    const events = new Map();

    for (const entry of CALENDAR_EVENTS) {
      const selectedYear = state.apps.calendar.selectedDate.getFullYear();
      const key = `${selectedYear}-${entry.month}-${entry.day}`;

      if (!events.has(key)) {
        events.set(key, []);
      }

      events.get(key).push(entry);
    }

    return events;
  }

  function getCurrentCalendarEvents() {
    const selectedDate = state.apps.calendar.selectedDate;
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    const eventsByDate = getEventsByDate();
    return eventsByDate.get(key) || [];
  }

  function getCurrentTrack() {
    return TRACKS[state.apps.music.trackIndex] || TRACKS[0];
  }

  function normalizeAppCursors() {
    const contactsLength = getFilteredContacts().length;
    state.apps.contacts.cursor = clamp(state.apps.contacts.cursor, 0, Math.max(0, contactsLength - 1));

    state.apps.messaging.cursor = clamp(
      state.apps.messaging.cursor,
      0,
      Math.max(0, state.apps.messaging.messages.length - 1),
    );

    state.apps.gallery.cursor = clamp(state.apps.gallery.cursor, 0, GALLERY_ITEMS.length - 1);
    state.apps.notes.cursor = clamp(state.apps.notes.cursor, 0, Math.max(0, state.apps.notes.notes.length - 1));
    state.apps.files.cursor = clamp(state.apps.files.cursor, 0, FILE_VOLUMES.length - 1);
    state.apps.connectivity.cursor = clamp(state.apps.connectivity.cursor, 0, CONNECTIVITY_ROWS.length - 1);
    state.apps.tools.cursor = clamp(state.apps.tools.cursor, 0, TOOLS.length - 1);
    state.apps.browser.cursor = clamp(state.apps.browser.cursor, 0, BOOKMARKS.length - 1);
  }

  function completeBoot() {
    if (state.screen !== "boot") {
      return;
    }

    state.screen = "standby";
    state.boot.complete = true;
    state.popup = null;
    setToast("Standby ready", "success", 1000);
    render();
  }

  function progressBoot() {
    if (!mounted || state.screen !== "boot") {
      return;
    }

    if (state.boot.lineIndex >= BOOT_LINES.length) {
      state.boot.progress = 100;
      render();
      setManagedTimeout(() => {
        completeBoot();
      }, 700);
      return;
    }

    const line = BOOT_LINES[state.boot.lineIndex];
    state.boot.logs.push(line);
    state.boot.lineIndex += 1;
    state.boot.progress = clamp(Math.round((state.boot.lineIndex / BOOT_LINES.length) * 100), 1, 100);

    render();

    const delayMs = state.boot.lineIndex <= 3 ? 440 : 300;
    setManagedTimeout(progressBoot, delayMs);
  }

  function startBootSequence() {
    state.screen = "boot";
    state.boot.logs = [];
    state.boot.lineIndex = 0;
    state.boot.progress = 2;
    state.boot.complete = false;
    progressBoot();
  }

  function openMenu() {
    state.screen = "menu";
    state.currentAppId = null;
    state.taskSwitcher.open = false;
  }

  function goStandby() {
    state.screen = "standby";
    state.currentAppId = null;
    state.taskSwitcher.open = false;
  }

  function launchApp(appId, { fromScreen = state.screen } = {}) {
    const appMeta = getAppMeta(appId);

    if (!appMeta) {
      setToast("Application is unavailable", "warning");
      return;
    }

    addRunningApp(appId);
    state.currentAppId = appId;
    state.appReturnScreen = fromScreen === "standby" ? "standby" : "menu";
    state.screen = "app";
    state.taskSwitcher.open = false;
  }

  function backFromApp() {
    if (!state.currentAppId) {
      openMenu();
      return;
    }

    if (state.currentAppId === "messaging" && state.apps.messaging.mode === "compose") {
      state.apps.messaging.mode = "inbox";
      setToast("Draft kept", "info", 1000);
      return;
    }

    state.currentAppId = null;
    state.screen = state.appReturnScreen || "menu";
  }

  function toggleTaskSwitcher() {
    const taskApps = getTaskSwitcherApps();

    if (taskApps.length === 0) {
      setToast("No running apps", "warning");
      return;
    }

    state.taskSwitcher.open = !state.taskSwitcher.open;
    state.taskSwitcher.cursor = clamp(state.taskSwitcher.cursor, 0, taskApps.length - 1);
  }

  function activateTaskSwitcherSelection() {
    const taskApps = getTaskSwitcherApps();

    if (taskApps.length === 0) {
      state.taskSwitcher.open = false;
      return;
    }

    const appId = taskApps[state.taskSwitcher.cursor];
    launchApp(appId, { fromScreen: "menu" });
  }

  function closeTaskSwitcherSelection() {
    const taskApps = getTaskSwitcherApps();

    if (taskApps.length === 0) {
      state.taskSwitcher.open = false;
      return;
    }

    const appId = taskApps[state.taskSwitcher.cursor];
    removeRunningApp(appId);

    const nextApps = getTaskSwitcherApps();
    if (nextApps.length === 0) {
      state.taskSwitcher.open = false;
    } else {
      state.taskSwitcher.cursor = clamp(state.taskSwitcher.cursor, 0, nextApps.length - 1);
    }
  }

  function moveMenu(direction) {
    state.menuIndex = moveGridIndex(state.menuIndex, direction, MENU_APPS.length, 3);
  }

  function launchMenuIndex(index) {
    const resolved = clamp(index, 0, MENU_APPS.length - 1);
    state.menuIndex = resolved;

    const app = MENU_APPS[resolved];
    if (!app) {
      return;
    }

    launchApp(app.id, { fromScreen: "menu" });
  }

  function moveClockApp(direction) {
    const now = state.now;
    if (direction === "up") {
      state.now = new Date(now.getTime() + 60 * 1000);
    } else if (direction === "down") {
      state.now = new Date(now.getTime() - 60 * 1000);
    }
  }

  function changeSettingOption(direction) {
    const settings = state.apps.settings;
    const delta = direction === "right" ? 1 : -1;

    if (settings.cursor === 0) {
      settings.profileIndex = cycleIndex(settings.profileIndex, PROFILES.length, delta);
      state.profileName = PROFILES[settings.profileIndex];
      return;
    }

    if (settings.cursor === 1) {
      settings.themeIndex = cycleIndex(settings.themeIndex, THEMES.length, delta);
      return;
    }

    if (settings.cursor === 2) {
      settings.networkIndex = cycleIndex(settings.networkIndex, NETWORK_MODES.length, delta);
      return;
    }

    if (settings.cursor === 3) {
      settings.keypadToneIndex = cycleIndex(settings.keypadToneIndex, KEYPAD_TONES.length, delta);
    }
  }

  function handleAppDirection(direction) {
    if (!state.currentAppId) {
      return;
    }

    normalizeAppCursors();

    if (state.currentAppId === "contacts") {
      const contacts = getFilteredContacts();
      if (direction === "up") {
        state.apps.contacts.cursor = clamp(state.apps.contacts.cursor - 1, 0, Math.max(0, contacts.length - 1));
      } else if (direction === "down") {
        state.apps.contacts.cursor = clamp(state.apps.contacts.cursor + 1, 0, Math.max(0, contacts.length - 1));
      }
      return;
    }

    if (state.currentAppId === "messaging") {
      if (state.apps.messaging.mode === "compose") {
        if (direction === "up" || direction === "down") {
          state.apps.messaging.focus = state.apps.messaging.focus === "recipient" ? "body" : "recipient";
        }
      } else {
        if (direction === "up") {
          state.apps.messaging.cursor = clamp(state.apps.messaging.cursor - 1, 0, Math.max(0, state.apps.messaging.messages.length - 1));
        } else if (direction === "down") {
          state.apps.messaging.cursor = clamp(state.apps.messaging.cursor + 1, 0, Math.max(0, state.apps.messaging.messages.length - 1));
        }
      }
      return;
    }

    if (state.currentAppId === "calendar") {
      const selected = state.apps.calendar.selectedDate;
      if (direction === "left") {
        state.apps.calendar.selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - 1);
      } else if (direction === "right") {
        state.apps.calendar.selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 1);
      } else if (direction === "up") {
        state.apps.calendar.selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - 7);
      } else if (direction === "down") {
        state.apps.calendar.selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 7);
      }
      return;
    }

    if (state.currentAppId === "music") {
      if (direction === "left") {
        state.apps.music.trackIndex = cycleIndex(state.apps.music.trackIndex, TRACKS.length, -1);
        state.apps.music.progressSec = 0;
      } else if (direction === "right") {
        state.apps.music.trackIndex = cycleIndex(state.apps.music.trackIndex, TRACKS.length, 1);
        state.apps.music.progressSec = 0;
      } else if (direction === "up") {
        state.apps.music.volume = clamp(state.apps.music.volume + 1, 0, 10);
      } else if (direction === "down") {
        state.apps.music.volume = clamp(state.apps.music.volume - 1, 0, 10);
      }
      return;
    }

    if (state.currentAppId === "browser") {
      if (direction === "up") {
        state.apps.browser.cursor = clamp(state.apps.browser.cursor - 1, 0, BOOKMARKS.length - 1);
      } else if (direction === "down") {
        state.apps.browser.cursor = clamp(state.apps.browser.cursor + 1, 0, BOOKMARKS.length - 1);
      }
      return;
    }

    if (state.currentAppId === "gallery") {
      state.apps.gallery.cursor = moveGridIndex(state.apps.gallery.cursor, direction, GALLERY_ITEMS.length, 3);
      return;
    }

    if (state.currentAppId === "notes") {
      if (direction === "up") {
        state.apps.notes.cursor = clamp(state.apps.notes.cursor - 1, 0, Math.max(0, state.apps.notes.notes.length - 1));
      } else if (direction === "down") {
        state.apps.notes.cursor = clamp(state.apps.notes.cursor + 1, 0, Math.max(0, state.apps.notes.notes.length - 1));
      }
      return;
    }

    if (state.currentAppId === "settings") {
      if (direction === "up") {
        state.apps.settings.cursor = clamp(state.apps.settings.cursor - 1, 0, 3);
      } else if (direction === "down") {
        state.apps.settings.cursor = clamp(state.apps.settings.cursor + 1, 0, 3);
      } else if (direction === "left" || direction === "right") {
        changeSettingOption(direction);
      }
      return;
    }

    if (state.currentAppId === "files") {
      if (direction === "up") {
        state.apps.files.cursor = clamp(state.apps.files.cursor - 1, 0, FILE_VOLUMES.length - 1);
      } else if (direction === "down") {
        state.apps.files.cursor = clamp(state.apps.files.cursor + 1, 0, FILE_VOLUMES.length - 1);
      }
      return;
    }

    if (state.currentAppId === "connectivity") {
      if (direction === "up") {
        state.apps.connectivity.cursor = clamp(state.apps.connectivity.cursor - 1, 0, CONNECTIVITY_ROWS.length - 1);
      } else if (direction === "down") {
        state.apps.connectivity.cursor = clamp(state.apps.connectivity.cursor + 1, 0, CONNECTIVITY_ROWS.length - 1);
      }
      return;
    }

    if (state.currentAppId === "tools") {
      if (direction === "up") {
        state.apps.tools.cursor = clamp(state.apps.tools.cursor - 1, 0, TOOLS.length - 1);
      } else if (direction === "down") {
        state.apps.tools.cursor = clamp(state.apps.tools.cursor + 1, 0, TOOLS.length - 1);
      }
      return;
    }

    if (state.currentAppId === "clock") {
      moveClockApp(direction);
    }
  }

  function activateCurrentAppSelection() {
    if (!state.currentAppId) {
      return;
    }

    if (state.currentAppId === "contacts") {
      const contacts = getFilteredContacts();
      const selected = contacts[state.apps.contacts.cursor];
      if (selected) {
        setToast(`Dialing ${selected.name}`, "info", 1200);
      }
      return;
    }

    if (state.currentAppId === "messaging") {
      if (state.apps.messaging.mode === "compose") {
        const recipient = state.apps.messaging.recipient.trim();
        const body = state.apps.messaging.body.trim();

        if (!recipient || !body) {
          setToast("Enter recipient and text", "warning");
          return;
        }

        const sentTime = formatClock(state.now);
        state.apps.messaging.messages.unshift({
          from: `To: ${recipient}`,
          body,
          time: sentTime,
          unread: false,
        });
        state.apps.messaging.recipient = "";
        state.apps.messaging.body = "";
        state.apps.messaging.mode = "inbox";
        state.apps.messaging.cursor = 0;
        setToast("Message sent", "success");
        return;
      }

      const selected = state.apps.messaging.messages[state.apps.messaging.cursor];
      if (selected) {
        selected.unread = false;
        setPopup(`${selected.from}: ${selected.body}`, "info", 1900);
      }
      return;
    }

    if (state.currentAppId === "calendar") {
      const events = getCurrentCalendarEvents();
      if (events.length === 0) {
        setToast("No events on selected day", "warning");
        return;
      }

      setPopup(events.map((entry) => `${entry.time} ${entry.title}`).join(" | "), "info", 2200);
      return;
    }

    if (state.currentAppId === "music") {
      state.apps.music.playing = !state.apps.music.playing;
      setToast(state.apps.music.playing ? "Playback started" : "Playback paused", "info", 1000);
      return;
    }

    if (state.currentAppId === "browser") {
      const bookmark = BOOKMARKS[state.apps.browser.cursor];
      if (!bookmark) {
        return;
      }

      state.apps.browser.currentTitle = bookmark.title;
      state.apps.browser.currentUrl = bookmark.url;
      state.apps.browser.state = "Loading";
      setManagedTimeout(() => {
        state.apps.browser.state = "Ready";
        render();
      }, 550);
      return;
    }

    if (state.currentAppId === "gallery") {
      const item = GALLERY_ITEMS[state.apps.gallery.cursor];
      if (item) {
        setToast(`Preview ${item.label}`, "info", 900);
      }
      return;
    }

    if (state.currentAppId === "notes") {
      const note = state.apps.notes.notes[state.apps.notes.cursor];
      if (note) {
        setPopup(`${note.title}: ${note.text}`, "info", 2000);
      }
      return;
    }

    if (state.currentAppId === "settings") {
      setToast("Settings applied", "success", 1000);
      return;
    }

    if (state.currentAppId === "files") {
      const volume = FILE_VOLUMES[state.apps.files.cursor];
      if (volume) {
        setToast(`Opening ${volume.name}`, "info", 1000);
      }
      return;
    }

    if (state.currentAppId === "connectivity") {
      const row = CONNECTIVITY_ROWS[state.apps.connectivity.cursor];
      if (row) {
        state.apps.connectivity.toggles[row.key] = !state.apps.connectivity.toggles[row.key];
        setToast(
          `${row.label} ${state.apps.connectivity.toggles[row.key] ? "enabled" : "disabled"}`,
          "info",
          900,
        );
      }
      return;
    }

    if (state.currentAppId === "tools") {
      const tool = TOOLS[state.apps.tools.cursor];
      if (!tool) {
        return;
      }

      if (tool.id === "task-switcher") {
        toggleTaskSwitcher();
      } else if (tool.id === "memory") {
        setPopup("RAM free: 27 MB | Heap free: 9 MB", "info", 1800);
      } else if (tool.id === "profiles") {
        setToast(`Active profile: ${state.profileName}`, "info", 1200);
      } else if (tool.id === "device") {
        setPopup("Nokia RM-133, Symbian 9.1, S60 3rd Edition", "info", 2200);
      }
      return;
    }

    if (state.currentAppId === "clock") {
      setToast(`Alarm set to ${state.apps.clock.alarmTime}`, "success");
    }
  }

  function handleAppSoftkeyLeft() {
    if (!state.currentAppId) {
      return;
    }

    if (state.currentAppId === "contacts") {
      if (state.apps.contacts.query) {
        state.apps.contacts.query = "";
        state.apps.contacts.cursor = 0;
      } else {
        setPopup("Options: New contact | Send business card", "info", 1700);
      }
      return;
    }

    if (state.currentAppId === "messaging") {
      if (state.apps.messaging.mode === "inbox") {
        state.apps.messaging.mode = "compose";
        state.apps.messaging.focus = "recipient";
      } else {
        const inputModes = ["abc", "123"];
        const currentIndex = inputModes.indexOf(state.apps.messaging.inputMode);
        const nextIndex = cycleIndex(currentIndex, inputModes.length, 1);
        state.apps.messaging.inputMode = inputModes[nextIndex];
      }
      return;
    }

    if (state.currentAppId === "calendar") {
      const now = new Date();
      state.apps.calendar.selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return;
    }

    if (state.currentAppId === "music") {
      state.apps.music.trackIndex = cycleIndex(state.apps.music.trackIndex, TRACKS.length, -1);
      state.apps.music.progressSec = 0;
      return;
    }

    if (state.currentAppId === "browser") {
      state.apps.browser.cursor = 0;
      state.apps.browser.currentTitle = BOOKMARKS[0].title;
      state.apps.browser.currentUrl = BOOKMARKS[0].url;
      state.apps.browser.state = "Ready";
      return;
    }

    if (state.currentAppId === "gallery") {
      setPopup("Albums: Camera | Downloads | Favorites", "info", 1700);
      return;
    }

    if (state.currentAppId === "notes") {
      const timestamp = `${formatDateShort(state.now)} ${formatClock(state.now)}`;
      state.apps.notes.notes.unshift({
        title: `New ${state.apps.notes.notes.length + 1}`,
        text: `Quick note created on ${timestamp}.`,
      });
      state.apps.notes.cursor = 0;
      setToast("Note created", "success", 1000);
      return;
    }

    if (state.currentAppId === "settings") {
      changeSettingOption("right");
      return;
    }

    if (state.currentAppId === "files") {
      setPopup("Options: Copy | Move | Delete | Details", "info", 1700);
      return;
    }

    if (state.currentAppId === "connectivity") {
      const row = CONNECTIVITY_ROWS[state.apps.connectivity.cursor];
      if (!row) {
        return;
      }

      state.apps.connectivity.toggles[row.key] = !state.apps.connectivity.toggles[row.key];
      return;
    }

    if (state.currentAppId === "tools") {
      activateCurrentAppSelection();
      return;
    }

    if (state.currentAppId === "clock") {
      const hour = (state.now.getHours() + 1) % 24;
      state.apps.clock.alarmTime = `${toTwoDigits(hour)}:${toTwoDigits(state.now.getMinutes())}`;
      setToast(`Alarm updated ${state.apps.clock.alarmTime}`, "info", 1200);
    }
  }

  function handleAppBackspace() {
    if (state.currentAppId === "contacts") {
      if (!state.apps.contacts.query) {
        return false;
      }

      state.apps.contacts.query = state.apps.contacts.query.slice(0, -1);
      state.apps.contacts.cursor = 0;
      return true;
    }

    if (state.currentAppId === "messaging" && state.apps.messaging.mode === "compose") {
      const focus = state.apps.messaging.focus;

      if (focus === "recipient") {
        state.apps.messaging.recipient = state.apps.messaging.recipient.slice(0, -1);
      } else {
        state.apps.messaging.body = state.apps.messaging.body.slice(0, -1);
      }

      return true;
    }

    return false;
  }

  function handleAppPrintableInput(character) {
    if (!state.currentAppId) {
      return false;
    }

    if (state.currentAppId === "contacts") {
      state.apps.contacts.query += character;
      state.apps.contacts.cursor = 0;
      return true;
    }

    if (state.currentAppId === "messaging" && state.apps.messaging.mode === "compose") {
      if (state.apps.messaging.inputMode === "123" && !/^[0-9 ]$/.test(character)) {
        return true;
      }

      if (state.apps.messaging.focus === "recipient") {
        state.apps.messaging.recipient += character;
      } else {
        state.apps.messaging.body += character;
      }

      return true;
    }

    return false;
  }

  function getSoftkeys() {
    if (state.keylock) {
      return {
        left: "Unlock",
        center: "",
        right: "",
      };
    }

    if (state.taskSwitcher.open) {
      return {
        left: "Close app",
        center: "Switch",
        right: "Cancel",
      };
    }

    if (state.screen === "boot") {
      return {
        left: "",
        center: "Skip",
        right: "",
      };
    }

    if (state.screen === "standby") {
      return {
        left: "Menu",
        center: "Open",
        right: "Lock",
      };
    }

    if (state.screen === "menu") {
      return {
        left: "Options",
        center: "Open",
        right: "Exit",
      };
    }

    if (state.screen === "app") {
      if (state.currentAppId === "messaging" && state.apps.messaging.mode === "compose") {
        return {
          left: `Mode ${state.apps.messaging.inputMode.toUpperCase()}`,
          center: "Send",
          right: "Back",
        };
      }

      if (state.currentAppId === "music") {
        return {
          left: "Prev",
          center: state.apps.music.playing ? "Pause" : "Play",
          right: "Back",
        };
      }

      if (state.currentAppId === "contacts" && state.apps.contacts.query) {
        return {
          left: "Clear",
          center: "Open",
          right: "Back",
        };
      }

      return {
        left: "Options",
        center: "Select",
        right: "Back",
      };
    }

    return {
      left: "",
      center: "",
      right: "",
    };
  }

  function handleDirection(direction) {
    if (state.keylock) {
      setToast("Keypad is locked", "warning", 900);
      return;
    }

    if (state.taskSwitcher.open) {
      const taskApps = getTaskSwitcherApps();
      if (taskApps.length === 0) {
        state.taskSwitcher.open = false;
        return;
      }

      if (direction === "up") {
        state.taskSwitcher.cursor = clamp(state.taskSwitcher.cursor - 1, 0, taskApps.length - 1);
      } else if (direction === "down") {
        state.taskSwitcher.cursor = clamp(state.taskSwitcher.cursor + 1, 0, taskApps.length - 1);
      }
      return;
    }

    if (state.screen === "boot") {
      return;
    }

    if (state.screen === "standby") {
      if (direction === "left") {
        state.standbyShortcutIndex = clamp(state.standbyShortcutIndex - 1, 0, SHORTCUT_APP_IDS.length - 1);
      } else if (direction === "right") {
        state.standbyShortcutIndex = clamp(state.standbyShortcutIndex + 1, 0, SHORTCUT_APP_IDS.length - 1);
      } else if (direction === "up") {
        openMenu();
      } else if (direction === "down") {
        setToast("No older notifications", "info", 900);
      }
      return;
    }

    if (state.screen === "menu") {
      moveMenu(direction);
      return;
    }

    if (state.screen === "app") {
      handleAppDirection(direction);
    }
  }

  function handleSoftkey(side) {
    if (side === "left" && state.keylock) {
      state.keylock = false;
      setToast("Keypad unlocked", "success", 850);
      return;
    }

    if (state.keylock) {
      setToast("Keypad is locked", "warning", 900);
      return;
    }

    if (state.taskSwitcher.open) {
      if (side === "left") {
        closeTaskSwitcherSelection();
      } else if (side === "center") {
        activateTaskSwitcherSelection();
      } else if (side === "right") {
        state.taskSwitcher.open = false;
      }
      return;
    }

    if (state.screen === "boot") {
      if (side === "center" || side === "left") {
        completeBoot();
      }
      return;
    }

    if (state.screen === "standby") {
      if (side === "left") {
        openMenu();
      } else if (side === "center") {
        const appId = SHORTCUT_APP_IDS[state.standbyShortcutIndex] || SHORTCUT_APP_IDS[0];
        launchApp(appId, { fromScreen: "standby" });
      } else if (side === "right") {
        state.keylock = true;
        setToast("Keypad locked", "info", 900);
      }
      return;
    }

    if (state.screen === "menu") {
      if (side === "left") {
        const app = MENU_APPS[state.menuIndex];
        if (app) {
          setPopup(`Options: Open ${app.label} | Move | Organize`, "info", 1700);
        }
      } else if (side === "center") {
        launchMenuIndex(state.menuIndex);
      } else if (side === "right") {
        goStandby();
      }
      return;
    }

    if (state.screen === "app") {
      if (side === "left") {
        handleAppSoftkeyLeft();
      } else if (side === "center") {
        activateCurrentAppSelection();
      } else if (side === "right") {
        backFromApp();
      }
    }
  }

  function handleUtilityMenu() {
    if (state.keylock) {
      state.keylock = false;
      setToast("Keypad unlocked", "success", 850);
      return;
    }

    if (state.screen === "menu") {
      goStandby();
      return;
    }

    openMenu();
  }

  function handleUtilityCall() {
    if (state.keylock) {
      setToast("Unlock keypad first", "warning", 900);
      return;
    }

    setToast("No active voice call", "info", 1000);
  }

  function handleUtilityEnd() {
    if (state.keylock) {
      return;
    }

    goStandby();
  }

  function handleKeyDown(event) {
    if (!mounted) {
      return;
    }

    const key = event.key;
    const loweredKey = typeof key === "string" ? key.toLowerCase() : "";

    let handled = false;

    if (key === "ArrowUp") {
      handleDirection("up");
      handled = true;
    } else if (key === "ArrowDown") {
      handleDirection("down");
      handled = true;
    } else if (key === "ArrowLeft") {
      handleDirection("left");
      handled = true;
    } else if (key === "ArrowRight") {
      handleDirection("right");
      handled = true;
    } else if (key === "Enter" || key === " " || key === "F2" || key === "SoftMiddle") {
      handleSoftkey("center");
      handled = true;
    } else if (
      key === "Escape" ||
      key === "F3" ||
      key === "SoftRight" ||
      key === "]"
    ) {
      handleSoftkey("right");
      handled = true;
    } else if (key === "F1" || key === "SoftLeft" || key === "[") {
      handleSoftkey("left");
      handled = true;
    } else if (key === "ContextMenu" || loweredKey === "m") {
      handleUtilityMenu();
      handled = true;
    } else if (loweredKey === "c") {
      handleUtilityCall();
      handled = true;
    } else if (loweredKey === "e") {
      handleUtilityEnd();
      handled = true;
    } else if (key === "Tab") {
      toggleTaskSwitcher();
      handled = true;
    } else if (state.screen === "menu" && /^[1-9]$/.test(key)) {
      const pageStart = Math.floor(state.menuIndex / 9) * 9;
      const target = pageStart + Number(key) - 1;
      if (target < MENU_APPS.length) {
        launchMenuIndex(target);
      }
      handled = true;
    } else if (key === "Backspace") {
      if (state.screen === "app") {
        handled = handleAppBackspace();
      } else {
        handled = true;
      }
    } else if (
      state.screen === "app" &&
      isPrintableCharacter(key) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      handled = handleAppPrintableInput(key);
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
      normalizeAppCursors();
      render();
    }
  }

  function handleClick(event) {
    const target = event.target instanceof HTMLElement
      ? event.target.closest("[data-action]")
      : null;

    if (!target) {
      return;
    }

    const action = target.dataset.action;

    if (action === "softkey") {
      handleSoftkey(target.dataset.side || "center");
    } else if (action === "nav") {
      handleDirection(target.dataset.direction || "up");
    } else if (action === "utility-menu") {
      handleUtilityMenu();
    } else if (action === "utility-call") {
      handleUtilityCall();
    } else if (action === "utility-end") {
      handleUtilityEnd();
    } else if (action === "menu-index") {
      const index = Number(target.dataset.index);
      if (Number.isFinite(index)) {
        state.menuIndex = clamp(index, 0, MENU_APPS.length - 1);
        launchMenuIndex(state.menuIndex);
      }
    } else if (action === "standby-shortcut") {
      const index = Number(target.dataset.index);
      if (Number.isFinite(index)) {
        state.standbyShortcutIndex = clamp(index, 0, SHORTCUT_APP_IDS.length - 1);
        const appId = SHORTCUT_APP_IDS[state.standbyShortcutIndex];
        launchApp(appId, { fromScreen: "standby" });
      }
    } else if (action === "toggle-task-switcher") {
      toggleTaskSwitcher();
    } else if (action === "task-select") {
      const index = Number(target.dataset.index);
      if (Number.isFinite(index)) {
        state.taskSwitcher.cursor = clamp(index, 0, Math.max(0, getTaskSwitcherApps().length - 1));
        activateTaskSwitcherSelection();
      }
    }

    normalizeAppCursors();
    render();
  }

  function renderSignalBars() {
    const bars = [];

    for (let index = 0; index < 4; index += 1) {
      const isActive = index < state.signalBars;
      bars.push(`<span class="symbian-signal__bar${isActive ? " is-active" : ""}"></span>`);
    }

    return bars.join("");
  }

  function renderStatusBar() {
    return `
      <div class="symbian-statusbar" role="status" aria-live="polite">
        <div class="symbian-statusbar__left">
          <span class="symbian-signal" aria-label="Signal strength">${renderSignalBars()}</span>
          <span class="symbian-statusbar__operator">3G</span>
        </div>
        <div class="symbian-statusbar__center">
          <span class="symbian-statusbar__date">${escapeHtml(state.carrierName)}</span>
        </div>
        <div class="symbian-statusbar__right">
          <span class="symbian-statusbar__clock">${escapeHtml(formatClock(state.now))}</span>
          <span class="symbian-statusbar__divider"></span>
          <span class="symbian-battery" aria-label="Battery ${state.batteryLevel}%">
            <span class="symbian-battery__cell">
              <span class="symbian-battery__fill" style="width:${clamp(state.batteryLevel, 1, 100)}%"></span>
            </span>
            <span class="symbian-battery__cap"></span>
            <span class="symbian-battery__text">${state.batteryLevel}%</span>
          </span>
        </div>
      </div>
    `;
  }

  function renderSoftkeys() {
    const softkeys = getSoftkeys();

    return `
      <div class="symbian-softkeys" role="toolbar" aria-label="Softkeys">
        <button type="button" class="symbian-softkeys__key symbian-softkeys__key--left" data-action="softkey" data-side="left">${escapeHtml(softkeys.left || " ")}</button>
        <button type="button" class="symbian-softkeys__key symbian-softkeys__key--center" data-action="softkey" data-side="center">${escapeHtml(softkeys.center || " ")}</button>
        <button type="button" class="symbian-softkeys__key symbian-softkeys__key--right" data-action="softkey" data-side="right">${escapeHtml(softkeys.right || " ")}</button>
      </div>
    `;
  }

  function renderMenuScreen() {
    const pageSize = 9;
    const pageIndex = Math.floor(state.menuIndex / pageSize);
    const pageCount = Math.ceil(MENU_APPS.length / pageSize);
    const pageStart = pageIndex * pageSize;

    const cells = [];

    for (let localIndex = 0; localIndex < pageSize; localIndex += 1) {
      const globalIndex = pageStart + localIndex;
      const app = MENU_APPS[globalIndex];

      if (!app) {
        cells.push('<li class="symbian-menu-grid__item is-disabled" aria-hidden="true"></li>');
        continue;
      }

      const selected = globalIndex === state.menuIndex ? " is-selected" : "";
      cells.push(`
        <li class="symbian-menu-grid__item${selected}" data-action="menu-index" data-index="${globalIndex}">
          <span class="symbian-menu-grid__icon" aria-hidden="true"></span>
          <span class="symbian-menu-grid__label">${escapeHtml(app.label)}</span>
        </li>
      `);
    }

    return `
      <main class="symbian-screen symbian-screen--menu">
        <header class="symbian-menu__header">
          <h2 class="symbian-menu__title">Menu</h2>
          <p class="symbian-menu__page">${pageIndex + 1}/${pageCount}</p>
        </header>
        <p class="symbian-status-message">Use D-pad or number keys 1-9 to open an app.</p>
        <ul class="symbian-menu-grid">${cells.join("")}</ul>
        <p class="symbian-status-message">Tab opens task switcher.</p>
      </main>
    `;
  }

  function renderStandbyScreen() {
    const shortcuts = SHORTCUT_APP_IDS.map((appId) => getAppMeta(appId)).filter(Boolean);

    return `
      <main class="symbian-screen symbian-screen--standby${state.keylock ? " is-dimmed" : ""}">
        <header class="symbian-home__header">
          <h2 class="symbian-home__title">Active standby</h2>
          <p class="symbian-home__profile">${escapeHtml(state.profileName)}</p>
        </header>
        <section class="symbian-standby__status">
          <p class="symbian-standby__operator">${escapeHtml(state.carrierName)}</p>
          <p class="symbian-standby__meters">Signal ${state.signalBars}/4</p>
        </section>
        <section class="symbian-standby__clock-block">
          <p class="symbian-standby__time">${escapeHtml(formatClock(state.now))}</p>
          <p class="symbian-standby__date">${escapeHtml(formatDateLong(state.now))}</p>
          <p class="symbian-standby__profile">${state.keylock ? "Keypad locked" : "Press Menu or center key"}</p>
        </section>
        <section class="symbian-home__shortcuts">
          <ul class="symbian-shortcuts">
            ${shortcuts
              .map((app, index) => {
                const isSelected = state.standbyShortcutIndex === index ? " is-selected" : "";
                return `
                  <li class="symbian-shortcuts__item${isSelected}" data-action="standby-shortcut" data-index="${index}">
                    <span class="symbian-icon-chip">${escapeHtml(app.token)}</span>
                    <span class="symbian-shortcuts__label">${escapeHtml(app.label)}</span>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>
        <section class="symbian-standby__events">
          <p class="symbian-standby__events-title">Today</p>
          <ul class="symbian-standby__notifications">
            ${state.standbyNotifications
              .map(
                (item) => `
              <li class="symbian-standby__notification">
                <span class="symbian-icon-chip">${escapeHtml(item.token)}</span>
                <span class="symbian-standby__notification-main">
                  <span class="symbian-standby__notification-label">${escapeHtml(item.label)}</span>
                  <span class="symbian-standby__notification-subtitle">${escapeHtml(item.subtitle)}</span>
                </span>
                <span class="symbian-standby__notification-trailing">${escapeHtml(item.trailing)}</span>
              </li>
            `,
              )
              .join("")}
          </ul>
        </section>
      </main>
    `;
  }

  function renderBootScreen() {
    return `
      <main class="symbian-screen symbian-screen--boot">
        <section class="symbian-app-body symbian-boot">
          <p class="symbian-boot__logo">${escapeHtml(state.brand.toUpperCase())}</p>
          <p class="symbian-boot__subtitle">${escapeHtml(state.platformName)}</p>
          <div class="symbian-meter" style="--symbian-meter-value:${state.boot.progress}%">
            <div class="symbian-meter__fill"></div>
          </div>
          <pre class="symbian-boot__log">${escapeHtml(state.boot.logs.join("\n"))}</pre>
          <p class="symbian-boot__hint">Press center key to continue</p>
        </section>
      </main>
    `;
  }

  function renderListRows(items, selectedIndex) {
    if (items.length === 0) {
      return '<p class="symbian-empty">No items.</p>';
    }

    return `
      <ul class="symbian-list">
        ${items
          .map((item, index) => {
            const selected = index === selectedIndex ? " is-selected" : "";
            const unread = item.unread ? " is-unread" : "";
            const subtitle = item.subtitle
              ? `<span class="symbian-list__subtitle">${escapeHtml(item.subtitle)}</span>`
              : "";
            const trailing = item.trailing
              ? `<span class="symbian-list__trailing">${escapeHtml(item.trailing)}</span>`
              : "";
            const badge =
              typeof item.badge === "number"
                ? `<span class="symbian-list__badge">${item.badge}</span>`
                : "";
            return `
              <li class="symbian-list__item${selected}${unread}">
                <span class="symbian-list__main">
                  ${badge}
                  <span class="symbian-icon-chip">${escapeHtml(item.token || "--")}</span>
                  <span class="symbian-list__label-wrap">
                    <span class="symbian-list__label">${escapeHtml(item.label)}</span>
                    ${subtitle}
                  </span>
                </span>
                ${trailing}
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function renderContactsApp() {
    const contacts = getFilteredContacts();
    const listRows = contacts.map((contact) => ({
      token: "CT",
      label: contact.name,
      subtitle: `${contact.type} · ${contact.number}`,
      trailing: "",
    }));

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Contacts</h2>
        <p class="symbian-app-header__subtitle">${contacts.length} entries</p>
      </header>
      <section class="symbian-app-body">
        <div class="symbian-toolbar">
          <span class="symbian-toolbar__label">Search</span>
          <span class="symbian-toolbar__value">${escapeHtml(state.apps.contacts.query || "All contacts")}</span>
        </div>
        ${renderListRows(listRows, state.apps.contacts.cursor)}
      </section>
    `;
  }

  function renderMessagingApp() {
    const messaging = state.apps.messaging;

    if (messaging.mode === "compose") {
      return `
        <header class="symbian-app-header">
          <h2 class="symbian-app-header__title">New message</h2>
          <p class="symbian-app-header__subtitle">Compose SMS</p>
        </header>
        <section class="symbian-app-body">
          <div class="symbian-form">
            <div class="symbian-form__row">
              <span class="symbian-form__label">To</span>
              <div class="symbian-form__field">${escapeHtml(
                messaging.recipient || (messaging.focus === "recipient" ? "_" : ""),
              )}</div>
            </div>
            <div class="symbian-form__row">
              <span class="symbian-form__label">Message</span>
              <div class="symbian-form__field">${escapeHtml(
                messaging.body || (messaging.focus === "body" ? "_" : ""),
              )}</div>
            </div>
          </div>
          <p class="symbian-status-message">Focus: ${messaging.focus} | Input: ${messaging.inputMode.toUpperCase()}</p>
        </section>
      `;
    }

    const rows = messaging.messages.map((message) => ({
      token: "MS",
      label: message.from,
      subtitle: message.body,
      trailing: message.time,
      unread: message.unread,
    }));

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Messaging</h2>
        <p class="symbian-app-header__subtitle">Inbox</p>
      </header>
      <section class="symbian-app-body">
        ${renderListRows(rows, messaging.cursor)}
      </section>
    `;
  }

  function renderCalendarApp() {
    const selectedDate = state.apps.calendar.selectedDate;
    const eventsByDate = getEventsByDate();
    const rows = buildCalendarRows(selectedDate, eventsByDate);
    const selectedEvents = getCurrentCalendarEvents();

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Calendar</h2>
        <p class="symbian-app-header__subtitle">${escapeHtml(
          selectedDate.toLocaleString("en-US", { month: "long", year: "numeric" }),
        )}</p>
      </header>
      <section class="symbian-app-body symbian-calendar-grid-pane">
        <table class="symbian-calendar-grid" aria-label="Month grid">
          <thead>
            <tr>
              <th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th><th>Su</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                ${row
                  .map((cell) => {
                    const classNames = ["symbian-calendar-grid__cell"];
                    if (cell.isOutside) {
                      classNames.push("is-outside");
                    }
                    if (cell.isSelected) {
                      classNames.push("is-selected");
                    }
                    if (cell.hasEvent) {
                      classNames.push("has-event");
                    }

                    return `<td class="${classNames.join(" ")}"><span class="symbian-calendar-grid__day">${cell.day}</span></td>`;
                  })
                  .join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <p class="symbian-status-message">${selectedEvents.length > 0 ? escapeHtml(selectedEvents.map((item) => `${item.time} ${item.title}`).join(" | ")) : "No events"}</p>
      </section>
    `;
  }

  function renderMusicApp() {
    const track = getCurrentTrack();
    const progressPercent = clamp(Math.round((state.apps.music.progressSec / track.durationSec) * 100), 0, 100);

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Music player</h2>
        <p class="symbian-app-header__subtitle">All songs</p>
      </header>
      <section class="symbian-app-body">
        <section class="symbian-now-playing symbian-pane">
          <p class="symbian-now-playing__title">${escapeHtml(track.title)}</p>
          <p class="symbian-now-playing__artist">${escapeHtml(track.artist)}</p>
          <p class="symbian-now-playing__progress">${formatDuration(state.apps.music.progressSec)} / ${formatDuration(track.durationSec)}</p>
          <div class="symbian-meter" style="--symbian-meter-value:${progressPercent}%"><div class="symbian-meter__fill"></div></div>
          <p class="symbian-now-playing__state">${state.apps.music.playing ? "Playing" : "Paused"} · Volume ${state.apps.music.volume}/10</p>
        </section>
      </section>
    `;
  }

  function renderBrowserApp() {
    const rows = BOOKMARKS.map((bookmark) => ({
      token: "WB",
      label: bookmark.title,
      subtitle: bookmark.url,
      trailing: "",
    }));

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Web</h2>
        <p class="symbian-app-header__subtitle">S60 browser</p>
      </header>
      <section class="symbian-app-body">
        <section class="symbian-browser-address symbian-pane">
          <p class="symbian-browser-address__title">${escapeHtml(state.apps.browser.currentTitle)}</p>
          <p class="symbian-browser-address__url">${escapeHtml(state.apps.browser.currentUrl)}</p>
          <p class="symbian-browser-address__state">State: ${escapeHtml(state.apps.browser.state)}</p>
        </section>
        ${renderListRows(rows, state.apps.browser.cursor)}
      </section>
    `;
  }

  function renderGalleryApp() {
    const cells = GALLERY_ITEMS.map((item, index) => {
      const selected = index === state.apps.gallery.cursor ? " is-selected" : "";
      return `
        <li class="symbian-thumb-grid__item${selected}">
          <span class="symbian-thumb-grid__preview">${escapeHtml(item.token)}</span>
          <span class="symbian-thumb-grid__label">${escapeHtml(item.label)}</span>
        </li>
      `;
    }).join("");

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Gallery</h2>
        <p class="symbian-app-header__subtitle">Camera roll</p>
      </header>
      <section class="symbian-app-body">
        <ul class="symbian-thumb-grid">${cells}</ul>
      </section>
    `;
  }

  function renderNotesApp() {
    const selectedNote = state.apps.notes.notes[state.apps.notes.cursor] || null;
    const rows = state.apps.notes.notes.map((note) => ({
      token: "NT",
      label: note.title,
      subtitle: note.text,
      trailing: "",
    }));

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Notes</h2>
        <p class="symbian-app-header__subtitle">${state.apps.notes.notes.length} items</p>
      </header>
      <section class="symbian-app-body symbian-notes-layout">
        <section>
          ${renderListRows(rows, state.apps.notes.cursor)}
        </section>
        <section class="symbian-notes__preview-pane symbian-pane">
          <h3 class="symbian-pane__title">${escapeHtml(selectedNote?.title || "No note")}</h3>
          <p class="symbian-notes__preview-text">${escapeHtml(selectedNote?.text || "Select a note.")}</p>
        </section>
      </section>
    `;
  }

  function renderSettingsApp() {
    const settings = state.apps.settings;
    const rows = [
      { label: "Profile", value: PROFILES[settings.profileIndex], token: "PF" },
      { label: "Theme", value: THEMES[settings.themeIndex], token: "TH" },
      { label: "Network mode", value: NETWORK_MODES[settings.networkIndex], token: "NW" },
      { label: "Keypad tones", value: KEYPAD_TONES[settings.keypadToneIndex], token: "KT" },
    ];

    const listMarkup = renderListRows(
      rows.map((row) => ({
        token: row.token,
        label: row.label,
        subtitle: row.value,
      })),
      settings.cursor,
    );

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Settings</h2>
        <p class="symbian-app-header__subtitle">Phone setup</p>
      </header>
      <section class="symbian-app-body symbian-settings-layout">
        <section>${listMarkup}</section>
        <section class="symbian-pane">
          <h3 class="symbian-pane__title">Current profile</h3>
          <p class="symbian-pane__text">${escapeHtml(PROFILES[settings.profileIndex])}</p>
          <p class="symbian-pane__text">Theme: ${escapeHtml(THEMES[settings.themeIndex])}</p>
          <p class="symbian-pane__text">Network: ${escapeHtml(NETWORK_MODES[settings.networkIndex])}</p>
          <p class="symbian-pane__text">Tones: ${escapeHtml(KEYPAD_TONES[settings.keypadToneIndex])}</p>
        </section>
      </section>
    `;
  }

  function renderFilesApp() {
    const rows = FILE_VOLUMES.map((volume) => ({
      token: "FM",
      label: volume.name,
      subtitle: volume.value,
      trailing: "",
    }));

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">File manager</h2>
        <p class="symbian-app-header__subtitle">Storage devices</p>
      </header>
      <section class="symbian-app-body">
        ${renderListRows(rows, state.apps.files.cursor)}
        <section class="symbian-storage-summary symbian-pane">
          <ul class="symbian-storage-summary__list">
            ${FILE_VOLUMES.map(
              (volume) => `
              <li class="symbian-storage-summary__item">
                <span class="symbian-storage-summary__name">${escapeHtml(volume.name)}</span>
                <span class="symbian-storage-summary__value">${escapeHtml(volume.value)}</span>
              </li>
            `,
            ).join("")}
          </ul>
        </section>
      </section>
    `;
  }

  function renderConnectivityApp() {
    const rows = CONNECTIVITY_ROWS.map((row) => {
      const enabled = Boolean(state.apps.connectivity.toggles[row.key]);
      return {
        token: "CN",
        label: row.label,
        subtitle: enabled ? row.detailOn : row.detailOff,
      };
    });

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Connectivity</h2>
        <p class="symbian-app-header__subtitle">Network services</p>
      </header>
      <section class="symbian-app-body">
        ${renderListRows(rows, state.apps.connectivity.cursor)}
      </section>
    `;
  }

  function renderToolsApp() {
    const rows = TOOLS.map((tool) => ({
      token: "TL",
      label: tool.label,
      subtitle: tool.subtitle,
    }));

    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Tools</h2>
        <p class="symbian-app-header__subtitle">Utilities</p>
      </header>
      <section class="symbian-app-body">
        ${renderListRows(rows, state.apps.tools.cursor)}
        <p class="symbian-status-message">Run Task switcher to jump between running apps.</p>
      </section>
    `;
  }

  function renderClockApp() {
    return `
      <header class="symbian-app-header">
        <h2 class="symbian-app-header__title">Clock</h2>
        <p class="symbian-app-header__subtitle">Time and alarms</p>
      </header>
      <section class="symbian-app-body">
        <section class="symbian-pane">
          <h3 class="symbian-pane__title">Current time</h3>
          <p class="symbian-pane__text">${escapeHtml(formatDateLong(state.now))}</p>
          <p class="symbian-pane__text">${escapeHtml(formatClock(state.now))}</p>
        </section>
        <section class="symbian-pane">
          <h3 class="symbian-pane__title">Alarm</h3>
          <p class="symbian-pane__text">${escapeHtml(state.apps.clock.alarmTime)}</p>
          <p class="symbian-pane__text">Left softkey increments alarm hour.</p>
        </section>
      </section>
    `;
  }

  function renderCurrentAppScreen() {
    let appContent = "";

    if (state.currentAppId === "contacts") {
      appContent = renderContactsApp();
    } else if (state.currentAppId === "messaging") {
      appContent = renderMessagingApp();
    } else if (state.currentAppId === "calendar") {
      appContent = renderCalendarApp();
    } else if (state.currentAppId === "music") {
      appContent = renderMusicApp();
    } else if (state.currentAppId === "browser") {
      appContent = renderBrowserApp();
    } else if (state.currentAppId === "gallery") {
      appContent = renderGalleryApp();
    } else if (state.currentAppId === "notes") {
      appContent = renderNotesApp();
    } else if (state.currentAppId === "settings") {
      appContent = renderSettingsApp();
    } else if (state.currentAppId === "files") {
      appContent = renderFilesApp();
    } else if (state.currentAppId === "connectivity") {
      appContent = renderConnectivityApp();
    } else if (state.currentAppId === "tools") {
      appContent = renderToolsApp();
    } else if (state.currentAppId === "clock") {
      appContent = renderClockApp();
    } else {
      appContent = `
        <header class="symbian-app-header">
          <h2 class="symbian-app-header__title">App</h2>
          <p class="symbian-app-header__subtitle">Unknown application</p>
        </header>
        <section class="symbian-app-body">
          <p class="symbian-empty">Application data is unavailable.</p>
        </section>
      `;
    }

    return `<main class="symbian-screen symbian-screen--app">${appContent}</main>`;
  }

  function renderTaskSwitcherDialog() {
    const taskApps = getTaskSwitcherApps();

    return `
      <div class="symbian-dialog-layer" aria-modal="true" role="dialog">
        <section class="symbian-dialog">
          <h3 class="symbian-dialog__title">Task switcher</h3>
          <div class="symbian-dialog__content">
            ${taskApps.length === 0
              ? "<p class=\"symbian-empty\">No running apps.</p>"
              : `<ul class=\"symbian-list\">${taskApps
                  .map((appId, index) => {
                    const app = getAppMeta(appId);
                    if (!app) {
                      return "";
                    }

                    const selected = index === state.taskSwitcher.cursor ? " is-selected" : "";
                    return `
                        <li class="symbian-list__item${selected}" data-action="task-select" data-index="${index}">
                          <span class="symbian-list__main">
                            <span class="symbian-icon-chip">${escapeHtml(app.token)}</span>
                            <span class="symbian-list__label-wrap">
                              <span class="symbian-list__label">${escapeHtml(app.label)}</span>
                              <span class="symbian-list__subtitle">${escapeHtml(app.subtitle)}</span>
                            </span>
                          </span>
                          <span class="symbian-list__trailing">Run</span>
                        </li>
                      `;
                  })
                  .join("")}</ul>`}
          </div>
        </section>
      </div>
    `;
  }

  function renderPopupAndToast() {
    return `
      ${state.popup ? `<div class="symbian-popup is-${escapeHtml(state.popup.variant)}">${escapeHtml(state.popup.message)}</div>` : ""}
      ${state.toast ? `<div class="symbian-toast is-${escapeHtml(state.toast.variant)}">${escapeHtml(state.toast.message)}</div>` : ""}
    `;
  }

  function renderMainScreen() {
    if (state.screen === "boot") {
      return renderBootScreen();
    }

    if (state.screen === "standby") {
      return renderStandbyScreen();
    }

    if (state.screen === "menu") {
      return renderMenuScreen();
    }

    return renderCurrentAppScreen();
  }

  function render() {
    if (!mounted) {
      return;
    }

    normalizeAppCursors();

    root.innerHTML = `
      <div class="symbian-shell" role="application" aria-label="Symbian mobile shell">
        <section class="symbian-display">
          <div class="symbian-wallpaper${state.screen === "standby" ? " symbian-wallpaper--idle" : ""}"></div>
          ${renderStatusBar()}
          ${renderMainScreen()}
          ${renderSoftkeys()}
          ${renderPopupAndToast()}
          ${state.taskSwitcher.open ? renderTaskSwitcherDialog() : ""}
        </section>
        <nav class="symbian-touch-nav" aria-label="Directional navigation">
          <button type="button" class="symbian-touch-nav__key symbian-touch-nav__key--up" data-action="nav" data-direction="up">▲</button>
          <button type="button" class="symbian-touch-nav__key symbian-touch-nav__key--left" data-action="nav" data-direction="left">◀</button>
          <button type="button" class="symbian-touch-nav__key symbian-touch-nav__key--ok" data-action="softkey" data-side="center">OK</button>
          <button type="button" class="symbian-touch-nav__key symbian-touch-nav__key--right" data-action="nav" data-direction="right">▶</button>
          <button type="button" class="symbian-touch-nav__key symbian-touch-nav__key--down" data-action="nav" data-direction="down">▼</button>
        </nav>
      </div>
    `;
  }

  function startHeartbeat() {
    setManagedInterval(() => {
      clockTickCount += 1;

      if (state.screen !== "boot") {
        state.now = new Date();

        if (clockTickCount % 15 === 0) {
          const variance = Math.random() > 0.7 ? -1 : 0;
          state.signalBars = clamp(state.signalBars + variance, 2, 4);
        }

        if (clockTickCount % 40 === 0) {
          state.batteryLevel = clamp(state.batteryLevel - 1, 8, 100);
        }
      }

      if (state.apps.music.playing) {
        const track = getCurrentTrack();
        state.apps.music.progressSec += 1;

        if (state.apps.music.progressSec >= track.durationSec) {
          state.apps.music.trackIndex = cycleIndex(state.apps.music.trackIndex, TRACKS.length, 1);
          state.apps.music.progressSec = 0;
        }
      }

      render();
    }, 1000);
  }

  function mount() {
    if (mounted) {
      return;
    }

    mounted = true;

    root.classList.add("shell-root");
    root.dataset.runtime = "mobile-symbian";
    root.tabIndex = -1;

    root.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown, true);

    startHeartbeat();
    startBootSequence();
    render();

    setManagedTimeout(() => {
      root.focus({ preventScroll: true });
    }, 0);
  }

  function unmount() {
    if (!mounted) {
      return;
    }

    mounted = false;

    clearManagedTimeout(toastTimeoutId);
    clearManagedTimeout(popupTimeoutId);
    toastTimeoutId = null;
    popupTimeoutId = null;

    clearAllTimers();

    root.removeEventListener("click", handleClick);
    window.removeEventListener("keydown", handleKeyDown, true);

    delete root.dataset.runtime;
    root.innerHTML = "";
  }

  return {
    mount,
    unmount,
  };
}
