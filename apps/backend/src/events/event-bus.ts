type EventHandler = (payload: any) => Promise<void> | void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    this.handlers.get(event)?.push(handler);
  }

  async emit(event: string, payload: any) {
    console.log(`📡 Event emitted: ${event}`);

    const handlers = this.handlers.get(event) || [];

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(
            `Event handler failed for ${event}`,
            error
          );
        }
      })
    );
  }
}

export const eventBus = new EventBus();