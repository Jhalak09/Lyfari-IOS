// src/components/layout/NavbarV.tsx (React Native - Mobile Only)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
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

// Emotion colors
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
      return 'Lyfari';
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
  const [primaryEmotionKey, setPrimaryEmotionKey] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const navigation = useNavigation<NavigationProp<any>>();
  const { whisperUnreadThreads } = useNotificationsContext();

  const toggleMobileMenu = () => setOpen(prev => !prev);

  // Fetch soultest data
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

  // Extract emotion from summary
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

  // Fetch current user
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
         const rawdata = await res.json();
          const data = rawdata.data;
  
          setCurrentUserId(data?.profile?.userId);
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

  const renderNavItem = (item: NavItem) => {
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
        return { borderColor: 'rgba(250,204,21,0.7)' };
      case 'sadness':
        return { borderColor: 'rgba(59,130,246,0.7)' };
      case 'fear':
        return { borderColor: 'rgba(147,51,234,0.7)' };
      case 'anger':
        return { borderColor: 'rgba(220,38,38,0.7)' };
      case 'disgust':
        return { borderColor: 'rgba(34,197,94,0.7)' };
      case 'anxiety':
        return { borderColor: 'rgba(251,146,60,0.7)' };
      case 'envy':
        return { borderColor: 'rgba(34,211,238,0.7)' };
      case 'embarrassment':
        return { borderColor: 'rgba(244,114,182,0.7)' };
      case 'ennui':
        return { borderColor: 'rgba(79,70,229,0.7)' };
      default:
        return { borderColor: 'rgba(129,140,248,0.7)' };
    }
  })();

  return (
    <View style={styles.navRoot} accessibilityLabel="Primary navigation">
      {/* Centered Navbar Container */}
      <View style={styles.navContainer}>
        <View style={[styles.navInner, emotionRingStyle]}>
          {/* Brand */}
          <TouchableOpacity
            onPress={() => navigation.navigate(hrefToRoute('/lyfari'))}
            accessibilityLabel="Go to home"
            style={styles.brandRow}
          >
            <Image
              source={lyfariLogo}
              style={[styles.logo, compact && { width: 20, height: 20 }]}
              resizeMode="contain"
            />
            <Text style={[styles.brandText, compact && { fontSize: 14 }]}>
              {BRAND_NAME}
            </Text>
          </TouchableOpacity>

          {/* Mobile menu toggle */}
          <TouchableOpacity
            onPress={toggleMobileMenu}
            style={styles.mobileToggle}
            accessibilityLabel={open ? 'Close menu' : 'Open menu'}
          >
            <Text style={styles.mobileToggleIcon}>{open ? '✕' : '☰'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mobile dropdown */}
      {open && (
        <View style={styles.mobileMenuOverlay}>
          <View style={styles.mobileMenu}>{NAV.map(renderNavItem)}</View>
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
    alignItems: 'center', // ✅ Centers the navbar
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999, // ✅ Full pill shape
    paddingHorizontal: 14, // ✅ Tight padding
    paddingVertical: 8, // ✅ Compact height
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderWidth: 2,
    alignSelf: 'center',
    minWidth: 180, // ✅ Minimum compact width
    maxWidth: 260, // ✅ Maximum width (tight)
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 22, // ✅ Smaller logo
    height: 22,
    marginRight: 6, // ✅ Tight spacing
  },
  brandText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16, // ✅ Smaller text
    letterSpacing: 0.5,
  },
  mobileToggle: {
    padding: 4, // ✅ Minimal padding
  },
  mobileToggleIcon: {
    color: '#ffffff',
    fontSize: 18, // ✅ Smaller icon
  },
  mobileMenuOverlay: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  mobileMenu: {
    width: '90%', // ✅ Slightly narrower
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
  badgePurple: {
    backgroundColor: '#8b5cf6',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default NavbarV;
