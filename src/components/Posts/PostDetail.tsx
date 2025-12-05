// src/components/Posts/PostDetail.tsx (React Native - Mobile Instagram Style)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { Post } from '../../types/post.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostDetailProps {
  post: Post | null;
  onClose: () => void;
}

export const PostDetail: React.FC<PostDetailProps> = ({ post, onClose }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchCommentsForPost = useCallback(async () => {
    if (!post?.id) return;

    try {
      setCommentsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        setComments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post?.id]);

  const handleRecordView = useCallback(async () => {
    if (!post) return;
    const isReel = post.type === 'VIDEO' || post.type === 'REEL';
    if (!isReel) return;

    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/view`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setViewCount(prev => prev + 1);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  }, [post]);

  useEffect(() => {
    if (!post?.id) return;

    setCurrentMediaIndex(0);
    setLikeCount(post._count?.likes || 0);
    setCommentCount(post._count?.comments || 0);
    setViewCount(post._count?.views || 0);
    setIsLiked(false);
    setNewComment('');
    setShowComments(false);
    setComments([]);
  }, [post?.id, post?._count?.likes, post?._count?.comments, post?._count?.views]);

  useEffect(() => {
    if (!post?.id) return;
    
    fetchCommentsForPost();
    handleRecordView();
  }, [post?.id, fetchCommentsForPost, handleRecordView]);

  const handleLike = async () => {
    if (loading || !post) return;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (isLiked) {
        await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/like`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setIsLiked(false);
        setLikeCount(Math.max(0, likeCount - 1));
      } else {
        await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/like`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || loading || !post) return;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newComment }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        setComments([...comments, result.data]);
        setCommentCount(commentCount + 1);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!post) return null;

  if (!post.media || post.media.length === 0) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Post</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.noMediaBox}>
              <Text style={styles.noMediaText}>No media available</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const safeIndex = Math.min(currentMediaIndex, post.media.length - 1);
  const currentMedia = post.media[safeIndex];

  if (!currentMedia) return null;

  const imageUrl = currentMedia.url.startsWith('http')
    ? currentMedia.url
    : `${Config.NEXT_PUBLIC_BACKEND_URL}${currentMedia.url}`;

  const isReel = post.type === 'VIDEO' || post.type === 'REEL';

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Post</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollContent}>
            {/* Media Section */}
            <View style={styles.mediaSection}>
              {currentMedia.type === 'IMAGE' ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.media}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoText}>Video: {imageUrl}</Text>
                </View>
              )}

              {/* Carousel Navigation */}
              {post.media.length > 1 && (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentMediaIndex(prev =>
                        prev === 0 ? post.media.length - 1 : prev - 1,
                      )
                    }
                    style={styles.navBtnLeft}
                  >
                    <Text style={styles.navBtnText}>◀</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentMediaIndex(prev =>
                        prev === post.media.length - 1 ? 0 : prev + 1,
                      )
                    }
                    style={styles.navBtnRight}
                  >
                    <Text style={styles.navBtnText}>▶</Text>
                  </TouchableOpacity>

                  {/* Indicators */}
                  <View style={styles.indicators}>
                    {post.media.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setCurrentMediaIndex(index)}
                        style={[
                          styles.indicator,
                          index === safeIndex && styles.indicatorActive,
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Details Below Media */}
            <View style={styles.detailsSection}>
              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={handleLike}
                  disabled={loading}
                  style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
                >
                  <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
                    {isLiked ? '❤️' : '🤍'} Like
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowComments(!showComments)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionText}>💬 Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>📤 Share</Text>
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.statsRow}>
                  <Text style={styles.statItem}>
                    ❤️ <Text style={styles.statBold}>{likeCount}</Text> likes
                  </Text>
                  <Text style={styles.statItem}>
                    💬 <Text style={styles.statBold}>{commentCount}</Text> comments
                  </Text>
                </View>
                {isReel && viewCount > 0 && (
                  <Text style={styles.statItem}>
                    👁️ <Text style={styles.statBold}>{viewCount}</Text> views
                  </Text>
                )}
              </View>

              {/* Caption */}
              {post.caption && (
                <View style={styles.captionBox}>
                  <Text style={styles.caption}>{post.caption}</Text>
                </View>
              )}

              {/* Comments Section */}
              {showComments ? (
                <View style={styles.commentsSection}>
                  <View style={styles.commentsList}>
                    {commentsLoading ? (
                      <ActivityIndicator color="#6366f1" style={{ marginTop: 20 }} />
                    ) : comments.length === 0 ? (
                      <Text style={styles.noComments}>No comments yet</Text>
                    ) : (
                      comments.map((comment: any, idx: number) => (
                        <View key={idx} style={styles.commentItem}>
                          <Text style={styles.commentUser}>
                            {comment.user?.username ||
                              comment.createdBy?.username ||
                              'User'}
                          </Text>
                          <Text style={styles.commentContent}>
                            {comment.content || comment.text || 'No content'}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.commentsPlaceholder}>
                  <Text style={styles.commentsPlaceholderText}>
                    Click comment to view all comments
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Comment Input - Fixed at Bottom */}
          {showComments && (
            <View style={styles.commentInputBox}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add comment..."
                placeholderTextColor="#9ca3af"
                style={styles.commentInput}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={loading || !newComment.trim()}
                style={[
                  styles.commentSubmitBtn,
                  (loading || !newComment.trim()) && styles.commentSubmitBtnDisabled,
                ]}
              >
                <Text style={styles.commentSubmitText}>Post</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-start',
  },
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  closeBtn: {
    color: '#9ca3af',
    fontSize: 24,
  },
  scrollContent: {
    flex: 1,
  },
  mediaSection: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  videoText: { color: '#9ca3af', fontSize: 14 },
  noMediaBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  noMediaText: { color: '#ffffff', fontSize: 16 },
  navBtnLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 8,
  },
  navBtnRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 8,
  },
  navBtnText: { color: '#ffffff', fontSize: 16 },
  indicators: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: '#ffffff',
  },
  detailsSection: {
    backgroundColor: '#1f2937',
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionTextLiked: {
    color: '#ef4444',
  },
  stats: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  statItem: {
    color: '#e5e7eb',
    fontSize: 13,
  },
  statBold: {
    fontWeight: '700',
  },
  captionBox: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  caption: {
    color: '#e5e7eb',
    fontSize: 13,
  },
  commentsSection: {
    minHeight: 200,
  },
  commentsList: {
    padding: 12,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 8,
    marginBottom: 8,
  },
  commentUser: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
  },
  commentContent: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  noComments: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
  commentInputBox: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 8,
    backgroundColor: '#1f2937',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#374151',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  commentSubmitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
  },
  commentSubmitBtnDisabled: {
    opacity: 0.5,
  },
  commentSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  commentsPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  commentsPlaceholderText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
});
