import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { Notification } from '../types/notifications';

// Keep the same shape
interface NotificationsContextType {
  socket: Socket | null;
  notifications: Notification[];
  isConnected: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  socialUnreadCount: number;
  whisperUnreadThreads: number;   // ✅ same as web
  soulChatUnreadThreads: number;  // ✅ same as web
  refreshSocialCount: () => Promise<void>;
  refreshThreadCounts: () => Promise<void>;
  markThreadAsRead: (
    chatType: 'WHISPER' | 'SOUL_CHAT',
    threadId: number,
  ) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined,
);

let globalSocket: Socket | null = null;
let isInitialized = false;

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socialUnreadCount, setSocialUnreadCount] = useState(0);
  const [whisperUnreadThreads, setWhisperUnreadThreads] = useState(0);
  const [soulChatUnreadThreads, setSoulChatUnreadThreads] = useState(0);

  const initRef = useRef(false);

  const fetchSocialUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/unread-count/social`,
        {
          headers: { Authorization: `Bearer ${token}` },
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

  // ✅ same logic: fetch unique thread counts
  const fetchThreadCounts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/unread-count/threads`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setWhisperUnreadThreads(data.data.whisper || 0);
        setSoulChatUnreadThreads(data.data.soulChat || 0);
        console.log('📊 Thread counts:', data.data);
      }
    } catch (error) {
      console.error('Error fetching thread counts:', error);
    }
  };

  // ✅ same API: mark entire thread as read
  const markThreadAsRead = async (
    chatType: 'WHISPER' | 'SOUL_CHAT',
    threadId: number,
  ) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const notificationType =
        chatType === 'WHISPER' ? 'WHISPER_MESSAGE' : 'SOUL_CHAT_MESSAGE';

      console.log(`📖 Marking ${chatType} thread ${threadId} as read...`);

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/mark-thread-read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: notificationType,
            threadId,
          }),
        },
      );

      if (res.ok) {
        console.log(`✅ Thread ${threadId} marked as read`);

        if (chatType === 'WHISPER') {
          setWhisperUnreadThreads(prev => Math.max(0, prev - 1));
        } else {
          setSoulChatUnreadThreads(prev => Math.max(0, prev - 1));
        }

        await fetchThreadCounts();
      }
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  };

  useEffect(() => {
    if (initRef.current || isInitialized) {
      console.log('⏭️ NotificationsProvider already initialized, skipping...');
      return;
    }

    initRef.current = true;
    isInitialized = true;

    const connect = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found, skipping WebSocket connection');
        return;
      }

      if (globalSocket && globalSocket.connected) {
        console.log('♻️ Reusing existing WebSocket connection');
        setSocket(globalSocket);
        setIsConnected(true);
        fetchSocialUnreadCount();
        fetchThreadCounts();
        return;
      }

      console.log('🔌 Creating NEW WebSocket connection');

      const backendUrl = Config.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        console.error('Backend URL not defined in env');
        return;
      }

      const newSocket = io(backendUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to notifications WebSocket');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from notifications WebSocket');
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
        } else if (
          notification.type === 'WHISPER_MESSAGE' ||
          notification.type === 'SOUL_CHAT_MESSAGE'
        ) {
          // refresh thread counts instead of naïve increment
          fetchThreadCounts();
        }
      });

      newSocket.on('whisper_status_update', update => {
        console.log('Whisper status update:', update);
        // In web: window.dispatchEvent(new CustomEvent(...))
        // In native, dispatch through a global handler if needed
        // e.g., use a dedicated event emitter; keeping the log and hook here
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

        if (counts.whisperThreads !== undefined) {
          setWhisperUnreadThreads(counts.whisperThreads);
        }
        if (counts.soulChatThreads !== undefined) {
          setSoulChatUnreadThreads(counts.soulChatThreads);
        }
      });

      globalSocket = newSocket;
      setSocket(newSocket);

      fetchSocialUnreadCount();
      fetchThreadCounts();
    };

    connect();

    return () => {
      console.log('🧹 NotificationsProvider unmounted (socket kept globally)');
      // Intentionally not closing globalSocket to reuse between screens
    };
  }, []);

  const value: NotificationsContextType = {
    socket,
    notifications,
    isConnected,
    setNotifications,
    socialUnreadCount,
    whisperUnreadThreads,
    soulChatUnreadThreads,
    refreshSocialCount: fetchSocialUnreadCount,
    refreshThreadCounts: fetchThreadCounts,
    markThreadAsRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      'useNotificationsContext must be used within NotificationsProvider',
    );
  }
  return context;
};
