/**
 * Phase 4: VOICE Relay - Multi-Screen App
 *
 * Complete app with navigation between screens:
 * 1. Login Screen - GitHub authentication
 * 2. Home Screen - Topics list with unread counts
 * 3. Message Queue - Messages for specific topic
 * 4. Message Detail - Single message with reply compose
 * 5. Voice Mode - Hands-free voice conversation
 * 6. Settings - Configuration and about
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getAuthService } from './services/authService';
import { getNavigationService, AppScreen } from './services/navigationService';
import { getMessageService, initializeMessageService } from './services/messageService';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import VoiceModeScreen from './screens/VoiceModeScreen';
import MessageQueueScreen from './screens/MessageQueueScreen';
import MessageDetailScreen from './screens/MessageDetailScreen';
import SettingsScreen from './screens/SettingsScreen';

function AppMultiScreen(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [navParams, setNavParams] = useState<Record<string, any>>({});

  const authService = getAuthService();
  const navigationService = getNavigationService();

  /**
   * Initialize app on mount
   */
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Listen to navigation changes
   */
  useEffect(() => {
    const unsubscribe = navigationService.onNavigate((screen, params) => {
      setCurrentScreen(screen);
      setNavParams(params);
    });

    return unsubscribe;
  }, [navigationService]);

  /**
   * Initialize app: check if user is authenticated
   */
  const initializeApp = async () => {
    try {
      const authContext = await authService.restoreSession();

      if (authContext) {
        // User already logged in
        const messageService = initializeMessageService(authService.getApiService());
        setIsAuthenticated(true);
        navigationService.navigate(AppScreen.HOME);
      } else {
        setIsAuthenticated(false);
        navigationService.navigate(AppScreen.LOGIN);
      }
    } catch (error) {
      console.error('Init error:', error);
      setIsAuthenticated(false);
      navigationService.navigate(AppScreen.LOGIN);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Handle login success
   */
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    initializeMessageService(authService.getApiService());
    navigationService.navigate(AppScreen.HOME);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
    navigationService.navigate(AppScreen.LOGIN);
  };

  /**
   * Render current screen based on navigation state
   */
  const renderScreen = () => {
    if (isInitializing) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    switch (currentScreen) {
      case AppScreen.LOGIN:
        return (
          <LoginScreen
            onSuccess={handleLoginSuccess}
          />
        );

      case AppScreen.HOME:
        return (
          <HomeScreen
            onVoiceMode={() => navigationService.navigate(AppScreen.VOICE_MODE)}
            onSettings={() => navigationService.navigate(AppScreen.SETTINGS)}
            onTopicSelect={(topic) =>
              navigationService.navigate(AppScreen.MESSAGE_QUEUE, { topicName: topic })
            }
          />
        );

      case AppScreen.VOICE_MODE:
        return (
          <VoiceModeScreen
            onExit={() => navigationService.navigate(AppScreen.HOME)}
          />
        );

      case AppScreen.MESSAGE_QUEUE:
        return (
          <MessageQueueScreen
            topicName={navParams.topicName || ''}
            onMessageSelect={(msgId) =>
              navigationService.navigate(AppScreen.MESSAGE_DETAIL, { messageId: msgId })
            }
            onBack={() => navigationService.back()}
          />
        );

      case AppScreen.MESSAGE_DETAIL:
        return (
          <MessageDetailScreen
            messageId={navParams.messageId || ''}
            onReplySubmitted={() => navigationService.navigate(AppScreen.HOME)}
            onBack={() => navigationService.back()}
          />
        );

      case AppScreen.SETTINGS:
        return (
          <SettingsScreen
            onLogout={handleLogout}
            onBack={() => navigationService.back()}
          />
        );

      default:
        return (
          <HomeScreen
            onVoiceMode={() => navigationService.navigate(AppScreen.VOICE_MODE)}
            onSettings={() => navigationService.navigate(AppScreen.SETTINGS)}
          />
        );
    }
  };

  return <>{renderScreen()}</>;
}

export default AppMultiScreen;
