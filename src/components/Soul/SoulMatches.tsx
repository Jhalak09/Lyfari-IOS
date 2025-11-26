// src/components/Soul/SoulMatches.tsx (React Native - Updated)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const emotionColors: Record<
  string,
  { text: string; borderColor: string; bgColor: string }
> = {
  joy: { text: '#fbbf24', borderColor: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
  sadness: { text: '#3b82f6', borderColor: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  fear: { text: '#a855f7', borderColor: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
  anger: { text: '#ef4444', borderColor: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  disgust: { text: '#22c55e', borderColor: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
  anxiety: { text: '#f97316', borderColor: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
  envy: { text: '#06b6d4', borderColor: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' },
  embarrassment: { text: '#ec4899', borderColor: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
  ennui: { text: '#6366f1', borderColor: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  default: { text: '#ffffff', borderColor: '#ffffff', bgColor: 'rgba(255, 255, 255, 0.1)' },
};

interface Match {
  user: {
    id: number;
    username: string;
  };
  compatibility: number;
  intensity: number;
  primaryEmotion: string;
  whisperRequestStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  threadId?: number;
}

interface SoulMatchesProps {
  matches: Match[];
  loading: boolean;
  sendingWhisper: number | null;
  handleSendWhisper: (matchUserId: number) => Promise<void>;
  emotion?: string;
}

const SoulMatches: React.FC<SoulMatchesProps> = ({
  matches,
  loading,
  sendingWhisper,
  handleSendWhisper,
  emotion = '',
}) => {
  const navigation = useNavigation();
  const Emo = emotion || 'default';
  const { text: textColor, borderColor, bgColor } = emotionColors[Emo] || emotionColors.default;

  const renderMatch = ({ item }: { item: Match }) => (
    <View
      style={[
        styles.matchCard,
        { borderColor, backgroundColor: bgColor },
      ]}
    >
      {/* Header Section */}
      <View style={styles.matchHeader}>
        <View style={styles.matchInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.sparkleIcon}>✨</Text>
            <Text style={styles.matchUsername} numberOfLines={1}>
              {item.user.username || 'Anonymous Soul'}
            </Text>
          </View>
          <View style={styles.compatibilityBadge}>
            <Text style={styles.compatibilityText}>
              {Math.round(item.compatibility || 0)}% match
            </Text>
          </View>
        </View>
      </View>

      {/* Emotion and Intensity Info */}
      <View style={styles.emotionInfo}>
        <Text style={styles.emotionText}>
          Primary: <Text style={[styles.emotionValue, { color: '#a78bfa' }]}>
            {item.primaryEmotion || 'Unknown'}
          </Text>
          <Text style={styles.separator}> • </Text>
          Intensity: <Text style={styles.intensityValue}>
            {Math.round(item.intensity || 0)}%
          </Text>
        </Text>
      </View>

      {/* Action Buttons - Matching Web App States */}
      {item.whisperRequestStatus === 'PENDING' && (
        <TouchableOpacity
          disabled
          style={[styles.actionButton, styles.pendingButton]}
        >
          <Text style={styles.buttonText}>🔄 Pending</Text>
        </TouchableOpacity>
      )}

      {item.whisperRequestStatus === 'ACCEPTED' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Whispers' as never)}
          style={[styles.actionButton, styles.acceptedButton]}
        >
          <Text style={styles.buttonText}>💬 Visit Whispers</Text>
        </TouchableOpacity>
      )}

      {(!item.whisperRequestStatus || item.whisperRequestStatus === 'REJECTED') && (
        <TouchableOpacity
          onPress={() => handleSendWhisper(item.user.id)}
          disabled={sendingWhisper === item.user.id}
          style={[
            styles.actionButton,
            styles.sendButton,
            sendingWhisper === item.user.id && styles.disabledButton,
          ]}
        >
          {sendingWhisper === item.user.id ? (
            <Text style={styles.buttonText}>⏳ Sending...</Text>
          ) : (
            <Text style={styles.buttonText}>✨ Send Request</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.contentCard}>
          <Text style={styles.headerTitle}>Soulful Matches</Text>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: textColor }]}>
              Loading your soulful connections…
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.contentCard}>
          <Text style={styles.headerTitle}>Soulful Matches</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.emptyTitle}>No soul matches yet.</Text>
            <Text style={styles.emptySubtitle}>
              Complete your SoulTest to find connections!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        <Text style={styles.headerTitle}>Soulful Matches</Text>
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={item => item.user.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  matchCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  matchHeader: {
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sparkleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  matchUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  compatibilityBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a78bfa',
  },
  emotionInfo: {
    marginBottom: 12,
  },
  emotionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emotionValue: {
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  separator: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  intensityValue: {
    color: '#ffffff',
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingButton: {
    backgroundColor: '#4b5563',
    opacity: 0.75,
  },
  acceptedButton: {
    backgroundColor: '#16a34a',
  },
  sendButton: {
    backgroundColor: '#4f46e5',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SoulMatches;
