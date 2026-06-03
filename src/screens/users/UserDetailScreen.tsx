import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getUser, updateUserRole, updateUserStatus } from '../../services/users.service';
import { AppUser, UserRole, UserStatus } from '../../types';

type Nav = { UserDetail: { uid: string } };

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'Admin',      label: 'Administrador' },
  { value: 'Manager',    label: 'Manager' },
  { value: 'Cleaner',    label: 'Limpiadora' },
  { value: 'Technician', label: 'Técnico' },
];

const STATUSES: { value: UserStatus; label: string; color: string }[] = [
  { value: 'active',    label: 'Activo',     color: '#16a34a' },
  { value: 'inactive',  label: 'Inactivo',   color: '#6b7280' },
  { value: 'suspended', label: 'Suspendido', color: '#dc2626' },
];

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: '#7c3aed', Manager: '#2563eb', Cleaner: '#16a34a', Technician: '#d97706',
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">{value}</Text>
    </View>
  );
}

export default function UserDetailScreen() {
  const route = useRoute<RouteProp<Nav, 'UserDetail'>>();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUser(route.params.uid).then(u => { setUser(u); setLoading(false); });
  }, []);

  const handleRoleChange = async (role: UserRole) => {
    if (!user) return;
    setSaving(true);
    await updateUserRole(user.uid, role);
    setUser(prev => prev ? { ...prev, role } : null);
    setSaving(false);
  };

  const handleStatusChange = async (status: UserStatus) => {
    if (!user) return;
    setSaving(true);
    await updateUserStatus(user.uid, status);
    setUser(prev => prev ? { ...prev, status } : null);
    setSaving(false);
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!user) return <View className="flex-1 items-center justify-center"><Text className="text-gray-500">Usuario no encontrado</Text></View>;

  const roleColor = ROLE_COLORS[user.role] ?? '#6b7280';
  const statusCfg = STATUSES.find(s => s.value === user.status) ?? STATUSES[0];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Avatar + header */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm items-center">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: roleColor + '20' }}>
          <Text style={{ color: roleColor }} className="text-2xl font-bold">{getInitials(user.name)}</Text>
        </View>
        <Text className="text-lg font-bold text-gray-900">{user.name}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{user.email}</Text>
        <View className="flex-row items-center mt-2 gap-1.5">
          <Text style={{ color: statusCfg.color }} className="text-xs font-semibold">{statusCfg.label}</Text>
          <Text className="text-gray-300">·</Text>
          <Text style={{ color: roleColor }} className="text-xs font-semibold">
            {ROLES.find(r => r.value === user.role)?.label ?? user.role}
          </Text>
        </View>
      </View>

      {/* Contact info */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-2">INFORMACIÓN</Text>
        {user.phone ? <InfoRow label="Teléfono" value={user.phone} /> : null}
        <InfoRow label="Email" value={user.email} />
        {user.lastLoginAt ? (
          <InfoRow label="Último acceso" value={
            new Date((user.lastLoginAt as any).seconds * 1000).toLocaleDateString('es-ES')
          } />
        ) : null}
      </View>

      {/* Change role */}
      <View className="mx-4 mt-3">
        <Text className="text-xs text-gray-500 font-semibold mb-2">ROL</Text>
        <View className="flex-row flex-wrap gap-2">
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.value}
              className={`px-4 py-2 rounded-xl border ${user.role === r.value ? 'border-2' : 'bg-white border-gray-200'}`}
              style={user.role === r.value ? { borderColor: ROLE_COLORS[r.value], backgroundColor: ROLE_COLORS[r.value] + '15' } : {}}
              onPress={() => handleRoleChange(r.value)}
              disabled={saving}
            >
              <Text style={user.role === r.value ? { color: ROLE_COLORS[r.value] } : { color: '#6b7280' }} className="text-sm font-medium">
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Change status */}
      <View className="mx-4 mt-3">
        <Text className="text-xs text-gray-500 font-semibold mb-2">ESTADO</Text>
        <View className="flex-row gap-2">
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s.value}
              className={`flex-1 py-2.5 rounded-xl border items-center ${user.status === s.value ? 'border-2' : 'bg-white border-gray-200'}`}
              style={user.status === s.value ? { borderColor: s.color, backgroundColor: s.color + '15' } : {}}
              onPress={() => handleStatusChange(s.value)}
              disabled={saving}
            >
              <Text style={user.status === s.value ? { color: s.color } : { color: '#6b7280' }} className="text-sm font-medium">
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
