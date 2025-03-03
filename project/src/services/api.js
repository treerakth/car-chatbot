import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // ใช้ค่าจาก .env
const authApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// getRentals function
export const getRentals = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(`${API_URL}/rentals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching rentals:", error);
    return [];
  }
};

// updataRentalStatus function
export const updateRentalStatus = async (id, newStatus) => {
  try {
    const token = localStorage.getItem("accessToken");
    await axios.put(
      `${API_URL}/rentals/${id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch (error) {
    console.error("Error updating status:", error);
    return false;
  }
};

// ฟังก์ชัน Refresh Token
const refreshToken = async () => {
  try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post(`${API_URL}/refresh-token`, { refreshToken });
      const newToken = response.data.token;

      localStorage.setItem("accessToken", newToken);
      return newToken;
  } catch (error) {
      console.error("Refresh Token Failed:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login"; // ส่งกลับไปที่หน้า Login
  }
};

// Interceptor เช็ค Token หมดอายุ
authApi.interceptors.response.use(
  response => response,
  async error => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && error.response.data.refreshRequired) {
          const newToken = await refreshToken();
          if (newToken) {
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              return axios(originalRequest);
          }
      }
      return Promise.reject(error);
  }
);

// API Login
export const login = async (username, password) => {
  try {
    const response = await authApi.post("/users/login", { username, password });

    // console.log("Login API Response:", response.data); //  Debug API Response

    //  บันทึก Token ลง localStorage
    localStorage.setItem("accessToken", response.data.token);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    localStorage.setItem("role", response.data.role);

    return { success: true, ...response.data }; //  คืนค่า success: true
  } catch (error) {
    console.error("Login API Error:", error);

    return {
      success: false,
      error: error.response?.data?.message || "Login failed",
    };
  }
};


// API Logout
export const logout = async () => {
  const token = localStorage.getItem("accessToken");
  await authApi.post("/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  window.location.href = "/login";
};

// API ดึงข้อมูลผู้ใช้
export const getUserProfile = async () => {
  const token = localStorage.getItem("accessToken");
  const response = await authApi.get("/me", { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

// API ดึงข้อมูล admin
export const getUsers = async () => {
  const token = localStorage.getItem('accessToken');
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // console.log("Fetched Users:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// API updaate role admin
export const updateUserRole = async (id, role) => {
  const token = localStorage.getItem('accessToken');
  try {
    const response = await axios.put(`${API_URL}/users/${id}/role`, { role }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// API ลบ admin
export const deleteUser = async (id) => {
  const token = localStorage.getItem('accessToken');
  try {
    const response = await axios.delete(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// API create admin
export const createAdmin = async (adminData) => {
  const token = localStorage.getItem('accessToken');
  try {
    const response = await axios.post(`${API_URL}/users/create-admin`, adminData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating admin:", error);
    throw error;
  }
};

// เพิ่มรถ
export const addCar = async (carData) => {
  try {
      const response = await fetch('/cars', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(carData),
      });

      if (!response.ok) {
          throw new Error('Failed to add car');
      }

      return await response.json();
  } catch (error) {
      console.error('Error adding car:', error);
      throw error;
  }
};

export const deleteCar = async (carId) => {
  try {
      const response = await fetch(`/cars/${carId}`, {
          method: 'DELETE',
      });

      if (!response.ok) {
          throw new Error('Failed to delete car');
      }

      return await response.json();
  } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
  }
};

export const getCars = async () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_URL}/cars`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
};

//  ฟังก์ชันอัปเดตสถานะรถ
export const handleStatusChange = async (carId, newStatus) => { 
  try {
    const token = localStorage.getItem("accessToken");
    console.log("Updating status for Car ID:", carId, "New Status:", newStatus);
    const response = await axios.put(`${API_URL}/cars/${carId}/status`, 
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating status:", error);
    throw new Error("อัปเดตสถานะไม่สำเร็จ!");
  }
};
