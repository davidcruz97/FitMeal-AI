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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { askNutritionQuestion, explainMacro, warmupAI } from '../api/ai';
import Colors from '../constants/colors';

const AIAssistantScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ale'); // 'ale' or 'learn'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiWarming, setAiWarming] = useState(true); // Start as true
  const [warmupPhrase, setWarmupPhrase] = useState('');
  const scrollViewRef = useRef(null);

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
            </View>
          </View>

          {/* Tab Content */}
          {activeTab === 'ale' ? renderAleTab() : renderLearnTab()}
        </>
      )}
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
});

export default AIAssistantScreen;