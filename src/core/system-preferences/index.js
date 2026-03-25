const BIOS_STORAGE_KEY = "win95.bios.profile.v1";
const CLOCK_STORAGE_KEY = "win95.clock.profile.v1";

export const BIOS_CPU_SPEED_OPTIONS = Object.freeze([16, 20, 25, 33, 40, 50, 66, 80]);
export const BIOS_MODEM_SPEED_OPTIONS = Object.freeze([33, 56]);
const BIOS_CACHE_MODE_OPTIONS = Object.freeze(["safe", "reckless"]);
const BIOS_MEMORY_TEST_OPTIONS = Object.freeze(["full", "quick"]);

export const DEFAULT_BIOS_PROFILE = Object.freeze({
  cpuMHz: 33,
  memoryTest: "full",
  networkTurbo: false,
  modemKbps: 33,
  cacheMode: "safe",
  floppyEnabled: true,
  bootSectorProtection: true,
});

export const TIMEZONE_PRESETS = Object.freeze([
  {
    id: "idlw",
    label: "(GMT-12:00) International Date Line West",
    timeZone: "Etc/GMT+12",
    utcOffsetHours: -12,
  },
  {
    id: "midway",
    label: "(GMT-11:00) Midway Island and Samoa",
    timeZone: "Pacific/Pago_Pago",
    utcOffsetHours: -11,
  },
  {
    id: "hawaii",
    label: "(GMT-10:00) Hawaii",
    timeZone: "Pacific/Honolulu",
    utcOffsetHours: -10,
  },
  {
    id: "alaska",
    label: "(GMT-09:00) Alaska",
    timeZone: "America/Anchorage",
    utcOffsetHours: -9,
  },
  {
    id: "pacific-us",
    label: "(GMT-08:00) Pacific Time (US and Canada)",
    timeZone: "America/Los_Angeles",
    utcOffsetHours: -8,
  },
  {
    id: "mountain-us",
    label: "(GMT-07:00) Mountain Time (US and Canada)",
    timeZone: "America/Denver",
    utcOffsetHours: -7,
  },
  {
    id: "central-us",
    label: "(GMT-06:00) Central Time (US and Canada)",
    timeZone: "America/Chicago",
    utcOffsetHours: -6,
  },
  {
    id: "eastern-us",
    label: "(GMT-05:00) Eastern Time (US and Canada)",
    timeZone: "America/New_York",
    utcOffsetHours: -5,
  },
  {
    id: "atlantic",
    label: "(GMT-04:00) Atlantic Time (Canada)",
    timeZone: "America/Halifax",
    utcOffsetHours: -4,
  },
  {
    id: "newfoundland",
    label: "(GMT-03:30) Newfoundland",
    timeZone: "America/St_Johns",
    utcOffsetHours: -3.5,
  },
  {
    id: "brasilia",
    label: "(GMT-03:00) Brasilia",
    timeZone: "America/Sao_Paulo",
    utcOffsetHours: -3,
  },
  {
    id: "mid-atlantic",
    label: "(GMT-02:00) Mid-Atlantic",
    timeZone: "Etc/GMT+2",
    utcOffsetHours: -2,
  },
  {
    id: "azores",
    label: "(GMT-01:00) Azores",
    timeZone: "Atlantic/Azores",
    utcOffsetHours: -1,
  },
  {
    id: "greenwich",
    label: "(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London",
    timeZone: "Europe/London",
    utcOffsetHours: 0,
  },
  {
    id: "zagreb",
    label: "(GMT+01:00) Sarajevo, Skopje, Sofia, Vilnius, Warsaw, Zagreb",
    timeZone: "Europe/Zagreb",
    utcOffsetHours: 1,
  },
  {
    id: "athens",
    label: "(GMT+02:00) Athens, Istanbul, Minsk",
    timeZone: "Europe/Athens",
    utcOffsetHours: 2,
  },
  {
    id: "moscow",
    label: "(GMT+03:00) Moscow, St. Petersburg, Volgograd",
    timeZone: "Europe/Moscow",
    utcOffsetHours: 3,
  },
  {
    id: "tehran",
    label: "(GMT+03:30) Tehran",
    timeZone: "Asia/Tehran",
    utcOffsetHours: 3.5,
  },
  {
    id: "abu-dhabi",
    label: "(GMT+04:00) Abu Dhabi, Muscat",
    timeZone: "Asia/Dubai",
    utcOffsetHours: 4,
  },
  {
    id: "kabul",
    label: "(GMT+04:30) Kabul",
    timeZone: "Asia/Kabul",
    utcOffsetHours: 4.5,
  },
  {
    id: "karachi",
    label: "(GMT+05:00) Islamabad, Karachi, Tashkent",
    timeZone: "Asia/Karachi",
    utcOffsetHours: 5,
  },
  {
    id: "kolkata",
    label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    timeZone: "Asia/Kolkata",
    utcOffsetHours: 5.5,
  },
  {
    id: "almaty",
    label: "(GMT+06:00) Almaty, Novosibirsk",
    timeZone: "Asia/Almaty",
    utcOffsetHours: 6,
  },
  {
    id: "bangkok",
    label: "(GMT+07:00) Bangkok, Hanoi, Jakarta",
    timeZone: "Asia/Bangkok",
    utcOffsetHours: 7,
  },
  {
    id: "beijing",
    label: "(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi",
    timeZone: "Asia/Shanghai",
    utcOffsetHours: 8,
  },
  {
    id: "tokyo",
    label: "(GMT+09:00) Osaka, Sapporo, Tokyo",
    timeZone: "Asia/Tokyo",
    utcOffsetHours: 9,
  },
  {
    id: "adelaide",
    label: "(GMT+09:30) Adelaide",
    timeZone: "Australia/Adelaide",
    utcOffsetHours: 9.5,
  },
  {
    id: "sydney",
    label: "(GMT+10:00) Canberra, Melbourne, Sydney",
    timeZone: "Australia/Sydney",
    utcOffsetHours: 10,
  },
  {
    id: "magadan",
    label: "(GMT+11:00) Magadan, Solomon Islands, New Caledonia",
    timeZone: "Asia/Magadan",
    utcOffsetHours: 11,
  },
  {
    id: "auckland",
    label: "(GMT+12:00) Auckland, Wellington",
    timeZone: "Pacific/Auckland",
    utcOffsetHours: 12,
  },
  {
    id: "tonga",
    label: "(GMT+13:00) Nuku'alofa",
    timeZone: "Pacific/Tongatapu",
    utcOffsetHours: 13,
  },
]);

export const CLOCK_LOCALE_OPTIONS = Object.freeze([
  {
    id: "hr-HR",
    label: "Croatia (hr-HR)",
  },
  {
    id: "en-US",
    label: "United States (en-US)",
  },
  {
    id: "en-GB",
    label: "United Kingdom (en-GB)",
  },
  {
    id: "de-DE",
    label: "Germany (de-DE)",
  },
]);

export const DEFAULT_CLOCK_PROFILE = Object.freeze({
  locale: "hr-HR",
  timeZoneId: "zagreb",
  use24Hour: true,
  manualOffsetMs: 0,
});

function hasLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readStoredJson(storageKey) {
  try {
    if (!hasLocalStorage()) {
      return null;
    }

    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function writeStoredJson(storageKey, value) {
  try {
    if (!hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage write errors in private mode/quota-limited sessions.
  }
}

function pickAllowedOption(value, options, fallbackValue) {
  if (options.includes(value)) {
    return value;
  }

  return fallbackValue;
}

export function normalizeBiosProfile(candidate = {}) {
  const cpuMHz = Number(candidate.cpuMHz);
  const modemKbps = Number(candidate.modemKbps);
  const manualProfile = {
    cpuMHz: pickAllowedOption(cpuMHz, BIOS_CPU_SPEED_OPTIONS, DEFAULT_BIOS_PROFILE.cpuMHz),
    memoryTest: pickAllowedOption(
      candidate.memoryTest,
      BIOS_MEMORY_TEST_OPTIONS,
      DEFAULT_BIOS_PROFILE.memoryTest,
    ),
    networkTurbo:
      typeof candidate.networkTurbo === "boolean"
        ? candidate.networkTurbo
        : DEFAULT_BIOS_PROFILE.networkTurbo,
    modemKbps: pickAllowedOption(
      modemKbps,
      BIOS_MODEM_SPEED_OPTIONS,
      DEFAULT_BIOS_PROFILE.modemKbps,
    ),
    cacheMode: pickAllowedOption(
      candidate.cacheMode,
      BIOS_CACHE_MODE_OPTIONS,
      DEFAULT_BIOS_PROFILE.cacheMode,
    ),
    floppyEnabled:
      typeof candidate.floppyEnabled === "boolean"
        ? candidate.floppyEnabled
        : DEFAULT_BIOS_PROFILE.floppyEnabled,
    bootSectorProtection:
      typeof candidate.bootSectorProtection === "boolean"
        ? candidate.bootSectorProtection
        : DEFAULT_BIOS_PROFILE.bootSectorProtection,
  };

  return manualProfile;
}

export function readBiosProfile() {
  return normalizeBiosProfile(readStoredJson(BIOS_STORAGE_KEY) || {});
}

export function writeBiosProfile(nextProfile) {
  const safeProfile = normalizeBiosProfile(nextProfile);
  writeStoredJson(BIOS_STORAGE_KEY, safeProfile);
  return safeProfile;
}

export function getBiosNetworkLabel(profile) {
  return profile.networkTurbo ? "Turbo 10 MBps" : "NE2000 Compatible (2 MBps)";
}

export function getBiosModemLabel(profile) {
  return profile.modemKbps >= 56 ? "USR Sportster 56k" : "USR Sportster 33.6k";
}

export function getBiosCpuLabel(profile) {
  const extra =
    profile.cpuMHz >= 66
      ? " [Warranty Void]"
      : profile.cpuMHz >= 50
        ? " [Turbo]"
        : "";
  return `Intel 80386DX (${profile.cpuMHz} MHz)${extra}`;
}

export function estimateBootDurationMs(profileInput) {
  const profile = normalizeBiosProfile(profileInput);

  let durationMs = 12800;
  durationMs -= Math.round((profile.cpuMHz - 33) * 86);
  durationMs += profile.memoryTest === "full" ? 1300 : -950;
  durationMs += profile.cacheMode === "reckless" ? -520 : 280;
  durationMs += profile.networkTurbo ? -270 : 110;
  durationMs += profile.modemKbps >= 56 ? -180 : 90;
  durationMs += profile.floppyEnabled ? 120 : -80;

  return Math.min(19000, Math.max(6400, durationMs));
}

export function buildBiosPostLines(profileInput) {
  const profile = normalizeBiosProfile(profileInput);
  const memoryLine =
    profile.memoryTest === "quick"
      ? "Memory Test: Quick POST (8192K cached)"
      : "Memory Test: 8192K OK";
  const floppyLine = profile.floppyEnabled
    ? "Detecting floppy drive A... 1.44MB"
    : "Detecting floppy drive A... Not Present";
  const networkLine = `Initializing ISA network adapter... ${getBiosNetworkLabel(profile)}`;
  const modemLine = `Initializing modem... ${getBiosModemLabel(profile)}`;

  return [
    "Phoenix BIOS A486 Version 1.10",
    "Copyright 1985-1994 Phoenix Technologies Ltd.",
    "",
    `CPU = ${getBiosCpuLabel(profile)}`,
    memoryLine,
    "Primary Master: SYS HDD 128MB",
    "Primary Slave: STORAGE HDD 512MB",
    "Secondary Master: None",
    "Secondary Slave: None",
    "",
    floppyLine,
    networkLine,
    modemLine,
  ];
}

function normalizeTimeZoneId(candidateId) {
  const matchedPreset = TIMEZONE_PRESETS.find((preset) => preset.id === candidateId);
  return matchedPreset ? matchedPreset.id : DEFAULT_CLOCK_PROFILE.timeZoneId;
}

function normalizeLocale(candidateLocale) {
  if (CLOCK_LOCALE_OPTIONS.some((option) => option.id === candidateLocale)) {
    return candidateLocale;
  }

  return DEFAULT_CLOCK_PROFILE.locale;
}

export function normalizeClockProfile(candidate = {}) {
  const manualOffsetMs = Number(candidate.manualOffsetMs);

  return {
    locale: normalizeLocale(candidate.locale),
    timeZoneId: normalizeTimeZoneId(candidate.timeZoneId),
    use24Hour:
      typeof candidate.use24Hour === "boolean"
        ? candidate.use24Hour
        : DEFAULT_CLOCK_PROFILE.use24Hour,
    manualOffsetMs: Number.isFinite(manualOffsetMs)
      ? Math.min(Math.max(Math.round(manualOffsetMs), -315576000000), 315576000000)
      : DEFAULT_CLOCK_PROFILE.manualOffsetMs,
  };
}

export function readClockProfile() {
  return normalizeClockProfile(readStoredJson(CLOCK_STORAGE_KEY) || {});
}

export function writeClockProfile(nextProfile) {
  const safeProfile = normalizeClockProfile(nextProfile);
  writeStoredJson(CLOCK_STORAGE_KEY, safeProfile);
  return safeProfile;
}

export function getTimeZonePresetById(timeZoneId) {
  return TIMEZONE_PRESETS.find((preset) => preset.id === timeZoneId) || TIMEZONE_PRESETS[0];
}

export function getClockDate(profileInput, nowMs = Date.now()) {
  const profile = normalizeClockProfile(profileInput);
  return new Date(nowMs + profile.manualOffsetMs);
}

export function formatClockTime(profileInput, dateInput = getClockDate(profileInput)) {
  const profile = normalizeClockProfile(profileInput);
  const timeZonePreset = getTimeZonePresetById(profile.timeZoneId);
  const formatter = new Intl.DateTimeFormat(profile.locale, {
    timeZone: timeZonePreset.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: !profile.use24Hour,
    hourCycle: profile.use24Hour ? "h23" : undefined,
  });
  return formatter.format(dateInput);
}

export function formatClockTooltip(profileInput, dateInput = getClockDate(profileInput)) {
  const profile = normalizeClockProfile(profileInput);
  const timeZonePreset = getTimeZonePresetById(profile.timeZoneId);

  const formatter = new Intl.DateTimeFormat(profile.locale, {
    timeZone: timeZonePreset.timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !profile.use24Hour,
    hourCycle: profile.use24Hour ? "h23" : undefined,
  });

  return `${formatter.format(dateInput)} (${timeZonePreset.label})`;
}

function getZonedParts(dateValue, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(dateValue);
  const result = {};

  for (const part of parts) {
    if (part.type === "literal") {
      continue;
    }
    result[part.type] = Number(part.value);
  }

  return {
    year: result.year,
    month: result.month,
    day: result.day,
    hour: result.hour,
    minute: result.minute,
    second: result.second,
  };
}

export function getClockInputValues(profileInput, dateInput = getClockDate(profileInput)) {
  const profile = normalizeClockProfile(profileInput);
  const preset = getTimeZonePresetById(profile.timeZoneId);
  const zonedParts = getZonedParts(dateInput, preset.timeZone);
  const month = String(zonedParts.month).padStart(2, "0");
  const day = String(zonedParts.day).padStart(2, "0");
  const hour = String(zonedParts.hour).padStart(2, "0");
  const minute = String(zonedParts.minute).padStart(2, "0");

  return {
    dateValue: `${zonedParts.year}-${month}-${day}`,
    timeValue: `${hour}:${minute}`,
  };
}

export function convertZonedDateTimeToUtcMs(dateValue, timeValue, profileInput) {
  const profile = normalizeClockProfile(profileInput);
  const preset = getTimeZonePresetById(profile.timeZoneId);
  const safeDate = typeof dateValue === "string" ? dateValue.trim() : "";
  const safeTime = typeof timeValue === "string" ? timeValue.trim() : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(safeDate) || !/^\d{2}:\d{2}$/.test(safeTime)) {
    return null;
  }

  const [yearText, monthText, dayText] = safeDate.split("-");
  const [hourText, minuteText] = safeTime.split(":");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  const desiredLocalMs = Date.UTC(year, month - 1, day, hour, minute);
  let guessUtcMs = desiredLocalMs;

  for (let index = 0; index < 5; index += 1) {
    const guessParts = getZonedParts(new Date(guessUtcMs), preset.timeZone);
    const observedLocalMs = Date.UTC(
      guessParts.year,
      guessParts.month - 1,
      guessParts.day,
      guessParts.hour,
      guessParts.minute,
    );
    const deltaMs = desiredLocalMs - observedLocalMs;

    if (deltaMs === 0) {
      return guessUtcMs;
    }

    guessUtcMs += deltaMs;
  }

  return guessUtcMs;
}

export function getTimeZoneMapPositionPercent(timeZoneId) {
  const preset = getTimeZonePresetById(timeZoneId);
  const normalized = (preset.utcOffsetHours + 12) / 25;
  return Math.max(0, Math.min(1, normalized)) * 100;
}

