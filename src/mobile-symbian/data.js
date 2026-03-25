const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const OPERATOR_SEQUENCE = [
  "MATIJA GSM",
  "MATIJA GSM",
  "MATIJA GSM",
  "MATIJA 3G",
  "MATIJA EDGE",
  "MATIJA GSM",
];

export const SIGNAL_LEVEL_SEQUENCE = [5, 4, 5, 3, 4, 5, 2, 4, 5];

export const BATTERY_LEVEL_SEQUENCE = [100, 97, 94, 92, 88, 85, 82, 80, 78, 76, 74, 72];

export const APP_MENU_ITEMS = [
  { id: "contacts", label: "Contacts", icon: "people" },
  { id: "messages", label: "Messaging", icon: "envelope" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "gallery", label: "Gallery", icon: "image" },
  { id: "music", label: "Music", icon: "music" },
  { id: "browser", label: "Web", icon: "globe" },
  { id: "files", label: "File mgr", icon: "folder" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "gear" },
  { id: "extras", label: "Extras", icon: "star" },
  { id: "profiles", label: "Profiles", icon: "profile" },
  { id: "log", label: "Log", icon: "phone" },
];

export const STANDBY_SHORTCUTS = [
  {
    id: "messages",
    label: "New message",
    detail: "2 unread conversations",
  },
  {
    id: "calendar",
    label: "Today",
    detail: "14:00 Portfolio QA sync",
  },
  {
    id: "music",
    label: "Now playing",
    detail: "Boards of Canada - Dayvan Cowboy",
  },
  {
    id: "browser",
    label: "Bookmarks",
    detail: "matijar.info/docs",
  },
];

export const CONTACTS = [
  {
    id: "contact-josip",
    name: "Josip K.",
    number: "+385 91 224 7721",
    company: "Pixel Forge",
    email: "josip@pixelforge.hr",
    location: "Zagreb",
    note: "Prefers SMS before calls.",
    lastCall: "Yesterday, 18:32",
  },
  {
    id: "contact-lana",
    name: "Lana R.",
    number: "+385 99 555 7300",
    company: "Freelance",
    email: "lana.r@example.com",
    location: "Split",
    note: "Frontend pairing partner.",
    lastCall: "Monday, 21:10",
  },
  {
    id: "contact-marko",
    name: "Marko V.",
    number: "+385 98 401 122",
    company: "Code Crafters",
    email: "marko@codecrafters.dev",
    location: "Rijeka",
    note: "Ask about deployment edge cache.",
    lastCall: "Mar 22, 09:41",
  },
  {
    id: "contact-ana",
    name: "Ana S.",
    number: "+385 95 742 1160",
    company: "Studio S",
    email: "ana@studios.hr",
    location: "Osijek",
    note: "Provides icon pack revisions.",
    lastCall: "Mar 19, 16:03",
  },
  {
    id: "contact-kreso",
    name: "Kreso D.",
    number: "+385 97 710 0011",
    company: "NOC Desk",
    email: "kreso@nocdesk.net",
    location: "Zadar",
    note: "Emergency infra contact.",
    lastCall: "Mar 14, 03:58",
  },
  {
    id: "contact-tea",
    name: "Tea M.",
    number: "+385 93 223 9918",
    company: "Audio Works",
    email: "tea@audioworks.hr",
    location: "Pula",
    note: "Ringtone mastering + loops.",
    lastCall: "Mar 10, 12:30",
  },
];

export const MESSAGE_THREADS = [
  {
    id: "thread-lana",
    from: "Lana R.",
    preview: "Can we ship the Symbian build tonight?",
    unreadCount: 1,
    updatedAt: "13:49",
    messages: [
      {
        id: "msg-lana-1",
        direction: "in",
        text: "Can we ship the Symbian build tonight?",
        sentAt: "13:49",
      },
      {
        id: "msg-lana-2",
        direction: "out",
        text: "Yes, I am wiring the final app routes now.",
        sentAt: "13:53",
      },
    ],
  },
  {
    id: "thread-josip",
    from: "Josip K.",
    preview: "Meeting moved to 15:30.",
    unreadCount: 0,
    updatedAt: "09:12",
    messages: [
      {
        id: "msg-josip-1",
        direction: "in",
        text: "Meeting moved to 15:30.",
        sentAt: "09:12",
      },
      {
        id: "msg-josip-2",
        direction: "out",
        text: "Perfect, see you then.",
        sentAt: "09:14",
      },
      {
        id: "msg-josip-3",
        direction: "in",
        text: "Bring the handset mockups.",
        sentAt: "09:15",
      },
    ],
  },
  {
    id: "thread-noc",
    from: "NOC Alert",
    preview: "Edge node latency recovered.",
    unreadCount: 0,
    updatedAt: "Yesterday",
    messages: [
      {
        id: "msg-noc-1",
        direction: "in",
        text: "Edge node latency recovered. Packet loss below 1%.",
        sentAt: "Yesterday, 23:11",
      },
    ],
  },
];

export const CALENDAR_EVENTS = [
  {
    id: "evt-qa",
    title: "Portfolio QA sync",
    location: "Studio Office",
    date: "2026-03-25",
    time: "14:00",
  },
  {
    id: "evt-client",
    title: "Client review call",
    location: "Teams",
    date: "2026-03-26",
    time: "11:30",
  },
  {
    id: "evt-render",
    title: "Render pass",
    location: "Workstation",
    date: "2026-03-27",
    time: "20:00",
  },
  {
    id: "evt-train",
    title: "Train to Zagreb",
    location: "Main station",
    date: "2026-03-29",
    time: "08:45",
  },
  {
    id: "evt-launch",
    title: "Launch rehearsal",
    location: "Lab",
    date: "2026-04-01",
    time: "17:00",
  },
];

export const GALLERY_ITEMS = [
  {
    id: "photo-city-night",
    title: "City lights",
    resolution: "1600x1200",
    size: "420 KB",
    capturedAt: "Mar 21, 2026",
    palette: "#114477",
  },
  {
    id: "photo-lab",
    title: "Workbench",
    resolution: "1280x960",
    size: "390 KB",
    capturedAt: "Mar 20, 2026",
    palette: "#456889",
  },
  {
    id: "photo-beach",
    title: "Beach dusk",
    resolution: "1024x768",
    size: "355 KB",
    capturedAt: "Mar 15, 2026",
    palette: "#cc9050",
  },
  {
    id: "photo-circuit",
    title: "Circuit macro",
    resolution: "1280x960",
    size: "402 KB",
    capturedAt: "Mar 09, 2026",
    palette: "#406a51",
  },
  {
    id: "photo-rain",
    title: "Rain window",
    resolution: "1600x1200",
    size: "478 KB",
    capturedAt: "Mar 03, 2026",
    palette: "#55627f",
  },
  {
    id: "photo-festival",
    title: "Street festival",
    resolution: "1024x768",
    size: "331 KB",
    capturedAt: "Feb 28, 2026",
    palette: "#b56f44",
  },
];

export const MUSIC_LIBRARY = [
  {
    id: "track-dayvan",
    title: "Dayvan Cowboy",
    artist: "Boards of Canada",
    album: "The Campfire Headphase",
    lengthSec: 321,
  },
  {
    id: "track-windowlicker",
    title: "Windowlicker",
    artist: "Aphex Twin",
    album: "Windowlicker",
    lengthSec: 376,
  },
  {
    id: "track-hunter",
    title: "Hunter",
    artist: "Bjork",
    album: "Homogenic",
    lengthSec: 256,
  },
  {
    id: "track-midnight",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We Are Dreaming",
    lengthSec: 244,
  },
  {
    id: "track-ocean",
    title: "Ocean Drive",
    artist: "Duke Dumont",
    album: "Blase Boys Club",
    lengthSec: 208,
  },
];

export const BROWSER_BOOKMARKS = [
  {
    id: "bm-portfolio",
    title: "matijar.info / docs",
    url: "https://matijar.info/docs",
    lastVisited: "Today",
  },
  {
    id: "bm-reference",
    title: "Symbian design archive",
    url: "https://archive.symbian.design",
    lastVisited: "Yesterday",
  },
  {
    id: "bm-forum",
    title: "S60 developer forum",
    url: "https://forum.s60.dev",
    lastVisited: "Mar 20",
  },
  {
    id: "bm-news",
    title: "Nokia history timeline",
    url: "https://mobile-history.example/nokia",
    lastVisited: "Mar 17",
  },
];

export const FILE_MANAGER_TREE = {
  id: "root",
  name: "Device",
  type: "folder",
  children: [
    {
      id: "drive-c",
      name: "C: Phone memory",
      type: "folder",
      children: [
        {
          id: "folder-images",
          name: "Images",
          type: "folder",
          children: [
            {
              id: "file-wallpaper",
              name: "wallpaper_blue.jpg",
              type: "file",
              size: "312 KB",
            },
            {
              id: "file-splash",
              name: "boot_splash.png",
              type: "file",
              size: "144 KB",
            },
          ],
        },
        {
          id: "folder-notes",
          name: "Notes",
          type: "folder",
          children: [
            {
              id: "file-project",
              name: "symbian_plan.txt",
              type: "file",
              size: "19 KB",
            },
          ],
        },
      ],
    },
    {
      id: "drive-e",
      name: "E: Memory card",
      type: "folder",
      children: [
        {
          id: "folder-music",
          name: "Music",
          type: "folder",
          children: [
            {
              id: "file-track-01",
              name: "dayvan_cowboy.mp3",
              type: "file",
              size: "7.4 MB",
            },
            {
              id: "file-track-02",
              name: "windowlicker.mp3",
              type: "file",
              size: "8.1 MB",
            },
          ],
        },
        {
          id: "folder-videos",
          name: "Videos",
          type: "folder",
          children: [
            {
              id: "file-reel",
              name: "showreel_2026.mp4",
              type: "file",
              size: "34 MB",
            },
          ],
        },
      ],
    },
    {
      id: "drive-z",
      name: "Z: System",
      type: "folder",
      children: [
        {
          id: "file-rom",
          name: "resource.rsc",
          type: "file",
          size: "900 KB",
        },
        {
          id: "file-font",
          name: "s60font.gdr",
          type: "file",
          size: "460 KB",
        },
      ],
    },
  ],
};

export const NOTES = [
  {
    id: "note-1",
    title: "Symbian polish",
    body: "Tune softkey spacing and list highlight speed.",
    updatedAt: "Today, 12:41",
  },
  {
    id: "note-2",
    title: "Battery tests",
    body: "Simulate drain while music and browser are both active.",
    updatedAt: "Today, 09:18",
  },
  {
    id: "note-3",
    title: "Voice memo idea",
    body: "Record retro startup prompt for extras app.",
    updatedAt: "Yesterday",
  },
];

export const SETTINGS_CATEGORIES = [
  {
    id: "connectivity",
    title: "Connectivity",
    items: [
      { id: "bluetooth", label: "Bluetooth", type: "toggle", value: true },
      { id: "packet-data", label: "Packet data", type: "toggle", value: true },
      { id: "wlan-scan", label: "WLAN scan", type: "select", value: "Every 2 min", options: ["Never", "Every 2 min", "Every 5 min"] },
    ],
  },
  {
    id: "display",
    title: "Display",
    items: [
      { id: "theme", label: "Theme", type: "select", value: "Midnight Blue", options: ["Midnight Blue", "Classic Green", "Steel Gray"] },
      { id: "brightness", label: "Brightness", type: "select", value: "65%", options: ["40%", "50%", "65%", "80%"] },
      { id: "light-timeout", label: "Light timeout", type: "select", value: "20 sec", options: ["10 sec", "20 sec", "30 sec"] },
    ],
  },
  {
    id: "sounds",
    title: "Sounds",
    items: [
      { id: "ringtone", label: "Ringtone", type: "select", value: "Nokia Tune (Retro)", options: ["Nokia Tune (Retro)", "Satin", "Pulse", "Lighthouse"] },
      { id: "keypad-tones", label: "Keypad tones", type: "select", value: "Level 2", options: ["Off", "Level 1", "Level 2", "Level 3"] },
      { id: "warning-tones", label: "Warning tones", type: "toggle", value: true },
    ],
  },
];

export const PROFILE_PRESETS = [
  {
    id: "general",
    label: "General",
    ringVolume: 7,
    vibra: true,
  },
  {
    id: "silent",
    label: "Silent",
    ringVolume: 0,
    vibra: false,
  },
  {
    id: "meeting",
    label: "Meeting",
    ringVolume: 2,
    vibra: false,
  },
  {
    id: "outdoor",
    label: "Outdoor",
    ringVolume: 10,
    vibra: true,
  },
];

export const CALL_LOG = [
  { id: "call-1", type: "missed", who: "Lana R.", at: "Today 11:42", duration: "--" },
  { id: "call-2", type: "dialed", who: "Josip K.", at: "Today 09:03", duration: "02:18" },
  { id: "call-3", type: "received", who: "Unknown", at: "Yesterday 21:17", duration: "00:46" },
  { id: "call-4", type: "missed", who: "Ana S.", at: "Yesterday 18:55", duration: "--" },
];

export const BOOT_LINES = [
  "Nokia SymbianOS v9.2",
  "ARM11 bootloader checksum OK",
  "RAM test: 128MB passed",
  "Loading telephony stack...",
  "Mounting C: and E: volumes",
  "Initializing S60 UI framework",
  "Connecting to GSM network",
  "Applying active profile",
  "Loading standby plugins",
  "System ready",
];

export function formatClockTime(now) {
  return now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatClockDate(now) {
  return `${WEEKDAY_LABELS[now.getDay()]} ${now.getDate()} ${MONTH_LABELS[now.getMonth()]}`;
}

export function formatLongDate(isoDate) {
  const [yearPart, monthPart, dayPart] = isoDate.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart) - 1;
  const day = Number(dayPart);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return isoDate;
  }

  const weekday = WEEKDAY_LABELS[new Date(year, month, day).getDay()];
  return `${weekday}, ${day} ${MONTH_LABELS[month]} ${year}`;
}

export function buildMonthMatrix({ year, month }) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = firstDay.getDay();
  const cells = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push({ day: 0, isoDate: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, isoDate });
  }

  while (cells.length < 42) {
    cells.push({ day: 0, isoDate: null });
  }

  return cells;
}

export function formatTrackLength(lengthSec) {
  const safeSec = Math.max(0, Number(lengthSec) || 0);
  const minutes = Math.floor(safeSec / 60);
  const seconds = safeSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function cloneSettingsCategories(categories = SETTINGS_CATEGORIES) {
  return categories.map((category) => ({
    ...category,
    items: Array.isArray(category.items)
      ? category.items.map((item) => ({
          ...item,
          options: Array.isArray(item.options) ? [...item.options] : undefined,
        }))
      : [],
  }));
}

export function cloneFileTree(node = FILE_MANAGER_TREE) {
  if (!node || typeof node !== "object") {
    return null;
  }

  return {
    ...node,
    children: Array.isArray(node.children) ? node.children.map((child) => cloneFileTree(child)) : undefined,
  };
}
