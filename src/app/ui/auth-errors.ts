/** Turn Supabase auth errors into plain guidance a first-time user can act on. */
export function authMessage(error: unknown, fallback: string): string {
  const e = (error ?? {}) as { code?: string; message?: string; status?: number; name?: string };
  const code = e.code ?? '';
  const text = (e.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || text.includes('invalid login')) return 'That email and password don’t match. Check them, or choose Forgot password.';
  if (code === 'user_already_exists' || code === 'email_exists' || text.includes('already registered')) return 'An account already uses this email. Sign in instead, or reset your password.';
  if (code === 'weak_password' || text.includes('password should')) return 'Choose a stronger password with at least 6 characters.';
  if (code.startsWith('over_') || text.includes('rate limit') || e.status === 429) return 'Too many attempts. Wait a minute, then try again.';
  if (code === 'email_address_invalid' || (text.includes('email') && text.includes('invalid'))) return 'Enter a valid email address.';
  if (code === 'signup_disabled') return 'New accounts are paused right now. Please try again later.';
  if (e.name === 'AuthRetryableFetchError' || text.includes('fetch') || text.includes('network') || e.status === 0) return 'You seem to be offline. Check your connection and try again.';
  return fallback;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
