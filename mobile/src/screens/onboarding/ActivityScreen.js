// mobile/src/screens/onboarding/ActivityScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const ACTIVITY_LEVELS = [
    {
      id: 'sedentary',
      label: 'Sedentary',
      description: 'Little to no exercise, office job',
      bars: 1,
    },
    {
      id: 'lightly_active',
      label: 'Lightly active',
      description: 'Light exercise 1-3 days per week',
      bars: 2,
    },
    {
      id: 'moderately_active',
      label: 'Moderately active',
      description: 'Moderate exercise 3-5 days per week',
      bars: 3,
    },
    {
      id: 'very_active',
      label: 'Very active',
      description: 'Strenuous exercise 6-7 days per week',
      bars: 4,
    },
    {
      id: 'extremely_active',
      label: 'Extremely active',
      description: 'Strenuous exercise twice a day',
      bars: 5,
    },
];

const ActivityScreen = () => {
    const navigation = useNavigation();
    const { onboardingData, updateOnboardingData } = useOnboarding();
    const [selectedLevel, setSelectedLevel] = useState(onboardingData.activity_level || null);

    const handleNext = () => {
      if (selectedLevel) {
        updateOnboardingData('activity_level', selectedLevel);
        navigation.navigate('OnboardingLifting');
      }
    };

    const renderActivityBars = (numBars, isSelected) => {
      const heights = [4, 6, 8, 10, 12];
      return (
        <View style={styles.barsContainer}>
          {[1, 2, 3, 4, 5].map((bar) => (
            <View
              key={bar}
              style={[
                styles.bar,
                { height: heights[bar - 1] },
                bar <= numBars && styles.barFilled,
                isSelected && bar <= numBars && styles.barFilledSelected,
              ]}
            />
          ))}
        </View>
      );
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '50%' }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose your activity level</Text>
          <View style={styles.backButton} />
        </View>

        {/* Activity Levels */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.levelsContainer}
          showsVerticalScrollIndicator={false}
        >
          {ACTIVITY_LEVELS.map((level) => {
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
                {renderActivityBars(level.bars, isSelected)}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
    scrollView: {
      flex: 1,
    },
    levelsContainer: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
    levelCard: {
      backgroundColor: '#FFF',
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: '#FFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    barsContainer: {
      flexDirection: 'row',
      gap: 3,
      alignItems: 'flex-end',
      height: 16,
      marginLeft: 12,
    },
    bar: {
      width: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 1,
    },
    barFilled: {
      backgroundColor: Colors.textSecondary,
    },
    barFilledSelected: {
      backgroundColor: '#FFF',
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

export default ActivityScreen;