import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '../../features/cart/components/CartDrawer';
import { FloatingWhatsApp } from '../ui/FloatingWhatsApp';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Root layout shell — Header + main content + Footer + Cart drawer.
 * Header and Footer pull site config and nav/footer content from the
 * SiteConfigProvider and ui-content slots respectively; no props are
 * threaded through this component.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

      {/* Cart drawer — rendered here so it overlays all pages */}
      <CartDrawer />

      {/* Floating WhatsApp chat — bottom-right on every public page */}
      <FloatingWhatsApp />
    </div>
  );
}
