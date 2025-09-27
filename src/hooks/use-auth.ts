import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'user';

interface AuthUser extends User {
  role?: UserRole;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Fetch role separately after setting user
          try {
            const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
            setUser({
              ...session.user,
              role: (roleData as UserRole) || 'user'
            });
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUser({
              ...session.user,
              role: 'user'
            });
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        try {
          const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
          setUser({
            ...session.user,
            role: (roleData as UserRole) || 'user'
          });
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUser({
            ...session.user,
            role: 'user'
          });
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const isAdmin = () => user?.role === 'admin';

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };
};