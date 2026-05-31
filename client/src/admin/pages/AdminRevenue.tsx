import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { useToast } from '../../components/ui/Toast';
import { extractErrorMessage } from '../../services/api/client';
import { formatPrice } from '../../utils/formatters';
import type { AdminRevenue } from '../../types';

/**
 * Admin revenue dashboard.
 *
 * Revenue is recognised only when an order reaches `delivered` — orders sitting
 * in pending / processing / shipped are bucketed as "pending revenue" so the
 * admin sees what's earned vs. what's expected. A 30-day trend, conversion
 * rate (delivered / settled), and top-revenue products round out the view.
 *
 * Data is one round-trip to `GET /admin/revenue`; the endpoint does the SQL
 * roll-up and we just render.
 */
export function AdminRevenue() {
  const { push } = useToast();
  const [data, setData] = useState<AdminRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.revenueSummary()
      .then((next) => { if (!cancelled) setData(next); })
      .catch((err) => { if (!cancelled) push({ variant: 'error', message: extractErrorMessage(err, 'Failed to load revenue') }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [push]);

  if (loading || !data) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-64 shimmer rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 shimmer rounded-2xl" />)}
        </div>
        <div className="h-72 shimmer rounded-2xl" />
      </div>
    );
  }

  const maxMonthRevenue = data.byMonth.reduce((max, m) => Math.max(max, m.revenue), 0);
  const trendDelta = data.previous30dRevenue > 0
    ? ((data.last30dRevenue - data.previous30dRevenue) / data.previous30dRevenue) * 100
    : null;
  const trendArrow  = trendDelta === null ? '·' : trendDelta >= 0 ? '↑' : '↓';
  const trendTone: 'ok' | 'danger' | 'muted' =
    trendDelta === null ? 'muted' : trendDelta >= 0 ? 'ok' : 'danger';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sport text-3xl tracking-wide text-primary uppercase">Revenue</h1>
        <p className="text-sm text-secondary mt-1">
          Lifetime totals across delivered orders. Pending revenue tracks money sitting in confirmed
          orders that haven&apos;t been delivered yet — it counts the moment you confirm and clears
          into total revenue once the customer receives the goods.
        </p>
      </div>

      {/* Top KPI row — the headline numbers. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total revenue"
          value={formatPrice(data.totalRevenue)}
          hint={`${data.deliveredCount} delivered order${data.deliveredCount === 1 ? '' : 's'}`}
          tone="accent"
        />
        <KpiCard
          label="Pending revenue"
          value={formatPrice(data.pendingRevenue)}
          hint={`${data.inFlightCount} in-flight order${data.inFlightCount === 1 ? '' : 's'}`}
          tone="power"
        />
        <KpiCard
          label="Avg order value"
          value={formatPrice(data.averageOrderValue)}
          hint="Across delivered orders"
          tone="ok"
        />
        <KpiCard
          label="Last 30 days"
          value={formatPrice(data.last30dRevenue)}
          hint={trendDelta === null
            ? 'No prior period to compare'
            : `${trendArrow} ${Math.abs(trendDelta).toFixed(1)}% vs. previous 30d`}
          tone={trendTone}
        />
      </div>

      {/* Second KPI row — health signals. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Conversion rate"
          value={`${(data.conversionRate * 100).toFixed(1)}%`}
          hint={`${data.deliveredCount} delivered · ${data.cancelledCount} cancelled`}
          tone="ok"
        />
        <KpiCard
          label="Coupon savings"
          value={formatPrice(data.totalDiscounts)}
          hint="Across delivered orders"
          tone="muted"
        />
        <KpiCard
          label="Cancelled orders"
          value={String(data.cancelledCount)}
          hint={data.deliveredCount + data.cancelledCount > 0
            ? `${((data.cancelledCount / (data.deliveredCount + data.cancelledCount)) * 100).toFixed(1)}% of settled`
            : '—'}
          tone={data.cancelledCount > 0 ? 'danger' : 'muted'}
        />
        <KpiCard
          label="Total orders"
          value={String(data.deliveredCount + data.inFlightCount + data.cancelledCount)}
          hint="All-time, every status"
          tone="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly breakdown */}
        <section className="lg:col-span-2 bg-surface border border-stroke rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Monthly revenue</h2>
              <p className="text-xs text-muted mt-0.5">Bucketed by <span className="font-mono">placedAt</span> with <span className="font-mono">createdAt</span> fallback. Newest first.</p>
            </div>
            {data.byMonth.length > 0 && (
              <span className="text-[10px] uppercase tracking-widest text-muted">
                {data.byMonth.length} month{data.byMonth.length === 1 ? '' : 's'} of activity
              </span>
            )}
          </div>

          {data.byMonth.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              No delivered orders yet. Once you mark an order delivered, it&apos;ll show up here.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.byMonth.map((m) => {
                const ratio = maxMonthRevenue > 0 ? (m.revenue / maxMonthRevenue) * 100 : 0;
                return (
                  <li key={m.month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted">{formatMonth(m.month)}</span>
                      <span className="text-primary font-bold tabular-nums">{formatPrice(m.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-muted">
                      {m.orders} order{m.orders === 1 ? '' : 's'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Top products */}
        <section className="bg-surface border border-stroke rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Top products</h2>
            <p className="text-xs text-muted mt-0.5">By revenue across delivered orders.</p>
          </div>

          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              No delivered items yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.productVariantId} className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-accent/15 border border-accent/40 text-accent flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary truncate">{p.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted">
                      {p.quantity} sold
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone:  'accent' | 'ok' | 'power' | 'danger' | 'muted';
}

const toneClasses: Record<KpiCardProps['tone'], string> = {
  accent: 'text-accent',
  ok:     'text-ok',
  power:  'text-power',
  danger: 'text-danger',
  muted:  'text-secondary',
};

function KpiCard({ label, value, hint, tone }: KpiCardProps) {
  return (
    <div className="bg-surface border border-stroke rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className={`font-sport text-3xl tracking-wide mt-2 ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

function formatMonth(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
