const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv').config();

const { handleQuickReply } = require('./functions/quickReply');
const { replyMessage } = require('./functions/replyMessage');
const { handleBookingStep } = require('./functions/bookingFlow');
const { getUserState } = require('./functions/userStateHandler');
const { handleFlexMessage } = require('./functions/flexMessageUtils');
const { checkCarAvailable } = require('./functions/checkCarService');
const { followStatusCars } = require('./functions/followStatusCars');

const env = dotenv.parsed;
const app = express();

const lineConfig = {
    channelAccessToken: env.LINE_ACCESS_TOKEN,
    channelSecret: env.LINE_SECRET_TOKEN
};

const client = new line.Client(lineConfig);

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        //console.log('event====>', events);

        return events.length > 0
            ? await Promise.all(events.map(item => handleEvent(item)))
            : res.status(200).send("OK");

    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
});

const handleEvent = async (event) => {
    const userId = event.source.userId;

    if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        console.log('=====================');
        console.log('user input ====> ', userMessage);
        console.log('=====================');

        const userState = getUserState(userId);
        if (userState && userState.step) {
            return handleBookingStep(event, client);
        }

        let response = await replyMessage(userMessage);

        if (response.type === "action") {
            if (response.action === "fetchAvailableCars") {
                return handleFlexMessage(client, event, 'checkCarData.json');
            }
            if (response.action === "handleBookingStep") {
                return handleBookingStep(event, client);
            }
            if (response.action === "followStatusCars") {
                const flexMsg = await followStatusCars(event);
                return client.replyMessage(event.replyToken, flexMsg);
            }
        }
        let quickReply = await handleQuickReply(response.text);
        console.log('📩 Quick Reply:', quickReply);
        if (quickReply) {
            response.quickReply = quickReply.quickReply;
        }

        await client.replyMessage(event.replyToken, response);
    }
    // ✅ ถ้าเป็น postback
    else if (event.type === 'postback') {
        console.log('=====================');
        console.log('📩 Postback Data : ', event.postback.data);
        console.log('📩 Postback : ', event.postback);
        console.log('=====================');
        const checkTypes = ['checkType=checkMotorcycle', 'checkType=checkCar', 'checkType=checkVan'];

        if (checkTypes.includes(event.postback.data)) {
            let carType;
            if (event.postback.data === 'checkType=checkMotorcycle') carType = 'motorcycle';
            else if (event.postback.data === 'checkType=checkCar') carType = 'car';
            else if (event.postback.data === 'checkType=checkVan') carType = 'van';

            if (carType) {
                const carFlexMessage = await checkCarAvailable(carType); // ✅ ใช้ await เพื่อตรวจสอบข้อมูล
                await client.replyMessage(event.replyToken, carFlexMessage); // ✅ ส่งกลับผลลัพธ์ Flex Message ให้ผู้ใช้
            }
        }
        else {
            return handleBookingStep(event, client)
        }
    }
    // ❌ ไม่รองรับ event อื่น
    else {
        console.log('❌ Unsupported event type:', event.type);
        return null;
    }
};


app.listen(4000, () => {
    console.log('🚀 listening on port:4000');
});
