/**
 * Onboarding Screen
 *
 * Simple 3-step wizard for first-time users:
 * 1. Welcome & explanation
 * 2. GitHub authentication setup
 * 3. Security confirmation
 *
 * Only shown once on first app launch
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to VOICE Relay',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.emoji}>🎤</Text>
          <Text style={styles.stepTitle}>Voice Operated Interface for Context Engines</Text>
          <Text style={styles.stepDescription}>
            VOICE Relay is the fastest, simplest, and most secure way to connect your voice to AI conversations.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✓ End-to-end encrypted messages</Text>
            <Text style={styles.feature}>✓ Hands-free voice mode</Text>
            <Text style={styles.feature}>✓ Zero-knowledge cloud relay</Text>
            <Text style={styles.feature}>✓ Simple GitHub authentication</Text>
          </View>
        </View>
      ),
    },
    {
      title: 'GitHub Authentication',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.stepTitle}>Secure Authentication</Text>
          <Text style={styles.stepDescription}>
            VOICE Relay uses GitHub for authentication. You'll need a GitHub personal access token.
          </Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>How to get your token:</Text>
            <Text style={styles.instruction}>1. Go to GitHub.com → Settings</Text>
            <Text style={styles.instruction}>2. Developer settings → Personal access tokens</Text>
            <Text style={styles.instruction}>3. Generate new token (classic)</Text>
            <Text style={styles.instruction}>4. Copy the token</Text>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Note: For testing, use format:{'\n'}
              Bearer github|username|token
            </Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Security & Keys',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.emoji}>🔒</Text>
          <Text style={styles.stepTitle}>Your Security Keys</Text>
          <Text style={styles.stepDescription}>
            When you log in, VOICE Relay automatically generates encryption keys on your device.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✓ Keys never leave your device</Text>
            <Text style={styles.feature}>✓ Messages encrypted end-to-end</Text>
            <Text style={styles.feature}>✓ Zero-knowledge architecture</Text>
            <Text style={styles.feature}>✓ No cloud storage of private keys</Text>
          </View>
          <Text style={styles.readyText}>You're ready to start!</Text>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>

        <View style={styles.stepContainer}>
          <Text style={styles.stepNumber}>Step {currentStep + 1} of {steps.length}</Text>
          <Text style={styles.title}>{steps[currentStep].title}</Text>
          {steps[currentStep].content}
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleBack}
            >
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, currentStep === 0 && styles.buttonFull]}
            onPress={handleNext}
          >
            <Text style={styles.buttonPrimaryText}>
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>

        {currentStep === 0 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip tutorial</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#007AFF',
  },
  progressDotComplete: {
    backgroundColor: '#34C759',
  },
  stepContainer: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  stepContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureList: {
    width: '100%',
    paddingHorizontal: 32,
  },
  feature: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  instructionBox: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteBox: {
    width: '100%',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  noteText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonSecondaryText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    color: '#999',
    fontSize: 15,
  },
});

export default OnboardingScreen;
