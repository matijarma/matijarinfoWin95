import { delay } from "../utils/timing.js";
import { ALLOWED_TRANSITIONS, OS_STATES } from "./states.js";

const DEFAULT_BOOT_DURATION_MS = 4300;
const DEFAULT_SHUTDOWN_INIT_DURATION_MS = 900;
const DEFAULT_SHUTDOWN_DURATION_MS = 3200;

export function createOSKernel({
  eventBus,
  bootDurationMs = DEFAULT_BOOT_DURATION_MS,
  shutdownInitDurationMs = DEFAULT_SHUTDOWN_INIT_DURATION_MS,
  shutdownDurationMs = DEFAULT_SHUTDOWN_DURATION_MS,
} = {}) {
  if (!eventBus) {
    throw new Error("createOSKernel requires an eventBus instance.");
  }

  let currentState = OS_STATES.POWER_OFF;
  let sequenceInProgress = false;

  function getState() {
    return currentState;
  }

  function canTransition(nextState) {
    return (ALLOWED_TRANSITIONS[currentState] || []).includes(nextState);
  }

  function transition(nextState, reason = "manual") {
    if (!canTransition(nextState)) {
      eventBus.emit("os:transition-rejected", {
        currentState,
        nextState,
        reason,
      });
      return false;
    }

    const previousState = currentState;
    currentState = nextState;

    eventBus.emit("os:state-changed", {
      previousState,
      nextState,
      reason,
    });

    return true;
  }

  async function boot({ bootDurationMs: overrideBootDurationMs } = {}) {
    if (sequenceInProgress || currentState !== OS_STATES.POWER_OFF) {
      return false;
    }

    sequenceInProgress = true;

    try {
      const effectiveBootDurationMs =
        Number.isFinite(overrideBootDurationMs) && overrideBootDurationMs > 0
          ? Math.round(overrideBootDurationMs)
          : bootDurationMs;
      transition(OS_STATES.BOOTING, "power-on");
      await delay(effectiveBootDurationMs);
      transition(OS_STATES.DESKTOP_READY, "boot-complete");
      return true;
    } finally {
      sequenceInProgress = false;
    }
  }

  async function shutdown() {
    if (sequenceInProgress || currentState !== OS_STATES.DESKTOP_READY) {
      return false;
    }

    sequenceInProgress = true;

    try {
      transition(OS_STATES.SHUTDOWN_INIT, "shutdown-requested");
      await delay(shutdownInitDurationMs);
      transition(OS_STATES.SHUTTING_DOWN, "shutdown-in-progress");
      await delay(shutdownDurationMs);
      transition(OS_STATES.POWER_OFF, "shutdown-complete");
      return true;
    } finally {
      sequenceInProgress = false;
    }
  }

  return {
    getState,
    canTransition,
    transition,
    boot,
    shutdown,
  };
}
