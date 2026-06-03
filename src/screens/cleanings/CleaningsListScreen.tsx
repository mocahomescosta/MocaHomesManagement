import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCleanings } from '../../hooks/useCleanings';
import { Cleaning, CleaningStatus } from '../../types';

type RootStackParamList = {
  CleaningDetail: { cleaningId: string };
  CleaningForm: { cleaningId?: string };
};

const STATUS_CONFIG: Record<CleaningStatus, { label: string; bg: string; text: string }> = {
  pendiente:   { label: 'Pendiente',    bg: 'bg-gray-100',   text: 'text-gray-600' },
  en_curso:    { label: 'En curso',     bg: 'bg-blue-100',   text: 'text-blue-700' },
  completada:  { label: 'Completada',   bg: 'bg-green-100',  text: 'text-green-700' },
  verificada:  { label: 'Verificada',   bg: 'bg-purple-100', text: 'text-purple-700' },
  incidencia:  { label: 'Incidencia',   bg: 'bg-red-100',    text: 'text-red-700' },
};

const TYPE_LABELS: Record<string, string> = {
  checkout: 'Checkout',
  mantenimiento: 'Mantenimiento',
  extra: 'Extra',
};

function CleaningCard({ item, onPress }: { item: Cleaning; onPress: () => void }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendiente;
  return (
    <TouchableOpacity
      className="bg-white rounded-xl mx-4 mb-2 p-4 shadow-sm border border-gray-100"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2">{item.unitName}</Text>
        <View className={`rounded-full px-2 py-0.5 ${cfg.bg}`}>
          <Text className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</Text>
        </View>
      </View>
      <Text className="text-xs text-gray-500 mt-1">
        {item.scheduledTime} · {TYPE_LABELS[item.type] ?? item.type}
      </Text>
      {item.assignedToName ? (
        <Text className="text-xs text-gray-400 mt-1">{item.assignedToName}</Text>
      ) : null}
      {item.guestCheckout || item.guestCheckin ? (
        <View className="flex-row mt-2 gap-3">
          {item.guestCheckout ? <Text className="text-xs text-orange-500">Salida {item.guestCheckout}</Text> : null}
          {item.guestCheckin  ? <Text className="text-xs text-blue-500">Entrada {item.guestCheckin}</Text>  : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function groupByDate(cleanings: Cleaning[]) {
  const map = new Map<string, Cleaning[]>();
  cleanings.forEach(c => {
    const arr = map.get(c.scheduledDate) ?? [];
    arr.push(c);
    map.set(c.scheduledDate, arr);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ title: date, data }));
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

export default function CleaningsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cleanings, loading } = useCleanings();

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const sections = groupByDate(cleanings);

  return (
    <View className="flex-1 bg-gray-50">
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CleaningCard item={item} onPress={() => navigation.navigate('CleaningDetail', { cleaningId: item.id })} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="px-4 py-2 bg-gray-50">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{formatDate(title)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">No hay limpiezas programadas</Text>
            <Text className="text-gray-400 text-sm mt-1">Pulsa + para añadir una</Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('CleaningForm', {})}
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}
