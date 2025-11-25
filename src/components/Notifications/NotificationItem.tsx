// src/components/Notifications/NotificationItem.tsx (React Native)

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { Notification } from '../../types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const navigation = useNavigation<any>();

  const handleClick = async () => {
    const { type, metadata } = notification;

    if (type === 'POST_LIKE' || type === 'POST_COMMENT') {
      if (metadata?.postMediaUrl) {
        const url = `${Config.NEXT_PUBLIC_BACKEND_URL}${metadata.postMediaUrl}`;
        try {
          await Linking.openURL(url);
        } catch (e) {
          console.error('Failed to open URL:', e);
        }
      }
    } else if (
      type === 'FOLLOW_REQUEST' ||
      type === 'NEW_FOLLOWER' ||
      type === 'FOLLOW_REQUEST_ACCEPTED'
    ) {
      if (metadata?.actorId) {
        navigation.navigate('RealProfile', { userId: metadata.actorId });
      }
    }
  };

  const handleAcceptRequest = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/follow-requests/${notification.metadata.requestId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Follow request accepted' });
        onMarkAsRead();
      } else {
        Toast.show({ type: 'error', text1: 'Failed to accept request' });
      }
    } catch (error) {
        console.error('Error accepting request:', error);
      Toast.show({ type: 'error', text1: 'Failed to accept request' });
    }
  };

  const handleRejectRequest = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/follow-requests/${notification.metadata.requestId}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Follow request rejected' });
        onMarkAsRead();
      } else {
        Toast.show({ type: 'error', text1: 'Failed to reject request' });
      }
    } catch (error) {
        console.error('Error rejecting request:', error);
      Toast.show({ type: 'error', text1: 'Failed to reject request' });
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'FOLLOW_REQUEST':
        return '👋';
      case 'NEW_FOLLOWER':
      case 'FOLLOW_REQUEST_ACCEPTED':
        return '👥';
      case 'POST_LIKE':
      case 'STORY_LIKE':
        return '❤️';
      case 'POST_COMMENT':
      case 'STORY_COMMENT':
      case 'COMMENT_REPLY':
        return '💬';
      default:
        return '🔔';
    }
  };

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
      })
    : 'Just now';

  const handleMarkReadPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead();
    }
  };

  return (
    <TouchableOpacity
      onPress={handleClick}
      activeOpacity={0.8}
      style={[
        styles.container,
        !notification.isRead && styles.containerUnread,
      ]}
    >
      <View style={styles.row}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{getIcon()}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.message}>{notification.message}</Text>
          <Text style={styles.time}>{timeAgo}</Text>

          {notification.type === 'FOLLOW_REQUEST' && !notification.isRead && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleAcceptRequest}
                style={[styles.actionBtn, styles.actionAccept]}
              >
                <Text style={styles.actionText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRejectRequest}
                style={[styles.actionBtn, styles.actionReject]}
              >
                <Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Mark as read icon */}
        <TouchableOpacity
          onPress={handleMarkReadPress}
          style={styles.markBtn}
        >
          {notification.isRead ? (
            // eye closed
            <Text style={styles.markIconRead}>🙈</Text>
          ) : (
            // eye open
            <Text style={styles.markIconUnread}>👁️</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    backgroundColor: 'transparent',
  },
  containerUnread: {
    backgroundColor: 'rgba(129,140,248,0.16)', // indigo-500/10
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(79,70,229,1)', // indigo-500
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  time: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionAccept: {
    backgroundColor: '#4f46e5', // indigo-500
  },
  actionReject: {
    backgroundColor: '#374151', // gray-700
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  markBtn: {
    padding: 4,
    marginLeft: 6,
  },
  markIconRead: {
    fontSize: 18,
    color: '#6b7280',
  },
  markIconUnread: {
    fontSize: 18,
    color: '#6366f1',
  },
});
