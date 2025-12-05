// src/screens/LyfariVirtualDashboard.tsx (React Native - COMPLETE)

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import SoulProfile from '../components/Soul/SoulProfile';
import SoulMatches from '../components/Soul/SoulMatches';
import ActivityFeed from '../components/Soul/ActivityFeed';
import NavbarV from '../components/layout/NavbarV';

// ✅ Interface definitions
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

interface Match {
  user: {
    id: number;
    username: string;
  };
  compatibility: number;
  intensity: number;
  primaryEmotion: string;
  whisperRequestStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  threadId?: number;
}

// ✅ Define constant outside component
const SOUL_NOTIFICATION_TYPES = [
  'WHISPER_REQUEST',
  'WHISPER_ACCEPTED',
  'WHISPER_REJECTED',
  'SOUL_CHAT_REQUEST',
  'SOUL_CHAT_ACCEPTED',
  'SOUL_CHAT_REJECTED',
] as const;

const LyfariVirtualDashboard: React.FC = () => {
  // ✅ ALL state variables (matching Next.js exactly)
  const [soulTest, setSoulTest] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]); // ✅ ADDED: Missing state from Next.js
  const [realtimeNotifications, setRealtimeNotifications] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [sendingWhisper, setSendingWhisper] = useState<number | null>(null);
  const [respondingToRequest, setRespondingToRequest] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [emotion, setEmotion] = useState('');

  const socketRef = useRef<Socket | null>(null);

  // Status color
  const statusColor = isConnected ? '#10b981' : '#ef4444';

  // Enhanced matches with request status
  const enrichMatchesWithRequestStatus = (
    matchesData: Match[],
    sentRequestsData: any[]
  ) => {
    return matchesData.map(match => {
      const sentRequest = sentRequestsData.find(req => req.targetId === match.user.id);
      return {
        ...match,
        whisperRequestStatus: sentRequest?.status || null,
        threadId: sentRequest?.threadId || null,
      };
    });
  };

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const [meRes, matchesRes, sentRequestsRes] = await Promise.all([
          fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/soultest/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/soultest/matches`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/whisper-requests/sent`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const me = await meRes.json();
        const matchesData = await matchesRes.json();
        const sentRequestsData = await sentRequestsRes.json();

        setSoulTest(me.data);
        setSentRequests(sentRequestsData); // ✅ ADDED: Store sent requests state

        // Enrich matches with request status
        const enrichedMatches = enrichMatchesWithRequestStatus(
          matchesData.data || [],
          sentRequestsData
        );
        setMatches(enrichedMatches);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Toast.show({ type: 'error', text1: 'Failed to load dashboard data' });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Emotion-based styling
  useEffect(() => {
    if (!soulTest) return;
    try {
      const soulSummary = soulTest.summary;
      console.log('Soul Summary from dash:', soulSummary);
      if (soulSummary && typeof soulSummary === 'string') {
        const match = soulSummary.match(/Primary Emotion:\s*(\w+)/i);
        if (match && match[1]) {
          const Emotion = match[1].toLowerCase();
          if (Emotion) {
            setEmotion(Emotion);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting emotion:', error);
    }
  }, [soulTest]);

  // Load activity feed
  const loadActivityFeed = React.useCallback(async () => {
    setLoadingActivity(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Fetched activity feed:', data);

        if (data.success && Array.isArray(data.data)) {
          const filtered = data.data.filter((n: any) =>
            SOUL_NOTIFICATION_TYPES.includes(n.type)
          );
          setActivityFeed(filtered);
        } else if (Array.isArray(data)) {
          const filtered = data.filter((n: any) =>
            SOUL_NOTIFICATION_TYPES.includes(n.type)
          );
          setActivityFeed(filtered);
        } else {
          console.warn('Unexpected activity feed format:', data);
          setActivityFeed([]);
        }
      } else {
        console.error('Failed to load activity feed:', response.status);
        setActivityFeed([]);
      }
    } catch (error) {
      console.error('Error loading activity feed:', error);
      setActivityFeed([]);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = React.useCallback(
    async (notificationId: string) => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/${notificationId}/read`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          setActivityFeed(prev =>
            prev.map(item =>
              item.id === notificationId ? { ...item, isRead: true } : item
            )
          );
          setRealtimeNotifications(prev =>
            prev.map(item =>
              item.id === notificationId ? { ...item, isRead: true } : item
            )
          );
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    []
  );

  // Handle respond to whisper
  const handleRespondToWhisper = React.useCallback(
    async (requestId: number, response: 'ACCEPTED' | 'REJECTED') => {
      setRespondingToRequest(requestId);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/whisper-requests/${requestId}/respond`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ response }),
          }
        );

        if (res.ok) {
          Toast.show({
            type: 'success',
            text1: `Whisper request ${response.toLowerCase()}!`,
          });

          // ✅ ADDED: Mark related notification as read (matching Next.js)
          const relatedNotification = [...realtimeNotifications, ...activityFeed].find(
            item => item.metadata?.requestId === requestId && item.type === 'WHISPER_REQUEST'
          );

          if (relatedNotification && !relatedNotification.isRead) {
            await markNotificationAsRead(relatedNotification.id);
          }

          await loadActivityFeed();
        }
      } catch (error) {
        console.error('Error:', error);
        Toast.show({ type: 'error', text1: 'Failed to respond' });
      } finally {
        setRespondingToRequest(null);
      }
    },
    [loadActivityFeed, markNotificationAsRead, realtimeNotifications, activityFeed]
  );

  // Handle respond to soul chat
  const handleRespondToSoulChat = React.useCallback(
    async (requestId: number, response: 'ACCEPTED' | 'REJECTED') => {
      setRespondingToRequest(requestId);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat-requests/${requestId}/respond`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ response }),
          }
        );

        if (res.ok) {
          Toast.show({
            type: 'success',
            text1: `Soul chat request ${response.toLowerCase()}!`,
          });

          // ✅ ADDED: Mark related notification as read (matching Next.js)
          const relatedNotification = [...realtimeNotifications, ...activityFeed].find(
            item => item.metadata?.requestId === requestId && item.type === 'SOUL_CHAT_REQUEST'
          );

          if (relatedNotification && !relatedNotification.isRead) {
            await markNotificationAsRead(relatedNotification.id);
          }

          await loadActivityFeed();
        }
      } catch (error) {
        console.error('Error:', error);
        Toast.show({ type: 'error', text1: 'Failed to respond' });
      } finally {
        setRespondingToRequest(null);
      }
    },
    [loadActivityFeed, markNotificationAsRead, realtimeNotifications, activityFeed]
  );

  // Setup WebSocket connection
  useEffect(() => {
    async function setupWebSocket() {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        console.log('🔑 Token found, setting up WebSocket connection');

        const newSocket = io(Config.NEXT_PUBLIC_BACKEND_URL!, {
          auth: { token },
          transports: ['websocket'],
        });

        newSocket.on('connect', () => {
          console.log('🟢 Connected to real-time notifications');
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('🔴 Disconnected from real-time notifications');
          setIsConnected(false);
        });

        // Remove existing listeners
        newSocket.off('notification');
        newSocket.off('notification_updated');
        newSocket.off('whisper_status_update');
        newSocket.off('soul_chat_created');

        // Listen for notification updates
        newSocket.on(
          'notification_updated',
          (data: { requestId: number; type: string; action: string }) => {
            console.log('🔄 Notification status updated:', data);

            const updatedType = data.type as
              | 'WHISPER_ACCEPTED'
              | 'WHISPER_REJECTED'
              | 'SOUL_CHAT_ACCEPTED'
              | 'SOUL_CHAT_REJECTED';

            const getUpdatedMessage = (type: string): string => {
              switch (type) {
                case 'WHISPER_ACCEPTED':
                  return 'You accepted this whisper request';
                case 'WHISPER_REJECTED':
                  return 'You declined this whisper request';
                case 'SOUL_CHAT_ACCEPTED':
                  return 'You accepted this soul chat request. Visit Soul Chat to start chatting!';
                case 'SOUL_CHAT_REJECTED':
                  return 'You declined this soul chat request';
                default:
                  return 'Request processed';
              }
            };

            const updateNotificationWithRead = (item: ActivityFeedItem) => {
              if (item.metadata?.requestId === data.requestId) {
                return {
                  ...item,
                  type: updatedType,
                  isRead: true,
                  message: getUpdatedMessage(updatedType),
                } as ActivityFeedItem;
              }
              return item;
            };

            setActivityFeed(prev => prev.map(updateNotificationWithRead));
            setRealtimeNotifications(prev => prev.map(updateNotificationWithRead));

            if (
              updatedType === 'WHISPER_ACCEPTED' ||
              updatedType === 'SOUL_CHAT_ACCEPTED'
            ) {
              Toast.show({ type: 'success', text1: '✅ Request accepted successfully!' });
            } else if (
              updatedType === 'WHISPER_REJECTED' ||
              updatedType === 'SOUL_CHAT_REJECTED'
            ) {
              Toast.show({ type: 'success', text1: '✅ Request declined successfully!' });
            }
          }
        );

        // Listen for new notifications
        newSocket.on('notification', (notification: ActivityFeedItem) => {
          if (!SOUL_NOTIFICATION_TYPES.includes(notification.type)) return;

          console.log(
            `🔍 Client received notification - ID: ${notification.id}, Type: ${notification.type}`
          );

          setRealtimeNotifications(prev => [notification, ...prev.slice(0, 19)]);

          // Show toast notifications
          switch (notification.type) {
            case 'WHISPER_REQUEST':
              Toast.show({
                type: 'info',
                text1: '💫 Whisper Request',
                text2: notification.message,
                visibilityTime: 4000,
              });
              break;
            case 'WHISPER_ACCEPTED':
              Toast.show({
                type: 'success',
                text1: '🎉 Whisper Accepted',
                text2: notification.message,
                visibilityTime: 4000,
              });
              break;
            case 'WHISPER_REJECTED':
              Toast.show({
                type: 'error',
                text1: '❌ Whisper Declined',
                text2: notification.message,
                visibilityTime: 4000,
              });
              break;
            case 'SOUL_CHAT_REQUEST':
              Toast.show({
                type: 'info',
                text1: '💝 Soul Chat Request',
                text2: notification.message,
                visibilityTime: 5000,
              });
              break;
            case 'SOUL_CHAT_ACCEPTED':
              Toast.show({
                type: 'success',
                text1: '💖 Soul Chat Accepted',
                text2: notification.message,
                visibilityTime: 5000,
              });
              break;
            case 'SOUL_CHAT_REJECTED':
              Toast.show({
                type: 'error',
                text1: '💔 Soul Chat Declined',
                text2: notification.message,
                visibilityTime: 4000,
              });
              break;
          }
        });

        // Listen for whisper status updates
        newSocket.on(
          'whisper_status_update',
          (update: { targetId: number; status: string; threadId?: number }) => {
            console.log('🔄 Whisper status update:', update);

            setMatches(currentMatches =>
              currentMatches.map(match => {
                if (match.user.id === update.targetId) {
                  return {
                    ...match,
                    whisperRequestStatus: update.status as any,
                    threadId: update.threadId || match.threadId,
                  };
                }
                return match;
              })
            );

            if (update.status === 'ACCEPTED') {
              Toast.show({
                type: 'success',
                text1: '🎉 Your whisper request was accepted!',
                text2: 'Visit Whispers page to chat.',
                visibilityTime: 5000,
              });
            } else if (update.status === 'REJECTED') {
              setMatches(currentMatches =>
                currentMatches.map(match => {
                  if (match.user.id === update.targetId) {
                    return { ...match, whisperRequestStatus: null };
                  }
                  return match;
                })
              );
              Toast.show({
                type: 'error',
                text1: '😞 Your whisper request was declined.',
                visibilityTime: 4000,
              });
            }
          }
        );

        // Listen for soul chat creation
        newSocket.on('soul_chat_created', (data: { threadId: number; partner: any }) => {
          console.log('💝 Soul chat thread created:', data);
          Toast.show({
            type: 'success',
            text1: `💖 Soul chat with ${data.partner.name} is now ready!`,
            visibilityTime: 6000,
          });
        });

        socketRef.current = newSocket;

        return () => {
          console.log('🧹 Cleaning up socket listeners');
          newSocket.off('notification');
          newSocket.off('notification_updated');
          newSocket.off('whisper_status_update');
          newSocket.off('soul_chat_created');
          newSocket.close();
        };
      } catch (error) {
        console.error('Failed to setup WebSocket:', error);
      }
    }

    setupWebSocket();
  }, []);

  // Load activity on mount
  useEffect(() => {
    loadActivityFeed();
    const interval = setInterval(loadActivityFeed, 30000);
    return () => clearInterval(interval);
  }, [loadActivityFeed]);

  // Handle whisper requests
  const handleSendWhisper = React.useCallback(
    async (matchUserId: number) => {

          const existingRequest = sentRequests.find(req => req.targetId === matchUserId);
    if (existingRequest && existingRequest.status === 'PENDING') {
      Toast.show({ type: 'info', text1: 'Request already pending' });
      return;
    }
      setSendingWhisper(matchUserId);

      // Optimistic update
      setMatches(currentMatches =>
        currentMatches.map(match => {
          if (match.user.id === matchUserId) {
            return { ...match, whisperRequestStatus: 'PENDING' };
          }
          return match;
        })
      );

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/whisper-requests`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetId: matchUserId }),
        });

        if (response.ok) {
          const data = await response.json();
          Toast.show({ type: 'success', text1: '✨ Whisper request sent successfully!' });

          // ✅ ADDED: Update sent requests state (matching Next.js)
          setSentRequests(prev => [...prev, {
            id: data.id,
            targetId: matchUserId,
            status: 'PENDING',
            createdAt: data.createdAt
          }]);
        } else {
          const errorData = await response.json();
          console.error('Whisper request failed:', errorData);
          Toast.show({ 
            type: 'error', 
            text1: errorData.message || 'Failed to send whisper request' 
          });

          setMatches(currentMatches =>
            currentMatches.map(match => {
              if (match.user.id === matchUserId) {
                return { ...match, whisperRequestStatus: null };
              }
              return match;
            })
          );
        }
      } catch (error) {
        console.error('Error sending whisper:', error);
        Toast.show({ 
          type: 'error', 
          text1: 'Failed to send whisper request. Please try again.' 
        });

        setMatches(currentMatches =>
          currentMatches.map(match => {
            if (match.user.id === matchUserId) {
              return { ...match, whisperRequestStatus: null };
            }
            return match;
          })
        );
      } finally {
        setSendingWhisper(null);
      }
    },
    [sentRequests]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your soul dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
<SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          {/* Navbar - Fixed at top */}
          <View style={styles.navWrapper}>
            <NavbarV
              menuColorClass="bg-black/100"
              highlightColorClass="bg-indigo-600 text-white"
              activeHref="/Explore"
              compact
            />
          </View>        
          
          
{/* ✅ Use ScrollView with nestedScrollEnabled */}
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true} // ✅ Add this
    >      
      
        {/* Connection Status */}
        <View style={styles.statusBar}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isConnected ? '● Live' : '● Offline'}
          </Text>
        </View>

        {/* Soul Profile */}
        <View style={styles.section}>
          <SoulProfile soulTest={soulTest} loading={false} emotion={emotion} />
        </View>

        {/* Soul Matches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Your Matches</Text>
          <SoulMatches
            matches={matches}
            loading={false}
            sendingWhisper={sendingWhisper}
            handleSendWhisper={handleSendWhisper}
            emotion={emotion}
          />
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📭 Activity Feed</Text>
          <ActivityFeed
            activityFeed={activityFeed}
            realtimeNotifications={realtimeNotifications}
            loadingActivity={loadingActivity}
            isConnected={isConnected}
            respondingToRequest={respondingToRequest}
            loadActivityFeed={loadActivityFeed}
            handleRespondToWhisper={handleRespondToWhisper}
            handleRespondToSoulChat={handleRespondToSoulChat}
            markNotificationAsRead={markNotificationAsRead}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Lyfari © {new Date().getFullYear()} — A space to connect souls, safely and
            beautifully.
          </Text>
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navWrapper: {
    backgroundColor: '#000000ff', // ✅ Background for sticky header
    paddingVertical: 8,
  },
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  footer: {
    paddingVertical: 24,
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

export default LyfariVirtualDashboard;
