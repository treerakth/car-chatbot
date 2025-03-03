export interface Booking {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  startProvince: string;
  endProvince: string;
  carType: string;
  carBrand: string;
}

export type BookingStatus = 'pending' | 'denied' | 'approved';
export type RentalStatus = 'awaiting' | 'ongoing' | 'completed';