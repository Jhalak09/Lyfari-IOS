// src/screens/SoulChatPage.tsx (React Native - FULLY FIXED)

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import SoulConversationsSidebar from '../components/Soulchat/SoulConversationsSidebar';
import SoulChatArea from '../components/Soulchat/SoulChatArea';
import NewChatModal from '../components/Soulchat/NewChatModal';

// ✅ Same Types as Next.js
type SoulConversation = {
  id: string;
  partner: { id: string; name: string; avatar?: string };
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount?: number;
};

type SoulMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string | null;
  createdAt: string;
  isDeleted?: boolean;
  deleteType?: 'FOR_SELF' | 'FOR_EVERYONE';
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    imageUrl?: string;
  };
};

type SoulMeta = {
  id: string;
  partner: { id: string; name: string; avatar?: string };
  canSendMedia: boolean;
};

const SoulChatPage: React.FC = () => {
  // ✅ Same state as Next.js
  const [conversations, setConversations] = useState<SoulConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SoulMessage[]>([]);
  const [chatMeta, setChatMeta] = useState<SoulMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  const inputRef = useRef<TextInput>(null);
  const messagesEndRef = useRef<View>(null);
  const socketRef = useRef<Socket | null>(null); // ✅ Use ref instead of state

  // ✅ Get current user ID from token
  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          
          setCurrentUserId(
            payload.userId?.toString() ||
              payload.sub?.toString() ||
              payload.id?.toString()
          );
        }
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    };
    getUserId();
  }, []);

  // ✅ Sync pinned chats from backend
  useEffect(() => {
    const syncPinnedChats = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/pinned`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const backendPinnedIds = data.data.map((pin: any) =>
              pin.id.toString()
            );
            setPinnedChats(backendPinnedIds);
          }
        }
      } catch (error) {
        console.error('Failed to sync pinned chats:', error);
      }
    };

    syncPinnedChats();
  }, []);

  // ✅ Handle chat created
  const handleChatCreated = useCallback(
    async (conversationId: number) => {
      setSelectedChatId(conversationId.toString());
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/threads`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            let transformedConversations = data.data.map((thread: any) => ({
              id: thread.id.toString(),
              partner: {
                id: thread.partner.id.toString(),
                name: thread.partner.name,
                avatar: thread.partner.avatar,
              },
              lastMessage: thread.lastMessage,
              lastMessageTime: thread.lastMessageTime,
              unreadCount: 0,
            }));

            transformedConversations.sort(
              (a: SoulConversation, b: SoulConversation) => {
                const aIsPinned = pinnedChats.includes(a.id);
                const bIsPinned = pinnedChats.includes(b.id);
                if (aIsPinned && !bIsPinned) return -1;
                if (!aIsPinned && bIsPinned) return 1;
                return (
                  new Date(b.lastMessageTime).getTime() -
                  new Date(a.lastMessageTime).getTime()
                );
              }
            );

            setConversations(transformedConversations);
          }
        }
      } catch (error) {
        console.error('Failed to reload conversations:', error);
      }

      Toast.show({ type: 'success', text1: 'Chat started successfully!' });
    },
    [pinnedChats]
  );

  // ✅ Handle pin chat
  const handlePinChat = useCallback(async () => {
    if (!selectedChatId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/pin`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const newPinnedChats = [...pinnedChats, selectedChatId];
        setPinnedChats(newPinnedChats);
        Toast.show({ type: 'success', text1: 'Chat pinned' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to pin chat' });
      }
    } catch (error) {
      console.error('Failed to pin chat:', error);
      Toast.show({ type: 'error', text1: 'Failed to pin chat' });
    }
  }, [selectedChatId, pinnedChats]);

  // ✅ Handle unpin chat
  const handleUnpinChat = useCallback(async () => {
    if (!selectedChatId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/pin`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const newPinnedChats = pinnedChats.filter(id => id !== selectedChatId);
        setPinnedChats(newPinnedChats);
        Toast.show({ type: 'success', text1: 'Chat unpinned' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to unpin chat' });
      }
    } catch (error) {
      console.error('Failed to unpin chat:', error);
      Toast.show({ type: 'error', text1: 'Failed to unpin chat' });
    }
  }, [selectedChatId, pinnedChats]);

  // ✅ Load conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/threads`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            let transformedConversations = data.data.map((thread: any) => ({
              id: thread.id.toString(),
              partner: {
                id: thread.partner.id.toString(),
                name: thread.partner.name,
                avatar: thread.partner.avatar,
              },
              lastMessage: thread.lastMessage,
              lastMessageTime: thread.lastMessageTime,
              unreadCount: 0,
            }));

            transformedConversations.sort(
              (a: SoulConversation, b: SoulConversation) => {
                const aIsPinned = pinnedChats.includes(a.id);
                const bIsPinned = pinnedChats.includes(b.id);
                if (aIsPinned && !bIsPinned) return -1;
                if (!aIsPinned && bIsPinned) return 1;
                return (
                  new Date(b.lastMessageTime).getTime() -
                  new Date(a.lastMessageTime).getTime()
                );
              }
            );

            setConversations(transformedConversations);

            if (!selectedChatId && transformedConversations.length > 0) {
              setSelectedChatId(transformedConversations[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to load soul chat conversations',
        });
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [selectedChatId, pinnedChats]);

  // ✅ Load chat messages
  useEffect(() => {
    if (!selectedChatId) return;

    async function loadChat() {
      try {
        setLoadingChat(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const [metaRes, messagesRes] = await Promise.all([
          fetch(
            `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(
            `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/messages`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

        if (metaRes.ok && messagesRes.ok) {
          const metaData = await metaRes.json();
          const messagesData = await messagesRes.json();

          if (metaData.success && metaData.data) {
            setChatMeta({
              id: metaData.data.id.toString(),
              partner: {
                id: metaData.data.partner.id.toString(),
                name: metaData.data.partner.name,
                avatar: metaData.data.partner.avatar,
              },
              canSendMedia: true,
            });
          }

          if (messagesData.success && messagesData.data) {
            const transformedMessages = messagesData.data.map((msg: any) => ({
              id: msg.id,
              chatId: selectedChatId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              type: msg.type || 'text',
              text: msg.text,
              imageUrl: msg.imageUrl,
              isDeleted: msg.isDeleted,
              deleteType: msg.deleteType,
              replyTo: msg.replyTo,
              createdAt: msg.createdAt,
            }));

            setMessages(transformedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
        Toast.show({ type: 'error', text1: 'Failed to load chat messages' });
      } finally {
        setLoadingChat(false);
      }
    }

    loadChat();
  }, [selectedChatId]);

  // ✅ Setup WebSocket
  useEffect(() => {
    async function setupWebSocket() {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // Close existing socket if any
        if (socketRef.current) {
          socketRef.current.close();
        }

        const newSocket = io(Config.NEXT_PUBLIC_BACKEND_URL!, {
          auth: { token },
          transports: ['websocket'],
        });

        newSocket.on('connect', () => {
          console.log('🟢 Connected to soul chat real-time');
        });

        newSocket.on(
          'soul_chat_message',
          (data: { threadId: number; message: any }) => {
            if (data.threadId.toString() === selectedChatId) {
              setMessages(prev => [
                ...prev,
                {
                  id: data.message.id,
                  chatId: data.threadId.toString(),
                  senderId: data.message.senderId,
                  senderName: data.message.senderName,
                  type: data.message.type || 'text',
                  text: data.message.text,
                  imageUrl: data.message.imageUrl,
                  replyTo: data.message.replyTo
                    ? {
                        id: data.message.replyTo.id,
                        text: data.message.replyTo.text,
                        senderName: data.message.replyTo.senderName,
                        imageUrl: data.message.replyTo.imageUrl,
                      }
                    : undefined,
                  createdAt: data.message.createdAt,
                },
              ]);
            }

            setConversations(prev =>
              prev.map(conv =>
                conv.id === data.threadId.toString()
                  ? {
                      ...conv,
                      lastMessage:
                        data.message.type === 'image'
                          ? '📷 Image'
                          : data.message.replyTo
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
          'message_deleted',
          (data: {
            threadId: number;
            messageId: string;
            deleteType: string;
            deletedBy: number;
            wasImage?: boolean;
          }) => {
            if (data.threadId.toString() === selectedChatId) {
              setMessages(prev =>
                prev.map(msg => {
                  if (msg.id === data.messageId) {
                    const updatedMessage: SoulMessage = {
                      ...msg,
                      isDeleted: true,
                      deleteType: data.deleteType as 'FOR_SELF' | 'FOR_EVERYONE',
                    };

                    if (data.deleteType === 'FOR_EVERYONE') {
                      if (data.wasImage) {
                        updatedMessage.imageUrl = null;
                        updatedMessage.text = '🗑️ Image was deleted';
                        updatedMessage.type = 'text';
                      } else {
                        updatedMessage.text = undefined;
                      }
                    } else if (data.deleteType === 'FOR_SELF') {
                      const currentUserIdNum = parseInt(currentUserId || '0');
                      if (data.deletedBy === currentUserIdNum) {
                        updatedMessage.text = undefined;
                        updatedMessage.imageUrl = null;
                      }
                    }

                    return updatedMessage;
                  }
                  return msg;
                })
              );
            }
          }
        );

        socketRef.current = newSocket;

        return () => {
          newSocket.close();
        };
      } catch (error) {
        console.error('Failed to setup WebSocket:', error);
      }
    }

    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [selectedChatId, currentUserId]);

  // ✅ Send text message
  const sendTextMessage = async () => {
    if (!text.trim() || !selectedChatId) return;

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: text.trim() }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const newMessage: SoulMessage = {
            id: data.data.id,
            chatId: selectedChatId,
            senderId: data.data.senderId,
            senderName: data.data.senderName,
            type: 'text',
            text: data.data.text,
            createdAt: data.data.createdAt,
          };

          setMessages(prev => [...prev, newMessage]);
          setText('');
        }
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    } finally {
      setSending(false);
    }
  };

  // ✅ Send image message
  const sendImageMessage = async () => {
    if (!imageFile || !selectedChatId || sending) return;

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'image.jpg',
      } as any);

      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/images`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const newMessage: SoulMessage = {
            id: data.data.id,
            chatId: selectedChatId,
            senderId: data.data.senderId,
            senderName: data.data.senderName,
            type: 'image',
            imageUrl: data.data.imageUrl,
            createdAt: data.data.createdAt,
          };

          setMessages(prev => [...prev, newMessage]);
          setImageFile(null);
          Toast.show({ type: 'success', text1: '📷 Image sent' });
        }
      } else {
        Toast.show({ type: 'error', text1: 'Failed to send image' });
      }
    } catch (error) {
      console.error('Failed to send image:', error);
      Toast.show({ type: 'error', text1: 'Failed to send image' });
    } finally {
      setSending(false);
    }
  };

  // ✅ Delete message
  const handleDeleteMessage = useCallback(
    async (messageId: string, deleteType: 'FOR_SELF' | 'FOR_EVERYONE') => {
      if (!selectedChatId) return;
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/messages/${messageId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ deleteType }),
          }
        );

        if (res.ok) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === messageId ? { ...msg, isDeleted: true, deleteType } : msg
            )
          );
          Toast.show({ type: 'success', text1: 'Message deleted' });
        }
      } catch (error) {
        console.error('Failed to delete message:', error);
        Toast.show({ type: 'error', text1: 'Failed to delete message' });
      }
    },
    [selectedChatId]
  );

  // ✅ Reply to message
  const handleReplyToMessage = useCallback(
    async (replyToId: string, replyText: string) => {
      if (!selectedChatId) return;
      try {
        setSending(true);
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/${selectedChatId}/messages/${replyToId}/reply`,
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
            const newReplyMessage: SoulMessage = {
              id: data.data.id,
              chatId: selectedChatId,
              senderId: data.data.senderId,
              senderName: data.data.senderName,
              type: 'text',
              text: data.data.text,
              replyTo: data.data.replyTo,
              createdAt: data.data.createdAt,
            };

            setMessages(prev => [...prev, newReplyMessage]);
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

  const isPinned = selectedChatId && pinnedChats.includes(selectedChatId);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌟 Soul Chat</Text>
        <Text style={styles.headerSubtitle}>Permanent connections</Text>
        <TouchableOpacity
          onPress={() => setIsNewChatModalOpen(true)}
          style={styles.newChatBtn}
        >
          <Text style={styles.newChatText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <>
            <SoulConversationsSidebar
              conversations={conversations}
              selectedChatId={selectedChatId}
              setSelectedChatId={setSelectedChatId}
              pinnedChats={pinnedChats}
              onNewChatClick={() => setIsNewChatModalOpen(true)}
            />

            <SoulChatArea
              selectedChatId={selectedChatId}
              loadingChat={loadingChat}
              chatMeta={chatMeta}
              messages={messages}
              currentUserId={currentUserId}
              text={text}
              setText={setText}
              sending={sending}
              imageFile={imageFile}
              setImageFile={setImageFile}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              sendTextMessage={sendTextMessage}
              sendImageMessage={sendImageMessage}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              onDeleteMessage={handleDeleteMessage}
              onReplyToMessage={handleReplyToMessage}
              onPinChat={handlePinChat}
              onUnpinChat={handleUnpinChat}
              isPinned={!!isPinned}
            />
          </>
        )}
      </View>

      {currentUserId && (
        <NewChatModal
          isOpen={isNewChatModalOpen}
          onClose={() => setIsNewChatModalOpen(false)}
          onChatCreated={handleChatCreated}
          currentUserId={parseInt(currentUserId)}
        />
      )}
      
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  newChatBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newChatText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SoulChatPage;
