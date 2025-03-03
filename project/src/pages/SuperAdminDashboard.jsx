import React, { useState, useEffect } from 'react';
import { Car, Moon, Sun, LogOut, Search, X, UserPlus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from "../components/ConfirmModal";
import Pagination from '../components/Pagination.jsx';
import { getCars, getUsers, addCar, deleteCar, deleteUser, createAdmin, handleStatusChange } from '../services/api'; // Import API

const ITEMS_PER_PAGE = 5;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  
  // Cars state
  const [cars, setCars] = useState([]);
  const [carSearch, setCarSearch] = useState('');
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [newCar, setNewCar] = useState({
    model: '',
    type: 'car',
    image: '',
    status: 'available'
  });
  const [carPage, setCarPage] = useState(1);
  
  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'admin'
  });
  const [userPage, setUserPage] = useState(1);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    item: null
  });

  const statusColors = {
    rented: {
      light: { bg: 'bg-[#FEF3C6]', text: 'text-[#973C00]' },
      dark: { bg: 'bg-[#7A3306]', text: 'text-[#FEF3C6]' }
    },
    available: {
      light: { bg: 'bg-[#DBFCE7]', text: 'text-[#016630]' },
      dark: { bg: 'bg-[#005025]', text: 'text-[#DBFCE7]' }
    },
    maintenance: {
      light: { bg: 'bg-[#FFE2E2]', text: 'text-[#9F0733]' },
      dark: { bg: 'bg-[#6C001F]', text: 'text-[#FFE2E2]' }
    }
  };  

//  เรียก `fetchData()` แค่ครั้งเดียวตอนโหลด Component
useEffect(() => {
  fetchData();
}, []);

//  ใช้แค่จัดการ Dark Mode
useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode);
  localStorage.setItem('darkMode', darkMode);
}, [darkMode]);

  // เรียกข้อมูลจาก API
  const fetchData = async () => {
    try {
      const [carsData, usersData] = await Promise.all([getCars(), getUsers()]);
      // console.log("Users Data:", usersData); //  Debug ข้อมูล users
      setCars(carsData || []);
      setUsers(usersData || []);
      // console.log("State Users:", usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // เช็คว่าข้อผิดพลาดเกิดจาก Token หมดอายุ
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
      }
    }
};

const updateCarStatus = async (carId, newStatus) => {
  const confirmChange = window.confirm(`คุณต้องการเปลี่ยนสถานะรถเป็น "${newStatus}" ใช่หรือไม่?`);
  if (!confirmChange) return;
  
  try {
      const updateCarStatus = await handleStatusChange(carId, newStatus);
      console.log("Status updated:", updateCarStatus);
      // อัปเดต state หรือ fetch ข้อมูลใหม่

      setCars(prevCars => prevCars.map(car =>
        car.id === carId ? { ...car, status: newStatus } : car
      ));
  } catch (error) {
      console.error("Failed to update status:", error);
  }
};

// add car
  const handleAddCar = async () => {
    if (!newCar.model || !newCar.type || !newCar.image) return;
    
    try {
      await addCar(newCar);
      fetchData(); // โหลดข้อมูลใหม่
      setIsAddingCar(false);
      setNewCar({
        model: '',
        type: 'car',
        image: '',
        status: 'available'
      });
    } catch (error) {
      console.error('Error adding car:', error);
    }
};

// add users
const handleAddUser = async () => {
  if (!newUser.username || !newUser.password) return;
  
  try {
    await createAdmin(newUser);
    fetchData(); // โหลดข้อมูลใหม่
    setIsAddingUser(false);
    setNewUser({
      username: '',
      password: '',
      role: 'admin'
    });
  } catch (error) {
    console.error('Error adding user:', error);
  }
};

  // delete
  const handleDelete = async (type, item) => {
    try {
      if (type === 'car') {
        await deleteCar(item.id);
      } else if (type === 'user') {
        await deleteUser(item.id);
      }
      fetchData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
};

  // filter Cars
  const filteredCars = cars.filter(car => 
    car.model.toLowerCase().includes(carSearch.toLowerCase())
  );

  // filter Users ถ้า users ไม่ใช่ Array จะให้ filteredUsers เป็น [] แทน เพื่อไม่ให้พัง
  const usersData = users.users || [];
  const filteredUsers = Array.isArray(usersData) ? usersData.filter(user => 
    user.username.toLowerCase().includes(userSearch.toLowerCase())
) : [];

    // pagginated Cars
  const paginatedCars = filteredCars.slice(
    (carPage - 1) * ITEMS_PER_PAGE,
    carPage * ITEMS_PER_PAGE
  );

  // pagginated User
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * ITEMS_PER_PAGE,
    userPage * ITEMS_PER_PAGE
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0F1F2A]' : 'bg-gray-100'}`}>
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${darkMode ? 'bg-[#31254F]' : 'bg-[#9810FA]'}`}>
              <Car className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Super Admin Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-[#31254F]' : 'bg-[#F3E8FF]'
              }`}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-[#F3E8FF]" />
              ) : (
                <Moon className="w-5 h-5 text-[#9810FA]" />
              )}
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('darkMode');
                localStorage.removeItem('role');
                navigate('/login');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode ? 'bg-[#31254F] text-white' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Car Management */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Car Management
            </h2>
            
            <button
              onClick={() => setIsAddingCar(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode ? 'bg-[#9810FA] text-white' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              <Plus className="w-5 h-5" />
              Add New Car
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search cars by model..."
              value={carSearch}
              onChange={(e) => setCarSearch(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 rounded-lg ${
                darkMode ? 'bg-[#31254F] text-white' : 'bg-white text-gray-900'
              }`}
            />
            <Search className={`absolute left-3 top-2.5 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            {carSearch && (
              <button
                onClick={() => setCarSearch('')}
                className="absolute right-3 top-2.5"
              >
                <X className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            )}
          </div>

          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-[#141D32]' : 'bg-white'}`}>
            <table className="w-full">
              <thead className={darkMode ? 'bg-[#31254F]' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>ID</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Model</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Type</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Status</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isAddingCar && (
                  <tr>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      Auto
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={newCar.model}
                        onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                        className={`w-full px-2 py-1 rounded ${
                          darkMode ? 'bg-[#31254F] text-white' : 'bg-gray-50'
                        }`}
                        placeholder="Enter model"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={newCar.type}
                        onChange={(e) => setNewCar({ ...newCar, type: e.target.value })}
                        className={`w-full px-2 py-1 rounded ${
                          darkMode ? 'bg-[#31254F] text-white' : 'bg-gray-50'
                        }`}
                      >
                        <option value="car">Car</option>
                        <option value="van">Van</option>
                        <option value="motorcycle">Motorcycle</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={newCar.status}
                        onChange={(e) => setNewCar({ ...newCar, status: e.target.value })}
                        className={`w-full px-2 py-1 rounded ${
                          darkMode ? 'bg-[#31254F] text-white' : 'bg-gray-50'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCar}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsAddingCar(false)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedCars.map(car => (
                  <tr key={car.id}>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {car.id}
                    </td>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {car.model}
                    </td>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {car.type}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                        <div className="relative">
                        <select
                          className={`px-2 py-1 rounded-full cursor-pointer outline-none
                            ${statusColors[car.status]?.light.bg} 
                            ${statusColors[car.status]?.light.text}`}
                          value={car.status}
                          onChange={(e) => updateCarStatus(car.id, e.target.value)}
                        >
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        </div>
                      </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: 'car',
                          item: car
                        })}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination
            currentPage={carPage}
            totalPages={Math.ceil(filteredCars.length / ITEMS_PER_PAGE)}
            onPageChange={setCarPage}
            darkMode={darkMode}
          />
        </div>

        {/* User Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              User Management
            </h2>
            
            <button
              onClick={() => setIsAddingUser(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                darkMode ? 'bg-[#9810FA] text-white' : 'bg-[#F3E8FF] text-[#9810FA]'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Create Admin
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search users by username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 rounded-lg ${
                darkMode ? 'bg-[#31254F] text-white' : 'bg-white text-gray-900'
              }`}
            />
            <Search className={`absolute left-3 top-2.5 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            {userSearch && (
              <button
                onClick={() => setUserSearch('')}
                className="absolute right-3 top-2.5"
              >
                <X className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            )}
          </div>

          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-[#141D32]' : 'bg-white'}`}>
            <table className="w-full">
              <thead className={darkMode ? 'bg-[#31254F]' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>ID</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Username</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Role</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isAddingUser && (
                  <tr>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      Auto
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className={`w-full px-2 py-1 rounded ${
                          darkMode ? 'bg-[#31254F] text-white' : 'bg-gray-50'
                        }`}
                        placeholder="Enter username"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className={`w-full px-2 py-1 rounded ${
                          darkMode ? 'bg-[#31254F] text-white' : 'bg-gray-50'
                        }`}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddUser}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsAddingUser(false)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {paginatedUsers.map(user => (
                  <tr key={user.id}>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.id}
                    </td>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.username}
                    </td>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.role}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: 'user',
                          item: user
                        })}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination
            currentPage={userPage}
            totalPages={Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
            onPageChange={setUserPage}
            darkMode={darkMode}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', item: null })}
        onConfirm={() => {
          handleDelete(confirmModal.type, confirmModal.item);
          setConfirmModal({ isOpen: false, type: '', item: null });
        }}
        title={`ยืนยันที่จะลบข้อมูล`}
        message={`คุณต้องการลบ ${
          confirmModal.type === 'car' 
            ? `รถ ${confirmModal.item?.model}`
            : `ผู้ใช้ ${confirmModal.item?.username}`
        } ใช่หรือไม่?`}
        darkMode={darkMode}
      />
    </div>
  );
};

export default SuperAdminDashboard;