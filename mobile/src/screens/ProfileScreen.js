// mobile/src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { deleteAccount, changePassword } from '../api/auth';
import { useOnboarding } from '../context/OnBoardingContext';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/colors'; 

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { setIsViewingResults, resetOnboarding } = useOnboarding();
  const navigation = useNavigation();
  const [expandedSection, setExpandedSection] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const profile = user?.profile || {};
  const nutritionTargets = user?.nutrition_targets || {};

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            // Show confirmation dialog
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Are you absolutely sure you want to delete your account?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been permanently deleted.',
                        [
                          {
                            text: 'OK',
                            onPress: async () => {
                              await logout();
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);

      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
              setExpandedSection(null); // Close the section
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRerunOnboarding = () => {
    Alert.alert(
      'Re-configure Your Profile',
      'This will take you through the onboarding process again to update your fitness goals, stats, and nutrition targets. Your current data will be updated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Reset onboarding data
            resetOnboarding();
            
            // Set viewing flag to true - this will cause AppNavigator to switch to onboarding stack
            setIsViewingResults(true);
            
            // The AppNavigator will automatically handle the navigation
            // No need to manually navigate - it will re-render with onboarding stack
          },
        },
      ]
    );
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Format fitness goals for display
  const formatGoals = (goals) => {
    if (!goals || goals.length === 0) return 'Not set';
    
    const goalLabels = {
      'improve_fitness': 'Improve Fitness',
      'build_muscle': 'Build Muscle',
      'shred_fat': 'Shred Fat',
      'toned_body': 'Toned Body',
      'weight_loss': 'Weight Loss',
      'improve_mental_health': 'Improve Mental Health',
      'balance': 'Balance',
      'maintain_muscle': 'Maintain Muscle',
      'core_strength': 'Core Strength',
      'optimize_workouts': 'Optimize Workouts',
      'lean_gains': 'Lean Gains',
      'hormones_regulation': 'Hormones Regulation',
    };
    
    return goals.map(g => goalLabels[g] || g).join(', ');
  };

  // Format activity level
  const formatActivityLevel = (level) => {
    const labels = {
      'sedentary': 'Sedentary',
      'lightly_active': 'Lightly Active',
      'moderately_active': 'Moderately Active',
      'very_active': 'Very Active',
      'extremely_active': 'Extremely Active',
    };
    return labels[level] || level || 'Not set';
  };

  // Format lifting experience
  const formatLiftingExperience = (exp) => {
    const labels = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced',
    };
    return labels[exp] || exp || 'Not set';
  };

  // Format workout days
  const formatWorkoutDays = (days) => {
    if (!days || days.length === 0) return 'Not set';
    const dayLabels = {
      'monday': 'Mon',
      'tuesday': 'Tue',
      'wednesday': 'Wed',
      'thursday': 'Thu',
      'friday': 'Fri',
      'saturday': 'Sat',
      'sunday': 'Sun',
    };
    return days.map(d => dayLabels[d] || d).join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <FontAwesome5 name="user-circle" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{user?.full_name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>

        {/* Quick Stats */}
        {user?.profile_completed && (
          <View style={styles.quickStatsContainer}>
            <View style={styles.quickStatCard}>
              <FontAwesome5 name="weight" size={24} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{profile.weight || '--'}</Text>
              <Text style={styles.quickStatLabel}>kg</Text>
            </View>
            <View style={styles.quickStatCard}>
              <FontAwesome5 name="ruler-vertical" size={24} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{profile.height || '--'}</Text>
              <Text style={styles.quickStatLabel}>cm</Text>
            </View>
            <View style={styles.quickStatCard}>
              <FontAwesome5 name="dumbbell" size={24} color={Colors.primary} />
              <Text style={styles.quickStatValue}>{profile.workout_days_per_week || '--'}</Text>
              <Text style={styles.quickStatLabel}>days/week</Text>
            </View>
          </View>
        )}

        {/* Profile Sections */}
        {user?.profile_completed ? (
          <>
            {/* Fitness Goals Section */}
            <TouchableOpacity
              style={styles.section}
              onPress={() => toggleSection('goals')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <FontAwesome5 name="bullseye" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Fitness Goals</Text>
                </View>
                <FontAwesome5 
                  name={expandedSection === 'goals' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={Colors.textSecondary} 
                />
              </View>
              {expandedSection === 'goals' && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionText}>{formatGoals(profile.fitness_goals)}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Personal Info Section */}
            <TouchableOpacity
              style={styles.section}
              onPress={() => toggleSection('personal')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <FontAwesome5 name="user" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Personal Info</Text>
                </View>
                <FontAwesome5 
                  name={expandedSection === 'personal' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={Colors.textSecondary} 
                />
              </View>
              {expandedSection === 'personal' && (
                <View style={styles.sectionContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gender:</Text>
                    <Text style={styles.infoValue}>{profile.gender || 'Not set'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Age:</Text>
                    <Text style={styles.infoValue}>{profile.age || '--'} years</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Height:</Text>
                    <Text style={styles.infoValue}>{profile.height || '--'} cm</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Weight:</Text>
                    <Text style={styles.infoValue}>{profile.weight || '--'} kg</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Activity Section */}
            <TouchableOpacity
              style={styles.section}
              onPress={() => toggleSection('activity')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <FontAwesome5 name="running" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Activity & Training</Text>
                </View>
                <FontAwesome5 
                  name={expandedSection === 'activity' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={Colors.textSecondary} 
                />
              </View>
              {expandedSection === 'activity' && (
                <View style={styles.sectionContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Activity Level:</Text>
                    <Text style={styles.infoValue}>{formatActivityLevel(profile.activity_level)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Lifting Experience:</Text>
                    <Text style={styles.infoValue}>{formatLiftingExperience(profile.lifting_experience)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Workout Days:</Text>
                    <Text style={styles.infoValue}>{formatWorkoutDays(profile.workout_days)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Nutrition Targets Section */}
            <TouchableOpacity
              style={styles.section}
              onPress={() => toggleSection('nutrition')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <FontAwesome5 name="apple-alt" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Nutrition Targets</Text>
                </View>
                <FontAwesome5 
                  name={expandedSection === 'nutrition' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={Colors.textSecondary} 
                />
              </View>
              {expandedSection === 'nutrition' && (
                <View style={styles.sectionContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Calories</Text>
                    <Text style={styles.infoValue}>{nutritionTargets.calories || '--'} kcal</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Protein</Text>
                    <Text style={styles.infoValue}>{nutritionTargets.protein || '--'}g</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Carbs</Text>
                    <Text style={styles.infoValue}>{nutritionTargets.carbs || '--'}g</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fats</Text>
                    <Text style={styles.infoValue}>{nutritionTargets.fats || '--'}g</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Water</Text>
                    <Text style={styles.infoValue}>{nutritionTargets.water || '--'} ml</Text>
                  </View>

                  <View style={styles.nutritionCitation}>
                    <FontAwesome5 name="database" size={12} color={Colors.textSecondary} />
                    <Text style={styles.nutritionCitationText}>
                      BMR and macro calculations use validated formulas (Mifflin-St Jeor, Harris-Benedict) but individual needs vary based on metabolism, genetics, and health status.
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Re-configure Profile Button */}
            <TouchableOpacity
              style={styles.reconfigureButton}
              onPress={handleRerunOnboarding}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="sync-alt" size={18} color={Colors.primary} />
              <Text style={styles.reconfigureButtonText}>Update My Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.incompleteSection}>
            <FontAwesome5 name="exclamation-circle" size={48} color={Colors.textSecondary} />
            <Text style={styles.incompleteText}>Profile not completed</Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => {
                resetOnboarding();
                setIsViewingResults(true);
                // AppNavigator will automatically switch to onboarding stack
              }}
            >
              <Text style={styles.completeButtonText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <FontAwesome5 name="id-card" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User Type:</Text>
              <Text style={styles.infoValue}>{user?.user_type || 'user'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <FontAwesome5 name="info-circle" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.aboutText}>FitMeal AI - AI-Powered Meal Planning</Text>
            <Text style={styles.aboutVersion}>Version 1.1.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="sign-out-alt" size={18} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Account Settings Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => toggleSection('account')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <FontAwesome5 name="lock" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Account Settings</Text>
            </View>
            <FontAwesome5 
              name={expandedSection === 'account' ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={Colors.textSecondary} 
            />
          </View>
          {expandedSection === 'account' && (
            <View style={styles.sectionContent}>
              {/* Change Password Form */}
              <View style={styles.passwordSection}>
                <Text style={styles.passwordSectionTitle}>Change Password</Text>

                <View style={styles.passwordInputContainer}>
                  <Text style={styles.passwordLabel}>Current Password</Text>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    placeholderTextColor={Colors.textSecondary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!changingPassword}
                  />
                </View>
          
                <View style={styles.passwordInputContainer}>
                  <Text style={styles.passwordLabel}>New Password</Text>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password (min 6 characters)"
                    placeholderTextColor={Colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!changingPassword}
                  />
                </View>
          
                <View style={styles.passwordInputContainer}>
                  <Text style={styles.passwordLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={Colors.textSecondary}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!changingPassword}
                  />
                </View>
          
                <TouchableOpacity
                  style={[styles.changePasswordButton, changingPassword && styles.buttonDisabled]}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  <FontAwesome5 name="key" size={16} color="#FFF" />
                  <Text style={styles.changePasswordButtonText}>
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Text>
                </TouchableOpacity>
              </View>
          
              {/* Divider */}
              <View style={styles.accountDivider} />
          
              {/* Delete Account */}
              <View style={styles.deleteSection}>
                <Text style={styles.deleteSectionTitle}>Danger Zone</Text>
                <Text style={styles.deleteSectionDescription}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </Text>
                <TouchableOpacity 
                  style={styles.deleteAccountButton} 
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="user-times" size={16} color="#FFF" />
                  <Text style={styles.deleteAccountText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 90 : 70,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reconfigureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reconfigureButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  incompleteSection: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  incompleteText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  aboutVersion: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: '#600000',
  },
  deleteAccountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordSection: {
    marginTop: 8,
  },
  passwordSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  passwordInputContainer: {
    marginBottom: 16,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  accountDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },
  deleteSection: {
    marginBottom: 8,
  },
  deleteSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 8,
  },
  deleteSectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: '#600000',
  },
  deleteAccountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionCitation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nutritionCitationText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default ProfileScreen;