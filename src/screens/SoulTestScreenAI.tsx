import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optionally define icons for each emotion (same emoji)
const emotionIcons: Record<string, string> = {
  joy: '😊',
  sadness: '😢',
  fear: '😱',
  anger: '😡',
  disgust: '🤢',
  anxiety: '😰',
  envy: '🟢',
  embarrassment: '😳',
  ennui: '🥱',
};

const SoulTestScreenAI: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedEmotions, setDetectedEmotions] = useState<any>(null);
  const [step, setStep] = useState<'analyze' | 'next'>('analyze');

  const navigation = useNavigation();

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soultest/ai-question`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();
      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1: result?.message || 'Failed to fetch question.',
        });
        return;
      }
      setQuestion(result?.question?.text || '');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to load question. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (userAnswer.length < 100) {
      Toast.show({
        type: 'error',
        text1:
          'Please write at least 100 characters to help AI understand your emotions better.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soultest/ai-detect-local`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            descriptiveAnswer: userAnswer,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1:
            result?.message ||
            result?.error ||
            'Failed to analyze emotions.',
        });
        return;
      }
      setDetectedEmotions(result?.data?.emotionScores);
      Toast.show({
        type: 'success',
        text1: result?.message || 'Emotions analyzed successfully!',
      });
      setStep('next');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1:
          error?.message ||
          'Failed to analyze emotions. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    // Equivalent of router.push('/lyfari/virtual/dashboard')
    navigation.navigate('LyfariVirtualDashboard' as never);
  };

  const wordCount = userAnswer.length;
  const progress = Math.min((wordCount / 1000) * 100, 100);
  const isMinimumReached = wordCount >= 100;

  return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
    
    <View style={styles.root}>
      {/* Animated background approximation */}
      <View style={styles.backgroundBlob1} />
      <View style={styles.backgroundBlob2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.robotIcon}>🤖</Text>
              <View>
                <Text style={styles.title}>AI SoulTest</Text>
                <Text style={styles.subtitle}>Powered by Local AI</Text>
              </View>
            </View>
            <Text style={styles.headerInfo}>
              Share your feelings freely. Our AI will analyze your emotions
              privately and securely.
            </Text>
          </View>

          {/* Detected emotions */}
          {detectedEmotions && (
            <View style={styles.detectBox}>
              <Text style={styles.detectHeading}>
                AI Analysis Complete! 🎉
              </Text>
              <View style={styles.detectRow}>
                <View style={[styles.detectCard, styles.detectCardPurple]}>
                  <Text style={styles.detectIcon}>
                    {emotionIcons[detectedEmotions.primaryEmotion] || '🔮'}
                  </Text>
                  <Text style={styles.detectLabel}>Primary</Text>
                  <Text style={styles.detectValue}>
                    {detectedEmotions.primaryEmotion}
                  </Text>
                </View>
                {detectedEmotions.secondaryEmotion && (
                  <View style={[styles.detectCard, styles.detectCardIndigo]}>
                    <Text style={styles.detectIcon}>
                      {emotionIcons[detectedEmotions.secondaryEmotion] || '✨'}
                    </Text>
                    <Text style={styles.detectLabel}>Secondary</Text>
                    <Text style={styles.detectValue}>
                      {detectedEmotions.secondaryEmotion}
                    </Text>
                  </View>
                )}
                <View style={[styles.detectCard, styles.detectCardPink]}>
                  <Text style={styles.detectIcon}>⚡</Text>
                  <Text style={styles.detectLabel}>Intensity</Text>
                  <Text style={styles.detectValue}>
                    {detectedEmotions.intensity}/100
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Question block */}
          <View style={styles.questionCard}>
            <View style={styles.questionRow}>
              <Text style={styles.thoughtIcon}>💭</Text>
              {isLoading ? (
                <View style={{ flex: 1 }}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: '75%' }]} />
                </View>
              ) : (
                <Text style={styles.questionText}>{question}</Text>
              )}
            </View>

            <TextInput
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Share your thoughts in detail. Be honest and open about your emotions..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.textArea}
              multiline
              maxLength={1000}
              editable={!isSubmitting}
            />

            {/* character count + progress */}
            <View style={styles.counterRow}>
              <Text
                style={[
                  styles.minLabel,
                  isMinimumReached && styles.minLabelMet,
                ]}
              >
                {isMinimumReached ? '✓' : '○'} Minimum: 100 characters
              </Text>
              <Text style={styles.countLabel}>{wordCount} / 1000</Text>
            </View>
            <View style={styles.progressOuter}>
              <View
                style={[
                  styles.progressInner,
                  isMinimumReached
                    ? styles.progressInnerGreen
                    : styles.progressInnerPurple,
                  { width: `${progress}%` },
                ]}
              />
            </View>

            {/* buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={fetchQuestion}
                disabled={isLoading || isSubmitting || step === 'next'}
                style={[
                  styles.secondaryButton,
                  (isLoading || isSubmitting || step === 'next') &&
                    styles.buttonDisabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>🔄 New Question</Text>
              </TouchableOpacity>

              {step === 'analyze' ? (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!isMinimumReached || isSubmitting}
                  style={[
                    styles.primaryButton,
                    (!isMinimumReached || isSubmitting) &&
                      styles.buttonDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <View style={styles.submitRow}>
                      <ActivityIndicator color="#111827" size="small" />
                      <Text style={styles.primaryButtonText}>
                        Analyzing Your Soul...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      🤖 Analyze My Emotions
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleNext}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* info box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ✨ <Text style={{ fontWeight: '600' }}>100% Private & Free</Text>{' '}
              - Your emotions are analyzed locally using AI. No data is sent to
              external services.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Toast />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617', // near black
  },
  backgroundBlob1: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(168,85,247,0.16)',
    borderRadius: 999,
  },
  backgroundBlob2: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(79,70,229,0.16)',
    borderRadius: 999,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  cardContainer: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  robotIcon: {
    fontSize: 46,
    marginRight: 10,
  },
  title: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(216,180,254,0.9)',
    marginTop: 2,
  },
  headerInfo: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: 'rgba(248,250,252,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    fontSize: 12,
  },
  detectBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 18,
  },
  detectHeading: {
    color: 'rgba(248,250,252,0.9)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  detectRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  detectCard: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 110,
    borderWidth: 1,
  },
  detectCardPurple: {
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderColor: 'rgba(216,180,254,0.5)',
  },
  detectCardIndigo: {
    backgroundColor: 'rgba(79,70,229,0.18)',
    borderColor: 'rgba(191,219,254,0.5)',
  },
  detectCardPink: {
    backgroundColor: 'rgba(244,114,182,0.18)',
    borderColor: 'rgba(251,207,232,0.5)',
  },
  detectIcon: { fontSize: 22, marginBottom: 4 },
  detectLabel: { color: 'rgba(248,250,252,0.75)', fontSize: 11 },
  detectValue: {
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginTop: 3,
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    marginBottom: 18,
  },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  thoughtIcon: { fontSize: 26, marginRight: 10 },
  questionText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: 'rgba(249,250,251,0.25)',
    borderRadius: 6,
    marginBottom: 6,
  },
  textArea: {
    marginTop: 4,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(15,23,42,0.5)',
    padding: 10,
    color: '#ffffff',
    textAlignVertical: 'top',
    fontSize: 14,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  minLabel: {
    fontSize: 12,
    color: 'rgba(248,250,252,0.55)',
  },
  minLabelMet: {
    color: 'rgba(22,163,74,0.9)',
    fontWeight: '600',
  },
  countLabel: { fontSize: 12, color: 'rgba(248,250,252,0.9)' },
  progressOuter: {
    height: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    borderRadius: 6,
  },
  progressInnerGreen: {
    backgroundColor: 'rgba(34,197,94,1)',
  },
  progressInnerPurple: {
    backgroundColor: 'rgba(147,51,234,1)',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  primaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  infoText: {
    color: 'rgba(248,250,252,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SoulTestScreenAI;
