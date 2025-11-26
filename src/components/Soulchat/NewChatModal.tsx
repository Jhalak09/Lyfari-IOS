// src/components/Soul/NewChatModal.tsx (React Native - Fixed)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

interface User {
  id: number;
  name: string;
  username: string;
  profile?: {
    avatarUrl?: string | null;
    about?: string;
  };
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: number) => void;
  currentUserId: number;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    'following'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<number | null>(null);

  // ✅ Wrap fetchUsers in useCallback to stabilize reference
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint =
        activeTab === 'followers'
          ? `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${currentUserId}/followers`
          : `${Config.NEXT_PUBLIC_BACKEND_URL}/follow/${currentUserId}/following`;

      console.log('🔍 Fetching users from:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Raw API response:', data);

        // ✅ Same data transformation as Next.js
        const userList = (data.data || []).filter(
          (user: any) => user && user.id
        );
        console.log('✅ User list:', userList);

        setUsers(userList);
        setFilteredUsers(userList);
      } else {
        console.error('❌ Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUserId]); // ✅ Add dependencies

  // ✅ Fetch users when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]); // ✅ Include fetchUsers in dependencies

  // ✅ Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(
        user =>
          user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // ✅ Create chat (same logic as Next.js)
  const handleCreateChat = async (userId: number) => {
    setCreating(userId);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soul-chat/start/${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        onChatCreated(data.data.id);
        onClose();
      } else {
        const error = await response.json();
        // ✅ Use Alert.alert instead of alert
        Alert.alert('Error', error.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      // ✅ Use Alert.alert instead of alert
      Alert.alert('Error', 'Failed to create chat');
    } finally {
      setCreating(null);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const avatarUrl =
      item.profile?.avatarUrl &&
      (item.profile.avatarUrl.startsWith('http')
        ? item.profile.avatarUrl
        : `${Config.NEXT_PUBLIC_BACKEND_URL}${item.profile.avatarUrl}`);

    return (
      <TouchableOpacity
        onPress={() => handleCreateChat(item.id)}
        disabled={creating === item.id}
        style={styles.userRow}
        activeOpacity={0.7}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {item.name[0].toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>

        {creating === item.id ? (
          <ActivityIndicator color="#6366f1" />
        ) : (
          <Text style={styles.arrow}>→</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Conversation</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('following')}
              style={[
                styles.tab,
                activeTab === 'following' && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'following' && styles.tabTextActive,
                ]}
              >
                Following
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('followers')}
              style={[
                styles.tab,
                activeTab === 'followers' && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'followers' && styles.tabTextActive,
                ]}
              >
                Followers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or username..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </View>

          {/* User List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found' : `No ${activeTab} yet`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUser}
              keyExtractor={item => String(item.id)}
              scrollEnabled={true}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    fontSize: 24,
    color: '#9ca3af',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchInput: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    fontSize: 14,
  },
  listContent: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 12,
    color: '#9ca3af',
  },
  arrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default NewChatModal;
