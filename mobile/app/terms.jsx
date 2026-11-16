import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, AppHeader, Icon, Button } from '../components/ui';

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  const handleOpenWeb = () => {
    Linking.openURL('https://fitly-backend-tkzw.onrender.com/terms');
  };

  const handleContact = () => {
    Linking.openURL('mailto:dhinagarandhinagar70@gmail.com?subject=Fitly%20Terms%20Inquiry');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Terms & Conditions"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Medical Disclaimer Banner */}
        <Card style={styles.disclaimerCard}>
          <View style={styles.disclaimerIconWrap}>
            <Icon name="AlertTriangle" size={24} color="#DC2626" />
          </View>
          <View style={styles.disclaimerTextWrap}>
            <Text style={styles.disclaimerTitle}>Medical & Health Disclaimer</Text>
            <Text style={styles.disclaimerDesc}>
              Fitly is a fitness and calorie tracking tool, not a medical device. Consult a physician or registered dietitian before starting any diet or workout regimen.
            </Text>
          </View>
        </Card>

        {/* Section 1: Agreement */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
          <Text style={styles.sectionBody}>
            By creating an account, downloading, or using Fitly, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please discontinue using the service.
          </Text>
        </Card>

        {/* Section 2: Account Responsibilities */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Account & Eligibility</Text>
          <Text style={styles.sectionBody}>
            • You must be at least 13 years old to use Fitly.{'\n'}
            • You agree to provide accurate physical metrics (weight, height, age) to receive reliable calorie calculations.{'\n'}
            • You are responsible for maintaining the confidentiality of your account password.
          </Text>
        </Card>

        {/* Section 3: Ria AI Coach Usage */}
        <Card style={styles.sectionCard}>
          <View style={styles.rowTitle}>
            <Icon name="Bot" size={18} color={Colors.primary[600]} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>3. Ria AI Coach Nutritional Guidance</Text>
          </View>
          <Text style={styles.sectionBody}>
            Ria AI Coach estimates calories and macronutrients based on ICMR-NIN nutritional databases and AI language models. Actual nutritional values may vary depending on recipe ingredients and cooking methods. Use your discretion when following automated meal plans.
          </Text>
        </Card>

        {/* Section 4: Device & Wearable Integration */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Google Health Connect & Devices</Text>
          <Text style={styles.sectionBody}>
            Fitly synchronizes steps, active calories, and sleep duration through Android Health Connect or Apple Health. You retain full control over these device permissions and can revoke them at any time in system settings.
          </Text>
        </Card>

        {/* Section 5: Community Rules */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. Community Standards</Text>
          <Text style={styles.sectionBody}>
            Fitly promotes a supportive, encouraging fitness community. Harassment, hate speech, spam, or promotion of unhealthy/dangerous starvation diets is strictly prohibited and results in immediate account suspension.
          </Text>
        </Card>

        {/* Section 6: Limitation of Liability */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.sectionBody}>
            Fitly and its team shall not be liable for any physical injury, illness, or damages resulting from workout routines, dietary changes, or reliance on information provided in the app.
          </Text>
        </Card>

        {/* Switch to Privacy Policy */}
        <TouchableOpacity
          style={styles.switchPolicyCard}
          onPress={() => router.push('/privacy-policy')}
        >
          <View style={styles.switchPolicyInfo}>
            <Icon name="Shield" size={20} color={Colors.primary[600]} />
            <View>
              <Text style={styles.switchPolicyTitle}>View Privacy Policy</Text>
              <Text style={styles.switchPolicySubtitle}>How we protect and secure your data</Text>
            </View>
          </View>
          <Icon name="ChevronRight" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.footerActions}>
          <Button
            title="Open Terms in Web Browser"
            onPress={handleOpenWeb}
            variant="outline"
            style={styles.webBtn}
            icon="Globe"
          />

          <TouchableOpacity onPress={handleContact} style={styles.contactLink}>
            <Text style={styles.contactText}>
              Legal Support: <Text style={styles.underline}>dhinagarandhinagar70@gmail.com</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>
          Fitly Health & Fitness v1.0.0 • Effective Nov 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.md,
  },
  disclaimerCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  disclaimerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerTextWrap: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: '#991B1B',
    marginBottom: 2,
  },
  disclaimerDesc: {
    fontSize: Typography.sizes.xs,
    color: '#B91C1C',
    lineHeight: 18,
  },
  sectionCard: {
    padding: Spacing.md,
    gap: 8,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionBody: {
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  switchPolicyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  switchPolicyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchPolicyTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  switchPolicySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  footerActions: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
    alignItems: 'center',
  },
  webBtn: {
    width: '100%',
  },
  contactLink: {
    paddingVertical: 4,
  },
  contactText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  underline: {
    textDecorationLine: 'underline',
    color: Colors.primary[600],
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 8,
  },
});
