'use client';

import { createClient } from '@/lib/supabase/client';

export default function SignInButton() {
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button onClick={handleSignIn} className="auth-button signin-button">
      Sign in with Google
    </button>
  );
}
