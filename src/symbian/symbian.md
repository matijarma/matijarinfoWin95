# Architectural Blueprint for a Full-Screen Symbian UIQ 3.0 Web OS Simulation

This document presents a complete technical blueprint for implementing a vanilla JavaScript/HTML/CSS simulation of the UIQ 3.0 user interface (as used on devices like the Sony Ericsson P1i) in a responsive full-screen web app. It strictly emulates UIQ 3.0’s visual and interaction model (excluding any S60 patterns) using ES6 modules, CSS Grid/Flexbox, and native DOM APIs. Each section drills down into the original Symbian architecture or UIQ framework concept and shows how to map it into a modern web-based single-page application. Extensive code examples illustrate the recommended JS and CSS structures, and linked references supply authentic Symbian-era details (window server behavior, UIQ view framework, etc.) to ground the design.

## 1. The UIQ 3.0 Architectural Paradigm Translated to the DOM

Symbian OS was built on a microkernel plus servers architecture. The **Window Server (WServ)** is the central graphics server: it **owns the screen as a shared resource and the single event queue** for all input (key, pen/touch)【71†L8471-L8479】.  As a system server started at boot by the System Starter, it remains running until shutdown【71†L8480-L8483】.  The Window Server serializes access to the display for all applications by assigning each app its own “window” (RWindow) or window group. All drawing and user-event routing goes through this server. For example, it buffers windowing commands (to minimize cross-process calls) and dispatches touch/keyboard events to the focused control【25†L8534-L8538】【71†L8471-L8479】.  In practice on UIQ, each application has a session with WServ (via RWsSession, RWindow, etc.), and the UI framework (UIQ’s “Qik” framework) builds on that.

UIQ 3.0 provided a higher-level **application framework (Qik)** on top of Symbian’s base UI services.  UIQ’s design centers on *views* and *softkey* commands. Every screen or “view” in an app is a class derived from `CQikViewBase`, and its UI layout (commands, controls) is configured by resource structures like `QIK_VIEW_CONFIGURATION` and `QIK_VIEW_PAGE`【69†L555-L563】.  Each view is identified by a unique `TVwsViewId` (application UID + view number)【69†L590-L599】.  User commands (menu items, softkeys, toolbar actions) are abstractly defined in a `QIK_COMMAND_LIST` and delivered to views by calling their `HandleCommandL(CQikCommand&)` method【69†L596-L604】. Notably, UIQ apps *do not close* explicitly: when the user exits a view or presses Back, the view is deactivated but the application remains running in the background【69†L630-L633】.

**Translating to a Vanilla JS SPA:** In our web simulation, we similarly treat the OS as a core *manager* with multiple app modules plugged into it. The browser’s DOM and event loop take the place of the Window Server. We simulate application windows/views by mounting and unmounting DOM nodes. Each UIQ app can be implemented as an ES6 module exposing a “view” or set of views (HTML fragments) and initialization logic.  A central **OS kernel module** maintains an *app registry* (mapping app IDs to module constructors) and a state machine for the current OS state. On “boot” (page load), the OS kernel loads a splash or standby screen. When the user launches an app, the OS clears the main viewport DOM and invokes the app’s `render()` or initialization method to attach its UI to the DOM. When the user “closes” the app, the kernel returns to the home view (while keeping the app’s state in memory, mimicking UIQ’s persistence【69†L630-L633】).

**Event Bus:** To handle system-wide messaging (intents, notifications, inter-app signals), we define a simple pub/sub event bus in JS.  For example:

```js
class EventBus {
  constructor() { this.listeners = {}; }
  on(eventType, handler) {
    (this.listeners[eventType] ||= []).push(handler);
  }
  off(eventType, handler) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(h => h!==handler);
  }
  emit(eventType, payload) {
    (this.listeners[eventType] || []).slice().forEach(h => h(payload));
  }
}
```

Each module (OS or app) can subscribe to named events (e.g. `'AppLaunched'`, `'TaskSwitch'`, `'IncomingCall'`) and broadcast messages via `bus.emit(...)`. This decouples apps from each other and from the core: for example, the OS can broadcast a “shutdown” intent, or one app can emit a custom “file-selected” event that another listens to. This mimics how Symbian OS allowed inter-application communication via message passing or commands.

**Lifecycle State Machine:** We explicitly model OS states: for example `BOOT → STANDBY (Idle/Home) → APP_RUNNING → TASK_SWITCHING`. A simple state-machine controller might look like:

```js
const OSState = { BOOT: 'boot', IDLE: 'idle', APP: 'app', SWITCH: 'switch' };
class OS {
  constructor() { this.state = OSState.BOOT; }
  transition(newState) {
    // handle leaving current state and entering new state
    console.log(`OS: ${this.state} -> ${newState}`);
    this.state = newState;
  }
  boot() {
    this.transition(OSState.BOOT);
    this.showSplashScreen();
    // after splash:
    this.transition(OSState.IDLE);
    this.showHomeScreen();
  }
  launchApp(appId) {
    this.transition(OSState.APP);
    const app = this.startApp(appId);
    this.currentApp = app;
    app.activate();
  }
  goHome() {
    if (this.currentApp) this.currentApp.deactivate();
    this.transition(OSState.IDLE);
    this.showHomeScreen();
  }
  // etc.
}
```

This outlines how the page load triggers `boot()`, which after an intro switches to the idle/home view. Launching an app switches state to `APP`, and closing an app returns to `IDLE`. We can also implement a Task Manager state (`SWITCH`) to list running apps. The OS kernel code links to the EventBus: e.g. on `'launchApp'` event it calls `OS.launchApp(id)`, etc. In sum, we emulate WSERV by having a single-page central controller that serializes which DOM is visible and dispatches input events, and we emulate Qik’s view framework by modularizing app UIs and using command handlers (e.g. handling softkey/button presses in each view component)【69†L555-L563】【69†L596-L604】.

## 2. Fluid Full-Screen Geometry (CSS Grid Architecture)

We use CSS Grid/Flexbox to create a three-region layout spanning the full viewport. For example:

```css
:root {
  --status-bar-height: 24px;
  --cba-height: 36px;
}
html, body {
  margin: 0; padding: 0;
  width: 100vw; height: 100vh;
}
body {
  display: grid;
  grid-template-rows: var(--status-bar-height) 1fr var(--cba-height);
  grid-template-areas:
    "status-bar"
    "main"
    "cba";
  background: var(--color-uiq-white);
}
.status-bar { grid-area: status-bar; }
.main-content { grid-area: main; overflow: auto; }
.cba { grid-area: cba; }
```

- **Top Region (Status Bar):** The status bar is a fixed-height top strip. We can use a horizontal grid or flex container inside it. For example:

  ```html
  <div class="status-bar">
    <div class="status-icons-left">
      <!-- e.g. signal, connection icons -->
      <img src="signal.png" alt="signal"/><img src="wifi.png" alt="Wi-Fi"/>
    </div>
    <div class="status-time">12:34</div>
    <div class="status-icons-right">
      <!-- e.g. battery, notifications icons -->
      <img src="bluetooth.png" alt="BT"/><img src="battery.png" alt="Battery"/>
    </div>
  </div>
  ```

  ```css
  .status-bar {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: 0 8px;
    background: var(--color-uiq-blue-dark);
    color: var(--color-uiq-white);
    font: 12px var(--font-uiq);
  }
  .status-icons-left, .status-icons-right {
    display: flex; gap: 8px;
  }
  .status-time {
    text-align: center;
    font-weight: bold;
  }
  ```

  Here the left cell holds signal/Bluetooth icons, the center cell holds the time (which will scale or center horizontally), and the right cell holds battery/wireless icons.  On a wide desktop viewport, the center region expands so that the clock stays centered and the icon groups stay flush to edges (we can use `justify-self:start` or `end` if needed). The exact order is informed by UIQ status bars (e.g. signal bars on left, battery on right)【66†L328-L335】. Use scalable vector or SVG icons to keep them crisp.

- **Middle Region (App Viewport):** This is the dynamic content area (`.main-content`).  When no app is active (state = STANDBY), it shows the home screen UI; when an app is launched, its UI is rendered here. In DOM terms, we might do:

  ```js
  function showView(htmlElement) {
    const main = document.querySelector('.main-content');
    main.innerHTML = '';
    main.appendChild(htmlElement);
  }
  ```

  Each app can export a function like `createView()` that returns a DOM node tree (or template) to insert.  Mounting and unmounting is then simply clearing this region and appending the new view element. We ensure overflow-y: auto so that large lists scroll. The CSS ensures this region stretches to fill all extra space.

- **Bottom Region (Control Button Area, CBA):** UIQ 3.0’s CBA typically has *three* softkey areas: left ("More"), center ("Context"), and right ("Done"/"Back"). We simulate this with a flex or grid container:

  ```html
  <div class="cba">
    <button id="btn-more" class="cba-btn">More</button>
    <button id="btn-context" class="cba-btn">Option</button>
    <button id="btn-back" class="cba-btn">Back</button>
  </div>
  ```

  ```css
  .cba {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-uiq-blue);
    padding: 0 12px;
    font: 14px var(--font-uiq);
  }
  .cba-btn {
    background: none;
    border: none;
    color: var(--color-uiq-white);
    padding: 6px 12px;
  }
  ```

  On wide screens, this layout naturally places one button at each end and one centered.  Alternatively, a three-column grid (each 1fr) could be used with `justify-self` for precise centering. The button labels correspond to UIQ conventions (for instance, in menus “More” opens the options menu, “Back” closes or goes up a level).  These areas should respond to taps or clicks. CSS `:active` or custom tap-highlight styles should show a subtle overlay (e.g. light alpha background) for touch feedback.

Throughout the layout, **responsive scaling** is handled by the grid: the status bar and CBA have fixed heights but stretch horizontally; the center time and icon groups use flexible space. Thus on any viewport width, the UIQ-style chrome remains readable and usable.

## 3. Sony Ericsson P1i Visual Language & CSS Token System

To replicate the P1i (UIQ 3.0) look, we define a set of CSS design tokens (`:root` variables) capturing its color palette and typography. For example:

```css
:root {
  /* P1i UIQ 3.0 color tokens */
  --color-uiq-blue-dark: #003366;    /* deep metallic blue (e.g. status bar gradient top) */
  --color-uiq-blue:      #0055a5;    /* primary UI blue */
  --color-uiq-cyan:      #33B6E8;    /* bright cyan highlight for selection */
  --color-uiq-gray-dark: #444444;    /* dark gray for text/icons on white */
  --color-uiq-gray-light:#CCCCCC;    /* light separator lines and backgrounds */
  --color-uiq-white:     #FFFFFF;    /* crisp white for list backgrounds */
  --color-uiq-black:     #000000;    /* black, if needed */
  /* Font stack approximating UIQ's sans-serif */
  --font-uiq:            "Helvetica Neue", Arial, sans-serif;
}
```

These values are chosen to mimic classic UIQ themes: deep blues for title bars, cyan for focus rings or selected row, neutral grays for text and borders, and pure white for list/item backgrounds.  (Exact hex codes can be refined by sampling official UI graphics if available; the above are reasonable guesses.)

### Typography

Use a clean sans-serif stack. We set `font-family: var(--font-uiq)` on body or relevant elements. UIQ text was small and crisp; on modern screens, we can use ~14px body text for readability, scaled as needed. For example:

```css
body, button, input {
  font-family: var(--font-uiq);
  color: var(--color-uiq-gray-dark);
  font-size: 14px;
}
```

### UI Elements

- **Tab Bars (Top-Anchored):** UIQ apps often have a horizontal tab bar beneath the status bar. We simulate this with a flex container of buttons/icons. For example:

  ```html
  <nav class="tab-bar">
    <button class="tab-btn active">Inbox</button>
    <button class="tab-btn">Outbox</button>
    <button class="tab-btn">Sent</button>
  </nav>
  ```

  ```css
  .tab-bar {
    display: flex;
    background: var(--color-uiq-blue-dark);
  }
  .tab-btn {
    flex: 1;
    padding: 8px;
    border: none;
    background: none;
    color: var(--color-uiq-white);
  }
  .tab-btn.active {
    border-bottom: 2px solid var(--color-uiq-cyan); /* highlight */
  }
  ```

- **List View Separators:** Lists in UIQ typically have subtle dividers. We can use bottom borders on `<li>` elements:

  ```css
  .uiq-list li {
    border-bottom: 1px solid var(--color-uiq-gray-light);
    padding: 8px;
    list-style: none;
  }
  .uiq-list li:last-child {
    border-bottom: none;
  }
  ```

- **Input Fields:**  For form fields, use a flat style with slight inset or border. Example:

  ```css
  input[type="text"], select, textarea {
    background: var(--color-uiq-white);
    border: 1px solid var(--color-uiq-gray-light);
    border-radius: 3px;
    padding: 4px 6px;
    font: 14px var(--font-uiq);
    color: var(--color-uiq-gray-dark);
  }
  input:focus {
    border-color: var(--color-uiq-cyan);
    outline: none;
  }
  ```

- **Header/Footer Gradients:** Subtle gradients on bars add polish. For instance:

  ```css
  .status-bar {
    background: linear-gradient(to bottom, var(--color-uiq-blue), var(--color-uiq-blue-dark));
  }
  .cba {
    background: linear-gradient(to top, var(--color-uiq-blue), var(--color-uiq-blue-dark));
  }
  ```

- **Tap-Highlight States:** To mimic touch feedback, override the default highlight or use `:active` styles. For example, on buttons:

  ```css
  button:active {
    background-color: rgba(255,255,255,0.2);
  }
  ```

This provides a faint white overlay on press (or we could use `filter: brightness(85%)` for a press effect). Each interactive element (list row, button, tab) should have such feedback to feel tactile on touchscreens.

Throughout, we ensure text is legible and controls are spaced enough for touch targets (roughly 44px or more in height where possible). The above tokens and styles capture the P1i’s visual signature: blue bars, white content areas, cyan accents, and clear sans-serif text.

## 4. Interaction Simulation (Touch & Jog-Dial)

On the P1i, navigation could be via touchscreen or the physical jog-dial. We must emulate both.

- **Jog-Dial (Wheel) Scrolling:** The P1i’s jog-dial is a scroll wheel that moves selection up/down in lists. In the browser, we can listen for `wheel` events (mouse wheel or trackpad) or up/down key events. For example:

  ```js
  document.addEventListener('wheel', (e) => {
    const list = document.querySelector('.uiq-list .focused');
    if (list) {
      if (e.deltaY > 0) {
        list.nextElementSibling?.click();
      } else if (e.deltaY < 0) {
        list.previousElementSibling?.click();
      }
      e.preventDefault();
    }
  });
  ```

  This sample assumes one list item has a `.focused` class. Scrolling the wheel triggers a click on the next/previous item, moving the focus. Alternatively, we can track an index and manually adjust `scrollTop`. On touch devices, we should also allow swipe gestures: using `touchstart`/`touchmove` to detect vertical swipes and translate those to scrolling or selection changes.

  In each list-view component, maintain a **selected index**. For instance:

  ```js
  class ListView {
    constructor(items) {
      this.items = items;
      this.selected = 0;
    }
    focusItem(index) {
      this.items[this.selected].classList.remove('focused');
      this.selected = index;
      this.items[this.selected].classList.add('focused');
    }
    selectNext() { 
      if (this.selected < this.items.length - 1) this.focusItem(this.selected + 1);
    }
    selectPrev() {
      if (this.selected > 0) this.focusItem(this.selected - 1);
    }
  }
  ```

  Then tie `wheel` events or key `ArrowUp`/`ArrowDown` to `selectNext()`/`selectPrev()`. This simulates the jog-dial rotating to move through list entries.

- **“More” Menu (Left CBA) Logic:** The left softkey “More” should pop up a context menu. We can implement this as a dynamic DOM overlay. For example:

  ```js
  document.getElementById('btn-more').onclick = () => {
    // Create menu container
    const menu = document.createElement('div');
    menu.className = 'uiq-popup-menu';
    menu.innerHTML = `
      <ul>
        <li onclick="handleOption('Settings')">Settings</li>
        <li onclick="handleOption('About')">About</li>
        <!-- more items -->
      </ul>
    `;
    document.body.appendChild(menu);
    // animate slide-up
    requestAnimationFrame(() => menu.classList.add('visible'));
  };
  ```

  With accompanying CSS:

  ```css
  .uiq-popup-menu {
    position: absolute;
    bottom: var(--cba-height);
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    background: var(--color-uiq-gray-light);
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    transition: transform 0.2s ease-out;
    /* ensure menu is centered and off-screen initially */
  }
  .uiq-popup-menu.visible {
    transform: translateX(-50%) translateY(0);
  }
  .uiq-popup-menu ul {
    margin: 0; padding: 0;
  }
  .uiq-popup-menu li {
    list-style: none;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-uiq-gray-dark);
  }
  .uiq-popup-menu li:last-child { border-bottom: none; }
  .uiq-popup-menu li:hover {
    background: var(--color-uiq-blue);
    color: var(--color-uiq-white);
  }
  ```

  This creates a pop-up panel that slides up from below the CBA, anchored in the bottom center. Menu items (`<li>`) can have nested submenus if needed (for deeper hierarchies, toggle new `<ul>` lists). We handle clicks by defining a `handleOption` JS function to act on the choice. This replicates UIQ’s style where “More” brings an options popup overlay.

- **Tab Navigation:** For apps with tabbed views, we’d have HTML like:

  ```html
  <div class="tab-bar">
    <button data-tab="view1" class="tab active">View 1</button>
    <button data-tab="view2" class="tab">View 2</button>
  </div>
  <div id="view1" class="tab-view">...content...</div>
  <div id="view2" class="tab-view" style="display:none;">...content...</div>
  ```

  And JS to switch:

  ```js
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-view').forEach(v => {
        v.style.display = (v.id === target) ? 'block' : 'none';
      });
    });
  });
  ```

  This creates a horizontal tab strip (under the status bar) where clicking a tab shows the corresponding content pane. The active tab is highlighted (using an `.active` class, with a CSS rule such as an underline in cyan). This mirrors UIQ’s use of horizontal tabs for multi-view apps (e.g. messaging folders). The DOM structure uses buttons with a `data-tab` attribute, and simple show/hide logic on the containers.

In all cases, interaction code and CSS mimic the feel of the original hardware: e.g., scrolling a list by dial or swipe, activating “More” or “Back” via bottom buttons, and switching tabs with a press. The examples above show the JS event handlers and CSS transitions needed to replicate UIQ 3.0’s behaviors in a modern browser environment.

## 5. App Registry and Sandboxing (Vanilla JS)

To manage multiple apps, we define a JSON **App Manifest** format. For instance:

```json
{
  "id": "com.example.clock",
  "name": "Clock",
  "version": "1.0.0",
  "icon": "clock.png",
  "entry": "clock-app.js",
  "views": ["MainClockView"],
  "permissions": ["filesystem", "notifications"]
}
```

Each app’s manifest (like a Symbian `.pkg`/`.rsc` specification) declares an internal ID, display name, icon, entry script, and what “views” or components it contains. Our OS kernel loads these manifests (perhaps from a predefined array or fetched JSON), and registers each app. For example:

```js
class AppManager {
  constructor() {
    this.apps = {}; // id -> app instance or metadata
  }
  registerApp(manifest, constructorFunc) {
    this.apps[manifest.id] = { manifest, constructorFunc, instance: null };
  }
  launchApp(id) {
    const appInfo = this.apps[id];
    if (!appInfo.instance) {
      appInfo.instance = new appInfo.constructorFunc();
      appInfo.instance.onCreate();
    }
    appInfo.instance.onActivate();
    return appInfo.instance;
  }
  closeApp(id) {
    const appInfo = this.apps[id];
    if (appInfo && appInfo.instance) {
      appInfo.instance.onPause();
      // Optionally keep instance for background state, mimicking persistence
    }
  }
}
```

Each app should manage its own DOM subtree and state. For instance, an app object might have methods like `onCreate()`, `onActivate()`, `onPause()`, and `onClose()`. The OS calls `onActivate()` when the app’s view should be shown (mounting its DOM), and `onPause()` or `onClose()` when the user navigates away. By default, apps stay instantiated in background (like UIQ) unless explicitly terminated via task manager.

The **Task Manager** (application switcher) can be implemented by keeping track of running app instances. A simple implementation is:

```js
class TaskManager {
  constructor(appManager) {
    this.appManager = appManager;
  }
  listTasks() {
    return Object.keys(this.appManager.apps).filter(id => {
      const app = this.appManager.apps[id];
      return app.instance !== null;
    });
  }
  switchTo(id) {
    if (this.appManager.apps[id]) {
      OS.closeCurrentApp(); // pseudo-code: deactivate current
      OS.launchApp(id);
    }
  }
}
```

Invoking the task manager UI might show icons/names of running apps, allowing the user to tap one to switch to it (invoking `TaskManager.switchTo(appId)`). Because each app instance persists (does not fully unload from memory), switching back to it should restore its last state seamlessly, reflecting Symbian’s multitasking model【69†L630-L633】.

## 6. Mock Filesystem and Persistence

Symbian UIQ phones had a `C:` drive (phone memory) and typically an `E:` or `D:` drive for memory cards. We simulate this with a JSON-based virtual filesystem stored in `localStorage` or `IndexedDB`. A simple structure might be:

```js
let fs = {
  "C:": {
    "Music": { "song.mp3": "BinaryData..." },
    "Documents": { "file.txt": "Hello world" }
  },
  "E:": {
    "Photos": {},
    "Videos": {}
  }
};
// Save to localStorage
localStorage.setItem('uiqFS', JSON.stringify(fs));
```

On startup, load or initialize:

```js
function loadFS() {
  const saved = localStorage.getItem('uiqFS');
  return saved ? JSON.parse(saved) : { "C:": {}, "E:": {} };
}
let fileSystem = loadFS();
```

**File Manager UI:** We can build a hierarchical browser that reads `fileSystem`. For example:

```js
function displayDirectory(path) {
  const parts = path.split('/').filter(p => p);
  let dir = fileSystem;
  parts.forEach(p => { dir = dir[p]; });
  const list = document.createElement('ul');
  list.className = 'uiq-list';
  for (const name in dir) {
    const item = document.createElement('li');
    item.textContent = name;
    if (typeof dir[name] === 'object') {
      // It's a directory
      item.onclick = () => displayDirectory(path + name + '/');
    } else {
      // It's a file
      item.onclick = () => openFile(path + name);
    }
    list.appendChild(item);
  }
  showView(list); // hypothetical function to render into main content
}
```

This function splits the path, navigates the `fileSystem` object to the correct directory, then creates a `<ul>` of its contents. Clicking a directory name calls `displayDirectory` recursively to drill down. This mimics UIQ’s File Manager: a list view showing directories/files, with the **C:** and **E:** drives as top-level entries.  Saving changes (creating files/folders) would update the `fileSystem` object and call `localStorage.setItem` again to persist.

By using `localStorage` (key-value, stringified JSON), the state persists across reloads. For more robustness, IndexedDB could be used for large data, but for UIQ-level simulation, JSON in localStorage is sufficient.

Throughout this design, we follow the principle that each subsystem (UI layout, event handling, app lifecycle, persistence) is implemented in vanilla JS/CSS, with no external libraries. The cited Symbian sources【71†L8471-L8479】【69†L555-L563】【66†L328-L335】 confirm the original window/event model and UI structure, ensuring our simulation is faithful to UIQ 3.0’s paradigms. 

**Sources:** Symbian OS architecture and UIQ framework details are drawn from official Symbian documentation and developer guides【71†L8471-L8479】【71†L8480-L8483】【69†L555-L563】【66†L328-L335】. These inform the event serialization and view-command patterns we replicate in the web OS. The remainder is constructed via standard web development practices to mimic the classic UIQ 3.0 experience.