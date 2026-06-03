import React from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMaintenance } from '../../hooks/useMaintenance';
import { Maintenance, MaintenancePriority, MaintenanceStatus } from '../../types';

type Nav = { MaintenanceDetail: { itemId: string }; MaintenanceForm: { itemId?: string } };

const PRIORITY_CONFIG: Record<MaintenancePriority, { label: string; bg: string; text: string; dot: string }> = {
  baja:     { label: 'Baja',    bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  media:    { label: 'Media',   bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  alta:     { label: 'Alta',    bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  urgente:  { label: 'Urgente', bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; color: string }> = {
  abierta:            { label: 'Abierta',            color: '#6b7280' },
  en_progreso:        { label: 'En progreso',         color: '#2563eb' },
  esperando_material: { label: 'Esp. material',       color: '#d97706' },
  resuelta:           { label: 'Resuelta',            color: '#16a34a' },
  cancelada:          { label: 'Cancelada',           color: '#9ca3af' },
};

const CATEGORY_LABELS: Record<string, string> = {
  fontaneria: 'Fontanería', electricidad: 'Electricidad',
  electrodomestico: 'Electrodoméstico', muebles: 'Muebles',
  limpieza_profunda: 'Limpieza profunda', otro: 'Otro',
};

function groupByStatus(items: Maintenance[]) {
  const open = items.filter(i => !['resuelta', 'cancelada'].includes(i.status));
  const closed = items.filter(i => ['resuelta', 'cancelada'].includes(i.status));
  const sections = [];
  if (open.length) sections.push({ title: 'Abiertas', data: open.sort((a, b) => {
    const pri = ['urgente','alta','media','baja'];
    return pri.indexOf(a.priority) - pri.indexOf(b.priority);
  })});
  if (closed.length) sections.push({ title: 'Cerradas', data: closed });
  return sections;
}

function MaintenanceCard({ item, onPress }: { item: Maintenance; onPress: () => void }) {
  const pri = PRIORITY_CONFIG[item.priority];
  const sta = STATUS_CONFIG[item.status];
  return (
    <TouchableOpacity
      className="bg-white rounded-xl mx-4 mb-2 p-4 shadow-sm border border-gray-100"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <View className={`w-2.5 h-2.5 rounded-full mr-2 mt-0.5 ${pri.dot}`} />
          <Text className="text-sm font-semibold text-gray-900 flex-1">{item.title}</Text>
        </View>
        <Text style={{ color: sta.color }} className="text-xs font-medium">{sta.label}</Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1 ml-4">{item.unitName}</Text>
      <View className="flex-row mt-2 ml-4 gap-2">
        <View className={`rounded-full px-2 py-0.5 ${pri.bg}`}>
          <Text className={`text-xs ${pri.text}`}>{pri.label}</Text>
        </View>
        <Text className="text-xs text-gray-400">{CATEGORY_LABELS[item.category] ?? item.category}</Text>
        {item.assignedToName ? <Text className="text-xs text-gray-400">· {item.assignedToName}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MaintenanceListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const { items, loading } = useMaintenance();

  if (loading) return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;

  const sections = groupByStatus(items);

  return (
    <View className="flex-1 bg-gray-50">
      <SectionList
        sections={sections}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <MaintenanceCard item={item} onPress={() => navigation.navigate('MaintenanceDetail', { itemId: item.id })} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="px-4 py-2 bg-gray-50">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">Sin incidencias de mantenimiento</Text>
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
