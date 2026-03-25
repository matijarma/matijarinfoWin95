const UIQ_WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UIQ_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const UIQ_LAUNCHER_GRID = {
  columns: 3,
  rows: 4,
  pages: [
    {
      id: "main",
      label: "Main",
      tiles: [
        { id: "phone", label: "Phone", iconToken: "PH", shortcut: "1" },
        { id: "messages", label: "Messages", iconToken: "MS", shortcut: "2" },
        { id: "contacts", label: "Contacts", iconToken: "CT", shortcut: "3" },
        { id: "calendar", label: "Calendar", iconToken: "CL", shortcut: "4" },
        { id: "media", label: "Media", iconToken: "MD", shortcut: "5" },
        { id: "camera", label: "Camera", iconToken: "CM", shortcut: "6" },
        { id: "browser", label: "Browser", iconToken: "WB", shortcut: "7" },
        { id: "file-manager", label: "File mgr", iconToken: "FM", shortcut: "8" },
        { id: "notes", label: "Notes", iconToken: "NT", shortcut: "9" },
        { id: "control-panel", label: "Control Panel", iconToken: "CP", shortcut: "*" },
        { id: "organizer", label: "Organizer", iconToken: "OR", shortcut: "0" },
        { id: "tasks", label: "Tasks", iconToken: "TK", shortcut: "#" },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      tiles: [
        { id: "profiles", label: "Profiles", iconToken: "PR", shortcut: "1" },
        { id: "calls", label: "Call Log", iconToken: "LG", shortcut: "2" },
        { id: "rss", label: "RSS Reader", iconToken: "RS", shortcut: "3" },
        { id: "clock", label: "Clock", iconToken: "CK", shortcut: "4" },
        { id: "calculator", label: "Calculator", iconToken: "CA", shortcut: "5" },
        { id: "converter", label: "Converter", iconToken: "CV", shortcut: "6" },
        { id: "recorder", label: "Recorder", iconToken: "VR", shortcut: "7" },
        { id: "connections", label: "Connections", iconToken: "CN", shortcut: "8" },
        { id: "help", label: "Help", iconToken: "HP", shortcut: "9" },
      ],
    },
  ],
};

export const UIQ_TODAY_CARDS = [
  {
    id: "today-next-event",
    type: "agenda",
    title: "Next appointment",
    subtitle: "UI review sync",
    detail: "14:00-14:45 / Studio desk",
    accent: "blue",
    actionId: "open-calendar",
  },
  {
    id: "today-messages",
    type: "messages",
    title: "Messaging",
    subtitle: "3 unread messages",
    detail: "Latest: 'Can we ship by tonight?'",
    accent: "green",
    actionId: "open-messages",
  },
  {
    id: "today-missed-calls",
    type: "calls",
    title: "Call log",
    subtitle: "1 missed call",
    detail: "Lana R. at 11:42",
    accent: "orange",
    actionId: "open-calls",
  },
  {
    id: "today-connectivity",
    type: "system",
    title: "Connectivity",
    subtitle: "WLAN off, BT hidden",
    detail: "Packet data available",
    accent: "indigo",
    actionId: "open-connections",
  },
  {
    id: "today-rss",
    type: "rss",
    title: "RSS feed",
    subtitle: "UIQ archive updated",
    detail: "4 new posts",
    accent: "violet",
    actionId: "open-rss",
  },
];

export const UIQ_CONTACTS = [
  {
    id: "contact-lana-r",
    displayName: "Lana Radic",
    company: "Studio S",
    title: "UI designer",
    phones: [
      { type: "mobile", value: "+385 99 555 7300", preferred: true },
      { type: "work", value: "+385 1 660 4412" },
    ],
    emails: ["lana@studios.hr"],
    lastInteraction: "Today 11:42",
    notes: "Prefers SMS before calls.",
  },
  {
    id: "contact-josip-k",
    displayName: "Josip Kovac",
    company: "Pixel Forge",
    title: "Project lead",
    phones: [
      { type: "mobile", value: "+385 91 224 7721", preferred: true },
      { type: "office", value: "+385 1 667 5541" },
    ],
    emails: ["josip@pixelforge.hr"],
    lastInteraction: "Today 09:03",
    notes: "Bring P1i mockups to meetings.",
  },
  {
    id: "contact-marko-v",
    displayName: "Marko Vukic",
    company: "Code Crafters",
    title: "Backend engineer",
    phones: [{ type: "mobile", value: "+385 98 401 122", preferred: true }],
    emails: ["marko@codecrafters.dev"],
    lastInteraction: "Yesterday 18:10",
    notes: "Checks deployment latency alerts.",
  },
  {
    id: "contact-tea-m",
    displayName: "Tea Milic",
    company: "Audio Works",
    title: "Sound designer",
    phones: [{ type: "mobile", value: "+385 93 223 9918", preferred: true }],
    emails: ["tea@audioworks.hr"],
    lastInteraction: "Mar 23 16:20",
    notes: "Created custom alert profile tones.",
  },
  {
    id: "contact-kreso-d",
    displayName: "Kreso Duvnjak",
    company: "NOC Desk",
    title: "Infra support",
    phones: [{ type: "mobile", value: "+385 97 710 0011", preferred: true }],
    emails: ["kreso@nocdesk.net"],
    lastInteraction: "Mar 22 03:58",
    notes: "Emergency on-call contact.",
  },
  {
    id: "contact-ana-s",
    displayName: "Ana Saric",
    company: "Freelance",
    title: "Illustrator",
    phones: [{ type: "mobile", value: "+385 95 742 1160", preferred: true }],
    emails: ["ana@illustration.hr"],
    lastInteraction: "Mar 20 14:26",
    notes: "Icon pass review pending.",
  },
];

export const UIQ_MESSAGE_FOLDERS = [
  { id: "inbox", label: "Inbox", unreadCount: 3 },
  { id: "sent", label: "Sent", unreadCount: 0 },
  { id: "drafts", label: "Drafts", unreadCount: 0 },
  { id: "outbox", label: "Outbox", unreadCount: 0 },
];

export const UIQ_MESSAGE_THREADS = [
  {
    id: "thread-lana",
    folderId: "inbox",
    participant: "Lana Radic",
    subject: "Launch build",
    preview: "Can we ship UIQ preview tonight?",
    unreadCount: 1,
    updatedAt: "13:49",
    messages: [
      {
        id: "msg-lana-1",
        direction: "in",
        transport: "sms",
        body: "Can we ship UIQ preview tonight?",
        timestamp: "2026-03-25T13:49:00+01:00",
      },
      {
        id: "msg-lana-2",
        direction: "out",
        transport: "sms",
        body: "Yes, I am wiring data and launcher behavior now.",
        timestamp: "2026-03-25T13:53:00+01:00",
      },
    ],
  },
  {
    id: "thread-josip",
    folderId: "inbox",
    participant: "Josip Kovac",
    subject: "Review schedule",
    preview: "Move review to 15:30.",
    unreadCount: 0,
    updatedAt: "09:12",
    messages: [
      {
        id: "msg-josip-1",
        direction: "in",
        transport: "sms",
        body: "Move review to 15:30.",
        timestamp: "2026-03-25T09:12:00+01:00",
      },
      {
        id: "msg-josip-2",
        direction: "out",
        transport: "sms",
        body: "Confirmed, I will be there.",
        timestamp: "2026-03-25T09:14:00+01:00",
      },
      {
        id: "msg-josip-3",
        direction: "in",
        transport: "sms",
        body: "Please bring stylus interaction notes.",
        timestamp: "2026-03-25T09:15:00+01:00",
      },
    ],
  },
  {
    id: "thread-noc",
    folderId: "inbox",
    participant: "NOC Alert",
    subject: "Infra status",
    preview: "Edge latency recovered.",
    unreadCount: 0,
    updatedAt: "Yesterday",
    messages: [
      {
        id: "msg-noc-1",
        direction: "in",
        transport: "mms",
        body: "Edge latency recovered. Packet loss below 1%.",
        timestamp: "2026-03-24T23:11:00+01:00",
      },
    ],
  },
  {
    id: "thread-sent-1",
    folderId: "sent",
    participant: "Tea Milic",
    subject: "Ringtone draft",
    preview: "Thanks, version B sounds perfect.",
    unreadCount: 0,
    updatedAt: "Yesterday",
    messages: [
      {
        id: "msg-sent-tea-1",
        direction: "out",
        transport: "sms",
        body: "Thanks, version B sounds perfect.",
        timestamp: "2026-03-24T17:35:00+01:00",
      },
    ],
  },
  {
    id: "thread-draft-1",
    folderId: "drafts",
    participant: "Ana Saric",
    subject: "Icon pass",
    preview: "Need final gloss highlights on three icons...",
    unreadCount: 0,
    updatedAt: "Mar 24",
    messages: [
      {
        id: "msg-draft-ana-1",
        direction: "out",
        transport: "sms",
        body: "Need final gloss highlights on three icons before export.",
        timestamp: "2026-03-24T08:10:00+01:00",
      },
    ],
  },
];

export const UIQ_CALENDAR_EVENTS = [
  {
    id: "event-ui-review",
    title: "UI review sync",
    type: "meeting",
    startIso: "2026-03-25T14:00:00+01:00",
    endIso: "2026-03-25T14:45:00+01:00",
    location: "Studio desk",
    notes: "Finalize launcher transitions and command bar labels.",
  },
  {
    id: "event-client-call",
    title: "Client follow-up",
    type: "call",
    startIso: "2026-03-26T11:30:00+01:00",
    endIso: "2026-03-26T12:00:00+01:00",
    location: "Teams",
    notes: "Demo both S60 and UIQ branches.",
  },
  {
    id: "event-device-test",
    title: "P1i touch test",
    type: "work",
    startIso: "2026-03-27T18:00:00+01:00",
    endIso: "2026-03-27T19:30:00+01:00",
    location: "Device lab",
    notes: "Verify stylus hit targets and panel scrolling.",
  },
  {
    id: "event-launch-dry-run",
    title: "Launch dry run",
    type: "milestone",
    startIso: "2026-04-01T17:00:00+02:00",
    endIso: "2026-04-01T18:00:00+02:00",
    location: "War room",
    notes: "Full walkthrough with stakeholders.",
  },
];

export const UIQ_CALENDAR_TASKS = [
  {
    id: "task-polish-command-bar",
    title: "Polish command bar spacing",
    priority: "high",
    status: "in-progress",
    dueIso: "2026-03-25T16:00:00+01:00",
    percentDone: 70,
  },
  {
    id: "task-qa-checklist",
    title: "Run mobile QA checklist",
    priority: "high",
    status: "todo",
    dueIso: "2026-03-26T10:00:00+01:00",
    percentDone: 0,
  },
  {
    id: "task-theme-pass",
    title: "Theme color parity pass",
    priority: "normal",
    status: "todo",
    dueIso: "2026-03-27T12:00:00+01:00",
    percentDone: 0,
  },
  {
    id: "task-archive-v1995",
    title: "Archive v1995 bundle",
    priority: "normal",
    status: "done",
    dueIso: "2026-03-25T03:30:00+01:00",
    percentDone: 100,
  },
];

export const UIQ_MEDIA_TRACKS = [
  {
    id: "track-dayvan",
    title: "Dayvan Cowboy",
    artist: "Boards of Canada",
    album: "The Campfire Headphase",
    durationSec: 321,
    bitrateKbps: 192,
    codec: "MP3",
  },
  {
    id: "track-windowlicker",
    title: "Windowlicker",
    artist: "Aphex Twin",
    album: "Windowlicker",
    durationSec: 376,
    bitrateKbps: 192,
    codec: "MP3",
  },
  {
    id: "track-hunter",
    title: "Hunter",
    artist: "Bjork",
    album: "Homogenic",
    durationSec: 256,
    bitrateKbps: 160,
    codec: "AAC",
  },
  {
    id: "track-midnight",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We Are Dreaming",
    durationSec: 244,
    bitrateKbps: 256,
    codec: "AAC",
  },
  {
    id: "track-ocean",
    title: "Ocean Drive",
    artist: "Duke Dumont",
    album: "Blase Boys Club",
    durationSec: 208,
    bitrateKbps: 192,
    codec: "MP3",
  },
];

export const UIQ_MEDIA_PHOTOS = [
  {
    id: "photo-zagreb-night",
    title: "Zagreb night",
    takenAt: "2026-03-21T20:44:00+01:00",
    resolution: "1600x1200",
    sizeLabel: "420 KB",
    palette: "#244f7b",
  },
  {
    id: "photo-workbench",
    title: "Workbench",
    takenAt: "2026-03-20T13:15:00+01:00",
    resolution: "1280x960",
    sizeLabel: "390 KB",
    palette: "#50708e",
  },
  {
    id: "photo-beach-dusk",
    title: "Beach dusk",
    takenAt: "2026-03-15T18:39:00+01:00",
    resolution: "1024x768",
    sizeLabel: "355 KB",
    palette: "#cc8b50",
  },
  {
    id: "photo-circuit",
    title: "Circuit macro",
    takenAt: "2026-03-09T11:06:00+01:00",
    resolution: "1280x960",
    sizeLabel: "402 KB",
    palette: "#4f775a",
  },
  {
    id: "photo-rain-window",
    title: "Rain window",
    takenAt: "2026-03-03T07:52:00+01:00",
    resolution: "1600x1200",
    sizeLabel: "478 KB",
    palette: "#5f6780",
  },
];

export const UIQ_NOTES = [
  {
    id: "note-uiq-cmdbar",
    title: "Command bar",
    body: "Confirm left/select/right labels per screen. Keep text short.",
    updatedAt: "Today 12:41",
  },
  {
    id: "note-touch-targets",
    title: "Touch targets",
    body: "Minimum 34px row height for comfortable stylus + finger taps.",
    updatedAt: "Today 09:18",
  },
  {
    id: "note-device-test",
    title: "P1i test",
    body: "Check brightness and contrast on sunlight profile.",
    updatedAt: "Yesterday 18:05",
  },
];

export const UIQ_FILE_TREE = {
  id: "root",
  name: "Sony Ericsson P1i",
  type: "folder",
  children: [
    {
      id: "phone-memory",
      name: "Phone memory",
      type: "folder",
      children: [
        {
          id: "pm-documents",
          name: "Documents",
          type: "folder",
          children: [
            { id: "file-uiq-notes", name: "uiq_notes.txt", type: "file", sizeLabel: "24 KB" },
            { id: "file-release-plan", name: "release_plan.doc", type: "file", sizeLabel: "112 KB" },
          ],
        },
        {
          id: "pm-images",
          name: "Images",
          type: "folder",
          children: [
            { id: "file-wallpaper", name: "wallpaper_blue.jpg", type: "file", sizeLabel: "312 KB" },
            { id: "file-splash", name: "boot_splash.png", type: "file", sizeLabel: "144 KB" },
          ],
        },
      ],
    },
    {
      id: "memory-stick",
      name: "Memory Stick",
      type: "folder",
      children: [
        {
          id: "ms-music",
          name: "Music",
          type: "folder",
          children: [
            { id: "file-dayvan", name: "dayvan_cowboy.mp3", type: "file", sizeLabel: "7.4 MB" },
            { id: "file-windowlicker", name: "windowlicker.mp3", type: "file", sizeLabel: "8.1 MB" },
          ],
        },
        {
          id: "ms-video",
          name: "Video",
          type: "folder",
          children: [{ id: "file-showreel", name: "showreel_2026.mp4", type: "file", sizeLabel: "34 MB" }],
        },
      ],
    },
    {
      id: "system",
      name: "System",
      type: "folder",
      children: [
        { id: "file-uiq-resource", name: "uiq_resource.rsc", type: "file", sizeLabel: "920 KB" },
        { id: "file-font", name: "latin_bold.gdr", type: "file", sizeLabel: "468 KB" },
      ],
    },
  ],
};

export const UIQ_SETTINGS_SECTIONS = [
  {
    id: "connectivity",
    title: "Connectivity",
    items: [
      { id: "bluetooth", label: "Bluetooth", type: "toggle", value: true },
      { id: "wlan", label: "WLAN", type: "toggle", value: false },
      {
        id: "packet-data",
        label: "Packet data",
        type: "select",
        value: "When available",
        options: ["When available", "When needed", "Off"],
      },
    ],
  },
  {
    id: "display",
    title: "Display",
    items: [
      {
        id: "theme",
        label: "Theme",
        type: "select",
        value: "Sony Ericsson Blue",
        options: ["Sony Ericsson Blue", "Classic Gray", "Graphite"],
      },
      {
        id: "brightness",
        label: "Brightness",
        type: "select",
        value: "70%",
        options: ["40%", "55%", "70%", "85%"],
      },
      {
        id: "backlight-timeout",
        label: "Backlight timeout",
        type: "select",
        value: "30 sec",
        options: ["15 sec", "30 sec", "45 sec", "60 sec"],
      },
    ],
  },
  {
    id: "sound-alerts",
    title: "Sound & alerts",
    items: [
      {
        id: "ringtone",
        label: "Ringtone",
        type: "select",
        value: "P1i Classic",
        options: ["P1i Classic", "Digital Bell", "Acoustic", "Silent"],
      },
      {
        id: "keypad-tone",
        label: "Keypad tone",
        type: "select",
        value: "Level 2",
        options: ["Off", "Level 1", "Level 2", "Level 3"],
      },
      { id: "vibrate", label: "Vibrate", type: "toggle", value: true },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      { id: "device-lock", label: "Device lock", type: "toggle", value: false },
      {
        id: "auto-lock",
        label: "Auto-lock",
        type: "select",
        value: "5 min",
        options: ["Off", "2 min", "5 min", "10 min"],
      },
      {
        id: "code-request",
        label: "PIN request",
        type: "toggle",
        value: true,
      },
    ],
  },
];

export const UIQ_PROFILES = [
  { id: "general", label: "General", ringVolume: 7, vibrate: true, warningTones: true },
  { id: "meeting", label: "Meeting", ringVolume: 2, vibrate: false, warningTones: false },
  { id: "silent", label: "Silent", ringVolume: 0, vibrate: false, warningTones: false },
  { id: "outdoor", label: "Outdoor", ringVolume: 10, vibrate: true, warningTones: true },
  { id: "car", label: "Car", ringVolume: 8, vibrate: false, warningTones: true },
];

export const UIQ_CALL_LOG = [
  {
    id: "call-1",
    kind: "missed",
    contactName: "Lana Radic",
    phone: "+385 99 555 7300",
    atLabel: "Today 11:42",
    durationLabel: "--",
  },
  {
    id: "call-2",
    kind: "dialed",
    contactName: "Josip Kovac",
    phone: "+385 91 224 7721",
    atLabel: "Today 09:03",
    durationLabel: "02:18",
  },
  {
    id: "call-3",
    kind: "received",
    contactName: "Unknown",
    phone: "+385 98 000 0099",
    atLabel: "Yesterday 21:17",
    durationLabel: "00:46",
  },
  {
    id: "call-4",
    kind: "missed",
    contactName: "Ana Saric",
    phone: "+385 95 742 1160",
    atLabel: "Yesterday 18:55",
    durationLabel: "--",
  },
];

export const UIQ_OPERATOR_SEQUENCE = [
  { id: "tmobile", label: "T-Mobile HR", technology: "3G" },
  { id: "tmobile", label: "T-Mobile HR", technology: "3G" },
  { id: "tmobile", label: "T-Mobile HR", technology: "EDGE" },
  { id: "vip", label: "VIPnet HR", technology: "3G" },
  { id: "tmobile", label: "T-Mobile HR", technology: "GSM" },
];

export const UIQ_SIGNAL_SEQUENCE = [
  { bars: 5, quality: "excellent", roaming: false },
  { bars: 4, quality: "good", roaming: false },
  { bars: 5, quality: "excellent", roaming: false },
  { bars: 3, quality: "fair", roaming: false },
  { bars: 4, quality: "good", roaming: false },
  { bars: 2, quality: "weak", roaming: false },
  { bars: 4, quality: "good", roaming: false },
];

export const UIQ_BATTERY_SEQUENCE = [
  { percent: 100, charging: false },
  { percent: 97, charging: false },
  { percent: 94, charging: false },
  { percent: 91, charging: false },
  { percent: 88, charging: false },
  { percent: 85, charging: false },
  { percent: 81, charging: false },
  { percent: 78, charging: false },
  { percent: 74, charging: false },
  { percent: 70, charging: false },
];

function toSafeDate(dateValue) {
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? new Date() : dateValue;
  }

  const parsed = new Date(dateValue || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getRotatingEntry(sequence, step) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return null;
  }

  const normalizedStep = Number.isFinite(step) ? Math.trunc(step) : 0;
  const index = ((normalizedStep % sequence.length) + sequence.length) % sequence.length;
  return sequence[index];
}

export function formatUIQTimeLabel(dateValue = new Date(), options = {}) {
  const date = toSafeDate(dateValue);
  const locale = options.locale || "en-GB";
  const hour12 = Boolean(options.hour12);

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

export function formatUIQDateLabel(dateValue = new Date(), options = {}) {
  const date = toSafeDate(dateValue);

  if (options.long) {
    return `${UIQ_WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()} ${UIQ_MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
  }

  return `${UIQ_WEEKDAY_LABELS[date.getDay()]} ${date.getDate()} ${UIQ_MONTH_LABELS[date.getMonth()]}`;
}

export function formatUIQTrackLength(durationSec = 0) {
  const safe = Math.max(0, Number(durationSec) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getUIQOperatorSnapshot(step = 0) {
  return (
    getRotatingEntry(UIQ_OPERATOR_SEQUENCE, step) || {
      id: "default",
      label: "T-Mobile HR",
      technology: "3G",
    }
  );
}

export function getUIQSignalSnapshot(step = 0) {
  return (
    getRotatingEntry(UIQ_SIGNAL_SEQUENCE, step) || {
      bars: 4,
      quality: "good",
      roaming: false,
    }
  );
}

export function getUIQBatterySnapshot(step = 0) {
  const fallback = { percent: 76, charging: false };
  const value = getRotatingEntry(UIQ_BATTERY_SEQUENCE, step) || fallback;
  const percent = Math.max(0, Math.min(100, Number(value.percent) || 0));

  return {
    ...value,
    percent,
    iconToken:
      percent >= 85
        ? "BAT4"
        : percent >= 65
          ? "BAT3"
          : percent >= 45
            ? "BAT2"
            : percent >= 20
              ? "BAT1"
              : "BAT0",
  };
}

export function getUIQStatusSnapshot(step = 0, dateValue = new Date(), options = {}) {
  return {
    clockLabel: formatUIQTimeLabel(dateValue, options.time || {}),
    dateLabel: formatUIQDateLabel(dateValue, options.date || {}),
    operator: getUIQOperatorSnapshot(step),
    signal: getUIQSignalSnapshot(step),
    battery: getUIQBatterySnapshot(step),
  };
}

export function cloneUIQSettingsSections(sections = UIQ_SETTINGS_SECTIONS) {
  return sections.map((section) => ({
    ...section,
    items: Array.isArray(section.items)
      ? section.items.map((item) => ({
          ...item,
          options: Array.isArray(item.options) ? [...item.options] : undefined,
        }))
      : [],
  }));
}

export function cloneUIQFileTree(node = UIQ_FILE_TREE) {
  if (!node || typeof node !== "object") {
    return null;
  }

  return {
    ...node,
    children: Array.isArray(node.children) ? node.children.map((child) => cloneUIQFileTree(child)) : undefined,
  };
}

export function getUIQThreadsByFolder(folderId = "inbox") {
  return UIQ_MESSAGE_THREADS.filter((thread) => thread.folderId === folderId);
}

export const UIQ_SEED_DATA = {
  launcher: UIQ_LAUNCHER_GRID,
  todayCards: UIQ_TODAY_CARDS,
  contacts: UIQ_CONTACTS,
  messageFolders: UIQ_MESSAGE_FOLDERS,
  messageThreads: UIQ_MESSAGE_THREADS,
  calendarEvents: UIQ_CALENDAR_EVENTS,
  calendarTasks: UIQ_CALENDAR_TASKS,
  mediaTracks: UIQ_MEDIA_TRACKS,
  mediaPhotos: UIQ_MEDIA_PHOTOS,
  notes: UIQ_NOTES,
  fileTree: UIQ_FILE_TREE,
  settingsSections: UIQ_SETTINGS_SECTIONS,
  profiles: UIQ_PROFILES,
  callLog: UIQ_CALL_LOG,
  operatorSequence: UIQ_OPERATOR_SEQUENCE,
  signalSequence: UIQ_SIGNAL_SEQUENCE,
  batterySequence: UIQ_BATTERY_SEQUENCE,
};
