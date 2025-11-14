/**
 * Settings Screen
 *
 * App configuration:
 * - Enable/disable auto-send for voice mode
 * - View usage statistics
 * - Support link
 * - Logout
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
  Switch,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SettingsService } from '../services/settingsService';
import { SecureStorage } from '../storage/secureStorage';
import { AppSettings } from '../types';
import { getNavigationService } from '../services/navigationService';
import { Linking as LinkingModule } from 'react-native';

interface SettingsScreenProps {
  onLogout?: () => void;
  onBack?: () => void;
}

function SettingsScreen(props: SettingsScreenProps): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigationService = getNavigationService();

  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load settings and stats
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);

      const appSettings = await SettingsService.getSettings();
      const used = await SettingsService.getMessagesUsed();
      const percentage = await SettingsService.getUsagePercentage();

      setSettings(appSettings);
      setMessagesUsed(used);
      setUsagePercentage(percentage);
    } catch (error) {
      Alert.alert('Error', `Failed to load settings: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle auto-send
   */
  const handleAutoSendToggle = async (value: boolean) => {
    try {
      await SettingsService.setAutoSend(value);
      setSettings(prev => prev ? { ...prev, auto_send: value } : null);
    } catch (error) {
      Alert.alert('Error', `Failed to update setting: ${error}`);
    }
  };

  /**
   * Open Ko-fi link
   */
  const handleSupportDeveloper = () => {
    const url = 'https://ko-fi.com/voicerelay';
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Support',
        'Visit https://ko-fi.com/voicerelay to support the developer!'
      );
    });
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await SecureStorage.clearAll();
            navigationService.navigate(navigationService.constructor.name);
            if (props.onLogout) {
              props.onLogout();
            }
          } catch (error) {
            Alert.alert('Error', `Failed to logout: ${error}`);
          }
        },
        style: 'destructive',
      },
    ]);
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

  if (isLoading || !settings) {
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
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {/* Voice Mode Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Mode</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Auto-Send</Text>
              <Text style={styles.settingDescription}>
                Automatically send replies after 2 seconds of silence
              </Text>
            </View>
            <Switch
              value={settings.auto_send}
              onValueChange={handleAutoSendToggle}
              trackColor={{ false: '#CCC', true: '#81C784' }}
              thumbColor={settings.auto_send ? '#4CAF50' : '#999'}
            />
          </View>
        </View>

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage</Text>

          <View style={styles.statsBox}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Sent This Month</Text>
              <Text style={styles.statValue}>{messagesUsed}</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Free Tier</Text>
              <Text style={styles.statValue}>
                {messagesUsed} / {settings?.messages_limit || 100}
              </Text>
            </View>
          </View>

          {usagePercentage >= 80 && usagePercentage < 100 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ You're using {usagePercentage}% of your free tier. Upgrade soon!
              </Text>
            </View>
          )}

          {usagePercentage >= 100 && (
            <View style={[styles.warningBox, { borderLeftColor: '#D32F2F', backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.warningText, { color: '#B71C1C' }]}>
                [LIMIT REACHED] Monthly message limit reached. Upgrade to continue!
              </Text>
            </View>
          )}
        </View>

        {/* Server Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Relay URL</Text>
            <Text style={styles.infoValue}>{settings.relay_url}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Timeout</Text>
            <Text style={styles.infoValue}>{settings.relay_timeout_ms}ms</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>VOICE Relay</Text>
            <Text style={styles.aboutValue}>v0.0.1</Text>
          </View>

          <Text style={styles.aboutDescription}>
            The fastest, simplest, and most secure relay for voice conversations.
            {'\n\n'}
            End-to-end encryption (E2EE) keeps your conversations private. All voice
            data is encrypted locally before transmission.
          </Text>
        </View>

        {/* Support Button */}
        <View style={styles.buttonGroup}>
          <Button
            title="❤️ Support Developer (Ko-fi)"
            onPress={handleSupportDeveloper}
            color="#FF6B00"
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Your private key is stored encrypted on your device
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Server never sees unencrypted prompts or replies
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Each reply is encrypted with a unique one-time key
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Voice data is never stored on our servers
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutButton}>
          <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  statsBox: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
  },
  infoItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  aboutValue: {
    fontSize: 15,
    color: '#666',
  },
  aboutDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    minWidth: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  buttonGroup: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    marginBottom: 32,
  },
});

export default SettingsScreen;
