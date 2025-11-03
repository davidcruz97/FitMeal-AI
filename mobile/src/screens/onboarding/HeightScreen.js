// mobile/src/screens/onboarding/HeightScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const ITEM_HEIGHT = 50;

const HeightScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const scrollViewRef = useRef(null);
  
  const [heightCm, setHeightCm] = useState(onboardingData.height_cm || 170);

  // Generate heights: 120-250cm
  const heights = Array.from({ length: 131 }, (_, i) => i + 120);

  useEffect(() => {
    // Scroll to initial position after component mounts
    const initialIndex = heights.indexOf(heightCm);
    if (scrollViewRef.current && initialIndex !== -1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleScroll = (event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round((yOffset + ITEM_HEIGHT / 2) / ITEM_HEIGHT);
    const newValue = heights[index];
    
    if (newValue && newValue !== heightCm) {
      setHeightCm(newValue);
    }
  };

  const handleNext = () => {
    updateOnboardingData('height_cm', heightCm);
    navigation.navigate('OnboardingWeight');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '80%' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>How tall are you?</Text>
        <View style={styles.backButton} />
      </View>

      {/* Height Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.selectedValue}>
          {heightCm}
          <Text style={styles.unit}>cm</Text>
        </Text>
      </View>

      {/* Height Picker */}
      <View style={styles.pickerContainer}>
        <View style={styles.selectionIndicator} />
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {heights.map((height) => {
            const isSelected = height === heightCm;
            return (
              <TouchableOpacity
                key={height}
                style={styles.pickerItem}
                onPress={() => {
                  setHeightCm(height);
                  const index = heights.indexOf(height);
                  scrollViewRef.current?.scrollTo({
                    y: index * ITEM_HEIGHT,
                    animated: true,
                  });
                }}
              >
                <Text
                  style={[
                    styles.pickerText,
                    isSelected && styles.pickerTextSelected,
                  ]}
                >
                  {height}cm
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
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
  displayContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  selectedValue: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#000',
  },
  unit: {
    fontSize: 40,
    fontWeight: 'normal',
    color: Colors.textSecondary,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    width: '80%',
    height: ITEM_HEIGHT,
    backgroundColor: '#FFF',
    borderRadius: 12,
    zIndex: -1,
    top: '50%',
    marginTop: -ITEM_HEIGHT / 2,
  },
  scrollView: {
    width: '100%',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pickerText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pickerTextSelected: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
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
  nextButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default HeightScreen;