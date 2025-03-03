-- Create database
CREATE DATABASE IF NOT EXISTS car_rental;
USE car_rental;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    phoneNumber VARCHAR(20),
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    startProvince VARCHAR(100) NOT NULL,
    endProvince VARCHAR(100) NOT NULL,
    carType VARCHAR(100),
    carBand VARCHAR(100),
    status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_status ON bookings(status);
CREATE INDEX idx_dates ON bookings(startDate, endDate);