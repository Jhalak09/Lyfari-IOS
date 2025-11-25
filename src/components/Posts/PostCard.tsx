// src/components/Post/PostCard.tsx (React Native)

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';
import { Post } from '../../types/post.types';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('PostDetail', { postId: post.id });
    }
  };

  const firstMedia = post.media[0];
  const imageUri =
    firstMedia?.url?.startsWith('http')
      ? firstMedia.url
      : `${Config.NEXT_PUBLIC_BACKEND_URL}${firstMedia?.url || ''}`;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {firstMedia && (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
        />
      )}
      {post.caption ? (
        <View style={styles.captionBox}>
          <Text
            style={styles.caption}
            numberOfLines={2}
          >
            {post.caption}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  captionBox: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  caption: {
    color: '#e5e7eb',
    fontSize: 13,
  },
});

export default PostCard;
