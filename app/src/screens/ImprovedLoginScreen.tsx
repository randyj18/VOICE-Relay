/**
 * Improved Login Screen Component
 *
 * Enhanced authentication screen with:
 * - Real-time token validation
 * - Visual feedback
 * - Collapsible help section
 * - Security notice
 * - Better UX
 *
 * This component can be integrated into App.tsx to replace the existing login UI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { validateGithubToken } from '../utils/validationUtils';

interface ImprovedLoginScreenProps {
  onLogin: (token: string) => Promise<void>;
  isLoading?: boolean;
}

const ImprovedLoginScreen: React.FC<ImprovedLoginScreenProps> = ({
  onLogin,
  isLoading = false,
}) => {
  const [githubToken, setGithubToken] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  const tokenValidation = validateGithubToken(githubToken);

  const handleLogin = () => {
    if (tokenValidation.isValid) {
      onLogin(githubToken);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginIcon}>🎤</Text>
            <Text style={styles.title}>VOICE Relay</Text>
            <Text style={styles.subtitle}>Voice Operated Interface for Context Engines</Text>
          </View>

          <View style={styles.authBox}>
            <Text style={styles.sectionTitle}>GitHub Authentication</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your GitHub token to securely authenticate
            </Text>

            <TextInput
              style={[
                styles.input,
                githubToken && (tokenValidation.isValid ? styles.inputValid : styles.inputInvalid),
              ]}
              placeholder="Bearer github|username|token"
              placeholderTextColor="#999"
              value={githubToken}
              onChangeText={setGithubToken}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Validation feedback */}
            {githubToken.length > 0 && (
              <View style={styles.validationBox}>
                {tokenValidation.isValid ? (
                  <Text style={styles.validationSuccess}>✓ Token format is valid</Text>
                ) : (
                  tokenValidation.error && (
                    <Text style={styles.validationError}>✗ {tokenValidation.error}</Text>
                  )
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton,
                (!tokenValidation.isValid || isLoading) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!tokenValidation.isValid || isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading
                  ? 'Authenticating...'
                  : tokenValidation.isValid
                  ? 'Login Securely'
                  : 'Enter Token to Continue'}
              </Text>
            </TouchableOpacity>

            {/* Help section */}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setShowTokenHelp(!showTokenHelp)}
            >
              <Text style={styles.helpButtonText}>
                {showTokenHelp ? '▼' : '▶'} How do I get a GitHub token?
              </Text>
            </TouchableOpacity>

            {showTokenHelp && (
              <View style={styles.helpBox}>
                <Text style={styles.helpTitle}>Creating your GitHub token:</Text>
                <Text style={styles.helpStep}>1. Go to GitHub.com → Settings</Text>
                <Text style={styles.helpStep}>
                  2. Developer settings → Personal access tokens → Tokens (classic)
                </Text>
                <Text style={styles.helpStep}>3. Generate new token (classic)</Text>
                <Text style={styles.helpStep}>4. Select required scopes</Text>
                <Text style={styles.helpStep}>5. Copy the token</Text>

                <View style={styles.helpNoteBox}>
                  <Text style={styles.helpNoteTitle}>For testing:</Text>
                  <Text style={styles.helpNote}>
                    Use format: Bearer github|testuser123|fake_token
                  </Text>
                </View>
              </View>
            )}

            {/* Security note */}
            <View style={styles.securityBox}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                Your token is stored securely on your device and encryption keys are generated
                locally.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  loginIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  authBox: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputValid: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  inputInvalid: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  validationBox: {
    marginBottom: 12,
  },
  validationSuccess: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  validationError: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpButton: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  helpButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  helpBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helpStep: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  helpNoteBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  helpNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  helpNote: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  securityIcon: {
    fontSize: 20,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default ImprovedLoginScreen;
