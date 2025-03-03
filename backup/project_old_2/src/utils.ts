import { differenceInDays, parseISO, format } from 'date-fns';
import { Booking, RentalStatus } from './types';

export const formatId = (id: number): string => {
  return String(id).padStart(6, '0');
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy');
};

export const maskLastName = (lastName: string): string => {
  return lastName.replace(/./g, '*');
};

export const maskPhoneNumber = (phone: string): string => {
  if (!phone || phone.length !== 10) return phone;
  return `${phone.slice(0, 2)}****${phone.slice(6)}`;
};

export const maskUserId = (userId: string): string => {
  if (!userId) return userId;
  const start = userId.slice(0, 6);
  const end = userId.slice(-6);
  return `${start}...${end}`;
};

export const getRentalStatus = (booking: Booking): RentalStatus => {
  const now = new Date();
  const startDate = parseISO(booking.startDate);
  const endDate = parseISO(booking.endDate);

  if (now < startDate) return 'awaiting';
  if (now > endDate) return 'completed';
  return 'ongoing';
};