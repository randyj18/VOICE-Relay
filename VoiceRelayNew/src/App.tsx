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
import OnboardingScreen from './screens/OnboardingScreen';
import { showSuccess, showError, showInfo, OperationMessages } from './utils/feedbackUtils';
import { formatErrorMessage, classifyError } from './utils/errorUtils';
import { validateGithubToken, validateReply, getCharacterCountStatus } from './utils/validationUtils';

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} hr${diffHr !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Get status badge configuration (emoji, color, label)
 */
function getStatusBadge(status: MessageStatus): { emoji: string; color: string; label: string } {
  switch (status) {
    case MessageStatus.ENCRYPTED:
      return { emoji: '🔒', color: '#FF3B30', label: 'Unread' };
    case MessageStatus.DECRYPTED:
      return { emoji: '📖', color: '#007AFF', label: 'Reading' };
    case MessageStatus.REPLIED:
      return { emoji: '✅', color: '#34C759', label: 'Complete' };
    case MessageStatus.ERROR:
      return { emoji: '⚠️', color: '#FF9500', label: 'Error' };
    default:
      return { emoji: '❓', color: '#8E8E93', label: 'Unknown' };
  }
}

/**
 * Sort messages: unread first, then by timestamp (newest first)
 */
function sortMessages(messages: StoredMessage[]): StoredMessage[] {
  return [...messages].sort((a, b) => {
    // Priority order: encrypted > decrypted > replied/error
    const statusPriority = {
      [MessageStatus.ENCRYPTED]: 0,
      [MessageStatus.DECRYPTED]: 1,
      [MessageStatus.REPLIED]: 2,
      [MessageStatus.ERROR]: 2,
    };

    const aPriority = statusPriority[a.status];
    const bPriority = statusPriority[b.status];

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Within same priority, sort by timestamp (newest first)
    return b.created_at - a.created_at;
  });
}

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
  decryptingMessageId: string | null;
  sendingReply: boolean;
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
    decryptingMessageId: null,
    sendingReply: false,
  });

  const replyInputRef = React.useRef<TextInput>(null);
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
      }));

      // Auto-select and decrypt the new message
      handleSelectMessage(message);
    } catch (error) {
      console.error('[App] Failed to simulate message:', error);
      Alert.alert('Error', `Failed to receive message: ${error}`);
    }
  };

  /**
   * Select a message and auto-decrypt if needed
   * Shows user-friendly errors and success feedback
   */
  const handleSelectMessage = async (message: StoredMessage) => {
    console.log(`[App] Message selected: ${message.id}, status: ${message.status}`);

    // Set as selected immediately
    setState((prev: AppState) => ({
      ...prev,
      selectedMessage: message,
      userReply: '', // Clear any previous reply
    }));

    // Auto-decrypt if encrypted
    if (message.status === MessageStatus.ENCRYPTED) {
      try {
        console.log(`[App] Auto-decrypting message: ${message.id}`);
        setState((prev: AppState) => ({
          ...prev,
          decryptingMessageId: message.id,
          status: OperationMessages.DECRYPT_DECRYPTING,
        }));

        const messageService = getMessageService();
        console.log(`[App] Calling messageService.decryptMessage() for ID: ${message.id}`);
        const workOrder = await messageService.decryptMessage(message.id);
        console.log(`[App] Message decrypted successfully. Topic: ${workOrder.topic}`);

        await loadMessages();

        // Find the updated message and select it
        const updatedMessages = await SecureStorage.loadMessageQueue();
        const updatedMessage = updatedMessages.find(m => m.id === message.id);

        setState((prev: AppState) => ({
          ...prev,
          decryptingMessageId: null,
          selectedMessage: updatedMessage || null,
          status: OperationMessages.DECRYPT_SUCCESS,
        }));

        // Auto-focus reply input after decrypt
        setTimeout(() => {
          replyInputRef.current?.focus();
        }, 100);

        showSuccess(OperationMessages.DECRYPT_SUCCESS);
      } catch (error) {
        console.error(`[App] Failed to decrypt message ${message.id}:`, error);
        const errorMessage = formatErrorMessage(error, { operation: 'decrypt message' });
        const classified = classifyError(error);

        showError('Decryption Failed', errorMessage, {
          showRetryButton: classified.isRetryable,
          onRetry: () => handleSelectMessage(message),
        });

        setState((prev: AppState) => ({
          ...prev,
          decryptingMessageId: null,
          status: `Error: ${classified.userMessage}`,
        }));
      }
    } else if (message.status === MessageStatus.DECRYPTED) {
      // Auto-focus reply input for already decrypted messages
      setTimeout(() => {
        replyInputRef.current?.focus();
      }, 100);
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
        sendingReply: true,
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
        sendingReply: false,
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
        sendingReply: false,
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
        decryptingMessageId: null,
        sendingReply: false,
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Messages</Text>
              {state.messages.filter((m: StoredMessage) => m.status === MessageStatus.ENCRYPTED).length > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {state.messages.filter((m: StoredMessage) => m.status === MessageStatus.ENCRYPTED).length} unread
                  </Text>
                </View>
              )}
            </View>

            {state.messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📭</Text>
                <Text style={styles.emptyStateTitle}>No messages yet</Text>
                <Text style={styles.emptyStateText}>
                  Waiting for messages...{'\n'}
                  Click "Simulate Message" to test the app
                </Text>
              </View>
            ) : (
              <FlatList
                data={sortMessages(state.messages)}
                keyExtractor={(item: StoredMessage) => item.id}
                scrollEnabled={false}
                renderItem={({ item }: { item: StoredMessage }) => {
                  const badge = getStatusBadge(item.status);
                  const isSelected = item.id === state.selectedMessage?.id;
                  const isDecrypting = item.id === state.decryptingMessageId;
                  const promptPreview = item.decrypted_work_order?.prompt
                    ? item.decrypted_work_order.prompt.substring(0, 50) +
                      (item.decrypted_work_order.prompt.length > 50 ? '...' : '')
                    : null;

                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectMessage(item)}
                      style={[
                        styles.messageCard,
                        isSelected && styles.messageCardSelected,
                      ]}
                      disabled={isDecrypting}
                    >
                      <View style={styles.messageCardHeader}>
                        <View style={styles.messageCardTopic}>
                          <Text style={styles.messageTopicText} numberOfLines={1}>
                            {item.topic || 'Untitled'}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
                          <Text style={styles.statusBadgeText}>
                            {badge.emoji} {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.messageCardBody}>
                        <Text style={styles.messageTimestamp}>
                          {formatRelativeTime(item.created_at)}
                        </Text>
                        {promptPreview && (
                          <Text style={styles.messagePreview} numberOfLines={2}>
                            {promptPreview}
                          </Text>
                        )}
                        {isDecrypting && (
                          <View style={styles.decryptingIndicator}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.decryptingText}>Decrypting...</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Selected Message Details */}
          {state.selectedMessage && state.selectedMessage.decrypted_work_order && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reply to Message</Text>

              <View style={styles.promptBox}>
                <Text style={styles.promptLabel}>Topic</Text>
                <Text style={styles.promptTopic}>
                  {state.selectedMessage.decrypted_work_order.topic}
                </Text>

                <Text style={styles.promptLabel}>Prompt</Text>
                <Text style={styles.promptText}>
                  {state.selectedMessage.decrypted_work_order.prompt}
                </Text>
              </View>

              <View style={styles.replyBox}>
                <View style={styles.replyHeader}>
                  <Text style={styles.replyLabel}>Your Reply</Text>
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
                </View>
                <TextInput
                  ref={replyInputRef}
                  style={[
                    styles.replyInput,
                    !validateReply(state.userReply).isValid &&
                      state.userReply.length > 0 &&
                      styles.replyInputError,
                  ]}
                  placeholder="Type your reply here..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={6}
                  value={state.userReply}
                  onChangeText={(text: string) =>
                    setState((prev: AppState) => ({ ...prev, userReply: text }))
                  }
                  textAlignVertical="top"
                />
                {validateReply(state.userReply).error && state.userReply.length > 0 && (
                  <Text style={styles.validationError}>
                    {validateReply(state.userReply).error}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!validateReply(state.userReply).isValid || state.sendingReply) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSubmitReply}
                  disabled={!validateReply(state.userReply).isValid || state.sendingReply}
                >
                  {state.sendingReply ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Reply</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  emptyState: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageCardTopic: {
    flex: 1,
    marginRight: 8,
  },
  messageTopicText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  messageCardBody: {
    marginTop: 4,
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginTop: 4,
  },
  decryptingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  decryptingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  promptBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptTopic: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  replyBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  charCounter: {
    fontSize: 12,
    color: '#666',
  },
  charCounterWarning: {
    color: '#FF9500',
    fontWeight: '600',
  },
  charCounterError: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
  },
  replyInputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  validationError: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
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
