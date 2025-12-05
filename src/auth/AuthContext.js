import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [backendJwt, setBackendJwt] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading', 'authenticated', 'unauthenticated'
  const [session, setSession] = useState(null);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    initializeAuth();
    configureGoogleSignIn();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // src/auth/AuthContext.js

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_CLIENT_ID, // Web Client ID (for backend)
      offlineAccess: true,
      forceCodeForRefreshToken: true, // ✅ ADD THIS
    });
  };

  // NEW: Refresh access token using refresh token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.log('No refresh token found, logging out...');
        await signOut();
        return false;
      }

      const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        const newAccessToken = data.accessToken;

        setToken(newAccessToken);
        setBackendJwt(newAccessToken);
        await AsyncStorage.setItem('token', newAccessToken);

        // Token expiry is 24 hours from now
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        await AsyncStorage.setItem('tokenExpiry', expiryDate.toISOString());

        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }

        console.log('Access token refreshed successfully');
        scheduleTokenRefresh();
        return true;
      } else {
        console.error('Token refresh failed:', data);
        await signOut();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await signOut();
      return false;
    }
  };

  // NEW: Schedule automatic token refresh 5 minutes before expiry
  const scheduleTokenRefresh = async () => {
    try {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
      if (tokenExpiry) {
        const expiryDate = new Date(tokenExpiry);
        const currentDate = new Date();
        const timeUntilExpiry = expiryDate.getTime() - currentDate.getTime();

        // Refresh 5 minutes before expiry
        const refreshTime = timeUntilExpiry - (5 * 60 * 1000);

        if (refreshTime > 0) {
          refreshTimerRef.current = setTimeout(() => {
            refreshAccessToken();
          }, refreshTime);
          console.log('Token refresh scheduled in', Math.round(refreshTime / 1000 / 60), 'minutes');
        } else if (timeUntilExpiry > 0) {
          await refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');

      if (savedToken && savedUser && refreshToken) {
        // Check if token is still valid
        if (tokenExpiry) {
          const expiryDate = new Date(tokenExpiry);
          const currentDate = new Date();

          if (currentDate >= expiryDate) {
            console.log('Token expired, attempting refresh...');
            const refreshed = await refreshAccessToken();
            if (!refreshed) return;
          }
        }

        setToken(savedToken);
        setBackendJwt(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setSession({
          user: parsedUser,
          backendJwt: savedToken,
        });
        setStatus('authenticated');
        scheduleTokenRefresh();
      } else {
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setStatus('unauthenticated');
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Calling backend for user registration/login...');

      // Call backend to register/login user with Google credentials
      const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.data.user.email,
          name: userInfo.data.user.name,
          image: userInfo.data.user.photo,
        }),
      });

      const backendData = await response.json();
      console.log('Backend response:', backendData);

      if (response.ok && backendData.jwt && backendData.userId) {
        const jwt = backendData.jwt;
        const userData = backendData.user;

        setBackendJwt(jwt);
        setToken(jwt);
        setUser(userData);

        await AsyncStorage.setItem('token', jwt);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        // NEW: Store refresh token and expiry
        if (backendData.refreshToken) {
          await AsyncStorage.setItem('refreshToken', backendData.refreshToken);
        }
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        await AsyncStorage.setItem('tokenExpiry', expiryDate.toISOString());

        setSession({
          user: {
            ...userData,
            hasProfile: userData.hasProfile || false,
            hasSoulTest: userData.hasSoulTest || false,
            isProfileComplete: userData.isProfileComplete || false,
            needsProfileSetup: userData.needsProfileSetup !== undefined ? userData.needsProfileSetup : true,
          },
          backendJwt: jwt,
          userId: backendData.userId,
          message: backendData.message,
        });
        setStatus('authenticated');

        // NEW: Schedule token refresh
        scheduleTokenRefresh();

        return { success: true, session: { user: userData, backendJwt: jwt } };
      } else {
        console.error('Backend authentication failed:', backendData);
        setStatus('unauthenticated');
        return { success: false, message: backendData.message || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setStatus('unauthenticated');
      return { success: false, message: 'Google Sign-In failed. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('tokenExpiry');

      await GoogleSignin.signOut();
      setUser(null);
      setToken(null);
      setBackendJwt(null);
      setSession(null);
      setStatus('unauthenticated');

      Toast.show({
        type: 'success',
        text1: 'Signed out successfully',
        position: 'top',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign-out failed. Please try again.',
        position: 'top',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        backendJwt,
        status,
        session,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
