// src/screens/WhispersPage.tsx (React Native - Mobile Instagram-Style)

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import ConversationsSidebar from '../components/Whispers/ConversationsSidebar';
import ChatArea from '../components/Whispers/ChatArea';
import NavbarV from '../components/layout/NavbarV';
import { jwtDecode } from 'jwt-decode'; // ✅ Use jwt-decode library

// Interfaces
interface WhisperConversation {
  id: string;
  partner: { id: string; name: string; avatar?: string };
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount?: number;
  daysLeft: number;
  expiresAt: string;
  isExpiringSoon?: boolean;
}

interface WhisperMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  sent?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

interface WhisperMeta {
  id: string;
  partner: { id: string; name: string; avatar?: string };
  expiresAt: string;
  daysLeft: number;
  canRequestSoulChat: boolean;
}

export default function WhispersPage() {
  // ✅ ALL STATE HOOKS FIRST
  const [conversations, setConversations] = useState<WhisperConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhisperMessage[]>([]);
  const [chatMeta, setChatMeta] = useState<WhisperMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // ✅ Mobile view toggle
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  // ✅ ALL REFS
  const inputRef = useRef<TextInput>(null);
  const messagesEndRef = useRef<View>(null);
  const socketRef = useRef<Socket | null>(null);

  // ✅ ALL CALLBACKS
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log('📊 Unread count:', data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const handlePinChat = useCallback(async () => {
    if (!selectedChatId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/${selectedChatId}/pin`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setPinnedChats((prev) => [...prev, selectedChatId]);
        Toast.show({ type: 'success', text1: 'Chat pinned' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to pin chat' });
      }
    } catch (error) {
      console.error('Failed to pin chat:', error);
      Toast.show({ type: 'error', text1: 'Failed to pin chat' });
    }
  }, [selectedChatId]);

  const handleUnpinChat = useCallback(async () => {
    if (!selectedChatId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/${selectedChatId}/pin`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setPinnedChats((prev) =>
          prev.filter((id) => id !== selectedChatId)
        );
        Toast.show({ type: 'success', text1: 'Chat unpinned' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to unpin chat' });
      }
    } catch (error) {
      console.error('Failed to unpin chat:', error);
      Toast.show({ type: 'error', text1: 'Failed to unpin chat' });
    }
  }, [selectedChatId]);

  const handleReplyToMessage = useCallback(
    async (replyToId: string, replyText: string) => {
      if (!selectedChatId) return;
      try {
        setSending(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/${selectedChatId}/messages/${replyToId}/reply`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text: replyText }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const newReplyMessage: WhisperMessage = {
              id: data.data.id,
              chatId: selectedChatId,
              senderId: data.data.senderId,
              senderName: data.data.senderName,
              text: data.data.text,
              replyTo: data.data.replyTo,
              createdAt: data.data.createdAt,
              sent: true,
            };

            setMessages((prev) => [...prev, newReplyMessage]);
            setText('');
            Toast.show({ type: 'success', text1: 'Reply sent' });
          }
        }
      } catch (error) {
        console.error('Failed to send reply:', error);
        Toast.show({ type: 'error', text1: 'Failed to send reply' });
      } finally {
        setSending(false);
      }
    },
    [selectedChatId]
  );

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !selectedChatId || sending) return;

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/${selectedChatId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data?.data) {
        const newMessage: WhisperMessage = {
          id: String(Date.now()),
          chatId: selectedChatId,
          senderId: 'me',
          senderName: 'Me',
          text: text.trim(),
          createdAt: new Date().toISOString(),
          sent: true,
        };

        setMessages((prev) => [...prev, newMessage]);
        setLastSentMessageId(newMessage.id);
        setText('');
        inputRef.current?.blur();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    } finally {
      setSending(false);
    }
  }, [text, selectedChatId, sending]);

  const requestSoulChat = useCallback(async () => {
    if (!selectedChatId) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat-requests/from-whisper/${selectedChatId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          message: 'Failed to send soul chat request',
        }));
        throw new Error(
          errorData.message ||
            `HTTP ${res.status}: Failed to send soul chat request`
        );
      }

      const data = await res.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: data.message || 'Soul chat request sent!',
          visibilityTime: 4000,
        });
      } else {
        throw new Error(data.message || 'Failed to send soul chat request');
      }
    } catch (error: any) {
      console.error('Failed to request soul chat:', error);
      if (error.message?.includes('already pending')) {
        Toast.show({
          type: 'error',
          text1: 'Request already pending for this conversation',
        });
      } else if (error.message?.includes('already exists')) {
        Toast.show({
          type: 'error',
          text1: 'Soul chat already exists for this conversation',
        });
      } else if (error.message?.includes('not found')) {
        Toast.show({
          type: 'error',
          text1: 'This conversation is no longer available',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: error.message || 'Failed to send soul chat request',
        });
      }
    }
  }, [selectedChatId]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const conversationsData: WhisperConversation[] = data?.data || [];

      setConversations(conversationsData);

      // ✅ Don't auto-select on mobile
      // if (!selectedChatId && conversationsData.length > 0) {
      //   setSelectedChatId(conversationsData[0].id);
      // }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      Toast.show({ type: 'error', text1: 'Failed to load conversations' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChatMessages = useCallback(async (chatId: string) => {
    if (!chatId) return;

    try {
      setLoadingChat(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const [metaRes, messagesRes] = await Promise.all([
        fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/${chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/${chatId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      if (!metaRes.ok || !messagesRes.ok) {
        throw new Error(
          `HTTP error! meta: ${metaRes.status}, messages: ${messagesRes.status}`
        );
      }

      const metaData = await metaRes.json();
      const messagesData = await messagesRes.json();

      setChatMeta(metaData?.data);

      const messagesList: WhisperMessage[] = messagesData?.data || [];
      setMessages(messagesList);
    } catch (error) {
      console.error('Failed to load chat:', error);
      Toast.show({ type: 'error', text1: 'Failed to load chat messages' });
    } finally {
      setLoadingChat(false);
    }
  }, []);

  // ✅ Handle conversation selection (mobile)
  const handleSelectConversation = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowSidebar(false); // Show chat area on mobile
  };

  // ✅ ALL EFFECTS
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const extractUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // ✅ Use jwt-decode
          const decoded = jwtDecode<{
            sub?: number;
            userId?: number;
            user_id?: number;
            id?: number;
            username?: string;
            name?: string;
            user_name?: string;
          }>(token);

          const userIdFromToken =
            decoded.sub ||
            decoded.userId ||
            decoded.user_id ||
            decoded.id;

          const usernameFromToken =
            decoded.username || decoded.name || decoded.user_name;

          console.log('🔍 DEBUG - JWT decoded successfully:', {
            fullPayload: decoded,
            extractedUserId: userIdFromToken,
            extractedUsername: usernameFromToken,
          });

          setCurrentUserId(
            userIdFromToken ? userIdFromToken.toString() : null
          );
          setCurrentUserName(usernameFromToken || null);
        } else {
          console.warn('⚠️ No token found in AsyncStorage');
          setCurrentUserId(null);
          setCurrentUserName(null);
        }
      } catch (error) {
        console.error('Error extracting user info:', error);
      }
    };
    extractUserInfo();
  }, []);

  useEffect(() => {
    const fetchPinnedChats = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        console.log('📌 Fetching pinned whisper chats from backend');

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/whispers/pinned`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          console.log('📌 Backend pinned whisper chats response:', data);

          if (data.success && Array.isArray(data.data)) {
            const backendPinnedIds = data.data.map((pin: any) =>
              pin.id.toString()
            );
            console.log('📌 Extracted pinned whisper chat IDs:', backendPinnedIds);
            setPinnedChats(backendPinnedIds);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch pinned whisper chats:', error);
      }
    };
    fetchPinnedChats();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedChatId) {
      loadChatMessages(selectedChatId);
    }
  }, [selectedChatId, loadChatMessages]);

  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const newSocket = io(Config.NEXT_PUBLIC_BACKEND_URL!, {
          auth: { token },
          transports: ['websocket'],
        });

        newSocket.on('connect', () => {
          console.log('🟢 Connected to whisper chat WebSocket');
        });

        newSocket.on('disconnect', () => {
          console.log('🔴 Disconnected from whisper chat WebSocket');
        });

        newSocket.on('notification', (notification: any) => {
          console.log('🔔 Received notification:', notification);
          switch (notification.type) {
            case 'WHISPER_REQUEST':
              Toast.show({
                type: 'info',
                text1: '💫 New whisper request',
                text2: notification.message,
              });
              break;
            case 'SOUL_CHAT_REQUEST':
              Toast.show({
                type: 'info',
                text1: '💝 New soul chat request',
                text2: notification.message,
              });
              break;
            case 'WHISPER_ACCEPTED':
              Toast.show({
                type: 'success',
                text1: '🎉 Whisper accepted',
                text2: notification.message,
              });
              break;
            case 'SOUL_CHAT_ACCEPTED':
              Toast.show({
                type: 'success',
                text1: '💖 Soul chat accepted',
                text2: notification.message,
              });
              break;
          }
        });

        newSocket.on(
          'whisper_message',
          (data: {
            threadId: number;
            message: WhisperMessage;
          }) => {
            console.log('📨 Received real-time whisper message:', data);

            if (
              selectedChatId &&
              parseInt(selectedChatId) === data.threadId
            ) {
              setMessages((prevMessages) => {
                if (prevMessages.find((msg) => msg.id === data.message.id)) {
                  return prevMessages;
                }

                return [...prevMessages, data.message];
              });
            }

            setConversations((prevConversations) =>
              prevConversations.map((conv) =>
                conv.id === data.threadId.toString()
                  ? {
                      ...conv,
                      lastMessage: data.message.replyTo
                        ? `↳ ${data.message.text}`
                        : data.message.text,
                      lastMessageTime: data.message.createdAt,
                    }
                  : conv
              )
            );
          }
        );

        newSocket.on(
          'whisper_expired',
          (data: { threadId: number; message: string }) => {
            console.log('💀 Whisper chat expired:', data);

            setConversations((prev) =>
              prev.filter((conv) => conv.id !== data.threadId.toString())
            );

            if (selectedChatId === data.threadId.toString()) {
              setSelectedChatId(null);
              setMessages([]);
              setChatMeta(null);
            }

            Toast.show({
              type: 'info',
              text1: '💀 Conversation expired',
              text2: 'A whisper conversation has been deleted for privacy.',
            });
          }
        );

        socketRef.current = newSocket;

        return () => {
          newSocket.close();
        };
      } catch (error) {
        console.error('WebSocket setup failed:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [selectedChatId]);

  // ✅ COMPUTED VALUES
  const conversationsWithTTL = useMemo(() => {
    return conversations
      .map((conv) => {
        const now = new Date();
        const expiresAt = new Date(conv.expiresAt);
        const daysLeft = Math.max(
          0,
          Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );

        return {
          ...conv,
          daysLeft,
          isExpiringSoon: daysLeft <= 1,
          isPinned: pinnedChats.includes(conv.id),
        };
      })
      .filter((conv) => conv.daysLeft > 0)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
        );
      });
  }, [conversations, pinnedChats]);

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTTLColor = (daysLeft: number): string => {
    if (daysLeft <= 1) return '#fee2e2';
    if (daysLeft <= 3) return '#fef3c7';
    return '#dcfce7';
  };

  const isPinned = selectedChatId && pinnedChats.includes(selectedChatId);

  // ✅ CONDITIONAL RENDER (AFTER ALL HOOKS)
  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <View style={styles.navWrapper}>
          <NavbarV />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading whispers...</Text>
        </View>
        <Toast />
      </SafeAreaView>
    );
  }

  // ✅ MAIN RENDER
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Navbar - Fixed at top */}
      <View style={styles.navWrapper}>
        <NavbarV />
      </View>

      {/* ✅ Show sidebar OR chat area (Instagram-style) */}
      <View style={styles.mainContainer}>
        {showSidebar ? (
          // Conversations List View
          <ConversationsSidebar
            showSidebar={showSidebar}
            loading={loading}
            conversationsWithTTL={conversationsWithTTL}
            selectedChatId={selectedChatId}
            setSelectedChatId={handleSelectConversation} // ✅ Updated
            setShowSidebar={setShowSidebar}
            formatTimestamp={formatTimestamp}
            getTTLColor={getTTLColor}
          />
        ) : (
          // Chat Area View
          <ChatArea
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            selectedChatId={selectedChatId}
            loadingChat={loadingChat}
            chatMeta={chatMeta}
            messages={messages}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            lastSentMessageId={lastSentMessageId}
            text={text}
            setText={setText}
            sending={sending}
            inputRef={inputRef}
            messagesEndRef={messagesEndRef}
            sendMessage={sendMessage}
            requestSoulChat={requestSoulChat}
            formatTimestamp={formatTimestamp}
            onReplyToMessage={handleReplyToMessage}
            onPinChat={handlePinChat}
            onUnpinChat={handleUnpinChat}
            isPinned={!!isPinned}
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Lyfari © {new Date().getFullYear()} — A space to connect souls, safely and beautifully.
        </Text>
      </View>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navWrapper: {
    backgroundColor: '#000000',
    paddingVertical: 8,
  },
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
