import axios from 'axios';
import { Booking, BookingStatus } from './types';

const API_URL = 'http://localhost:3001';

export const fetchBookings = async (): Promise<Booking[]> => {
  const response = await axios.get(`${API_URL}/bookings`);
  return response.data;
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<void> => {
  await axios.put(`${API_URL}/bookings/${id}/status`, { status });
};