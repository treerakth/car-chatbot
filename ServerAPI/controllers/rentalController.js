const db = require('../../config/db.js');

//  ดึงรายการเช่าทั้งหมด
exports.getAllRentals = async (req, res) => {
    try {
        const [rentals] = await db.query("SELECT * FROM rentalrequests ORDER BY startDate DESC");
        res.json(rentals);
    } catch (error) {
        console.error("❌ Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

//  เพิ่มคำขอเช่ารถ
exports.createRental = async (req, res) => {
    const { userId, firstName, lastName, phoneNumber, startDate, endDate, startProvince, endProvince, carType, carBrand } = req.body;

    if (!userId || !firstName || !lastName || !phoneNumber || !startDate || !endDate || !startProvince || !endProvince || !carType || !carBrand) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        //  ตรวจสอบว่าผู้ใช้มีอยู่จริง
        const [user] = await db.query("SELECT * FROM users WHERE id=?", [userId]);
        if (user.length === 0) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

        //  ตรวจสอบว่ารถที่ต้องการเช่ายังว่างอยู่
        const [car] = await db.query("SELECT * FROM cars WHERE carType=? AND carBrand=? AND status='available'", [carType, carBrand]);
        if (car.length === 0) return res.status(400).json({ error: "รถไม่พร้อมให้เช่า" });

        //  เพิ่มข้อมูลการเช่ารถลงตาราง rentalrequests
        await db.query(
            "INSERT INTO rentalrequests (userId, firstName, lastName, phoneNumber, startDate, endDate, startProvince, endProvince, carType, carBrand, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
            [userId, firstName, lastName, phoneNumber, startDate, endDate, startProvince, endProvince, carType, carBrand]
        );

        res.status(201).json({ message: "สร้างคำขอเช่าสำเร็จ" });
    } catch (error) {
        console.error(" Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

//  อัปเดตสถานะการเช่า (อนุมัติ / คืนรถ)
exports.updateRentalStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "denied"];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        //  ตรวจสอบว่ามีคำขอเช่าอยู่จริงก่อนอัปเดต
        const [rental] = await db.query("SELECT * FROM rentalrequests WHERE id=?", [id]);
        if (rental.length === 0) return res.status(404).json({ error: "ไม่พบคำขอเช่า" });

        await db.query("UPDATE rentalrequests SET status=? WHERE id=?", [status, id]);
        res.json({ message: `อัปเดตสถานะเป็น ${status}` });
    } catch (error) {
        console.error(" Database Error:", error.message);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
