import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setShippingAddress } from '../checkoutSlice';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { validate, validators } from '../../../utils/validators';
import type { AddressSnapshot } from '../../../types';

interface FormState {
  firstName:    string;
  lastName:     string;
  country:      string;
  addressLine1: string;
  addressLine2: string;
  city:         string;
  state:        string;
  postalCode:   string;
  phone:        string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const SAVED_INFO_KEY = 'js_saved_shipping_info';

function loadSavedInfo(): FormState | null {
  try {
    const raw = localStorage.getItem(SAVED_INFO_KEY);
    return raw ? (JSON.parse(raw) as FormState) : null;
  } catch {
    return null;
  }
}

function persistSavedInfo(info: FormState): void {
  try { localStorage.setItem(SAVED_INFO_KEY, JSON.stringify(info)); } catch { /* noop */ }
}

const empty: FormState = {
  firstName: '', lastName: '', country: '',
  addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '',
  phone: '',
};

export function CheckoutForm() {
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const user     = useAppSelector((s) => s.auth.user);
  const isAuthed = !!user;

  // Prefill from authenticated user OR saved info — auth takes precedence.
  const [form, setForm] = useState<FormState>(() => {
    if (user) return { ...empty, firstName: user.firstName ?? '', lastName: user.lastName ?? '' };
    return loadSavedInfo() ?? empty;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveForNextTime, setSaveForNextTime] = useState<boolean>(false);

  // Re-prefill name fields if the user signs in mid-flow.
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName:  prev.lastName  || user.lastName  || '',
      }));
    }
  }, [user]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSaveCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && !isAuthed) {
      // Block the toggle and prompt to sign in.
      toast.push({
        variant: 'info',
        title:   'Sign in required',
        message: 'Create an account or sign in to save your shipping info for next time.',
      });
      setSaveForNextTime(false);
      return;
    }
    setSaveForNextTime(e.target.checked);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const next: FormErrors = {
      firstName:    validate(form.firstName,    [validators.required, validators.minLength(2)]),
      lastName:     validate(form.lastName,     [validators.required, validators.minLength(2)]),
      country:      validate(form.country,      [validators.required]),
      addressLine1: validate(form.addressLine1, [validators.required]),
      city:         validate(form.city,         [validators.required]),
      phone:        validate(form.phone,        [validators.required, validators.phone]),
    };

    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      toast.push({
        variant: 'warning',
        title:   'Check your details',
        message: 'A few fields need attention before we continue.',
      });
      return;
    }

    // Persist for next time when allowed.
    if (saveForNextTime && isAuthed) {
      persistSavedInfo(form);
      toast.push({ variant: 'success', message: 'Shipping info saved for next time.' });
    }

    const address: AddressSnapshot = {
      fullName:     `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      phone:        form.phone.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || null,
      city:         form.city.trim(),
      state:        form.state.trim() || null,
      country:      form.country.trim(),
      postalCode:   form.postalCode.trim() || null,
    };

    dispatch(setShippingAddress(address));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-primary">Shipping information</h2>
        <p className="text-sm text-muted">
          Where should we send your order?{' '}
          {!isAuthed && (
            <span className="text-secondary">No account needed — checkout as guest.</span>
          )}
        </p>
      </header>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          value={form.firstName}
          onChange={set('firstName')}
          error={errors.firstName}
          autoComplete="given-name"
          placeholder="John"
        />
        <Input
          label="Last name"
          value={form.lastName}
          onChange={set('lastName')}
          error={errors.lastName}
          autoComplete="family-name"
          placeholder="Doe"
        />
      </div>

      {/* Country (separate, prominent) */}
      <Input
        label="Country"
        value={form.country}
        onChange={set('country')}
        error={errors.country}
        autoComplete="country-name"
        placeholder="Lebanon"
      />

      {/* Street + apartment */}
      <Input
        label="Street address"
        value={form.addressLine1}
        onChange={set('addressLine1')}
        error={errors.addressLine1}
        autoComplete="address-line1"
        placeholder="Building name, street name & number"
      />
      <Input
        label="Apartment, suite, floor (optional)"
        value={form.addressLine2}
        onChange={set('addressLine2')}
        autoComplete="address-line2"
        placeholder="Apt 4B, Floor 3"
      />

      {/* City / state */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={set('city')}
          error={errors.city}
          autoComplete="address-level2"
          placeholder="Beirut"
        />
        <Input
          label="State / Region (optional)"
          value={form.state}
          onChange={set('state')}
          autoComplete="address-level1"
          placeholder=""
        />
      </div>

      {/* Postal + phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Postal code (optional)"
          value={form.postalCode}
          onChange={set('postalCode')}
          autoComplete="postal-code"
          placeholder=""
        />
        <Input
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          autoComplete="tel"
          placeholder="+961 71 234 567"
        />
      </div>

      {/* Save-for-next-time */}
      <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-raised border border-stroke cursor-pointer hover:border-accent/30 transition-colors">
        <input
          type="checkbox"
          checked={saveForNextTime}
          onChange={onSaveCheckboxChange}
          className="mt-0.5 w-4 h-4 rounded border-stroke bg-surface text-accent focus:ring-accent focus:ring-offset-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">Save my information for next time</p>
          <p className="text-xs text-muted mt-0.5">
            {isAuthed
              ? 'Your shipping address will be pre-filled on future orders.'
              : 'Sign in first — saved info is tied to your account.'}
          </p>
        </div>
      </label>

      <Button type="submit" variant="primary" size="lg" fullWidth>
        Continue to review
      </Button>
    </form>
  );
}
