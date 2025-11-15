/**
 * Message Queue Screen
 *
 * Shows all messages for a specific topic
 * User can tap a message to view details
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
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { SecureStorage } from '../storage/secureStorage';
import { StoredMessage, MessageStatus } from '../types';
import { getNavigationService, AppScreen } from '../services/navigationService';

interface MessageQueueScreenProps {
  topicName: string;
  onMessageSelect?: (messageId: string) => void;
  onBack?: () => void;
}

function MessageQueueScreen(props: MessageQueueScreenProps): React.JSX.Element {
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigationService = getNavigationService();

  useEffect(() => {
    loadMessages();
  }, []);

  /**
   * Load messages for topic
   */
  const loadMessages = async () => {
    try {
      setIsLoading(true);

      const allMessages = await SecureStorage.loadMessageQueue();
      const filtered = allMessages.filter(msg => msg.topic === props.topicName);

      setMessages(filtered);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case MessageStatus.ENCRYPTED:
        return '#2196F3'; // Blue
      case MessageStatus.DECRYPTED:
        return '#FF9500'; // Orange
      case MessageStatus.REPLIED:
        return '#4CAF50'; // Green
      case MessageStatus.ERROR:
        return '#F44336'; // Red
      default:
        return '#999';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case MessageStatus.ENCRYPTED:
        return '🔐 Encrypted';
      case MessageStatus.DECRYPTED:
        return '📖 Decrypted';
      case MessageStatus.REPLIED:
        return '✓ Sent';
      case MessageStatus.ERROR:
        return '❌ Error';
      default:
        return status;
    }
  };

  /**
   * Handle message select
   */
  const handleMessagePress = (messageId: string) => {
    navigationService.navigate(AppScreen.MESSAGE_DETAIL, { messageId });
    if (props.onMessageSelect) {
      props.onMessageSelect(messageId);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Button title="← Back" onPress={handleBack} color="#007AFF" />
        <Text style={styles.title}>{props.topicName}</Text>
        <Text style={styles.subtitle}>
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {messages.length > 0 ? (
          <View style={styles.messagesList}>
            <FlatList
              data={messages}
              keyExtractor={(item: StoredMessage) => item.id}
              scrollEnabled={false}
              renderItem={({ item, index }: { item: StoredMessage; index: number }) => (
                <TouchableOpacity
                  style={styles.messageItem}
                  onPress={() => handleMessagePress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageNumber}>{index + 1}.</Text>
                    <Text style={styles.messagePreview} numberOfLines={1}>
                      {item.decrypted_work_order?.prompt ||
                        'Encrypted message...'}
                    </Text>
                  </View>

                  <View style={styles.messageFooter}>
                    <Text style={styles.messageTime}>
                      {new Date(item.created_at).toLocaleTimeString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status as string) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusLabel(item.status as string)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptyText}>
              No messages found for this topic.
            </Text>
          </View>
        )}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 20,
  },
  messagePreview: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default MessageQueueScreen;
