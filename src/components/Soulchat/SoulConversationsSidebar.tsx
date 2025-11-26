// src/components/Soul/SoulConversationsSidebar.tsx (React Native)

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import Config from 'react-native-config';

interface SoulConversation {
  id: string;
  partner: { id: string; name: string; avatar?: string };
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount?: number;
}

interface SoulConversationsSidebarProps {
  conversations: SoulConversation[];
  selectedChatId: string | null;
  setSelectedChatId: (id: string) => void;
  pinnedChats: string[];
  onNewChatClick?: () => void;
}

const SoulConversationsSidebar: React.FC<SoulConversationsSidebarProps> = ({
  conversations,
  selectedChatId,
  setSelectedChatId,
  pinnedChats,
  onNewChatClick,
}) => {
  const renderConversation = ({ item }: { item: SoulConversation }) => {
    const isSelected = selectedChatId === item.id;
    const isPinned = pinnedChats.includes(item.id);
    const avatarUrl =
      item.partner.avatar &&
      (item.partner.avatar.startsWith('http')
        ? item.partner.avatar
        : `${Config.NEXT_PUBLIC_BACKEND_URL}${item.partner.avatar}`);

    return (
      <TouchableOpacity
        onPress={() => setSelectedChatId(item.id)}
        style={[
          styles.conversationItem,
          isSelected && styles.conversationItemActive,
        ]}
      >
        <View style={styles.conversationContent}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              defaultSource={{ uri: '' }}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {item.partner.name[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.conversationInfo}>
            <View style={styles.nameRow}>
              {isPinned && <Text style={styles.pinIcon}>📌</Text>}
              <Text
                style={styles.partnerName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.partner.name}
              </Text>
            </View>
            <Text
              style={styles.lastMessage}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>

          <Text style={styles.timestamp}>
            {new Date(item.lastMessageTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
        {onNewChatClick && (
          <TouchableOpacity onPress={onNewChatClick} style={styles.newBtn}>
            <Text style={styles.newBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new soul connection
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 0.3,
    backgroundColor: '#1f2937',
    borderRightWidth: 1,
    borderRightColor: '#374151',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  newBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  conversationItemActive: {
    backgroundColor: '#6366f1',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  conversationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pinIcon: {
    fontSize: 12,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  lastMessage: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timestamp: {
    fontSize: 11,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default SoulConversationsSidebar;
