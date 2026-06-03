import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createMaintenance, updateMaintenance, getMaintenanceItem } from '../../services/maintenance.service';
import { getUnits } from '../../services/units.service';
import { MaintenanceFormData, MaintenancePriority, MaintenanceCategory, Unit } from '../../types';

type Nav = { MaintenanceForm: { itemId?: string } };

const PRIORITIES: { value: MaintenancePriority; label: string; color: string }[] = [
  { value: 'baja',    label: 'Baja',    color: '#6b7280' },
  { value: 'media',   label: 'Media',   color: '#d97706' },
  { value: 'alta',    label: 'Alta',    color: '#ea580c' },
  { value: 'urgente', label: 'Urgente', color: '#dc2626' },
];

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: 'fontaneria',        label: 'Fontanería' },
  { value: 'electricidad',      label: 'Electricidad' },
  { value: 'electrodomestico',  label: 'Electrodoméstico' },
  { value: 'muebles',           label: 'Muebles' },
  { value: 'limpieza_profunda', label: 'Limpieza profunda' },
  { value: 'otro',              label: 'Otro' },
];

const DEFAULT_FORM: MaintenanceFormData = {
  unitId: '', unitName: '', title: '', description: '',
  category: 'otro', priority: 'media', status: 'abierta',
  assignedToId: '', assignedToName: '',
  reportedById: '', reportedByName: '',
  estimatedCost: 0, actualCost: 0,
  photos: [], notes: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: any) {
  return (
    <TextInput
      className={`border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white ${multiline ? 'h-20' : ''}`}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      multiline={multiline} textAlignVertical={multiline ? 'top' : 'auto'}
      keyboardType={keyboardType}
    />
  );
}

export default function MaintenanceFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Nav, 'MaintenanceForm'>>();
  const isEditing = !!route.params?.itemId;

  const [form, setForm] = useState<MaintenanceFormData>(DEFAULT_FORM);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const unitList = await getUnits();
      setUnits(unitList);
      if (isEditing) {
        const item = await getMaintenanceItem(route.params.itemId!);
        if (item) {
          const { id, createdAt, updatedAt, resolvedAt, ...rest } = item;
          setForm(rest);
        }
      }
      setInitialLoading(false);
    };
    init();
  }, []);

  const set = (field: keyof MaintenanceFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.unitId) { Alert.alert('Error', 'Selecciona un apartamento'); return; }
    if (!form.title.trim()) { Alert.alert('Error', 'El título es obligatorio'); return; }
    setLoading(true);
    try {
      if (isEditing) {
        await updateMaintenance(route.params.itemId!, form);
      } else {
        await createMaintenance(form);
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
              onPress={() => setForm(p => ({ ...p, unitId: u.id, unitName: u.name }))}
            >
              <Text className={`text-sm ${form.unitId === u.id ? 'text-white' : 'text-gray-700'}`}>{u.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Título *">
        <Input value={form.title} onChangeText={(v: string) => set('title', v)} placeholder="Ej: Grifo cocina con fuga" />
      </Field>

      <Field label="Descripción">
        <Input value={form.description} onChangeText={(v: string) => set('description', v)} multiline placeholder="Describe la incidencia con detalle..." />
      </Field>

      <Field label="Categoría">
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.value}
              className={`px-3 py-2 rounded-lg border ${form.category === c.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              onPress={() => set('category', c.value)}
            >
              <Text className={`text-sm ${form.category === c.value ? 'text-white' : 'text-gray-700'}`}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Prioridad">
        <View className="flex-row gap-2">
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p.value}
              className={`flex-1 py-2.5 rounded-lg border items-center ${form.priority === p.value ? 'border-2' : 'bg-white border-gray-300'}`}
              style={form.priority === p.value ? { borderColor: p.color, backgroundColor: p.color + '15' } : {}}
              onPress={() => set('priority', p.value)}
            >
              <Text style={form.priority === p.value ? { color: p.color } : { color: '#6b7280' }} className="text-sm font-medium">
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Asignado a">
        <Input value={form.assignedToName} onChangeText={(v: string) => set('assignedToName', v)} placeholder="Nombre del técnico" />
      </Field>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Coste estimado (€)">
            <Input value={form.estimatedCost > 0 ? String(form.estimatedCost) : ''} onChangeText={(v: string) => set('estimatedCost', parseFloat(v) || 0)} keyboardType="numeric" placeholder="0" />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Coste real (€)">
            <Input value={form.actualCost > 0 ? String(form.actualCost) : ''} onChangeText={(v: string) => set('actualCost', parseFloat(v) || 0)} keyboardType="numeric" placeholder="0" />
          </Field>
        </View>
      </View>

      <Field label="Notas">
        <Input value={form.notes} onChangeText={(v: string) => set('notes', v)} multiline placeholder="Notas adicionales..." />
      </Field>

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center mt-2"
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white font-semibold text-base">
            {isEditing ? 'Guardar cambios' : 'Crear incidencia'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
