import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';
import { useAuth } from '../auth/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

export default function SignInScreen() {
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSigningIn, setIsSigningIn] = useState(false);

  const navigation = useNavigation();
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    try {
      const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Welcome back to Lyfari! 🎉',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 50,
        });

        if (result.data?.access_token) {
          await AsyncStorage.setItem('token', result.data.access_token);
          await AsyncStorage.setItem('user', JSON.stringify(result.data.user));

          const user = result.data.user;
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

          if (toastMessage) {
            setTimeout(() => {
              Toast.show({
                type: 'info',
                text1: toastMessage,
                position: 'top',
                visibilityTime: 4000,
                topOffset: 50,
              });
            }, 1000);
          }

          setTimeout(() => {
            navigation.replace(redirectPath);
          }, 1500);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: result.message,
          position: 'top',
          visibilityTime: 4000,
          topOffset: 50,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Network error. Please check your connection and try again.',
        position: 'top',
        visibilityTime: 4000,
        topOffset: 50,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        navigation.navigate(' ');
      } else {
        Toast.show({
          type: 'error',
          text1: result.message || 'Google Sign-In failed',
          position: 'top',
          visibilityTime: 4000,
          topOffset: 50,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In failed. Please try again.',
        position: 'top',
        visibilityTime: 4000,
        topOffset: 50,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6b21a8" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Continue your soulful journey.</Text>

        <TextInput
          placeholder="Email"
          value={formData.email}
          onChangeText={text => handleInputChange('email', text)}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            value={formData.password}
            onChangeText={text => handleInputChange('password', text)}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={formLoading}
          style={[styles.button, formLoading && styles.buttonDisabled]}
        >
          {formLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isSigningIn}
          style={[styles.googleButton, isSigningIn && styles.buttonDisabled]}
        >
          {isSigningIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.footerQuote}>
          Let your frequency find its match in the cosmic dance.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    width: '100%',
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    padding: 10,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orText: {
    marginVertical: 20,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#ea4335',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  linkText: {
    color: '#3b82f6',
    marginTop: 24,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14,
  },
  footerQuote: {
    marginTop: 40,
    fontStyle: 'italic',
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 13,
  },
});
