require("dotenv").config();
const express = require("express");
const db = require('../../config/db.js');
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const { verifyToken, isAdmin, isSuperAdmin } = require("../middlewares/authMiddleware");
const { login, refreshToken, logout, getMe, } = require("../controllers/userController");

const router = express.Router();

// Rate Limiting ป้องกัน Brute Force Login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 10,  // จำกัด 10 ครั้งต่อ 15 นาที
    message: { error: "มีการพยายามเข้าสู่ระบบมากเกินไป โปรดลองอีกครั้งในภายหลัง" }
});

// ตรวจสอบว่า API ใช้งานได้
router.get("/", async (req, res) => {
    try {
        const [users] = await db.query("SELECT * FROM users"); // ดึงข้อมูลจาก MySQL
        res.json({ users }); //  ส่งรายการ users กลับไป
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login API
router.post("/login", loginLimiter, login);

// Register API (เฉพาะ Super Admin เท่านั้น)
router.post("/register", verifyToken, isSuperAdmin, async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    }

    try {
        const [existingUser] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "ชื่อผู้ใช้ถูกใช้ไปแล้ว" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || "admin"; // ค่า default เป็น "admin"

        await db.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, userRole]);

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ!" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

// Refresh Token API
router.post("/refresh", refreshToken);

// Logout API
router.post("/logout", verifyToken, logout);

// ตรวจสอบข้อมูล User จาก Token
router.get("/me", verifyToken, getMe);

// ดูรายชื่อ Admin ทั้งหมด (เฉพาะ Super Admin)
router.get("/admins", verifyToken, isSuperAdmin, async (req, res) => {
    try {
        const [admins] = await db.query("SELECT id, username, role FROM users WHERE role = 'admin' ORDER BY id DESC");
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});
//  Super Admin ดู Users ทั้งหมด
router.get('/all-users', verifyToken, isSuperAdmin, async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, firstName, lastName, email, role FROM users");
        res.json(users);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

// ดูข้อมูลผู้ใช้รายบุคคล (เฉพาะ Admin ขึ้นไป)
router.get("/users/:id", verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [users] = await db.query("SELECT id, username, role FROM users WHERE id = ?", [id]);

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  Super Admin เปลี่ยน Role ของ User
router.put('/:id/role', verifyToken, isSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role value" });
    }

    try {
        await db.query("UPDATE users SET role=? WHERE id=?", [role, id]);
        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  Super Admin ลบ User
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM users WHERE id=?", [id]);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  Super Admin สร้าง Admin ใหม่
router.post('/create-admin', verifyToken, isSuperAdmin, async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // ตรวจสอบว่าอีเมลนี้มีอยู่ในระบบหรือยัง
        const [existingUser] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // เข้ารหัสรหัสผ่านก่อนบันทึก (ใช้ bcrypt)
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
            [firstName, lastName, email, hashedPassword]
        );

        res.status(201).json({ message: "Admin created successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});


// Protected Route (ทดสอบสิทธิ์การเข้าถึง)
router.get("/protected-route", verifyToken, (req, res) => {
    res.json({ message: "Access granted!", user: req.user });
});

module.exports = router;
