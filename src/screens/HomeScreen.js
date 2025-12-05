import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Config from 'react-native-config';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Match web's 2-second loader
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  console.log('Backend URL:', Config.NEXT_PUBLIC_BACKEND_URL);

  // Loading screen (replace with your PageLoader component later)
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Lyfari</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      
      {/* Black Background (since no video) */}
      <View style={styles.backgroundImageContainer}>
              <Image
                source={require('../assets/sign-bg.png')} // Add your sign-bg.png to assets
                style={styles.backgroundImage}
                blurRadius={10}
              />
            </View>

      {/* Radial Gradient Glow - Matches web's bg-radial-glow */}
      <View style={styles.glowWrapper}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.15)',
            'rgba(255, 255, 255, 0.05)',
            'transparent',
          ]}
          style={styles.radialGlow}
        />
      </View>

      {/* Glass Container - Matches web's border-white/8 bg-black/0 backdrop-blur */}
      <View style={styles.glassContainer}>
        
        {/* Navigation Bar */}
        <View style={styles.navbar}>
          <Text style={styles.navLogo}>Lyfari</Text>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navSignInButton}
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.7}
            >
              <Text style={styles.navSignInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navSignUpButton}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.9}
            >
              <Text style={styles.navSignUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section - Centered Content */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle1}>Welcome to </Text>
          <Text style={styles.heroTitle}>Lyfari</Text>
          <Text style={styles.heroSubtitle}>
            Your soulful journey begins here
          </Text>
          <Text style={styles.heroDescription}>
            Find your emotional matches through the cosmic dance of frequencies
          </Text>
        </View>

        {/* Rumi Quote - Matches web's mt-16 text-neutral-300 */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "This being human is a guest house.{'\n'}
            Every morning a new arrival.{'\n'}
            A joy, a depression, a meanness,{'\n'}
            some momentary awareness comes{'\n'}
            as an unexpected visitor..."
          </Text>
        </View>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Loading Screen
  loaderContainer: {
    flex: 1,
    backgroundColor: '#000000', // bg-black
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },

  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#000000', // bg-black
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  

  // Radial Glow - Matches: absolute left-1/2 top-0 -z-10 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2
  glowWrapper: {
    position: 'absolute',
    top: -height * 0.15,
    left: width * 0.2,
    width: width * 0.6,
    height: height * 0.35,
    zIndex: 0,
  },
  radialGlow: {
    flex: 1,
    borderRadius: 9999,
  },

  // Glass Container - Matches: max-w-7xl rounded-2xl border border-white/8 bg-black/0 backdrop-blur
  glassContainer: {
    flex: 1,
    marginHorizontal: 16, // p-4
    marginTop: 32, // md:p-8
    marginBottom: 128, // pb-32
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // border-white/8
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // bg-black/0 with slight tint for visibility
    paddingHorizontal: 16,
    paddingTop: 16, // md:pt-4
    overflow: 'hidden',
  },

  // Navbar - Matches: flex w-full items-center justify-between py-4
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16, // py-4
    width: '100%',
  },
  navLogo: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold', // font-bold
    color: '#ffffff', // text-white
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4
  },

  // Sign In Button - Matches: rounded-lg px-4 py-2 text-sm text-neutral-300
  navSignInButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
  },
  navSignInText: {
    fontSize: 14, // text-sm
    color: '#d4d4d8', // text-neutral-300
  },

  // Sign Up Button - Matches: rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black
  navSignUpButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
    backgroundColor: '#ffffff', // bg-white
  },
  navSignUpText: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: '#000000', // text-black
  },

  // Hero Section - Centered content
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 48, // Large heading
    fontWeight: 'bold',
    color: '#ffffff', // text-white
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  heroTitle1: {
    fontSize: 30, // Large heading
    fontWeight: 'bold',
    color: '#7125ffff', // text-white
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 2,
  }
  ,
  heroSubtitle: {
    fontSize: 20, // text-lg/xl
    color: '#d4d4d8', // text-neutral-300
    textAlign: 'center',
    marginBottom: 24,
  },
  heroDescription: {
    fontSize: 16, // text-base
    color: '#a1a1aa', // text-neutral-400
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  // Rumi Quote - Matches: mx-auto mt-16 max-w-2xl text-center text-lg text-neutral-300
  quoteContainer: {
    paddingTop: 64, // mt-16
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 18, // text-lg
    color: '#d4d4d8', // text-neutral-300
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600, // max-w-2xl
  },
});
