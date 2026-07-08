import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { CacheService } from '../services/cacheService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authLoading: boolean;
  actionLoading: boolean;
  loading: boolean; // Alias for authLoading to preserve backward compatibility
  login: typeof authService.login;
  signUp: typeof authService.signUp;
  logout: typeof authService.logout;
  forgotPassword: typeof authService.forgotPassword;
  updateUserMetadata: typeof authService.updateUserMetadata;
  fetchCurrentUserProfile: typeof authService.fetchCurrentUserProfile;
  updateProfile: typeof authService.updateProfile;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const lastUserIdRef = useRef<string | null>(null);
  const fetchingUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`Supabase Auth state changed [${event}]`);
      if (currentSession) {
        const userId = currentSession.user.id;
        setUser(currentSession.user);
        setSession(currentSession);

        // Fetch profile if the user changed and we aren't already fetching it
        if (userId !== lastUserIdRef.current && userId !== fetchingUserIdRef.current) {
          fetchingUserIdRef.current = userId;
          try {
            const userProfile = await authService.fetchCurrentUserProfile(userId);
            if (userProfile?.is_blocked) {
              await authService.logout();
              Alert.alert(
                'Account Blocked',
                'Your account has been blocked by the administrator. Please contact support.',
                [{ text: 'OK' }]
              );
              setProfile(null);
              setUser(null);
              setSession(null);
              lastUserIdRef.current = null;
              return;
            }
            setProfile(userProfile);
            lastUserIdRef.current = userId;
          } catch (err) {
            console.error('Error fetching user profile on auth change:', err);
            setProfile(null);
          } finally {
            if (fetchingUserIdRef.current === userId) {
              fetchingUserIdRef.current = null;
            }
          }
        }
      } else {
        lastUserIdRef.current = null;
        fetchingUserIdRef.current = null;
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setActionLoading(true);
    try {
      const data = await authService.login(email, password);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata: { name: string; phone: string; cnic: string }) => {
    setActionLoading(true);
    try {
      const data = await authService.signUp(email, password, metadata);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const fetchCurrentUserProfile = useCallback(async (userId: string) => {
    return await authService.fetchCurrentUserProfile(userId);
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: { name?: string; phone?: string; cnic?: string }) => {
    setActionLoading(true);
    try {
      const data = await authService.updateProfile(userId, updates);
      setProfile(data);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateUserMetadata = useCallback(async (metadata: { name?: string; phone?: string; cnic?: string }) => {
    setActionLoading(true);
    try {
      const data = await authService.updateUserMetadata(metadata);
      if (data.user) {
        const updatedProfile = await authService.fetchCurrentUserProfile(data.user.id);
        setProfile(updatedProfile);
      }
      setUser(data.user);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setActionLoading(true);
    try {
      await authService.logout();
      // Instantly clear state to prevent rendering outdated views during redirection
      setUser(null);
      setSession(null);
      setProfile(null);
      lastUserIdRef.current = null;
      CacheService.clearAllCache();
    } finally {
      setActionLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setActionLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        authLoading,
        actionLoading,
        loading: authLoading, // Provide loading alias for backward compatibility
        login,
        signUp,
        logout,
        forgotPassword,
        updateUserMetadata,
        fetchCurrentUserProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
