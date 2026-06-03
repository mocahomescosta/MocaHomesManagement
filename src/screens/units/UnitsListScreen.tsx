import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUnits } from '../../hooks/useUnits';
import { Unit, UnitStatus } from '../../types';

type RootStackParamList = {
  UnitDetail: { unitId: string };
  UnitForm: { unitId?: string };
};

const STATUS_COLORS: Record<UnitStatus, string> = {
  listo: 'bg-green-100 text-green-700',
  ocupado: 'bg-red-100 text-red-700',
  limpieza: 'bg-yellow-100 text-yellow-700',
  mantenimiento: 'bg-orange-100 text-orange-700',
  bloqueado: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<UnitStatus, string> = {
  listo: 'Listo',
  ocupado: 'Ocupado',
  limpieza: 'Limpieza',
  mantenimiento: 'Mantenimiento',
  bloqueado: 'Bloqueado',
};

function UnitCard({ unit, onPress }: { unit: Unit; onPress: () => void }) {
  const statusStyle = STATUS_COLORS[unit.status] ?? 'bg-gray-100 text-gray-700';
  const [bgColor, textColor] = statusStyle.split(' ');

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-gray-100"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-base font-semibold text-gray-900 flex-1">{unit.name}</Text>
        <View className={`rounded-full px-3 py-1 ${bgColor}`}>
          <Text className={`text-xs font-medium ${textColor}`}>
            {STATUS_LABELS[unit.status]}
          </Text>
        </View>
      </View>
      <Text className="text-sm text-gray-500 mt-1">{unit.address?.city ?? ''}</Text>
      <View className="flex-row mt-2 gap-3">
        <Text className="text-xs text-gray-400">{unit.bedrooms} hab.</Text>
        <Text className="text-xs text-gray-400">{unit.bathrooms} baños</Text>
        <Text className="text-xs text-gray-400">Máx. {unit.maxGuests} huéspedes</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function UnitsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { units, loading } = useUnits();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={units}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <UnitCard
            unit={item}
            onPress={() => navigation.navigate('UnitDetail', { unitId: item.id })}
          />
        )}
        ListHeaderComponent={<View className="h-4" />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">No hay apartamentos todavía</Text>
            <Text className="text-gray-400 text-sm mt-1">Pulsa + para añadir uno</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('UnitForm', {})}
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}
