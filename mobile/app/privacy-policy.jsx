import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, AppHeader, Icon, Button } from '../components/ui';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleOpenWeb = () => {
    Linking.openURL('https://fitly-backend-tkzw.onrender.com/privacy-policy');
  };

  const handleContact = () => {
    Linking.openURL('mailto:dhinagarandhinagar70@gmail.com?subject=Fitly%20Privacy%20Inquiry');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Privacy Policy"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Commitment Badge */}
        <Card style={styles.badgeCard}>
          <View style={styles.badgeIconWrap}>
            <Icon name="Shield" size={24} color={Colors.primary[600]} />
          </View>
          <View style={styles.badgeTextWrap}>
            <Text style={styles.badgeTitle}>Your Privacy Matters</Text>
            <Text style={styles.badgeDesc}>
              Fitly is committed to protecting your health and fitness data. We never sell your personal information to third parties or advertisers.
            </Text>
          </View>
        </Card>

        {/* Section 1: Overview */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Overview & Scope</Text>
          <Text style={styles.sectionBody}>
            Fitly ("we", "our", or "us") provides AI-powered nutrition coaching, calorie tracking, and workout logging. This policy explains what data we collect, how it is secured, and your rights regarding your personal information.
          </Text>
        </Card>

        {/* Section 2: Data Collected */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Icon name="User" size={16} color={Colors.primary[500]} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Account Data: </Text>
                Name, email address, password (encrypted), and profile settings.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="Activity" size={16} color={Colors.energy[500]} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Health & Body Metrics: </Text>
                Height, weight, age, target goals, and activity level used to compute maintenance calories (TDEE/BMR).
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Icon name="Utensils" size={16} color={Colors.secondary[500]} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Meal & Workout Logs: </Text>
                Logged foods, macro distributions, exercise sets, reps, and fasting timers.
              </Text>
            </View>
          </View>
        </Card>

        {/* Section 3: Health Connect & Device Permissions */}
        <Card style={styles.sectionCard}>
          <View style={styles.rowTitle}>
            <Icon name="Watch" size={18} color={Colors.primary[600]} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>3. Google Health Connect & Devices</Text>
          </View>
          <Text style={styles.sectionBody}>
            If you connect Google Fit, Health Connect, or smartwatches, Fitly requests read permissions for:
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>• READ_STEPS (Daily step counts)</Text>
            <Text style={styles.codeText}>• READ_ACTIVE_CALORIES_BURNED (Workout calorie burn)</Text>
            <Text style={styles.codeText}>• READ_SLEEP_SESSION (Sleep duration & recovery)</Text>
          </View>
          <Text style={[styles.sectionBody, { marginTop: 8 }]}>
            <Text style={styles.boldText}>Strict Compliance: </Text>
            Your Health Connect data is used solely to display your daily dashboard progress rings. It is never transferred to data brokers or used for targeted advertisements.
          </Text>
        </Card>

        {/* Section 4: Ria AI Coach Disclaimer */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Ria AI Coach Disclaimer</Text>
          <Text style={styles.sectionBody}>
            Ria AI Coach provides nutritional information and fitness suggestions based on verified ICMR-NIN nutritional research. Ria is an educational fitness assistant and does not provide clinical diagnosis or medical advice.
          </Text>
        </Card>

        {/* Section 5: Data Security & Storage */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. Security & Cloud Storage</Text>
          <Text style={styles.sectionBody}>
            All network data is transmitted via end-to-end encrypted TLS/HTTPS. Health records and account data are securely stored in MongoDB Atlas with automated backups and strict access controls.
          </Text>
        </Card>

        {/* Section 6: User Rights & Deletion */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>6. Account Deletion & User Rights</Text>
          <Text style={styles.sectionBody}>
            In compliance with Google Play Store User Data policies, you can request full account and data deletion at any time:
          </Text>
          <TouchableOpacity style={styles.deleteReqBtn} onPress={handleContact}>
            <Icon name="Trash2" size={16} color={Colors.error} />
            <Text style={styles.deleteReqText}>Request Data Deletion via Email</Text>
          </TouchableOpacity>
        </Card>

        {/* External Web Link & Contact Buttons */}
        <View style={styles.footerActions}>
          <Button
            title="Open Web Version (Browser)"
            onPress={handleOpenWeb}
            variant="outline"
            style={styles.webBtn}
            icon="Globe"
          />

          <TouchableOpacity onPress={handleContact} style={styles.contactLink}>
            <Text style={styles.contactText}>
              Questions? Contact Support: <Text style={styles.underline}>dhinagarandhinagar70@gmail.com</Text>
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
  badgeCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextWrap: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: '#065F46',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: Typography.sizes.xs,
    color: '#047857',
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
  boldText: {
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  bulletList: {
    marginTop: 4,
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: Typography.sizes.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  codeBox: {
    backgroundColor: Colors.neutral[100],
    padding: 10,
    borderRadius: BorderRadius.sm,
    marginVertical: 4,
    gap: 4,
  },
  codeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deleteReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginTop: 6,
  },
  deleteReqText: {
    color: Colors.error,
    fontSize: Typography.sizes.xs + 1,
    fontWeight: Typography.weights.semibold,
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
