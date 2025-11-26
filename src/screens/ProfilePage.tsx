// src/screens/ProfilePage.tsx (React Native)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRoute, RouteProp,  } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Navbar from '../components/layout/Navbar';
import { ProfileHeader } from '../components/Profile/ProfileHeader';
import  ProfilePostsGrid  from '../components/Posts/ProfilePostsGrid';
import { PostDetail } from '../components/Posts/PostDetail';
import { EditProfileModal } from '../components/Profile/EditProfileModal';
import { UploadPostModal } from '../components/Profile/UploadPostModal';
import { Post } from '../types/post.types';
import { RootStackParamList } from '../navigation/AppNavigator'; // ✅ Import from navigator


type Profile = {
  id: string | number;
  userId: string | number;
  name: string;
  avatarUrl?: string;
  about?: string;
  location?: string;
  age?: number;
  gender?: string;
  pronouns?: string;
  interests?: string;
  accountType: 'PUBLIC' | 'PRIVATE';
  stats: { posts: number; followers: number; following: number };
};


type ProfileRoute = RouteProp<RootStackParamList, 'Profile'>;

const ProfilePage: React.FC = () => {
  const route = useRoute<ProfileRoute>();
  const profileUserId = route.params?.userId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    requestPending: false,
  });

  const isSelf =
    !!selfUserId &&
    !!profile &&
    String(selfUserId) === String(profile.userId);
  const canViewPosts =
    isSelf ||
    profile?.accountType === 'PUBLIC' ||
    (profile?.accountType === 'PRIVATE' && followStatus.isFollowing);

  const refreshPosts = useCallback(async () => {
    if (!profile?.userId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/user/${profile.userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setPosts(data?.data || []);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  }, [profile?.userId]);

  useEffect(() => {
    async function fetchSelf() {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/profile/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        setSelfUserId(data?.data?.userId?.toString() || null);
      } catch {
        setSelfUserId(null);
      }
    }
    fetchSelf();
  }, []);

  useEffect(() => {
    if (!profileUserId) return;

    async function loadProfile() {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');

        const profileRes = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/profile/${profileUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileRes.json();
        const fetchedProfile = profileData?.data || null;

        if (fetchedProfile) {
          setProfile({
            id: fetchedProfile.userId,
            userId: fetchedProfile.userId,
            name: fetchedProfile.user?.name || '',
            avatarUrl: fetchedProfile.avatarUrl,
            about: fetchedProfile.about,
            location: fetchedProfile.location,
            age: fetchedProfile.age,
            gender: fetchedProfile.gender,
            pronouns: fetchedProfile.pronouns,
            interests: fetchedProfile.interests,
            accountType: fetchedProfile.accountType,
            stats: { posts: 0, followers: 0, following: 0 },
          });
        } else {
          setProfile(null);
        }

        if (fetchedProfile?.userId) {
          const postsRes = await fetch(
            `${Config.NEXT_PUBLIC_BACKEND_URL}/posts/user/${fetchedProfile.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (postsRes.ok) {
            const postsData = await postsRes.json();
            setPosts(postsData?.data || []);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileUserId]);

  const openEdit = () => {
    if (!profile) return;
    setEditData({
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      about: profile.about,
      location: profile.location,
      age: profile.age,
      gender: profile.gender,
      pronouns: profile.pronouns,
      interests: profile.interests,
      accountType: profile.accountType,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editData) return;
    setEditSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/profile/update`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editData),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated?.data || profile);
        setEditOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loaderText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorCode}>404</Text>
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorSubtitle}>
          This profile doesn't exist or you don't have permission to view it.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Navbar />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          profile={profile}
          isSelf={isSelf}
          onEdit={openEdit}
          onFollowStatusChange={setFollowStatus}
        />

        {isSelf && (
          <TouchableOpacity
            onPress={() => setUploadModalOpen(true)}
            style={styles.newPostBtn}
          >
            <Text style={styles.newPostText}>✨ Create New Post</Text>
          </TouchableOpacity>
        )}

        {canViewPosts ? (
          <ProfilePostsGrid
            posts={posts}
            onPostClick={post => setSelectedPost(post)}
          />
        ) : (
          <View style={styles.privateBox}>
            <Text style={styles.privateTitle}>This Account is Private</Text>
            <Text style={styles.privateSubtitle}>
              Follow this account to see their photos and videos.
            </Text>
          </View>
        )}
      </ScrollView>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={saveEdit}
        editData={editData}
        setEditData={setEditData}
        saving={editSaving}
      />

      <UploadPostModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onPostCreated={refreshPosts}
      />

      {selectedPost && (
        <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1 },
  loaderScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: { color: '#ffffff', marginTop: 12, fontSize: 16 },
  errorScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCode: {
    fontSize: 60,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  newPostBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    alignItems: 'center',
  },
  newPostText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  privateBox: {
    marginTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  privateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  privateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default ProfilePage;
