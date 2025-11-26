// src/components/Whispers/ConversationsSidebar.tsx (React Native - COMPLETE)

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface ConversationsSidebarProps {
  showSidebar: boolean;
  loading: boolean;
  conversationsWithTTL: any[];
  selectedChatId: string | null;
  setSelectedChatId: (id: string) => void;
  setShowSidebar: (show: boolean) => void;
  formatTimestamp: (timestamp: string) => string;
  getTTLColor: (daysLeft: number) => string;
}

export default function ConversationsSidebar({
  showSidebar,
  loading,
  conversationsWithTTL,
  selectedChatId,
  setSelectedChatId,
  setShowSidebar,
  formatTimestamp,
  getTTLColor,
}: ConversationsSidebarProps) {
  // Sort so pinned chats appear first, then by lastMessageTime desc
  const sortedConversations = useMemo(() => {
    return [...conversationsWithTTL].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
      );
    });
  }, [conversationsWithTTL]);

  if (!showSidebar) {
    return null;
  }

  const renderConversation = ({ item }: { item: any }) => {
    const isSelected = selectedChatId === item.id;
    const bgColor = isSelected ? '#1f2937' : 'transparent';

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedChatId(item.id);
          setShowSidebar(false);
        }}
        style={[
          styles.conversationItem,
          { backgroundColor: bgColor },
          isSelected && styles.conversationItemSelected,
        ]}
      >
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={styles.partnerName}
              numberOfLines={1}
            >
              {item.partner.name}
            </Text>
            {item.isPinned && (
              <Text style={styles.pinIcon}>📌</Text>
            )}
          </View>

          <Text
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {item.lastMessage || 'No messages yet'}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessageTime)}
            </Text>
            <View
              style={[
                styles.ttlBadge,
                {
                  backgroundColor: getTTLColor(item.daysLeft),
                },
              ]}
            >
              <Text style={styles.ttlText}>
                {item.daysLeft}d
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Whispers</Text>
        <Text style={styles.headerSubtitle}>
          Temporary conversations • Auto-delete after 7 days
        </Text>
      </View>

      {sortedConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Accept a whisper request to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
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
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  conversationItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  conversationItemSelected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  conversationContent: {
    gap: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  pinIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 12,
    color: '#d1d5db',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },
  ttlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ttlText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
});
