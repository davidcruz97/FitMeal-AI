// mobile/src/screens/onboarding/AgeScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

const AgeScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const scrollViewRef = useRef(null);
  const [selectedAge, setSelectedAge] = useState(onboardingData.age || 25);

  // Generate ages from 13 to 100
  const ages = Array.from({ length: 88 }, (_, i) => i + 13);

  useEffect(() => {
    // Scroll to initial position after component mounts
    const initialIndex = ages.indexOf(selectedAge);
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
    const newAge = ages[index];
    if (newAge && newAge !== selectedAge) {
      setSelectedAge(newAge);
    }
  };

  const handleNext = () => {
    updateOnboardingData('age', selectedAge);
    navigation.navigate('OnboardingHeight');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '70%' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>How old are you?</Text>
        <View style={styles.backButton} />
      </View>

      {/* Age Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.selectedValue}>{selectedAge}</Text>
      </View>

      {/* Age Picker */}
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
          {ages.map((age) => {
            const isSelected = age === selectedAge;
            return (
              <TouchableOpacity
                key={age}
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedAge(age);
                  const index = ages.indexOf(age);
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
                  {age}
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
  scrollContent: {
    alignItems: 'center',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pickerText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pickerTextSelected: {
    fontSize: 28,
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

export default AgeScreen;