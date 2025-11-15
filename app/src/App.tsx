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
  TouchableOpacity,
} from 'react-native';

import { getAuthService } from './services/authService';
import { getMessageService, initializeMessageService } from './services/messageService';
import { SecureStorage } from './storage/secureStorage';
import { StoredMessage, MessageStatus, WorkOrder } from './types';
import SettingsScreen from './screens/SettingsScreen';
import { showSuccess, showError, showInfo, OperationMessages } from './utils/feedbackUtils';
import { formatErrorMessage, classifyError } from './utils/errorUtils';
import { validateGithubToken, validateReply, getCharacterCountStatus } from './utils/validationUtils';

enum AppScreen {
  HOME = 'home',
  SETTINGS = 'settings',
}

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  githubToken: string;
  messages: StoredMessage[];
  selectedMessage: StoredMessage | null;
  userReply: string;
  status: string;
  currentScreen: AppScreen;
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
    currentScreen: AppScreen.HOME,
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
   * Validates token format and shows user-friendly error messages
   */
  const handleLogin = async () => {
    // Validate token format first
    const tokenValidation = validateGithubToken(state.githubToken);
    if (!tokenValidation.isValid) {
      console.warn('[App] Token validation failed:', tokenValidation.error);
      showError('Invalid Token', tokenValidation.error || 'Please enter a valid GitHub token');
      return;
    }

    try {
      console.log('[App] Login attempt initiated');
      setState((prev: AppState) => ({
        ...prev,
        isLoading: true,
        status: OperationMessages.LOGIN_VALIDATING,
      }));

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
        status: OperationMessages.LOGIN_SUCCESS,
        isLoading: false,
      }));

      showSuccess(OperationMessages.LOGIN_SUCCESS);
    } catch (error) {
      console.error('[App] Login failed:', error);
      const errorMessage = formatErrorMessage(error, { operation: 'login' });
      const classified = classifyError(error);

      showError('Login Failed', errorMessage, {
        showRetryButton: classified.isRetryable,
        onRetry: handleLogin,
      });

      setState((prev: AppState) => ({
        ...prev,
        isLoading: false,
        status: `Error: ${classified.userMessage}`,
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
   * Shows user-friendly errors and success feedback
   */
  const handleDecryptMessage = async () => {
    if (!state.selectedMessage) {
      console.warn('[App] Decrypt attempt with no message selected');
      showError('No Message', 'Please select a message to decrypt');
      return;
    }

    try {
      console.log(`[App] Decrypting message: ${state.selectedMessage.id}`);
      setState((prev: AppState) => ({
        ...prev,
        status: OperationMessages.DECRYPT_DECRYPTING,
        isLoading: true,
      }));

      const messageService = getMessageService();
      console.log(`[App] Calling messageService.decryptMessage() for ID: ${state.selectedMessage.id}`);
      const workOrder = await messageService.decryptMessage(state.selectedMessage.id);
      console.log(`[App] Message decrypted successfully. Topic: ${workOrder.topic}`);

      await loadMessages();

      setState((prev: AppState) => ({
        ...prev,
        status: OperationMessages.DECRYPT_SUCCESS,
        isLoading: false,
      }));

      showSuccess(OperationMessages.DECRYPT_SUCCESS);
    } catch (error) {
      console.error(`[App] Failed to decrypt message ${state.selectedMessage?.id}:`, error);
      const errorMessage = formatErrorMessage(error, { operation: 'decrypt message' });
      const classified = classifyError(error);

      showError('Decryption Failed', errorMessage, {
        showRetryButton: classified.isRetryable,
        onRetry: handleDecryptMessage,
      });

      setState((prev: AppState) => ({
        ...prev,
        status: `Error: ${classified.userMessage}`,
        isLoading: false,
      }));
    }
  };

  /**
   * Submit reply
   * Validates reply content, shows specific loading messages, and provides clear feedback
   */
  const handleSubmitReply = async () => {
    if (!state.selectedMessage) {
      console.warn('[App] Submit reply attempt with no message selected');
      showError('No Message', 'Please select a message to reply to');
      return;
    }

    // Validate reply content
    const replyValidation = validateReply(state.userReply);
    if (!replyValidation.isValid) {
      console.warn('[App] Reply validation failed:', replyValidation.error);
      showError('Invalid Reply', replyValidation.error || 'Please enter a valid reply');
      return;
    }

    try {
      console.log(`[App] Submitting reply for message: ${state.selectedMessage.id}`);
      setState((prev: AppState) => ({
        ...prev,
        status: OperationMessages.ENCRYPT_ENCRYPTING,
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

      // Update status to show sending
      setState((prev: AppState) => ({
        ...prev,
        status: OperationMessages.SEND_SENDING,
      }));

      // Submit reply
      console.log('[App] Sending encrypted reply');
      await messageService.submitReply(state.selectedMessage.id, encryptedReply);
      console.log('[App] Reply submitted successfully');

      await loadMessages();

      setState((prev: AppState) => ({
        ...prev,
        status: OperationMessages.REPLY_SUCCESS,
        userReply: '',
        selectedMessage: null,
        isLoading: false,
      }));

      showSuccess(OperationMessages.REPLY_SUCCESS);
    } catch (error) {
      console.error(`[App] Failed to submit reply:`, error);
      const errorMessage = formatErrorMessage(error, { operation: 'send reply' });
      const classified = classifyError(error);

      showError('Send Failed', errorMessage, {
        showRetryButton: classified.isRetryable,
        onRetry: handleSubmitReply,
      });

      setState((prev: AppState) => ({
        ...prev,
        status: `Error: ${classified.userMessage}`,
        isLoading: false,
      }));
    }
  };

  /**
   * Logout
   * Clears all data and shows success feedback
   */
  const handleLogout = async () => {
    try {
      console.log('[App] Logout initiated');
      setState((prev: AppState) => ({
        ...prev,
        status: 'Logging out...',
        isLoading: true,
      }));

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
        currentScreen: AppScreen.HOME,
      });

      showSuccess('Logged out successfully');
    } catch (error) {
      console.error('[App] Logout failed:', error);
      const errorMessage = formatErrorMessage(error, { operation: 'logout' });

      showError('Logout Failed', errorMessage);

      setState((prev: AppState) => ({
        ...prev,
        status: `Error: ${formatErrorMessage(error)}`,
        isLoading: false,
      }));
    }
  };

  /**
   * Navigate to Settings
   */
  const handleOpenSettings = () => {
    console.log('[App] Opening Settings screen');
    setState((prev: AppState) => ({ ...prev, currentScreen: AppScreen.SETTINGS }));
  };

  /**
   * Navigate back from Settings
   */
  const handleCloseSettings = () => {
    console.log('[App] Closing Settings screen');
    setState((prev: AppState) => ({ ...prev, currentScreen: AppScreen.HOME }));
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

  // Show Settings screen if requested
  if (state.isAuthenticated && state.currentScreen === AppScreen.SETTINGS) {
    return (
      <SettingsScreen
        onLogout={handleLogout}
        onBack={handleCloseSettings}
      />
    );
  }

  // Authenticated view (Home screen)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Settings button */}
      <View style={styles.header}>
        <Text style={styles.title}>VOICE Relay</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleOpenSettings}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
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
                    style={[
                      styles.replyInput,
                      !validateReply(state.userReply).isValid &&
                        state.userReply.length > 0 &&
                        styles.replyInputError,
                    ]}
                    placeholder="Type your reply here..."
                    multiline
                    numberOfLines={4}
                    value={state.userReply}
                    onChangeText={(text: string) =>
                      setState((prev: AppState) => ({ ...prev, userReply: text }))
                    }
                  />

                  {/* Character counter */}
                  <View style={styles.charCounterContainer}>
                    <Text
                      style={[
                        styles.charCounter,
                        getCharacterCountStatus(state.userReply.length).status === 'error' &&
                          styles.charCounterError,
                        getCharacterCountStatus(state.userReply.length).status === 'warning' &&
                          styles.charCounterWarning,
                      ]}
                    >
                      {getCharacterCountStatus(state.userReply.length).count}
                    </Text>
                    {validateReply(state.userReply).error &&
                      state.userReply.length > 0 && (
                        <Text style={styles.validationError}>
                          {validateReply(state.userReply).error}
                        </Text>
                      )}
                  </View>

                  <Button
                    title="Submit Reply"
                    onPress={handleSubmitReply}
                    disabled={
                      state.isLoading ||
                      !validateReply(state.userReply).isValid
                    }
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  settingsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyInputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  charCounterContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  charCounterWarning: {
    color: '#FF9500',
    fontWeight: '600',
  },
  charCounterError: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  validationError: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
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
