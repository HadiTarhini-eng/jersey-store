import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { decodeProductTags } from '../../features/products/lib/productMeta';
import { productPath } from '../../config/routes';
import { formatPrice } from '../../utils/formatters';
import type { Product } from '../../types';

/**
 * Compact navbar search trigger. Click → fullscreen overlay drops down with a
 * single input. Typing surfaces matching products *and* tag suggestions
 * (sport, team, category, free-form tags) so the customer can search by
 * either a product name or a tag.
 *
 *  - Esc closes; backdrop click closes.
 *  - Cmd/Ctrl+K opens (anywhere in the app).
 *  - Up/Down navigates the result list; Enter follows the highlighted item.
 *  - Tag chips link to /shop?q={tag} so the user can browse by tag too.
 */
export function SearchButton() {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the store"
        title="Search (⌘K)"
        className="relative rounded-xl px-3 py-2 flex items-center text-white border-2 border-white hover:bg-white hover:text-black transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </button>

      {isOpen && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

interface Suggestion {
  type:  'product' | 'tag';
  value: string;
  /** Only for product suggestions */
  product?: Product;
  /** Origin badge for tag suggestions — Sport / Team / Category / Tag */
  origin?: 'sport' | 'team' | 'category' | 'tag';
}

/**
 * Single-page search overlay — anchored top, dark glass, slides in from the
 * top. Loads every active product once (small storefront catalog, fine to
 * cache in memory) then filters in-memory as the user types so the typeahead
 * feels instant.
 */
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlight, setHighlight] = useState(0);

  // Pull every active product once. We grab a generous page so even
  // medium-sized catalogues filter in memory without paginating.
  useEffect(() => {
    let cancelled = false;
    productService.getProducts({}, 'newest', 1, 200)
      .then((result) => { if (!cancelled) setProducts(result.data); })
      .catch(() => { /* show empty state */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Build the suggestion list as the user types.
  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const productMatches: Suggestion[] = [];
    const tagCounts = new Map<string, { count: number; origin: Suggestion['origin'] }>();

    for (const p of products) {
      const meta = decodeProductTags(p.tags ?? []);
      const haystack = [
        p.title,
        p.slug,
        p.brand ?? '',
        meta.sport,
        meta.team,
        meta.category,
        ...meta.tags,
        ...meta.features,
      ].join(' ').toLowerCase();

      // Product hit
      if (haystack.includes(q) && productMatches.length < 6) {
        productMatches.push({ type: 'product', value: p.title, product: p });
      }

      // Collect tag/sport/team/category candidates that contain the query.
      const considerTag = (raw: string | undefined, origin: Suggestion['origin']) => {
        const cleaned = (raw ?? '').trim();
        if (!cleaned) return;
        if (!cleaned.toLowerCase().includes(q)) return;
        const key = cleaned.toLowerCase();
        const existing = tagCounts.get(key);
        tagCounts.set(key, { count: (existing?.count ?? 0) + 1, origin: existing?.origin ?? origin });
      };

      considerTag(meta.sport,    'sport');
      considerTag(meta.team,     'team');
      considerTag(meta.category, 'category');
      for (const t of meta.tags) considerTag(t, 'tag');
    }

    const tagSuggestions: Suggestion[] = [...tagCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([value, { origin }]) => ({ type: 'tag', value, origin }));

    return [...productMatches, ...tagSuggestions];
  }, [query, products]);

  // Reset the highlight when the suggestion set changes.
  useEffect(() => { setHighlight(0); }, [suggestions.length]);

  const followSuggestion = (s: Suggestion) => {
    if (s.type === 'product' && s.product) {
      navigate(productPath(s.product.slug));
    } else {
      // Tag suggestions land on /shop with the tag as the query — server-side
      // filtering picks it up the same way as a manual search.
      navigate(`/shop?q=${encodeURIComponent(s.value)}`);
    }
    onClose();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const active = suggestions[highlight];
    if (active) { followSuggestion(active); return; }
    const q = query.trim();
    if (q) { navigate(`/shop?q=${encodeURIComponent(q)}`); onClose(); }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, suggestions.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Card */}
      <div className="relative w-full max-w-2xl animate-fade-in">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search jerseys, teams, sports, tags…"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-base"
              autoComplete="off"
            />
            <kbd className="hidden sm:inline-flex shrink-0 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-white/60 border border-white/15">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {!query.trim() ? (
              <EmptyHint loading={loading} />
            ) : suggestions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-white/60">
                No results for &quot;<span className="text-white">{query}</span>&quot;.
              </p>
            ) : (
              <ul role="listbox" className="divide-y divide-white/5">
                {suggestions.map((s, i) => (
                  <SuggestionRow
                    key={`${s.type}-${s.value}-${i}`}
                    s={s}
                    active={i === highlight}
                    onHover={() => setHighlight(i)}
                    onPick={() => followSuggestion(s)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3 text-[11px] text-white/40">
            <span className="hidden sm:inline">
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate · <Kbd>↵</Kbd> open
            </span>
            <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuggestionRow({
  s, active, onHover, onPick,
}: { s: Suggestion; active: boolean; onHover: () => void; onPick: () => void }) {
  if (s.type === 'product') {
    const p = s.product!;
    const image = p.images?.[0];
    return (
      <li role="option" aria-selected={active}>
        <button
          type="button"
          onMouseEnter={onHover}
          onClick={onPick}
          className={[
            'flex items-center gap-3 w-full px-5 py-3 text-left transition-colors',
            active ? 'bg-white/10' : 'hover:bg-white/5',
          ].join(' ')}
        >
          <div className="w-10 h-12 rounded-md overflow-hidden bg-white/5 shrink-0">
            {image && (
              <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{p.title}</p>
            <p className="text-xs text-white/50 truncate">{p.brand ?? 'Jerseys4Ever'}</p>
          </div>
          <span className="text-sm font-bold text-white tabular-nums shrink-0">
            {formatPrice(p.basePrice)}
          </span>
        </button>
      </li>
    );
  }

  // Tag row
  const originColor: Record<NonNullable<Suggestion['origin']>, string> = {
    sport:    'text-accent bg-accent/10 border-accent/30',
    team:     'text-power bg-power/10 border-power/30',
    category: 'text-ok bg-ok/10 border-ok/30',
    tag:      'text-white/70 bg-white/5 border-white/15',
  };
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onMouseEnter={onHover}
        onClick={onPick}
        className={[
          'flex items-center gap-3 w-full px-5 py-3 text-left transition-colors',
          active ? 'bg-white/10' : 'hover:bg-white/5',
        ].join(' ')}
      >
        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white/5 shrink-0">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white capitalize">{s.value}</p>
          <p className="text-[11px] text-white/40">Browse all matching products</p>
        </div>
        {s.origin && (
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${originColor[s.origin]}`}>
            {s.origin}
          </span>
        )}
      </button>
    </li>
  );
}

function EmptyHint({ loading }: { loading: boolean }) {
  if (loading) {
    return <p className="px-5 py-8 text-center text-sm text-white/40">Loading catalogue…</p>;
  }
  return (
    <div className="px-5 py-8 text-center space-y-3">
      <p className="text-sm text-white/60">Start typing to search products, teams, sports or tags.</p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {['football', 'jerseys', 'sale', 'new'].map((q) => (
          <Link
            key={q}
            to={`/shop?q=${encodeURIComponent(q)}`}
            className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
          >
            {q}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-white/70 border border-white/15">
      {children}
    </kbd>
  );
}
