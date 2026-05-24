import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { siteConfigApi } from '../services/api';
import { extractErrorMessage } from '../services/api/client';
import { PageSpinner } from '../components/ui/Spinner';
import type { SiteConfig } from '../types';

/**
 * Storefront-wide site config (name, contact, currency, hero CTA, filter
 * bounds, cart copy). Fetched once at app boot and shared via context so
 * Header/Footer/Cart/Checkout never re-fetch it.
 */
interface SiteConfigContextValue {
  config: SiteConfig;
  refresh: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError]   = useState<string | null>(null);

  async function refresh() {
    try {
      const next = await siteConfigApi.get();
      setConfig(next);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load site configuration'));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (error && !config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-center px-6">
        <div>
          <p className="text-white font-bold text-lg mb-2">Site is unavailable</p>
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!config) return <PageSpinner />;

  return (
    <SiteConfigContext.Provider value={{ config, refresh }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error('useSiteConfig must be used inside <SiteConfigProvider>');
  return ctx.config;
}

export function useSiteConfigRefresh(): () => Promise<void> {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error('useSiteConfigRefresh must be used inside <SiteConfigProvider>');
  return ctx.refresh;
}
