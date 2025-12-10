// src/components/Stories/CreateStoryModal.tsx (React Native)

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  ScrollView, // ✅ added
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const [media, setMedia] = useState<Asset | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');

  const handleMediaSelect = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
        quality: 0.7,
      });

      if (result.didCancel) {
        return;
      }

      const file = result.assets?.[0];
      if (!file) return;

      const mime = file.type || '';
      if (!mime.startsWith('image/') && !mime.startsWith('video/')) {
        Toast.show({
          type: 'error',
          text1: 'Only images and videos are allowed',
        });
        return;
      }

      if (file.fileSize && file.fileSize > MAX_SIZE_BYTES) {
        Toast.show({
          type: 'error',
          text1: 'File size must be less than 50MB',
        });
        return;
      }

      setMedia(file);
      if (file.uri) {
        setPreview(file.uri);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to open media picker',
      });
    }
  };

  const handleSubmit = async () => {
  if (!media || !media.uri) {
    Toast.show({
      type: 'error',
      text1: 'Please select an image or video',
    });
    return;
  }

  try {
    setIsLoading(true);

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Not authenticated',
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();

    const fileName =
      media.fileName || `story.${media.type?.includes('video') ? 'mp4' : 'jpg'}`;

    formData.append('media', {
      uri: media.uri,
      type: media.type || 'application/octet-stream',
      name: fileName,
    } as any);

    if (textOverlay) {
      formData.append('caption', textOverlay);
    }

    // ✅ Use XMLHttpRequest instead of fetch to avoid "Already read"
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', `${Config.NEXT_PUBLIC_BACKEND_URL}/stories`);

      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Do NOT set Content-Type manually; RN will add correct multipart boundary

      xhr.onload = () => {
        // 2xx = success
        if (xhr.status >= 200 && xhr.status < 300) {
          Toast.show({
            type: 'success',
            text1: 'Story posted successfully! 🎉',
          });
          setMedia(null);
          setPreview('');
          setTextOverlay('');
          onCreated();
          onClose();
          resolve();
        } else {
          // Try to extract backend error message if present
          try {
            const json = JSON.parse(xhr.responseText || '{}');
            const message = json.message || 'Failed to create story';
            Toast.show({
              type: 'error',
              text1: message,
            });
          } catch {
            Toast.show({
              type: 'error',
              text1: 'Failed to create story',
            });
          }
          reject(new Error(`Failed to create story (${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        Toast.show({
          type: 'error',
          text1: 'Network error while creating story',
        });
        reject(new Error('Network error while creating story'));
      };

      xhr.send(formData);
    });
  } catch (error: any) {
    console.log('RAW story error object:', error);
    console.log('RAW story error name/message:', error?.name, error?.message);
    console.error('Error creating story:', error);
    // Toast already shown in xhr.onload/onerror
  } finally {
    setIsLoading(false);
  }
};



  const handleChangeMedia = () => {
    setMedia(null);
    setPreview('');
    setTextOverlay('');
    handleMediaSelect();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Story</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.headerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Body is now scrollable */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {preview ? (
              <>
                {/* Preview */}
                <View style={styles.previewBox}>
                  {media?.type?.startsWith('image/') ? (
                    <Image
                      source={{ uri: preview }}
                      style={styles.previewMedia}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.videoPlaceholder}>
                      <Text style={styles.videoText}>Video preview</Text>
                    </View>
                  )}
                  {textOverlay ? (
                    <View style={styles.previewCaptionOverlay}>
                      <Text
                        style={styles.previewCaptionText}
                        numberOfLines={3}
                      >
                        {textOverlay}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Caption input */}
                <TextInput
                  value={textOverlay}
                  onChangeText={setTextOverlay}
                  placeholder="Add text to your story..."
                  placeholderTextColor="#9ca3af"
                  maxLength={200}
                  style={styles.input}
                  multiline
                />
                <Text style={styles.charCount}>
                  {textOverlay.length}/200
                </Text>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={handleChangeMedia}
                    style={styles.changeBtn}
                  >
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={[
                      styles.postBtn,
                      isLoading && styles.postBtnDisabled,
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.postText}>Post Story</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // No media selected yet
              <TouchableOpacity
                onPress={handleMediaSelect}
                style={styles.uploadBox}
              >
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadTitle}>
                  Tap to upload from gallery
                </Text>
                <Text style={styles.uploadHint}>
                  PNG, JPG, GIF, MP4, WebM (Max 50MB)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerClose: { fontSize: 18, color: '#6b7280' },
  body: {
    padding: 14,
  },
  // ✅ added: so content has some bottom space when scrolling
  bodyContent: {
    paddingBottom: 16,
  },
  previewBox: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    aspectRatio: 9 / 16,
    borderRadius: 14,
    backgroundColor: '#000000',
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: { color: '#e5e7eb' },
  previewCaptionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  previewCaptionText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  changeBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeText: {
    color: '#111827',
    fontWeight: '500',
    fontSize: 14,
  },
  postBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  postBtnDisabled: {
    opacity: 0.6,
  },
  postText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  uploadBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default CreateStoryModal;
