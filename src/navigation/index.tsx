import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import LoginScreen from '../screens/auth/LoginScreen';
import UnitsListScreen from '../screens/units/UnitsListScreen';
import UnitDetailScreen from '../screens/units/UnitDetailScreen';
import UnitFormScreen from '../screens/units/UnitFormScreen';
import CleaningsListScreen from '../screens/cleanings/CleaningsListScreen';
import CleaningDetailScreen from '../screens/cleanings/CleaningDetailScreen';
import CleaningFormScreen from '../screens/cleanings/CleaningFormScreen';
import MaintenanceListScreen from '../screens/maintenance/MaintenanceListScreen';
import MaintenanceDetailScreen from '../screens/maintenance/MaintenanceDetailScreen';
import MaintenanceFormScreen from '../screens/maintenance/MaintenanceFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#2563eb' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
};

function UnitsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="UnitsList" component={UnitsListScreen} options={{ title: 'Apartamentos' }} />
      <Stack.Screen name="UnitDetail" component={UnitDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="UnitForm" component={UnitFormScreen} options={({ route }: any) => ({ title: route.params?.unitId ? 'Editar' : 'Nuevo apartamento' })} />
    </Stack.Navigator>
  );
}

function CleaningsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="CleaningsList" component={CleaningsListScreen} options={{ title: 'Limpiezas' }} />
      <Stack.Screen name="CleaningDetail" component={CleaningDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="CleaningForm" component={CleaningFormScreen} options={({ route }: any) => ({ title: route.params?.cleaningId ? 'Editar limpieza' : 'Nueva limpieza' })} />
    </Stack.Navigator>
  );
}

function MaintenanceStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} options={{ title: 'Mantenimiento' }} />
      <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ title: 'Incidencia' }} />
      <Stack.Screen name="MaintenanceForm" component={MaintenanceFormScreen} options={({ route }: any) => ({ title: route.params?.itemId ? 'Editar' : 'Nueva incidencia' })} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
      }}
    >
      <Tab.Screen
        name="UnitsTab"
        component={UnitsStack}
        options={{
          tabBarLabel: 'Apartamentos',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="CleaningsTab"
        component={CleaningsStack}
        options={{
          tabBarLabel: 'Limpiezas',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🧹</Text>,
        }}
      />
      <Tab.Screen
        name="MantenimientoTab"
        component={MaintenanceStack}
        options={{
          tabBarLabel: 'Mantenimiento',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔧</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
