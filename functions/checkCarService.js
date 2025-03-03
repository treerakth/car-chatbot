/*****************************************************
 *  checkCarService.js
 *  ไฟล์นี้มีหน้าที่ตรวจสอบรถที่ว่างจากฐานข้อมูล
 *  และสร้าง Flex Message ตามข้อมูลจาก MySQL โดยไม่รวมปุ่มจองรถ
 *****************************************************/
const axios = require('axios'); // ใช้ axios สำหรับเรียก API

/**
 * ฟังก์ชัน checkCarAvailable(carType)
 * - รับพารามิเตอร์เป็น carType (เช่น 'car', 'van', 'motorcycle')
 * - ทำการเรียก API เพื่อนำข้อมูลรถที่ว่างจากฐานข้อมูล
 * - สร้าง Flex Message (carousel) เพื่อแสดงรายการรถ
 * - ส่งกลับเป็น object (Flex Message)
 */
async function checkCarAvailable(carType) {
    try {
        // 1) ดึงข้อมูลรถที่ว่างจาก API MySQL
        const response = await axios.get(`http://localhost:5000/api/availableCars?type=${carType}`);
        const cars = response.data; // ได้ข้อมูลรถที่ว่างมาเป็น array
        console.log('🚗 checkCarAvailable:', cars);
        console.log('🚗 carType:', carType);

        if (!cars || cars.length === 0) {
            return {
                type: 'text',
                text: `⛔ ไม่มีรถว่างสำหรับหมวด "${carType}" ขณะนี้`
            };
        }

        // 2) สร้าง bubble ต่อคัน (ไม่มีปุ่มจองรถ)
        const bubbles = cars.map((car) => ({
            type: 'bubble',
            size: 'micro',
            hero: {
                type: 'image',
                url: car.image || 'https://i.ibb.co/7y0hH2q/car-example.jpg', // ใช้ภาพ default หากไม่มีข้อมูล
                size: 'full',
                aspectMode: 'cover',
                aspectRatio: '320:213'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: `${car.model}`,
                        weight: 'bold',
                        size: 'sm',
                        wrap: true
                    }
                ],
                spacing: 'sm',
                paddingAll: '13px'
            }
        }));

        // 3) สร้าง Flex Message แบบ carousel
        return {
            type: 'flex',
            altText: `เลือกรถที่ว่างในหมวด: ${carType}`,
            contents: {
                type: 'carousel',
                contents: bubbles
            }
        };
    } catch (error) {
        console.error('❌ checkCarAvailable Error:', error);
        return {
            type: 'text',
            text: '❌ ข้อมูลรถไม่สามารถโหลดได้ กรุณาลองใหม่ภายหลัง'
        };
    }
}

// ส่งออกฟังก์ชันเพื่อให้ไฟล์อื่นเรียกใช้งาน
module.exports = {
    checkCarAvailable
};
