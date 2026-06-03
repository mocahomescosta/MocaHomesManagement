import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBookings } from '../../hooks/useBookings';
import { Booking, BookingStatus } from '../../types';

type Nav = { BookingDetail: { bookingId: string }; LodgifyMapping: undefined };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  booked:    { label: 'Confirmada', bg: 'bg-green-100',  text: 'text-green-700' },
  tentative: { label: 'Tentativa',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
  open_bill: { label: 'Abierta',    bg: 'bg-blue-100',   text: 'text-blue-700' },
  declined:  { label: 'Rechazada',  bg: 'bg-red-100',    text: 'text-red-700' },
  canceled:  { label: 'Cancelada',  bg: 'bg-gray-100',   text: 'text-gray-500' },
};

const SOURCE_ICONS: Record<string, string> = {
  airbnb: '🏡', booking: '🔵', vrbo: '🏠', direct: '📱', other: '📋',
};

function nights(arrival: string, departure: string): number {
  const a = new Date(arrival).getTime();
  const d = new Date(departure).getTime();
  return Math.round((d - a) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)}/${parseInt(m)}/${y}`;
}

function BookingCard({ item, onPress }: { item: Booking; onPress: () => void }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.booked;
  const icon = SOURCE_ICONS[item.source] ?? '📋';
  const n = nights(item.arrivalDate, item.departureDate);

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mx-4 mb-2 p-4 shadow-sm border border-gray-100"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-900">{item.unitName}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {icon} {formatDate(item.arrivalDate)} → {formatDate(item.departureDate)} · {n} noche{n !== 1 ? 's' : ''}
          </Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${cfg.bg}`}>
          <Text className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</Text>
        </View>
      </View>
      <View className="flex-row mt-2 gap-3">
        <Text className="text-xs text-gray-400">👥 {item.guests} huésped{item.guests !== 1 ? 'es' : ''}</Text>
        {item.specialRequests ? <Text className="text-xs text-orange-500">⚠ Petición especial</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

type FilterStatus = 'todas' | 'activas' | 'canceladas';

export default function BookingsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const { bookings, loading } = useBookings();
  const [filter, setFilter] = useState<FilterStatus>('activas');

  const filtered = bookings.filter(b => {
    if (filter === 'activas') return ['booked', 'tentative', 'open_bill'].includes(b.status);
    if (filter === 'canceladas') return ['declined', 'canceled'].includes(b.status);
    return true;
  });

  if (loading) return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter tabs */}
      <View className="flex-row mx-4 mt-3 mb-1 bg-gray-100 rounded-xl p-1">
        {(['activas', 'todas', 'canceladas'] as FilterStatus[]).map(f => (
          <TouchableOpacity
            key={f}
            className={`flex-1 py-2 rounded-lg items-center ${filter === f ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setFilter(f)}
          >
            <Text className={`text-sm font-medium capitalize ${filter === f ? 'text-blue-600' : 'text-gray-500'}`}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <BookingCard item={item} onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })} />
        )}
        ListHeaderComponent={<View className="h-2" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">No hay reservas</Text>
            <Text className="text-gray-400 text-sm mt-1">Las reservas de Lodgify aparecerán aquí</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Config button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-white border border-gray-200 w-14 h-14 rounded-full items-center justify-center shadow-md"
        onPress={() => navigation.navigate('LodgifyMapping')}
      >
        <Text className="text-xl">⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}
