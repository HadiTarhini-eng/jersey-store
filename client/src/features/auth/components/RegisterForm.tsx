import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { validate, validators } from '../../../utils/validators';

export function RegisterForm() {
  const { register, loading, error, clearError } = useAuth();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [showPass, setShowPass] = useState(false);

  const change = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors = {
      firstName:       validate(form.firstName,       [validators.required, validators.minLength(2)]),
      lastName:        validate(form.lastName,        [validators.required, validators.minLength(2)]),
      email:           validate(form.email,           [validators.required, validators.email]),
      phone:           validate(form.phone,           [validators.required, validators.minLength(7)]),
      password:        validate(form.password,        [validators.required, validators.password]),
      confirmPassword: validate(form.confirmPassword, [validators.required, validators.matchPassword(form.password)]),
    };

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    await register(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          value={form.firstName}
          onChange={change('firstName')}
          error={errors.firstName}
          placeholder="John"
          autoComplete="given-name"
        />
        <Input
          label="Last name"
          value={form.lastName}
          onChange={change('lastName')}
          error={errors.lastName}
          placeholder="Doe"
          autoComplete="family-name"
        />
      </div>

      <Input
        label="Email address"
        type="email"
        value={form.email}
        onChange={change('email')}
        error={errors.email}
        placeholder="you@example.com"
        autoComplete="email"
      />

      <Input
        label="Phone number"
        value={form.phone}
        onChange={change('phone')}
        error={errors.phone}
        placeholder="+1 555 123 4567"
        autoComplete="tel"
      />

      <Input
        label="Password"
        type={showPass ? 'text' : 'password'}
        value={form.password}
        onChange={change('password')}
        error={errors.password}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        hint="At least 8 characters"
        rightIcon={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass((v) => !v)}
            className="text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        }
      />

      <Input
        label="Confirm password"
        type={showPass ? 'text' : 'password'}
        value={form.confirmPassword}
        onChange={change('confirmPassword')}
        error={errors.confirmPassword}
        placeholder="Repeat your password"
        autoComplete="new-password"
      />

      <Button type="submit" loading={loading} fullWidth className="mt-2">
        Create Account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
