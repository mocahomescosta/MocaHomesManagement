import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createUnit, updateUnit, getUnit } from '../../services/units.service';
import { UnitFormData, UnitStatus } from '../../types';

type RootStackParamList = {
  UnitForm: { unitId?: string };
};

const STATUSES: { value: UnitStatus; label: string }[] = [
  { value: 'listo', label: 'Listo' },
  { value: 'ocupado', label: 'Ocupado' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'bloqueado', label: 'Bloqueado' },
];

const DEFAULT_FORM: UnitFormData = {
  name: '',
  address: { street: '', number: '', city: '', zipCode: '', country: 'España', fullAddress: '' },
  type: 'Apartamento',
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  sofaBed: false,
  hasTerrace: false,
  description: '',
  status: 'listo',
  mainImageURL: '',
  amenities: [],
  wifiInfo: { name: '', password: '' },
  accessInfo: { type: 'Smart Lock', code: '' },
  ownerIds: [],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      {children}
    </View>
  );
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <TextInput
      className={`border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white ${multiline ? 'h-24' : ''}`}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'auto'}
    />
  );
}

export default function UnitFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'UnitForm'>>();
  const isEditing = !!route.params?.unitId;

  const [form, setForm] = useState<UnitFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    getUnit(route.params.unitId!).then(unit => {
      if (unit) {
        const { id, createdAt, updatedAt, ...rest } = unit;
        setForm(rest);
      }
      setInitialLoading(false);
    });
  }, []);

  const set = (field: keyof UnitFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const setAddress = (field: string, value: string) =>
    setForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
        fullAddress:
          field === 'street' || field === 'number' || field === 'city'
            ? `${field === 'street' ? value : prev.address.street} ${field === 'number' ? value : prev.address.number}, ${field === 'city' ? value : prev.address.city}`
            : prev.address.fullAddress,
      },
    }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'El nombre del apartamento es obligatorio');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateUnit(route.params.unitId!, form);
      } else {
        await createUnit(form);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Field label="Nombre del apartamento *">
        <Input value={form.name} onChangeText={v => set('name', v)} placeholder="Ej: Apartamento Centro" />
      </Field>

      <Field label="Tipo">
        <Input value={form.type} onChangeText={v => set('type', v)} placeholder="Apartamento, Estudio..." />
      </Field>

      <Text className="text-sm font-semibold text-gray-700 mb-3">Dirección</Text>
      <Field label="Calle">
        <Input value={form.address.street} onChangeText={v => setAddress('street', v)} />
      </Field>
      <Field label="Número">
        <Input value={form.address.number} onChangeText={v => setAddress('number', v)} />
      </Field>
      <Field label="Ciudad">
        <Input value={form.address.city} onChangeText={v => setAddress('city', v)} />
      </Field>
      <Field label="Código postal">
        <Input value={form.address.zipCode} onChangeText={v => setAddress('zipCode', v)} keyboardType="numeric" />
      </Field>

      <Text className="text-sm font-semibold text-gray-700 mb-3 mt-2">Características</Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Habitaciones">
            <Input
              value={String(form.bedrooms)}
              onChangeText={v => set('bedrooms', parseInt(v) || 0)}
              keyboardType="numeric"
            />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Baños">
            <Input
              value={String(form.bathrooms)}
              onChangeText={v => set('bathrooms', parseInt(v) || 0)}
              keyboardType="numeric"
            />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Máx. huéspedes">
            <Input
              value={String(form.maxGuests)}
              onChangeText={v => set('maxGuests', parseInt(v) || 0)}
              keyboardType="numeric"
            />
          </Field>
        </View>
      </View>

      <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
        <Text className="text-sm text-gray-700">Sofá cama</Text>
        <Switch value={form.sofaBed} onValueChange={v => set('sofaBed', v)} />
      </View>
      <View className="flex-row justify-between items-center py-3 border-b border-gray-100 mb-4">
        <Text className="text-sm text-gray-700">Terraza</Text>
        <Switch value={form.hasTerrace} onValueChange={v => set('hasTerrace', v)} />
      </View>

      <Text className="text-sm font-semibold text-gray-700 mb-3">Estado</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s.value}
            className={`px-4 py-2 rounded-full border ${
              form.status === s.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
            }`}
            onPress={() => set('status', s.value)}
          >
            <Text className={`text-sm ${form.status === s.value ? 'text-white' : 'text-gray-700'}`}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-sm font-semibold text-gray-700 mb-3">WiFi</Text>
      <Field label="Nombre de la red">
        <Input
          value={form.wifiInfo.name}
          onChangeText={v => setForm(p => ({ ...p, wifiInfo: { ...p.wifiInfo, name: v } }))}
        />
      </Field>
      <Field label="Contraseña WiFi">
        <Input
          value={form.wifiInfo.password}
          onChangeText={v => setForm(p => ({ ...p, wifiInfo: { ...p.wifiInfo, password: v } }))}
        />
      </Field>

      <Text className="text-sm font-semibold text-gray-700 mb-3">Acceso</Text>
      <Field label="Tipo de acceso">
        <Input
          value={form.accessInfo.type}
          onChangeText={v => setForm(p => ({ ...p, accessInfo: { ...p.accessInfo, type: v } }))}
          placeholder="Smart Lock, Llave, Caja de llaves..."
        />
      </Field>
      <Field label="Código / Instrucciones">
        <Input
          value={form.accessInfo.code}
          onChangeText={v => setForm(p => ({ ...p, accessInfo: { ...p.accessInfo, code: v } }))}
        />
      </Field>

      <Field label="Descripción">
        <Input
          value={form.description}
          onChangeText={v => set('description', v)}
          multiline
          placeholder="Descripción del apartamento..."
        />
      </Field>

      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-4 items-center mt-4"
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">
            {isEditing ? 'Guardar cambios' : 'Crear apartamento'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
