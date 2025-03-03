const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv').config();

const { handleQuickReply } = require('./functions/quickReply');
const { replyMessage } = require('./functions/replyMessage');
const { handleBookingStep } = require('./functions/bookingFlow');
const { fetchAvailableCars } = require('./functions/fetchCarData');

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
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;
    console.log('=====================');
    console.log('user input ====> ', userMessage);
    console.log('=====================');

    let response = await replyMessage(userMessage);

    // 🔹 ตรวจสอบว่าต้องเรียก action พิเศษหรือไม่
    if (response.type === "action") {
        if (response.action === "fetchAvailableCars") {
            const flexMessage = await fetchAvailableCars();
            return client.replyMessage(event.replyToken, flexMessage);
        }
        if (response.action === "handleBookingStep") {
            return handleBookingStep(event, client);  // ✅ ส่ง event และ client เข้าไป
        }
    }

    console.log('=====================');
    console.log('response ====> ', response.text);
    console.log('=====================');

    let quickReply = await handleQuickReply(response.text);
    console.log('=====================');
    console.log('quickReply ====> ', quickReply);
    console.log('=====================');

    if (quickReply) {
        console.log("Adding Quick Reply to response:", quickReply);
        response.quickReply = quickReply.quickReply;
    } else {
        console.log("No Quick Reply for this response.");
    }

    await client.replyMessage(event.replyToken, response);
};


app.listen(4000, () => {
    console.log('listening on 4000');
});
