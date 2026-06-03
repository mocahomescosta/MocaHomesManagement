import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDashboard } from '../../hooks/useDashboard';
import { Cleaning, Booking, Maintenance } from '../../types';

const SOURCE_ICONS: Record<string, string> = {
  airbnb: '🏡', booking: '🔵', vrbo: '🏠', direct: '📱', other: '📋',
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]}`;
}

// ─── Reusable card container ──────────────────────────────────────────────────
function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <View className="mx-4 mb-4">
      <Text className={`text-xs font-bold uppercase tracking-wide mb-2 ${accent ?? 'text-gray-500'}`}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatCard({ label, value, bg, text }: { label: string; value: number | string; bg: string; text: string }) {
  return (
    <View className={`flex-1 rounded-xl p-3 items-center ${bg}`}>
      <Text className={`text-2xl font-bold ${text}`}>{value}</Text>
      <Text className={`text-xs mt-0.5 ${text} opacity-80`}>{label}</Text>
    </View>
  );
}

// ─── Cleaning row ─────────────────────────────────────────────────────────────
function CleaningRow({ item }: { item: Cleaning }) {
  const STATUS_COLORS: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-600',
    en_curso: 'bg-blue-100 text-blue-700',
    completada: 'bg-green-100 text-green-700',
    verificada: 'bg-purple-100 text-purple-700',
    incidencia: 'bg-red-100 text-red-700',
    cancelada: 'bg-gray-100 text-gray-400',
  };
  const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada',
    verificada: 'Verificada', incidencia: 'Incidencia', cancelada: 'Cancelada',
  };
  const [bg, txt] = (STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600').split(' ');

  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{item.unitName}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {item.scheduledTime}
          {item.assignedToName
            ? ` · 👤 ${item.assignedToName}`
            : ' · ⚠ Sin asignar'}
        </Text>
      </View>
      <View className={`rounded-full px-2 py-0.5 ${bg}`}>
        <Text className={`text-xs font-medium ${txt}`}>{STATUS_LABELS[item.status]}</Text>
      </View>
    </View>
  );
}

// ─── Booking row ──────────────────────────────────────────────────────────────
function BookingRow({ item, type }: { item: Booking; type: 'checkin' | 'checkout' }) {
  const icon = SOURCE_ICONS[item.source] ?? '📋';
  const dateLabel = type === 'checkout' ? item.departureDate : item.arrivalDate;
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{item.unitName}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {icon} {item.guests} huéspedes
          {item.specialRequests ? ' · ⚠ Pet. especial' : ''}
        </Text>
      </View>
      <Text className="text-xs text-gray-500">{formatDate(dateLabel)}</Text>
    </View>
  );
}

// ─── Maintenance alert row ────────────────────────────────────────────────────
function MaintenanceAlertRow({ item }: { item: Maintenance }) {
  const PRIORITY_COLORS: Record<string, string> = {
    urgente: 'text-red-600', alta: 'text-orange-600',
    media: 'text-yellow-600', baja: 'text-gray-500',
  };
  return (
    <View className="flex-row items-start py-2.5 border-b border-gray-50">
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{item.title}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{item.unitName}</Text>
      </View>
      <Text className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[item.priority] ?? 'text-gray-500'}`}>
        {item.priority}
      </Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyRow({ text }: { text: string }) {
  return (
    <View className="py-3 items-center">
      <Text className="text-sm text-gray-400">{text}</Text>
    </View>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 overflow-hidden">
      {children}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const d = useDashboard();

  if (d.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-400 text-sm mt-3">Cargando...</Text>
      </View>
    );
  }

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const totalAlerts = d.urgentMaintenance.length + d.cleaningsPendingUnassigned.length + d.maintenanceBlockingCheckin.length;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>

      {/* Date header */}
      <View className="mx-4 mb-4">
        <Text className="text-xl font-bold text-gray-900 capitalize">{todayFormatted}</Text>
        <Text className="text-sm text-gray-400 mt-0.5">{d.totalUnits} apartamentos en cartera</Text>
      </View>

      {/* Unit status stats */}
      <Section title="Estado de apartamentos">
        <View className="flex-row gap-2">
          <StatCard label="Libres"       value={d.unitsFree}        bg="bg-green-50"  text="text-green-700" />
          <StatCard label="Ocupados"     value={d.unitsOccupied}    bg="bg-red-50"    text="text-red-700" />
          <StatCard label="Limpieza"     value={d.unitsCleaning}    bg="bg-yellow-50" text="text-yellow-700" />
          <StatCard label="Mant."        value={d.unitsMaintenance} bg="bg-orange-50" text="text-orange-700" />
        </View>
      </Section>

      {/* Alerts */}
      {totalAlerts > 0 && (
        <Section title={`⚠ Alertas (${totalAlerts})`} accent="text-red-500">
          <Card>
            {d.urgentMaintenance.map(m => (
              <MaintenanceAlertRow key={m.id} item={m} />
            ))}
            {d.maintenanceBlockingCheckin.map(m => (
              <View key={`block-${m.id}`} className="flex-row items-start py-2.5 border-b border-gray-50">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-red-700">🚨 Mant. bloquea checkin hoy</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{m.unitName} · {m.title}</Text>
                </View>
              </View>
            ))}
            {d.cleaningsPendingUnassigned.map(c => (
              <View key={`unassigned-${c.id}`} className="flex-row items-start py-2.5 border-b border-gray-50">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-orange-700">👤 Limpieza sin asignar</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{c.unitName} · {c.scheduledTime}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>
      )}

      {/* Today's cleanings */}
      <Section title={`🧹 Limpiezas hoy (${d.cleaningsToday.length})`}>
        <Card>
          {d.cleaningsToday.length === 0
            ? <EmptyRow text="Sin limpiezas programadas para hoy" />
            : d.cleaningsToday
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                .map(c => <CleaningRow key={c.id} item={c} />)
          }
        </Card>
      </Section>

      {/* Today's checkouts */}
      <Section title={`🚪 Salidas hoy (${d.checkoutsToday.length})`}>
        <Card>
          {d.checkoutsToday.length === 0
            ? <EmptyRow text="Sin salidas hoy" />
            : d.checkoutsToday.map(b => <BookingRow key={b.id} item={b} type="checkout" />)
          }
        </Card>
      </Section>

      {/* Today's checkins */}
      <Section title={`🏠 Entradas hoy (${d.checkinsToday.length})`}>
        <Card>
          {d.checkinsToday.length === 0
            ? <EmptyRow text="Sin entradas hoy" />
            : d.checkinsToday.map(b => <BookingRow key={b.id} item={b} type="checkin" />)
          }
        </Card>
      </Section>

      {/* Next 7 days */}
      {(d.upcomingCheckouts.length > 0 || d.upcomingCheckins.length > 0 || d.upcomingCleanings.length > 0) && (
        <Section title="📅 Próximos 7 días">
          <Card>
            {d.upcomingCheckouts.map(b => (
              <View key={`out-${b.id}`} className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
                <View className="flex-row items-center flex-1">
                  <Text className="text-xs text-orange-500 w-16">Salida</Text>
                  <Text className="text-sm text-gray-800 flex-1">{b.unitName}</Text>
                </View>
                <Text className="text-xs text-gray-400">{formatDate(b.departureDate)}</Text>
              </View>
            ))}
            {d.upcomingCheckins.map(b => (
              <View key={`in-${b.id}`} className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
                <View className="flex-row items-center flex-1">
                  <Text className="text-xs text-green-600 w-16">Entrada</Text>
                  <Text className="text-sm text-gray-800 flex-1">{b.unitName}</Text>
                </View>
                <Text className="text-xs text-gray-400">{formatDate(b.arrivalDate)}</Text>
              </View>
            ))}
            {d.upcomingCleanings.map(c => (
              <View key={`cl-${c.id}`} className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
                <View className="flex-row items-center flex-1">
                  <Text className="text-xs text-blue-500 w-16">Limpieza</Text>
                  <Text className="text-sm text-gray-800 flex-1">{c.unitName}</Text>
                </View>
                <Text className="text-xs text-gray-400">{formatDate(c.scheduledDate)}</Text>
              </View>
            ))}
          </Card>
        </Section>
      )}

      {/* Summary */}
      <Section title="Resumen general">
        <View className="flex-row gap-2">
          <StatCard label="Reservas activas"  value={d.activeBookings}   bg="bg-blue-50"   text="text-blue-700" />
          <StatCard label="Mant. abiertos"    value={d.openMaintenance}  bg="bg-orange-50" text="text-orange-700" />
        </View>
      </Section>

    </ScrollView>
  );
}
