const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function updateJsonFromAPI() {
    try {
        // เรียก API เพื่อดึงจำนวนรถว่าง
        const response = await axios.get('http://localhost:5000/api/availableCars/count');
        const carCounts = response.data;

        // โหลด JSON Template
        const filePath = path.join(__dirname, '../flexMessages/checkCarData.json');
        let jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // อัปเดตค่าจำนวนรถว่างใน JSON
        const carCountMap = { motorcycle: 0, car: 0, van: 0 };
        carCounts.forEach(car => {
            if (carCountMap.hasOwnProperty(car.type)) {
                carCountMap[car.type] = car.count;
            }
        });

        jsonData.contents.contents.forEach(bubble => {
            if (bubble.body.contents.length > 1) {
                const title = bubble.body.contents[0].text;
                let typeKey = '';

                if (title.includes('มอเตอร์ไซค์')) typeKey = 'motorcycle';
                if (title.includes('รถยนต์')) typeKey = 'car';
                if (title.includes('รถตู้')) typeKey = 'van';

                if (typeKey) {
                    bubble.body.contents[1].contents[0].text = `รถว่างจำนวน ${carCountMap[typeKey]} คัน`;
                }
            }
        });

        return jsonData;
    } catch (error) {
        console.error('❌ Error updating JSON:', error);
        return { type: 'text', text: 'ไม่สามารถโหลดข้อมูลรถว่างได้' };
    }
}

// เรียกใช้งาน
updateJsonFromAPI().then(updatedJson => console.log(updatedJson));
