import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import LoginScreen from '../screens/auth/LoginScreen';
import UnitsListScreen from '../screens/units/UnitsListScreen';
import UnitDetailScreen from '../screens/units/UnitDetailScreen';
import UnitFormScreen from '../screens/units/UnitFormScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="UnitsList"
        component={UnitsListScreen}
        options={{ title: 'Apartamentos' }}
      />
      <Stack.Screen
        name="UnitDetail"
        component={UnitDetailScreen}
        options={{ title: 'Detalle' }}
      />
      <Stack.Screen
        name="UnitForm"
        component={UnitFormScreen}
        options={({ route }: any) => ({
          title: route.params?.unitId ? 'Editar apartamento' : 'Nuevo apartamento',
        })}
      />
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
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
