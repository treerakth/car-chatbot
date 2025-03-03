const fs = require('fs');
const path = require('path');

// ฟังก์ชันโหลดข้อความ Flex Message
const getFlexMessage = (fileName) => {
    try {
        const filePath = path.join(__dirname, '../flexMessages', fileName);
        const flexMessage = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return flexMessage;
    } catch (err) {
        console.error('Error loading Flex Message:', err.message);
        return null;
    }
};

// ฟังก์ชันส่ง Flex Message
const handleFlexMessage = (client, event, fileName) => {
    const flexMessage = getFlexMessage(fileName);

    if (!flexMessage) {
        console.error('Failed to load Flex Message');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'ขออภัย ไม่สามารถโหลดข้อความที่ต้องการได้ในขณะนี้',
        });
    }

    return client.replyMessage(event.replyToken, flexMessage);
};

module.exports = {
    getFlexMessage,
    handleFlexMessage,
};
