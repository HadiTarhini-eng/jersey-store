import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../../features/cart/components/CartDrawer';
import siteConfig from '../../data/site-config.json';
import uiConfig   from '../../data/ui-config.json';
import type { SiteConfig, NavLink, FooterColumn } from '../../types';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Root layout shell — Header + main content + Footer + Cart drawer.
 * All config is pulled from JSON; no values are hardcoded here.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        siteConfig={siteConfig as SiteConfig}
        navLinks={uiConfig.nav.links as NavLink[]}
      />

      <main className="flex-1">
        {children}
      </main>

      <Footer
        siteConfig={siteConfig as SiteConfig}
        columns={uiConfig.footer.columns as FooterColumn[]}
      />

      {/* Cart drawer — rendered here so it overlays all pages */}
      <CartDrawer />
    </div>
  );
}
