import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && !fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    // Check terms acceptance for registration
    if (!isLogin && !acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms and Conditions to register');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email.toLowerCase().trim(), password);
      } else {
        result = await register(email.toLowerCase().trim(), password, fullName.trim());
      }

      if (!result.success) {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setFullName('');
    setAcceptedTerms(false);
  };

  const openTermsAndConditions = () => {
    // Replace this URL with your actual Terms and Conditions page
    const termsUrl = 'https://fitmeal.cinturillas247.com/terms';
    Linking.openURL(termsUrl).catch((err) => 
      Alert.alert('Error', 'Unable to open Terms and Conditions')
    );
  };

  const openPrivacyPolicy = () => {
    const privacyUrl = 'https://fitmeal.cinturillas247.com/privacy';
    Linking.openURL(privacyUrl).catch((err) => 
      Alert.alert('Error', 'Unable to open Privacy Policy')
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <FontAwesome5 name="utensils" size={50} color={Colors.primary} style={styles.logo} />
            <Text style={styles.title}>FitMeal AI</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Terms and Privacy Policy Checkbox - Only for Registration */}
            {!isLogin && (
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  disabled={loading}
                >
                  <View style={[styles.checkboxBox, acceptedTerms && styles.checkboxChecked]}>
                    {acceptedTerms && (
                      <FontAwesome5 name="check" size={14} color="#FFF" />
                    )}
                  </View>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>I accept the </Text>
                    <TouchableOpacity onPress={openTermsAndConditions}>
                      <Text style={styles.termsLink}>Terms and Conditions</Text>
                    </TouchableOpacity>
                    <Text style={styles.termsText}> and </Text>
                    <TouchableOpacity onPress={openPrivacyPolicy}>
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleMode}
              disabled={loading}
            >
              <Text style={styles.toggleText}>
                {isLogin
                  ? "Don't have an account? Register"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: Colors.text,
  },
  termsLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;