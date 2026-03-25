export const DESKTOP_PROFILE_IDS = Object.freeze({
  WIN95: "win95",
  WINXP_SP2: "winxp-sp2",
  UBUNTU_SERVER: "ubuntu-server",
});

export const DEFAULT_DESKTOP_PROFILE_ID = DESKTOP_PROFILE_IDS.WIN95;

function freezeProfile(profile) {
  return Object.freeze({
    ...profile,
    storage: Object.freeze({
      ...profile.storage,
    }),
    desktopSystemTransitionIcons: Object.freeze(
      (profile.desktopSystemTransitionIcons || []).map((icon) =>
        Object.freeze({
          ...icon,
        }),
      ),
    ),
    bootCopy: Object.freeze({
      ...profile.bootCopy,
      finalStatusMilestones: Object.freeze(
        (profile.bootCopy?.finalStatusMilestones || []).map((milestone) =>
          Object.freeze({
            ...milestone,
          }),
        ),
      ),
    }),
    shutdownCopy: Object.freeze({
      ...profile.shutdownCopy,
    }),
  });
}

const PROFILE_DEFINITIONS = Object.freeze([
  freezeProfile({
    id: DESKTOP_PROFILE_IDS.WIN95,
    displayName: "Windows 95",
    shellAriaLabel: "Windows 95 style portfolio shell",
    startButtonLabel: "Start",
    startMenuRailLabel: "Windows",
    powerOnPromptMode: "bios-post",
    bootVisualMode: "logo-only",
    storage: {
      desktopIconPositionsKeyPrefix: "win95.desktop.iconPositions",
      desktopIconPositionsKeySuffix: "v1",
    },
    desktopSystemTransitionIcons: [
      {
        id: "desktop-system-change-os",
        label: "Change OS",
        runPrefillCommand: "msconfig /boot",
      },
    ],
    bootCopy: {
      preludeInitialStatus: "Performing startup sequence...",
      preludeLastLine: "Starting Windows 95...",
      preludeCompleteStatus: "DOS phase complete.",
      finalStatusText: "Painting desktop and taskbar...",
      finalStatusMilestones: [
        {
          maxVisiblePercent: 45,
          text: "Loading VxD drivers...",
        },
        {
          maxVisiblePercent: 75,
          text: "Initializing dial-up networking...",
        },
      ],
    },
    shutdownCopy: {
      shutdownInitText: "Windows is shutting down...",
      poweredOffText: "It is now safe to turn off your computer.",
      poweredOffHint: "Power cycle required. This 386 has no soft restart.",
    },
  }),
  freezeProfile({
    id: DESKTOP_PROFILE_IDS.WINXP_SP2,
    displayName: "Windows XP SP2",
    shellAriaLabel: "Windows XP SP2 style portfolio shell",
    startButtonLabel: "start",
    startMenuRailLabel: "Windows XP",
    powerOnPromptMode: "bios-post",
    bootVisualMode: "logo-only",
    storage: {
      desktopIconPositionsKeyPrefix: "winxp-sp2.desktop.iconPositions",
      desktopIconPositionsKeySuffix: "v1",
    },
    desktopSystemTransitionIcons: [
      {
        id: "desktop-system-change-os",
        label: "Change OS",
        runPrefillCommand: "msconfig /boot",
      },
    ],
    bootCopy: {
      preludeInitialStatus: "Loading startup services...",
      preludeLastLine: "Starting Windows XP...",
      preludeCompleteStatus: "Kernel phase complete.",
      finalStatusText: "Preparing desktop and Start menu...",
      finalStatusMilestones: [
        {
          maxVisiblePercent: 45,
          text: "Loading device drivers...",
        },
        {
          maxVisiblePercent: 75,
          text: "Applying user profile settings...",
        },
      ],
    },
    shutdownCopy: {
      shutdownInitText: "Windows is shutting down...",
      poweredOffText: "It is now safe to turn off your computer.",
      poweredOffHint: "Press the power button to restart this machine.",
    },
  }),
  freezeProfile({
    id: DESKTOP_PROFILE_IDS.UBUNTU_SERVER,
    displayName: "Ubuntu Server",
    shellAriaLabel: "Ubuntu Server style portfolio shell",
    startButtonLabel: "Menu",
    startMenuRailLabel: "Ubuntu",
    powerOnPromptMode: "bios-post",
    bootVisualMode: "logo-only",
    storage: {
      desktopIconPositionsKeyPrefix: "ubuntu-server.desktop.iconPositions",
      desktopIconPositionsKeySuffix: "v1",
    },
    desktopSystemTransitionIcons: [
      {
        id: "desktop-system-change-os",
        label: "Change OS",
        runPrefillCommand: "msconfig /boot",
      },
    ],
    bootCopy: {
      preludeInitialStatus: "Loading init services...",
      preludeLastLine: "Starting Ubuntu Server...",
      preludeCompleteStatus: "Init phase complete.",
      finalStatusText: "Starting shell services...",
      finalStatusMilestones: [
        {
          maxVisiblePercent: 45,
          text: "Mounting filesystems...",
        },
        {
          maxVisiblePercent: 75,
          text: "Bringing up network interfaces...",
        },
      ],
    },
    shutdownCopy: {
      shutdownInitText: "System is shutting down...",
      poweredOffText: "System halted.",
      poweredOffHint: "Power cycle required to boot again.",
    },
  }),
]);

const PROFILE_BY_ID = Object.freeze(
  Object.fromEntries(PROFILE_DEFINITIONS.map((profile) => [profile.id, profile])),
);

export const DESKTOP_PROFILE_ID_LIST = Object.freeze(PROFILE_DEFINITIONS.map((profile) => profile.id));

export function isDesktopProfileId(candidateId) {
  return typeof candidateId === "string" && candidateId in PROFILE_BY_ID;
}

export function resolveDesktopProfile(candidateId = DEFAULT_DESKTOP_PROFILE_ID) {
  if (isDesktopProfileId(candidateId)) {
    return PROFILE_BY_ID[candidateId];
  }

  return PROFILE_BY_ID[DEFAULT_DESKTOP_PROFILE_ID];
}

export function listDesktopProfiles() {
  return PROFILE_DEFINITIONS;
}

export function getDesktopIconPositionsStorageKey(candidateId = DEFAULT_DESKTOP_PROFILE_ID) {
  const profile = resolveDesktopProfile(candidateId);
  const prefix = profile.storage?.desktopIconPositionsKeyPrefix || profile.id;
  const suffix = profile.storage?.desktopIconPositionsKeySuffix || "v1";
  return `${prefix}.${suffix}`;
}
