// mobile/src/screens/AIAssistantScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { askNutritionQuestion, explainMacro, warmupAI } from '../api/ai';
import Colors from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const AIAssistantScreen = () => {
  const { user, isGuest } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('ale'); // 'ale', 'learn', or 'sources'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiWarming, setAiWarming] = useState(true); // Start as true
  const [warmupPhrase, setWarmupPhrase] = useState('');
  const scrollViewRef = useRef(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserTitle, setBrowserTitle] = useState('');

  // Motivational phrases for warmup
  const warmupPhrases = [
    "🧠 Decoding your profile...",
    "🔥 Preparing everything for you...",
    "💪 Training the model for you...",
    "🎯 Analyzing your goals...",
    "✨ Getting Ale ready...",
    "🚀 Loading nutrition intelligence...",
  ];

  // Nutrition topics for Learn tab
  const nutritionTopics = [
    { id: 'protein', name: 'Protein', icon: 'drumstick-bite', color: '#8B7FD9' }, // Purple
    { id: 'carbs', name: 'Carbs', icon: 'bread-slice', color: '#6B9BD1' }, // Blue
    { id: 'fats', name: 'Fats', icon: 'cheese', color: '#9C8FDB' }, // Light purple
    { id: 'calories', name: 'Calories', icon: 'fire', color: '#7B8FA3' }, // Grey-blue
    { id: 'fiber', name: 'Fiber', icon: 'leaf', color: '#A8B5C7' }, // Light grey
    { id: 'hydration', name: 'Hydration', icon: 'tint', color: '#5A7FA8' }, // Dark blue
  ];

  // Suggested questions for Ale tab
  const suggestedQuestions = [
    "What should I eat pre-workout?",
    "How much protein do I need?",
    "Best foods for recovery?",
    "Tips for meal prep?",
  ];

  // Cycle through warmup phrases
  useEffect(() => {
    if (aiWarming) {
      let currentIndex = 0;
      setWarmupPhrase(warmupPhrases[0]);
      
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % warmupPhrases.length;
        setWarmupPhrase(warmupPhrases[currentIndex]);
      }, 3000); // Change phrase every 3 seconds

      return () => clearInterval(interval);
    }
  }, [aiWarming]);

  // Warm up AI on component mount
  useEffect(() => {
    warmupAIModel();
  }, []);

  const warmupAIModel = async () => {
    try {
      setAiWarming(true);
      await warmupAI();
      // console.log('✅ AI model warmed up');
    } catch (error) {
      // console.warn('⚠️ AI warmup failed:', error);
      // Don't show error to user, warmup is optional optimization
    } finally {
      setAiWarming(false);
    }
  };

  // Add welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && activeTab === 'ale') {
      const userName = user?.name || 'there';
      setMessages([
        {
          id: 'welcome',
          type: 'ai',
          text: `Hey ${userName}! 👋 I'm Ale, your AI nutrition assistant. I know your goals and can help you make better food choices. What would you like to know?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [activeTab]);

  const handleSendMessage = async (questionText = null) => {
    if (isGuest && messages.length >= 3) {
      Alert.alert(
        'Sign Up to Continue',
        'Create a free account to continue chatting with Ale!',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Sign Up', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }

    const question = questionText || inputText.trim();
    
    if (!question) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await askNutritionQuestion(question);
      
      // Add AI response
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: response.answer,
        timestamp: new Date(),
        personalized: response.personalized,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Scroll to bottom after AI responds
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      // console.error('Failed to get AI response:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = async (topic) => {
    setLoading(true);
    
    try {
      const response = await explainMacro(topic.id);
      
      // Switch to Ale tab and show explanation as a message
      setActiveTab('ale');
      
      const aiMessage = {
        id: Date.now().toString(),
        type: 'ai',
        text: response.explanation,
        timestamp: new Date(),
        topic: topic.name,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      // console.error('Failed to get topic explanation:', error);
      Alert.alert(
        'Connection Error',
        'Could not load the explanation. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <FontAwesome5 name="robot" size={16} color={Colors.textLight} />
          </View>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            message.isError && styles.errorBubble,
          ]}
        >
          {message.topic && (
            <Text style={styles.topicLabel}>📚 {message.topic}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText,
            ]}
          >
            {message.text}
          </Text>
          {!isUser && message.personalized && (
            <View style={styles.personalizedBadge}>
              <FontAwesome5 name="user-check" size={10} color={Colors.primary} />
              <Text style={styles.personalizedText}>Personalized for you</Text>
            </View>
          )}
        </View>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <FontAwesome5 name="user" size={16} color={Colors.textLight} />
          </View>
        )}
      </View>
    );
  };

  const renderAleTab = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.tabContent}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Ale is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Suggested Questions (only show when no messages yet) */}
        {messages.length <= 1 && (
          <View style={styles.suggestedContainer}>
            <Text style={styles.suggestedLabel}>Try asking:</Text>
            <View style={styles.suggestedChips}>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => handleSendMessage(question)}
                  disabled={loading}
                >
                  <Text style={styles.chipText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about nutrition..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <FontAwesome5
              name="paper-plane"
              size={18}
              color={Colors.textLight}
              solid
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderLearnTab = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.learnContent}>
        <View style={styles.learnHeader}>
          <FontAwesome5 name="graduation-cap" size={32} color={Colors.primary} />
          <Text style={styles.learnTitle}>Learn About Nutrition</Text>
          <Text style={styles.learnSubtitle}>
            Tap any topic to get a quick insight from Ale
          </Text>
        </View>

        <View style={styles.topicsGrid}>
          {nutritionTopics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard, 
                { borderColor: topic.color },
                loading && styles.topicCardDisabled
              ]}
              onPress={() => handleTopicPress(topic)}
              disabled={loading}
            >
              <View style={[styles.topicIcon, { backgroundColor: topic.color + '20' }]}>
                <FontAwesome5
                  name={topic.icon}
                  size={28}
                  color={topic.color}
                  solid
                />
              </View>
              <Text style={styles.topicName}>{topic.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.learnLoadingOverlay}>
            <View style={styles.learnLoadingContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.learnLoadingText}>Ale is preparing your explanation...</Text>
              <Text style={styles.learnLoadingSubtext}>This may take a moment</Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSourcesTab = () => {
    const sources = [
      {
        id: 'usda',
        name: 'USDA Dietary Guidelines',
        icon: 'leaf',
        color: '#4CAF50',
        description: 'Official dietary guidelines for Americans',
        url: 'https://www.dietaryguidelines.gov',
      },
      {
        id: 'who',
        name: 'WHO Nutrition',
        icon: 'globe',
        color: '#2196F3',
        description: 'World Health Organization nutrition recommendations',
        url: 'https://www.who.int/health-topics/nutrition',
      },
      {
        id: 'and',
        name: 'Academy of Nutrition',
        icon: 'user-md',
        color: '#9C27B0',
        description: 'Evidence-based nutrition practice guidelines',
        url: 'https://www.eatright.org',
      },
      {
        id: 'usda-db',
        name: 'USDA Food Database',
        icon: 'database',
        color: '#795548',
        description: 'Nutritional data for ingredients and foods',
        url: 'https://fdc.nal.usda.gov',
      },
    ];

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.sourcesContent}>
        <View style={styles.sourcesHeader}>
          <FontAwesome5 name="book-medical" size={32} color={Colors.primary} />
          <Text style={styles.sourcesTitle}>Medical & Nutrition Sources</Text>
          <Text style={styles.sourcesSubtitle}>
            All nutrition information and recommendations are AI-produced. We recommend consulting the scientific research from these trusted sources:
          </Text>
        </View>

        <View style={styles.sourcesGrid}>
          {sources.map((source) => (
            <TouchableOpacity
              key={source.id}
              style={[styles.sourceCard, { borderColor: source.color }]}
              onPress={() => {
                setBrowserUrl(source.url);
                setBrowserTitle(source.name);
                setShowBrowser(true);
              }}
              disabled={loading}
            >
              <View style={[styles.sourceIcon, { backgroundColor: source.color + '20' }]}>
                <FontAwesome5 name={source.icon} size={24} color={source.color} solid />
              </View>
              <Text style={styles.sourceName}>{source.name}</Text>
              <Text style={styles.sourceDescription}>{source.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.disclaimerCard}>
          <FontAwesome5 name="exclamation-triangle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerTitle}>Important Notice</Text>
          <Text style={styles.disclaimerText}>
            Ale provides AI-generated nutrition information based on these scientific sources for educational purposes only.
            {'\n\n'}
            This does NOT replace professional medical advice, diagnosis, or treatment. Always consult with a registered dietitian, nutritionist, or healthcare provider for personalized guidance.
            {'\n\n'}
            BMR and macro calculations use validated formulas (Mifflin-St Jeor, Harris-Benedict) but individual needs vary based on metabolism, genetics, and health status.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {aiWarming ? (
        // Warmup Loading Screen
        <View style={styles.warmupContainer}>
          <View style={styles.warmupContent}>
            <FontAwesome5 name="robot" size={80} color={Colors.primary} solid />
            <ActivityIndicator size="large" color={Colors.primary} style={styles.warmupSpinner} />
            <Text style={styles.warmupTitle}>Setting up AI Assistant</Text>
            <Text style={styles.warmupPhrase}>{warmupPhrase}</Text>
            <View style={styles.warmupDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive]} />
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* Header with Tab Selector */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ale needs up to 30s to think</Text>
            
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'ale' && styles.activeTab]}
                onPress={() => setActiveTab('ale')}
              >
                <FontAwesome5
                  name="comments"
                  size={16}
                  color={activeTab === 'ale' ? Colors.primary : Colors.textSecondary}
                  solid
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'ale' && styles.activeTabText,
                  ]}
                >
                  Ale
                </Text>
              </TouchableOpacity>
                
              <TouchableOpacity
                style={[styles.tab, activeTab === 'learn' && styles.activeTab]}
                onPress={() => setActiveTab('learn')}
              >
                <FontAwesome5
                  name="book"
                  size={16}
                  color={activeTab === 'learn' ? Colors.primary : Colors.textSecondary}
                  solid
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'learn' && styles.activeTabText,
                  ]}
                >
                  Learn
                </Text>
              </TouchableOpacity>
                
              <TouchableOpacity
                style={[styles.tab, activeTab === 'sources' && styles.activeTab]}
                onPress={() => setActiveTab('sources')}
              >
                <FontAwesome5
                  name="book-medical"
                  size={16}
                  color={activeTab === 'sources' ? Colors.primary : Colors.textSecondary}
                  solid
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'sources' && styles.activeTabText,
                  ]}
                >
                  Sources
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guest Mode Banner */}
          {isGuest && (
            <View style={styles.guestBanner}>
              <FontAwesome5 name="info-circle" size={14} color={Colors.primary} />
              <Text style={styles.guestBannerText}>
                Guest Mode Limited
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.guestBannerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tab Content */}
          {activeTab === 'ale' ? renderAleTab() : activeTab === 'learn' ? renderLearnTab() : renderSourcesTab()}
        </>
      )}

      {/* In-App Browser Modal */}
      <Modal
        visible={showBrowser}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBrowser(false)}
      >
        <View style={styles.browserContainer}>
          {/* Browser Header */}
          <View style={styles.browserHeader}>
            <TouchableOpacity
              style={styles.browserCloseButton}
              onPress={() => {
                setShowBrowser(false);
                setBrowserUrl('');
                setBrowserTitle('');
              }}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="times" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.browserTitle} numberOfLines={1}>
              {browserTitle}
            </Text>
            <View style={styles.browserPlaceholder} />
          </View>
            
          {/* WebView */}
          <WebView
            source={{ uri: browserUrl }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.webviewLoadingText}>Loading...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  warmupContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warmupContent: {
    alignItems: 'center',
    gap: 24,
  },
  warmupSpinner: {
    marginTop: 20,
  },
  warmupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  warmupPhrase: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  warmupDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  
  // Ale Tab Styles
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  errorBubble: {
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.textLight,
  },
  aiMessageText: {
    color: Colors.text,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  personalizedText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  suggestedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 12,
  },
  suggestedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // Learn Tab Styles
  learnContent: {
    padding: 20,
  },
  learnHeader: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  learnTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  learnSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topicCardDisabled: {
    opacity: 0.5,
  },
  topicIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  learnLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  learnLoadingContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  learnLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  learnLoadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sourcesContent: {
    padding: 20,
  },
  sourcesHeader: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  sourcesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  sourcesSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sourceCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 160,
  },
  sourceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  sourceDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  disclaimerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  disclaimerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  browserContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 0, 
  },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  browserCloseButton: {
    padding: 8,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  browserPlaceholder: {
    width: 50,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  webviewLoadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3CD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
  },
  guestBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
  },
  guestBannerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default AIAssistantScreen;