import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import SafeScreen from '../components/SafeScreen';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getDashboardStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceData = () => {
    if (!stats) return [];
    
    const present = stats.presentParticipants || 0;
    const absent = (stats.totalParticipants || 0) - present;
    
    return [
      {
        name: 'Present',
        population: present,
        color: colors.success,
        legendFontColor: colors.text,
        legendFontSize: 14,
      },
      {
        name: 'Absent',
        population: absent,
        color: colors.error,
        legendFontColor: colors.text,
        legendFontSize: 14,
      }
    ];
  };

  const getEntitlementData = () => {
    if (!stats?.entitlementStats) return [];
    
    const data = Object.entries(stats.entitlementStats).map(([name, stat], index) => {
      const colors_array = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
      return {
        name: name,
        population: stat.given || 0,
        color: colors_array[index % colors_array.length],
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    });
    
    return data.filter(item => item.population > 0);
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (loading) {
    return (
      <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Loading dashboard..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, styles.halfCard]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.totalParticipants || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Participants
            </Text>
          </Card>

          <Card style={[styles.statCard, styles.halfCard]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.presentParticipants || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Present
            </Text>
          </Card>

          <Card style={[styles.statCard, styles.halfCard]}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="star-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.totalPlayers || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Players
            </Text>
          </Card>

          <Card style={[styles.statCard, styles.halfCard]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="trophy-outline" size={24} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.presentPlayers || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Players Present
            </Text>
          </Card>
        </View>

        {/* Attendance Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Attendance Overview
          </Text>
          {getAttendanceData().length > 0 && (
            <PieChart
              data={getAttendanceData()}
              width={width - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
            />
          )}
          <View style={styles.attendanceStats}>
            <Text style={[styles.attendanceText, { color: colors.textSecondary }]}>
              {Math.round(((stats?.presentParticipants || 0) / (stats?.totalParticipants || 1)) * 100)}% attendance rate
            </Text>
          </View>
        </Card>

        {/* Entitlements Chart */}
        {getEntitlementData().length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Food Distribution
            </Text>
            <PieChart
              data={getEntitlementData()}
              width={width - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
            />
          </Card>
        )}

        {/* Entitlements Stats */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Distribution Status
        </Text>

        {stats?.entitlementStats && Object.entries(stats.entitlementStats).map(([name, stat]) => (
          <Card key={name} style={styles.entitlementCard}>
            <View style={styles.entitlementHeader}>
              <View style={[styles.entitlementIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons 
                  name={getEntitlementIcon(name)} 
                  size={20} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.entitlementInfo}>
                <Text style={[styles.entitlementName, { color: colors.text }]}>
                  {name}
                </Text>
                <Text style={[styles.entitlementStats, { color: colors.textSecondary }]}>
                  {stat.given} / {stat.totalEligible} distributed ({stat.percentage}%)
                </Text>
              </View>
              <Text style={[styles.entitlementCount, { color: colors.primary }]}>
                {stat.isCountable ? `${stat.totalCountGiven || stat.given}` : stat.given}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${stat.percentage || 0}%`
                  }
                ]} 
              />
            </View>
          </Card>
        ))}

        {/* Recent Activity */}
        {stats?.recentAttendance && stats.recentAttendance.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Attendance
            </Text>
            {stats.recentAttendance.slice(0, 5).map((participant, index) => (
              <Card key={index} style={styles.recentCard}>
                <View style={styles.recentHeader}>
                  <View style={[styles.recentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.recentAvatarText, { color: 'white' }]}>
                      {participant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentName, { color: colors.text }]}>
                      {participant.name}
                    </Text>
                    <Text style={[styles.recentId, { color: colors.textSecondary }]}>
                      ID: {participant.participantId}
                    </Text>
                  </View>
                  <View style={styles.recentBadges}>
                    {participant.isPlayer && (
                      <View style={styles.playerBadge}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                      </View>
                    )}
                    <Text style={[styles.recentTime, { color: colors.textMuted }]}>
                      {new Date(participant.attendanceTime).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const getEntitlementIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('beer') || lowerName.includes('drink')) return 'wine-outline';
  if (lowerName.includes('food') || lowerName.includes('meal')) return 'restaurant-outline';
  if (lowerName.includes('breakfast')) return 'cafe-outline';
  if (lowerName.includes('lunch')) return 'pizza-outline';
  return 'gift-outline';
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    padding: 16,
    alignItems: 'center',
  },
  halfCard: {
    width: (width - 44) / 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Charts
  chartCard: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  attendanceStats: {
    marginTop: 16,
  },
  attendanceText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Entitlements
  entitlementCard: {
    padding: 16,
    marginBottom: 12,
  },
  entitlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  entitlementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entitlementInfo: {
    flex: 1,
  },
  entitlementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entitlementStats: {
    fontSize: 14,
  },
  entitlementCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Recent Activity
  recentCard: {
    padding: 12,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentId: {
    fontSize: 12,
  },
  recentBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  playerBadge: {
    backgroundColor: '#f59e0b20',
    borderRadius: 10,
    padding: 2,
  },
  recentTime: {
    fontSize: 10,
  },
});
