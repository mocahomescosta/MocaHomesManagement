import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMaintenanceItem, updateMaintenanceStatus } from '../../services/maintenance.service';
import { Maintenance, MaintenanceStatus, MaintenancePriority } from '../../types';

type Nav = { MaintenanceDetail: { itemId: string }; MaintenanceForm: { itemId?: string } };

const PRIORITY_CONFIG: Record<MaintenancePriority, { label: string; color: string }> = {
  baja:    { label: 'Baja',    color: '#6b7280' },
  media:   { label: 'Media',   color: '#d97706' },
  alta:    { label: 'Alta',    color: '#ea580c' },
  urgente: { label: 'Urgente', color: '#dc2626' },
};

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; color: string }> = {
  abierta:            { label: 'Abierta',          color: '#6b7280' },
  en_progreso:        { label: 'En progreso',       color: '#2563eb' },
  esperando_material: { label: 'Esp. material',     color: '#d97706' },
  resuelta:           { label: 'Resuelta',          color: '#16a34a' },
  cancelada:          { label: 'Cancelada',         color: '#9ca3af' },
};

const STATUS_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  abierta:            ['en_progreso', 'cancelada'],
  en_progreso:        ['esperando_material', 'resuelta'],
  esperando_material: ['en_progreso', 'resuelta'],
  resuelta:           [],
  cancelada:          ['abierta'],
};

const CATEGORY_LABELS: Record<string, string> = {
  fontaneria: 'Fontanería', electricidad: 'Electricidad',
  electrodomestico: 'Electrodoméstico', muebles: 'Muebles',
  limpieza_profunda: 'Limpieza profunda', otro: 'Otro',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-800 flex-1 text-right ml-4">{value}</Text>
    </View>
  );
}

export default function MaintenanceDetailScreen() {
  const route = useRoute<RouteProp<Nav, 'MaintenanceDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const [item, setItem] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getMaintenanceItem(route.params.itemId).then(i => { setItem(i); setLoading(false); });
  }, []);

  const handleStatus = async (status: MaintenanceStatus) => {
    if (!item) return;
    setUpdating(true);
    await updateMaintenanceStatus(item.id, status);
    setItem(prev => prev ? { ...prev, status } : null);
    setUpdating(false);
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!item) return <View className="flex-1 items-center justify-center"><Text className="text-gray-500">Incidencia no encontrada</Text></View>;

  const priCfg = PRIORITY_CONFIG[item.priority];
  const staCfg = STATUS_CONFIG[item.status];
  const transitions = STATUS_TRANSITIONS[item.status];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-900">{item.title}</Text>
        <View className="flex-row mt-2 gap-3">
          <Text style={{ color: priCfg.color }} className="text-sm font-semibold">{priCfg.label}</Text>
          <Text className="text-sm text-gray-400">·</Text>
          <Text style={{ color: staCfg.color }} className="text-sm font-semibold">{staCfg.label}</Text>
        </View>
        <Text className="text-sm text-gray-600 mt-1">{item.unitName}</Text>
      </View>

      {/* Description */}
      {item.description ? (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-xs font-semibold text-gray-500 mb-2">DESCRIPCIÓN</Text>
          <Text className="text-sm text-gray-700 leading-5">{item.description}</Text>
        </View>
      ) : null}

      {/* Details */}
      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-xs font-semibold text-gray-500 mb-2">DETALLES</Text>
        <InfoRow label="Categoría" value={CATEGORY_LABELS[item.category] ?? item.category} />
        {item.assignedToName ? <InfoRow label="Asignado a" value={item.assignedToName} /> : null}
        {item.reportedByName ? <InfoRow label="Reportado por" value={item.reportedByName} /> : null}
        {item.estimatedCost > 0 ? <InfoRow label="Coste estimado" value={`${item.estimatedCost} €`} /> : null}
        {item.actualCost > 0 ? <InfoRow label="Coste real" value={`${item.actualCost} €`} /> : null}
      </View>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <View className="mx-4 mt-3">
          <Text className="text-xs text-gray-500 mb-2 font-medium">CAMBIAR ESTADO</Text>
          <View className="flex-row gap-2 flex-wrap">
            {transitions.map(s => (
              <TouchableOpacity
                key={s}
                className="bg-white border border-blue-300 rounded-xl px-4 py-2"
                onPress={() => handleStatus(s)}
                disabled={updating}
              >
                <Text className="text-blue-600 text-sm font-medium">{STATUS_CONFIG[s].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Notes */}
      {item.notes ? (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-xs font-semibold text-gray-500 mb-2">NOTAS</Text>
          <Text className="text-sm text-gray-700 leading-5">{item.notes}</Text>
        </View>
      ) : null}

      {/* Edit */}
      <TouchableOpacity
        className="bg-blue-600 mx-4 mt-4 rounded-xl py-4 items-center"
        onPress={() => navigation.navigate('MaintenanceForm', { itemId: item.id })}
      >
        <Text className="text-white font-semibold">Editar incidencia</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
