'use client';

import Image from "next/image";
import f1GPT from "../../assets/f1GPT.png";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("🔐 Attempting sign in with:", email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("📝 Sign in response:", { data, error: signInError });

      if (signInError) throw signInError;

      if (data?.user) {
        console.log("✅ Sign in successful, user:", data.user.id);
        router.push('/');
      }
    } catch (err: any) {
      console.error("❌ Sign in error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      
      alert("Password reset link sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Image src={f1GPT} width={180} alt="F1GPT" />
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-description">Sign in to continue your F1 journey</p>
        </div>

        <form onSubmit={handleSignIn} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <button 
            type="button"
            onClick={handleForgotPassword}
            className="forgot-password-link"
            disabled={loading}
          >
            Forgot password?
          </button>

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <a href="/auth/signup">Sign Up</a></p>
        </div>

        <a href="/" className="back-home-link">← Back to Home</a>
      </div>
    </div>
  );
}
