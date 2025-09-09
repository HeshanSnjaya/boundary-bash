import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  const d = error?.response?.data;
  if (d?.message) return String(d.message);
  if (d?.code) return String(d.code);
  return error?.message || fallback;
};

class ApiService {
  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://collene-postosseous-oma.ngrok-free.app/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(async (config) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {}
      return config;
    });

    this.api.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error?.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(credentials) {
    const res = await this.api.post('/auth/login', credentials);
    const data = res.data;
    if (data?.success && data?.token) {
      await AsyncStorage.setItem('authToken', data.token);
    }
    return data;
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
  }

  // Dashboard
  async getDashboardStats() {
    return (await this.api.get('/dashboard/stats')).data;
  }

  // Participants (Dynamic)
  async addParticipant(participantData) {
    return (await this.api.post('/participants', participantData)).data;
  }

  async getParticipants(params) {
    return (await this.api.get('/participants', { params })).data;
  }

  async getParticipant(participantId) {
    return (await this.api.get(`/participants/${participantId}`)).data;
  }

  // Enhanced markAttendance with proper error handling
  async markAttendance(participantId) {
    try {
      const response = await this.api.post(`/participants/${participantId}/attendance`);
      return response.data;
    } catch (error) {
      // Don't throw - return structured error response for UI handling
      const errorData = error?.response?.data;
      return {
        success: false,
        error: true,
        status: error?.response?.status,
        code: errorData?.code || 'UNKNOWN_ERROR',
        message: errorData?.message || 'Failed to mark attendance',
        participant: errorData?.participant || null,
        originalError: error
      };
    }
  }

  async undoAttendance(participantId) {
    return (await this.api.delete(`/participants/${participantId}/attendance`)).data;
  }

  // Dynamic entitlement distribution
  async distributeEntitlement(participantId, entitlementName, count = 1) {
    return (await this.api.post(`/participants/${participantId}/entitlement`, { entitlementName, count })).data;
  }

  async undoEntitlement(participantId, entitlementName, count = 1) {
    return (await this.api.delete(`/participants/${participantId}/entitlement`, { data: { entitlementName, count } })).data;
  }

  async addEntitlementToParticipant(participantId, templateId, customMaxCount) {
    return (await this.api.post(`/participants/${participantId}/add-entitlement`, { templateId, customMaxCount })).data;
  }

  async removeEntitlementFromParticipant(participantId, entitlementName) {
    return (await this.api.delete(`/participants/${participantId}/remove-entitlement/${encodeURIComponent(entitlementName)}`)).data;
  }

  async autoAssignEntitlements(participantType = 'all') {
    return (await this.api.post('/participants/auto-assign-entitlements', { participantType })).data;
  }

  // Settings
  async getSettings() {
    return (await this.api.get('/settings')).data;
  }

  async getSetting(name) {
    return (await this.api.get(`/settings/${name}`)).data;
  }

  async updateSetting(name, body) {
    return (await this.api.put(`/settings/${name}`, body)).data;
  }

  async initializeSettings() {
    return (await this.api.post('/settings/initialize')).data;
  }

  // Templates
  async listTemplates() {
    return (await this.api.get('/entitlements/templates')).data;
  }

  async createTemplate(body) {
    return (await this.api.post('/entitlements/templates', body)).data;
  }

  async updateTemplate(id, body) {
    return (await this.api.put(`/entitlements/templates/${id}`, body)).data;
  }

  async deleteTemplate(id) {
    return (await this.api.delete(`/entitlements/templates/${id}`)).data;
  }

  // Dynamic templates with settings overrides
  async getEntitlementTemplatesWithLimits() {
    try {
      const [templatesRes, settingsRes] = await Promise.all([
        this.listTemplates().catch(() => ({ success: false, templates: [] })),
        this.getSettings().catch(() => ({ success: false, settings: [] }))
      ]);

      const templates = templatesRes.success ? (templatesRes.templates || []) : [];
      const settings = settingsRes.success ? (settingsRes.settings || []) : [];

      // Create settings lookup with safety checks
      const settingsLookup = {};
      if (Array.isArray(settings)) {
        settings.forEach(setting => {
          if (setting && setting.settingName && setting.settingValue !== undefined) {
            settingsLookup[setting.settingName] = setting.settingValue;
          }
        });
      }

      // Apply limit overrides to templates with safety checks
      const templatesWithLimits = Array.isArray(templates) ? templates.map(template => {
        if (!template || !template.name) {
          return template;
        }

        const overrideSetting = this.getLimitOverrideSetting(template.name);
        if (overrideSetting && settingsLookup[overrideSetting] !== undefined) {
          return {
            ...template,
            effectiveMaxCount: settingsLookup[overrideSetting]
          };
        }

        return {
          ...template,
          effectiveMaxCount: template.maxCount || 1
        };
      }) : [];

      return { templates: templatesWithLimits, settings: settingsLookup };
    } catch (error) {
      console.error('getEntitlementTemplatesWithLimits error:', error);
      return { templates: [], settings: {} };
    }
  }

  getLimitOverrideSetting(entitlementName) {
    const mappings = {
      'beer': 'beerLimit',
      'soft drinks': 'softDrinkLimit',
      'soft drink': 'softDrinkLimit'
    };
    return mappings[entitlementName.toLowerCase()] || null;
  }

  // Users (admin)
  async createUser({ username, password, role }) {
    return (await this.api.post('/auth/create-user', { username, password, role })).data;
  }

  async listUsers() {
    return (await this.api.get('/auth/users')).data;
  }

  async setUserStatus(userId, isActive) {
    return (await this.api.patch(`/auth/users/${userId}/status`, { isActive })).data;
  }

  // Groups
  async listGroups() {
    return (await this.api.get('/groups')).data;
  }

  async createGroup(body) {
    return (await this.api.post('/groups', body)).data;
  }

  async updateGroup(groupId, body) {
    return (await this.api.put(`/groups/${groupId}`, body)).data;
  }

  async deleteGroup(groupId) {
    return (await this.api.delete(`/groups/${groupId}`)).data;
  }

  async addGroupMembers(groupId, participantIds) {
    return (await this.api.post(`/groups/${groupId}/members`, { participantIds })).data;
  }

  async removeGroupMember(groupId, participantId) {
    return (await this.api.delete(`/groups/${groupId}/members/${participantId}`)).data;
  }

  async distributeGroupEntitlement(groupId, payload) {
    return (await this.api.post(`/groups/${groupId}/distribute`, payload)).data;
  }

  async undoGroupEntitlement(groupId, payload) {
    return (await this.api.delete(`/groups/${groupId}/undo`, { data: payload })).data;
  }
}

export const apiService = new ApiService();
export default apiService;
