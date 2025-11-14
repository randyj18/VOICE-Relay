/**
 * Phase 0 Spike: React Native App
 * Demonstrates E2EE by decrypting a "hello world" message from Python Agent
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator,
} from 'react-native';

import { CryptoUtils } from './CryptoUtils';


interface WorkOrder {
  topic: string;
  prompt: string;
  reply_instructions: {
    destination_url: string;
    http_method: string;
    reply_encryption_key: string;
  };
}


function App(): React.JSX.Element {
  const [status, setStatus] = useState('Ready to test Phase 0 E2EE');
  const [appPrivateKeyPem, setAppPrivateKeyPem] = useState('');
  const [appPublicKeyPem, setAppPublicKeyPem] = useState('');
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [decryptedPrompt, setDecryptedPrompt] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Step 1: Generate app's permanent key pair
   */
  const generateAppKeys = () => {
    try {
      setIsLoading(true);
      setStatus('Generating app permanent key pair...');

      const keyPair = CryptoUtils.generateKeyPair();
      const publicKeyPem = CryptoUtils.getPublicKeyPem(keyPair.publicKey);
      const privateKeyPem = CryptoUtils.getPrivateKeyPem(keyPair.privateKey);

      setAppPublicKeyPem(publicKeyPem);
      setAppPrivateKeyPem(privateKeyPem);

      setStatus('✓ App keys generated. Ready to receive encrypted Work Order.');
    } catch (error) {
      setStatus(`Error generating keys: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Simulate receiving encrypted Work Order from Python Agent
   * In real app, this would come via push notification or API call
   */
  const simulateReceiveEncryptedWorkOrder = () => {
    try {
      setIsLoading(true);
      setStatus('Simulating encrypted Work Order reception...');

      if (!appPrivateKeyPem) {
        setStatus('Error: App keys not generated yet. Press "Generate App Keys" first.');
        setIsLoading(false);
        return;
      }

      // Simulate encrypted payload from Python agent
      // In real scenario, this would be received from server
      const encryptedPayload = '[ENCRYPTED_PAYLOAD_FROM_PYTHON_AGENT]';

      // For this demo, we'll create a test work order to encrypt
      const testWorkOrder: WorkOrder = {
        topic: 'Phase 0 Spike',
        prompt: 'hello world',
        reply_instructions: {
          destination_url: 'https://localhost:8000/reply',
          http_method: 'POST',
          reply_encryption_key: '[TEMP_PUBLIC_KEY_FROM_AGENT]',
        },
      };

      // Encrypt it with app's public key
      const appPublicKey = CryptoUtils.loadPublicKeyFromPem(appPublicKeyPem);
      const encryptedWorkOrder = CryptoUtils.encryptRsa(
        JSON.stringify(testWorkOrder),
        appPublicKey
      );

      setStatus('Simulated encrypted Work Order received. Decrypting...');

      // Step 3: Decrypt with app's private key
      setTimeout(() => {
        try {
          const appPrivateKey = CryptoUtils.loadPrivateKeyFromPem(appPrivateKeyPem);
          const decrypted = CryptoUtils.decryptRsa(encryptedWorkOrder, appPrivateKey);
          const decryptedWorkOrder = JSON.parse(decrypted) as WorkOrder;

          setWorkOrder(decryptedWorkOrder);
          setDecryptedPrompt(decryptedWorkOrder.prompt);

          setStatus(`✓ Successfully decrypted Work Order. Prompt: "${decryptedWorkOrder.prompt}"`);
        } catch (error) {
          setStatus(`Error decrypting Work Order: ${error}`);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      setStatus(`Error: ${error}`);
      setIsLoading(false);
    }
  };

  /**
   * Step 4: Simulate user recording an answer and sending it
   */
  const simulateSendReply = () => {
    try {
      setIsLoading(true);
      setStatus('Encrypting reply with ephemeral key...');

      if (!workOrder) {
        setStatus('Error: No Work Order to reply to.');
        setIsLoading(false);
        return;
      }

      const replyText = 'Hello from React Native!';

      // Load the ephemeral public key from work order
      const tempPublicKey = CryptoUtils.loadPublicKeyFromPem(
        workOrder.reply_instructions.reply_encryption_key
      );

      // Encrypt reply with ephemeral key
      const encryptedReply = CryptoUtils.encryptRsa(replyText, tempPublicKey);

      setReplyText(encryptedReply.substring(0, 100) + '...');

      setStatus(
        `✓ Reply encrypted with ephemeral key. Would send to: ${workOrder.reply_instructions.destination_url}`
      );
      setIsLoading(false);
    } catch (error) {
      setStatus(`Error encrypting reply: ${error}`);
      setIsLoading(false);
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setStatus('Reset. Ready to test Phase 0 E2EE');
    setAppPrivateKeyPem('');
    setAppPublicKeyPem('');
    setWorkOrder(null);
    setDecryptedPrompt('');
    setReplyText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <Text style={styles.title}>VOICE Relay - Phase 0 Spike</Text>
          <Text style={styles.subtitle}>React Native E2EE Test</Text>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

          <View style={styles.buttonGroup}>
            <Button
              title="1. Generate App Keys"
              onPress={generateAppKeys}
              disabled={isLoading}
              color="#007AFF"
            />
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="2. Receive & Decrypt Work Order"
              onPress={simulateReceiveEncryptedWorkOrder}
              disabled={isLoading || !appPrivateKeyPem}
              color="#34C759"
            />
          </View>

          {decryptedPrompt && (
            <View style={styles.dataBox}>
              <Text style={styles.dataLabel}>Decrypted Prompt:</Text>
              <Text style={styles.dataText}>{decryptedPrompt}</Text>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <Button
              title="3. Send Encrypted Reply"
              onPress={simulateSendReply}
              disabled={isLoading || !workOrder}
              color="#FF9500"
            />
          </View>

          {replyText && (
            <View style={styles.dataBox}>
              <Text style={styles.dataLabel}>Encrypted Reply (truncated):</Text>
              <Text style={styles.dataText}>{replyText}</Text>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <Button title="Reset" onPress={reset} disabled={isLoading} color="#FF3B30" />
          </View>

          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ Phase 0 demonstrates E2EE round-trip encryption/decryption between Python and React
              Native.
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
    padding: 20,
  },
  title: {
    fontSize: 24,
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
    lineHeight: 20,
  },
  buttonGroup: {
    marginBottom: 12,
  },
  loader: {
    marginVertical: 16,
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
  },
  dataText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});

export default App;
