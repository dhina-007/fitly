import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { AppHeader, Icon, Input } from '../components/ui';
import { healthService } from '../services/health.service';
import { useAuthStore } from '../store/authStore';
import { useDateStore } from '../store/dateStore';

export default function AICoachScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const { selectedDate } = useDateStore();

  const userName = user?.displayName?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';

  // Live analytics for personalized context
  const { data: analytics } = useQuery({
    queryKey: ['dashboardAnalytics', selectedDate],
    queryFn: () => healthService.getDashboardAnalytics(selectedDate),
  });

  const eatenKcal = analytics?.calories?.consumed || 0;
  const targetKcal = analytics?.calories?.target || profile?.calorieTarget || 2000;
  const remainingKcal = Math.max(0, targetKcal - eatenKcal);
  const proteinCurrent = analytics?.macros?.protein?.consumed || 0;
  const proteinGoal = analytics?.macros?.protein?.target || profile?.proteinTarget || 120;

  const defaultInitialMessage = {
    id: '1',
    sender: 'ria',
    text: `Hi ${userName}! I'm Ria, your personal 100% Free AI Health & Nutrition Coach (no paywall, ever!).\n\nI can analyze your meals, suggest custom high-protein Indian recipes, plan your workouts, and optimize your fasting window. How can I help you reach your goals today?`,
    time: 'Just now',
  };

  const [messages, setMessages] = useState([defaultInitialMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  // Restore conversation history from backend on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const historyData = await healthService.getAIHistory();
        if (isMounted && historyData?.messages && historyData.messages.length > 0) {
          const loaded = historyData.messages.map((m, idx) => ({
            id: m._id || `${m.role}-${idx}-${m.timestamp}`,
            sender: m.role === 'assistant' ? 'ria' : 'user',
            text: m.content,
            time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier',
            action: m.action,
            loggedEntry: m.loggedEntry,
          }));
          setMessages(loaded);
        }
      } catch (err) {
        console.warn('Failed to load AI conversation history:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClearHistory = async () => {
    try {
      await healthService.clearAIHistory();
      setMessages([defaultInitialMessage]);
    } catch (err) {
      console.warn('Failed to clear history:', err);
    }
  };

  const quickPrompts = [
    { label: "Analyze today's calories & macros", icon: "PieChart", query: `Analyze my eating today. I consumed ${eatenKcal} kcal out of ${targetKcal} kcal, and ${proteinCurrent}g protein out of ${proteinGoal}g goal. Give me specific advice for dinner.` },
    { label: "Suggest high-protein Indian dinner", icon: "Utensils", query: `Suggest a high-protein vegetarian Indian dinner under ${Math.min(550, Math.max(350, remainingKcal))} kcal with recipe and macro breakdown.` },
    { label: "Healthy snack under 150 kcal", icon: "Apple", query: "What are the best Indian snacks under 150 kcal with good protein and fiber?" },
    { label: "15-min fat burn workout routine", icon: "Dumbbell", query: "Give me an effective 15-minute home HIIT bodyweight workout to boost metabolism." },
    { label: "How to break my fast safely?", icon: "Timer", query: "What is the best food to break a 16-hour intermittent fast without spiking insulin?" },
    { label: "Tips to boost deep sleep score", icon: "Moon", query: "Give me 4 science-backed habits to maximize my deep sleep and recovery tonight." },
  ];

  const handleSend = async (customText, customQuery) => {
    const textToSend = customText || inputText;
    const queryPayload = customQuery || textToSend;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setIsLoading(true);

    try {
      const isLoggingCommand = /add|log|track/i.test(queryPayload) && /breakfast|lunch|dinner|snack/i.test(queryPayload);
      const messageToSend = isLoggingCommand
        ? queryPayload
        : `User Name: ${userName}, Calorie Target: ${targetKcal} kcal, Eaten Today: ${eatenKcal} kcal, Remaining: ${remainingKcal} kcal, Protein: ${proteinCurrent}/${proteinGoal}g, Goal: ${profile?.fitnessGoal || 'general health'}. User says: ${queryPayload}`;

      const data = await healthService.chatWithRia(messageToSend, selectedDate);
      const reply = data?.reply || "I'm here to support your health journey! Keep tracking your meals and hitting your targets.";

      // Invalidate queries so Today's Meals and dashboard reflect the added food immediately
      if (data?.action === 'food_logged') {
        queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ria',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data?.action,
        loggedEntry: data?.loggedEntry,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ria',
        text: `Here is my recommendation for today:\n\n• **Remaining Budget**: ${remainingKcal.toLocaleString()} kcal.\n• **Protein Target**: You are at ${proteinCurrent}g / ${proteinGoal}g.\n\nTry including a bowl of curd, boiled eggs, or paneer to hit your protein goal while staying within your calorie deficit!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Ria AI Health Coach"
        subtitle="● 100% Free • HealthifySmart Equivalent"
        showBack
        rightIcon="RotateCcw"
        onRightAction={handleClearHistory}
      />

      {/* Real-time Health Context Banner (HealthifyMe Pro style) */}
      <View style={styles.contextBanner}>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>CALORIES LEFT</Text>
          <Text style={[styles.contextVal, { color: Colors.primary[700] }]}>
            {remainingKcal.toLocaleString()} <Text style={styles.contextUnit}>kcal</Text>
          </Text>
        </View>
        <View style={styles.contextDivider} />
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>PROTEIN GOAL</Text>
          <Text style={[styles.contextVal, { color: Colors.energy[600] }]}>
            {proteinCurrent}<Text style={styles.contextUnit}>/{proteinGoal}g</Text>
          </Text>
        </View>
        <View style={styles.contextDivider} />
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>HEALTH SCORE</Text>
          <Text style={[styles.contextVal, { color: Colors.secondary[600] }]}>
            {analytics?.healthScore || 85}<Text style={styles.contextUnit}>/100</Text>
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatScroll}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {item.sender === 'ria' && (
                <View style={styles.riaHeaderRow}>
                  <View style={styles.riaAvatarWrap}>
                    <Icon name="Sparkles" size={12} color={Colors.primary[700]} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.riaHeaderName}>Ria Coach</Text>
                  <View style={styles.freePill}>
                    <Text style={styles.freePillText}>FREE</Text>
                  </View>
                </View>
              )}

              <Text style={[styles.messageText, item.sender === 'user' && styles.userMessageText]}>
                {item.text}
              </Text>

              {item.action === 'food_logged' && (
                <View style={styles.loggedFoodCard}>
                  <View style={styles.loggedFoodHeader}>
                    <Icon name="CheckCircle" size={15} color="#059669" />
                    <Text style={styles.loggedFoodTitle}>
                      {item.loggedEntry?.summaryTitle || `Added to ${item.loggedEntry?.mealType || 'Breakfast'} (${item.loggedEntry?.calories || 0} kcal)`}
                    </Text>
                  </View>
                  {item.loggedEntry?.items && item.loggedEntry.items.length > 1 && (
                    <View style={styles.loggedItemsSubList}>
                      {item.loggedEntry.items.map((sub, sIdx) => {
                        const isWeightUnit = sub.servingUnit === 'g' || sub.servingUnit === 'ml';
                        const prefix = isWeightUnit
                          ? `${sub.servingWeightGrams || sub.quantity}${sub.servingUnit}`
                          : `${sub.quantity}x ${sub.servingUnit && !['piece', 'serving', 'items', 'item'].includes(sub.servingUnit) ? `${sub.servingUnit} ` : ''}`.trim();
                        return (
                          <Text key={sIdx} style={styles.loggedItemRowText}>
                            • {prefix} {sub.foodDisplayName} ({sub.calories} kcal)
                          </Text>
                        );
                      })}
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.viewTrackerBtn}
                    onPress={() => router.push('/(tabs)/home')}
                    activeOpacity={0.8}
                    testID="view-in-tracker-btn"
                  >
                    <Text style={styles.viewTrackerBtnText}>View in Today's Food Tracker →</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.timeText, item.sender === 'user' && styles.userTimeText]}>
                {item.time}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={Colors.primary[600]} />
              <Text style={styles.loadingText}>Ria is analyzing your health context...</Text>
            </View>
          )}
        </ScrollView>

        {/* Categorized Quick Prompt Chips */}
        <View style={styles.promptsSection}>
          <Text style={styles.promptsHeader}>QUICK RIA ACTIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsContainer}>
            {quickPrompts.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(p.label, p.query)}
                style={styles.promptPill}
                activeOpacity={0.7}
                testID={`prompt-pill-${idx}`}
              >
                <Icon name={p.icon} size={13} color={Colors.primary[700]} style={{ marginRight: 5 }} />
                <Text style={styles.promptText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Ria (e.g. log 3 idlis, calories)..."
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (inputText.trim()) handleSend();
              }}
              testID="ai-chat-input"
            />
          </View>
          <TouchableOpacity
            onPress={() => handleSend()}
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
            testID="send-chat-btn"
          >
            <Icon name="Send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  contextItem: {
    alignItems: 'center',
    flex: 1,
  },
  contextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  contextVal: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extrabold,
    marginTop: 1,
  },
  contextUnit: {
    fontSize: 10,
    fontWeight: 'normal',
    color: Colors.textSecondary,
  },
  contextDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.borderSubtle,
  },
  chatScroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '88%',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary[600],
    borderBottomRightRadius: BorderRadius.xs,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  riaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  riaAvatarWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  riaHeaderName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary[800],
  },
  freePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freePillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#047857',
  },
  messageText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  timeText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  loadingText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  promptsSection: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  promptsHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  promptsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  promptText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary[700],
    fontWeight: Typography.weights.semibold,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 4 : Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 46,
    maxHeight: 110,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.neutral[300],
    shadowOpacity: 0,
  },
  loggedFoodCard: {
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 8,
  },
  loggedFoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loggedFoodTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#065F46',
  },
  loggedItemsSubList: {
    paddingLeft: 4,
    gap: 3,
  },
  loggedItemRowText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
  },
  viewTrackerBtn: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  viewTrackerBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
});
