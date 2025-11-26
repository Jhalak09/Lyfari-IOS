// src/components/Soul/SoulProfile.tsx (React Native - Updated)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';

interface SoulProfileProps {
  soulTest: any;
  loading: boolean;
  emotion?: string;
}

const emotionColorClasses: Record<
  string,
  { text: string; gradientFrom: string; gradientTo: string }
> = {
  joy: { text: '#eab308', gradientFrom: '#eab308', gradientTo: '#ca8a04' },
  sadness: { text: '#3b82f6', gradientFrom: '#3b82f6', gradientTo: '#1e40af' },
  fear: { text: '#a855f7', gradientFrom: '#a855f7', gradientTo: '#7c3aed' },
  anger: { text: '#ef4444', gradientFrom: '#ef4444', gradientTo: '#991b1b' },
  disgust: { text: '#22c55e', gradientFrom: '#22c55e', gradientTo: '#15803d' },
  anxiety: { text: '#f97316', gradientFrom: '#f97316', gradientTo: '#c2410c' },
  envy: { text: '#06b6d4', gradientFrom: '#06b6d4', gradientTo: '#0e7490' },
  embarrassment: { text: '#ec4899', gradientFrom: '#ec4899', gradientTo: '#be185d' },
  ennui: { text: '#6366f1', gradientFrom: '#6366f1', gradientTo: '#4338ca' },
  default: { text: '#ffffff', gradientFrom: '#4f46e5', gradientTo: '#3b82f6' },
};

const SoulProfile: React.FC<SoulProfileProps> = ({
  soulTest,
  loading,
  emotion,
}) => {
  const navigation = useNavigation();

  // Extract user info safely
  const name = soulTest?.user?.name || 'Soulful One';
  const username = soulTest?.user?.username || 'anonymous';
  const userProfile = soulTest?.user?.profile || {};

  const Emo = emotion || 'default';
  const { text, gradientFrom, gradientTo } = emotionColorClasses[Emo] || emotionColorClasses.default;

  // Extract primary emotion from summary
  const getPrimaryEmotion = (summary: string) => {
    if (!summary) return 'Unknown';
    const match = summary.match(/Primary Emotion: (\w+)/);
    return match ? match[1] : 'Unknown';
  };

  const primaryEmotion = getPrimaryEmotion(soulTest?.summary || '');

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <View style={styles.skeletonContainer}>
            <View style={[styles.skeletonBox, styles.skeletonTitle]} />
            <View style={[styles.skeletonBox, styles.skeletonLarge]} />
            <View style={[styles.skeletonBox, styles.skeletonSmall]} />
            <View style={[styles.skeletonBox, styles.skeletonMedium]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.infinitySymbol}>∞</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText} numberOfLines={2}>
                Welcome, {name}!
              </Text>
              <View style={styles.emotionContainer}>
                <Text style={[styles.emotionLabel, { color: text }]}>
                  Primary Emotion: <Text style={styles.emotionCapitalize}>{primaryEmotion}</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Soul Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileTitleRow}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.profileTitle}>Your Soul Profile, {username}</Text>
            </View>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                {soulTest?.summary ||
                  "Take the SoulTest to discover your unique emotional resonance and find your soulful connections."}
              </Text>
            </View>
          </View>

          {/* User Profile Info */}
          <View style={styles.infoContainer}>
            {userProfile.location && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>📍 {userProfile.location}</Text>
              </View>
            )}
            {userProfile.age && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>🎂 {userProfile.age} years</Text>
              </View>
            )}
            {userProfile.gender && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>👤 {userProfile.gender}</Text>
              </View>
            )}
          </View>

          {userProfile.about && (
            <View style={styles.aboutContainer}>
              <Text style={styles.aboutText}>"{userProfile.about}"</Text>
            </View>
          )}

          {/* Retake SoulTest Button with Gradient */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SoulTest' as never)}
            activeOpacity={0.9}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={[gradientFrom, gradientTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>🔄 Retake SoulTest</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  scrollContent: {
    flex: 1,
  },
  // Loading Skeleton States
  skeletonContainer: {
    padding: 8,
  },
  skeletonBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonTitle: {
    height: 32,
    width: '60%',
  },
  skeletonLarge: {
    height: 96,
    width: '100%',
  },
  skeletonSmall: {
    height: 16,
    width: '50%',
  },
  skeletonMedium: {
    height: 16,
    width: '75%',
  },
  // Header Section
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  infinitySymbol: {
    fontSize: 40,
    color: '#ffffff',
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  emotionContainer: {
    marginTop: 4,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  emotionCapitalize: {
    textTransform: 'capitalize',
  },
  // Profile Section
  profileSection: {
    marginBottom: 24,
  },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sparkleIcon: {
    fontSize: 18,
    color: '#a78bfa',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 64,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 21,
  },
  // Info Badges
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#c7d2fe',
  },
  // About Section
  aboutContainer: {
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    paddingLeft: 12,
  },
  aboutText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // Button with Gradient
  buttonWrapper: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SoulProfile;
