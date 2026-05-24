import { useMemo } from 'react';
import { useUiContentSlot } from './useUiContentSlot';
import type { FooterColumn } from '../types';

/**
 * Footer column groups, sourced from the `footer-column` ui-content slot.
 * Each row is one titled column with a `links` array.
 */
export function useFooterColumns(): { columns: FooterColumn[]; loading: boolean; error: string | null } {
  const { items, loading, error } = useUiContentSlot<{
    title: string;
    links: { label: string; href: string }[];
  }>('footer-column', { activeOnly: true });

  const columns = useMemo<FooterColumn[]>(
    () =>
      items.map((it) => ({
        title: it.title,
        links: Array.isArray(it.links) ? it.links : [],
      })),
    [items],
  );

  return { columns, loading, error };
}
