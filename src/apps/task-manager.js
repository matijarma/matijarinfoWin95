import { createContextMenu } from "../ui/context-menu/index.js";
import { createMnemonicLabelNode, getMnemonicFromKeyEvent } from "../ui/mnemonics/index.js";

const TASK_MANAGER_MENUS = [
  { key: "file", label: "&File" },
  { key: "options", label: "&Options" },
  { key: "view", label: "&View" },
  { key: "help", label: "&Help" },
];

const MENU_KEYS = TASK_MANAGER_MENUS.map((menu) => menu.key);

const TAB_ORDER = ["applications", "processes", "performance"];

const UPDATE_SPEEDS = Object.freeze({
  high: { label: "High", intervalMs: 550 },
  normal: { label: "Normal", intervalMs: 1000 },
  low: { label: "Low", intervalMs: 2500 },
  paused: { label: "Paused", intervalMs: null },
});

const HISTORY_POINTS = 44;
const TOTAL_MEMORY_KB = 64 * 1024;

const PROCESS_IMAGE_OVERRIDES = Object.freeze({
  "internet-explorer": "IEXPLORE.EXE",
  "control-panel": "CONTROL.EXE",
  "date-time-properties": "TIMEDATE.CPL",
  "run-dialog": "RUNDLL32.EXE",
  "network-status": "NETSTAT.EXE",
  "my-computer": "EXPLORER.EXE",
  "recycle-bin": "EXPLORER.EXE",
  "about-matijar": "NOTEPAD.EXE",
  "task-manager": "TASKMGR.EXE",
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatMemoryKb(value) {
  return `${formatNumber(Math.round(value || 0))} K`;
}

function formatMemoryMb(value) {
  const mbValue = Number(value || 0) / 1024;
  return mbValue.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatUptime(totalMs) {
  const safeMs = Math.max(0, Math.floor(totalMs || 0));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseWindowPid(windowId) {
  const parsed = Number.parseInt(String(windowId || "").replace(/\D+/g, ""), 10);
  return Number.isFinite(parsed) ? 1200 + parsed : 0;
}

function getProcessImageName(appId) {
  if (appId in PROCESS_IMAGE_OVERRIDES) {
    return PROCESS_IMAGE_OVERRIDES[appId];
  }

  const normalized = String(appId || "app")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  return `${normalized || "APP"}.EXE`;
}

function getUpdateSpeedLabel(updateSpeedId) {
  return UPDATE_SPEEDS[updateSpeedId]?.label || UPDATE_SPEEDS.normal.label;
}

function getUpdateIntervalMs(updateSpeedId) {
  return UPDATE_SPEEDS[updateSpeedId]?.intervalMs ?? UPDATE_SPEEDS.normal.intervalMs;
}

function getNextTabId(currentTab, direction) {
  const currentIndex = TAB_ORDER.indexOf(currentTab);

  if (currentIndex < 0) {
    return TAB_ORDER[0];
  }

  const offset = direction < 0 ? -1 : 1;
  const nextIndex = (currentIndex + offset + TAB_ORDER.length) % TAB_ORDER.length;
  return TAB_ORDER[nextIndex];
}

function createHistorySeed(pointCount, baseValue) {
  const seed = [];
  let currentValue = baseValue;

  for (let index = 0; index < pointCount; index += 1) {
    currentValue = clamp(currentValue + (Math.random() * 7 - 3.5), 3, 95);
    seed.push(currentValue);
  }

  return seed;
}

function replaceHistoryValue(history, nextValue) {
  history.push(nextValue);
  while (history.length > HISTORY_POINTS) {
    history.shift();
  }
}

function renderHistory(container, values = []) {
  if (!container) {
    return;
  }

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const value of values) {
    const bar = document.createElement("span");
    bar.className = "task-manager__history-bar";
    bar.style.height = `${clamp(Number(value || 0), 3, 100)}%`;
    fragment.append(bar);
  }

  container.append(fragment);
}

function getBaseProcessStats(windowRecord) {
  const pid = parseWindowPid(windowRecord.id || windowRecord.windowId);
  return {
    cpu: 2 + ((pid * 17) % 7),
    memKb: 2200 + ((pid * 131) % 9600),
  };
}

function ensureWindowProcessStats(statMap, windowRecord) {
  const key = windowRecord.id || windowRecord.windowId;

  if (!statMap.has(key)) {
    statMap.set(key, getBaseProcessStats(windowRecord));
  }

  return statMap.get(key);
}

function updateWindowProcessStats(windowRecord, stats) {
  let targetCpu = 3 + Math.random() * 3;

  if (windowRecord.focused && !windowRecord.minimized) {
    targetCpu = 14 + Math.random() * 9;
  } else if (windowRecord.minimized) {
    targetCpu = 0.2 + Math.random() * 1.4;
  }

  if (windowRecord.appId === "internet-explorer") {
    targetCpu += 2.8;
  }

  const nextCpu = clamp(stats.cpu * 0.56 + targetCpu * 0.44, 0, 72);
  const memoryDrift = Math.round(Math.random() * 220 - 90);
  const focusBoost = windowRecord.focused ? 140 : 0;
  const nextMemKb = clamp(stats.memKb + memoryDrift + focusBoost, 1200, 62000);

  stats.cpu = nextCpu;
  stats.memKb = Math.round(nextMemKb);
}

function toApplicationRows(windowRecords) {
  return windowRecords
    .map((windowRecord) => ({
      id: windowRecord.id,
      windowId: windowRecord.id,
      appId: windowRecord.appId,
      title: windowRecord.title || "Application",
      status: windowRecord.minimized ? "Minimized" : "Running",
      minimized: windowRecord.minimized,
      focused: windowRecord.focused,
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function createTaskManagerContent({
  eventBus,
  windowManager,
  appRegistry,
  launchApp,
} = {}) {
  const root = document.createElement("section");
  root.className = "task-manager";
  root.tabIndex = -1;

  if (!windowManager) {
    root.innerHTML = `
      <h2>Windows Task Manager</h2>
      <p>Task Manager requires an active window manager runtime.</p>
    `;
    return root;
  }

  root.innerHTML = `
    <nav class="task-manager__menubar" data-taskmgr-menubar aria-label="Task Manager menu bar"></nav>
    <div class="task-manager__tabs" role="tablist" aria-label="Task Manager tabs">
      <button
        type="button"
        class="task-manager__tab is-active"
        data-tab-id="applications"
        role="tab"
        aria-selected="true"
      >
        Applications
      </button>
      <button
        type="button"
        class="task-manager__tab"
        data-tab-id="processes"
        role="tab"
        aria-selected="false"
      >
        Processes
      </button>
      <button
        type="button"
        class="task-manager__tab"
        data-tab-id="performance"
        role="tab"
        aria-selected="false"
      >
        Performance
      </button>
    </div>

    <section class="task-manager__panel" data-panel-id="applications">
      <div class="task-manager__list">
        <table class="task-manager__table" aria-label="Running applications">
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody data-application-body></tbody>
        </table>
        <p class="task-manager__empty" data-application-empty hidden>No tasks are currently running.</p>
      </div>
    </section>

    <section class="task-manager__panel" data-panel-id="processes" hidden>
      <div class="task-manager__list">
        <table class="task-manager__table task-manager__table--processes" aria-label="Running processes">
          <thead>
            <tr>
              <th>Image Name</th>
              <th class="task-manager__align-right">PID</th>
              <th class="task-manager__align-right">CPU</th>
              <th class="task-manager__align-right">Mem Usage</th>
            </tr>
          </thead>
          <tbody data-process-body></tbody>
        </table>
      </div>
    </section>

    <section class="task-manager__panel" data-panel-id="performance" hidden>
      <div class="task-manager__performance">
        <div class="task-manager__meters">
          <section class="task-manager__meter-card">
            <h3>CPU Usage</h3>
            <p class="task-manager__meter-value" data-cpu-current>0%</p>
            <div class="task-manager__history" data-cpu-history></div>
          </section>
          <section class="task-manager__meter-card">
            <h3>Memory Usage</h3>
            <p class="task-manager__meter-value" data-memory-current>0 MB</p>
            <div class="task-manager__history" data-memory-history></div>
          </section>
        </div>
        <section class="task-manager__summary">
          <div class="task-manager__summary-item">
            <span>Processes</span>
            <strong data-summary-processes>0</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Threads</span>
            <strong data-summary-threads>0</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Handles</span>
            <strong data-summary-handles>0</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Commit Charge</span>
            <strong data-summary-commit>0 K</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Physical Memory</span>
            <strong data-summary-physical>0 K</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Available</span>
            <strong data-summary-available>0 K</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Kernel Memory</span>
            <strong data-summary-kernel>0 K</strong>
          </div>
          <div class="task-manager__summary-item">
            <span>Up Time</span>
            <strong data-summary-uptime>0:00:00</strong>
          </div>
        </section>
      </div>
    </section>

    <footer class="task-manager__footer">
      <p class="task-manager__status" data-taskmgr-status>Ready.</p>
      <div class="task-manager__action-group" data-action-group="applications">
        <button type="button" class="task-manager__button" data-action="app-switch">Switch To</button>
        <button type="button" class="task-manager__button" data-action="app-end-task">End Task</button>
        <button type="button" class="task-manager__button" data-action="app-new-task">New Task...</button>
      </div>
      <div class="task-manager__action-group" data-action-group="processes" hidden>
        <button type="button" class="task-manager__button" data-action="proc-end">End Process</button>
      </div>
      <div class="task-manager__action-group" data-action-group="performance" hidden>
        <button type="button" class="task-manager__button" data-action="perf-refresh">Refresh Now</button>
      </div>
    </footer>
  `;

  const menuBar = root.querySelector("[data-taskmgr-menubar]");
  const tabButtons = Array.from(root.querySelectorAll("[data-tab-id]"));
  const panelNodes = Array.from(root.querySelectorAll("[data-panel-id]"));
  const applicationBody = root.querySelector("[data-application-body]");
  const applicationEmpty = root.querySelector("[data-application-empty]");
  const processBody = root.querySelector("[data-process-body]");
  const cpuCurrentNode = root.querySelector("[data-cpu-current]");
  const memoryCurrentNode = root.querySelector("[data-memory-current]");
  const cpuHistoryNode = root.querySelector("[data-cpu-history]");
  const memoryHistoryNode = root.querySelector("[data-memory-history]");
  const statusNode = root.querySelector("[data-taskmgr-status]");

  const summaryNodes = {
    processes: root.querySelector("[data-summary-processes]"),
    threads: root.querySelector("[data-summary-threads]"),
    handles: root.querySelector("[data-summary-handles]"),
    commit: root.querySelector("[data-summary-commit]"),
    physical: root.querySelector("[data-summary-physical]"),
    available: root.querySelector("[data-summary-available]"),
    kernel: root.querySelector("[data-summary-kernel]"),
    uptime: root.querySelector("[data-summary-uptime]"),
  };

  const actionButtons = {
    appSwitch: root.querySelector('[data-action="app-switch"]'),
    appEndTask: root.querySelector('[data-action="app-end-task"]'),
    appNewTask: root.querySelector('[data-action="app-new-task"]'),
    procEnd: root.querySelector('[data-action="proc-end"]'),
    perfRefresh: root.querySelector('[data-action="perf-refresh"]'),
  };

  const actionGroups = Array.from(root.querySelectorAll("[data-action-group]"));

  const windowProcessStats = new Map();
  const menuButtons = new Map();
  const menuMnemonicMap = new Map();
  const cleanupFns = [];

  const state = {
    selfWindowId: null,
    activeTab: "applications",
    selectedApplicationWindowId: null,
    selectedProcessId: null,
    alwaysOnTop: false,
    minimizeOnUse: false,
    hideWhenMinimized: false,
    updateSpeed: "normal",
    latestSnapshot: null,
    cpuHistory: createHistorySeed(HISTORY_POINTS, 8),
    memoryHistory: createHistorySeed(HISTORY_POINTS, 40),
    startedAtMs: Date.now(),
  };

  const contextMenu = createContextMenu({
    container: document.body,
  });

  cleanupFns.push(() => contextMenu.destroy());

  let updateTimerId = null;
  let pendingAltToggle = false;
  let statusResetTimerId = null;

  function resetStatusFromSnapshot() {
    if (!statusNode || !state.latestSnapshot) {
      return;
    }

    const snapshot = state.latestSnapshot;
    statusNode.textContent = `Tasks: ${snapshot.applications.length} | Processes: ${
      snapshot.processes.length
    } | CPU: ${Math.round(snapshot.summary.cpuUsage)}% | Update: ${getUpdateSpeedLabel(
      state.updateSpeed,
    )}`;
  }

  function setStatus(text, { sticky = false } = {}) {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = text;

    if (statusResetTimerId !== null) {
      clearTimeout(statusResetTimerId);
      statusResetTimerId = null;
    }

    if (!sticky) {
      statusResetTimerId = window.setTimeout(() => {
        statusResetTimerId = null;
        resetStatusFromSnapshot();
      }, 2600);
    }
  }

  function resolveSelfWindowId() {
    if (state.selfWindowId) {
      return state.selfWindowId;
    }

    const windowNode = root.closest(".os-window");
    const windowId = windowNode?.dataset?.windowId;

    if (windowId) {
      state.selfWindowId = windowId;
    }

    return state.selfWindowId;
  }

  function getApplicationRows() {
    const windows = windowManager.listWindows();
    const rows = toApplicationRows(windows);

    const windowIds = new Set(rows.map((row) => row.windowId));
    for (const trackedWindowId of windowProcessStats.keys()) {
      if (!windowIds.has(trackedWindowId)) {
        windowProcessStats.delete(trackedWindowId);
      }
    }

    return rows;
  }

  function buildProcessRows(applicationRows) {
    const shellCpu = clamp(0.8 + applicationRows.length * 0.42 + Math.random() * 1.8, 0.7, 12);
    const kernelCpu = clamp(1.5 + applicationRows.length * 0.5 + Math.random() * 2.4, 0.8, 17);
    const appProcessRows = [];

    for (const appRow of applicationRows) {
      const windowState = windowManager.getWindow(appRow.windowId);
      const stats = ensureWindowProcessStats(windowProcessStats, appRow);
      updateWindowProcessStats(appRow, stats);

      appProcessRows.push({
        id: `proc-window-${appRow.windowId}`,
        windowId: appRow.windowId,
        imageName: getProcessImageName(appRow.appId),
        pid: parseWindowPid(appRow.windowId),
        cpuPercent: stats.cpu,
        memKb: stats.memKb,
        status: appRow.status,
        endable: Boolean(windowState?.closable),
      });
    }

    const appCpuTotal = appProcessRows.reduce((sum, row) => sum + row.cpuPercent, 0);
    const busyCpu = appCpuTotal + shellCpu + kernelCpu;
    const cpuScale = busyCpu > 96 ? 96 / busyCpu : 1;

    for (const appProcess of appProcessRows) {
      appProcess.cpuPercent *= cpuScale;
    }

    const scaledShellCpu = shellCpu * cpuScale;
    const scaledKernelCpu = kernelCpu * cpuScale;
    const scaledBusyCpu =
      appProcessRows.reduce((sum, row) => sum + row.cpuPercent, 0) + scaledShellCpu + scaledKernelCpu;
    const idleCpu = clamp(100 - scaledBusyCpu, 0.2, 99.2);

    const orderedAppRows = appProcessRows.sort(
      (left, right) =>
        right.cpuPercent - left.cpuPercent || left.imageName.localeCompare(right.imageName),
    );

    const processRows = [
      {
        id: "proc-idle",
        imageName: "System Idle Process",
        pid: 0,
        cpuPercent: idleCpu,
        memKb: 24,
        status: "Running",
        endable: false,
      },
      {
        id: "proc-shell",
        imageName: "EXPLORER.EXE",
        pid: 100,
        cpuPercent: scaledShellCpu,
        memKb: 6170,
        status: "Running",
        endable: false,
      },
      {
        id: "proc-kernel",
        imageName: "KERNEL32.EXE",
        pid: 4,
        cpuPercent: scaledKernelCpu,
        memKb: 4260,
        status: "Running",
        endable: false,
      },
      ...orderedAppRows,
    ];

    const appMemoryTotal = orderedAppRows.reduce((sum, row) => sum + row.memKb, 0);
    const usedMemoryKb = clamp(
      Math.round(22000 + appMemoryTotal * 0.7 + applicationRows.length * 680 + Math.random() * 900),
      11000,
      TOTAL_MEMORY_KB - 1400,
    );
    const commitChargeKb = clamp(
      Math.round(usedMemoryKb + 2100 + Math.random() * 1100),
      usedMemoryKb,
      TOTAL_MEMORY_KB + 5200,
    );
    const kernelMemoryKb = clamp(
      Math.round(4700 + applicationRows.length * 330 + Math.random() * 240),
      4000,
      18000,
    );

    return {
      processRows,
      summary: {
        cpuUsage: 100 - idleCpu,
        usedMemoryKb,
        availableMemoryKb: TOTAL_MEMORY_KB - usedMemoryKb,
        commitChargeKb,
        kernelMemoryKb,
        processCount: processRows.length,
        threadCount: 52 + processRows.length * 6 + Math.floor(Math.random() * 16),
        handleCount: 340 + processRows.length * 48 + Math.floor(Math.random() * 110),
        uptimeMs: Date.now() - state.startedAtMs,
      },
    };
  }

  function sampleRuntime({ advanceHistory = false } = {}) {
    resolveSelfWindowId();
    const applications = getApplicationRows();
    const processResult = buildProcessRows(applications);

    if (advanceHistory) {
      replaceHistoryValue(state.cpuHistory, processResult.summary.cpuUsage);
      replaceHistoryValue(
        state.memoryHistory,
        (processResult.summary.usedMemoryKb / TOTAL_MEMORY_KB) * 100,
      );
    }

    return {
      applications,
      processes: processResult.processRows,
      summary: processResult.summary,
    };
  }

  function renderApplications(snapshot) {
    if (!applicationBody) {
      return;
    }

    applicationBody.innerHTML = "";
    const hasRows = snapshot.applications.length > 0;
    applicationEmpty.hidden = hasRows;

    if (!hasRows) {
      state.selectedApplicationWindowId = null;
      return;
    }

    const selectedExists = snapshot.applications.some(
      (item) => item.windowId === state.selectedApplicationWindowId,
    );

    if (!selectedExists) {
      state.selectedApplicationWindowId = snapshot.applications[0].windowId;
    }

    const fragment = document.createDocumentFragment();

    for (const appRow of snapshot.applications) {
      const row = document.createElement("tr");
      row.dataset.windowId = appRow.windowId;

      if (appRow.windowId === state.selectedApplicationWindowId) {
        row.classList.add("is-selected");
      }

      const taskCell = document.createElement("td");
      taskCell.textContent = appRow.title;

      const statusCell = document.createElement("td");
      statusCell.textContent = appRow.status;

      row.append(taskCell, statusCell);
      fragment.append(row);
    }

    applicationBody.append(fragment);
  }

  function renderProcesses(snapshot) {
    if (!processBody) {
      return;
    }

    processBody.innerHTML = "";
    const hasRows = snapshot.processes.length > 0;

    if (!hasRows) {
      state.selectedProcessId = null;
      return;
    }

    const selectedExists = snapshot.processes.some((row) => row.id === state.selectedProcessId);

    if (!selectedExists) {
      const preferred = snapshot.processes.find((row) => row.endable) || snapshot.processes[0];
      state.selectedProcessId = preferred.id;
    }

    const fragment = document.createDocumentFragment();

    for (const processRow of snapshot.processes) {
      const row = document.createElement("tr");
      row.dataset.processId = processRow.id;

      if (processRow.id === state.selectedProcessId) {
        row.classList.add("is-selected");
      }

      const imageCell = document.createElement("td");
      imageCell.textContent = processRow.imageName;

      const pidCell = document.createElement("td");
      pidCell.textContent = String(processRow.pid);
      pidCell.className = "task-manager__align-right";

      const cpuCell = document.createElement("td");
      cpuCell.textContent = `${Math.round(processRow.cpuPercent)}%`;
      cpuCell.className = "task-manager__align-right";

      const memCell = document.createElement("td");
      memCell.textContent = formatMemoryKb(processRow.memKb);
      memCell.className = "task-manager__align-right";

      row.append(imageCell, pidCell, cpuCell, memCell);
      fragment.append(row);
    }

    processBody.append(fragment);
  }

  function renderPerformance(snapshot) {
    if (cpuCurrentNode) {
      cpuCurrentNode.textContent = `${Math.round(snapshot.summary.cpuUsage)}%`;
    }

    if (memoryCurrentNode) {
      memoryCurrentNode.textContent = `${formatMemoryMb(snapshot.summary.usedMemoryKb)} MB / ${formatMemoryMb(
        TOTAL_MEMORY_KB,
      )} MB`;
    }

    renderHistory(cpuHistoryNode, state.cpuHistory);
    renderHistory(memoryHistoryNode, state.memoryHistory);

    if (summaryNodes.processes) {
      summaryNodes.processes.textContent = String(snapshot.summary.processCount);
    }

    if (summaryNodes.threads) {
      summaryNodes.threads.textContent = formatNumber(snapshot.summary.threadCount);
    }

    if (summaryNodes.handles) {
      summaryNodes.handles.textContent = formatNumber(snapshot.summary.handleCount);
    }

    if (summaryNodes.commit) {
      summaryNodes.commit.textContent = formatMemoryKb(snapshot.summary.commitChargeKb);
    }

    if (summaryNodes.physical) {
      summaryNodes.physical.textContent = formatMemoryKb(TOTAL_MEMORY_KB);
    }

    if (summaryNodes.available) {
      summaryNodes.available.textContent = formatMemoryKb(snapshot.summary.availableMemoryKb);
    }

    if (summaryNodes.kernel) {
      summaryNodes.kernel.textContent = formatMemoryKb(snapshot.summary.kernelMemoryKb);
    }

    if (summaryNodes.uptime) {
      summaryNodes.uptime.textContent = formatUptime(snapshot.summary.uptimeMs);
    }
  }

  function syncActionGroupVisibility() {
    for (const group of actionGroups) {
      group.hidden = group.dataset.actionGroup !== state.activeTab;
    }
  }

  function syncActionButtonState() {
    const selectedApplication = state.latestSnapshot?.applications.find(
      (appRow) => appRow.windowId === state.selectedApplicationWindowId,
    );
    const selectedProcess = state.latestSnapshot?.processes.find(
      (processRow) => processRow.id === state.selectedProcessId,
    );

    if (actionButtons.appSwitch) {
      actionButtons.appSwitch.disabled = !selectedApplication;
    }

    if (actionButtons.appEndTask) {
      actionButtons.appEndTask.disabled = !selectedApplication;
    }

    if (actionButtons.procEnd) {
      actionButtons.procEnd.disabled = !selectedProcess || !selectedProcess.endable;
    }
  }

  function renderAll({ advanceHistory = false, keepStatus = false } = {}) {
    const snapshot = sampleRuntime({ advanceHistory });
    state.latestSnapshot = snapshot;

    renderApplications(snapshot);
    renderProcesses(snapshot);
    renderPerformance(snapshot);
    syncActionButtonState();

    if (!keepStatus) {
      resetStatusFromSnapshot();
    }
  }

  function restartTicker() {
    if (updateTimerId !== null) {
      clearInterval(updateTimerId);
      updateTimerId = null;
    }

    const intervalMs = getUpdateIntervalMs(state.updateSpeed);

    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      return;
    }

    updateTimerId = window.setInterval(() => {
      renderAll({ advanceHistory: true });
    }, intervalMs);
  }

  function setActiveTab(nextTabId) {
    if (!TAB_ORDER.includes(nextTabId)) {
      return;
    }

    state.activeTab = nextTabId;

    for (const tabButton of tabButtons) {
      const isActive = tabButton.dataset.tabId === nextTabId;
      tabButton.classList.toggle("is-active", isActive);
      tabButton.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    for (const panelNode of panelNodes) {
      panelNode.hidden = panelNode.dataset.panelId !== nextTabId;
    }

    syncActionGroupVisibility();
    syncActionButtonState();
    resetStatusFromSnapshot();
  }

  function focusWindow(windowId) {
    if (!windowId) {
      return false;
    }

    const restored = windowManager.restoreWindow(windowId);

    if (restored) {
      windowManager.focusWindow(windowId);
      return true;
    }

    return windowManager.focusWindow(windowId);
  }

  function maybeMinimizeTaskManagerWindow(targetWindowId = null) {
    if (!state.minimizeOnUse) {
      return;
    }

    const selfWindowId = resolveSelfWindowId();

    if (!selfWindowId) {
      return;
    }

    if (targetWindowId && targetWindowId === selfWindowId) {
      return;
    }

    windowManager.minimizeWindow(selfWindowId);
  }

  function runNewTask() {
    if (appRegistry?.getApp && !appRegistry.getApp("run-dialog")) {
      setStatus("Run dialog is unavailable.");
      return;
    }

    launchApp?.("run-dialog");
    maybeMinimizeTaskManagerWindow();
    setStatus("Opened Run dialog.");
  }

  function switchToSelectedApplication() {
    const selected = state.latestSnapshot?.applications.find(
      (appRow) => appRow.windowId === state.selectedApplicationWindowId,
    );

    if (!selected) {
      setStatus("Select a task first.");
      return;
    }

    focusWindow(selected.windowId);
    maybeMinimizeTaskManagerWindow(selected.windowId);
    setStatus(`Switched to ${selected.title}.`);
  }

  function endSelectedApplicationTask() {
    const selected = state.latestSnapshot?.applications.find(
      (appRow) => appRow.windowId === state.selectedApplicationWindowId,
    );

    if (!selected) {
      setStatus("Select a task first.");
      return;
    }

    const closed = windowManager.closeWindow(selected.windowId);

    if (!closed) {
      setStatus("Unable to end selected task.");
      return;
    }

    setStatus(`Ended task: ${selected.title}.`);
  }

  function endSelectedProcess() {
    const selected = state.latestSnapshot?.processes.find(
      (processRow) => processRow.id === state.selectedProcessId,
    );

    if (!selected) {
      setStatus("Select a process first.");
      return;
    }

    if (!selected.endable || !selected.windowId) {
      setStatus(`${selected.imageName} cannot be terminated from this view.`);
      return;
    }

    const closed = windowManager.closeWindow(selected.windowId);

    if (!closed) {
      setStatus("Unable to terminate selected process.");
      return;
    }

    setStatus(`Terminated ${selected.imageName}.`);
  }

  function setUpdateSpeed(nextSpeedId) {
    if (!(nextSpeedId in UPDATE_SPEEDS)) {
      return;
    }

    state.updateSpeed = nextSpeedId;
    restartTicker();
    setStatus(`Update speed set to ${getUpdateSpeedLabel(nextSpeedId)}.`);
  }

  function getOptionsEntries() {
    const withCheck = (isEnabled, labelText) => `${isEnabled ? "\u2713 " : ""}${labelText}`;

    return [
      {
        id: "opt-always-on-top",
        label: withCheck(state.alwaysOnTop, "Always on Top"),
        iconKey: "settings",
        action: "toggle-always-on-top",
      },
      {
        id: "opt-minimize-on-use",
        label: withCheck(state.minimizeOnUse, "Minimize on Use"),
        iconKey: "settings",
        action: "toggle-minimize-on-use",
      },
      {
        id: "opt-hide-when-minimized",
        label: withCheck(state.hideWhenMinimized, "Hide When Minimized"),
        iconKey: "settings",
        action: "toggle-hide-when-minimized",
      },
    ];
  }

  function getUpdateSpeedEntries() {
    return Object.entries(UPDATE_SPEEDS).map(([speedId, speedOption]) => ({
      id: `speed-${speedId}`,
      label: `${state.updateSpeed === speedId ? "\u2713 " : ""}${speedOption.label}`,
      iconKey: "settings",
      action: `set-speed:${speedId}`,
    }));
  }

  function getMenuEntries(menuKey) {
    if (menuKey === "file") {
      return [
        {
          id: "file-new-task",
          label: "New Task (Run...)",
          iconKey: "run",
          action: "new-task",
        },
        { type: "separator" },
        {
          id: "file-exit",
          label: "Exit Task Manager",
          iconKey: "app",
          action: "exit",
        },
      ];
    }

    if (menuKey === "options") {
      return getOptionsEntries();
    }

    if (menuKey === "view") {
      return [
        {
          id: "view-refresh-now",
          label: "Refresh Now",
          iconKey: "settings",
          action: "refresh-now",
        },
        {
          id: "view-update-speed",
          label: "Update Speed",
          iconKey: "settings",
          children: getUpdateSpeedEntries(),
        },
      ];
    }

    return [
      {
        id: "help-about",
        label: "About Task Manager",
        iconKey: "document",
        action: "about",
      },
    ];
  }

  function handleMenuAction(actionName) {
    if (!actionName) {
      return;
    }

    if (actionName === "new-task") {
      runNewTask();
      return;
    }

    if (actionName === "exit") {
      const selfWindowId = resolveSelfWindowId();
      if (selfWindowId) {
        windowManager.closeWindow(selfWindowId);
      }
      return;
    }

    if (actionName === "toggle-always-on-top") {
      state.alwaysOnTop = !state.alwaysOnTop;
      setStatus(
        state.alwaysOnTop
          ? "Always on Top toggled on (z-order pinning is approximated in this build)."
          : "Always on Top toggled off.",
      );
      return;
    }

    if (actionName === "toggle-minimize-on-use") {
      state.minimizeOnUse = !state.minimizeOnUse;
      setStatus(
        state.minimizeOnUse ? "Minimize on Use enabled." : "Minimize on Use disabled.",
      );
      return;
    }

    if (actionName === "toggle-hide-when-minimized") {
      state.hideWhenMinimized = !state.hideWhenMinimized;
      setStatus(
        state.hideWhenMinimized
          ? "Hide When Minimized enabled."
          : "Hide When Minimized disabled.",
      );
      return;
    }

    if (actionName === "refresh-now") {
      renderAll({ advanceHistory: true, keepStatus: true });
      setStatus("Refreshed.");
      return;
    }

    if (actionName.startsWith("set-speed:")) {
      const speedId = actionName.split(":")[1];
      setUpdateSpeed(speedId);
      return;
    }

    if (actionName === "about") {
      setStatus("Windows Task Manager replica: Applications, Processes, and Performance tabs.");
    }
  }

  function openMenu(menuKey, button) {
    const bounds = button.getBoundingClientRect();

    contextMenu.open({
      x: bounds.left,
      y: bounds.bottom,
      entries: getMenuEntries(menuKey),
      onSelect(entry) {
        handleMenuAction(entry.action);
      },
    });
  }

  function focusAdjacentMenu(currentMenuKey, direction) {
    const currentIndex = MENU_KEYS.indexOf(currentMenuKey);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex = (currentIndex + direction + MENU_KEYS.length) % MENU_KEYS.length;
    const nextKey = MENU_KEYS[nextIndex];
    const nextButton = menuButtons.get(nextKey);

    if (!nextButton) {
      return;
    }

    nextButton.focus();
    openMenu(nextKey, nextButton);
  }

  function activateMenuByMnemonic(mnemonic) {
    const menuKey = menuMnemonicMap.get(mnemonic);

    if (!menuKey) {
      return false;
    }

    const button = menuButtons.get(menuKey);

    if (!button) {
      return false;
    }

    button.focus();
    openMenu(menuKey, button);
    return true;
  }

  function isTaskManagerWindowFocused() {
    const selfWindowId = resolveSelfWindowId();

    if (!selfWindowId) {
      return true;
    }

    return windowManager.getActiveWindowId() === selfWindowId;
  }

  function handleActionClick(actionName) {
    if (actionName === "app-switch") {
      switchToSelectedApplication();
      return;
    }

    if (actionName === "app-end-task") {
      endSelectedApplicationTask();
      return;
    }

    if (actionName === "app-new-task") {
      runNewTask();
      return;
    }

    if (actionName === "proc-end") {
      endSelectedProcess();
      return;
    }

    if (actionName === "perf-refresh") {
      renderAll({ advanceHistory: true, keepStatus: true });
      setStatus("Refreshed performance counters.");
    }
  }

  function onTabClick(event) {
    const button = event.target.closest("[data-tab-id]");

    if (!button) {
      return;
    }

    setActiveTab(button.dataset.tabId);
  }

  function onActionClick(event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    handleActionClick(button.dataset.action);
  }

  function onApplicationBodyClick(event) {
    const row = event.target.closest("tr[data-window-id]");

    if (!row) {
      return;
    }

    state.selectedApplicationWindowId = row.dataset.windowId;
    renderAll({ keepStatus: true });
  }

  function onApplicationBodyDoubleClick(event) {
    const row = event.target.closest("tr[data-window-id]");

    if (!row) {
      return;
    }

    state.selectedApplicationWindowId = row.dataset.windowId;
    switchToSelectedApplication();
  }

  function onProcessBodyClick(event) {
    const row = event.target.closest("tr[data-process-id]");

    if (!row) {
      return;
    }

    state.selectedProcessId = row.dataset.processId;
    renderAll({ keepStatus: true });
  }

  function onKeydown(event) {
    if (!isTaskManagerWindowFocused()) {
      return;
    }

    const target = event.target;
    const isEditingInput =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    if (isEditingInput) {
      pendingAltToggle = false;
      return;
    }

    if (event.key === "Alt") {
      pendingAltToggle = true;
      return;
    }

    if (event.altKey) {
      const mnemonic = getMnemonicFromKeyEvent(event);

      if (mnemonic && activateMenuByMnemonic(mnemonic)) {
        event.preventDefault();
      }

      pendingAltToggle = false;
      return;
    }

    pendingAltToggle = false;

    if (event.key === "F5") {
      event.preventDefault();
      renderAll({ advanceHistory: true, keepStatus: true });
      setStatus("Refreshed.");
      return;
    }

    if (event.ctrlKey && event.key === "Tab") {
      event.preventDefault();
      setActiveTab(getNextTabId(state.activeTab, event.shiftKey ? -1 : 1));
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      if (state.activeTab === "applications") {
        endSelectedApplicationTask();
      } else if (state.activeTab === "processes") {
        endSelectedProcess();
      }
      return;
    }

    if (event.key === "Enter" && state.activeTab === "applications") {
      const inTable = event.target.closest("[data-application-body]");
      if (inTable) {
        event.preventDefault();
        switchToSelectedApplication();
      }
    }
  }

  function onKeyup(event) {
    if (event.key !== "Alt") {
      return;
    }

    if (!pendingAltToggle) {
      return;
    }

    pendingAltToggle = false;
    const firstMenuKey = MENU_KEYS[0];
    const firstButton = menuButtons.get(firstMenuKey);

    if (!firstButton) {
      return;
    }

    firstButton.focus();
  }

  for (const menu of TASK_MANAGER_MENUS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "task-manager__menu-button";
    button.dataset.menuKey = menu.key;

    const { node: labelNode, parsed } = createMnemonicLabelNode(
      menu.label,
      "task-manager__menu-label",
    );
    button.append(labelNode);

    if (parsed.mnemonic) {
      menuMnemonicMap.set(parsed.mnemonic, menu.key);
    }

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openMenu(menu.key, button);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusAdjacentMenu(menu.key, 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusAdjacentMenu(menu.key, -1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        openMenu(menu.key, button);
      }
    });

    menuButtons.set(menu.key, button);
    menuBar?.append(button);
  }

  root.addEventListener("click", onTabClick);
  root.addEventListener("click", onActionClick);
  applicationBody?.addEventListener("click", onApplicationBodyClick);
  applicationBody?.addEventListener("dblclick", onApplicationBodyDoubleClick);
  processBody?.addEventListener("click", onProcessBodyClick);
  root.addEventListener("keydown", onKeydown);
  root.addEventListener("keyup", onKeyup);

  cleanupFns.push(() => root.removeEventListener("click", onTabClick));
  cleanupFns.push(() => root.removeEventListener("click", onActionClick));
  cleanupFns.push(() => applicationBody?.removeEventListener("click", onApplicationBodyClick));
  cleanupFns.push(() =>
    applicationBody?.removeEventListener("dblclick", onApplicationBodyDoubleClick),
  );
  cleanupFns.push(() => processBody?.removeEventListener("click", onProcessBodyClick));
  cleanupFns.push(() => root.removeEventListener("keydown", onKeydown));
  cleanupFns.push(() => root.removeEventListener("keyup", onKeyup));

  const refreshOnWindowEvents = [
    "window:opened",
    "window:closed",
    "window:minimized",
    "window:restored",
    "window:focused",
    "window:maximized",
    "window:restored-size",
    "window:resized",
  ];

  for (const eventName of refreshOnWindowEvents) {
    const dispose = eventBus?.on(eventName, () => {
      renderAll({ keepStatus: true });
    });
    if (typeof dispose === "function") {
      cleanupFns.push(dispose);
    }
  }

  const resolveSelfWindowTimer = window.setTimeout(() => {
    resolveSelfWindowId();
    renderAll({ keepStatus: true });
  }, 0);

  cleanupFns.push(() => clearTimeout(resolveSelfWindowTimer));

  setActiveTab(state.activeTab);
  renderAll({ advanceHistory: true, keepStatus: true });
  resetStatusFromSnapshot();
  restartTicker();

  return {
    element: root,
    dispose() {
      if (updateTimerId !== null) {
        clearInterval(updateTimerId);
      }

      if (statusResetTimerId !== null) {
        clearTimeout(statusResetTimerId);
      }

      while (cleanupFns.length > 0) {
        const cleanup = cleanupFns.pop();
        cleanup?.();
      }
    },
  };
}

export { createTaskManagerContent };
