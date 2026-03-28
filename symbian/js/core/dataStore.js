function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDeep(base, patch) {
  if (!patch || typeof patch !== "object") {
    return base;
  }

  Object.entries(patch).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      base[key] = clone(value);
      return;
    }

    if (value && typeof value === "object") {
      const existing = base[key];
      if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
        base[key] = {};
      }
      mergeDeep(base[key], value);
      return;
    }

    base[key] = value;
  });

  return base;
}

function createDefaults() {
  const now = Date.now();

  return {
    settings: {
      profile: "General",
      flightMode: false,
      wlan: true,
      bluetooth: false,
      keyTone: true,
      theme: "blue"
    },
    phone: {
      dialBuffer: "",
      callLog: [
        {
          id: "call-1",
          name: "Ana Horvat",
          number: "+385 98 122 452",
          direction: "outgoing",
          time: now - 1000 * 60 * 42,
          durationSec: 212
        },
        {
          id: "call-2",
          name: "Bruno Novak",
          number: "+385 91 223 987",
          direction: "missed",
          time: now - 1000 * 60 * 130,
          durationSec: 0
        },
        {
          id: "call-3",
          name: "Petra Kralj",
          number: "+385 95 700 330",
          direction: "incoming",
          time: now - 1000 * 60 * 260,
          durationSec: 88
        }
      ]
    },
    contacts: [
      {
        id: "c1",
        name: "Ana Horvat",
        number: "+385 98 122 452",
        email: "ana.horvat@mail.hr",
        company: "Bluewave Labs"
      },
      {
        id: "c2",
        name: "Bruno Novak",
        number: "+385 91 223 987",
        email: "bruno.novak@studio.hr",
        company: "Novak Studio"
      },
      {
        id: "c3",
        name: "David Matic",
        number: "+385 99 810 114",
        email: "david.matic@grid.hr",
        company: "Grid Mobility"
      },
      {
        id: "c4",
        name: "Petra Kralj",
        number: "+385 95 700 330",
        email: "petra.kralj@signal.hr",
        company: "Signal Group"
      }
    ],
    messages: {
      folders: {
        inbox: [
          {
            id: "m1",
            contact: "Ana Horvat",
            number: "+385 98 122 452",
            text: "Meeting moved to 18:00. Can you bring the draft?",
            time: now - 1000 * 60 * 14,
            read: false
          },
          {
            id: "m2",
            contact: "Operator",
            number: "*100#",
            text: "Your prepaid balance is 12.40 EUR.",
            time: now - 1000 * 60 * 85,
            read: true
          },
          {
            id: "m3",
            contact: "Bruno Novak",
            number: "+385 91 223 987",
            text: "Do not forget to send the map screenshots.",
            time: now - 1000 * 60 * 160,
            read: true
          }
        ],
        sent: [
          {
            id: "m4",
            contact: "Petra Kralj",
            number: "+385 95 700 330",
            text: "I am on my way. ETA 20 minutes.",
            time: now - 1000 * 60 * 210,
            read: true
          }
        ],
        drafts: [
          {
            id: "m5",
            contact: "Draft",
            number: "",
            text: "Remember charger and SD card.",
            time: now - 1000 * 60 * 330,
            read: true
          }
        ]
      }
    },
    calendar: {
      events: [
        {
          id: "ev1",
          title: "Project stand-up",
          location: "Office 4A",
          note: "Bring latest screenshot set.",
          time: now + 1000 * 60 * 60 * 9
        },
        {
          id: "ev2",
          title: "Dentist",
          location: "Savska 18",
          note: "Take insurance card.",
          time: now + 1000 * 60 * 60 * 27
        },
        {
          id: "ev3",
          title: "Design sync",
          location: "Video call",
          note: "Review interaction polish.",
          time: now + 1000 * 60 * 60 * 52
        },
        {
          id: "ev4",
          title: "Train to Zagreb",
          location: "Platform 2",
          note: "Seat 24B",
          time: now + 1000 * 60 * 60 * 78
        }
      ]
    },
    browser: {
      currentUrl: "http://uiq.start",
      bookmarks: [
        { title: "UIQ Developer", url: "http://developer.uiq" },
        { title: "Symbian Planet", url: "http://planet.symbian" },
        { title: "Mobile Weather", url: "http://m.weather" },
        { title: "Transit Maps", url: "http://maps.mobile" }
      ],
      history: [
        { title: "UIQ Start", url: "http://uiq.start", time: now - 1000 * 60 * 33 },
        { title: "Symbian Planet", url: "http://planet.symbian", time: now - 1000 * 60 * 74 }
      ]
    },
    media: {
      photos: [
        {
          id: "p1",
          title: "Office Desk",
          createdAt: now - 1000 * 60 * 140,
          source: "camera"
        },
        {
          id: "p2",
          title: "Old Town",
          createdAt: now - 1000 * 60 * 420,
          source: "camera"
        }
      ],
      tracks: [
        { id: "t1", title: "Night Drive", lengthSec: 202 },
        { id: "t2", title: "Crystal Radio", lengthSec: 251 },
        { id: "t3", title: "Blue Alloy", lengthSec: 174 },
        { id: "t4", title: "Signal Drop", lengthSec: 307 }
      ],
      radioStations: [
        { id: "r1", name: "Radio 101", frequency: "101.2" },
        { id: "r2", name: "City FM", frequency: "98.4" },
        { id: "r3", name: "Jazz Wave", frequency: "94.7" },
        { id: "r4", name: "Retro Mix", frequency: "89.6" }
      ]
    },
    notes: [
      {
        id: "n1",
        title: "Packing",
        body: "Phone charger, USB cable, notebook, train tickets.",
        updatedAt: now - 1000 * 60 * 120
      },
      {
        id: "n2",
        title: "Meeting Notes",
        body: "Finalize launcher animations and menu hierarchy.",
        updatedAt: now - 1000 * 60 * 480
      }
    ],
    clock: {
      alarms: [
        { id: "a1", label: "Weekday alarm", time: "07:15", enabled: true },
        { id: "a2", label: "Workout", time: "18:30", enabled: false }
      ]
    },
    notifications: [
      {
        id: "ntf-1",
        title: "Calendar",
        body: "Project stand-up in 30 minutes.",
        appId: "calendar",
        time: now - 1000 * 60 * 8,
        read: false
      },
      {
        id: "ntf-2",
        title: "Browser",
        body: "Saved page available offline.",
        appId: "browser",
        time: now - 1000 * 60 * 55,
        read: true
      }
    ],
    launcher: {
      shortcuts: ["phone", "messages", "calendar", "browser"]
    }
  };
}

export class DataStore {
  constructor(storageKey = "uiq3_data_store_v2") {
    this.storageKey = storageKey;
    this.defaults = createDefaults();
    this.data = this.#load();
  }

  #load() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return clone(this.defaults);
    }

    try {
      const parsed = JSON.parse(raw);
      const merged = clone(this.defaults);
      mergeDeep(merged, parsed);
      return merged;
    } catch {
      return clone(this.defaults);
    }
  }

  #save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  snapshot() {
    return clone(this.data);
  }

  mutate(mutator) {
    if (typeof mutator === "function") {
      mutator(this.data);
      this.#save();
    }

    return this.snapshot();
  }

  replace(nextData) {
    const merged = clone(this.defaults);
    mergeDeep(merged, nextData || {});
    this.data = merged;
    this.#save();
    return this.snapshot();
  }

  reset() {
    this.defaults = createDefaults();
    this.data = clone(this.defaults);
    this.#save();
    return this.snapshot();
  }
}
