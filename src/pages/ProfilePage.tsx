import { useAuth } from '../features/auth/hooks/useAuth';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/formatters';

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary mb-8">My Profile</h1>

      <div className="space-y-5">
        {/* Avatar + name card */}
        <div className="bg-surface rounded-2xl border border-stroke p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center text-2xl font-bold shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">{user.firstName} {user.lastName}</h2>
            <p className="text-secondary text-sm">{user.email}</p>
            <p className="text-xs text-muted mt-1 capitalize">{user.role} · Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>

        {/* Account details */}
        <div className="bg-surface rounded-2xl border border-stroke divide-y divide-stroke">
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Name"  value={`${user.firstName} ${user.lastName}`} />
          <ProfileRow label="Role"  value={user.role} className="capitalize" />
        </div>

        {/* Sign out */}
        <Button variant="danger" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm text-primary font-medium ${className}`}>{value}</span>
    </div>
  );
}
