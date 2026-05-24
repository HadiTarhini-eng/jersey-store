import { useMemo } from 'react';
import { useUiContentSlot } from './useUiContentSlot';
import type { FeaturedSection } from '../types';

/**
 * HomePage product rows, sourced from the `featured-section` ui-content slot.
 * Each row drives one ProductSlider; optional sport/team filters narrow the
 * product set, `limit` caps the row length.
 */
export function useFeaturedSections(): { sections: FeaturedSection[]; loading: boolean; error: string | null } {
  const { items, loading, error } = useUiContentSlot<{
    title:        string;
    subtitle:     string;
    limit:        number;
    sportFilter?: string;
    teamFilter?:  string;
  }>('featured-section', { activeOnly: true });

  const sections = useMemo<FeaturedSection[]>(
    () =>
      items.map((it) => ({
        id:           it.id,
        title:        it.title,
        subtitle:     it.subtitle,
        limit:        it.limit ?? 8,
        sportFilter:  it.sportFilter,
        teamFilter:   it.teamFilter,
      })),
    [items],
  );

  return { sections, loading, error };
}
