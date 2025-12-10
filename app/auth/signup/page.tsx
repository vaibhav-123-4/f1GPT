'use client';

import Image from "next/image";
import f1GPT from "../../assets/f1GPT.png";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Attempting signup with:", { email, fullName });
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log("📝 Signup response:", { data, error: signUpError });

      if (signUpError) {
        console.error("❌ Supabase error:", signUpError);
        throw signUpError;
      }

      if (data?.user) {
        console.log("✅ User created:", data.user.id);
        console.log("📊 User data:", data);
        
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          // Email already exists
          setError("This email is already registered. Please sign in instead.");
          setLoading(false);
          return;
        }
        
        // Success! User created
        setSuccess(true);
        console.log("✅ Signup successful!");
        
        // Always redirect to signin page after 2 seconds
        setTimeout(() => {
          console.log("🔄 Redirecting to signin...");
          window.location.href = '/auth/signin';
        }, 2000);
      } else {
        throw new Error("No user data returned from signup");
      }
    } catch (err: any) {
      console.error("❌ Signup error:", err);
      setError(err.message || "Failed to sign up");
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Image src={f1GPT} width={180} alt="F1GPT" />
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-description">Join F1GPT and blast-start your Formula 1 journey at full throttle!</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Account Created Successfully! 🎉</h2>
            <p>Welcome to F1GPT, {fullName}! 🏎️</p>
            <p className="redirect-info">
              Redirecting you to sign in page in 2 seconds...
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignUp} className="auth-form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>

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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-input"
                />
              </div>

              <button 
                type="submit" 
                className="auth-submit-button"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <a href="/auth/signin">Sign In</a></p>
            </div>
          </>
        )}

        <a href="/" className="back-home-link">← Back to Home</a>
      </div>
    </div>
  );
}
