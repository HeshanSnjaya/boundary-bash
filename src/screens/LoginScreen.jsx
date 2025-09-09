import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { getApiErrorMessage } from '../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const disabled = !username.trim() || !password.trim() || loading;

  const onSubmit = async () => {
    if (disabled) return;
    
    try {
      const res = await login({ username, password });
      if (!res?.success) {
        Toast.show({ 
          type: 'error', 
          text1: 'Login Failed', 
          text2: res?.message || 'Invalid credentials' 
        });
      }
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Login Error', 
        text2: getApiErrorMessage(e, 'Network error occurred') 
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="trophy" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>
            Boundary Bash
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Event Management System
          </Text>
        </View>

        {/* Login Card */}
        <Card style={[
          styles.loginCard, 
          { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.3 : 0.1,
          }
        ]}>
          <Text style={[styles.loginTitle, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.loginSubtitle, { color: colors.textSecondary }]}>
            Sign in to access your dashboard
          </Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Username
            </Text>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surface || '#1f2937' : '#ffffff',
              }
            ]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={colors.textMuted} 
                style={styles.inputIcon}
              />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Password
            </Text>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surface || '#1f2937' : '#ffffff',
              }
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={colors.textMuted} 
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { color: colors.text }]}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <Button
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={onSubmit}
            loading={loading}
            disabled={disabled}
            style={[
              styles.signInButton,
              disabled && { opacity: 0.6 }
            ]}
          />

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Need help? Contact your administrator for access credentials.
            </Text>
          </View>
        </Card>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Secure • Protected • Authorized Access Only
          </Text>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: '100%',
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Login Card
  loginCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: Math.min(width - 40, 400),
    alignSelf: 'center',
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  
  // Inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  passwordToggle: {
    padding: 4,
  },
  
  // Button
  signInButton: {
    marginTop: 8,
    marginBottom: 20,
    height: 52,
    borderRadius: 12,
  },
  
  // Help
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Footer
  footerContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
