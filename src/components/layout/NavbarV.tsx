// src/components/layout/NavbarV.tsx (React Native)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { useNotificationsContext } from '../../contexts/NotificationsContext';
import lyfariLogo from '../../assets/LYFARI-INFINITY-LOGO.png';

const BRAND_NAME = 'LYFARI';

type NavItem = { title: string; href: string };

const NAV: NavItem[] = [
  { title: 'DASHBOARD', href: '/lyfari/virtual/dashboard' },
  { title: 'WHISPERS', href: '/lyfari/virtual/whispers' },
];

// Emotion colors (kept as strings, mapped to styles)
const emotionRingColors: Record<string, string> = {
  joy: 'joy',
  sadness: 'sadness',
  fear: 'fear',
  anger: 'anger',
  disgust: 'disgust',
  anxiety: 'anxiety',
  envy: 'envy',
  embarrassment: 'embarrassment',
  ennui: 'ennui',
};

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
      return 'LyfariRoot';
    case '/lyfari/virtual/dashboard':
      return 'LyfariVirtualDashboard';
    case '/lyfari/virtual/whispers':
      return 'Whispers';
    default:
      return 'LyfariVirtualDashboard';
  }
}

const NavbarV: React.FC<NavbarProps> = ({
  activeHref = '/',
  compact = false,
  matchPrefix = true,
}) => {
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [primaryEmotionKey, setPrimaryEmotionKey] = useState<string | null>(
    null,
  );
  const [data, setData] = useState<any>(null);

  const navigation = useNavigation<NavigationProp<any>>();
  const { whisperUnreadThreads } = useNotificationsContext();

  const toggleMobileMenu = () => setOpen(prev => !prev);

  // Fetch soultest data (same endpoint and logic as Next.js)
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soultest/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching soul test data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  console.log('Soultest data in NavbarV:', currentUserId);
  // Extract emotion from summary and map to key
  useEffect(() => {
    if (!data || !data.data) return;

    try {
      const soulSummary = data.data.summary;
      if (soulSummary && typeof soulSummary === 'string') {
        const match = soulSummary.match(/Primary Emotion:\s*(\w+)/i);
        if (match && match[1]) {
          const primaryEmotion = match[1].toLowerCase();
          if (emotionRingColors[primaryEmotion]) {
            setPrimaryEmotionKey(primaryEmotion);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting emotion:', error);
    }
  }, [data]);

  // Fetch current user (same logic as Next.js)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/profile/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();
        setCurrentUserId(json?.data?.userId || json?.userId || null);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

 

  const handleNavPress = (item: NavItem) => {
    navigation.navigate(hrefToRoute(item.href));
    setOpen(false);
  };

  const renderDesktopNavItem = (item: NavItem) => {
    const active = isActivePath(item.href, activeHref, matchPrefix);

    if (item.title === 'WHISPERS') {
      return (
        <TouchableOpacity
          key={item.title}
          onPress={() => handleNavPress(item)}
          style={[
            styles.navItem,
            styles.navItemBadgeWrapper,
            active && styles.navItemActive,
          ]}
        >
          <Text style={[styles.navText, active && styles.navTextActive]}>
            {item.title}
          </Text>
          {whisperUnreadThreads > 0 && (
            <View style={[styles.badge, styles.badgePurple]}>
              <Text style={styles.badgeText}>
                {whisperUnreadThreads > 9 ? '9+' : whisperUnreadThreads}
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
        style={[styles.navItem, active && styles.navItemActive]}
      >
        <Text style={[styles.navText, active && styles.navTextActive]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    const active = isActivePath(item.href, activeHref, matchPrefix);

    if (item.title === 'WHISPERS') {
      return (
        <TouchableOpacity
          key={item.title}
          onPress={() => handleNavPress(item)}
          style={[styles.mobileItemRow, active && styles.mobileItemActive]}
        >
          <Text style={[styles.mobileText, active && styles.mobileTextActive]}>
            {item.title}
          </Text>
          {whisperUnreadThreads > 0 && (
            <View style={[styles.badge, styles.badgePurple, styles.badgeMobile]}>
              <Text style={styles.badgeText}>
                {whisperUnreadThreads > 9 ? '9+' : whisperUnreadThreads}
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

  // Map emotion key to ring/glow style
  const emotionRingStyle = (() => {
    switch (primaryEmotionKey) {
      case 'joy':
        return { borderColor: 'rgba(250,204,21,0.7)' }; // yellow-400
      case 'sadness':
        return { borderColor: 'rgba(59,130,246,0.7)' }; // blue-500
      case 'fear':
        return { borderColor: 'rgba(147,51,234,0.7)' }; // purple-600
      case 'anger':
        return { borderColor: 'rgba(220,38,38,0.7)' }; // red-600
      case 'disgust':
        return { borderColor: 'rgba(34,197,94,0.7)' }; // green-500
      case 'anxiety':
        return { borderColor: 'rgba(251,146,60,0.7)' }; // orange-400
      case 'envy':
        return { borderColor: 'rgba(34,211,238,0.7)' }; // cyan-400
      case 'embarrassment':
        return { borderColor: 'rgba(244,114,182,0.7)' }; // pink-400
      case 'ennui':
        return { borderColor: 'rgba(79,70,229,0.7)' }; // indigo-600
      default:
        return { borderColor: 'rgba(129,140,248,0.7)' }; // default indigo-400
    }
  })();

  return (
    <View style={styles.navRoot} accessibilityLabel="Primary navigation">
      <View style={styles.navWrapper}>
        <View style={[styles.navInner, emotionRingStyle]}>
          {/* Brand */}
          <TouchableOpacity
            onPress={() => navigation.navigate(hrefToRoute('/lyfari'))}
            accessibilityLabel="Go to home"
            style={styles.brandRow}
          >
            <Image
              source={lyfariLogo}
              style={[
                styles.logo,
                compact && { width: 24, height: 24 },
              ]}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.brandText,
                compact && { fontSize: 18 },
              ]}
            >
              {BRAND_NAME}
            </Text>
          </TouchableOpacity>

          {/* Desktop nav (approximate; hide/show via layout where needed) */}
          <View style={styles.navList}>
            {NAV.map(renderDesktopNavItem)}
          </View>

          {/* Mobile menu toggle */}
          <View style={styles.mobileToggleWrapper}>
            <TouchableOpacity
              onPress={toggleMobileMenu}
              style={styles.mobileToggle}
              accessibilityLabel={open ? 'Close menu' : 'Open menu'}
            >
              <Text style={styles.mobileToggleIcon}>
                {open ? '✕' : '☰'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mobile dropdown */}
      {open && (
        <View style={styles.mobileMenuOverlay}>
          <View style={styles.mobileMenu}>
            {NAV.map(renderMobileNavItem)}
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
  navWrapper: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 4,
  },
  brandText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: 0.6,
  },
  navList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  navItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  navItemBadgeWrapper: {
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: '#f9fafb',
  },
  navText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -4,
    borderRadius: 999,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePurple: {
    backgroundColor: '#8b5cf6',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  mobileToggleWrapper: {
    marginLeft: 4,
  },
  mobileToggle: {
    padding: 6,
    borderRadius: 999,
  },
  mobileToggleIcon: {
    color: '#ffffff',
    fontSize: 20,
  },
  mobileMenuOverlay: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  mobileMenu: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  mobileItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  mobileItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  mobileItemActive: {
    backgroundColor: '#f9fafb',
  },
  mobileText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  mobileTextActive: {
    color: '#000000',
  },
  badgeMobile: {
    position: 'relative',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
  },
});

export default NavbarV;
