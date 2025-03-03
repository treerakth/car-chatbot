const express = require('express');
const db = require('../../config/db.js');
const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

// Middleware ตรวจสอบ Role (Admin เท่านั้น)
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
};

//  ดึงข้อมูลคำขอเช่าทั้งหมด (Admin เท่านั้น)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const [rentals] = await db.query("SELECT * FROM bookings ORDER BY startDate DESC");
        res.json(rentals);
    } catch (error) {
        console.error(" Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  อัปเดตสถานะการขอเช่า
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "denied"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        const [rental] = await db.query("SELECT * FROM bookings WHERE id = ?", [id]);
        if (rental.length === 0) {
            return res.status(404).json({ error: "Rental request not found" });
        }

        const rentalData = rental[0];

        if (req.user.role === "admin") {
            //  Admin สามารถเปลี่ยนเป็นอะไรก็ได้
        } else if (req.user.id === rentalData.userId) {
            //  ผู้ใช้ทั่วไปอนุญาตให้เปลี่ยนเฉพาะ `cancelled`
            if (status !== "cancelled") {
                return res.status(403).json({ error: "Unauthorized: You can only cancel your request" });
            }
        } else {
            return res.status(403).json({ error: "Unauthorized: You cannot update this rental request" });
        }

        await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: "Rental status updated successfully" });
    } catch (error) {
        console.error(" Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  สร้างคำขอเช่ารถใหม่
router.post('/', verifyToken, async (req, res) => {
    const { carType, carBrand, startDate, endDate, startProvince, endProvince } = req.body;
    const userId = req.user.id;

    if (!carType || !carBrand || !startDate || !endDate || !startProvince || !endProvince) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.query(
            "INSERT INTO bookings (userId, firstName, lastName, phoneNumber, startDate, endDate, startProvince, endProvince, carType, carBrand, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [userId, "FirstName", "LastName", "0000000000", startDate, endDate, startProvince, endProvince, carType, carBrand, "pending"]
        );

        res.status(201).json({ message: "Rental request created successfully" });
    } catch (error) {
        console.error(" Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//  ดึงคำขอเช่ารถของผู้ใช้ปัจจุบัน
router.get('/my', verifyToken, async (req, res) => {
    try {
        const [rentals] = await db.query(
            "SELECT * FROM bookings WHERE userId = ? ORDER BY startDate DESC",
            [req.user.id]
        );
        res.json(rentals);
    } catch (error) {
        console.error(" Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

module.exports = router;
