// Simple pub/sub observer for state changes
class StateObserver {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  notify(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  clear() {
    this.subscribers.clear();
  }
}

export const stateObserver = new StateObserver();
