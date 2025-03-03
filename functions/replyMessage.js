async function replyMessage(userMessage) {
    let message;

    switch (userMessage) {
        case "ตรวจสอบรถว่างหรือจองรถ":
            message = {
                type: "text",
                text: "ต้องการตรวจสอบรถว่าง หรือ จองรถ"
            };
            break;
        case "ติดตามสถานะ":
            message = { type: "action", action: "followStatusCars" };
            break;
        case "🔍":
            message = { type: "action", action: "fetchAvailableCars" };
            break;
        case "🚗":
            message = { type: "action", action: "handleBookingStep" };
            break;
        case "สอบถามข้อมูลเพิ่มเติม":
            message = {
                type: "text",
                text: "ต้องการติดต่อฝ่ายบริการลูกค้าหรือไม่?",
                quickReply: {
                    items: [
                        {
                            type: "action",
                            action: {
                                type: "uri",
                                label: "📞 โทรหาเรา",
                                uri: "tel:0840019373"
                            }
                        }
                    ]
                }
            };
            break;
        default:
            message = {
                type: "text",
                text: "ขออภัย เราไม่เข้าใจคำสั่งของคุณ กรุณาเลือกจากเมนูอีกครั้ง"
            };
            break;
    }

    return message;
}

module.exports = { replyMessage };
