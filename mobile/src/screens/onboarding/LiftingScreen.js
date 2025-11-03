// mobile/src/screens/onboarding/LiftingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const LIFTING_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: "I'm new to bodybuilding",
    icon: 'running',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: "I've lifted weights before",
    icon: 'medal',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: "I've been lifting for years",
    icon: 'dumbbell',
  },
];

const LiftingScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedLevel, setSelectedLevel] = useState(onboardingData.lifting_experience || null);

  const handleNext = () => {
    if (selectedLevel) {
      updateOnboardingData('lifting_experience', selectedLevel);
      navigation.navigate('OnboardingAge');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '60%' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Choose your lifting experience level</Text>
        <View style={styles.backButton} />
      </View>

      {/* Lifting Levels */}
      <View style={styles.levelsContainer}>
        {LIFTING_LEVELS.map((level) => {
          const isSelected = selectedLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                isSelected && styles.levelCardSelected,
              ]}
              onPress={() => setSelectedLevel(level.id)}
            >
              <View style={styles.levelContent}>
                <Text
                  style={[
                    styles.levelLabel,
                    isSelected && styles.levelLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.levelDescription,
                    isSelected && styles.levelDescriptionSelected,
                  ]}
                >
                  {level.description}
                </Text>
              </View>
              <FontAwesome5 name={level.icon} size={40} color={isSelected ? '#FFF' : '#000'} solid/>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedLevel && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedLevel}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  levelsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  levelCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  levelCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  levelContent: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  levelLabelSelected: {
    color: '#FFF',
  },
  levelDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  levelDescriptionSelected: {
    color: '#FFF',
    opacity: 0.9,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default LiftingScreen;