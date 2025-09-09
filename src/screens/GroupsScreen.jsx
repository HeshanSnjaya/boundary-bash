import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService, getApiErrorMessage } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('canManageSettings');
  const canDistribute = hasPermission('canDistributeFood');
  const canUndo = hasPermission('canUndoActions');

  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: '', color: '#007AFF', groupType: 'custom' });

  const load = async () => {
    try {
      const res = await apiService.listGroups();
      if (res?.success) setGroups(res.groups || []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Groups', text2: getApiErrorMessage(e, 'Failed to load') });
    }
  };

  useEffect(() => { load(); }, []);

  const createGroup = async () => {
    if (!canManage) return Toast.show({ type: 'error', text1: 'Access', text2: 'No permission' });
    try {
      const res = await apiService.createGroup(form);
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'Group', text2: 'Created' });
        setForm({ name: '', color: '#007AFF', groupType: 'custom' });
        load();
      } else Toast.show({ type: 'error', text1: 'Group', text2: res?.message || 'Failed' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Group', text2: getApiErrorMessage(e) });
    }
  };

  const distribute = async (groupId, payload) => {
    if (!canDistribute) return Toast.show({ type: 'error', text1: 'Access', text2: 'No permission' });
    try {
      const res = await apiService.distributeGroupEntitlement(groupId, payload);
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'Distribution', text2: res.message || 'Completed' });
      } else Toast.show({ type: 'error', text1: 'Distribution', text2: res?.message || 'Failed' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Distribution', text2: getApiErrorMessage(e) });
    }
  };

  const undo = async (groupId, payload) => {
    if (!canUndo) return Toast.show({ type: 'error', text1: 'Access', text2: 'No permission' });
    try {
      const res = await apiService.undoGroupEntitlement(groupId, payload);
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'Undo', text2: res.message || 'Completed' });
      } else Toast.show({ type: 'error', text1: 'Undo', text2: res?.message || 'Failed' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Undo', text2: getApiErrorMessage(e) });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {canManage && (
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>Create Group</Text>
          <TextInput
            value={form.name}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            placeholder="Group name"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Create" onPress={createGroup} />
          </View>
        </Card>
      )}

      <FlatList
        data={groups}
        keyExtractor={(g) => g._id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Card style={{ padding: 12 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{item.name}</Text>
            <Text style={{ color: colors.textSecondary }}>Members: {item.members?.length || 0}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {canDistribute && (
                <>
                  <Button title="Give Breakfast" onPress={() => distribute(item._id, { entitlementType: 'breakfast' })} />
                  <Button title="Give Lunch" onPress={() => distribute(item._id, { entitlementType: 'lunch' })} />
                  <Button title="Give Evening" onPress={() => distribute(item._id, { entitlementType: 'eveningMeal' })} />
                  <Button title="Give Beer x1" onPress={() => distribute(item._id, { entitlementType: 'beer', count: 1 })} />
                </>
              )}
              {canUndo && (
                <>
                  <Button title="Undo Breakfast" onPress={() => undo(item._id, { entitlementType: 'breakfast', count: 1 })} />
                  <Button title="Undo Lunch" onPress={() => undo(item._id, { entitlementType: 'lunch', count: 1 })} />
                </>
              )}
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
