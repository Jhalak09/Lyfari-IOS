import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';

export default function RedirectHandlerScreen() {
  const { session, status } = useAuth();
  const navigation = useNavigation();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasRedirected) return;

    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      console.log('User authenticated, processing redirect...');
      setHasRedirected(true);

      const user = session.user;

      // Store backend JWT and user data
      if (session.backendJwt) {
        AsyncStorage.setItem('token', session.backendJwt);
        console.log('Backend JWT stored');
      }

      AsyncStorage.setItem('user', JSON.stringify(user));
      console.log('User data stored:', user);

      // Success toast
      Toast.show({
        type: 'success',
        text1: 'Google sign-in successful! 🎉',
        visibilityTime: 3000,
        position: 'top',
        topOffset: 50,
      });

      // Determine redirect path
      const hasProfile = user.hasProfile ?? false;
      const hasSoulTest = user.hasSoulTest ?? false;

      let redirectPath = 'ProfileSetup';
      let toastMessage = '';
      let toastIcon = '';

      if (!hasProfile) {
        redirectPath = 'ProfileSetup';
        toastMessage = 'Please complete your profile to continue your journey ✨';
        toastIcon = '📝';
      } else if (hasProfile && !hasSoulTest) {
        redirectPath = 'SoulTest';
        toastMessage = 'Take the SoulTest to discover your perfect emotional matches 💫';
        toastIcon = '🧠';
      } else if (hasProfile && hasSoulTest) {
        redirectPath = 'LyfariMain';
      }

      // Show guidance toast if needed
      if (toastMessage) {
        setTimeout(() => {
          Toast.show({
            type: 'info',
            text1: toastMessage,
            visibilityTime: 4000,
            position: 'top',
            topOffset: 50,
          });
        }, 1000);
      }

      // Final redirect with delay
      setTimeout(() => {
        console.log('Redirecting to:', redirectPath);
        navigation.replace(redirectPath);
      }, 1500);
    } else if (status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to signin');
      setHasRedirected(true);

      Toast.show({
        type: 'error',
        text1: 'Authentication failed. Please try again.',
        visibilityTime: 3000,
        position: 'top',
        topOffset: 50,
      });

      setTimeout(() => {
        navigation.replace('SignIn');
      }, 1000);
    }
  }, [session, status, navigation, hasRedirected]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6b21a8" style={styles.spinner} />
      <Text style={styles.title}>Completing sign-in...</Text>
      <Text style={styles.subtitle}>Please wait while we set up your session</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
});
