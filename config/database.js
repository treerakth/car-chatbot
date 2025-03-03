const mysql = require('mysql2/promise');

async function getDatabaseConnection() {
    return await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'car_rental'
    });
}



module.exports = { getDatabaseConnection };
