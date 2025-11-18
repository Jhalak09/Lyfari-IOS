// src/types/notifications.ts

export interface Notification {
  id: string | number;  // ✅ Accept both for flexibility
  type:
    | 'WHISPER_REQUEST'
    | 'WHISPER_ACCEPTED'
    | 'WHISPER_REJECTED'
    | 'SOUL_CHAT_REQUEST'
    | 'SOUL_CHAT_ACCEPTED'
    | 'SOUL_CHAT_REJECTED'
    | 'FOLLOW_REQUEST'
    | 'FOLLOW_REQUEST_ACCEPTED'
    | 'NEW_FOLLOWER'
    | 'POST_LIKE'
    | 'POST_COMMENT'
    | 'COMMENT_REPLY'
    | 'STORY_LIKE'
    | 'STORY_COMMENT'
    | 'WHISPER_MESSAGE'
    | 'SOUL_CHAT_MESSAGE';
  title: string;
  message: string;
  timestamp?: Date;
  createdAt?: string;
  metadata?: any;
  isRead: boolean;
}

export type NotificationTab = 'all' | 'follow' | 'likes' | 'comments';
