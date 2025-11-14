/**
 * Phase 2: VOICE Relay - React Native App
 *
 * Core functionality:
 * 1. Authentication with GitHub
 * 2. Key generation and storage
 * 3. Receive encrypted work orders (via push notification)
 * 4. Decrypt and display prompts
 * 5. Send encrypted replies
 * 6. Local message queue management
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
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getAuthService } from './services/authService';
import { getMessageService, initializeMessageService } from './services/messageService';
import { SecureStorage } from './storage/secureStorage';
import { StoredMessage, MessageStatus, WorkOrder } from './types';

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  githubToken: string;
  messages: StoredMessage[];
  selectedMessage: StoredMessage | null;
  userReply: string;
  status: string;
}

function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    isAuthenticated: false,
    githubToken: '',
    messages: [],
    selectedMessage: null,
    userReply: '',
    status: 'Initializing...',
  });

  const authService = getAuthService();

  /**
   * Initialize app on mount
   */
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize app: restore session if exists
   */
  const initializeApp = async () => {
    try {
      setState(prev => ({ ...prev, status: 'Restoring session...' }));

      const authContext = await authService.restoreSession();

      if (authContext) {
        // User already logged in
        const messageService = initializeMessageService(authService.getApiService());
        await loadMessages();

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          status: 'Ready',
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          status: 'Please authenticate',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: `Error: ${error}`,
        isLoading: false,
      }));
    }
  };

  /**
   * Handle login with GitHub token
   */
  const handleLogin = async () => {
    if (!state.githubToken.trim()) {
      Alert.alert('Error', 'Please enter a GitHub token');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, status: 'Logging in...' }));

      await authService.login({
        githubToken: state.githubToken,
      });

      const messageService = initializeMessageService(authService.getApiService());

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        githubToken: '',
        status: 'Authenticated',
        isLoading: false,
      }));
    } catch (error) {
      Alert.alert('Login Failed', `${error}`);
      setState(prev => ({
        ...prev,
        isLoading: false,
        status: `Login failed: ${error}`,
      }));
    }
  };

  /**
   * Load messages from storage
   */
  const loadMessages = async () => {
    try {
      const messageService = getMessageService();
      const messages = await SecureStorage.loadMessageQueue();
      setState(prev => ({ ...prev, messages }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  /**
   * Simulate receiving a message (in real app: via push notification)
   */
  const handleSimulateMessage = async () => {
    try {
      setState(prev => ({ ...prev, status: 'Simulating message reception...' }));

      // Create a fake encrypted message for testing
      const fakeEncryptedMessage = 'x'.repeat(500);

      const messageService = getMessageService();
      const message = await messageService.receiveEncryptedMessage(fakeEncryptedMessage);

      await loadMessages();

      setState(prev => ({
        ...prev,
        status: `Message received: ${message.id}`,
        selectedMessage: message,
      }));
    } catch (error) {
      Alert.alert('Error', `Failed to receive message: ${error}`);
    }
  };

  /**
   * Decrypt selected message
   */
  const handleDecryptMessage = async () => {
    if (!state.selectedMessage) {
      Alert.alert('Error', 'No message selected');
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        status: `Decrypting message ${state.selectedMessage?.id}...`,
        isLoading: true,
      }));

      const messageService = getMessageService();
      const workOrder = await messageService.decryptMessage(state.selectedMessage.id);

      await loadMessages();

      Alert.alert('Success', `Decrypted: ${workOrder.prompt}`);

      setState(prev => ({
        ...prev,
        status: `Decrypted: "${workOrder.prompt}"`,
        isLoading: false,
      }));
    } catch (error) {
      Alert.alert('Error', `Failed to decrypt: ${error}`);
      setState(prev => ({
        ...prev,
        status: `Error: ${error}`,
        isLoading: false,
      }));
    }
  };

  /**
   * Submit reply
   */
  const handleSubmitReply = async () => {
    if (!state.selectedMessage) {
      Alert.alert('Error', 'No message selected');
      return;
    }

    if (!state.userReply.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        status: 'Encrypting and sending reply...',
        isLoading: true,
      }));

      const messageService = getMessageService();

      // Prepare (encrypt) reply
      const encryptedReply = await messageService.prepareReply(
        state.selectedMessage.id,
        state.userReply
      );

      // Submit reply
      await messageService.submitReply(state.selectedMessage.id, encryptedReply);

      await loadMessages();

      Alert.alert('Success', 'Reply sent!');

      setState(prev => ({
        ...prev,
        status: 'Reply sent',
        userReply: '',
        selectedMessage: null,
        isLoading: false,
      }));
    } catch (error) {
      Alert.alert('Error', `Failed to send reply: ${error}`);
      setState(prev => ({
        ...prev,
        status: `Error: ${error}`,
        isLoading: false,
      }));
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
      setState({
        isLoading: false,
        isAuthenticated: false,
        githubToken: '',
        messages: [],
        selectedMessage: null,
        userReply: '',
        status: 'Logged out',
      });
    } catch (error) {
      Alert.alert('Error', `Logout failed: ${error}`);
    }
  };

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>{state.status}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View style={styles.content}>
            <Text style={styles.title}>VOICE Relay</Text>
            <Text style={styles.subtitle}>Phase 2: Core App</Text>

            <View style={styles.authBox}>
              <Text style={styles.sectionTitle}>GitHub Authentication</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter GitHub token"
                placeholderTextColor="#999"
                secureTextEntry
                value={state.githubToken}
                onChangeText={text =>
                  setState(prev => ({ ...prev, githubToken: text }))
                }
              />

              <Button
                title="Login"
                onPress={handleLogin}
                color="#007AFF"
              />

              <Text style={styles.infoText}>
                For Phase 2 testing, use format:
                {'\n'}
                Bearer github|testuser123|fake_token
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <Text style={styles.title}>VOICE Relay</Text>
          <Text style={styles.subtitle}>Phase 2: Core App - Authenticated</Text>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusText}>{state.status}</Text>
          </View>

          {/* Messages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messages ({state.messages.length})</Text>

            {state.messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages. Click "Simulate Message" to test.</Text>
            ) : (
              <FlatList
                data={state.messages}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.messageItem,
                      item.id === state.selectedMessage?.id && styles.messageItemSelected,
                    ]}
                  >
                    <Text style={styles.messageId}>{item.id.substring(0, 20)}...</Text>
                    <Text style={styles.messageStatus}>{item.status}</Text>
                    <Button
                      title="Select"
                      onPress={() =>
                        setState(prev => ({ ...prev, selectedMessage: item }))
                      }
                      color="#34C759"
                    />
                  </View>
                )}
              />
            )}
          </View>

          {/* Selected Message Details */}
          {state.selectedMessage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Message</Text>

              {state.selectedMessage.decrypted_work_order ? (
                <View style={styles.dataBox}>
                  <Text style={styles.dataLabel}>Topic:</Text>
                  <Text style={styles.dataText}>
                    {state.selectedMessage.decrypted_work_order.topic}
                  </Text>

                  <Text style={styles.dataLabel}>Prompt:</Text>
                  <Text style={styles.dataText}>
                    {state.selectedMessage.decrypted_work_order.prompt}
                  </Text>

                  <Text style={styles.dataLabel}>Your Reply:</Text>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Type your reply here..."
                    multiline
                    numberOfLines={4}
                    value={state.userReply}
                    onChangeText={text =>
                      setState(prev => ({ ...prev, userReply: text }))
                    }
                  />

                  <Button
                    title="Submit Reply"
                    onPress={handleSubmitReply}
                    disabled={state.isLoading}
                    color="#FF9500"
                  />
                </View>
              ) : (
                <View style={styles.dataBox}>
                  <Text style={styles.dataLabel}>Message ID:</Text>
                  <Text style={styles.dataText}>{state.selectedMessage.id}</Text>

                  <Text style={styles.dataLabel}>Status:</Text>
                  <Text style={styles.dataText}>{state.selectedMessage.status}</Text>

                  <Button
                    title="Decrypt"
                    onPress={handleDecryptMessage}
                    disabled={
                      state.isLoading ||
                      state.selectedMessage.status !== MessageStatus.ENCRYPTED
                    }
                    color="#34C759"
                  />
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.buttonGroup}>
            <Button
              title="Simulate Message"
              onPress={handleSimulateMessage}
              disabled={state.isLoading}
              color="#007AFF"
            />
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="Logout"
              onPress={handleLogout}
              color="#FF3B30"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Phase 2 demonstrates:{'\n'}
              ✓ GitHub authentication{'\n'}
              ✓ Key generation and storage{'\n'}
              ✓ Message decryption{'\n'}
              ✓ Reply encryption and submission
            </Text>
          </View>
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
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  authBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  messageItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  messageId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 4,
  },
  messageStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  dataBox: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
    marginBottom: 4,
    marginTop: 8,
  },
  dataText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  buttonGroup: {
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
});

export default App;
