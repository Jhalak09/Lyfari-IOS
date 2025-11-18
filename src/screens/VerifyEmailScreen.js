import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const token = route.params?.token;

  const verifyEmail = useCallback(async (verificationToken) => {
    try {
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/auth/verify-email?token=${verificationToken}`
      );
      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        Toast.show({
          type: 'success',
          text1: result.message,
          visibilityTime: 4000,
          position: 'top',
          topOffset: 50,
        });

        if (result.data?.access_token) {
          await AsyncStorage.setItem('token', result.data.access_token);
          await AsyncStorage.setItem('user', JSON.stringify(result.data.user));

          setTimeout(() => {
            navigation.replace('ProfileSetup');
          }, 3000);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: result.message,
          visibilityTime: 6000,
          position: 'top',
          topOffset: 50,
        });
        setTimeout(() => {
          navigation.navigate('SignUp');
        }, 4000);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Verification failed. Please try again.',
        visibilityTime: 4000,
        position: 'top',
        topOffset: 50,
      });
      setTimeout(() => {
        navigation.navigate('SignUp');
      }, 4000);
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid verification link',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 3000);
    }
  }, [token, navigation, verifyEmail]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6b21a8" style={styles.spinner} />
        <Text style={styles.title}>Verifying your email...</Text>
        <Text style={styles.subtitle}>Please wait while we confirm your account...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {success ? (
        <>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>
            Your account has been successfully verified.{'\n'}
            Redirecting you to complete your profile...
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.errorIcon}>✗</Text>
          <Text style={styles.title}>Verification Failed</Text>
          <Text style={styles.subtitle}>
            The verification link is invalid or has expired.{'\n'}
            Redirecting you to sign up again...
          </Text>
        </>
      )}
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
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#10b981',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 64,
    color: '#ef4444',
    marginBottom: 16,
  },
});
