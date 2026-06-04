import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMaintenance } from '../../hooks/useMaintenance';
import { Maintenance, MaintenancePriority, MaintenanceStatus } from '../../types';

type Nav = {
  MaintenanceDetail: { itemId: string };
  MaintenanceForm: { itemId?: string };
  PeriodicForm: { itemId?: string };
};

const PRIORITY_CONFIG: Record<MaintenancePriority, { label: string; dot: string }> = {
  baja:    { label: 'Baja',    dot: 'bg-gray-400' },
  media:   { label: 'Media',   dot: 'bg-yellow-500' },
  alta:    { label: 'Alta',    dot: 'bg-orange-500' },
  urgente: { label: 'Urgente', dot: 'bg-red-500' },
};

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; color: string }> = {
  abierta:            { label: 'Abierta',      color: '#6b7280' },
  en_progreso:        { label: 'En progreso',  color: '#2563eb' },
  esperando_material: { label: 'Esp. material',color: '#d97706' },
  resuelta:           { label: 'Resuelta',     color: '#16a34a' },
  cancelada:          { label: 'Cancelada',    color: '#9ca3af' },
};

const FREQ_LABELS: Record<string, string> = {
  semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
  trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
};

function IncidenciasTab() {
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const { items, loading } = useMaintenance();

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563eb" /></View>;

  const open = items.filter(i => !['resuelta', 'cancelada'].includes(i.status));
  const closed = items.filter(i => ['resuelta', 'cancelada'].includes(i.status));
  const sorted = [
    ...open.sort((a, b) => ['urgente','alta','media','baja'].indexOf(a.priority) - ['urgente','alta','media','baja'].indexOf(b.priority)),
    ...closed,
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={sorted}
        keyExtractor={i => i.id}
        renderItem={({ item }) => {
          const pri = PRIORITY_CONFIG[item.priority];
          const sta = STATUS_CONFIG[item.status];
          return (
            <TouchableOpacity
              className="bg-white rounded-xl mx-4 mb-2 p-4 shadow-sm border border-gray-100"
              onPress={() => navigation.navigate('MaintenanceDetail', { itemId: item.id })}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className={`w-2.5 h-2.5 rounded-full mr-2 mt-0.5 ${pri.dot}`} />
                  <Text className="text-sm font-semibold text-gray-900 flex-1">{item.title}</Text>
                </View>
                <Text style={{ color: sta.color }} className="text-xs font-medium">{sta.label}</Text>
              </View>
              <Text className="text-xs text-gray-500 mt-1 ml-4">{item.unitName}</Text>
              <View className="flex-row mt-1 ml-4 gap-2">
                <Text className="text-xs text-gray-400">{pri.label}</Text>
                {item.assignedToName ? <Text className="text-xs text-gray-400">· {item.assignedToName}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">🔧</Text>
            <Text className="text-gray-400 text-base">Sin incidencias</Text>
            <Text className="text-gray-400 text-sm mt-1">Pulsa + para reportar una</Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('MaintenanceForm', {})}
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}

function PeriodicosTab() {
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const { periodicItems, loadingPeriodic } = useMaintenance();

  if (loadingPeriodic) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563eb" /></View>;

  const today = new Date();

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={periodicItems}
        keyExtractor={i => i.id}
        renderItem={({ item }) => {
          const nextDate = item.nextDate?.toDate ? item.nextDate.toDate() : new Date(item.nextDate);
          const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;
          const isSoon = daysLeft >= 0 && daysLeft <= 7;

          return (
            <TouchableOpacity
              className="bg-white rounded-xl mx-4 mb-2 p-4 shadow-sm border border-gray-100"
              onPress={() => navigation.navigate('PeriodicForm', { itemId: item.id })}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-gray-900">{item.title}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{item.unitName}</Text>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${isOverdue ? 'bg-red-100' : isSoon ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <Text className={`text-xs font-medium ${isOverdue ? 'text-red-700' : isSoon ? 'text-orange-700' : 'text-green-700'}`}>
                    {isOverdue ? `Vencido (${Math.abs(daysLeft)}d)` : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`}
                  </Text>
                </View>
              </View>
              <View className="flex-row mt-2 gap-3">
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs">🔄</Text>
                  <Text className="text-xs text-gray-500">{FREQ_LABELS[item.frequency] ?? item.frequency}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs">📅</Text>
                  <Text className="text-xs text-gray-500">
                    {nextDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                {item.assignedToName ? (
                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs">👤</Text>
                    <Text className="text-xs text-gray-500">{item.assignedToName}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-gray-400 text-base">Sin mantenimientos periódicos</Text>
            <Text className="text-gray-400 text-sm mt-1">Pulsa + para programar uno</Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('PeriodicForm', {})}
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MaintenanceListScreen() {
  const [tab, setTab] = useState<'incidencias' | 'periodicos'>('incidencias');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Tabs */}
      <View className="flex-row mx-4 mt-3 mb-1 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg items-center ${tab === 'incidencias' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setTab('incidencias')}
        >
          <Text className={`text-sm font-medium ${tab === 'incidencias' ? 'text-blue-600' : 'text-gray-500'}`}>
            🔧 Incidencias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg items-center ${tab === 'periodicos' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setTab('periodicos')}
        >
          <Text className={`text-sm font-medium ${tab === 'periodicos' ? 'text-blue-600' : 'text-gray-500'}`}>
            📅 Periódicos
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'incidencias' ? <IncidenciasTab /> : <PeriodicosTab />}
    </View>
  );
}
