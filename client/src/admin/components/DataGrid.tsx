import { useMemo, useState, type ReactNode } from 'react';

export interface DataGridColumn<T> {
  /** Unique column id (also used as React key). */
  key:     string;
  /** Header label. */
  label:   string;
  /** Renderer for each cell. */
  render:  (row: T) => ReactNode;
  /** Horizontal alignment. Defaults to `left`. */
  align?:  'left' | 'right' | 'center';
  /** Optional Tailwind width class for the column. */
  width?:  string;
  /** Hide this column on mobile cards (use for verbose or secondary info). */
  mobileHidden?: boolean;
}

interface DataGridProps<T> {
  rows:           T[];
  columns:        DataGridColumn<T>[];
  rowKey:         (row: T) => string;
  /** Optional row-click handler. Cursor becomes pointer when set. */
  onRowClick?:    (row: T) => void;
  /** Returns the searchable text blob for a row. When omitted, search is hidden. */
  searchableText?: (row: T) => string;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Renders to the right of the search input. */
  toolbar?:       ReactNode;
  emptyMessage?:  string;
}

/**
 * Responsive admin data grid: table on desktop, card stack on mobile.
 * Search is client-side over the user-provided `searchableText` blob.
 */
export function DataGrid<T>({
  rows, columns, rowKey, onRowClick,
  searchableText, searchPlaceholder = 'Search…',
  toolbar, emptyMessage = 'No records to show.',
}: DataGridProps<T>) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query || !searchableText) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchableText(r).toLowerCase().includes(q));
  }, [rows, query, searchableText]);

  const align = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {searchableText && (
          <div className="relative flex-1 min-w-0">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface border border-stroke text-primary placeholder:text-muted text-sm outline-none focus:border-accent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
        )}
        {toolbar && <div className="shrink-0">{toolbar}</div>}
      </div>

      {/* ── Desktop table ───────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-surface border border-stroke rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised border-b border-stroke">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`${align(c.align)} ${c.width ?? ''} px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-surface-raised' : '',
                  ].join(' ')}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`${align(c.align)} px-4 py-3 align-middle`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ────────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
            {emptyMessage}
          </div>
        ) : (
          filtered.map((row) => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                'bg-surface border border-stroke rounded-2xl p-4 space-y-2',
                onRowClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : '',
              ].join(' ')}
            >
              {columns
                .filter((c) => !c.mobileHidden)
                .map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-muted shrink-0 pt-0.5">
                      {c.label}
                    </span>
                    <div className="text-right text-sm text-primary min-w-0">
                      {c.render(row)}
                    </div>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>

      {/* ── Result count footer ─────────────────────────────────────────────── */}
      {searchableText && (
        <p className="text-xs text-muted">
          {filtered.length} of {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </p>
      )}
    </div>
  );
}
