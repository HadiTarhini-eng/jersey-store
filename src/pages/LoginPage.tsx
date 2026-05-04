import { LoginForm } from '../features/auth/components/LoginForm';
import siteConfig from '../data/site-config.json';
import type { SiteConfig } from '../types';

export function LoginPage() {
  const { name, tagline } = siteConfig as SiteConfig;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-widest text-primary">{name}</h1>
          <p className="text-muted text-sm mt-1">{tagline}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-stroke p-8">
          <h2 className="text-xl font-semibold text-primary mb-6">Sign In</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
