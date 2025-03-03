require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ MySQL Connection Error:', err);
        return;
    }
    console.log('✅ MySQL Connected...');
});

// Helper function to convert Thai Buddhist year to Christian year
function convertThaiDateToSQL(thaiDate) {
    if (!thaiDate) return null;
    const [day, month, year] = thaiDate.split('/').map(Number);
    const christianYear = year - 543;
    return `${christianYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// POST /saveBooking - Save new booking
app.post('/saveBooking', (req, res) => {
    console.log('📢 POST /saveBooking - Saving new booking', req.body);
    const {
        userId,
        firstName,
        lastName,
        phoneNumber,
        startDate,
        endDate,
        startProvince,
        endProvince,
        carType,
        carBrand
    } = req.body;

    // Validate required fields
    if (!userId || !startDate || !endDate || !startProvince || !endProvince) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Convert dates to SQL format
    const startDateSQL = convertThaiDateToSQL(startDate);
    const endDateSQL = convertThaiDateToSQL(endDate);

    const sql = `
        INSERT INTO bookings 
        (userId, firstName, lastName, phoneNumber, startDate, endDate, startProvince, endProvince, carType, carBrand, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        userId,
        firstName,
        lastName,
        phoneNumber,
        startDateSQL,
        endDateSQL,
        startProvince,
        endProvince,
        carType,
        carBrand,
        'pending'
    ], (err, result) => {
        if (err) {
            console.error('❌ Database Insert Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        console.log('✅ Booking saved:', result);
        res.json({ success: true, bookingId: result.insertId });
    });
});
//get all cars available
app.get('/api/availableCars', (req, res) => {
    const { type } = req.query;
    console.log(`📢 GET /api/availableCars?type=${type} - Fetching available cars`);

    if (!type) {
        return res.status(400).json({ success: false, message: 'Missing car type' });
    }

    const sql = `
        SELECT model, image 
        FROM cars 
        WHERE type = ? AND status = 'available'
    `;

    db.query(sql, [type], (err, results) => {
        if (err) {
            console.error('❌ Database Query Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json(results);
    });
});

//get all status via user id
app.get('/api/followStatusCars', (req, res) => {
    const { userId } = req.query;
    console.log(`📢 GET /api/followStatusCars?userId=${userId} - Fetching booking status`);

    if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId in request' });
    }

    const sql = `
        SELECT firstName, lastName, phoneNumber, startDate, endDate, 
               startProvince, endProvince, carBrand, status 
        FROM bookings 
        WHERE userId = ?
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('❌ Database Query Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json(results);
    });
});

// PUT /bookings/:id/status - Update booking status
app.put('/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`📢 PUT /bookings/${req.params.id}/status - Updating booking status to ${req.body.status}`);
    if (!['pending', 'approved', 'denied'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error('❌ Database Update Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true });
    });
});
console.log('Waiting for Route carRoutes');
const carRoutes = require("./routes/cars");
console.log('Waiting for Route rentalRoutes');
const rentalRoutes = require("./routes/rentals");
console.log('Waiting for Route userRoutes');
const userRoutes = require("./routes/users");

app.use("/api/cars", carRoutes);
console.log('Suscess Loading from carRoutes');
app.use("/api/rentals", rentalRoutes);
console.log('Suscess Loading from rentalRoutes');
app.use("/api/users", userRoutes);
console.log('Suscess Loading from userRoutes');

/*
// GET /api/availableCars/count - Get count of available cars
app.get('/api/availableCars/count', (req, res) => {
    console.log('📢 GET /api/availableCars/count - Counting available cars');

    const sql = `SELECT type, COUNT(*) AS count FROM cars WHERE status = 'available' GROUP BY type`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Database Query Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json(results);
    });
});
*/
/*
// GET /bookings - Get all bookings
app.get('/bookings', (req, res) => {
    console.log('📢 GET /bookings - Fetching all bookings');
    const sql = 'SELECT * FROM bookings ORDER BY id DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Database Query Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json(results);
    });
});
*/

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
});