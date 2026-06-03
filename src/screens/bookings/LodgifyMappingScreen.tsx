import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { getUnits, updateUnit } from '../../services/units.service';
import { Unit } from '../../types';

export default function LodgifyMappingScreen() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUnits().then(list => {
      setUnits(list);
      const initial: Record<string, string> = {};
      list.forEach(u => { initial[u.id] = (u as any).lodgifyPropertyId ?? ''; });
      setMappings(initial);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        units.map(u =>
          updateUnit(u.id, { lodgifyPropertyId: mappings[u.id] ?? '' } as any)
        )
      );
      Alert.alert('✓ Guardado', 'Los IDs de Lodgify han sido guardados correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
        <Text className="text-sm font-semibold text-blue-700 mb-1">¿Cómo encontrar el ID de Lodgify?</Text>
        <Text className="text-xs text-blue-600 leading-4">
          En Lodgify ve a Settings → Properties → selecciona la propiedad. El ID aparece en la URL: /properties/&lt;ID&gt;/edit
        </Text>
      </View>

      {units.map(unit => (
        <View key={unit.id} className="bg-white rounded-xl mb-3 p-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-900 mb-1">{unit.name}</Text>
          <Text className="text-xs text-gray-400 mb-2">{unit.address?.city}</Text>
          <Text className="text-xs text-gray-500 mb-1">Lodgify Property ID</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-gray-50"
            value={mappings[unit.id] ?? ''}
            onChangeText={v => setMappings(prev => ({ ...prev, [unit.id]: v }))}
            placeholder="Ej: 123456"
            keyboardType="numeric"
          />
        </View>
      ))}

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center mt-2"
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="white" /> : (
          <Text className="text-white font-semibold text-base">Guardar configuración</Text>
        )}
      </TouchableOpacity>

      <View className="bg-gray-100 rounded-xl p-4 mt-4">
        <Text className="text-xs font-semibold text-gray-600 mb-2">URL del Webhook para Lodgify</Text>
        <Text className="text-xs text-gray-500 font-mono leading-5">
          https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/lodgifyWebhook
        </Text>
        <Text className="text-xs text-gray-400 mt-2">
          Configura esta URL en Lodgify → Settings → API & Webhooks → Webhooks
        </Text>
      </View>
    </ScrollView>
  );
}
