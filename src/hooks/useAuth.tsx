import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'sales' | 'manager' | 'admin';
  assigned_by: string | null;
  assigned_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: 'sales' | 'manager' | 'admin' | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  hasRole: (role: 'sales' | 'manager' | 'admin') => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<'sales' | 'manager' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile and role fetching with setTimeout
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
          fetchUserRole(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      if (data && data.length > 0) {
        const roleHierarchy = { admin: 3, manager: 2, sales: 1 };
        const sortedRoles = data.sort((a, b) => roleHierarchy[b.role] - roleHierarchy[a.role]);
        setUserRole(sortedRoles[0].role);
      } else {
        setUserRole('sales'); // Default role
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      return { data, error };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    } catch (error) {
      console.error('Email sign in error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      return { data, error };
    } catch (error) {
      console.error('Email sign up error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    return { error };
  };

  const hasRole = (role: 'sales' | 'manager' | 'admin'): boolean => {
    if (!userRole) return false;
    
    const roleHierarchy = { admin: 3, manager: 2, sales: 1 };
    const userRoleLevel = roleHierarchy[userRole];
    const requiredRoleLevel = roleHierarchy[role];
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const hasPermission = (permission: string): boolean => {
    if (!userRole) return false;
    
    const permissions = {
      sales: [
        'view_prospects',
        'create_prospects',
        'update_prospects',
        'view_own_data'
      ],
      manager: [
        'view_prospects',
        'create_prospects', 
        'update_prospects',
        'view_own_data',
        'assign_prospects',
        'manage_settings'
      ],
      admin: [
        'view_prospects',
        'create_prospects',
        'update_prospects',
        'view_own_data',
        'assign_prospects',
        'manage_sales_team',
        'view_team_data',
        'delete_prospects',
        'manage_users',
        'access_admin_panel',
        'manage_settings'
      ]
    };
    
    return permissions[userRole]?.includes(permission) || false;
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};