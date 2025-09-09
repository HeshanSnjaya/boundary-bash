import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';
import SafeScreen from '../components/SafeScreen';

export default function AttendanceScreen({ navigation }) {
  const { colors } = useTheme();

  const startScanning = () => {
    navigation.navigate('QRScanner', {
      title: 'Scan for Attendance',
      mode: 'attendance',
    });
  };

  return (
    <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <Card style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="qr-code-outline" size={48} color={colors.primary} />
            </View>
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>Mark Attendance</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Scan participant QR codes to mark attendance. Each scan will show participant details 
            and mark them as present automatically.
          </Text>
          
          <Button
            title="Start Scanning"
            onPress={startScanning}
            style={styles.scanButton}
            icon={() => <Ionicons name="scan" size={20} color="white" />}
          />
        </Card>

        {/* Instructions Card */}
        <Card style={styles.instructionCard}>
          <Text style={[styles.instructionTitle, { color: colors.text }]}>How It Works</Text>
          
          <View style={styles.instructionItem}>
            <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Scan participant QR code
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Ionicons name="person-outline" size={16} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              View participant details and attendance status
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Attendance marked automatically if valid
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Ionicons name="refresh-outline" size={16} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Tap floating button to scan next participant
            </Text>
          </View>
        </Card>

        {/* Features Card */}
        <Card style={styles.featuresCard}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="flash-outline" size={16} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Quick scanning with instant feedback
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Duplicate attendance prevention
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Real-time participant information display
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Attendance statistics tracking
            </Text>
          </View>
        </Card>

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Scanning Tips</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="sunny-outline" size={16} color={colors.warning || '#f59e0b'} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Ensure good lighting for better scanning
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="hand-left-outline" size={16} color={colors.warning || '#f59e0b'} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Hold the camera steady while scanning
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="resize-outline" size={16} color={colors.warning || '#f59e0b'} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Keep QR code within the scanning frame
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { 
    padding: 16,
    paddingBottom: 32,
  },
  
  // Main Card
  mainCard: { 
    alignItems: 'center',
    padding: 32,
    marginBottom: 20,
  },
  iconContainer: { 
    marginBottom: 24 
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 12 
  },
  description: { 
    fontSize: 16, 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 32 
  },
  scanButton: { 
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
  },
  
  // Instructions Card
  instructionCard: { 
    padding: 20,
    marginBottom: 20,
  },
  instructionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 16 
  },
  instructionItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12, 
    marginBottom: 12 
  },
  instructionText: { 
    fontSize: 14, 
    lineHeight: 20, 
    flex: 1 
  },

  // Features Card
  featuresCard: {
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1
  },

  // Tips Card
  tipsCard: {
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1
  },
});
