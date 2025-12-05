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


export default function SignInScreen() {
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSigningIn, setIsSigningIn] = useState(false);


  const navigation = useNavigation();
  const { signInWithGoogle, status } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // NEW: Skip SignIn screen if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      navigation.replace('Lyfari');
    }
  }, [status, navigation]);


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

          // NEW: Store refresh token and expiry
          if (result.data?.refresh_token) {
            await AsyncStorage.setItem('refreshToken', result.data.refresh_token);
          }
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 24);
          await AsyncStorage.setItem('tokenExpiry', expiryDate.toISOString());


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
            redirectPath = 'Lyfari';
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
  navigation.reset({
    index: 0,
    routes: [{ name: redirectPath }],
  });
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
      console.error('Sign-In Error:', error);
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
        navigation.replace('Lyfari');
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
      
      {/* Gradient Background - Matches: from-black via-indigo-950 to-black */}
      <LinearGradient
        colors={['#000000', '#1e1b4b', '#000000']}
        locations={[0.3, 0.5, 0.75]}
        style={styles.gradientBackground}
      />


      {/* Background Image with Blur */}
      <View style={styles.backgroundImageContainer}>
        <Image
          source={require('../assets/sign-bg.png')} // Add your sign-bg.png to assets
          style={styles.backgroundImage}
          blurRadius={10}
        />
      </View>


      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Glass Card - Matches: bg-white/5 backdrop-blur-md rounded-xl */}
        <View style={styles.glassCard}>
          
          {/* Logo and Header */}
          <View style={styles.header}>
            <Image
              source={require('../assets/LYFARI-INFINITY-LOGO.png')} // Add your logo
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Continue your soulful journey.</Text>
          </View>


          {/* Form */}
          <View style={styles.form}>
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


            {/* Password Input with Eye Icon */}
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


            {/* Sign In Button - Matches: bg-white hover:bg-gray-200 text-black */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={formLoading}
              style={[styles.signInButton, formLoading && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {formLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#000" size="small" style={styles.spinner} />
                  <Text style={styles.signInButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
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
              style={[styles.googleButton, (isSigningIn || formLoading) && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {isSigningIn ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <Image
                    source={require('../assets/google-icon.png')} // Add google-icon.png to assets
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>


            {/* Sign Up Link */}
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpContainer}>
              <Text style={styles.signUpText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>


            {/* Footer Quote */}
            <Text style={styles.footerQuote}>
              "Let your frequency find its match in the cosmic dance."
            </Text>
          </View>
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
  
  // Gradient Background - Matches: from-black via-indigo-950 to-black
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Background Image with Blur - Matches: opacity-30 blur-lg
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
  
  // Glass Card - Matches: bg-white/5 backdrop-blur-md rounded-xl shadow-2xl p-8
  glassCard: {
    width: '100%',
    maxWidth: 448, // max-w-md (28rem = 448px)
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 12, // rounded-xl
    padding: 32, // p-8
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
  },
  
  // Header Section
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 50,
    marginBottom: 8,
  },
  
  // Title - Matches: text-3xl font-extrabold text-gray-100 tracking-wide
  title: {
    fontSize: 30, // text-3xl
    fontWeight: '800', // font-extrabold
    color: '#f3f4f6', // text-gray-100
    letterSpacing: 1.5, // tracking-wide
    marginBottom: 4,
  },
  
  // Subtitle - Matches: text-gray-400 mt-1
  subtitle: {
    fontSize: 16,
    color: '#9ca3af', // text-gray-400
    marginTop: 4,
  },
  
  // Form Section
  form: {
    width: '100%',
  },
  
  // Input - Matches: bg-gray-900/60 text-gray-100 placeholder-gray-400 border border-gray-600 focus:ring-2 focus:ring-indigo-500
  input: {
    width: '100%',
    padding: 12, // p-3
    marginBottom: 16,
    borderRadius: 8, // rounded
    backgroundColor: 'rgba(17, 24, 39, 0.6)', // bg-gray-900/60
    color: '#f3f4f6', // text-gray-100
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4b5563', // border-gray-600
  },
  
  // Password Container
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
  
  // Sign In Button - Matches: bg-white hover:bg-gray-200 text-black font-semibold p-3 rounded transition-all shadow
  signInButton: {
    width: '100%',
    backgroundColor: '#ffffff', // bg-white
    paddingVertical: 12, // p-3
    borderRadius: 8, // rounded
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
  signInButtonText: {
    color: '#000000', // text-black
    fontWeight: '600', // font-semibold
    fontSize: 16,
  },
  
  // OR Divider - Matches: flex items-center w-full my-6
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24, // my-6
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#6b7280', // bg-gray-500
    opacity: 0.4, // opacity-40
  },
  dividerText: {
    marginHorizontal: 12, // mx-3
    color: '#9ca3af', // text-gray-400
    fontWeight: '500', // font-medium
    fontSize: 14, // text-sm
  },
  
  // Google Button - Matches: bg-white text-black font-semibold p-3 rounded shadow hover:bg-gray-100 border border-gray-200
  googleButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
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
    gap: 12, // gap-3
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
  
  // Sign Up Link - Matches: text-gray-400 text-center text-sm
  signUpContainer: {
    marginTop: 20, // mt-5
    alignItems: 'center',
  },
  signUpText: {
    color: '#9ca3af', // text-gray-400
    fontSize: 14, // text-sm
    textAlign: 'center',
  },
  signUpLink: {
    color: '#818cf8', // text-indigo-400
    textDecorationLine: 'underline', // hover:underline (always shown on mobile)
  },
  
  // Footer Quote - Matches: mt-6 italic text-gray-400 text-center text-xs
  footerQuote: {
    marginTop: 24, // mt-6
    fontStyle: 'italic',
    color: '#9ca3af', // text-gray-400
    textAlign: 'center',
    fontSize: 12, // text-xs
  },
});
