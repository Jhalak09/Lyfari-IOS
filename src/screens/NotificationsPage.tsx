// src/screens/NotificationsPage.tsx (React Native)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../components/layout/Navbar';
import {NotificationItem} from '../components/Notifications/NotificationItem';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import type { Notification, NotificationTab } from '../types/notifications';

const TABS: { id: NotificationTab; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🔔' },
  { id: 'follow', label: 'Follow', icon: '👥' },
  { id: 'likes', label: 'Likes', icon: '❤️' },
  { id: 'comments', label: 'Comments', icon: '💬' },
];

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const { isConnected, notifications: contextNotifications } =
    useNotificationsContext();

  useEffect(() => {
    if (contextNotifications && contextNotifications.length > 0) {
      const socialNotifications = contextNotifications.filter(n =>
        shouldShowInNotificationPage(n.type),
      );

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => String(n.id)));
        const newNotifications = socialNotifications.filter(
          n => !existingIds.has(String(n.id)),
        );
        return [...newNotifications, ...prev];
      });
    }
  }, [contextNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/feed?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  function shouldShowInNotificationPage(type: string) {
    return [
      'FOLLOW_REQUEST',
      'FOLLOW_REQUEST_ACCEPTED',
      'NEW_FOLLOWER',
      'POST_LIKE',
      'POST_COMMENT',
      'COMMENT_REPLY',
      'STORY_LIKE',
      'STORY_COMMENT',
    ].includes(type);
  }

  function filterNotifications(notifs: Notification[]) {
    const socialNotifications = notifs.filter(n =>
      shouldShowInNotificationPage(n.type),
    );

    switch (activeTab) {
      case 'follow':
        return socialNotifications.filter(
          n => n.type.includes('FOLLOW') || n.type === 'NEW_FOLLOWER',
        );
      case 'likes':
        return socialNotifications.filter(n => n.type.includes('LIKE'));
      case 'comments':
        return socialNotifications.filter(n => n.type.includes('COMMENT'));
      default:
        return socialNotifications;
    }
  }

  async function markAsRead(notificationId: string | number) {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setNotifications(prev =>
        prev.map(n =>
          String(n.id) === String(notificationId)
            ? { ...n, isRead: true }
            : n,
        ),
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  const filteredNotifications = filterNotifications(notifications);
  const unreadCount = notifications.filter(
    n => !n.isRead && shouldShowInNotificationPage(n.type),
  ).length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          {/* Navbar - Fixed at top */}
          <View style={styles.navWrapper}>
            <Navbar
              menuColorClass="bg-black/100"
              highlightColorClass="bg-indigo-600 text-white"
              activeHref="/Explore"
              compact
            />
          </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>

        {/* Connection Status */}
        <View style={styles.connectionRow}>
          <View
            style={[
              styles.connectionDot,
              isConnected ? styles.connected : styles.disconnected,
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'Live updates enabled' : 'Connecting...'}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabItem, isActive ? styles.tabItemActive : styles.tabItemInactive]}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#818cf8" />
            </View>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
              />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? "You're all caught up!"
                  : `No ${activeTab} notifications`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
navWrapper: {
    backgroundColor: '#000000', // ✅ Background for sticky header
    paddingVertical: 8,
  },  container: { paddingHorizontal: 16, paddingTop: 12 },
  content: { paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    color: 'white',
  },
  unreadBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connected: { backgroundColor: '#22c55e' },
  disconnected: { backgroundColor: '#6b7280' },
  connectionText: {
    fontSize: 14,
    color: '#9ca3af',
  },

  tabsScroll: { marginBottom: 10 },
  tabsContainer: { gap: 12 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: '#6366F1',
  },
  tabItemInactive: {
    backgroundColor: '#1f2937',
  },
  tabIcon: { fontSize: 16, color: 'white', marginRight: 8 },
  tabLabel: { fontWeight: '600', fontSize: 14, color: '#9ca3af' },
  tabLabelActive: { color: 'white' },

  notificationsList: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    minHeight: 200,
  },
  loadingBox: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12, color: '#6b7280' },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default NotificationsPage;
