// src/components/Profile/ProfilePostsGrid.tsx (React Native)

import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Post } from '../../types/post.types';
import PostCard from './PostCard';

interface ProfilePostsGridProps {
  posts: Post[];
  userId: number;
}

const ProfilePostsGrid: React.FC<ProfilePostsGridProps> = ({ posts }) => {
  const navigation = useNavigation<any>();

  const handleOpenPost = (postId: number) => {
    navigation.navigate('PostDetail', { postId });
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id.toString()}
      numColumns={3}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <View style={styles.itemWrapper}>
          <PostCard
            post={item}
            onPress={() => handleOpenPost(item.id)}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 4,
  },
  itemWrapper: {
    flex: 1 / 3,
    padding: 2,
  },
});

export default ProfilePostsGrid;
