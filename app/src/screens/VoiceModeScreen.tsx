/**
 * Voice Mode Screen
 *
 * Hands-free voice interface for VOICE Relay
 * Flow:
 * 1. TTS reads prompt to user
 * 2. STT listens for reply
 * 3. Detects silence (auto-send) or user confirms
 * 4. Encrypts and sends reply
 * 5. Moves to next message or completes
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import KeepAwake from 'react-native-keep-awake';

import { getMessageService } from '../services/messageService';
import { getVoiceService, VoiceEventType, VoiceEvent } from '../services/voiceService';
import { SecureStorage } from '../storage/secureStorage';
import { StoredMessage, AppSettings } from '../types';

interface VoiceModeState {
  isActive: boolean;
  currentMessage: StoredMessage | null;
  currentPrompt: string;
  isListening: boolean;
  isSpeaking: boolean;
  userReply: string;
  status: string;
  isLoading: boolean;
  messageIndex: number;
  totalMessages: number;
  autoSend: boolean;
}

const VOICE_MODE_DEFAULT_STATE: VoiceModeState = {
  isActive: false,
  currentMessage: null,
  currentPrompt: '',
  isListening: false,
  isSpeaking: false,
  userReply: '',
  status: 'Ready',
  isLoading: false,
  messageIndex: 0,
  totalMessages: 0,
  autoSend: false,
};

interface VoiceModeScreenProps {
  onExit?: () => void;
  autoSendEnabled?: boolean;
}

function VoiceModeScreen(props: VoiceModeScreenProps): React.JSX.Element {
  const [state, setState] = useState<VoiceModeState>(VOICE_MODE_DEFAULT_STATE);
  const voiceService = useRef(getVoiceService()).current;
  const messageService = useRef(getMessageService()).current;
  const windowHeight = useWindowDimensions().height;

  // Keep screen awake during voice mode
  useEffect(() => {
    if (state.isActive) {
      KeepAwake.activate();
      return () => {
        KeepAwake.deactivate();
      };
    }
  }, [state.isActive]);

  // Setup voice event listeners
  useEffect(() => {
    const handleVoiceEvent = async (event: VoiceEvent) => {
      console.log('[VoiceMode] Event:', event.type);

      switch (event.type) {
        case VoiceEventType.SPEECH_START:
          setState(prev => ({
            ...prev,
            isListening: true,
            status: 'Listening...',
          }));
          break;

        case VoiceEventType.PARTIAL_RESULTS:
          if (event.data && event.data.length > 0) {
            setState(prev => ({
              ...prev,
              userReply: event.data![0],
              status: 'Hearing you...',
            }));
          }
          break;

        case VoiceEventType.RESULTS:
          if (event.data && event.data.length > 0) {
            setState(prev => ({
              ...prev,
              userReply: event.data![0],
              isListening: false,
              status: 'Got your reply. Processing...',
            }));
          }
          // Auto-send if enabled
          if (state.autoSend && event.data && event.data.length > 0) {
            setTimeout(() => handleSubmitReply(event.data![0]), 500);
          }
          break;

        case VoiceEventType.SPEECH_END:
          setState(prev => ({
            ...prev,
            isListening: false,
          }));
          break;

        case VoiceEventType.ERROR:
          Alert.alert('Voice Recognition Error', event.error || 'Unknown error');
          setState(prev => ({
            ...prev,
            isListening: false,
            status: `Error: ${event.error}`,
          }));
          break;
      }
    };

    voiceService.onVoiceEvent(handleVoiceEvent);

    return () => {
      voiceService.offVoiceEvent(handleVoiceEvent);
    };
  }, [voiceService, state.autoSend]);

  /**
   * Start voice mode
   */
  const startVoiceMode = async () => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        status: 'Loading messages...',
        isActive: true,
      }));

      // Load messages
      const messages = await SecureStorage.loadMessageQueue();
      const decryptedMessages = messages.filter(m => m.decrypted_work_order);

      if (decryptedMessages.length === 0) {
        Alert.alert('No Messages', 'No messages available for voice mode.');
        setState(prev => ({
          ...prev,
          isActive: false,
          isLoading: false,
        }));
        return;
      }

      // Load settings
      const settings = await SecureStorage.loadSettings();

      setState(prev => ({
        ...prev,
        totalMessages: decryptedMessages.length,
        autoSend: settings.auto_send,
        isLoading: false,
      }));

      // Start with first message
      await processMessage(decryptedMessages[0], 0);
    } catch (error) {
      Alert.alert('Error', `Failed to start voice mode: ${error}`);
      setState(prev => ({
        ...prev,
        isActive: false,
        isLoading: false,
      }));
    }
  };

  /**
   * Process a message: decrypt, speak prompt, listen for reply
   */
  const processMessage = async (message: StoredMessage, index: number) => {
    try {
      setState(prev => ({
        ...prev,
        currentMessage: message,
        messageIndex: index,
        userReply: '',
        status: 'Preparing prompt...',
        isLoading: true,
      }));

      const workOrder = message.decrypted_work_order;
      if (!workOrder) {
        throw new Error('Message not decrypted');
      }

      // Speak prompt
      const promptText = `New prompt from ${workOrder.topic}. ${workOrder.prompt}. You can say Retry, Read Back, or give your answer.`;

      setState(prev => ({
        ...prev,
        currentPrompt: workOrder.prompt,
        status: 'Speaking prompt...',
        isSpeaking: true,
      }));

      await voiceService.speak(promptText);

      // Wait a moment, then start listening
      setTimeout(async () => {
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          status: 'Ready to listen...',
        }));

        try {
          await voiceService.playBeep('start');
          await voiceService.startListening();
          setState(prev => ({
            ...prev,
            isLoading: false,
            status: 'Listening for your reply...',
          }));
        } catch (error) {
          Alert.alert('Error', `Failed to start listening: ${error}`);
        }
      }, 500);
    } catch (error) {
      Alert.alert('Error', `Failed to process message: ${error}`);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  /**
   * Submit reply
   */
  const handleSubmitReply = async (reply: string) => {
    try {
      if (!state.currentMessage) {
        Alert.alert('Error', 'No message selected');
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        status: 'Sending reply...',
      }));

      // Stop listening
      await voiceService.stopListening();

      // Encrypt and submit
      await messageService.submitReply(state.currentMessage.id, reply);

      await voiceService.playBeep('end');
      await voiceService.speak('Sent. Moving to next prompt.');

      // Move to next message
      const messages = await SecureStorage.loadMessageQueue();
      const decryptedMessages = messages.filter(m => m.decrypted_work_order);
      const nextIndex = state.messageIndex + 1;

      if (nextIndex < decryptedMessages.length) {
        // Process next message
        setTimeout(() => processMessage(decryptedMessages[nextIndex], nextIndex), 1000);
      } else {
        // No more messages
        await voiceService.speak('No more messages. Voice mode complete.');
        exitVoiceMode();
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send reply: ${error}`);
      setState(prev => ({
        ...prev,
        isLoading: false,
        status: `Error: ${error}`,
      }));
    }
  };

  /**
   * Handle retry
   */
  const handleRetry = async () => {
    try {
      setState(prev => ({
        ...prev,
        userReply: '',
        status: 'Retrying...',
      }));

      await voiceService.stopListening();
      await voiceService.playBeep('start');

      setTimeout(async () => {
        await voiceService.startListening();
        setState(prev => ({
          ...prev,
          status: 'Listening again...',
        }));
      }, 500);
    } catch (error) {
      Alert.alert('Error', `Failed to retry: ${error}`);
    }
  };

  /**
   * Handle read back
   */
  const handleReadBack = async () => {
    try {
      setState(prev => ({
        ...prev,
        status: 'Reading back...',
        isSpeaking: true,
      }));

      const readBackText = `Your answer was: ${state.userReply}. You can say Send, Read Back, or Retry.`;
      await voiceService.speak(readBackText);

      setState(prev => ({
        ...prev,
        isSpeaking: false,
        status: 'Listening for confirmation...',
      }));

      setTimeout(async () => {
        await voiceService.startListening();
      }, 500);
    } catch (error) {
      Alert.alert('Error', `Failed to read back: ${error}`);
    }
  };

  /**
   * Handle skip
   */
  const handleSkip = async () => {
    try {
      await voiceService.stopListening();
      await voiceService.speak('Skipped. Moving to next prompt.');

      const messages = await SecureStorage.loadMessageQueue();
      const decryptedMessages = messages.filter(m => m.decrypted_work_order);
      const nextIndex = state.messageIndex + 1;

      if (nextIndex < decryptedMessages.length) {
        setTimeout(() => processMessage(decryptedMessages[nextIndex], nextIndex), 1000);
      } else {
        exitVoiceMode();
      }
    } catch (error) {
      Alert.alert('Error', `Failed to skip: ${error}`);
    }
  };

  /**
   * Exit voice mode
   */
  const exitVoiceMode = async () => {
    try {
      await voiceService.destroy();
      setState(VOICE_MODE_DEFAULT_STATE);
      if (props.onExit) {
        props.onExit();
      }
    } catch (error) {
      console.error('Error exiting voice mode:', error);
    }
  };

  // Show loading screen
  if (!state.isActive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Voice Mode</Text>
          <Text style={styles.subtitle}>Hands-Free Voice Interface</Text>

          <Button title="Start Voice Mode" onPress={startVoiceMode} color="#007AFF" />

          <Text style={styles.infoText}>
            In Voice Mode:{'\n'}
            • App reads each prompt aloud{'\n'}
            • You speak your reply{'\n'}
            • App detects when you're done{'\n'}
            • Auto-sends or asks for confirmation{'\n'}
            • Screen stays on
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Voice mode active
  return (
    <SafeAreaView style={styles.container}>
      <KeepAwake />
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ maxHeight: windowHeight * 0.7 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Voice Mode Active</Text>
          <Text style={styles.subtitle}>
            Message {state.messageIndex + 1} of {state.totalMessages}
          </Text>

          {/* Status */}
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusText}>{state.status}</Text>
          </View>

          {/* Current Prompt */}
          {state.currentPrompt && (
            <View style={styles.promptBox}>
              <Text style={styles.promptLabel}>Prompt:</Text>
              <Text style={styles.promptText}>{state.currentPrompt}</Text>
            </View>
          )}

          {/* User Reply */}
          {state.userReply && (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>Your Reply:</Text>
              <Text style={styles.replyText}>{state.userReply}</Text>
            </View>
          )}

          {/* Visual Indicators */}
          <View style={styles.indicatorBox}>
            {state.isSpeaking && (
              <View style={styles.indicator}>
                <Text style={styles.indicatorText}>🔊 Speaking</Text>
              </View>
            )}
            {state.isListening && (
              <View style={styles.indicator}>
                <ActivityIndicator size="small" color="#FF6B00" />
                <Text style={styles.indicatorText}>🎤 Listening</Text>
              </View>
            )}
            {state.autoSend && (
              <View style={styles.indicator}>
                <Text style={styles.indicatorText}>⚡ Auto-Send Enabled</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!state.autoSend && state.userReply && !state.isLoading && (
          <>
            <View style={styles.buttonRow}>
              <View style={styles.buttonHalf}>
                <Button
                  title="Send"
                  onPress={() => handleSubmitReply(state.userReply)}
                  color="#34C759"
                />
              </View>
              <View style={styles.buttonHalf}>
                <Button
                  title="Read Back"
                  onPress={handleReadBack}
                  color="#FF9500"
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <View style={styles.buttonHalf}>
                <Button title="Retry" onPress={handleRetry} color="#FF3B30" />
              </View>
              <View style={styles.buttonHalf}>
                <Button title="Skip" onPress={handleSkip} color="#A2845E" />
              </View>
            </View>
          </>
        )}

        {state.isLoading && <ActivityIndicator size="large" color="#007AFF" />}

        <View style={styles.exitButton}>
          <Button
            title="Exit Voice Mode"
            onPress={exitVoiceMode}
            color="#FF3B30"
          />
        </View>
      </View>
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
    padding: 20,
  },
  content: {
    padding: 16,
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
  promptBox: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  replyBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  indicatorBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  indicator: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  exitButton: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default VoiceModeScreen;
