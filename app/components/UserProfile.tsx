'use client';

import { User } from '@supabase/supabase-js';
import SignOutButton from './SignOutButton';

interface UserProfileProps {
  user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="user-profile">
      <div className="user-info">
        {user.user_metadata?.avatar_url && (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="User avatar" 
            className="user-avatar"
          />
        )}
        <span className="user-name">
          {user.user_metadata?.full_name || user.email}
        </span>
      </div>
      <SignOutButton />
    </div>
  );
}
