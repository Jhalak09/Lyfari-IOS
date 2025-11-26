// src/components/Posts/ProfilePostsGrid.tsx (React Native - Updated)

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Post } from '../../types/post.types';
import PostCard from './PostCard';

interface ProfilePostsGridProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const ProfilePostsGrid: React.FC<ProfilePostsGridProps> = ({
  posts,
  onPostClick,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');

  // ✅ Separate posts and reels (same logic as Next.js)
  const imagePosts = posts.filter(
    post => post.type === 'IMAGE' || post.type === 'VIDEO'
  );
  const videoReels = posts.filter(post => post.type === 'REEL');

  const displayPosts = activeTab === 'posts' ? imagePosts : videoReels;

  // Empty state when no posts at all
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          When they share photos, you'll see them here.
        </Text>
      </View>
    );
  }

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.itemWrapper}>
      <PostCard post={item} onPress={() => onPostClick(item)} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.header}>
        {/* Tabs Container */}
        <View style={styles.tabsContainer}>
          {/* POSTS Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('posts')}
            style={[
              styles.tab,
              activeTab === 'posts' && styles.tabActive,
            ]}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabIcon,
                  activeTab === 'posts' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                ▦
              </Text>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'posts' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                POSTS
              </Text>
              <Text style={styles.tabCount}>({imagePosts.length})</Text>
            </View>
          </TouchableOpacity>

          {/* REELS Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('reels')}
            style={[
              styles.tab,
              activeTab === 'reels' && styles.tabActive,
            ]}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabIcon,
                  activeTab === 'reels' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                ▶
              </Text>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'reels' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                REELS
              </Text>
              <Text style={styles.tabCount}>({videoReels.length})</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Count on right */}
        <Text style={styles.totalCount}>{displayPosts.length}</Text>
      </View>

      {/* Empty state for active tab */}
      {displayPosts.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'posts' ? '📷' : '🎬'}
          </Text>
          <Text style={styles.emptyTitle}>No {activeTab} yet</Text>
          <Text style={styles.emptySubtitle}>
            When they share {activeTab}, you'll see them here.
          </Text>
        </View>
      )}

      {/* Grid - 3 columns */}
      {displayPosts.length > 0 && (
        <FlatList
          data={displayPosts}
          renderItem={renderPost}
          keyExtractor={item => String(item.id)}
          numColumns={3}
          key="3-columns" // Force re-render if numColumns changes
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2;
const ITEM_SIZE = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 16,
    paddingBottom: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  tab: {
    paddingBottom: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#f1f5f9',
  },
  tabTextInactive: {
    color: '#64748b',
  },
  tabCount: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '400',
  },
  totalCount: {
    fontSize: 12,
    color: '#475569',
  },
  gridContent: {
    paddingHorizontal: 2,
  },
  columnWrapper: {
    gap: 2,
    marginBottom: 2,
  },
  itemWrapper: {
    width: ITEM_SIZE,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ProfilePostsGrid;
