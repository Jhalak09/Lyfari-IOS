// src/components/Search/SearchBar.tsx (React Native)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

interface SearchResult {
  id: number;
  name: string;
  profile: {
    avatarUrl?: string;
  };
  followersCount?: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<View | null>(null);
  const navigation = useNavigation<any>();

  // Close results when tapping outside
  const handleOutsidePress = () => {
    if (showResults) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/users/search?q=${encodeURIComponent(
            query,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data.data || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleProfileClick = (userId: number) => {
    // Equivalent to router.push(`/lyfari/real/profile/${userId}`)
    navigation.navigate('RealProfile', { userId });
    setShowResults(false);
    setQuery('');
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.wrapper}>
        <View
          ref={searchRef}
          style={styles.searchContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => query && setShowResults(true)}
              placeholder="Search users, posts, or explore..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
            <Text style={styles.searchIcon}>🔍</Text>
            {loading && (
              <View style={styles.loaderIcon}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            )}
          </View>

          {showResults && results.length > 0 && (
            <View style={styles.resultsContainer}>
              <ScrollView>
                {results.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => handleProfileClick(user.id)}
                    style={styles.resultRow}
                  >
                    {user.profile?.avatarUrl ? (
                      <Image
                        source={{ uri: user.profile.avatarUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {user.name[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.resultTextBox}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {user.name}
                      </Text>
                      {user.followersCount !== undefined && (
                        <Text style={styles.resultFollowers}>
                          {user.followersCount.toLocaleString()} followers
                        </Text>
                      )}
                    </View>
                    <Text style={styles.chevron}>{'›'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showResults && query && results.length === 0 && !loading && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsText}>No users found</Text>
              <Text style={styles.noResultsHint}>
                Try searching with a different keyword
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  searchContainer: {
    width: '100%',
    maxWidth: 700,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 44,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.3)',
    backgroundColor: 'rgba(17,24,39,0.85)',
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    fontSize: 16,
    color: '#6366F1',
  },
  loaderIcon: {
    position: 'absolute',
    right: 14,
  },
  resultsContainer: {
    marginTop: 8,
    width: '100%',
    backgroundColor: 'rgba(17,24,39,0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.3)',
    maxHeight: 320,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31,41,55,0.6)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resultTextBox: {
    flex: 1,
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultFollowers: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: '#6B7280',
    fontSize: 18,
    marginLeft: 8,
  },
  noResultsContainer: {
    marginTop: 8,
    width: '100%',
    backgroundColor: 'rgba(17,24,39,0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.3)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  noResultsIcon: {
    fontSize: 32,
    color: '#6B7280',
    marginBottom: 6,
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  noResultsHint: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
});
