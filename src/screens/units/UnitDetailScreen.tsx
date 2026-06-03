import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUnit, deleteUnit } from '../../services/units.service';
import { Unit, UnitStatus } from '../../types';

type RootStackParamList = {
  UnitDetail: { unitId: string };
  UnitForm: { unitId?: string };
  UnitsList: undefined;
};

const STATUS_LABELS: Record<UnitStatus, string> = {
  listo: 'Listo',
  ocupado: 'Ocupado',
  limpieza: 'En limpieza',
  mantenimiento: 'Mantenimiento',
  bloqueado: 'Bloqueado',
};

const STATUS_COLORS: Record<UnitStatus, string> = {
  listo: 'bg-green-500',
  ocupado: 'bg-red-500',
  limpieza: 'bg-yellow-500',
  mantenimiento: 'bg-orange-500',
  bloqueado: 'bg-gray-500',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-100">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-800">{value}</Text>
    </View>
  );
}

export default function UnitDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'UnitDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnit(route.params.unitId).then(u => {
      setUnit(u);
      setLoading(false);
    });
  }, [route.params.unitId]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar apartamento',
      `¿Estás seguro de que quieres eliminar "${unit?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteUnit(route.params.unitId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!unit) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Apartamento no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xl font-bold text-gray-900 flex-1">{unit.name}</Text>
          <View className={`w-3 h-3 rounded-full ${STATUS_COLORS[unit.status]}`} />
        </View>
        <Text className="text-sm text-gray-500 mb-3">
          {STATUS_LABELS[unit.status]}
        </Text>
        <Text className="text-sm text-gray-600">{unit.address?.fullAddress}</Text>
      </View>

      <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Detalles</Text>
        <InfoRow label="Tipo" value={unit.type} />
        <InfoRow label="Habitaciones" value={String(unit.bedrooms)} />
        <InfoRow label="Baños" value={String(unit.bathrooms)} />
        <InfoRow label="Máx. huéspedes" value={String(unit.maxGuests)} />
        <InfoRow label="Sofá cama" value={unit.sofaBed ? 'Sí' : 'No'} />
        <InfoRow label="Terraza" value={unit.hasTerrace ? 'Sí' : 'No'} />
      </View>

      {unit.wifiInfo?.name ? (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-2">WiFi</Text>
          <InfoRow label="Red" value={unit.wifiInfo.name} />
          <InfoRow label="Contraseña" value={unit.wifiInfo.password} />
        </View>
      ) : null}

      {unit.accessInfo?.code ? (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Acceso</Text>
          <InfoRow label="Tipo" value={unit.accessInfo.type} />
          <InfoRow label="Código" value={unit.accessInfo.code} />
        </View>
      ) : null}

      {unit.description ? (
        <View className="bg-white mx-4 mt-3 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Descripción</Text>
          <Text className="text-sm text-gray-600 leading-5">{unit.description}</Text>
        </View>
      ) : null}

      <View className="flex-row mx-4 mt-4 mb-8 gap-3">
        <TouchableOpacity
          className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
          onPress={() => navigation.navigate('UnitForm', { unitId: unit.id })}
        >
          <Text className="text-white font-semibold">Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-red-50 border border-red-200 rounded-xl py-3 items-center"
          onPress={handleDelete}
        >
          <Text className="text-red-600 font-semibold">Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
