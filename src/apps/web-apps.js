const DEFAULT_CONFIG_URL = new URL("./web-apps.config.json", import.meta.url).toString();
const DEFAULT_START_SUBMENU = "Web Apps";

const ORIENTATION_PRESETS = Object.freeze({
  landscape: {
    width: 900,
    height: 580,
    minWidth: 520,
    minHeight: 320,
  },
  portrait: {
    width: 520,
    height: 700,
    minWidth: 360,
    minHeight: 420,
  },
});

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOrientation(value) {
  if (typeof value !== "string") {
    return "landscape";
  }

  return value.toLowerCase() === "portrait" ? "portrait" : "landscape";
}

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function toSlug(value) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "app";
}

function normalizeHttpUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeIconUrl(iconValue, appUrl) {
  if (typeof iconValue !== "string") {
    return null;
  }

  const trimmed = iconValue.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  try {
    return new URL(trimmed, appUrl).toString();
  } catch {
    return null;
  }
}

function buildUniqueId(baseId, usedIds) {
  let safeId = `web-app-${toSlug(baseId)}`;

  if (!usedIds.has(safeId)) {
    usedIds.add(safeId);
    return safeId;
  }

  let suffix = 2;

  while (usedIds.has(`${safeId}-${suffix}`)) {
    suffix += 1;
  }

  safeId = `${safeId}-${suffix}`;
  usedIds.add(safeId);
  return safeId;
}

function normalizePlacement(rawApp) {
  const showOnDesktop = rawApp.showOnDesktop !== false;
  const showInStartMenu = rawApp.showInStartMenu !== false;
  const placements = [];

  if (showOnDesktop) {
    placements.push("desktop");
  }

  if (showInStartMenu) {
    placements.push("start");
  }

  if (placements.length === 0) {
    placements.push("start");
  }

  return placements;
}

function normalizeWindowConfig(rawApp, orientation, resizable) {
  const preset = ORIENTATION_PRESETS[orientation];
  const windowOverrides = rawApp && typeof rawApp.window === "object" ? rawApp.window : {};

  const width = toFiniteNumber(
    rawApp.width ?? windowOverrides.width,
    preset.width,
  );
  const height = toFiniteNumber(
    rawApp.height ?? windowOverrides.height,
    preset.height,
  );
  const minWidth = toFiniteNumber(
    rawApp.minWidth ?? windowOverrides.minWidth,
    preset.minWidth,
  );
  const minHeight = toFiniteNumber(
    rawApp.minHeight ?? windowOverrides.minHeight,
    preset.minHeight,
  );

  return {
    width,
    height,
    minWidth,
    minHeight,
    resizable,
    maximizable: resizable,
    minimizable: toBoolean(rawApp.minimizable, true),
    closable: toBoolean(rawApp.closable, true),
    startMaximized: toBoolean(
      rawApp.defaultFullscreen ?? rawApp.fullscreenDefault,
      false,
    ),
  };
}

function toOrientationLabel(orientation) {
  return orientation === "portrait" ? "Portrait" : "Landscape";
}

function normalizeApp(rawApp, index, usedIds, defaultSubmenu) {
  if (!rawApp || typeof rawApp !== "object") {
    return null;
  }

  const normalizedUrl = normalizeHttpUrl(rawApp.url);

  if (!normalizedUrl) {
    return null;
  }

  const parsedUrl = new URL(normalizedUrl);
  const orientation = normalizeOrientation(rawApp.orientation);
  const resizable = toBoolean(rawApp.resizable, true);
  const title = normalizeText(rawApp.title, parsedUrl.hostname);
  const baseId = normalizeText(rawApp.id, `${parsedUrl.hostname}-${index + 1}`);

  return {
    id: buildUniqueId(baseId, usedIds),
    title,
    description: normalizeText(rawApp.description, "Web app hosted in an optimized iframe window."),
    url: normalizedUrl,
    iconKey: normalizeText(rawApp.iconKey, "internet_explorer"),
    iconUrl: normalizeIconUrl(rawApp.iconUrl ?? rawApp.icon, normalizedUrl),
    orientation,
    orientationLabel: toOrientationLabel(orientation),
    resizable,
    startMenuSubmenu: normalizeText(rawApp.startMenuSubmenu, defaultSubmenu),
    openDirectLabel: normalizeText(rawApp.openDirectLabel, "Open Directly"),
    launchModeLabel: toBoolean(
      rawApp.defaultFullscreen ?? rawApp.fullscreenDefault,
      false,
    )
      ? "Fullscreen by default"
      : "Windowed by default",
    placements: normalizePlacement(rawApp),
    window: normalizeWindowConfig(rawApp, orientation, resizable),
  };
}

export async function loadWebAppConfigs(configUrl = DEFAULT_CONFIG_URL) {
  try {
    const response = await fetch(configUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load web app config: HTTP ${response.status}`);
    }

    const payload = await response.json();
    const rawApps = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.apps)
        ? payload.apps
        : [];
    const defaultSubmenu = normalizeText(payload?.startMenuSubmenu, DEFAULT_START_SUBMENU);
    const usedIds = new Set();
    const normalizedApps = [];

    for (let index = 0; index < rawApps.length; index += 1) {
      const normalized = normalizeApp(rawApps[index], index, usedIds, defaultSubmenu);

      if (!normalized) {
        continue;
      }

      normalizedApps.push(normalized);
    }

    return normalizedApps;
  } catch (error) {
    console.error("Failed to load web app configs.", error);
    return [];
  }
}

function normalizeLaunchUrl(rawUrl, fallbackUrl) {
  const normalized = normalizeHttpUrl(rawUrl);
  return normalized || fallbackUrl;
}

function createWebAppWindowContent(appConfig, launchPayload = {}) {
  const root = document.createElement("section");
  root.className = `web-app-host web-app-host--${appConfig.orientation}`;

  const toolbar = document.createElement("header");
  toolbar.className = "web-app-host__toolbar";

  const titleNode = document.createElement("span");
  titleNode.className = "web-app-host__origin";

  const toolbarActions = document.createElement("div");
  toolbarActions.className = "web-app-host__actions";

  const reloadButton = document.createElement("button");
  reloadButton.type = "button";
  reloadButton.className = "web-app-host__button";
  reloadButton.textContent = "Reload";

  const openDirectButton = document.createElement("button");
  openDirectButton.type = "button";
  openDirectButton.className = "web-app-host__button";
  openDirectButton.textContent = appConfig.openDirectLabel;

  toolbarActions.append(reloadButton, openDirectButton);
  toolbar.append(titleNode, toolbarActions);

  const iframe = document.createElement("iframe");
  iframe.className = "web-app-host__frame";
  iframe.title = `${appConfig.title} app viewport`;
  iframe.loading = "eager";
  iframe.allow = "clipboard-read; clipboard-write; fullscreen; autoplay";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  const statusNode = document.createElement("p");
  statusNode.className = "web-app-host__status";

  root.append(toolbar, iframe, statusNode);

  let currentUrl = normalizeLaunchUrl(launchPayload?.url, appConfig.url);

  function setStatus(textContent) {
    statusNode.textContent = textContent;
  }

  function navigate(nextUrl) {
    currentUrl = normalizeLaunchUrl(nextUrl, appConfig.url);
    titleNode.textContent = currentUrl;
    iframe.src = currentUrl;
    setStatus(`Loading ${currentUrl}...`);
  }

  const frameLoadHandler = () => {
    setStatus(`Loaded ${currentUrl}.`);
  };

  const frameErrorHandler = () => {
    setStatus("The app failed to load in iframe. Use Open Directly.");
  };

  const reloadHandler = () => {
    navigate(currentUrl);
  };

  const openDirectHandler = () => {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  };

  iframe.addEventListener("load", frameLoadHandler);
  iframe.addEventListener("error", frameErrorHandler);
  reloadButton.addEventListener("click", reloadHandler);
  openDirectButton.addEventListener("click", openDirectHandler);

  navigate(currentUrl);

  return {
    element: root,
    dispose() {
      iframe.removeEventListener("load", frameLoadHandler);
      iframe.removeEventListener("error", frameErrorHandler);
      reloadButton.removeEventListener("click", reloadHandler);
      openDirectButton.removeEventListener("click", openDirectHandler);
    },
  };
}

function createInfoPanelConfig(appConfig) {
  return {
    heading: `${appConfig.title} Info`,
    description: appConfig.description,
    meta: [
      {
        label: "URL",
        value: appConfig.url,
      },
      {
        label: "Orientation",
        value: appConfig.orientationLabel,
      },
      {
        label: "Launch",
        value: appConfig.launchModeLabel,
      },
      {
        label: "Resizable",
        value: appConfig.resizable ? "Yes" : "No",
      },
    ],
    actions: [
      {
        id: `${appConfig.id}-open-direct`,
        label: appConfig.openDirectLabel,
        action: "open-url",
        url: appConfig.url,
      },
    ],
  };
}

export function createWebAppManifests(webApps = []) {
  if (!Array.isArray(webApps)) {
    return [];
  }

  return webApps.map((appConfig) => ({
    id: appConfig.id,
    title: appConfig.title,
    iconKey: appConfig.iconKey,
    iconUrl: appConfig.iconUrl,
    placements: appConfig.placements,
    startGroup: "web-apps",
    startSubmenu: appConfig.startMenuSubmenu,
    webApp: appConfig,
    window: {
      ...appConfig.window,
    },
    infoPanel: createInfoPanelConfig(appConfig),
    createContent: ({ launchPayload }) => createWebAppWindowContent(appConfig, launchPayload),
  }));
}
