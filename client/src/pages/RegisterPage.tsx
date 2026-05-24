import { RegisterForm } from '../features/auth/components/RegisterForm';
import { useSiteConfig } from '../contexts/SiteConfigContext';

export function RegisterPage() {
  const { name, tagline } = useSiteConfig();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-widest text-primary">{name}</h1>
          <p className="text-muted text-sm mt-1">{tagline}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-stroke p-8">
          <h2 className="text-xl font-semibold text-primary mb-6">Create Account</h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
