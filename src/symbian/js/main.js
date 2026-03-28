import { EventBus } from "./core/eventBus.js";
import { AppManager } from "./core/appManager.js";
import {
  MockFileSystem,
  buildMockFileSystemFromFileLayer,
} from "./core/mockFs.js";
import { DataStore } from "./core/dataStore.js";
import {
  APP_DEFINITIONS,
  resolveSymbianAssetPath,
} from "./apps/apps.js";

const OS_STATE = {
  BOOT: "boot",
  IDLE: "idle",
  APP: "app",
  SWITCH: "switch",
  NOTIFY: "notify"
};

const PAGE_ORDER = ["Communications", "Organizer", "Media", "Tools"];
const DEFAULT_ASSET_BASE_PATH = "./symbian";
const ROOT_DATA_RUNTIME = "mobile-symbian-uiq-p1i";
const DESKTOP_SWITCH_TARGETS = Object.freeze([
  Object.freeze({
    id: "desktop-win95",
    label: "Switch to Windows 95",
  }),
  Object.freeze({
    id: "desktop-winxp-sp2",
    label: "Switch to Windows XP SP2",
  }),
  Object.freeze({
    id: "desktop-ubuntu-server",
    label: "Switch to Ubuntu Server",
  }),
]);
const SYMBIAN_RUNTIME_TEMPLATE = `
  <div id="os-root">
    <header class="status-bar" aria-label="Status bar">
      <div class="status-left">
        <div id="signal-bars" class="signal-bars" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <span id="status-network" class="status-network">3G</span>
        <span id="status-flight" class="status-chip hidden">FLT</span>
      </div>

      <div id="status-time" class="status-time">00:00</div>

      <div class="status-right">
        <span id="status-profile" class="status-mini hidden">SL</span>
        <span id="status-wlan" class="status-mini hidden">WL</span>
        <span id="status-bt" class="status-mini hidden">BT</span>
        <span id="status-notify" class="status-badge hidden">0</span>
        <span id="running-dot" class="running-dot hidden" aria-hidden="true"></span>
        <div class="battery" aria-label="Battery">
          <div id="battery-level" class="battery-level"></div>
        </div>
      </div>
    </header>

    <main id="main-content" class="main-content" aria-live="polite"></main>

    <footer class="cba" aria-label="Control button area">
      <button id="cba-left" class="cba-btn" type="button">More</button>
      <button id="cba-center" class="cba-btn" type="button">Select</button>
      <button id="cba-right" class="cba-btn" type="button">Back</button>
    </footer>
  </div>

  <div id="overlay-host"></div>
  <div id="banner-host" class="banner-host"></div>
`;

function collectRuntimeElements(root) {
  const query = (selector) => root.querySelector(selector);
  const elements = {
    main: query("#main-content"),
    time: query("#status-time"),
    network: query("#status-network"),
    flight: query("#status-flight"),
    signalBars: query("#signal-bars"),
    profile: query("#status-profile"),
    wlan: query("#status-wlan"),
    bluetooth: query("#status-bt"),
    notifyBadge: query("#status-notify"),
    batteryLevel: query("#battery-level"),
    runningDot: query("#running-dot"),
    softkeyLeft: query("#cba-left"),
    softkeyCenter: query("#cba-center"),
    softkeyRight: query("#cba-right"),
    overlayHost: query("#overlay-host"),
    bannerHost: query("#banner-host"),
  };

  for (const [key, element] of Object.entries(elements)) {
    if (!(element instanceof HTMLElement)) {
      throw new Error(`Symbian runtime is missing required element "${key}".`);
    }
  }

  return elements;
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });
}

function formatRelative(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) {
    return "now";
  }
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}m`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}h`;
  }
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`;
}

class SymbianSimulation {
  constructor({ root, fs, dataStore, requestSystemSwitch } = {}) {
    if (!(root instanceof HTMLElement)) {
      throw new Error("SymbianSimulation requires a valid root element.");
    }

    this.root = root;
    this.requestSystemSwitch = requestSystemSwitch;
    this.elements = collectRuntimeElements(root);

    this.state = OS_STATE.BOOT;
    this.bus = new EventBus();
    this.appManager = new AppManager();
    this.fs = fs || new MockFileSystem();
    this.dataStore = dataStore || new DataStore();

    this.homeApps = [];
    this.homeState = {
      pageIndex: 0,
      appSelection: 0
    };

    this.taskEntries = [];
    this.taskSelection = 0;

    this.currentAppId = null;
    this.currentApp = null;

    this.notificationSelection = 0;
    this.notificationReturnTarget = { type: "home" };

    this.menuState = null;
    this.softkeys = { left: "", center: "", right: "" };

    this.toastTimeout = null;
    this.bannerTimeout = null;
    this.bootTimer = null;
    this.destroyed = false;

    this.device = {
      batteryPercent: 86,
      signalLevel: 4
    };

    this.onSoftkeyLeftClick = () => this.handleSoftkey("left");
    this.onSoftkeyCenterClick = () => this.handleSoftkey("center");
    this.onSoftkeyRightClick = () => this.handleSoftkey("right");
    this.onDocumentWheel = (event) => {
      if (this.state === OS_STATE.BOOT || Math.abs(event.deltaY) < 4) {
        return;
      }

      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      this.navigateVertical(direction);
    };
    this.onDocumentKeydown = (event) => this.handleKeydown(event);
    this.onWindowResize = () => {
      if (this.state === OS_STATE.IDLE) {
        this.renderHome();
      }
    };

    this.registerApps();
    this.bindEvents();
    this.applyTheme();
    this.updateClock();
    this.renderStatusBar();

    this.clockTimer = window.setInterval(() => this.updateClock(), 1000);
    this.deviceTimer = window.setInterval(() => this.tickDevice(), 42000);
    this.ambientTimer = window.setInterval(() => this.generateAmbientEvent(), 70000);
  }

  registerApps() {
    APP_DEFINITIONS.forEach((definition) => {
      const manifest = {
        ...definition.manifest,
        icon: resolveSymbianAssetPath(definition.manifest.icon),
      };

      this.appManager.register(manifest, definition.createApp);
    });

    const categoryWeight = new Map(PAGE_ORDER.map((name, index) => [name, index]));
    this.homeApps = this.appManager.getManifests().sort((a, b) => {
      const aWeight = categoryWeight.has(a.page) ? categoryWeight.get(a.page) : 999;
      const bWeight = categoryWeight.has(b.page) ? categoryWeight.get(b.page) : 999;
      return (
        aWeight - bWeight ||
        (a.order || 999) - (b.order || 999) ||
        a.name.localeCompare(b.name)
      );
    });
  }

  bindEvents() {
    this.elements.softkeyLeft.addEventListener("click", this.onSoftkeyLeftClick);
    this.elements.softkeyCenter.addEventListener("click", this.onSoftkeyCenterClick);
    this.elements.softkeyRight.addEventListener("click", this.onSoftkeyRightClick);
    document.addEventListener("wheel", this.onDocumentWheel, { passive: false });
    document.addEventListener("keydown", this.onDocumentKeydown);
    window.addEventListener("resize", this.onWindowResize);
  }

  unbindEvents() {
    this.elements.softkeyLeft.removeEventListener("click", this.onSoftkeyLeftClick);
    this.elements.softkeyCenter.removeEventListener("click", this.onSoftkeyCenterClick);
    this.elements.softkeyRight.removeEventListener("click", this.onSoftkeyRightClick);
    document.removeEventListener("wheel", this.onDocumentWheel);
    document.removeEventListener("keydown", this.onDocumentKeydown);
    window.removeEventListener("resize", this.onWindowResize);
  }

  boot() {
    this.closeMenu(false);
    this.currentAppId = null;
    this.currentApp = null;
    this.state = OS_STATE.BOOT;

    this.setSoftkeys({ left: "", center: "", right: "" });
    this.elements.main.innerHTML = `
      <section class="boot-screen">
        <div class="boot-title">Sony Ericsson</div>
        <div class="boot-title-sub">P1i - UIQ 3.0</div>
        <div class="boot-loader" role="presentation"><div class="boot-loader-fill"></div></div>
        <div class="boot-subtitle">Loading phone services...</div>
      </section>
    `;

    window.clearTimeout(this.bootTimer);
    this.bootTimer = window.setTimeout(() => {
      this.showHome();
      this.showToast("Phone started.");
    }, 1450);
  }

  showHome() {
    this.closeMenu(false);

    if (this.currentAppId) {
      this.appManager.deactivate(this.currentAppId, this.createAppApi());
      this.currentAppId = null;
      this.currentApp = null;
    }

    this.state = OS_STATE.IDLE;
    this.homeState.pageIndex = clamp(this.homeState.pageIndex, 0, Math.max(this.getHomePageCount() - 1, 0));
    this.homeState.appSelection = clamp(this.homeState.appSelection, 0, Math.max(this.homeApps.length - 1, 0));
    this.renderHome();
    this.renderStatusBar();
  }

  getHomeColumns() {
    return 3;
  }

  getHomeRows() {
    return window.innerHeight >= 760 ? 4 : 3;
  }

  getAppsPerPage() {
    return this.getHomeColumns() * this.getHomeRows();
  }

  getHomePageCount() {
    const perPage = this.getAppsPerPage();
    if (!this.homeApps.length || !perPage) {
      return 1;
    }
    return Math.ceil(this.homeApps.length / perPage);
  }

  getHomePageSlice(pageIndex = this.homeState.pageIndex) {
    const perPage = this.getAppsPerPage();
    const maxPage = Math.max(this.getHomePageCount() - 1, 0);
    const safePage = clamp(pageIndex, 0, maxPage);
    const start = safePage * perPage;
    const end = start + perPage;
    return {
      page: safePage,
      start,
      end,
      apps: this.homeApps.slice(start, end)
    };
  }

  getAppIcon(appId) {
    const manifest = this.appManager.getManifest(appId);
    return manifest?.icon || resolveSymbianAssetPath("/visuals-to-use/symbian/app.png");
  }

  openSelectedHomeApp() {
    this.homeState.appSelection = clamp(this.homeState.appSelection, 0, Math.max(this.homeApps.length - 1, 0));
    const app = this.homeApps[this.homeState.appSelection];
    if (!app) {
      return false;
    }

    this.openApp(app.id);
    return true;
  }

  renderHome() {
    const snapshot = this.dataStore.snapshot();
    const unread = this.getUnreadNotificationsCount(snapshot);
    const runningCount = this.appManager.listRunning().length;
    const unreadMessages = snapshot.messages.folders.inbox.filter((item) => !item.read).length;
    const now = Date.now();
    const pages = this.getHomePageCount();
    const perPage = this.getAppsPerPage();

    this.homeState.pageIndex = clamp(this.homeState.pageIndex, 0, Math.max(pages - 1, 0));
    this.homeState.appSelection = clamp(this.homeState.appSelection, 0, Math.max(this.homeApps.length - 1, 0));
    this.homeState.pageIndex = clamp(
      Math.floor(this.homeState.appSelection / Math.max(perPage, 1)),
      0,
      Math.max(pages - 1, 0)
    );

    const currentSlice = this.getHomePageSlice(this.homeState.pageIndex);
    const localSelection = this.homeState.appSelection - currentSlice.start;

    const tiles = currentSlice.apps
      .map(
        (app, index) => `
          <button class="app-tile ${index === localSelection ? "focused" : ""}" data-home-index="${currentSlice.start + index}" type="button">
            <img class="app-icon" src="${app.icon}" alt="${app.name}" loading="lazy" />
            <span class="app-label">${app.name}</span>
          </button>`
      )
      .join("");

    const indicators = Array.from({ length: pages })
      .map((_, index) => `<span class="page-dot ${index === currentSlice.page ? "active" : ""}"></span>`)
      .join("");

    this.elements.main.innerHTML = `
      <section class="home-screen">
        <div class="home-wallpaper-layer"></div>
        <div class="home-overlay">
          <div class="home-headline">
            <div>
              <div id="home-live-time" class="home-live-time">${formatTime(now)}</div>
              <div id="home-live-date" class="home-live-date">${formatDate(now)}</div>
            </div>
            <div class="home-counters">
              <span>${unreadMessages} SMS</span>
              <span>${unread} Alerts</span>
              <span>${runningCount} Tasks</span>
            </div>
          </div>
          <div class="home-grid">${tiles || '<div class="uiq-empty">No applications.</div>'}</div>
          <div class="page-indicator-wrap">
            <div class="page-indicator">${indicators}</div>
            <div class="page-caption">Apps ${currentSlice.page + 1}/${pages}</div>
          </div>
        </div>
      </section>
    `;

    this.elements.main.querySelectorAll("[data-home-index]").forEach((element) => {
      element.addEventListener("click", () => {
        this.homeState.appSelection = Number(element.dataset.homeIndex);
        this.openSelectedHomeApp();
      });
    });

    this.setSoftkeys({ left: "More", center: "Open", right: "Task" });
  }

  openApp(appId) {
    const manifest = this.appManager.getManifest(appId);
    if (!manifest) {
      return;
    }

    this.closeMenu(false);

    if (this.currentAppId && this.currentAppId !== appId) {
      this.appManager.deactivate(this.currentAppId, this.createAppApi(this.currentAppId));
    }

    this.currentAppId = appId;
    this.currentApp = this.appManager.launch(appId, this.createAppApi(appId));
    this.state = OS_STATE.APP;

    this.renderCurrentApp();
    this.renderStatusBar();
  }

  createAppApi(appId = this.currentAppId) {
    return {
      bus: this.bus,
      fs: this.fs,
      toast: (message) => this.showToast(message),
      rerender: () => this.renderCurrentApp(),
      goHome: () => this.showHome(),
      openTaskManager: () => this.showTaskManager(),
      openApp: (id) => this.openApp(id),
      now: () => Date.now(),
      formatTime,
      formatDate,
      formatRelative,
      getData: () => this.dataStore.snapshot(),
      updateData: (mutator) => this.mutateData(mutator, false),
      notify: (payload) => this.pushNotification(payload),
      getDeviceStatus: () => ({
        batteryPercent: this.device.batteryPercent,
        signalLevel: this.device.signalLevel,
        memoryFree: this.getMemoryFree()
      }),
      updateSettings: (mutator) => this.updateSettings(mutator, false),
      appId
    };
  }

  renderCurrentApp() {
    if (!this.currentApp || !this.currentAppId) {
      this.showHome();
      return;
    }

    const shell = document.createElement("section");
    shell.className = "app-shell";

    this.elements.main.innerHTML = "";
    this.elements.main.appendChild(shell);

    const appApi = this.createAppApi(this.currentAppId);
    this.currentApp.render?.(shell, appApi);

    const softkeys = this.currentApp.getSoftkeys?.(appApi) || {};
    this.setSoftkeys({
      left: softkeys.left || "More",
      center: softkeys.center || "Select",
      right: softkeys.right || "Back"
    });
  }

  showTaskManager() {
    this.closeMenu(false);

    if (this.currentAppId) {
      this.appManager.deactivate(this.currentAppId, this.createAppApi(this.currentAppId));
      this.currentAppId = null;
      this.currentApp = null;
    }

    this.state = OS_STATE.SWITCH;

    const running = this.appManager.listRunning();
    this.taskEntries = [
      {
        id: "__home__",
        name: "Home",
        icon: resolveSymbianAssetPath("/visuals-to-use/symbian/app.png"),
      },
      ...running,
    ];
    this.taskSelection = clamp(this.taskSelection, 0, Math.max(this.taskEntries.length - 1, 0));

    this.renderTaskManager();
    this.setSoftkeys({ left: "More", center: "Switch", right: "Back" });
    this.renderStatusBar();
  }

  renderTaskManager() {
    const memoryFree = this.getMemoryFree();
    const rows = this.taskEntries
      .map((task, index) => {
        const icon = task.icon
          ? `<img class="task-item-icon" src="${task.icon}" alt="${task.name}" loading="lazy" />`
          : '<div class="task-item-icon task-item-icon-empty"></div>';

        const meta =
          task.id === "__home__"
            ? "Home screen"
            : `Running - ${task.launchedAt ? formatTime(task.launchedAt) : ""}`;

        return `
          <li class="task-item ${index === this.taskSelection ? "selected" : ""}" data-task-index="${index}">
            ${icon}
            <div>
              <div class="task-item-name">${task.name}</div>
              <div class="task-item-meta">${meta}</div>
            </div>
          </li>`;
      })
      .join("");

    this.elements.main.innerHTML = `
      <section class="task-screen">
        <div class="task-title">Task Manager</div>
        <div class="task-memory">Estimated memory free: ${memoryFree}%</div>
        <ul class="task-list">${rows || '<li class="task-empty">No running apps.</li>'}</ul>
      </section>
    `;

    this.elements.main.querySelectorAll("[data-task-index]").forEach((element) => {
      element.addEventListener("click", () => {
        this.taskSelection = Number(element.dataset.taskIndex);
        this.switchToSelectedTask();
      });
    });
  }

  switchToSelectedTask() {
    const task = this.taskEntries[this.taskSelection];
    if (!task) {
      return;
    }

    if (task.id === "__home__") {
      this.showHome();
      return;
    }

    this.openApp(task.id);
  }

  showNotificationCenter(returnTarget = null) {
    this.closeMenu(false);

    if (returnTarget) {
      this.notificationReturnTarget = returnTarget;
    } else if (this.state === OS_STATE.APP && this.currentAppId) {
      this.notificationReturnTarget = { type: "app", appId: this.currentAppId };
    } else if (this.state === OS_STATE.SWITCH) {
      this.notificationReturnTarget = { type: "tasks" };
    } else {
      this.notificationReturnTarget = { type: "home" };
    }

    if (this.currentAppId) {
      this.appManager.deactivate(this.currentAppId, this.createAppApi(this.currentAppId));
      this.currentAppId = null;
      this.currentApp = null;
    }

    this.state = OS_STATE.NOTIFY;
    this.renderNotificationCenter();
    this.setSoftkeys({ left: "More", center: "Open", right: "Back" });
  }

  returnFromNotificationCenter() {
    const target = this.notificationReturnTarget;
    if (target?.type === "app" && target.appId) {
      this.openApp(target.appId);
      return;
    }

    if (target?.type === "tasks") {
      this.showTaskManager();
      return;
    }

    this.showHome();
  }

  getNotifications(snapshot = this.dataStore.snapshot()) {
    return [...snapshot.notifications].sort((a, b) => b.time - a.time);
  }

  getUnreadNotificationsCount(snapshot = this.dataStore.snapshot()) {
    return snapshot.notifications.filter((item) => !item.read).length;
  }

  renderNotificationCenter() {
    const notifications = this.getNotifications();
    this.notificationSelection = clamp(
      this.notificationSelection,
      0,
      Math.max(notifications.length - 1, 0)
    );

    const rows = notifications
      .map(
        (item, index) => `
          <li class="notification-row ${index === this.notificationSelection ? "selected" : ""} ${item.read ? "" : "unread"}" data-notify-index="${index}">
            <img class="notification-icon" src="${this.getAppIcon(item.appId)}" alt="${escapeHtml(item.title)}" loading="lazy" />
            <div>
              <div class="row-title">${item.read ? "" : "[New] "}${escapeHtml(item.title)}</div>
              <div class="row-subtitle">${escapeHtml(item.body)}</div>
            </div>
            <div class="row-meta">${formatRelative(item.time)}</div>
          </li>`
      )
      .join("");

    this.elements.main.innerHTML = `
      <section class="notify-screen">
        <div class="task-title">Notifications</div>
        <ul class="notify-list">${rows || '<li class="task-empty">No notifications.</li>'}</ul>
      </section>
    `;

    this.elements.main.querySelectorAll("[data-notify-index]").forEach((element) => {
      element.addEventListener("click", () => {
        this.notificationSelection = Number(element.dataset.notifyIndex);
        this.openSelectedNotification();
      });
    });
  }

  openSelectedNotification() {
    const notifications = this.getNotifications();
    const selected = notifications[this.notificationSelection];
    if (!selected) {
      return;
    }

    this.mutateData((data) => {
      const target = data.notifications.find((item) => item.id === selected.id);
      if (target) {
        target.read = true;
      }
    }, false);

    if (selected.appId) {
      this.openApp(selected.appId);
    } else {
      this.renderNotificationCenter();
      this.showToast(selected.body);
    }
  }

  getMemoryFree() {
    const running = this.appManager.listRunning().length;
    const used = running * 12 + Math.floor((100 - this.device.batteryPercent) * 0.4);
    return Math.max(14, 100 - used);
  }

  mutateData(mutator, refreshCurrentView = false) {
    const snapshot = this.dataStore.mutate(mutator);
    this.applyTheme();
    this.renderStatusBar(snapshot);
    if (refreshCurrentView) {
      this.refreshCurrentView();
    }
    return snapshot;
  }

  updateSettings(mutator, refreshCurrentView = false) {
    this.mutateData((data) => {
      mutator(data.settings);
      this.normalizeSettings(data.settings);
    }, refreshCurrentView);
  }

  normalizeSettings(settings) {
    if (settings.profile === "Silent") {
      settings.keyTone = false;
    }

    if (settings.flightMode) {
      settings.wlan = false;
      settings.bluetooth = false;
      this.device.signalLevel = 0;
    } else if (this.device.signalLevel === 0) {
      this.device.signalLevel = 3;
    }

    if (!settings.theme) {
      settings.theme = "blue";
    }
  }

  applyTheme() {
    const theme = this.dataStore.snapshot().settings.theme;
    this.root.classList.toggle("theme-graphite", theme === "graphite");
  }

  requestDesktopSwitch(targetSystemId) {
    if (typeof this.requestSystemSwitch !== "function") {
      return;
    }

    this.requestSystemSwitch(targetSystemId, {
      source: "symbian-home-menu",
      context: {
        autoBoot: true,
      },
    });
  }

  pushNotification(payload) {
    const note = {
      id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: payload?.title || "Notification",
      body: payload?.body || "",
      appId: payload?.appId || "",
      time: Date.now(),
      read: false
    };

    this.mutateData((data) => {
      data.notifications.unshift(note);
      data.notifications = data.notifications.slice(0, 80);
    }, this.state === OS_STATE.NOTIFY);

    this.showBanner(note);

    if (this.state === OS_STATE.IDLE) {
      this.renderHome();
    }
  }

  showBanner(note) {
    this.elements.bannerHost.innerHTML = `
      <div class="notify-banner">
        <div class="notify-banner-title">${escapeHtml(note.title)}</div>
        <div class="notify-banner-body">${escapeHtml(note.body)}</div>
      </div>
    `;

    window.clearTimeout(this.bannerTimeout);
    this.bannerTimeout = window.setTimeout(() => {
      this.elements.bannerHost.innerHTML = "";
    }, 3200);
  }

  generateAmbientEvent() {
    if (this.state === OS_STATE.BOOT) {
      return;
    }

    if (this.getUnreadNotificationsCount() > 10) {
      return;
    }

    const choice = Math.floor(Math.random() * 3);
    const snapshot = this.dataStore.snapshot();

    if (choice === 0) {
      const contact = snapshot.contacts[Math.floor(Math.random() * snapshot.contacts.length)];
      const templates = [
        "Can you send the latest screenshot?",
        "I will be there in 10 minutes.",
        "Please call me when free.",
        "Do not forget the meeting notes."
      ];
      const text = templates[Math.floor(Math.random() * templates.length)];

      this.mutateData((data) => {
        data.messages.folders.inbox.unshift({
          id: `msg-${Date.now()}`,
          contact: contact.name,
          number: contact.number,
          text,
          time: Date.now(),
          read: false
        });
        data.messages.folders.inbox = data.messages.folders.inbox.slice(0, 45);
      }, false);

      this.pushNotification({
        title: contact.name,
        body: text,
        appId: "messages"
      });
      return;
    }

    if (choice === 1) {
      const contact = snapshot.contacts[Math.floor(Math.random() * snapshot.contacts.length)];
      this.mutateData((data) => {
        data.phone.callLog.unshift({
          id: `call-${Date.now()}`,
          name: contact.name,
          number: contact.number,
          direction: "missed",
          time: Date.now(),
          durationSec: 0
        });
        data.phone.callLog = data.phone.callLog.slice(0, 45);
      }, false);

      this.pushNotification({
        title: "Missed call",
        body: `${contact.name} (${contact.number})`,
        appId: "phone"
      });
      return;
    }

    const nextEvent = [...snapshot.calendar.events].sort((a, b) => a.time - b.time)[0];
    if (!nextEvent) {
      return;
    }

    this.pushNotification({
      title: "Reminder",
      body: `${nextEvent.title} at ${formatTime(nextEvent.time)}`,
      appId: "calendar"
    });
  }

  renderStatusBar(snapshot = this.dataStore.snapshot()) {
    const settings = snapshot.settings;
    const unread = this.getUnreadNotificationsCount(snapshot);
    const running = this.appManager.listRunning().length;

    if (settings.flightMode) {
      this.elements.network.textContent = "Offline";
      this.elements.flight.classList.remove("hidden");
    } else {
      this.elements.network.textContent = settings.wlan ? "3G+" : "3G";
      this.elements.flight.classList.add("hidden");
    }

    const level = settings.flightMode ? 0 : clamp(this.device.signalLevel, 0, 4);
    this.elements.signalBars.querySelectorAll("span").forEach((bar, index) => {
      bar.classList.toggle("active", index < level);
    });

    this.elements.profile.classList.toggle("hidden", settings.profile !== "Silent");
    this.elements.wlan.classList.toggle("hidden", !settings.wlan || settings.flightMode);
    this.elements.bluetooth.classList.toggle("hidden", !settings.bluetooth || settings.flightMode);

    if (unread > 0) {
      this.elements.notifyBadge.classList.remove("hidden");
      this.elements.notifyBadge.textContent = unread > 99 ? "99+" : String(unread);
    } else {
      this.elements.notifyBadge.classList.add("hidden");
    }

    this.elements.runningDot.classList.toggle("hidden", running === 0);

    this.elements.batteryLevel.style.width = `${this.device.batteryPercent}%`;
    if (this.device.batteryPercent > 35) {
      this.elements.batteryLevel.style.background = "#7dff8a";
    } else if (this.device.batteryPercent > 20) {
      this.elements.batteryLevel.style.background = "#f1d26f";
    } else {
      this.elements.batteryLevel.style.background = "#ff7d8f";
    }
  }

  tickDevice() {
    const settings = this.dataStore.snapshot().settings;

    if (!settings.flightMode) {
      this.device.signalLevel = clamp(this.device.signalLevel + (Math.floor(Math.random() * 3) - 1), 1, 4);
    } else {
      this.device.signalLevel = 0;
    }

    if (Math.random() > 0.35) {
      this.device.batteryPercent = Math.max(10, this.device.batteryPercent - 1);
    }

    this.renderStatusBar();
  }

  updateClock() {
    const now = Date.now();
    this.elements.time.textContent = formatTime(now);

    const homeTime = this.elements.main.querySelector("#home-live-time");
    const homeDate = this.elements.main.querySelector("#home-live-date");
    if (homeTime) {
      homeTime.textContent = formatTime(now);
    }
    if (homeDate) {
      homeDate.textContent = formatDate(now);
    }
  }

  refreshCurrentView() {
    if (this.state === OS_STATE.IDLE) {
      this.renderHome();
      return;
    }

    if (this.state === OS_STATE.APP) {
      this.renderCurrentApp();
      return;
    }

    if (this.state === OS_STATE.SWITCH) {
      this.showTaskManager();
      return;
    }

    if (this.state === OS_STATE.NOTIFY) {
      this.renderNotificationCenter();
    }
  }

  setSoftkeys({ left = "", center = "", right = "" }) {
    this.softkeys = { left, center, right };
    this.setSoftkeyButton(this.elements.softkeyLeft, left);
    this.setSoftkeyButton(this.elements.softkeyCenter, center);
    this.setSoftkeyButton(this.elements.softkeyRight, right);
  }

  setSoftkeyButton(button, label) {
    button.textContent = label;
    button.classList.toggle("is-empty", !label);
  }

  handleSoftkey(side) {
    if (this.menuState) {
      if (side === "center") {
        this.activateSelectedMenuItem();
      } else {
        this.closeMenu();
      }
      return;
    }

    if (side === "left") {
      this.handleSoftkeyLeft();
      return;
    }

    if (side === "center") {
      this.handleSoftkeyCenter();
      return;
    }

    this.handleSoftkeyRight();
  }

  handleSoftkeyLeft() {
    if (this.state === OS_STATE.IDLE) {
      this.openHomeMenu();
      return;
    }

    if (this.state === OS_STATE.APP) {
      this.openAppMenu();
      return;
    }

    if (this.state === OS_STATE.SWITCH) {
      this.openTaskMenu();
      return;
    }

    if (this.state === OS_STATE.NOTIFY) {
      this.openNotificationMenu();
    }
  }

  handleSoftkeyCenter() {
    if (this.state === OS_STATE.IDLE) {
      this.openSelectedHomeApp();
      return;
    }

    if (this.state === OS_STATE.APP) {
      const handled = this.currentApp?.onCenter?.(this.createAppApi(this.currentAppId));
      if (!handled) {
        this.showToast("No action.");
      }
      return;
    }

    if (this.state === OS_STATE.SWITCH) {
      this.switchToSelectedTask();
      return;
    }

    if (this.state === OS_STATE.NOTIFY) {
      this.openSelectedNotification();
    }
  }

  handleSoftkeyRight() {
    if (this.state === OS_STATE.IDLE) {
      this.showTaskManager();
      return;
    }

    if (this.state === OS_STATE.APP) {
      const handled = this.currentApp?.onBack?.(this.createAppApi(this.currentAppId));
      if (!handled) {
        this.showHome();
      }
      return;
    }

    if (this.state === OS_STATE.SWITCH) {
      this.showHome();
      return;
    }

    if (this.state === OS_STATE.NOTIFY) {
      this.returnFromNotificationCenter();
    }
  }

  openHomeMenu() {
    const unread = this.getUnreadNotificationsCount();
    const running = this.appManager.listRunning().length;

    const items = [
      {
        label: "Previous apps page",
        action: () => this.cycleHomePage(-1)
      },
      {
        label: "Next apps page",
        action: () => this.cycleHomePage(1)
      },
      {
        label: `Notifications (${unread})`,
        action: () => this.showNotificationCenter({ type: "home" })
      },
      {
        label: `Task manager (${running})`,
        action: () => this.showTaskManager()
      },
      {
        label: "Toggle profile",
        action: () => {
          this.updateSettings((settings) => {
            settings.profile = settings.profile === "General" ? "Silent" : "General";
          }, false);
          this.renderHome();
        }
      },
      {
        label: "Reset demo data",
        action: () => {
          this.dataStore.reset();
          this.fs.reset();
          this.appManager.terminateAll();
          this.currentAppId = null;
          this.currentApp = null;
          this.device.batteryPercent = 86;
          this.device.signalLevel = 4;
          this.applyTheme();
          this.showHome();
        }
      },
      {
        label: "Reboot",
        action: () => this.boot()
      }
    ];

    if (typeof this.requestSystemSwitch === "function") {
      items.splice(
        items.length - 2,
        0,
        ...DESKTOP_SWITCH_TARGETS.map((target) => ({
          label: target.label,
          action: () => this.requestDesktopSwitch(target.id),
        })),
      );
    }

    this.openMenu("Home", items);
  }

  openAppMenu() {
    if (!this.currentApp || !this.currentAppId) {
      return;
    }

    const appApi = this.createAppApi(this.currentAppId);
    const appSpecific = this.currentApp.getMenuItems?.(appApi) || [];

    const common = [
      {
        label: "Notifications",
        action: () => this.showNotificationCenter({ type: "app", appId: this.currentAppId })
      },
      {
        label: "Task manager",
        action: () => this.showTaskManager()
      },
      {
        label: "Return to home",
        action: () => this.showHome()
      },
      {
        label: "Close app",
        action: () => {
          this.appManager.terminate(this.currentAppId, this.createAppApi(this.currentAppId));
          this.currentAppId = null;
          this.currentApp = null;
          this.showHome();
        }
      }
    ];

    const title = this.appManager.getManifest(this.currentAppId)?.name || "App";
    this.openMenu(title, [...appSpecific, ...common]);
  }

  openTaskMenu() {
    const selected = this.taskEntries[this.taskSelection];

    const items = [
      {
        label: "Switch",
        action: () => this.switchToSelectedTask()
      },
      {
        label: "Notification center",
        action: () => this.showNotificationCenter({ type: "tasks" })
      },
      {
        label: "Back to home",
        action: () => this.showHome()
      },
      {
        label: "Close all apps",
        action: () => {
          this.appManager.terminateAll();
          this.showTaskManager();
        }
      }
    ];

    if (selected && selected.id !== "__home__") {
      items.splice(1, 0, {
        label: `Close ${selected.name}`,
        action: () => {
          this.appManager.terminate(selected.id, this.createAppApi(selected.id));
          this.showTaskManager();
        }
      });
    }

    this.openMenu("Task Manager", items);
  }

  openNotificationMenu() {
    const items = [
      {
        label: "Mark all as read",
        action: () => {
          this.mutateData((data) => {
            data.notifications.forEach((item) => {
              item.read = true;
            });
          }, true);
        }
      },
      {
        label: "Clear read notifications",
        action: () => {
          this.mutateData((data) => {
            data.notifications = data.notifications.filter((item) => !item.read);
          }, true);
        }
      },
      {
        label: "Clear all notifications",
        action: () => {
          this.mutateData((data) => {
            data.notifications = [];
          }, true);
        }
      }
    ];

    this.openMenu("Notifications", items);
  }

  openMenu(title, items) {
    if (!items.length) {
      return;
    }

    this.closeMenu(false);
    this.menuState = {
      title,
      items,
      selected: 0,
      previousSoftkeys: { ...this.softkeys }
    };

    this.renderMenu();
    this.setSoftkeys({ left: "", center: "Select", right: "Cancel" });
  }

  renderMenu() {
    if (!this.menuState) {
      return;
    }

    const list = this.menuState.items
      .map(
        (item, index) => `
          <li>
            <button class="popup-menu-item ${index === this.menuState.selected ? "selected" : ""}" data-menu-index="${index}" type="button">
              ${item.label}
            </button>
          </li>`
      )
      .join("");

    this.elements.overlayHost.innerHTML = `
      <div class="menu-overlay">
        <div class="popup-menu" role="dialog" aria-label="Options menu">
          <div class="popup-menu-title">${this.menuState.title}</div>
          <ul class="popup-menu-list">${list}</ul>
        </div>
      </div>
    `;

    this.elements.overlayHost.querySelector(".menu-overlay")?.addEventListener("click", (event) => {
      if (event.target.classList.contains("menu-overlay")) {
        this.closeMenu();
      }
    });

    this.elements.overlayHost.querySelectorAll("[data-menu-index]").forEach((element) => {
      element.addEventListener("mouseenter", () => {
        this.menuState.selected = Number(element.dataset.menuIndex);
        this.refreshMenuHighlight();
      });

      element.addEventListener("click", () => {
        this.menuState.selected = Number(element.dataset.menuIndex);
        this.activateSelectedMenuItem();
      });
    });
  }

  refreshMenuHighlight() {
    if (!this.menuState) {
      return;
    }

    this.elements.overlayHost.querySelectorAll("[data-menu-index]").forEach((element, index) => {
      element.classList.toggle("selected", index === this.menuState.selected);
    });
  }

  closeMenu(restoreSoftkeys = true) {
    if (!this.menuState) {
      return;
    }

    const previous = this.menuState.previousSoftkeys;
    this.menuState = null;
    this.elements.overlayHost.innerHTML = "";

    if (restoreSoftkeys) {
      this.setSoftkeys(previous);
    }
  }

  activateSelectedMenuItem() {
    if (!this.menuState) {
      return;
    }

    const item = this.menuState.items[this.menuState.selected];
    const keepOpen = item?.action?.() === false;
    if (!keepOpen) {
      this.closeMenu();
    }
  }

  moveMenuSelection(delta) {
    if (!this.menuState) {
      return;
    }

    const next = clamp(this.menuState.selected + delta, 0, this.menuState.items.length - 1);
    if (next !== this.menuState.selected) {
      this.menuState.selected = next;
      this.refreshMenuHighlight();
    }
  }

  cycleHomePage(direction) {
    if (!this.homeApps.length) {
      return;
    }

    const pages = this.getHomePageCount();
    this.homeState.pageIndex = (this.homeState.pageIndex + direction + pages) % pages;
    const slice = this.getHomePageSlice(this.homeState.pageIndex);
    this.homeState.appSelection = clamp(slice.start, 0, Math.max(this.homeApps.length - 1, 0));
    this.renderHome();
  }

  moveHomeSelection(delta) {
    if (!this.homeApps.length) {
      return;
    }

    const next = clamp(this.homeState.appSelection + delta, 0, this.homeApps.length - 1);
    if (next !== this.homeState.appSelection) {
      this.homeState.appSelection = next;
      const perPage = this.getAppsPerPage();
      this.homeState.pageIndex = Math.floor(next / perPage);
      this.renderHome();
    }
  }

  moveLauncherHorizontal(direction) {
    this.moveHomeSelection(direction);
  }

  moveLauncherVertical(direction) {
    const columns = this.getHomeColumns();
    const step = direction > 0 ? columns : -columns;
    this.moveHomeSelection(step);
  }

  navigateVertical(direction) {
    if (this.menuState) {
      this.moveMenuSelection(direction);
      return;
    }

    if (this.state === OS_STATE.IDLE) {
      this.moveHomeSelection(direction);
      return;
    }

    if (this.state === OS_STATE.APP) {
      this.currentApp?.onWheel?.(direction, this.createAppApi(this.currentAppId));
      return;
    }

    if (this.state === OS_STATE.SWITCH) {
      this.moveTaskSelection(direction);
      return;
    }

    if (this.state === OS_STATE.NOTIFY) {
      this.moveNotificationSelection(direction);
    }
  }

  moveTaskSelection(delta) {
    if (!this.taskEntries.length) {
      return;
    }

    const next = clamp(this.taskSelection + delta, 0, this.taskEntries.length - 1);
    if (next !== this.taskSelection) {
      this.taskSelection = next;
      this.renderTaskManager();
    }
  }

  moveNotificationSelection(delta) {
    const list = this.getNotifications();
    if (!list.length) {
      return;
    }

    const next = clamp(this.notificationSelection + delta, 0, list.length - 1);
    if (next !== this.notificationSelection) {
      this.notificationSelection = next;
      this.renderNotificationCenter();
    }
  }

  handleKeydown(event) {
    const key = event.key;

    if (this.menuState) {
      if (["ArrowUp", "ArrowDown", "Enter", "Escape", "Backspace"].includes(key)) {
        event.preventDefault();
      }

      if (key === "ArrowUp") {
        this.moveMenuSelection(-1);
      } else if (key === "ArrowDown") {
        this.moveMenuSelection(1);
      } else if (key === "Enter") {
        this.activateSelectedMenuItem();
      } else if (key === "Escape" || key === "Backspace") {
        this.closeMenu();
      }
      return;
    }

    if (this.state === OS_STATE.APP && this.currentApp?.onKey) {
      const handled = this.currentApp.onKey(key, this.createAppApi(this.currentAppId));
      if (handled) {
        event.preventDefault();
        return;
      }
    }

    const managed = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Enter",
      "Escape",
      "Backspace",
      "ContextMenu",
      "PageUp",
      "PageDown"
    ];

    if (managed.includes(key)) {
      event.preventDefault();
    } else {
      return;
    }

    if (key === "Enter") {
      this.handleSoftkey("center");
      return;
    }

    if (key === "ContextMenu") {
      this.handleSoftkey("left");
      return;
    }

    if (key === "Escape" || key === "Backspace") {
      this.handleSoftkey("right");
      return;
    }

    if (this.state === OS_STATE.IDLE) {
      if (key === "ArrowLeft") {
        this.moveLauncherHorizontal(-1);
      } else if (key === "ArrowRight") {
        this.moveLauncherHorizontal(1);
      } else if (key === "ArrowUp") {
        this.moveLauncherVertical(-1);
      } else if (key === "ArrowDown") {
        this.moveLauncherVertical(1);
      } else if (key === "PageUp") {
        this.cycleHomePage(-1);
      } else if (key === "PageDown") {
        this.cycleHomePage(1);
      }
      return;
    }

    if (this.state === OS_STATE.APP) {
      if (key === "ArrowUp") {
        this.currentApp?.onWheel?.(-1, this.createAppApi(this.currentAppId));
      } else if (key === "ArrowDown") {
        this.currentApp?.onWheel?.(1, this.createAppApi(this.currentAppId));
      } else if (key === "ArrowLeft" || key === "ArrowRight") {
        this.currentApp?.onKey?.(key, this.createAppApi(this.currentAppId));
      }
      return;
    }

    if (this.state === OS_STATE.SWITCH) {
      if (key === "ArrowUp") {
        this.moveTaskSelection(-1);
      } else if (key === "ArrowDown") {
        this.moveTaskSelection(1);
      }
      return;
    }

    if (this.state === OS_STATE.NOTIFY) {
      if (key === "ArrowUp") {
        this.moveNotificationSelection(-1);
      } else if (key === "ArrowDown") {
        this.moveNotificationSelection(1);
      }
    }
  }

  showToast(message) {
    if (!message) {
      return;
    }

    const existing = this.elements.main.querySelector(".toast");
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.elements.main.appendChild(toast);

    window.clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      toast.remove();
    }, 1800);
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.unbindEvents();
    this.closeMenu(false);

    window.clearTimeout(this.toastTimeout);
    window.clearTimeout(this.bannerTimeout);
    window.clearTimeout(this.bootTimer);
    window.clearInterval(this.clockTimer);
    window.clearInterval(this.deviceTimer);
    window.clearInterval(this.ambientTimer);

    this.toastTimeout = null;
    this.bannerTimeout = null;
    this.bootTimer = null;
    this.clockTimer = null;
    this.deviceTimer = null;
    this.ambientTimer = null;

    this.appManager.terminateAll();
    this.currentAppId = null;
    this.currentApp = null;

    this.elements.overlayHost.innerHTML = "";
    this.elements.bannerHost.innerHTML = "";
    this.elements.main.innerHTML = "";
  }
}

export async function createSymbianShell({
  root,
  fileLayer = null,
  fileSystemOs = "winxp",
  assetBasePath = DEFAULT_ASSET_BASE_PATH,
  requestSystemSwitch,
  persistFileSystem = false,
} = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("createSymbianShell requires a valid root mount element.");
  }

  const normalizedAssetBasePath =
    typeof assetBasePath === "string" && assetBasePath.trim()
      ? assetBasePath.trim()
      : DEFAULT_ASSET_BASE_PATH;

  const seedData = fileLayer
    ? await buildMockFileSystemFromFileLayer({
        fileLayer,
        os: fileSystemOs,
      })
    : null;
  let simulation = null;
  let previousAssetBasePath =
    typeof globalThis === "object" ? globalThis.__SYMBIAN_ASSET_BASE__ : undefined;

  return {
    mount() {
      if (simulation) {
        return;
      }

      previousAssetBasePath =
        typeof globalThis === "object"
          ? globalThis.__SYMBIAN_ASSET_BASE__
          : previousAssetBasePath;

      if (typeof globalThis === "object") {
        globalThis.__SYMBIAN_ASSET_BASE__ = normalizedAssetBasePath;
      }

      root.classList.add("symbian-runtime-host");
      root.innerHTML = SYMBIAN_RUNTIME_TEMPLATE;
      root.dataset.runtime = ROOT_DATA_RUNTIME;

      const fs = new MockFileSystem({
        storageKey: persistFileSystem ? "uiq3_mock_fs_v3" : "",
        persist: persistFileSystem,
        seedData: seedData || undefined,
      });

      simulation = new SymbianSimulation({
        root,
        fs,
        requestSystemSwitch,
      });
      simulation.boot();
    },
    unmount() {
      if (simulation) {
        simulation.destroy();
        simulation = null;
      }

      if (typeof globalThis === "object") {
        if (
          typeof previousAssetBasePath === "string" &&
          previousAssetBasePath.trim()
        ) {
          globalThis.__SYMBIAN_ASSET_BASE__ = previousAssetBasePath;
        } else {
          delete globalThis.__SYMBIAN_ASSET_BASE__;
        }
      }

      delete root.dataset.runtime;
      root.classList.remove("theme-graphite");
      root.classList.remove("symbian-runtime-host");
      root.innerHTML = "";
    },
  };
}

function maybeBootstrapStandaloneSymbianPage() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const appRoot = document.getElementById("app");
  const mainContent = document.getElementById("main-content");
  if (appRoot || !(mainContent instanceof HTMLElement)) {
    return;
  }

  if (window.symbianSimulation) {
    return;
  }

  const simulation = new SymbianSimulation({
    root: document.body,
  });
  simulation.boot();
  window.symbianSimulation = simulation;
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", maybeBootstrapStandaloneSymbianPage, {
    once: true,
  });
}
