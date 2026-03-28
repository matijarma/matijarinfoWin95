const DEFAULT_CONFIG_URL = new URL("./web-apps.config.json", import.meta.url).toString();
const DEFAULT_START_SUBMENU = "Web Apps";
const SUPPORTED_ORIENTATIONS = Object.freeze(["landscape", "portrait"]);

const DEFAULT_WINDOW_CONFIG_BY_ORIENTATION = Object.freeze({
  landscape: {
    width: 900,
    height: 580,
    minWidth: 520,
    minHeight: 320,
    aspectRatio: null,
  },
  portrait: {
    width: 520,
    height: 700,
    minWidth: 360,
    minHeight: 420,
    aspectRatio: null,
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

function parsePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toPositiveNumber(value, fallback) {
  const parsed = parsePositiveNumber(value);
  return parsed === null ? fallback : parsed;
}

function parseAspectRatio(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numericRatio = Number(trimmed);

  if (Number.isFinite(numericRatio) && numericRatio > 0) {
    return numericRatio;
  }

  const ratioMatch = trimmed.match(
    /^([0-9]+(?:\.[0-9]+)?)\s*[:/]\s*([0-9]+(?:\.[0-9]+)?)$/,
  );

  if (!ratioMatch) {
    return null;
  }

  const ratioWidth = Number(ratioMatch[1]);
  const ratioHeight = Number(ratioMatch[2]);

  if (
    !Number.isFinite(ratioWidth) ||
    !Number.isFinite(ratioHeight) ||
    ratioWidth <= 0 ||
    ratioHeight <= 0
  ) {
    return null;
  }

  return ratioWidth / ratioHeight;
}

function normalizeWindowDefaults(rawDefaults) {
  const source = rawDefaults && typeof rawDefaults === "object" ? rawDefaults : {};
  const normalizedDefaults = {};

  for (const orientation of SUPPORTED_ORIENTATIONS) {
    const fallback = DEFAULT_WINDOW_CONFIG_BY_ORIENTATION[orientation];
    const rawOrientationDefaults =
      source[orientation] && typeof source[orientation] === "object"
        ? source[orientation]
        : {};

    normalizedDefaults[orientation] = {
      width: toPositiveNumber(rawOrientationDefaults.width, fallback.width),
      height: toPositiveNumber(rawOrientationDefaults.height, fallback.height),
      minWidth: toPositiveNumber(rawOrientationDefaults.minWidth, fallback.minWidth),
      minHeight: toPositiveNumber(rawOrientationDefaults.minHeight, fallback.minHeight),
      aspectRatio:
        parseAspectRatio(rawOrientationDefaults.aspectRatio) ??
        parseAspectRatio(fallback.aspectRatio),
    };
  }

  return normalizedDefaults;
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

function resolveWindowSizeFromAspect({
  explicitWidth,
  explicitHeight,
  fallbackWidth,
  fallbackHeight,
  aspectRatio,
}) {
  if (!aspectRatio) {
    return {
      width: Math.round(explicitWidth ?? fallbackWidth),
      height: Math.round(explicitHeight ?? fallbackHeight),
    };
  }

  let width = explicitWidth;
  let height = explicitHeight;

  if (width !== null && height === null) {
    height = width / aspectRatio;
  } else if (width === null && height !== null) {
    width = height * aspectRatio;
  } else if (width !== null && height !== null) {
    // Width is authoritative if both were supplied with a custom aspect ratio.
    height = width / aspectRatio;
  } else {
    const heightFromWidth = fallbackWidth / aspectRatio;
    const widthFromHeight = fallbackHeight * aspectRatio;
    const widthAnchoredDelta = Math.abs(heightFromWidth - fallbackHeight);
    const heightAnchoredDelta = Math.abs(widthFromHeight - fallbackWidth);

    if (widthAnchoredDelta <= heightAnchoredDelta) {
      width = fallbackWidth;
      height = heightFromWidth;
    } else {
      width = widthFromHeight;
      height = fallbackHeight;
    }
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function normalizeWindowConfig(
  rawApp,
  orientation,
  resizable,
  startMaximized,
  defaultWindowConfigByOrientation,
) {
  const windowOverrides = rawApp && typeof rawApp.window === "object" ? rawApp.window : {};
  const isLockedFullscreen = startMaximized && !resizable;
  const presetOrientation = isLockedFullscreen ? "landscape" : orientation;
  const preset =
    defaultWindowConfigByOrientation?.[presetOrientation] ||
    DEFAULT_WINDOW_CONFIG_BY_ORIENTATION[presetOrientation];
  const explicitWidth = parsePositiveNumber(rawApp.width ?? windowOverrides.width);
  const explicitHeight = parsePositiveNumber(rawApp.height ?? windowOverrides.height);
  const configuredAspectRatio = parseAspectRatio(rawApp.aspectRatio ?? windowOverrides.aspectRatio);
  const fallbackAspectRatio = parseAspectRatio(preset.aspectRatio);
  const aspectRatio = isLockedFullscreen ? null : configuredAspectRatio || fallbackAspectRatio;
  const { width, height } = resolveWindowSizeFromAspect({
    explicitWidth,
    explicitHeight,
    fallbackWidth: preset.width,
    fallbackHeight: preset.height,
    aspectRatio,
  });
  const explicitMinWidth = parsePositiveNumber(rawApp.minWidth ?? windowOverrides.minWidth);
  const explicitMinHeight = parsePositiveNumber(rawApp.minHeight ?? windowOverrides.minHeight);

  const minWidth = explicitMinWidth === null ? Math.min(preset.minWidth, width) : explicitMinWidth;
  const minHeight =
    explicitMinHeight === null ? Math.min(preset.minHeight, height) : explicitMinHeight;

  return {
    width,
    height,
    minWidth,
    minHeight,
    resizable,
    maximizable: resizable,
    minimizable: toBoolean(rawApp.minimizable, true),
    closable: toBoolean(rawApp.closable, true),
    startMaximized,
    aspectRatio,
  };
}

function toOrientationLabel(orientation) {
  return orientation === "portrait" ? "Portrait" : "Landscape";
}

function normalizeApp(
  rawApp,
  index,
  usedIds,
  defaultSubmenu,
  defaultWindowConfigByOrientation,
) {
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
  const startMaximized = toBoolean(
    rawApp.defaultFullscreen ?? rawApp.fullscreenDefault,
    false,
  );
  const title = normalizeText(rawApp.title, parsedUrl.hostname);
  const baseId = normalizeText(rawApp.id, `${parsedUrl.hostname}-${index + 1}`);
  const windowConfig = normalizeWindowConfig(
    rawApp,
    orientation,
    resizable,
    startMaximized,
    defaultWindowConfigByOrientation,
  );

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
    launchModeLabel: startMaximized ? "Fullscreen by default" : "Windowed by default",
    placements: normalizePlacement(rawApp),
    window: windowConfig,
  };
}

export async function loadWebAppConfigs(configUrl = DEFAULT_CONFIG_URL) {
  try {
    const response = await fetch(configUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load web app config: HTTP ${response.status}`);
    }

    const payload = await response.json();
    const configRoot = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const rawApps = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.apps)
        ? payload.apps
        : [];
    const defaultWindowConfigByOrientation = normalizeWindowDefaults(
      configRoot.windowDefaults ?? configRoot.defaultWindowConfig,
    );
    const defaultSubmenu = normalizeText(payload?.startMenuSubmenu, DEFAULT_START_SUBMENU);
    const usedIds = new Set();
    const normalizedApps = [];

    for (let index = 0; index < rawApps.length; index += 1) {
      const normalized = normalizeApp(
        rawApps[index],
        index,
        usedIds,
        defaultSubmenu,
        defaultWindowConfigByOrientation,
      );

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

  const iframe = document.createElement("iframe");
  iframe.className = "web-app-host__frame";
  iframe.title = `${appConfig.title} app viewport`;
  iframe.loading = "eager";
  iframe.allow = "clipboard-read; clipboard-write; fullscreen; autoplay";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  const statusNode = document.createElement("p");
  statusNode.className = "web-app-host__status";

  root.append(iframe, statusNode);

  let currentUrl = normalizeLaunchUrl(launchPayload?.url, appConfig.url);

  function setStatus(textContent) {
    statusNode.textContent = textContent;
  }

  function navigate(nextUrl) {
    currentUrl = normalizeLaunchUrl(nextUrl, appConfig.url);
    iframe.src = currentUrl;
    setStatus(`Loading ${currentUrl}...`);
  }

  const frameLoadHandler = () => {
    setStatus(`Loaded ${currentUrl}.`);
  };

  const frameErrorHandler = () => {
    setStatus("The app failed to load in iframe. Open it directly from App Info.");
  };

  iframe.addEventListener("load", frameLoadHandler);
  iframe.addEventListener("error", frameErrorHandler);

  navigate(currentUrl);

  return {
    element: root,
    dispose() {
      iframe.removeEventListener("load", frameLoadHandler);
      iframe.removeEventListener("error", frameErrorHandler);
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
