// src/screens/ExplorePage.tsx (React Native)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Navbar from '../components/layout/Navbar';
import SearchBar from '../components/Search/SearchBar';
import  {PostDetail}  from '../components/Posts/PostDetail';

interface ExplorePost {
  id: number;
  userId: number;
  caption: string | null;
  type: string;
  video?: string;
  image?: string;
  mediaType: string;
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    profile: {
      avatarUrl?: string | null;
    };
  };
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SPACING = 3;
const ITEM_SIZE = (width - ITEM_SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

const ExplorePage: React.FC = () => {
  const [explorePosts, setExplorePosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [loadingPostDetail, setLoadingPostDetail] = useState(false);

  useEffect(() => {
    fetchExploreFeed();
  }, []);

  const fetchExploreFeed = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/feed/explore`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setExplorePosts(data.data || []);
      }
    } catch (error) {
      console.error('Explore feed error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = async (postId: number) => {
    setLoadingPostDetail(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error('Failed to load post details');
      const json = await response.json();
      setSelectedPost(json.data);
    } catch (error) {
      console.error('Load post detail error:', error);
      setSelectedPost(null);
    } finally {
      setLoadingPostDetail(false);
    }
  };

  const closePostDetail = () => {
    setSelectedPost(null);
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${Config.NEXT_PUBLIC_BACKEND_URL}${url}`;
  };

  const getAvatarUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${Config.NEXT_PUBLIC_BACKEND_URL}${url}`;
  };

  const getMediaType = (post: ExplorePost) => {
    if (post.type === 'REEL' || post.mediaType === 'REEL') return 'video';
    if (post.mediaType?.startsWith('video/')) return 'video';
    if (post.mediaType?.startsWith('image/')) return 'image';
    if (post.type === 'IMAGE') return 'image';
    if (post.type === 'VIDEO') return 'video';
    return 'image';
  };

  const getGridItemStyle = (index: number) => {
    const pattern = index % 10;
    if (pattern === 0) {
      return { width: ITEM_SIZE, height: ITEM_SIZE * 2 };
    }
    if (pattern === 4) {
      return { width: ITEM_SIZE * 2, height: ITEM_SIZE * 2 };
    }
    return { width: ITEM_SIZE, height: ITEM_SIZE };
  };

  const renderPost = ({ item, index }: { item: ExplorePost; index: number }) => {
    const mediaType = getMediaType(item);
    const avatarUrl = getAvatarUrl(item.user?.profile?.avatarUrl);
    const itemStyle = getGridItemStyle(index);

    return (
      <TouchableOpacity
        onPress={() => handlePostClick(item.id)}
        style={[styles.gridItem, itemStyle]}
        activeOpacity={0.9}
      >
        {/* Media */}
        {mediaType === 'image' && item.image ? (
          <Image
            source={{ uri: getMediaUrl(item.image) }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : mediaType === 'video' && item.video ? (
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: getMediaUrl(item.video) }}
              style={styles.media}
              resizeMode="cover"
            />
            <View style={styles.videoIndicator}>
              <Text style={styles.videoIcon}>▶</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noMedia}>
            <Text style={styles.noMediaText}>No media available</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <View style={styles.overlay} />

        {/* Stats - centered */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statText}>
                {item.likes?.toLocaleString() || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>
                {item.comments?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* User info - bottom */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {item.user?.name?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.userName} numberOfLines={1}>
              {item.user?.name || 'Unknown User'}
            </Text>
          </View>
        </View>

        {/* Video indicator - top right */}
        {mediaType === 'video' && (
          <View style={styles.videoTopIndicator}>
            <Text style={styles.videoTopIcon}>▶</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          {/* Navbar - Fixed at top */}
          <View style={styles.navWrapper}>
            <Navbar
              menuColorClass="bg-black/100"
              highlightColorClass="bg-indigo-600 text-white"
              activeHref="/Explore"
              compact
            />
          </View>

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>

        {/* SearchBar */}
        <View style={styles.searchWrapper}>
          <SearchBar />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discover</Text>
          <TouchableOpacity onPress={fetchExploreFeed} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <View style={styles.spinnerOuter}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          </View>
        ) : explorePosts.length > 0 ? (
          <FlatList
            data={explorePosts}
            renderItem={renderPost}
            keyExtractor={item => String(item.id)}
            numColumns={COLUMN_COUNT}
            key={COLUMN_COUNT}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>🔍</Text>
            </View>
            <Text style={styles.emptyTitle}>No posts to explore yet</Text>
            <Text style={styles.emptySubtitle}>Check back later for new content</Text>
          </View>
        )}
      </View>

      {/* PostDetail Component - just like Next.js */}
      {selectedPost && <PostDetail post={selectedPost} onClose={closePostDetail} />}

      {/* Loading overlay when fetching post detail */}
      {loadingPostDetail && (
        <View style={styles.loadingDetailOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navWrapper: {
    backgroundColor: '#000000ff', // ✅ Background for sticky header
    paddingVertical: 8,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 12,
  },
  headerIcon: {
    fontSize: 28,
    color: '#818cf8',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#818cf8',
  },
  searchWrapper: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  refreshText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  spinnerOuter: {
    position: 'relative',
  },
  gridContent: {
    paddingBottom: 20,
  },
  gridItem: {
    margin: ITEM_SPACING / 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.1)',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  videoIcon: {
    color: '#ffffff',
    fontSize: 16,
  },
  noMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMediaText: {
    color: '#ffffff',
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 20,
  },
  statText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  userName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  videoTopIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  videoTopIcon: {
    color: '#ffffff',
    fontSize: 12,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99,102,241,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#818cf8',
  },
  emptyTitle: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 14,
  },
  loadingDetailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

export default ExplorePage;
