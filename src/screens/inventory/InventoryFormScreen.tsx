import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createInventoryItem, updateInventoryItem } from '../../services/inventory.service';
import { getUnits } from '../../services/units.service';
import { InventoryItemFormData, InventoryCategory, Unit } from '../../types';

type Nav = { InventoryForm: { itemId?: string; unitId?: string; unitName?: string } };

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'higiene',     label: '🧴 Higiene' },
  { value: 'cocina',      label: '🍽 Cocina' },
  { value: 'limpieza',    label: '🧽 Limpieza' },
  { value: 'ropa_hogar',  label: '🛏 Ropa hogar' },
  { value: 'otro',        label: '📦 Otro' },
];

const UNITS_OPTIONS = ['unidades', 'rollos', 'botellas', 'sets', 'pares', 'kg', 'litros'];

const DEFAULT_FORM: InventoryItemFormData = {
  unitId: '', unitName: '', name: '', category: 'higiene',
  currentStock: 0, minStock: 2, unit: 'unidades',
  notes: '', lastUpdatedById: '', lastUpdatedByName: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType = 'default' }: any) {
  return (
    <TextInput
      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white"
      value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType}
    />
  );
}

export default function InventoryFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Nav, 'InventoryForm'>>();
  const isEditing = !!route.params?.itemId;

  const [form, setForm] = useState<InventoryItemFormData>({
    ...DEFAULT_FORM,
    unitId: route.params?.unitId ?? '',
    unitName: route.params?.unitName ?? '',
  });
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const unitList = await getUnits();
      setUnits(unitList);
      setInitialLoading(false);
    };
    init();
  }, []);

  const set = (field: keyof InventoryItemFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.unitId) { Alert.alert('Error', 'Selecciona un apartamento'); return; }
    if (!form.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (isEditing) {
        await updateInventoryItem(route.params.itemId!, form);
      } else {
        await createInventoryItem(form);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
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

      <Field label="Nombre del artículo *">
        <Input value={form.name} onChangeText={(v: string) => set('name', v)} placeholder="Ej: Papel higiénico" />
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

      <Field label="Unidad de medida">
        <View className="flex-row flex-wrap gap-2">
          {UNITS_OPTIONS.map(u => (
            <TouchableOpacity
              key={u}
              className={`px-3 py-2 rounded-lg border ${form.unit === u ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              onPress={() => set('unit', u)}
            >
              <Text className={`text-sm ${form.unit === u ? 'text-white' : 'text-gray-700'}`}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Stock actual">
            <Input value={String(form.currentStock)} onChangeText={(v: string) => set('currentStock', parseInt(v) || 0)} keyboardType="numeric" />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Stock mínimo (alerta)">
            <Input value={String(form.minStock)} onChangeText={(v: string) => set('minStock', parseInt(v) || 1)} keyboardType="numeric" />
          </Field>
        </View>
      </View>

      <Field label="Notas">
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white h-16"
          value={form.notes} onChangeText={(v: string) => set('notes', v)}
          multiline textAlignVertical="top" placeholder="Notas adicionales..."
        />
      </Field>

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center mt-2"
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : (
          <Text className="text-white font-semibold text-base">
            {isEditing ? 'Guardar cambios' : 'Añadir artículo'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
