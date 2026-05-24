import { useMemo } from 'react';
import { useUiContentSlot } from './useUiContentSlot';
import type { NavLink } from '../types';

/**
 * Header navigation links, sourced from the `nav-link` ui-content slot.
 * Each row is a top-level link; nested dropdowns live under `payload.children`.
 */
export function useNavLinks(): { links: NavLink[]; loading: boolean; error: string | null } {
  const { items, loading, error } = useUiContentSlot<{
    label:    string;
    href:     string;
    children?: NavLink[];
  }>('nav-link', { activeOnly: true });

  const links = useMemo<NavLink[]>(
    () =>
      items.map((it) => ({
        label:    it.label,
        href:     it.href,
        children: it.children,
      })),
    [items],
  );

  return { links, loading, error };
}
