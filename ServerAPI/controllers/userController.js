const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require('../../config/db.js');
const { saveRefreshToken, getRefreshToken, deleteRefreshToken } = require("../models/refreshTokenModel");

const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

// Login และบันทึก Refresh Token
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!SECRET_KEY || !REFRESH_SECRET_KEY) {
        return res.status(500).json({ error: "Server configuration error (Missing SECRET_KEY or REFRESH_SECRET_KEY)" });
    }

    try {
        const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (users.length === 0) return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET_KEY, { expiresIn: "7d" });

        //  ลบ Refresh Token เดิมก่อนสร้างใหม่
        await deleteRefreshToken(user.id);
        await saveRefreshToken(user.id, refreshToken);

        res.json({ success: true, token, refreshToken, role: user.role });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};


// ใช้ Refresh Token เพื่อสร้าง Access Token ใหม่
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(403).json({ error: "No refresh token provided" });

    if (!SECRET_KEY || !REFRESH_SECRET_KEY) {
        return res.status(500).json({ error: "Server configuration error (Missing SECRET_KEY or REFRESH_SECRET_KEY)" });
    }

    try {
        const tokenData = await getRefreshToken(refreshToken);
        if (!tokenData) return res.status(403).json({ error: "Invalid refresh token" });

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);

        //  ดึง role จาก DB
        const [users] = await db.query("SELECT role FROM users WHERE id = ?", [decoded.id]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });

        const newToken = jwt.sign({ id: decoded.id, role: users[0].role }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ token: newToken });
    } catch (error) {
        res.status(403).json({ error: "Invalid refresh token" });
    }
};


// Logout และลบ Refresh Token
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) return res.status(400).json({ error: "Invalid request" });

        await deleteRefreshToken(userId);
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};


// ตรวจสอบข้อมูล User ผ่าน Token (ใช้สำหรับเช็คสถานะ Login)
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.query("SELECT id, username, role FROM users WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
