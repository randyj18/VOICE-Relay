/**
 * Message Detail Screen
 *
 * Shows a single message:
 * - Decrypt and display prompt
 * - Allow user to compose reply
 * - Send encrypted reply
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getMessageService } from '../services/messageService';
import { SecureStorage } from '../storage/secureStorage';
import { SettingsService } from '../services/settingsService';
import { StoredMessage, MessageStatus } from '../types';
import { getNavigationService } from '../services/navigationService';

interface MessageDetailScreenProps {
  messageId: string;
  onReplySubmitted?: () => void;
  onBack?: () => void;
}

function MessageDetailScreen(props: MessageDetailScreenProps): React.JSX.Element {
  const [message, setMessage] = useState<StoredMessage | null>(null);
  const [userReply, setUserReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const messageService = getMessageService();
  const navigationService = getNavigationService();

  useEffect(() => {
    loadMessage();
  }, []);

  /**
   * Load and potentially decrypt message
   */
  const loadMessage = async () => {
    try {
      setIsDecrypting(true);

      const messages = await SecureStorage.loadMessageQueue();
      const msg = messages.find(m => m.id === props.messageId);

      if (!msg) {
        Alert.alert('Error', 'Message not found');
        handleBack();
        return;
      }

      // If encrypted, decrypt it
      if (msg.status === MessageStatus.ENCRYPTED) {
        try {
          const workOrder = await messageService.decryptMessage(msg.id);
          msg.decrypted_work_order = workOrder;
          msg.status = MessageStatus.DECRYPTED;
        } catch (error) {
          Alert.alert('Decryption Error', `Failed to decrypt: ${error}`);
        }
      }

      setMessage(msg);
    } catch (error) {
      Alert.alert('Error', `Failed to load message: ${error}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  /**
   * Submit reply
   */
  const handleSubmitReply = async () => {
    if (!message || !userReply.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      setIsLoading(true);

      // Check if limit has been exceeded
      const limitExceeded = await SettingsService.isLimitExceeded();
      if (limitExceeded) {
        Alert.alert(
          'Free Tier Limit Reached',
          'You have reached your monthly message limit (100 prompts). Upgrade to continue!',
          [
            {
              text: 'Upgrade on Ko-fi',
              onPress: () => {
                // Would open Ko-fi link in production
                Alert.alert('Support', 'Visit https://ko-fi.com/voicerelay to upgrade!');
              },
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'cancel',
            },
          ]
        );
        setIsLoading(false);
        return;
      }

      await messageService.submitReply(message.id, userReply);

      Alert.alert('Success', 'Reply sent!', [
        {
          text: 'OK',
          onPress: () => {
            if (props.onReplySubmitted) {
              props.onReplySubmitted();
            }
            handleBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', `Failed to send reply: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle back
   */
  const handleBack = () => {
    navigationService.back();
    if (props.onBack) {
      props.onBack();
    }
  };

  if (isDecrypting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Decrypting message...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!message) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Message not found</Text>
          <Button title="Back" onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const workOrder = message.decrypted_work_order;
  const isReplied = message.status === MessageStatus.REPLIED;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Button title="← Back" onPress={handleBack} color="#007AFF" />
        <Text style={styles.title}>{message.topic}</Text>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {/* Message Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text
            style={[
              styles.statusBadge,
              message.status === MessageStatus.REPLIED
                ? styles.statusReplied
                : styles.statusPending,
            ]}
          >
            {message.status === MessageStatus.REPLIED ? '✓ Sent' : '📖 Pending Reply'}
          </Text>

          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue}>
            {new Date(message.created_at).toLocaleString()}
          </Text>
        </View>

        {/* Prompt */}
        {workOrder && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>Prompt</Text>
            <Text style={styles.promptText}>{workOrder.prompt}</Text>
          </View>
        )}

        {/* Reply Section */}
        {!isReplied && (
          <View style={styles.replySection}>
            <Text style={styles.replyLabel}>Your Reply</Text>

            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply here..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={userReply}
              onChangeText={setUserReply}
              editable={!isLoading}
            />

            <Button
              title={isLoading ? 'Sending...' : 'Send Reply'}
              onPress={handleSubmitReply}
              disabled={isLoading || !userReply.trim()}
              color="#34C759"
            />
          </View>
        )}

        {/* Reply Submitted Info */}
        {isReplied && (
          <View style={styles.successSection}>
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={styles.successTitle}>Reply Sent</Text>
            <Text style={styles.successText}>
              Your encrypted reply has been sent to the agent.
            </Text>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securitySection}>
          <Text style={styles.securityTitle}>🔒 End-to-End Encrypted</Text>
          <Text style={styles.securityText}>
            Your reply is encrypted with a unique one-time key before being sent. Only
            the agent can decrypt it.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  infoSection: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  statusReplied: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
  },
  statusPending: {
    backgroundColor: '#FF9500',
    color: '#FFF',
  },
  promptSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  replySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    minHeight: 120,
    backgroundColor: '#FFF',
  },
  successSection: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 18,
  },
  securitySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 16,
  },
});

export default MessageDetailScreen;
