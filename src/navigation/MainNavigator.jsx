import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Existing screens
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ScanScreen from '../screens/ScanScreen';
import ParticipantScreen from '../screens/ParticipantScreen';
import SettingsScreen from '../screens/SettingsScreen';

// New/updated screens
import QRScannerScreen from '../screens/QRScannerScreen'; // Fixed import
import DistributionScreen from '../screens/DistributionScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import GroupsScreen from '../screens/GroupsScreen';
import UsersScreen from '../screens/UsersScreen';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

function Tabs() {
  const { hasPermission } = useAuth();
  const { colors } = useTheme();

  const showAttendance = hasPermission('canMarkAttendance');
  const showDistribution = hasPermission('canDistributeFood');
  const isAdmin = hasPermission('canManageSettings') || hasPermission('canManageUsers') || hasPermission('canUndoActions');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'ellipse-outline';
          switch (route.name) {
            case 'Dashboard': iconName = focused ? 'analytics' : 'analytics-outline'; break;
            case 'Attendance': iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline'; break;
            case 'Scan': iconName = focused ? 'qr-code' : 'qr-code-outline'; break;
            case 'Distribution': iconName = focused ? 'fast-food' : 'fast-food-outline'; break;
            case 'Participant': iconName = focused ? 'people' : 'people-outline'; break;
            case 'Templates': iconName = focused ? 'albums' : 'albums-outline'; break;
            case 'Groups': iconName = focused ? 'people-circle' : 'people-circle-outline'; break;
            case 'Users': iconName = focused ? 'person-add' : 'person-add-outline'; break;
            case 'Settings': iconName = focused ? 'settings' : 'settings-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {showAttendance && <Tab.Screen name="Attendance" component={AttendanceScreen} />}
      <Tab.Screen name="Scan" component={ScanScreen} />
      {showDistribution && <Tab.Screen name="Distribution" component={DistributionScreen} />}
      <Tab.Screen name="Participant" component={ParticipantScreen} />
      {isAdmin && <Tab.Screen name="Templates" component={TemplatesScreen} />}
      {isAdmin && <Tab.Screen name="Groups" component={GroupsScreen} />}
      {isAdmin && <Tab.Screen name="Users" component={UsersScreen} />}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { colors } = useTheme();
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <RootStack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'Scan QR Code' }} />
    </RootStack.Navigator>
  );
}
