const express = require('express');
const db = require('../../config/db.js');
const { verifyToken } = require('../middlewares/authMiddleware'); // ใช้ destructuring
const { isSuperAdmin } = require('../middlewares/authMiddleware');
const carController = require("../controllers/carController");
const router = express.Router();

// Middleware ตรวจสอบ Role (Admin เท่านั้น)
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
};

// ดึงข้อมูลรถทั้งหมด (ทุกคนเข้าถึงได้)
router.get('/', async (req, res) => {
    try {
        const [cars] = await db.query("SELECT * FROM cars");
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

// เพิ่มข้อมูลรถใหม่ (เฉพาะ Admin เท่านั้น)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    const { model, status, type, image } = req.body;

    if (!model || !type) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO cars (model, status, type, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [model, status || "available", type, image]
        );
        res.status(201).json({ id: result.insertId, message: "Car added successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

// อัปเดตสถานะรถ (เฉพาะ Admin เท่านั้น)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }

    try {
        const [car] = await db.query("SELECT * FROM cars WHERE id = ?", [id]);
        if (car.length === 0) {
            return res.status(404).json({ error: "Car not found" });
        }

        await db.query("UPDATE cars SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: "Car status updated" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

// ลบรถออกจากระบบ (เฉพาะ Admin เท่านั้น)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // ตรวจสอบว่ารถมีอยู่จริงหรือไม่
        const [car] = await db.query("SELECT * FROM cars WHERE id = ?", [id]);
        if (car.length === 0) {
            return res.status(404).json({ error: "Car not found" });
        }

        // ลบคำขอเช่าที่เกี่ยวข้องก่อน
        await db.query("DELETE FROM bookings WHERE car_id = ?", [id]);

        // ลบรถออกจากฐานข้อมูล
        await db.query("DELETE FROM cars WHERE id = ?", [id]);

        res.json({ message: "Car deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  Super Admin เพิ่มรถเข้าไปในระบบ
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
    const { model, image, status } = req.body;

    if (!model) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.query("INSERT INTO cars (model, image, status) VALUES (?, ?, ?, ?)",
            [model, image, status || 'available']);
        res.status(201).json({ message: "Car added successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  Super Admin แก้ไขข้อมูลรถ
router.put('/:id', verifyToken, isSuperAdmin, async (req, res) => {
    const { model, status } = req.body;
    const { id } = req.params;

    try {
        await db.query("UPDATE cars SET  model=?, type=?, status=? WHERE id=?",
            [model, type, status, id]);
        res.json({ message: "Car updated successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  Super Admin ลบรถ
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM cars WHERE id=?", [id]);
        res.json({ message: "Car deleted successfully" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

router.put('/:id/status', verifyToken, isSuperAdmin, carController.updateCarStatus);


module.exports = router;
