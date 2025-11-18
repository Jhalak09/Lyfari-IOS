import React, { createContext, useState, useEffect, useContext } from 'react';
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

  useEffect(() => {
    initializeAuth();
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });
  };

  const initializeAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setBackendJwt(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setSession({
          user: parsedUser,
          backendJwt: savedToken,
        });
        setStatus('authenticated');
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
          email: userInfo.user.email,
          name: userInfo.user.name,
          image: userInfo.user.photo,
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
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
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
