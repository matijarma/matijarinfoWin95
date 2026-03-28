export const SIMULATED_SYSTEM_IDS = Object.freeze({
  DESKTOP_WIN95: "desktop-win95",
  DESKTOP_WINXP_SP2: "desktop-winxp-sp2",
  DESKTOP_UBUNTU_SERVER: "desktop-ubuntu-server",
  MOBILE_SYMBIAN_UIQ_P1I: "mobile-symbian-uiq-p1i",
  MOBILE_SYMBIAN_S60_3RD: "mobile-symbian-uiq-p1i",
  MOBILE_SYMBIAN_V1995_S60: "mobile-symbian-uiq-p1i",
});

export const DEFAULT_DESKTOP_SYSTEM_ID = SIMULATED_SYSTEM_IDS.DESKTOP_WIN95;
export const DEFAULT_MOBILE_SYSTEM_ID = SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I;

const LEGACY_MOBILE_VARIANT_QUERY_KEYS = Object.freeze([
  "mobileVariant",
  "mobile_variant",
  "symbian",
]);

const MOBILE_VARIANT_FALLBACK = "uiq-p1i";

const MOBILE_VARIANT_BY_ALIAS = Object.freeze({
  "s60": "uiq-p1i",
  "s60-3rd": "uiq-p1i",
  "s60-3rd-edition": "uiq-p1i",
  "symbian9": "uiq-p1i",
  "symbian-9": "uiq-p1i",
  "symbian9.1": "uiq-p1i",
  "symbian-9.1": "uiq-p1i",
  "symbian-9-1": "uiq-p1i",
  "v1995": "uiq-p1i",
  "v1995-s60": "uiq-p1i",
  "legacy": "uiq-p1i",
  "uiq": "uiq-p1i",
  "uiq3": "uiq-p1i",
  "uiq3.0": "uiq-p1i",
  "p1i": "uiq-p1i",
  "uiq-p1i": "uiq-p1i",
});

const MOBILE_SYSTEM_ID_BY_VARIANT = Object.freeze({
  "uiq-p1i": SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I,
  "s60-3rd": SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I,
  "v1995-s60": SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I,
});

const SYSTEM_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: SIMULATED_SYSTEM_IDS.DESKTOP_WIN95,
    label: "Desktop Windows 95",
    family: "desktop",
    desktopProfile: "win95",
    aliases: Object.freeze([
      "desktop",
      "win95",
      "windows95",
      "windows-95",
      "desktop-default",
    ]),
  }),
  Object.freeze({
    id: SIMULATED_SYSTEM_IDS.DESKTOP_WINXP_SP2,
    label: "Desktop Windows XP SP2",
    family: "desktop",
    desktopProfile: "winxp-sp2",
    aliases: Object.freeze([
      "desktop-xp",
      "desktop-winxp",
      "winxp",
      "windows-xp",
      "xp",
      "sp2",
    ]),
  }),
  Object.freeze({
    id: SIMULATED_SYSTEM_IDS.DESKTOP_UBUNTU_SERVER,
    label: "Desktop Ubuntu Server",
    family: "desktop",
    desktopProfile: "ubuntu-server",
    aliases: Object.freeze([
      "desktop-ubuntu",
      "ubuntu",
      "ubuntu-server",
      "linux",
      "linux-server",
    ]),
  }),
  Object.freeze({
    id: SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I,
    label: "Mobile Symbian UIQ 3.0 (Sony Ericsson P1i era)",
    family: "mobile",
    mobileVariant: "uiq-p1i",
    aliases: Object.freeze([
      "mobile",
      "symbian",
      "symbian-uiq",
      "uiq",
      "uiq3",
      "uiq3.0",
      "p1i",
      "uiq-p1i",
      "mobile-uiq",
      "mobile-s60",
      "symbian-s60",
      "s60-3rd",
      "s60-3rd-edition",
      "v1995",
      "v1995-s60",
      "s60",
      "symbian9",
      "symbian-9",
      "symbian9.1",
      "symbian-9.1",
      "symbian-9-1",
      "legacy",
      "mobile-legacy",
      SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I,
      SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_V1995_S60,
      "mobile-symbian-s60-3rd",
      "mobile-symbian-v1995-s60",
    ]),
  }),
]);

function normalizeLookupToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(/\s+/g, "-");
}

function getWindowSearch() {
  if (typeof window === "undefined" || !window.location) {
    return "";
  }

  return window.location.search || "";
}

function toSearchParams(searchInput) {
  if (searchInput instanceof URLSearchParams) {
    return new URLSearchParams(searchInput);
  }

  if (typeof searchInput === "string") {
    return new URLSearchParams(searchInput);
  }

  return new URLSearchParams();
}

function readLegacyMobileVariantQueryValue(searchParams) {
  return (
    searchParams.get(LEGACY_MOBILE_VARIANT_QUERY_KEYS[0]) ||
    searchParams.get(LEGACY_MOBILE_VARIANT_QUERY_KEYS[1]) ||
    searchParams.get(LEGACY_MOBILE_VARIANT_QUERY_KEYS[2]) ||
    ""
  );
}

function buildLookupTables() {
  const systems = SYSTEM_DEFINITIONS.map((system) =>
    Object.freeze({
      ...system,
      aliases: Object.freeze([...(system.aliases || [])]),
    }),
  );

  const byLookupToken = new Map();

  for (const system of systems) {
    const lookupValues = [system.id, ...(system.aliases || [])];

    for (const value of lookupValues) {
      const token = normalizeLookupToken(value);
      if (!token) {
        continue;
      }

      const existing = byLookupToken.get(token);
      if (existing && existing.id !== system.id) {
        throw new Error(
          `Duplicate simulated-system alias "${value}" for "${existing.id}" and "${system.id}".`,
        );
      }

      byLookupToken.set(token, system);
    }
  }

  return {
    systems: Object.freeze(systems),
    byLookupToken,
  };
}

const LOOKUP_TABLES = buildLookupTables();

export function normalizeMobileVariant(value) {
  const normalized = normalizeLookupToken(value);
  return MOBILE_VARIANT_BY_ALIAS[normalized] || MOBILE_VARIANT_FALLBACK;
}

export function resolveSystemIdForMobileVariant(variant) {
  const normalizedVariant = normalizeMobileVariant(variant);
  return MOBILE_SYSTEM_ID_BY_VARIANT[normalizedVariant] || DEFAULT_MOBILE_SYSTEM_ID;
}

export function readLegacyMobileVariantFromSearch({ search = getWindowSearch() } = {}) {
  const searchParams = toSearchParams(search);
  const rawValue = readLegacyMobileVariantQueryValue(searchParams);
  const isExplicit = typeof rawValue === "string" && rawValue.trim().length > 0;

  return {
    rawValue,
    isExplicit,
    variant: normalizeMobileVariant(rawValue),
  };
}

export function createSimulatedSystemsRegistry() {
  function listSystems({ family } = {}) {
    if (!family) {
      return [...LOOKUP_TABLES.systems];
    }

    return LOOKUP_TABLES.systems.filter((system) => system.family === family);
  }

  function resolveSystem(idOrAlias) {
    const lookupToken = normalizeLookupToken(idOrAlias);
    if (!lookupToken) {
      return null;
    }

    return LOOKUP_TABLES.byLookupToken.get(lookupToken) || null;
  }

  function resolveInitialSystem({
    search = getWindowSearch(),
    persistedSystemId,
    isMobileDevice = false,
    defaultDesktopSystemId = DEFAULT_DESKTOP_SYSTEM_ID,
    defaultMobileSystemId = DEFAULT_MOBILE_SYSTEM_ID,
  } = {}) {
    // Kept for backward compatibility with existing callers, but no longer
    // used to drive initial simulated system selection.
    void search;

    const persistedSystem = resolveSystem(persistedSystemId);
    if (persistedSystem) {
      return {
        system: persistedSystem,
        source: "persisted-system",
      };
    }

    const fallbackSystemId = isMobileDevice ? defaultMobileSystemId : defaultDesktopSystemId;
    const fallbackSystem = resolveSystem(fallbackSystemId);

    if (!fallbackSystem) {
      throw new Error(`Unable to resolve fallback simulated system "${fallbackSystemId}".`);
    }

    return {
      system: fallbackSystem,
      source: isMobileDevice ? "device-mobile" : "device-desktop",
    };
  }

  return {
    listSystems,
    resolveSystem,
    resolveInitialSystem,
  };
}
