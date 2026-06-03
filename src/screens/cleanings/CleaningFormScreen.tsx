import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createCleaning, updateCleaning, getCleaning } from '../../services/cleanings.service';
import { getUnits } from '../../services/units.service';
import { CleaningFormData, CleaningType, Unit } from '../../types';

type RootStackParamList = {
  CleaningForm: { cleaningId?: string };
};

const TYPES: { value: CleaningType; label: string }[] = [
  { value: 'checkout', label: 'Checkout' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'extra', label: 'Extra' },
];

const DEFAULT_CHECKLIST = [
  { id: '1', name: 'Cambiar ropa de cama', area: 'Dormitorio', order: 1, completed: false, notes: '' },
  { id: '2', name: 'Limpiar y desinfectar baño', area: 'Baño', order: 2, completed: false, notes: '' },
  { id: '3', name: 'Fregar suelos', area: 'General', order: 3, completed: false, notes: '' },
  { id: '4', name: 'Limpiar cocina y electrodomésticos', area: 'Cocina', order: 4, completed: false, notes: '' },
  { id: '5', name: 'Reponer consumibles (gel, champú, papel)', area: 'Baño', order: 5, completed: false, notes: '' },
  { id: '6', name: 'Sacar basura', area: 'General', order: 6, completed: false, notes: '' },
  { id: '7', name: 'Revisar inventario', area: 'General', order: 7, completed: false, notes: '' },
];

const today = new Date().toISOString().split('T')[0];

const DEFAULT_FORM: CleaningFormData = {
  unitId: '',
  unitName: '',
  assignedToId: '',
  assignedToName: '',
  type: 'checkout',
  status: 'pendiente',
  scheduledDate: today,
  scheduledTime: '10:00',
  checklist: DEFAULT_CHECKLIST,
  issues: [],
  notes: '',
  guestCheckout: '11:00',
  guestCheckin: '15:00',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  return (
    <TextInput
      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
    />
  );
}

export default function CleaningFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CleaningForm'>>();
  const isEditing = !!route.params?.cleaningId;

  const [form, setForm] = useState<CleaningFormData>(DEFAULT_FORM);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const unitList = await getUnits();
      setUnits(unitList);

      if (isEditing) {
        const cleaning = await getCleaning(route.params.cleaningId!);
        if (cleaning) {
          const { id, createdAt, updatedAt, startedAt, completedAt, ...rest } = cleaning;
          setForm(rest);
        }
      }
      setInitialLoading(false);
    };
    init();
  }, []);

  const set = (field: keyof CleaningFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const selectUnit = (unit: Unit) => {
    setForm(prev => ({ ...prev, unitId: unit.id, unitName: unit.name }));
  };

  const handleSave = async () => {
    if (!form.unitId) { Alert.alert('Error', 'Selecciona un apartamento'); return; }
    setLoading(true);
    try {
      if (isEditing) {
        await updateCleaning(route.params.cleaningId!, form);
      } else {
        await createCleaning(form);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      <Field label="Apartamento *">
        <View className="flex-row flex-wrap gap-2">
          {units.map(u => (
            <TouchableOpacity
              key={u.id}
              className={`px-3 py-2 rounded-lg border ${form.unitId === u.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              onPress={() => selectUnit(u)}
            >
              <Text className={`text-sm ${form.unitId === u.id ? 'text-white' : 'text-gray-700'}`}>{u.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Tipo de limpieza">
        <View className="flex-row gap-2">
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              className={`flex-1 py-2 rounded-lg border items-center ${form.type === t.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              onPress={() => set('type', t.value)}
            >
              <Text className={`text-sm ${form.type === t.value ? 'text-white' : 'text-gray-700'}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <View className="flex-row gap-3">
        <View className="flex-1"><Field label="Fecha"><Input value={form.scheduledDate} onChangeText={v => set('scheduledDate', v)} placeholder="2026-06-10" /></Field></View>
        <View className="flex-1"><Field label="Hora"><Input value={form.scheduledTime} onChangeText={v => set('scheduledTime', v)} placeholder="10:00" /></Field></View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1"><Field label="Salida huésped"><Input value={form.guestCheckout} onChangeText={v => set('guestCheckout', v)} placeholder="11:00" /></Field></View>
        <View className="flex-1"><Field label="Entrada huésped"><Input value={form.guestCheckin} onChangeText={v => set('guestCheckin', v)} placeholder="15:00" /></Field></View>
      </View>

      <Field label="Asignada a (nombre)">
        <Input value={form.assignedToName} onChangeText={v => set('assignedToName', v)} placeholder="Nombre de la limpiadora" />
      </Field>

      <Field label="Notas">
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white h-20"
          value={form.notes}
          onChangeText={v => set('notes', v)}
          multiline
          textAlignVertical="top"
          placeholder="Instrucciones especiales..."
        />
      </Field>

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center mt-2"
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white font-semibold text-base">
            {isEditing ? 'Guardar cambios' : 'Crear limpieza'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
