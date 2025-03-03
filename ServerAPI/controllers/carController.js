const db = require('../../config/db.js');

// ดึงข้อมูลรถทั้งหมด
exports.getAllCars = async (req, res) => {
    try {
        const [cars] = await db.query("SELECT * FROM cars");
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

// เพิ่มรถใหม่
exports.addCar = async (req, res) => {
    const { name, brand, type, color, price_per_day, image } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO cars (name, brand, type, color, price_per_day, image, status) VALUES (?, ?, ?, ?, ?, ?, 'available')",
            [name, brand, type, color, price_per_day, image]
        );
        res.status(201).json({ message: "เพิ่มรถสำเร็จ", carId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

// อัปเดตรายละเอียดรถ
exports.updateCar = async (req, res) => {
    const { id } = req.params;
    const { name, brand, type, color, price_per_day, status, image } = req.body;

    if (!name || !brand || !type || !color || !price_per_day || !status || !image) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        // ตรวจสอบว่ามีรถอยู่จริงหรือไม่
        const [car] = await db.query("SELECT * FROM cars WHERE id=?", [id]);
        if (car.length === 0) {
            return res.status(404).json({ error: "ไม่พบรถที่ต้องการอัปเดต" });
        }

        await db.query(
            "UPDATE cars SET name=?, brand=?, type=?, color=?, price_per_day=?, status=?, image=? WHERE id=?",
            [name, brand, type, color, price_per_day, status, image, id]
        );
        res.json({ message: "อัปเดตรถสำเร็จ" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

// ลบรถ
exports.deleteCar = async (req, res) => {
    const { id } = req.params;

    try {
        const [car] = await db.query("SELECT * FROM cars WHERE id=?", [id]);
        if (car.length === 0) {
            return res.status(404).json({ error: "ไม่พบรถที่ต้องการลบ" });
        }

        await db.query("DELETE FROM cars WHERE id=?", [id]);
        res.json({ message: "ลบรถสำเร็จ" });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

// อัปเดตสถานะของรถ
exports.updateCarStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "กรุณาระบุสถานะใหม่" });
    }

    try {
        // ตรวจสอบว่ามีรถอยู่จริงหรือไม่
        const [car] = await db.query("SELECT * FROM cars WHERE id=?", [id]);
        if (car.length === 0) {
            return res.status(404).json({ error: "ไม่พบรถที่ต้องการอัปเดตสถานะ" });
        }

        // อัปเดตสถานะรถ
        await db.query("UPDATE cars SET status=? WHERE id=?", [status, id]);
        res.json({ message: "อัปเดตสถานะรถสำเร็จ" });
    } catch (error) {
        console.error("Error updating car status:", error);
        res.status(500).json({ error: "Database error" });
    }
};
