async function handleQuickReply(responseText) {
    let message = null;

    switch (responseText) {
        case "ต้องการตรวจสอบรถว่าง หรือ จองรถ":
            message = {
                type: "text",
                text: "กรุณาเลือกตัวเลือก:",
                quickReply: {
                    items: [
                        {
                            type: "action",
                            action: { type: "message", label: "🔍 ตรวจสอบรถว่าง", text: "🔍" }
                        },
                        {
                            type: "action",
                            action: { type: "message", label: "🚗 จองรถ", text: "🚗" }
                        }
                    ]
                }
            };
            break;
        case "confirm":
            message = {
                type: "text",
                text: "โปรดเลือก:",
                quickReply: {
                    items: [
                        {
                            type: "action",
                            action: { type: "message", label: "✅ใช่", text: "ใช่" }
                        },
                        {
                            type: "action",
                            action: { type: "message", label: "❌ไม่", text: "ไม่" }
                        }
                    ]
                }
            };
            break;
        case "confirmBooking":
            message = {
                type: "text",
                text: "โปรดเลือก:",
                quickReply: {
                    items: [
                        {
                            type: "action",
                            action: { type: "message", label: "✅ยืนยัน", text: "ยืนยัน" }
                        },
                        {
                            type: "action",
                            action: { type: "message", label: "❌ยกเลิก", text: "ยกเลิก" }
                        }
                    ]
                }
            };
            break;
        default:
            break;
    }

    return message;
}

module.exports = { handleQuickReply };
