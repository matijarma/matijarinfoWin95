export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);
  }

  off(eventType, handler) {
    const handlers = this.listeners.get(eventType);
    if (!handlers) {
      return;
    }

    const nextHandlers = handlers.filter((current) => current !== handler);
    if (nextHandlers.length === 0) {
      this.listeners.delete(eventType);
      return;
    }

    this.listeners.set(eventType, nextHandlers);
  }

  emit(eventType, payload) {
    const handlers = this.listeners.get(eventType);
    if (!handlers) {
      return;
    }

    [...handlers].forEach((handler) => {
      handler(payload);
    });
  }
}
