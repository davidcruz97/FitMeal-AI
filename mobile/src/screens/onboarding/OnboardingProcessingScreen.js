// mobile/src/screens/onboarding/OnboardingProcessingScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';

const PROCESSING_PHRASES = [
  'Calculating your BMR...',
  'Computing your TDEE...',
  'Optimizing your calorie targets...',
  'Personalizing your macro breakdown...',
  'Setting up your nutrition plan...',
  'Configuring your fitness goals...',
  'Finalizing your profile...',
];

const OnboardingProcessingScreen = ({ navigation }) => {
  const [progress] = useState(new Animated.Value(0));
  const [percentage, setPercentage] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState(PROCESSING_PHRASES[0]);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 100 over 4 seconds (slower)
    Animated.timing(progress, {
      toValue: 100,
      duration: 4000, // Increased from 2000 to 4000ms
      useNativeDriver: false,
    }).start();

    // Update percentage display
    const listener = progress.addListener(({ value }) => {
      setPercentage(Math.round(value));
    });

    // Change phrase every 600ms
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % PROCESSING_PHRASES.length;
        setCurrentPhrase(PROCESSING_PHRASES[nextIndex]);
        return nextIndex;
      });
    }, 600);

    // Navigate to results after animation completes
    const timer = setTimeout(() => {
      navigation.replace('OnboardingResults');
    }, 4000); // Increased from 2000 to 4000ms

    return () => {
      progress.removeListener(listener);
      clearTimeout(timer);
      clearInterval(phraseInterval);
    };
  }, []);

  // Interpolate rotation for spinning effect
  const spin = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Animated Progress Circle */}
        <View style={styles.progressCircleContainer}>
          <Animated.View 
            style={[
              styles.progressCircleOuter,
              { transform: [{ rotate: spin }] }
            ]}
          />
          <View style={styles.progressCircle}>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>
        </View>

        {/* Main Message */}
        <Text style={styles.message}>
          Creating your{'\n'}personalized plan
        </Text>

        {/* Dynamic Processing Phrase */}
        <View style={styles.phraseContainer}>
          <View style={styles.phraseBox}>
            <Text style={styles.phraseText}>{currentPhrase}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🎯</Text>
            <Text style={styles.infoText}>Personalized nutrition targets</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>💪</Text>
            <Text style={styles.infoText}>Customized fitness goals</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔥</Text>
            <Text style={styles.infoText}>Optimized calorie breakdown</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressCircleContainer: {
    marginBottom: 40,
    position: 'relative',
    width: 160,
    height: 160,
  },
  progressCircleOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: Colors.primary,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
  },
  progressCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
    top: 10,
    left: 10,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  message: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 36,
  },
  phraseContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    minHeight: 60,
  },
  phraseBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  phraseText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
});

export default OnboardingProcessingScreen;