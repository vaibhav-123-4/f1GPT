'use client';

export default function AuthError() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h1>Authentication Error</h1>
      <p>Sorry, we couldn&apos;t complete your sign-in. Please try again.</p>
      <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Return to Home
      </a>
    </div>
  );
}
