# Product Requirements Document (PRD): Hybrid LLM Terminal Shell

## Context
We are upgrading the `ubuntu-server-shell.js` in a vanilla JS simulated web-OS. Currently, the terminal processes commands via a hardcoded `switch/case` local parser. 
We are moving to a **Hybrid Router Architecture**:
1. **Fast Path:** Deterministic, expected commands execute locally instantly.
2. **Smart Path:** Complex, unknown, or conversational commands fallback to a Cloudflare Worker LLM endpoint.
3. **EventBus Integration:** Both paths must be able to emit UI events to the system `EventBus` to open graphical windows over the terminal.

## Requirements for `ubuntu-server-shell.js`

### 1. The Command Router
Refactor the main command processing function to implement this logic flow:
* Extract the base command (e.g., `cat` from `cat cv.pdf`).
* Check against a `LOCAL_COMMANDS` registry (e.g., `['ls', 'cd', 'clear', 'help', 'open']`).
* **IF Local:** Execute the existing JS logic immediately.
* **IF NOT Local:** Pass the full raw command string to the new `processViaLLM()` async function.

### 2. The `processViaLLM(rawCommand)` Function
Create an async function that communicates with the LLM API.
* **UI State:** While awaiting the fetch, print a non-blocking loading indicator to the terminal (e.g., `[Kernel daemon computing...]` or a blinking block) so the user knows it's thinking.
* **Payload:** Gather the current directory (`this.fileSystem.currentDirectory`) and a snapshot of the current folder contents to send in the POST body to `https://llmshell.matijar.info`.
* **Request Format:**
  ```json
  {
    "command": "the raw string",
    "cwd": "/home/guest",
    "vfs_snapshot": { ... }
  }
  ```
### 3. LLM Response Parsing & Execution
The API will return a strict JSON object matching this schema:


  ```JSON
{
  "stdout": "text to print",
  "stderr": "error text to print",
  "vfs_mutations": [{"action": "create", "path": "test.txt"}],
  "ui_events": [{"type": "OPEN_APP", "payload": "cv.pdf"}]
}

  ```

* Text Output: Print stdout normally. Print stderr with a red/error CSS class.
* VFS Mutations: Iterate over vfs_mutations and call the corresponding methods on this.fileSystem (e.g., createFile, deleteFile).
* UI Events: Iterate over ui_events and trigger the global event bus: eventBus.emit(event.type, event.payload).

### 4. Background Meta-Commentary (Phase 1 implementation)
Add a hook in the "Local Fast Path" execution block.
When a local command successfully executes (e.g., the user types open cv.pdf), trigger a non-blocking, fire-and-forget background fetch to the LLM API with a special meta_context flag: "User just opened the CV locally. Give a 1-sentence snarky sysadmin observation to print to console."
When this background fetch resolves, append its stdout to the terminal DOM smoothly without interrupting the user's current input prompt.

# Code Standards
* Stick to the existing vanilla JS class structures.
* Do not introduce external libraries or dependencies.
* Ensure DOM manipulation for the terminal output remains performant and auto-scrolls to the bottom on new text.

