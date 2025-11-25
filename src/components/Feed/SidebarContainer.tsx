// src/components/Feed/SidebarContainer.tsx (React Native)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const fortunes = [
  'Your code will compile on the first try today! 🍀',
  'A bug fixed is a bug learned. ✨',
  'Keep calm and commit often. 💻',
  'Your next feature will be awesome! 🚀',
  'Stack Overflow will have the answer. 😄',
  'Every error is an opportunity to learn. 📚',
  'Debugging is like being a detective. 🔍',
];

const SidebarContainer: React.FC = () => {
  const [fortuneCookie, setFortuneCookie] = useState('');

  useEffect(() => {
    setFortuneCookie(
      fortunes[Math.floor(Math.random() * fortunes.length)],
    );
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Ad Container */}
      <View style={styles.adBox}>
        <Text style={styles.adTitle}>✨ Sponsored</Text>
        <Text style={styles.adText}>
          Check out amazing content from our partners!
        </Text>
        <TouchableOpacity style={styles.adButton}>
          <Text style={styles.adButtonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      {/* Fortune Cookie */}
      <View style={styles.fortuneBox}>
        <Text style={styles.fortuneTitle}>🥠 Daily Fortune</Text>
        <Text style={styles.fortuneText}>{fortuneCookie}</Text>
      </View>

      {/* Explore Connections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Explore Connections</Text>
        {Array.from({ length: 5 }).map((_, index) => {
          const i = index + 1;
          return (
            <View key={i} style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {String.fromCharCode(64 + i)}
                </Text>
              </View>
              <View style={styles.userTextBox}>
                <Text
                  numberOfLines={1}
                  style={styles.userName}
                >
                  User {i}
                </Text>
                <Text style={styles.userHandle}>@user{i}</Text>
              </View>
              <TouchableOpacity style={styles.followBtn}>
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Footer Links */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Lyfari</Text>
        <View style={styles.footerLinksRow}>
          <Text style={styles.footerLink}>About</Text>
          <Text style={styles.footerLink}>Privacy</Text>
          <Text style={styles.footerLink}>Terms</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  adBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    backgroundColor: '#f5e9ff',
  },
  adTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#111827',
  },
  adText: {
    fontSize: 13,
    color: '#374151',
  },
  adButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
  },
  adButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  fortuneBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#facc15',
    backgroundColor: '#fef9c3',
  },
  fortuneTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#111827',
  },
  fortuneText: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(17,24,39,0.02)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  userTextBox: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 13,
  },
  userHandle: {
    color: '#6b7280',
    fontSize: 11,
  },
  followBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 11,
    color: '#6b7280',
  },
  footerLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  footerLink: {
    fontSize: 11,
    color: '#6b7280',
    marginRight: 10,
  },
});

export default SidebarContainer;
