import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

/**
 * Check if valid Supabase client configuration is provided
 */
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    supabasePublishableKey &&
    !supabasePublishableKey.includes('placeholder') &&
    !supabasePublishableKey.includes('your_supabase')
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    '[Supabase Auth] Missing or incomplete frontend Supabase credentials. ' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your client environment.'
  );
}

/**
 * Reusable Supabase client instance for frontend authentication & storage
 * Configured with auto-refresh, session persistence, and URL hash detection
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'edutalentx-supabase-auth-token',
    },
  }
);

export default supabase;
