import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCleaning, updateCleaningStatus, updateChecklist } from '../../services/cleanings.service';
import { Cleaning, CleaningStatus, ChecklistItem } from '../../types';

type RootStackParamList = {
  CleaningDetail: { cleaningId: string };
  CleaningForm: { cleaningId?: string };
};

const STATUS_CONFIG: Record<CleaningStatus, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',   color: '#6b7280' },
  en_curso:   { label: 'En curso',    color: '#2563eb' },
  completada: { label: 'Completada',  color: '#16a34a' },
  verificada: { label: 'Verificada',  color: '#7c3aed' },
  incidencia: { label: 'Incidencia',  color: '#dc2626' },
};

const STATUS_TRANSITIONS: Record<CleaningStatus, CleaningStatus[]> = {
  pendiente:  ['en_curso'],
  en_curso:   ['completada', 'incidencia'],
  completada: ['verificada', 'incidencia'],
  verificada: [],
  incidencia: ['en_curso'],
};

const TYPE_LABELS: Record<string, string> = {
  checkout: 'Checkout', mantenimiento: 'Mantenimiento', extra: 'Extra',
};

export default function CleaningDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CleaningDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cleaning, setCleaning] = useState<Cleaning | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = () => {
    getCleaning(route.params.cleaningId).then(c => {
      setCleaning(c);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (newStatus: CleaningStatus) => {
    if (!cleaning) return;
    setUpdatingStatus(true);
    try {
      await updateCleaningStatus(cleaning.id, newStatus);
      setCleaning(prev => prev ? { ...prev, status: newStatus } : null);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!cleaning) return;
    const updated = cleaning.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setCleaning(prev => prev ? { ...prev, checklist: updated } : null);
    await updateChecklist(cleaning.id, updated);
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!cleaning) return <View className="flex-1 items-center justify-center"><Text className="text-gray-500">Limpieza no encontrada</Text></View>;

  const cfg = STATUS_CONFIG[cleaning.status];
  const transitions = STATUS_TRANSITIONS[cleaning.status];
  const completedCount = cleaning.checklist.filter(i => i.completed).length;
  const totalCount = cleaning.checklist.length;

  const groupedChecklist = cleaning.checklist.reduce((acc, item) => {
    const area = item.area || 'General';
    acc[area] = acc[area] ?? [];
    acc[area].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header card */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-900 flex-1">{cleaning.unitName}</Text>
          <Text style={{ color: cfg.color }} className="text-sm font-semibold">{cfg.label}</Text>
        </View>
        <Text className="text-sm text-gray-500 mt-1">
          {cleaning.scheduledDate} · {cleaning.scheduledTime} · {TYPE_LABELS[cleaning.type]}
        </Text>
        {cleaning.assignedToName ? (
          <Text className="text-sm text-gray-500 mt-0.5">Asignada a: {cleaning.assignedToName}</Text>
        ) : null}
        {cleaning.guestCheckout || cleaning.guestCheckin ? (
          <View className="flex-row mt-2 gap-4">
            {cleaning.guestCheckout ? <Text className="text-xs text-orange-600">Salida huésped: {cleaning.guestCheckout}</Text> : null}
            {cleaning.guestCheckin  ? <Text className="text-xs text-blue-600">Entrada huésped: {cleaning.guestCheckin}</Text>  : null}
          </View>
        ) : null}
      </View>

      {/* Status actions */}
      {transitions.length > 0 && (
        <View className="mx-4 mt-3">
          <Text className="text-xs text-gray-500 mb-2 font-medium">CAMBIAR ESTADO</Text>
          <View className="flex-row gap-2 flex-wrap">
            {transitions.map(s => (
              <TouchableOpacity
                key={s}
                className="bg-white border border-blue-300 rounded-xl px-4 py-2"
                onPress={() => handleStatusChange(s)}
                disabled={updatingStatus}
              >
                <Text className="text-blue-600 text-sm font-medium">{STATUS_CONFIG[s].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Checklist */}
      {cleaning.checklist.length > 0 && (
        <View className="mx-4 mt-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs text-gray-500 font-medium">CHECKLIST</Text>
            <Text className="text-xs text-gray-400">{completedCount}/{totalCount}</Text>
          </View>

          {/* Progress bar */}
          <View className="bg-gray-200 rounded-full h-1.5 mb-3">
            <View
              className="bg-green-500 rounded-full h-1.5"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            />
          </View>

          {Object.entries(groupedChecklist).map(([area, items]) => (
            <View key={area} className="bg-white rounded-xl mb-2 overflow-hidden shadow-sm">
              <View className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <Text className="text-xs font-semibold text-gray-600">{area}</Text>
              </View>
              {(items as ChecklistItem[]).sort((a, b) => a.order - b.order).map(item => (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center px-4 py-3 border-b border-gray-50"
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {item.completed && <Text className="text-white text-xs">✓</Text>}
                  </View>
                  <Text className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      {cleaning.notes ? (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-xs font-semibold text-gray-500 mb-2">NOTAS</Text>
          <Text className="text-sm text-gray-700 leading-5">{cleaning.notes}</Text>
        </View>
      ) : null}

      {/* Issues */}
      {cleaning.issues.length > 0 && (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-xs font-semibold text-red-500 mb-2">INCIDENCIAS ({cleaning.issues.length})</Text>
          {cleaning.issues.map(issue => (
            <View key={issue.id} className="mb-2">
              <Text className="text-sm text-gray-700">{issue.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Edit button */}
      <TouchableOpacity
        className="bg-blue-600 mx-4 mt-4 rounded-xl py-4 items-center"
        onPress={() => navigation.navigate('CleaningForm', { cleaningId: cleaning.id })}
      >
        <Text className="text-white font-semibold">Editar limpieza</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
