import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { login } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // เคลียร์ error ก่อนเริ่ม
    
    try {
      const result = await login(username, password);
      console.log("Login Result:", result); // Debug ดูว่า role ออกมาถูกไหม
  
      if (result.success) {
        localStorage.setItem('role', result.role); //  เช็คว่า role ถูกต้องไหม
        console.log("Stored Role:", localStorage.getItem('role')); // Debug ดูว่า role ถูกบันทึกหรือไม่
  
        console.log("Navigating to Dashboard"); // Debug
  
        //  เช็ค Role ก่อน Redirect
        if (result.role === "super_admin") {
          console.log("Redirecting to /superadmin"); //  Debug ดูว่าส่วนนี้ทำงานไหม
          navigate("/superadmin"); //  ไปหน้า Super Admin
        } else {
          console.log("Redirecting to /dashboard"); //  Debug ดูว่าส่วนนี้ทำงานไหม
          navigate("/dashboard"); //  ไปหน้า Admin ปกติ
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#9810FA] p-4 rounded-full mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Please enter your details to sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#9810FA] text-white py-3 rounded-lg hover:bg-[#8228E5] transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;