// src/components/Profile/ProfileHeader.tsx (React Native - Fixed)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';

interface Profile {
  id: string | number;
  userId: string | number;
  name: string;
  avatarUrl?: string;
  about?: string;
  pronouns?: string;
  interests?: string;
  accountType: 'PUBLIC' | 'PRIVATE';
}

interface ProfileHeaderProps {
  profile: Profile | null;
  isSelf: boolean;
  onEdit: () => void;
  onFollowStatusChange?: (status: {
    isFollowing: boolean;
    requestPending: boolean;
  }) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isSelf,
  onEdit,
  onFollowStatusChange,
}) => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean;
    requestPending: boolean;
    loading: boolean;
  }>({
    isFollowing: false,
    requestPending: false,
    loading: false,
  });
  const [stats, setStats] = useState<{
    posts: number;
    followers: number;
    following: number;
    loading: boolean;
  }>({
    posts: 0,
    followers: 0,
    following: 0,
    loading: true,
  });

  // ✅ Wrap in useCallback to stabilize reference
  const fetchStats = useCallback(async () => {
    if (!profile?.userId) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const statsRes = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${profile.userId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          posts: 0,
          followers: statsData.data.followers,
          following: statsData.data.following,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [profile?.userId]);

  // ✅ Wrap in useCallback to stabilize reference
  const checkFollowStatus = useCallback(async () => {
    if (!profile?.userId) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const followRes = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${profile.userId}/is-following`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (followRes.ok) {
        const followData = await followRes.json();
        setFollowStatus(prev => ({
          ...prev,
          isFollowing: followData.data.isFollowing,
        }));
      }

      if (profile?.accountType === 'PRIVATE') {
        const requestRes = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/follow-requests/sent`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (requestRes.ok) {
          const requestData = await requestRes.json();
          const hasPendingRequest = requestData.data.some(
            (req: any) => req.target.id === profile?.userId,
          );
          setFollowStatus(prev => ({
            ...prev,
            requestPending: hasPendingRequest,
          }));
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [profile?.userId, profile?.accountType]);

  // ✅ Effect 1: Notify parent of follow status changes
  useEffect(() => {
    if (onFollowStatusChange) {
      onFollowStatusChange({
        isFollowing: followStatus.isFollowing,
        requestPending: followStatus.requestPending,
      });
    }
  }, [followStatus.isFollowing, followStatus.requestPending, onFollowStatusChange]);

  // ✅ Effect 2: Get current user ID
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString(),
          );
          setCurrentUserId(decoded.userId);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    getCurrentUser();
  }, []);

  // ✅ Effect 3: Fetch stats and check follow status
  useEffect(() => {
    if (profile?.userId) {
      fetchStats();
      if (!isSelf) {
        checkFollowStatus();
      }
    }
  }, [profile?.userId, isSelf, fetchStats, checkFollowStatus]);

  const handleFollowAction = async () => {
    if (!profile) return;
    setFollowStatus(prev => ({ ...prev, loading: true }));

    try {
      const token = await AsyncStorage.getItem('token');

      if (followStatus.isFollowing) {
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${profile.userId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.ok) {
          setFollowStatus({
            isFollowing: false,
            requestPending: false,
            loading: false,
          });
          setStats(prev => ({
            ...prev,
            followers: Math.max(0, prev.followers - 1),
          }));
          Toast.show({ type: 'success', text1: 'Unfollowed successfully' });
        } else {
          throw new Error('Failed to unfollow');
        }
      } else if (followStatus.requestPending) {
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/follow-requests/${profile.userId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.ok) {
          setFollowStatus({
            isFollowing: false,
            requestPending: false,
            loading: false,
          });
          Toast.show({ type: 'success', text1: 'Request cancelled' });
        } else {
          throw new Error('Failed to cancel request');
        }
      } else {
        const endpoint =
          profile.accountType === 'PRIVATE'
            ? `/follow-requests/${profile.userId}`
            : `/follow/${profile.userId}`;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.ok) {
          if (profile.accountType === 'PRIVATE') {
            setFollowStatus({
              isFollowing: false,
              requestPending: true,
              loading: false,
            });
            Toast.show({ type: 'success', text1: 'Follow request sent' });
          } else {
            setFollowStatus({
              isFollowing: true,
              requestPending: false,
              loading: false,
            });
            setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            Toast.show({ type: 'success', text1: 'Following' });
          }
        } else {
          const error = await res.json();
          throw new Error(error.message || 'Failed to follow');
        }
      }
    } catch (error: any) {
      console.error('Follow action error:', error);
      Toast.show({ type: 'error', text1: error.message || 'Something went wrong' });
      setFollowStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const getFollowButtonText = () => {
    if (followStatus.loading) return 'Loading...';
    if (followStatus.isFollowing) return 'Following';
    if (followStatus.requestPending) return 'Requested';
    return profile?.accountType === 'PRIVATE' ? 'Request' : 'Follow';
  };

  const getFollowButtonStyle = () => {
    if (followStatus.isFollowing || followStatus.requestPending) {
      return styles.followBtnSecondary;
    }
    return styles.followBtnPrimary;
  };

  if (!profile || !currentUserId) return null;

  const avatarUri = profile.avatarUrl
    ? `${Config.NEXT_PUBLIC_BACKEND_URL}${profile.avatarUrl}`
    : undefined;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarBox}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {profile.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Name & Type */}
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.accountType}>
        {profile.accountType === 'PUBLIC' ? '🌐 Public' : '🔒 Private'} Profile
      </Text>

      {/* Action Button */}
      {isSelf ? (
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Text style={styles.editText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleFollowAction}
          disabled={followStatus.loading}
          style={[getFollowButtonStyle(), followStatus.loading && { opacity: 0.6 }]}
        >
          <Text style={styles.followBtnText}>{getFollowButtonText()}</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.loading ? '...' : stats.posts}
          </Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.loading ? '...' : stats.followers.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.loading ? '...' : stats.following.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioBox}>
        <Text style={styles.bioText}>
          {profile.about || 'Living, learning, and connecting. ✨'}
        </Text>
        {profile.pronouns && (
          <Text style={styles.bioDetail}>💬 {profile.pronouns}</Text>
        )}
        {profile.interests && (
          <Text style={styles.bioDetail}>✨ {profile.interests}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  avatarBox: { marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#ffffff', fontSize: 36, fontWeight: '700' },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  accountType: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
  },
  editText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  followBtnPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    marginBottom: 16,
  },
  followBtnSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
  },
  followBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  bioBox: { width: '100%', paddingHorizontal: 8 },
  bioText: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  bioDetail: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
  },
});
