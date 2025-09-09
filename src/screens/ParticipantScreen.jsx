import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService, getApiErrorMessage } from '../services/api';
import { getEntitlementDisplayInfo, isCommonEntitlement, getLimitOverrideSetting } from '../utils/EntitlementConfig';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ParticipantScreen() {
  const [participants, setParticipants] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState([]);

  const { colors } = useTheme();
  const { hasPermission } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [searchText, participants]);

  const loadData = async () => {
    try {
      const [participantsRes, templatesData] = await Promise.all([
        apiService.getParticipants(),
        apiService.getEntitlementTemplatesWithLimits().catch(() => ({ templates: [], settings: {} }))
      ]);

      if (participantsRes.success) {
        setParticipants(participantsRes.participants || []);
      }

      if (templatesData) {
        setTemplates(templatesData.templates || []);
        setSettings(templatesData.settings || {});
      }
    } catch (error) {
      console.error('Load data error:', error);
      Toast.show({
        type: 'error',
        text1: '🔥 Load Error',
        text2: getApiErrorMessage(error, 'Failed to load data'),
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterParticipants = () => {
    if (!searchText || !searchText.trim()) {
      setFilteredParticipants(participants);
      return;
    }

    const q = searchText.toLowerCase();
    const filtered = participants.filter(p => {
      try {
        return (p.name && p.name.toLowerCase().includes(q)) ||
               (p.email && p.email.toLowerCase().includes(q)) ||
               (p.participantId && p.participantId.toLowerCase().includes(q));
      } catch (error) {
        console.warn('Filter error for participant:', p, error);
        return false;
      }
    });
    setFilteredParticipants(filtered);
  };

  const markAttendance = async (participantId) => {
    try {
      const res = await apiService.markAttendance(participantId);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Attendance Marked',
          text2: 'Successfully marked as present',
          visibilityTime: 2000,
        });
        onRefresh();
      } else {
        Toast.show({
          type: 'error',
          text1: '❌ Attendance Failed',
          text2: res?.message || 'Could not mark attendance',
          visibilityTime: 3000,
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: '🔥 Attendance Error',
        text2: getApiErrorMessage(e, 'Network error occurred'),
        visibilityTime: 3000,
      });
    }
  };

  const distributeEntitlement = async (participantId, entitlementName, count = 1) => {
    try {
      const res = await apiService.distributeEntitlement(participantId, entitlementName, count);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: '🎉 Distributed',
          text2: `${entitlementName}${count > 1 ? ` x${count}` : ''} distributed`,
          visibilityTime: 2000,
        });
        onRefresh();
      } else {
        Toast.show({
          type: 'error',
          text1: '❌ Distribution Failed',
          text2: res?.message || 'Could not distribute',
          visibilityTime: 3000,
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: '🔥 Distribution Error',
        text2: getApiErrorMessage(e, 'Network error occurred'),
        visibilityTime: 3000,
      });
    }
  };

  const getEntitlementStatus = (entitlement) => {
    const overrideSetting = getLimitOverrideSetting(entitlement.name);
    const effectiveMaxCount = overrideSetting && settings[overrideSetting]
      ? settings[overrideSetting]
      : entitlement.maxCount || 1;

    const currentCount = entitlement.given || 0;

    if (entitlement.isCountable) {
      const isLimitReached = currentCount >= effectiveMaxCount;
      return {
        isComplete: isLimitReached,
        canDistribute: !isLimitReached,
        displayText: `${currentCount}/${effectiveMaxCount}`,
        progress: (currentCount / effectiveMaxCount) * 100,
        color: isLimitReached ? colors.success : colors.primary,
        bgColor: isLimitReached ? colors.success + '20' : colors.primary + '20',
      };
    } else {
      const isGiven = currentCount > 0;
      return {
        isComplete: isGiven,
        canDistribute: !isGiven,
        displayText: isGiven ? 'Given' : 'Available',
        progress: isGiven ? 100 : 0,
        color: isGiven ? colors.success : colors.textSecondary,
        bgColor: isGiven ? colors.success + '20' : colors.card,
      };
    }
  };

  const renderEntitlementBadge = (entitlement) => {
    if (!entitlement || !entitlement.name) return null;

    const displayInfo = getEntitlementDisplayInfo(entitlement.name, entitlement.category);
    const status = getEntitlementStatus(entitlement);

    return (
      <View
        key={entitlement.name}
        style={[styles.entitlementBadge, {
          backgroundColor: status.bgColor,
          borderColor: status.color,
        }]}
      >
        <Ionicons
          name={displayInfo.icon}
          size={16}
          color={status.color}
        />
        <View style={styles.entitlementBadgeContent}>
          <Text style={[styles.entitlementBadgeName, { color: status.color }]}>
            {entitlement.name}
          </Text>
          <Text style={[styles.entitlementBadgeStatus, { color: status.color }]}>
            {status.displayText}
          </Text>
        </View>
        {status.isComplete && (
          <Ionicons name="checkmark-circle" size={16} color={status.color} />
        )}
      </View>
    );
  };

  const renderParticipant = ({ item }) => {
    if (!item) return null;

    try {
      const participantEntitlements = Array.isArray(item.entitlements) ? item.entitlements : [];
      const foodBeverageEntitlements = participantEntitlements.filter(ent => 
        ent && ent.name && isCommonEntitlement(ent.name, ent.category)
      );
      const otherEntitlements = participantEntitlements.filter(ent => 
        ent && ent.name && !isCommonEntitlement(ent.name, ent.category)
      );

      const completedEntitlements = participantEntitlements.filter(ent => {
        const status = getEntitlementStatus(ent);
        return status.isComplete;
      }).length;

      const totalEntitlements = participantEntitlements.length;
      const completionPercentage = totalEntitlements > 0 ? (completedEntitlements / totalEntitlements) * 100 : 0;

      return (
        <Card style={styles.participantCard}>
          {/* Header */}
          <View style={styles.participantHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(item.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.participantInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.participantName, { color: colors.text }]}>
                  {item.name || 'Unknown Name'}
                </Text>
                <View style={styles.statusBadges}>
                  {item.isPresent && (
                    <View style={[styles.statusBadge, styles.presentBadge]}>
                      <Ionicons name="checkmark" size={12} color="#10b981" />
                      <Text style={[styles.statusText, { color: '#10b981' }]}>Present</Text>
                    </View>
                  )}
                  {item.isPlayer && (
                    <View style={[styles.statusBadge, styles.playerBadge]}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={[styles.statusText, { color: '#f59e0b' }]}>Player</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.participantEmail, { color: colors.textSecondary }]}>
                {item.email || 'No email'}
              </Text>
              <Text style={[styles.participantId, { color: colors.textSecondary }]}>
                ID: {item.participantId || 'No ID'}
              </Text>
            </View>
          </View>

          {/* Progress */}
          {totalEntitlements > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>
                  Entitlement Progress
                </Text>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {completedEntitlements}/{totalEntitlements} completed
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[styles.progressFill, {
                    width: `${completionPercentage}%`,
                    backgroundColor: completionPercentage === 100 ? colors.success : colors.primary,
                  }]}
                />
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            {/* Attendance */}
            {hasPermission('canMarkAttendance') && !item.isPresent && (
              <Button
                title="Mark Attendance"
                onPress={() => markAttendance(item.participantId)}
                style={styles.attendanceButton}
                variant="primary"
                icon={() => <Ionicons name="person-add" size={16} color="white" />}
              />
            )}

            {/* Quick Actions */}
            {hasPermission('canDistributeFood') && item.isPresent && (
              <View style={styles.quickActions}>
                <Text style={[styles.quickActionsLabel, { color: colors.text }]}>Quick Actions</Text>
                <View style={styles.quickButtonsRow}>
                  {foodBeverageEntitlements.slice(0, 3).map((entitlement) => {
                    const status = getEntitlementStatus(entitlement);
                    return (
                      <Button
                        key={entitlement.name}
                        title={entitlement.name.split(' ')[0]}
                        onPress={() => distributeEntitlement(item.participantId, entitlement.name, 1)}
                        disabled={!status.canDistribute}
                        style={[styles.quickButton, {
                          backgroundColor: status.canDistribute ? colors.primary : colors.border,
                        }]}
                        textStyle={{
                          color: status.canDistribute ? 'white' : colors.textSecondary,
                          fontSize: 12,
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Entitlements */}
          {participantEntitlements.length > 0 && (
            <View style={styles.entitlementsSection}>
              {foodBeverageEntitlements.length > 0 && (
                <View style={styles.entitlementGroup}>
                  <Text style={[styles.entitlementGroupTitle, { color: colors.text }]}>
                    Food & Beverages
                  </Text>
                  <View style={styles.entitlementBadges}>
                    {foodBeverageEntitlements.map(renderEntitlementBadge)}
                  </View>
                </View>
              )}

              {otherEntitlements.length > 0 && (
                <View style={styles.entitlementGroup}>
                  <Text style={[styles.entitlementGroupTitle, { color: colors.text }]}>
                    Special Entitlements
                  </Text>
                  <View style={styles.entitlementBadges}>
                    {otherEntitlements.map(renderEntitlementBadge)}
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>
      );
    } catch (error) {
      console.error('Error rendering participant:', error, item);
      return (
        <Card style={styles.errorCard}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Error loading participant data
          </Text>
        </Card>
      );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const presentCount = participants.filter(p => p && p.isPresent).length;
  const playerCount = participants.filter(p => p && p.isPlayer).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{participants.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{presentCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{playerCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Players</Text>
          </View>
        </View>
      </Card>

      {/* Search */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by name, email, or ID..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchText.length > 0 && (
            <Button
              title="Clear"
              onPress={() => setSearchText('')}
              style={styles.clearButton}
              variant="ghost"
            />
          )}
        </View>
      </Card>

      {/* Participants List */}
      <FlatList
        data={filteredParticipants}
        keyExtractor={(item, index) => item?.participantId || `participant-${index}`}
        renderItem={renderParticipant}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchText ? 'No participants match your search.' : 'No participants found.'}
            </Text>
            {!searchText && (
              <Button
                title="Refresh"
                onPress={onRefresh}
                style={styles.refreshButton}
                variant="secondary"
              />
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  searchCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  participantCard: {
    marginBottom: 12,
    padding: 16,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  participantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  presentBadge: {
    backgroundColor: '#10b98120',
  },
  playerBadge: {
    backgroundColor: '#f59e0b20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  participantEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  participantId: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsSection: {
    marginBottom: 12,
    gap: 12,
  },
  attendanceButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  quickActions: {
    gap: 8,
  },
  quickActionsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  entitlementsSection: {
    gap: 12,
  },
  entitlementGroup: {
    gap: 8,
  },
  entitlementGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  entitlementBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  entitlementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  entitlementBadgeContent: {
    alignItems: 'center',
  },
  entitlementBadgeName: {
    fontSize: 11,
    fontWeight: '600',
  },
  entitlementBadgeStatus: {
    fontSize: 10,
  },
  errorCard: {
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 8,
  },
});
