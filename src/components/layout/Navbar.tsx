// src/components/layout/Navbar.tsx (React Native)

import React, { useState, useEffect } from 'react';
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
    case '/lyfari/virtual/dashboard':
      return 'LyfariVirtualDashboard';
    case '/lyfari/real/profile':
      return 'RealProfileRoot';
    case '/lyfari/real/soulchat':
      return 'SoulChat';
    case '/lyfari/real/searchexplore':
      return 'SearchExplore';
    case '/lyfari/real/notification':
      return 'Notification';
    default:
      return 'LyfariVirtualDashboard';
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

  // mirror Next.js: fetch current user once to get id
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCurrentUserId(data?.data?.userId || data?.userId || null);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const toggleMobileMenu = () => setOpen(prev => !prev);

  const handleProfileClick = () => {
    if (currentUserId) {
      navigation.navigate('RealProfile', { userId: currentUserId });
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

  const renderDesktopNavItem = (item: NavItem) => {
    const active = isActivePath(item.href, activeHref, matchPrefix);

    if (item.title === 'PROFILE') {
      return (
        <TouchableOpacity
          key={item.title}
          onPress={handleProfileClick}
          style={[styles.navItem, active && styles.navItemActive]}
        >
          <Text style={[styles.navText, active && styles.navTextActive]}>
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
          style={[
            styles.navItem,
            styles.navItemBadgeWrapper,
            active && styles.navItemActive,
          ]}
        >
          <Text style={[styles.navText, active && styles.navTextActive]}>
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
          style={[
            styles.navItem,
            styles.navItemBadgeWrapper,
            active && styles.navItemActive,
          ]}
        >
          <Text style={[styles.navText, active && styles.navTextActive]}>
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
            <View style={[styles.badge, styles.badgePink, styles.badgeMobile]}>
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
            <View style={[styles.badge, styles.badgeRed, styles.badgeMobile]}>
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
      <View style={styles.navWrapper}>
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

          <View style={styles.navList}>{NAV.map(renderDesktopNavItem)}</View>

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
    borderColor: 'rgba(129,140,248,0.7)',
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
  badgePink: {
    backgroundColor: '#ec4899',
  },
  badgeRed: {
    backgroundColor: '#ef4444',
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

export default Navbar;
