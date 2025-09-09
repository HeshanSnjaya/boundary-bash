import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService, getApiErrorMessage } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

export default function EntitlementTemplateScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('canManageSettings');

  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'food',
    isCountable: false,
    maxCount: 1,
    defaultForPlayers: false,
    defaultForParticipants: false,
  });

  const load = async () => {
    try {
      const res = await apiService.listTemplates();
      if (res?.success) setTemplates(res.templates || []);
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Templates', 
        text2: getApiErrorMessage(e, 'Failed to load') 
      });
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const createTemplate = async () => {
    if (!canManage) {
      return Toast.show({ 
        type: 'error', 
        text1: 'Access Denied', 
        text2: 'No permission to manage templates' 
      });
    }

    if (!form.name.trim()) {
      return Toast.show({ 
        type: 'error', 
        text1: 'Validation Error', 
        text2: 'Template name is required' 
      });
    }

    try {
      const res = await apiService.createTemplate(form);
      if (res?.success) {
        Toast.show({ 
          type: 'success', 
          text1: 'Template Created', 
          text2: `${form.name} template created successfully` 
        });
        setForm({
          name: '',
          description: '',
          category: 'food',
          isCountable: false,
          maxCount: 1,
          defaultForPlayers: false,
          defaultForParticipants: false,
        });
        load();
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Create Failed', 
          text2: res?.message || 'Failed to create template' 
        });
      }
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Create Error', 
        text2: getApiErrorMessage(e, 'Network or server error') 
      });
    }
  };

  const deleteTemplate = async (id) => {
    if (!canManage) return;

    try {
      const res = await apiService.deleteTemplate(id);
      if (res?.success) {
        Toast.show({ 
          type: 'success', 
          text1: 'Template Deleted', 
          text2: 'Template deactivated successfully' 
        });
        load();
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Delete Failed', 
          text2: res?.message || 'Failed to delete template' 
        });
      }
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Delete Error', 
        text2: getApiErrorMessage(e, 'Network or server error') 
      });
    }
  };

  const categories = ['food', 'beverage', 'merchandise', 'access', 'other'];

  if (!canManage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.noAccessCard}>
          <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
          <Text style={[styles.noAccessTitle, { color: colors.text }]}>
            Access Denied
          </Text>
          <Text style={[styles.noAccessText, { color: colors.textSecondary }]}>
            You don't have permission to manage entitlement templates.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Create Template Form */}
      <Card style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Entitlement Template
        </Text>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Template Name *</Text>
          <TextInput
            value={form.name}
            onChangeText={(text) => setForm(f => ({ ...f, name: text }))}
            placeholder="e.g., VIP Meal, Premium Drink"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            value={form.description}
            onChangeText={(text) => setForm(f => ({ ...f, description: text }))}
            placeholder="Optional description"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            multiline
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Button
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                onPress={() => setForm(f => ({ ...f, category }))}
                style={[
                  styles.categoryButton,
                  form.category === category && { backgroundColor: colors.primary }
                ]}
                variant={form.category === category ? 'primary' : 'secondary'}
              />
            ))}
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.switchSection}>
            <Text style={[styles.label, { color: colors.text }]}>Countable</Text>
            <Switch
              value={form.isCountable}
              onValueChange={(value) => setForm(f => ({ ...f, isCountable: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {form.isCountable && (
            <View style={styles.maxCountSection}>
              <Text style={[styles.label, { color: colors.text }]}>Max Count</Text>
              <TextInput
                value={String(form.maxCount)}
                onChangeText={(text) => setForm(f => ({ ...f, maxCount: parseInt(text, 10) || 1 }))}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                style={[styles.smallInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        <View style={styles.formRow}>
          <View style={styles.switchSection}>
            <Text style={[styles.label, { color: colors.text }]}>Default for Players</Text>
            <Switch
              value={form.defaultForPlayers}
              onValueChange={(value) => setForm(f => ({ ...f, defaultForPlayers: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.switchSection}>
            <Text style={[styles.label, { color: colors.text }]}>Default for Participants</Text>
            <Switch
              value={form.defaultForParticipants}
              onValueChange={(value) => setForm(f => ({ ...f, defaultForParticipants: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <Button
          title="Create Template"
          onPress={createTemplate}
          style={styles.createButton}
        />
      </Card>

      {/* Templates List */}
      <FlatList
        data={templates}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Card style={styles.templateCard}>
            <View style={styles.templateHeader}>
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.templateMeta, { color: colors.textSecondary }]}>
                  {item.category} • {item.isCountable ? `Max: ${item.maxCount}` : 'Single use'}
                </Text>
                {item.description && (
                  <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Button
                title="Delete"
                onPress={() => deleteTemplate(item._id)}
                style={styles.deleteButton}
                variant="destructive"
              />
            </View>

            <View style={styles.templateFooter}>
              <View style={styles.badges}>
                {item.defaultForPlayers && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Players</Text>
                  </View>
                )}
                {item.defaultForParticipants && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Participants</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.createdBy, { color: colors.textSecondary }]}>
                Created by {item.createdBy?.username || 'Unknown'}
              </Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={() => (
          <Card style={styles.emptyCard}>
            <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No entitlement templates found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first template to get started
            </Text>
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
  card: {
    padding: 20,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    width: 80,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  switchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maxCountSection: {
    alignItems: 'flex-start',
  },
  createButton: {
    marginTop: 8,
  },
  templateCard: {
    padding: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 14,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#3b82f615',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  createdBy: {
    fontSize: 12,
  },
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
