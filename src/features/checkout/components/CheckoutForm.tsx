import { useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setShippingAddress } from '../checkoutSlice';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { validate, validators } from '../../../utils/validators';
import type { ShippingAddress } from '../../../types';

type FormErrors = Partial<Record<keyof ShippingAddress, string>>;

const emptyAddress: ShippingAddress = {
  firstName: '', lastName: '', address: '',
  city: '', state: '', postalCode: '', country: '', phone: '',
};

export function CheckoutForm() {
  const dispatch = useAppDispatch();
  const user     = useAppSelector((s) => s.auth.user);

  const [form, setForm] = useState<ShippingAddress>({
    ...emptyAddress,
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const change =
    (field: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {
      firstName:  validate(form.firstName,  [validators.required, validators.minLength(2)]),
      lastName:   validate(form.lastName,   [validators.required, validators.minLength(2)]),
      address:    validate(form.address,    [validators.required]),
      city:       validate(form.city,       [validators.required]),
      state:      validate(form.state,      [validators.required]),
      postalCode: validate(form.postalCode, [validators.required, validators.postalCode]),
      country:    validate(form.country,    [validators.required]),
      phone:      validate(form.phone,      [validators.required, validators.phone]),
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

      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" value={form.firstName} onChange={change('firstName')} error={errors.firstName} autoComplete="given-name" />
        <Input label="Last name"  value={form.lastName}  onChange={change('lastName')}  error={errors.lastName}  autoComplete="family-name" />
      </div>

      <Input
        label="Street address"
        value={form.address}
        onChange={change('address')}
        error={errors.address}
        placeholder="123 Main Street, Apt 4B"
        autoComplete="street-address"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input label="City"  value={form.city}  onChange={change('city')}  error={errors.city}  autoComplete="address-level2" />
        <Input label="State" value={form.state} onChange={change('state')} error={errors.state} autoComplete="address-level1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Postal code" value={form.postalCode} onChange={change('postalCode')} error={errors.postalCode} autoComplete="postal-code" />
        <Input label="Country"     value={form.country}    onChange={change('country')}    error={errors.country}    autoComplete="country-name" />
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
