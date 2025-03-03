import React, { useState, useEffect } from 'react';
import { CarFront, ChevronDown, Moon, Sun, Table as TableIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Booking, BookingStatus, RentalStatus } from './types';
import { fetchBookings, updateBookingStatus } from './api';
import { formatId, getRentalStatus, formatDate } from './utils';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  const [showApproved, setShowApproved] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const loadBookings = async () => {
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    const confirmed = window.confirm('Are you sure you want to update the status?');
    if (!confirmed) return;

    try {
      await updateBookingStatus(id, newStatus);
      setBookings(bookings.map(booking => 
        booking.id === id ? { ...booking, status: newStatus } : booking
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: BookingStatus | RentalStatus) => {
    const colors = {
      // Booking statuses
      pending: {
        light: 'bg-amber-100 text-amber-800',
        dark: 'bg-amber-900 text-amber-100'
      },
      denied: {
        light: 'bg-red-100 text-red-800',
        dark: 'bg-red-900 text-red-100'
      },
      approved: {
        light: 'bg-green-100 text-green-800',
        dark: 'bg-green-900 text-green-100'
      },
      // Rental statuses
      awaiting: {
        light: 'bg-blue-100 text-blue-800',
        dark: 'bg-blue-900 text-blue-100'
      },
      ongoing: {
        light: 'bg-purple-100 text-purple-800',
        dark: 'bg-purple-900 text-purple-100'
      },
      completed: {
        light: 'bg-gray-100 text-gray-800',
        dark: 'bg-gray-900 text-gray-100'
      }
    };
    return darkMode ? colors[status].dark : colors[status].light;
  };

  const StatusSelect = ({ value, onChange }: { value: BookingStatus, onChange: (value: BookingStatus) => void }) => {
    const options = [
      { value: 'pending', label: 'Pending', className: darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-800' },
      { value: 'approved', label: 'Approved', className: darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800' },
      { value: 'denied', label: 'Denied', className: darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800' }
    ];

    return (
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as BookingStatus)}
          className={`${getStatusColor(value)} appearance-none rounded-full px-3 py-1 text-sm font-medium 
            focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 cursor-pointer pr-8`}
          style={{ colorScheme: darkMode ? 'dark' : 'light' }}
        >
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              className={`${option.className} py-1`}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: RentalStatus }) => (
    <span className={`${getStatusColor(status)} px-3 py-1 rounded-full text-sm font-medium`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  const renderMainTable = () => (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-purple-50 dark:bg-purple-900/30">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">ID</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">User ID</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Name</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Phone</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Start Date</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">End Date</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {bookings.map((booking) => (
          <tr key={booking.id} className="hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{formatId(parseInt(booking.id))}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.userId}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{`${booking.firstName} ${booking.lastName}`}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.phoneNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(booking.startDate)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(booking.endDate)}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusSelect 
                value={booking.status}
                onChange={(newStatus) => handleStatusChange(booking.id, newStatus)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderApprovedTable = () => {
    const approvedBookings = bookings.filter(booking => booking.status === 'approved');
    
    return (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-purple-50 dark:bg-purple-900/30">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Start Province</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">End Province</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Car Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Car Brand</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {approvedBookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{formatId(parseInt(booking.id))}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{`${booking.firstName} ${booking.lastName}`}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.startProvince}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.endProvince}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.carType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{booking.carBrand}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={getRentalStatus(booking)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <CarFront className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h1 className="ml-3 text-2xl font-semibold text-gray-900 dark:text-white">Car Rental Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowApproved(!showApproved)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              <TableIcon className="h-5 w-5" />
              <span>{showApproved ? 'Show All Bookings' : 'Show Approved Only'}</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            {showApproved ? renderApprovedTable() : renderMainTable()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;