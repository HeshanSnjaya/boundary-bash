import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, Switch } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService, getApiErrorMessage } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

export default function UsersScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('canManageUsers');

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'gate' });

  const load = async () => {
    try {
      const res = await apiService.listUsers();
      if (res?.success) setUsers(res.users || []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Users', text2: getApiErrorMessage(e, 'Failed to load') });
    }
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!canManage) return Toast.show({ type: 'error', text1: 'Access', text2: 'No permission' });
    try {
      const res = await apiService.createUser(form);
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'User', text2: 'Created' });
        setForm({ username: '', password: '', role: 'gate' });
        load();
      } else Toast.show({ type: 'error', text1: 'User', text2: res?.message || 'Failed' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'User', text2: getApiErrorMessage(e) });
    }
  };

  const toggleStatus = async (u) => {
    if (!canManage) return;
    try {
      const res = await apiService.setUserStatus(u.id || u._id, !u.isActive);
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'User', text2: res?.message || 'Status updated' });
        load();
      } else Toast.show({ type: 'error', text1: 'User', text2: res?.message || 'Failed' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'User', text2: getApiErrorMessage(e) });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {canManage && (
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>Create User</Text>
          <TextInput
            value={form.username}
            onChangeText={(t) => setForm((f) => ({ ...f, username: t }))}
            placeholder="Username"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            autoCapitalize="none"
          />
          <TextInput
            value={form.password}
            onChangeText={(t) => setForm((f) => ({ ...f, password: t }))}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            secureTextEntry
          />
          <TextInput
            value={form.role}
            onChangeText={(t) => setForm((f) => ({ ...f, role: t }))}
            placeholder='Role ("gate" or "food")'
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            autoCapitalize="none"
          />
          <Button title="Create" onPress={createUser} />
        </Card>
      )}

      <FlatList
        data={users}
        keyExtractor={(u) => u.id || u._id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Card style={{ padding: 12 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{item.username}</Text>
            <Text style={{ color: colors.textSecondary }}>Role: {item.role}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Text style={{ color: colors.textSecondary }}>Active</Text>
              <Switch value={!!item.isActive} onValueChange={() => toggleStatus(item)} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, margin: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
});
