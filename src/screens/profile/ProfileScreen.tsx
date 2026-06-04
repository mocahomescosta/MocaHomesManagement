import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useProfile } from '../../hooks/useProfile';
import { logout } from '../../services/auth.service';
import { updateUserProfile } from '../../services/users.service';
import { UserRole } from '../../types';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  Admin:      { label: 'Administrador', color: '#7c3aed' },
  Manager:    { label: 'Manager',       color: '#2563eb' },
  Cleaner:    { label: 'Limpiadora',    color: '#16a34a' },
  Technician: { label: 'Técnico',       color: '#d97706' },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

export default function ProfileScreen() {
  const { profile, setProfile, loading } = useProfile();
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Notification preferences (stored locally for now, can be moved to Firestore)
  const [notifCleaning, setNotifCleaning] = useState(true);
  const [notifMaintenance, setNotifMaintenance] = useState(true);
  const [notifBooking, setNotifBooking] = useState(true);

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (!profile) {
    return <View className="flex-1 items-center justify-center bg-gray-50"><Text className="text-gray-400">No se pudo cargar el perfil</Text></View>;
  }

  const roleCfg = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.Manager;

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    await updateUserProfile(profile.uid, { name: nameValue.trim() });
    setProfile(prev => prev ? { ...prev, name: nameValue.trim() } : null);
    setEditingName(false);
    setSaving(false);
  };

  const handleSavePhone = async () => {
    setSaving(true);
    await updateUserProfile(profile.uid, { phone: phoneValue.trim() });
    setProfile(prev => prev ? { ...prev, phone: phoneValue.trim() } : null);
    setEditingPhone(false);
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Avatar + name + role */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm items-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: roleCfg.color + '20' }}
        >
          <Text style={{ color: roleCfg.color }} className="text-3xl font-bold">
            {getInitials(profile.name)}
          </Text>
        </View>
        <Text className="text-xl font-bold text-gray-900">{profile.name}</Text>
        <Text style={{ color: roleCfg.color }} className="text-sm font-semibold mt-1">
          {roleCfg.label}
        </Text>
        <Text className="text-sm text-gray-400 mt-0.5">{profile.email}</Text>
      </View>

      {/* Edit name */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-3">CUENTA</Text>

        {/* Name row */}
        <View className="border-b border-gray-50 pb-3 mb-3">
          <Text className="text-xs text-gray-400 mb-1">Nombre</Text>
          {editingName ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-800"
                value={nameValue}
                onChangeText={setNameValue}
                autoFocus
                placeholder={profile.name}
              />
              <TouchableOpacity
                className="bg-blue-600 rounded-lg px-3 py-2"
                onPress={handleSaveName}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm font-medium">Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingName(false)}>
                <Text className="text-gray-400 text-sm">Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row justify-between items-center"
              onPress={() => { setNameValue(profile.name); setEditingName(true); }}
            >
              <Text className="text-sm text-gray-800">{profile.name}</Text>
              <Text className="text-xs text-blue-500">Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Phone row */}
        <View>
          <Text className="text-xs text-gray-400 mb-1">Teléfono</Text>
          {editingPhone ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-800"
                value={phoneValue}
                onChangeText={setPhoneValue}
                autoFocus
                keyboardType="phone-pad"
                placeholder={profile.phone || '+34 600 000 000'}
              />
              <TouchableOpacity
                className="bg-blue-600 rounded-lg px-3 py-2"
                onPress={handleSavePhone}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm font-medium">Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingPhone(false)}>
                <Text className="text-gray-400 text-sm">Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row justify-between items-center"
              onPress={() => { setPhoneValue(profile.phone || ''); setEditingPhone(true); }}
            >
              <Text className="text-sm text-gray-800">{profile.phone || 'Sin teléfono'}</Text>
              <Text className="text-xs text-blue-500">Editar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Telegram link status */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-3">TELEGRAM</Text>
        {(profile as any).telegramChatId ? (
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <Text className="text-sm text-gray-700">Cuenta vinculada</Text>
          </View>
        ) : (
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <Text className="text-sm text-gray-500">Sin vincular</Text>
            </View>
            <View className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <Text className="text-xs text-blue-700 font-medium mb-1">Para recibir notificaciones en Telegram:</Text>
              <Text className="text-xs text-blue-600 leading-4">
                1. Abre Telegram y busca <Text className="font-mono font-bold">@MocaHomesBot</Text>{'\n'}
                2. Escribe: <Text className="font-mono font-bold">/vincular {profile.email}</Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Notification preferences */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-3">NOTIFICACIONES</Text>

        <View className="flex-row justify-between items-center py-2.5 border-b border-gray-50">
          <View>
            <Text className="text-sm text-gray-800">Nueva limpieza asignada</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Cuando te asignen una limpieza</Text>
          </View>
          <Switch
            value={notifCleaning}
            onValueChange={setNotifCleaning}
            trackColor={{ true: '#2563eb' }}
          />
        </View>

        <View className="flex-row justify-between items-center py-2.5 border-b border-gray-50">
          <View>
            <Text className="text-sm text-gray-800">Incidencia urgente</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Mantenimiento de prioridad urgente</Text>
          </View>
          <Switch
            value={notifMaintenance}
            onValueChange={setNotifMaintenance}
            trackColor={{ true: '#2563eb' }}
          />
        </View>

        <View className="flex-row justify-between items-center py-2.5">
          <View>
            <Text className="text-sm text-gray-800">Checkin / Checkout del día</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Resumen diario a las 8:00</Text>
          </View>
          <Switch
            value={notifBooking}
            onValueChange={setNotifBooking}
            trackColor={{ true: '#2563eb' }}
          />
        </View>
      </View>

      {/* App info */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-3">APLICACIÓN</Text>
        <View className="flex-row justify-between py-1">
          <Text className="text-sm text-gray-500">Versión</Text>
          <Text className="text-sm text-gray-400">1.0.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="bg-red-50 border border-red-200 mx-4 mt-4 rounded-xl py-4 items-center"
        onPress={handleLogout}
      >
        <Text className="text-red-600 font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
