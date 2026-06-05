import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createCleaning, updateCleaning, getCleaning } from '../../services/cleanings.service';
import { getUnits } from '../../services/units.service';
import { getUsers } from '../../services/users.service';
import { CleaningFormData, CleaningType, Unit, AppUser } from '../../types';

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

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['L','M','X','J','V','S','D'];

const TIMES = Array.from({ length: 49 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

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

// ─── Mini calendar ────────────────────────────────────────────────────────────
function CalendarPicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [visible, setVisible] = useState(false);
  const parsed = value ? new Date(value + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0

  const select = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(d);
    setVisible(false);
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const selDay = value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` ? parsed.getDate() : -1;

  return (
    <>
      <TouchableOpacity
        className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white flex-row justify-between items-center"
        onPress={() => setVisible(true)}
      >
        <Text className="text-sm text-gray-800">{value || 'Seleccionar fecha'}</Text>
        <Text className="text-gray-400">📅</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/40 justify-center items-center" activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-2xl p-4 w-80">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-3">
              <TouchableOpacity onPress={prevMonth} className="p-2"><Text className="text-lg text-blue-600">‹</Text></TouchableOpacity>
              <Text className="text-sm font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={nextMonth} className="p-2"><Text className="text-lg text-blue-600">›</Text></TouchableOpacity>
            </View>
            {/* Day names */}
            <View className="flex-row mb-1">
              {DAYS.map(d => <Text key={d} className="flex-1 text-center text-xs font-medium text-gray-400">{d}</Text>)}
            </View>
            {/* Days grid */}
            <View className="flex-row flex-wrap">
              {cells.map((day, i) => (
                <View key={i} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}>
                  {day ? (
                    <TouchableOpacity
                      className={`flex-1 rounded-full items-center justify-center ${day === selDay ? 'bg-blue-600' : ''}`}
                      onPress={() => select(day)}
                    >
                      <Text className={`text-sm ${day === selDay ? 'text-white font-semibold' : 'text-gray-700'}`}>{day}</Text>
                    </TouchableOpacity>
                  ) : <View className="flex-1" />}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Time picker ──────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white flex-row justify-between items-center"
        onPress={() => setVisible(true)}
      >
        <Text className="text-sm text-gray-800">{value || 'Hora'}</Text>
        <Text className="text-gray-400">🕐</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/40 justify-center items-center" activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-2xl w-40 overflow-hidden" style={{ maxHeight: 300 }}>
            <Text className="text-center text-sm font-semibold text-gray-700 py-3 border-b border-gray-100">Hora</Text>
            <FlatList
              data={TIMES}
              keyExtractor={t => t}
              getItemLayout={(_, i) => ({ length: 44, offset: 44 * i, index: i })}
              initialScrollIndex={Math.max(0, TIMES.indexOf(value))}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`py-3 items-center ${item === value ? 'bg-blue-50' : ''}`}
                  onPress={() => { onChange(item); setVisible(false); }}
                >
                  <Text className={`text-sm ${item === value ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── User picker ──────────────────────────────────────────────────────────────
function UserPicker({ value, onChange, users }: { value: string; onChange: (id: string, name: string) => void; users: AppUser[] }) {
  const [visible, setVisible] = useState(false);
  const selected = users.find(u => u.uid === value);
  return (
    <>
      <TouchableOpacity
        className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white flex-row justify-between items-center"
        onPress={() => setVisible(true)}
      >
        <Text className={`text-sm ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? `${selected.name} (${selected.role})` : 'Seleccionar persona'}
        </Text>
        <Text className="text-gray-400">▾</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/40 justify-center items-center" activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-2xl w-72 overflow-hidden" style={{ maxHeight: 360 }}>
            <Text className="text-center text-sm font-semibold text-gray-700 py-3 border-b border-gray-100">Asignar a</Text>
            <TouchableOpacity
              className="py-3 px-4 border-b border-gray-50"
              onPress={() => { onChange('', ''); setVisible(false); }}
            >
              <Text className="text-sm text-gray-400">Sin asignar</Text>
            </TouchableOpacity>
            <FlatList
              data={users}
              keyExtractor={u => u.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`py-3 px-4 border-b border-gray-50 ${item.uid === value ? 'bg-blue-50' : ''}`}
                  onPress={() => { onChange(item.uid, item.name ?? item.email ?? ''); setVisible(false); }}
                >
                  <Text className={`text-sm font-medium ${item.uid === value ? 'text-blue-600' : 'text-gray-800'}`}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-400 capitalize">{item.role}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CleaningFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CleaningForm'>>();
  const isEditing = !!route.params?.cleaningId;

  const [form, setForm] = useState<CleaningFormData>(DEFAULT_FORM);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [unitList, userList] = await Promise.all([getUnits(), getUsers()]);
      setUnits(unitList);
      setUsers(userList);

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
              onPress={() => setForm(prev => ({ ...prev, unitId: u.id, unitName: u.name }))}
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
        <View className="flex-1">
          <Field label="Fecha">
            <CalendarPicker value={form.scheduledDate} onChange={v => set('scheduledDate', v)} />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Hora">
            <TimePicker value={form.scheduledTime} onChange={v => set('scheduledTime', v)} />
          </Field>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Salida huésped">
            <TimePicker value={form.guestCheckout ?? ''} onChange={v => set('guestCheckout', v)} />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Entrada huésped">
            <TimePicker value={form.guestCheckin ?? ''} onChange={v => set('guestCheckin', v)} />
          </Field>
        </View>
      </View>

      <Field label="Asignada a">
        <UserPicker
          value={form.assignedToId ?? ''}
          onChange={(id, name) => setForm(prev => ({ ...prev, assignedToId: id, assignedToName: name }))}
          users={users}
        />
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
