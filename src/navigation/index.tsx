import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
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
import BookingsListScreen from '../screens/bookings/BookingsListScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import LodgifyMappingScreen from '../screens/bookings/LodgifyMappingScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import InventoryListScreen from '../screens/inventory/InventoryListScreen';
import InventoryFormScreen from '../screens/inventory/InventoryFormScreen';
import UsersListScreen from '../screens/users/UsersListScreen';
import UserDetailScreen from '../screens/users/UserDetailScreen';
import AddUserScreen from '../screens/users/AddUserScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

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

function InventoryStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="InventoryList" component={InventoryListScreen} options={{ title: 'Inventario' }} />
      <Stack.Screen name="InventoryForm" component={InventoryFormScreen} options={({ route }: any) => ({ title: route.params?.itemId ? 'Editar artículo' : 'Nuevo artículo' })} />
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

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
    </Stack.Navigator>
  );
}

function UsersStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen
        name="UsersList"
        component={UsersListScreen}
        options={({ navigation }: any) => ({
          title: 'Equipo',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('AddUser')} style={{ marginRight: 4 }}>
              <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>+</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'Perfil' }} />
      <Stack.Screen name="AddUser" component={AddUserScreen} options={{ title: 'Nuevo miembro' }} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen name="BookingsList" component={BookingsListScreen} options={{ title: 'Reservas' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Reserva' }} />
      <Stack.Screen name="LodgifyMapping" component={LodgifyMappingScreen} options={{ title: 'Configurar Lodgify' }} />
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
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
          headerShown: true,
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' as const },
          headerTitle: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="UnitsTab"
        component={UnitsStack}
        options={{
          tabBarLabel: 'Apartamentos',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="ReservasTab"
        component={BookingsStack}
        options={{
          tabBarLabel: 'Reservas',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text>,
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
        name="InventarioTab"
        component={InventoryStack}
        options={{
          tabBarLabel: 'Inventario',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text>,
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
      <Tab.Screen
        name="UsuariosTab"
        component={UsersStack}
        options={{
          tabBarLabel: 'Usuarios',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
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
