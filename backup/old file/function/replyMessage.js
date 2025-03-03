const { Client } = require('@line/bot-sdk');
const dotenv = require('dotenv').config();

const env = dotenv.parsed;

const client = new Client({
    channelAccessToken: env.LINE_ACCESS_TOKEN,
    channelSecret: env.LINE_SECRET_TOKEN
});

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
            message = {
                type: "text",
                text: "กรุณากรอกหมายเลขการจองของคุณ เพื่อดูสถานะ"
            };
            break;

        case "สอบถามข้อมูลเพิ่มเติม":
            message = {
                type: "text",
                text: "กรุณาพิมพ์คำถามของคุณ หรือโทร 123-456-7890 เพื่อติดต่อเจ้าหน้าที่"
            };
            break;
        case "🔍":
            message = {
                type: "text",
                text: "ตอนนี้รถที่ว่างอยู่คือ"
            };
            break;
        case "🚗":
            message = {
                type: "text",
                text: [
                    "ระบุวัน เดือน ปี ที่จะทำการจองรถตามตัวอย่างด้านล่างนี้",
                    "• DD/MM/YYYY (ปี พ.ศ.)",
                    "เช่น 10/10/2567"
                ].join("\n")
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
