import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Types kept conceptually same (no TS ReactNode in RN)
interface Question {
  id: number;
  question: string;
}

type EmotionInfo = {
  icon: any;       // image source in RN
  particles: string;
  desc: string;
};

const defaultQuestions: Question[] = [
  { id: 1, question: 'Did something happen today that made you feel truly happy, excited, or joyful — like smiling for no reason or feeling light inside?' },
  { id: 2, question: 'Right now, do you feel sad, low, or down — maybe like you want to cry, stay alone, or nothing feels good?' },
  { id: 3, question: 'Are you feeling nervous, scared, or worried at this moment — like your heart racing, or your mind keeps imagining bad things?' },
  { id: 4, question: 'Have you recently felt angry, annoyed, or frustrated — like something really upset you, made you want to shout, or made your blood boil?' },
  { id: 5, question: "Did anything today make you feel gross, disgusted, or really dislike something or someone strongly — like 'ugh, I can't stand this'?" },
  { id: 6, question: 'Do you feel anxious or overwhelmed right now — like your mind is full of too many worries, or you feel pressure about the future or present?' },
  { id: 7, question: 'Have you looked at other people and felt jealous, left out, or wished you had what they have — like \'why not me\'?' },
  { id: 8, question: 'Do you feel embarrassed or self-conscious about something — like blushing, wanting to hide, or replaying a moment in your head?' },
  { id: 9, question: 'Are you feeling bored, uninterested, or stuck in a dull mood — like nothing excites you, and everything feels the same or pointless?' },
];

// Approximate Tailwind gradients with solid primary colors
const defaultEmotionColors: Record<string, any> = {
  joy: { backgroundColor: '#facc15' },          // yellow-400
  sadness: { backgroundColor: '#1d4ed8' },      // blue-700
  fear: { backgroundColor: '#4c1d95' },         // purple-900
  anger: { backgroundColor: '#7f1d1d' },        // red-900
  disgust: { backgroundColor: '#065f46' },      // green-800
  anxiety: { backgroundColor: '#ea580c' },      // orange-600
  envy: { backgroundColor: '#0891b2' },         // cyan-600
  embarrassment: { backgroundColor: '#ec4899' },// pink-500
  ennui: { backgroundColor: '#312e81' },        // indigo-900
};

const defaultEmotionData: Record<string, EmotionInfo> = {
  joy: {
    icon: require('../../assets/icon1/joy.png'),
    particles: '🌟',
    desc: 'Radiating joy and lightness',
  },
  sadness: {
    icon: require('../../assets/icon1/sadness.png'),
    particles: '🌧️',
    desc: 'Feeling deeply and tenderly',
  },
  fear: {
    icon: require('../../assets/icon1/fear.png'),
    particles: '⛈️',
    desc: 'Navigating uncertainty',
  },
  anger: {
    icon: require('../../assets/icon1/anger.png'),
    particles: '💥',
    desc: 'Processing intense energy',
  },
  disgust: {
    icon: require('../../assets/icon1/disgust1.png'),
    particles: '🌿',
    desc: 'Maintaining strong boundaries',
  },
  anxiety: {
    icon: require('../../assets/icon1/anxiety.png'),
    particles: '🌀',
    desc: 'Working through overwhelming thoughts',
  },
  envy: {
    icon: require('../../assets/icon1/envy.png'),
    particles: '💚',
    desc: 'Comparing and seeking growth',
  },
  embarrassment: {
    icon: require('../../assets/icon1/embarrassment.png'),
    particles: '💫',
    desc: 'Self-reflecting with sensitivity',
  },
  ennui: {
    icon: require('../../assets/icon1/ennui.png'),
    particles: '☁️',
    desc: 'Seeking deeper meaning and purpose',
  },
};

const defaultQuestionEmotionMap: Record<number, keyof typeof defaultEmotionData> = {
  1: 'joy',
  2: 'sadness',
  3: 'fear',
  4: 'anger',
  5: 'disgust',
  6: 'anxiety',
  7: 'envy',
  8: 'embarrassment',
  9: 'ennui',
};

const SoulTestPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const navigation = useNavigation();

  const questions = defaultQuestions;
  const emotionColors = defaultEmotionColors;
  const emotionData = defaultEmotionData;
  const questionEmotionMap = defaultQuestionEmotionMap;

  const currentEmotionForQuestion =
    questionEmotionMap[questions[currentQuestion]?.id] || 'joy';
  const currentQ = questions[currentQuestion];
  const emotionInfo = emotionData[currentEmotionForQuestion];
  const isAnswered = answers[currentQ?.id] !== undefined;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1000);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(
        `${Config.NEXT_PUBLIC_BACKEND_URL}/soultest/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            responses: answers,
            questionsUsed: questions.map(q => q.id),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1: result?.message || result?.error || 'Failed to submit SoulTest.',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: result?.message || 'SoulTest submitted successfully!',
      });

      // Route equivalent to /lyfari/virtual/dashboard
      navigation.navigate('LyfariVirtualDashboard' as never);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error?.message || 'Failed to submit SoulTest. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAISoulTest = () => {
    // route equivalent to /soultest/ai
    navigation.navigate('SoulTestAI' as never);
  };

  return (
    <View style={[styles.container, emotionColors[currentEmotionForQuestion]]}>
      {showParticles && (
        <View style={styles.particlesContainer}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Text
              key={i}
              style={[
                styles.particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                },
              ]}
            >
              {emotionInfo?.particles || '✨'}
            </Text>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SoulTest</Text>
          <Text style={styles.subtitle}>Emotional Discovery Journey</Text>

          <TouchableOpacity
            onPress={handleAISoulTest}
            style={styles.aiButton}
          >
            <Text style={styles.aiButtonText}>🤖 Take AI SoulTest</Text>
          </TouchableOpacity>
        </View>

        {/* Emotion indicator */}
        <View style={styles.emotionBox}>
          <Text style={styles.emotionLabel}>Currently exploring emotion:</Text>
          <View style={styles.emotionRow}>
            <Image source={emotionInfo?.icon} style={styles.emotionIcon} />
            <Text style={styles.emotionName}>
              {currentEmotionForQuestion.charAt(0).toUpperCase() +
                currentEmotionForQuestion.slice(1)}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressOuter}>
          <View style={[styles.progressInner, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>

        {/* Question card */}
        <View style={styles.card}>
          <View style={styles.questionHeader}>
            <Image source={emotionInfo?.icon} style={styles.questionIcon} />
            <Text style={styles.questionText}>{currentQ?.question}</Text>
          </View>

          {/* Scale labels */}
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabelText}>Not at all</Text>
            <Text style={styles.scaleLabelText}>Moderately</Text>
            <Text style={styles.scaleLabelText}>Extremely</Text>
          </View>

          {/* Likert scale */}
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5, 6, 7].map(value => {
              const selected = answers[currentQ?.id] === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleAnswerChange(currentQ.id, value)}
                  style={[
                    styles.scaleCircle,
                    selected && styles.scaleCircleSelected,
                  ]}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.scaleNumber,
                      selected && styles.scaleNumberSelected,
                    ]}
                  >
                    {value}
                  </Text>
                  {selected && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback */}
          {isAnswered && (
            <View style={styles.feedbackBox}>
              <View style={styles.feedbackRow}>
                <Image source={emotionInfo?.icon} style={styles.feedbackIcon} />
                <Text style={styles.feedbackTitle}>Response Recorded</Text>
              </View>
              <Text style={styles.feedbackText}>
                Emotional resonance:{' '}
                <Text style={styles.feedbackHighlight}>
                  {emotionInfo?.desc || 'Processing response'}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentQuestion === 0}
            style={[
              styles.navBtn,
              currentQuestion === 0 && styles.navBtnDisabled,
            ]}
          >
            <Text style={styles.navBtnText}>← Previous</Text>
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {questions.map((_, index) => {
              const active = index === currentQuestion;
              const answered = answers[questions[index].id] !== undefined;
              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    active && styles.dotActive,
                    !active && answered && styles.dotAnswered,
                  ]}
                />
              );
            })}
          </View>

          {currentQuestion === questions.length - 1 ? (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              style={[
                styles.navBtn,
                styles.submitBtn,
                (!allAnswered || isSubmitting) && styles.navBtnDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.submitText}>✨ Complete SoulTest</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              disabled={!isAnswered}
              style={[styles.navBtn, !isAnswered && styles.navBtnDisabled]}
            >
              <Text style={styles.navBtnText}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  particlesContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
    color: '#fff',
  },
  header: { alignItems: 'center', marginBottom: 14 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4f46e5',
    marginVertical: 4,
    textAlign: 'center',
  },
  aiButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#2563eb',
  },
  aiButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  emotionBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    marginBottom: 16,
    alignItems: 'center',
  },
  emotionLabel: { color: '#f9fafb', fontSize: 12 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  emotionIcon: { width: 32, height: 32, marginRight: 6 },
  emotionName: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  progressOuter: {
    width: '100%',
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.26)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressInner: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  progressPercent: {
    alignSelf: 'flex-end',
    color: '#f9fafb',
    fontSize: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    padding: 14,
    marginBottom: 18,
  },
  questionHeader: { flexDirection: 'row', marginBottom: 10 },
  questionIcon: { width: 36, height: 36, marginRight: 8 },
  questionText: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '500' },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  scaleLabelText: { color: '#f9fafb', fontSize: 11 },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  scaleCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scaleCircleSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  scaleNumber: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  scaleNumberSelected: { color: '#1f2937' },
  checkMark: {
    position: 'absolute',
    bottom: 2,
    right: 5,
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
  feedbackBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  feedbackIcon: { width: 24, height: 24, marginRight: 6 },
  feedbackTitle: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  feedbackText: { color: '#f9fafb', fontSize: 13 },
  feedbackHighlight: { fontWeight: 'bold' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  navBtnDisabled: { opacity: 0.45 },
  navBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  submitBtn: { backgroundColor: '#ffffff' },
  submitText: { color: '#111827', fontWeight: '700', fontSize: 15 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 6,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: { backgroundColor: '#ffffff' },
  dotAnswered: { backgroundColor: 'rgba(255,255,255,0.8)' },
});

export default SoulTestPage;
