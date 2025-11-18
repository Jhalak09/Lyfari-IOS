import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';

// All variable names, form fields, error logic, and colors kept identical
const ProfileSetupScreen = () => {
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    pronouns: '',
    location: '',
    interests: '',
    about: '',
    avatarUrl: '',
  });
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    // Auth token check, replaces localStorage with AsyncStorage
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('SignIn');
        return;
      }

      // Simulate delay for UX
      setTimeout(() => setLoading(false), 1500);
    };
    checkAuth();
  }, [navigation]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.age || parseInt(formData.age) < 15 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 15 and 120';
    }
    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.interests.trim() || formData.interests.length < 10) {
      newErrors.interests = 'Interests are required (minimum 10 characters)';
    }
    if (!formData.about.trim() || formData.about.length < 20) {
      newErrors.about = 'About section is required (minimum 20 characters)';
    }
    if (formData.pronouns && formData.pronouns.length > 50) {
      newErrors.pronouns = 'Pronouns must be less than 50 characters';
    }
    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location must be less than 100 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({ type: 'error', text1: 'Please fix the errors below' });
      return;
    }

    setFormLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${Config.NEXT_PUBLIC_BACKEND_URL}/profile/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Profile created successfully! Ready for your SoulTest 🎉',
          position: 'top',
          visibilityTime: 4000,
          style: { backgroundColor: '#10B981' }
        });

        const userRaw = await AsyncStorage.getItem('user');
        const userData = userRaw ? JSON.parse(userRaw) : {};
        userData.isProfileComplete = true;
        userData.needsProfileSetup = false;
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        setTimeout(() => {
          navigation.replace('SoulTest');
        }, 1500);
      } else {
        Toast.show({ type: 'error', text1: result.message || 'Failed to create profile' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Network error. Please try again.' });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.bgContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/LYFARI-INFINITY-LOGO.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Create Your Profile</Text>
          <Text style={styles.headerSubtitle}>
            Step 2 of 3 - Tell us about yourself for better soulmate matching
          </Text>
          <View style={styles.progressBar}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
        {/* Profile Form */}
        <View style={styles.formBox}>
          {/* Age */}
          <Text style={styles.sectionLabel}>
            Essential Information <Text style={styles.required}>* Required</Text>
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Age <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.age ? styles.inputError : styles.inputNormal,
              ]}
              value={formData.age}
              onChangeText={val => handleInputChange('age', val)}
              placeholder="Enter your age"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              minLength={2}
              maxLength={3}
              editable={!formLoading}
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>
          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Gender Identity <Text style={styles.required}>*</Text>
            </Text>
            {/* Simple gender select */}
            <View style={styles.pickerContainer}>
              {["", "Male", "Female", "Non-binary", "Other", "Prefer not to say"].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.pickerOption,
                    formData.gender === g && styles.pickerOptionSelected
                  ]}
                  onPress={() => handleInputChange('gender', g)}
                  disabled={formLoading}
                >
                  <Text style={[
                    styles.pickerText,
                    formData.gender === g && styles.pickerTextSelected
                  ]}>
                    {g || "Select Gender"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>
          {/* Interests */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Interests & Passions <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textarea,
                errors.interests ? styles.inputError : styles.inputNormal,
              ]}
              value={formData.interests}
              onChangeText={val => handleInputChange('interests', val)}
              placeholder="What makes your soul come alive? (music, art, spirituality, nature, travel, books, etc.)"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!formLoading}
            />
            <View style={styles.flexRow}>
              {errors.interests ?
                <Text style={styles.errorText}>{errors.interests}</Text> :
                <Text style={styles.helperText}>Minimum 10 characters</Text>
              }
              <Text style={styles.helperText}>{formData.interests.length}/500</Text>
            </View>
          </View>
          {/* About */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              About You <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textarea,
                errors.about ? styles.inputError : styles.inputNormal,
              ]}
              value={formData.about}
              onChangeText={val => handleInputChange('about', val)}
              placeholder="Share your story, your journey, what makes you unique. What are you looking for in meaningful connections?"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              maxLength={1000}
              editable={!formLoading}
            />
            <View style={styles.flexRow}>
              {errors.about ?
                <Text style={styles.errorText}>{errors.about}</Text> :
                <Text style={styles.helperText}>Minimum 20 characters</Text>
              }
              <Text style={styles.helperText}>{formData.about.length}/1000</Text>
            </View>
          </View>
          {/* Optional Section */}
          <View style={styles.optionalSection}>
            <Text style={styles.sectionLabelOpt}>
              Optional Information
            </Text>
            <Text style={styles.helperText}>These fields help improve your matches but are completely optional</Text>
            {/* Pronouns */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Pronouns <Text style={styles.helperText}>(Optional)</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.pronouns ? styles.inputError : styles.inputNormal,
                ]}
                value={formData.pronouns}
                onChangeText={val => handleInputChange('pronouns', val)}
                placeholder="they/them, she/her, he/him, etc."
                placeholderTextColor="#aaa"
                maxLength={50}
                editable={!formLoading}
              />
              {errors.pronouns && <Text style={styles.errorText}>{errors.pronouns}</Text>}
            </View>
            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Location <Text style={styles.helperText}>(Optional)</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.location ? styles.inputError : styles.inputNormal,
                ]}
                value={formData.location}
                onChangeText={val => handleInputChange('location', val)}
                placeholder="City, Country"
                placeholderTextColor="#aaa"
                maxLength={100}
                editable={!formLoading}
              />
              {errors.location ?
                <Text style={styles.errorText}>{errors.location}</Text>
                : <Text style={styles.helperTextSm}>
                  Helps find nearby soulmates while maintaining your privacy
                </Text>
              }
            </View>
          </View>
          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={formLoading}
          >
            {formLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitBtnText}>Creating Profile...</Text>
              </>
            ) : (
              <Text style={styles.submitBtnText}>
                Create Profile & Continue to SoulTest ✨
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingTop: 12,
    paddingBottom: 8,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#a1a1aa',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  progressBar: {
    marginTop: 24,
    backgroundColor: '#334155',
    borderRadius: 8,
    height: 10,
    width: '80%',
    maxWidth: 320,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  progressBarFill: {
    backgroundColor: 'linear-gradient(90deg, #4f46e5 67%, #a78bfa 100%)',
    background: '#4f46e5',
    height: 10,
    width: '66%',
    borderRadius: 8,
  },
  formBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 20,
    marginBottom: 24,
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(24,24,27,0.7)',
    color: '#f3f4f6',
    borderRadius: 8,
    padding: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#52525b',
    marginBottom: 3,
    width: '100%',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputNormal: {
    borderColor: '#52525b',
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(24,24,27,0.7)',
    color: '#f3f4f6',
    borderRadius: 8,
    padding: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#52525b',
    width: '100%',
    marginBottom: 3,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 2,
  },
  helperText: {
    color: '#71717a',
    fontSize: 13,
  },
  helperTextSm: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 3,
    marginBottom: 3,
  },
  pickerOption: {
    backgroundColor: '#232325',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    margin: 2,
    borderWidth: 1,
    borderColor: '#52525b',
    minWidth: 95,
  },
  pickerOptionSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  pickerText: {
    color: '#a1a1aa',
    textAlign: 'center',
    fontSize: 14,
  },
  pickerTextSelected: {
    color: '#f3f4f6',
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  sectionLabelOpt: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#a1a1aa',
    marginBottom: 2,
  },
  required: {
    color: '#ef4444',
    fontSize: 13,
  },
  optionalSection: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    marginTop: 18,
  },
  submitBtn: {
    backgroundColor: 'rgba(44,56,241,0.9)',
    borderRadius: 13,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default ProfileSetupScreen;
