import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

interface User {
  id: number;
  name: string;
  username: string;
  profile: {
    avatarUrl: string | null;
    about: string | null;
  };
  isFollowedByYou: boolean;
  _count?: {
    followers: number;
    following: number;
  };
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  currentUserId: number;
  type: 'followers' | 'following';
  username: string;
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  currentUserId,
  type,
}: FollowersModalProps) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
const [users, setUsers] = useState<User[]>([]);
const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
    const navigation = useNavigation<any>();
  const isOwnProfile = userId === currentUserId;


  const fetchUsers = useCallback(async () => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const endpoint =
      type === 'followers'
        ? `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${userId}/followers`
        : `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${userId}/following`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setUsers(data.data || []);
    } else {
      Toast.show({ type: 'error', text1: 'Failed to load users' });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    Toast.show({ type: 'error', text1: 'Failed to load users' });
  } finally {
    setLoading(false);
  }
}, [type, userId]);    // ← include dependencies that affect the request


 useEffect(() => {
  if (isOpen) {
    fetchUsers();
  }
}, [isOpen, fetchUsers]);

const handleFollow = async (targetUserId: number) => {
  setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const res = await fetch(
      `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${targetUserId}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.ok) {
      setUsers(prev =>
        prev.map(u =>
          u.id === targetUserId ? { ...u, isFollowedByYou: true } : u,
        ),
      );
      Toast.show({ type: 'success', text1: 'Followed successfully' });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to follow' });
    }
  } catch (error) {
    console.error('Error following user:', error);
    Toast.show({ type: 'error', text1: 'Failed to follow' });
  } finally {
    setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
  }
};

const handleUnfollow = async (targetUserId: number) => {
  setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const res = await fetch(
      `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${targetUserId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.ok) {
      setUsers(prev =>
        prev.map(u =>
          u.id === targetUserId ? { ...u, isFollowedByYou: false } : u,
        ),
      );
      Toast.show({ type: 'success', text1: 'Unfollowed successfully' });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to unfollow' });
    }
  } catch (error) {
    console.error('Error unfollowing user:', error);
    Toast.show({ type: 'error', text1: 'Failed to unfollow' });
  } finally {
    setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
  }
};

const handleRemove = async (targetUserId: number) => {
  setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const res = await fetch(
      `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/followers/${targetUserId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
      Toast.show({ type: 'success', text1: 'Follower removed' });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to remove follower' });
    }
  } catch (error) {
    console.error('Error removing follower:', error);
    Toast.show({ type: 'error', text1: 'Failed to remove follower' });
  } finally {
    setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
  }
};


  const handleProfileClick = (targetUserId: number) => {
    // Same behavior as: router.push(`/lyfari/real/profile/${targetUserId}`)
    navigation.navigate('RealProfile', { userId: targetUserId });
    onClose();
  };

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {type === 'followers' ? 'Followers' : 'Following'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          {/* User List */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color="#4f46e5" />
              </View>
            ) : filteredUsers.length > 0 ? (
              <ScrollView>
                {filteredUsers.map(user => (
                  <View key={user.id} style={styles.userRow}>
                    <TouchableOpacity
                      style={styles.userInfo}
                      onPress={() => handleProfileClick(user.id)}
                    >
                      {user.profile.avatarUrl ? (
                        <Image
                          source={{
                            uri: `${Config.NEXT_PUBLIC_BACKEND_URL}${user.profile.avatarUrl}`,
                          }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.fallbackAvatar}>
                          <Text style={styles.fallbackInitial}>
                            {user.name[0]?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userTextBox}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {user.name}
                        </Text>
                        {user.profile.about && (
                          <Text style={styles.userAbout} numberOfLines={1}>
                            {user.profile.about}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {user.id !== currentUserId && (
                      <View>
                        {isOwnProfile && type === 'followers' ? (
                          <TouchableOpacity
                            onPress={() => handleRemove(user.id)}
                            disabled={!!actionLoading[user.id]}
                            style={[
                              styles.actionBtn,
                              styles.actionBtnNeutral,
                              actionLoading[user.id] && styles.actionBtnDisabled,
                            ]}
                          >
                            <Text style={styles.actionBtnText}>
                              {actionLoading[user.id] ? '...' : 'Remove'}
                            </Text>
                          </TouchableOpacity>
                        ) : isOwnProfile && type === 'following' ? (
                          <TouchableOpacity
                            onPress={() => handleUnfollow(user.id)}
                            disabled={!!actionLoading[user.id]}
                            style={[
                              styles.actionBtn,
                              styles.actionBtnNeutral,
                              actionLoading[user.id] && styles.actionBtnDisabled,
                            ]}
                          >
                            <Text style={styles.actionBtnText}>
                              {actionLoading[user.id] ? '...' : 'Following'}
                            </Text>
                          </TouchableOpacity>
                        ) : user.isFollowedByYou ? (
                          <TouchableOpacity
                            onPress={() => handleUnfollow(user.id)}
                            disabled={!!actionLoading[user.id]}
                            style={[
                              styles.actionBtn,
                              styles.actionBtnNeutral,
                              actionLoading[user.id] && styles.actionBtnDisabled,
                            ]}
                          >
                            <Text style={styles.actionBtnText}>
                              {actionLoading[user.id] ? '...' : 'Following'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleFollow(user.id)}
                            disabled={!!actionLoading[user.id]}
                            style={[
                              styles.actionBtn,
                              styles.actionBtnPrimary,
                              actionLoading[user.id] && styles.actionBtnDisabled,
                            ]}
                          >
                            <Text style={styles.actionBtnText}>
                              {actionLoading[user.id] ? '...' : 'Follow'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : `No ${type} yet`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#111827',
    borderRadius: 16,
    width: '90%',
    maxHeight: 600,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.4)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 18,
  },
  closeIcon: {
    color: '#9ca3af',
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  searchInput: {
    backgroundColor: 'rgba(31,41,55,0.7)',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 14,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  loaderBox: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    marginRight: 10,
  },
  fallbackAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    marginRight: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackInitial: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  userTextBox: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  userAbout: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnNeutral: {
    backgroundColor: '#374151',
  },
  actionBtnPrimary: {
    backgroundColor: '#4f46e5',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
    color: '#6b7280',
  },
  emptyText: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
