import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { analyticsApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { formatPrice } from '../../utils/formatters';
import type {
  AnalyticsActivityItem, AnalyticsDayPoint, AnalyticsMonthPoint,
  AnalyticsOverview, AnalyticsTopCategory, AnalyticsTopProduct,
} from '../../types';

const palette = {
  accent: '#007aff',
  power:  '#ff4d00',
  ok:     '#34c759',
  amber:  '#ff9f0a',
  violet: '#af52de',
  pink:   '#ff2d55',
};

const categoryColors = [palette.accent, palette.power, palette.ok, palette.amber, palette.violet, palette.pink];

function KpiCard({ label, value, delta, currency, unit }: {
  label: string; value: number; delta: number; currency?: string; unit?: string;
}) {
  const formatted = currency
    ? formatPrice(value, currency)
    : unit
      ? `${value}${unit}`
      : new Intl.NumberFormat('en-US').format(value);

  const positive = delta >= 0;
  return (
    <div className="bg-surface border border-stroke rounded-2xl p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="text-2xl sm:text-3xl font-black text-primary mt-2 leading-none">{formatted}</p>
      <div className={`mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${positive ? 'text-ok' : 'text-danger'}`}>
        <span>{positive ? '▲' : '▼'}</span>
        <span>{Math.abs(delta)}%</span>
        <span className="text-muted ml-1 normal-case tracking-normal font-medium">vs last period</span>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-surface border border-stroke rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3>
        {subtitle && <p className="text-sm text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: 'rgb(17,18,20)',
  border: '1px solid rgb(44,44,46)',
  borderRadius: '0.75rem',
  fontSize: '12px',
  color: '#f5f5f7',
};

const axisStyle = { fill: '#98989d', fontSize: 11 };

export function AdminDashboard() {
  const [overview,      setOverview]      = useState<AnalyticsOverview | null>(null);
  const [salesByDay,    setSalesByDay]    = useState<AnalyticsDayPoint[]>([]);
  const [revenueByMonth,setRevenueByMonth]= useState<AnalyticsMonthPoint[]>([]);
  const [topCategories, setTopCategories] = useState<AnalyticsTopCategory[]>([]);
  const [topProducts,   setTopProducts]   = useState<AnalyticsTopProduct[]>([]);
  const [recentActivity,setRecentActivity]= useState<AnalyticsActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [ov, sd, rm, tc, tp, ra] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.salesByDay(),
          analyticsApi.revenueByMonth(),
          analyticsApi.topCategories({ limit: 6 }),
          analyticsApi.topProducts({ limit: 5 }),
          analyticsApi.recentActivity(10),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setSalesByDay(sd);
        setRevenueByMonth(rm);
        setTopCategories(tc);
        setTopProducts(tp);
        setRecentActivity(ra);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err, 'Failed to load dashboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Convert category revenue → share-of-total for the pie chart.
  const totalCategoryRevenue = topCategories.reduce((sum, c) => sum + c.revenue, 0) || 1;
  const categoryShares = topCategories.map((c) => ({ name: c.name, value: Math.round((c.revenue / totalCategoryRevenue) * 100) }));

  if (loading)   return <p className="text-muted text-sm">Loading analytics…</p>;
  if (error)     return <p className="text-red-500 text-sm">{error}</p>;
  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Revenue"   value={overview.revenue.value}   delta={overview.revenue.deltaPct}   currency="USD" />
        <KpiCard label="Orders"    value={overview.orders.value}    delta={overview.orders.deltaPct} />
        <KpiCard label="Customers" value={overview.customers.value} delta={overview.customers.deltaPct} />
        <KpiCard label="Units"     value={overview.units.value}     delta={overview.units.deltaPct} />
      </div>

      {/* ── Sales chart + activity ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Sales — this week" subtitle="Revenue + orders by day" className="xl:col-span-2">
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAccent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={palette.accent} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={palette.power} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={palette.power} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(44,44,46)" />
                <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#98989d', paddingTop: 8 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke={palette.accent} fill="url(#gradAccent)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders"  name="Orders"      stroke={palette.power}  fill="url(#gradPower)"  strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recent Activity" subtitle="Live store events">
          <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span
                  className="mt-1 w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      a.type === 'order' ? palette.accent :
                      a.type === 'customer' ? palette.ok :
                      palette.amber,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-primary leading-snug">{a.message}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5">
                    {new Date(a.at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ── Monthly revenue + Top categories ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Revenue — 6 months">
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(44,44,46)" />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="revenue" fill={palette.accent} radius={[8, 8, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top Categories" subtitle="Share of revenue">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryShares}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {categoryShares.map((_, i) => (
                      <Cell key={i} fill={categoryColors[i % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 w-full space-y-2">
              {categoryShares.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColors[i % categoryColors.length] }} />
                    <span className="text-secondary truncate">{c.name}</span>
                  </span>
                  <span className="text-primary font-bold tabular-nums">{c.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {/* ── Top products + Traffic sources ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Top Products" subtitle="Best sellers this month" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted">
                  <th className="text-left font-medium pb-3">Product</th>
                  <th className="text-right font-medium pb-3">Units</th>
                  <th className="text-right font-medium pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-3 pr-2 text-primary">{p.name}</td>
                    <td className="py-3 px-2 text-right text-secondary tabular-nums">{p.units}</td>
                    <td className="py-3 pl-2 text-right text-primary font-bold tabular-nums">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
