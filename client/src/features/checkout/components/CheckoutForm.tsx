import { useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setShippingAddress } from '../checkoutSlice';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { validate, validators } from '../../../utils/validators';
import type { AddressSnapshot } from '../../../types';

type FormErrors = Partial<Record<keyof AddressSnapshot, string>>;

const emptyAddress: AddressSnapshot = {
  fullName:     '',
  phone:        '',
  addressLine1: '',
  addressLine2: '',
  city:         '',
  state:        '',
  country:      '',
  postalCode:   '',
};

export function CheckoutForm() {
  const dispatch = useAppDispatch();
  const user     = useAppSelector((s) => s.auth.user);

  const [form, setForm] = useState<AddressSnapshot>({
    ...emptyAddress,
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const change =
    (field: keyof AddressSnapshot) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {
      fullName:     validate(form.fullName,     [validators.required, validators.minLength(2)]),
      addressLine1: validate(form.addressLine1, [validators.required]),
      city:         validate(form.city,         [validators.required]),
      postalCode:   validate(form.postalCode ?? '', [validators.required, validators.postalCode]),
      country:      validate(form.country,      [validators.required]),
      phone:        validate(form.phone,        [validators.required, validators.phone]),
    };

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    dispatch(setShippingAddress(form));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <h2 className="text-xl font-semibold text-primary">Shipping Information</h2>

      <Input
        label="Full name"
        value={form.fullName}
        onChange={change('fullName')}
        error={errors.fullName}
        autoComplete="name"
      />

      <Input
        label="Street address"
        value={form.addressLine1}
        onChange={change('addressLine1')}
        error={errors.addressLine1}
        placeholder="123 Main Street"
        autoComplete="address-line1"
      />

      <Input
        label="Apartment, suite, etc. (optional)"
        value={form.addressLine2 ?? ''}
        onChange={change('addressLine2')}
        placeholder="Apt 4B"
        autoComplete="address-line2"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input label="City"  value={form.city}        onChange={change('city')}  error={errors.city}  autoComplete="address-level2" />
        <Input label="State / Region" value={form.state ?? ''} onChange={change('state')} autoComplete="address-level1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Postal code" value={form.postalCode ?? ''} onChange={change('postalCode')} error={errors.postalCode} autoComplete="postal-code" />
        <Input label="Country"     value={form.country}          onChange={change('country')}    error={errors.country}    autoComplete="country-name" />
      </div>

      <Input
        label="Phone number"
        type="tel"
        value={form.phone}
        onChange={change('phone')}
        error={errors.phone}
        placeholder="+1 (555) 000-0000"
        autoComplete="tel"
      />

      <Button type="submit" variant="primary" size="lg" fullWidth>
        Continue to Review
      </Button>
    </form>
  );
}
