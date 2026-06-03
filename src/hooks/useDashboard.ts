import { useState, useEffect } from 'react';
import { Cleaning, Maintenance, Booking, Unit } from '../types';
import { subscribeToCleanings } from '../services/cleanings.service';
import { subscribeToMaintenance } from '../services/maintenance.service';
import { subscribeToBookings } from '../services/bookings.service';
import { subscribeToUnits } from '../services/units.service';

const today = () => new Date().toISOString().split('T')[0];

export interface DashboardData {
  // Today's operations
  checkoutsToday: Booking[];
  checkinsToday: Booking[];
  cleaningsToday: Cleaning[];
  cleaningsPendingUnassigned: Cleaning[];

  // Unit status counts
  totalUnits: number;
  unitsOccupied: number;
  unitsFree: number;
  unitsCleaning: number;
  unitsMaintenance: number;

  // Alerts
  urgentMaintenance: Maintenance[];
  openMaintenanceOld: Maintenance[];  // open > 7 days (we'll just take all open for now)
  maintenanceBlockingCheckin: Maintenance[];

  // Next 7 days
  upcomingCleanings: Cleaning[];  // next 7 days
  upcomingCheckouts: Booking[];   // next 7 days
  upcomingCheckins: Booking[];    // next 7 days

  // Summary counts
  activeBookings: number;
  openMaintenance: number;

  loading: boolean;
}

export const useDashboard = (): DashboardData => {
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState({ c: false, m: false, b: false, u: false });

  useEffect(() => {
    const mark = (key: keyof typeof loaded) =>
      setLoaded(prev => {
        const next = { ...prev, [key]: true };
        if (next.c && next.m && next.b && next.u) setLoading(false);
        return next;
      });

    const u1 = subscribeToCleanings(d => { setCleanings(d); mark('c'); });
    const u2 = subscribeToMaintenance(d => { setMaintenance(d); mark('m'); });
    const u3 = subscribeToBookings(d => { setBookings(d); mark('b'); });
    const u4 = subscribeToUnits(d => { setUnits(d); mark('u'); });
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const todayStr = today();

  // Next 7 days range
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  // Today
  const checkoutsToday = bookings.filter(b => b.departureDate === todayStr && ['booked','open_bill'].includes(b.status));
  const checkinsToday = bookings.filter(b => b.arrivalDate === todayStr && ['booked','open_bill'].includes(b.status));
  const cleaningsToday = cleanings.filter(c => c.scheduledDate === todayStr && c.status !== 'cancelada');
  const cleaningsPendingUnassigned = cleaningsToday.filter(c => c.status === 'pendiente' && !c.assignedToName);

  // Unit status
  const unitsOccupied = units.filter(u => u.status === 'ocupado').length;
  const unitsFree = units.filter(u => u.status === 'listo').length;
  const unitsCleaning = units.filter(u => u.status === 'limpieza').length;
  const unitsMaintenance = units.filter(u => u.status === 'mantenimiento').length;

  // Alerts
  const urgentMaintenance = maintenance.filter(m => m.priority === 'urgente' && !['resuelta','cancelada'].includes(m.status));
  const openMaintenanceOld = maintenance.filter(m => !['resuelta','cancelada'].includes(m.status) && m.priority === 'alta');
  const maintenanceBlockingCheckin = maintenance.filter(m =>
    !['resuelta','cancelada'].includes(m.status) &&
    checkinsToday.some(b => b.unitId === m.unitId)
  );

  // Next 7 days
  const upcomingCleanings = cleanings.filter(c =>
    c.scheduledDate > todayStr && c.scheduledDate <= in7DaysStr && c.status !== 'cancelada'
  ).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const upcomingCheckouts = bookings.filter(b =>
    b.departureDate > todayStr && b.departureDate <= in7DaysStr && ['booked','open_bill'].includes(b.status)
  ).sort((a, b) => a.departureDate.localeCompare(b.departureDate));

  const upcomingCheckins = bookings.filter(b =>
    b.arrivalDate > todayStr && b.arrivalDate <= in7DaysStr && ['booked','open_bill'].includes(b.status)
  ).sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));

  // Summary
  const activeBookings = bookings.filter(b => ['booked','open_bill','tentative'].includes(b.status)).length;
  const openMaintenance = maintenance.filter(m => !['resuelta','cancelada'].includes(m.status)).length;

  return {
    checkoutsToday, checkinsToday, cleaningsToday, cleaningsPendingUnassigned,
    totalUnits: units.length, unitsOccupied, unitsFree, unitsCleaning, unitsMaintenance,
    urgentMaintenance, openMaintenanceOld, maintenanceBlockingCheckin,
    upcomingCleanings, upcomingCheckouts, upcomingCheckins,
    activeBookings, openMaintenance, loading,
  };
};
