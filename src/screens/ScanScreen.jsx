import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import SafeScreen from '../components/SafeScreen';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ScanScreen({ navigation }) {
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();
  
  const canDistribute = hasPermission('canDistributeFood');
  const canMarkAttendance = hasPermission('canMarkAttendance');

  // FIXED: Proper navigation to Distribution screen with participant ID
  const openDistributionScanner = () => {
    console.log('Opening distribution scanner');
    navigation.navigate('QRScanner', {
      title: 'Scan for Food Distribution',
      mode: 'distribution',
      onScan: (participantId) => {
        console.log('Distribution scan callback called with ID:', participantId);
        // Navigate to Distribution screen and STAY there
        navigation.navigate('Distribution', { participantId });
        // DO NOT call navigation.goBack() here!
      },
    });
  };

  const openAttendanceScanner = () => {
    navigation.navigate('QRScanner', {
      title: 'Scan for Attendance',
      mode: 'attendance',
      onScan: async (participantId) => {
        try {
          const { apiService } = require('../services/api');
          const response = await apiService.markAttendance(participantId);
          if (response.success) {
            Toast.show({
              type: 'success',
              text1: 'Attendance Marked',
              text2: 'Successfully marked as present'
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Attendance Failed',
              text2: response.message || 'Could not mark attendance'
            });
          }
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Attendance Failed',
            text2: 'Could not mark attendance'
          });
        }
      },
    });
  };

  return (
    <SafeScreen>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.scanIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="qr-code" size={60} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            QR Code Scanner
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {user?.role === 'gate' 
              ? 'Scan participant QR codes to mark attendance'
              : user?.role === 'food' 
              ? 'Scan participant QR codes to distribute entitlements'
              : 'Scan QR codes for attendance and distribution'
            }
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          {canMarkAttendance && (
            <Button
              title="Mark Attendance"
              onPress={openAttendanceScanner}
              style={[styles.primaryButton, { backgroundColor: colors.success }]}
              icon={() => <Ionicons name="checkmark-circle" size={20} color="white" />}
            />
          )}
          
          {canDistribute && (
            <Button
              title="Distribute Entitlements"
              onPress={openDistributionScanner}
              style={styles.primaryButton}
              icon={() => <Ionicons name="restaurant" size={20} color="white" />}
            />
          )}
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Scan</Text>
          </View>
          
          <View style={styles.stepsContainer}>
            {[
              { step: '1', icon: 'camera-outline', title: 'Open Scanner', description: 'Tap the action button above' },
              { step: '2', icon: 'qr-code-outline', title: 'Position QR Code', description: 'Center the QR code in the frame' },
              { step: '3', icon: 'flash-outline', title: 'Auto Scan', description: 'Code will be detected automatically' },
              { step: '4', icon: 'checkmark-circle-outline', title: 'View Details', description: 'Participant details will load automatically' },
            ].map((item, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNumberText, { color: 'white' }]}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepHeader}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <Text style={[styles.stepTitle, { color: colors.text }]}>{item.title}</Text>
                  </View>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Additional Actions */}
        {(canDistribute || canMarkAttendance) && (
          <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Navigation</Text>
            <View style={styles.actionsGrid}>
              <Button
                title="View Participants"
                onPress={() => navigation.navigate('Participants')}
                variant="secondary"
                style={styles.actionButton}
                icon={() => <Ionicons name="people-outline" size={16} color={colors.primary} />}
              />
              <Button
                title="Dashboard"
                onPress={() => navigation.navigate('Dashboard')}
                variant="secondary"
                style={styles.actionButton}
                icon={() => <Ionicons name="analytics-outline" size={16} color={colors.primary} />}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { 
    padding: 16, 
    gap: 16,
    paddingBottom: 32,
  },
  heroCard: { 
    padding: 32, 
    alignItems: 'center', 
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scanIconContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  heroTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  heroSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  primaryButton: { 
    width: '100%', 
    borderRadius: 16, 
    paddingVertical: 16, 
    marginTop: 8 
  },
  instructionsCard: { 
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    gap: 8 
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  stepsContainer: { gap: 16 },
  stepItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12 
  },
  stepNumber: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 4 
  },
  stepNumberText: { fontSize: 14, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  stepTitle: { fontSize: 16, fontWeight: '600' },
  stepDescription: { fontSize: 14, lineHeight: 20 },
  actionsCard: { 
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionsGrid: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 12 
  },
  actionButton: { flex: 1, borderRadius: 12 },
});
