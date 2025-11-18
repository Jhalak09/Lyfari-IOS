// src/types/post.types.ts

/**
 * ✅ SHARED POST TYPES - Used everywhere!
 * Profile, Feed, Explore, Search, etc.
 */

export interface Media {
  id: number;
  postId?: number;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'REEL';
  thumbnail?: string | null;
  duration?: number | null;
  order: number;
}

export interface PostStats {
  likes: number;
  comments: number;
  views: number;
}

export interface Post {
  id: number;
  userId?: number;
  caption: string | null;
  type: 'IMAGE' | 'VIDEO' | 'REEL';
  isPrivate: boolean;
  createdAt: string;
  media: Media[];
  _count: PostStats;
}
