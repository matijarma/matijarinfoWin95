export function createEventBus({ debug = false } = {}) {
  const listeners = new Map();

  function on(eventName, handler) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(handler);

    return () => {
      off(eventName, handler);
    };
  }

  function off(eventName, handler) {
    const handlers = listeners.get(eventName);

    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      listeners.delete(eventName);
    }
  }

  function once(eventName, handler) {
    const dispose = on(eventName, (payload) => {
      dispose();
      handler(payload);
    });

    return dispose;
  }

  function emit(eventName, payload = {}) {
    const handlers = listeners.get(eventName);

    if (!handlers || handlers.size === 0) {
      return;
    }

    if (debug) {
      console.log("[event-bus]", eventName, payload);
    }

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    }
  }

  function clear() {
    listeners.clear();
  }

  return {
    on,
    off,
    once,
    emit,
    clear,
  };
}
