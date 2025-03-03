const axios = require('axios');

async function saveBookingData(userId, bookingData) {
    try {
        const payload = {
            userId,
            firstName: bookingData.firstName,
            lastName: bookingData.lastName,
            phoneNumber: bookingData.phoneNumber,
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            startProvince: bookingData.startProvince,
            endProvince: bookingData.endProvince,
            carType: bookingData.carType,
            carBrand: bookingData.carBrand
        };

        console.log('📡 Sending data to API:', payload);

        const response = await axios.post('http://localhost:5000/saveBooking', payload);

        console.log('✅ Booking saved:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error saving booking:', error.response?.data || error.message);
        return { success: false, message: 'Database error' };
    }
}

module.exports = { saveBookingData };
