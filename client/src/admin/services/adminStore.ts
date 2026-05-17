/**
 * AdminStore — JSON-seeded, localStorage-persisted collection store.
 *
 * Every collection (orders, customers, products, etc.) is seeded from the
 * import-time JSON snapshot. The first runtime read clones the seed into
 * localStorage; subsequent reads return the localStorage value so admin
 * edits survive page reloads.
 *
 * Snapshots are stable by reference until a mutation occurs, so this store
 * is safe to drive `useSyncExternalStore` with.
 *
 * Use `exportJson(key)` to serialize a collection back to JSON the admin
 * can paste into the source `.json` file.
 */

type Listener = () => void;
const NAMESPACE = 'js_admin_';

class AdminStore {
  private cache:     Map<string, unknown[]> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  /**
   * Read a collection. Returns the cached array reference — stable across
   * calls until `write()` produces a new one. Do NOT mutate the returned
   * array; mutations bypass the listener notification and will desync UI.
   */
  read<T>(key: string, seed: T[]): T[] {
    const cached = this.cache.get(key) as T[] | undefined;
    if (cached) return cached;

    let initial: T[];
    try {
      const raw = localStorage.getItem(NAMESPACE + key);
      initial = raw ? (JSON.parse(raw) as T[]) : seed;
      if (!raw) this.persist(key, initial);
    } catch {
      initial = seed;
    }

    this.cache.set(key, initial as unknown[]);
    return initial;
  }

  /** Replace an entire collection with a fresh array reference. */
  write<T>(key: string, items: T[]): void {
    const next = [...items];
    this.cache.set(key, next as unknown[]);
    this.persist(key, next);
    this.notify(key);
  }

  /** Add one item to the front of a collection. */
  add<T>(key: string, item: T, seed: T[]): T[] {
    const next = [item, ...this.read<T>(key, seed)];
    this.write(key, next);
    return next;
  }

  /** Update an item by id (objects must have an `id` field). */
  update<T extends { id: string }>(key: string, id: string, patch: Partial<T>, seed: T[]): T[] {
    const next = this.read<T>(key, seed).map((it) => (it.id === id ? { ...it, ...patch } : it));
    this.write(key, next);
    return next;
  }

  /** Remove an item by id. */
  remove<T extends { id: string }>(key: string, id: string, seed: T[]): T[] {
    const next = this.read<T>(key, seed).filter((it) => it.id !== id);
    this.write(key, next);
    return next;
  }

  /** Reset a collection back to the seed snapshot. */
  reset<T>(key: string, seed: T[]): T[] {
    this.cache.delete(key);
    try { localStorage.removeItem(NAMESPACE + key); } catch { /* noop */ }
    return this.read<T>(key, seed);
  }

  /** Subscribe to changes for a specific collection. Returns an unsubscribe fn. */
  subscribe(key: string, fn: Listener): () => void {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(fn);
    return () => { this.listeners.get(key)?.delete(fn); };
  }

  /** Pretty-printed JSON the admin can copy back into the source data file. */
  exportJson<T>(key: string, seed: T[]): string {
    return JSON.stringify(this.read<T>(key, seed), null, 2);
  }

  private persist(key: string, items: unknown[]): void {
    try { localStorage.setItem(NAMESPACE + key, JSON.stringify(items)); } catch { /* noop */ }
  }

  private notify(key: string): void {
    this.listeners.get(key)?.forEach((fn) => fn());
  }
}

export const adminStore = new AdminStore();
