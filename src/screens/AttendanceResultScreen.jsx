import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

export default function AttendanceResultScreen({ route, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { participantId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [resultType, setResultType] = useState(null);
  const [message, setMessage] = useState('');
  
  // Animations
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    processAttendance();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const processAttendance = async () => {
    setLoading(true);
    console.log('🔍 Processing attendance for participant ID:', participantId);
    
    try {
      const response = await apiService.markAttendance(participantId);
      console.log('📋 Attendance API response:', response);
      
      if (response.success) {
        console.log('✅ Attendance marked successfully');
        setResultType('success');
        setMessage(`Attendance marked successfully for ${response.participant.name}`);
        setParticipant(response.participant);
        
      } else if (response.error) {
        console.log('⚠️ Attendance error response:', response);
        
        if (response.status === 404 || response.code === 'PARTICIPANT_NOT_FOUND') {
          console.log('❌ Participant not found');
          setResultType('not_found');
          setMessage('Participant not found with this QR code');
          setParticipant(null);
          
        } else if (response.status === 400 || response.code === 'ATTENDANCE_ALREADY_MARKED') {
          console.log('🟡 Attendance already marked');
          setResultType('already_marked');
          setMessage(response.message || 'Attendance already marked');
          setParticipant(response.participant);
          
        } else {
          console.log('🔴 Other error:', response);
          setResultType('error');
          setMessage(response.message || 'Failed to mark attendance');
          setParticipant(response.participant || null);
        }
      } else {
        console.log('🤷 Unexpected response format:', response);
        setResultType('error');
        setMessage('Unexpected response from server');
        setParticipant(null);
      }
      
    } catch (error) {
      console.error('🚨 Attendance processing error:', error);
      setResultType('error');
      setMessage('Network error or server unavailable');
      setParticipant(null);
    } finally {
      setLoading(false);
    }
  };

  const backToScanner = () => {
    navigation.goBack();
  };

  const getResultConfig = () => {
    switch (resultType) {
      case 'success':
        return {
          iconName: 'checkmark-circle',
          iconColor: colors.success,
          iconBgColor: colors.success + '20',
          title: 'Attendance Marked!',
          titleColor: colors.success,
          cardStyle: styles.successCard
        };
      case 'already_marked':
        return {
          iconName: 'checkmark-done-circle',
          iconColor: colors.warning || '#f59e0b',
          iconBgColor: (colors.warning || '#f59e0b') + '20',
          title: 'Already Checked In',
          titleColor: colors.warning || '#f59e0b',
          cardStyle: styles.warningCard
        };
      case 'not_found':
        return {
          iconName: 'person-remove-outline',
          iconColor: colors.error,
          iconBgColor: colors.error + '20',
          title: 'Participant Not Found',
          titleColor: colors.error,
          cardStyle: styles.errorCard
        };
      case 'error':
      default:
        return {
          iconName: 'close-circle-outline',
          iconColor: colors.error,
          iconBgColor: colors.error + '20',
          title: 'Error',
          titleColor: colors.error,
          cardStyle: styles.errorCard
        };
    }
  };

  const renderParticipantDetails = () => {
    if (!participant) return null;

    return (
      <View style={styles.participantDetails}>
        <View style={[
          styles.avatarContainer, 
          { 
            backgroundColor: resultType === 'success' 
              ? colors.primary 
              : resultType === 'already_marked' 
                ? colors.warning || '#f59e0b'
                : colors.textSecondary 
          }
        ]}>
          <Text style={[styles.avatarText, { color: 'white' }]}>
            {(participant.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.detailsContent}>
          <Text style={[styles.participantName, { color: colors.text }]}>
            {participant.name || 'Unknown'}
          </Text>
          <Text style={[styles.participantEmail, { color: colors.textSecondary }]}>
            {participant.email || 'No email'}
          </Text>
          {participant.phone && (
            <Text style={[styles.participantPhone, { color: colors.textSecondary }]}>
              📞 {participant.phone}
            </Text>
          )}
          <Text style={[styles.participantId, { color: colors.textMuted }]}>
            ID: {participant.participantId || participantId}
          </Text>
          
          <View style={styles.statusBadges}>
            {participant.isPlayer && (
              <View style={[styles.badge, styles.playerBadge]}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Player</Text>
              </View>
            )}
            
            <View style={[
              styles.badge, 
              resultType === 'already_marked' ? styles.alreadyPresentBadge : styles.presentBadge
            ]}>
              <Ionicons 
                name={resultType === 'already_marked' ? "checkmark-done" : "checkmark-circle"} 
                size={12} 
                color={colors.success} 
              />
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {resultType === 'already_marked' ? 'Already Present' : 'Present'}
              </Text>
            </View>
          </View>

          {participant.foodPreference && participant.foodPreference !== 'no-preference' && (
            <Text style={[styles.foodPreference, { color: colors.textSecondary }]}>
              🍽️ Food: {participant.foodPreference}
            </Text>
          )}
          
          {participant.attendanceTime && (
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              🕒 {resultType === 'already_marked' 
                ? `Previously marked: ${new Date(participant.attendanceTime).toLocaleString()}`
                : `Marked at: ${new Date(participant.attendanceTime).toLocaleString()}`
              }
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Processing attendance..." />
      </View>
    );
  }

  const config = getResultConfig();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Card style={[styles.resultCard, config.cardStyle, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: config.iconBgColor }]}>
              <Ionicons name={config.iconName} size={width * 0.15} color={config.iconColor} />
            </View>
            
            <Text style={[styles.statusTitle, { color: config.titleColor }]}>
              {config.title}
            </Text>
            
            <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
              {message}
            </Text>
            
            {renderParticipantDetails()}
            
            {resultType === 'not_found' && (
              <View style={styles.notFoundInfo}>
                <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
                  QR Code: {participantId}
                </Text>
                <Text style={[styles.notFoundHint, { color: colors.textSecondary }]}>
                  Please verify the QR code is valid and try again
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]}
        onPress={backToScanner}
        activeOpacity={0.8}
      >
        <Ionicons name="qr-code" size={24} color="white" />
        <Text style={styles.fabText}>Scan Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.1,
  },
  resultContainer: {
    width: '100%',
    maxWidth: Math.min(width * 0.9, 400),
  },
  resultCard: {
    padding: Math.min(width * 0.08, 32),
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
  },
  successCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  errorCard: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  warningCard: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  iconContainer: {
    width: Math.min(width * 0.25, 120),
    height: Math.min(width * 0.25, 120),
    borderRadius: Math.min(width * 0.125, 60),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: Math.min(width * 0.07, 28),
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  participantDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  avatarContainer: {
    width: Math.min(width * 0.15, 60),
    height: Math.min(width * 0.15, 60),
    borderRadius: Math.min(width * 0.075, 30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: '700',
  },
  detailsContent: {
    flex: 1,
  },
  participantName: {
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: '700',
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: Math.min(width * 0.04, 16),
    marginBottom: 4,
  },
  participantPhone: {
    fontSize: Math.min(width * 0.035, 14),
    marginBottom: 4,
  },
  participantId: {
    fontSize: Math.min(width * 0.035, 14),
    marginBottom: 12,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playerBadge: {
    backgroundColor: '#f59e0b20',
  },
  presentBadge: {
    backgroundColor: '#10b98120',
  },
  alreadyPresentBadge: {
    backgroundColor: '#10b98120',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  foodPreference: {
    fontSize: Math.min(width * 0.035, 14),
    marginBottom: 8,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  notFoundInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: Math.min(width * 0.035, 14),
    fontWeight: '600',
    marginBottom: 4,
  },
  notFoundHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
