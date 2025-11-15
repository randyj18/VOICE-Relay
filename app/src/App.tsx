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
    console.log('[App] Mounting app component');
    initializeApp();
  }, []);

  /**
   * Initialize app: restore session if exists
   */
  const initializeApp = async () => {
    try {
      console.log('[App] Initializing app...');
      setState((prev: AppState) => ({ ...prev, status: 'Restoring session...' }));

      console.log('[App] Attempting to restore session from storage');
      const authContext = await authService.restoreSession();

      if (authContext) {
        console.log('[App] Session restored successfully, user authenticated');
        // User already logged in
        const messageService = initializeMessageService(authService.getApiService());
        console.log('[App] Message service initialized');
        await loadMessages();

        setState((prev: AppState) => ({
          ...prev,
          isAuthenticated: true,
          status: 'Ready',
          isLoading: false,
        }));
      } else {
        console.log('[App] No session found, user needs to authenticate');
        setState((prev: AppState) => ({
          ...prev,
          isAuthenticated: false,
          status: 'Please authenticate',
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      setState((prev: AppState) => ({
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
      console.warn('[App] Login attempt with empty token');
      Alert.alert('Error', 'Please enter a GitHub token');
      return;
    }

    try {
      console.log('[App] Login attempt initiated');
      setState((prev: AppState) => ({ ...prev, isLoading: true, status: 'Logging in...' }));

      console.log('[App] Calling authService.login()');
      await authService.login({
        githubToken: state.githubToken,
      });

      console.log('[App] Login successful, initializing message service');
      const messageService = initializeMessageService(authService.getApiService());
      console.log('[App] Message service initialized after login');

      setState((prev: AppState) => ({
        ...prev,
        isAuthenticated: true,
        githubToken: '',
        status: 'Authenticated',
        isLoading: false,
      }));
    } catch (error) {
      console.error('[App] Login failed:', error);
      Alert.alert('Login Failed', `${error}`);
      setState((prev: AppState) => ({
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
      console.log('[App] Loading messages from storage');
      const messageService = getMessageService();
      const messages = await SecureStorage.loadMessageQueue();
      console.log(`[App] Loaded ${messages.length} messages from queue`);
      setState((prev: AppState) => ({ ...prev, messages }));
    } catch (error) {
      console.error('[App] Failed to load messages:', error);
    }
  };

  /**
   * Simulate receiving a message (in real app: via push notification)
   */
  const handleSimulateMessage = async () => {
    try {
      console.log('[App] Simulating message reception');
      setState((prev: AppState) => ({ ...prev, status: 'Simulating message reception...' }));

      // Create a fake encrypted message for testing
      const fakeEncryptedMessage = 'x'.repeat(500);
      console.log('[App] Created fake encrypted message payload');

      const messageService = getMessageService();
      const message = await messageService.receiveEncryptedMessage(fakeEncryptedMessage);
      console.log(`[App] Message received with ID: ${message.id}`);

      await loadMessages();

      setState((prev: AppState) => ({
        ...prev,
        status: `Message received: ${message.id}`,
        selectedMessage: message,
      }));
    } catch (error) {
      console.error('[App] Failed to simulate message:', error);
      Alert.alert('Error', `Failed to receive message: ${error}`);
    }
  };

  /**
   * Decrypt selected message
   */
  const handleDecryptMessage = async () => {
    if (!state.selectedMessage) {
      console.warn('[App] Decrypt attempt with no message selected');
      Alert.alert('Error', 'No message selected');
      return;
    }

    try {
      console.log(`[App] Decrypting message: ${state.selectedMessage.id}`);
      setState((prev: AppState) => ({
        ...prev,
        status: `Decrypting message ${state.selectedMessage?.id}...`,
        isLoading: true,
      }));

      const messageService = getMessageService();
      console.log(`[App] Calling messageService.decryptMessage() for ID: ${state.selectedMessage.id}`);
      const workOrder = await messageService.decryptMessage(state.selectedMessage.id);
      console.log(`[App] Message decrypted successfully. Topic: ${workOrder.topic}`);

      await loadMessages();

      Alert.alert('Success', `Decrypted: ${workOrder.prompt}`);

      setState((prev: AppState) => ({
        ...prev,
        status: `Decrypted: "${workOrder.prompt}"`,
        isLoading: false,
      }));
    } catch (error) {
      console.error(`[App] Failed to decrypt message ${state.selectedMessage?.id}:`, error);
      Alert.alert('Error', `Failed to decrypt: ${error}`);
      setState((prev: AppState) => ({
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
      console.warn('[App] Submit reply attempt with no message selected');
      Alert.alert('Error', 'No message selected');
      return;
    }

    if (!state.userReply.trim()) {
      console.warn('[App] Submit reply attempt with empty reply');
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      console.log(`[App] Submitting reply for message: ${state.selectedMessage.id}`);
      setState((prev: AppState) => ({
        ...prev,
        status: 'Encrypting and sending reply...',
        isLoading: true,
      }));

      const messageService = getMessageService();

      // Prepare (encrypt) reply
      console.log('[App] Encrypting reply');
      const encryptedReply = await messageService.prepareReply(
        state.selectedMessage.id,
        state.userReply
      );
      console.log('[App] Reply encrypted successfully');

      // Submit reply
      console.log('[App] Sending encrypted reply');
      await messageService.submitReply(state.selectedMessage.id, encryptedReply);
      console.log('[App] Reply submitted successfully');

      await loadMessages();

      Alert.alert('Success', 'Reply sent!');

      setState((prev: AppState) => ({
        ...prev,
        status: 'Reply sent',
        userReply: '',
        selectedMessage: null,
        isLoading: false,
      }));
    } catch (error) {
      console.error(`[App] Failed to submit reply:`, error);
      Alert.alert('Error', `Failed to send reply: ${error}`);
      setState((prev: AppState) => ({
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
      console.log('[App] Logout initiated');
      await authService.logout();
      console.log('[App] User logged out successfully, clearing state');
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
      console.error('[App] Logout failed:', error);
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
                onChangeText={(text: string) =>
                  setState((prev: AppState) => ({ ...prev, githubToken: text }))
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
                keyExtractor={(item: StoredMessage) => item.id}
                scrollEnabled={false}
                renderItem={({ item }: { item: StoredMessage }) => (
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
                        setState((prev: AppState) => ({ ...prev, selectedMessage: item }))
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
                    onChangeText={(text: string) =>
                      setState((prev: AppState) => ({ ...prev, userReply: text }))
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
