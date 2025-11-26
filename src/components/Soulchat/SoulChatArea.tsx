// src/components/Soul/SoulChatArea.tsx (React Native - FIXED)

import React, { useState } from 'react'; // ✅ Removed unused imports
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Config from 'react-native-config';

interface SoulMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string | null;
  createdAt: string;
  isDeleted?: boolean;
  deleteType?: 'FOR_SELF' | 'FOR_EVERYONE';
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    imageUrl?: string;
  };
}

interface SoulChatAreaProps {
  selectedChatId: string | null;
  loadingChat: boolean;
  chatMeta: any;
  messages: SoulMessage[];
  currentUserId: string | null;
  text: string;
  setText: (text: string) => void;
  sending: boolean;
  imageFile: any;
  setImageFile: (file: any) => void;
 inputRef: React.RefObject<TextInput  | null>; // ✅ Use TextInput (not HTMLTextAreaElement)
  messagesEndRef: React.RefObject<View  | null>; // ✅ Use View
  sendTextMessage: () => void;
  sendImageMessage: () => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  onDeleteMessage: (messageId: string, deleteType: 'FOR_SELF' | 'FOR_EVERYONE') => void;
  onReplyToMessage: (messageId: string, text: string) => void;
  onPinChat: () => void;
  onUnpinChat: () => void;
  isPinned: boolean;
}

const SoulChatArea: React.FC<SoulChatAreaProps> = ({
  selectedChatId,
  loadingChat,
  chatMeta,
  messages,
  currentUserId,
  text,
  setText,
  sending,
  imageFile,
  setImageFile,
  inputRef,
  messagesEndRef, // ✅ Keep for future ref usage
  sendTextMessage,
  sendImageMessage,
  selectedImage,
  setSelectedImage,
  onDeleteMessage,
  onReplyToMessage,
  onPinChat,
  onUnpinChat,
  isPinned,
}) => {
  const [replyToMessage, setReplyToMessage] = useState<SoulMessage | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; messageId: string } | null>(null);

  if (!selectedChatId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Select a Chat</Text>
        <Text style={styles.emptySubtitle}>Choose a conversation to start</Text>
      </View>
    );
  }

  const handleDeleteMessage = (deleteType: 'FOR_SELF' | 'FOR_EVERYONE') => {
    if (selectedMessageId) {
      onDeleteMessage(selectedMessageId, deleteType);
      setShowDeleteModal(false);
      setSelectedMessageId(null);
      setContextMenu(null);
    }
  };

  const handleReplyToMessage = () => {
    if (!text.trim() || !replyToMessage) return;
    onReplyToMessage(replyToMessage.id, text.trim());
    setReplyToMessage(null);
    setText('');
  };

  const handleOpenContextMenu = (messageId: string) => {
    setSelectedMessageId(messageId);
    setContextMenu({ visible: true, messageId });
  };

  const renderMessage = ({ item: msg }: { item: SoulMessage }) => {
    const isCurrentUser = currentUserId && msg.senderId === currentUserId;
    const avatarUrl =
      chatMeta?.partner.avatar &&
      (chatMeta.partner.avatar.startsWith('http')
        ? chatMeta.partner.avatar
        : `${Config.NEXT_PUBLIC_BACKEND_URL}${chatMeta.partner.avatar}`);

    return (
      <View
        style={[
          styles.messageRow,
          isCurrentUser ? styles.messageRowCurrentUser : styles.messageRowOther,
        ]}
      >
        {!isCurrentUser && (
          <>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.messageAvatar} />
            ) : (
              <View style={styles.messageAvatarFallback}>
                <Text style={styles.messageAvatarInitial}>
                  {chatMeta?.partner.name[0].toUpperCase()}
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          onLongPress={() => !msg.isDeleted && handleOpenContextMenu(msg.id)}
          style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.messageBubbleCurrentUser
              : styles.messageBubbleOther,
          ]}
        >
          {/* Reply Preview */}
          {msg.replyTo && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyLabel}>↳ {msg.replyTo.senderName}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {msg.replyTo.imageUrl ? '📷 Photo' : msg.replyTo.text}
              </Text>
            </View>
          )}

          {/* Message Content */}
          {msg.isDeleted ? (
            <Text style={styles.deletedText}>
              🗑️{' '}
              {msg.deleteType === 'FOR_EVERYONE'
                ? 'This message was deleted'
                : 'You deleted this message'}
            </Text>
          ) : msg.type === 'text' ? (
            <Text style={styles.messageText}>{msg.text}</Text>
          ) : (
            <TouchableOpacity onPress={() => setSelectedImage(msg.imageUrl || null)}>
              <Image
                source={{ uri: msg.imageUrl || '' }}
                style={styles.messageImage}
              />
            </TouchableOpacity>
          )}

          {/* Timestamp */}
          <View style={styles.timestampRow}>
            <Text style={styles.timestamp}>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isCurrentUser && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Context Menu */}
        {contextMenu?.visible && contextMenu.messageId === msg.id && !msg.isDeleted && (
          <View style={styles.contextMenu}>
            <TouchableOpacity
              onPress={() => {
                setReplyToMessage(msg);
                setContextMenu(null);
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setContextMenu(null);
                setShowDeleteModal(true);
              }}
              style={styles.menuItem}
            >
              <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.chatContainer}>
      {/* Chat Header */}
      {chatMeta && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.partnerName}>{chatMeta.partner.name}</Text>
            <Text style={styles.connectionStatus}>Soul connection active</Text>
          </View>
          <TouchableOpacity
            onPress={isPinned ? onUnpinChat : onPinChat}
            style={styles.pinBtn}
          >
            <Text style={styles.pinIcon}>{isPinned ? '📌' : '📍'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages Area */}
      {loadingChat ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyMessageText}>
            Your soul connection begins here
          </Text>
          <Text style={styles.emptyMessageSubtext}>
            Share your thoughts and memories
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          scrollEnabled={true}
          ref={messagesEndRef as any}
        />
      )}

      {/* Reply Preview */}
      {replyToMessage && (
        <View style={styles.replyPreviewBox}>
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyPreviewLabel}>
              Replying to {replyToMessage.senderName}
            </Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              {replyToMessage.imageUrl ? '📷 Photo' : replyToMessage.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setReplyToMessage(null)}
            style={styles.replyCloseBtn}
          >
            <Text style={styles.replyCloseIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Preview */}
      {imageFile && (
        <View style={styles.imagePreviewBox}>
          <Text style={styles.imagePreviewName}>{imageFile.name}</Text>
          <Text style={styles.imagePreviewSize}>
            {(imageFile.size / 1024 / 1024).toFixed(1)} MB
          </Text>
          <TouchableOpacity
            onPress={sendImageMessage}
            disabled={sending}
            style={styles.sendImageBtn}
          >
            <Text style={styles.sendImageBtnText}>
              {sending ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setImageFile(null)}
            style={styles.removeImageBtn}
          >
            <Text style={styles.removeImageBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={
            replyToMessage
              ? `Reply to ${replyToMessage.senderName}...`
              : 'Type a message...'
          }
          placeholderTextColor="#6b7280"
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={replyToMessage ? handleReplyToMessage : sendTextMessage}
          disabled={sending || !text.trim()}
          style={[
            styles.sendBtn,
            (!text.trim() || sending) && styles.sendBtnDisabled,
          ]}
        >
          <Text style={styles.sendBtnText}>{sending ? '⏳' : '💝'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        💝 Messages are permanent and stored forever
      </Text>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Message?</Text>

            <TouchableOpacity
              onPress={() => handleDeleteMessage('FOR_SELF')}
              style={styles.deleteOption}
            >
              <Text style={styles.deleteOptionIcon}>🗑️</Text>
              <View>
                <Text style={styles.deleteOptionTitle}>Delete for me</Text>
                <Text style={styles.deleteOptionSubtext}>
                  Only you won't see this message
                </Text>
              </View>
            </TouchableOpacity>

            {(() => {
              const message = messages.find(m => m.id === selectedMessageId);
              const isOwnMessage = message && message.senderId === currentUserId;
              const withinTimeLimit =
                message &&
                new Date().getTime() - new Date(message.createdAt).getTime() <
                  60 * 60 * 1000;

              return (
                isOwnMessage &&
                withinTimeLimit && (
                  <TouchableOpacity
                    onPress={() => handleDeleteMessage('FOR_EVERYONE')}
                    style={styles.deleteOption}
                  >
                    <Text style={styles.deleteOptionIcon}>🗑️</Text>
                    <View>
                      <Text style={styles.deleteOptionTitle}>
                        Delete for everyone
                      </Text>
                      <Text style={styles.deleteOptionSubtext}>
                        This message will be deleted for all participants
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              );
            })()}

            <TouchableOpacity
              onPress={() => {
                setShowDeleteModal(false);
                setSelectedMessageId(null);
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            style={styles.imageViewer}
            activeOpacity={1}
          >
            <Image
              source={{ uri: selectedImage || '' }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={styles.closeImageBtn}
            >
              <Text style={styles.closeImageIcon}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    flexDirection: 'column',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  headerLeft: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  pinBtn: {
    padding: 8,
  },
  pinIcon: {
    fontSize: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  messagesList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowCurrentUser: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageBubbleCurrentUser: {
    backgroundColor: '#6366f1',
  },
  messageBubbleOther: {
    backgroundColor: '#374151',
  },
  replyPreview: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#6366f1',
  },
  replyLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  replyText: {
    fontSize: 11,
    color: '#e5e7eb',
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  deletedText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },
  checkmark: {
    fontSize: 10,
    color: '#9ca3af',
  },
  contextMenu: {
    position: 'absolute',
    top: -80,
    right: 0,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 14,
  },
  deleteMenuItemText: {
    color: '#ef4444',
  },
  replyPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#e5e7eb',
    marginTop: 2,
  },
  replyCloseBtn: {
    padding: 4,
  },
  replyCloseIcon: {
    fontSize: 18,
    color: '#9ca3af',
  },
  imagePreviewBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  imagePreviewName: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  imagePreviewSize: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  sendImageBtn: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 6,
    alignItems: 'center',
  },
  sendImageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  removeImageBtn: {
    marginTop: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  removeImageBtnText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#4b5563',
  },
  sendBtnText: {
    fontSize: 18,
  },
  disclaimer: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteOptionIcon: {
    fontSize: 18,
  },
  deleteOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteOptionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeImageBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  emptyMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default SoulChatArea;
