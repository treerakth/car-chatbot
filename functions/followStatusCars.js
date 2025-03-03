const axios = require('axios'); // ใช้ axios สำหรับเรียก API

/**
 * ฟังก์ชัน followStatusCars(event)
 * - ดึงข้อมูลการจองจาก API โดยใช้ userId ที่ได้จาก event.source.userId
 * - สร้าง Flex Message แบบ carousel ที่มี bubble สำหรับแต่ละการจอง
 */
async function followStatusCars(event) {
    try {
        const userId = event.source.userId;
        const displayName = event.source.displayName;

        // เรียก API ดึงข้อมูลการจองจากฐานข้อมูล
        const response = await axios.get(`http://localhost:5000/api/followStatusCars?userId=${userId}`);
        const bookings = response.data;
        console.log('🚗 Booking Data:', bookings);

        // ถ้าไม่มีข้อมูลการจองให้ส่งข้อความแจ้งกลับ
        if (!bookings || bookings.length === 0) {
            return {
                type: 'text',
                text: `⛔ คุณ "${displayName}" ไม่มีรายการจอง ณ ขณะนี้`
            };
        }

        // ฟังก์ชันเลือก URL รูปภาพตามสถานะของการจอง
        const getImageUrl = (status) => {
            switch (status.toLowerCase()) {
                case 'approved':
                    return 'https://drive.google.com/uc?id=1h7Oa67StgbnRp10bprWfYGrAy0Gs0hPG';
                case 'denied':
                    return 'https://drive.google.com/uc?id=1BCP6oscO3gWQ9rzbyfCbou6mynZMjpTC';
                default:
                    return 'https://drive.google.com/uc?id=1CyNZ9mUZZkctOLyRYb4EiOvMoMSZxp7y';
            }
        };

        // สร้าง bubble สำหรับแต่ละการจอง
        const bubbles = bookings.map((booking) => ({
            type: 'bubble',
            hero: {
                type: 'image',
                url: getImageUrl(booking.status), // เลือกรูปภาพตามสถานะจาก DB
                size: 'full',
                aspectRatio: '20:13',
                aspectMode: 'cover',
                action: {
                    type: 'uri',
                    uri: 'https://line.me/'
                }
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'รายละเอียดการจอง',
                        weight: 'bold',
                        size: 'xl'
                    },
                    createDetailRow('ชื่อผู้จอง', `${booking.firstName} ${booking.lastName}`),
                    createDetailRow('เบอร์', booking.phoneNumber),
                    createDetailRow('รถที่จอง', booking.carBrand),
                    createDetailRow('สถานที่รับ', booking.startProvince),
                    createDetailRow('สถานที่ส่ง', booking.endProvince),
                    createDetailRow('วันที่', `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`)
                ]
            }
        }));

        // สร้าง Flex Message แบบ carousel ซึ่งจะประกอบไปด้วย bubble ของแต่ละรายการจอง
        return {
            type: 'flex',
            altText: 'รายการจองของคุณ',
            contents: {
                type: 'carousel',
                contents: bubbles
            }
        };

    } catch (error) {
        console.error('❌ followStatusCars Error:', error);
        return {
            type: 'text',
            text: '❌ ไม่สามารถโหลดข้อมูลการจอง กรุณาลองใหม่ภายหลัง'
        };
    }
}

/**
 * ฟังก์ชัน createDetailRow
 * สร้าง row สำหรับแสดงข้อมูลรายละเอียด โดยมี label กับ value
 */
function createDetailRow(label, value) {
    return {
        type: 'box',
        layout: 'baseline',
        margin: 'md',
        contents: [
            {
                type: 'text',
                text: label,
                color: '#aaaaaa',
                size: 'sm',
                flex: 1
            },
            {
                type: 'text',
                text: value,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 3
            }
        ]
    };
}

/**
 * ฟังก์ชัน formatDate
 * แปลงวันที่ให้เป็นรูปแบบ DD/MM/YYYY
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

module.exports = { followStatusCars };
