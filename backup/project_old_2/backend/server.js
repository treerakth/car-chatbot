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

// GET /bookings - Get all bookings
app.get('/bookings', (req, res) => {
    const sql = 'SELECT * FROM bookings ORDER BY id DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Database Query Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json(results);
    });
});

// POST /saveBooking - Save new booking
app.post('/saveBooking', (req, res) => {
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
        carBand
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
        (userId, firstName, lastName, phoneNumber, startDate, endDate, startProvince, endProvince, carType, carBand, status)
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
        carBand,
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

// PUT /bookings/:id/status - Update booking status
app.put('/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

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

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
});