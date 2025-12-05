// src/components/layout/Navbar.tsx (React Native - Centered with Sign Out)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Toast from 'react-native-toast-message';
import { useNotificationsContext } from '../../contexts/NotificationsContext';
import lyfariLogo from '../../assets/LYFARI-INFINITY-LOGO.png';

const BRAND_NAME = 'LYFARI';

type NavItem = { title: string; href: string };

const NAV: NavItem[] = [
  { title: 'HOME', href: '/lyfari' },
  { title: 'PROFILE', href: '/lyfari/real/profile' },
  { title: 'SOUL CHAT', href: '/lyfari/real/soulchat' },
  { title: 'EXPLORE', href: '/lyfari/real/searchexplore' },
  { title: 'NOTIFICATION', href: '/lyfari/real/notification' },
];

interface NavbarProps {
  menuColorClass?: string;
  highlightColorClass?: string;
  activeHref?: string;
  className?: string;
  compact?: boolean;
  matchPrefix?: boolean;
}

function isActivePath(href: string, activeHref: string, matchPrefix: boolean) {
  if (matchPrefix && href !== '/') {
    return activeHref === href || activeHref.startsWith(`${href}/`);
  }
  return activeHref === href;
}

function hrefToRoute(href: string): string {
  switch (href) {
    case '/lyfari':
      return 'Lyfari';
    case '/lyfari/virtual/dashboard':
      return 'LyfariVirtualDashboard';
    case '/lyfari/real/profile':
      return 'Profile';
    case '/lyfari/real/soulchat':
      return 'SoulChat';
    case '/lyfari/real/searchexplore':
      return 'Explore';
    case '/lyfari/real/notification':
      return 'Notifications';
    default:
      return 'Lyfari';
  }
}

const Navbar: React.FC<NavbarProps> = ({
  activeHref = '/',
  compact = false,
  matchPrefix = true,
}) => {
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<any>>();
  const { socialUnreadCount, soulChatUnreadThreads } = useNotificationsContext();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rawdata = await res.json();
        const data = rawdata.data;

        setCurrentUserId(data?.profile?.userId);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const toggleMobileMenu = () => setOpen(prev => !prev);

  const handleProfileClick = () => {
    if (currentUserId) {
      navigation.navigate('Profile', { userId: currentUserId });
    } else {
      navigation.navigate(hrefToRoute('/lyfari/real/profile'));
    }
    setOpen(false);
  };

  const handleNavPress = (item: NavItem) => {
    if (item.title === 'PROFILE') {
      handleProfileClick();
      return;
    }
    navigation.navigate(hrefToRoute(item.href));
    setOpen(false);
  };

  // ✅ NEW: Sign Out Handler
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔓 Signing out...');
              
              // Clear AsyncStorage
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              
              // Sign out from Google
              try {
                await GoogleSignin.signOut();
              } catch (error) {
                console.log('Google sign out error:', error);
              }
              
              console.log('✅ Sign out successful');
              
              // Close menu
              setOpen(false);
              
              // Show success toast
              Toast.show({
                type: 'success',
                text1: 'Signed out successfully',
                position: 'top',
              });
              
              // Navigate to SignIn screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
              
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Toast.show({
                type: 'error',
                text1: 'Sign out failed. Please try again.',
                position: 'top',
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActivePath(item.href, activeHref, matchPrefix);

    if (item.title === 'PROFILE') {
      return (
        <TouchableOpacity
          key={item.title}
          onPress={handleProfileClick}
          style={[styles.mobileItem, active && styles.mobileItemActive]}
        >
          <Text style={[styles.mobileText, active && styles.mobileTextActive]}>
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.title === 'SOUL CHAT') {
      return (
        <TouchableOpacity
          key={item.title}
          onPress={() => handleNavPress(item)}
          style={[styles.mobileItemRow, active && styles.mobileItemActive]}
        >
          <Text style={[styles.mobileText, active && styles.mobileTextActive]}>
            {item.title}
          </Text>
          {soulChatUnreadThreads > 0 && (
            <View style={[styles.badge, styles.badgePink]}>
              <Text style={styles.badgeText}>
                {soulChatUnreadThreads > 9 ? '9+' : soulChatUnreadThreads}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (item.title === 'NOTIFICATION') {
      return (
        <TouchableOpacity
          key={item.title}
          onPress={() => handleNavPress(item)}
          style={[styles.mobileItemRow, active && styles.mobileItemActive]}
        >
          <Text style={[styles.mobileText, active && styles.mobileTextActive]}>
            {item.title}
          </Text>
          {socialUnreadCount > 0 && (
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={styles.badgeText}>
                {socialUnreadCount > 9 ? '9+' : socialUnreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.title}
        onPress={() => handleNavPress(item)}
        style={[styles.mobileItem, active && styles.mobileItemActive]}
      >
        <Text style={[styles.mobileText, active && styles.mobileTextActive]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.navRoot} accessibilityLabel="Primary navigation">
      {/* Centered Navbar Container */}
      <View style={styles.navContainer}>
        <View style={styles.navInner}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(hrefToRoute('/lyfari/virtual/dashboard'))
            }
            accessibilityLabel="Go to home"
            style={styles.brandRow}
          >
            <Image
              source={lyfariLogo}
              style={[styles.logo, compact && { width: 24, height: 24 }]}
              resizeMode="contain"
            />
            <Text style={[styles.brandText, compact && { fontSize: 18 }]}>
              {BRAND_NAME}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMobileMenu}
            style={styles.mobileToggle}
            accessibilityLabel={open ? 'Close menu' : 'Open menu'}
          >
            <Text style={styles.mobileToggleIcon}>{open ? '✕' : '☰'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      {open && (
        <View style={styles.mobileMenuOverlay}>
          <View style={styles.mobileMenu}>
            {NAV.map(renderNavItem)}
            
            {/* ✅ NEW: Sign Out Button */}
            <View style={styles.divider} />
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutText}>🚪 SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navRoot: {
    width: '100%',
    zIndex: 50,
  },
  navContainer: {
    width: '100%',
    alignItems: 'center',
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.7)',
    alignSelf: 'center',
    minWidth: 180,
    maxWidth: 260,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  brandText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  mobileToggle: {
    padding: 4,
  },
  mobileToggleIcon: {
    color: '#ffffff',
    fontSize: 18,
  },
  mobileMenuOverlay: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  mobileMenu: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.5)',
  },
  mobileItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  mobileItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  mobileItemActive: {
    backgroundColor: '#f9fafb',
  },
  mobileText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mobileTextActive: {
    color: '#000000',
  },
  badge: {
    borderRadius: 999,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePink: {
    backgroundColor: '#ec4899',
  },
  badgeRed: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  // ✅ NEW: Divider and Sign Out Button Styles
  divider: {
    height: 1,
    backgroundColor: 'rgba(129,140,248,0.3)',
    marginVertical: 8,
    marginHorizontal: 14,
  },
  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginBottom: 4,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Navbar;
