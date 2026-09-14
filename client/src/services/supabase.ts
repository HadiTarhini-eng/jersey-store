/**
 * The app's single Supabase client — Supabase Auth is the source of truth for
 * authentication (signup, email verification, sessions, password reset).
 *
 * Only the anon/publishable key is used here; it is designed to be public and
 * is scoped by the project's RLS policies. The service-role key must never
 * appear in client code.
 *
 * PKCE is the flow used for every email link. With the default email templates
 * ({{ .ConfirmationURL }}) Supabase verifies the link server-side, then
 * redirects to /auth/callback?code=… — and that code can only be exchanged by
 * the browser holding the PKCE verifier, i.e. the one that started the flow.
 * The exchange is done explicitly by the callback page (not automatically) so a
 * failed exchange is reported instead of swallowed.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType:           'pkce',
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: false,
    storageKey:         'js_auth',
  },
});

/**
 * Absolute URL Supabase redirects to after an email link is clicked.
 * Derived from the running origin so localhost and the production domain both
 * work without a build-time switch. Both must be listed as Redirect URLs in
 * the Supabase dashboard.
 */
export const authCallbackUrl = () => `${window.location.origin}/auth/callback`;
