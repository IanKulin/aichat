// lib/container.ts - Simple Dependency Injection Container

export type Lifecycle = "singleton" | "transient";

interface ServiceDefinition<T = unknown> {
  factory: () => T;
  lifecycle: Lifecycle;
  instance?: T;
}

export interface Container {
  register<T>(name: string, factory: () => T, lifecycle?: Lifecycle): void;
  resolve<T>(name: string): T;
  has(name: string): boolean;
  clear(): void;
}

class SimpleContainer implements Container {
  private services = new Map<string, ServiceDefinition<unknown>>();

  register<T>(
    name: string,
    factory: () => T,
    lifecycle: Lifecycle = "singleton"
  ): void {
    this.services.set(name, {
      factory,
      lifecycle,
      instance: undefined,
    });
  }

  resolve<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    if (service.lifecycle === "singleton") {
      if (!service.instance) {
        service.instance = service.factory();
      }
      return service.instance as T;
    }

    // Transient - create new instance each time
    return service.factory() as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.services.clear();
  }
}

// Global container instance
export const container = new SimpleContainer();

// Helper functions for common registration patterns
export function registerSingleton<T>(name: string, factory: () => T): void {
  container.register(name, factory, "singleton");
}

export function registerTransient<T>(name: string, factory: () => T): void {
  container.register(name, factory, "transient");
}
