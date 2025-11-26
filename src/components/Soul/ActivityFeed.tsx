// src/components/Soul/ActivityFeed.tsx (React Native - FIXED UNUSED PARAMS)

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface ActivityFeedItem {
  id: string;
  type:
    | 'WHISPER_REQUEST'
    | 'WHISPER_ACCEPTED'
    | 'WHISPER_REJECTED'
    | 'SOUL_CHAT_REQUEST'
    | 'SOUL_CHAT_ACCEPTED'
    | 'SOUL_CHAT_REJECTED';
  title: string;
  message: string;
  timestamp: string;
  userId: number;
  metadata?: {
    requestId: number;
    requesterId: number;
    requesterName: string;
    requesterAvatar?: string;
    status: string;
    threadId?: number;
    partnerId?: number;
    partnerName?: string;
  };
  isRead: boolean;
}

interface ActivityFeedProps {
  activityFeed: ActivityFeedItem[];
  realtimeNotifications: ActivityFeedItem[];
  loadingActivity: boolean;
  isConnected: boolean;
  respondingToRequest: number | null;
  loadActivityFeed: () => Promise<void>;
  handleRespondToWhisper: (
    requestId: number,
    response: 'ACCEPTED' | 'REJECTED'
  ) => Promise<void>;
  handleRespondToSoulChat: (
    requestId: number,
    response: 'ACCEPTED' | 'REJECTED'
  ) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activityFeed,
  realtimeNotifications,
  loadingActivity,
  isConnected,
  respondingToRequest,
  loadActivityFeed,
  handleRespondToWhisper,
  handleRespondToSoulChat,
  markNotificationAsRead,
}) => {
  const navigation = useNavigation();

  // Combine real-time notifications and fetch feed and deduplicate
  const combinedActivityFeed = useMemo(() => {
    const combined = [...realtimeNotifications, ...activityFeed];
    const seenIds = new Set<string>();
    const seenRequests = new Map<string, ActivityFeedItem>();
    const uniqueNotifications: ActivityFeedItem[] = [];

    for (const item of combined) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      if (item.metadata?.requestId) {
        const requestKey = `${item.type}_${item.metadata.requestId}`;
        if (seenRequests.has(requestKey)) {
          const existing = seenRequests.get(requestKey)!;
          if (new Date(item.timestamp) > new Date(existing.timestamp)) {
            const index = uniqueNotifications.findIndex(n => n.id === existing.id);
            if (index > -1) uniqueNotifications.splice(index, 1);
            seenRequests.set(requestKey, item);
            uniqueNotifications.push(item);
          }
        } else {
          seenRequests.set(requestKey, item);
          uniqueNotifications.push(item);
        }
      } else {
        uniqueNotifications.push(item);
      }
    }

    return uniqueNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [realtimeNotifications, activityFeed]);

  // Format timestamps like "5m ago"
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Icon for notification types
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WHISPER_REQUEST':
        return '💫';
      case 'WHISPER_ACCEPTED':
        return '✅';
      case 'WHISPER_REJECTED':
        return '❌';
      case 'SOUL_CHAT_REQUEST':
        return '💝';
      case 'SOUL_CHAT_ACCEPTED':
        return '💖';
      case 'SOUL_CHAT_REJECTED':
        return '💔';
      default:
        return '📢';
    }
  };

  const renderNotification = ({ item }: { item: ActivityFeedItem }) => (
    <TouchableOpacity
      onPress={() => !item.isRead && markNotificationAsRead(item.id)}
      style={[
        styles.notificationItem,
        !item.isRead && styles.notificationItemUnread,
      ]}
    >
      {/* Unread indicator dot */}
      {!item.isRead && <View style={styles.unreadDot} />}

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
          <Text style={styles.notificationTitle}>{item.title}</Text>
        </View>

        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>

        {/* Whisper Request Buttons */}
        {item.type === 'WHISPER_REQUEST' && !item.isRead && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => handleRespondToWhisper(item.metadata!.requestId, 'ACCEPTED')}
              disabled={respondingToRequest === item.metadata?.requestId}
              style={[
                styles.button,
                styles.acceptButton,
                respondingToRequest === item.metadata?.requestId && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {respondingToRequest === item.metadata?.requestId ? '...' : 'Accept'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRespondToWhisper(item.metadata!.requestId, 'REJECTED')}
              disabled={respondingToRequest === item.metadata?.requestId}
              style={[
                styles.button,
                styles.rejectButton,
                respondingToRequest === item.metadata?.requestId && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {respondingToRequest === item.metadata?.requestId ? '...' : 'Decline'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Soul Chat Request Buttons */}
        {item.type === 'SOUL_CHAT_REQUEST' && !item.isRead && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => handleRespondToSoulChat(item.metadata!.requestId, 'ACCEPTED')}
              disabled={respondingToRequest === item.metadata?.requestId}
              style={[
                styles.button,
                styles.soulChatAcceptButton,
                respondingToRequest === item.metadata?.requestId && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {respondingToRequest === item.metadata?.requestId ? '...' : 'Accept Soul Chat'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRespondToSoulChat(item.metadata!.requestId, 'REJECTED')}
              disabled={respondingToRequest === item.metadata?.requestId}
              style={[
                styles.button,
                styles.grayButton,
                respondingToRequest === item.metadata?.requestId && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {respondingToRequest === item.metadata?.requestId ? '...' : 'Decline'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processed notification statuses */}
        {(item.type === 'WHISPER_ACCEPTED' || item.type === 'WHISPER_REJECTED') && (
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusText,
                item.type === 'WHISPER_ACCEPTED' ? styles.statusAccepted : styles.statusRejected,
              ]}
            >
              {item.type === 'WHISPER_ACCEPTED' ? '✅ Accepted' : '❌ Declined'}
            </Text>
          </View>
        )}

        {(item.type === 'SOUL_CHAT_ACCEPTED' || item.type === 'SOUL_CHAT_REJECTED') && (
          <View style={styles.statusContainer}>
            {item.type === 'SOUL_CHAT_ACCEPTED' ? (
              <View style={styles.acceptedContainer}>
                <Text style={styles.statusAccepted}>✅ Accepted</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SoulChat' as never)}
                  style={styles.soulChatLinkButton}
                >
                  <Text style={styles.soulChatLinkText}>Visit Soul Chat</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.statusRejected}>❌ Declined</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Feed</Text>
        <View style={styles.headerRight}>
          {isConnected && <Text style={styles.liveIndicator}>●</Text>}
          <TouchableOpacity
            onPress={loadActivityFeed}
            disabled={loadingActivity}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshIcon}>{loadingActivity ? '↻' : '🔄'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.feedContainer}>
        {loadingActivity ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading activity...</Text>
          </View>
        ) : combinedActivityFeed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Activity Yet</Text>
            <Text style={styles.emptySubtitle}>
              No recent activity yet. Start connecting with your matches!
            </Text>
          </View>
        ) : (
          <FlatList
            data={combinedActivityFeed}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            scrollEnabled={true}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    marginBottom: 8,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c7d2fe',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    fontSize: 12,
    color: '#10b981',
  },
  refreshButton: {
    padding: 4,
  },
  refreshIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  feedContainer: {
    flex: 1,
    maxHeight: 400,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 12,
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  notificationMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  soulChatAcceptButton: {
    backgroundColor: '#9333ea',
  },
  grayButton: {
    backgroundColor: '#4b5563',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusAccepted: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  statusRejected: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  acceptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soulChatLinkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#9333ea',
    borderRadius: 4,
  },
  soulChatLinkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ActivityFeed;
