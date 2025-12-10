'use client';

export default function SignOutButton() {
  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <button onClick={handleSignOut} className="auth-button signout-button">
      Sign Out
    </button>
  );
}
