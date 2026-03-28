export const SIMULATED_SYSTEM_IDS = Object.freeze({
  DESKTOP_WIN95: "desktop-win95",
  DESKTOP_WINXP_SP2: "desktop-winxp-sp2",
  DESKTOP_UBUNTU_SERVER: "desktop-ubuntu-server",
  MOBILE_SYMBIAN_S60_3RD: "mobile-symbian-s60-3rd",
  MOBILE_SYMBIAN_UIQ_P1I: "mobile-symbian-uiq-p1i",
  MOBILE_SYMBIAN_V1995_S60: "mobile-symbian-v1995-s60",
});

export const DEFAULT_DESKTOP_SYSTEM_ID = SIMULATED_SYSTEM_IDS.DESKTOP_WIN95;
export const DEFAULT_MOBILE_SYSTEM_ID = SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_S60_3RD;

const LEGACY_MOBILE_VARIANT_QUERY_KEYS = Object.freeze([
  "mobileVariant",
  "mobile_variant",
  "symbian",
]);

const MOBILE_VARIANT_FALLBACK = "s60-3rd";

const MOBILE_VARIANT_BY_ALIAS = Object.freeze({
  "s60": "s60-3rd",
  "s60-3rd": "s60-3rd",
  "s60-3rd-edition": "s60-3rd",
  "symbian9": "s60-3rd",
  "symbian-9": "s60-3rd",
  "symbian9.1": "s60-3rd",
  "symbian-9.1": "s60-3rd",
  "symbian-9-1": "s60-3rd",
  "v1995": "s60-3rd",
  "v1995-s60": "s60-3rd",
  "legacy": "s60-3rd",
  "uiq": "s60-3rd",
  "uiq3": "s60-3rd",
  "uiq3.0": "s60-3rd",
  "p1i": "s60-3rd",
  "uiq-p1i": "s60-3rd",
});

const MOBILE_SYSTEM_ID_BY_VARIANT = Object.freeze({
  "s60-3rd": SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_S60_3RD,
  "uiq-p1i": SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_S60_3RD,
  "v1995-s60": SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_S60_3RD,
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
    id: SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_S60_3RD,
    label: "Mobile Symbian 9.1 S60 3rd Edition (2005-era)",
    family: "mobile",
    mobileVariant: "s60-3rd",
    aliases: Object.freeze([
      "mobile",
      "symbian",
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
      "symbian-uiq",
      "uiq",
      "uiq3",
      "uiq3.0",
      "p1i",
      "mobile-uiq",
      SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_UIQ_P1I,
      SIMULATED_SYSTEM_IDS.MOBILE_SYMBIAN_V1995_S60,
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
