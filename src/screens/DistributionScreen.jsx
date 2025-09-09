import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, getApiErrorMessage } from '../services/api';
import Card from '../components/Card';
import EnhancedButton from '../components/EnhancedButton';
import LoadingSpinner from '../components/LoadingSpinner';
import SafeScreen from '../components/SafeScreen';

export default function DistributionScreen({ route, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { participantId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [distributing, setDistributing] = useState({});
  const [undoing, setUndoing] = useState({});

  useEffect(() => {
    loadParticipantData();
    loadTemplates();
  }, []);

  const loadParticipantData = async () => {
    try {
      const response = await apiService.getParticipant(participantId);
      if (response.success) {
        setParticipant(response.participant);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load participant data',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getApiErrorMessage(error, 'Failed to load participant'),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.getEntitlementTemplatesWithLimits();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Load templates error:', error);
    }
  };

  const handleDistribute = async (entitlementName, count = 1) => {
    if (!participant?.isPresent) {
      Toast.show({
        type: 'warning',
        text1: 'Not Present',
        text2: 'Participant must be marked present first',
      });
      return;
    }

    setDistributing(prev => ({ ...prev, [entitlementName]: true }));
    
    try {
      const response = await apiService.distributeEntitlement(participantId, entitlementName, count);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${entitlementName} distributed successfully`,
        });
        loadParticipantData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Distribution Failed',
          text2: response.message || 'Could not distribute entitlement',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getApiErrorMessage(error, 'Distribution failed'),
      });
    } finally {
      setDistributing(prev => ({ ...prev, [entitlementName]: false }));
    }
  };

  const handleUndo = async (entitlementName, count = 1) => {
    Alert.alert(
      'Confirm Undo',
      `Are you sure you want to undo ${entitlementName} distribution?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: async () => {
            setUndoing(prev => ({ ...prev, [entitlementName]: true }));
            
            try {
              const response = await apiService.undoEntitlement(participantId, entitlementName, count);
              
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: `${entitlementName} distribution undone`,
                });
                loadParticipantData();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Undo Failed',
                  text2: response.message || 'Could not undo distribution',
                });
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: getApiErrorMessage(error, 'Undo failed'),
              });
            } finally {
              setUndoing(prev => ({ ...prev, [entitlementName]: false }));
            }
          }
        }
      ]
    );
  };

  const backToScanner = () => {
    navigation.goBack();
  };

  const renderEntitlementCard = (entitlement) => {
    const isDistributing = distributing[entitlement.name];
    const isUndoing = undoing[entitlement.name];
    const canDistribute = entitlement.given < entitlement.maxCount;
    const canUndo = entitlement.given > 0;
    
    return (
      <Card key={entitlement.name} style={styles.entitlementCard}>
        <View style={styles.entitlementHeader}>
          <View style={[
            styles.categoryIcon, 
            { backgroundColor: getCategoryColor(entitlement.category) + '20' }
          ]}>
            <Ionicons 
              name={getCategoryIcon(entitlement.category)} 
              size={24} 
              color={getCategoryColor(entitlement.category)} 
            />
          </View>
          
          <View style={styles.entitlementInfo}>
            <Text style={[styles.entitlementName, { color: colors.text }]}>
              {entitlement.name}
            </Text>
            {entitlement.description && (
              <Text style={[styles.entitlementDescription, { color: colors.textSecondary }]}>
                {entitlement.description}
              </Text>
            )}
            <Text style={[styles.entitlementCount, { color: colors.textMuted }]}>
              {entitlement.given} / {entitlement.maxCount} {entitlement.isCountable ? 'used' : 'given'}
            </Text>
          </View>
        </View>

        <View style={styles.entitlementActions}>
          {canDistribute && (
            <EnhancedButton
              title={isDistributing ? 'Distributing...' : 'Distribute'}
              variant="primary"
              onPress={() => handleDistribute(entitlement.name, 1)}
              disabled={isDistributing}
              style={styles.actionButton}
            />
          )}
          
          {canUndo && (
            <EnhancedButton
              title={isUndoing ? 'Undoing...' : 'Undo'}
              variant="secondary"
              onPress={() => handleUndo(entitlement.name, 1)}
              disabled={isUndoing}
              style={styles.actionButton}
            />
          )}
          
          {!canDistribute && !canUndo && (
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              Not available
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'food': return '#10b981';
      case 'beverage': return '#3b82f6';
      case 'merchandise': return '#f59e0b';
      case 'access': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return 'restaurant-outline';
      case 'beverage': return 'wine-outline';
      case 'merchandise': return 'gift-outline';
      case 'access': return 'key-outline';
      default: return 'help-circle-outline';
    }
  };

  if (loading) {
    return (
      <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Loading participant data..." />
      </SafeScreen>
    );
  }

  if (!participant) {
    return (
      <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.errorCard}>
          <Ionicons name="person-remove-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.error }]}>
            Participant Not Found
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            Could not load participant data
          </Text>
        </Card>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Participant Info */}
        <Card style={styles.participantCard}>
          <View style={styles.participantHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: 'white' }]}>
                {participant.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.participantInfo}>
              <Text style={[styles.participantName, { color: colors.text }]}>
                {participant.name}
              </Text>
              <Text style={[styles.participantEmail, { color: colors.textSecondary }]}>
                {participant.email}
              </Text>
              <Text style={[styles.participantId, { color: colors.textMuted }]}>
                ID: {participant.participantId}
              </Text>
            </View>

            <View style={styles.statusBadges}>
              {participant.isPlayer && (
                <View style={[styles.badge, styles.playerBadge]}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Player</Text>
                </View>
              )}
              
              <View style={[
                styles.badge, 
                participant.isPresent ? styles.presentBadge : styles.absentBadge
              ]}>
                <Ionicons 
                  name={participant.isPresent ? "checkmark-circle" : "close-circle"} 
                  size={12} 
                  color={participant.isPresent ? colors.success : colors.error} 
                />
                <Text style={[
                  styles.badgeText, 
                  { color: participant.isPresent ? colors.success : colors.error }
                ]}>
                  {participant.isPresent ? 'Present' : 'Absent'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Entitlements */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Food Distribution
        </Text>

        {participant.entitlements && participant.entitlements.length > 0 ? (
          participant.entitlements.map(renderEntitlementCard)
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Entitlements
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              This participant has no food entitlements assigned
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]}
        onPress={backToScanner}
        activeOpacity={0.8}
      >
        <Ionicons name="qr-code" size={24} color="white" />
      </TouchableOpacity>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { 
    padding: 16,
  },
  
  // Participant Card
  participantCard: { 
    padding: 20, 
    marginBottom: 20 
  },
  participantHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 16 
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  participantInfo: { flex: 1 },
  participantName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: 16,
    marginBottom: 4,
  },
  participantId: {
    fontSize: 14,
    marginBottom: 12,
  },
  statusBadges: { gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  playerBadge: { backgroundColor: '#f59e0b20' },
  presentBadge: { backgroundColor: '#10b98120' },
  absentBadge: { backgroundColor: '#ef444420' },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  
  // Entitlement Cards
  entitlementCard: {
    padding: 16,
    marginBottom: 12,
  },
  entitlementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entitlementInfo: { flex: 1 },
  entitlementName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  entitlementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  entitlementCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  entitlementActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    maxWidth: 120,
  },
  statusText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Empty State
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Error State
  errorCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
    margin: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
