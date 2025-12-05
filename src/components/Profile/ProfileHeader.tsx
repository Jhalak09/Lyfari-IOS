// src/components/Profile/ProfileHeader.tsx (React Native)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';
import { jwtDecode } from 'jwt-decode';
import FollowersModal from './FollowersModal'; // ✅ Create this component

interface Profile {
  id: string | number;
  userId: string | number;
  name: string;
  avatarUrl?: string;
  about?: string;
  pronouns?: string;
  interests?: string;
  accountType: 'PUBLIC' | 'PRIVATE';
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface ProfileHeaderProps {
  profile: Profile | null;
  isSelf: boolean;
  onEdit: () => void;
  onFollowStatusChange?: (status: { isFollowing: boolean; requestPending: boolean }) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isSelf,
  onEdit,
  onFollowStatusChange,
}) => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');
  
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean;
    requestPending: boolean;
    loading: boolean;
  }>({
    isFollowing: false,
    requestPending: false,
    loading: false,
  });

  // ✅ Notify parent of follow status changes
  useEffect(() => {
    if (onFollowStatusChange) {
      onFollowStatusChange({
        isFollowing: followStatus.isFollowing,
        requestPending: followStatus.requestPending,
      });
    }
  }, [followStatus.isFollowing, followStatus.requestPending, onFollowStatusChange]);

  // ✅ Get current user ID from JWT token
  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode<{ userId?: number }>(token);
          setCurrentUserId(decoded.userId || null);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };
    getUserId();
  }, []);

  // ✅ Check follow status when profile changes
  useEffect(() => {
    if (profile && currentUserId && !isSelf) {
      checkFollowStatus();
    }
  }, [profile?.userId, currentUserId, isSelf]);

  // ✅ Check if following and if there's a pending request
  const checkFollowStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Check if already following
      const followRes = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${profile?.userId}/is-following`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (followRes.ok) {
        const followData = await followRes.json();
        setFollowStatus(prev => ({ ...prev, isFollowing: followData.data.isFollowing }));
      }

      // Check for pending request (private accounts only)
      if (profile?.accountType === 'PRIVATE') {
        const requestRes = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/follow-requests/sent`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (requestRes.ok) {
          const requestData = await requestRes.json();
          const hasPendingRequest = requestData.data.some(
            (req: any) => req.target.id === profile?.userId
          );
          setFollowStatus(prev => ({ ...prev, requestPending: hasPendingRequest }));
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  // ✅ Handle follow/unfollow/request actions
  const handleFollowAction = async () => {
    if (!profile) return;

    setFollowStatus(prev => ({ ...prev, loading: true }));

    try {
      const token = await AsyncStorage.getItem('token');

      // Unfollow
      if (followStatus.isFollowing) {
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${profile.userId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          setFollowStatus({ isFollowing: false, requestPending: false, loading: false });
          Toast.show({ type: 'success', text1: 'Unfollowed successfully' });
        } else {
          throw new Error('Failed to unfollow');
        }
      }
      // Cancel pending request
      else if (followStatus.requestPending) {
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/follow-requests/${profile.userId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          setFollowStatus({ isFollowing: false, requestPending: false, loading: false });
          Toast.show({ type: 'success', text1: 'Request cancelled' });
        } else {
          throw new Error('Failed to cancel request');
        }
      }
      // Follow or request to follow
      else {
        const endpoint =
          profile.accountType === 'PRIVATE'
            ? `/follow-requests/${profile.userId}`
            : `/follow/${profile.userId}`;

        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          if (profile.accountType === 'PRIVATE') {
            setFollowStatus({ isFollowing: false, requestPending: true, loading: false });
            Toast.show({ type: 'success', text1: 'Follow request sent' });
          } else {
            setFollowStatus({ isFollowing: true, requestPending: false, loading: false });
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

  // ✅ Get button text based on follow status
  const getFollowButtonText = () => {
    if (followStatus.loading) return 'Loading...';
    if (followStatus.isFollowing) return 'Following';
    if (followStatus.requestPending) return 'Requested';
    return profile?.accountType === 'PRIVATE' ? 'Request' : 'Follow';
  };

  // ✅ Get button style based on follow status
  const getFollowButtonStyle = () => {
    if (followStatus.isFollowing) {
      return styles.followingButton;
    }
    if (followStatus.requestPending) {
      return styles.requestedButton;
    }
    return styles.followButton;
  };

  if (!profile || !currentUserId) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: `${Config.NEXT_PUBLIC_BACKEND_URL}${profile.avatarUrl}` }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {profile.name?.[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.headerRow}>
              <View style={styles.nameSection}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.accountType}>
                  {profile.accountType === 'PUBLIC' ? '🌐 Public' : '🔒 Private'} Profile
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {isSelf ? (
                  <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                    <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleFollowAction}
                    disabled={followStatus.loading}
                    style={[
                      getFollowButtonStyle(),
                      followStatus.loading && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.followButtonText}>
                      {getFollowButtonText()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Stats - Using profile.stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.stats?.posts ?? 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>

              {/* Followers - Opens Modal */}
              <TouchableOpacity
                onPress={() => {
                  if (isSelf || profile.accountType === 'PUBLIC' || followStatus.isFollowing) {
                    setModalType('followers');
                    setShowFollowersModal(true);
                  }
                }}
                disabled={!isSelf && profile.accountType === 'PRIVATE' && !followStatus.isFollowing}
                style={[
                  styles.statItem,
                  (isSelf || profile.accountType === 'PUBLIC' || followStatus.isFollowing) &&
                    styles.statItemClickable,
                ]}
              >
                <Text style={styles.statNumber}>
                  {(profile.stats?.followers ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>

              {/* Following - Opens Modal */}
              <TouchableOpacity
                onPress={() => {
                  if (isSelf || profile.accountType === 'PUBLIC' || followStatus.isFollowing) {
                    setModalType('following');
                    setShowFollowersModal(true);
                  }
                }}
                disabled={!isSelf && profile.accountType === 'PRIVATE' && !followStatus.isFollowing}
                style={[
                  styles.statItem,
                  (isSelf || profile.accountType === 'PUBLIC' || followStatus.isFollowing) &&
                    styles.statItemClickable,
                ]}
              >
                <Text style={styles.statNumber}>
                  {(profile.stats?.following ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Bio & Details */}
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>
                {profile.about || 'Living, learning, and connecting. ✨'}
              </Text>

              <View style={styles.detailsRow}>
                {profile.pronouns && (
                  <Text style={styles.detailText}>💬 {profile.pronouns}</Text>
                )}
                {profile.interests && (
                  <Text style={styles.detailText}>✨ {profile.interests}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={Number(profile.userId)}
          currentUserId={currentUserId}
          type={modalType}
          username={profile.name}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'column',
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 128,
    height: 128,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '700',
  },
  infoSection: {
    flex: 1,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#a78bfa',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  followingButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#4b5563',
    borderRadius: 8,
  },
  requestedButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#4b5563',
    borderRadius: 8,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemClickable: {
    opacity: 0.8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  bioSection: {
    gap: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
