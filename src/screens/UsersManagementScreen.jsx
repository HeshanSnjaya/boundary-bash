import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, Switch, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService, getApiErrorMessage } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import SafeScreen from '../components/SafeScreen';

export default function UsersManagementScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();
  const canManageUsers = hasPermission('canManageUsers');
  const canManageSettings = hasPermission('canManageSettings');

  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'participants'
  const [loading, setLoading] = useState(true);
  
  // Users management state
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'gate'
  });

  // Participants management state
  const [participantForm, setParticipantForm] = useState({
    name: '',
    email: '',
    phone: '',
    isPlayer: false,
    foodPreference: 'no-preference',
    sendEmail: true
  });

  const foodPreferences = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'chicken', label: 'Chicken' },
    { value: 'fish', label: 'Fish' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'no-preference', label: 'No Preference' }
  ];

  const roles = [
    { value: 'gate', label: 'Gate (Attendance Only)', description: 'Can only mark attendance' },
    { value: 'food', label: 'Food (Distribution Only)', description: 'Can only distribute food' },
  ];

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    if (!canManageUsers) return;
    
    setLoading(true);
    try {
      const res = await apiService.listUsers();
      if (res?.success) {
        setUsers(res.users || []);
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Load Failed',
        text2: getApiErrorMessage(e, 'Failed to load users'),
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!canManageUsers) {
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'No permission to manage users'
      });
      return;
    }

    if (!userForm.username.trim() || !userForm.password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Username and password are required'
      });
      return;
    }

    try {
      const res = await apiService.createUser(userForm);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'User Created',
          text2: `${userForm.username} created successfully`
        });
        setUserForm({ username: '', password: '', role: 'gate' });
        loadUsers();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Creation Failed',
          text2: res?.message || 'Failed to create user'
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Creation Error',
        text2: getApiErrorMessage(e, 'Network or server error')
      });
    }
  };

  const createParticipant = async () => {
    if (!canManageSettings) {
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'No permission to add participants'
      });
      return;
    }

    if (!participantForm.name.trim() || !participantForm.email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Name and email are required'
      });
      return;
    }

    try {
      const res = await apiService.addParticipant(participantForm);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Participant Added',
          text2: `${participantForm.name} added successfully`
        });
        setParticipantForm({
          name: '',
          email: '',
          phone: '',
          isPlayer: false,
          foodPreference: 'no-preference',
          sendEmail: true
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Addition Failed',
          text2: res?.message || 'Failed to add participant'
        });
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Addition Error',
        text2: getApiErrorMessage(e, 'Network or server error')
      });
    }
  };

  const toggleUserStatus = async (user) => {
    if (!canManageUsers) return;

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiService.setUserStatus(user.id || user._id, !user.isActive);
              if (res?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Status Updated',
                  text2: res?.message || 'User status updated'
                });
                loadUsers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Update Failed',
                  text2: res?.message || 'Failed to update status'
                });
              }
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Update Error',
                text2: getApiErrorMessage(e, 'Network or server error')
              });
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={[styles.roleIndicator, { 
          backgroundColor: item.role === 'gate' ? colors.primary + '20' : colors.success + '20' 
        }]}>
          <Ionicons 
            name={item.role === 'gate' ? 'scan-outline' : 'restaurant-outline'} 
            size={20} 
            color={item.role === 'gate' ? colors.primary : colors.success} 
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.username}</Text>
          <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
            {roles.find(r => r.value === item.role)?.label || item.role}
          </Text>
          <Text style={[styles.itemSubDetail, { color: colors.textMuted }]}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Active</Text>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleUserStatus(item)}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={item.isActive ? colors.background : colors.textSecondary}
            />
          </View>
        </View>
      </View>
      <Text style={[styles.itemDescription, { color: colors.textMuted }]}>
        {roles.find(r => r.value === item.role)?.description || 'System user'}
      </Text>
    </Card>
  );

  if (!canManageUsers && !canManageSettings) {
    return (
      <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.noAccessCard}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.noAccessTitle, { color: colors.text }]}>Access Denied</Text>
          <Text style={[styles.noAccessText, { color: colors.textSecondary }]}>
            You don't have permission to manage users or participants.
          </Text>
        </Card>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Button
          title="System Users"
          variant={activeTab === 'users' ? 'primary' : 'secondary'}
          onPress={() => setActiveTab('users')}
          style={[styles.tabButton, activeTab === 'users' && { backgroundColor: colors.primary }]}
          disabled={!canManageUsers}
        />
        <Button
          title="Add Participants"
          variant={activeTab === 'participants' ? 'primary' : 'secondary'}
          onPress={() => setActiveTab('participants')}
          style={[styles.tabButton, activeTab === 'participants' && { backgroundColor: colors.primary }]}
          disabled={!canManageSettings}
        />
      </View>

      {activeTab === 'users' && canManageUsers && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Create User Form */}
          <Card style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Create System User</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Username *</Text>
              <TextInput
                value={userForm.username}
                onChangeText={(text) => setUserForm(f => ({ ...f, username: text }))}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password *</Text>
              <TextInput
                value={userForm.password}
                onChangeText={(text) => setUserForm(f => ({ ...f, password: text }))}
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Role *</Text>
              <View style={styles.roleGrid}>
                {roles.map((role) => (
                  <Button
                    key={role.value}
                    title={role.label}
                    variant={userForm.role === role.value ? 'primary' : 'secondary'}
                    onPress={() => setUserForm(f => ({ ...f, role: role.value }))}
                    style={[styles.roleButton, userForm.role === role.value && { backgroundColor: colors.primary }]}
                  />
                ))}
              </View>
              <Text style={[styles.helperText, { color: colors.textMuted }]}>
                {roles.find(r => r.value === userForm.role)?.description}
              </Text>
            </View>

            <Button
              title="Create User"
              onPress={createUser}
              style={styles.submitButton}
            />
          </Card>

          {/* Users List */}
          {loading ? (
            <LoadingSpinner message="Loading users..." />
          ) : (
            <View style={styles.listSection}>
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id || item._id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <Card style={styles.emptyCard}>
                    <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Users Found</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Create your first system user to get started
                    </Text>
                  </Card>
                )}
              />
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'participants' && canManageSettings && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Create Participant Form */}
          <Card style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Add Single Participant</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name *</Text>
              <TextInput
                value={participantForm.name}
                onChangeText={(text) => setParticipantForm(f => ({ ...f, name: text }))}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email *</Text>
              <TextInput
                value={participantForm.email}
                onChangeText={(text) => setParticipantForm(f => ({ ...f, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone</Text>
              <TextInput
                value={participantForm.phone}
                onChangeText={(text) => setParticipantForm(f => ({ ...f, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Player Status</Text>
              <Switch
                value={participantForm.isPlayer}
                onValueChange={(value) => setParticipantForm(f => ({ ...f, isPlayer: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={participantForm.isPlayer ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Food Preference</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.preferenceScrollView}
                contentContainerStyle={styles.preferenceGrid}
              >
                {foodPreferences.map((pref) => (
                  <Button
                    key={pref.value}
                    title={pref.label}
                    variant={participantForm.foodPreference === pref.value ? 'primary' : 'secondary'}
                    onPress={() => setParticipantForm(f => ({ ...f, foodPreference: pref.value }))}
                    style={[styles.preferenceButton, 
                      participantForm.foodPreference === pref.value && { backgroundColor: colors.primary }
                    ]}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.switchContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Send QR Code Email</Text>
              <Switch
                value={participantForm.sendEmail}
                onValueChange={(value) => setParticipantForm(f => ({ ...f, sendEmail: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={participantForm.sendEmail ? colors.background : colors.textSecondary}
              />
            </View>

            <Button
              title="Add Participant"
              onPress={createParticipant}
              style={styles.submitButton}
            />
          </Card>
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
  },
  
  // Forms
  formCard: { padding: 20, margin: 16, marginBottom: 8 },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Grids
  roleGrid: {
    gap: 8,
    marginBottom: 8,
  },
  roleButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  preferenceScrollView: {
    marginBottom: 8,
  },
  preferenceGrid: {
    gap: 8,
    paddingRight: 16,
  },
  preferenceButton: {
    minWidth: 120,
    borderRadius: 8,
    paddingVertical: 8,
  },
  
  // Submit
  submitButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  
  // List
  listSection: { flex: 1, marginHorizontal: 16 },
  itemCard: { padding: 16, marginBottom: 12 },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  itemDetail: { fontSize: 14, marginBottom: 2 },
  itemSubDetail: { fontSize: 12 },
  itemDescription: { fontSize: 12, lineHeight: 16, marginLeft: 52 },
  itemActions: { alignItems: 'flex-end' },
  statusContainer: { alignItems: 'center', gap: 4 },
  statusLabel: { fontSize: 12 },
  
  // Empty states
  noAccessCard: {
    margin: 16,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  noAccessText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
