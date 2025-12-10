// src/components/Stories/StoriesCarousel.tsx (React Native, horizontal only)

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import CreateStoryModal from './CreateStoryModal';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Story {
  id: number;
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string | null;
  user: {
    id: number;
    name: string;
    profile: {
      avatarUrl: string | null;
    };
  };
  expiresAt: string;
  isViewed: boolean;
}

interface StoriesCarouselProps {
  stories: Story[];
  currentUserId?: number;
  onRefresh?: () => void; // ✅ ADDED: Callback to refresh stories
}

const AUTO_DURATION = 5000;

interface StoryViewerProps {
  visible: boolean;
  currentGroup: {
    user: Story['user'];
    stories: Story[];
  } | null;
  currentStoryIndex: number;
  isPaused: boolean;
  onClose: () => void;
  onTap: (x: number) => void;
  onLike: (storyId: number) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  currentGroup,
  currentStoryIndex,
  isPaused,
  onClose,
  onTap,
  onLike,
}) => {
  if (!visible || !currentGroup) return null;

  const currentStory = currentGroup.stories[currentStoryIndex];
  const avatarUri = currentGroup.user.profile.avatarUrl
    ? `${Config.NEXT_PUBLIC_BACKEND_URL}${currentGroup.user.profile.avatarUrl}`
    : undefined;

  return (
    <Modal 
      visible 
      animationType="slide" // ✅ CHANGED: from "fade" to "slide"
      presentationStyle="formSheet" // ✅ ADDED: pageSheet presentation
    >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={onClose}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.viewerContainer}>
            {/* Progress bars */}
            <View style={styles.progressRow}>
              {currentGroup.stories.map((_, idx) => (
                <View key={idx} style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      idx < currentStoryIndex && { width: '100%' },
                      idx === currentStoryIndex &&
                        !isPaused && { width: '100%' },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* User info */}
            <View style={styles.viewerHeader}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.viewerAvatar}
                />
              ) : (
                <View style={styles.viewerAvatarFallback}>
                  <Text style={styles.viewerAvatarInitial}>
                    {currentGroup.user.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <Text style={styles.viewerUserName}>
                {currentGroup.user.name}
              </Text>
              <Text style={styles.viewerTime}>
                {new Date(currentStory.expiresAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Story content */}
            <TouchableOpacity
              activeOpacity={1}
              style={styles.viewerMediaBox}
              onPress={e => onTap(e.nativeEvent.locationX)}
            >
              {currentStory.imageUrl ? (
                <Image
                  source={{ uri: currentStory.imageUrl }}
                  style={styles.viewerMedia}
                  resizeMode="contain"
                />
              ) : currentStory.videoUrl ? (
                <View style={styles.viewerVideoPlaceholder}>
                  <Text style={styles.viewerVideoText}>Video</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {currentStory.caption ? (
              <View style={styles.viewerCaptionBox}>
                <Text style={styles.viewerCaptionText}>
                  {currentStory.caption}
                </Text>
              </View>
            ) : null}

            {/* Bottom actions */}
            <View style={styles.viewerBottomRow}>
              <TextInput
                placeholder="Send message"
                placeholderTextColor="#9ca3af"
                style={styles.viewerInput}
              />
              <TouchableOpacity
                onPress={() => onLike(currentStory.id)}
                style={styles.viewerLikeBtn}
              >
                <Text style={styles.viewerLikeIcon}>❤️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </Modal>
  );
};

const StoriesCarousel: React.FC<StoriesCarouselProps> = ({
  stories,
  currentUserId,
  onRefresh, // ✅ ADDED: Receive refresh callback
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(
    null,
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { userGroups, myStories, otherUserGroups } = useMemo(() => {
    const grouped = stories.reduce((acc, story) => {
      const userId = story.user.id;
      if (!acc[userId]) {
        acc[userId] = { user: story.user, stories: [] as Story[] };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {} as Record<number, { user: Story['user']; stories: Story[] }>);

    Object.values(grouped).forEach(g => {
      g.stories = [...g.stories].reverse();
    });

    const groups = Object.values(grouped);
    const mine = groups.find(g => g.user.id === currentUserId);
    const others = groups.filter(g => g.user.id !== currentUserId);

    return { userGroups: groups, myStories: mine, otherUserGroups: others };
  }, [stories, currentUserId]);

  const recordView = useCallback(async (storyId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/stories/${storyId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  }, []);

  const handleLike = useCallback(async (storyId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/stories/${storyId}/like`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      console.error('Error liking story:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedUserIndex === null || isPaused) return;
    const currentGroup = userGroups[selectedUserIndex];
    if (!currentGroup) return;

    progressTimerRef.current = setTimeout(() => {
      handleNextStory();
    }, AUTO_DURATION);

    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserIndex, currentStoryIndex, isPaused, userGroups.length]);

  const handleNextStory = () => {
    if (selectedUserIndex === null) return;
    const currentGroup = userGroups[selectedUserIndex];
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      recordView(currentGroup.stories[nextIndex].id);
    } else if (selectedUserIndex < userGroups.length - 1) {
      const nextUserIndex = selectedUserIndex + 1;
      setSelectedUserIndex(nextUserIndex);
      setCurrentStoryIndex(0);
      recordView(userGroups[nextUserIndex].stories[0].id);
    } else {
      closeStoryViewer();
    }
  };

  const handlePreviousStory = () => {
    if (selectedUserIndex === null) return;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (selectedUserIndex > 0) {
      const prevUserIndex = selectedUserIndex - 1;
      const prevGroup = userGroups[prevUserIndex];
      setSelectedUserIndex(prevUserIndex);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const openStoryViewer = (userIndex: number) => {
    setSelectedUserIndex(userIndex);
    setCurrentStoryIndex(0);
    setIsPaused(false);
    const first = userGroups[userIndex].stories[0];
    recordView(first.id);
  };

  const closeStoryViewer = () => {
    setSelectedUserIndex(null);
    setCurrentStoryIndex(0);
    setIsPaused(false);
  };

  const handleStoryTap = (x: number) => {
    const { width } = Dimensions.get('window');
    const isLeft = x < width / 3;
    const isRight = x > (width * 2) / 3;

    if (isLeft) {
      handlePreviousStory();
    } else if (isRight) {
      handleNextStory();
    } else {
      setIsPaused(prev => !prev);
    }
  };

  // ✅ ADDED: Handle story created callback
  const handleStoryCreated = () => {
    if (onRefresh) {
      onRefresh(); // Trigger parent to refresh stories
    }
  };

  const currentGroup =
    selectedUserIndex !== null ? userGroups[selectedUserIndex] : null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalRow}
        decelerationRate="fast"
        snapToInterval={80}
        snapToAlignment="start"
      >
        {/* Your Story */}
        {myStories && myStories.stories.length > 0 ? (
          <TouchableOpacity
            onPress={() =>
              openStoryViewer(
                userGroups.findIndex(
                  g => g.user.id === currentUserId,
                ),
              )
            }
            style={styles.storyItem}
          >
            <View style={styles.myStoryCircle}>
              {myStories.stories[0].imageUrl ? (
                <Image
                  source={{ uri: myStories.stories[0].imageUrl! }}
                  style={styles.myStoryImage}
                />
              ) : (
                <View style={styles.myStoryFallback}>
                  <Text style={styles.myStoryInitial}>
                    {myStories.user.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={e => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
                style={styles.addBadge}
              >
                <Text style={styles.addBadgeText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.storyLabel}>Your Story</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.storyItem}
          >
            <View style={styles.addStoryCircle}>
              <Text style={styles.addStoryPlus}>+</Text>
            </View>
            <Text style={styles.storyLabel}>Add Story</Text>
          </TouchableOpacity>
        )}

        {/* Other users */}
        {otherUserGroups.map(group => {
          const idx = userGroups.findIndex(
            g => g.user.id === group.user.id,
          );
          const avatarUri = group.user.profile.avatarUrl
            ? group.user.profile.avatarUrl.startsWith('http')
              ? group.user.profile.avatarUrl
              : `${Config.NEXT_PUBLIC_BACKEND_URL}${group.user.profile.avatarUrl}`
            : undefined;
          const hasUnviewed = group.stories.some(s => !s.isViewed);

          return (
            <TouchableOpacity
              key={group.user.id}
              onPress={() => openStoryViewer(idx)}
              style={styles.storyItem}
            >
              <View style={styles.otherStoryWrapper}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={[
                      styles.otherStoryAvatar,
                      hasUnviewed && styles.otherStoryAvatarUnviewed,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.otherStoryFallback,
                      hasUnviewed && styles.otherStoryAvatarUnviewed,
                    ]}
                  >
                    <Text style={styles.myStoryInitial}>
                      {group.user.name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                {group.stories.length > 1 && (
                  <View style={styles.multiBadge}>
                    <Text style={styles.multiBadgeText}>
                      {group.stories.length}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={styles.storyLabel}
                numberOfLines={1}
              >
                {group.user.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <StoryViewer
        visible={selectedUserIndex !== null}
        currentGroup={currentGroup}
        currentStoryIndex={currentStoryIndex}
        isPaused={isPaused}
        onClose={closeStoryViewer}
        onTap={handleStoryTap}
        onLike={handleLike}
      />

      <CreateStoryModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleStoryCreated} // ✅ CHANGED: Call refresh handler
      />
    </>
  );
};

// Styles remain exactly the same
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  horizontalRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  myStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  myStoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#000000',
  },
  myStoryFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStoryInitial: { color: '#ffffff', fontWeight: '700', fontSize: 18 },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  addBadgeText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryPlus: { color: '#ffffff', fontSize: 26, fontWeight: '700' },
  storyLabel: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 4,
    maxWidth: 70,
    textAlign: 'center',
  },
  otherStoryWrapper: { position: 'relative' },
  otherStoryAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#6b7280',
  },
  otherStoryAvatarUnviewed: { borderColor: '#f97316' },
  otherStoryFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#6b7280',
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  multiBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 32,
    right: 20,
    zIndex: 20,
  },
  viewerCloseText: { color: '#ffffff', fontSize: 26 },
  viewerContainer: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    paddingTop: 40,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#6325ffff',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#ffffff',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  viewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    marginRight: 8,
  },
  viewerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  viewerAvatarInitial: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  viewerUserName: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  viewerTime: {
    marginLeft: 'auto',
    color: '#d1d5db',
    fontSize: 11,
  },
  viewerMediaBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerMedia: {
    width: '100%',
    height: '80%',
  },
  viewerVideoPlaceholder: {
    width: '100%',
    height: '70%',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerVideoText: { color: '#e5e7eb' },
  viewerCaptionBox: {
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  viewerCaptionText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
  },
  viewerBottomRow: {
    position: 'absolute',
    bottom: 32,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerInput: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9ca3af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
  },
  viewerLikeBtn: { padding: 8 },
  viewerLikeIcon: { color: '#ffffff', fontSize: 22 },
});

export default StoriesCarousel;
