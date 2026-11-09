import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { authService, LogoutResult } from '../services/auth';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { queryClient } from '../lib/queryClient';
import { onlineManager } from '@tanstack/react-query';
import { ANNOUNCEMENTS_QUERY_KEYS } from '../queries/useAnnouncementsQueries';

const CACHED_PROFILE_KEY = 'user_cached_profile_v1';
const getUserProfileKey = (userId: string) => `user_cached_profile_${userId}`;

export type AuthStatus =
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated'
  | 'refreshing'
  | 'error';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  authStatus: AuthStatus;
  authError: string | null;
  isAuthenticated: boolean;
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
  const [authStatus, setAuthStatus] = useState<AuthStatus>('restoring');
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const lastUserIdRef = useRef<string | null>(null);
  const fetchingUserIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // Background fetch for user profile without blocking app startup / splash screen
  const fetchProfileInBackground = useCallback(async (userId: string) => {
    if (fetchingUserIdRef.current === userId) return;
    if (!onlineManager.isOnline()) return;

    fetchingUserIdRef.current = userId;

    try {
      const userProfile = await authService.fetchCurrentUserProfile(userId);
      if (userProfile) {
        if (userProfile.is_blocked) {
          await authService.logout({ scope: 'local' });
          Alert.alert(
            'Account Blocked',
            'Your account has been blocked by the administrator. Please contact support.',
            [{ text: 'OK' }]
          );
          setProfile(null);
          setUser(null);
          setSession(null);
          setAuthStatus('unauthenticated');
          lastUserIdRef.current = null;
          await AsyncStorage.removeItem(getUserProfileKey(userId)).catch(() => {});
          await AsyncStorage.removeItem(CACHED_PROFILE_KEY).catch(() => {});
          return;
        }
        setProfile(userProfile);
        lastUserIdRef.current = userId;
        await AsyncStorage.setItem(getUserProfileKey(userId), JSON.stringify(userProfile)).catch(() => {});
        await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(userProfile)).catch(() => {});
      }
    } catch {
      // Offline / network failure: keep the cached profile without breaking the UI
      console.log('[AuthContext] Background profile sync skipped (offline or network error)');
    } finally {
      if (fetchingUserIdRef.current === userId) {
        fetchingUserIdRef.current = null;
      }
    }
  }, []);

  // Loads user-scoped cached profile from AsyncStorage
  const loadCachedProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const userKey = getUserProfileKey(userId);
      let raw = await AsyncStorage.getItem(userKey);
      if (!raw) {
        // Fallback check legacy key if it matches this user
        raw = await AsyncStorage.getItem(CACHED_PROFILE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.id === userId) {
          return parsed as Profile;
        }
      }
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Listen for Supabase auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[AuthContext] Supabase Auth state changed: ${event}`);

      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !currentSession) {
        lastUserIdRef.current = null;
        fetchingUserIdRef.current = null;
        setUser(null);
        setSession(null);
        setProfile(null);
        setAuthStatus('unauthenticated');
        setAuthError(null);
        return;
      }

      if (currentSession) {
        const currentUid = currentSession.user.id;
        setUser(currentSession.user);
        setSession(currentSession);
        setAuthStatus('authenticated');
        setAuthError(null);

        // Load user-scoped cached profile immediately to prevent UI flicker
        if (currentUid !== lastUserIdRef.current) {
          const cached = await loadCachedProfile(currentUid);
          if (mounted && cached) {
            setProfile(cached);
          }
          if (mounted && onlineManager.isOnline()) {
            setTimeout(() => {
              fetchProfileInBackground(currentUid);
            }, 0);
          }
        }
      }
    });

    // 2. Initial session restoration and validation
    const restoreSession = async () => {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] getSession error:', error.message);
          if (mounted) {
            setAuthStatus('unauthenticated');
            setUser(null);
            setSession(null);
            setProfile(null);
          }
          return;
        }

        const initialSession = data?.session;
        if (!initialSession) {
          if (mounted) {
            setAuthStatus('unauthenticated');
            setUser(null);
            setSession(null);
            setProfile(null);
          }
          return;
        }

        const isExpired = authService.isSessionExpired(initialSession);
        const isOnline = onlineManager.isOnline();

        if (isExpired) {
          if (isOnline) {
            if (mounted) setAuthStatus('refreshing');
            try {
              const refreshed = await authService.refreshSession();
              if (refreshed && mounted) {
                setUser(refreshed.user);
                setSession(refreshed);
                setAuthStatus('authenticated');
                const cached = await loadCachedProfile(refreshed.user.id);
                if (cached && mounted) setProfile(cached);
                fetchProfileInBackground(refreshed.user.id);
              } else if (mounted) {
                setAuthStatus('unauthenticated');
                setUser(null);
                setSession(null);
                setProfile(null);
              }
            } catch {
              if (mounted) {
                setAuthStatus('unauthenticated');
                setUser(null);
                setSession(null);
                setProfile(null);
              }
            }
          } else {
            // Expired + Offline: Never falsely claim authenticated with invalid server session
            console.warn('[AuthContext] Session expired and device offline. Cannot validate session.');
            if (mounted) {
              setAuthStatus('unauthenticated');
              setUser(null);
              setSession(null);
              setProfile(null);
            }
          }
        } else {
          // Valid active session (either online or offline)
          if (mounted) {
            setUser(initialSession.user);
            setSession(initialSession);
            setAuthStatus('authenticated');
            const cached = await loadCachedProfile(initialSession.user.id);
            if (cached && mounted) setProfile(cached);
            if (isOnline) {
              fetchProfileInBackground(initialSession.user.id);
            }
          }
        }
      } catch (err: any) {
        console.warn('[AuthContext] Session restoration failed:', err);
        if (mounted) {
          setAuthStatus('unauthenticated');
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileInBackground, loadCachedProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(email, password);
      return data;
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata: { name: string; phone: string; }) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const data = await authService.signUp(email, password, metadata);
      return data;
    } catch (err: any) {
      setAuthError(err?.message || 'Sign up failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const fetchCurrentUserProfile = useCallback(async (userId: string) => {
    return await authService.fetchCurrentUserProfile(userId);
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: { name?: string; phone?: string; }) => {
    setActionLoading(true);
    try {
      const data = await authService.updateProfile(userId, updates);
      setProfile(data);
      if (user?.id) {
        await AsyncStorage.setItem(getUserProfileKey(user.id), JSON.stringify(data)).catch(() => {});
        await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(data)).catch(() => {});
      }
      return data;
    } finally {
      setActionLoading(false);
    }
  }, [user?.id]);

  const updateUserMetadata = useCallback(async (metadata: { name?: string; phone?: string; }) => {
    setActionLoading(true);
    try {
      const data = await authService.updateUserMetadata(metadata);
      if (data.user) {
        const updatedProfile = await authService.fetchCurrentUserProfile(data.user.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
          await AsyncStorage.setItem(getUserProfileKey(data.user.id), JSON.stringify(updatedProfile)).catch(() => {});
          await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
        }
      }
      setUser(data.user);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const logout = useCallback(async (options?: { scope?: 'global' | 'local' }): Promise<LogoutResult> => {
    setActionLoading(true);
    const currentUserId = user?.id;

    try {
      const result = await authService.logout(options);

      // 1. Remove user-specific storage keys
      if (currentUserId) {
        await AsyncStorage.removeItem(getUserProfileKey(currentUserId)).catch(() => {});
      }
      await AsyncStorage.removeItem(CACHED_PROFILE_KEY).catch(() => {});

      // 2. Selectively purge private/user-scoped TanStack Query caches
      // PUBLIC DATA (mosques, prayerTimes, public hadith/announcements) IS PRESERVED
      queryClient.removeQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEYS.categories });
      queryClient.removeQueries({ queryKey: ['admin'] });
      queryClient.removeQueries({ queryKey: ['user'] });
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.removeQueries({ queryKey: ['worshipers'] });

      // Cancel in-flight private queries
      queryClient.cancelQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEYS.categories });

      // 3. Clear in-memory auth state
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthStatus('unauthenticated');
      setAuthError(null);
      lastUserIdRef.current = null;
      fetchingUserIdRef.current = null;

      return result;
    } finally {
      setActionLoading(false);
    }
  }, [user?.id]);

  const forgotPassword = useCallback(async (email: string) => {
    setActionLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const authLoading = authStatus === 'restoring';
  const isAuthenticated = Boolean(user && session && authStatus === 'authenticated');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        authStatus,
        authError,
        isAuthenticated,
        authLoading,
        actionLoading,
        loading: authLoading, // Backward compatibility alias
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
