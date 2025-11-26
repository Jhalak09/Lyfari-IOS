// src/components/Profile/EditProfileModal.tsx (React Native)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editData: any;
  setEditData: (data: any) => void;
  saving: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editData,
  setEditData,
  saving,
}) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  if (!isOpen) return null;

  const handleAvatarChange = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      // Validate file type
      if (!asset.type?.startsWith('image/')) {
        Toast.show({ type: 'error', text1: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Toast.show({ type: 'error', text1: 'Image size must be less than 5MB' });
        return;
      }

      setAvatarFile(asset);
      setAvatarPreview(asset.uri || null);
    } catch (error) {
      console.error('Error selecting avatar:', error);
      Toast.show({ type: 'error', text1: 'Failed to select image' });
    }
  };

  const handleSaveWithAvatar = async () => {
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatarFile.uri,
          type: avatarFile.type || 'image/jpeg',
          name: avatarFile.fileName || 'avatar.jpg',
        } as any);

        // Add all other profile data
        Object.keys(editData).forEach(key => {
          if (
            key !== 'avatarUrl' &&
            editData[key] !== null &&
            editData[key] !== undefined
          ) {
            formData.append(key, editData[key]);
          }
        });

        const token = await AsyncStorage.getItem('token');
        const res = await fetch(
          `${Config.NEXT_PUBLIC_BACKEND_URL}/profile/update`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (res.ok) {
          const data = await res.json();
          Toast.show({
            type: 'success',
            text1: data.message || 'Profile updated successfully!',
          });
          onClose();
          // Optionally reload or refresh profile data
        } else {
          const error = await res.json();
          Toast.show({
            type: 'error',
            text1: error.message || 'Failed to update profile',
          });
        }
      } else {
        // No new avatar, use regular save
        onSave();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  const avatarUri = avatarPreview || editData?.avatarUrl
    ? avatarPreview || `${Config.NEXT_PUBLIC_BACKEND_URL}${editData?.avatarUrl}`
    : undefined;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✏️ Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Avatar Upload */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarBox}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {editData?.name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={handleAvatarChange}
                  style={styles.cameraBadge}
                >
                  <Text style={styles.cameraIcon}>📷</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarHint}>
                Click the camera icon to upload a new avatar
              </Text>
            </View>

            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={editData?.name || ''}
                onChangeText={text => setEditData({ ...editData, name: text })}
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#6b7280"
              />
            </View>

            {/* About */}
            <View style={styles.field}>
              <Text style={styles.label}>About</Text>
              <TextInput
                value={editData?.about || ''}
                onChangeText={text => setEditData({ ...editData, about: text })}
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Location & Age */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  value={editData?.location || ''}
                  onChangeText={text =>
                    setEditData({ ...editData, location: text })
                  }
                  style={styles.input}
                  placeholder="City, Country"
                  placeholderTextColor="#6b7280"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  value={editData?.age?.toString() || ''}
                  onChangeText={text =>
                    setEditData({ ...editData, age: parseInt(text) || null })
                  }
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerBox}>
                {['Select...', 'Male', 'Female', 'Non-binary', 'Other'].map(
                  option => (
                    <TouchableOpacity
                      key={option}
                      onPress={() =>
                        setEditData({
                          ...editData,
                          gender: option === 'Select...' ? '' : option,
                        })
                      }
                      style={[
                        styles.pickerOption,
                        editData?.gender === option && styles.pickerOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          editData?.gender === option &&
                            styles.pickerOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>

            {/* Pronouns */}
            <View style={styles.field}>
              <Text style={styles.label}>Pronouns</Text>
              <TextInput
                value={editData?.pronouns || ''}
                onChangeText={text =>
                  setEditData({ ...editData, pronouns: text })
                }
                style={styles.input}
                placeholder="he/him, she/her, they/them"
                placeholderTextColor="#6b7280"
              />
            </View>

            {/* Interests */}
            <View style={styles.field}>
              <Text style={styles.label}>Interests</Text>
              <TextInput
                value={editData?.interests || ''}
                onChangeText={text =>
                  setEditData({ ...editData, interests: text })
                }
                style={styles.input}
                placeholder="Gaming, Music, Art..."
                placeholderTextColor="#6b7280"
              />
            </View>

            {/* Account Privacy */}
            <View style={styles.field}>
              <Text style={styles.label}>Account Privacy</Text>
              <View style={styles.pickerBox}>
                {['PUBLIC', 'PRIVATE'].map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() =>
                      setEditData({ ...editData, accountType: type })
                    }
                    style={[
                      styles.pickerOption,
                      editData?.accountType === type && styles.pickerOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        editData?.accountType === type &&
                          styles.pickerOptionTextActive,
                      ]}
                    >
                      {type === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveWithAvatar}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>💾 Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: { fontSize: 28, color: '#9ca3af' },
  body: { padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarBox: { position: 'relative', marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#ffffff', fontSize: 36, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  cameraIcon: { fontSize: 20 },
  avatarHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfField: { flex: 1 },
  pickerBox: { gap: 8 },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  pickerOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pickerOptionText: { color: '#9ca3af', fontSize: 14 },
  pickerOptionTextActive: { color: '#ffffff', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelText: { color: '#e5e7eb', fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
