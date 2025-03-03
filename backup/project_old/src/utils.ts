import { differenceInDays, parseISO, format } from 'date-fns';
import { Booking, RentalStatus } from './types';

export const formatId = (id: number): string => {
  return String(id).padStart(6, '0');
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy');
};

export const getRentalStatus = (booking: Booking): RentalStatus => {
  const now = new Date();
  const startDate = parseISO(booking.startDate);
  const endDate = parseISO(booking.endDate);

  if (now < startDate) return 'awaiting';
  if (now > endDate) return 'completed';
  return 'ongoing';
};