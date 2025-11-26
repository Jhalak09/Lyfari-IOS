// src/components/Whispers/ChatArea.tsx (React Native - FIXED)

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface ChatAreaProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  selectedChatId: string | null;
  loadingChat: boolean;
  chatMeta: any;
  messages: any[];
  currentUserId: string | null;
  currentUserName: string | null;
  lastSentMessageId: string | null;
  text: string;
  setText: (text: string) => void;
  sending: boolean;
  inputRef: React.RefObject<TextInput | null>;
  messagesEndRef: React.RefObject<View | null>;
  sendMessage: () => void;
  requestSoulChat: () => void;
  formatTimestamp: (timestamp: string) => string;
  onReplyToMessage: (messageId: string, text: string) => void;
  onPinChat: () => void;
  onUnpinChat: () => void;
  isPinned: boolean;
}

export default function ChatArea({
  showSidebar,
  setShowSidebar,
  selectedChatId,
  loadingChat,
  chatMeta,
  messages,
  currentUserId,
  currentUserName,
  lastSentMessageId,
  text,
  setText,
  sending,
  inputRef,
  messagesEndRef,
  sendMessage,
  requestSoulChat,
  formatTimestamp,
  onReplyToMessage,
  onPinChat,
  onUnpinChat,
  isPinned,
}: ChatAreaProps) {
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Mark thread as read
  useEffect(() => {
    if (selectedChatId) {
      const threadId = parseInt(selectedChatId);
      if (!isNaN(threadId)) {
        console.log(`📖 Marking WHISPER thread ${threadId} as read...`);
        // TODO: Integrate with notifications context if available in React Native
      }
    }
  }, [selectedChatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleReply = (message: any) => {
    setReplyToMessage(message);
    inputRef.current?.focus();
  };

  const sendReplyMessage = () => {
    if (!text.trim() || !replyToMessage) return;
    onReplyToMessage(replyToMessage.id, text.trim());
    setReplyToMessage(null);
    setText('');
  };

  const jumpToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 2000);
    
    // Find message index and scroll to it
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  if (!selectedChatId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💭</Text>
        <Text style={styles.emptyTitle}>No conversation selected</Text>
        <Text style={styles.emptySubtitle}>
          Select a whisper to start your temporary conversation
        </Text>
      </View>
    );
  }

  const renderMessage = ({ item: msg }: { item: any }) => {
    const isOwnMessageById =
      currentUserId && msg.senderId.toString() === currentUserId.toString();
    const isOwnMessageByName =
      currentUserName && msg.senderName === currentUserName;
    const isOwnMessage = isOwnMessageById || isOwnMessageByName || msg.sent;
    const isHighlighted = highlightedMessageId === msg.id;

    return (
      <View
        style={[
          styles.messageWrapper,
          isOwnMessage && styles.messageWrapperOwn,
          isHighlighted && styles.messageHighlighted,
        ]}
      >
        <View style={{ flex: 1, maxWidth: '85%' }}>
          {/* Reply preview */}
          {msg.replyTo && (
            <TouchableOpacity
              onPress={() => jumpToMessage(msg.replyTo.id)}
              style={styles.replyPreview}
            >
              <Text style={styles.replyLabel}>
                ↳ Replying to {msg.replyTo.senderName}
              </Text>
              <Text style={styles.replyText} numberOfLines={2}>
                {msg.replyTo.text}
              </Text>
              <Text style={styles.replyHint}>Tap to view original</Text>
            </TouchableOpacity>
          )}

          {/* Message bubble */}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage && styles.messageBubbleOwn,
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>

            <View style={styles.messageFooter}>
              {!isOwnMessage && (
                <>
                  <Text style={styles.senderName}>{msg.senderName}</Text>
                  <Text style={styles.separator}>•</Text>
                </>
              )}
              <Text style={styles.timestamp}>{formatTimestamp(msg.createdAt)}</Text>
              {isOwnMessage && msg.id === lastSentMessageId && (
                <Text style={styles.sentIcon}>✓</Text>
              )}
            </View>
          </View>
        </View>

        {/* Message options button */}
        <TouchableOpacity
          onPress={() => handleReply(msg)}
          style={styles.messageOptionsButton}
        >
          <Text style={styles.messageOptionsIcon}>⋯</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ FIX: Separate components for List props
  const renderEmptyComponent = () => {
    if (loadingChat) return null;
    
    return (
      <View style={styles.noMessagesContainer}>
        <Text style={styles.noMessagesEmoji}>✨</Text>
        <Text style={styles.noMessagesTitle}>No messages yet</Text>
        <Text style={styles.noMessagesSubtitle}>
          Start your temporary conversation!
        </Text>
      </View>
    );
  };

  const renderHeaderComponent = () => {
    if (!loadingChat) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        {!showSidebar && (
          <TouchableOpacity
            onPress={() => setShowSidebar(true)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerContent}>
          {loadingChat ? (
            <Text style={styles.headerTitle}>Loading chat...</Text>
          ) : chatMeta ? (
            <>
              <View style={styles.partnerInfo}>
                <View style={styles.partnerInitialContainer}>
                  <Text style={styles.partnerInitial}>
                    {chatMeta.partner.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.partnerDetails}>
                  <Text style={styles.partnerName}>
                    {chatMeta.partner.name}
                  </Text>
                  <Text style={styles.expiryInfo}>
                    Chat expires in {chatMeta.daysLeft} days
                  </Text>
                </View>
              </View>

              {chatMeta.daysLeft <= 1 && (
                <Text style={styles.warningBadge}>
                  ⚠️ {chatMeta.daysLeft}d
                </Text>
              )}
            </>
          ) : null}
        </View>

        {/* Header buttons */}
        {chatMeta && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={isPinned ? onUnpinChat : onPinChat}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>
                {isPinned ? '📌 Unpin' : '📍 Pin'}
              </Text>
            </TouchableOpacity>

            {chatMeta.canRequestSoulChat && chatMeta.daysLeft > 1 && (
              <TouchableOpacity
                onPress={requestSoulChat}
                style={styles.soulChatButton}
              >
                <Text style={styles.soulChatButtonText}>🌟 Soul Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Messages Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={renderHeaderComponent}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
        }}
      />

      {/* Input Area */}
      {chatMeta && chatMeta.daysLeft <= 0 ? (
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredText}>
            This conversation has expired and will be deleted soon
          </Text>
        </View>
      ) : (
        <View style={styles.inputArea}>
          {/* Reply Preview */}
          {replyToMessage && (
            <View style={styles.replyingToContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyingLabel}>
                  Replying to <Text style={styles.replyingSender}>{replyToMessage.senderName}</Text>
                </Text>
                <Text style={styles.replyingText} numberOfLines={1}>
                  {replyToMessage.text}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReplyToMessage(null)}
                style={styles.clearReplyButton}
              >
                <Text style={styles.clearReplyIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input field */}
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
              multiline={true}
              maxLength={500}
              editable={!sending}
            />

            <TouchableOpacity
              onPress={() => {
                if (replyToMessage) {
                  sendReplyMessage();
                } else {
                  sendMessage();
                }
              }}
              disabled={sending || !text.trim()}
              style={[
                styles.sendButton,
                (sending || !text.trim()) && styles.sendButtonDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <Text style={styles.warningText}>
            ⚠️ Messages persist until entire chat expires after 7 days
          </Text>
        </View>
      )}

      <View ref={messagesEndRef} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerInitialContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  partnerInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  expiryInfo: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  warningBadge: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 6,
  },
  headerButtonText: {
    fontSize: 11,
    color: '#a78bfa',
    fontWeight: '600',
  },
  soulChatButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 6,
  },
  soulChatButtonText: {
    fontSize: 11,
    color: '#d8b4fe',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  messagesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  noMessagesContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noMessagesEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  noMessagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  noMessagesSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  messageWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  messageWrapperOwn: {
    justifyContent: 'flex-end',
  },
  messageHighlighted: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  messageBubble: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  messageBubbleOwn: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
  },
  messageText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    marginRight: 4,
  },
  separator: {
    fontSize: 10,
    color: '#6b7280',
    marginHorizontal: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  sentIcon: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
  },
  messageOptionsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  messageOptionsIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  replyPreview: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  replyLabel: {
    fontSize: 11,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 2,
  },
  replyHint: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  inputArea: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#000000',
  },
  replyingToContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingLabel: {
    fontSize: 11,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyingSender: {
    fontSize: 11,
    color: '#d1d5db',
    fontWeight: '700',
  },
  replyingText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  clearReplyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearReplyIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  expiredContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#ef4444',
  },
  expiredText: {
    fontSize: 14,
    color: '#fca5a5',
    fontWeight: '600',
    textAlign: 'center',
  },
});
