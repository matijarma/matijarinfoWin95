const DEFAULT_SOFTKEYS = Object.freeze({
  left: "Options",
  center: "Select",
  right: "Back",
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clampIndex(index, length) {
  if (!Number.isFinite(length) || length < 1) {
    return 0;
  }

  const numericIndex = Number.isFinite(index) ? Math.trunc(index) : 0;

  if (numericIndex < 0) {
    return 0;
  }

  if (numericIndex >= length) {
    return length - 1;
  }

  return numericIndex;
}

function normalizeTone(tone) {
  if (typeof tone !== "string") {
    return "info";
  }

  const cleanTone = tone.trim().toLowerCase();

  if (cleanTone === "success" || cleanTone === "warning" || cleanTone === "danger" || cleanTone === "info") {
    return cleanTone;
  }

  return "info";
}

function normalizeTileItem(item, index) {
  if (typeof item === "string") {
    return {
      id: `tile-${index + 1}`,
      label: item,
      iconToken: item.slice(0, 2).toUpperCase(),
      disabled: false,
      badge: "",
    };
  }

  const safeItem = item && typeof item === "object" ? item : {};
  const rawLabel = typeof safeItem.label === "string" ? safeItem.label : `App ${index + 1}`;

  return {
    id: typeof safeItem.id === "string" ? safeItem.id : `tile-${index + 1}`,
    label: rawLabel,
    iconToken:
      typeof safeItem.iconToken === "string" && safeItem.iconToken.trim()
        ? safeItem.iconToken.trim()
        : rawLabel.slice(0, 2).toUpperCase(),
    disabled: Boolean(safeItem.disabled),
    badge: typeof safeItem.badge === "string" ? safeItem.badge : "",
  };
}

function normalizeListItem(item, index) {
  if (typeof item === "string") {
    return {
      id: `item-${index + 1}`,
      label: item,
      subtitle: "",
      trailing: "",
      iconToken: "",
      badge: "",
      unread: false,
      disabled: false,
    };
  }

  const safeItem = item && typeof item === "object" ? item : {};

  return {
    id: typeof safeItem.id === "string" ? safeItem.id : `item-${index + 1}`,
    label: typeof safeItem.label === "string" ? safeItem.label : `Item ${index + 1}`,
    subtitle: typeof safeItem.subtitle === "string" ? safeItem.subtitle : "",
    trailing: typeof safeItem.trailing === "string" ? safeItem.trailing : "",
    iconToken: typeof safeItem.iconToken === "string" ? safeItem.iconToken : "",
    badge: typeof safeItem.badge === "string" ? safeItem.badge : "",
    unread: Boolean(safeItem.unread),
    disabled: Boolean(safeItem.disabled),
  };
}

function normalizeTabItem(item, index) {
  if (typeof item === "string") {
    return {
      id: `tab-${index + 1}`,
      label: item,
      badge: "",
      disabled: false,
    };
  }

  const safeItem = item && typeof item === "object" ? item : {};

  return {
    id: typeof safeItem.id === "string" ? safeItem.id : `tab-${index + 1}`,
    label: typeof safeItem.label === "string" ? safeItem.label : `Tab ${index + 1}`,
    badge: typeof safeItem.badge === "string" ? safeItem.badge : "",
    disabled: Boolean(safeItem.disabled),
  };
}

function renderToken(token, className = "uiq-token") {
  if (!token) {
    return "";
  }

  return `<span class="${className}" aria-hidden="true">${escapeHtml(token)}</span>`;
}

function renderRows(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (!safeRows.length) {
    return "";
  }

  return `<dl class="uiq-detail-panel__rows">
    ${safeRows
      .map((row, index) => {
        if (typeof row === "string") {
          return `<dt>Info ${index + 1}</dt><dd>${escapeHtml(row)}</dd>`;
        }

        const safeRow = row && typeof row === "object" ? row : {};
        const label = typeof safeRow.label === "string" ? safeRow.label : `Info ${index + 1}`;
        const value = safeRow.value != null ? String(safeRow.value) : "";

        return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
      })
      .join("")}
  </dl>`;
}

export function normalizeSoftkeys(softkeys = {}) {
  const source = softkeys && typeof softkeys === "object" ? softkeys : {};

  return {
    left:
      typeof source.left === "string" && source.left.trim()
        ? source.left.trim()
        : DEFAULT_SOFTKEYS.left,
    center:
      typeof source.center === "string" && source.center.trim()
        ? source.center.trim()
        : DEFAULT_SOFTKEYS.center,
    right:
      typeof source.right === "string" && source.right.trim()
        ? source.right.trim()
        : DEFAULT_SOFTKEYS.right,
  };
}

export function renderCommandBar(softkeys = {}) {
  const labels = normalizeSoftkeys(softkeys);

  return `<footer class="uiq-commandbar" aria-label="Soft keys">
    <span class="uiq-commandbar__key uiq-commandbar__key--left">${escapeHtml(labels.left)}</span>
    <span class="uiq-commandbar__key uiq-commandbar__key--center">${escapeHtml(labels.center)}</span>
    <span class="uiq-commandbar__key uiq-commandbar__key--right">${escapeHtml(labels.right)}</span>
  </footer>`;
}

export function renderStatusBanner(statusBanner = {}) {
  const safeStatusBanner =
    statusBanner && typeof statusBanner === "object" ? statusBanner : {};
  const { message = "", tone = "info", iconToken = "" } = safeStatusBanner;

  if (!message) {
    return "";
  }

  const safeTone = normalizeTone(tone);

  return `<p class="uiq-status-banner uiq-status-banner--${safeTone}">
    ${renderToken(iconToken, "uiq-status-banner__token")}
    <span class="uiq-status-banner__text">${escapeHtml(message)}</span>
  </p>`;
}

export function renderToast(toast = {}) {
  const safeToast = toast && typeof toast === "object" ? toast : {};
  const { message = "", tone = "info", visible = true } = safeToast;

  if (!visible || !message) {
    return "";
  }

  const safeTone = normalizeTone(tone);

  return `<aside class="uiq-toast uiq-toast--${safeTone}" role="status" aria-live="polite">
    ${escapeHtml(message)}
  </aside>`;
}

export function renderTabStrip({ tabs = [], activeTabId = "" } = {}) {
  const normalizedTabs = (Array.isArray(tabs) ? tabs : []).map(normalizeTabItem);

  if (!normalizedTabs.length) {
    return "";
  }

  const resolvedActive = normalizedTabs.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : normalizedTabs[0].id;

  return `<nav class="uiq-tabstrip uiq-tabstrip--compact" aria-label="View tabs">
    <ul class="uiq-tabstrip__list uiq-menu-tabs__list" role="tablist">
      ${normalizedTabs
        .map((tab) => {
          const classNames = ["uiq-tabstrip__tab"];
          const isActive = tab.id === resolvedActive;

          if (isActive) {
            classNames.push("is-active");
          }

          if (tab.disabled) {
            classNames.push("is-disabled");
          }

          return `<li class="${classNames.join(" ")}" data-tab-id="${escapeHtml(tab.id)}" role="tab" aria-selected="${isActive ? "true" : "false"}" aria-disabled="${tab.disabled ? "true" : "false"}">
            <span class="uiq-tabstrip__label">${escapeHtml(tab.label)}</span>
            ${tab.badge ? `<span class="uiq-tabstrip__badge">${escapeHtml(tab.badge)}</span>` : ""}
          </li>`;
        })
        .join("")}
    </ul>
  </nav>`;
}

export function renderList({
  title = "",
  items = [],
  selectedIndex = 0,
  emptyLabel = "No entries",
  className = "",
} = {}) {
  const normalizedItems = (Array.isArray(items) ? items : []).map(normalizeListItem);
  const resolvedSelectedIndex = clampIndex(selectedIndex, normalizedItems.length);
  const titleMarkup = title ? `<header class="uiq-list__header"><h3 class="uiq-list__title">${escapeHtml(title)}</h3></header>` : "";

  const listMarkup = normalizedItems.length
    ? `<ul class="uiq-list__items uiq-menu__items" role="listbox"${title ? ` aria-label="${escapeHtml(title)}"` : ""}>
      ${normalizedItems
        .map((item, index) => {
          const classNames = ["uiq-list__item", "uiq-menu__item"];
          const isSelected = index === resolvedSelectedIndex;

          if (isSelected) {
            classNames.push("is-selected");
          }

          if (item.unread) {
            classNames.push("is-unread");
          }

          if (item.disabled) {
            classNames.push("is-disabled");
          }

          return `<li class="${classNames.join(" ")}" data-item-id="${escapeHtml(item.id)}" role="option" aria-selected="${isSelected ? "true" : "false"}" aria-disabled="${item.disabled ? "true" : "false"}">
            <span class="uiq-list__main uiq-menu__main">
              ${renderToken(item.iconToken, "uiq-list__token")}
              <span class="uiq-list__label-wrap">
                <span class="uiq-list__label">${escapeHtml(item.label)}</span>
                ${item.subtitle ? `<span class="uiq-list__subtitle">${escapeHtml(item.subtitle)}</span>` : ""}
              </span>
            </span>
            <span class="uiq-list__meta uiq-menu__meta">
              ${item.badge ? `<span class="uiq-list__badge">${escapeHtml(item.badge)}</span>` : ""}
              ${item.trailing ? `<span class="uiq-list__trailing">${escapeHtml(item.trailing)}</span>` : ""}
            </span>
          </li>`;
        })
        .join("")}
    </ul>`
    : `<p class="uiq-list__empty">${escapeHtml(emptyLabel)}</p>`;

  const safeClassName = className ? ` ${className}` : "";

  return `<section class="uiq-list uiq-menu${safeClassName}">
    ${titleMarkup}
    ${listMarkup}
  </section>`;
}

export function renderDetailPanel({
  title = "Details",
  subtitle = "",
  description = "",
  rows = [],
  actions = [],
} = {}) {
  const safeActions = Array.isArray(actions) ? actions : [];

  return `<section class="uiq-detail-panel uiq-panel">
    <header class="uiq-detail-panel__header uiq-panel__header">
      <h3 class="uiq-detail-panel__title uiq-panel__title">${escapeHtml(title)}</h3>
      ${subtitle ? `<p class="uiq-detail-panel__subtitle uiq-panel__subtitle">${escapeHtml(subtitle)}</p>` : ""}
    </header>
    ${description ? `<p class="uiq-detail-panel__description uiq-panel__description">${escapeHtml(description)}</p>` : ""}
    ${renderRows(rows)}
    ${
      safeActions.length
        ? `<div class="uiq-detail-panel__actions uiq-panel__actions">
        ${safeActions
          .map((action, index) => {
            const safeAction = action && typeof action === "object" ? action : {};
            const label =
              typeof safeAction.label === "string" && safeAction.label.trim()
                ? safeAction.label.trim()
                : `Action ${index + 1}`;
            return `<button type="button" class="uiq-detail-panel__button uiq-panel__button" data-action-id="${escapeHtml(
              typeof safeAction.id === "string" ? safeAction.id : `action-${index + 1}`,
            )}">${escapeHtml(label)}</button>`;
          })
          .join("")}
      </div>`
        : ""
    }
  </section>`;
}

export function renderDialogPanel({
  open = false,
  title = "",
  message = "",
  lines = [],
  confirmLabel = "OK",
  cancelLabel = "",
  tone = "info",
} = {}) {
  if (!open) {
    return "";
  }

  const safeTone = normalizeTone(tone);
  const safeLines = Array.isArray(lines) ? lines : [];

  return `<div class="uiq-dialog-layer" data-dialog-layer="true">
    <article class="uiq-dialog uiq-dialog--${safeTone}" role="dialog" aria-modal="true">
      ${title ? `<h3 class="uiq-dialog__title">${escapeHtml(title)}</h3>` : ""}
      ${message ? `<p class="uiq-dialog__message">${escapeHtml(message)}</p>` : ""}
      ${
        safeLines.length
          ? `<div class="uiq-dialog__content">
          ${safeLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>`
          : ""
      }
      <footer class="uiq-dialog__actions">
        ${
          cancelLabel
            ? `<button type="button" class="uiq-dialog__button uiq-dialog__button--cancel" data-dialog-action="cancel">${escapeHtml(
                cancelLabel,
              )}</button>`
            : ""
        }
        <button type="button" class="uiq-dialog__button uiq-dialog__button--confirm" data-dialog-action="confirm">${escapeHtml(
          confirmLabel,
        )}</button>
      </footer>
    </article>
  </div>`;
}

export function renderBootScreen({
  brand = "Sony Ericsson",
  model = "P1i",
  platform = "UIQ 3.0",
  progress = 0,
  steps = [],
  statusText = "Initializing handset services...",
  softkeys,
  statusBanner,
} = {}) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  return `<section class="uiq-screen uiq-screen--boot" data-view-id="boot">
    <header class="uiq-header">
      <h2 class="uiq-header__title">${escapeHtml(brand)}</h2>
      <p class="uiq-header__meta">${escapeHtml(`${model} · ${platform}`)}</p>
    </header>
    <section class="uiq-boot">
      <p class="uiq-boot__brand">${escapeHtml(brand)}</p>
      <p class="uiq-boot__platform">${escapeHtml(platform)}</p>
      <div class="uiq-boot__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safeProgress}">
        <span class="uiq-boot__progress-fill" style="width: ${safeProgress}%"></span>
      </div>
      <p class="uiq-boot__status">${escapeHtml(statusText)}</p>
      <pre class="uiq-boot__steps">${escapeHtml(safeSteps.join("\n"))}</pre>
    </section>
    ${renderStatusBanner(statusBanner)}
    ${renderCommandBar(softkeys)}
  </section>`;
}

export function renderTodayView({
  title = "Today",
  timeLabel = "12:00",
  dateLabel = "Wed 25 Mar",
  operatorLabel = "SonyNet",
  profileLabel = "General",
  shortcuts = [],
  selectedShortcutIndex = 0,
  agendaItems = [],
  selectedAgendaIndex = 0,
  notifications = [],
  softkeys,
  statusBanner,
  toast,
} = {}) {
  const normalizedShortcuts = (Array.isArray(shortcuts) ? shortcuts : []).map(normalizeTileItem);
  const normalizedNotifications = (Array.isArray(notifications) ? notifications : []).map(normalizeListItem);
  const resolvedShortcutIndex = clampIndex(selectedShortcutIndex, normalizedShortcuts.length);

  const shortcutMarkup = normalizedShortcuts.length
    ? `<ul class="uiq-today__shortcuts uiq-menu__items" role="listbox" aria-label="Today shortcuts">
      ${normalizedShortcuts
        .map((item, index) => {
          const classNames = ["uiq-today__shortcut", "uiq-menu__item"];
          const isSelected = index === resolvedShortcutIndex;

          if (isSelected) {
            classNames.push("is-selected");
          }

          if (item.disabled) {
            classNames.push("is-disabled");
          }

          return `<li class="${classNames.join(" ")}" data-shortcut-id="${escapeHtml(item.id)}" role="option" aria-selected="${isSelected ? "true" : "false"}" aria-disabled="${item.disabled ? "true" : "false"}">
            ${renderToken(item.iconToken, "uiq-today__shortcut-token")}
            <span class="uiq-today__shortcut-label">${escapeHtml(item.label)}</span>
          </li>`;
        })
        .join("")}
    </ul>`
    : `<p class="uiq-today__empty">No shortcuts configured.</p>`;

  return `<section class="uiq-screen uiq-screen--today" data-view-id="today">
    <header class="uiq-header uiq-header--compact">
      <h2 class="uiq-header__title">${escapeHtml(title)}</h2>
      <p class="uiq-header__meta">${escapeHtml(operatorLabel)}</p>
    </header>
    <section class="uiq-today uiq-today--classic">
      <section class="uiq-today__clock-card uiq-today__panel uiq-today__panel--summary">
        <p class="uiq-today__time">${escapeHtml(timeLabel)}</p>
        <p class="uiq-today__date">${escapeHtml(dateLabel)}</p>
        <p class="uiq-today__profile">${escapeHtml(`Profile: ${profileLabel}`)}</p>
      </section>
      <section class="uiq-today__panel uiq-today__card uiq-today__panel--shortcuts">
        <header class="uiq-today__panel-header">
          <h3 class="uiq-today__card-title uiq-today__panel-title">Shortcuts</h3>
        </header>
        ${shortcutMarkup}
      </section>
      <section class="uiq-today__panel uiq-today__card uiq-today__panel--agenda">
        <header class="uiq-today__panel-header">
          <h3 class="uiq-today__card-title uiq-today__panel-title">Agenda</h3>
        </header>
        ${renderList({
          title: "",
          items: agendaItems,
          selectedIndex: selectedAgendaIndex,
          emptyLabel: "No upcoming entries",
          className: "uiq-today__agenda uiq-today__panel-list",
        })}
      </section>
      <section class="uiq-today__panel uiq-today__card uiq-today__panel--notifications">
        <header class="uiq-today__panel-header">
          <h3 class="uiq-today__card-title uiq-today__panel-title">Notifications</h3>
        </header>
        ${renderList({
          title: "",
          items: normalizedNotifications,
          selectedIndex: 0,
          emptyLabel: "No notifications",
          className: "uiq-today__notifications uiq-today__panel-list",
        })}
      </section>
    </section>
    ${renderStatusBanner(statusBanner)}
    ${renderToast(toast)}
    ${renderCommandBar(softkeys)}
  </section>`;
}

export function renderLauncherView({
  title = "Main menu",
  pageLabel = "1/1",
  apps = [],
  selectedIndex = 0,
  softkeys,
  statusBanner,
  toast,
} = {}) {
  const normalizedApps = (Array.isArray(apps) ? apps : []).map(normalizeTileItem);
  const resolvedSelectedIndex = clampIndex(selectedIndex, normalizedApps.length);

  const gridMarkup = normalizedApps.length
    ? `<ul class="uiq-launcher__grid uiq-menu__items" role="grid" aria-label="${escapeHtml(title)}">
      ${normalizedApps
        .map((app, index) => {
          const classNames = ["uiq-launcher__tile", "uiq-menu__item"];
          const isSelected = index === resolvedSelectedIndex;

          if (isSelected) {
            classNames.push("is-selected");
          }

          if (app.disabled) {
            classNames.push("is-disabled");
          }

          return `<li class="${classNames.join(" ")}" data-app-id="${escapeHtml(app.id)}" role="gridcell" aria-selected="${isSelected ? "true" : "false"}" aria-disabled="${app.disabled ? "true" : "false"}">
            ${renderToken(app.iconToken, "uiq-launcher__token")}
            <span class="uiq-launcher__label">${escapeHtml(app.label)}</span>
            ${app.badge ? `<span class="uiq-launcher__badge">${escapeHtml(app.badge)}</span>` : ""}
          </li>`;
        })
        .join("")}
    </ul>`
    : `<p class="uiq-launcher__empty">No applications installed.</p>`;

  return `<section class="uiq-screen uiq-screen--launcher" data-view-id="launcher">
    <header class="uiq-header uiq-header--compact">
      <h2 class="uiq-header__title">${escapeHtml(title)}</h2>
      <p class="uiq-header__meta">${escapeHtml(pageLabel)}</p>
    </header>
    <section class="uiq-launcher uiq-launcher--menu">
      ${gridMarkup}
    </section>
    ${renderStatusBanner(statusBanner)}
    ${renderToast(toast)}
    ${renderCommandBar(softkeys)}
  </section>`;
}

export function renderListAppScreen({
  appId = "app",
  title = "Application",
  subtitle = "",
  tabs = [],
  activeTabId = "",
  items = [],
  selectedIndex = 0,
  detailPanel = null,
  softkeys,
  statusBanner,
  toast,
} = {}) {
  const detailMarkup =
    detailPanel && typeof detailPanel === "object"
      ? renderDetailPanel(detailPanel)
      : "";

  return `<section class="uiq-screen uiq-screen--list-app" data-view-id="${escapeHtml(appId)}">
    <header class="uiq-header uiq-header--compact">
      <h2 class="uiq-header__title">${escapeHtml(title)}</h2>
      ${subtitle ? `<p class="uiq-header__meta">${escapeHtml(subtitle)}</p>` : ""}
    </header>
    ${renderTabStrip({ tabs, activeTabId })}
    <section class="uiq-app-body uiq-app-body--classic">
      ${renderList({
        items,
        selectedIndex,
        emptyLabel: "No entries",
        className: "uiq-app-body__list uiq-app-pane uiq-app-pane--list",
      })}
      ${detailMarkup}
    </section>
    ${renderStatusBanner(statusBanner)}
    ${renderToast(toast)}
    ${renderCommandBar(softkeys)}
  </section>`;
}

export const UIQ_VIEW_RENDERERS = Object.freeze({
  boot: renderBootScreen,
  today: renderTodayView,
  launcher: renderLauncherView,
  listApp: renderListAppScreen,
});
