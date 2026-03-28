let uidCounter = 0;

function nextId(prefix) {
  uidCounter += 1;
  return `${prefix}-${Date.now()}-${uidCounter}`;
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${pad2(date.getDate())} ${month}`;
}

function formatDateTime(timestamp) {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
}

function formatDuration(seconds) {
  const safe = Math.max(0, seconds);
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${pad2(min)}:${pad2(sec)}`;
}

function formatRelative(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) {
    return "now";
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}m`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}h`;
  }

  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`;
}

function readSymbianAssetBasePath() {
  const globalBase =
    typeof globalThis === "object" ? globalThis.__SYMBIAN_ASSET_BASE__ : null;
  const normalized = String(globalBase || "").trim();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/\/+$/, "");
}

export function resolveSymbianAssetPath(path) {
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath) {
    return "";
  }

  if (/^(?:[a-z]+:)?\/\//i.test(normalizedPath) || normalizedPath.startsWith("/")) {
    return normalizedPath;
  }

  const basePath = readSymbianAssetBasePath();
  if (!basePath) {
    return normalizedPath;
  }

  return `${basePath}/${normalizedPath.replace(/^\.?\/*/, "")}`;
}

function appIcon(filename) {
  return resolveSymbianAssetPath(`/visuals-to-use/symbian/${filename}`);
}

function createPhoneApp() {
  const state = {
    tab: "dialer",
    selected: 0
  };

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  function ensureSelection(api) {
    const callLog = api.getData().phone.callLog;
    state.selected = clamp(state.selected, 0, Math.max(callLog.length - 1, 0));
  }

  function appendDigit(digit, api) {
    api.updateData((data) => {
      data.phone.dialBuffer = `${data.phone.dialBuffer || ""}${digit}`.slice(0, 24);
    });
  }

  function backspace(api) {
    api.updateData((data) => {
      data.phone.dialBuffer = (data.phone.dialBuffer || "").slice(0, -1);
    });
  }

  function makeCall(api, numberOverride = null) {
    const snapshot = api.getData();
    const dialed = numberOverride || snapshot.phone.dialBuffer;
    if (!dialed) {
      api.toast("Dial a number first.");
      return false;
    }

    const contact = snapshot.contacts.find((item) => item.number === dialed);
    const durationSec = Math.floor(40 + Math.random() * 200);

    api.updateData((data) => {
      data.phone.callLog.unshift({
        id: nextId("call"),
        name: contact?.name || dialed,
        number: dialed,
        direction: "outgoing",
        time: Date.now(),
        durationSec
      });
      data.phone.dialBuffer = dialed;
      data.phone.callLog = data.phone.callLog.slice(0, 40);
    });

    api.toast(`Call ended: ${dialed} (${formatDuration(durationSec)})`);
    return true;
  }

  return {
    getSoftkeys() {
      if (state.tab === "dialer") {
        return { left: "More", center: "Call", right: "Back" };
      }

      return { left: "More", center: "Call", right: "Back" };
    },

    getMenuItems(api) {
      const items = [
        {
          label: state.tab === "dialer" ? "Show recent calls" : "Show dialer",
          action: () => {
            state.tab = state.tab === "dialer" ? "recent" : "dialer";
            api.rerender();
          }
        },
        {
          label: "Redial last number",
          action: () => {
            const last = api.getData().phone.callLog[0];
            if (!last) {
              api.toast("No call history yet.");
              return;
            }
            makeCall(api, last.number);
          }
        }
      ];

      if (state.tab === "dialer") {
        items.push(
          {
            label: "Insert +",
            action: () => appendDigit("+", api)
          },
          {
            label: "Clear number",
            action: () => {
              api.updateData((data) => {
                data.phone.dialBuffer = "";
              });
              api.rerender();
            }
          }
        );
      }

      if (state.tab === "recent") {
        items.push({
          label: "Clear call log",
          action: () => {
            api.updateData((data) => {
              data.phone.callLog = [];
            });
            state.selected = 0;
            api.rerender();
          }
        });
      }

      return items;
    },

    onWheel(direction, api) {
      if (state.tab !== "recent") {
        return false;
      }

      ensureSelection(api);
      const max = api.getData().phone.callLog.length - 1;
      const next = clamp(state.selected + direction, 0, Math.max(max, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onKey(key, api) {
      if (key === "ArrowLeft" || key === "ArrowRight") {
        state.tab = state.tab === "dialer" ? "recent" : "dialer";
        api.rerender();
        return true;
      }

      if (state.tab !== "dialer") {
        return false;
      }

      const keyMap = {
        "0": "0",
        "1": "1",
        "2": "2",
        "3": "3",
        "4": "4",
        "5": "5",
        "6": "6",
        "7": "7",
        "8": "8",
        "9": "9",
        "*": "*",
        "#": "#"
      };

      if (key in keyMap) {
        appendDigit(keyMap[key], api);
        api.rerender();
        return true;
      }

      if (key === "Backspace") {
        backspace(api);
        api.rerender();
        return true;
      }

      return false;
    },

    onCenter(api) {
      if (state.tab === "dialer") {
        return makeCall(api);
      }

      const log = api.getData().phone.callLog;
      const entry = log[state.selected];
      if (!entry) {
        return false;
      }
      return makeCall(api, entry.number);
    },

    render(container, api) {
      const snapshot = api.getData();
      const dialBuffer = snapshot.phone.dialBuffer || "";
      const recent = snapshot.phone.callLog || [];
      ensureSelection(api);

      const tabs = `
        <nav class="tab-bar">
          <button class="tab-btn ${state.tab === "dialer" ? "active" : ""}" data-tab="dialer" type="button">Dialer</button>
          <button class="tab-btn ${state.tab === "recent" ? "active" : ""}" data-tab="recent" type="button">Recent</button>
        </nav>`;

      let body = "";

      if (state.tab === "dialer") {
        const keypadHtml = keypadRows
          .map(
            (row) => `
            <div class="keypad-row">
              ${row
                .map(
                  (digit) =>
                    `<button class="dial-key" data-digit="${digit}" type="button">${digit}</button>`
                )
                .join("")}
            </div>`
          )
          .join("");

        body = `
          <div class="dialer-view">
            <div class="dial-buffer">${escapeHtml(dialBuffer || "_")}</div>
            <div class="dialer-hint">Use mouse, wheel and keyboard digits.</div>
            <div class="dial-pad">${keypadHtml}</div>
            <button class="dial-backspace" type="button" data-action="backspace">Delete</button>
          </div>
        `;
      } else {
        const rows = recent
          .map((entry, index) => {
            const directionLabel = entry.direction[0].toUpperCase() + entry.direction.slice(1);
            return `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-call-index="${index}">
                <div>
                  <div class="row-title">${escapeHtml(entry.name)}</div>
                  <div class="row-subtitle">${escapeHtml(entry.number)} - ${directionLabel}</div>
                </div>
                <div class="row-meta">${escapeHtml(formatTime(entry.time))}</div>
              </li>`;
          })
          .join("");

        body = `<ul class="uiq-list">${rows || '<li class="uiq-empty">No recent calls.</li>'}</ul>`;
      }

      container.innerHTML = `
        <div class="app-titlebar">Phone</div>
        ${tabs}
        ${body}
      `;

      container.querySelectorAll("[data-tab]").forEach((element) => {
        element.addEventListener("click", () => {
          state.tab = element.dataset.tab;
          api.rerender();
        });
      });

      container.querySelectorAll("[data-digit]").forEach((element) => {
        element.addEventListener("click", () => {
          appendDigit(element.dataset.digit, api);
          api.rerender();
        });
      });

      container.querySelector("[data-action='backspace']")?.addEventListener("click", () => {
        backspace(api);
        api.rerender();
      });

      container.querySelectorAll("[data-call-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.callIndex);
          api.rerender();
        });
      });
    }
  };
}

function createMessagesApp() {
  const folderOrder = ["inbox", "sent", "drafts"];
  const folderLabel = {
    inbox: "Inbox",
    sent: "Sent",
    drafts: "Drafts"
  };

  const quickReplies = [
    "On my way.",
    "I will call you in 5 min.",
    "Seen. Thanks.",
    "Can we move this to tomorrow?"
  ];

  const state = {
    tab: 0,
    selected: 0,
    detailMessageId: null,
    quickReplySelection: 0
  };

  function currentFolderKey() {
    return folderOrder[state.tab];
  }

  function currentMessages(api) {
    return api.getData().messages.folders[currentFolderKey()] || [];
  }

  function ensureSelection(api) {
    const items = currentMessages(api);
    state.selected = clamp(state.selected, 0, Math.max(items.length - 1, 0));
  }

  function openSelectedMessage(api) {
    ensureSelection(api);
    const message = currentMessages(api)[state.selected];
    if (!message) {
      return false;
    }

    api.updateData((data) => {
      const folder = data.messages.folders[currentFolderKey()];
      const target = folder.find((item) => item.id === message.id);
      if (target) {
        target.read = true;
      }
    });

    state.detailMessageId = message.id;
    api.rerender();
    return true;
  }

  function getDetailMessage(api) {
    if (!state.detailMessageId) {
      return null;
    }
    return currentMessages(api).find((item) => item.id === state.detailMessageId) || null;
  }

  function composeReply(api, text) {
    const detailMessage = getDetailMessage(api) || currentMessages(api)[state.selected];
    if (!detailMessage) {
      return;
    }

    api.updateData((data) => {
      data.messages.folders.sent.unshift({
        id: nextId("msg"),
        contact: detailMessage.contact,
        number: detailMessage.number,
        text,
        time: Date.now(),
        read: true
      });
      data.messages.folders.sent = data.messages.folders.sent.slice(0, 40);
    });

    api.toast(`Sent to ${detailMessage.contact}`);
  }

  return {
    getSoftkeys() {
      if (state.detailMessageId) {
        return { left: "More", center: "Reply", right: "Back" };
      }

      return { left: "More", center: "Open", right: "Back" };
    },

    getMenuItems(api) {
      const items = [
        {
          label: "Compose quick message",
          action: () => {
            const text = quickReplies[state.quickReplySelection % quickReplies.length];
            api.updateData((data) => {
              data.messages.folders.sent.unshift({
                id: nextId("msg"),
                contact: "Draft",
                number: "",
                text,
                time: Date.now(),
                read: true
              });
            });
            state.quickReplySelection += 1;
            api.toast("Quick message stored in Sent.");
          }
        },
        {
          label: "Next folder",
          action: () => {
            state.tab = (state.tab + 1) % folderOrder.length;
            state.selected = 0;
            state.detailMessageId = null;
            api.rerender();
          }
        }
      ];

      if (state.detailMessageId) {
        items.push({
          label: "Mark as unread",
          action: () => {
            const message = getDetailMessage(api);
            if (!message) {
              return;
            }

            api.updateData((data) => {
              const folder = data.messages.folders[currentFolderKey()];
              const target = folder.find((entry) => entry.id === message.id);
              if (target) {
                target.read = false;
              }
            });
            api.rerender();
          }
        });
      } else {
        items.push({
          label: "Delete selected",
          action: () => {
            const messages = currentMessages(api);
            const target = messages[state.selected];
            if (!target) {
              return;
            }

            api.updateData((data) => {
              const folder = data.messages.folders[currentFolderKey()];
              const index = folder.findIndex((entry) => entry.id === target.id);
              if (index >= 0) {
                folder.splice(index, 1);
              }
            });

            state.selected = Math.max(0, state.selected - 1);
            api.rerender();
          }
        });
      }

      return items;
    },

    onWheel(direction, api) {
      if (state.detailMessageId) {
        return false;
      }

      ensureSelection(api);
      const messages = currentMessages(api);
      if (!messages.length) {
        return false;
      }

      const next = clamp(state.selected + direction, 0, messages.length - 1);
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }

      return true;
    },

    onKey(key, api) {
      if (state.detailMessageId) {
        return false;
      }

      if (key !== "ArrowLeft" && key !== "ArrowRight") {
        return false;
      }

      const delta = key === "ArrowRight" ? 1 : -1;
      state.tab = (state.tab + delta + folderOrder.length) % folderOrder.length;
      state.selected = 0;
      api.rerender();
      return true;
    },

    onCenter(api) {
      if (state.detailMessageId) {
        const text = quickReplies[state.quickReplySelection % quickReplies.length];
        state.quickReplySelection += 1;
        composeReply(api, text);
        return true;
      }

      return openSelectedMessage(api);
    },

    onBack(api) {
      if (!state.detailMessageId) {
        return false;
      }

      state.detailMessageId = null;
      api.rerender();
      return true;
    },

    render(container, api) {
      const messages = currentMessages(api);
      ensureSelection(api);

      const tabsHtml = folderOrder
        .map(
          (folder, index) =>
            `<button class="tab-btn ${index === state.tab ? "active" : ""}" data-folder-index="${index}" type="button">${folderLabel[folder]}</button>`
        )
        .join("");

      let body = "";

      if (state.detailMessageId) {
        const message = getDetailMessage(api);
        if (!message) {
          state.detailMessageId = null;
        } else {
          body = `
            <div class="message-detail">
              <div class="message-detail-head">
                <div class="message-contact">${escapeHtml(message.contact)}</div>
                <div class="message-time">${escapeHtml(formatDateTime(message.time))}</div>
              </div>
              <div class="message-bubble">${escapeHtml(message.text)}</div>
              <div class="message-hint">Center softkey sends a quick reply.</div>
            </div>`;
        }
      }

      if (!body) {
        const listHtml = messages
          .map(
            (item, index) => `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-message-index="${index}">
                <div>
                  <div class="row-title">${item.read ? "" : "[New] "}${escapeHtml(item.contact)}</div>
                  <div class="row-subtitle">${escapeHtml(item.text)}</div>
                </div>
                <div class="row-meta">${escapeHtml(formatRelative(item.time))}</div>
              </li>`
          )
          .join("");

        body = `<ul class="uiq-list">${listHtml || '<li class="uiq-empty">Folder is empty.</li>'}</ul>`;
      }

      container.innerHTML = `
        <div class="app-titlebar">Messages</div>
        <nav class="tab-bar">${tabsHtml}</nav>
        ${body}
      `;

      container.querySelectorAll("[data-folder-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.tab = Number(element.dataset.folderIndex);
          state.selected = 0;
          state.detailMessageId = null;
          api.rerender();
        });
      });

      container.querySelectorAll("[data-message-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.messageIndex);
          openSelectedMessage(api);
        });
      });
    }
  };
}

function createContactsApp() {
  const state = {
    selected: 0,
    detailId: null
  };

  function contacts(api) {
    return api.getData().contacts;
  }

  function ensureSelection(api) {
    const items = contacts(api);
    state.selected = clamp(state.selected, 0, Math.max(items.length - 1, 0));
  }

  function currentContact(api) {
    if (state.detailId) {
      return contacts(api).find((item) => item.id === state.detailId) || null;
    }

    ensureSelection(api);
    return contacts(api)[state.selected] || null;
  }

  function makeCall(api, contact) {
    if (!contact) {
      return;
    }

    api.updateData((data) => {
      data.phone.callLog.unshift({
        id: nextId("call"),
        name: contact.name,
        number: contact.number,
        direction: "outgoing",
        time: Date.now(),
        durationSec: Math.floor(35 + Math.random() * 120)
      });
      data.phone.callLog = data.phone.callLog.slice(0, 40);
    });

    api.toast(`Calling ${contact.name}...`);
  }

  return {
    getSoftkeys() {
      if (state.detailId) {
        return { left: "More", center: "Call", right: "Back" };
      }
      return { left: "More", center: "Open", right: "Back" };
    },

    getMenuItems(api) {
      const items = [
        {
          label: "New contact",
          action: () => {
            const suffix = api.getData().contacts.length + 1;
            api.updateData((data) => {
              data.contacts.push({
                id: nextId("contact"),
                name: `New Contact ${suffix}`,
                number: `+385 97 44${pad2(suffix)}${pad2(suffix)}`,
                email: `contact${suffix}@mail.hr`,
                company: ""
              });
            });
            api.toast("Contact created.");
            api.rerender();
          }
        },
        {
          label: "Sort A-Z",
          action: () => {
            api.updateData((data) => {
              data.contacts.sort((a, b) => a.name.localeCompare(b.name));
            });
            state.selected = 0;
            api.rerender();
          }
        }
      ];

      const selected = currentContact(api);
      if (selected) {
        items.push({
          label: `Message ${selected.name.split(" ")[0]}`,
          action: () => {
            api.updateData((data) => {
              data.messages.folders.sent.unshift({
                id: nextId("msg"),
                contact: selected.name,
                number: selected.number,
                text: "Sent from Contacts.",
                time: Date.now(),
                read: true
              });
            });
            api.toast("Message sent.");
          }
        });
      }

      return items;
    },

    onWheel(direction, api) {
      if (state.detailId) {
        return false;
      }

      ensureSelection(api);
      const max = contacts(api).length - 1;
      const next = clamp(state.selected + direction, 0, Math.max(max, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      if (state.detailId) {
        makeCall(api, currentContact(api));
        return true;
      }

      const contact = contacts(api)[state.selected];
      if (!contact) {
        return false;
      }

      state.detailId = contact.id;
      api.rerender();
      return true;
    },

    onBack(api) {
      if (!state.detailId) {
        return false;
      }

      state.detailId = null;
      api.rerender();
      return true;
    },

    render(container, api) {
      const list = contacts(api);
      ensureSelection(api);

      let body = "";

      if (state.detailId) {
        const selected = currentContact(api);
        if (!selected) {
          state.detailId = null;
        } else {
          body = `
            <div class="contact-card">
              <div class="contact-avatar">${escapeHtml(selected.name.slice(0, 1))}</div>
              <div class="contact-name">${escapeHtml(selected.name)}</div>
              <div class="contact-meta">${escapeHtml(selected.number)}</div>
              <div class="contact-meta">${escapeHtml(selected.email || "No email")}</div>
              <div class="contact-meta">${escapeHtml(selected.company || "No company")}</div>
              <div class="contact-hint">Center softkey places a call.</div>
            </div>
          `;
        }
      }

      if (!body) {
        const rows = list
          .map(
            (item, index) => `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-contact-index="${index}">
                <div>
                  <div class="row-title">${escapeHtml(item.name)}</div>
                  <div class="row-subtitle">${escapeHtml(item.number)}</div>
                </div>
              </li>`
          )
          .join("");

        body = `<ul class="uiq-list">${rows || '<li class="uiq-empty">No contacts.</li>'}</ul>`;
      }

      container.innerHTML = `
        <div class="app-titlebar">Contacts</div>
        ${body}
      `;

      container.querySelectorAll("[data-contact-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.contactIndex);
          state.detailId = null;
          api.rerender();
        });
      });
    }
  };
}

function createCalendarApp() {
  const state = {
    tab: "agenda",
    selected: 0
  };

  function sortedEvents(api) {
    return [...api.getData().calendar.events].sort((a, b) => a.time - b.time);
  }

  function ensureSelection(api) {
    const events = sortedEvents(api);
    state.selected = clamp(state.selected, 0, Math.max(events.length - 1, 0));
  }

  function renderMonth(events) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const eventDays = new Set(events.map((item) => new Date(item.time).getDate()));
    const cells = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push('<div class="month-cell empty"></div>');
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const isToday = day === now.getDate();
      const hasEvent = eventDays.has(day);
      cells.push(
        `<div class="month-cell ${isToday ? "today" : ""} ${hasEvent ? "has-event" : ""}">${day}</div>`
      );
    }

    return `<div class="month-grid">${cells.join("")}</div>`;
  }

  return {
    getSoftkeys() {
      return { left: "More", center: "Open", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: state.tab === "agenda" ? "Switch to month" : "Switch to agenda",
          action: () => {
            state.tab = state.tab === "agenda" ? "month" : "agenda";
            api.rerender();
          }
        },
        {
          label: "Add event tomorrow",
          action: () => {
            const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
            api.updateData((data) => {
              data.calendar.events.push({
                id: nextId("event"),
                title: "New appointment",
                location: "TBD",
                note: "Created from Calendar menu.",
                time: tomorrow
              });
            });
            api.toast("Event added.");
            api.rerender();
          }
        }
      ];
    },

    onWheel(direction, api) {
      if (state.tab !== "agenda") {
        return false;
      }

      const events = sortedEvents(api);
      const next = clamp(state.selected + direction, 0, Math.max(events.length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onKey(key, api) {
      if (key !== "ArrowLeft" && key !== "ArrowRight") {
        return false;
      }

      state.tab = state.tab === "agenda" ? "month" : "agenda";
      api.rerender();
      return true;
    },

    onCenter(api) {
      const events = sortedEvents(api);
      if (state.tab === "month") {
        api.toast(`Events this month: ${events.length}`);
        return true;
      }

      const event = events[state.selected];
      if (!event) {
        return false;
      }

      api.toast(`${event.title} at ${formatDateTime(event.time)}`);
      return true;
    },

    render(container, api) {
      const events = sortedEvents(api);
      ensureSelection(api);

      let body = "";

      if (state.tab === "agenda") {
        const rows = events
          .map(
            (event, index) => `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-event-index="${index}">
                <div>
                  <div class="row-title">${escapeHtml(event.title)}</div>
                  <div class="row-subtitle">${escapeHtml(event.location || "")}</div>
                </div>
                <div class="row-meta">${escapeHtml(formatDate(event.time))}</div>
              </li>`
          )
          .join("");

        body = `<ul class="uiq-list">${rows || '<li class="uiq-empty">No events planned.</li>'}</ul>`;
      } else {
        body = `
          <div class="month-view">
            <div class="month-header">${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
            ${renderMonth(events)}
            <div class="month-legend">
              <span class="legend-dot"></span> = day with events
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="app-titlebar">Calendar</div>
        <nav class="tab-bar">
          <button class="tab-btn ${state.tab === "agenda" ? "active" : ""}" data-cal-tab="agenda" type="button">Agenda</button>
          <button class="tab-btn ${state.tab === "month" ? "active" : ""}" data-cal-tab="month" type="button">Month</button>
        </nav>
        ${body}
      `;

      container.querySelectorAll("[data-cal-tab]").forEach((element) => {
        element.addEventListener("click", () => {
          state.tab = element.dataset.calTab;
          api.rerender();
        });
      });

      container.querySelectorAll("[data-event-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.eventIndex);
          api.rerender();
        });
      });
    }
  };
}

function createBrowserApp() {
  const state = {
    tab: "bookmarks",
    selected: 0
  };

  const quickSites = [
    { title: "Weather", url: "http://m.weather" },
    { title: "News", url: "http://m.news" },
    { title: "Maps", url: "http://maps.mobile" },
    { title: "Mail", url: "http://mail.mobile" }
  ];

  function items(api) {
    const data = api.getData().browser;
    return state.tab === "bookmarks" ? data.bookmarks : data.history;
  }

  function currentUrl(api) {
    return api.getData().browser.currentUrl;
  }

  function openUrl(url, api) {
    const clean = url.trim();
    if (!clean) {
      return false;
    }

    const title = clean
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .slice(0, 24);

    api.updateData((data) => {
      data.browser.currentUrl = clean;
      data.browser.history.unshift({
        title,
        url: clean,
        time: Date.now()
      });
      data.browser.history = data.browser.history.slice(0, 35);
    });

    api.rerender();
    return true;
  }

  return {
    getSoftkeys() {
      return { left: "More", center: "Go", right: "Back" };
    },

    getMenuItems(api) {
      const menu = [
        {
          label: state.tab === "bookmarks" ? "Show history" : "Show bookmarks",
          action: () => {
            state.tab = state.tab === "bookmarks" ? "history" : "bookmarks";
            state.selected = 0;
            api.rerender();
          }
        },
        {
          label: "Home page",
          action: () => openUrl("http://uiq.start", api)
        },
        {
          label: "Clear history",
          action: () => {
            api.updateData((data) => {
              data.browser.history = [];
            });
            state.selected = 0;
            api.rerender();
          }
        }
      ];

      quickSites.forEach((site) => {
        menu.push({
          label: `Open ${site.title}`,
          action: () => openUrl(site.url, api)
        });
      });

      return menu;
    },

    onWheel(direction, api) {
      const list = items(api);
      const max = Math.max(list.length - 1, 0);
      const next = clamp(state.selected + direction, 0, max);
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onKey(key, api) {
      if (key !== "ArrowLeft" && key !== "ArrowRight") {
        return false;
      }

      state.tab = state.tab === "bookmarks" ? "history" : "bookmarks";
      state.selected = 0;
      api.rerender();
      return true;
    },

    onCenter(api) {
      const list = items(api);
      const entry = list[state.selected];
      if (!entry) {
        return false;
      }

      return openUrl(entry.url, api);
    },

    render(container, api) {
      const list = items(api);
      state.selected = clamp(state.selected, 0, Math.max(list.length - 1, 0));

      const rows = list
        .map(
          (entry, index) => `
            <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-browser-index="${index}">
              <div>
                <div class="row-title">${escapeHtml(entry.title || entry.url)}</div>
                <div class="row-subtitle">${escapeHtml(entry.url)}</div>
              </div>
              <div class="row-meta">${escapeHtml(entry.time ? formatRelative(entry.time) : "")}</div>
            </li>`
        )
        .join("");

      const pageTitle = currentUrl(api)
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .slice(0, 24);

      container.innerHTML = `
        <div class="app-titlebar">Browser</div>
        <nav class="tab-bar">
          <button class="tab-btn ${state.tab === "bookmarks" ? "active" : ""}" data-browser-tab="bookmarks" type="button">Bookmarks</button>
          <button class="tab-btn ${state.tab === "history" ? "active" : ""}" data-browser-tab="history" type="button">History</button>
        </nav>
        <div class="address-strip">${escapeHtml(currentUrl(api))}</div>
        <ul class="uiq-list">${rows || '<li class="uiq-empty">No entries.</li>'}</ul>
        <div class="mini-page">
          <div class="mini-page-title">${escapeHtml(pageTitle)}</div>
          <div>Rendered in text mode for this simulation.</div>
        </div>
      `;

      container.querySelectorAll("[data-browser-tab]").forEach((element) => {
        element.addEventListener("click", () => {
          state.tab = element.dataset.browserTab;
          state.selected = 0;
          api.rerender();
        });
      });

      container.querySelectorAll("[data-browser-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.browserIndex);
          api.rerender();
        });
      });
    }
  };
}

function createFilesApp() {
  const state = {
    path: "",
    selected: 0,
    preview: ""
  };

  function entries(api) {
    return api.fs.list(state.path);
  }

  function availableDrives(api) {
    return api.fs
      .list("")
      .filter((entry) => entry.type === "dir" && /^[a-z]:$/i.test(entry.name))
      .map((entry) => entry.name.toUpperCase())
      .sort();
  }

  function ensureSelection(api) {
    const list = entries(api);
    state.selected = clamp(state.selected, 0, Math.max(list.length - 1, 0));
  }

  function openSelected(api) {
    ensureSelection(api);
    const list = entries(api);
    const item = list[state.selected];
    if (!item) {
      return false;
    }

    if (item.type === "dir") {
      state.path = item.path;
      state.selected = 0;
      state.preview = "";
      api.rerender();
      return true;
    }

    const content = api.fs.readFile(item.path);
    state.preview = typeof content === "string" ? content : "[Cannot preview this file]";
    api.rerender();
    return true;
  }

  function uniqueName(api, base, ext = "") {
    const list = entries(api);
    const names = new Set(list.map((item) => item.name));
    if (!names.has(`${base}${ext}`)) {
      return `${base}${ext}`;
    }

    let index = 1;
    while (names.has(`${base}_${index}${ext}`)) {
      index += 1;
    }

    return `${base}_${index}${ext}`;
  }

  function currentPathLabel() {
    return state.path || "Drives";
  }

  return {
    getSoftkeys() {
      return { left: "More", center: "Open", right: "Back" };
    },

    getMenuItems(api) {
      const list = entries(api);
      const selected = list[state.selected] || null;
      const menu = [];

      if (state.path) {
        menu.push({
          label: "Up one level",
          action: () => {
            state.path = api.fs.parent(state.path);
            state.selected = 0;
            state.preview = "";
            api.rerender();
          }
        });
      }

      for (const drive of availableDrives(api)) {
        menu.push({
          label: `Go to ${drive}`,
          action: () => {
            state.path = drive;
            state.selected = 0;
            state.preview = "";
            api.rerender();
          }
        });
      }

      if (state.path) {
        menu.push(
          {
            label: "Create text file",
            action: () => {
              const filename = uniqueName(api, "note", ".txt");
              const fullPath = `${state.path}/${filename}`;
              api.fs.writeFile(fullPath, `Created in File Manager at ${new Date().toLocaleString()}`);
              api.toast(`${filename} created.`);
              api.rerender();
            }
          },
          {
            label: "Create folder",
            action: () => {
              const dirname = uniqueName(api, "folder");
              const fullPath = `${state.path}/${dirname}`;
              api.fs.mkdir(fullPath);
              api.toast(`${dirname} created.`);
              api.rerender();
            }
          }
        );
      }

      if (selected) {
        menu.push(
          {
            label: `Rename ${selected.name}`,
            action: () => {
              const renamed = api.fs.rename(selected.path, `${selected.name}_new`);
              if (renamed) {
                api.toast("Renamed.");
              } else {
                api.toast("Rename failed.");
              }
              api.rerender();
            }
          },
          {
            label: `Delete ${selected.name}`,
            action: () => {
              api.fs.remove(selected.path);
              state.selected = Math.max(0, state.selected - 1);
              state.preview = "";
              api.rerender();
            }
          }
        );
      }

      menu.push({
        label: "Reset filesystem",
        action: () => {
          api.fs.reset();
          state.path = "";
          state.selected = 0;
          state.preview = "";
          api.rerender();
        }
      });

      return menu;
    },

    onWheel(direction, api) {
      const list = entries(api);
      const next = clamp(state.selected + direction, 0, Math.max(list.length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      return openSelected(api);
    },

    onBack(api) {
      if (!state.path) {
        return false;
      }

      state.path = api.fs.parent(state.path);
      state.selected = 0;
      state.preview = "";
      api.rerender();
      return true;
    },

    render(container, api) {
      ensureSelection(api);
      const list = entries(api);

      const rows = list
        .map(
          (item, index) => `
            <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-file-index="${index}">
              <div>
                <div class="row-title">${escapeHtml(item.name)}</div>
                <div class="row-subtitle">${escapeHtml(item.type === "dir" ? "Folder" : "File")}</div>
              </div>
              <div class="row-meta">${escapeHtml(item.type.toUpperCase())}</div>
            </li>`
        )
        .join("");

      const preview = state.preview
        ? `<pre class="file-preview">${escapeHtml(state.preview)}</pre>`
        : '<div class="file-preview-muted">Select a file to preview contents.</div>';

      container.innerHTML = `
        <div class="app-titlebar">File Manager</div>
        <div class="path-strip">Path: ${escapeHtml(currentPathLabel())}</div>
        <ul class="uiq-list">${rows || '<li class="uiq-empty">Directory is empty.</li>'}</ul>
        <div class="preview-panel">${preview}</div>
      `;

      container.querySelectorAll("[data-file-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.fileIndex);
          openSelected(api);
        });
      });
    }
  };
}

function createMusicApp() {
  const state = {
    selected: 0,
    trackId: null,
    playing: false,
    positionSec: 0,
    ticker: null
  };

  function tracks(api) {
    return api.getData().media.tracks;
  }

  function currentTrack(api) {
    const list = tracks(api);
    if (!state.trackId) {
      return null;
    }
    return list.find((item) => item.id === state.trackId) || null;
  }

  function stopTicker() {
    if (!state.ticker) {
      return;
    }
    clearInterval(state.ticker);
    state.ticker = null;
  }

  function startTicker(api) {
    if (state.ticker) {
      return;
    }

    state.ticker = setInterval(() => {
      if (!state.playing) {
        return;
      }

      const track = currentTrack(api);
      if (!track) {
        return;
      }

      state.positionSec += 1;
      if (state.positionSec >= track.lengthSec) {
        state.positionSec = 0;
        const list = tracks(api);
        const currentIndex = list.findIndex((entry) => entry.id === track.id);
        const nextIndex = (currentIndex + 1) % list.length;
        state.trackId = list[nextIndex].id;
      }

      api.rerender();
    }, 1000);
  }

  function playSelected(api) {
    const list = tracks(api);
    const selected = list[state.selected];
    if (!selected) {
      return false;
    }

    if (state.trackId !== selected.id) {
      state.positionSec = 0;
    }

    state.trackId = selected.id;
    state.playing = true;
    api.rerender();
    return true;
  }

  return {
    onActivate(api) {
      startTicker(api);
    },

    onPause() {
      stopTicker();
    },

    onClose() {
      stopTicker();
    },

    getSoftkeys() {
      return { left: "More", center: state.playing ? "Pause" : "Play", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: state.playing ? "Pause playback" : "Play selected",
          action: () => {
            if (state.playing) {
              state.playing = false;
            } else {
              playSelected(api);
            }
            api.rerender();
          }
        },
        {
          label: "Next track",
          action: () => {
            const list = tracks(api);
            if (!list.length) {
              return;
            }
            state.selected = (state.selected + 1) % list.length;
            playSelected(api);
          }
        },
        {
          label: "Stop",
          action: () => {
            state.playing = false;
            state.trackId = null;
            state.positionSec = 0;
            api.rerender();
          }
        }
      ];
    },

    onWheel(direction, api) {
      const list = tracks(api);
      const next = clamp(state.selected + direction, 0, Math.max(list.length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      const list = tracks(api);
      const selected = list[state.selected];
      if (!selected) {
        return false;
      }

      if (state.trackId === selected.id && state.playing) {
        state.playing = false;
      } else {
        playSelected(api);
      }

      api.rerender();
      return true;
    },

    render(container, api) {
      const list = tracks(api);
      state.selected = clamp(state.selected, 0, Math.max(list.length - 1, 0));

      const track = currentTrack(api);
      const progress = track ? Math.floor((state.positionSec / track.lengthSec) * 100) : 0;

      const rows = list
        .map((entry, index) => {
          const isCurrent = state.trackId === entry.id;
          const stateLabel = isCurrent ? (state.playing ? "Playing" : "Paused") : "";

          return `
            <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-track-index="${index}">
              <div>
                <div class="row-title">${escapeHtml(entry.title)}</div>
                <div class="row-subtitle">${escapeHtml(formatDuration(entry.lengthSec))}</div>
              </div>
              <div class="row-meta">${stateLabel}</div>
            </li>`;
        })
        .join("");

      container.innerHTML = `
        <div class="app-titlebar">Music</div>
        <div class="now-playing">Now: ${escapeHtml(track ? `${track.title} (${state.playing ? "playing" : "paused"})` : "Stopped")}</div>
        <div class="progress-wrap"><div class="progress-fill" style="width: ${progress}%"></div></div>
        <div class="progress-time">${escapeHtml(formatDuration(state.positionSec))}${track ? ` / ${escapeHtml(formatDuration(track.lengthSec))}` : ""}</div>
        <ul class="uiq-list">${rows || '<li class="uiq-empty">No tracks.</li>'}</ul>
      `;

      container.querySelectorAll("[data-track-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.trackIndex);
          api.rerender();
        });
      });
    }
  };
}

function createCameraApp() {
  const state = {
    frame: 0,
    mode: "photo",
    burst: false
  };

  function capture(api) {
    const title = `IMG_${new Date().toISOString().slice(11, 19).replace(/:/g, "")}`;

    api.updateData((data) => {
      data.media.photos.unshift({
        id: nextId("photo"),
        title,
        createdAt: Date.now(),
        source: "camera"
      });
      data.media.photos = data.media.photos.slice(0, 120);
    });

    api.notify({
      title: "Camera",
      body: `${title}.jpg saved to Gallery`,
      appId: "gallery"
    });
  }

  return {
    getSoftkeys() {
      return { left: "More", center: "Snap", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: state.mode === "photo" ? "Switch to video mode" : "Switch to photo mode",
          action: () => {
            state.mode = state.mode === "photo" ? "video" : "photo";
            api.rerender();
          }
        },
        {
          label: state.burst ? "Disable burst" : "Enable burst",
          action: () => {
            state.burst = !state.burst;
            api.rerender();
          }
        },
        {
          label: "Open gallery",
          action: () => api.openApp("gallery")
        }
      ];
    },

    onCenter(api) {
      capture(api);
      state.frame += 1;

      if (state.burst && state.mode === "photo") {
        capture(api);
      }

      api.toast("Captured.");
      api.rerender();
      return true;
    },

    render(container) {
      container.innerHTML = `
        <div class="app-titlebar">Camera</div>
        <div class="camera-shell">
          <div class="viewfinder">
            <div class="viewfinder-grid"></div>
            <div class="viewfinder-info">Mode: ${escapeHtml(state.mode)} | Frame ${state.frame}</div>
          </div>
          <div class="camera-controls">
            <span>Burst: ${state.burst ? "On" : "Off"}</span>
            <span>Resolution: 1600x1200</span>
          </div>
        </div>
      `;
    }
  };
}

function createGalleryApp() {
  const state = {
    selected: 0,
    detailId: null
  };

  function photos(api) {
    return api.getData().media.photos;
  }

  function ensureSelection(api) {
    state.selected = clamp(state.selected, 0, Math.max(photos(api).length - 1, 0));
  }

  function currentPhoto(api) {
    if (state.detailId) {
      return photos(api).find((item) => item.id === state.detailId) || null;
    }

    ensureSelection(api);
    return photos(api)[state.selected] || null;
  }

  return {
    getSoftkeys() {
      return {
        left: "More",
        center: state.detailId ? "Info" : "Open",
        right: "Back"
      };
    },

    getMenuItems(api) {
      const selected = currentPhoto(api);
      const items = [
        {
          label: "Start slideshow",
          action: () => {
            if (!photos(api).length) {
              api.toast("No photos available.");
              return;
            }
            state.selected = (state.selected + 1) % photos(api).length;
            api.rerender();
          }
        }
      ];

      if (selected) {
        items.push({
          label: `Delete ${selected.title}`,
          action: () => {
            api.updateData((data) => {
              const idx = data.media.photos.findIndex((item) => item.id === selected.id);
              if (idx >= 0) {
                data.media.photos.splice(idx, 1);
              }
            });
            state.detailId = null;
            state.selected = Math.max(0, state.selected - 1);
            api.rerender();
          }
        });
      }

      return items;
    },

    onWheel(direction, api) {
      if (state.detailId) {
        return false;
      }

      const list = photos(api);
      const next = clamp(state.selected + direction, 0, Math.max(list.length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      if (state.detailId) {
        const photo = currentPhoto(api);
        if (photo) {
          api.toast(`${photo.title} captured ${formatDateTime(photo.createdAt)}`);
          return true;
        }
        return false;
      }

      const photo = photos(api)[state.selected];
      if (!photo) {
        return false;
      }

      state.detailId = photo.id;
      api.rerender();
      return true;
    },

    onBack(api) {
      if (!state.detailId) {
        return false;
      }

      state.detailId = null;
      api.rerender();
      return true;
    },

    render(container, api) {
      const list = photos(api);
      ensureSelection(api);

      let body = "";

      if (state.detailId) {
        const photo = currentPhoto(api);
        if (!photo) {
          state.detailId = null;
        } else {
          body = `
            <div class="gallery-detail">
              <div class="gallery-image-placeholder">${escapeHtml(photo.title.slice(0, 2))}</div>
              <div class="gallery-title">${escapeHtml(photo.title)}</div>
              <div class="gallery-meta">${escapeHtml(formatDateTime(photo.createdAt))}</div>
              <div class="gallery-meta">Source: ${escapeHtml(photo.source)}</div>
            </div>
          `;
        }
      }

      if (!body) {
        const rows = list
          .map(
            (photo, index) => `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-photo-index="${index}">
                <div>
                  <div class="row-title">${escapeHtml(photo.title)}</div>
                  <div class="row-subtitle">${escapeHtml(formatDate(photo.createdAt))}</div>
                </div>
              </li>`
          )
          .join("");

        body = `<ul class="uiq-list">${rows || '<li class="uiq-empty">Gallery is empty.</li>'}</ul>`;
      }

      container.innerHTML = `
        <div class="app-titlebar">Gallery</div>
        ${body}
      `;

      container.querySelectorAll("[data-photo-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.photoIndex);
          api.rerender();
        });
      });
    }
  };
}

function createFmRadioApp() {
  const state = {
    selected: 0,
    playing: true,
    currentStationId: null
  };

  function stations(api) {
    return api.getData().media.radioStations;
  }

  return {
    getSoftkeys() {
      return { left: "More", center: state.playing ? "Pause" : "Play", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: state.playing ? "Mute" : "Unmute",
          action: () => {
            state.playing = !state.playing;
            api.rerender();
          }
        },
        {
          label: "Auto scan",
          action: () => {
            const list = stations(api);
            if (!list.length) {
              return;
            }
            state.selected = Math.floor(Math.random() * list.length);
            state.currentStationId = list[state.selected].id;
            state.playing = true;
            api.toast(`Locked on ${list[state.selected].name}`);
            api.rerender();
          }
        }
      ];
    },

    onWheel(direction, api) {
      const list = stations(api);
      const next = clamp(state.selected + direction, 0, Math.max(list.length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      const list = stations(api);
      const station = list[state.selected];
      if (!station) {
        return false;
      }

      if (state.currentStationId === station.id) {
        state.playing = !state.playing;
      } else {
        state.currentStationId = station.id;
        state.playing = true;
      }

      api.rerender();
      return true;
    },

    render(container, api) {
      const list = stations(api);
      state.selected = clamp(state.selected, 0, Math.max(list.length - 1, 0));

      const current = list.find((item) => item.id === state.currentStationId) || list[state.selected] || null;

      const rows = list
        .map(
          (station, index) => `
            <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-station-index="${index}">
              <div>
                <div class="row-title">${escapeHtml(station.name)}</div>
                <div class="row-subtitle">${escapeHtml(station.frequency)} MHz</div>
              </div>
              <div class="row-meta">${state.currentStationId === station.id && state.playing ? "Live" : ""}</div>
            </li>`
        )
        .join("");

      container.innerHTML = `
        <div class="app-titlebar">FM Radio</div>
        <div class="radio-current">${escapeHtml(current ? `${current.name} - ${current.frequency} MHz` : "No station")}</div>
        <ul class="uiq-list">${rows || '<li class="uiq-empty">No stations saved.</li>'}</ul>
      `;

      container.querySelectorAll("[data-station-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.stationIndex);
          api.rerender();
        });
      });
    }
  };
}

function createSettingsApp() {
  const rows = [
    { key: "profile", label: "Profile", type: "enum", options: ["General", "Silent"] },
    { key: "flightMode", label: "Flight mode", type: "bool" },
    { key: "wlan", label: "WLAN", type: "bool" },
    { key: "bluetooth", label: "Bluetooth", type: "bool" },
    { key: "keyTone", label: "Key tones", type: "bool" },
    { key: "theme", label: "Theme", type: "enum", options: ["blue", "graphite"] }
  ];

  const state = {
    selected: 0
  };

  function cycleSetting(api, row) {
    api.updateSettings((settings) => {
      if (row.type === "bool") {
        settings[row.key] = !settings[row.key];
      } else {
        const options = row.options || [];
        const currentIndex = Math.max(0, options.indexOf(settings[row.key]));
        settings[row.key] = options[(currentIndex + 1) % options.length] || settings[row.key];
      }
    });
  }

  return {
    getSoftkeys() {
      return { left: "More", center: "Toggle", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: "Reset defaults",
          action: () => {
            api.updateSettings((settings) => {
              settings.profile = "General";
              settings.flightMode = false;
              settings.wlan = true;
              settings.bluetooth = false;
              settings.keyTone = true;
              settings.theme = "blue";
            });
            api.rerender();
          }
        },
        {
          label: "Device status",
          action: () => {
            const status = api.getDeviceStatus();
            api.toast(`Battery ${status.batteryPercent}% - Memory free ${status.memoryFree}%`);
          }
        }
      ];
    },

    onWheel(direction, api) {
      const next = clamp(state.selected + direction, 0, rows.length - 1);
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      const row = rows[state.selected];
      if (!row) {
        return false;
      }

      cycleSetting(api, row);
      api.rerender();
      return true;
    },

    render(container, api) {
      const settings = api.getData().settings;

      const list = rows
        .map((row, index) => {
          const value = settings[row.key];
          const label = row.type === "bool" ? (value ? "On" : "Off") : String(value);

          return `
            <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-setting-index="${index}">
              <div class="row-title">${escapeHtml(row.label)}</div>
              <div class="toggle-pill ${row.type === "bool" ? (value ? "on" : "off") : "enum"}">${escapeHtml(label)}</div>
            </li>`;
        })
        .join("");

      container.innerHTML = `
        <div class="app-titlebar">Control Panel</div>
        <ul class="uiq-list">${list}</ul>
      `;

      container.querySelectorAll("[data-setting-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.settingIndex);
          api.rerender();
        });
      });
    }
  };
}

function createCalculatorApp() {
  const state = {
    expression: "",
    result: "",
    historySelection: 0
  };

  const keypadRows = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"]
  ];

  function evaluate(api) {
    if (!state.expression.trim()) {
      return false;
    }

    const clean = state.expression.replace(/[^0-9+\-*/(). ]/g, "");
    try {
      const value = Function(`"use strict"; return (${clean});`)();
      if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
        throw new Error("Invalid");
      }

      state.result = String(value);

      api.updateData((data) => {
        data.notes.unshift({
          id: nextId("calc"),
          title: `Calc ${clean}`,
          body: `${clean} = ${state.result}`,
          updatedAt: Date.now()
        });
        data.notes = data.notes.slice(0, 25);
      });

      return true;
    } catch {
      state.result = "Error";
      return false;
    }
  }

  function append(value) {
    if (value === "=") {
      return;
    }

    if (state.expression.length > 40) {
      return;
    }

    state.expression += value;
  }

  return {
    getSoftkeys() {
      return { left: "More", center: "Eval", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: "Clear",
          action: () => {
            state.expression = "";
            state.result = "";
            api.rerender();
          }
        },
        {
          label: "Backspace",
          action: () => {
            state.expression = state.expression.slice(0, -1);
            api.rerender();
          }
        },
        {
          label: "Use previous result",
          action: () => {
            if (state.result && state.result !== "Error") {
              state.expression += state.result;
              api.rerender();
            }
          }
        }
      ];
    },

    onCenter(api) {
      const ok = evaluate(api);
      api.rerender();
      return ok;
    },

    onKey(key, api) {
      const allowed = "0123456789+-*/().";
      if (allowed.includes(key)) {
        append(key);
        api.rerender();
        return true;
      }

      if (key === "Enter") {
        evaluate(api);
        api.rerender();
        return true;
      }

      if (key === "Backspace") {
        state.expression = state.expression.slice(0, -1);
        api.rerender();
        return true;
      }

      return false;
    },

    render(container, api) {
      const keypad = keypadRows
        .map(
          (row) => `
            <div class="calc-row">
              ${row
                .map(
                  (key) =>
                    `<button class="calc-key" data-calc-key="${key}" type="button">${key}</button>`
                )
                .join("")}
            </div>`
        )
        .join("");

      container.innerHTML = `
        <div class="app-titlebar">Calculator</div>
        <div class="calc-display">${escapeHtml(state.expression || "0")}</div>
        <div class="calc-result">${escapeHtml(state.result || "")}</div>
        <div class="calc-pad">${keypad}</div>
      `;

      container.querySelectorAll("[data-calc-key]").forEach((element) => {
        element.addEventListener("click", () => {
          const key = element.dataset.calcKey;
          if (key === "=") {
            evaluate(api);
          } else {
            append(key);
          }
          api.rerender();
        });
      });
    }
  };
}

function createClockApp() {
  const state = {
    tab: "clock",
    selected: 0,
    tickTimer: null
  };

  function alarms(api) {
    return api.getData().clock.alarms;
  }

  function ensureSelection(api) {
    state.selected = clamp(state.selected, 0, Math.max(alarms(api).length - 1, 0));
  }

  return {
    onActivate(api) {
      if (state.tickTimer) {
        return;
      }

      state.tickTimer = setInterval(() => {
        if (state.tab === "clock") {
          api.rerender();
        }
      }, 1000);
    },

    onPause() {
      if (!state.tickTimer) {
        return;
      }
      clearInterval(state.tickTimer);
      state.tickTimer = null;
    },

    onClose() {
      if (!state.tickTimer) {
        return;
      }
      clearInterval(state.tickTimer);
      state.tickTimer = null;
    },

    getSoftkeys() {
      return { left: "More", center: state.tab === "clock" ? "Info" : "Toggle", right: "Back" };
    },

    getMenuItems(api) {
      const items = [
        {
          label: state.tab === "clock" ? "Show alarms" : "Show clock",
          action: () => {
            state.tab = state.tab === "clock" ? "alarms" : "clock";
            api.rerender();
          }
        },
        {
          label: "Add alarm (+1h)",
          action: () => {
            const now = new Date();
            now.setHours(now.getHours() + 1);
            api.updateData((data) => {
              data.clock.alarms.push({
                id: nextId("alarm"),
                label: "New alarm",
                time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
                enabled: true
              });
            });
            api.rerender();
          }
        }
      ];

      if (state.tab === "alarms") {
        const selected = alarms(api)[state.selected];
        if (selected) {
          items.push({
            label: `Delete ${selected.time}`,
            action: () => {
              api.updateData((data) => {
                const idx = data.clock.alarms.findIndex((item) => item.id === selected.id);
                if (idx >= 0) {
                  data.clock.alarms.splice(idx, 1);
                }
              });
              state.selected = Math.max(0, state.selected - 1);
              api.rerender();
            }
          });
        }
      }

      return items;
    },

    onWheel(direction, api) {
      if (state.tab !== "alarms") {
        return false;
      }

      ensureSelection(api);
      const next = clamp(state.selected + direction, 0, Math.max(alarms(api).length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onKey(key, api) {
      if (key !== "ArrowLeft" && key !== "ArrowRight") {
        return false;
      }

      state.tab = state.tab === "clock" ? "alarms" : "clock";
      api.rerender();
      return true;
    },

    onCenter(api) {
      if (state.tab === "clock") {
        api.toast(`Local time ${formatDateTime(Date.now())}`);
        return true;
      }

      const selected = alarms(api)[state.selected];
      if (!selected) {
        return false;
      }

      api.updateData((data) => {
        const target = data.clock.alarms.find((entry) => entry.id === selected.id);
        if (target) {
          target.enabled = !target.enabled;
        }
      });

      api.rerender();
      return true;
    },

    render(container, api) {
      const now = new Date();
      const current = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

      let body = "";

      if (state.tab === "clock") {
        body = `
          <div class="clock-face">
            <div class="clock-time">${escapeHtml(current)}</div>
            <div class="clock-date">${escapeHtml(formatDate(Date.now()))}</div>
            <div class="clock-zone">Timezone: ${escapeHtml(Intl.DateTimeFormat().resolvedOptions().timeZone || "Local")}</div>
          </div>
        `;
      } else {
        ensureSelection(api);
        const rows = alarms(api)
          .map(
            (alarm, index) => `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-alarm-index="${index}">
                <div>
                  <div class="row-title">${escapeHtml(alarm.label)}</div>
                  <div class="row-subtitle">${escapeHtml(alarm.time)}</div>
                </div>
                <div class="toggle-pill ${alarm.enabled ? "on" : "off"}">${alarm.enabled ? "On" : "Off"}</div>
              </li>`
          )
          .join("");

        body = `<ul class="uiq-list">${rows || '<li class="uiq-empty">No alarms configured.</li>'}</ul>`;
      }

      container.innerHTML = `
        <div class="app-titlebar">Clock</div>
        <nav class="tab-bar">
          <button class="tab-btn ${state.tab === "clock" ? "active" : ""}" data-clock-tab="clock" type="button">Clock</button>
          <button class="tab-btn ${state.tab === "alarms" ? "active" : ""}" data-clock-tab="alarms" type="button">Alarms</button>
        </nav>
        ${body}
      `;

      container.querySelectorAll("[data-clock-tab]").forEach((element) => {
        element.addEventListener("click", () => {
          state.tab = element.dataset.clockTab;
          api.rerender();
        });
      });

      container.querySelectorAll("[data-alarm-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.alarmIndex);
          api.rerender();
        });
      });
    }
  };
}

function createNotesApp() {
  const state = {
    selected: 0,
    detailId: null
  };

  function notes(api) {
    return [...api.getData().notes].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function ensureSelection(api) {
    state.selected = clamp(state.selected, 0, Math.max(notes(api).length - 1, 0));
  }

  function currentNote(api) {
    if (state.detailId) {
      return notes(api).find((item) => item.id === state.detailId) || null;
    }

    ensureSelection(api);
    return notes(api)[state.selected] || null;
  }

  return {
    getSoftkeys() {
      return {
        left: "More",
        center: state.detailId ? "Done" : "Open",
        right: "Back"
      };
    },

    getMenuItems(api) {
      const selected = currentNote(api);
      const items = [
        {
          label: "New note",
          action: () => {
            const count = api.getData().notes.length + 1;
            api.updateData((data) => {
              data.notes.unshift({
                id: nextId("note"),
                title: `Quick note ${count}`,
                body: `Created at ${new Date().toLocaleString()}`,
                updatedAt: Date.now()
              });
            });
            state.selected = 0;
            api.rerender();
          }
        }
      ];

      if (selected) {
        items.push({
          label: "Append timestamp",
          action: () => {
            api.updateData((data) => {
              const target = data.notes.find((note) => note.id === selected.id);
              if (target) {
                target.body += `\nUpdated at ${new Date().toLocaleString()}`;
                target.updatedAt = Date.now();
              }
            });
            api.rerender();
          }
        });

        items.push({
          label: `Delete ${selected.title}`,
          action: () => {
            api.updateData((data) => {
              const idx = data.notes.findIndex((note) => note.id === selected.id);
              if (idx >= 0) {
                data.notes.splice(idx, 1);
              }
            });
            state.detailId = null;
            state.selected = Math.max(0, state.selected - 1);
            api.rerender();
          }
        });
      }

      return items;
    },

    onWheel(direction, api) {
      if (state.detailId) {
        return false;
      }

      const list = notes(api);
      const next = clamp(state.selected + direction, 0, Math.max(list.length - 1, 0));
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      if (state.detailId) {
        state.detailId = null;
        api.rerender();
        return true;
      }

      const selected = notes(api)[state.selected];
      if (!selected) {
        return false;
      }

      state.detailId = selected.id;
      api.rerender();
      return true;
    },

    onBack(api) {
      if (!state.detailId) {
        return false;
      }

      state.detailId = null;
      api.rerender();
      return true;
    },

    render(container, api) {
      const list = notes(api);
      ensureSelection(api);

      let body = "";

      if (state.detailId) {
        const note = currentNote(api);
        if (!note) {
          state.detailId = null;
        } else {
          body = `
            <div class="note-detail">
              <div class="note-title">${escapeHtml(note.title)}</div>
              <pre class="note-body">${escapeHtml(note.body)}</pre>
              <div class="note-updated">${escapeHtml(formatDateTime(note.updatedAt))}</div>
            </div>
          `;
        }
      }

      if (!body) {
        const rows = list
          .map(
            (note, index) => `
              <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-note-index="${index}">
                <div>
                  <div class="row-title">${escapeHtml(note.title)}</div>
                  <div class="row-subtitle">${escapeHtml(note.body.split("\n")[0] || "")}</div>
                </div>
                <div class="row-meta">${escapeHtml(formatRelative(note.updatedAt))}</div>
              </li>`
          )
          .join("");

        body = `<ul class="uiq-list">${rows || '<li class="uiq-empty">No notes yet.</li>'}</ul>`;
      }

      container.innerHTML = `
        <div class="app-titlebar">Quicknote</div>
        ${body}
      `;

      container.querySelectorAll("[data-note-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.noteIndex);
          api.rerender();
        });
      });
    }
  };
}

function createMapsApp() {
  const routes = [
    { from: "Current position", to: "Central Station", eta: "12 min", mode: "car" },
    { from: "Current position", to: "Old Town", eta: "18 min", mode: "walk" },
    { from: "Current position", to: "Airport", eta: "27 min", mode: "bus" },
    { from: "Current position", to: "Office", eta: "9 min", mode: "car" }
  ];

  const state = {
    selected: 0
  };

  return {
    getSoftkeys() {
      return { left: "More", center: "Route", right: "Back" };
    },

    getMenuItems(api) {
      return [
        {
          label: "Recalculate route",
          action: () => {
            routes[state.selected].eta = `${8 + Math.floor(Math.random() * 20)} min`;
            api.rerender();
          }
        },
        {
          label: "Save destination",
          action: () => {
            const route = routes[state.selected];
            api.notify({
              title: "Maps",
              body: `${route.to} saved in favorites`,
              appId: "maps"
            });
          }
        }
      ];
    },

    onWheel(direction, api) {
      const next = clamp(state.selected + direction, 0, routes.length - 1);
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      const route = routes[state.selected];
      if (!route) {
        return false;
      }

      api.toast(`Route to ${route.to}: ${route.eta} (${route.mode})`);
      return true;
    },

    render(container, api) {
      const rows = routes
        .map(
          (route, index) => `
            <li class="uiq-row ${index === state.selected ? "selected" : ""}" data-route-index="${index}">
              <div>
                <div class="row-title">${escapeHtml(route.to)}</div>
                <div class="row-subtitle">${escapeHtml(route.mode.toUpperCase())}</div>
              </div>
              <div class="row-meta">${escapeHtml(route.eta)}</div>
            </li>`
        )
        .join("");

      container.innerHTML = `
        <div class="app-titlebar">Navigator</div>
        <div class="map-placeholder">Map canvas simulation</div>
        <ul class="uiq-list">${rows}</ul>
      `;

      container.querySelectorAll("[data-route-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.routeIndex);
          api.rerender();
        });
      });
    }
  };
}

function createPlaceholderApp(options) {
  const state = { selected: 0 };
  const actions = options.actions || [];

  return {
    getSoftkeys() {
      return {
        left: "More",
        center: options.centerLabel || "Open",
        right: "Back"
      };
    },

    getMenuItems(api) {
      const items = [
        {
          label: "About",
          action: () => api.toast(`${options.title} module loaded.`)
        }
      ];

      if (actions.length) {
        items.push({
          label: "Run selected action",
          action: () => {
            const action = actions[state.selected] || "Action";
            if (options.onAction) {
              options.onAction(action, api);
            } else {
              api.toast(`${options.title}: ${action}`);
            }
          }
        });
      }

      return items;
    },

    onWheel(direction, api) {
      if (!actions.length) {
        return false;
      }

      const next = clamp(state.selected + direction, 0, actions.length - 1);
      if (next !== state.selected) {
        state.selected = next;
        api.rerender();
      }
      return true;
    },

    onCenter(api) {
      if (!actions.length) {
        return true;
      }

      const action = actions[state.selected];
      if (options.onAction) {
        options.onAction(action, api);
      } else {
        api.toast(`${options.title}: ${action}`);
      }
      return true;
    },

    render(container, api) {
      const rows = actions
        .map(
          (label, index) =>
            `<li class="uiq-row ${index === state.selected ? "selected" : ""}" data-placeholder-index="${index}">${escapeHtml(label)}</li>`
        )
        .join("");

      container.innerHTML = `
        <div class="app-titlebar">${escapeHtml(options.title)}</div>
        <div class="placeholder-card">
          <div class="placeholder-title">${escapeHtml(options.subtitle || "Demo app")}</div>
          <div class="placeholder-text">${escapeHtml(options.description || "Visual placeholder.")}</div>
        </div>
        <ul class="uiq-list">${rows || '<li class="uiq-empty">No actions available.</li>'}</ul>
      `;

      container.querySelectorAll("[data-placeholder-index]").forEach((element) => {
        element.addEventListener("click", () => {
          state.selected = Number(element.dataset.placeholderIndex);
          api.rerender();
        });
      });
    }
  };
}

export const APP_DEFINITIONS = [
  {
    manifest: { id: "phone", name: "Phone", icon: appIcon("phone.png"), page: "Communications", order: 1 },
    createApp: createPhoneApp
  },
  {
    manifest: { id: "messages", name: "Messages", icon: appIcon("mms.png"), page: "Communications", order: 2 },
    createApp: createMessagesApp
  },
  {
    manifest: { id: "contacts", name: "Contacts", icon: appIcon("contacts.png"), page: "Communications", order: 3 },
    createApp: createContactsApp
  },
  {
    manifest: { id: "browser", name: "Browser", icon: appIcon("browser.png"), page: "Communications", order: 4 },
    createApp: createBrowserApp
  },
  {
    manifest: { id: "calendar", name: "Calendar", icon: appIcon("calendar.png"), page: "Organizer", order: 1 },
    createApp: createCalendarApp
  },
  {
    manifest: { id: "clock", name: "Clock", icon: appIcon("clock.png"), page: "Organizer", order: 2 },
    createApp: createClockApp
  },
  {
    manifest: { id: "notes", name: "Quicknote", icon: appIcon("quicknote.png"), page: "Organizer", order: 3 },
    createApp: createNotesApp
  },
  {
    manifest: { id: "maps", name: "Navigator", icon: appIcon("navigator.png"), page: "Organizer", order: 4 },
    createApp: createMapsApp
  },
  {
    manifest: { id: "camera", name: "Camera", icon: appIcon("camera.png"), page: "Media", order: 1 },
    createApp: createCameraApp
  },
  {
    manifest: { id: "gallery", name: "Gallery", icon: appIcon("gallery.png"), page: "Media", order: 2 },
    createApp: createGalleryApp
  },
  {
    manifest: { id: "music", name: "Music", icon: appIcon("music.png"), page: "Media", order: 3 },
    createApp: createMusicApp
  },
  {
    manifest: { id: "fmradio", name: "FM Radio", icon: appIcon("fm_radio.png"), page: "Media", order: 4 },
    createApp: createFmRadioApp
  },
  {
    manifest: { id: "files", name: "Files", icon: appIcon("files.png"), page: "Tools", order: 1 },
    createApp: createFilesApp
  },
  {
    manifest: { id: "settings", name: "Settings", icon: appIcon("settings.png"), page: "Tools", order: 2 },
    createApp: createSettingsApp
  },
  {
    manifest: { id: "calculator", name: "Calculator", icon: appIcon("calculator.png"), page: "Tools", order: 3 },
    createApp: createCalculatorApp
  },
  {
    manifest: { id: "python", name: "Python", icon: appIcon("python.png"), page: "Tools", order: 4 },
    createApp: () =>
      createPlaceholderApp({
        title: "Python",
        subtitle: "Script runner",
        description: "Run and manage small automation scripts.",
        centerLabel: "Run",
        actions: ["Run startup.py", "Open script list", "Enable autostart"]
      })
  }
];
