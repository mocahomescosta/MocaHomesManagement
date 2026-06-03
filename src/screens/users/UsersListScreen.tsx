import React, { useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUsers } from '../../hooks/useUsers';
import { AppUser, UserRole, UserStatus } from '../../types';
import { updateUserStatus } from '../../services/users.service';

type Nav = { UserDetail: { uid: string } };

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; order: number }> = {
  Admin:      { label: 'Administrador', color: '#7c3aed', order: 0 },
  Manager:    { label: 'Manager',       color: '#2563eb', order: 1 },
  Cleaner:    { label: 'Limpiadora',    color: '#16a34a', order: 2 },
  Technician: { label: 'Técnico',       color: '#d97706', order: 3 },
};

const STATUS_CONFIG: Record<UserStatus, { dot: string; label: string }> = {
  active:    { dot: 'bg-green-500', label: 'Activo' },
  inactive:  { dot: 'bg-gray-400',  label: 'Inactivo' },
  suspended: { dot: 'bg-red-500',   label: 'Suspendido' },
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function UserRow({ user, onPress }: { user: AppUser; onPress: () => void }) {
  const role = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.Cleaner;
  const status = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.active;

  const handleToggleStatus = () => {
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    const label = newStatus === 'active' ? 'activar' : 'desactivar';
    Alert.alert(
      `¿${label.charAt(0).toUpperCase() + label.slice(1)} usuario?`,
      `¿Quieres ${label} a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: label.charAt(0).toUpperCase() + label.slice(1), onPress: () => updateUserStatus(user.uid, newStatus) },
      ]
    );
  };

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-50"
      onPress={onPress}
    >
      {/* Avatar */}
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: role.color + '20' }}>
        <Text style={{ color: role.color }} className="text-sm font-bold">{getInitials(user.name)}</Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">{user.name}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{user.email}</Text>
        {user.phone ? <Text className="text-xs text-gray-400">{user.phone}</Text> : null}
      </View>

      {/* Status dot + toggle */}
      <View className="items-end gap-1">
        <View className="flex-row items-center gap-1.5">
          <View className={`w-2 h-2 rounded-full ${status.dot}`} />
          <Text className="text-xs text-gray-500">{status.label}</Text>
        </View>
        <TouchableOpacity
          className="bg-gray-100 rounded px-2 py-0.5"
          onPress={handleToggleStatus}
        >
          <Text className="text-xs text-gray-600">
            {user.status === 'active' ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function groupByRole(users: AppUser[]) {
  const map = new Map<UserRole, AppUser[]>();
  users.forEach(u => {
    const arr = map.get(u.role) ?? [];
    arr.push(u);
    map.set(u.role, arr);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (ROLE_CONFIG[a]?.order ?? 99) - (ROLE_CONFIG[b]?.order ?? 99))
    .map(([role, data]) => ({
      title: ROLE_CONFIG[role]?.label ?? role,
      roleColor: ROLE_CONFIG[role]?.color ?? '#6b7280',
      data: data.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

export default function UsersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const { users, loading } = useUsers();
  const [filterActive, setFilterActive] = useState(false);

  if (loading) return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;

  const filtered = filterActive ? users.filter(u => u.status === 'active') : users;
  const sections = groupByRole(filtered);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter */}
      <View className="flex-row mx-4 mt-3 mb-1 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg items-center ${!filterActive ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setFilterActive(false)}
        >
          <Text className={`text-sm font-medium ${!filterActive ? 'text-blue-600' : 'text-gray-500'}`}>
            Todos ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg items-center ${filterActive ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setFilterActive(true)}
        >
          <Text className={`text-sm font-medium ${filterActive ? 'text-blue-600' : 'text-gray-500'}`}>
            Activos ({users.filter(u => u.status === 'active').length})
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={u => u.uid}
        renderItem={({ item }) => (
          <UserRow user={item} onPress={() => navigation.navigate('UserDetail', { uid: item.uid })} />
        )}
        renderSectionHeader={({ section: { title, roleColor } }) => (
          <View className="bg-white px-4 py-2 border-b border-gray-100">
            <Text style={{ color: roleColor }} className="text-xs font-bold uppercase tracking-wide">{title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">No hay usuarios</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
