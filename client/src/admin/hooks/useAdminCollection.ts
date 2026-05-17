import { useSyncExternalStore } from 'react';
import { adminStore } from '../services/adminStore';

/**
 * React hook bound to an admin collection. Components re-render automatically
 * when the underlying store changes. `seed` is the import-time JSON snapshot
 * used on first read.
 */
export function useAdminCollection<T>(key: string, seed: T[]) {
  const subscribe = (cb: () => void) => adminStore.subscribe(key, cb);
  const getSnapshot = () => adminStore.read<T>(key, seed);
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    items,
    write:  (next: T[])                  => adminStore.write<T>(key, next),
    add:    (item: T)                    => adminStore.add<T>(key, item, seed),
    update: (id: string, patch: Partial<T & { id: string }>) =>
              adminStore.update<T & { id: string }>(key, id, patch, seed as unknown as (T & { id: string })[]),
    remove: (id: string)                 =>
              adminStore.remove<T & { id: string }>(key, id, seed as unknown as (T & { id: string })[]),
    reset:  ()                           => adminStore.reset<T>(key, seed),
    exportJson: ()                       => adminStore.exportJson<T>(key, seed),
  };
}
