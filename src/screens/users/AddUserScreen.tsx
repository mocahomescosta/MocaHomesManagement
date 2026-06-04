import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserRole } from '../../types';

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'Admin',      label: 'Administrador', color: '#7c3aed' },
  { value: 'Manager',    label: 'Manager',       color: '#2563eb' },
  { value: 'Cleaner',    label: 'Limpiadora',    color: '#16a34a' },
  { value: 'Technician', label: 'Técnico',       color: '#d97706' },
];

export default function AddUserScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Cleaner');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const uid = `manual_${Date.now()}`;
      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Éxito', `${name} añadido al equipo`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>

      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <Text className="text-xs font-semibold text-gray-500 mb-3">DATOS PERSONALES</Text>

        <Text className="text-xs text-gray-500 mb-1">Nombre completo *</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2.5 mb-3 text-sm text-gray-800"
          placeholder="Ej: María García"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-xs text-gray-500 mb-1">Email *</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2.5 mb-3 text-sm text-gray-800"
          placeholder="correo@ejemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="text-xs text-gray-500 mb-1">Teléfono</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800"
          placeholder="+34 600 000 000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <Text className="text-xs font-semibold text-gray-500 mb-3">ROL</Text>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r.value}
            className={`flex-row items-center p-3 rounded-lg mb-2 border ${role === r.value ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
            onPress={() => setRole(r.value)}
          >
            <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: r.color }} />
            <Text className={`text-sm font-medium ${role === r.value ? 'text-blue-700' : 'text-gray-700'}`}>{r.label}</Text>
            {role === r.value && <Text className="ml-auto text-blue-600">✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center"
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold text-base">Añadir al equipo</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
}
