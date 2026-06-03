import React, { useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInventory } from '../../hooks/useInventory';
import { InventoryItem, StockLevel } from '../../types';
import { updateStock } from '../../services/inventory.service';

type Nav = { InventoryForm: { itemId?: string; unitId?: string; unitName?: string } };

const STOCK_CONFIG: Record<StockLevel, { bg: string; text: string; dot: string; label: string }> = {
  ok:      { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'OK' },
  bajo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Bajo' },
  agotado: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Agotado' },
};

function InventoryRow({ item }: { item: InventoryItem }) {
  const cfg = STOCK_CONFIG[item.stockLevel];

  const handleAdjust = (delta: number) => {
    const newStock = Math.max(0, item.currentStock + delta);
    updateStock(item.id, newStock, '').catch(e => Alert.alert('Error', e.message));
  };

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-50">
      <View className={`w-2 h-2 rounded-full mr-3 ${cfg.dot}`} />
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{item.name}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          Mín. {item.minStock} {item.unit}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => handleAdjust(-1)}
        >
          <Text className="text-gray-600 text-base leading-none">−</Text>
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-gray-800 w-8 text-center">
          {item.currentStock}
        </Text>
        <TouchableOpacity
          className="w-7 h-7 rounded-full bg-blue-100 items-center justify-center"
          onPress={() => handleAdjust(1)}
        >
          <Text className="text-blue-600 text-base leading-none">+</Text>
        </TouchableOpacity>
      </View>
      <View className={`ml-3 rounded-full px-2 py-0.5 ${cfg.bg}`}>
        <Text className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</Text>
      </View>
    </View>
  );
}

function groupByUnit(items: InventoryItem[]) {
  const map = new Map<string, { unitId: string; unitName: string; items: InventoryItem[] }>();
  items.forEach(item => {
    const existing = map.get(item.unitId) ?? { unitId: item.unitId, unitName: item.unitName, items: [] };
    existing.items.push(item);
    map.set(item.unitId, existing);
  });
  return Array.from(map.values()).map(u => ({
    title: u.unitName,
    unitId: u.unitId,
    data: u.items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
  }));
}

export default function InventoryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Nav>>();
  const { items, loading } = useInventory();
  const [showLowOnly, setShowLowOnly] = useState(false);

  if (loading) return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;

  const filtered = showLowOnly ? items.filter(i => i.stockLevel !== 'ok') : items;
  const sections = groupByUnit(filtered);
  const lowCount = items.filter(i => i.stockLevel !== 'ok').length;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row mx-4 mt-3 mb-1 gap-2">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-xl items-center border ${!showLowOnly ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
          onPress={() => setShowLowOnly(false)}
        >
          <Text className={`text-sm font-medium ${!showLowOnly ? 'text-white' : 'text-gray-600'}`}>Todo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-xl items-center border ${showLowOnly ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200'}`}
          onPress={() => setShowLowOnly(true)}
        >
          <Text className={`text-sm font-medium ${showLowOnly ? 'text-white' : 'text-gray-600'}`}>
            Stock bajo {lowCount > 0 ? `(${lowCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <InventoryRow item={item} />}
        renderSectionHeader={({ section }) => (
          <View className="bg-white border-b border-gray-100 px-4 py-2 flex-row justify-between items-center">
            <Text className="text-sm font-semibold text-gray-800">{section.title}</Text>
            <TouchableOpacity
              className="bg-blue-50 rounded-lg px-3 py-1"
              onPress={() => navigation.navigate('InventoryForm', {
                unitId: section.unitId,
                unitName: section.title,
              })}
            >
              <Text className="text-blue-600 text-xs font-medium">+ Añadir</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">
              {showLowOnly ? 'No hay artículos con stock bajo' : 'No hay artículos de inventario'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('InventoryForm', {})}
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>
    </View>
  );
}
