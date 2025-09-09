import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from 'react-native-toast-message';
import { apiService, getApiErrorMessage } from '../services/api';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, hasPermission } = useAuth();
  const insets = useSafeAreaInsets();

  const [beerLimit, setBeerLimit] = useState('');
  const [softDrinkLimit, setSoftDrinkLimit] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const canManage = hasPermission('canManageSettings');

  const load = async () => {
    try {
      const [s1, s2, s3, s4] = await Promise.all([
        apiService.getSetting('beerLimit').catch(() => ({ success: false })),
        apiService.getSetting('softDrinkLimit').catch(() => ({ success: false })),
        apiService.getSetting('eventName').catch(() => ({ success: false })),
        apiService.getSetting('eventDate').catch(() => ({ success: false }))
      ]);

      if (s1?.success) setBeerLimit(String(s1.setting?.settingValue ?? '2'));
      if (s2?.success) setSoftDrinkLimit(String(s2.setting?.settingValue ?? '2'));
      if (s3?.success) setEventName(String(s3.setting?.settingValue ?? ''));
      if (s4?.success) setEventDate(String(s4.setting?.settingValue ?? ''));
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveLimits = async () => {
    if (!canManage) return;

    try {
      const [r1, r2] = await Promise.all([
        apiService.updateSetting('beerLimit', { settingValue: parseInt(beerLimit || '2', 10) || 2 }),
        apiService.updateSetting('softDrinkLimit', { settingValue: parseInt(softDrinkLimit || '2', 10) || 2 })
      ]);

      if (r1?.success && r2?.success) {
        Toast.show({
          type: 'success',
          text1: 'Limits Updated',
          text2: 'Beverage limits updated successfully'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Failed to update limits'
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Settings Error',
        text2: getApiErrorMessage(e, 'Network or server error')
      });
    }
  };

  const saveEvent = async () => {
    if (!canManage) return;

    try {
      const [r1, r2] = await Promise.all([
        apiService.updateSetting('eventName', { settingValue: eventName }),
        apiService.updateSetting('eventDate', { settingValue: eventDate })
      ]);

      if (r1?.success && r2?.success) {
        Toast.show({
          type: 'success',
          text1: 'Event Updated',
          text2: 'Event information saved successfully'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Failed to update event information'
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Settings Error',
        text2: getApiErrorMessage(e, 'Network or server error')
      });
    }
  };

  const autoAssignEntitlements = async (participantType) => {
    if (!canManage) return;

    try {
      const res = await apiService.autoAssignEntitlements(participantType);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Auto-Assignment Complete',
          text2: `Updated ${res.updated || 0} participants`
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Auto-Assignment Failed',
          text2: res?.message || 'Failed to auto-assign entitlements'
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Auto-Assignment Error',
        text2: getApiErrorMessage(e, 'Network or server error')
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              // Extra bottom space so the Logout button clears the tab bar and home indicator
              24 + Math.max(insets.bottom, 16) + 64
          }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={48} color={colors.primary} />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.username || 'User'}
              </Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                {user?.role || 'Role'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Theme Settings */}
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={24}
                color={colors.primary}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Theme
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>
            </View>
            <Button
              title={isDark ? 'Light' : 'Dark'}
              onPress={toggleTheme}
              variant="secondary"
              style={styles.themeButton}
            />
          </View>
        </Card>

        {/* Beverage Limits Settings - Admin Only */}
        {canManage && (
          <Card style={styles.settingCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Beverage Limits Override
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Override the default limits for beer and soft drinks from their templates
            </Text>

            <View style={styles.limitsGrid}>
              <View style={styles.limitInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  🍺 Beer Limit Override
                </Text>
                <TextInput
                  value={beerLimit}
                  onChangeText={setBeerLimit}
                  placeholder="2"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.limitInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }
                  ]}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.limitInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  🥤 Soft Drink Limit Override
                </Text>
                <TextInput
                  value={softDrinkLimit}
                  onChangeText={setSoftDrinkLimit}
                  placeholder="2"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.limitInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }
                  ]}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              These settings override the template limits. Leave empty to use template defaults.
            </Text>

            <Button
              title="Save Limits"
              onPress={saveLimits}
              style={styles.saveButton}
            />
          </Card>
        )}

        {/* Event Settings - Admin Only */}
        {canManage && (
          <Card style={styles.settingCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Event Information
            </Text>

            <View style={styles.eventInputs}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Event Name
                </Text>
                <TextInput
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="Cricket Championship 2024"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }
                  ]}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Event Date
                </Text>
                <TextInput
                  value={eventDate}
                  onChangeText={setEventDate}
                  placeholder="2024-12-25"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background
                    }
                  ]}
                />
              </View>
            </View>

            <Button
              title="Save Event Details"
              onPress={saveEvent}
              style={styles.saveButton}
            />
          </Card>
        )}

        {/* Auto-Assign Entitlements - Admin Only */}
        {canManage && (
          <Card style={styles.settingCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Auto-Assign Entitlements
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Automatically assign default entitlements to participants based on templates
            </Text>

            <View style={styles.autoAssignButtons}>
              <Button
                title="Assign to All Participants"
                onPress={() => autoAssignEntitlements('all')}
                style={styles.autoAssignButton}
                variant="secondary"
              />
              <Button
                title="Assign to Players Only"
                onPress={() => autoAssignEntitlements('players')}
                style={styles.autoAssignButton}
                variant="secondary"
              />
              <Button
                title="Assign to Participants Only"
                onPress={() => autoAssignEntitlements('participants')}
                style={styles.autoAssignButton}
                variant="secondary"
              />
            </View>
          </Card>
        )}

        {/* Logout */}
        <Card style={styles.settingCard}>
          <Button
            title="Logout"
            onPress={logout}
            variant="destructive"
            style={styles.logoutButton}
          />
        </Card>

        {/* Spacer to ensure nothing is clipped under bottom nav */}
        <View style={{ height: Math.max(insets.bottom, 16) + 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    gap: 16
  },
  userCard: {
    padding: 16
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userDetails: {
    marginLeft: 16
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  userRole: {
    fontSize: 16,
    marginTop: 4
  },
  settingCard: {
    padding: 16
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingText: {
    marginLeft: 12
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2
  },
  themeButton: {
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20
  },
  limitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',             // allow wrapping on small screens to avoid overlap
    gap: 16,
    marginBottom: 12
  },
  limitInputContainer: {
    flexGrow: 1,
    flexBasis: '48%'              // two columns on wide, wraps to single on narrow
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6
  },
  limitInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 16
  },
  eventInputs: {
    gap: 0
  },
  autoAssignButtons: {
    gap: 8
  },
  autoAssignButton: {
    borderRadius: 8
  },
  saveButton: {
    borderRadius: 8
  },
  logoutButton: {
    borderRadius: 8
  }
});
