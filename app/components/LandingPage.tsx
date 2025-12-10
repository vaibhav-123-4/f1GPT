'use client';

import Image from "next/image";
import f1GPT from "../assets/f1GPT.png";
import { useState } from "react";

export default function LandingPage() {
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="logo-container-landing">
          <Image src={f1GPT} width={320} alt="F1GPT" priority />
          <h1 className="landing-title">F1GPT</h1>
          <p className="landing-subtitle">Your AI-Powered Formula 1 Expert</p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">🏎️</div>
            <h3>Real-time F1 Knowledge</h3>
            <p>Get instant answers about races, drivers, teams, and statistics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Intelligent Conversations</h3>
            <p>Powered by advanced AI with deep F1 expertise</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Save Chat History</h3>
            <p>Access your previous conversations anytime, anywhere</p>
          </div>
        </div>

        {!showAuthOptions ? (
          <div className="landing-cta">
            <button 
              className="cta-button primary"
              onClick={() => setShowAuthOptions(true)}
            >
              Get Started
            </button>
            <p className="landing-info">Free to use • For passionate F1 fans only</p>
          </div>
        ) : (
          <div className="auth-options-container">
            <h2 className="auth-options-title">Choose your sign-in method</h2>
            <div className="auth-options">
              <a href="/auth/signup" className="auth-option-card">
                <div className="auth-option-icon">📧</div>
                <h3>Email & Password</h3>
                <p>Create an account with your email</p>
              </a>
              <button 
                className="auth-option-card clickable"
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client');
                  const supabase = createClient();
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                }}
              >
                <div className="auth-option-icon google-logo">
                  <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                </div>
                <h3>Google</h3>
                <p>Sign in with your Google account</p>
              </button>
            </div>
            <button 
              className="back-button"
              onClick={() => setShowAuthOptions(false)}
            >
              ← Back
            </button>
          </div>
        )}
      </div>

      <div className="landing-footer">
        <p>🖤 Built with love for F1 by Vaibhav 🏎️💀
— Warning: May cause speed addiction.</p>
      </div>
    </div>
  );
}
