const { Client } = require('@line/bot-sdk');
const dotenv = require('dotenv').config();

const env = dotenv.parsed;

const client = new Client({
    channelAccessToken: env.LINE_ACCESS_TOKEN,
    channelSecret: env.LINE_SECRET_TOKEN
});

async function handleQuickReply(responseText) {
    console.log("handleQuickReply received:", responseText); // Log เช็คค่าที่ได้รับ

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
                            action: {
                                type: "message",
                                label: "🔍 ตรวจสอบรถว่าง",
                                text: "🔍"
                            }
                        },
                        {
                            type: "action",
                            action: {
                                type: "message",
                                label: "🚗 จองรถ",
                                text: "🚗"
                            }
                        }
                    ]
                }
            };
            break;

        case "เลือกประเภทรถ":
            message = {
                type: "text",
                text: "กรุณาเลือกประเภทรถที่ต้องการ:",
                quickReply: {
                    items: [
                        {
                            type: "action",
                            action: {
                                type: "message",
                                label: "รถเก๋ง",
                                text: "รถเก๋ง"
                            }
                        },
                        {
                            type: "action",
                            action: {
                                type: "message",
                                label: "รถตู้",
                                text: "รถตู้"
                            }
                        },
                        {
                            type: "action",
                            action: {
                                type: "message",
                                label: "รถกระบะ",
                                text: "รถกระบะ"
                            }
                        }
                    ]
                }
            };
            break;
    }

    if (message) {
        console.log("Quick Reply generated:", JSON.stringify(message, null, 2)); // Log Quick Reply ที่จะส่งกลับ
        return message;
    } else {
        console.log("No matching Quick Reply case.");
        return null;
    }
}

module.exports = { handleQuickReply };
