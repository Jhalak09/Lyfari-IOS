import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

interface Notification {
  id: string | number;
  type:
    | 'WHISPER_REQUEST'
    | 'WHISPER_ACCEPTED'
    | 'WHISPER_REJECTED'
    | 'SOUL_CHAT_REQUEST'
    | 'SOUL_CHAT_ACCEPTED'
    | 'SOUL_CHAT_REJECTED'
    | 'FOLLOW_REQUEST'
    | 'FOLLOW_REQUEST_ACCEPTED'
    | 'NEW_FOLLOWER'
    | 'POST_LIKE'
    | 'POST_COMMENT'
    | 'COMMENT_REPLY'
    | 'STORY_LIKE'
    | 'STORY_COMMENT'
    | 'WHISPER_MESSAGE'
    | 'SOUL_CHAT_MESSAGE';
  title: string;
  message: string;
  timestamp?: Date;
  createdAt?: string;
  metadata?: any;
  isRead: boolean;
}

/**
 * onSocialNotification: same semantics as web.
 * onWhisperStatusUpdate: replaces window.dispatchEvent('whisper_status_update', detail)
 */
export const useNotifications = (
  onSocialNotification?: (notification: any) => void,
  onWhisperStatusUpdate?: (update: any) => void,
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socialUnreadCount, setSocialUnreadCount] = useState(0);
  const [whisperUnreadCount, setWhisperUnreadCount] = useState(0);
  const [soulChatUnreadCount, setSoulChatUnreadCount] = useState(0);

  const onSocialNotificationRef = useRef(onSocialNotification);
  const onWhisperStatusUpdateRef = useRef(onWhisperStatusUpdate);

  // keep refs up to date
  useEffect(() => {
    onSocialNotificationRef.current = onSocialNotification;
  }, [onSocialNotification]);

  useEffect(() => {
    onWhisperStatusUpdateRef.current = onWhisperStatusUpdate;
  }, [onWhisperStatusUpdate]);

  // initial counts
  useEffect(() => {
    fetchSocialUnreadCount();
    fetchMessageUnreadCounts();
  }, []);

  const fetchSocialUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/unread-count/social`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        const total =
          (data.data.follows || 0) +
          (data.data.likes || 0) +
          (data.data.comments || 0);
        setSocialUnreadCount(total);
      }
    } catch (error) {
      console.error('Error fetching social unread count:', error);
    }
  };

  const fetchMessageUnreadCounts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/unread-count/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setWhisperUnreadCount(data.data.whisper || 0);
        setSoulChatUnreadCount(data.data.soulChat || 0);
      }
    } catch (error) {
      console.error('Error fetching message unread counts:', error);
    }
  };

  useEffect(() => {
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const backendUrl = Config.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        console.error('Backend URL is not defined in env');
        return;
      }

      const newSocket: Socket = io(backendUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to notifications');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from notifications');
        setIsConnected(false);
      });

      newSocket.on('connection_confirmed', data => {
        console.log('✅ Connection confirmed:', data);
      });

      newSocket.on('notification', (notification: any) => {
        console.log('🔔 Received notification:', notification);

        const normalizedNotification: Notification = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp
            ? new Date(notification.timestamp)
            : new Date(),
          createdAt: notification.createdAt || new Date().toISOString(),
          metadata: notification.metadata,
          isRead: notification.isRead || false,
        };

        setNotifications(prev => [normalizedNotification, ...prev.slice(0, 49)]);

        const socialNotificationTypes = [
          'FOLLOW_REQUEST',
          'FOLLOW_REQUEST_ACCEPTED',
          'NEW_FOLLOWER',
          'POST_LIKE',
          'POST_COMMENT',
          'COMMENT_REPLY',
          'STORY_LIKE',
          'STORY_COMMENT',
        ];

        const isSocialNotification = socialNotificationTypes.includes(
          notification.type,
        );

        if (isSocialNotification) {
          setSocialUnreadCount(prev => prev + 1);

          if (onSocialNotificationRef.current) {
            onSocialNotificationRef.current(normalizedNotification);
          }

          if (notification.type === 'FOLLOW_REQUEST') {
            Toast.show({
              type: 'info',
              text1: '👋 ' + notification.message,
              visibilityTime: 4000,
            });
          } else if (notification.type === 'NEW_FOLLOWER') {
            Toast.show({
              type: 'success',
              text1: '👥 ' + notification.message,
              visibilityTime: 4000,
            });
          } else if (notification.type.includes('LIKE')) {
            Toast.show({
              type: 'info',
              text1: '❤️ ' + notification.message,
              visibilityTime: 3000,
            });
          } else if (notification.type.includes('COMMENT')) {
            Toast.show({
              type: 'info',
              text1: '💬 ' + notification.message,
              visibilityTime: 4000,
            });
          }
        } else if (notification.type === 'WHISPER_MESSAGE') {
          setWhisperUnreadCount(prev => prev + 1);
          Toast.show({
            type: 'info',
            text1: '💬 ' + notification.message,
            visibilityTime: 4000,
          });
        } else if (notification.type === 'SOUL_CHAT_MESSAGE') {
          setSoulChatUnreadCount(prev => prev + 1);
          Toast.show({
            type: 'info',
            text1: '💌 ' + notification.message,
            visibilityTime: 4000,
          });
        } else {
          if (notification.type === 'WHISPER_REQUEST') {
            Toast.show({
              type: 'info',
              text1: `💫 ${notification.message}`,
              visibilityTime: 4000,
            });
          } else if (notification.type === 'WHISPER_ACCEPTED') {
            Toast.show({
              type: 'success',
              text1: `🎉 ${notification.message}`,
              visibilityTime: 4000,
            });
          }
        }
      });

      newSocket.on('whisper_status_update', update => {
        console.log('Whisper status update:', update);
        // Replace window.dispatchEvent with optional callback
        if (onWhisperStatusUpdateRef.current) {
          onWhisperStatusUpdateRef.current(update);
        }
      });

      newSocket.on('unread_counts_update', counts => {
        console.log('🔔 Unread counts update:', counts);

        if (counts.socialUnread) {
          const total =
            (counts.socialUnread.follows || 0) +
            (counts.socialUnread.likes || 0) +
            (counts.socialUnread.comments || 0);
          setSocialUnreadCount(total);
        }

        if (counts.whisperUnread !== undefined) {
          setWhisperUnreadCount(counts.whisperUnread);
        }
        if (counts.soulChatUnread !== undefined) {
          setSoulChatUnreadCount(counts.soulChatUnread);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    };

    connectSocket();
  }, []);

  return {
    socket,
    notifications,
    isConnected,
    setNotifications,
    socialUnreadCount,
    whisperUnreadCount,
    soulChatUnreadCount,
    refreshSocialCount: fetchSocialUnreadCount,
    refreshMessageCounts: fetchMessageUnreadCounts,
  };
};
