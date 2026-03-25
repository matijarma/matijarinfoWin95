const DEFAULT_SOFTKEY_LABELS = Object.freeze({
  left: "Options",
  center: "Select",
  right: "Back",
});

const WEEKDAY_SHORT_LABELS = Object.freeze(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

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

function normalizeListItem(item, index) {
  if (typeof item === "string") {
    return {
      id: `item-${index + 1}`,
      label: item,
      subtitle: "",
      trailing: "",
      iconToken: "",
      disabled: false,
      isUnread: false,
      badge: "",
    };
  }

  const safeItem = item && typeof item === "object" ? item : {};

  return {
    id: typeof safeItem.id === "string" ? safeItem.id : `item-${index + 1}`,
    label: typeof safeItem.label === "string" ? safeItem.label : `Item ${index + 1}`,
    subtitle: typeof safeItem.subtitle === "string" ? safeItem.subtitle : "",
    trailing: typeof safeItem.trailing === "string" ? safeItem.trailing : "",
    iconToken: typeof safeItem.iconToken === "string" ? safeItem.iconToken : "",
    disabled: Boolean(safeItem.disabled),
    isUnread: Boolean(safeItem.isUnread),
    badge: typeof safeItem.badge === "string" ? safeItem.badge : "",
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

function normalizeGridItem(item, index) {
  if (typeof item === "string") {
    return {
      id: `grid-${index + 1}`,
      label: item,
      iconToken: item.slice(0, 2).toUpperCase(),
      disabled: false,
    };
  }

  const safeItem = item && typeof item === "object" ? item : {};

  const rawLabel = typeof safeItem.label === "string" ? safeItem.label : `App ${index + 1}`;

  return {
    id: typeof safeItem.id === "string" ? safeItem.id : `grid-${index + 1}`,
    label: rawLabel,
    iconToken:
      typeof safeItem.iconToken === "string" && safeItem.iconToken.trim()
        ? safeItem.iconToken
        : rawLabel.slice(0, 2).toUpperCase(),
    disabled: Boolean(safeItem.disabled),
  };
}

function renderIconToken(iconToken) {
  if (!iconToken) {
    return "";
  }

  return `<span class="symbian-icon-chip" aria-hidden="true">${escapeHtml(iconToken)}</span>`;
}

function renderListItems(items, selectedIndex) {
  if (!items.length) {
    return "";
  }

  const activeIndex = clampIndex(selectedIndex, items.length);

  return items
    .map((item, index) => {
      const classNames = ["symbian-list__item"];

      if (index === activeIndex) {
        classNames.push("is-selected");
      }

      if (item.disabled) {
        classNames.push("is-disabled");
      }

      if (item.isUnread) {
        classNames.push("is-unread");
      }

      const subtitleMarkup = item.subtitle
        ? `<span class="symbian-list__subtitle">${escapeHtml(item.subtitle)}</span>`
        : "";

      const trailingMarkup = item.trailing
        ? `<span class="symbian-list__trailing">${escapeHtml(item.trailing)}</span>`
        : "";

      const badgeMarkup = item.badge
        ? `<span class="symbian-list__badge">${escapeHtml(item.badge)}</span>`
        : "";

      return `<li class="${classNames.join(" ")}" data-item-id="${escapeHtml(item.id)}">
        <div class="symbian-list__main">
          ${renderIconToken(item.iconToken)}
          <span class="symbian-list__label-wrap">
            <span class="symbian-list__label">${escapeHtml(item.label)}</span>
            ${subtitleMarkup}
          </span>
        </div>
        <div class="symbian-list__meta">${badgeMarkup}${trailingMarkup}</div>
      </li>`;
    })
    .join("");
}

function renderMonthCells(monthGrid, selectedDate) {
  const cells = Array.isArray(monthGrid) ? monthGrid : [];

  if (!cells.length) {
    return "";
  }

  const firstCell = cells[0];
  const rows = Array.isArray(firstCell)
    ? cells
    : Array.from({ length: Math.ceil(cells.length / 7) }, (_, rowIndex) =>
        cells.slice(rowIndex * 7, rowIndex * 7 + 7),
      );

  return rows
    .map((week, weekIndex) => {
      const weekCells = Array.isArray(week) ? week : [];

      const tds = weekCells
        .map((day, dayIndex) => {
          const safeDay = day && typeof day === "object" ? day : {};
          const dayNumber = Number.isFinite(safeDay.day) ? Math.trunc(safeDay.day) : "";
          const isDimmed = Boolean(safeDay.isOutsideMonth);
          const isToday = Boolean(safeDay.isToday);
          const hasEvent = Boolean(safeDay.hasEvent);
          const isoDate = typeof safeDay.isoDate === "string" ? safeDay.isoDate : "";
          const isSelected = Boolean(selectedDate && isoDate && selectedDate === isoDate);

          const classNames = ["symbian-calendar-grid__cell"];
          if (isDimmed) {
            classNames.push("is-outside");
          }
          if (isToday) {
            classNames.push("is-today");
          }
          if (hasEvent) {
            classNames.push("has-event");
          }
          if (isSelected) {
            classNames.push("is-selected");
          }

          return `<td class="${classNames.join(" ")}" data-week-index="${weekIndex}" data-day-index="${dayIndex}">
            <span class="symbian-calendar-grid__day">${escapeHtml(dayNumber)}</span>
          </td>`;
        })
        .join("");

      return `<tr>${tds}</tr>`;
    })
    .join("");
}

function renderAppScaffold({
  appId,
  title,
  subtitle = "",
  tabs = [],
  activeTabId = "",
  body,
  statusMessage = "",
  statusTone = "info",
  softkeys,
}) {
  const subtitleMarkup = subtitle
    ? `<p class="symbian-app-header__subtitle">${escapeHtml(subtitle)}</p>`
    : "";

  const tabMarkup = tabs.length ? renderTabs({ tabs, activeTabId }) : "";

  return `<section class="symbian-screen symbian-screen--app" data-app-id="${escapeHtml(appId)}">
    <header class="symbian-app-header">
      <h2 class="symbian-app-header__title">${escapeHtml(title)}</h2>
      ${subtitleMarkup}
    </header>
    ${tabMarkup}
    <div class="symbian-app-body">${body || ""}</div>
    ${renderStatusMessage({ message: statusMessage, tone: statusTone })}
    ${renderSoftkeyBar(softkeys)}
  </section>`;
}

export function normalizeSoftkeyLabels(softkeys = {}) {
  const source = softkeys && typeof softkeys === "object" ? softkeys : {};

  return {
    left: typeof source.left === "string" && source.left.trim() ? source.left : DEFAULT_SOFTKEY_LABELS.left,
    center:
      typeof source.center === "string" && source.center.trim()
        ? source.center
        : DEFAULT_SOFTKEY_LABELS.center,
    right:
      typeof source.right === "string" && source.right.trim() ? source.right : DEFAULT_SOFTKEY_LABELS.right,
  };
}

export function renderSoftkeyBar(softkeys = {}) {
  const labels = normalizeSoftkeyLabels(softkeys);

  return `<footer class="symbian-softkeys" aria-label="Soft key labels">
    <span class="symbian-softkeys__key symbian-softkeys__key--left">${escapeHtml(labels.left)}</span>
    <span class="symbian-softkeys__key symbian-softkeys__key--center">${escapeHtml(labels.center)}</span>
    <span class="symbian-softkeys__key symbian-softkeys__key--right">${escapeHtml(labels.right)}</span>
  </footer>`;
}

export function renderStatusMessage(status = {}) {
  const normalized =
    typeof status === "string"
      ? { message: status, tone: "info" }
      : status && typeof status === "object"
        ? status
        : { message: "", tone: "info" };

  if (!normalized.message) {
    return "";
  }

  const tone = typeof normalized.tone === "string" && normalized.tone.trim() ? normalized.tone : "info";

  return `<p class="symbian-status-message symbian-status-message--${escapeHtml(tone)}">${escapeHtml(
    normalized.message,
  )}</p>`;
}

export function renderTabs({ tabs = [], activeTabId = "" } = {}) {
  const normalizedTabs = tabs.map(normalizeTabItem);

  if (!normalizedTabs.length) {
    return "";
  }

  const hasActive = normalizedTabs.some((tab) => tab.id === activeTabId);
  const resolvedActiveTabId = hasActive ? activeTabId : normalizedTabs[0].id;

  const tabItems = normalizedTabs
    .map((tab) => {
      const classNames = ["symbian-tabs__item"];

      if (tab.id === resolvedActiveTabId) {
        classNames.push("is-active");
      }

      if (tab.disabled) {
        classNames.push("is-disabled");
      }

      const badgeMarkup = tab.badge
        ? `<span class="symbian-tabs__badge">${escapeHtml(tab.badge)}</span>`
        : "";

      return `<li class="${classNames.join(" ")}" data-tab-id="${escapeHtml(tab.id)}">
        <span class="symbian-tabs__label">${escapeHtml(tab.label)}</span>
        ${badgeMarkup}
      </li>`;
    })
    .join("");

  return `<nav class="symbian-tabs" aria-label="Application tabs">
    <ul class="symbian-tabs__list">${tabItems}</ul>
  </nav>`;
}

export function renderListPane({
  title = "",
  items = [],
  selectedIndex = 0,
  emptyLabel = "No entries",
  className = "",
} = {}) {
  const normalizedItems = items.map(normalizeListItem);
  const safeClassName = className ? ` ${className}` : "";

  const titleMarkup = title ? `<h3 class="symbian-pane__title">${escapeHtml(title)}</h3>` : "";

  const listMarkup = normalizedItems.length
    ? `<ul class="symbian-list">${renderListItems(normalizedItems, selectedIndex)}</ul>`
    : `<p class="symbian-empty">${escapeHtml(emptyLabel)}</p>`;

  return `<section class="symbian-pane symbian-list-pane${safeClassName}">
    ${titleMarkup}
    ${listMarkup}
  </section>`;
}

export function renderStandbyScreen({
  timeLabel = "12:00",
  dateLabel = "Mon 01 Jan",
  profileLabel = "General",
  operatorLabel = "Symbian Net",
  signalLabel = "Signal: strong",
  batteryLabel = "Battery: 86%",
  notifications = [],
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedNotifications = notifications.map((entry, index) => normalizeListItem(entry, index));

  const notificationsMarkup = normalizedNotifications.length
    ? `<ul class="symbian-standby__notifications">${normalizedNotifications
        .map((entry) => {
          const subtitleMarkup = entry.subtitle
            ? `<span class="symbian-standby__notification-subtitle">${escapeHtml(entry.subtitle)}</span>`
            : "";

          return `<li class="symbian-standby__notification" data-notification-id="${escapeHtml(entry.id)}">
            ${renderIconToken(entry.iconToken)}
            <span class="symbian-standby__notification-main">
              <span class="symbian-standby__notification-label">${escapeHtml(entry.label)}</span>
              ${subtitleMarkup}
            </span>
            <span class="symbian-standby__notification-trailing">${escapeHtml(entry.trailing)}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="symbian-empty">No new alerts</p>`;

  return `<section class="symbian-screen symbian-screen--standby" data-view-id="standby">
    <header class="symbian-standby__status">
      <p class="symbian-standby__operator">${escapeHtml(operatorLabel)}</p>
      <p class="symbian-standby__meters">
        <span>${escapeHtml(signalLabel)}</span>
        <span>${escapeHtml(batteryLabel)}</span>
      </p>
    </header>
    <div class="symbian-standby__clock-block">
      <p class="symbian-standby__time">${escapeHtml(timeLabel)}</p>
      <p class="symbian-standby__date">${escapeHtml(dateLabel)}</p>
      <p class="symbian-standby__profile">${escapeHtml(profileLabel)}</p>
    </div>
    <div class="symbian-standby__events">
      <h2 class="symbian-standby__events-title">Standby</h2>
      ${notificationsMarkup}
    </div>
    ${renderStatusMessage(statusMessage)}
    ${renderSoftkeyBar(softkeys)}
  </section>`;
}

export function renderHomeScreen({
  title = "Active Standby",
  profileLabel = "General",
  shortcuts = [],
  selectedShortcutIndex = 0,
  agendaItems = [],
  selectedAgendaIndex = 0,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedShortcuts = shortcuts.map(normalizeGridItem);
  const activeShortcutIndex = clampIndex(selectedShortcutIndex, normalizedShortcuts.length);

  const shortcutsMarkup = normalizedShortcuts.length
    ? `<ul class="symbian-shortcuts">${normalizedShortcuts
        .map((item, index) => {
          const classNames = ["symbian-shortcuts__item"];
          if (index === activeShortcutIndex) {
            classNames.push("is-selected");
          }

          return `<li class="${classNames.join(" ")}" data-shortcut-id="${escapeHtml(item.id)}">
            ${renderIconToken(item.iconToken)}
            <span class="symbian-shortcuts__label">${escapeHtml(item.label)}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="symbian-empty">No shortcuts configured</p>`;

  const agendaMarkup = renderListPane({
    title: "Agenda",
    items: agendaItems,
    selectedIndex: selectedAgendaIndex,
    emptyLabel: "No upcoming events",
  });

  return `<section class="symbian-screen symbian-screen--home" data-view-id="home">
    <header class="symbian-home__header">
      <h2 class="symbian-home__title">${escapeHtml(title)}</h2>
      <p class="symbian-home__profile">${escapeHtml(profileLabel)}</p>
    </header>
    <section class="symbian-pane symbian-home__shortcuts">
      <h3 class="symbian-pane__title">Shortcuts</h3>
      ${shortcutsMarkup}
    </section>
    ${agendaMarkup}
    ${renderStatusMessage(statusMessage)}
    ${renderSoftkeyBar(softkeys)}
  </section>`;
}

export function renderMenuGridScreen({
  title = "Menu",
  apps = [],
  selectedIndex = 0,
  page = 1,
  pageSize = 12,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedApps = apps.map(normalizeGridItem);
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 12;
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
  const pageStart = (safePage - 1) * safePageSize;
  const visibleApps = normalizedApps.slice(pageStart, pageStart + safePageSize);
  const activeIndex = clampIndex(selectedIndex, visibleApps.length);
  const totalPages = Math.max(1, Math.ceil(normalizedApps.length / safePageSize));

  const gridMarkup = visibleApps.length
    ? `<ul class="symbian-menu-grid">${visibleApps
        .map((app, index) => {
          const classNames = ["symbian-menu-grid__item"];

          if (index === activeIndex) {
            classNames.push("is-selected");
          }

          if (app.disabled) {
            classNames.push("is-disabled");
          }

          return `<li class="${classNames.join(" ")}" data-app-id="${escapeHtml(app.id)}">
            <span class="symbian-menu-grid__icon" aria-hidden="true">${escapeHtml(app.iconToken)}</span>
            <span class="symbian-menu-grid__label">${escapeHtml(app.label)}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="symbian-empty">No applications installed</p>`;

  return `<section class="symbian-screen symbian-screen--menu" data-view-id="menu">
    <header class="symbian-menu__header">
      <h2 class="symbian-menu__title">${escapeHtml(title)}</h2>
      <p class="symbian-menu__page">Page ${safePage}/${totalPages}</p>
    </header>
    ${gridMarkup}
    ${renderStatusMessage(statusMessage)}
    ${renderSoftkeyBar(softkeys)}
  </section>`;
}

export function renderContactsApp({
  contacts = [],
  selectedIndex = 0,
  filterQuery = "",
  tabs = ["All", "Favorites", "SIM"],
  activeTabId = "",
  softkeys,
  statusMessage = "",
} = {}) {
  const body = `<div class="symbian-toolbar">
      <span class="symbian-toolbar__label">Find:</span>
      <span class="symbian-toolbar__value">${escapeHtml(filterQuery || "(no filter)")}</span>
    </div>
    ${renderListPane({
      title: `Contacts (${contacts.length})`,
      items: contacts,
      selectedIndex,
      emptyLabel: "No contacts",
    })}`;

  return renderAppScaffold({
    appId: "contacts",
    title: "Contacts",
    subtitle: "Phone memory",
    tabs,
    activeTabId,
    body,
    statusMessage,
    softkeys,
  });
}

export function renderMessagesApp({
  folders = [
    { id: "inbox", label: "Inbox" },
    { id: "sent", label: "Sent" },
    { id: "drafts", label: "Drafts" },
  ],
  activeFolderId = "inbox",
  messagesByFolder = {},
  selectedIndex = 0,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedFolders = folders.map(normalizeTabItem);
  const hasFolder = normalizedFolders.some((folder) => folder.id === activeFolderId);
  const resolvedFolderId = hasFolder ? activeFolderId : normalizedFolders[0]?.id || "";
  const folderItems = Array.isArray(messagesByFolder[resolvedFolderId])
    ? messagesByFolder[resolvedFolderId]
    : [];

  const body = renderListPane({
    title: resolvedFolderId ? `Folder: ${resolvedFolderId}` : "Messages",
    items: folderItems,
    selectedIndex,
    emptyLabel: "No messages",
  });

  return renderAppScaffold({
    appId: "messages",
    title: "Messaging",
    subtitle: "SMS / MMS",
    tabs: normalizedFolders,
    activeTabId: resolvedFolderId,
    body,
    statusMessage,
    softkeys,
  });
}

export function renderCalendarApp({
  dateLabel = "",
  tabs = [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "agenda", label: "Agenda" },
  ],
  activeTabId = "agenda",
  agendaItems = [],
  selectedAgendaIndex = 0,
  monthGrid = [],
  selectedDate = "",
  softkeys,
  statusMessage = "",
} = {}) {
  const monthMarkup = `<section class="symbian-pane symbian-calendar-grid-pane">
      <h3 class="symbian-pane__title">${escapeHtml(dateLabel || "Month view")}</h3>
      <table class="symbian-calendar-grid" aria-label="Month grid">
        <thead>
          <tr>${WEEKDAY_SHORT_LABELS.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
        </thead>
        <tbody>${renderMonthCells(monthGrid, selectedDate)}</tbody>
      </table>
    </section>`;

  const agendaMarkup = renderListPane({
    title: dateLabel || "Agenda",
    items: agendaItems,
    selectedIndex: selectedAgendaIndex,
    emptyLabel: "No appointments",
  });

  const body = activeTabId === "month" ? monthMarkup : agendaMarkup;

  return renderAppScaffold({
    appId: "calendar",
    title: "Calendar",
    subtitle: dateLabel,
    tabs,
    activeTabId,
    body,
    statusMessage,
    softkeys,
  });
}

export function renderGalleryApp({
  albums = [],
  activeAlbumId = "",
  itemsByAlbum = {},
  selectedIndex = 0,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedAlbums = albums.map(normalizeTabItem);
  const hasActiveAlbum = normalizedAlbums.some((album) => album.id === activeAlbumId);
  const resolvedAlbumId = hasActiveAlbum ? activeAlbumId : normalizedAlbums[0]?.id || "";
  const mediaItems = Array.isArray(itemsByAlbum[resolvedAlbumId]) ? itemsByAlbum[resolvedAlbumId] : [];
  const activeIndex = clampIndex(selectedIndex, mediaItems.length);

  const gridMarkup = mediaItems.length
    ? `<ul class="symbian-thumb-grid">${mediaItems
        .map((mediaItem, index) => {
          const normalizedItem = normalizeListItem(mediaItem, index);
          const classNames = ["symbian-thumb-grid__item"];
          if (index === activeIndex) {
            classNames.push("is-selected");
          }

          return `<li class="${classNames.join(" ")}" data-media-id="${escapeHtml(normalizedItem.id)}">
            <span class="symbian-thumb-grid__preview">${escapeHtml(
              normalizedItem.iconToken || normalizedItem.label.slice(0, 2).toUpperCase(),
            )}</span>
            <span class="symbian-thumb-grid__label">${escapeHtml(normalizedItem.label)}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="symbian-empty">No media in this album</p>`;

  const body = `<section class="symbian-pane symbian-gallery-pane">
      <h3 class="symbian-pane__title">Album: ${escapeHtml(resolvedAlbumId || "Gallery")}</h3>
      ${gridMarkup}
    </section>`;

  return renderAppScaffold({
    appId: "gallery",
    title: "Gallery",
    subtitle: "Images & videos",
    tabs: normalizedAlbums,
    activeTabId: resolvedAlbumId,
    body,
    statusMessage,
    softkeys,
  });
}

export function renderMusicApp({
  tracks = [],
  selectedTrackIndex = 0,
  nowPlaying = null,
  isPlaying = false,
  progressLabel = "",
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedTracks = tracks.map(normalizeListItem);
  const activeTrackIndex = clampIndex(selectedTrackIndex, normalizedTracks.length);
  const playingTrack =
    nowPlaying && typeof nowPlaying === "object"
      ? normalizeListItem(nowPlaying, 0)
      : normalizedTracks[activeTrackIndex] || null;

  const nowPlayingMarkup = playingTrack
    ? `<section class="symbian-pane symbian-now-playing">
        <h3 class="symbian-pane__title">Now playing</h3>
        <p class="symbian-now-playing__title">${escapeHtml(playingTrack.label)}</p>
        <p class="symbian-now-playing__artist">${escapeHtml(
          playingTrack.subtitle || "Unknown artist",
        )}</p>
        <p class="symbian-now-playing__progress">${escapeHtml(progressLabel || "00:00 / 00:00")}</p>
        <p class="symbian-now-playing__state">${isPlaying ? "Playing" : "Paused"}</p>
      </section>`
    : `<section class="symbian-pane symbian-now-playing">
        <h3 class="symbian-pane__title">Now playing</h3>
        <p class="symbian-empty">No track selected</p>
      </section>`;

  const playlistMarkup = renderListPane({
    title: "Library",
    items: normalizedTracks,
    selectedIndex: activeTrackIndex,
    emptyLabel: "No tracks",
  });

  return renderAppScaffold({
    appId: "music",
    title: "Music",
    subtitle: "RealPlayer",
    body: `${nowPlayingMarkup}${playlistMarkup}`,
    statusMessage,
    softkeys,
  });
}

export function renderBrowserApp({
  pageTitle = "Start page",
  address = "https://",
  tabs = [
    { id: "bookmarks", label: "Bookmarks" },
    { id: "history", label: "History" },
  ],
  activeTabId = "bookmarks",
  itemsByTab = {},
  selectedIndex = 0,
  loading = false,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedTabs = tabs.map(normalizeTabItem);
  const hasActiveTab = normalizedTabs.some((tab) => tab.id === activeTabId);
  const resolvedTabId = hasActiveTab ? activeTabId : normalizedTabs[0]?.id || "";
  const tabItems = Array.isArray(itemsByTab[resolvedTabId]) ? itemsByTab[resolvedTabId] : [];

  const addressMarkup = `<section class="symbian-pane symbian-browser-address">
      <h3 class="symbian-pane__title">Address</h3>
      <p class="symbian-browser-address__url">${escapeHtml(address)}</p>
      <p class="symbian-browser-address__title">${escapeHtml(pageTitle)}</p>
      <p class="symbian-browser-address__state">${loading ? "Loading..." : "Ready"}</p>
    </section>`;

  const listMarkup = renderListPane({
    title: resolvedTabId || "Browser",
    items: tabItems,
    selectedIndex,
    emptyLabel: "No entries",
  });

  return renderAppScaffold({
    appId: "browser",
    title: "Web",
    subtitle: "Services",
    tabs: normalizedTabs,
    activeTabId: resolvedTabId,
    body: `${addressMarkup}${listMarkup}`,
    statusMessage,
    softkeys,
  });
}

export function renderFileManagerApp({
  currentPath = "C:/",
  entries = [],
  selectedIndex = 0,
  storageSummary = [],
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedSummary = storageSummary.map((entry, index) => normalizeListItem(entry, index));

  const summaryMarkup = normalizedSummary.length
    ? `<section class="symbian-pane symbian-storage-summary">
      <h3 class="symbian-pane__title">Drives</h3>
      <ul class="symbian-storage-summary__list">${normalizedSummary
        .map(
          (entry) => `<li class="symbian-storage-summary__item">
            <span class="symbian-storage-summary__name">${escapeHtml(entry.label)}</span>
            <span class="symbian-storage-summary__value">${escapeHtml(entry.trailing || entry.subtitle)}</span>
          </li>`,
        )
        .join("")}</ul>
    </section>`
    : "";

  const listMarkup = renderListPane({
    title: `Path: ${currentPath}`,
    items: entries,
    selectedIndex,
    emptyLabel: "Folder is empty",
  });

  return renderAppScaffold({
    appId: "file-manager",
    title: "File mgr.",
    subtitle: currentPath,
    body: `${summaryMarkup}${listMarkup}`,
    statusMessage,
    softkeys,
  });
}

export function renderNotesApp({
  notes = [],
  selectedIndex = 0,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedNotes = notes.map(normalizeListItem);
  const activeIndex = clampIndex(selectedIndex, normalizedNotes.length);
  const selectedNote = normalizedNotes[activeIndex] || null;

  const listMarkup = renderListPane({
    title: "Notes",
    items: normalizedNotes,
    selectedIndex: activeIndex,
    emptyLabel: "No notes",
    className: "symbian-notes__list-pane",
  });

  const previewMarkup = `<section class="symbian-pane symbian-notes__preview-pane">
      <h3 class="symbian-pane__title">Preview</h3>
      <p class="symbian-notes__preview-text">${escapeHtml(
        selectedNote?.subtitle || selectedNote?.label || "Select a note to preview",
      )}</p>
    </section>`;

  return renderAppScaffold({
    appId: "notes",
    title: "Notes",
    subtitle: `${normalizedNotes.length} saved`,
    body: `<div class="symbian-notes-layout">${listMarkup}${previewMarkup}</div>`,
    statusMessage,
    softkeys,
  });
}

export function renderSettingsApp({
  categories = [],
  selectedCategoryIndex = 0,
  detailItems = [],
  selectedDetailIndex = 0,
  softkeys,
  statusMessage = "",
} = {}) {
  const normalizedCategories = categories.map(normalizeListItem);
  const categoryIndex = clampIndex(selectedCategoryIndex, normalizedCategories.length);
  const activeCategory = normalizedCategories[categoryIndex] || null;

  const leftPane = renderListPane({
    title: "Categories",
    items: normalizedCategories,
    selectedIndex: categoryIndex,
    emptyLabel: "No categories",
    className: "symbian-settings__categories",
  });

  const rightPane = renderListPane({
    title: activeCategory ? activeCategory.label : "Details",
    items: detailItems,
    selectedIndex: selectedDetailIndex,
    emptyLabel: "No settings",
    className: "symbian-settings__details",
  });

  return renderAppScaffold({
    appId: "settings",
    title: "Settings",
    subtitle: activeCategory?.subtitle || "Phone",
    body: `<div class="symbian-settings-layout">${leftPane}${rightPane}</div>`,
    statusMessage,
    softkeys,
  });
}

export function renderExtrasApp({
  tools = [],
  selectedIndex = 0,
  tip = "",
  softkeys,
  statusMessage = "",
} = {}) {
  const toolsMarkup = renderListPane({
    title: "Utilities",
    items: tools,
    selectedIndex,
    emptyLabel: "No extras installed",
  });

  const tipMarkup = tip
    ? `<section class="symbian-pane symbian-extras-tip">
      <h3 class="symbian-pane__title">Tip</h3>
      <p class="symbian-extras-tip__text">${escapeHtml(tip)}</p>
    </section>`
    : "";

  return renderAppScaffold({
    appId: "extras",
    title: "Extras",
    subtitle: "Tools",
    body: `${toolsMarkup}${tipMarkup}`,
    statusMessage,
    softkeys,
  });
}

export const SYMBIAN_APP_RENDERERS = Object.freeze({
  standby: renderStandbyScreen,
  home: renderHomeScreen,
  menu: renderMenuGridScreen,
  contacts: renderContactsApp,
  messages: renderMessagesApp,
  calendar: renderCalendarApp,
  gallery: renderGalleryApp,
  music: renderMusicApp,
  browser: renderBrowserApp,
  fileManager: renderFileManagerApp,
  notes: renderNotesApp,
  settings: renderSettingsApp,
  extras: renderExtrasApp,
});
