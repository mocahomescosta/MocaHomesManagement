import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import { createPeriodicMaintenance, updatePeriodicMaintenance, markPeriodicDone } from '../../services/maintenance.service';
import { getUnits } from '../../services/units.service';
import { getUsers } from '../../services/users.service';
import { Unit, AppUser, MaintenanceCategory, MaintenanceFrequency, PeriodicMaintenance } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: 'fontaneria',       label: 'Fontanería' },
  { value: 'electricidad',     label: 'Electricidad' },
  { value: 'electrodomestico', label: 'Electrodoméstico' },
  { value: 'muebles',          label: 'Muebles' },
  { value: 'limpieza_profunda',label: 'Limpieza profunda' },
  { value: 'otro',             label: 'Otro' },
];

const FREQUENCIES: { value: MaintenanceFrequency; label: string; days: number }[] = [
  { value: 'semanal',     label: 'Semanal',     days: 7 },
  { value: 'quincenal',   label: 'Quincenal',   days: 14 },
  { value: 'mensual',     label: 'Mensual',     days: 30 },
  { value: 'trimestral',  label: 'Trimestral',  days: 90 },
  { value: 'semestral',   label: 'Semestral',   days: 180 },
  { value: 'anual',       label: 'Anual',       days: 365 },
];

function SelectRow({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs text-gray-500 mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-full border ${value === o.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
          >
            <Text className={`text-xs font-medium ${value === o.value ? 'text-white' : 'text-gray-600'}`}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PeriodicFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const itemId = route.params?.itemId;
  const isEdit = !!itemId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('otro');
  const [frequency, setFrequency] = useState<MaintenanceFrequency>('mensual');
  const [nextDateStr, setNextDateStr] = useState('');
  const [unitId, setUnitId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    const today = new Date();
    setNextDateStr(today.toISOString().split('T')[0]);
    Promise.all([getUnits(), getUsers()]).then(([u, us]) => {
      setUnits(u);
      setUsers(us.filter(u => u.role === 'Technician' || u.role === 'Manager' || u.role === 'Admin'));
    });
    if (isEdit) {
      getDoc(doc(db, 'periodicMaintenance', itemId)).then(snap => {
        if (snap.exists()) {
          const d = snap.data() as PeriodicMaintenance;
          setTitle(d.title);
          setDescription(d.description || '');
          setCategory(d.category);
          setFrequency(d.frequency);
          setUnitId(d.unitId);
          setUnitName(d.unitName);
          setAssignedToId(d.assignedToId || '');
          setAssignedToName(d.assignedToName || '');
          const nd = d.nextDate?.toDate ? d.nextDate.toDate() : new Date(d.nextDate);
          setNextDateStr(nd.toISOString().split('T')[0]);
        }
        setLoading(false);
      });
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'El título es obligatorio'); return; }
    if (!unitId) { Alert.alert('Error', 'Selecciona un apartamento'); return; }
    if (!nextDateStr) { Alert.alert('Error', 'Indica la próxima fecha'); return; }

    setSaving(true);
    try {
      const nextDate = new Date(nextDateStr + 'T12:00:00');
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        frequency,
        nextDate,
        unitId,
        unitName,
        assignedToId,
        assignedToName,
        active: true,
        lastCompletedDate: null,
      };
      if (isEdit) {
        await updatePeriodicMaintenance(itemId, payload);
      } else {
        await createPeriodicMaintenance(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async () => {
    if (!isEdit) return;
    const freq = FREQUENCIES.find(f => f.value === frequency);
    const next = new Date();
    next.setDate(next.getDate() + (freq?.days ?? 30));
    Alert.alert('Marcar como realizado', `La próxima revisión se programará para el ${next.toLocaleDateString('es-ES')}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        await markPeriodicDone(itemId, next);
        navigation.goBack();
      }},
    ]);
  };

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2563eb" /></View>;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>

      <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <Text className="text-xs font-semibold text-gray-500 mb-3">TAREA</Text>

        <Text className="text-xs text-gray-500 mb-1">Título *</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2.5 mb-3 text-sm text-gray-800"
          placeholder="Ej: Revisión caldera, Limpieza filtros AC..."
          value={title}
          onChangeText={setTitle}
        />

        <Text className="text-xs text-gray-500 mb-1">Descripción</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2.5 mb-3 text-sm text-gray-800"
          placeholder="Instrucciones o notas..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 70, textAlignVertical: 'top' }}
        />

        <SelectRow label="Categoría" options={CATEGORIES} value={category} onChange={v => setCategory(v as MaintenanceCategory)} />
        <SelectRow label="Frecuencia" options={FREQUENCIES} value={frequency} onChange={v => setFrequency(v as MaintenanceFrequency)} />

        <Text className="text-xs text-gray-500 mb-1">Próxima fecha (AAAA-MM-DD) *</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800"
          placeholder="2026-07-01"
          value={nextDateStr}
          onChangeText={setNextDateStr}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <Text className="text-xs font-semibold text-gray-500 mb-3">APARTAMENTO *</Text>
        {units.map(u => (
          <TouchableOpacity
            key={u.id}
            onPress={() => { setUnitId(u.id); setUnitName(u.name); }}
            className={`flex-row items-center p-3 rounded-lg mb-1.5 border ${unitId === u.id ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
          >
            <Text className={`text-sm flex-1 ${unitId === u.id ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{u.name}</Text>
            {unitId === u.id && <Text className="text-blue-600">✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <Text className="text-xs font-semibold text-gray-500 mb-3">RESPONSABLE</Text>
        <TouchableOpacity
          onPress={() => { setAssignedToId(''); setAssignedToName(''); }}
          className={`flex-row items-center p-3 rounded-lg mb-1.5 border ${!assignedToId ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
        >
          <Text className={`text-sm flex-1 ${!assignedToId ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>Sin asignar</Text>
          {!assignedToId && <Text className="text-blue-600">✓</Text>}
        </TouchableOpacity>
        {users.map(u => (
          <TouchableOpacity
            key={u.uid}
            onPress={() => { setAssignedToId(u.uid); setAssignedToName(u.name); }}
            className={`flex-row items-center p-3 rounded-lg mb-1.5 border ${assignedToId === u.uid ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
          >
            <Text className={`text-sm flex-1 ${assignedToId === u.uid ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{u.name}</Text>
            {assignedToId === u.uid && <Text className="text-blue-600">✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {isEdit && (
        <TouchableOpacity
          className="bg-green-50 border border-green-200 rounded-xl py-4 items-center mb-3"
          onPress={handleMarkDone}
        >
          <Text className="text-green-700 font-semibold">✓ Marcar como realizado hoy</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center"
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold text-base">{isEdit ? 'Guardar cambios' : 'Crear mantenimiento periódico'}</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
}
