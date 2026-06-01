import { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useAppDispatch } from '../app/hooks';
import { setUser } from '../features/auth/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { userApi, extractErrorMessage } from '../services/api';
import { formatDate } from '../utils/formatters';
import type { AddressSnapshot, User } from '../types';

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

        {/* Saved shipping address */}
        <ShippingAddressSection user={user} />

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

// ── Saved shipping address ─────────────────────────────────────────────────────

interface AddressForm {
  fullName: string; phone: string; addressLine1: string; addressLine2: string;
  city: string; state: string; country: string; postalCode: string;
}

function toForm(a: AddressSnapshot | null | undefined): AddressForm {
  return {
    fullName:     a?.fullName ?? '',
    phone:        a?.phone ?? '',
    addressLine1: a?.addressLine1 ?? '',
    addressLine2: a?.addressLine2 ?? '',
    city:         a?.city ?? '',
    state:        a?.state ?? '',
    country:      a?.country ?? '',
    postalCode:   a?.postalCode ?? '',
  };
}

function ShippingAddressSection({ user }: { user: User }) {
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const saved    = user.shippingAddress ?? null;

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState<AddressForm>(() => toForm(saved));
  const [busy, setBusy]       = useState(false);

  const set = (k: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const openEditor = () => { setForm(toForm(saved)); setEditing(true); };

  const save = async () => {
    // Minimal required set, mirroring checkout.
    if (!form.fullName.trim() || !form.addressLine1.trim() || !form.city.trim() || !form.country.trim() || !form.phone.trim()) {
      toast.push({ variant: 'warning', message: 'Name, phone, street, city and country are required.' });
      return;
    }
    const address: AddressSnapshot = {
      fullName:     form.fullName.trim(),
      phone:        form.phone.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || null,
      city:         form.city.trim(),
      state:        form.state.trim() || null,
      country:      form.country.trim(),
      postalCode:   form.postalCode.trim() || null,
    };
    setBusy(true);
    try {
      const updated = await userApi.update(user.id, { shippingAddress: address });
      dispatch(setUser(updated));
      toast.push({ variant: 'success', message: 'Shipping address saved.' });
      setEditing(false);
    } catch (err) {
      toast.push({ variant: 'error', message: extractErrorMessage(err, 'Could not save address.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const updated = await userApi.update(user.id, { shippingAddress: null });
      dispatch(setUser(updated));
      toast.push({ variant: 'info', message: 'Shipping address removed.' });
      setEditing(false);
    } catch (err) {
      toast.push({ variant: 'error', message: extractErrorMessage(err, 'Could not remove address.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-stroke p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-primary">Shipping address</h2>
        {!editing && (
          <button
            type="button"
            onClick={openEditor}
            className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-light transition-colors"
          >
            {saved ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {!editing ? (
        saved ? (
          <div className="text-sm text-secondary space-y-0.5">
            <p className="text-primary font-medium">{saved.fullName}</p>
            <p>{saved.addressLine1}</p>
            {saved.addressLine2 && <p>{saved.addressLine2}</p>}
            <p>
              {saved.city}
              {saved.state ? `, ${saved.state}` : ''}
              {saved.postalCode ? ` ${saved.postalCode}` : ''}
            </p>
            <p>{saved.country}</p>
            <p className="mt-1">{saved.phone}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">No saved address yet — add one to speed up checkout.</p>
        )
      ) : (
        <div className="space-y-4">
          <Input label="Full name" value={form.fullName} onChange={set('fullName')} placeholder="John Doe" />
          <Input label="Country" value={form.country} onChange={set('country')} placeholder="Lebanon" />
          <Input label="Street address" value={form.addressLine1} onChange={set('addressLine1')} placeholder="Building, street & number" />
          <Input label="Apartment, suite, floor (optional)" value={form.addressLine2} onChange={set('addressLine2')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" value={form.city} onChange={set('city')} placeholder="Beirut" />
            <Input label="State / Region (optional)" value={form.state} onChange={set('state')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Postal code (optional)" value={form.postalCode} onChange={set('postalCode')} />
            <Input label="Phone number" type="tel" value={form.phone} onChange={set('phone')} placeholder="+961 71 234 567" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="primary" onClick={save} loading={busy}>Save address</Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
            {saved && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="ml-auto text-xs font-bold uppercase tracking-wider text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
