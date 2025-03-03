const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv').config();

const { handleQuickReply } = require('./function/quickReply.js');
const { replyMessage } = require('./function/replyMessage.js');

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
        console.log('event====>', events);

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

    // รับ response จาก replyMessage
    let response = await replyMessage(userMessage);

    // รับ Quick Reply จาก handleQuickReply
    const quickReply = await handleQuickReply(response.text);

    console.log("===============================");
    console.log("Received message:", userMessage);
    console.log("replyMessage response:", response.text);
    console.log("================================");


    if (quickReply) {
        console.log("Adding Quick Reply to response:", quickReply);
        response.quickReply = quickReply.quickReply;
    } else {
        console.log("No Quick Reply for this response.");
    };

    // ส่งข้อความตอบกลับพร้อม Quick Reply
    await client.replyMessage(event.replyToken, response);
};


app.listen(4000, () => {
    console.log('listening on 4000');
});
