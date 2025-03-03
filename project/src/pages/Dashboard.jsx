import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Car, Moon, Sun, LogOut, Filter, Search, X } from 'lucide-react';
import { getRentals, updateRentalStatus } from '../services/api';
import { maskUserId, maskName, maskPhone, formatThaiDate } from '../utils/formatters';
import ConfirmModal from '../components/ConfirmModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(() => 
    localStorage.getItem('darkMode') === 'true'
  );
  const [, setSortBy] = useState('id');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const itemsPerPage = 5;

  const [redirectToLogin, setRedirectToLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    console.log("Token in Dashboard:", token); //  Debug Token 
    
    if (!token) {
      setRedirectToLogin(true);
      return // จบ useEffect เลย ไม่ต้องไป fetchData ต่อ
    }
  
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getRentals();
        setRentals(data || []);  // ป้องกัน null
        setFilteredRentals(data || []);
        console.log("Dashboard Data:", data);
      } catch (error) {
        console.error('Failed to fetch rentals:', error);
        localStorage.removeItem('token'); // ล้าง Token ถ้า API Error (เช่น Unauthorized)
        setRedirectToLogin(true); // บังคับไป login
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [navigate]); // ใส่ navigate ใน dependency array เพื่อป้องกัน loop

if (redirectToLogin) {
  return <Navigate to="/login" />;
}


  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchRentals = async () => {
    setLoading(true);
    const data = await getRentals();
    setRentals(data);
    setFilteredRentals(data);
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = rentals.filter(rental => 
      rental.firstName.toLowerCase().includes(value.toLowerCase()) ||
      rental.phoneNumber.includes(value)
    );
    setFilteredRentals(filtered);
    setCurrentPage(1);
  };

  const handleSort = (type) => {
    setSortBy(type);
    const sorted = [...filteredRentals];
    if (type === 'name') {
      sorted.sort((a, b) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`, 'th'));
    } else {
      sorted.sort((a, b) => a.id - b.id);
    }
    setFilteredRentals(sorted);
    setShowSortDropdown(false);
  };

  const handleStatusChange = (rental, status) => {
    setSelectedRental(rental);
    setNewStatus(status);
    setShowConfirmModal(true); // เปิด modal ให้กดยืนยันก่อน
  };

  const confirmStatusChange = async () => {
    if (selectedRental && newStatus) {
      const success = await updateRentalStatus(selectedRental.id, newStatus);
      if (success) {
        await fetchRentals(); // ดึงข้อมูลใหม่หลังจากอัปเดต
      }
    }
    setShowConfirmModal(false);
  };

  const toggleApprovedOnly = () => {
    setShowApprovedOnly(!showApprovedOnly);
    if (!showApprovedOnly) {
      setFilteredRentals(rentals.filter(rental => rental.status === 'approved'));
    } else {
      setFilteredRentals(rentals);
    }
    setCurrentPage(1);
  };

  const handleLogout = () => {
    navigate('/login');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('darkMode');
    localStorage.removeItem('role');
  };

  // Pagination
  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = Array.isArray(filteredRentals)
  ? filteredRentals.slice(startIndex, endIndex)
  : [];

  const statusColors = {
    pending: {
      light: { bg: 'bg-[#FEF3C6]', text: 'text-[#973C00]' },
      dark: { bg: 'bg-[#7A3306]', text: 'text-[#FEF3C6]' }
    },
    approved: {
      light: { bg: 'bg-[#DBFCE7]', text: 'text-[#016630]' },
      dark: { bg: 'bg-[#005025]', text: 'text-[#DBFCE7]' }
    },
    denied: {
      light: { bg: 'bg-[#FFE2E2]', text: 'text-[#9F0733]' },
      dark: { bg: 'bg-[#6C001F]', text: 'text-[#FFE2E2]' }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0F1F2A]' : 'bg-[#F9FAFB]'} transition-colors duration-200`}>
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${darkMode ? 'bg-[#31254F]' : 'bg-[#9810FA]'}`}>
              <Car className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Car Rental Management
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleApprovedOnly}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? 'bg-[#9810FA] text-[#F3E8FF]' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              {showApprovedOnly ? 'Show All Bookings' : 'Show Approved Only'}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-[#9810FA] text-[#F0B100]' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? 'bg-[#9810FA] text-[#F3E8FF]' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหา ชื่อ/เบอร์โทร"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={`pl-10 pr-10 py-2 rounded-lg w-64 ${
                darkMode ? 'bg-[#9810FA] text-[#F3E8FF] placeholder-[#F3E8FF]' : 'bg-white text-[#0F1F2A]'
              }`}
            />
            <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
              darkMode ? 'text-[#F3E8FF]' : 'text-[#0F1F2A]'
            }`} />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-2.5"
              >
                <X className={`w-5 h-5 ${darkMode ? 'text-[#F3E8FF]' : 'text-[#0F1F2A]'}`} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? 'bg-[#9810FA] text-[#F3E8FF]' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              <Filter className="w-5 h-5" />
              FILTER
            </button>

            {showSortDropdown && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${
                darkMode ? 'bg-[#31254F] text-[#F3E8FF]' : 'bg-white text-[#9810FA]'
              }`}>
                <button
                  onClick={() => handleSort('name')}
                  className="block w-full px-4 py-2 text-left hover:bg-opacity-10 hover:bg-gray-100"
                >
                  Name
                </button>
                <button
                  onClick={() => handleSort('id')}
                  className="block w-full px-4 py-2 text-left hover:bg-opacity-10 hover:bg-gray-100"
                >
                  ID
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full">
              <thead className={darkMode ? 'bg-[#31254F]' : 'bg-[#F3E8FF]'}>
  <tr>
    <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>ID</th>

    {showApprovedOnly ? (
      <>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>NAME</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>START PROVINCE</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>END PROVINCE</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>CAR TYPE</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>CAR BRAND</th>
      </>
    ) : (
      <>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>UserID</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>NAME</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>PHONE</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>START DATE</th>
        <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>END DATE</th>
      </>
    )}

    <th className={`px-6 py-3 text-left ${darkMode ? 'text-[#B8BDFC]' : 'text-[#9810FA]'}`}>STATUS</th>
  </tr>
</thead>
                <tbody className={darkMode ? 'bg-[#141D32]' : 'bg-white'}>
                  {currentItems.map((rental) => (
                    <tr key={rental.id} className="border-t border-gray-200">

                      {/* ช่อง ID ต้องมีเสมอ */}
                      <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                        {rental.id}
                      </td>

                      {showApprovedOnly ? (
                        <>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {maskName(`${rental.firstName} ${rental.lastName}`)}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {rental.startProvince}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {rental.endProvince}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {rental.carType}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {rental.carBrand}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {maskUserId(rental.userId)}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {maskName(`${rental.firstName} ${rental.lastName}`)}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {maskPhone(rental.phoneNumber)}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {formatThaiDate(rental.startDate)}
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-[#D1D5DC]' : 'text-gray-900'}`}>
                            {formatThaiDate(rental.endDate)}
                          </td>
                        </>
                      )}

                      {/* ช่อง STATUS */}
                      <td className="px-6 py-4">
                        <select
                          value={rental.status}
                          onChange={(e) => handleStatusChange(rental, e.target.value)}
                          className={`px-4 py-2 rounded-lg capitalize ${
                            statusColors[rental.status]?.[darkMode ? 'dark' : 'light'].bg
                          } ${
                            statusColors[rental.status]?.[darkMode ? 'dark' : 'light'].text
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="denied">Denied</option>
                        </select>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'text-[#F5F5F5]' : 'text-[#8228E5]'
                } disabled:opacity-50`}
              >
                🡠  Previous
              </button>
              
              <span
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-[#31254F] text-[#F5F5F5]'
                    : 'bg-[#8228E5] text-[#F5F5F5]'
                }`}
              >
                {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'text-[#F5F5F5]' : 'text-[#8228E5]'
                } disabled:opacity-50`}
              >
                Next  🡢
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status to ${newStatus}?`}
        darkMode={darkMode}
      />
    </div>
  );
};

export default Dashboard;