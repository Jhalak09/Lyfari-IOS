// src/components/Profile/UploadPostModal.tsx (React Native - Updated)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageResizer from 'react-native-image-resizer';


type UploadMode = 'IMAGE' | 'VIDEO' | 'REEL';

interface MediaItem {
  file: any;
  preview: string;
  type: 'image' | 'video';
  duration?: number;
}

type UploadStep = 'mode' | 'select' | 'edit' | 'caption';

interface UploadPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const UploadPostModal: React.FC<UploadPostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [mode, setMode] = useState<UploadMode | null>(null);
  const [step, setStep] = useState<UploadStep>('mode');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleModeSelect = (selectedMode: UploadMode) => {
    setMode(selectedMode);
    setStep('select');
  };

  const handleFileSelect = async () => {
  try {
    const result = await launchImageLibrary({
      mediaType: mode === 'IMAGE' ? 'photo' : 'video',
      quality: 0.7, // ✅ Reduced from 0.8 to compress more
      maxWidth: 1920, // ✅ Limit max dimensions
      maxHeight: 1920,
      selectionLimit: mode === 'IMAGE' ? 10 : 1,
      includeBase64: false, // ✅ Don't include base64
    });

    if (result.didCancel) return;

    const assets = result.assets || [];
    if (assets.length === 0) return;

    if (mode === 'IMAGE') {
      const imageFiles = assets.filter(a => a.type?.startsWith('image/'));
      if (imageFiles.length === 0) {
        Alert.alert('Error', 'Image posts require at least one image');
        return;
      }
      if (imageFiles.length > 10) {
        Alert.alert('Error', 'Maximum 10 images allowed');
        return;
      }

      const newMedia: MediaItem[] = imageFiles.map(asset => ({
        file: {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
        },
        preview: asset.uri || '',
        type: 'image',
      }));
      setMediaItems(newMedia);
    } else {
      const videoFile = assets[0];
      if (!videoFile.type?.startsWith('video/')) {
        Alert.alert('Error', 'Video posts require a video file');
        return;
      }

      if (mode === 'REEL' && videoFile.duration && videoFile.duration > 90) {
        Alert.alert('Error', 'Reels must be 90 seconds or less');
        return;
      }

      setMediaItems([
        {
          file: videoFile,
          preview: videoFile.uri || '',
          type: 'video',
          duration: videoFile.duration,
        },
      ]);
    }

    setStep('edit');
  } catch (error) {
    console.error('Error selecting files:', error);
    Alert.alert('Error', 'Failed to select files');
  }
};


  const removeMedia = (index: number) => {
    const updated = mediaItems.filter((_, i) => i !== index);
    setMediaItems(updated);
    if (updated.length === 0) {
      setStep('select');
    } else if (selectedIndex >= updated.length) {
      setSelectedIndex(updated.length - 1);
    }
  };

  const handleSubmit = async () => {
  if (mediaItems.length === 0) {
    Alert.alert('Error', 'Please select at least one file');
    return;
  }

  setUploading(true);

  try {
    const formData = new FormData();

    if (caption.trim()) {
      formData.append('caption', caption);
    }
    formData.append('type', mode!);

    // Build FormData exactly as before
    for (const media of mediaItems) {
      formData.append('media', {
        uri: media.file.uri,
        type: media.file.type || 'image/jpeg',
        name: media.file.fileName || 'media.jpg',
      } as any);
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Not authenticated');
      setUploading(false);
      return;
    }

    // ✅ Use XMLHttpRequest instead of fetch to avoid "Already read"
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', `${Config.NEXT_PUBLIC_BACKEND_URL}/posts`);

      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Do NOT set Content-Type manually; RN will add correct multipart boundary

      xhr.onload = () => {
        // 2xx = success
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          // Try to extract backend error message if present
          try {
            const json = JSON.parse(xhr.responseText || '{}');
            const message = json.message || `Failed to create post (${xhr.status})`;
            reject(new Error(message));
          } catch {
            reject(new Error(`Failed to create post (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error while uploading post'));
      };

      xhr.send(formData);
    });

    // If we get here, upload succeeded
    onPostCreated();
    resetModal();
    onClose();
  } catch (error: any) {
    console.log('Post upload error:', error?.message || error);
    Alert.alert('Error', error?.message || 'Failed to create post');
  } finally {
    setUploading(false);
  }
};


  const resetModal = () => {
    setMode(null);
    setStep('mode');
    setMediaItems([]);
    setCaption('');
    setSelectedIndex(0);
  };

  const currentMedia = mediaItems[selectedIndex];


  return (
    <Modal
  visible={isOpen}
  transparent={false}
  animationType="slide"
  onRequestClose={onClose}
  presentationStyle="pageSheet"
>

      <View style={styles.overlay}>
        <SafeAreaView
          style={styles.container}
          edges={['top', 'bottom', 'left', 'right']}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (step === 'mode') onClose();
                else if (step === 'select') setStep('mode');
                else if (step === 'edit') setStep('select');
                else if (step === 'caption') setStep('edit');
              }}
            >
              <Text style={styles.backBtn}>{step === 'mode' ? '✕' : '←'}</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {step === 'mode' && 'Create New Post'}
              {step === 'select' &&
                mode &&
                `Create ${mode === 'REEL' ? 'Reel' : mode === 'VIDEO' ? 'Video' : 'Post'}`}
              {step === 'edit' && 'Edit'}
              {step === 'caption' && 'New Post'}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (step === 'edit') setStep('caption');
                else if (step === 'caption') handleSubmit();
              }}
              disabled={uploading || step === 'mode' || step === 'select'}
              style={{ opacity: step === 'mode' || step === 'select' ? 0.3 : 1 }}
            >
              <Text style={styles.nextBtn}>
                {uploading ? 'Sharing...' : step === 'caption' ? 'Share' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* MODE SELECTION */}
            {step === 'mode' && (
              <>
                <TouchableOpacity
                  onPress={() => handleModeSelect('IMAGE')}
                  style={[styles.modeBtn, styles.modeBtnImage]}
                >
                  <Text style={styles.modeBtnTitle}>📷 Photo Post</Text>
                  <Text style={styles.modeBtnSubtitle}>
                    Share 1-10 photos as a post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleModeSelect('VIDEO')}
                  style={[styles.modeBtn, styles.modeBtnVideo]}
                >
                  <Text style={styles.modeBtnTitle}>🎬 Video Post</Text>
                  <Text style={styles.modeBtnSubtitle}>
                    Share a video to your feed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleModeSelect('REEL')}
                  style={[styles.modeBtn, styles.modeBtnReel]}
                >
                  <Text style={styles.modeBtnTitle}>🎥 Reel</Text>
                  <Text style={styles.modeBtnSubtitle}>
                    Short vertical video (max 90s)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* SELECT STEP */}
            {step === 'select' && (
              <View style={styles.selectBox}>
                <TouchableOpacity
                  onPress={handleFileSelect}
                  style={styles.selectBtn}
                >
                  <Text style={styles.selectText}>
                    Select {mode === 'IMAGE' ? 'Photos' : 'Video'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* EDIT STEP */}
            {step === 'edit' && currentMedia && (
              <>
                {currentMedia.type === 'image' ? (
                  <Image
                    source={{ uri: currentMedia.preview }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>Video preview</Text>
                  </View>
                )}

                {mode === 'IMAGE' && mediaItems.length > 1 && (
                  <>
                    <View style={styles.indicators}>
                      {mediaItems.map((_, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setSelectedIndex(idx)}
                          style={[
                            styles.indicator,
                            idx === selectedIndex && styles.indicatorActive,
                          ]}
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      onPress={() => removeMedia(selectedIndex)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeText}>Remove this image</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* CAPTION STEP */}
            {step === 'caption' && (
              <>
                {mediaItems[0]?.type === 'image' ? (
                  <Image
                    source={{ uri: mediaItems[0].preview }}
                    style={styles.captionPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>Video</Text>
                  </View>
                )}

                <Text style={styles.captionLabel}>Add Caption</Text>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Write a caption..."
                  placeholderTextColor="#6b7280"
                  style={styles.captionInput}
                  multiline
                  maxLength={2200}
                />
                <Text style={styles.captionCount}>{caption.length}/2200</Text>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    minHeight: 60,
  },
  backBtn: { fontSize: 24, color: '#ffffff' },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  nextBtn: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  body: { flex: 1 },
  bodyContent: { padding: 16, alignItems: 'center', gap: 16 },
  modeBtn: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeBtnImage: { backgroundColor: '#2563eb' },
  modeBtnVideo: { backgroundColor: '#059669' },
  modeBtnReel: { backgroundColor: '#ea580c' },
  modeBtnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  modeBtnSubtitle: { fontSize: 13, color: '#e5e7eb' },
  selectBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  selectText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: Dimensions.get('window').width - 32,
    height: 400,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: Dimensions.get('window').width - 32,
    height: 400,
    backgroundColor: '#111827',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: { color: '#9ca3af', fontSize: 16 },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: { backgroundColor: '#ffffff' },
  removeBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  removeText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  captionPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  captionInput: {
    width: '100%',
    height: 120,
    backgroundColor: '#374151',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  captionCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
