import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';
import { useAuth } from '../auth/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

export default function SignUpScreen() {
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
      const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        if (result.requiresVerification) {
          setVerificationRequired(true);
          setUserEmail(formData.email);
          Toast.show({
            type: 'success',
            text1: '📧 Verification email sent! Please check your inbox.',
            position: 'top',
            visibilityTime: 6000,
            topOffset: 50,
          });
        } else {
          Toast.show({
            type: 'success',
            text1: result.message,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 50,
          });

          if (result.data?.access_token) {
            await AsyncStorage.setItem('token', result.data.access_token);
            await AsyncStorage.setItem('user', JSON.stringify(result.data.user));
            setTimeout(() => navigation.navigate('ProfileSetup'), 1500);
          }
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

  const handleResendVerification = async () => {
    setFormLoading(true);
    try {
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        }
      );
      const result = await response.json();

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Verification email resent successfully! 📧',
          position: 'top',
          visibilityTime: 4000,
          topOffset: 50,
        });
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
        text1: 'Failed to resend email. Please try again.',
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
        navigation.navigate('RedirectHandler');
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
        <Text style={styles.loadingText}>Lyfari</Text>
      </View>
    );
  }

  return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
    
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* Gradient Background */}
      <LinearGradient
        colors={['#000000', '#1e1b4b', '#000000']}
        locations={[0.3, 0.5, 0.75]}
        style={styles.gradientBackground}
      />

      {/* Background Image with Blur */}
      <View style={styles.backgroundImageContainer}>
        <Image
          source={require('../assets/sign-bg.png')}
          style={styles.backgroundImage}
          blurRadius={10}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Glass Card */}
        <View style={styles.glassCard}>
          {/* Logo and Header */}
          <View style={styles.header}>
            <Image
              source={require('../assets/LYFARI-INFINITY-LOGO.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>
              {verificationRequired ? 'Check Your Email' : 'Sign Up'}
            </Text>
            <Text style={styles.subtitle}>
              {verificationRequired
                ? 'We sent you a verification link'
                : 'Begin your soulful journey.'}
            </Text>
          </View>

          {/* Verification Required UI */}
          {verificationRequired ? (
            <View style={styles.verificationContainer}>
              {/* Verification Box */}
              <View style={styles.verificationBox}>
                <Text style={styles.emailIcon}>📧</Text>
                <Text style={styles.verificationLabel}>
                  We've sent a verification email to:
                </Text>
                <Text style={styles.verificationEmail}>{userEmail}</Text>
                <Text style={styles.verificationInstructions}>
                  Click the link in your email to verify your account and complete
                  registration.
                </Text>
              </View>

              {/* Resend Button */}
              <TouchableOpacity
                onPress={handleResendVerification}
                disabled={formLoading}
                style={[styles.resendButton, formLoading && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                {formLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#f3f4f6" size="small" style={styles.spinner} />
                    <Text style={styles.resendButtonText}>Resending...</Text>
                  </View>
                ) : (
                  <Text style={styles.resendButtonText}>Resend Verification Email</Text>
                )}
              </TouchableOpacity>

              {/* Help Text */}
              <Text style={styles.helpText}>
                Didn't receive the email? Check your spam folder or try resending.
              </Text>

              {/* Wrong Email Link */}
              <View style={styles.wrongEmailContainer}>
                <Text style={styles.wrongEmailText}>Wrong email? </Text>
                <TouchableOpacity
                  onPress={() => {
                    setVerificationRequired(false);
                    setFormData({ name: '', email: '', password: '' });
                  }}
                >
                  <Text style={styles.wrongEmailLink}>Try again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Normal Signup Form */
            <View style={styles.form}>
              {/* Name Input */}
              <TextInput
                placeholder="Your Name"
                value={formData.name}
                onChangeText={text => handleInputChange('name', text)}
                style={styles.input}
                autoCapitalize="words"
                placeholderTextColor="#9ca3af"
                editable={!formLoading}
              />

              {/* Email Input */}
              <TextInput
                placeholder="Email"
                value={formData.email}
                onChangeText={text => handleInputChange('email', text)}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                editable={!formLoading}
              />

              {/* Password Input */}
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={text => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                  placeholderTextColor="#9ca3af"
                  editable={!formLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={formLoading}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={formLoading}
                style={[styles.signUpButton, formLoading && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                {formLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#000" size="small" style={styles.spinner} />
                    <Text style={styles.signUpButtonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isSigningIn || formLoading}
                style={[
                  styles.googleButton,
                  (isSigningIn || formLoading) && styles.buttonDisabled,
                ]}
                activeOpacity={0.8}
              >
                {isSigningIn ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <Image
                      source={require('../assets/google-icon.png')}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Sign In Link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('SignIn')}
                style={styles.signInContainer}
              >
                <Text style={styles.signInText}>
                  Already have an account?{' '}
                  <Text style={styles.signInLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Quote */}
          <Text style={styles.footerQuote}>
            "Let your frequency find its match in the cosmic dance."
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },

  // Background
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Glass Card
  glassCard: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 50,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f3f4f6',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 4,
  },

  // Form
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    color: '#f3f4f6',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },

  // Password
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
  },

  // Sign Up Button
  signUpButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 12,
  },
  signUpButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#6b7280',
    opacity: 0.4,
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9ca3af',
    fontWeight: '500',
    fontSize: 14,
  },

  // Google Button
  googleButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },

  // Sign In Link
  signInContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signInText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  signInLink: {
    color: '#818cf8',
    textDecorationLine: 'underline',
  },

  // Footer Quote
  footerQuote: {
    marginTop: 24,
    fontStyle: 'italic',
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 12,
  },

  // Verification UI - Matches: bg-blue-500/10 border border-blue-500/30 rounded-lg p-4
  verificationContainer: {
    width: '100%',
    alignItems: 'center',
  },
  verificationBox: {
    width: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // bg-blue-500/10
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)', // border-blue-500/30
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  emailIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  verificationLabel: {
    color: '#d1d5db', // text-gray-300
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationEmail: {
    color: '#818cf8', // text-indigo-400
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  verificationInstructions: {
    color: '#9ca3af', // text-gray-400
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },

  // Resend Button - Matches: bg-white/10 hover:bg-white/20 text-gray-100 border border-gray-600
  resendButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 16,
  },
  resendButtonText: {
    color: '#f3f4f6',
    fontWeight: '600',
    fontSize: 16,
  },

  // Help Text
  helpText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },

  // Wrong Email Link
  wrongEmailContainer: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
  },
  wrongEmailText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  wrongEmailLink: {
    color: '#818cf8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
