import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function TelegramSetupScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <Text className="text-base font-bold text-gray-900 mb-2">Configurar Telegram</Text>
        <Text className="text-sm text-gray-600 leading-5">
          El bot de Moca Homes envía notificaciones automáticas al grupo del equipo y mensajes privados cuando se te asigna una tarea.
        </Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Para el manager — URL del webhook</Text>
        <Text className="text-xs text-gray-500 leading-5 mb-2">
          Configura este webhook en Firebase para que el bot reciba comandos:
        </Text>
        <View className="bg-gray-50 rounded-lg p-3">
          <Text className="text-xs font-mono text-gray-700">
            https://us-central1-TU_PROJECT.cloudfunctions.net/telegramWebhook
          </Text>
        </View>
        <Text className="text-xs text-gray-400 mt-2">
          Actívalo con:{'\n'}
          curl -X POST "https://api.telegram.org/botTOKEN/setWebhook" -d "url=URL_ANTERIOR"
        </Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Para cada miembro del equipo</Text>
        <View className="mb-3">
          <Text className="text-xs text-gray-500 font-medium mb-1">Paso 1</Text>
          <Text className="text-sm text-gray-700">Abre Telegram y busca el bot del equipo</Text>
        </View>
        <View className="mb-3">
          <Text className="text-xs text-gray-500 font-medium mb-1">Paso 2</Text>
          <Text className="text-sm text-gray-700">Escribe <Text className="font-mono bg-gray-100 px-1">/vincular tu@email.com</Text></Text>
        </View>
        <View>
          <Text className="text-xs text-gray-500 font-medium mb-1">Paso 3</Text>
          <Text className="text-sm text-gray-700">El bot confirma la vinculación y empezarás a recibir notificaciones</Text>
        </View>
      </View>
    </ScrollView>
  );
}
