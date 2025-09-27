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
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Set user with default role first to prevent loading issues
          setUser({
            ...session.user,
            role: 'user' // Will be updated after component mounts
          });
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        setUser({
          ...session.user,
          role: 'user' // Will be updated after component mounts
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Separate effect to fetch and update user role after auth is established
  useEffect(() => {
    if (user?.id) {
      const fetchRole = async () => {
        try {
          console.log('Fetching role for user:', user.id);
          const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
          console.log('Role fetched:', roleData, 'current user role:', user.role);
          if (roleData && roleData !== user.role) {
            console.log('Updating user role from', user.role, 'to', roleData);
            setUser(prev => prev ? { ...prev, role: roleData as UserRole } : null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      };
      
      fetchRole();
    }
  }, [user?.id]);

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