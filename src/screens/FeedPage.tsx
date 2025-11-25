// src/screens/FeedPage.tsx (React Native)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../components/layout/Navbar';
import StoriesCarousel from '../components/Stories/StoriesCarousel';
import SidebarContainer from '../components/Feed/SidebarContainer';

type Post = {
  id: string;
  user: { id: string; name: string; avatar?: string };
  image?: string;
  video?: string;
  caption?: string;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
};

type Comment = {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    profile: {
      avatarUrl?: string | null;
    };
  };
  postId: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
};

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  const navigation = useNavigation<NavigationProp<any>>();

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const feedPosts: Post[] = json?.data || [];
      setPosts(feedPosts);

      const likedPostIds = new Set<string>(
        feedPosts.filter(p => p.isLiked).map(p => p.id),
      );
      setUserLikes(likedPostIds);

      try {
        const storiesRes = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/stories/feed`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (storiesRes.ok) {
          const storiesData = await storiesRes.json();
          setStories(storiesData.data || []);
        }
      } catch {
        // stories not available
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();

    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<{ userId: number }>(token);
          setCurrentUserId(decoded.userId);
        } catch (e) {
            console.log(e)
        }
      }
    })();
  }, [fetchFeed]);

  const handleUsernameClick = (userId: string) => {
    navigation.navigate('ProfileVirtual', { userId });
  };

  const handleLike = async (postId: string) => {
    try {
      const isLiked = userLikes.has(postId);

      setUserLikes(prev => {
        const setCopy = new Set(prev);
        if (isLiked) setCopy.delete(postId);
        else setCopy.add(postId);
        return setCopy;
      });

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
              }
            : p,
        ),
      );

      const token = await AsyncStorage.getItem('token');
      const endpoint = `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${postId}/like`;
      const response = await fetch(endpoint, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setUserLikes(prev => {
          const setCopy = new Set(prev);
          if (isLiked) setCopy.add(postId);
          else setCopy.delete(postId);
          return setCopy;
        });
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? {
                  ...p,
                  likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
                }
              : p,
          ),
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleView = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${postId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setLoadingComments(true);
    setPostComments([]);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${postId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setPostComments(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  };

  const closeComments = () => {
    setSelectedPostId(null);
    setPostComments([]);
    setCommentText('');
  };

  const submitComment = async () => {
    if (!commentText.trim() || !selectedPostId) return;

    setSubmittingComment(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${selectedPostId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentText }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPostComments(prev => [data.data, ...prev]);
        setPosts(prev =>
          prev.map(p =>
            p.id === selectedPostId
              ? { ...p, comments: p.comments + 1 }
              : p,
          ),
        );
        setCommentText('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your feed...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Navbar */}
      <View style={styles.navWrapper}>
        <Navbar
          menuColorClass="bg-black/100"
          highlightColorClass="bg-indigo-600 text-white"
          activeHref="/home"
          compact
        />
      </View>

      {/* Main content */}
      <View style={styles.mainRow}>
        {/* Left: Stories (desktop-only in web; here just left column) */}
        <View style={styles.leftCol}>
          <StoriesCarousel
            stories={stories}
            currentUserId={currentUserId}
          />
        </View>

        {/* Center: Feed */}
        <View style={styles.centerCol}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Feed</Text>
            <Text style={styles.feedCount}>{posts.length} posts</Text>
          </View>

          <View style={styles.feedCard}>
            <ScrollView
              contentContainerStyle={styles.feedScroll}
              showsVerticalScrollIndicator={false}
            >
              {posts.length === 0 ? (
                <View style={styles.emptyFeedBox}>
                  <Text style={styles.emptyFeedTitle}>
                    No posts yet in your feed
                  </Text>
                  <Text style={styles.emptyFeedSub}>
                    Start sharing your moments to connect with others
                  </Text>
                </View>
              ) : (
                posts.map(post => (
                  <View key={post.id} style={styles.postCard}>
                    {/* Header */}
                    <View style={styles.postHeader}>
                      <Image
                        source={{
                          uri: post.user.avatar
                            ? `${Config.NEXT_PUBLIC_BACKEND_URL}${post.user.avatar}`
                            : `${Config.NEXT_PUBLIC_BACKEND_URL}/lyfari-logo.png`,
                        }}
                        style={styles.avatar}
                      />
                      <View style={styles.postHeaderTextBox}>
                        <TouchableOpacity
                          onPress={() => handleUsernameClick(post.user.id)}
                        >
                          <Text style={styles.username} numberOfLines={1}>
                            {post.user.name}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.postDate}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    {/* Media */}
                    <View style={styles.mediaBox}>
                      {post.image ? (
                        <TouchableOpacity onPress={() => handleView(post.id)}>
                          <Image
                            source={{ uri: post.image }}
                            style={styles.media}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      ) : post.video ? (
                        // For native video, integrate react-native-video; placeholder box for now
                        <TouchableOpacity
                          onPress={() => handleView(post.id)}
                          style={styles.videoPlaceholder}
                        >
                          <Text style={styles.videoText}>Video</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.noMediaBox}>
                          <Text style={styles.noMediaText}>No media</Text>
                        </View>
                      )}
                    </View>

                    {/* Footer / actions */}
                    <View style={styles.postFooter}>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          onPress={() => handleLike(post.id)}
                          style={[
                            styles.likeBtn,
                            userLikes.has(post.id) && styles.likeBtnActive,
                          ]}
                        >
                          <Text style={styles.likeIcon}>
                            {userLikes.has(post.id) ? '❤️' : '♥'}
                          </Text>
                          <Text style={styles.countText}>{post.likes}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openComments(post.id)}
                          style={styles.commentBtn}
                        >
                          <Text style={styles.commentIcon}>💬</Text>
                          <Text style={styles.countText}>
                            {post.comments}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareBtn}>
                          <Text style={styles.shareIcon}>↗</Text>
                        </TouchableOpacity>
                      </View>

                      {post.caption ? (
                        <Text style={styles.caption}>
                          <Text style={styles.captionUser}>
                            {post.user.name}{' '}
                          </Text>
                          {post.caption}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Right: Sidebar (optional on mobile) */}
        <View style={styles.rightCol}>
          <SidebarContainer />
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={!!selectedPostId}
        transparent
        animationType="fade"
        onRequestClose={closeComments}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={closeComments}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.commentsScroll}
              contentContainerStyle={{ padding: 12 }}
            >
              {loadingComments ? (
                <View style={styles.commentsLoader}>
                  <ActivityIndicator color="#6366F1" />
                </View>
              ) : postComments.length === 0 ? (
                <View style={styles.noCommentsBox}>
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              ) : (
                postComments.map(comment => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Image
                      source={{
                        uri: comment.author?.profile?.avatarUrl
                          ? `${Config.NEXT_PUBLIC_BACKEND_URL}${comment.author.profile.avatarUrl}`
                          : `${Config.NEXT_PUBLIC_BACKEND_URL}/lyfari-logo.png`,
                      }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContentBox}>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthor}>
                          {comment.author.name}
                        </Text>
                        <Text style={styles.commentText}>
                          {comment.content}
                        </Text>
                      </View>
                      <Text style={styles.commentDate}>
                        {new Date(
                          comment.createdAt,
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#9ca3af"
                style={styles.commentInput}
                onSubmitEditing={submitComment}
              />
              <TouchableOpacity
                onPress={submitComment}
                disabled={!commentText.trim() || submittingComment}
                style={[
                  styles.commentSendBtn,
                  (!commentText.trim() || submittingComment) &&
                    styles.commentSendBtnDisabled,
                ]}
              >
                <Text style={styles.commentSendText}>
                  {submittingComment ? '...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: { alignItems: 'center' },
  loadingText: { color: '#a5b4fc', marginTop: 8 },
  navWrapper: {
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  leftCol: {
    width: 80,
    paddingRight: 8,
  },
  centerCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  rightCol: {
    width: 0, // hide on mobile; adjust if needed
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feedTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  feedCount: { color: '#9ca3af', fontSize: 12 },
  feedCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.4)',
    backgroundColor: 'rgba(15,23,42,0.96)',
    overflow: 'hidden',
  },
  feedScroll: { padding: 10, paddingBottom: 16 },
  emptyFeedBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyFeedTitle: {
    color: '#f9fafb',
    marginBottom: 4,
  },
  emptyFeedSub: {
    color: '#c7d2fe',
    fontSize: 12,
  },
  postCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: 'rgba(15,23,42,0.9)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  postHeaderTextBox: { flex: 1 },
  username: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  postDate: { color: '#a5b4fc', fontSize: 11 },
  mediaBox: { backgroundColor: '#000000' },
  media: {
    width: '100%',
    height: 260,
    backgroundColor: '#000000',
  },
  videoPlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: { color: '#e5e7eb' },
  noMediaBox: {
    width: '100%',
    height: 260,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMediaText: { color: '#f9fafb' },
  postFooter: { padding: 8 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  likeBtnActive: { transform: [{ scale: 1.05 }] },
  likeIcon: { fontSize: 18, color: '#f97373', marginRight: 4 },
  countText: { color: '#f9fafb', fontSize: 13 },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  commentIcon: { fontSize: 18, color: '#ffffff', marginRight: 4 },
  shareBtn: { marginLeft: 'auto' },
  shareIcon: { fontSize: 18, color: '#ffffff' },
  caption: { color: '#f9fafb', fontSize: 13 },
  captionUser: { fontWeight: '700', color: '#ffffff' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#020617',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.4)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalClose: { color: '#e5e7eb', fontSize: 20 },
  commentsScroll: { flex: 1 },
  commentsLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noCommentsBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noCommentsText: { color: '#9ca3af' },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  commentContentBox: { flex: 1 },
  commentBubble: {
    backgroundColor: 'rgba(31,41,55,0.9)',
    borderRadius: 10,
    padding: 8,
  },
  commentAuthor: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  commentText: { color: '#f9fafb', fontSize: 13 },
  commentDate: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
    marginLeft: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.4)',
  },
  commentInput: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(31,41,55,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    marginRight: 6,
  },
  commentSendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendBtnDisabled: { backgroundColor: '#374151' },
  commentSendText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
});

export default FeedPage;
