import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import AttendanceResultScreen from '../screens/AttendanceResultScreen';
import ParticipantScreen from '../screens/ParticipantScreen';
import ScanScreen from '../screens/ScanScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import DistributionScreen from '../screens/DistributionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EntitlementTemplateScreen from '../screens/EntitlementTemplateScreen';
import GroupsScreen from '../screens/GroupsScreen';
import UsersManagementScreen from '../screens/UsersManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Define header colors outside of component to avoid hook order issues
const getHeaderColor = (tabName, colors) => {
  switch (tabName) {
    case 'Dashboard': return colors.primary;
    case 'Attendance': return colors.success;
    case 'Scan': return colors.info || '#3b82f6';
    case 'Groups': return colors.warning || '#f59e0b';
    case 'Users': return colors.secondary || '#8b5cf6';
    case 'Participants': return colors.info || '#06b6d4';
    case 'Settings': return colors.textSecondary;
    default: return colors.primary;
  }
};

function TabNavigator() {
  const { colors } = useTheme();
  const { user, hasPermission } = useAuth();
  const insets = useSafeAreaInsets();

  const getTabsForRole = () => {
    const role = user?.role;
    const tabs = [
      {
        name: 'Dashboard',
        component: DashboardScreen,
        icon: 'analytics',
        iconOutline: 'analytics-outline',
        show: true
      }
    ];

    if (role === 'gate') {
      tabs.push({
        name: 'Attendance',
        component: AttendanceScreen,
        icon: 'checkmark-circle',
        iconOutline: 'checkmark-circle-outline',
        show: true
      });
    }

    if (role === 'food') {
      tabs.push({
        name: 'Scan',
        component: ScanScreen,
        icon: 'qr-code',
        iconOutline: 'qr-code-outline',
        show: true
      });
    }

    if (role === 'admin') {
      tabs.push(
        {
          name: 'Attendance',
          component: AttendanceScreen,
          icon: 'checkmark-circle',
          iconOutline: 'checkmark-circle-outline',
          show: true
        },
        {
          name: 'Scan',
          component: ScanScreen,
          icon: 'qr-code',
          iconOutline: 'qr-code-outline',
          show: true
        },
        {
          name: 'Groups',
          component: GroupsScreen,
          icon: 'people-circle',
          iconOutline: 'people-circle-outline',
          show: true
        },
        {
          name: 'Users',
          component: UsersManagementScreen,
          icon: 'person-add',
          iconOutline: 'person-add-outline',
          show: true
        }
      );
    }

    tabs.push(
      {
        name: 'Participants',
        component: ParticipantScreen,
        icon: 'people',
        iconOutline: 'people-outline',
        show: true
      },
      {
        name: 'Settings',
        component: SettingsScreen,
        icon: 'settings',
        iconOutline: 'settings-outline',
        show: true
      }
    );

    return tabs.filter(tab => tab.show);
  };

  const tabs = getTabsForRole();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find(t => t.name === route.name);
        const headerColor = getHeaderColor(route.name, colors);
        
        return {
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? tab?.icon : tab?.iconOutline;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 4,
            paddingTop: 4,
            height: Platform.OS === 'ios' ? 50 + insets.bottom : 56,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 12,
            position: 'absolute',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
          headerStyle: {
            backgroundColor: headerColor,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: 'white',
          },
          headerTitleAlign: 'center',
        };
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen 
          key={tab.name} 
          name={tab.name} 
          component={tab.component}
          options={{
            headerTitle: tab.name === 'Users' ? 'User Management' : tab.name,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator({ cameraPermission }) {
  const { user, bootstrapping } = useAuth();
  const { colors } = useTheme();

  const stackScreenOptions = {
    headerStyle: {
      backgroundColor: colors.card,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 18,
    },
    headerBackTitleVisible: false,
    animation: 'slide_from_right',
  };

  // Define stack screen options outside of conditional rendering
  const distributionOptions = {
    title: 'Food Distribution',
    headerStyle: {
      backgroundColor: colors.info || '#3b82f6',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerTintColor: 'white',
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: 18,
      color: 'white',
    },
    headerTitleAlign: 'center',
    headerBackTitle: 'Back',
  };

  const templatesOptions = {
    title: 'Entitlement Templates',
    headerStyle: {
      backgroundColor: colors.secondary || '#8b5cf6',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerTintColor: 'white',
    headerTitleStyle: {
      fontWeight: '700',
      fontSize: 18,
      color: 'white',
    },
    headerTitleAlign: 'center',
  };

  if (bootstrapping) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={stackScreenOptions}>
        {!user ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="QRScanner" 
              component={QRScannerScreen}
              options={{ 
                headerShown: false,
                presentation: 'fullScreenModal'
              }}
            />
            <Stack.Screen 
              name="AttendanceResult" 
              component={AttendanceResultScreen}
              options={{ 
                title: 'Attendance Result',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Distribution" 
              component={DistributionScreen}
              options={distributionOptions}
            />
            {user?.role === 'admin' && (
              <Stack.Screen 
                name="Templates" 
                component={EntitlementTemplateScreen}
                options={templatesOptions}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
