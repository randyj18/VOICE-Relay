/**
 * Home Screen
 *
 * Main screen showing:
 * - Topics list with unread counts
 * - Start Voice Mode button
 * - Settings button
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
  Alert,
} from 'react-native';

import { SecureStorage } from '../storage/secureStorage';
import { StoredMessage } from '../types';
import { getNavigationService, AppScreen } from '../services/navigationService';

interface Topic {
  name: string;
  unreadCount: number;
  totalCount: number;
}

interface HomeScreenProps {
  onVoiceMode?: () => void;
  onSettings?: () => void;
  onTopicSelect?: (topicName: string) => void;
}

function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const navigationService = getNavigationService();

  useEffect(() => {
    loadTopics();
  }, []);

  /**
   * Load topics from message queue
   */
  const loadTopics = async () => {
    try {
      setIsLoading(true);

      const messages = await SecureStorage.loadMessageQueue();
      setTotalMessages(messages.length);

      // Group messages by topic
      const topicMap = new Map<string, { decrypted: number; total: number }>();

      messages.forEach(msg => {
        const topic = msg.topic || 'Unknown';
        const count = topicMap.get(topic) || { decrypted: 0, total: 0 };

        count.total += 1;
        if (msg.decrypted_work_order) {
          count.decrypted += 1;
        }

        topicMap.set(topic, count);
      });

      // Convert to topics array
      const topicsList = Array.from(topicMap.entries()).map(([name, counts]) => ({
        name,
        unreadCount: counts.total - counts.decrypted,
        totalCount: counts.total,
      }));

      // Sort by unread count (descending)
      topicsList.sort((a, b) => b.unreadCount - a.unreadCount);

      setTopics(topicsList);
    } catch (error) {
      Alert.alert('Error', `Failed to load topics: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start voice mode
   */
  const handleVoiceMode = () => {
    if (totalMessages === 0) {
      Alert.alert('No Messages', 'No messages available for voice mode.');
      return;
    }

    navigationService.navigate(AppScreen.VOICE_MODE);
    if (props.onVoiceMode) {
      props.onVoiceMode();
    }
  };

  /**
   * Open settings
   */
  const handleSettings = () => {
    navigationService.navigate(AppScreen.SETTINGS);
    if (props.onSettings) {
      props.onSettings();
    }
  };

  /**
   * Open topic queue
   */
  const handleTopicPress = (topicName: string) => {
    navigationService.navigate(AppScreen.MESSAGE_QUEUE, { topicName });
    if (props.onTopicSelect) {
      props.onTopicSelect(topicName);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>VOICE Relay</Text>
          <Text style={styles.subtitle}>
            {totalMessages > 0
              ? `${totalMessages} message${totalMessages !== 1 ? 's' : ''}`
              : 'No messages'}
          </Text>
        </View>

        {/* Voice Mode Button */}
        <View style={styles.voiceModeButton}>
          <Button
            title="🎤 Start Voice Mode"
            onPress={handleVoiceMode}
            color="#FF6B00"
            disabled={totalMessages === 0}
          />
        </View>

        {/* Topics List */}
        {topics.length > 0 ? (
          <View style={styles.topicsSection}>
            <Text style={styles.sectionTitle}>Topics ({topics.length})</Text>
            <FlatList
              data={topics}
              keyExtractor={(item: Topic, index: number) => `${item.name}-${index}`}
              scrollEnabled={false}
              renderItem={({ item }: { item: Topic }) => (
                <TouchableOpacity
                  style={styles.topicItem}
                  onPress={() => handleTopicPress(item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicContent}>
                    <Text style={styles.topicName}>{item.name}</Text>
                    <Text style={styles.topicCount}>
                      {item.totalCount} message{item.totalCount !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptyText}>
              You don't have any messages yet. Check back soon!
            </Text>
          </View>
        )}

        {/* Settings Button */}
        <View style={styles.settingsButton}>
          <Button title="⚙️ Settings" onPress={handleSettings} color="#666" />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            1. Topics organize your messages{'\n'}
            2. Each topic shows unread count{'\n'}
            3. Tap a topic to see the queue{'\n'}
            4. Use Voice Mode for hands-free
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  voiceModeButton: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF8F3',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  topicsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  topicCount: {
    fontSize: 12,
    color: '#999',
  },
  badge: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  settingsButton: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
});

export default HomeScreen;
