import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getBooking } from '../../services/bookings.service';
import { Booking } from '../../types';

type Nav = { BookingDetail: { bookingId: string } };

const STATUS_LABELS: Record<string, string> = {
  booked: 'Confirmada', tentative: 'Tentativa',
  open_bill: 'Cuenta abierta', declined: 'Rechazada', canceled: 'Cancelada',
};

const SOURCE_LABELS: Record<string, string> = {
  airbnb: 'Airbnb 🏡', booking: 'Booking.com 🔵',
  vrbo: 'VRBO 🏠', direct: 'Reserva directa 📱', other: 'Otra fuente',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-800 flex-1 text-right ml-4">{value}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function nights(arrival: string, departure: string): number {
  return Math.round((new Date(departure).getTime() - new Date(arrival).getTime()) / 86400000);
}

export default function BookingDetailScreen() {
  const route = useRoute<RouteProp<Nav, 'BookingDetail'>>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooking(route.params.bookingId).then(b => { setBooking(b); setLoading(false); });
  }, []);

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!booking) return <View className="flex-1 items-center justify-center"><Text className="text-gray-500">Reserva no encontrada</Text></View>;

  const n = nights(booking.arrivalDate, booking.departureDate);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-900">{booking.unitName}</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {SOURCE_LABELS[booking.source] ?? booking.source}
        </Text>
        <View className="flex-row mt-3 justify-between">
          <View className="items-center flex-1">
            <Text className="text-xs text-gray-400">LLEGADA</Text>
            <Text className="text-base font-semibold text-gray-900 mt-1">{formatDate(booking.arrivalDate)}</Text>
          </View>
          <View className="items-center px-4">
            <Text className="text-xs text-gray-400">{n} noches</Text>
            <Text className="text-gray-300 text-lg mt-1">→</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xs text-gray-400">SALIDA</Text>
            <Text className="text-base font-semibold text-gray-900 mt-1">{formatDate(booking.departureDate)}</Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-2">DETALLES</Text>
        <InfoRow label="Estado" value={STATUS_LABELS[booking.status] ?? booking.status} />
        <InfoRow label="Huéspedes" value={`${booking.guests} persona${booking.guests !== 1 ? 's' : ''}`} />
        {booking.guestName ? <InfoRow label="Huésped" value={booking.guestName} /> : null}
        <InfoRow label="ID Lodgify" value={`#${booking.lodgifyBookingId}`} />
      </View>

      {/* Special requests */}
      {booking.specialRequests ? (
        <View className="bg-orange-50 mx-4 mt-3 rounded-xl p-4 border border-orange-200">
          <Text className="text-xs font-semibold text-orange-600 mb-2">⚠ PETICIÓN ESPECIAL</Text>
          <Text className="text-sm text-gray-700 leading-5">{booking.specialRequests}</Text>
        </View>
      ) : null}

      {/* Auto-cleaning note */}
      {['booked', 'open_bill'].includes(booking.status) && (
        <View className="bg-blue-50 mx-4 mt-3 rounded-xl p-4 border border-blue-100">
          <Text className="text-xs font-semibold text-blue-600 mb-1">🧹 LIMPIEZA PROGRAMADA</Text>
          <Text className="text-sm text-blue-700">
            Limpieza de checkout creada automáticamente para el {formatDate(booking.departureDate)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
